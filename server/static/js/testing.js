testScript=`
"""
@--equity
@--returns

@test-days: 2000
@define:
. BUY 1
. SELL -1
. close df['Close']
""" 

def main(df,i):
    if i<1: return SELL
    if close[i]<close[i-1]:
        return BUY
    else:
        return SELL

def init(ticker):
    df=load_quotes(ticker)
    return len(df)

`;