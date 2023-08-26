testScript=`
"""
@--equity
@--returns

@name: Test
@test-days: 2000
@define:
. BUY 1
. SELL -1
. close data['stock-A']['Close']
""" 

def main(data,i):
    if i<1: return SELL
    if close[i]<close[i-1]:
        return BUY
    else:
        return SELL

def init(ticker):
    load_quotes(ticker,'stock-A')

`;