import { useEffect, useState, useRef, useCallback } from "react";
import { getToken, removeToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// 🚀 IMPORT THE CROPPER
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import VoiceCommandModal from "./VoiceCommandModal";
import LevelUpOverlay from "../components/LevelUpOverlay"; 
import PersonalUniverse from "../components/PersonalUniverse";
import BlackoutScreen from "../components/BlackoutScreen"; 
import SyndicateGrid from "../components/SyndicateGrid"; 
import "../styles/UserDashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const dashboardRef = useRef();
  
  const [user, setUser] = useState({ name: "Loading...", email: "...", level: 1, xp: 0, avatar_url: null, role: 'operator' });
  const [stats, setStats] = useState({ total: 0, avgMood: 0, avgEnergy: 0, daysAnalyzed: 7 });
  const [activities, setActivities] = useState([]);
  
  const [weeklyData, setWeeklyData] = useState([]);
  const [systemInsight, setSystemInsight] = useState("Analyzing your recent activities...");

  const [systemDirective, setSystemDirective] = useState(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const [isBlackout, setIsBlackout] = useState(false); 

  const [omniText, setOmniText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [gamification, setGamification] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  const fileInputRef = useRef(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // 🚀 NEW CROPPER STATES
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState("");
  const imgRef = useRef(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const currentRole = user.role?.toLowerCase() || 'operator';
  const isCommanderPlus = ['commander', 'syndicate', 'overwatch', 'admin'].includes(currentRole);

  const fetchDashboardData = useCallback(async () => {
    const token = getToken();
    if (!token) { navigate("/login"); return; }

    try {
      const cacheBuster = `?t=${new Date().getTime()}`;
      const headers = { "Authorization": `Bearer ${token}`, "Accept": "application/json", "Cache-Control": "no-cache" };

      const userRes = await fetch(`http://127.0.0.1:8000/api/me${cacheBuster}`, { headers });
      if (!userRes.ok) throw new Error("Auth Failed");
      const userJson = await userRes.json();
      if (userJson.role === 'admin') { navigate("/admin"); return; }
      
      const avatarUrl = userJson.avatar ? `http://127.0.0.1:8000/storage/${userJson.avatar}` : null;
      setUser(prev => ({ ...prev, ...userJson, avatar_url: avatarUrl }));

      const statsRes = await fetch(`http://127.0.0.1:8000/api/activity-stats${cacheBuster}`, { headers });
      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        setStats({
          total: statsJson.total_activities ?? statsJson.total ?? 0,
          avgMood: statsJson.avg_mood ?? 0,
          avgEnergy: statsJson.avg_energy ?? 0,
          daysAnalyzed: statsJson.days_analyzed ?? 7
        });
        setUser(prev => ({ ...prev, xp: statsJson.user_xp !== undefined ? statsJson.user_xp : prev.xp, level: statsJson.user_level !== undefined ? statsJson.user_level : prev.level }));
      }

      const actRes = await fetch(`http://127.0.0.1:8000/api/activities${cacheBuster}`, { headers });
      let fetchedActivities = [];
      if (actRes.ok) {
        const actJson = await actRes.json();
        fetchedActivities = Array.isArray(actJson) ? actJson : (actJson.data || []);
        setActivities(fetchedActivities); 
      }

      const chartRes = await fetch(`http://127.0.0.1:8000/api/analytics/weekly${cacheBuster}`, { headers });
      if (chartRes.ok) {
        const chartJson = await chartRes.json();
        setWeeklyData(chartJson);
      }

      if (['commander', 'syndicate', 'overwatch', 'admin'].includes(userJson.role?.toLowerCase())) {
          const aiRes = await fetch(`http://127.0.0.1:8000/api/ai-suggestions`, { 
            method: 'POST',
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({ activities: fetchedActivities.slice(0, 10) }) 
          });
          if (aiRes.ok) {
            const insights = await aiRes.json();
            setSystemInsight(insights && insights.length > 0 ? insights[0] : "Complete more activities to receive personalized AI insights.");
          }
      }
    } catch (error) {
      removeToken(); navigate("/login");
    }
  }, [navigate]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  // 🚀 1. HANDLE FILE SELECTION & OPEN MODAL
  const handleAvatarSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Reset crop state
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
        setCropModalOpen(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // 🚀 2. CENTER THE DEFAULT CROPPER SQUARE
  const onImageLoad = (e) => {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 80 }, 1, width, height),
      width,
      height
    );
    setCrop(initialCrop);
  };

  // 🚀 3. EXTRACT THE CROPPED IMAGE USING HTML5 CANVAS
  const getCroppedImg = (image, cropConfig, fileName) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = cropConfig.width;
    canvas.height = cropConfig.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      cropConfig.x * scaleX,
      cropConfig.y * scaleY,
      cropConfig.width * scaleX,
      cropConfig.height * scaleY,
      0,
      0,
      cropConfig.width,
      cropConfig.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        blob.name = fileName;
        resolve(blob);
      }, 'image/jpeg');
    });
  };

  // 🚀 4. UPLOAD THE FINAL CROPPED IMAGE
  // 🚀 UPDATED: UPLOAD WITH CACHE-BUSTER & ERROR LOGGING
  const handleUploadCropped = async () => {
    if (!completedCrop || !imgRef.current) return;
    
    setIsUploadingAvatar(true);
    setCropModalOpen(false);

    try {
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop, "avatar.jpg");
      const formData = new FormData(); 
      formData.append("avatar", croppedBlob, "avatar.jpg");

      const res = await fetch("http://127.0.0.1:8000/api/profile/avatar", {
        method: "POST", 
        headers: { 
            "Authorization": `Bearer ${getToken()}`, 
            "Accept": "application/json" 
            // Note: DO NOT manually add "Content-Type" here. Fetch handles it for FormData.
        }, 
        body: formData
      });
      
      const data = await res.json();
      
      if (res.ok) {
          // 🚀 THE FIX: Add a timestamp to force the browser to load the NEW image
          const cacheBusterUrl = data.avatar_url + "?t=" + new Date().getTime();
          setUser(prev => ({ ...prev, avatar_url: cacheBusterUrl }));
      } else {
          console.error("Backend Error Details:", data);
          alert(`Backend Error: ${data.message}`);
      }
    } catch (err) { 
      console.error("Network Fetch Error:", err);
      alert("Network error while uploading avatar. Check console."); 
    } finally { 
      setIsUploadingAvatar(false); 
      if (fileInputRef.current) fileInputRef.current.value = ""; 
    }
  };

  const formatAiResponse = (rawAnalysis) => {
    if (!rawAnalysis) return { domain: 'System', insight: 'Activity recorded successfully.' };
    if (typeof rawAnalysis === 'string') return { domain: 'General', insight: rawAnalysis };
    return rawAnalysis;
  };

  const submitToOmniEngine = async (telemetryText) => {
    setIsProcessing(true); setAiResponse(null); setGamification(null); setShowVoiceModal(true); 
    try {
      const res = await fetch("http://127.0.0.1:8000/api/omni-process", {
        method: "POST", headers: { "Authorization": `Bearer ${getToken()}`, "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ telemetry_text: telemetryText })
      });
      const data = await res.json();
      if (res.ok) {
        setAiResponse(formatAiResponse(data.analysis)); 
        setGamification(data.gamification);
        setUser(prev => ({ ...prev, xp: data.gamification.total_xp, level: data.gamification.current_level }));
        setOmniText(""); fetchDashboardData(); 
      } else { setShowVoiceModal(false); alert(data.message || "Quick Add error."); }
    } catch (err) { setShowVoiceModal(false); alert("Network Error."); } 
    finally { setIsProcessing(false); }
  };

  const handleOmniSubmit = (e) => { e.preventDefault(); if (omniText.trim()) submitToOmniEngine(omniText); };

  const submitAudioToBackend = async (audioBlob) => {
    setIsProcessing(true); setAiResponse(null); setGamification(null);
    
    const formData = new FormData();
    formData.append("audio", audioBlob, "voice_command.webm");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/omni-process-audio", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${getToken()}`,
          "Accept": "application/json"
        },
        body: formData
      });
      
      const data = await res.json();
      if (res.ok) {
        setAiResponse(formatAiResponse(data.analysis)); 
        setGamification(data.gamification);
        setUser(prev => ({ ...prev, xp: data.gamification.total_xp, level: data.gamification.current_level }));
        fetchDashboardData(); 
      } else { 
        setShowVoiceModal(false); alert(data.message || "Audio processing error."); 
      }
    } catch (err) { setShowVoiceModal(false); alert("Network Error during audio upload."); } 
    finally { setIsProcessing(false); }
  };

  const startVoiceCommand = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        submitAudioToBackend(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
      setShowVoiceModal(true);

      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          stopVoiceCommand();
        }
      }, 8000);

    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Please allow microphone permissions to use voice commands.");
      setIsListening(false);
      setShowVoiceModal(false);
    }
  };

  const stopVoiceCommand = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const handleDeleteActivity = async (id) => {
    if (!window.confirm("Delete this activity? The XP earned will be removed.")) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/activities/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${getToken()}`, "Accept": "application/json" } });
      const data = await res.json();
      if (res.ok) {
        fetchDashboardData(); 
        if (data.gamification) {
          const xpChange = data.gamification.xp_reversed;
          if (data.gamification.level_status === -1) alert(`⚠️ Note: Your level has dropped to Level ${data.gamification.current_level}.`);
          else alert(`🗑️ Activity Deleted. XP Change: ${xpChange > 0 ? '+' : ''}${xpChange} XP.`);
        }
      } else { alert(`Server Error: ${data.error || data.message}`); }
    } catch (err) { alert("Network connection error."); }
  };

  const handleExportClick = (type) => {
      if (!isCommanderPlus) {
          if (window.confirm("Matrix Locked 🔒\nCommander Tier required to export telemetry data. Upgrade now?")) { navigate("/pricing"); }
          return;
      }
      if (type === 'csv') downloadCSV();
      if (type === 'pdf') downloadPDF();
  };

  const downloadCSV = () => {
    if (activities.length === 0) { alert("No telemetry data available to export."); return; }
    let csv = "Title,Description,Mental State,Physical Energy,Date\n";
    activities.forEach(a => { 
        const safeTitle = a.title ? a.title.replace(/"/g, '""') : '';
        const safeDesc = a.description ? a.description.replace(/"/g, '""') : '';
        csv += `"${safeTitle}","${safeDesc}",${a.mood_level},${a.energy_level},${new Date(a.created_at).toLocaleDateString()}\n`; 
    });
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" }); 
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); 
    link.href = url; 
    link.download = "HyperLife_Operator_Telemetry.csv"; 
    link.click();
  };

  const downloadPDF = () => {
    if (activities.length === 0) { alert("No telemetry data available to export."); return; }
    
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(18);
    doc.setTextColor(0, 255, 231); 
    doc.text("HyperLife OS: Operator Telemetry Log", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    
    doc.setDrawColor(50, 50, 50);
    doc.line(14, 32, pageWidth - 14, 32);

    let yPosition = 40;
    
    activities.forEach((act) => {
        if (yPosition > 270) { 
            doc.addPage(); 
            yPosition = 20; 
        }
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        doc.text(`[${new Date(act.created_at).toLocaleDateString()}] ${act.title}`, 14, yPosition);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Mental State: ${act.mood_level}/10  |  Physical Energy: ${act.energy_level}/10`, 120, yPosition);
        yPosition += 6;
        if (act.description) {
            doc.setFontSize(10);
            doc.setTextColor(80, 80, 80);
            const splitDesc = doc.splitTextToSize(`Notes: ${act.description}`, pageWidth - 28);
            doc.text(splitDesc, 14, yPosition);
            yPosition += (splitDesc.length * 5);
        }
        yPosition += 8;
        doc.setDrawColor(220, 220, 220);
        doc.line(14, yPosition - 4, pageWidth - 14, yPosition - 4);
    });

    doc.save("HyperLife_Operator_Telemetry.pdf");
  };

  const handleCloseModal = () => {
    if (isListening) stopVoiceCommand();
    setShowVoiceModal(false); 
    setAiResponse(null); 
    if (gamification && gamification.level_status === 1) {
        setNewLevel(gamification.current_level);
        setShowLevelUp(true);
    }
    setGamification(null);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'rgba(10, 13, 20, 0.95)', border: '1px solid rgba(0, 255, 231, 0.4)', padding: '12px 16px', borderRadius: '8px', boxShadow: '0 8px 25px rgba(0,255,231,0.2)', backdropFilter: 'blur(10px)' }}>
          <p style={{ color: '#fff', margin: '0 0 5px 0', fontWeight: '700', letterSpacing: '0.5px' }}>{label}</p>
          <p style={{ color: '#00ffe7', margin: 0, fontSize: '0.95rem', fontWeight: '600' }}>Activities: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="ud-wrapper">
      <style>{`
        .smooth-glass {
          background: rgba(13, 17, 26, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 20px;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .smooth-glass:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 255, 231, 0.05);
          border-color: rgba(0, 255, 231, 0.2);
        }
        .neon-input {
          transition: all 0.3s ease;
        }
        .neon-input:focus {
          box-shadow: 0 0 0 2px rgba(0, 255, 231, 0.2), inset 0 0 15px rgba(0, 255, 231, 0.05);
          border-color: rgba(0, 255, 231, 0.6) !important;
          background: rgba(0, 0, 0, 0.6) !important;
        }
        .action-btn-glow {
          transition: all 0.2s ease;
        }
        .action-btn-glow:hover {
          transform: scale(1.02);
          box-shadow: 0 8px 20px rgba(0, 255, 231, 0.25);
          filter: brightness(1.1);
        }
        .mic-hover:hover {
          transform: scale(1.15) rotate(5deg);
          background: rgba(0, 255, 231, 0.15) !important;
        }
        .dash-grid-top { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 24px; }
        .dash-grid-mid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 24px; }
        .dash-grid-bot { display: grid; grid-template-columns: 1fr 1.5fr; gap: 24px; margin-bottom: 40px; }
        @media (max-width: 1024px) { .dash-grid-mid, .dash-grid-bot { grid-template-columns: 1fr; } }
        .activity-scroll::-webkit-scrollbar { width: 6px; }
        .activity-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 8px; }
        .activity-scroll::-webkit-scrollbar-thumb { background: rgba(0, 255, 231, 0.3); border-radius: 8px; }
        .activity-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0, 255, 231, 0.6); }

        /* CROPPER MODAL STYLES */
        .crop-modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
          z-index: 9999; display: flex; align-items: center; justify-content: center;
          animation: fadeIn 0.2s ease;
        }
        .crop-modal-content {
          background: #0d111a; border: 1px solid #00ffe7; padding: 25px;
          border-radius: 16px; max-width: 90vw; max-height: 90vh;
          display: flex; flex-direction: column; align-items: center;
          box-shadow: 0 0 40px rgba(0, 255, 231, 0.2);
        }
        .ReactCrop__crop-selection { border: 2px solid #00ffe7 !important; }
      `}</style>

      <div className="ud-orb-1"></div>
      <div className="ud-orb-2"></div>

      {/* 🚀 HIDDEN INPUT NOW TRIGGERS THE CROPPER */}
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarSelect} style={{ display: "none" }} />

      {/* 🚀 THE NEW CROPPER MODAL */}
      {cropModalOpen && (
        <div className="crop-modal-overlay">
          <div className="crop-modal-content">
            <h3 style={{ color: '#fff', margin: '0 0 15px 0' }}>Adjust Profile Picture</h3>
            
            <div style={{ maxHeight: '60vh', overflow: 'hidden', borderRadius: '8px' }}>
              <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)} aspect={1} circularCrop>
                <img ref={imgRef} src={imgSrc} alt="Upload Preview" onLoad={onImageLoad} style={{ maxHeight: '60vh', maxWidth: '100%', objectFit: 'contain' }} />
              </ReactCrop>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '20px', width: '100%' }}>
              <button className="ud-btn ud-btn-outline" style={{ flex: 1 }} onClick={() => { setCropModalOpen(false); if (fileInputRef.current) fileInputRef.current.value = ""; }}>Cancel</button>
              <button className="ud-btn ud-btn-primary action-btn-glow" style={{ flex: 1 }} onClick={handleUploadCropped}>Confirm & Upload</button>
            </div>
          </div>
        </div>
      )}

      <div ref={dashboardRef} style={{ position: 'relative', zIndex: 10, maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Header & Level Info */}
        <div className="ud-header smooth-glass" style={{ marginBottom: '24px' }}>
          <div className="ud-profile-area">
            <div className="ud-avatar-ring" onClick={() => fileInputRef.current.click()} title="Change Profile Picture">
              <div className="ud-avatar">
                {isUploadingAvatar ? <div className="ud-avatar-loading"></div> : user.avatar_url ? <img src={user.avatar_url} alt="Profile" className="ud-avatar-image" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.name.charAt(0).toUpperCase()}
              </div>
              <div className="ud-avatar-overlay"><span style={{ fontSize: '1.5rem' }}>📷</span></div>
            </div>
            <div className="ud-welcome-text">
              <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 5px 0' }}>Welcome, <span className="ud-gradient-text">{user.name}</span></h1>
              <p className="ud-email" style={{ margin: 0, color: '#94a3b8' }}>{user.email} <span style={{ color: '#00ffe7', textTransform: 'uppercase', fontSize: '0.75rem', marginLeft: '10px', border: '1px solid rgba(0, 255, 231, 0.4)', background: 'rgba(0, 255, 231, 0.05)', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', letterSpacing: '1px' }}>{currentRole}</span></p>
            </div>
          </div>
          <div className="ud-level-hud">
            <div className="ud-level-top">
              <span style={{ fontSize: '1.1rem', fontWeight: '700' }}><span style={{ color: '#00ffe7', marginRight: '8px', textShadow: '0 0 10px #00ffe7' }}>✦</span> Level {user.level}</span>
              <span style={{ color: '#8b92a5', fontSize: '0.95rem', fontWeight: '600' }}>{user.xp} / 100 XP</span>
            </div>
            <div className="ud-xp-track" style={{ background: 'rgba(0,0,0,0.5)', height: '10px', borderRadius: '10px', overflow: 'hidden' }}>
              <div className="ud-xp-fill" style={{ width: `${user.xp}%`, background: 'linear-gradient(90deg, #00ffe7, #0077ff)', height: '100%', transition: 'width 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)', boxShadow: '0 0 15px rgba(0, 255, 231, 0.6)' }}></div>
            </div>
          </div>
        </div>

        {/* QUICK ADD FORM */}
        <div className="smooth-glass" style={{ padding: '30px', marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '1.3rem', color: '#fff', fontWeight: '700', letterSpacing: '0.5px' }}>Quick Add Activity</h2>
          <form onSubmit={handleOmniSubmit} style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            
            <div style={{ position: 'relative', flex: '1 1 300px', display: 'flex', alignItems: 'center' }}>
              <input 
                type="text" 
                value={omniText} 
                onChange={(e) => setOmniText(e.target.value)} 
                placeholder="e.g. 'I read 20 pages of a book today'" 
                disabled={isProcessing} 
                className="neon-input"
                style={{ 
                  width: '100%', padding: '18px 60px 18px 24px', borderRadius: '14px', 
                  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255, 255, 255, 0.1)', 
                  color: '#fff', fontSize: '1.1rem', outline: 'none', boxSizing: 'border-box'
                }} 
              />
              <button 
                type="button" onClick={isListening ? stopVoiceCommand : startVoiceCommand} 
                className={isListening ? "" : "mic-hover"}
                style={{ 
                  position: 'absolute', right: '12px',
                  background: isListening ? '#ff5f6d' : 'rgba(0, 255, 231, 0.05)',
                  border: isListening ? 'none' : '1px solid rgba(0, 255, 231, 0.2)',
                  color: isListening ? '#fff' : '#00ffe7', fontSize: '1.2rem', cursor: 'pointer',
                  width: '40px', height: '40px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  boxShadow: isListening ? '0 0 15px rgba(255, 95, 109, 0.6)' : 'none'
                }} 
                title={isListening ? "Stop Recording" : "Voice Command"}
              >
                {isListening ? "🛑" : "🎤"}
              </button>
            </div>

            <button type="submit" className="ud-btn ud-btn-primary action-btn-glow" disabled={isProcessing} style={{ minWidth: '160px', padding: '18px 24px', borderRadius: '14px', fontSize: '1.05rem', fontWeight: '700' }}>
              {isProcessing ? "Processing..." : "Save Activity"}
            </button>
          </form>
        </div>

        {/* Actions Bar */}
        <div className="ud-actions-bar smooth-glass" style={{ padding: '20px', marginBottom: '24px', background: 'rgba(13, 17, 26, 0.3)', justifyContent: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
          <button className="ud-btn ud-btn-primary action-btn-glow" onClick={() => navigate("/add-activity")}>+ Detailed Entry</button>
          <button className="ud-btn ud-btn-outline action-btn-glow" style={{ opacity: isCommanderPlus ? 1 : 0.6 }} onClick={() => handleExportClick('csv')}>
            {isCommanderPlus ? "CSV Export" : "🔒 CSV Export (Pro)"}
          </button>
          <button className="ud-btn ud-btn-outline action-btn-glow" style={{ opacity: isCommanderPlus ? 1 : 0.6 }} onClick={() => handleExportClick('pdf')}>
             {isCommanderPlus ? "PDF Export" : "🔒 PDF Export (Pro)"}
          </button>
        </div>

        {/* Top 3 Stats Grid */}
        <div className="dash-grid-top">
          <div className="smooth-glass" style={{ padding: '25px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="ud-stat-icon ud-icon-cyan" style={{ fontSize: '2rem', padding: '15px', borderRadius: '16px' }}>📊</div>
            <div><h3 style={{ margin: '0 0 5px 0', color: '#94a3b8', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Activities</h3><p style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: '#fff' }}>{stats.total}</p></div>
          </div>
          <div className="smooth-glass" style={{ padding: '25px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="ud-stat-icon ud-icon-purple" style={{ fontSize: '2rem', padding: '15px', borderRadius: '16px' }}>🧠</div>
            <div><h3 style={{ margin: '0 0 5px 0', color: '#94a3b8', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Avg Mood</h3><p style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: '#fff' }}>{Number(stats.avgMood).toFixed(1)}<span style={{ fontSize: '1rem', color: '#64748b', marginLeft: '4px' }}>/10</span></p></div>
          </div>
          <div className="smooth-glass" style={{ padding: '25px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="ud-stat-icon ud-icon-orange" style={{ fontSize: '2rem', padding: '15px', borderRadius: '16px' }}>⚡</div>
            <div><h3 style={{ margin: '0 0 5px 0', color: '#94a3b8', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Avg Energy</h3><p style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: '#fff' }}>{Number(stats.avgEnergy).toFixed(1)}<span style={{ fontSize: '1rem', color: '#64748b', marginLeft: '4px' }}>/10</span></p></div>
          </div>
        </div>

        {/* Analytics & AI Insights Grid */}
        <div className="dash-grid-mid">
          
          <div className="smooth-glass" style={{ padding: '30px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#fff', fontWeight: '700' }}>Activity History</h3>
              <span style={{ fontSize: '0.85rem', color: '#00ffe7', background: 'rgba(0, 255, 231, 0.1)', padding: '6px 12px', borderRadius: '8px', fontWeight: '600' }}>
                  {stats.daysAnalyzed === 'Unlimited' ? 'All Time' : `Last ${stats.daysAnalyzed} Days`}
              </span>
            </div>
            <div style={{ flex: 1, width: '100%', minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ffe7" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#00ffe7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} dx={-10} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0, 255, 231, 0.2)', strokeWidth: 2, strokeDasharray: '5 5' }} />
                  <Area type="monotone" dataKey="activities" stroke="#00ffe7" strokeWidth={4} fillOpacity={1} fill="url(#colorActs)" activeDot={{ r: 6, fill: '#fff', stroke: '#00ffe7', strokeWidth: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="smooth-glass" style={{ padding: '30px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 25px 0', fontSize: '1.3rem', color: '#fff', fontWeight: '700', display: 'flex', alignItems: 'center' }}>
              AI Intelligence <span style={{ color: isCommanderPlus ? '#ff5f6d' : '#64748b', marginLeft: '12px', fontSize: '0.8rem', animation: isCommanderPlus ? 'pulse-mic 2s infinite' : 'none' }}>{isCommanderPlus ? '● LIVE' : '🔒 LOCKED'}</span>
            </h3>
            
            <div style={{ 
              background: 'rgba(0,0,0,0.4)', padding: '25px', borderRadius: '16px', 
              borderLeft: `4px solid ${isCommanderPlus ? '#c084fc' : '#4b5563'}`, 
              flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
              boxShadow: isCommanderPlus ? 'inset 0 0 20px rgba(192, 132, 252, 0.05)' : 'none'
            }}>
              {isCommanderPlus ? (
                  <p style={{ fontSize: '1.1rem', color: '#e2e8f0', margin: 0, lineHeight: '1.7', fontStyle: 'italic', position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '-15px', left: '-10px', fontSize: '2rem', color: 'rgba(192, 132, 252, 0.2)' }}>"</span>
                    {systemInsight}
                    <span style={{ position: 'absolute', bottom: '-25px', right: '-10px', fontSize: '2rem', color: 'rgba(192, 132, 252, 0.2)' }}>"</span>
                  </p>
              ) : (
                  <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '15px', opacity: 0.5 }}>🤖</div>
                      <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '20px', lineHeight: '1.5' }}>Omni-Node AI Routine Insights are locked. Upgrade to Commander tier to unlock deep psychological analysis.</p>
                      <button className="ud-btn ud-btn-primary action-btn-glow" style={{ padding: '10px 20px', fontSize: '0.9rem', borderRadius: '10px' }} onClick={() => navigate('/pricing')}>Unlock AI Core</button>
                  </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section Grid */}
        <div className="dash-grid-bot">
          <div style={{ height: '100%' }}>
            <SyndicateGrid />
          </div>

          <div className="smooth-glass" style={{ padding: '30px', display: 'flex', flexDirection: 'column', maxHeight: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#fff', fontWeight: '700' }}>Recent Telemetry</h2>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Latest 5 entries</span>
            </div>
            
            <div className="activity-scroll" style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
              {activities.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: "#64748b", fontStyle: 'italic' }}>
                  No activities recorded in the matrix yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {activities.slice(0, 5).map((act, index) => (
                    <div key={act.id} style={{ 
                      background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', 
                      borderRadius: '16px', padding: '20px', display: 'flex', justifyContent: 'space-between', 
                      alignItems: 'center', transition: 'transform 0.2s ease', cursor: 'default' 
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          width: '12px', height: '12px', borderRadius: '50%', flexShrink: 0,
                          background: index % 2 === 0 ? '#00ffe7' : '#c084fc',
                          boxShadow: `0 0 10px ${index % 2 === 0 ? '#00ffe7' : '#c084fc'}`
                        }}></div>
                        <div style={{ overflow: 'hidden' }}>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.title}</h3>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.description || "System log generated."}</p>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                        <span style={{ background: 'rgba(192, 132, 252, 0.15)', color: '#c084fc', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>🧠 {act.mood_level}</span>
                        <span style={{ background: 'rgba(251, 146, 60, 0.15)', color: '#fb923c', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>⚡ {act.energy_level}</span>
                        <span style={{ color: '#64748b', fontSize: '0.8rem', minWidth: '70px', textAlign: 'right' }}>{new Date(act.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        <button onClick={() => handleDeleteActivity(act.id)} className="mic-hover" style={{ 
                          background: 'rgba(255, 95, 109, 0.1)', border: 'none', color: '#ff5f6d', 
                          cursor: 'pointer', fontSize: '1.2rem', padding: '4px 8px', borderRadius: '8px', 
                          fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                        }} title="Delete Activity">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {showVoiceModal && (
        <VoiceCommandModal 
          isListening={isListening} 
          aiResponse={aiResponse} 
          gamification={gamification} 
          isProcessing={isProcessing}
          onStart={startVoiceCommand} 
          onStop={stopVoiceCommand}
          onClose={handleCloseModal}
        />
      )}

      {showLevelUp && <LevelUpOverlay level={newLevel} onDismiss={() => setShowLevelUp(false)} />}
      {isBlackout && <BlackoutScreen />}
    </div>
  );
}