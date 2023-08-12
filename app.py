from flask import Flask, render_template, request, redirect, url_for, g, make_response

import json
import data_handler
import pandas as pd


app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False

@app.route("/<ticker>")
def ROUTE_view_stock(ticker):
    return render_template('view_stock.html')

@app.route("/")
def ROUTE_index():
    return render_template('index.html')

@app.route("/api/quotes/<ticker>", methods=['GET'])
def api_quotes(ticker):
    quotes=data_handler.download_quotes(ticker)
    return pd.DataFrame.to_json(quotes)

if __name__ == "__main__":
    app.run(debug=True)