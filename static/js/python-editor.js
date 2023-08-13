const pythonEditor = document.querySelector("#python-editor");
const pycode= document.querySelector("#pycode");
const pyTerminal= document.querySelector("#terminal");
var activeScriptKey=null;

pycode.value=`"""
 @legend: SMA($ticker)
 @name: Simple Moving Average|SMA
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
    .then(response => response.json())
    .then(d =>{
        if(d.values.length<2){
            var err="No data to plot :/ Have you specified a ticker?"
            die(err); pyPrint(">"+err)
            return;
        }
        y=[]
        for(var i=0;i<d.values.length;i++) y.push(d.values[i])
        renderables.push(Graph.createLinear(d.legend,y,graphColors[renderables.length%graphColors.length]));
        render();
        pyPrint(">"+d.legend)
    });
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
    prompt(activeScriptKey,'delete')
}