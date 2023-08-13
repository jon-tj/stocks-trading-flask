const promptBox=document.querySelector('#prompt-box');
const promptDeleteItem=document.querySelector('#prompt-delete-item');
const overlayBlack=document.querySelector('#overlay-black');
var delObj=null;

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
function hidePrompt(){
    promptBox.style.display='none';
    if(hidePromptAction){
        hidePromptAction();
        hidePromptAction=null;
    }
}
function prompt(value,action='welcome'){
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
    prompt('welcome');
    hidePromptAction=()=>{
        var sc=search.input.parentElement;
        sc.parentElement.removeChild(sc);
        var nb=document.querySelector("#navbar");
        nb.insertBefore(sc,nb.firstChild);
    }
}

welcomePrompt();