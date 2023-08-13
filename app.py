from flask import Flask, render_template, request, redirect, url_for, g, make_response

import json
import data_handler
import pandas as pd
import base64
import re

loadedQuotes={}
memory={'ticker':None}
with open('./py-prefabs.json','r') as f:
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

#endregion

#region data API endpoints

@app.route("/api/quotes/<ticker>", methods=['GET'])
def api_quotes(ticker):
    quotes=data_handler.download_quotes(ticker)
    loadedQuotes[ticker]=quotes
    memory['ticker']=ticker
    return pd.DataFrame.to_json(quotes)

@app.route("/api/tickers", methods=['GET'])
def api_tickers():
    return json.dumps(data_handler.get_tickers())

#endregion

#region python API endpoints

@app.route("/api/python", methods=['POST'])
def api_python():
    if not memory['ticker']: return json.dumps({'legend':None,'values':[]}) #wHat

    ticker=memory['ticker']
    df=loadedQuotes[ticker]
    script=request.get_json().replace('%3d','=')
    res,legend=run_script(script,df,ticker)
    return json.dumps({'legend':legend,'values':[r for r in res]}).replace('NaN','null')

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
def api_list_prefabs():
    return json.dumps([{'key':p,'names':prefabs[p]['names']} for p in prefabs])

@app.route("/api/prefabs/<p>", methods=['GET'])
def api_get_prefab(p):
    ticker=request.args.get('ticker')
    if not ticker:
        return json.dumps(prefabs[p]['code'])
    if ticker in loadedQuotes:
        df=loadedQuotes[ticker]
    else:
        df=data_handler.download_quotes(ticker)
        loadedQuotes[ticker]=df
    res,legend=run_script(prefabs[p]['code'],df,ticker)
    return json.dumps({'legend':legend,'values':[r for r in res]}).replace('NaN','null')

@app.route("/api/prefabs", methods=['POST'])
def api_post_prefab():
    code=request.get_json()
    print("receieved code: ",code)
    legend=get_script_symbol(code,'legend','unknown')
    if '(' in legend: legend=legend[:legend.find('(')]
    name=get_script_symbol(code,'name',legend)
    if name=='unknown':
        return make_response(json.dumps({'error':'Could not determine name'}), 400)
    names=name.split('|')
    prefabs[legend]={
        'names':names,
        'code':code
    }
    with open('./py-prefabs.json','w') as f:
        json.dump(prefabs,f)
    return make_response(api_list_prefabs(), 200)

@app.route("/api/prefabs/<p>", methods=['DELETE'])
def api_delete_prefab(p):
    if p not in prefabs:
        return make_response(json.dumps({'message':'Prefab does not exist'}), 400)
    del prefabs[p]
    with open('./py-prefabs.json','w') as f:
        json.dump(prefabs,f)
    return make_response(api_list_prefabs(), 200)

@app.route("/api/peek", methods=['GET'])
def api_peek_memory():
    return json.dumps(memory)
#endregion

if __name__ == "__main__":
    app.run(debug=True)