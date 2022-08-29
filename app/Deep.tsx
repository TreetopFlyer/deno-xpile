import React from "react";
import { usePreload } from "./App.tsx";

export default ()=>
{
    const { data, meta } = usePreload();
    meta({title:"overide!!!"});

    return <div>
        <p>Deep!</p>
    </div>
}