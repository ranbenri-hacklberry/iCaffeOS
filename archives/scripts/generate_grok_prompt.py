import os

def generate_grok_prompt():
    debug_report_path = "DEBUG_REPORT.md"
    
    if not os.path.exists(debug_report_path):
        print(f"Error: {debug_report_path} not found.")
        return

    with open(debug_report_path, "r") as f:
        report_content = f.read()

    prompt = f"""
I am working on a Supabase/React application for a kiosk system. 
We are facing a persistent issue with an RPC function `get_sales_data`.

Here is the detailed Debug Report describing the problem, symptoms, and what we've tried so far:

---
{report_content}
---

Please analyze this failing scenario. 
Why would a `SECURITY DEFINER` function return correct `order_items` but 0 for the calculated `total` (sum of quantity * price), even though direct SQL queries show valid prices?
Is it an RLS issue on `menu_items`? Or a Type Casting issue that `::NUMERIC` didn't solve?

Please provide a corrected SQL function that is guaranteed to return the correct total.
"""

    print(prompt)
    
    # Optionally save to a file for easy copying
    with open("GROK_PROMPT.txt", "w") as out:
        out.write(prompt)
    print("\n[+] Prompt saved to GROK_PROMPT.txt")

if __name__ == "__main__":
    generate_grok_prompt()
