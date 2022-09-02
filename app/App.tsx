import React from "react";
import Deep from "./Deep.tsx";
import { State, IsoProvider, InitialState } from "./Iso.tsx";

export type NavigationEvent = { canTransition: boolean, destination:{url:string}, transitionWhile: ( arg:void )=>void };
export type NavigationBinding = (type:string, handler:(event:NavigationEvent)=>void)=>void;
export type Navigation = { addEventListener:NavigationBinding, removeEventListener:NavigationBinding };
export const NavigationContext = React.createContext([new URL("https://default"), (inURL:URL)=>{}]);
export const useNavigation =()=> React.useContext(NavigationContext)[0];


const App =({iso}:{iso?:State})=>
{
    const routeBinding = React.useState(new URL("https://amber"));
    React.useEffect(()=>
    {
        if(iso.Client && navigation)
        {
            const handler = (e:NavigationEvent) => e.transitionWhile( routeBinding[1](new URL(e.destination.url)) );
            navigation.addEventListener("navigate", handler);
            return ()=>navigation.removeEventListener("navigate", handler);
        } 
    }, []);

    const [countGet, countSet] = React.useState(3);
    return <NavigationContext.Provider value={routeBinding}>
        <IsoProvider seed={iso??InitialState}>
            <div>
                <h2>le app</h2>
                <button onClick={()=>countSet(countGet+1)}>{countGet}</button>
                <Deep/>
            </div>
        </IsoProvider>
    </NavigationContext.Provider>;
}


export default App;