const pythonEditor = document.querySelector("#python-editor");
const pycode= document.querySelector("#pycode");
const pyTerminal= document.querySelector("#terminal");
var activeScriptKey=null;

pycode.value=indicatorScript=`"""
 @legend: SMA($ticker)
 @name: Simple Moving Average|SMA
 @description: Mean of rolling window
"""
def main(df):
    return df['Close'].rolling(window=5).mean()`;
pycode.addEventListener("keydown", (e) => {
    if(e.key=="Tab"){
        const cursorPosition = pycode.selectionStart; // Get cursor position
        const v = pycode.value;
        pycode.value = v.substring(0, cursorPosition) + '    ' + v.substring(cursorPosition);
        const newCursorPosition = cursorPosition + 4;
        pycode.selectionStart =pycode.selectionEnd= newCursorPosition;
        e.preventDefault();
    }
    if(e.ctrlKey && e.key=="Enter") runPython();
});

function runPython(){
    pyPrint("Running Python Script")
    fetch("/api/python",{
        method: 'POST',
        body: JSON.stringify(pycode.value),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.text())
    .then(d =>{
        d=JSON.parse(d.replaceAll('NaN','null'))
        receiveGraphResponse(d);
        render();
        pyPrint(">"+d.legend)
    });
}
function findOrCreatePlot(target){
    var plt=findPlot(target);
    if(!plt){
        // push new plot to bottom of screen, so every plot above needs y to be squished
        var newPlotHeight=0.2; //in screen height ratio
        plots.forEach((p)=>{
            p.dest.y*=1-newPlotHeight;
            p.dest.height*=1-newPlotHeight;
        });
        recalcViewDest();
        plt=new SubPlot({x:0,y:1-newPlotHeight,width:1,height:newPlotHeight},target);
        var mainPlot=findPlot("main");
        plt.view.x=mainPlot.view.x;
        plt.view.width=mainPlot.view.width;
        switch(target.split("(")[0]){
            case "0-100":
                plt.view.y=50;
                plt.view.height=50;
                plt.lockAxisY=true;
                break;
            case "0-1":
                plt.view.y=0.5;
                plt.view.height=0.5;
                plt.lockAxisY=true;
                break;
            default:
                plt.view.y=mainPlot.view.y;
                plt.view.height=mainPlot.view.height;
                break;
        }
        plots.push(plt);
    }
    return plt;
}
function receiveGraphResponse(d){
    // targets recognized: main, active, 0-100, 0-1. other targets will create a new plot with same viewport as main.
    var target=d.target;
    //console.log(d);
    if(target!="active") activePlot=findOrCreatePlot(target);
    if(!Object.keys(d).includes('graphs') || d.graphs.length==0){
        die("No graphs in response");
        return;
    }
    if(d.graphs.length==1){
        activePlot.renderables.push(Graph.createLinear(
            d.legend,d.graphs[0].values,
            d.graphs[0].color?d.graphs[0].color:graphColors[activePlot.renderables.length%graphColors.length],
            d.graphs[0].lineWidth?d.graphs[0].lineWidth:1));
    }
    else{
        //check if target is the same for all plots
        var sameTarget=true;
        target=d.graphs[0].target;
        for(var i=0;i<d.graphs.length;i++){
            if(d.graphs[i].target!=target){
                sameTarget=false;
                break;
            }
        }
        if(sameTarget){
            var gc=new GraphsCollection(d.legend);
            for(var i=0;i<d.graphs.length;i++){
                if(d.graphs[i].values){
                    gc.push(Graph.createLinear(
                        d.graphs[i].legend?d.graphs[i].legend:'',
                        d.graphs[i].values,
                        d.graphs[i].color?d.graphs[i].color:graphColors[i%graphColors.length],
                        d.graphs[i].lineWidth?d.graphs[i].lineWidth:1));
                }else gc.pushRegion(d.graphs[i].fill_between)
            }
            activePlot.renderables.push(gc);
        }else{
            var prevVals=[];
            d.graphs.forEach((g)=>{
                var g_target=g.target;
                if(!g_target) g_target='main';
                var plt=findOrCreatePlot(g_target);
                if(g.values){
                    prevVals=g.values;
                    plt.renderables.push(Graph.createLinear(
                        g.legend,g.values,
                        g.color?g.color:graphColors[plt.renderables.length%graphColors.length],
                        g.lineWidth?g.lineWidth:1));
                    if(!plt.lockAxisY) plt.view.fitDataVertical(g.values)
                }else{
                    Object.keys(g).forEach((k)=>{
                        switch(k){
                            case "fit-horizontal":
                                if(prevVals)
                                fitDataHorizontal(prevVals);
                                recalcNotchIntervalGrid();
                                break;
                        }
                    });
                }
            });
        }
    }
}
function pyPrint(text){ pyTerminal.value+=text+'\n' }
function saveScript(){
    fetch("/api/prefabs",
    {
        method: 'POST',
        body: JSON.stringify(pycode.value),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then((response)=>{
        if(response.ok){
            response.json().then((d)=>{
                prefabsNames=d;
            })
        }
        else die(d.message);
    });
}
function promptDeleteScript(){
    if(activeScriptKey)
        prompt(activeScriptKey,'delete')
}