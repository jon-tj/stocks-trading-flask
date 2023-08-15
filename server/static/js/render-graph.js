// contains most of the logic for rendering
class SubPlot{
    constructor(destinationRect,name="main"){
        this.name=name;
        this.view=new Viewport(30,20,destinationRect);
        this.dest=destinationRect;
        this.renderables=[];

        this.notchIntervalGridX=1;
        this.notchIntervalGridY=1;
        this.recalcViewDest();
        this.recalcNotchIntervalGrid();
        this.lockAxisY=false;
    }
    recalcNotchIntervalGrid(){
        this.notchIntervalGridX=getNotchInterval(this.view.x-this.view.width,this.view.x+this.view.width,this.view.dest.width*0.5)
        this.notchIntervalGridY=getNotchInterval(this.view.y-this.view.height,this.view.y+this.view.height,this.view.dest.height)
    }
    recalcViewDest(){
        this.view.dest={
            x:this.dest.x*canvas.width,
            y:this.dest.y*canvas.height,
            width:this.dest.width*canvas.width,
            height:this.dest.height*canvas.height
        }
    }
    render(){
        // border the plot:
        ctx.strokeStyle = theme['navbar-secondary'];
        ctx.lineWidth = 1;
        ctx.strokeRect(this.view.dest.x, this.view.dest.y, this.view.dest.width, this.view.dest.height);

        // dont draw outside of the plot dest rect:
        ctx.save();
        ctx.beginPath();
        ctx.rect(this.view.dest.x, this.view.dest.y, this.view.dest.width, this.view.dest.height);
        ctx.clip();
        this.drawGrid();
        
        if(displayCursorLines){
            ctx.strokeStyle=theme['axes'];
            ctx.fillStyle=theme['axes'];
            ctx.beginPath();
            ctx.moveTo(mouse.position.x,0);
            ctx.lineTo(mouse.position.x,canvas.height);
            ctx.moveTo(0,mouse.position.y);
            ctx.lineTo(canvas.width,mouse.position.y);
            ctx.stroke();
            var places=Math.max(0,3-Math.log10(this.view.width));
            var y_cursor=this.view.revertY(mouse.position.y);
            ctx.fillText(y_cursor.toFixed(places),this.view.dest.x+7,mouse.position.y-7);
            var x_cursor=this.view.revertX(mouse.position.x);
            ctx.fillText(x_cursor.toFixed(places),mouse.position.x+7,this.view.dest.y+this.view.dest.height-8);
        }
    
        // renderables
        var legendY=40+this.view.dest.y;
        this.renderables.forEach((r)=>{
            r.render(this.view);
            if(r.name){
                ctx.font="bold 12pt Arial";
                ctx.fillStyle=r.color;
                ctx.fillText(r.name,this.view.dest.x+20,legendY)
                legendY+=20;
            }
        })
        ctx.restore();
    }

    drawGrid(){ // in a seperate function because its a behemoth
        ctx.lineWidth=1

        // values of x,y the grid lines will pass through:
        var notchesX = getAxisNotches(this.view.x-this.view.width,this.view.x+this.view.width,this.notchIntervalGridX)
        var notchesY = getAxisNotches(this.view.y-this.view.height,this.view.y+this.view.height,this.notchIntervalGridY)

        // notches
        var places=Math.max(0,2-Math.log10(this.view.width));
        ctx.font="10pt Arial";
        ctx.strokeStyle=theme['grid']
        ctx.fillStyle=theme['axes']
        notchesX.forEach((x)=>{
            ctx.beginPath()
            var xT=this.view.transformX(x)
            ctx.moveTo(xT,this.view.dest.y) ; ctx.lineTo(xT,this.view.dest.y+this.view.dest.height)
            ctx.stroke()
            ctx.fillText(x.toFixed(places),xT-8,this.view.dest.y+18)
        })
        
        places=Math.max(0,2-Math.log10(this.view.height));
        notchesY.forEach((y)=>{
            if(y<0)return;
            ctx.beginPath()
            var yT=this.view.transformY(y)
            ctx.moveTo(this.view.dest.x,yT) ; ctx.lineTo(this.view.dest.x+this.view.dest.width,yT)
            ctx.stroke()
            var yText=y.toFixed(places)
            var stringWidth=ctx.measureText(yText).width
            ctx.fillText(yText,this.view.dest.x+this.view.dest.width-10-stringWidth,yT+5)
        })
    }
}

