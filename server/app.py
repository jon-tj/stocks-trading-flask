from flask import Flask, render_template, request, redirect, url_for, g, make_response

import json
import data_handler
import pandas as pd
import backtester
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

def flow_flags_in_script(script):
    lines = script.split("\n")
    new_lines = []
    prev_line = None
    for line in lines:
        if prev_line and line.strip().replace("#","").startswith(".") and "@" in prev_line and ":" in prev_line:
            match = re.search(r'@([^:]+):', prev_line)
            if match:
                text_between = "@"+match.group(1)+":"
                line = text_between+line[line.find('.')+1:]
        new_lines.append(line)
        prev_line = line
    new_script="\n".join(new_lines)
    return new_script

@app.route("/api/python", methods=['POST'])
def API_python():

    ticker=memory['ticker']
    print(ticker)
    if not ticker:
        ticker='EQNR.OL'
        loadedQuotes[ticker]=data_handler.load_quotes(ticker)
    df=loadedQuotes[ticker]
    r=request.get_json()
    parameters=r['parameters']
    parametersText= ','.join([parameters[p] for p in parameters])
    if not parameters: parameters={}
    script=r['script'].replace('%3d','=')
    og_script=script
    script=flow_flags_in_script(script)
    for v in get_script_symbols(script,'define'):
        sides=v.split(' ')
        if len(sides)<2: continue
        script=script.replace(sides[0],sides[1])

    if '@--' in script: #this is a backtest
        output_graphs=[]
        if '@--equity' in script: output_graphs.append('equity')
        if '@--returns' in script: output_graphs.append('returns')
        res,legend=backtester.test_script(script,df,get_script_symbol(script,'name','Test'),get_script_symbol(script,"test-days",None),str(output_graphs))
    else:
        res,legend=run_script(script,df,ticker,parametersText)
    return graph(res,legend,parameters,og_script)
def graph(res,legend,parameters={},script=None):
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
            return json.dumps({'script':script,'parameters':parameters,'legend':legend,'target':target,'graphs':res})
        elif isinstance(res[0],pd.Series):
            return json.dumps({'script':script,'parameters':parameters,'legend':legend,'target':target,'graphs':[{'values':[r for r in res]} for res in res]})
        else:
            return json.dumps({'script':script,'parameters':parameters,'legend':legend,'target':target,'graphs':[{'values':res} for res in res]})
    else:
        if isinstance(res,dict):
            res['values']=[v for v in res['values']]
            return json.dumps({'script':script,'parameters':parameters,'legend':legend,'target':target,'graphs':[res]})
        elif isinstance(res,pd.Series):
            return json.dumps({'script':script,'parameters':parameters,'legend':legend,'target':target,'graphs':[{'values':[r for r in res]}]})
        else:
            return json.dumps({'script':script,'parameters':parameters,'legend':legend,'target':target,'graphs':[{'values':res}]})

def run_script(script,df,ticker,parameters=""):
    # NOTE: some escape characters have not been replaced.
    # If youre seeing 'unexpected character' errors, add to the code below.
    if parameters and len(parameters)>0: parameters=","+parameters
    else: parameters=""
    script=script.replace('\\n','\n')+"\nres=main(df"+parameters+")"
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
def get_script_symbols(script,symbol):
    values=[]
    i=0
    while(i>=0):
        i=script.find('@'+symbol+':',i+1)
        if i!=-1:
            v=script[i+len(symbol)+2:].strip()
            values.append(v[:v.find('\n')])
    return values

@app.route("/api/prefabs", methods=['GET'])
def API_list_prefabs():
    return json.dumps([
        {
            'key': p,
            'names': prefabs[p]['names'],
            'parameters': prefabs[p]['parameters'],
            'description': prefabs[p]['description'] if 'description' in prefabs[p] else None,
            'type': prefabs[p]['type'] if 'type' in prefabs[p] else 'unknown'
        }
        for p in prefabs
    ])

@app.route("/api/prefabs/<p>", methods=['GET'])
def API_get_prefab(p):
    ticker=request.args.get('ticker')
    parameters=request.args.get('parameters')
    parametersValues=[] if not parameters else parameters.split(',')
    parametersDict={}
    i=0
    for param in prefabs[p]['parameters']:
        # should probably check for type so we dont mistakenly send everything as a string
        parametersDict[param]=parametersValues[i] if i<len(parametersValues) else prefabs[p]['parameters'][param]
        i+=1
    if not ticker:
        return json.dumps(prefabs[p]['code'])
    if ticker in loadedQuotes:
        df=loadedQuotes[ticker]
    else:
        df=data_handler.download_quotes(ticker)
        loadedQuotes[ticker]=df
    script=prefabs[p]['code']
    script=flow_flags_in_script(script)
    for v in get_script_symbols(script,'define'):
        sides=v.split(' ')
        if len(sides)<2: continue
        script=script.replace(sides[0],sides[1])
    if '@--' in script: #this is a backtest
        output_graphs=[]
        if '@--equity' in script: output_graphs.append('equity')
        if '@--returns' in script: output_graphs.append('returns')
        res,legend=backtester.test_script(script,df,get_script_symbol(script,'name','Test'),get_script_symbol(script,"test-days",None),str(output_graphs))
        return graph(res,legend)
    res,legend=run_script(script,df,ticker,parameters)
    return graph(res,legend,parametersDict,prefabs[p]['code'])

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
        prefabs[legend]['type']="strategy" if "@--" in code else "indicator"
    if description:
        prefabs[legend]['description']=description
    with open('server/py-prefabs.json','w') as f:
        json.dump(prefabs,f)
    return make_response(API_list_prefabs(), 200)

@app.route("/api/prefabs/<p>", methods=['DELETE'])
def API_delete_prefab(p):
    if p not in prefabs:
        return make_response(json.dumps({'message':'Prefab does not exist'}), 400)
    del prefabs[p]
    with open('server/py-prefabs.json','w') as f:
        json.dump(prefabs,f)
    return make_response(API_list_prefabs(), 200)

@app.route("/api/peek", methods=['GET'])
def API_peek_memory():
    return json.dumps(memory)
#endregion

if __name__ == "__main__":
    app.run(debug=True)