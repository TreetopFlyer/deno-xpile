import Server from "./AmberServer.tsx";

if(Deno.args[0] == "init")
{
 // scaffold
}
else if(Deno.args[0] == "start")
{
    const options = {
        Themed: "twind.ts",
        Config: "deno.jsonc",
        Source: "source/",
        Static: "static/",
        Client: "client/",
        Launch: "App.tsx",
        Import: "",
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
            else if(key == "--config"){ options.Config = value; }
            else if(key == "--themed"){ options.Themed = value; }
            else if(key == "--deploy"){ options.Deploy = parseInt(value); }
        }
    }

    console.log(`Amber Start: Using "${options.Client}${options.Launch}" as the main app.`);

    try
    {
        let config;
        try
        {
           config = await Deno.readTextFile("./deno.jsonc");
        }
        catch(e)
        {
                 try { config = await Deno.readTextFile("./deno.json"); }
            catch(e) { console.log(`Amber Start: (ERROR) "deno.json" or "deno.jsonc" not found`); }
        }

        if(config)
        {
            config = JSON.parse(config);
            if(config.importMap)
            {
                try { options.Import = await Deno.readTextFile(config.importMap); }
                catch(e) { console.log(`Amber Start: (ERROR) Import map "${config.importMap}" not found`); }
            }
            else
            {
                console.log(`Amber Start: (ERROR) Deno config is missing an "importMap"`);
            }
        }

        Server(options);
    }
    catch(e){ console.log(e); }
}