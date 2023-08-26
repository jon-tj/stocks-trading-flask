function prettyFormat(){
    var codes=document.querySelectorAll(".colorme");
    codes.forEach((sec)=>{
        if(sec.innerHTML.startsWith("@")){
            sec.innerHTML="<span style='color:green'>"+sec.innerHTML+"</span>";
        }
        sec.innerHTML=sec.innerHTML
        .replaceAll("[series]", "$1")
        .replaceAll("[value]", "$2")
        .replaceAll("[target]", "$3")
        .replace(/'([^']+)'/g, "<span style='color: orange;'>$&</span>");
        
        ["{","}","[","]"].forEach((symb)=>{
            sec.innerHTML=sec.innerHTML.replaceAll(symb,"<span style='color:red'>"+symb+"</span>");
        });
        sec.innerHTML=sec.innerHTML
        .replaceAll("$1","<span style='color:pink'>[series]</span>")
        .replaceAll("$2","<span style='color:pink'>[value]</span>")
        .replaceAll("$3","<span style='color:pink'>[target]</span>")
    });
}