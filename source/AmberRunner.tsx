import Server from "./AmberServer.tsx";

if(Deno.args[0] == "init")
{
 // scaffold
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
    
    Server(options);

}