"""
@author: Jon:)
How to use:
in another script, from nordnet_client import Nordnet and connect using broker=Nordnet.connect(username,password)
"""
import requests
import json
"""
#! NOTE: If you can't connect, try copy-pasting the cookies from browser into the post and get methods below.
"""

class Nordnet:
    def __init__(self,sesh,ntag,next,jwt):
        self.sesh = sesh
        self.ntag = ntag
        self.jwt  = jwt
        self.next = next
        self.logged_in = False
        self.code=None
        self.ntag=""

    def connect(username,password,
                ntag="c6d645a7-f482-4811-909d-bb0fddc3b853",
                next="4f0e34698cc58de911a34d14291eff36e8b83a9d",
                jwt="eyJraWQiOiJjUDgwTmVLRE0zVENvSDdRYnBZY2FvYVdONjJMVE5tZnhELVhvM1pMaUlvIiwidHlwIjoiSldUIiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJkZTcwNjU5OS1lMDIxLTRjNjAtYWMwZi0zNzMyODUzZjcwM2UiLCJhdWQiOiJwcm9kIiwiYW1yIjoiYmFzaWMiLCJhdXoiOiJ7XCJjaWRcIjpcImRlNzA2NTk5LWUwMjEtNGM2MC1hYzBmLTM3MzI4NTNmNzAzZVwiLFwiYWNjXCI6W3tcImFub1wiOjM0ODEzNzMzLFwiYWlkXCI6Mn0se1wiYW5vXCI6MzE5MzE1NzksXCJhaWRcIjoxfSx7XCJhbm9cIjo1MDAwOTgyOCxcImFpZFwiOjN9XX0iLCJpc3MiOiJodHRwczovL3d3dy5ub3JkbmV0LnNlIiwicmVmcmVzaCI6IjNjMWYxNDNmMmEzNjc0YzkyYzc4ZTYwYjI3MGZmYWU1NWZkZmVjNDYiLCJjc3JmIjoiOTFjNGYwN2YtZTMxMS00NmVlLTg5MGItZTdkYTRmZDIyNzEyIiwiZXhwIjoxNjkzMDg1NTYzLCJsYW5nIjoibm8iLCJjb3JnIjoiTk8ifQ.gC15z_O8v_SF39qDb0RORlrZpEdFDZyrwzaA7E0DRHLcdcydLUK6q5swED620aRWUtqNzZrUPoUao0MSFAyYCiWg8OcHPSQ9HMF98v2V8kDtvz3kcCWt-Cnc4NISCorC7rNCIH6YqTCoON9V-lixeKKrZbnZjvwQpkDyz5eq0wvHqSLC9QTKwhZt0ZBoZyeZd0QA7M5A0hOZFBnL6FrNFDab96HpimZkHH2Nv4U9hDhFrJ7DNRVRJ7sfgfPQAaolSJkL0FS35GH83BReGVarjZxXZ_ut53MmkW4o9G-JvJ_GeD1m_16sBc2O6FaqQjadA6ikwuqucXCijLcWF8eFIQ"
                ):
        broker=Nordnet(requests.Session(),ntag,next,jwt)
        broker.login(username,password)
        return broker
    
    def success(r):
        return r.status_code//100==2
    def login(self,username,password):
        payload = {
            "username":username,
            "password":password,
        }
        r=self.POST(payload,'https://www.nordnet.no/api/2/authentication/basic/login')
        print("response to login: "+str(r)+":"+str(r.headers)+":")
        self.logged_in=Nordnet.success(r)
        if 'ntag' in r.headers: self.ntag=r.headers['ntag']
        if 'NN-JWT' in r.headers: self.jwt=r.headers['NN-JWT']
        self.code=r.status_code
        return r
    

    def getIdentifier(self,instrumentId):
        payload = {"batch":[{"relative_url":"instruments/"+instrumentId+"/trades?count=6","method":"GET"},{"relative_url":"user/settings/lastVisitedAccids","method":"GET"},{"relative_url":"instruments/validation/suitability/16105420","method":"GET"},{"relative_url":"suitability","method":"GET"},{"relative_url":"instruments/16105420?positions=2,1,3","method":"GET"}]}
        r=self.POST(payload,'https://www.nordnet.no/api/2/batch')
        r=r.json()
        return r[len(r)-1]['body']['tradables']['identifier']
    
    #testing stuff
    def get_positions(self):
        payload={
            {
                "batch": [
                    {
                    "relative_url": "company_data/positionsevents/calendar?history=true",
                    "method": "GET"
                    },
                    {
                    "relative_url": "company_data/positionsevents/dividend?history=true",
                    "method": "GET"
                    }
                ]
            }
        }
        r=self.POST(payload,"https://www.nordnet.no/api/2/batch")
        return r.json()

    #-- No login required --#
    def positions(self,accountNo=1):
        r=self.GET('','https://www.nordnet.no/api/2/accounts/'+str(accountNo)+'/positions?include_instrument_loans=true')
        if len(r.content) <3 : return {}
        return [
            {
                'symbol':p['instrument']['symbol'],
                'quantity':p['qty'],
                'value':p['main_market_price']['value']
            }
            for p in r.json()
        ]
    
    def getAvailableFunds(self,accountNo=1):
        r=self.GET('','https://www.nordnet.no/api/2/accounts/'+str(accountNo)+'/ledgers')
        return r.json()['total']['value']
    #----------------------#

    # NOT TESTED!
    def order(self,side='BUY',ticker='EQNR',qty=1,price=320.6,accountNo=3):
        print("not tested")
        return
        identifier=nordnet_tickerLookup.tickerToOrderInstrumentId[ticker]
        payload = {
            "side":side,
            "identifier":identifier,
            "price":price,
            "volume":qty,
            
            "market_id":15,
            "order_type":"LIMIT",
            "currency":"NOK",
            "valid_until":date.today()
            
        }
        r=self.POST(payload,'https://www.nordnet.no/api/2/accounts/'+str(accountNo)+'/orders')
        printResponse(r)
        if success(r):
            self.logged_in=True
            self.ntag=r.headers['ntag']
            self.jwt=r.headers['NN-JWT']
        return r


    #--  Call methods  --#
    def POST(self,payload,url):
        headers = {
            "accept": "application/json",
            "client-id": "NEXT",
            "content-type": "application/json",
            "ntag": self.ntag,
            
            "cookie": "nntheme=%7B%22a11y%22%3Afalse%2C%22dark%22%3A%22AUTO%22%2C%22osPref%22%3A%22LIGHT%22%7D; cookie_consent=analytics%2Cfunctional%2Cmarketing%2Cnecessary; lang=no; _ga=GA1.2.2122040953.1693067114; _gid=GA1.2.582936679.1693067114; QUARTR_PLAYER_SETTINGS=%7B%22expanded%22%3Afalse%2C%22muted%22%3Afalse%2C%22playbackRate%22%3A1%2C%22progress%22%3A0%2C%22volume%22%3A1%2C%22duration%22%3Anull%2C%22playingStatus%22%3A%22COOKIE_DATA%22%7D; QUARTR_PLAYER_PLAYED_EVENTS=%5B%5D; _csrf=-swODV9E6Tjt98EG2dd1oKrS; _gat_UA-58430789-10=1; NEXT=cb063308bbd75901efe4c7fb6ec298b5d4a880c7",
        }
        return self.sesh.post(url, data=json.dumps(payload), headers=headers,cookies=self.cookie())
    
    
    def GET(self,payload,url):
        headers = {
            "client-id": "NEXT",
            "content-type": "application/json",
            "ntag": self.ntag,
            "cookie": "nntheme=%7B%22a11y%22%3Afalse%2C%22dark%22%3A%22AUTO%22%2C%22osPref%22%3A%22LIGHT%22%7D; cookie_consent=analytics%2Cfunctional%2Cmarketing%2Cnecessary; lang=no; _csrf=5jZpaGL08CQ7w85SGAFYmJZ6; _ga=GA1.2.2122040953.1693067114; _gid=GA1.2.582936679.1693067114; QUARTR_PLAYER_SETTINGS=%7B%22expanded%22%3Afalse%2C%22muted%22%3Afalse%2C%22playbackRate%22%3A1%2C%22progress%22%3A0%2C%22volume%22%3A1%2C%22duration%22%3Anull%2C%22playingStatus%22%3A%22COOKIE_DATA%22%7D; QUARTR_PLAYER_PLAYED_EVENTS=%5B%5D; _gat_UA-58430789-10=1; NEXT=b1c7e068468a231d41fce43f619eb4ee6b7b2726",
        }
        return self.sesh.get(url, data=json.dumps(payload), headers=headers,cookies=self.cookie())
    #--------------------#
    
    #-- Quality of lyf --#
    def __bool__(self):
        return self.logged_in
    
    def cookie(self):
        return {
            'NEXT':self.next,
            'NN-JWT':self.jwt
            }
    #--------------------#