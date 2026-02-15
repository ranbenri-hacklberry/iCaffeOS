import requests

print("Debugging xAI API...")
API_KEY = "xai-8AlRjQI4PBNJuGTGWnbl2S5Z5aKODCxDAaCyOqIIRv1zCIqpZo72nhEnCtrI89iuePPeCqfk4OHlAcj3"
url = "https://api.x.ai/v1/chat/completions"

payload = {
    "model": "grok-beta",
    "messages": [
        {"role": "system", "content": "You are a test."},
        {"role": "user", "content": "Hello world from Python"}
    ],
    "stream": False
}

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_KEY}"
}

try:
    response = requests.post(url, headers=headers, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
