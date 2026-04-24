import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getToken, removeToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

import "../styles/Admin.css"; 

// 🚀 UNIVERSAL DOMAIN COLORS
const DOMAIN_COLORS = {
  health: "#00ffe7", knowledge: "#a855f7", finance: "#ffb86c",
  productivity: "#10b981", creativity: "#eab308", social: "#ec4899", general: "#ffffff"
};

const getPlanetColor = (domainOrType) => {
    if (!domainOrType) return DOMAIN_COLORS.general;
    return DOMAIN_COLORS[domainOrType.toLowerCase()] || DOMAIN_COLORS.general;
};

const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'rgba(10, 12, 18, 0.9)', border: '1px solid #00ffe7', padding: '10px 15px', borderRadius: '8px', boxShadow: '0 0 15px rgba(0, 255, 231, 0.2)' }}>
        <p style={{ margin: '0 0 5px 0', color: '#8b92a5', fontSize: '0.8rem', textTransform: 'uppercase' }}>{label}</p>
        <p style={{ margin: 0, color: '#00ffe7', fontWeight: 'bold', fontSize: '1.2rem' }}>{payload[0].value} <span style={{ fontSize: '0.8rem', color: '#fff' }}>Units</span></p>
      </div>
    );
  }
  return null;
};

const PlanetNode = ({ planet }) => {
  const [hovered, setHovered] = useState(false);
  const color = getPlanetColor(planet.domain || planet.type);

  const finalPosition = useMemo(() => {
    const angle = planet.owner_id * 0.8; 
    const radius = planet.owner_id * 12; 
    return [
      Number(planet.position_x || 0) + (Math.cos(angle) * radius),
      Number(planet.position_y || 0) + (Math.sin(planet.id) * 5), 
      Number(planet.position_z || 0) + (Math.sin(angle) * radius)
    ];
  }, [planet]);

  return (
    <mesh position={finalPosition} onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'crosshair'; }} onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}>
      <sphereGeometry args={[Number(planet.size || 1) * 2, 32, 32]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 6 : 2} toneMapped={false} wireframe={hovered} />
      {hovered && (
        <Html distanceFactor={80} position={[0, 4, 0]} center zIndexRange={[100, 0]}>
          <div style={{ background: 'rgba(3, 4, 7, 0.85)', border: `1px solid ${color}`, padding: '10px 15px', borderRadius: '6px', color: '#fff', fontFamily: 'monospace', whiteSpace: 'nowrap', boxShadow: `0 0 30px ${color}90`, pointerEvents: 'none', backdropFilter: 'blur(4px)', textTransform: 'uppercase' }}>
            <div style={{ color, fontWeight: '800', fontSize: '16px', letterSpacing: '1px', textShadow: `0 0 10px ${color}` }}>{planet.owner_name}</div>
            <div style={{ color: '#8b92a5', fontSize: '12px', marginTop: '4px' }}>Goal: {planet.planet_name}</div>
            <div style={{ color: '#8b92a5', fontSize: '12px' }}>Category: {planet.type}</div>
          </div>
        </Html>
      )}
    </mesh>
  );
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  // 🚀 TAB NAVIGATION STATE
  const [activeTab, setActiveTab] = useState('overview'); // overview | users | omniverse | system

  const [stats, setStats] = useState({ totalUsers: 0, totalPlanets: 0, totalHabits: 0, globalXp: 0 });
  const [chartData, setChartData] = useState({ userGrowth: [], domains: [] });
  const [omniverseData, setOmniverseData] = useState([]);
  const [liveFeed, setLiveFeed] = useState([]); 
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // User Deep Dive States
  const [selectedUser, setSelectedUser] = useState(null);
  const [editXp, setEditXp] = useState(0);
  const [editRole, setEditRole] = useState("user");
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedUserActivities, setSelectedUserActivities] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  // Global Actions States
  const [directiveText, setDirectiveText] = useState("");
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isBlackoutActive, setIsBlackoutActive] = useState(false);
  
  // Features States
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'xp', direction: 'desc' });
  const [airdropAmount, setAirdropAmount] = useState(100);
  const [isAirdropping, setIsAirdropping] = useState(false);

  const fetchAdminData = useCallback(async () => {
    const token = getToken();
    if (!token) { navigate("/login"); return; }

    try {
      const headers = { "Authorization": `Bearer ${token}`, "Accept": "application/json", "Cache-Control": "no-cache" };
      const cacheBuster = `?t=${new Date().getTime()}`;
      
      let userRes = await fetch(`http://127.0.0.1:8000/api/user${cacheBuster}`, { headers });
      if (!userRes.ok) userRes = await fetch(`http://127.0.0.1:8000/api/me${cacheBuster}`, { headers });
      if (!userRes.ok) throw new Error("Backend authentication missing.");

      const userData = await userRes.json();
      const userRole = userData?.role || userData?.data?.role || userData?.user?.role;

      if (String(userRole).trim().toLowerCase() !== 'admin') { navigate("/dashboard"); return; }

      try {
          const statsRes = await fetch(`http://127.0.0.1:8000/api/admin/overview${cacheBuster}`, { headers });
          if (statsRes.ok) {
              const statsData = await statsRes.json();
              setStats({ totalUsers: statsData.total_users || 0, totalPlanets: statsData.total_planets || 0, totalHabits: statsData.total_habits || 0, globalXp: statsData.global_xp || 0 });
              setChartData({ userGrowth: statsData.chart_user_growth || [], domains: statsData.chart_domains || [] });
          }
      } catch (e) {}

      try {
          const usersRes = await fetch(`http://127.0.0.1:8000/api/admin/users${cacheBuster}`, { headers });
          if (usersRes.ok) setUsers(await usersRes.json());
      } catch (e) {}

      try {
          const omniRes = await fetch(`http://127.0.0.1:8000/api/admin/omniverse${cacheBuster}`, { headers });
          if (omniRes.ok) setOmniverseData(await omniRes.json());
      } catch (e) {}

      try {
          const feedRes = await fetch(`http://127.0.0.1:8000/api/admin/feed${cacheBuster}`, { headers });
          if (feedRes.ok) setLiveFeed(await feedRes.json());
      } catch (e) {}

      try {
          const statusRes = await fetch(`http://127.0.0.1:8000/api/system/status${cacheBuster}`, { headers });
          if (statusRes.ok) {
              const statusData = await statusRes.json();
              setIsBlackoutActive(statusData.blackout || false);
          }
      } catch (e) {}

    } catch (err) { setError(err.message || "Failed to connect to server."); } 
    finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { 
    fetchAdminData(); 
    const interval = setInterval(() => fetchAdminData(), 15000);
    return () => clearInterval(interval);
  }, [fetchAdminData]);

  // SEARCH AND SORTING
  const processedUsers = useMemo(() => {
      let sortableUsers = [...users];
      
      if (searchTerm) {
          sortableUsers = sortableUsers.filter(user => 
              user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.id.toString().includes(searchTerm) ||
              (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase()))
          );
      }
      
      sortableUsers.sort((a, b) => {
          let valA = a[sortConfig.key] || 0;
          let valB = b[sortConfig.key] || 0;
          if (typeof valA === 'string') valA = valA.toLowerCase();
          if (typeof valB === 'string') valB = valB.toLowerCase();
          if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
          if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
      });
      
      return sortableUsers;
  }, [users, searchTerm, sortConfig]);

  const requestSort = (key) => {
      let direction = 'desc';
      if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
      setSortConfig({ key, direction });
  };

  // TOP PERFORMERS
  const eliteUsers = useMemo(() => {
      return [...users]
          .filter(u => u.role !== 'admin')
          .sort((a, b) => (b.xp || 0) - (a.xp || 0))
          .slice(0, 3);
  }, [users]);

  // PIE CHART
  const roleDistribution = useMemo(() => {
      const adminCount = users.filter(u => u.role === 'admin').length;
      const userCount = users.filter(u => u.role !== 'admin').length;
      return [
          { name: 'Admins', value: adminCount, color: '#ef4444' },
          { name: 'Standard Users', value: userCount, color: '#00ffe7' }
      ];
  }, [users]);

  // GLOBAL AIRDROP
  const handleGlobalAirdrop = async () => {
      if (!window.confirm(`Are you sure you want to grant +${airdropAmount} XP to ALL standard users?`)) return;
      setIsAirdropping(true);
      try {
          const targets = users.filter(u => u.role !== 'admin');
          let successCount = 0;
          for (let user of targets) {
              const newXp = (user.xp || 0) + Number(airdropAmount);
              await fetch(`http://127.0.0.1:8000/api/admin/users/${user.id}`, {
                  method: "PUT",
                  headers: { "Authorization": `Bearer ${getToken()}`, "Content-Type": "application/json" },
                  body: JSON.stringify({ xp: newXp, role: user.role })
              });
              successCount++;
          }
          alert(`Airdrop Complete! +${airdropAmount} XP delivered to ${successCount} users.`);
          fetchAdminData();
      } catch (err) {
          alert("Airdrop interrupted by network error.");
      } finally {
          setIsAirdropping(false);
      }
  };

  const handleUserClick = async (user) => { 
      setSelectedUser(user); 
      setEditXp(user.xp || 0); 
      setEditRole(user.role || 'user'); 
      
      setIsLoadingActivities(true);
      try {
          const res = await fetch(`http://127.0.0.1:8000/api/admin/users/${user.id}/activities`, {
              headers: { "Authorization": `Bearer ${getToken()}`, "Accept": "application/json" }
          });
          if (res.ok) setSelectedUserActivities(await res.json());
      } catch (err) {} 
      finally { setIsLoadingActivities(false); }
  };
  
  const handleUpdateUser = async () => {
      setIsUpdating(true);
      try {
          const res = await fetch(`http://127.0.0.1:8000/api/admin/users/${selectedUser.id}`, {
              method: "PUT",
              headers: { "Authorization": `Bearer ${getToken()}`, "Content-Type": "application/json", "Accept": "application/json" },
              body: JSON.stringify({ xp: editXp, role: editRole })
          });
          if (res.ok) { fetchAdminData(); setSelectedUser(null); }
      } catch (err) {} finally { setIsUpdating(false); }
  };

  const handleTransmitDirective = async () => {
      if (!directiveText.trim()) return;
      setIsTransmitting(true);
      try {
          const res = await fetch(`http://127.0.0.1:8000/api/admin/directive`, {
              method: "POST",
              headers: { "Authorization": `Bearer ${getToken()}`, "Content-Type": "application/json", "Accept": "application/json" },
              body: JSON.stringify({ message: directiveText })
          });
          if (res.ok) { alert("⚠️ Announcement sent to all users."); setDirectiveText(""); }
      } catch (err) { alert("Network Error."); } 
      finally { setIsTransmitting(false); }
  };

  const handleToggleBlackout = async () => {
      const confirm = window.confirm(
        isBlackoutActive 
          ? "Restore access for all users?" 
          : "WARNING: This will instantly lock out all users globally. Initiate Lockdown?"
      );
      if (!confirm) return;

      try {
          const res = await fetch(`http://127.0.0.1:8000/api/admin/blackout`, {
              method: "POST",
              headers: { "Authorization": `Bearer ${getToken()}`, "Accept": "application/json" }
          });
          if (res.ok) {
              const data = await res.json();
              setIsBlackoutActive(data.blackout_active);
          }
      } catch (err) { alert("Network Error."); }
  };

  const handlePurge = async (userId, userName) => {
      const confirmPurge = window.confirm(`WARNING: You are about to permanently delete User [${userName}]. This action cannot be undone.\n\nProceed with deletion?`);
      if (!confirmPurge) return;

      try {
          const res = await fetch(`http://127.0.0.1:8000/api/admin/users/${userId}`, {
              method: "DELETE",
              headers: { "Authorization": `Bearer ${getToken()}`, "Accept": "application/json" }
          });
          if (res.ok) {
              alert(`User [${userName}] has been deleted.`);
              fetchAdminData();
              if (selectedUser?.id === userId) setSelectedUser(null);
          } else {
              alert("Deletion failed. User may have already been deleted or a system error occurred.");
          }
      } catch (err) {
          alert("Network error during deletion.");
      }
  };

  const handleLogout = () => { removeToken(); navigate("/login"); };

  if (loading) return <div className="admin-loading" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#030407', color: '#00ffe7', fontFamily: 'monospace' }}>Loading Admin Dashboard...</div>;

  const anomalies = users.filter(user => user.xp === 0 && user.role !== 'admin');

  return (
    <div className="admin-layout">
      <style>
        {`
          .forensic-scroll::-webkit-scrollbar { width: 6px; }
          .forensic-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
          .forensic-scroll::-webkit-scrollbar-thumb { background: #00ffe7; border-radius: 3px; }
        `}
      </style>

      <aside className="admin-sidebar">
        <div className="admin-brand"><div className="admin-logo-node"></div><span>HyperLife <span style={{ color: '#00ffe7' }}>OS</span></span></div>
        <nav className="admin-nav">
          <button className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>⊞ Overview</button>
          <button className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>👥 User Management</button>
          <button className={`admin-nav-item ${activeTab === 'omniverse' ? 'active' : ''}`} onClick={() => setActiveTab('omniverse')}>🌌 Omniverse Map</button>
          <button className={`admin-nav-item ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>⚙️ System Controls</button>
        </nav>
        <div className="sidebar-footer"><button className="logout-btn" onClick={handleLogout}>Log Out</button></div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          {activeTab === 'users' ? (
            <input 
              type="text" 
              className="search-bar" 
              placeholder="Search users by name, ID, or role..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          ) : (
             <div style={{ flex: 1 }}></div> // Empty spacer if not on users tab
          )}
          <div className="admin-profile"><span style={{ color: '#8b92a5', fontWeight: '600' }}>System Admin</span><div className="admin-avatar">AD</div></div>
        </header>

        <div className="admin-content">

          {/* =========================================
              TAB 1: OVERVIEW
          ========================================== */}
          {activeTab === 'overview' && (
            <>
              <h1 className="page-title">Dashboard Overview</h1>

              <div className="stats-grid">
                <div className="stat-card cyan"><div className="stat-header"><span>Users</span> <span>👥</span></div><div className="stat-value">{stats.totalUsers}</div></div>
                <div className="stat-card purple"><div className="stat-header"><span>Active Goals</span> <span>🌍</span></div><div className="stat-value">{stats.totalPlanets}</div></div>
                <div className="stat-card emerald"><div className="stat-header"><span>Tracked Habits</span> <span>🧬</span></div><div className="stat-value">{stats.totalHabits}</div></div>
                <div className="stat-card crimson"><div className="stat-header"><span>Global XP</span> <span>⚡</span></div><div className="stat-value">{stats.globalXp}</div></div>
              </div>

              <div style={{ display: 'flex', gap: '25px', marginBottom: '40px', flexWrap: 'wrap' }}>
                <div className="data-section" style={{ flex: '1 1 400px', minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
                  <div className="section-header" style={{ marginBottom: '15px' }}><h3 style={{ fontSize: '1.1rem', color: '#8b92a5', textTransform: 'uppercase' }}>User Growth</h3></div>
                  <div style={{ flex: 1, width: '100%', minHeight: '250px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.userGrowth} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="date" stroke="#8b92a5" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#8b92a5" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                        <RechartsTooltip content={<CustomChartTooltip />} cursor={{ stroke: 'rgba(0, 255, 231, 0.2)', strokeWidth: 2 }} />
                        <Line type="monotone" dataKey="count" stroke="#00ffe7" strokeWidth={3} dot={{ r: 6, fill: '#030407', stroke: '#00ffe7', strokeWidth: 2 }} activeDot={{ r: 8, fill: '#00ffe7', boxShadow: '0 0 15px #00ffe7' }} animationDuration={1500} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="data-section" style={{ flex: '1 1 400px', minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
                  <div className="section-header" style={{ marginBottom: '15px' }}><h3 style={{ fontSize: '1.1rem', color: '#8b92a5', textTransform: 'uppercase' }}>Global Goal Categories</h3></div>
                  <div style={{ flex: 1, width: '100%', minHeight: '250px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.domains} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="domain" stroke="#8b92a5" fontSize={12} tickLine={false} axisLine={false} style={{ textTransform: 'capitalize' }} />
                        <YAxis stroke="#8b92a5" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                        <RechartsTooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={1500}>
                          {chartData.domains.map((entry, index) => {
                            const colors = ['#a855f7', '#10b981', '#ffb86c', '#eab308', '#ec4899', '#00ffe7'];
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="data-section" style={{ flex: '1 1 300px', minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
                  <div className="section-header" style={{ marginBottom: '15px' }}><h3 style={{ fontSize: '1.1rem', color: '#8b92a5', textTransform: 'uppercase' }}>System Clearance Ratio</h3></div>
                  <div style={{ flex: 1, width: '100%', minHeight: '250px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                          {roleDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <RechartsTooltip content={<CustomChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
                        {roleDistribution.map(role => (
                            <div key={role.name} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '10px', height: '10px', backgroundColor: role.color, borderRadius: '50%' }}></div>
                                <span style={{ color: '#8b92a5', fontSize: '0.85rem' }}>{role.name} ({role.value})</span>
                            </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="data-section" style={{ background: '#05070a', border: '1px solid rgba(168, 85, 247, 0.3)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)', fontFamily: 'monospace' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(168, 85, 247, 0.2)', paddingBottom: '15px', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, color: '#a855f7', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 0 10px rgba(168, 85, 247, 0.5)' }}>&gt;_ LIVE_USER_ACTIVITY</h3>
                    <span style={{ color: '#10b981', fontSize: '0.8rem', animation: 'pulse-mic 1.5s infinite' }}>● LIVE</span>
                </div>
                <div style={{ height: '300px', overflowY: 'auto', paddingRight: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {liveFeed.length === 0 ? <div style={{ color: '#4b5563', fontStyle: 'italic' }}>Waiting for user activities...</div> : liveFeed.map((log, idx) => {
                        const date = new Date(log.created_at);
                        const timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
                        return (
                            <div key={log.id || idx} style={{ fontSize: '0.9rem', display: 'flex', gap: '10px', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                <span style={{ color: '#6b7280', minWidth: '85px' }}>[{timeString}]</span>
                                <span style={{ color: '#00ffe7', fontWeight: 'bold' }}>USER_#{log.operator_id}</span>
                                <span style={{ color: '#a855f7' }}>({log.operator_name})</span>
                                <span style={{ color: '#d1d5db' }}>completed:</span>
                                <span style={{ color: '#10b981' }}>{log.action_name}</span>
                            </div>
                        )
                    })}
                </div>
              </div>
            </>
          )}

          {/* =========================================
              TAB 2: USER MANAGEMENT
          ========================================== */}
          {activeTab === 'users' && (
            <>
              <h1 className="page-title">User Management</h1>
              
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', position: 'relative' }}>
                <div className="data-section" style={{ flex: 2 }}>
                  <div className="section-header">
                    <h3>Active Users Directory</h3>
                  </div>
                  <table className="cyber-table" style={{ cursor: 'pointer' }}>
                    <thead>
                      <tr>
                        <th onClick={() => requestSort('id')} style={{cursor: 'pointer'}}>ID {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                        <th onClick={() => requestSort('name')} style={{cursor: 'pointer'}}>User Name {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                        <th onClick={() => requestSort('role')} style={{cursor: 'pointer'}}>Role {sortConfig.key === 'role' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                        <th onClick={() => requestSort('xp')} style={{cursor: 'pointer'}}>Total XP {sortConfig.key === 'xp' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedUsers.map(user => (
                          <tr key={user.id} onClick={() => handleUserClick(user)} style={{ background: selectedUser?.id === user.id ? 'rgba(0, 255, 231, 0.05)' : '' }}>
                            <td style={{ color: '#8b92a5' }}>#{user.id}</td>
                            <td style={{ fontWeight: 'bold' }}>{user.name}</td>
                            <td><span style={{ background: 'rgba(127, 92, 255, 0.1)', color: '#a855f7', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>{user.role}</span></td>
                            <td style={{ color: '#00ffe7', fontWeight: 'bold' }}>{user.xp || 0} XP</td>
                            <td><span className="status-badge status-active">● Online</span></td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    <div className="data-section" style={{ background: 'rgba(10, 12, 18, 0.8)', border: '1px solid #eab308' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(234, 179, 8, 0.2)', paddingBottom: '15px', marginBottom: '15px' }}>
                            <span style={{ fontSize: '1.5rem' }}>👑</span>
                            <h3 style={{ margin: 0, color: '#eab308', textTransform: 'uppercase', letterSpacing: '1px' }}>Top Performers</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {eliteUsers.map((elite, index) => (
                                <div key={elite.id} style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '8px', borderLeft: `4px solid ${index === 0 ? '#eab308' : index === 1 ? '#9ca3af' : '#b45309'}` }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: index === 0 ? '#eab308' : index === 1 ? '#9ca3af' : '#b45309', marginRight: '15px', width: '30px' }}>#{index + 1}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>{elite.name}</div>
                                        <div style={{ color: '#8b92a5', fontSize: '0.85rem' }}>LVL {elite.level || 1}</div>
                                    </div>
                                    <div style={{ color: '#00ffe7', fontWeight: 'bold', fontSize: '1.2rem' }}>{elite.xp} XP</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="data-section" style={{ background: 'rgba(20, 5, 5, 0.5)', border: '1px dashed #ef4444' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', paddingBottom: '15px', marginBottom: '15px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', animation: 'pulse-mic 1s infinite' }}></div>
                            <h3 style={{ margin: 0, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px' }}>Inactive Users Scanner</h3>
                        </div>
                        <p style={{ color: '#fca5a5', fontSize: '0.85rem', marginBottom: '20px' }}>Detecting inactive users (0 XP). Deletion recommended to free up resources.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {anomalies.length === 0 ? (
                                <div style={{ color: '#10b981', textAlign: 'center', padding: '20px', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.05)' }}>✓ System clean. No inactive users detected.</div>
                            ) : (
                                anomalies.map(anomaly => (
                                    <div key={anomaly.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #ef4444' }}>
                                        <div>
                                            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem' }}>{anomaly.name}</div>
                                            <div style={{ color: '#8b92a5', fontSize: '0.8rem', fontFamily: 'monospace' }}>ID: #{anomaly.id} | XP: 0</div>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); handlePurge(anomaly.id, anomaly.name); }} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.5)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase' }} onMouseOver={(e) => { e.target.style.background = '#ef4444'; e.target.style.color = '#000'; }} onMouseOut={(e) => { e.target.style.background = 'rgba(239, 68, 68, 0.1)'; e.target.style.color = '#ef4444'; }}>Delete</button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {selectedUser && (
                    <div className="data-section" style={{ 
                        width: '450px', position: 'fixed', right: '40px', bottom: '40px', zIndex: 100, 
                        background: 'rgba(10, 12, 18, 0.95)', border: '1px solid #00ffe7', 
                        boxShadow: '0 0 40px rgba(0, 255, 231, 0.15)', backdropFilter: 'blur(10px)', 
                        animation: 'slideInRight 0.3s ease-out', maxHeight: '85vh', display: 'flex', flexDirection: 'column'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', flexShrink: 0 }}>
                            <h3 style={{ margin: 0, color: '#00ffe7' }}>User Details</h3>
                            <button onClick={() => setSelectedUser(null)} style={{ background: 'transparent', border: 'none', color: '#8b92a5', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                        </div>

                        <div className="forensic-scroll" style={{ overflowY: 'auto', paddingRight: '10px', flex: 1 }}>
                            
                            <div style={{ marginBottom: '20px', background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <p style={{ margin: '0 0 5px 0', color: '#8b92a5', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Selected User</p>
                                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.3rem', color: '#fff' }}>{selectedUser.name}</p>
                                <p style={{ margin: 0, color: '#a855f7', fontSize: '0.9rem', fontFamily: 'monospace' }}>{selectedUser.email}</p>
                            </div>

                            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', color: '#8b92a5', fontSize: '0.75rem', marginBottom: '8px', textTransform: 'uppercase' }}>Change Role</label>
                                    <select value={editRole} onChange={(e) => setEditRole(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '10px', borderRadius: '8px', outline: 'none' }}>
                                        <option value="user">Standard User</option>
                                        <option value="admin">System Admin</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', color: '#8b92a5', fontSize: '0.75rem', marginBottom: '8px', textTransform: 'uppercase' }}>Edit XP</label>
                                    <input type="number" value={editXp} onChange={(e) => setEditXp(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#00ffe7', padding: '10px', borderRadius: '8px', outline: 'none', fontWeight: 'bold', fontSize: '1.1rem' }} />
                                </div>
                            </div>
                            
                            <button onClick={handleUpdateUser} disabled={isUpdating} style={{ width: '100%', background: 'linear-gradient(90deg, #00ffe7, #7f5cff)', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.2s', marginBottom: '30px' }}>
                                {isUpdating ? "Saving..." : "Save Changes"}
                            </button>

                            <div style={{ borderTop: '1px dashed rgba(0, 255, 231, 0.3)', paddingTop: '20px' }}>
                                <h4 style={{ color: '#00ffe7', margin: '0 0 15px 0', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '1.2rem' }}>👁️</span> Activity History</h4>
                                {isLoadingActivities ? (
                                    <div style={{ color: '#8b92a5', fontFamily: 'monospace', fontStyle: 'italic' }}>Loading records...</div>
                                ) : selectedUserActivities.length === 0 ? (
                                    <div style={{ color: '#ef4444', fontFamily: 'monospace', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>No activity found for this user.</div>
                                ) : (
                                    <div style={{ position: 'relative', paddingLeft: '15px' }}>
                                        <div style={{ position: 'absolute', left: '0', top: '10px', bottom: '10px', width: '2px', background: 'rgba(0, 255, 231, 0.2)' }}></div>
                                        {selectedUserActivities.map((act, i) => {
                                            const date = new Date(act.created_at);
                                            const timeStr = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2,'0')}`;
                                            let dotColor = '#00ffe7';
                                            if (act.energy_level < 4) dotColor = '#ef4444'; 
                                            else if (act.energy_level > 7) dotColor = '#10b981'; 

                                            return (
                                                <div key={act.id} style={{ position: 'relative', marginBottom: '20px' }}>
                                                    <div style={{ position: 'absolute', left: '-20px', top: '5px', width: '12px', height: '12px', borderRadius: '50%', background: dotColor, border: '2px solid #0a0c12', boxShadow: `0 0 10px ${dotColor}` }}></div>
                                                    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem' }}>{act.name || act.title}</span>
                                                            <span style={{ color: '#8b92a5', fontSize: '0.75rem', fontFamily: 'monospace' }}>[{timeStr}]</span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '15px', fontSize: '0.8rem', color: '#a855f7', fontFamily: 'monospace' }}>
                                                            <span>🧠 Mood: {act.mood_level}/10</span>
                                                            <span style={{ color: dotColor }}>⚡ Energy: {act.energy_level}/10</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
              </div>
            </>
          )}

          {/* =========================================
              TAB 3: OMNIVERSE MAP
          ========================================== */}
          {activeTab === 'omniverse' && (
            <>
              <h1 className="page-title">Global Omniverse Map</h1>
              <div className="data-section" style={{ padding: 0, overflow: 'hidden', height: '70vh', position: 'relative', border: '1px solid rgba(0, 255, 231, 0.3)', boxShadow: '0 0 40px rgba(0, 255, 231, 0.05)' }}>
                <div style={{ position: 'absolute', top: '20px', left: '30px', zIndex: 10, pointerEvents: 'none' }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', textShadow: '0 0 10px #00ffe7' }}>ALL USERS UNIVERSE</h3>
                    <p style={{ margin: '5px 0 0 0', color: '#00ffe7', fontFamily: 'monospace' }}>Live view of {omniverseData.length} goals across all users.</p>
                </div>
                <Canvas camera={{ position: [0, 80, 150], fov: 60 }} style={{ background: '#010204', cursor: 'grab' }}>
                  <ambientLight intensity={0.2} />
                  <pointLight position={[100, 100, 100]} intensity={1} color="#ffffff" />
                  <pointLight position={[-100, -100, -100]} intensity={0.5} color="#00ffe7" />
                  <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                  {omniverseData.map((planet) => <PlanetNode key={`omni-planet-${planet.id}`} planet={planet} />)}
                  <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} autoRotate autoRotateSpeed={0.5} maxDistance={300} minDistance={20} />
                  <EffectComposer disableNormalPass><Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} /></EffectComposer>
                </Canvas>
              </div>
            </>
          )}

          {/* =========================================
              TAB 4: SYSTEM CONTROLS
          ========================================== */}
          {activeTab === 'system' && (
            <>
              <h1 className="page-title">System Controls</h1>
              
              <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap' }}>
                <div className="data-section" style={{ flex: '1 1 400px', background: 'rgba(15, 5, 5, 0.8)', border: '1px solid #ef4444', boxShadow: 'inset 0 0 30px rgba(239, 68, 68, 0.15)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.3)', paddingBottom: '15px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                        <h3 style={{ margin: 0, color: '#ef4444', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px', textShadow: '0 0 10px rgba(239, 68, 68, 0.6)' }}>Global Announcement</h3>
                    </div>
                    <textarea value={directiveText} onChange={(e) => setDirectiveText(e.target.value)} placeholder="Enter message for all users..." style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fff', padding: '15px', borderRadius: '8px', outline: 'none', resize: 'none', fontFamily: 'monospace', marginBottom: '15px', minHeight: '120px' }} />
                    <button onClick={handleTransmitDirective} disabled={isTransmitting || !directiveText.trim()} style={{ width: '100%', background: isTransmitting || !directiveText.trim() ? 'rgba(239, 68, 68, 0.2)' : '#ef4444', color: isTransmitting || !directiveText.trim() ? '#fca5a5' : '#000', border: 'none', padding: '15px', borderRadius: '8px', fontWeight: '900', cursor: isTransmitting || !directiveText.trim() ? 'not-allowed' : 'pointer', textTransform: 'uppercase', letterSpacing: '2px', transition: 'all 0.3s', boxShadow: isTransmitting || !directiveText.trim() ? 'none' : '0 0 15px rgba(239, 68, 68, 0.5)' }}>
                        {isTransmitting ? "TRANSMITTING..." : "TRANSMIT"}
                    </button>
                </div>

                <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    
                    <div className="data-section" style={{ padding: '25px', border: '1px solid #10b981', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.05)' }}>
                        <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>XP Airdrop</div>
                        <div style={{ color: '#a7f3d0', fontSize: '0.9rem', marginBottom: '20px' }}>Reward all standard users simultaneously.</div>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <input type="number" value={airdropAmount} onChange={(e) => setAirdropAmount(e.target.value)} style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid #10b981', color: '#10b981', padding: '15px', borderRadius: '8px', outline: 'none', fontSize: '1.2rem', fontWeight: 'bold' }} />
                            <button onClick={handleGlobalAirdrop} disabled={isAirdropping} style={{ background: isAirdropping ? 'transparent' : '#10b981', border: '2px solid #10b981', color: isAirdropping ? '#10b981' : '#000', padding: '15px 30px', borderRadius: '8px', fontWeight: '900', cursor: isAirdropping ? 'not-allowed' : 'pointer', boxShadow: isAirdropping ? 'none' : '0 0 20px rgba(16, 185, 129, 0.4)', transition: 'all 0.3s' }}>
                                {isAirdropping ? "DEPLOYING..." : "DEPLOY XP"}
                            </button>
                        </div>
                    </div>

                    <div className="data-section" style={{ padding: '25px', border: '1px solid #ef4444', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.05)' }}>
                        <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>System Lockdown</div>
                        <div style={{ color: '#fca5a5', fontSize: '0.9rem', marginBottom: '20px' }}>Instantly lock out all users from accessing the platform.</div>
                        <button onClick={handleToggleBlackout} style={{ width: '100%', background: isBlackoutActive ? '#ef4444' : 'transparent', border: '2px solid #ef4444', color: isBlackoutActive ? '#000' : '#ef4444', padding: '15px 20px', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', boxShadow: isBlackoutActive ? '0 0 20px #ef4444' : 'none', transition: 'all 0.3s' }}>
                            {isBlackoutActive ? "SYSTEM LOCKED" : "LOCKDOWN SYSTEM"}
                        </button>
                    </div>

                </div>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}