function remap(x, in_min, in_max, out_min, out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

class Viewport{
    constructor(srcw, srch,destinationRect){
        this.width = srcw;
        this.height = srch;
        this.x = 0;
        this.y = srch-1;
        this.dest=destinationRect;
        this.fitVertical=false;
        this.fitVerticalTarget=null;
    }
    transformX(x=0){ return remap(x, this.x-this.width, this.x+this.width, this.dest.x, this.dest.x+this.dest.width) }
    transformY(y=0){ return remap(y, this.y-this.height, this.y+this.height, this.dest.y+this.dest.height, this.dest.y) }
    revertX(x){ return remap(x, this.dest.x, this.dest.x+this.dest.width,  this.x-this.width, this.x+this.width) }
    revertY(y){ return remap(y, this.dest.y+this.dest.height, this.dest.y, this.y-this.height, this.y+this.height) }
    get dx(){ return this.width*2/this.dest.width }
    get dy(){ return this.height*2/this.dest.height }
    get left(){ return this.x-this.width }
    get right(){ return this.x+this.width }
    get top(){ return this.y+this.height }
    get bottom(){ return this.y-this.height }
    pan(dx, dy,moveY=true){
        this.x += dx;
        if(moveY)this.y += dy;
        if(this.fitVertical && this.fitVerticalTarget!=null){
            this.fitDataVertical(this.fitVerticalTarget);
        }
    }
    
    zoom(offset,moveY=true){
        var mulX=offset>0?1.1:1/1.1;
        var mulY=(keys.Shift || !moveY)?1:mulX;
        
        var mx=this.revertX(mouse.position.x)
        var my=this.revertY(mouse.position.y)
        
        var dx=(mx-this.x)*(1-mulX)
        var dy=(my-this.y)*(1-mulY)
        this.pan(dx, moveY?dy:0); // zooms in on cursor

        this.width*=mulX;
        this.height*=mulY;
    }
    fitData(data,w=90){
        const n=Object.keys(data).length;
        if(n<2) return;
        this.width=w/2;
        this.x=-this.width+4;
        var min=data[n-1];
        var max=data[n-1];

        for(var i=n-w;i<n;i++){
            if(data[i]<min) min=data[i];
            if(data[i]>max) max=data[i];
        }
        this.height=(max-min)/2;
        this.height+=40*this.dy;
        this.y=(max+min)/2;
    }
    fitDataVertical(data,test=false){
        const n=Object.keys(data).length;
        if(n<2) return;
        
        var i=n+Math.floor(this.left)-1;
        const end=Math.min(n,n+Math.floor(this.right))
        var min=data[i];
        var max=data[i];
        
        for(;i<end; i++){
            if(data[i]<min) min=data[i];
            if(data[i]>max) max=data[i];
        }
        if(test) return {min:min,max:max};
        this.height=(max-min)/2;
        this.height+=40*this.dy;
        this.y=(max+min)/2;
        recalcNotchIntervalGrid();
    }
    fitDataVerticalAll(obj){
        if(obj.length==0) return;
        var bounds=[]
        obj.forEach((o)=>bounds.push(this.fitDataVertical(o.toLinear(),true)));
        console.log(bounds);
        var max=bounds[0].max;
        bounds.forEach((o)=>max=Math.max(max,o.max))
        var min=bounds[0].min;
        bounds.forEach((o)=>min=Math.min(min,o.min))

        this.height=(max-min)/2;
        this.height+=40*this.dy;
        this.y=(max+min)/2;
        recalcNotchIntervalGrid();
    }
}