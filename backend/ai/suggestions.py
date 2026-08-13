import sys
import json
import os
import re
from dotenv import load_dotenv

# 🚀 Attempt to load the new Gemini SDK
try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

load_dotenv()

def fallback_logic(data):
    """The original basic math logic to act as an indestructible failsafe."""
    mood_sum = 0
    energy_sum = 0
    count = len(data)
    suggestions = []

    if count == 0:
        return ["No data available for analysis"]

    for a in data:
        mood_sum += a.get("mood_level", 5)
        energy_sum += a.get("energy_level", 5)

    avg_mood = mood_sum / count
    avg_energy = energy_sum / count

    if avg_mood < 6:
        suggestions.append("Your mood is often low. Try outdoor activities to recalibrate.")
    if avg_energy < 6:
        suggestions.append("Your energy seems low. Improve sleep schedules & hydration protocols.")
    if avg_energy > 7 and avg_mood > 7:
        suggestions.append("Your routine is healthy. Keep riding this positive wave, Operator!")

    if not suggestions:
        suggestions.append("Your matrix is stable. Keep logging telemetry.")

    return suggestions

def main():
    try:
        # 🚀 Read the JSON string passed via command line arguments
        raw_input = sys.argv[1]
        data = json.loads(raw_input)
    except (IndexError, json.JSONDecodeError):
        print(json.dumps(["Invalid telemetry data provided."]))
        sys.exit(1)

    if not data:
        print(json.dumps(["No data available for analysis."]))
        sys.exit(0)

    GEMINI_KEY = os.getenv("GEMINI_API_KEY")

    # 🚀 The Parachute: If no key or package is missing, trigger the offline logic
    if not GEMINI_KEY or not genai:
        print(json.dumps(fallback_logic(data)))
        sys.exit(0)

    try:
        # 🚀 Wire into Gemini 2.5 Flash
        client = genai.Client(api_key=GEMINI_KEY)
        
        system_instruction = (
            "You are the advanced analytical AI of HyperLife OS. "
            "Analyze this JSON telemetry array containing the operator's recent activities. "
            "Return a JSON array of strings containing exactly 2 highly personalized, atmospheric suggestions. "
            "Address the user as 'Operator'. Do NOT use markdown code blocks or backticks."
        )
        
        prompt = f"Telemetry Payload: {json.dumps(data)}"
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.7,
                system_instruction=system_instruction,
            )
        )
        
        # 🚀 Clean the output and parse it safely
        raw_text = response.text.strip()
        raw_text = re.sub(r"^```json\s*", "", raw_text, flags=re.IGNORECASE)
        raw_text = re.sub(r"^```\s*", "", raw_text)
        raw_text = re.sub(r"\s*```$", "", raw_text).strip()
        
        suggestions = json.loads(raw_text)
        
        if isinstance(suggestions, list):
            print(json.dumps(suggestions))
        elif isinstance(suggestions, dict):
            # Failsafe if Gemini wraps the array in an object key
            vals = list(suggestions.values())
            if vals and isinstance(vals[0], list):
                print(json.dumps(vals[0]))
            else:
                print(json.dumps([str(v) for v in vals]))
        else:
            print(json.dumps([str(suggestions)]))
            
    except Exception:
        # 🚀 The Failsafe: If Gemini drops the connection or hits a limit, return the math logic
        print(json.dumps(fallback_logic(data)))

if __name__ == "__main__":
    main()