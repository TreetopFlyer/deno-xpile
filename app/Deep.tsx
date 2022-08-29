import React from "react";
import { usePreload, useNavigation, useIsoFetch, TestCtx } from "./App.tsx";

export default ()=>
{
    const { meta } = usePreload();
    meta({title:"overide!!!"});

    const path = useNavigation();
    const highlight =(inPath:string)=> path.pathname == inPath ? "bg-red-500" : "bg-black";

    const testBinding = React.useContext(TestCtx);
    testBinding.test = "mutated!";

    const profile = useIsoFetch("https://randomuser.me/api/");
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
        <div>
            { profile.data && getName()}
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