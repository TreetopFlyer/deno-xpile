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
export type PreloadEntry = {data:false|string, error:boolean|string, promise:false|Promise<PreloadEntry>}
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
export type PreloadInterface =
{
    data: (inURL:string)=>PreloadEntry
};
export const PreloadObject:PreloadTable = {
    meta: {},
    data: {},
    path: "",
    queue: [],
    client: true
};

export const PreloadMethods:PreloadInterface =
{
    data(inURL)
    {
        const slot:PreloadEntry|undefined = PreloadObject.data[inURL];
        if(slot)
        {
            return slot;
        }
        else
        {
            const newSlot = {data:false, error:false, promise:false} as PreloadEntry;
            PreloadObject.data[inURL] = newSlot;

            const loader = async (inURL:string, inSlot:PreloadEntry)=>
            {
                try
                {
                    const response = await fetch(inURL);
                    const text = await response.text();
                    response.status == 200 ? inSlot.data=text : inSlot.error=text;
                }
                catch(e){ inSlot.error = e;}

                newSlot.promise = false;
                return newSlot;
            };

            newSlot.promise = loader(inURL, newSlot);
            if(PreloadObject.client){ PreloadObject.queue.push(newSlot.promise); }

            return newSlot;
        }
    }
};

export const useIsoData =(inURL:string)=>
{
    const slot = PreloadMethods.data(inURL);
    const [getSlot, setSlot] = React.useState(slot);
    React.useEffect(()=>
    {
        if(slot.promise)
        {
            console.log(`resource is currently being fetched`);
            slot.promise.then(()=>setSlot(slot)).then(()=>console.log(`resource loaded`));
        }
        else
        {
            console.log(`preloaded found (${inURL}), switching states`);
            setSlot(slot);
        }

    }, [inURL]);

    return { data: getSlot.data, error: getSlot.error, json: getSlot.data ? JSON.parse(getSlot.data) : false };
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