import React from "react";

const Thing = {
    get facts()
    {
        console.log("Facts Accessed");
        return {fact:"lol idk "+Math.random()}
    }
};

export default ()=>
{
    const [factGet, factSet] = React.useState(Thing.facts);
    const [readyGet, readySet] = React.useState(false);

    React.useEffect(async ()=>
    {
        let raw = await fetch(`https://catfact.ninja/fact`);
        let data = await raw.json();
        console.log("data?", data);
        factSet(data);
        readySet(true);
    }, []);

    return <div>
        <h3>le blog</h3>
        {
            !readyGet && <div>loading fact...{factGet.fact}</div>
        }
        {
            readyGet && <div className="font-black text-xl text-[#ffaa00] tracking-tight">{factGet.fact}</div>
        }
    </div>;
}