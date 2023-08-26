import numpy as np
from math import exp
def test_script(script,ticker,loadedQuotes,name="My strat",days=None,output_graphs="",parameters=""):
    
    # NOTE: some escape characters have not been replaced.
    # If youre seeing 'unexpected character' errors, add to the code below.
    if len(parameters)>0: parameters=","+parameters
    script="import backtester\nimport data_handler\n"+script.replace('\\n','\n')+f"""
data={"{}"}
def load_quotes(ticker,name='stock-A'):
    if ticker in loadedQuotes:
        data[name]=loadedQuotes[ticker]
    else:
        data[name]=data_handler.download_quotes(ticker)
        loadedQuotes[ticker]=data[name]
    return data[name]

def time_ser(ticker,name='stock-A'):
    if ticker in loadedQuotes:
        df=loadedQuotes[ticker]
    else:
        df=data_handler.download_quotes(ticker)
        loadedQuotes[ticker]=df
    data[name]=[c for c in df['Close']]
    return data[name]

def reveal(ts,i):
    return ts

init("{ticker}")
days=[len(data[a]) for a in data if not (isinstance(data[a], int) or isinstance(data[a], float) or isinstance(data[a], str))] if len(data)>0 else []
days.append({days})
days=min(days)
df=data['stock-A'] if 'stock-A' in data else next(iter(data))
res=backtester.test_single(main,data,df,"{name}",days,{output_graphs}) #{parameters}
    
    """
    print(script)
    script=script.replace("\\'","'").replace('\\"','"')
    _vars={'res':None,'loadedQuotes':loadedQuotes,'days':days,'name':name}
    exec(script,_vars)
    return _vars['res'],'Test'

def test_single(strat,data,df,name,days=None,output_graphs=['equity','returns']):
    if not days:
        days=df.shape[0]
    else:
        days=min(days,df.shape[0])
    df['lr']=np.log(df['Close']).diff()
    equity=df['Close'][df.shape[0]-days]
    equity_graph=[equity]
    lr=[0]

    for i in range(days):
        if i<1: continue
        d=strat(data,i-1)
        if d>0:
            lr.append(df['lr'][i])
            equity*=exp(df['lr'][i])
        else:
            lr.append(0)
        equity_graph.append(equity)
    output=[]
    if 'returns' in output_graphs:
        output.append({'values':[exp(lr)*100-100 for lr in lr],'target':'returns,suffix:%','legend':name+"%",'distribution':'stick-y'}) #haha whats brown and sticky? a stick
    if 'equity' in output_graphs:
        output.append({'values':equity_graph,'color':'yellow','legend':'Equity('+name+")"})
    output.append({'fit-horizontal':True})
    return output