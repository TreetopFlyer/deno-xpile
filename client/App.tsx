import React from "react";
import Deep from "./Deep.tsx"; 

export default ()=>
{
    const [countGet, countSet] = React.useState(2);
    console.log("app rerender!");

    return <div>
        <div className="border-4 no-t">
            <button onClick={()=>countSet(countGet+1)}>{countGet}</button>
        </div>
        <Deep/>
    </div>;
};