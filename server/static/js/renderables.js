class Graph{
    constructor(name,x,y,color,lineWidth=1){
        this.name=name;
        this.x=x;
        this.y=y;
        this.color=color;
        this.linearX=false;
        this.lineWidth=lineWidth;
    }
    render(view,start=-1,end=-1,x=-1,dx=-1){
        var yT=[]
        ctx.beginPath();
        ctx.strokeStyle=this.color;
        ctx.lineWidth=this.lineWidth;
        if(this.linearX){
            var i=start;
            if(i==-1){
                var i=Math.max(0,this.y.length+Math.floor(view.left)-1);
                end=Math.min(this.y.length,this.y.length+Math.ceil(view.right))
                while(i<end && this.y[i]==null) i++; //skip
                x=view.transformX(i-this.y.length);
                dx=1/view.dx;
            }
            yT.push(view.transformY(this.y[i]));
            ctx.moveTo(x,yT[yT.length-1]);
            for(;i<end; i++){
                x+=dx;
                yT.push(view.transformY(this.y[i]));
                ctx.lineTo(x,yT[yT.length-1]);
            }
        }else{
            ctx.moveTo(view.transformX(this.x[0]),view.transformY(this.y[0]));
            for(let i=1;i<this.x.length;i++)
                ctx.lineTo(view.transformX(this.x[i]),view.transformY(this.y[i]));
        }
        ctx.stroke();
        return yT;
    }
    static createLinear(name,y,color,lineWidth=1){
        var graph=new Graph(name,[],y,color,lineWidth);
        graph.linearX=true;
        return graph;
    }

}
class GraphsCollection{
    constructor(name,graphs=[],regions=[]){
        this.name=name;
        this.graphs=graphs;
        this.regions=regions;
        this.transformedGraphs={};
    }
    render(view){
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
    constructor(name,data,color){
        this.name=name;
        this.data=data;
        this.color=color;
        this.n=Object.keys(this.data['Close']).length;
    }
    render(view){
        ctx.fillStyle=this.color;
        var i=this.n+Math.floor(view.left)-1;
        const end=Math.min(this.n,this.n+Math.ceil(view.right))
        var x=view.transformX(i-this.n);
        var dx=1/view.dx;
        for(;i<end; i++){
            var high=view.transformY(this.data['High'][i]);
            //if(high>canvas.height)continue; // not a big save since 99% of the candles are in view haha
            var low=view.transformY(this.data['Low'][i]);
            //if(low<0)continue;
            var open=view.transformY(this.data['Open'][i]);
            var close=view.transformY(this.data['Close'][i]);
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