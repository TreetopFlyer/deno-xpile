import React from "react";
import { useMetas, useRoute, useFetch } from "./Iso.tsx";

const PartBlog =()=>
{
    useMetas({Title:"Blog!"});

    return <div>
        <h3 className="text-xl font(black sans) p-4">Blog!</h3>
        <p>blog section</p>
    </div>;
};

const PartAbout =()=>
{
    useMetas({Title:"About!"});

    return <div>
        <h3 className="text-xl font(black sans) p-4">About!</h3>
        <p>about section</p>
    </div>;
};


export default ()=>
{
    const [routeGet] = useRoute();

    const folder = routeGet.Parts.length ? routeGet.Parts[0] : "";
    const status = useFetch("https://randomuser.me/api/?page="+folder);

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
        { folder == "about" && <PartAbout/>}
    </div>;
}