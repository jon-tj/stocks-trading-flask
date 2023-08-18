
//#region Setup canvas event listeners
document.addEventListener("keydown",(e)=>{
    if(Object.keys(keys).includes(e.key)) keys[e.key]=true
    if(document.activeElement === pycode) return;
    if(document.activeElement === pyTerminal) return;
    if(document.activeElement === search.input){
        if(e.key=='Enter'){
            if(search.results.children.length==0) return;
            e.preventDefault();
            search.input.blur();
            search.input.value="";
            search.results.style.display="none";
            // click top result in results
            search.results.children[0].click();
        }
    }else{
        if(e.key=='Enter'){
            search.input.focus();
            e.preventDefault();
        }
    }
});
document.addEventListener("keyup",(e)=>{
    if(Object.keys(keys).includes(e.key)) keys[e.key]=false
});
canvas.addEventListener('wheel',(e)=>{ // Zooming
    setActivePlotToMouse();
    recalcNotchIntervalGrid();
    zoom(e.deltaY)
    render()
    return false; // prevents scrolling on the website
  }, false);
  
window.addEventListener("resize", (e)=>{
    canvas.width=window.innerWidth;
    canvas.height=window.innerHeight-navbar.clientHeight;
    recalcViewDest();
    render();
});
canvas.addEventListener("contextmenu",(e)=>e.preventDefault()) // no right click menu on canvas
canvas.addEventListener('mousedown',(e)=>{
    setActivePlotToMouse();
    mouse.click.button=e.button;
    mouse.click.x=e.offsetX;
    mouse.click.y=e.offsetY;
    search.results.style.display="none";
    hidePrompt();
    if(mouse.clickEvent) mouse.clickEvent();
})
canvas.addEventListener('mousemove',(e)=>{
    mouse.position.x=e.offsetX;
    mouse.position.y=e.offsetY;
    if(mouse.click.button==0){
        pan(
            -(e.offsetX-mouse.click.x),
            (e.offsetY-mouse.click.y)
        );
        mouse.click.x=e.offsetX;
        mouse.click.y=e.offsetY;
    }
    render();
})
canvas.addEventListener("mouseup",(e)=>{
    mouse.click.button=-1;
})
//#endregion
