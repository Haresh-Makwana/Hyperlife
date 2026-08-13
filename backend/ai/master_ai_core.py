import os
import re
import json
import time
import warnings
import tempfile
import numpy as np
from flask import Flask, request, jsonify, abort
from flask_cors import CORS
from sklearn.linear_model import LinearRegression
from dotenv import load_dotenv
from waitress import serve
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# 🚀 NEW GOOGLE GENAI SDK IMPORTS
from google import genai
from google.genai import types

# 🚀 GROQ RETAINED FOR WHISPER AUDIO
from groq import Groq

# 🚀 INITIALIZE ENVIRONMENT
warnings.filterwarnings('ignore')
load_dotenv()

app = Flask(__name__)

# 🔒 THE SHIELD 1: Strict CORS
CORS(app, origins=[
    os.getenv("FRONTEND_URL", "https://hyperlife-lemon.vercel.app"),
    os.getenv("BACKEND_URL", "https://hyperlife-backend.onrender.com"),
    "http://localhost:5173",
    "http://localhost:3000"
])

def get_real_ip():
    if request.headers.get("X-Forwarded-For"):
        return request.headers.get("X-Forwarded-For").split(',')[0].strip()
    return request.remote_addr

# 🔒 THE SHIELD 2: Rate Limiting
limiter = Limiter(
    get_real_ip,
    app=app,
    default_limits=["100 per day", "20 per hour"],
    storage_uri="memory://"
)

# 🚀 INITIALIZE API CLIENTS
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
GROQ_KEY = os.getenv("GROQ_API_KEY")
SYSTEM_AUTH_KEY = os.getenv("HYPER_AI_SECRET_KEY")

if not GEMINI_KEY:
    print("⚠️ WARNING: GEMINI_API_KEY not set. AI routes will use offline fallbacks.")
    genai_client = None
else:
    # Use the new SDK client initialization
    genai_client = genai.Client(api_key=GEMINI_KEY)

if not GROQ_KEY:
    print("ℹ️ NOTE: GROQ_API_KEY not set. Voice transcription will use offline fallback.")
    groq_client = None
else:
    groq_client = Groq(api_key=GROQ_KEY)

@app.before_request
def require_api_key():
    if request.endpoint == 'read_root':
        return
    
    if SYSTEM_AUTH_KEY:
        auth_header = request.headers.get("Authorization")
        if auth_header != f"Bearer {SYSTEM_AUTH_KEY}":
            print(f"⚠️ UNAUTHORIZED INTRUSION ATTEMPT BLOCKED FROM IP: {get_real_ip()}")
            abort(401, description="ACCESS DENIED: Invalid or missing clearance key.")

def sanitize_input(text, max_length=1500):
    if not text: 
        return ""
    clean = str(text)[:max_length]
    injection_phrases = [
        r"ignore all previous", r"system prompt", r"disregard", 
        r"forget all instructions", r"you are no longer", r"bypass"
    ]
    for phrase in injection_phrases:
        clean = re.sub(phrase, "[REDACTED]", clean, flags=re.IGNORECASE)
    return clean.strip()

def clean_json_response(raw_text):
    """Strips markdown code blocks from LLM output to guarantee valid JSON."""
    clean_text = raw_text.strip()
    clean_text = re.sub(r"^```json\s*", "", clean_text, flags=re.IGNORECASE)
    clean_text = re.sub(r"^```\s*", "", clean_text)
    clean_text = re.sub(r"\s*```$", "", clean_text).strip()
    return json.loads(clean_text)

# ==========================================
# 🛡️ HELPER: UNSTOPPABLE GEMINI LLM CALLER
# ==========================================
def generate_gemini_json(prompt, system_instruction="", max_retries=3):
    """
    Executes Gemini completions with exponential backoff retries and native JSON mode
    using the new google-genai SDK.
    """
    if not genai_client:
        raise Exception("Gemini API key missing.")

    for attempt in range(1, max_retries + 1):
        try:
            response = genai_client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.7,
                    system_instruction=system_instruction,
                )
            )
            # The new SDK formats nicely, but we clean it to be 100% crash-proof
            return clean_json_response(response.text)

        except Exception as e:
            print(f"🔥 [Gemini Error] Attempt {attempt}/{max_retries}: {e}")

        if attempt < max_retries:
            time.sleep(2 ** (attempt - 1))

    raise Exception("All Gemini API retries exhausted.")

# ==========================================
# 🌐 HEALTH CHECK
# ==========================================
@app.route('/', methods=['GET'])
@limiter.exempt
def read_root():
    return jsonify({
        "status": "Online",
        "engine": "Gemini 2.5 Flash",
        "message": "HyperLife Master AI Core is active and secured."
    }), 200

