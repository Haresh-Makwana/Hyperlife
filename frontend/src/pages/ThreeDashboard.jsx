import { useRef, useState, useEffect, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, useTexture, useFBX } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useNavigate, useLocation } from "react-router-dom";
import { setToken } from "../utils/auth";
import * as THREE from "three";
import "../styles/UserDashboard.css"; 

// --- 3D SCENE COMPONENTS ---
function CinematicSun() {
  const ref = useRef();
  useFrame(() => { if (ref.current) ref.current.rotation.y -= 0.002; });
  const fbx = useFBX("/planets/UnstableStar.fbx");
  const texture = useTexture("/planets/suncyl1.jpg");
  const clonedFbx = useMemo(() => fbx.clone(), [fbx]);
  useMemo(() => {
    if (texture) texture.colorSpace = THREE.SRGBColorSpace;
    clonedFbx.traverse((child) => {
      if (child.isMesh) child.material = new THREE.MeshStandardMaterial({ map: texture, emissive: new THREE.Color("#ffaa00"), emissiveIntensity: 2.0, emissiveMap: texture });
    });
  }, [clonedFbx, texture]);
  return (
    <group ref={ref}>
      <primitive object={clonedFbx} scale={0.08} />
      <pointLight intensity={3} color="#ffaa00" distance={100} decay={2} />
    </group>
  );
}

function OrbitingPlanet() {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current) {
      ref.current.position.x = Math.cos(t * 0.2) * 6.5;
      ref.current.position.z = Math.sin(t * 0.2) * 6.5;
      ref.current.position.y = Math.sin(t * 0.4) * 0.8; 
      ref.current.rotation.y += 0.005; 
    }
  });
  const fbx = useFBX("/planets/crystle-planet.fbx");
  const texture = useTexture("/planets/crystal_planet7_Albedo2.jpg");
  const clonedFbx = useMemo(() => fbx.clone(), [fbx]);
  useMemo(() => {
    if (texture) texture.colorSpace = THREE.SRGBColorSpace;
    clonedFbx.traverse((child) => {
      if (child.isMesh) child.material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.3, transparent: true });
    });
  }, [clonedFbx, texture]);
  return <primitive ref={ref} object={clonedFbx} scale={0.0025} />;
}

function NeptunePlanet() {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current) {
      ref.current.position.x = Math.cos(t * 0.35 + 2) * 3.8;
      ref.current.position.z = Math.sin(t * 0.35 + 2) * 3.8;
      ref.current.position.y = Math.cos(t * 0.5) * -0.6; 
      ref.current.rotation.y += 0.01; 
    }
  });
  const texture = useTexture("/planets/2k_neptune.jpg");
  if (texture) texture.colorSpace = THREE.SRGBColorSpace;
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.5, 64, 64]} />
      <meshStandardMaterial map={texture} roughness={0.4} />
    </mesh>
  );
}

function SpaceScene() {
  return (
    <Canvas camera={{ position: [0, 1, 16], fov: 45 }} className="canvas-background">
      <ambientLight intensity={0.1} color="#ffffff" />
      <Stars radius={100} depth={50} count={6000} factor={4} fade speed={1.5} />
      <Suspense fallback={null}>
        <group position={[-4, 0, 0]} rotation={[0.1, 0, -0.05]}>
          <CinematicSun />
          <OrbitingPlanet />   
          <NeptunePlanet />    
        </group>
      </Suspense>
      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.9} mipmapBlur intensity={1.5} />
      </EffectComposer>
      <OrbitControls enableZoom={false} enablePan={false} enableRotate={true} autoRotate autoRotateSpeed={0.3} />
    </Canvas>
  );
}

