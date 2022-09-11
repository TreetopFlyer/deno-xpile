import React from "react";
import ReactDOMServer from "react-dom/server";
import { serve } from "https://deno.land/std@0.144.0/http/server.ts";
import * as FS from "https://deno.land/std@0.144.0/fs/mod.ts";
import * as ESBuild from "https://deno.land/x/esbuild@v0.14.45/mod.js";
import * as Twind from "https://esm.sh/twind";
import * as TwindServer from "https://esm.sh/twind/shim/server";
import { type State, PathParse, IsoProvider } from "./AmberClient.tsx";
import MIMELUT from "./mime.json" assert {type:"json"};

const dir = Deno.cwd();
const resp404 = new Response("404", {status:404, headers:{"content-type": "application/javascript; charset=utf-8"}});
const FilesParse:{[key:string]:string} = {};
let socketRef:undefined|WebSocket;

const Rebuild =async(Themed:string, inFiles:Array<string>):Promise<string>=>
{
    let twindImport = { default:{theme:{}, plugins:{}} };
    const twindPath = `file://${dir}/${Themed}`;
    try
    {
        twindImport = await import(twindPath);
        console.log(`twind found at (${twindPath})`);
    }
    catch(e) { console.log(`no twind config found at (${twindPath}), using defaults.`); }
    const sheet = TwindServer.virtualSheet();
    const parse = Twind.create({ sheet: sheet, preflight: false, theme: twindImport.default?.theme??{}, plugins: twindImport.default?.plugins??{}, mode: "silent" }).tw;
    const leave = [ "__defineGetter__", "__defineSetter__", "__lookupGetter__", "__lookupSetter__", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "valueOf", "toLocaleString" ];
    
    for(let i=0; i<inFiles.length; i++)
    {
        const file = inFiles[i];
        try
        {
            const fileText = await Deno.readTextFile(file);
            const code:{code:string} = await ESBuild.transform(fileText, {loader:"tsx", /*sourcemap:"inline",*/ minify:true});
            FilesParse[file.replaceAll("\\", "/").substring(dir.length+1)] = code.code;
            const m = code.code.match(/[^<>\[\]\(\)|&"'`\.\s]*[^<>\[\]\(\)|&"'`\.\s:]/g);
            if (m)
            {
                for (const c of m)
                {
                    if (leave.indexOf(c) === -1)
                    {
                        try { parse(c); }
                        catch (e) { console.log(`Error: Failed to handle the pattern '${c}'`); }
                    }
                }
            }
            console.log(`transpiled ${file}.`);

            /*
            const command = ["deno", "cache", `${file}`];
            console.log("COMMAND:", command);
            const process = Deno.run({cmd:command});
            await process.status();
            */
        }
        catch(e){ console.log(`error transpiling ${file}`) }
    }

    console.log(Object.keys(FilesParse));
    return TwindServer.getStyleTagProperties(sheet).textContent.replaceAll("}.", `}
.`);
}

export default async({Themed, Source, Static, Client, Launch, Import, Deploy}:{Themed:string, Source:string, Static:string, Client:string, Launch:string, Import:string, Deploy:number})=>
{
    // open amber client *on the remote* and transpile it for the browser
    const parts = import.meta.url.split("/");
    parts[parts.length-1] = "AmberClient.tsx";
    const path = parts.join("/");
    const amberClientFetch = await fetch(path);
    const amberClientText = await amberClientFetch.text();
    const amberClientParsed = await ESBuild.transform(amberClientText, {loader:"tsx", sourcemap:"inline", minify:true});
    FilesParse["source/AmberClient.tsx"] = amberClientParsed.code;

    
    // After running `AmberClient.tsx init` the user's imports.json will have "amber" aliased to a remote URL.
    // That will help them with typings while workingin the IDE.
    // BUT after their instance starts and transpiles this remote file, we need to point to that instead so that means modifying the import map :(.
    // if the remote URL has a transpiled file, this step could be skipped....
    const importJSON = JSON.parse(Import);
    for( let key in importJSON.imports)
    {
        const value = importJSON.imports[key];
        console.log("at", key, "value is", value);
        if(value.indexOf("source/AmberClient.tsx") != -1)
        {
            importJSON.imports[key] = "./source/AmberClient.tsx";
            console.log("changing");
        }
    }
    Import = JSON.stringify(importJSON);
    console.log("result", Import);


    // load App and Shell
    let App = ()=>null;
    let Shell =({isoModel, styles, importMap, bake, clientFolder, launchFile}:{isoModel:State, styles:string, importMap:string, bake:string, clientFolder:string, launchFile:string})=>
    {
        return <html>
            <head>
                <title>{isoModel.Meta.Title??""}</title>
                <link rel="canonical" href={isoModel.Path.Parts.join("/")}></link>
                <link rel="icon" type="image/x-icon" href="/static/favicon.ico"></link>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <meta name="description" content={isoModel.Meta.Description??""}/>
                <style id="tw-main" dangerouslySetInnerHTML={{__html:styles}}/>
                <style id="tw-hmr"  dangerouslySetInnerHTML={{__html:FilesParse["client/rebuild.css"]??""}}/>
                
                <script type="importmap" dangerouslySetInnerHTML={{__html:importMap}}/>
            </head>
            <body>
                <div id="app" dangerouslySetInnerHTML={{__html:bake}}></div>
                <script type="module" dangerouslySetInnerHTML={{__html:
        `import {createElement as h} from "react";
        import {hydrateRoot} from "react-dom/client";
        import App from "./${clientFolder}${launchFile}";
        import { IsoProvider } from "amber";
        
        window.iso = ${JSON.stringify(isoModel)};
                    
        hydrateRoot(
            document.querySelector("#app"),
            h(IsoProvider, {seed:window.iso},
                h(App)
            )
        );

        const socket = new WebSocket('ws://localhost:3333/hmr');
        socket.addEventListener('message', (event) => {

            console.log('Message from server ', event.data);
            location.reload();
        });

        `}}/>
            <script id="reloader" type="module"></script>
            <form method="GET" action="?cache">
                <input type="hidden" name="cacher"/>
                <input type="submit"/>
            </form>
            </body>
        </html>;
    }

    const appPath = `file://${dir}/${Client+Launch}`;
    try
    {
        const appImport = await import(appPath);
        App = appImport.default;
        if(appImport.Shell)
        {
            Shell = appImport.Shell;
        }
    }
    catch(e) { console.log(e); console.log(`Launch file "${Launch}" cound not be found in Client directory "${appPath}".`); }


    const collectFiles:Array<string> = [];
    const collectSettings = {exts:["js", "jsx", "ts", "tsx"], includeDirs:false}
    try
    {
        for await (const filePath of FS.walk(dir+"/"+Client, collectSettings))
        {
            collectFiles.push(filePath.path);
        }
    }
    catch(e){ console.log("no client directory found. (its cool tho)"); }

    try
    {
        for await (const filePath of FS.walk(dir+"/"+Source, collectSettings))
        {
            collectFiles.push(filePath.path);
        }
    } catch(e){ console.log("no source directory found. (its cool tho)"); }

    console.log(collectFiles);

    FilesParse["client/tailwind.css"] = await Rebuild(Themed, collectFiles);

    serve(async (inRequest:Request) =>
    {
        const url = new URL(inRequest.url);
        const path = url.pathname.substring(1);
        if(path.startsWith(Static))
        {
            try
            {
                const text = await Deno.open(path);
                const ext:string = path.substring(path.lastIndexOf(".")) ?? "";
                const type = (MIMELUT as {[key:string]:string})[ext] ?? "application/javascript";
                return new Response(text.readable, {status:200, headers:{"content-type": `${type}; charset=utf-8`}});
            }
            catch(e)
            {
                return resp404;
            }
        }
        else if(path.startsWith(Client) || path.startsWith(Source))
        {
            const check:string|undefined = FilesParse[path];
            return check ? new Response(check, { status:200, headers: {
                "content-type": "application/javascript; charset=utf-8",
                "cache-control": "no-cache,no-store"
            } }) : resp404;
        }
        else if(path.startsWith("hmr"))
        {
            const upgrade = inRequest.headers.get("upgrade") || "";
            let response, socket: WebSocket;
            try {
              ({ response, socket } = Deno.upgradeWebSocket(inRequest));
            } catch {
              return new Response("request isn't trying to upgrade to websocket.");
            }

            socket.onopen = () => console.log("socket opened");
            socket.onmessage = (e) => {
              console.log("socket message:", e.data);
              socket.send(new Date().toString());
            };
            socket.onerror = (e) => console.log("socket errored:", e);
            socket.onclose = () => console.log("socket closed");

            socketRef = socket;

            return response;
        }
        else
        {
            const isoModel:State = { Meta:{}, Data:{}, Path:PathParse(url), Client:false, Queue:[] }
    
            let bake = ReactDOMServer.renderToString(<IsoProvider seed={isoModel}><App/></IsoProvider>);
            let count = 0;
            while(isoModel.Queue.length)
            {
                count ++;
                if(count > 5) { break; }
                await Promise.all(isoModel.Queue);
                isoModel.Queue = [];
                bake = ReactDOMServer.renderToString(<IsoProvider seed={isoModel}><App/></IsoProvider>);
            }
            
            isoModel.Client = true;
    
            const page = await ReactDOMServer.renderToReadableStream(<Shell isoModel={isoModel} styles={FilesParse["client/tailwind.css"]??""} importMap={Import} bake={bake} clientFolder={Client} launchFile={Launch} />);
            return new Response(page, {status:200, headers:{"content-type": "text/html; charset=utf-8"}});
        }
    }
    , {port:Deploy});

    console.log("Amber running on port", Deploy);


    let waiting = false;
    let interrupted = false;
    let timer:undefined|number;
    let filesChanged:Map<string, string> = new Map();
    const timerDone = ()=>
    {
        
        if(interrupted)
        {
            console.log("--timer done, but starting again", waiting, interrupted);
            startTimer();
        }
        else
        {
            waiting = false;
            interrupted = false;
            console.log("--timer done", waiting, interrupted);
            const list:string[] = [];
            for(const key of filesChanged.keys())
            {
                list.push(key)
            }
            filesChanged = new Map();
            console.log(list);
            Rebuild(Themed, list).then(css=>FilesParse["client/rebuild.css"] = css).then(()=>socketRef?.send("refresh"));
        }
    };
    const startTimer =()=>
    {
        console.log("--timer started", waiting, interrupted);
        waiting = true;
        interrupted = false;
        if(timer){clearTimeout(timer);}

        timer = setTimeout(timerDone, 500);
    }

    const registerChange =():boolean=>
    {
        if(waiting)
        {
            interrupted = true;
            return true;
        }
        else
        {
            startTimer();
            return false;
        }
    };

    const watcher = Deno.watchFs(Client);
    for await (const event of watcher)
    {
        event.paths.forEach(path => {
            console.log("path format check", path);
            filesChanged.set(path, event.kind);
        });
        
        registerChange();
    }
};