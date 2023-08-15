const promptBox=document.querySelector('#prompt-box');
const promptDeleteItem=document.querySelector('#prompt-delete-item');
const overlayBlack=document.querySelector('#overlay-black');
var delObj=null;
var currentPromptAction=null;

function confirmDelete(){
    if(delObj){
        var isPrefab=false;
        for(const p of prefabsNames){
            if(p.key==delObj){
                isPrefab=true;
                break;
            }
        }
        if(isPrefab){
            console.log("deleting prefab "+delObj)
            prefabsNames.splice(prefabsNames.indexOf(delObj),1);
            fetch('/api/prefabs/'+delObj,{
                method:'DELETE',
                headers:{
                    'Content-Type':'application/json'
                }
            })
            .then((response)=>{
                if(response.ok){
                    activeScriptKey=null;
                    response.json().then((d)=>{
                        prefabsNames=d;
                    })
                }
                else die(d.message);
            });
            hidePrompt();
            return;
        }
        console.warn("Object could not be deleted: "+delObj+". It is not a prefab.")
    }
}
function hidePrompt(forceCloseHelp=true){
    if(currentPromptAction=='help' &&!forceCloseHelp) return;
    promptBox.style.display='none';
    if(hidePromptAction){
        hidePromptAction();
        hidePromptAction=null;
    }
}
function prompt(value,action='welcome'){
    currentPromptAction=action;
    if(hidePromptAction){
        hidePromptAction();
        hidePromptAction=null;
    }
    for(const c of promptBox.children){
        if(c.getAttribute('name')==action)
            c.classList.remove('hidden');
        else c.classList.add('hidden');
    }
    if(action=='delete'){
        delObj=value;
        promptDeleteItem.innerText=value;
    }
    promptBox.style.display='block';
}
var hidePromptAction=null;
function welcomePrompt(){
    promptBox.style.height="200px";
    prompt();
    if(search.input){
        var sc=search.input.parentElement;
        sc.parentElement.removeChild(sc);
        var nb=document.querySelector("#prompt-welcome");
        nb.append(sc);
    }
    hidePromptAction=()=>{
        var sc=search.input.parentElement;
        sc.parentElement.removeChild(sc);
        var nb=document.querySelector("#navbar");
        nb.insertBefore(sc,nb.firstChild);
    }
}
function helpPrompt(){
    promptBox.style.height="300px";
    var helpList=document.querySelector('#help-list');
    helpList.innerHTML='';
    
    for(const h of Object.keys(commands)){
        var li=document.createElement('li');
        li.innerText="/"+h;
        li.addEventListener('click',()=>{
            commands[h]();
        })
        helpList.append(li);
    }
    for(const h of prefabsNames){
        var li=document.createElement('li');
        li.title='Click to load '+h.names[0]+' script';
        var parameters="<em>df</em>";
        for(const p of Object.keys(h.parameters)){
            parameters+=", "+p+"="+h.parameters[p];
        }
        li.innerHTML=`<span>${h.names[0]}</span>,&nbsp;<strong>${h.key}</strong>(${parameters})`;
        if(h.description)
            li.innerHTML+=`<br><em class="indented">${h.description}</em>`;
        li.addEventListener('click',()=>{
            loadScript(h.key);
        })
        helpList.append(li);
    }
    prompt(null,"help")
}
welcomePrompt();