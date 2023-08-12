class Graph{
    constructor(name,x,y,color){
        this.name=name;
        this.x=x;
        this.y=y;
        this.color=color;
    }
    render(){
        ctx.beginPath();
        ctx.moveTo(view.transformX(this.x[0]),view.transformY(this.y[0]));
        ctx.fillStyle=this.color;
        for(let i=1;i<this.x.length;i++){
            ctx.lineTo(view.transformX(this.x[i]),view.transformY(this.y[i]));
        }
        ctx.stroke();
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
        const end=this.n+Math.floor(view.right)
        var x=view.transformX(i-this.n);
        var dx=1/view.dx;
        for(;i<end; i++){
            x+=dx;
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
        }
    }
}