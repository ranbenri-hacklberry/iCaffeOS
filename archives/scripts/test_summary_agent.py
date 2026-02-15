
import subprocess
import json
import requests
import os
from dotenv import load_dotenv

# Load env variables (try multiple locations)
load_dotenv()
load_dotenv(".env")
load_dotenv("browser-use-webui/.env") # Fallback to where we saw keys earlier

# API Configuration
GROK_API_KEY = os.getenv("GROK_API_KEY") or os.getenv("XAI_API_KEY") # Try both common names
# Use the correct model name (grok-2-1212 is the latest stable/beta, grok-beta is deprecated)
MODEL_NAME = "grok-2-1212" 
API_URL = "https://api.x.ai/v1/chat/completions"

def run_tests():
    print("🚀 Running automated tests for all 57 pages...")
    print("   (Using vitest with json reporter...)")
    
    # Using specific vitest command instead of generic 'npm test' to ensure JSON output
    # and avoiding Jest-specific flags like --watchAll
    cmd = ['npx', 'vitest', 'run', '--reporter=json']
    
    try:
        # Run inside frontend_source where package.json is
        result = subprocess.run(
            cmd, 
            cwd="frontend_source", 
            capture_output=True, 
            text=True
        )
        
        # Vitest JSON reporter outputs the JSON to stdout, but sometimes also logs.
        # We might need to extract the JSON part if there's noise.
        output = result.stdout
        
        # If it failed, stdout might still have the JSON report of the failures
        if result.returncode != 0:
            print(f"⚠️ Tests finished with exit code {result.returncode} (Failures found)")
        else:
            print("✅ All tests passed!")
            
        return output

    except FileNotFoundError:
        print("❌ Error: 'npx' not found. Make sure you are in the project root and Node is installed.")
        return None
    except Exception as e:
        print(f"❌ Error running tests: {e}")
        return None

def get_grok_analysis(test_output):
    if not test_output:
        return "No test output to analyze."
        
    print("🧠 Sending results to Grok for analysis...")
    
    if not GROK_API_KEY:
        print("❌ Error: GROK_API_KEY not found in environment variables.")
        return "Error: Missing API Key"

    # Truncate to avoid token limits, but keep enough for context
    # Vitest JSON can be large, we prioritize the "testResults" or "failedTests" if possible
    # For now, just truncating the raw string
    truncated_output = test_output[:15000]

    prompt = f"""
    Analyze the following Vitest JSON output from my iCaffeOS/RanTunes project.
    We have ~57 generated test files checking for rendering and buttons.
    
    1. Summarize the overall health (Success vs Failure).
    2. Categorize failures by domain (e.g., Music, Inventory, Auth).
    3. Identify 'Critical Path' errors (things that will break the coffee shop operations).
    4. Suggest the top 3 actionable fixes.
    
    TEST OUTPUT (Truncated):
    {truncated_output}
    """
    
    payload = {
        "model": MODEL_NAME,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0
    }
    
    headers = {
        "Authorization": f"Bearer {GROK_API_KEY}", 
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(API_URL, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()['choices'][0]['message']['content']
    except requests.exceptions.HTTPError as e:
        print(f"❌ API Error: {e}")
        print(f"Response: {response.text}")
        return f"API Failed: {e}"
    except Exception as e:
        print(f"❌ Network/Parsing Error: {e}")
        return f"Error: {e}"

def save_report(report):
    if not report:
        print("⚠️ No report generated.")
        return

    filename = "HEALTH_REPORT.md"
    with open(filename, "w", encoding="utf-8") as f:
        f.write("# iCaffeOS Health Report\n\n")
        f.write(report)
    print(f"✅ Health Report saved to {filename}")

if __name__ == "__main__":
    raw_results = run_tests()
    if raw_results:
        # Just valid json check (optional, but good for debugging)
        try:
            # Try to find the start of the JSON array/object if there's noise
            json_start = raw_results.find('{')
            if json_start != -1:
                clean_json = raw_results[json_start:]
                analysis = get_grok_analysis(clean_json)
                save_report(analysis)
            else:
                print("⚠️ Output doesn't look like JSON. Sending raw text.")
                analysis = get_grok_analysis(raw_results)
                save_report(analysis)
        except Exception as e:
            print(f"⚠️ Pre-processing error: {e}. Sending raw text.")
            analysis = get_grok_analysis(raw_results)
            save_report(analysis)
            
