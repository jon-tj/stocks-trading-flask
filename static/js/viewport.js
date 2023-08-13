function remap(x, in_min, in_max, out_min, out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

class Viewport{
    constructor(width, height){
        this.width = width;
        this.height = height;
        this.x = 0;
        this.y = height-1;
        this.fitVertical=false;
        this.fitVerticalTarget=null;
    }
    transformX(x=0){ return remap(x, this.x-this.width, this.x+this.width, 0, canvas.width) }
    transformY(y=0){ return remap(y, this.y-this.height, this.y+this.height, canvas.height, 0) }
    revertX(x){ return remap(x, 0, canvas.width,  this.x-this.width, this.x+this.width) }
    revertY(y){ return remap(y, canvas.height, 0, this.y-this.height, this.y+this.height) }
    get dx(){ return this.width*2/canvas.width }
    get dy(){ return this.height*2/canvas.height }
    get left(){ return this.x-this.width }
    get right(){ return this.x+this.width }
    get top(){ return this.y+this.height }
    get bottom(){ return this.y-this.height }
    pan(dx, dy){
        this.x += dx;
        this.y += dy;
        if(this.fitVertical && this.fitVerticalTarget!=null){
            this.fitDataVertical(this.fitVerticalTarget);
        }
    }
    
    zoom(offset){
        var mulX=offset>0?1.1:1/1.1;
        var mulY=keys.Shift?1:mulX;
        
        var mx=this.revertX(mouse.position.x)
        var my=this.revertY(mouse.position.y)
        
        var dx=(mx-this.x)*(1-mulX)
        var dy=(my-this.y)*(1-mulY)
        this.pan(dx, dy); // zooms in on cursor

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
    fitDataVertical(data){
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

        this.height=(max-min)/2;
        this.height+=40*this.dy;
        this.y=(max+min)/2;
    }
}