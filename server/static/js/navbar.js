const btnToggleVerticalFit=document.querySelector("#toggleVerticalFit");
const btnTest=document.getElementById('toggle-test');
const btnPython=document.getElementById('toggle-python');
var testScript="", indicatorScript="";
function togglePython(sender){
    const display=!sender.classList.contains("active");
    var wasTest=setActive(btnTest,false);
    var wasPython=setActive(btnPython,false);
    setActive(sender,display);
    

    if(display){
        pythonEditor.style.display = "block";
        canvas.style.left=pythonEditor.clientWidth+"px";
        canvas.width=window.innerWidth-pythonEditor.clientWidth;
        if(wasTest)
        {
            testScript=pycode.value;
            pycode.value=indicatorScript;
        }
        else if(wasPython)
        {
            indicatorScript=pycode.value;
            pycode.value=testScript;
        }
        else{
            
            if(sender==btnPython)
                pycode.value=indicatorScript;
            else
                pycode.value=testScript;
        }
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
    activePlot.view.fitVertical=!activePlot.view.fitVertical;
    activePlot.view.pan(0,0);
    
    render();
}
function toggleCursorLines(sender){
    toggleSenderActive(sender);
    displayCursorLines=!displayCursorLines;
    render();
}
function setMaxTimeScale(sender){
    for(r of activePlot.renderables){
        if(!r instanceof CandleChart)continue
        activePlot.view.fitData(r.data['Close'],r.n);
        recalcNotchIntervalGrid();
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
    recalcViewDest();
    recalcNotchIntervalGrid();
}
function toggleSenderActive(sender){
    if(sender.classList.contains('active'))
        setActive(sender,false);
    else setActive(sender);
}
function setActive(sender,active=true){
    var temp=sender.classList.contains('active');
    if(active) sender.classList.add('active');
    else sender.classList.remove('active');
    return temp;
}