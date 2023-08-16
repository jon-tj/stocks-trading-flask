import numpy as np
from math import exp
def test_script(script,df,name="My strat",days=None,output_graphs="",parameters=""):
    if not days:
        days=df.shape[0]
    else:
        days=min(int(days),df.shape[0])
    # NOTE: some escape characters have not been replaced.
    # If youre seeing 'unexpected character' errors, add to the code below.
    if len(parameters)>0: parameters=","+parameters
    script="import backtester\n"+script.replace('\\n','\n')+"\nres=backtester.test_single(main,df,name,days,"+output_graphs+parameters+")"
    print(script)
    script=script.replace("\\'","'").replace('\\"','"')
    _vars={'res':None,'df':df,'days':days,'name':name}
    exec(script,_vars)
    
    return _vars['res'],'Test'

def test_single(strat,df,name,days=None,output_graphs=['equity','returns']):
    if not days:
        days=df.shape[0]
    else:
        days=min(days,df.shape[0])
    df['lr']=np.log(df['Close']).diff()
    equity=df['Close'][df.shape[0]-days]
    equity_graph=[equity]
    lr=[0]

    for i in range(len(df)-days,len(df),1):
        if i<1: continue
        d=strat(df,i-1)
        if d>0:
            lr.append(df['lr'][i])
            equity*=exp(df['lr'][i])
        else:
            lr.append(0)
        equity_graph.append(equity)
    output=[]
    if 'returns' in output_graphs:
        output.append({'values':[exp(lr)*100-100 for lr in lr],'target':'returns,suffix:%','legend':name+"%",'distribution':'stick-y'})
    if 'equity' in output_graphs:
        output.append({'values':equity_graph,'color':'yellow','legend':'Equity'})
    output.append({'fit-horizontal':True})
    return output