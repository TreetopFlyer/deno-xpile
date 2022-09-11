import { assert, assertEquals } from "https://deno.land/std@0.155.0/testing/asserts.ts";

let waiting = false;
let interrupted = false;
let timer:undefined|number;
const timerDone = ()=>
{
    
    if(interrupted)
    {
        console.log("--timer done, but starting again", waiting, interrupted);
        startTimer();
    }
    else
    {
        waiting = false;
        interrupted = false;
        console.log("--timer done", waiting, interrupted);
    }
};
const startTimer =()=>
{
    console.log("--timer started", waiting, interrupted);
    waiting = true;
    interrupted = false;
    if(timer){clearTimeout(timer);}

    timer = setTimeout(timerDone, 5000);
}

const event =():boolean=>
{
    if(waiting)
    {
        interrupted = true;
        return true;
    }
    else
    {
        startTimer();
        return false;
    }
};

let delayTimer:undefined|number;
const doDelay =(inDelay:number)=>new Promise(accept=>
{
    if(delayTimer){ clearInterval(delayTimer); }
    setTimeout(()=>accept("done"), inDelay);
});


Deno.test("timer test?", async(test)=>
{

    let intr;
    await doDelay(50);
    intr = event();
    console.log("first event", intr);
    assertEquals(intr, false, "first event doesnt interrupt");

    await doDelay(1000);
    intr = event();
    console.log("next event", intr);
    assertEquals(intr, true, "next event does");

    await doDelay(1000);
    intr = event();
    console.log("repeat event", intr);
    assertEquals(intr, true, "repeat event does");

    await doDelay(8000);
    intr = event();
    console.log("late event", intr);
    assertEquals(intr, false, "late event does not");


    clearTimeout(timer);
    clearTimeout(delayTimer);

});
