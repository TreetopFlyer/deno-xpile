import React from "react";

export type CacheRecord = { Data:false|string, Error:boolean, Expiry:number|false, Pending:boolean };
export type CacheQueue = Array<Promise<void>>;
export type KeyedMeta = {Title?:string, Description?:string, Image?:string, Icon?:string};
export type KeyedData = {[key:string]:CacheRecord};
export type Path = {
    Parts:Array<string>,
    Query:{[key:string]:string},
    Hash:string
};
export type State = { Meta:KeyedMeta, Data:KeyedData, Path:Path, Client:boolean, Queue:CacheQueue };
export type Actions
= {type: "MetaReplace", payload: KeyedMeta }
| {type: "DataReplace", payload: [key:string, value:CacheRecord] }
| {type: "PathReplace", payload: Path }

export type IsoBinding = [State, React.Dispatch<Actions>];

const InitialState:State = {
    Meta:{},
    Data:{},
    Path:{Parts:[""], Query:{}, Hash:""},
    Client:false,
    Queue:[]
};
const Reducer =(inState:State, inAction:Actions)=>
{
    let output = inState;
    switch(inAction.type)
    {
        case "PathReplace" :
            output = {...inState, Path:{...inState.Path, Parts:inAction.payload.Parts}};
            break;
        case "MetaReplace" :
            output = {...inState, Meta:inAction.payload};
            break;
        case "DataReplace" :
            output = { ...inState, Data: { ...inState.Data, [inAction.payload[0]]: inAction.payload[1] } };
    }
    console.log("at reducer", inAction, output);
    return output;
};

const Loader = async(inURL:string, inDispatcher:(inAction:Actions)=>void):Promise<void>=>
{
    let error = false;
    let text:false|string = false;
    inDispatcher({type:"DataReplace", payload:[inURL, { Data: false, Error: false, Expiry: 0, Pending: true }]});
    try
    {
        const response = await fetch(inURL);
        text = await response.text();
        if(response.status !== 200) { throw text; }   
    }
    catch(e:unknown){ error = true; }
    inDispatcher({type:"DataReplace", payload:[inURL, { Data: text, Error: error, Expiry: 0, Pending: true }]});
};

export const PathParse =(route:URL)=>
{
    const query:{[key:string]:string} = {};
    route.searchParams.forEach((value, key, obj)=>query[key] = value);
    return {
        Parts: route.pathname.substring(1).split("/"),
        Hash: route.hash.substring(1),
        Query: query 
    };
}

export const IsoContext:React.Context<IsoBinding> = React.createContext([InitialState, inAction=>{}]);
export const IsoProvider =({seed, children}:{seed:State, children:JSX.Element[]})=>
{
    const binding:IsoBinding = seed.Client ? React.useReducer(Reducer, seed) : [seed, (inAction:Actions)=>
    {
        const clone = Reducer(seed, inAction);
        seed.Data = clone.Data;
        seed.Meta = clone.Meta;
        seed.Path = clone.Path;
    }];
    return <IsoContext.Provider value={binding}>{children}</IsoContext.Provider>;
};

export const useRoute =():[path:Path, updater:(route:URL)=>void]=>
{   
    const [state, dispatch] = React.useContext(IsoContext);
    const setter = (inRoute:URL)=>
    {
        dispatch({type:"PathReplace", payload:PathParse(inRoute)});
        return null;
    }
    return [state.Path, setter];
};
export const useMetas =():[metas:KeyedMeta, updater:(metas:KeyedMeta)=>void]=>
{   
    const [state, dispatch] = React.useContext(IsoContext);
    const setter = (inMeta:KeyedMeta)=>
    {
        dispatch({type:"MetaReplace", payload: inMeta });
        return null;
    };
    return [state.Meta, setter];
};
export const useFetch =(url:string):CacheRecord=>
{
    const [state, dispatch] = React.useContext(IsoContext);
    const match:CacheRecord|null = state.Data[url];
    if(!match)
    {
        const pending = Loader(url, dispatch);
        if(!state.Client){ state.Queue.push(pending); }
        return { Data: false, Error: false, Expiry: 0, Pending: true };
    }
    else
    {
        return match;
    }
};