const btnToggleVerticalFit=document.querySelector("#toggleVerticalFit");
function togglePython(sender){
    toggleSenderActive(sender);
    if(pythonEditor.style.display != "block"){
        pythonEditor.style.display = "block";
        canvas.style.left=pythonEditor.clientWidth+"px";
        canvas.width=window.innerWidth-pythonEditor.clientWidth;
    }else{
        pythonEditor.style.display = "none";
        canvas.style.left="0";
        canvas.width=window.innerWidth;
    }
    recalcViewDest();
    render();
}
function toggleVerticalFit(sender){
    toggleSenderActive(sender);
    view.fitVertical=!view.fitVertical;
    view.pan(0,0);
    render();
}
function toggleCursorLines(sender){
    toggleSenderActive(sender);
    displayCursorLines=!displayCursorLines;
    render();
}
function setMaxTimeScale(sender){
    for(r of renderables){
        if(!r instanceof CandleChart)continue
        view.fitData(r.data['Close'],r.n);
        render();
        break;
    }
}
function toggleFullscreen(sender){
    const element = document.documentElement;
    toggleSenderActive(sender);
    if (!document.fullscreenElement) {
        if (element.requestFullscreen) {
        element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen(); // Firefox
        } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen(); // Chrome, Safari, and Opera
        } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen(); // Internet Explorer and Edge
        }
    } else {
        if (document.exitFullscreen) {
        document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen(); // Firefox
        } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen(); // Chrome, Safari, and Opera
        } else if (document.msExitFullscreen) {
        document.msExitFullscreen(); // Internet Explorer and Edge
        }
    }
}
function toggleSenderActive(sender){
    if(sender.classList.contains('active')){
        sender.classList.remove('active');
    }else{
        sender.classList.add('active');
    }
}