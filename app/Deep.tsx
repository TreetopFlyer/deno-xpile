import React from "react";
import { usePreload, useNavigation, useIsoFetch } from "./App.tsx";
import { useIso } from "./Iso.tsx";

export default ()=>
{
    const { meta } = usePreload();
    meta({title:"overide!!!"});

    const path = useNavigation();
    const highlight =(inPath:string)=> path.pathname == inPath ? "bg-red-500" : "bg-black";

    const { Fetch } = useIso();

    const status = Fetch("https://randomuser.me/api/?page="+path.pathname);

    return <div className="p-2 border">
        <nav>
            <a className={`text-white p-2 ${highlight("/")}`} href="/">Home</a>
            <a className={`text-white p-2 ${highlight("/about")}`} href="/about">About</a>
            <a className={`text-white p-2 ${highlight("/blog")}`} href="/blog">Blog</a>
        </nav> 
        <div className="p-4 border border-red-500">
            {status.Data}
        </div>
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