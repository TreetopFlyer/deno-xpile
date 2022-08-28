import React from "react";

//import("./Lazy.tsx").then(Lazy=>{console.log(Lazy);});
const OtherComponent = React.lazy(() => import('./Lazy.tsx'));

const Delayed = React.lazy(async ()=>
{
    type me = {results:[{name:{first:string, last:string}}]};

    const raw = await fetch(`https://randomuser.me/api/`);
    const data:me = await raw.json();
    const name = data.results[0].name;

    console.log(name);

    return {
        default: ()=>{
            console.log("mini component rendered", name);
            return <ul>
                <li>a fact has loaded</li>
                <li>{name.first} {name.last}</li>
            </ul>;
        }
    };
})


export type NavigationEvent = { canTransition: boolean, destination:{url:string}, transitionWhile: ( arg:void )=>void };
export type NavigationBinding = (type:string, handler:(event:NavigationEvent)=>void)=>void;
export type Navigation = { addEventListener:NavigationBinding, removeEventListener:NavigationBinding };

export const RouteContext = React.createContext([new URL("https://default"), (inURL:URL)=>{}]);
export const useRoute =()=> React.useContext(RouteContext)[0];

const App =({navigation, route}:{ navigation?:Navigation, route:string })=>
{
    const routeBinding = React.useState(new URL("https://"+route));

    React.useEffect(()=>
    {
        if(navigation)
        {
            const handler = (e:NavigationEvent) => e.transitionWhile( routeBinding[1](new URL(e.destination.url)) );
            navigation.addEventListener("navigate", handler);
            return ()=>navigation.removeEventListener("navigate", handler);
        } 
    }, []);

    const [countGet, countSet] = React.useState(3);
    return <RouteContext.Provider value={routeBinding}><div>
        le app
        <button onClick={()=>countSet(countGet+1)}>{countGet}</button>
        <React.Suspense fallback={<p><strong>loading lazy.tsx</strong></p>}>
            <OtherComponent/>
        </React.Suspense>
        <hr/>
        <React.Suspense fallback={<p><em>that delayed thing is loading</em></p>}>
            <Delayed/>
        </React.Suspense>
    </div></RouteContext.Provider>;
}


export default App;