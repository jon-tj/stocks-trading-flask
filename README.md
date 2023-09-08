# Flask Stock Trading Application

A simple and clean visual IDE and helper for financial decision making. Several "tutorial" indicators are included, and in-app scripting allows for a broad range of other indicators to be added.
Test and develop strategies in this minimalistic statistics and TA-based environment.

Tip: To run the executable, .NET may need to be installed on your computer. To run as dev, start the app in the <em>server</em> directory in the IDE of your choice to review requests and get full access to the python call-backs.

## Features
This app is built to be easy to learn, hard to master. From the search bar, you can add stocks, add indicators and run tests. Multiple markets are supported, but tickers will not show up if they are not appended to the tickers list. Stock data is gathered from yahoo finance and stored locally for quick retrieval. Loading a stock in the app will retain the stock in memory for quick usage, as is often the case in testing.

Basic indicators, tests and predictors are added per default, but the meat of this application lies in the scriptability.
If at any point you have problems developing your tools visually with this application, please refer to the documentation which can be found in the script editor.

There are a multitude of graphical representations and APIs that can be utilized to get a better understanding of what is happening under the hood. Many settings are also reachable from the settings pane, found by hovering over the label of the graphical object in question. Not all objects share the same attributes, so you will not be able to find "line thickness" under settings for a stock, as it uses the candle renderer. (If you wish to view stocks as a line graph, simply return the closing price for each day as a graph).
Function parameters can be given default values and are automatically picked up when a script is uploaded to the database. Opening the settings pane for an object generated with such parameters will display and allow you to change the way the data is generated (like period for SMA, view /help for specifics).

Deleting files with a DEL call will permanently remove these from the database. A warning screen is displayed if a user clicks on the delete button accident. Note: in app, the delete button refers to the last loaded script. If no script is loaded, there is nothing to delete, and thus no warning screen will be shown.

If you get lost, or simply wish to view the scripts maintained in the database, write /help in the search field to see non-ticker searchable objects. Happy scripting :)

![Screenshot 2023-09-08 180301.png]
![Screenshot 2023-09-08 180615.png]
