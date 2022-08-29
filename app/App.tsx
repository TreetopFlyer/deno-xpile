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
export type PreloadTable = {
    meta: PreloadMetas,
    data:
    {
        [key:string]: string
    },
    path: string,
    fetch: (inURL:string)=>string|void,
    queue: Promise<string>[],
    client: boolean
};
export type PreloadInterface =
{
    data: (inURL:string)=>void
    meta: (inFields:PreloadMetas)=>void
};
export const PreloadObject:PreloadTable = {
    meta: {},
    data: {},
    path: "",
    fetch:(inURL)=>{},
    queue: [],
    client: true
};
export const PreloadMethods:PreloadInterface =
{
    data(inURL)
    {
        const check:string|undefined = PreloadObject.data[inURL];
        if(check)
        {
            return check;
        }
        else
        {
            PreloadObject.queue.push(
                fetch(inURL)
                .then(response=>response.json())
                .then(json=>PreloadObject.data[inURL] = json)
            );
        }
    },
    meta(inFields)
    {
        PreloadObject.meta = {...PreloadObject.meta, ...inFields}
    }
};
export const PreloadContext = React.createContext(PreloadMethods);
export const usePreload =()=> React.useContext(PreloadContext);

const App =({navigation, route, preload}:{ navigation?:Navigation, preload:PreloadTable, route:string })=>
{
    const routeBinding = React.useState(new URL("amber://"+route));

    React.useEffect(()=>
    {
        if(navigation)
        {
            const handler = (e:NavigationEvent) => e.transitionWhile( routeBinding[1](new URL(e.destination.url)) );
            navigation.addEventListener("navigate", handler);
            return ()=>navigation.removeEventListener("navigate", handler);
        } 
    }, []);


    const [getPre, setPre] = React.useState(preload.fetch("https://catfact.ninja/fact")??false);
    React.useEffect(()=>
    {
        if(preload?.client && !getPre)
        {
            console.log("on client. preloaded resource not found, fetching with browser.");
            fetch("https://catfact.ninja/fact")
            .then(response=>response.json())
            .then(json=>setPre(json));
        }

    }, []);

    preload.meta.title = getPre?.fact;

    const [countGet, countSet] = React.useState(3);
    return <NavigationContext.Provider value={routeBinding}>
        <PreloadContext.Provider value={PreloadMethods}>     
            <div>
                <h1 className="font-black text-slate-300">{getPre && getPre.fact}</h1>
                <h2>le app</h2>
                <button onClick={()=>countSet(countGet+1)}>{countGet}</button>
                <Deep/>
                <p><strong>deep check:</strong>{PreloadObject.meta.title}</p>
            </div>
        </PreloadContext.Provider>
    </NavigationContext.Provider>;
}


export default App;