
const stroke = {
    "stroke": "3px",
    "stroke-half": "1.5px"
};
export default 
{
    theme:
    {
        extend:
        {
            fontFamily:
            {
                sans: ['Brandon', 'Century Gothic', 'sans-serif'],
                serif: ['Georgia']
            },
            spacing:{...stroke},
            borderWidth:{...stroke}
        }
    },
    plugins:
    {
        "no-t":{"border-top-color":"transparent"},
        "no-r":{"border-right-color":"transparent"},
        "no-b":{"border-bottom-color":"transparent"},
        "no-l":{"border-left-color":"transparent"}
    }
}