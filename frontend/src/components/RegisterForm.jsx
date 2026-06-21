import React, { useState } from 'react';
import { Mail, Lock, User, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function RegisterForm({ onBackToLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('PATIENT');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:4004/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password, role })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('Registration successful! You can now log in.');
        // Clear fields
        setUsername('');
        setEmail('');
        setPassword('');
        setRole('PATIENT');
        setTimeout(() => {
          onBackToLogin(email); // Pass registered email back to login form
        }, 1500);
      } else {
        setError(data.message || 'Registration failed. Please check your inputs.');
      }
    } catch (err) {
      setError('Failed to connect to authentication service.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-card glass fade-in">
      <button 
        onClick={() => onBackToLogin()} 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.35rem', 
          background: 'none', 
          border: 'none', 
          color: 'var(--color-text-secondary)', 
          cursor: 'pointer',
          fontSize: '0.85rem',
          marginBottom: '1.5rem',
          padding: 0
        }}
      >
        <ArrowLeft size={16} /> Back to Login
      </button>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800 }}>Create Account</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Join the PatientLens AI Network</p>
      </div>

      {error && (
        <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <User size={14} /> Username
          </label>
          <input 
            type="text" 
            className="form-input" 
            required 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            placeholder="e.g. john.doe"
            minLength={3}
            maxLength={50}
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Mail size={14} /> Email Address
          </label>
          <input 
            type="email" 
            className="form-input" 
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="name@domain.com" 
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Lock size={14} /> Password
          </label>
          <input 
            type="password" 
            className="form-input" 
            required 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Min. 8 characters"
            minLength={8}
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ShieldAlert size={14} /> Register As Role
          </label>
          <select 
            className="form-input" 
            value={role} 
            onChange={(e) => setRole(e.target.value)}
            style={{ appearance: 'auto', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
          >
            <option value="PATIENT">Patient</option>
            <option value="DOCTOR">Doctor</option>
            <option value="ADMIN">System Administrator</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} disabled={loading}>
          {loading ? 'Registering Account...' : 'Register'}
        </button>
      </form>
    </div>
  );
}
