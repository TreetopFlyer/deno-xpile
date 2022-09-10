import React from "react";
import ReactDOMServer from "react-dom/server";
import { serve } from "https://deno.land/std@0.144.0/http/server.ts";
import * as FS from "https://deno.land/std@0.144.0/fs/mod.ts";
import * as ESBuild from "https://deno.land/x/esbuild@v0.14.45/mod.js";
import * as Twind from "https://esm.sh/twind";
import * as TwindServer from "https://esm.sh/twind/shim/server";
import { type State, PathParse, IsoProvider } from "./AmberClient.tsx";
import MIMELUT from "./mime.json" assert {type:"json"};

export default async({Themed, Source, Static, Client, Launch, Import, Deploy}:{Themed:string, Source:string, Static:string, Client:string, Launch:string, Import:string, Deploy:number})=>
{
    const dir = Deno.cwd();
    const resp404 = new Response("404", {status:404, headers:{"content-type": "application/javascript; charset=utf-8"}});
    const FilesParse:{[key:string]:string} = {};

    // open amber client *on the remote* and transpile it for the browser
    const parts = import.meta.url.split("/");
    parts[parts.length-1] = "AmberClient.tsx";
    const path = parts.join("/");
    const amberClientFetch = await fetch(path);
    const amberClientText = await amberClientFetch.text();
    const amberClientParsed = await ESBuild.transform(amberClientText, {loader:"tsx", sourcemap:"inline", minify:true});
    FilesParse["source/AmberClient.tsx"] = amberClientParsed.code;

    // modify the supplied import map to point to the *remote* version of amber client instead of local
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
                <style dangerouslySetInnerHTML={{__html:styles}}/>
                <script type="importmap" dangerouslySetInnerHTML={{__html:importMap}}/>
            </head>
            <body>
                <div id="app" dangerouslySetInnerHTML={{__html:bake}}></div>
                <script type="module" dangerouslySetInnerHTML={{__html:
        `import {createElement as h} from "react";
        import {hydrateRoot} from "react-dom/client";
        import App from "./${clientFolder}${launchFile}";
        import { IsoProvider } from "amber";
        
        const iso = ${JSON.stringify(isoModel)};
    
        hydrateRoot(
            document.querySelector("#app"),
            h(IsoProvider, {seed:iso},
                h(App)
            )
        );
        `}}/>
            </body>
        </html>;
    }
    try
    {
        const appImport = await import(`file://${dir}/${Client+Launch}`);
        App = appImport.default;
        if(appImport.Shell)
        {
            Shell = appImport.Shell;
        }
    }
    catch(e) { console.log(`Launch file "${Launch}" cound not be found in Client directory "${Client}".`); }

    //
    let twindImport = { default:{theme:{}, plugins:{}} };
    try
    {
        twindImport = await import(`file://${dir}/${Themed}`);
    }
    catch(e) { console.log("no twind config found, using defaults."); }
    const sheet = TwindServer.virtualSheet();
    const parse = Twind.create({ sheet: sheet, preflight: true, theme: twindImport.default?.theme??{}, plugins: twindImport.default?.plugins??{}, mode: "silent" }).tw;
    const leave = [ "__defineGetter__", "__defineSetter__", "__lookupGetter__", "__lookupSetter__", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "valueOf", "toLocaleString" ];
    
    const xpile =async(inFolder:string):Promise<void>=>
    {
        console.log(`transpiling to memory everything in ${dir+"/"+inFolder}`);
        for await (const filePath of FS.walk(dir+"/"+inFolder, {exts:["js", "jsx", "ts", "tsx"]}))
        {
            try
            {
                const fileText = await Deno.readTextFile(filePath.path);
                const code:{code:string} = await ESBuild.transform(fileText, {loader:"tsx", /*sourcemap:"inline",*/ minify:true});
                FilesParse[filePath.path.replaceAll("\\", "/").substring(dir.length+1)] = code.code;
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
            }
            catch(e){ console.log(`error transpiling ${filePath.path}`) }
        }
    }

    try
    {
        await xpile(Client);
    }
    catch(e)
    {
        console.log(`No client directory "${Client}" found in "${dir}. No front-end code to work with!"`)
    }
    
    try
    {
        await xpile(Source);
        console.log(`Note you have a "source" directory "${Client}" in "${dir}. Are you working on Amber Core?"`)
    }
    catch(e)
    {
        console.log(`No "source" directory "${Source}" found in "${dir}. You are probably creating an Amber app, not working on Amber itself."`);
    }
    
    const tailwind = TwindServer.getStyleTagProperties(sheet).textContent;

    console.log("Transpiling/tailwind complete");

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
            return check ? new Response(check, { status:200, headers: { "content-type": "application/javascript; charset=utf-8" } }) : resp404;
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
    
            const page = await ReactDOMServer.renderToReadableStream(<Shell isoModel={isoModel} styles={tailwind} importMap={Import} bake={bake} clientFolder={Client} launchFile={Launch} />);
            return new Response(page, {status:200, headers:{"content-type": "text/html; charset=utf-8"}});
        }
    }
    , {port:Deploy});

    console.log("Amber running on port", Deploy);
};