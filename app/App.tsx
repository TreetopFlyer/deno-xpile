import React from "react";
import Deep from "./Deep.tsx";

export type NavigationEvent = { canTransition: boolean, destination:{url:string}, transitionWhile: ( arg:void )=>void };
export type NavigationBinding = (type:string, handler:(event:NavigationEvent)=>void)=>void;
export type Navigation = { addEventListener:NavigationBinding, removeEventListener:NavigationBinding };
export const NavigationContext = React.createContext([new URL("https://default"), (inURL:URL)=>{}]);
export const useNavigation =()=> React.useContext(NavigationContext)[0];

export type PreloadMetas = {
    title?: string,
    description?: string,
    canonical?: string,
    image?: string
}
export type PreloadEntry = {
    data:false|string,
    error:boolean|string,
    promise:false|Promise<PreloadEntry>
}
export type PreloadTable = {
    meta: PreloadMetas,
    data:
    {
        [key:string]: PreloadEntry
    },
    path: string,
    queue: Promise<PreloadEntry>[],
    client: boolean
};

export const PreloadObject:PreloadTable = {
    meta: {},
    data: {},
    path: "",
    queue: [],
    client: true
};

export const useIsoData =(inURL:string)=>
{
    let slot:PreloadEntry|undefined = PreloadObject.data[inURL];
    if(!slot)
    {
        slot = {data:false, error:false, promise:false} as PreloadEntry;
        PreloadObject.data[inURL] = slot;

        const loader = async (inURL:string, inSlot:PreloadEntry)=>
        {
            try
            {
                const response = await fetch(inURL);
                const text = await response.text();
                response.status == 200 ? inSlot.data=text : inSlot.error=text;
            }
            catch(e){ inSlot.error = e;}

            inSlot.promise = false;
            return inSlot;
        };

        slot.promise = loader(inURL, slot);
        if(!PreloadObject.client){ PreloadObject.queue.push(slot.promise); }
    }
    const [slotGet, slotSet] = React.useState(slot);
    React.useEffect(()=>
    {
        if(slot)
        {
            if(slot.promise)
            {
                console.log(`resource is currently being fetched`);
                slot.promise.then(inSlot=>{slotSet(inSlot); console.log(`resource loaded`)});
            }
            else
            {
                console.log(`preloaded found (${inURL}), switching states`);
                slotSet(slot);
            }
        }

    }, [inURL]);

    return { data: slotGet.data, error: slotGet.error, json: slotGet.data ? JSON.parse(slotGet.data) : false };
};

export const useIsoMeta =():[PreloadMetas, (update:PreloadMetas)=>void]=>
{
    const clone = {...PreloadObject.meta};
    const update = (inReplacement:PreloadMetas)=>
    {
        PreloadObject.meta = {...PreloadObject.meta, ...inReplacement};
        if(PreloadObject.client){ document.title = PreloadObject.meta.title??""; }
    };
    return [clone, update];
};

const App =()=>
{
    const routeBinding = React.useState(new URL("https://amber"+PreloadObject.path));
    React.useEffect(()=>
    {
        if(PreloadObject.client && navigation)
        {
            const handler = (e:NavigationEvent) => e.transitionWhile( routeBinding[1](new URL(e.destination.url)) );
            navigation.addEventListener("navigate", handler);
            return ()=>navigation.removeEventListener("navigate", handler);
        } 
    }, []);


    const { data, error, json } = useIsoData("https://catfact.ninja/fact");

    const [countGet, countSet] = React.useState(3);
    return <NavigationContext.Provider value={routeBinding}>
            <div>
                <h1 className="font-black text-slate-300">
                    {data && json.fact}
                    {error && "sorry, there was an error getting cat facts"}
                </h1>
                <h2>le app</h2>
                <button onClick={()=>countSet(countGet+1)}>{countGet}</button>
                <Deep/>
            </div>
    </NavigationContext.Provider>;
};

export default App;