import urllib.request, json, os
from urllib.error import HTTPError

body = json.dumps({
    "query": "SELECT routine_definition FROM information_schema.routines WHERE routine_name = 'get_orders_history';"
}).encode('utf-8')

req = urllib.request.Request("http://127.0.0.1:8081/api/admin/raw-query", data=body, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode('utf-8'))
except HTTPError as e:
    print(e.read().decode('utf-8'))
