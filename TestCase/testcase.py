import requests
import time
import json

url = 'http://localhost:5000/chat'
# mydata = {'key': 'value'}

with open('testChat10000items.json') as json_file:
    mydata = json.load(json_file)
    for i in range(10):
        time.sleep(2)
        response = requests.post(url, data = mydata)

print(response.text)