import { serve } from "https://deno.land/std@0.114.0/http/server.ts";

function handler(_req: Request): Response {
  let timer: number | undefined = undefined;
  const body = new ReadableStream({
    start(controller)
    {
        let count = 0;
        controller.enqueue(new TextEncoder().encode(`<div style="padding: 10px; border: 1px solid red;">`));
        timer = setInterval( ()=>
        {
            count++;
            if(count<4)
            {
                controller.enqueue(new TextEncoder().encode(`</h3><h3>It is ${new Date().toISOString()}`));
            }
            else
            {
                controller.close();
            }

        }, 1000);
    },
    cancel()
    {
      if (timer !== undefined) {
        clearInterval(timer);
      }
    },
  });
  return new Response(body, {headers: {"content-type": "text/html",}});
}
console.log("Listening on http://localhost:8000");
serve(handler);