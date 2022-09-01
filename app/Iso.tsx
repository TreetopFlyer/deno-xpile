import React from "react";

type CacheRecord = { Data:false|string, Error:false|string, Expiry:number, Pending?:Promise<string> }
type KeyedMeta = {[key:string]:string};
type KeyedData = {[key:string]:CacheRecord};
type State = { Meta:KeyedMeta, Data:KeyedData, Path:string, Client:boolean, Queue:Array<Promise<string>> };
type Actions
    = {type: "MetaReplace", payload: KeyedMeta }
    | {type: "MetaMerge",   payload: KeyedMeta }
    | {type: "DataAdd",     payload: [string, RequestInit|undefined] }

type Binding = [State, React.Dispatch<Actions>];

export const InitialState:State = {
    Meta:{},
    Data:{},
    Path:"/initial-path",
    Client:false,
    Queue:[]
};

const Reducer =(inState:State, inAction:Actions)=>
{
    console.log("Reducer called!");
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
            const [key, options] = inAction.payload;
            const match:CacheRecord|undefined = inState.Data[key];
            if(!match)
            {
                const newRecord:CacheRecord = {
                    Data: false,
                    Error: false,
                    Expiry: 0,
                    Pending: fetch(key, options).then(res=>res.text())
                };
                output = { ...inState, Data: {...inState.Data, [key]:newRecord} };
            }
        }

    }
    console.log(output);
    return output;
}

export const IsoContext:React.Context<Binding> = React.createContext([InitialState, inAction=>{}]);
export const IsoProvider =({seed, children}:{seed:State, children:JSX.Element})=>
{
    const binding:Binding = seed.Client ? React.useReducer(Reducer, seed) : [seed, (inAction:Actions)=>{seed = Reducer(seed, inAction)}];
    return <IsoContext.Provider value={binding}>{children}</IsoContext.Provider>;
};
export const useIso =()=> React.useContext(IsoContext);