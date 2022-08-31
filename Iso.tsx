import React from "react";

type CacheRecord = { Data:false|string, Error:false|string, Expiry:number, Pending?:Promise<string> }
type KeyedMeta = {[key:string]:string};
type KeyedData = {[key:string]:CacheRecord};
type State = { Meta:KeyedMeta, Data:KeyedData, Path:string, Client:boolean, Queue:Array<Promise<string>> };
type Actions
    = {type: "MetaReplace", payload: KeyedMeta }
    | {type: "MetaMerge",   payload: KeyedMeta }
    | {type: "DataAdd",     payload: [string, RequestInit|undefined] }

const InitialState:State = {
    Meta:{},
    Data:{},
    Path:"/",
    Client:false,
    Queue:[]
};

const Reducer =(inState:State, inAction:Actions)=>
{
    switch(inAction.type)
    {
        case "MetaReplace" :
            return {...inState, Meta: inAction.payload};
        case "MetaMerge" :
            return {...inState, Meta: {...inState.Meta, ...inAction.payload}};
        case "DataAdd" :
        {
            const [key, options] = inAction.payload;
            const match:CacheRecord|undefined = inState.Data[key];
            if(match)
            {
                return inState;
            }
            else
            {
                const newRecord:CacheRecord = {
                    Data: false,
                    Error: false,
                    Expiry: 0,
                    Pending: fetch(key, options).then(res=>res.text())
                };
                return { ...inState, Data: {...inState.Data, [key]:newRecord} }
            }
        }

    }
}

const Context = React.createContext(null);
