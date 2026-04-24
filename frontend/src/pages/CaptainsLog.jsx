import React, { useState, useEffect, useCallback } from "react";
import { getToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import "../styles/CaptainsLog.css";

const Typewriter = ({ text }) => {
    const [displayed, setDisplayed] = useState("");
    
    useEffect(() => {
        setDisplayed("");
        let i = 0;
        const interval = setInterval(() => {
            setDisplayed(text.substring(0, i));
            i++;
            if (i > text.length) clearInterval(interval);
        }, 20); 
        return () => clearInterval(interval);
    }, [text]);

    return (
        <p className="eval-text">
            "{displayed}"
            {displayed.length < text.length && <span className="cursor"></span>}
        </p>
    );
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="log-tooltip">
                <p className="t-date">{payload[0].payload.date}</p>
                <p className="t-score">Mood Score: <span>{payload[0].value} / 10</span></p>
                <p className="t-eval">"{payload[0].payload.ai_evaluation}"</p>
            </div>
        );
    }
    return null;
}

export default function CaptainsLog() {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [currentEntry, setCurrentEntry] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [latestEval, setLatestEval] = useState(null);

    const [isListening, setIsListening] = useState(false);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    const fetchData = useCallback(async () => {
        const token = getToken();
        if (!token) { navigate("/login"); return; }
        try {
            const res = await fetch("http://127.0.0.1:8000/api/journal", {
                headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
            });
            if (res.ok) {
                const data = await res.json();
                const formattedData = data.map(log => ({
                    ...log,
                    date: new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                }));
                setLogs(formattedData);
                if (formattedData.length > 0) {
                    setLatestEval(formattedData[formattedData.length - 1]);
                }
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [navigate]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const toggleVoice = () => {
        if (!SpeechRecognition) { alert("Neural Voice Uplink not supported. Try Chrome."); return; }
        if (isListening) return; 
        
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            setCurrentEntry(prev => prev + (prev.length > 0 && !prev.endsWith(' ') ? ' ' : '') + transcript);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
    };

    // 🚀 THE SECURE FIX: Routing exclusively through Laravel
    const handleSubmit = async () => {
        if (!currentEntry.trim()) return;
        setIsAnalyzing(true);
        
        try {
            const res = await fetch("http://127.0.0.1:8000/api/journal", {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${getToken()}`, 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({ log_text: currentEntry })
            });

            if (res.ok) {
                const data = await res.json();
                setCurrentEntry("");
                fetchData();
                setLatestEval(data.log); 
            } else {
                alert("Backend Error: Could not process request.");
            }
        } catch (err) { 
            alert("Network Error: Laravel backend is offline."); 
        } finally { 
            setIsAnalyzing(false); 
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Purge this memory from the matrix?")) return;
        try {
            await fetch(`http://127.0.0.1:8000/api/journal/${id}`, {
                method: "DELETE", headers: { "Authorization": `Bearer ${getToken()}` }
            });
            fetchData();
        } catch (err) {}
    };

    if (loading) return <div className="log-wrapper center">BOOTING CLINICAL AI...</div>;

    return (
        <div className="log-wrapper">
            <div className="log-header">
                <h1>CAPTAIN'S LOG</h1>
                <p>Record your telemetry. The AI will evaluate your psychological baseline.</p>
            </div>

            <div className="log-grid">
                <div className="log-sidebar">
                    <div className="chart-container">
                        <h3>Psychological Trend</h3>
                        <div className="chart-box">
                            {logs.length < 2 ? (
                                <div className="empty-chart">Insufficient data points to map trend.</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={logs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                                        <XAxis dataKey="date" stroke="#8b92a5" fontSize={11} tickLine={false} axisLine={false}/>
                                        <YAxis stroke="#8b92a5" fontSize={11} domain={[0, 10]} tickLine={false} axisLine={false}/>
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(168,85,247,0.5)', strokeWidth: 2 }} />
                                        <Area type="monotone" dataKey="sentiment_score" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    <div className="history-container">
                        <h3>Memory Matrix</h3>
                        <div className="history-list">
                            {logs.slice().reverse().map(log => (
                                <div key={log.id} className="history-card">
                                    <div className="h-header">
                                        <span className="h-date">{log.date}</span>
                                        <span className={`h-score ${log.sentiment_score >= 7 ? 'high' : log.sentiment_score <= 4 ? 'low' : 'mid'}`}>
                                            MOOD: {log.sentiment_score}/10
                                        </span>
                                    </div>
                                    <p className="h-text">"{log.log_text.substring(0, 85)}{log.log_text.length > 85 ? '...' : ''}"</p>
                                    <button className="h-delete" onClick={() => handleDelete(log.id)}>PURGE</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="log-main">
                    <div className="editor-container">
                        <button className={`mic-btn ${isListening ? 'recording' : ''}`} onClick={toggleVoice} title="Initiate Voice Uplink">🎤</button>
                        <textarea 
                            className="log-textarea" 
                            placeholder={isListening ? "Listening to audio input..." : "How was your day? Log your thoughts here..."}
                            value={currentEntry}
                            onChange={(e) => setCurrentEntry(e.target.value)}
                            disabled={isAnalyzing}
                        ></textarea>
                        
                        <div className="editor-footer">
                            <span className="word-count">{currentEntry.length} / 2000 chars</span>
                            <button className="submit-btn" onClick={handleSubmit} disabled={isAnalyzing || !currentEntry.trim()}>
                                {isAnalyzing ? "ANALYZING..." : "COMMIT LOG"}
                            </button>
                        </div>
                    </div>

                    {latestEval && (
                        <div className="ai-eval-container">
                            <div className="eval-header">
                                <div className="pulse-dot"></div>
                                <h3>CLINICAL AI REFLECTION</h3>
                            </div>
                            
                            <Typewriter text={latestEval.ai_evaluation} />
                            
                            <div className="eval-footer">
                                <span>Detected Baseline Score: 
                                    <strong style={{
                                        color: latestEval.sentiment_score >= 7 ? '#00ffe7' : latestEval.sentiment_score <= 4 ? '#ff003c' : '#ffb86c', 
                                        marginLeft: '8px', fontSize: '1.1rem'
                                    }}>
                                        {latestEval.sentiment_score} / 10
                                    </strong>
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}