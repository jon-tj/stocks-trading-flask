const nordnet={
    positions:()=>{
        fetch('/api/nn/positions')
        .then(r=>r.json())
        .then(r=>{
            console.log(r)
            return r;
        })
    }
}