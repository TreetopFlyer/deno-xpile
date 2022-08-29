import React from "react";
import { usePreload, useNavigation } from "./App.tsx";

export default ()=>
{
    const { data, meta } = usePreload();
    meta({title:"overide!!!"});

    const path = useNavigation();

    const highlight =(inPath:string)=> path.pathname == inPath ? "bg-red-500" : "bg-black";

    return <div className="p-2 border">
        <nav>
            <a className={`text-white p-2 ${highlight("/")}`} href="/">Home</a>
            <a className={`text-white p-2 ${highlight("/about")}`} href="/about">About</a>
            <a className={`text-white p-2 ${highlight("/blog")}`} href="/blog">Blog</a>
        </nav> 
        { path.pathname == "/blog" && <div>
                { meta({title:"Blog Title"}) }
                <p>the blog</p>
        </div>}
        { path.pathname == "/about" && <div>
                { meta({title:"About Title"}) }
                <p>about page</p>
                <p>welcome.</p>
        </div>}
    </div>
}