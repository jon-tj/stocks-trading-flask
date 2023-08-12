import yfinance as yf
import pandas as pd
import json

def pathTo(ticker,market=None,request='quotes'):
    extension='.csv'
    if not request=='quotes': extension='.json' 
    if market is None:
        s = ticker.split('.') # check if market is in ticker: 'EQNR.OL'
        if(len(s)==2): return 'data/'+request+'/'+s[1]+'/'+s[0]+extension
        return 'data/'+request+'/nyse/'+ticker+extension # default to NYSE
    ticker=ticker.split('.')[0] # make sure market is not in ticker: 'EQNR.OL' --> 'EQNR'
    return 'data/'+request+'/'+market+'/'+ticker+extension

def latest_quote(ticker='EQNR'):
    eqnr=yf.Ticker(ticker)
    data=eqnr.history(period='1d',interval='1m')
    return data.iloc[-1]['Close']
def download_quotes(ticker='EQNR'):
    equinor = yf.Ticker(ticker)
    data = equinor.history(period="max")
    data.to_csv(pathTo(ticker))
    print(ticker,"complete")
    #fix date formatting >:(
    #this step is not necessary when loading from csv
    data=pd.DataFrame(data)
    data = data.reset_index()
    data = data.rename(columns={'index': 'Date'})
    data['Date'] = pd.to_datetime(data['Date'])
    return data
def load_quotes(ticker='EQNR'): #--> 0.09 seconds
    data = pd.read_csv(pathTo(ticker))
    data['Date'] = pd.to_datetime(data['Date'])
    return data

def load_json(filename):
    with open('data/'+filename+'.json') as f:
        data = json.load(f)
    return data
def tickers():
    return load_json('tickers')

if __name__=="__main__":
    tickers=["AKRBP.OL","PGS.OL","TGS.OL",
            "EQNR.OL","AKSO.OL","HAVI.OL",
            "GEOS.OL","OKEA.OL","SCANA.OL","SOFF.OL"]
    for ticker in tickers:download_quotes(ticker)
    print('All complete!')