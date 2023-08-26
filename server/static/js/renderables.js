class Graph{
    constructor(name,x,y,color,lineWidth=1,distribution=null){
        this.name=name;
        this.x=x;
        this.y=y;
        this.color=color;
        this.colorNegative=color; // not used by all graphs
        this.linearX=false;
        this.lineWidth=lineWidth;
        this.distribution=null;
        this.display=true;
        this.graphRenderMethod="line"; // also valid "Bar" for linear charts.
        this.meanY=0;
        this.parameters={};
        for(var Y of y) this.meanY+=Y;
        this.meanY/=y.length;
        this.parentPlot=null;
        this.normalizeY=null;
    }
    render(view,start=-1,end=-1,x=-1,dx=-1){
        var yT=[];

        ctx.beginPath();
        ctx.strokeStyle=this.color;
        ctx.fillStyle=this.color;
        ctx.lineWidth=this.lineWidth;
        var dy=0;
        if(this.normalizeY!=null)
            dy=this.normalizeY-yT[0];
        if(this.linearX){
            var i=start;
            if(i==-1){
                var i=Math.max(0,this.y.length+Math.floor(view.left)-5);
                end=Math.min(this.y.length,this.y.length+Math.ceil(view.right))
                while(i<end && this.y[i]==null) i++; //skip
                x=view.transformX(i-this.y.length);
                dx=1/view.dx;
            }
            yT.push(view.transformY(this.y[i]));
            if(this.graphRenderMethod == "line"){
                if(view.orientation=='yx')
                ctx.moveTo(yT[yT.length-1],x);
                else ctx.moveTo(x,yT[yT.length-1]);
                for(;i<end; i++){
                    x+=dx;
                    yT.push(view.transformY(this.y[i]));
                    if(view.orientation=='yx')
                    ctx.lineTo(yT[yT.length-1],x);
                    else ctx.lineTo(x,yT[yT.length-1]);
                }
                if(this.display) ctx.stroke();
            }else if(this.graphRenderMethod == "bar"){
                var y0=view.transformY(this.meanY);
                for(;i<end; i++){
                    yT.push(view.transformY(this.y[i]));
                    if(this.display) ctx.fillRect(x,yT[yT.length-1],dx,y0-yT[yT.length-1]);
                    x+=dx;
                }
            }
            else if (this.graphRenderMethod == "bricks"){
                var y0=view.transformY(this.y[i]);
                i=Math.max(1,i); // cus what color would it even be? makes no sense
                for(;i<end; i++){
                    yT.push(view.transformY(this.y[i]));
                    if(this.y[i]>this.y[i-1])
                        ctx.fillStyle=this.color
                    else
                        ctx.fillStyle=this.colorNegative
                    if(this.display) ctx.fillRect(x,yT[yT.length-1],dx,y0-yT[yT.length-1]);
                    y0=yT[yT.length-1];
                    x+=dx;
                }
            }
            // special rendering method for bricks that
            // are not allowed to be next to each other:
            else if (this.graphRenderMethod == "renga"){ 
                var y0=view.transformY(this.y[i]);
                var prevBottom=y0;
                var prevTop=y0;
                i=Math.max(1,i); // cus what color would it even be? makes no sense
                for(;i<end; i++){
                    yT.push(view.transformY(this.y[i]));
                    if(this.y[i]>this.y[i-1]){
                        ctx.fillStyle=this.color
                        y0=prevTop;
                        prevBottom=prevTop;
                        prevTop=yT[yT.length-1];
                    }
                    else{
                        ctx.fillStyle=this.colorNegative
                        y0=prevBottom;
                        prevTop=prevBottom;
                        prevBottom=yT[yT.length-1];
                    }
                    if(this.display) ctx.fillRect(x,yT[yT.length-1],dx,y0-yT[yT.length-1]);
                    y0=yT[yT.length-1];
                    x+=dx;
                }
            }
        }else{
            ctx.moveTo(view.transformX(this.x[0]),view.transformY(this.y[0]));
            for(let i=1;i<this.x.length;i++)
                ctx.lineTo(view.transformX(this.x[i]),view.transformY(this.y[i]));
            if(this.display) ctx.stroke();
        }

        if(this.distribution){
            ctx.beginPath();
            switch(this.distribution.renderMode){
                case "stick-y":
                    var mulX=view.dest.width*0.2;
                    ctx.moveTo(1+this.distribution.values[0].x*mulX,view.transformY(this.distribution.values[0].y));
                    for(let i=1;i<this.distribution.values.length;i++)
                        ctx.lineTo(1+this.distribution.values[i].x*mulX,view.transformY(this.distribution.values[i].y));
                    break;
            }
            ctx.lineWidth=2;
            ctx.stroke();
            ctx.globalAlpha=0.5;
            ctx.fillStyle=this.color;
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha=1;
        }

        return yT;
    }
    static createLinear(name,y,color,lineWidth=1,distribution=null){
        var graph=new Graph(name,[],y,color,lineWidth);
        graph.linearX=true;
        if(distribution){
            var renderMode=distribution;
            switch(distribution){
                case "stick-y":
                    distribution=[];
                    var max=Math.max(...y);
                    var min=Math.min(...y);
                    var nbins=40;
                    var binIncrement=(max-min)/(nbins-1);
                    var bins=[];
                    for(let i=0;i<nbins;i++) bins.push(0);
                    for(let i=0;i<y.length;i++){
                        for(let thresh=min; thresh<=max; thresh+=binIncrement){
                            if(y[i]<=thresh){
                                bins[Math.floor((thresh-min)/binIncrement)]++;
                                break;
                            }
                        }
                    }
                    var maxBin=bins[0];
                    for(let i=1;i<bins.length;i++) maxBin=Math.max(maxBin,bins[i]);
                    distribution.push({'x':0,'y':min-binIncrement})
                    for(let i=0;i<bins.length;i++){
                        distribution.push({'x':bins[i]/maxBin,'y':min+binIncrement*i});
                    }
                    distribution.push({'x':0,'y':max+binIncrement})
                    graph.distribution={'values':distribution,'renderMode':renderMode};
                    break;
            }
        }
        return graph;
    }
    toLinear(){
        return this.y;
    }

}
class GraphsCollection{
    constructor(name,graphs=[],regions=[]){
        this.name=name;
        this.graphs=graphs;
        this.regions=regions;
        this.transformedGraphs={};
        this.display=true;
        this.parameters={};
        this.parentPlot=null;
        this.normalizeY=null;
    }
    render(view){
        if(!this.display) return;
        var n=this.graphs[0].y.length
        var start=Math.max(0,n+Math.floor(view.left)-2);
        var end=Math.min(n,n+Math.ceil(view.right))
        while(start<end && this.graphs[0].y[start]==null) start++; //skip
        
        var x0=view.transformX(start-n);
        var dx=1/view.dx;

        for(let graph of this.graphs){
            var yT=graph.render(view,start,end,x0,dx);
            if(graph.name!="")
                this.transformedGraphs[graph.name]=yT;
        }
        ctx.globalAlpha = 0.1;
        
        for(let region of this.regions){
            var a=this.transformedGraphs[region[0]];
            var b=this.transformedGraphs[region[1]];
            var x=x0;
            var rememberB=[];
            var previousEntryAbove=a[0]>b[0];
            ctx.beginPath();
            ctx.moveTo(x,a[0]);
            for(let i=0;i<end-start+2; i++){
                var isAbove=a[i]>b[i];
                if(isAbove!=previousEntryAbove || i==end-start+1) {
                    previousEntryAbove=isAbove;
                    //find the intersection point
                    var intersection=1-(b[i-1]-a[i-1])/(a[i]-a[i-1]-b[i]+b[i-1])
                    if(i==end-start+1) intersection=1;
                    var intersectionX=x-intersection*dx;
                    var intersectionY=a[i]*(1-intersection)+a[i-1]*intersection;
                    ctx.lineTo(intersectionX,intersectionY);

                    for(var j=rememberB.length-1;j>=0;j--)
                        ctx.lineTo(x-(rememberB.length-j)*dx,rememberB[j]);
                    if(a[i-1]>b[i-1]) ctx.fillStyle='red';
                    else ctx.fillStyle='green';
                    ctx.fill();
                    rememberB=[];
                    ctx.beginPath();
                    ctx.moveTo(intersectionX,intersectionY);
                    ctx.lineTo(x,a[i]);
                }
                ctx.lineTo(x,a[i]);
                rememberB.push(b[i]);
                x+=dx;
            }
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle=theme['navbar-primary'];
    }
    push(graph){
        this.graphs.push(graph);
    }
    pushRegion(r){
        this.regions.push(r);
    }
}
class CandleChart{
    toLinear(){
        return this.data.Close;
    }
    constructor(name,data,color){
        this.name=name;
        this.data=data;
        this.color=color;
        this.n=Object.keys(this.data['Close']).length;
        this.display=true;
        this.parentPlot=null;
        this.normalizeY=null;
    }
    render(view){
        if(!this.display) return;
        ctx.fillStyle=this.color;
        var i=this.n+Math.floor(view.left)-1;
        const end=Math.min(this.n,this.n+Math.ceil(view.right))
        var x=view.transformX(i-this.n);
        var dx=1/view.dx;
        var dy=0;
        for(;i<end; i++){
            var high=view.transformY(this.data['High'][i])+dy;
            //if(high>canvas.height)continue; // not a big save since 99% of the candles are in view haha
            var low=view.transformY(this.data['Low'][i])+dy;
            //if(low<0)continue;
            var open=view.transformY(this.data['Open'][i])+dy;
            var close=view.transformY(this.data['Close'][i])+dy;
            ctx.fillRect(x,open,dx,close-open);
            ctx.fillRect(x+dx/2,high,1,low-high);
            if(this.data['Close'][i]<this.data['Open'][i]){
                ctx.fillStyle=theme.bg;
                ctx.fillRect(x+1,open+1,dx-2,close-open-2);
                ctx.fillStyle=this.color;
            }
            x+=dx;
        }
    }
    
}