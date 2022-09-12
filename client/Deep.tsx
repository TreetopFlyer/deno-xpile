import React from "react";
import { useMetas, useRoute, useFetch, Switch, Case } from "amber";

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

const Search = React.lazy(()=>import("./Search.tsx"));

export default ()=>
{
    const [routeGet] = useRoute();

    const folder = routeGet.Parts.length ? routeGet.Parts[0] : "";
    const status = useFetch("https://catfact.ninja/fact");

    const highlight =(inPath:string)=> folder == inPath ? "bg-green-500" : "bg-black";

    return <div className="p-2 border">
    <p className="p-4 border">current route: {folder}</p>
    <nav>
        <a className={`text-white p-2 ${highlight("")}`} href="/">Home</a>
        <a className={`text-white p-2 ${highlight("about")}`} href="/about">About</a>
        <a className={`text-white p-2 ${highlight("blog")}`} href="/blog">Blog</a>
        <a className={`text-white p-2 ${highlight("search")}`} href="/search">Search</a>
    </nav> 
    <div className="p-4 border border-red-500">
        <>
            {status.Data}
        </>
    </div>
        <Switch value={routeGet.Parts[0]}>
            <Case value={""}>
                <img src="static/Logo.svg" />
            </Case>
            <Case value={"blog"}>
                <PartBlog />
            </Case>
            <Case value={"about"}>
                <PartAbout />
            </Case>
            <Case value={"search"}>
                <React.Suspense fallback={<div>Loading Search Component</div>}>
                    <Search/>
                </React.Suspense>
            </Case>
            <Case>
                <p>404 i guess</p>
            </Case>
        </Switch>
    </div>
};
