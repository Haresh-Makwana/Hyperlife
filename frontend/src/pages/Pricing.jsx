import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../utils/auth";
import "../styles/Pricing.css";

export default function Pricing() {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);

  // 🚀 REFINED, USER-FRIENDLY PREMIUM MATRIX
  const pricingTiers = [
    {
      name: "Operator",
      desc: "Base stabilization for daily routines.",
      monthlyPrice: 0,
      annualPrice: 0,
      btnText: "Initialize Free",
      btnClass: "hlp-btn-outline",
      actionType: "free",
      features: [
        "1 Active Universe",
        "Basic Daily Habit Tracking",
        "Standard Activity Logs",
        "7-Day Analytics History"
      ]
    },
    {
      name: "Navigator",
      desc: "Expanded telemetry and historical data.",
      monthlyPrice: 299,
      annualPrice: 249,
      btnText: "Upgrade to Navigator",
      btnClass: "hlp-btn-outline",
      actionType: "pay", 
      features: [
        "Up to 3 Active Universes",
        "Advanced Habit Streaks",
        "30-Day Analytics History",
        "Custom Data Tags"
      ]
    },
    {
      name: "Commander",
      desc: "Full orbital control and AI insights.",
      monthlyPrice: 599,
      annualPrice: 499,  
      btnText: "Upgrade to Commander",
      btnClass: "hlp-btn-solid",
      isPro: true, 
      badge: "MOST POPULAR",
      actionType: "pay", 
      features: [
        "Unlimited Universes & Planets",
        "Omni-Node AI Routine Insights",
        "HD PDF & CSV Data Export",
        "Unlimited Analytics History"
      ]
    },
    {
      name: "Syndicate",
      desc: "For small teams operating in shared networks.",
      monthlyPrice: 899,
      annualPrice: 749,
      btnText: "Upgrade to Syndicate",
      btnClass: "hlp-btn-outline",
      actionType: "pay", 
      features: [
        "Everything in Commander",
        "Up to 5 Linked Accounts",
        "Shared Team Habit Goals",
        "Syndicate Leaderboards"
      ]
    },
    {
      name: "Overwatch",
      desc: "The ultimate elite status within the Matrix.",
      monthlyPrice: 1499,
      annualPrice: 1199, 
      btnText: "Unlock Elite Status",
      btnClass: "hlp-btn-outline",
      actionType: "pay", 
      features: [
        "Everything in Syndicate",
        "Elite Holographic UI Themes",
        "VIP Priority Support Queue",
        "Early Access to System Updates"
      ]
    }
  ];

  // 🚀 THE SMART ROUTING PROTOCOL
  const handleAction = (tier) => {
    const token = getToken();

    // 1. Free Tier Routing
    if (tier.actionType === "free") {
       if (token) navigate("/dashboard"); 
       else navigate("/register");  
       return;
    }

    // 2. Paid Tier Logic (All paid tiers now go directly to secure checkout)
    if (tier.actionType === "pay") {
        if (!token) { 
            navigate("/login"); 
            return; 
        }
        // Securely pass the dynamic tier data to the checkout portal
        navigate("/checkout", { state: { tier, isAnnual } });
    }
  };

  return (
    <div className="hlp-container">
      <div className="hlp-orb-1"></div>
      <div className="hlp-orb-2"></div>

      <div className="hlp-header">
        <h1 className="hlp-title">Unlock Your <span>True Potential</span></h1>
        <p className="hlp-subtitle">
          Select the clearance level that fits your mission. Upgrade your node at any time to access deeper system integrations.
        </p>
      </div>

      <div className="hlp-toggle-wrapper">
        <span className={`hlp-toggle-label ${!isAnnual ? "active" : ""}`}>Monthly</span>
        <div className={`hlp-toggle ${isAnnual ? "annual" : ""}`} onClick={() => setIsAnnual(!isAnnual)}>
          <div className="hlp-toggle-circle"></div>
        </div>
        <span className={`hlp-toggle-label ${isAnnual ? "active" : ""}`}>Annually</span>
        <span className="hlp-discount">Save 20%</span>
      </div>

      <div className="hlp-grid">
        {pricingTiers.map((tier, index) => (
          <div className={`hlp-card ${tier.isPro ? "pro" : ""}`} key={index}>
            {tier.badge && <div className="hlp-badge">{tier.badge}</div>}
            <h3 className="hlp-tier-name">{tier.name}</h3>
            <div className="hlp-price">
              <span className="hlp-currency">₹</span>
              {isAnnual ? tier.annualPrice : tier.monthlyPrice}
              <span className="hlp-period">/mo</span>
            </div>
            <p className="hlp-desc">{tier.desc}</p>
            <ul className="hlp-features">
              {tier.features.map((feature, fIndex) => (
                <li key={fIndex}><div className="hlp-check">✓</div>{feature}</li>
              ))}
            </ul>
            <button className={`hlp-btn ${tier.btnClass}`} onClick={() => handleAction(tier)}>
              {tier.btnText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}