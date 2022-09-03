import React from "react";
import Deep from "./Deep.tsx";
import { type State, IsoProvider, useMetas, useRoute, PathParse } from "./Iso.tsx";

export type NavigationEvent = { canTransition: boolean, destination:{url:string}, transitionWhile: ( arg:void )=>void };
export type NavigationBinding = (type:string, handler:(event:NavigationEvent)=>void)=>void;
export type Navigation = { addEventListener:NavigationBinding, removeEventListener:NavigationBinding };


const NavigationHandler = (e:NavigationEvent) => e.transitionWhile( useRoute(PathParse(new URL(e.destination.url))) );
const Effects =()=>
{
    const metasGet = useMetas();

    React.useEffect(()=>
    {
        document.title = metasGet.Title??"";
    }
    , [metasGet.Title]);
    
    React.useEffect(()=>
    {
        if(navigation)
        {
            navigation.addEventListener("navigate", NavigationHandler);
            return ()=>navigation.removeEventListener("navigate", NavigationHandler);
        }
    }, []);

    return null;
};

export default ({iso}:{iso:State})=>
{
    const [countGet, countSet] = React.useState(3);
    return <IsoProvider seed={iso}>
        <Effects/>
        <h2>le app</h2>
        <button onClick={()=>countSet(countGet+1)}>{countGet}</button>
        <Deep/>
    </IsoProvider>;
};