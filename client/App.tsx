import React from "react";
import Deep from "./Deep.tsx"; 

export default ()=>
{
    const [countGet, countSet] = React.useState(3);
    return <div>
        <h2>le app</h2>
        <div className="border-4 no-t">
            <button onClick={()=>countSet(countGet+1)}>{countGet}</button>
        </div>
        <Deep/>
    </div>;
};