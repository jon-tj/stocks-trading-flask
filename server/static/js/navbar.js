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
            
            if(sender==btnTest) pycode.value=testScript;
            else pycode.value=indicatorScript;
        }
    }else{
        pythonEditor.style.display = "none";
        canvas.style.left="0";
        canvas.width=window.innerWidth;
        if(wasTest) testScript=pycode.value;
        else if(wasPython) indicatorScript=pycode.value;
    }
    recalcViewDest();
    render();
}
const broker={
    isConnected:false
}
function toggleNordnet(sender){
    promptBox.style.height="700px"
    prompt(null,"nordnet")
    var username="some-user"
    var password="abc123"
    if(!broker.isConnected){
        fetch("/api/nn/auth",
        {
            method: 'POST',
            body: JSON.stringify({}),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response=> response.json())
        .then(r=>{
            if(r.error){
                die(r.error);
                return;
            }
            broker.isConnected=true;
            var accList=document.querySelector('#accounts-list');
            accList.innerHTML="";
            var positions=nordnet.positions()
            console.log("received: "+positions)
            positions.forEach((p)=>{
                var li=document.createElement('li');
                accList.append(li);
                li.innerHTML=p;
            })
        });
    }
}
function toggleVerticalFit(sender){
    toggleSenderActive(sender);
    activePlot=findPlot("main");
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
        for(plot of plots)
        {
            plot.view.fitData(r.data['Close'],r.n,false);
        }
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