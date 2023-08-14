const pythonEditor = document.querySelector("#python-editor");
const pycode= document.querySelector("#pycode");
const pyTerminal= document.querySelector("#terminal");
var activeScriptKey=null;

pycode.value=`"""
 @legend: SMA($ticker)
 @name: Simple Moving Average|SMA
 @description: Mean of rolling window
"""
def main(df):
    return df['Close'].rolling(window=5).mean()`;
pycode.addEventListener("keydown", (e) => {
    if(e.key=="Tab"){
        const cursorPosition = pycode.selectionStart; // Get cursor position
        const textBeforeCursor = pycode.value.substring(0, cursorPosition);
        const textAfterCursor = pycode.value.substring(cursorPosition);

        const newText = textBeforeCursor + '    ' + textAfterCursor; // Insert four spaces

        pycode.value = newText;

        // Update cursor position after inserting spaces
        const newCursorPosition = cursorPosition + 4;
        pycode.selectionStart = newCursorPosition;
        pycode.selectionEnd = newCursorPosition;
        e.preventDefault();
    }
    if(e.ctrlKey && e.key=="Enter"){
        runPython();
    }
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
function receiveGraphResponse(d){
    if(!Object.keys(d).includes('graphs') || d.graphs.length==0)
        die("No graphs in response");
    if(d.graphs.length==1){
        renderables.push(Graph.createLinear(
            d.legend,d.graphs[0].values,
            d.graphs[0].color?d.graphs[0].color:graphColors[renderables.length%graphColors.length],
            d.graphs[0].lineWidth?d.graphs[0].lineWidth:1));
    }
    else{
        var gc=new GraphsCollection(d.legend);
        for(var i=0;i<d.graphs.length;i++){
            if(d.graphs[i].values){
                gc.push(Graph.createLinear(
                    d.graphs[i].legend?d.graphs[i].legend:'',
                    d.graphs[i].values,
                    d.graphs[i].color?d.graphs[i].color:graphColors[i%graphColors.length],
                    d.graphs[i].lineWidth?d.graphs[i].lineWidth:1));
            }else{
                gc.pushRegion(d.graphs[i].fill_between)
            }
        }
        renderables.push(gc);
    }
}
function pyPrint(text){
    pyTerminal.value+=text+'\n';
}
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