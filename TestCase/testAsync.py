from requests import async
import json
import sys
import asyncio

with open('dataSet.json') as f:
    data = json.load(f)

msgRate = int(sys.argv[1])
totalmsg = msgRate*5
delayMs = int((60*1000) / msgRate)

print('running testcase with', sys.argv[1], 'msgs/min for 5 minutes')
print('total messages', totalmsg, 'delay for each message', delayMs)
print('dataset size:', len(data))
def getData():



