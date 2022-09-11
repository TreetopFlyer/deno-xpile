import React from "react";
import Deep from "./Deep.tsx"; 

const dep = "DEPe"

export default ()=>
{
    const [countGet, countSet] = React.useState(2);
    console.log("app rerender!")

    return <div>
        <h2>le app! {dep}</h2>
        
        <div className="border-4 no-t">
            <button onClick={()=>countSet(countGet+1)}>{countGet}</button>
        </div>
        <Deep/>
    </div>;
};