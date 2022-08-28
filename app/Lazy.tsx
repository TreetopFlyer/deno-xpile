import React from "react";
import { useRoute } from "./App.tsx";

export default ()=>
{
    let routeContext = useRoute();
    return <div>
        <h3>{routeContext.pathname}</h3>
        lazy has loaded!
    </div>;
};