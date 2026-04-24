import { useState } from "react";
import "../styles/Contact.css"; // // MUST IMPORT THE CSS FILE HERE!

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  
  const [status, setStatus] = useState(""); 
  const [loading, setLoading] = useState(false);

  const handleContactSubmit = async (e) => {
    e.preventDefault(); 
    setLoading(true);
    setStatus("Transmitting encrypted data...");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          name: name,
          email: email,
          message: message,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("✅ Secure transmission received successfully.");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setStatus("❌ " + (data.message || "Transmission failed."));
      }
    } catch (error) {
      console.error("Network Error:", error);
      setStatus("❌ Cannot connect to server. Is Laravel running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page-wrapper">
      <div className="contact-container">
        
        {/* LEFT SIDE: Info */}
        <div className="contact-info">
          <div className="comm-badge">
            📡 Secure Comm Link
          </div>
          <h1>
            Establish a <br/>
            <span className="gradient-text">Connection.</span>
          </h1>
          <p>
            Whether you are reporting a system anomaly, requesting new features, or looking to collaborate on the future of personal productivity, the network is open.
          </p>

          <div style={{ width: '100%', maxWidth: '450px' }}>
            <div className="info-card">
              <span className="info-icon">📍</span>
              <div className="info-text">
                <strong>Base of Operations</strong>
                <span>Kalol, Gujarat — Earth Node</span>
              </div>
            </div>
            
            <div className="info-card">
              <span className="info-icon">✉️</span>
              <div className="info-text">
                <strong>Direct Transmission</strong>
                <span>comms@hyperlifeos.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: The Form */}
        <div className="contact-form-wrapper">
          <div className="glass-contact-card">
            <h2>Initialize Message</h2>

            {/* Status Message Display */}
            {status && (
              <div className={`status-msg ${status.includes('✅') ? 'status-success' : 'status-error'}`}>
                {status}
              </div>
            )}

            <form onSubmit={handleContactSubmit} className="contact-form">
              <input 
                type="text" 
                className="contact-input"
                placeholder="Operator Name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />

              <input 
                type="email" 
                className="contact-input"
                placeholder="Comms Address (Email)" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />

              <textarea 
                className="contact-input"
                placeholder="Encrypted Message" 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                required 
                rows="4"
              />

              <button 
                type="submit" 
                className="contact-submit-btn"
                disabled={loading}
              >
                {loading ? "Transmitting..." : "Send Data"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}