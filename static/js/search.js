function cutoffResultText(text,cutoffLength=20){
    if(text.length>cutoffLength){
        return text.substring(0,cutoffLength)+"...";
    }
    return text;
}
search={
    input:document.querySelector('#search'),
    results:document.querySelector('#search-results'),
    onchange:(val)=>{
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
        for(var t of tickers){
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
                console.log(ticker+market)
                loadTicker(ticker,ticker+market);
                search.input.value="";
                search.results.style.display="none";
            }
            if(search.results.children.length>=4)break;
        }
        search.results.style.display="block";
    },
    matchQuery:(q,text)=>{
        text=text.toLowerCase();
        return text.includes(q);
    }
}

function loadTicker(ticker='EQNR'){
    fetch('/api/quotes/'+ticker)
    .then(res=>res.json())
    .then(d=>{
        view.fitData(d['Close'])
        var r=new CandleChart(ticker,d,graphColors[renderables.length%graphColors.length]);
        renderables.push(r);
        render();
        return r;
    });
}

// idk why this try/catch doesn't work, any fetch errors will just seep through.
// same thing happens when doing fetch.catch()... but alas...
var tickers={}
try{
    fetch('/api/tickers')
    .then(res=>res.json())
    .then(d=>tickers=d)
}
catch{
    die("Internal server error. Please try again later.")
}