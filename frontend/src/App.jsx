import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, ShieldAlert, LogOut, Lock, Mail, Activity, FileText, UserCheck, Bot, BarChart3, User, Brain, Eye, EyeOff, CalendarCheck } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Patients from './components/Patients';
import PatientRecords from './components/PatientRecords';
import Doctors from './components/Doctors';
import BookingSaga from './components/BookingSaga';
import AiAssistant from './components/AiAssistant';
import Analytics from './components/Analytics';
import RegisterForm from './components/RegisterForm';
import MultimodalCdss from './components/MultimodalCdss';
import LandingPage from './components/LandingPage';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || '');
  const [userEmail, setUserEmail] = useState(localStorage.getItem('email') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [currentView, setCurrentView] = useState('landing');
  
  // Credentials form state (email or username)
  const [emailOrUsername, setEmailOrUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Global domain state
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Auto-switch credentials placeholder for demo convenience
  useEffect(() => {
    if (isRegisterMode) return;
    // Default demo credentials
    if (emailOrUsername === 'admin' || emailOrUsername === 'dr.house' || emailOrUsername === 'john.doe') {
      setPassword('password123');
    }
  }, [emailOrUsername, isRegisterMode]);

  useEffect(() => {
    if (token) {
      // Fetch data based on role permissions
      if (hasPermission('patients', 'read')) {
        fetchPatients();
      }
      if (hasPermission('doctors', 'read')) {
        fetchDoctors();
      }
    }
  }, [token, userRole]);

  // Enforce role-based access control locally for safety
  const hasPermission = (tab, action = 'read') => {
    if (userRole === 'ADMIN') return true;
    if (userRole === 'DOCTOR') {
      return ['dashboard', 'patients', 'patient-records', 'doctors', 'ai-assistant', 'booking', 'multimodal-cdss'].includes(tab);
    }
    if (userRole === 'PATIENT') {
      // Patient has access to read patient records, dashboard, saga booking, and ai assistant
      if (tab === 'patients' && action === 'write') return false;
      return ['dashboard', 'patient-records', 'ai-assistant', 'booking'].includes(tab);
    }
    return false;
  };

  // Adjust active tab if the user's role changed or on load to a tab they don't have access to
  useEffect(() => {
    if (token && !hasPermission(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [userRole, activeTab, token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);

    try {
      const payload = { password };
      if (emailOrUsername.includes('@')) {
        payload.email = emailOrUsername;
      } else {
        payload.username = emailOrUsername;
      }

      const response = await fetch('https://wake-controller.onrender.com/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('email', data.email);
        localStorage.setItem('username', data.username);
        
        setToken(data.token);
        setUserRole(data.role);
        setUserEmail(data.email);
        setUsername(data.username);
        setActiveTab('dashboard');
      } else {
        setLoginError('Invalid credentials. Check username/email and password.');
      }
    } catch (err) {
      setLoginError('Failed to connect to authentication service.');
      console.error(err);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('username');
    setToken('');
    setUserRole('');
    setUserEmail('');
    setUsername('');
    setPatients([]);
    setDoctors([]);
  };

  const fetchPatients = async () => {
    try {
      const res = await fetch('https://wake-controller.onrender.com/api/patients', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (e) {
      console.error("Failed to fetch patients:", e);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch('https://wake-controller.onrender.com/api/doctors', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDoctors(data);
      }
    } catch (e) {
      console.error("Failed to fetch doctors:", e);
    }
  };

  const getInitials = (name, emailStr) => {
    const primary = name || emailStr || 'U';
    return primary.split(/[\.@]/).map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadgeColor = (role) => {
    if (role === 'ADMIN') return '#ec4899'; // pink
    if (role === 'DOCTOR') return '#06b6d4'; // cyan
    return '#10b981'; // emerald/green
  };

  // Switch from registration back to login
  const handleBackToLogin = (registeredEmail) => {
    setIsRegisterMode(false);
    if (registeredEmail) {
      setEmailOrUsername(registeredEmail);
      setPassword('');
    }
  };

  // If no auth token, handle Landing vs Auth flows
  if (!token) {
    if (currentView === 'landing') {
      return <LandingPage onNavigateToAuth={() => setCurrentView('auth')} />;
    }

    return (
      <div className="auth-panel" style={{ position: 'relative' }}>
        <button 
          onClick={() => setCurrentView('landing')}
          style={{ position: 'absolute', top: '2rem', left: '2rem', background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
        >
          &larr; Back to Home
        </button>
        {isRegisterMode ? (
          <RegisterForm onBackToLogin={handleBackToLogin} />
        ) : (
          <div className="login-card glass fade-in">
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{ display: 'inline-flex', padding: '0.75rem', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '50%', color: 'var(--color-primary)', marginBottom: '1rem' }}>
                <Activity size={32} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800 }}>PatientLens AI</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Microservice Saga Control Dashboard</p>
            </div>

            {loginError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={14} /> Username or Email Address
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={emailOrUsername} 
                  onChange={(e) => setEmailOrUsername(e.target.value)} 
                  placeholder="admin, dr.house, or email" 
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Lock size={14} /> Password
                </label>
                <div className="password-input-container">
                  <input 
                    type={showLoginPassword ? "text" : "password"} 
                    className="form-input password-input" 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    aria-label={showLoginPassword ? "Hide password" : "Show password"}
                  >
                    {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} disabled={loggingIn}>
                {loggingIn ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button 
                onClick={() => setIsRegisterMode(true)}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}
              >
                Need an account? Register here
              </button>
            </div>

            <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1rem' }}>
              <strong>Demo Logins:</strong> admin, dr.house, john.doe (password: password123)
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="brand">
            <Activity className="brand-icon" />
            <span className="brand-text">PatientLens AI</span>
          </div>

          <ul className="nav-menu">
            {hasPermission('dashboard') && (
              <li className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                <LayoutDashboard />
                <span>Dashboard</span>
              </li>
            )}
            {hasPermission('patients') && (
              <li className={`nav-item ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => setActiveTab('patients')}>
                <Users />
                <span>Patient Registry</span>
              </li>
            )}
            {hasPermission('patient-records') && (
              <li className={`nav-item ${activeTab === 'patient-records' ? 'active' : ''}`} onClick={() => setActiveTab('patient-records')}>
                <FileText />
                <span>{userRole === 'PATIENT' ? 'My Records' : 'Patient Charts'}</span>
              </li>
            )}
            {hasPermission('doctors') && (
              <li className={`nav-item ${activeTab === 'doctors' ? 'active' : ''}`} onClick={() => setActiveTab('doctors')}>
                <UserCheck />
                <span>Specialist Network</span>
              </li>
            )}
            {hasPermission('ai-assistant') && (
              <li className={`nav-item ${activeTab === 'ai-assistant' ? 'active' : ''}`} onClick={() => setActiveTab('ai-assistant')}>
                <Bot />
                <span>{userRole === 'PATIENT' ? 'AI Health Assistant' : 'Medical AI Console'}</span>
              </li>
            )}
            {hasPermission('multimodal-cdss') && (
              <li className={`nav-item ${activeTab === 'multimodal-cdss' ? 'active' : ''}`} onClick={() => setActiveTab('multimodal-cdss')}>
                <Brain />
                <span>Clinical Decision Support</span>
              </li>
            )}
            {hasPermission('analytics') && (
              <li className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
                <BarChart3 />
                <span>System Analytics</span>
              </li>
            )}
            {hasPermission('booking') && (
              <li className={`nav-item ${activeTab === 'booking' ? 'active' : ''}`} onClick={() => setActiveTab('booking')}>
                {userRole === 'PATIENT' ? <CalendarCheck /> : <ShieldAlert />}
                <span>{userRole === 'PATIENT' ? 'Book Appointment' : 'Saga Appointment Portal'}</span>
              </li>
            )}
          </ul>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
            <div className="avatar" style={{ backgroundColor: getRoleBadgeColor(userRole) }}>
              {getInitials(username, userEmail)}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', textHighlight: 'none', textOverflow: 'ellipsis', overflow: 'hidden', color: 'var(--color-text-primary)' }}>
                {username || 'Anonymous'}
              </div>
              <div style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.08)', color: getRoleBadgeColor(userRole), marginTop: '0.2rem' }}>
                {userRole}
              </div>
            </div>
          </div>
          <button className="nav-item" onClick={handleLogout} style={{ width: '100%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <LogOut />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Viewport */}
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <Dashboard token={token} userRole={userRole} username={username} patients={patients} doctors={doctors} />
        )}
        {activeTab === 'patients' && hasPermission('patients') && (
          <Patients token={token} userRole={userRole} patients={patients} onPatientCreated={(newP) => setPatients(prev => [...prev, newP])} />
        )}
        {activeTab === 'patient-records' && hasPermission('patient-records') && (
          <PatientRecords token={token} userRole={userRole} username={username} patients={patients} />
        )}
        {activeTab === 'doctors' && hasPermission('doctors') && (
          <Doctors token={token} userRole={userRole} doctors={doctors} onDoctorCreated={(newD) => setDoctors(prev => [...prev, newD])} />
        )}
        {activeTab === 'ai-assistant' && hasPermission('ai-assistant') && (
          <AiAssistant token={token} />
        )}
        {activeTab === 'multimodal-cdss' && hasPermission('multimodal-cdss') && (
          <MultimodalCdss token={token} />
        )}
        {activeTab === 'analytics' && hasPermission('analytics') && (
          <Analytics token={token} />
        )}
        {activeTab === 'booking' && hasPermission('booking') && (
          <BookingSaga token={token} userRole={userRole} patients={patients} doctors={doctors} onBookingComplete={fetchPatients} />
        )}
      </main>
    </div>
  );
}
