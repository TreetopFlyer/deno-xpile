import React from "react";
import { useIsoMeta, useNavigation, useIsoData } from "./App.tsx";

export default ()=>
{
    const [, metaSet] = useIsoMeta();
    metaSet({title:"overide!!!"});

    const path = useNavigation();
    const highlight =(inPath:string)=> path.pathname == inPath ? "bg-red-500" : "bg-black";

    const fetchURL = "https://randomuser.me/api/?arg="+path.pathname;
    const profile = useIsoData(fetchURL);
    const getName =()=> 
    {
        const name = profile.json.results[0].name;
        return `(${name.title}) ${name.first} ${name.last}`;
    };

    return <div className="p-2 border">
        <nav>
            <a className={`text-white p-2 ${highlight("/")}`} href="/">Home</a>
            <a className={`text-white p-2 ${highlight("/about")}`} href="/about">About</a>
            <a className={`text-white p-2 ${highlight("/blog")}`} href="/blog">Blog</a>
        </nav> 
        <h3 className="font-xl">{fetchURL}</h3>
        <div>
            { profile.data && getName()}
        </div>
        { path.pathname == "/blog" && <div>
                { metaSet({title:"Blog Title"}) }
                <p>the blog</p>
        </div>}
        { path.pathname == "/about" && <div>
                { metaSet({title:"About Title"}) }
                <p>about page</p>
                <p>welcome.</p>
        </div>}
    </div>
}