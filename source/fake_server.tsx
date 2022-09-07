import { serve } from "https://deno.land/std@0.144.0/http/server.ts";

serve(async (inRequest:Request) =>
{
    const url = new URL(inRequest.url);
    const path = url.pathname.substring(1);

    console.log(`request for ${inRequest.url}`);
    console.log(inRequest.headers);

    try
    {
        const text = await Deno.open(path);
        return new Response(text.readable,
        {
            status:200,
            headers:
            {
                "X-Backend-Server":"deno",
                "content-type": `application/${path.endsWith("json")?"json":"javascript"}; charset=utf-8`,
                "access-control-allow-origin":"*"
            }
        });
    }
    catch(e)
    {
        return new Response(e, {status:404, headers:{"content-type": "application/javascript; charset=utf-8"}});
    }

}
, {port:4444});
