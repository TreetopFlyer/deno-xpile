
import * as FS from "https://deno.land/std@0.144.0/fs/mod.ts";

type CloneChecker = {path:string, found:boolean, text:false|string};

const baseDir = import.meta.url.split("/").slice(0, -2).join("/");

const checkFor =async(inPath:string, inContent?:string):Promise<CloneChecker>=>
{
    const output:CloneChecker = {path:inPath, found:false, text:false};
    try
    {
        await Deno.lstat(inPath);
        output.found = true;
    }
    catch(e)
    {
        if(inContent)
        {
            output.text = inContent;
        }
        else
        {
            const url = baseDir+"/"+inPath;
            console.log(inPath, "doesnt exist yet downloading from", url);
            const file = await fetch(url);
            output.text = await file.text();
        }

    }
    return output;
};

if(Deno.args[0] == "init")
{
    Promise.all([
        checkFor("client/App.tsx"),
        checkFor("client/Deep.tsx"),
        checkFor("static/Logo.svg"),
        checkFor("deno.json", `{
    "importMap": "./imports.json",
    "tasks":
    {
        "go": "deno run -A --config=deno.json --watch ${baseDir}/source/AmberRunner.tsx start"
    }
}
`),
        checkFor("imports.json"),
        checkFor("twind.ts"),
        checkFor(".vscode/settings.json")
    ]).then(values=>
    {

        console.log(baseDir);
        const encoder = new TextEncoder();
        values.forEach(async(checker)=>
        {
            if(!checker.found && checker.text)
            {
                console.log("wiritng file", checker.path);
                await FS.ensureFile(checker.path);
                Deno.writeFile(checker.path, encoder.encode(checker.text));
            }
        });
    });
}
else if(Deno.args[0] == "start")
{
    const options = {
        Themed: "twind.ts",
        Source: "source/",
        Static: "static/",
        Client: "client/",
        Launch: "App.tsx",
        Import: "imports.json",
        Deploy: 3333
    };
    for(let i=0; i<Deno.args.length; i++)
    {
        const arg = Deno.args[i];
        if(arg.startsWith("--"))
        {
            const [key, value] = arg.split("=");
                 if(key == "--source"){ options.Source = value; }
            else if(key == "--static"){ options.Static = value; }
            else if(key == "--client"){ options.Client = value; }
            else if(key == "--launch"){ options.Launch = value; }
            else if(key == "--import"){ options.Import = value; }
            else if(key == "--themed"){ options.Themed = value; }
            else if(key == "--deploy"){ options.Deploy = parseInt(value); }
        }
    }

    console.log(`Amber Start: Using "${options.Client}${options.Launch}" as the main app.`);

    try { options.Import = await Deno.readTextFile(options.Import); }
    catch(e) { console.log(`Amber Start: (ERROR) Import map "${options.Import}" not found`); }
    
    const amberServer = await import("./AmberServer.tsx");

    amberServer.default(options);

}