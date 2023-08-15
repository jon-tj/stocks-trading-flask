import numpy as np
from math import exp
def test_script(script,df,days=None,parameters=""):
    if not days:
        days=df.shape[0]
    else:
        days=min(int(days),df.shape[0])
    # NOTE: some escape characters have not been replaced.
    # If youre seeing 'unexpected character' errors, add to the code below.
    if len(parameters)>0: parameters=","+parameters
    script="import backtester\n"+script.replace('\\n','\n')+"\nres=backtester.test_single(main,df,days"+parameters+")"
    print(script)
    script=script.replace("\\'","'").replace('\\"','"')
    _vars={'res':None,'df':df,'days':days}
    exec(script,_vars)
    
    return _vars['res'],'Test'

def test_single(strat,df,days=None):
    if not days:
        days=df.shape[0]
    else:
        days=min(days,df.shape[0])
    df['lr']=np.log(df['Close']).diff()
    equity=1
    equity_graph=[equity]

    for i in range(len(df)-days,len(df),1):
        if i<1: continue
        d=strat(df,i-1)
        if d>0:
            equity*=exp(df['lr'][i])
        equity_graph.append(equity)
    return [
        {'values':df['lr'][-days:],'target':'lr','legend':'Log returns'},
        {'values':equity_graph,'color':'yellow','target':'test','legend':'Equity'},
        {'fit-horizontal':True}
    ]