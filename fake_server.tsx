
import { serve } from "https://deno.land/std@0.144.0/http/server.ts";

serve(async (inRequest:Request) =>
{
    const url = new URL(inRequest.url);
    const path = url.pathname.substring(1);
    console.log("serving static file", path);
    try
    {
        const text = await Deno.open(path);
        const ext:string = path.substring(path.lastIndexOf(".")) ?? "";
        return new Response(text.readable, {
            status:200,
            headers:
            {
                "content-type": `application/${path.endsWith(".json") ? "json" : "javascript"}; charset=utf-8`,
                "Access-Control-Allow-Origin": "*"
            }
        });
    }
    catch(e)
    {
        return new Response(e, {status:404, headers:{"content-type": "application/javascript; charset=utf-8"}});
    }
}
, {port:4444});