class Graph{
    constructor(name,x,y,color,lineWidth=1){
        this.name=name;
        this.x=x;
        this.y=y;
        this.color=color;
        this.linearX=false;
        this.lineWidth=lineWidth;
    }
    render(){
        ctx.beginPath();
        ctx.strokeStyle=this.color;
        ctx.lineWidth=this.lineWidth;
        if(this.linearX){
            var i=Math.max(0,this.y.length+Math.floor(view.left)-1);
            const end=Math.min(this.y.length,this.y.length+Math.ceil(view.right))
            while(i<end && this.y[i]==null) i++; //skip
            var x=view.transformX(i-this.y.length);
            var dx=1/view.dx;
            ctx.moveTo(x,view.transformY(this.y[i]));
            for(;i<end; i++){
                x+=dx;
                ctx.lineTo(x,view.transformY(this.y[i]));
            }
        }else{
            ctx.moveTo(view.transformX(this.x[0]),view.transformY(this.y[0]));
            for(let i=1;i<this.x.length;i++)
                ctx.lineTo(view.transformX(this.x[i]),view.transformY(this.y[i]));
        }
        ctx.stroke();
    }
    static createLinear(name,y,color,lineWidth=1){
        var graph=new Graph(name,[],y,color,lineWidth);
        graph.linearX=true;
        return graph;
    }

}
class GraphsCollection{
    constructor(name,graphs=[]){
        this.name=name;
        this.graphs=graphs;
    }
    render(){
        for(let graph of this.graphs) graph.render();
    }
    push(graph){
        this.graphs.push(graph);
    }
}
class CandleChart{
    constructor(name,data,color){
        this.name=name;
        this.data=data;
        this.color=color;
        this.n=Object.keys(this.data['Close']).length;
    }
    render(){
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