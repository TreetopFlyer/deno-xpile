import React from "react";
import Blog from "./Blog.tsx";

//import("./Lazy.tsx").then(Lazy=>{console.log(Lazy);});
const OtherComponent = React.lazy(() => import('./Lazy.tsx'));

const App =()=>
{
    const [countGet, countSet] = React.useState(3);
    return <div>
        le app
        <button onClick={()=>countSet(countGet+1)}>{countGet}</button>
        <React.Suspense fallback={<p><strong>loading lazy.tsx</strong></p>}>
            <OtherComponent/>
        </React.Suspense>
        <Blog/>
    </div>;
}

export default App;