const canvas=document.querySelector('canvas');
const navbar=document.querySelector('#navbar');
canvas.width=window.innerWidth;
canvas.height=window.innerHeight-navbar.clientHeight;
const ctx=canvas.getContext('2d');
const view=new Viewport(30,20);
const mouse={
    position:{x:0,y:0},
    click:{button:-1,x:0,y:0,dragDist:0},
    momentum:{x:0,y:0},
    clickTime:Date.now(),
}
const keys={"Shift":false,"Control":false}
const renderables=[];

//#region theme
const themeProperties=[
    "bg",
    "axes", "grid",
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

function render(){
    // clear canvas
    ctx.fillStyle=theme['bg'];
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // grid
    drawGrid();

    // renderables
    var legendY=40;
    renderables.forEach((r)=>{
        r.render();
        if(r.name){
            ctx.font="bold 12pt Arial";
            ctx.fillStyle=r.color;
            ctx.fillText(r.name,20,legendY)
            legendY+=20;
        }
    })
}

//#region draw grid :)

function clamp(x,min,max){
    if(x<min)return min
    if(x>max)return max
    return x
  }

function drawGrid(){
    function notchText(v,places=1){
        return v.toFixed(places)
    }
    ctx.lineWidth=1

    // values of x,y the grid lines will pass through:
    //! TODO: notch interval should not be calculated for each render call!!!
    var notchInterval=getNotchInterval(view.x-view.width,view.x+view.width,canvas.width*0.5)
    var notchesX = getAxisNotches(view.x-view.width,view.x+view.width,notchInterval)
    notchInterval=getNotchInterval(view.y-view.height,view.y+view.height,canvas.height)
    var notchesY = getAxisNotches(view.y-view.height,view.y+view.height,notchInterval)

    // notches
    places=Math.max(0,2-Math.log10(view.width));
    ctx.font="10pt Arial";
    ctx.strokeStyle=theme['grid']
    ctx.fillStyle=theme['axes']
    notchesX.forEach((x)=>{
        ctx.beginPath()
        xT=view.transformX(x)
        ctx.moveTo(xT,0) ; ctx.lineTo(xT,canvas.height)
        ctx.stroke()
        ctx.fillText(notchText(x,places),xT-8,18)
    })
    
    places=Math.max(0,2-Math.log10(view.height));
    notchesY.forEach((y)=>{
        if(y<0)return;
        ctx.beginPath()
        yT=view.transformY(y)
        ctx.moveTo(0,yT) ; ctx.lineTo(canvas.width,yT)
        ctx.stroke()
        var yText=notchText(y,places)
        var stringWidth=ctx.measureText(yText).width
        ctx.fillText(yText,canvas.width-10-stringWidth,yT+5)
    })
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
  x=Math.floor(x/interval)*interval
  var end=Math.max(to,from)
  var notches=[]
  for(;x<end; x+=interval) notches.push(x)
  return notches
}
//#endregion
render();