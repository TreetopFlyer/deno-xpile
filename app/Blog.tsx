import React from "react";



export default ()=>
{
    const [factGet, factSet] = React.useState("default");
    const [loadingGet, loadingSet] = React.useState(false);

    React.useEffect(async ()=>
    {
        loadingSet(true);
        let raw = await fetch(`https://catfact.ninja/fact`);
        let data = await raw.json();
        console.log("data?", data);
        factSet(data);
        loadingSet(false);
    }, []);

    return <div>
        <h3>le blog</h3>
        {
            loadingGet && <div>loading fact...</div>
        }
        {
            !loadingGet && <div>{factGet.fact}</div>
        }
    </div>;
}