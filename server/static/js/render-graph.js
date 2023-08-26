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
        this.suffixAxisY="";
        this.dist=[];
    }
    recalcNotchIntervalGrid(){
        this.notchIntervalGridX=getNotchInterval(this.view.x-this.view.width,this.view.x+this.view.width,this.view.dest.width*0.5)
        var notchDensity=this.view.dest.height<300?1.8:1;
        this.notchIntervalGridY=getNotchInterval(this.view.y-this.view.height,this.view.y+this.view.height,this.view.dest.height*notchDensity)
    }
    recalcViewDest(){
        this.view.dest={
            x:this.dest.x*canvas.width,
            y:this.dest.y*canvas.height,
            width:this.dest.width*canvas.width,
            height:this.dest.height*canvas.height
        }
    }
    push(renderable){
        renderable.parentPlot=this;
        this.renderables.push(renderable);
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
            var hover=false;
            if(r.name){
                var legendText=r.name;
                if(rectContains({x:this.view.dest.x,y:legendY-16,width:260,height:20},mouse.position)){
                    hover=true;
                    legendText=cutoffResultText(legendText,13);
                    ctx.fillStyle=r.color;
                    ctx.globalAlpha=0.2;
                    ctx.fillRect(this.view.dest.x,legendY-18,200,24);
                    for(let i=0; i<10; i++){
                        ctx.globalAlpha-=0.019;
                        ctx.fillRect(this.view.dest.x+200+i*6,legendY-18,6,24);
                    }
                    ctx.globalAlpha=1;
                    if(imgsLoaded){

                        ctx.drawImage(images.settings,this.view.dest.x+165,legendY-16,20,20)
                        if(rectContains({x:this.view.dest.x+165,y:legendY-16,width:20,height:20},mouse.position))
                            mouse.clickEvent=()=>{settingsPrompt(r);}

                        ctx.drawImage(images.python,this.view.dest.x+190,legendY-16,20,20)
                        if(rectContains({x:this.view.dest.x+190,y:legendY-16,width:20,height:20},mouse.position))
                            mouse.clickEvent=()=>{togglePythonIndicator()}
                            
                        ctx.drawImage(images.trash,this.view.dest.x+215,legendY-16,20,20)
                        if(rectContains({x:this.view.dest.x+215,y:legendY-16,width:20,height:20},mouse.position))
                            mouse.clickEvent=()=>{
                                this.renderables.splice(this.renderables.indexOf(r),1);
                                render();
                            }
                        if(r instanceof Graph){
                            ctx.drawImage(images.normalize,this.view.dest.x+240,legendY-16,20,20)
                            if(rectContains({x:this.view.dest.x+240,y:legendY-16,width:20,height:20},mouse.position))
                                mouse.clickEvent=()=>{
                                    if(r.normalizeY==null) r.normalizeY=this.view.dest.height*3/5;
                                    else r.normalizeY=null;
                                    render();
                                }
                        }
                    }
                }
                ctx.font="bold 12pt Arial";
                ctx.fillStyle=r.color;
                ctx.fillText(legendText,this.view.dest.x+20,legendY)
                legendY+=22;
            }
            if(hover && r.lineWidth) r.lineWidth+=1;
            r.render(this.view);
            if(hover && r.lineWidth) r.lineWidth-=1;
        })
        if(this.name!="main"){
            // button to delete the plot
            if(rectContains({x:this.view.dest.x+this.view.dest.width-20,y:this.view.dest.y+1,width:20,height:20},mouse.position)){
                mouse.clickEvent=()=>{
                    //find the plot directly above it and make it tall enough to cover the region freed up by deleting this plot:
                    var above = plots
                        .filter(p => p.view.dest.y < this.view.dest.y) // Filter plots above the current plot
                        .sort((a, b) => b.view.dest.y - a.view.dest.y) // Sort plots in descending order of y-destination
                        .shift(); // Get the first (highest) plot
                    if(above){
                        above.dest.height+=this.dest.height;
                        above.recalcViewDest();
                        above.recalcNotchIntervalGrid();
                    }
                    plots.splice(plots.indexOf(this),1);
                    render();
                }
                ctx.fillStyle=theme['bg-light'];
            }
            else ctx.fillStyle=theme['bg']
            ctx.fillRect(this.view.dest.x+this.view.dest.width-21,this.view.dest.y+1,21,21)
            ctx.drawImage(images.trash,this.view.dest.x+this.view.dest.width-20,this.view.dest.y+1,20,20)
        }
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
            if(y==0) ctx.strokeStyle='green'
            else ctx.strokeStyle=theme['grid']
            ctx.beginPath()
            var yT=this.view.transformY(y)
            ctx.moveTo(this.view.dest.x,yT) ; ctx.lineTo(this.view.dest.x+this.view.dest.width,yT)
            ctx.stroke()
            var yText=y.toFixed(places)+this.suffixAxisY
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
    clickEvent:null
}
const keys={"Shift":false,"Control":false}
var displayCursorLines=false;
var imgsLoaded=true;
function loadImage(url){
    imgsLoaded=false;
    var img=new Image();
    img.src=url;
    img.onload=()=>{ imgsLoaded=true; }
    return img;
}
const images={
    trash:loadImage("static/icons/python/delete.png"),
    settings:loadImage("static/icons/graph/settings.png"),
    python:loadImage("static/icons/python/python.png"),
    normalize:loadImage("static/icons/graph/normalize.png"),
}
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
    "bg", "bg-light",
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
    mouse.clickEvent=null;
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
function fitDataVertical(){
    plots.forEach((p)=>{
        if(p.lockAxisY || p.renderables.length==0) return;
        p.view.fitDataVerticalAll(p.renderables);
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