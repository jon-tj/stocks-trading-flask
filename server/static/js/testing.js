testScript=`"""
(remove @ to suppress output)
@--equity
@--dist-returns

@test-days: 2000
@define:
. BUY 1
. SELL -1
. HOLD 0
. _close df['Close']
. close df['Close'][i]
""" 

def main(df,i):
    if i<1: return HOLD
    if _close[i]<_close[i-1]:
        return BUY
    else:
        return SELL`;