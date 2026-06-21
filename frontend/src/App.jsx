import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, ShieldAlert, LogOut, Lock, Mail, Activity } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Patients from './components/Patients';
import BookingSaga from './components/BookingSaga';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Credentials form state
  const [email, setEmail] = useState('testuser@test.com');
  const [password, setPassword] = useState('password123');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Global domain state
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    if (token) {
      fetchPatients();
      fetchDoctors();
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);

    try {
      const response = await fetch('http://localhost:4004/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        setToken(data.token);
      } else {
        setLoginError('Invalid email or password.');
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
    setToken('');
    setPatients([]);
    setDoctors([]);
  };

  const fetchPatients = async () => {
    try {
      const res = await fetch('http://localhost:4004/api/patients', {
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
      const res = await fetch('http://localhost:4004/api/doctors', {
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

  // If no auth token, render the Glassmorphic Login card
  if (!token) {
    return (
      <div className="auth-panel">
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
                <Mail size={14} /> Email Address
              </label>
              <input type="email" className="form-input" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@domain.com" />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Lock size={14} /> Password
              </label>
              <input type="password" className="form-input" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} disabled={loggingIn}>
              {loggingIn ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            Pre-seeded credentials are pre-filled above.
          </div>
        </div>
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
            <li className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              <LayoutDashboard />
              <span>Dashboard</span>
            </li>
            <li className={`nav-item ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => setActiveTab('patients')}>
              <Users />
              <span>Patient Registry</span>
            </li>
            <li className={`nav-item ${activeTab === 'booking' ? 'active' : ''}`} onClick={() => setActiveTab('booking')}>
              <ShieldAlert />
              <span>Saga Appointment Portal</span>
            </li>
          </ul>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
            <div className="avatar">AD</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden' }}>Administrator</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden' }}>testuser@test.com</div>
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
          <Dashboard token={token} patients={patients} doctors={doctors} />
        )}
        {activeTab === 'patients' && (
          <Patients token={token} patients={patients} onPatientCreated={(newP) => setPatients(prev => [...prev, newP])} />
        )}
        {activeTab === 'booking' && (
          <BookingSaga token={token} patients={patients} doctors={doctors} onBookingComplete={fetchPatients} />
        )}
      </main>
    </div>
  );
}
