const imgTogglePython=document.querySelector('#toggle-python');
var activeTicker=null;
function cutoffResultText(text,cutoffLength=20){
    if(text.length>cutoffLength){
        return text.substring(0,cutoffLength)+"...";
    }
    return text;
}
const commands={
    'help':helpPrompt,
    'welcome':welcomePrompt,
}
search={
    input:document.querySelector('#search'),
    results:document.querySelector('#search-results'),
    onchange:(val)=>{
        var placeholders=[
            "/help",
            "Tesla",
            "AAPL",
            "Simple Moving Average",
            "EMA"
        ]
        search.input.placeholder=placeholders[Math.floor(Math.random()*placeholders.length)];
        //search.input.value="";
        //search.results.style.display="none";
        // click top result in results
        //search.results.children[0].click();
    },
    onkeyup:(val)=>{
        if(val.length<1){
            search.results.style.display="none";
            return;
        }
        search.results.innerHTML=""; // clear old results
        q=val.toLowerCase();
        var parameters=[];
        if(q.includes("(")){
            var parametersText=q.substring(q.indexOf("(")+1);
            if(parametersText.includes(")")) parametersText=parametersText.substring(0,parametersText.indexOf(")"));
            parameters=parametersText.split(",");
            q=q.substring(0,q.indexOf("("));
        }
        if(q[0]=="/"){
            q=q.substring(1);
            for(var command in commands){
                if(search.matchQuery(q,command)){
                    var li=document.createElement('li');
                    search.results.append(li);
                    li.classList.add('search-result');
                    li.innerHTML=`<p class='name'>/${command}</p>`;
                    const func=commands[command];
                    li.onclick=()=>{
                        func();
                        search.input.value="";
                        search.results.style.display="none";
                    }
                    if(search.results.children.length>=4)break;
                }
            }
            search.results.style.display="block";
            return;
        }
        for(var i in prefabsNames){
            const prefab=prefabsNames[i];
            var namesMatch=false;
            for(const n in prefab.names){
                if(search.matchQuery(q,prefab.names[n])){
                    namesMatch=true;
                    break;
                }
            }
            if(!namesMatch && !search.matchQuery(q,prefab.key)) continue;
            var li=document.createElement('li');
            search.results.append(li);
            li.classList.add('search-result');
            li.innerHTML=
                `<img class='market' src='/static/icons/python/python.png'> 
                <p class='name'>${cutoffResultText(prefab.names[0],24)}</p>`;
            li.onclick=()=>{
                loadScript(prefab.key,parameters);
                search.input.value="";
                search.results.style.display="none";
            }
            if(search.results.children.length>=4)break;
        }

        if(parameters.length==0)
        for(var t of tickers){
            if(search.results.children.length>=4)break;
            if(!search.matchQuery(q,t.symbol) && !search.matchQuery(q,t.name)) continue;
            var li=document.createElement('li');
            search.results.append(li);
            li.classList.add('search-result');
            li.innerHTML=
                `<img class='market' src='/static/icons/markets/${t['market']}.png'> 
                <p class='name'><strong>${t['symbol']}</strong> ${cutoffResultText(t['name']).toLowerCase()}</p>`;
            const ticker=t['symbol'];
            const market=t['market']=='.NYSE'?'':t['market'];
            li.onclick=()=>{
                loadTicker(ticker,ticker+market);
                search.input.value="";
                search.results.style.display="none";
            }
        }
        
        search.results.style.display="block";
    },
    matchQuery:(q,text)=>{
        text=text.toLowerCase();
        return text.includes(q);
    }
}

function loadTicker(name='EQNR',ticker='EQNR.OL'){
    fetch('/api/quotes/'+ticker)
    .then(res=>res.json())
    .then(d=>{
        activeTicker=ticker;
        activePlot.view.fitData(d['Close'])
        activePlot.view.fitVerticalTarget=d['Close']
        var r=new CandleChart(name,d,graphColors[activePlot.renderables.length%graphColors.length]);
        activePlot.renderables.push(r);
        render();
        hidePrompt();
        return r;
    });
}

function loadScript(key='sma',parameters){
    if(pythonEditor.style.display == "block" || activeTicker===null)
    {
        // we wish to see the code
        fetch('/api/prefabs/'+key)
        .then(res=>res.json()) // silly cast since res will just be a string but lazy
        .then(d=>{
            pycode.value=d;
            activeScriptKey=key;
            if(pythonEditor.style.display != "block")
            togglePython(imgTogglePython)
            hidePrompt(false);
        });
    }
    else
    {
        // we wish to run the code
        var parametersText="&parameters="+parameters.join(",");
        fetch('/api/prefabs/'+key+'?ticker='+activeTicker+parametersText)
        .then(response => response.text())
        .then(d =>{
            d=JSON.parse(d.replaceAll('NaN','null'))
            receiveGraphResponse(d);
            render();
            hidePrompt(false);
            pyPrint(">"+d.legend)
        });
    }
}
// idk why this try/catch doesn't work, any fetch errors will just seep through.
// same thing happens when doing fetch.catch()... but alas...
var tickers={}
var prefabsNames={}
try{
    fetch('/api/tickers')
    .then(res=>res.json())
    .then(d=>tickers=d)
    fetch('/api/prefabs')
    .then(res=>res.json())
    .then(d=>prefabsNames=d)
}
catch{
    die("Internal server error. Please try again later.")
}