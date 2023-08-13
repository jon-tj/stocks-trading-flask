const promptBox=document.querySelector('#prompt-box');
const promptDeleteItem=document.querySelector('#prompt-delete-item');
var delObj=null;
prompts={
    'delete':document.querySelector('#prompt-delete'),
    'select-ticker':document.querySelector('#prompt-select-ticker'),
}
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
}
function prompt(value,action='welcome'){
    if(action=='delete'){
        delObj=value;
        promptDeleteItem.innerText=value;
    }
    promptBox.style.display='block';
    for(const key in prompts){
        if(key == action){
            prompts[key].classList.remove('hidden');
        }else{
            prompts[key].classList.add('hidden');
        }
    }
}