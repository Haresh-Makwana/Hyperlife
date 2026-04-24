import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getToken } from "../utils/auth";
import "../styles/Checkout.css";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!state || !state.tier) {
      setTimeout(() => navigate("/pricing"), 1500);
    }
  }, [state, navigate]);

  if (!state || !state.tier) {
    return (
      <div className="checkout-fallback">
        <div className="scanline"></div>
        <h2 className="glitch-text" data-text="⚠️ NO DATA PACKET DETECTED.">⚠️ NO DATA PACKET DETECTED.<br/><br/>RE-ROUTING TO PRICING MATRIX...</h2>
      </div>
    );
  }

  const { tier, isAnnual } = state;
  const finalPrice = isAnnual ? tier.annualPrice : tier.monthlyPrice;

  const handlePayment = async () => {
    const token = getToken();
    if (!token) { navigate("/login"); return; }

    setLoading(true); setError(""); setSuccess("");

    const res = await loadRazorpayScript();
    if (!res) {
      setError("Network Error: Gateway unreachable.");
      setLoading(false); return;
    }

    try {
      const orderRes = await fetch("http://127.0.0.1:8000/api/create-razorpay-order", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ plan: tier.name.toLowerCase(), isAnnual }) 
      });
      
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Failed to initialize order.");

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "HyperLife OS",
        description: `${tier.name} Upgrade`,
        order_id: orderData.order_id,
        theme: { color: "#7f5cff" },
        handler: async function (response) {
          setLoading(true);
          try {
            const verifyRes = await fetch("http://127.0.0.1:8000/api/verify-razorpay-payment", {
              method: "POST",
              headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Accept": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan_purchased: tier.name.toLowerCase() 
              })
            });
            const verifyData = await verifyRes.json();
            
            if (verifyRes.ok) {
                setSuccess(`Authorization complete. Welcome to the ${tier.name} tier.`);
                setTimeout(() => navigate("/dashboard"), 3000);
            } else {
                setError(verifyData.message || "Security verification failed.");
            }
          } catch (err) {
            setError("Server error during verification.");
          }
          setLoading(false);
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on("payment.failed", function (response) {
        setError(`Payment Failed: ${response.error.description}`);
      });
      paymentObject.open();

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      <div className="checkout-grid-bg"></div>
      <div className="checkout-glow checkout-glow-1"></div>
      <div className="checkout-glow checkout-glow-2"></div>

      <div className="checkout-content">
        <h1 className="checkout-title animate-pop-in">Secure <span>Uplink</span></h1>
        <p className="checkout-subtitle animate-pop-in delay-1">Verify your telemetry data before initializing the transaction.</p>

        {error && <div className="checkout-alert error animate-slide-down">{error}</div>}
        {success && <div className="checkout-alert success animate-slide-down">{success}</div>}

        <div className="checkout-card-split animate-slide-up delay-2">
          
          {/* 📝 LEFT SIDE: Order Summary */}
          <div className="checkout-summary">
            <h2 className="summary-title">Order Summary</h2>
            <div className="summary-item hover-lift">
              <span>Clearance Level</span>
              <span className="highlight-tier">{tier.name}</span>
            </div>
            <div className="summary-item hover-lift">
              <span>Billing Cycle</span>
              <span className="highlight-value">{isAnnual ? "Annually (20% Off)" : "Monthly"}</span>
            </div>
            
            <div className="summary-divider"></div>
            
            <ul className="summary-features">
              {tier.features && tier.features.slice(0, 4).map((feat, i) => (
                <li key={i} className={`fade-in-list delay-list-${i}`}>
                  <span className="check-icon">✓</span> {feat}
                </li>
              ))}
            </ul>

            <div className="summary-divider"></div>

            <div className="summary-total pulse-glow">
              <span>Total Due Today</span>
              <span className="total-price">₹{finalPrice}</span>
            </div>
          </div>

          {/* 🔐 RIGHT SIDE: Payment Action */}
          <div className="checkout-action">
            <div className="secure-badge floating-badge">
              <span className="lock-icon">🔒</span>
              <span>256-Bit Military Grade Encryption</span>
            </div>
            
            <p className="action-desc">
              Your transaction is secured by the Razorpay network. HyperLife OS does not store your credit card data.
            </p>

            <button 
              className={`checkout-pay-btn ${loading ? 'btn-loading' : ''} ${success ? 'btn-success' : ''}`} 
              onClick={handlePayment} 
              disabled={loading || success}
            >
              <div className="btn-bg-sweep"></div>
              <span className="btn-content">
                {loading ? "Negotiating Handshake..." : success ? "Payment Confirmed ✓" : `Confirm & Transmit ₹${finalPrice}`}
              </span>
            </button>

            <button 
                className="checkout-cancel-btn" 
                onClick={() => navigate("/pricing")}
                disabled={loading || success}
            >
              Abort Transaction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}