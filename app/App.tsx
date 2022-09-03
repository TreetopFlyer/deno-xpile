import React from "react";
import Deep from "./Deep.tsx";
import { type State, IsoProvider, useIso } from "./Iso.tsx";

export type NavigationEvent = { canTransition: boolean, destination:{url:string}, transitionWhile: ( arg:void )=>void };
export type NavigationBinding = (type:string, handler:(event:NavigationEvent)=>void)=>void;
export type Navigation = { addEventListener:NavigationBinding, removeEventListener:NavigationBinding };

const Effects =()=>
{
    const { Metas, Route } = useIso();
    const [metasGet, metasSet] = Metas();
    const [routeGet, routeSet] = Route();

    React.useEffect(()=>
    {
        console.log("Metas Changed", metasGet.Title);
        document.title = metasGet.Title??"";
    }, [metasGet.Title]);
    
    React.useEffect(()=>
    {
        if(navigation)
        {
            const handler = (e:NavigationEvent) => e.transitionWhile( routeSet(new URL(e.destination.url)) );
            navigation.addEventListener("navigate", handler);
            return ()=>navigation.removeEventListener("navigate", handler);
        }
    }, []);

    return null;
};

const App =({iso}:{iso:State})=>
{
    const [countGet, countSet] = React.useState(3);
    return <IsoProvider seed={iso}>
            <Effects/>
            <h2>le app</h2>
            <button onClick={()=>countSet(countGet+1)}>{countGet}</button>
            <Deep/>
        </IsoProvider>;
}


export default App;