# ==========================================
# 🔮 MODULE 3: OMNI-PROCESS (Gemini 2.5 Flash)
# ==========================================
@app.route('/omni-process', methods=['POST'])
def omni_process():
    try:
        data = request.get_json(silent=True) or {}
        raw_text = data.get('telemetry_text', data.get('text', ''))
        text_input = sanitize_input(raw_text, max_length=500)

        system_instruction = """
        You are the friendly, atmospheric, and supportive AI coach of a gamified self-improvement system.
        Return ONLY a JSON object with this exact schema:
        {
            "domain": "health" or "finance" or "knowledge" or "productivity" or "creativity" or "general",
            "analysis": "Max 2 sentences of supportive feedback, addressing the user as 'Operator'.",
            "gamification": {
                "xp_gained": <integer between 5 and 30>
            }
        }
        """

        user_prompt = f'Analyze this activity: "{text_input}"'
        result = generate_gemini_json(user_prompt, system_instruction)
        return jsonify(result), 200

    except Exception as e:
        print(f"[ERROR] Omni-Process Fallback: {str(e)}")
        return jsonify({
            "domain": "general",
            "analysis": "Your activity has been safely logged in the matrix.",
            "gamification": {"xp_gained": 10}
        }), 200

# ==========================================
# 🎙️ MODULE 3.5: OMNI-PROCESS AUDIO (Whisper + Gemini)
# ==========================================
@app.route('/omni-process-audio', methods=['POST'])
def omni_process_audio():
    try:
        if 'audio' not in request.files:
            raise Exception("No audio file found.")

        audio_file = request.files['audio']
        transcribed_text = "Voice telemetry logged."

        # Transcribe audio if Groq Whisper is available
        if groq_client:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
                audio_file.save(temp_audio.name)
                temp_path = temp_audio.name

            try:
                with open(temp_path, "rb") as file:
                    transcription = groq_client.audio.transcriptions.create(
                        file=("audio.webm", file.read()),
                        model="whisper-large-v3"
                    )
                transcribed_text = sanitize_input(transcription.text, max_length=1500)
            finally:
                os.remove(temp_path)

        system_instruction = """
        You are the friendly AI coach of HyperLife OS.
        
        CRITICAL: Output ONLY a raw valid JSON object.
        JSON Structure:
        {
            "analysis": "Max 2 sentences of supportive feedback addressing the user as 'Operator'.",
            "gamification": {
                "xp_gained": <integer between 5 and 30 based on effort>
            }
        }
        """

        user_prompt = f'I am giving you an audio transcription of my daily log: "{transcribed_text}"'
        result = generate_gemini_json(user_prompt, system_instruction)
        result['transcription'] = transcribed_text

        return jsonify(result), 200

    except Exception as e:
        print(f"[ERROR] Omni-Process Audio Fallback: {str(e)}")
        return jsonify({
            "transcription": "Encrypted Voice Log Received",
            "analysis": "Your voice log was saved, but the neural transcriber is calibrating. XP awarded!",
            "gamification": {"xp_gained": 10}
        }), 200

# ==========================================
# 🧠 MODULE 4: THE PSYCH-EVAL (Gemini 2.5 Flash)
# ==========================================
@app.route('/psych-eval', methods=['POST'])
def psych_eval():
    data = request.get_json(silent=True) or {}
    raw_log = data.get('log_text', data.get('text', data.get('content', data.get('entry', ''))))
    log_text = sanitize_input(raw_log, max_length=2000)

    if not log_text:
        return jsonify({
            "sentiment_score": 5, 
            "evaluation": "Please write something about your day so I can help analyze your mood!"
        }), 200

    try:
        system_instruction = """
        You are the clinical AI coach of a life management system.
        Return ONLY a JSON object with this exact schema:
        {
            "sentiment_score": <integer from 1 to 10>,
            "evaluation": "2-3 sentences of empathetic feedback, calling the user 'Operator'."
        }
        """

        user_prompt = f'Analyze this journal entry: "{log_text}"'
        result = generate_gemini_json(user_prompt, system_instruction)

        return jsonify({
            "sentiment_score": result.get("sentiment_score", 5),
            "evaluation": result.get("evaluation", "Log safely recorded in system.")
        }), 200

    except Exception as e:
        print(f"[ERROR] Psych-Eval Fallback: {str(e)}")
        return jsonify({
            "sentiment_score": 5,
            "evaluation": "Thanks for checking in, Operator. Keep up your habits!"
        }), 200

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

        mood_model, energy_model = LinearRegression(), LinearRegression()
        mood_model.fit(X, moods)
        energy_model.fit(X, energies)

        next_step = np.array([[len(moods)]])
        pred_mood = float(mood_model.predict(next_step)[0])
        pred_energy = float(energy_model.predict(next_step)[0])

        mood_trend = float(mood_model.coef_[0])
        energy_trend = float(energy_model.coef_[0])

        if pred_energy < 4.0 and energy_trend < 0:
            insight = "Energy dip predicted. Make sure you plan for some downtime and rest today."
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
# 🚀 BOOT SEQUENCE
# ==========================================
if __name__ == '__main__':
    print("\n" + "="*60)
    print(" 🧠 HYPERLIFE OS: MASTER AI CORE (GEMINI) ONLINE")
    print("="*60)
    port = int(os.environ.get('PORT', 5000))
    serve(app, host='0.0.0.0', port=port)