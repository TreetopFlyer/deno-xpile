import { serveTls } from "https://deno.land/std@0.144.0/http/server.ts";
import React from "react";

export type CacheRecord = { Data:false|string, Error:false|string, Expiry:number|false, Pending:boolean }
export type KeyedMeta = {[key:string]:string};
export type KeyedData = {[key:string]:CacheRecord};
export type State = { Meta:KeyedMeta, Data:KeyedData, Path:string, Client:boolean, Queue:Array<Promise<PayloadDataReplace>> };
export type PayloadDataReplace = [key:string, data:string|false, isError:boolean];
export type PayloadDataAdd = string|[key:string, expiry:number];
export type Actions
    = {type: "MetaReplace", payload: KeyedMeta }
    | {type: "MetaMerge",   payload: KeyedMeta }
    | {type: "DataReplace", payload: PayloadDataReplace }
    | {type: "DataAdd",     payload: PayloadDataAdd }

export type Binding = [State, React.Dispatch<Actions>];

export const InitialState:State = {
    Meta:{},
    Data:{},
    Path:"/initial-path",
    Client:false,
    Queue:[]
};

export const Reducer =(inState:State, inAction:Actions)=>
{
    let output = inState;
    switch(inAction.type)
    {
        case "MetaReplace" :
            output = {...inState, Meta: inAction.payload};
            break;
        case "MetaMerge" :
            output = {...inState, Meta: {...inState.Meta, ...inAction.payload}};
            break;
        case "DataAdd" :
        {
            let key:string, expiry:number|false;
            if(Array.isArray(inAction.payload))
            {
                key = inAction.payload[0];
                expiry = inAction.payload[1];
            }
            else
            {
                key = inAction.payload;
                expiry = false;
            }
            const match:CacheRecord|undefined = inState.Data[key];
            if(!match)
            {
                output =
                {
                    ...inState,
                    Data:
                    {
                        ...inState.Data,
                        [key]:
                        {
                            Data: false,
                            Error: false,
                            Expiry: expiry,
                            Pending: true
                        }
                    }
                };
            }
            break;
        }
        case "DataReplace" :
        {
            const [key, text, isError] = inAction.payload as [string, string, boolean];
            const match:CacheRecord|undefined = inState.Data[key];
            if(match)
            {
                const newRecord = isError ? { Pending: false, Error: text} : { Pending: false, Data: text };
                output =
                {
                    ...inState,
                    Data:
                    {
                        ...inState.Data,
                        [key]:
                        {
                            ...match,
                            ...newRecord
                        }
                    }
                };
            }
        }
    }
    //console.log(output);
    return output;
};

const Util = {
    Loader: async(inURL:string, inDispatcher:(inAction:Actions)=>void):Promise<PayloadDataReplace>=>
    {
        let error = false;
        let text:false|string = false;

        inDispatcher({type:"DataAdd", payload:inURL});
        try
        {
            const response = await fetch(inURL);
            text = await response.text();
            if(response.status !== 200)
            {
                throw text;
            }   
        }
        catch(e:unknown)
        {
            error = true;
        }

        const payload = [inURL, text, error] as PayloadDataReplace;
        inDispatcher({type:"DataReplace", payload:payload});
        return payload;
    }
};

export const IsoContext:React.Context<Binding> = React.createContext([InitialState, inAction=>{}]);
export const IsoProvider =({seed, children}:{seed:State, children:JSX.Element})=>
{
    const binding:Binding = seed.Client ? React.useReducer(Reducer, seed) : [seed, (inAction:Actions)=>
    {
        const clone = Reducer(seed, inAction);
        seed.Data = clone.Data;
        seed.Meta = clone.Meta;
        seed.Path = clone.Path;
    }];
    return <IsoContext.Provider value={binding}>{children}</IsoContext.Provider>;
};
export const useIso =()=>
{
    const [state, dispatch] = React.useContext(IsoContext);
    return {
        Client: state.Client,
        Metas:()=>{},
        Fetch:(url:string):CacheRecord=>
        {
            const match:CacheRecord|null = state.Data[url];
            if(!match)
            {
                const pending = Util.Loader(url, dispatch);
                if(!state.Client){ state.Queue.push(pending); }
                return { Data: false, Error: false, Expiry: 0, Pending: true };
            }
            else
            {
                return match;
            }
        }
    };
};