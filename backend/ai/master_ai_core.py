import os
import re
import json
import warnings
import tempfile
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.linear_model import LinearRegression
from dotenv import load_dotenv
from groq import Groq
from waitress import serve

# 🚀 INITIALIZE ENVIRONMENT
warnings.filterwarnings('ignore')
load_dotenv()

app = Flask(__name__)
CORS(app) # Allow frontend/backend connections

# 🚀 INITIALIZE GROQ (Bypasses Gemini 429 Rate Limits)
API_KEY = os.getenv("GROQ_API_KEY")
if not API_KEY:
    print("⚠️ WARNING: GROQ_API_KEY not set. AI routes will use offline fallbacks.")
    client = None
else:
    client = Groq(api_key=API_KEY)

# ==========================================
# 🌐 HEALTH CHECK
# ==========================================
@app.route('/', methods=['GET'])
def read_root():
    return jsonify({
        "status": "Online",
        "message": "HyperLife Master AI Core is active."
    }), 200

# ==========================================
# 🧠 MODULE 1: THE SENTIENT CORE (Heuristics)
# ==========================================
def analyze_telemetry(activities):
    if not activities or len(activities) == 0:
        return "Awaiting data. Let's log some activities to get started!"

    total_mood, total_energy, text_corpus = 0, 0, ""

    for act in activities:
        total_mood += act.get('mood_level', 5)
        total_energy += act.get('energy_level', 5)
        text_corpus += f" {act.get('title', '')} {act.get('description', '')} {act.get('notes', '')}".lower()

    avg_mood = total_mood / len(activities)
    avg_energy = total_energy / len(activities)

    warnings_list, praises = [], []

    if re.search(r'\b(junk food|fast food|burger|pizza|candy)\b', text_corpus):
        warnings_list.append("Make sure to balance your diet with some healthy fuel today!")
    if re.search(r'\b(scroll|scrolling|tiktok|instagram|doomscroll)\b', text_corpus):
        warnings_list.append("Try to limit your screen time and give your eyes a break.")
    if re.search(r'\b(skip|skipped|procrastinate|lazy)\b', text_corpus):
        warnings_list.append("Don't let procrastination win today. You've got this!")

    if re.search(r'\b(gym|workout|run|lift|train)\b', text_corpus):
        praises.append("Great job staying active and taking care of your body!")
    if re.search(r'\b(read|study|code|build|learn)\b', text_corpus):
        praises.append("Love to see you learning and expanding your mind. Keep it up!")
    if re.search(r'\b(water|hydrate|sleep|rest)\b', text_corpus):
        praises.append("Awesome job prioritizing your rest and recovery.")

    if avg_energy <= 4.0:
        return f"It looks like your energy is running low ({avg_energy:.1f}/10). Make sure to prioritize rest tonight!"
    elif avg_mood <= 4.0:
        return f"Your mood has been a bit low lately ({avg_mood:.1f}/10). Take some time for yourself to relax and recharge."
    else:
        if warnings_list: return f"Just a quick tip: {warnings_list[0]}"
        elif praises: return f"You are doing great! {praises[0]}"
        else:
            if avg_energy > 7.5 and avg_mood > 7.5: return "You are crushing it right now! Keep riding this positive wave."
            else: return f"You're maintaining a solid pace. Energy is at {avg_energy:.1f}/10. Keep up the good work!"

@app.route('/sentient-analysis', methods=['POST'])
def sentient_analysis():
    try:
        data = request.get_json()
        activities = data.get('activities', [])
        insight = analyze_telemetry(activities)
        return jsonify({'insight': insight}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==========================================
# ⚙️ MODULE 2: NEURAL ENGINE (Machine Learning)
# ==========================================
@app.route('/predict', methods=['POST'])
def predict():
    try:
        req_data = request.get_json(silent=True) or {}
        data = req_data.get('activities', [])

        if not isinstance(data, list) or len(data) < 3:
            return jsonify({
                "insight": "Log at least 3 activities in your Universe today to unlock your daily personalized bonus!"
            }), 200

        moods, energies = [], []
        for a in reversed(data):
            try:
                moods.append(float(a.get('mood_level', 0)))
                energies.append(float(a.get('energy_level', 0)))
            except:
                moods.append(0.0)
                energies.append(0.0)

        X = np.array(range(len(moods))).reshape(-1, 1)

        mood_model, energy_model = LinearRegression()
        mood_model.fit(X, moods)
        energy_model.fit(X, energies)

        next_step = np.array([[len(moods)]])
        pred_mood = float(mood_model.predict(next_step)[0])
        pred_energy = float(energy_model.predict(next_step)[0])

        mood_trend = float(mood_model.coef_[0])
        energy_trend = float(energy_model.coef_[0])

        if pred_energy < 4.0 and energy_trend < 0:
            insight = f"Energy dip predicted. Make sure you plan for some downtime and rest today."
        elif pred_mood < 5.0 and mood_trend < 0:
            insight = "Looks like a slight mood dip is coming. Try doing something fun or relaxing to boost your spirits!"
        elif mood_trend > 0 and energy_trend > 0:
            insight = "Your mood and energy are trending upwards! It's a great time to tackle a difficult task."
        elif pred_mood >= 7.0 and pred_energy >= 7.0:
            insight = "You are in a peak state of flow right now! Maintain your current habits."
        else:
            insight = "Your routines are keeping you incredibly stable. Keep logging your progress!"

        return jsonify({
            "insight": insight,
            "prediction": {"mood": round(pred_mood, 2), "energy": round(pred_energy, 2)},
            "trend": {"mood_trend": round(mood_trend, 3), "energy_trend": round(energy_trend, 3)}
        }), 200

    except Exception as e:
        print(f"[ERROR] Neural Engine Failure: {str(e)}")
        return jsonify({"insight": "The AI is analyzing your data. Check back soon!"}), 500

# ==========================================
# 🛠️ HELPER: JSON CLEANER
# ==========================================
def clean_json_response(raw_text):
    """Strips markdown blocks from LLM output to guarantee valid JSON."""
    clean_text = raw_text.strip()
    clean_text = re.sub(r"^```json\s*", "", clean_text, flags=re.IGNORECASE)
    clean_text = re.sub(r"^```\s*", "", clean_text)
    clean_text = re.sub(r"\s*```$", "", clean_text).strip()
    return json.loads(clean_text)

# ==========================================
# 🔮 MODULE 3: OMNI-PROCESS (LLaMA-3 Text)
# ==========================================
@app.route('/omni-process', methods=['POST'])
def omni_process():
    try:
        data = request.get_json(silent=True) or {}
        text_input = data.get('telemetry_text', data.get('text', ''))

        if not client:
            raise Exception("API Key missing.")

        prompt = f"""
        You are the friendly and supportive AI coach of HyperLife OS, a gamified self-improvement system.
        Analyze this activity: "{text_input}"

        Output ONLY a JSON object. Do NOT use markdown blocks. Use this exact structure:
        {{
            "domain": "health or finance or knowledge or productivity or creativity or general",
            "analysis": "Max 2 sentences of supportive feedback, calling the user 'Operator'.",
            "gamification": {{
                "xp_gained": <integer between 5 and 30>
            }}
        }}
        """

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )

        result = clean_json_response(response.choices[0].message.content)
        return jsonify(result), 200

    except Exception as e:
        print(f"[ERROR] Omni-Process: {str(e)}")
        return jsonify({
            "analysis": "Your activity has been safely logged in the system.",
            "gamification": {"xp_gained": 10}
        }), 200