//#region html elements
const canvas=document.querySelector('canvas');
const navbar=document.querySelector('#navbar');
canvas.width=window.innerWidth;
canvas.height=window.innerHeight-navbar.clientHeight;
const ctx=canvas.getContext('2d');
//#endregion

//#region declare rendering variables
plots=[new SubPlot({x:0,y:0,width:1,height:1})];
activePlot=plots[0];
const mouse={
    position:{x:0,y:0},
    click:{button:-1,x:0,y:0,dragDist:0},
    momentum:{x:0,y:0},
    clickTime:Date.now(),
}
const keys={"Shift":false,"Control":false}
var displayCursorLines=false;
//#endregion
function findPlot(name="main"){
    return plots.find((p)=>{
        if(p.name==name) return p;
    })
}
function setActivePlotToMouse(){
    var mouseX=mouse.position.x/canvas.width;
    var mouseY=mouse.position.y/canvas.height;
    plots.forEach((p)=>{
        if(rectContains(p.dest,{x:mouseX,y:mouseY})){
            activePlot=p;
            return;
        }
    })
}
function rectContains(rect,point){
    return point.x>=rect.x && point.x<=rect.x+rect.width && point.y>=rect.y && point.y<=rect.y+rect.height;
}

//#region load theme from css
const themeProperties=[
    "bg",
    "axes", "grid",
    "navbar-primary",
    "navbar-secondary",
];
const graphColors=[
    "#3498db", // Bright Blue
    "#2ecc71", // Emerald Green
    "#f39c12", // Sunflower Yellow
    "#e74c3c", // Crimson Red
    "#9b59b6", // Amethyst Purple
    "#27ae60", // Nephritis Green
    "#e67e22", // Carrot Orange
    "#e84393", // Wild Watermelon Pink
    "#2980b9", // Dark Blue
    "#d35400"  // Pumpkin Orange
];
function getTheme(){
    var style=window.getComputedStyle(canvas);
    var theme={}
    themeProperties.forEach((p)=>{
        theme[p]=style.getPropertyValue('--'+p);
    })
    return theme;
}
var theme=getTheme();
//#endregion

//#region do stuff with all subplots
function render(){
    // clear canvas
    ctx.fillStyle=theme['bg'];
    ctx.fillRect(0,0,canvas.width,canvas.height);

    //subplots
    plots.forEach((p)=>{
        p.render();
    })
}
function zoom(dy){
    plots.forEach((p)=>{
        p.view.zoom(dy,p==activePlot && !p.lockAxisY);
    });
}
function recalcViewDest(){
    plots.forEach((p)=>{
        p.recalcViewDest();
    })
}
function pan(dx,dy){
    plots.forEach((p)=>{
        p.view.pan(dx*p.view.dx,dy*p.view.dy,p==activePlot && !p.lockAxisY);
    });
}
function fitDataHorizontal(data){
    plots.forEach((p)=>{
        p.view.width=data.length/2;
        p.view.x=-p.view.width+4;
    })
}
function recalcNotchIntervalGrid(){
    plots.forEach((p)=>{
        p.recalcNotchIntervalGrid();
    })
}
//#endregion

//#region render grid helper functions
function clamp(x,min,max){
    if(x<min)return min
    if(x>max)return max
    return x
}
function getNotchInterval(from,to,preferredAmount){
    var range=Math.abs(to-from)
    var optimalInterval=100*range/(preferredAmount/50)
    var interval=0.01
    function iterFindNotch(){
        if(optimalInterval<1) return true
        if(optimalInterval<2){
        interval*=2
        return true
        }
        if(optimalInterval<5){
        interval*=5
        return true
        }
        optimalInterval/=10
        interval*=10
        return false
    }
    for(var i=0; i<6; i++)if(iterFindNotch())return interval
    return 100000
}
function getAxisNotches(from,to,interval){
    var x=Math.min(to,from)
    x=Math.floor(x/interval+1)*interval
    var end=Math.max(to,from)
    var notches=[]
    for(;x<end; x+=interval) notches.push(x)
    return notches
}
//#endregion

render();