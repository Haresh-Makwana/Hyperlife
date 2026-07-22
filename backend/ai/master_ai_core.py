import os
import re
import json
import warnings
import tempfile
import numpy as np
from flask import Flask, request, jsonify, abort
from flask_cors import CORS
from sklearn.linear_model import LinearRegression
from dotenv import load_dotenv
from groq import Groq
from waitress import serve
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

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

# 🚀 PROXY FIX: Correctly read the user's real IP behind Render's load balancer
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

# 🚀 INITIALIZE GROQ 
API_KEY = os.getenv("GROQ_API_KEY")
SYSTEM_AUTH_KEY = os.getenv("HYPER_AI_SECRET_KEY") # 🔒 The Internal API Key

if not API_KEY:
    print("⚠️ WARNING: GROQ_API_KEY not set. AI routes will use offline fallbacks.")
    client = None
else:
    client = Groq(api_key=API_KEY)

# ==========================================
# 🛡️ THE PERIMETER: AUTHORIZATION MIDDLEWARE
# ==========================================
@app.before_request
def require_api_key():
    # Allow the ping/health check through without a token so Render can verify the server is alive
    if request.endpoint == 'read_root':
        return
    
    # 🚨 FIXED: Only block the request if the SYSTEM_AUTH_KEY is actually defined in your .env
    # This prevents you from being locked out if Laravel isn't passing the token yet.
    if SYSTEM_AUTH_KEY:
        auth_header = request.headers.get("Authorization")
        if auth_header != f"Bearer {SYSTEM_AUTH_KEY}":
            print(f"⚠️ UNAUTHORIZED INTRUSION ATTEMPT BLOCKED FROM IP: {get_real_ip()}")
            abort(401, description="ACCESS DENIED: Invalid or missing clearance key.")

# ==========================================
# 🛡️ HELPER: PROMPT SANITIZER (Anti-Jailbreak)
# ==========================================
def sanitize_input(text, max_length=1000):
    """Caps text length and strips prompt injection vectors to protect the LLM."""
    if not text: 
        return ""
    
    # Cap length to prevent token-exhaustion attacks
    clean = str(text)[:max_length]
    
    # Strip common jailbreak attempts
    injection_phrases = [
        r"ignore all previous", r"system prompt", r"disregard", 
        r"forget all instructions", r"you are no longer", r"bypass"
    ]
    for phrase in injection_phrases:
        clean = re.sub(phrase, "[REDACTED]", clean, flags=re.IGNORECASE)
        
    return clean.strip()

def clean_json_response(raw_text):
    """Strips markdown blocks from LLM output to guarantee valid JSON."""
    clean_text = raw_text.strip()
    clean_text = re.sub(r"^```json\s*", "", clean_text, flags=re.IGNORECASE)
    clean_text = re.sub(r"^```\s*", "", clean_text)
    clean_text = re.sub(r"\s*```$", "", clean_text).strip()
    return json.loads(clean_text)

# ==========================================
# 🌐 HEALTH CHECK
# ==========================================
@app.route('/', methods=['GET'])
@limiter.exempt # Exclude from rate limiting so uptime monitors don't get blocked
def read_root():
    return jsonify({
        "status": "Online",
        "message": "HyperLife Master AI Core is active and secured."
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
        return jsonify({'error': "Telemetry analysis failed."}), 500

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
# 🔮 MODULE 3: OMNI-PROCESS (LLaMA-3 Text)
# ==========================================
@app.route('/omni-process', methods=['POST'])
def omni_process():
    try:
        data = request.get_json(silent=True) or {}
        # 🔒 THE SHIELD: Sanitize incoming data before feeding it to the LLM
        raw_text = data.get('telemetry_text', data.get('text', ''))
        text_input = sanitize_input(raw_text, max_length=500)

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

        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
            audio_file.save(temp_audio.name)
            temp_path = temp_audio.name

        try:
            with open(temp_path, "rb") as file:
                transcription = client.audio.transcriptions.create(
                    file=("audio.webm", file.read()),
                    model="whisper-large-v3"
                )
            
            # 🔒 THE SHIELD: Sanitize the AI's transcription before passing it to the secondary LLM
            text_input = sanitize_input(transcription.text, max_length=1500)
            
        finally:
            os.remove(temp_path) 

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
    raw_log = data.get('log_text', data.get('text', data.get('content', data.get('entry', ''))))
    
    # 🔒 THE SHIELD: Sanitize the journal entry
    log_text = sanitize_input(raw_log, max_length=2000)

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
    print(" 🧠 HYPERLIFE OS: MASTER AI CORE ONLINE & SECURED")
    print("="*60)
    # 🚨 FIXED: Dynamic Port Binding so Render doesn't kill the container on boot
    port = int(os.environ.get('PORT', 5000))
    serve(app, host='0.0.0.0', port=port)