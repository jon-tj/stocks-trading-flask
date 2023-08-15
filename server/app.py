from flask import Flask, render_template, request, redirect, url_for, g, make_response

import json
import data_handler
import pandas as pd
import base64
import re

loadedQuotes={}
memory={'ticker':None}
with open('./server/py-prefabs.json','r') as f:
    prefabs=json.load(f)

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False

#region templates

@app.route("/<ticker>")
def ROUTE_view_stock(ticker):
    return render_template('view_stock.html')

@app.route("/")
def ROUTE_index():
    return render_template('index.html')

@app.route("/docs")
def ROUTE_docs():
    return render_template('docs.html')

#endregion

#region data API endpoints

@app.route("/api/quotes/<ticker>", methods=['GET'])
def API_quotes(ticker):
    quotes=data_handler.download_quotes(ticker)
    loadedQuotes[ticker]=quotes
    memory['ticker']=ticker
    return pd.DataFrame.to_json(quotes)

@app.route("/api/tickers", methods=['GET'])
def API_tickers():
    return json.dumps(data_handler.get_tickers())

#endregion

#region python API endpoints

@app.route("/api/python", methods=['POST'])
def API_python():
    if not memory['ticker']: return json.dumps({'legend':None,'values':[],'target':None}) #wHat

    ticker=memory['ticker']
    df=loadedQuotes[ticker]
    script=request.get_json().replace('%3d','=')
    res,legend=run_script(script,df,ticker)
    return graph(res,legend)
def graph(res,legend):
    target="main"
    if "target" in res:
        target=res['target']
        del res['target']
    if isinstance(res,list) and len(res)>0:
        if isinstance(res[0],dict):
            for i in range(len(res)):
                # can also contain other renderable objects, like fill_between. these dont have "values"
                if 'values' in res[i]:
                    res[i]['values']=[v for v in res[i]['values']]
            return json.dumps({'legend':legend,'target':target,'graphs':res})
        elif isinstance(res[0],pd.Series):
            return json.dumps({'legend':legend,'target':target,'graphs':[{'values':[r for r in res]} for res in res]})
        else:
            return json.dumps({'legend':legend,'target':target,'graphs':[{'values':res} for res in res]})
    else:
        if isinstance(res,dict):
            res['values']=[v for v in res['values']]
            return json.dumps({'legend':legend,'target':target,'graphs':[res]})
        elif isinstance(res,pd.Series):
            return json.dumps({'legend':legend,'target':target,'graphs':[{'values':[r for r in res]}]})
        else:
            return json.dumps({'legend':legend,'target':target,'graphs':[{'values':res}]})

def run_script(script,df,ticker):
    # NOTE: some escape characters have not been replaced.
    # If youre seeing 'unexpected character' errors, add to the code below.
    script=script.replace('\\n','\n')+"\nres=main(df)"
    script=script.replace("\\'","'").replace('\\"','"')
    _vars={'res':None,'df':df}
    exec(script,_vars)
    
    legend=get_script_symbol(script,'legend','main($ticker)')
    legend=legend.replace('$ticker',ticker)

    return _vars['res'],legend

def get_script_symbol(script,symbol,placeholder):
    legend=placeholder
    if(script.find('@'+symbol+':')!=-1):
        legend=script[script.find('@'+symbol+':')+len(symbol)+2:].strip()
        legend=legend[:legend.find('\n')]
    return legend

@app.route("/api/prefabs", methods=['GET'])
def API_list_prefabs():
    return json.dumps([
        {
            'key': p,
            'names': prefabs[p]['names'],
            'parameters': prefabs[p]['parameters'],
            'description': prefabs[p]['description'] if 'description' in prefabs[p] else None
        }
        for p in prefabs
    ])

@app.route("/api/prefabs/<p>", methods=['GET'])
def API_get_prefab(p):
    ticker=request.args.get('ticker')
    if not ticker:
        return json.dumps(prefabs[p]['code'])
    if ticker in loadedQuotes:
        df=loadedQuotes[ticker]
    else:
        df=data_handler.download_quotes(ticker)
        loadedQuotes[ticker]=df
    res,legend=run_script(prefabs[p]['code'],df,ticker)
    return graph(res,legend)

@app.route("/api/prefabs", methods=['POST'])
def API_post_prefab():
    code=request.get_json()
    print("receieved code: ",code)
    legend=get_script_symbol(code,'legend','unknown')
    if '(' in legend: legend=legend[:legend.find('(')]
    description=get_script_symbol(code,'description',None)
    name=get_script_symbol(code,'name',legend)
    if name=='unknown':
        return make_response(json.dumps({'error':'Could not determine name'}), 400)
    names=name.split('|')
    prefabs[legend]={
        'names':names,
        'code':code
    }
    # find the parameters in def main, other than 'df':
    if(code.find('def main(')!=-1):
        parameters={}
        parametersText=code[code.find('def main(')+9:].strip()
        parametersText=parametersText[:parametersText.find(')')].replace(' ','').split(',')
        if len(parametersText)>0:
            del parametersText[0]
        for i in range(len(parametersText)):
            if '=' in parametersText[i]:
                s=parametersText[i].split('=')
                parameters[s[0]]=s[1]
            else:
                parameters[parametersText[i]]=0

        prefabs[legend]['parameters']=parameters
    if description:
        prefabs[legend]['description']=description
    with open('./py-prefabs.json','w') as f:
        json.dump(prefabs,f)
    return make_response(API_list_prefabs(), 200)

@app.route("/api/prefabs/<p>", methods=['DELETE'])
def API_delete_prefab(p):
    if p not in prefabs:
        return make_response(json.dumps({'message':'Prefab does not exist'}), 400)
    del prefabs[p]
    with open('./py-prefabs.json','w') as f:
        json.dump(prefabs,f)
    return make_response(API_list_prefabs(), 200)

@app.route("/api/peek", methods=['GET'])
def API_peek_memory():
    return json.dumps(memory)
#endregion

if __name__ == "__main__":
    app.run(debug=True)