import React from "react";
import { useIso } from "./Iso.tsx";

const PartBlog =()=>
{
    const { Fetch, Metas, Route } = useIso();
    const [metasGet, metasSet] = Metas();

    {metasSet({Title:"Blog!"})}
    return <div>
        <p>the blog</p>
    </div>;
}

export default ()=>
{
    const { Fetch, Metas, Route } = useIso();
    const [metasGet, metasSet] = Metas();
    const [routeGet, routeSet] = Route();

    const folder = routeGet.Parts?.length ? routeGet.Parts[0] : "";
    const status = Fetch("https://randomuser.me/api/?page="+folder);

    const highlight =(inPath:string)=> folder == inPath ? "bg-red-500" : "bg-black";

    return <div className="p-2 border">
        <p className="p-4 border">{folder}</p>
        <nav>
            <a className={`text-white p-2 ${highlight("")}`} href="/">Home</a>
            <a className={`text-white p-2 ${highlight("about")}`} href="/about">About</a>
            <a className={`text-white p-2 ${highlight("blog")}`} href="/blog">Blog</a>
        </nav> 
        <div className="p-4 border border-red-500">
            <>
                {status.Data}
            </>
        </div>
        { folder == "blog" && <PartBlog/>}
        { folder == "about" && <div>
            {metasSet({Title:"About!"})}
            <p>about page</p>
            <p>welcome.</p>
        </div>}
    </div>
}