# ==========================================
# 🎙️ MODULE 3.5: OMNI-PROCESS AUDIO (Whisper AI)
# ==========================================
@app.route('/omni-process-audio', methods=['POST'])
def omni_process_audio():
    try:
        if 'audio' not in request.files:
            raise Exception("No audio file found.")

        audio_file = request.files['audio']
        
        if not client:
            raise Exception("API Key missing.")

        # 1. Save browser audio to temp file for Whisper
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
            audio_file.save(temp_audio.name)
            temp_path = temp_audio.name

        try:
            # 2. Whisper Transcription
            with open(temp_path, "rb") as file:
                transcription = client.audio.transcriptions.create(
                    file=("audio.webm", file.read()),
                    model="whisper-large-v3"
                )
            text_input = transcription.text
        finally:
            os.remove(temp_path) # Cleanup

        # 3. LLaMA-3 XP Scoring
        prompt = f"""
        You are the friendly AI coach of HyperLife OS. 
        I am giving you an audio transcription of my daily log: "{text_input}"

        Output ONLY a JSON object. Do NOT use markdown. Use this exact structure:
        {{
            "analysis": "Max 2 sentences of supportive feedback addressing me as 'Operator'.",
            "gamification": {{
                "xp_gained": <integer between 5 and 30 based on the effort>
            }}
        }}
        """

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )

        result = clean_json_response(response.choices[0].message.content)
        result['transcription'] = text_input 
        
        return jsonify(result), 200

    except Exception as e:
        print(f"[ERROR] Omni-Process Audio: {str(e)}")
        return jsonify({
            "transcription": "Encrypted Voice Log Received",
            "analysis": "Your voice log was saved, but the transcriber is resting. XP awarded!",
            "gamification": {"xp_gained": 10}
        }), 200

# ==========================================
# 🧠 MODULE 4: THE PSYCH-EVAL (Captain's Log)
# ==========================================
@app.route('/psych-eval', methods=['POST'])
def psych_eval():
    data = request.get_json(silent=True) or {}
    log_text = data.get('log_text', data.get('text', data.get('content', data.get('entry', ''))))

    if not log_text:
        return jsonify({
            "sentiment_score": 5, 
            "evaluation": "Please write something about your day so I can help analyze your mood!"
        }), 200

    try:
        if not client:
            raise Exception("API Key Missing")

        prompt = f"""
        You are the clinical AI coach of HyperLife OS. 
        Analyze this journal entry: "{log_text}"

        Output ONLY a JSON object. Do NOT use markdown blocks. Use this structure:
        {{
            "sentiment_score": <integer from 1 to 10>,
            "evaluation": "2-3 sentences of empathetic feedback, calling the user 'Operator'."
        }}
        """

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )

        result = clean_json_response(response.choices[0].message.content)
        return jsonify({
            "sentiment_score": result.get("sentiment_score", 5),
            "evaluation": result.get("evaluation", "Log safely recorded.")
        }), 200

    except Exception as e:
        print(f"[ERROR] Psych-Eval: {str(e)}")
        return jsonify({
            "sentiment_score": 5,
            "evaluation": "Thanks for checking in, Operator. Keep up your habits!"
        }), 200

# ==========================================
# 🚀 BOOT SEQUENCE
# ==========================================
if __name__ == '__main__':
    print("\n" + "="*60)
    print(" 🧠 HYPERLIFE OS: MASTER AI CORE ONLINE (PORT 5000)")
    print("="*60)
    serve(app, host='0.0.0.0', port=5000)