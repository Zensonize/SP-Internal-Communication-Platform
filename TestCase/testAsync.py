import aiohttp
import json
import sys
import asyncio
import random
from time import sleep
import time

with open('dataSet.json') as f:
    dataSet = json.load(f)

msgRate = int(sys.argv[1])
totalmsg = msgRate*5
delaySec = int(60 / msgRate)

print('running testcase with', msgRate, 'msgs/min for 5 minutes')
print('total messages', totalmsg, 'delay for each message', delaySec, 'sec' , delaySec*1000, 'ms')
print('dataset size:', len(dataSet))

def getData():
    return random.choice(dataSet)

URL = 'http://127.0.0.1:5000/chat'

async def send_chat(mID, data):
    elapsed = time.perf_counter() - s

    async with aiohttp.ClientSession() as session:
        print(f'{elapsed:.3f} seconds sending message', mID+1,'of',totalmsg, 'length', len(json.dumps(data)))
        async with session.post(URL, 
            headers={'Content-Type':'application/json'},
			json=data
        ) as response:
            res = await response.text() 
            print('\t', mID +1, res)

async def main():
    for i in range(totalmsg):
        await send_chat(i,getData())
        sleep(delaySec)

s = time.perf_counter()
asyncio.run(main())