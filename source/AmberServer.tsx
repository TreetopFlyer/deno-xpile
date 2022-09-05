import React from "react";
import ReactDOMServer from "react-dom/server";
import { serve } from "https://deno.land/std@0.144.0/http/server.ts";
import * as FS from "https://deno.land/std@0.144.0/fs/mod.ts";
import * as Twind from "https://esm.sh/twind";
import * as TwindServer from "https://esm.sh/twind/shim/server";
import { type State, PathParse, IsoProvider } from "./AmberClient.tsx";
import MIMELUT from "./mime.json" assert {type:"json"};
import twind from "../twind.ts";

const location = Deno.env.get("DENO_DIR") + "/gen/file/" + Deno.cwd().replace(":", "").replaceAll("\\", "/") + "/";

export default async({Themed, Source, Static, Client, Launch, Import, Deploy}:{Themed:string, Source:string, Static:string, Client:string, Launch:string, Import:string, Deploy:number})=>
{
    const dir = "file://"+Deno.cwd().replaceAll("\\", "/");

    const appImport = await import(dir+"/"+Client+Launch);
    const App:()=>JSX.Element = appImport.default;

    let twindImport = {
        default:{theme:{}, plugins:{}}
    };
    try
    {
        twindImport = await import(dir+"/"+Themed);
        console.log("twind configuration found");
    }
    catch(e)
    {
        console.log("no configuration found, using defaults");
    }
    

    const sheet = TwindServer.virtualSheet();
    const parse = Twind.create({ sheet: sheet, preflight: true, theme: twindImport.default?.theme??{}, plugins: twindImport.default?.plugins??{}, mode: "silent" }).tw;
    const leave = [ "__defineGetter__", "__defineSetter__", "__lookupGetter__", "__lookupSetter__", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "valueOf", "toLocaleString" ];
    for await (const filePath of FS.walk(location+Client, {exts:["tsx.js", "jsx.js", "ts.js"]}))
    {
        const fileText = await Deno.readTextFile(filePath.path);
        const m = fileText.match(/[^<>\[\]\(\)|&"'`\.\s]*[^<>\[\]\(\)|&"'`\.\s:]/g);
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
    const tailwind = TwindServer.getStyleTagProperties(sheet).textContent;

    serve(async (inRequest:Request) =>
    {
        const url = new URL(inRequest.url);
        const path = url.pathname.substring(1);
        if(path.startsWith(Static))
        {
            console.log("serving static file", path);
            try
            {
                const text = await Deno.open(path);
                const ext:string = path.substring(path.lastIndexOf(".")) ?? "";
                const type = (MIMELUT as {[key:string]:string})[ext] ?? "application/javascript";
                return new Response(text.readable, {status:200, headers:{"content-type": `${type}; charset=utf-8`}});
            }
            catch(e)
            {
                return new Response(e, {status:404, headers:{"content-type": "application/javascript; charset=utf-8"}});
            }
        }
        else if(path.startsWith(Client) || path.startsWith(Source))
        {
            const mappedPath = location+path+".js";
            console.log("serving code file", mappedPath);
            try
            {
                const text = await Deno.open(mappedPath);
                return new Response(text.readable, {status:200, headers:{"content-type": "application/javascript; charset=utf-8"}});
            }
            catch(e)
            {
                return new Response(e, {status:404, headers:{"content-type": "application/javascript; charset=utf-8"}});
            }
        }
        else
        {
            console.log("rendering page");
            const isoModel:State = {
                Meta:{},
                Data:{},
                Path:PathParse(url),
                Client:false,
                Queue:[]
            }
    
            let bake = ReactDOMServer.renderToString(<IsoProvider seed={isoModel}><App/></IsoProvider>);
            let count = 0;
            while(isoModel.Queue.length)
            {
                count ++;
                if(count > 5)
                {
                    break;
                }
                await Promise.all(isoModel.Queue);
                isoModel.Queue = [];
                bake = ReactDOMServer.renderToString(<IsoProvider seed={isoModel}><App/></IsoProvider>);
            }
    
    
            const page = await ReactDOMServer.renderToReadableStream(<html>
                <head>
                    <title>{isoModel.Meta.Title??""}</title>
                    <link rel="canonical" href={isoModel.Path.Parts.join("/")}></link>
                    <link rel="icon" type="image/x-icon" href="/static/favicon.ico"></link>
                    <meta name="viewport" content="width=device-width, initial-scale=1"/>
                    <meta name="description" content={isoModel.Meta.Description??""}/>
                    <style dangerouslySetInnerHTML={{__html:tailwind}}/>
                    <script type="importmap" dangerouslySetInnerHTML={{__html:Import}}/>
                </head>
                <body>
                    <div id="app" dangerouslySetInnerHTML={{__html:bake}}></div>
                    <script type="module" dangerouslySetInnerHTML={{__html:
            `import {createElement as h} from "react";
            import {hydrateRoot} from "react-dom/client";
            import App from "./${Client}${Launch}";
            import { IsoProvider } from "amber";
            
            const iso = ${JSON.stringify(isoModel)};
            iso.Client = true;
            
            hydrateRoot(
                document.querySelector("#app"),
                h(IsoProvider, {seed:iso},
                    h(App)
                )
            );
            `}}/>
                </body>
            </html>);
    
            return new Response(page, {status:200, headers:{"content-type": "text/html; charset=utf-8"}});
        }
    }
    , {port:Deploy});
};