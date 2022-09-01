import React from "react";
import Deep from "./Deep.tsx";
import { IsoProvider, InitialState } from "./Iso.tsx";

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
export type PreloadEntry = {data:false|string, error:boolean|string, expiry:number, pending:null|Promise<string>}
export type PreloadTable = {
    meta: PreloadMetas,
    data:
    {
        [key:string]: PreloadEntry
    },
    path: string,
    queue: Promise<string>[],
    client: boolean
};
export type PreloadInterface =
{
    data: (inURL:string)=>PreloadEntry
    meta: (inFields:PreloadMetas)=>void
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
            const newSlot = {data:false, error:false} as PreloadEntry;
            PreloadObject.data[inURL] = newSlot;

            if(!PreloadObject.client)
            {
                const loader = async (inURL:string, inSlot:PreloadEntry)=>
                {
                    try
                    {
                        const response = await fetch(inURL);
                        const text = await response.text();
                        response.status == 200 ? inSlot.data=text : inSlot.error=text;
                    }
                    catch(e){ inSlot.error = e; }
                };
                PreloadObject.queue.push(loader(inURL, newSlot));
            }
            return newSlot;
        }
    },
    meta(inFields)
    {
        PreloadObject.meta = {...PreloadObject.meta, ...inFields}
        if(PreloadObject.client)
        {
            document.title = PreloadObject.meta.title;
        }
    }
};
export const PreloadContext = React.createContext(PreloadMethods);
export const usePreload =()=> React.useContext(PreloadContext);

export const useIsoMeta =(keys:{[key:string]:string} | undefined)=>
{
    return [{...PreloadObject.meta}]
}

export const useIsoFetch =(inURL:string)=>
{
    const slot = PreloadMethods.data(inURL)
    const [getPre, setPre] = React.useState(slot.data);
    const [getErr, setErr] = React.useState(slot.error);
    React.useEffect(()=>
    {
        if(!slot.data && !slot.error)
        {
            console.log(`preloaded NOT found (${inURL}), fetching with browser.`);
            const loader = async (inURL:string)=>
            {
                try
                {
                    const response = await fetch(inURL);
                    const text = await response.text();
                    slot.data = text;
                    if(response.status == 200)
                    {
                        setPre(text);
                        slot.data = text;
                    }
                    else
                    {
                        setErr(text);
                        slot.error = text;
                    }
                }
                catch(e){ setErr(e); slot.error = e; }
            };
            console.log(`"client" loader called`)
            loader(inURL);
        }
        else
        {
            console.log(`preloaded found (${inURL}), switching states`);
            setErr(slot.error);
            setPre(slot.data)
        }

    }, [inURL]);

    return { data: getPre, dataUpdate: setPre, error: getErr, json: getPre ? JSON.parse(getPre) : false }
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


    const { data, error, json } = useIsoFetch("https://catfact.ninja/fact");

    const [countGet, countSet] = React.useState(3);
    return <NavigationContext.Provider value={routeBinding}>
        <PreloadContext.Provider value={PreloadMethods}> 
            <IsoProvider seed={InitialState}>
                <div>
                    <h1 className="font-black text-slate-300">
                        {data && json.fact}
                        {error && "sorry, there was an error getting cat facts"}
                    </h1>
                    <h2>le app</h2>
                    <button onClick={()=>countSet(countGet+1)}>{countGet}</button>
                    <Deep/>
                </div>
            </IsoProvider>
        </PreloadContext.Provider>
    </NavigationContext.Provider>;
}


export default App;