// --- MAIN UI DASHBOARD ---
export default function ThreeDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isSignup, setIsSignup] = useState(location.pathname === "/register");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("user"); 
  
  const [verificationPhase, setVerificationPhase] = useState(false);
  const [otp, setOtp] = useState("");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminCode, setAdminCode] = useState(""); 

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsSignup(location.pathname === "/register");

    const params = new URLSearchParams(location.search);
    const urlToken = params.get("token");
    const urlRole = params.get("role");
    const urlError = params.get("error");
    const urlVerified = params.get("verified");

    if (urlToken) {
      setToken(urlToken);
      localStorage.setItem("user_role", urlRole || "user");
      navigate(String(urlRole).trim().toLowerCase() === "admin" ? "/admin" : "/dashboard", { replace: true });
    } else if (urlVerified) {
      setSuccess("System Uplink Verified. You may now access the console.");
      window.history.replaceState(null, "", location.pathname); 
    } else if (urlError) {
      setError(`OAuth Failed: ${decodeURIComponent(urlError)}`);
      window.history.replaceState(null, "", location.pathname); 
    } else {
      setError(""); 
      setSuccess("");
    }
  }, [location.pathname, location.search, navigate]);

  const handleGoogleLogin = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/google/url");
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError("Failed to establish secure link with Google.");
    }
  };

  const handleAuth = async (e) => {
    if (e) e.preventDefault(); 
    setError(""); setSuccess("");
    
    if (isSignup && password !== confirmPassword) {
      setError("Passwords do not match"); return;
    }

    if (isSignup && role === "admin" && !adminCode) {
      setError("System Override Key is required for Admin clearance."); return;
    }

    setLoading(true);

    const endpoint = isSignup ? "register" : "login";
    
    const payload = isSignup 
      ? { name, email, password, password_confirmation: confirmPassword, admin_code: adminCode, role: role } 
      : { email, password };

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
            setError(data.message || "ACCESS DENIED: Invalid key or unverified email.");
        } else if (data.errors) {
            setError(Object.values(data.errors)[0][0]);
        } else {
            setError(data.message || "Authentication failed.");
        }
        setLoading(false); return;
      }

      if (data.status === 'pending_verification') {
        setSuccess(data.message);
        setVerificationPhase(true); 
        setLoading(false);
        return;
      }

      setToken(data.token);
      const userRole = data?.user?.role || 'user';
      localStorage.setItem('user_role', userRole);
      setLoading(false); 

      if (String(userRole).trim().toLowerCase() === "admin") navigate("/admin");
      else navigate("/dashboard");
      
    } catch (err) {
      setError("Cannot connect to server.");
      setLoading(false); 
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/verify-email-otp", {
        method: "POST", 
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Verification Failed");

      setSuccess(data.message);
      setToken(data.token);
      const userRole = data.user?.role || 'user';
      localStorage.setItem('user_role', userRole);
      
      setTimeout(() => {
        navigate(String(userRole).trim().toLowerCase() === "admin" ? "/admin" : "/dashboard");
      }, 1500);

    } catch (err) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="immersive-auth-wrapper">
      <SpaceScene />
      <div className="ui-layer">
        
        <div className="brand-section auth-anim-slide-up" style={{ animationDelay: '0.1s' }}>
          <h1 className="logo">HyperLife</h1>
        </div>

        <div className="form-section">
          <div className="ultra-glass-card auth-anim-slide-up" style={{ animationDelay: '0.2s' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '25px', textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
              {verificationPhase ? "Verify Identity" : (isSignup ? "Initialize Profile" : "Access Console")}
            </h2>

            {!verificationPhase && (
              <>
                {/* 🚀 FIXED: Google Button now dynamically locks if Admin is selected */}
                <button 
                    type="button" 
                    onClick={role === 'admin' ? null : handleGoogleLogin} 
                    className={`cyber-btn auth-anim-slide-up ${role === 'admin' ? '' : 'hover-glow'}`}
                    disabled={role === 'admin'}
                    style={{ 
                        animationDelay: '0.3s', 
                        background: role === 'admin' ? 'rgba(255, 255, 255, 0.05)' : '#fff', 
                        color: role === 'admin' ? '#ef4444' : '#000', 
                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', 
                        marginBottom: '20px', width: '100%', 
                        border: role === 'admin' ? '1px dashed #ef4444' : 'none',
                        cursor: role === 'admin' ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                >
                    {role === 'admin' ? (
                         <span style={{ fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1px' }}>🔒 OAUTH DISABLED FOR ADMIN</span>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ width: '20px', height: '20px' }}>
                                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                            </svg>
                            Continue with Google
                        </>
                    )}
                </button>

                <div className="auth-anim-slide-up" style={{ animationDelay: '0.4s', textAlign: 'center', color: '#8b92a5', fontSize: '0.75rem', marginBottom: '20px', letterSpacing: '1px' }}>
                    OR PROCEED MANUALLY
                </div>

                {isSignup && (
                  <div className="role-toggle-container auth-anim-slide-up" style={{ animationDelay: '0.5s', marginBottom: '20px' }}>
                    <div className={`role-slider ${role === 'admin' ? 'admin-mode' : ''}`}></div>
                    <div className={`role-btn ${role === 'user' ? 'active' : ''}`} onClick={() => setRole('user')}>Operator</div>
                    <div className={`role-btn ${role === 'admin' ? 'active' : ''}`} onClick={() => setRole('admin')}>System Admin</div>
                  </div>
                )}
              </>
            )}

            {error && <p className="auth-anim-slide-up" style={{ animationDelay: '0.1s', color: "#ff5f6d", marginBottom: "15px", fontWeight: "500", textAlign: 'center', background: 'rgba(255, 95, 109, 0.1)', padding: '10px', borderRadius: '6px', border: '1px solid #ff5f6d' }}>{error}</p>}
            {success && <p className="auth-anim-slide-up" style={{ animationDelay: '0.1s', color: "#10b981", marginBottom: "15px", fontWeight: "500", textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '6px', border: '1px solid #10b981' }}>{success}</p>}

            {verificationPhase ? (
              <form onSubmit={handleVerifyOtp} className="auth-anim-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="input-group" style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <p style={{ color: '#00ffe7', marginBottom: '15px' }}>A Decryption Key has been sent to<br/><strong style={{ color: '#fff' }}>{email}</strong></p>
                  <input 
                    type="text" 
                    className="cyber-input" 
                    placeholder="ENTER 6-DIGIT KEY" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)} 
                    maxLength="6" 
                    required 
                    style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }} 
                  />
                </div>
                <button type="submit" className="cyber-btn" disabled={loading} style={{ marginTop: '15px' }}>
                  {loading ? "Decrypting..." : "Verify Identity"}
                </button>
                <p className="auth-switch" style={{ textAlign: 'center', marginTop: '20px', color: '#8b92a5' }}>
                  <span onClick={() => { setVerificationPhase(false); setOtp(""); }} style={{ color: '#ff5f6d', cursor: 'pointer', textDecoration: 'underline' }}>
                    Abort & Return
                  </span>
                </p>
              </form>
            ) : (
              <form onSubmit={handleAuth}>
                {isSignup && (
                  <div className="input-group auth-anim-slide-up" style={{ animationDelay: '0.6s' }}>
                    <input type="text" className="cyber-input" placeholder="Operator Name" value={name} onChange={(e) => setName(e.target.value)} required={isSignup} />
                  </div>
                )}
                
                <div className="input-group auth-anim-slide-up" style={{ animationDelay: isSignup ? '0.7s' : '0.5s' }}>
                  <input type="email" className="cyber-input" placeholder="Comms Address (Email)" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                
                <div className="input-group auth-anim-slide-up" style={{ animationDelay: isSignup ? '0.8s' : '0.6s' }}>
                  <input type={showPassword ? "text" : "password"} className="cyber-input" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <span className="eye-icon" onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer' }}>👁</span>
                </div>

                {!isSignup && (
                  <div className="auth-anim-slide-up" style={{ animationDelay: '0.7s', textAlign: 'right', marginTop: '-10px', marginBottom: '15px' }}>
                    <span 
                      onClick={() => navigate("/forgot-password")} 
                      style={{ color: '#8b92a5', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', transition: 'color 0.3s' }}
                      onMouseOver={(e) => e.target.style.color = '#00ffe7'}
                      onMouseOut={(e) => e.target.style.color = '#8b92a5'}
                    >
                      Forgot Password?
                    </span>
                  </div>
                )}
                
                {isSignup && (
                  <div className="input-group auth-anim-slide-up" style={{ animationDelay: '0.9s' }}>
                    <input type="password" className="cyber-input" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required={isSignup} />
                  </div>
                )}

                {isSignup && role === 'admin' && (
                  <div className="input-group auth-anim-slide-up" style={{ animationDelay: '1.0s' }}>
                    <input type="password" className="cyber-input" placeholder="System Override Key" value={adminCode} onChange={(e) => setAdminCode(e.target.value)} required style={{ borderColor: '#ff003c', color: '#ff003c', boxShadow: 'inset 0 0 10px rgba(255,0,60,0.2)' }} />
                    <small style={{ color: '#ff003c', display: 'block', marginTop: '5px', fontSize: '0.75rem' }}>*Required for Admin Clearance</small>
                  </div>
                )}

                <button type="submit" className="cyber-btn auth-anim-slide-up" disabled={loading} style={{ animationDelay: isSignup ? '1.1s' : '0.8s', marginTop: '15px' }}>
                  {loading ? "Transmitting..." : isSignup ? "Initialize Profile" : "Login"}
                </button>

                <p className="auth-switch auth-anim-slide-up" style={{ animationDelay: isSignup ? '1.2s' : '0.9s', textAlign: 'center', marginTop: '20px', color: '#8b92a5' }}>
                  {isSignup ? "Already have an account? " : "Don’t have an account? "}
                  <span onClick={() => navigate(isSignup ? "/login" : "/register")} style={{ color: '#00ffe7', cursor: 'pointer', textDecoration: 'underline' }}>
                    {isSignup ? "Login" : "Signup"}
                  </span>
                </p>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}