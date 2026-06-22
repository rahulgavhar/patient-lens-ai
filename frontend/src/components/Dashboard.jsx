import React, { useEffect, useState } from 'react';
import { Users, UserCheck, Receipt, DollarSign, Activity, CalendarCheck, AlertTriangle } from 'lucide-react';

export default function Dashboard({ token, userRole, username, patients, doctors }) {
  const isPatient = userRole === 'PATIENT';
  const isAdmin = userRole === 'ADMIN';
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [sosSent, setSosSent] = useState(false);

  useEffect(() => {
    if (patients.length > 0 && token) {
      fetchInvoices();
    }
    
    // Listen for SOS alerts if admin
    let intervalId;
    if (isAdmin) {
      const fetchAlerts = async () => {
        try {
          const res = await fetch('http://localhost:4004/api/patients/sos/active', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setSosAlerts(data);
          }
        } catch (err) {
          console.error("Failed to fetch SOS alerts:", err);
        }
      };
      
      fetchAlerts(); // initial fetch
      intervalId = setInterval(fetchAlerts, 5000); // poll every 5s
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [patients, token, isAdmin]);

  const triggerSOS = async () => {
    setSosSent(true);
    try {
      await fetch('http://localhost:4004/api/patients/sos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: username || 'anonymous',
          patientName: username || 'Anonymous Patient'
        })
      });
    } catch (err) {
      console.error("Failed to send SOS:", err);
    }
    
    setTimeout(() => setSosSent(false), 5000); // Reset button after 5s
  };

  const dismissAlert = async (id) => {
    try {
      await fetch(`http://localhost:4004/api/patients/sos/${id}/resolve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSosAlerts(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error("Failed to resolve alert:", err);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const allInvoices = [];
      for (const p of patients) {
        try {
          const res = await fetch(`http://localhost:4004/api/billing/invoices/patient/${p.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            allInvoices.push(...data);
          }
        } catch (e) {
          console.error(`Error fetching invoices for patient ${p.id}:`, e);
        }
      }
      // Sort invoices by createdDate or similar if available, or just reverse order
      setInvoices(allInvoices.reverse());
    } catch (err) {
      console.error("Failed to compile invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalBilling = invoices.reduce((sum, inv) => {
    if (inv.status === 'PAID') return sum + inv.amount;
    return sum;
  }, 0);

  const getGreeting = () => {
    if (userRole === 'ADMIN') return 'Welcome back, System Administrator';
    if (userRole === 'DOCTOR') return 'Welcome back, Clinical Specialist';
    if (userRole === 'PATIENT') return 'Welcome to your Health Portal';
    return 'Welcome to PatientLens AI';
  };

  const getSubtitle = () => {
    if (isPatient) return 'View your appointments, payments, and health activity at a glance.';
    return 'Control panel is configured for your role access permissions.';
  };

  return (
    <div className="fade-in">
      <div className="app-header">
        <div>
          <h2>Dashboard</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{getGreeting()}. {getSubtitle()}</p>
        </div>
        {isPatient && (
          <button 
            className={`btn ${sosSent ? 'btn-secondary' : 'btn-danger'}`} 
            onClick={triggerSOS}
            disabled={sosSent}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}
          >
            <AlertTriangle size={18} />
            {sosSent ? 'SOS SENT' : 'EMERGENCY SOS'}
          </button>
        )}
      </div>

      {isAdmin && sosAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {sosAlerts.map(alert => (
            <div key={alert.id} className="fade-in" style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(244, 63, 94, 0.2)', padding: '0.5rem', borderRadius: '50%', color: '#fb7185' }}>
                  <AlertTriangle size={24} style={{ animation: 'pulse-glow 1s infinite alternate' }} />
                </div>
                <div>
                  <h4 style={{ margin: 0, color: '#fb7185', fontWeight: '700' }}>EMERGENCY ALERT: {alert.patientName}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Triggered at {new Date(alert.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <button className="btn btn-secondary" onClick={() => dismissAlert(alert.id)} style={{ borderColor: 'rgba(244, 63, 94, 0.3)', color: '#fb7185' }}>
                Acknowledge & Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="metrics-grid">
        {/* Card 1: Total Patients (Admin/Doctor) OR My Payments (Patient) */}
        {isPatient ? (
          <div className="metric-card glass">
            <div className="metric-info">
              <div>
                <div className="metric-title">My Payments</div>
                <div className="metric-value">{invoices.filter(i => i.status === 'PAID').length}</div>
              </div>
              <div className="metric-icon-wrapper" style={{ color: 'var(--color-success)', background: 'rgba(16, 185, 129, 0.1)' }}>
                <Receipt size={24} />
              </div>
            </div>
            <div className="metric-trend">
              <span className="trend-up">Completed</span>
            </div>
          </div>
        ) : (
          <div className="metric-card glass">
            <div className="metric-info">
              <div>
                <div className="metric-title">Total Patients</div>
                <div className="metric-value">{patients.length}</div>
              </div>
              <div className="metric-icon-wrapper">
                <Users size={24} />
              </div>
            </div>
            <div className="metric-trend">
              <span className="trend-up">Active in system</span>
            </div>
          </div>
        )}

        {/* Card 2: Available Doctors (Admin/Doctor) OR Amount Paid (Patient) */}
        {isPatient ? (
          <div className="metric-card glass">
            <div className="metric-info">
              <div>
                <div className="metric-title">Total Spent</div>
                <div className="metric-value">${totalBilling.toFixed(2)}</div>
              </div>
              <div className="metric-icon-wrapper" style={{ color: 'var(--color-warning)', background: 'rgba(245, 158, 11, 0.1)' }}>
                <DollarSign size={24} />
              </div>
            </div>
            <div className="metric-trend">
              <span className="trend-up">Payment received</span>
            </div>
          </div>
        ) : (
          <div className="metric-card glass">
            <div className="metric-info">
              <div>
                <div className="metric-title">Available Doctors</div>
                <div className="metric-value">{doctors.length}</div>
              </div>
              <div className="metric-icon-wrapper" style={{ color: 'var(--color-secondary)', background: 'rgba(99, 102, 241, 0.1)' }}>
                <UserCheck size={24} />
              </div>
            </div>
            <div className="metric-trend">
              <span className="trend-up">Onboarded Specialists</span>
            </div>
          </div>
        )}

        {/* Card 3: Paid Invoices */}
        <div className="metric-card glass">
          <div className="metric-info">
            <div>
              <div className="metric-title">{isPatient ? 'Invoices' : 'Paid Invoices'}</div>
              <div className="metric-value">{invoices.filter(i => i.status === 'PAID').length}</div>
            </div>
            <div className="metric-icon-wrapper" style={{ color: isPatient ? 'var(--color-primary)' : 'var(--color-success)', background: isPatient ? 'rgba(6, 182, 212, 0.1)' : 'rgba(16, 185, 129, 0.1)' }}>
              <Receipt size={24} />
            </div>
          </div>
          <div className="metric-trend">
            <span className="trend-up">{isPatient ? 'Completed' : 'Processed via Kafka'}</span>
          </div>
        </div>

        {/* Card 4: Revenue (Admin/Doctor) OR Appointments placeholder (Patient) */}
        {isPatient ? (
          <div className="metric-card glass">
            <div className="metric-info">
              <div>
                <div className="metric-title">Appointments</div>
                <div className="metric-value">{invoices.length}</div>
              </div>
              <div className="metric-icon-wrapper" style={{ color: 'var(--color-secondary)', background: 'rgba(99, 102, 241, 0.1)' }}>
                <CalendarCheck size={24} />
              </div>
            </div>
            <div className="metric-trend">
              <span className="trend-up">Booked</span>
            </div>
          </div>
        ) : (
          <div className="metric-card glass">
            <div className="metric-info">
              <div>
                <div className="metric-title">Revenue Collected</div>
                <div className="metric-value">${totalBilling.toFixed(2)}</div>
              </div>
              <div className="metric-icon-wrapper" style={{ color: 'var(--color-warning)', background: 'rgba(245, 158, 11, 0.1)' }}>
                <DollarSign size={24} />
              </div>
            </div>
            <div className="metric-trend">
              <span className="trend-up">Direct clearing</span>
            </div>
          </div>
        )}
      </div>

      <div className="panel glass">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 className="section-title" style={{ margin: 0 }}>
            <Activity size={20} /> {isPatient ? 'My Payment History' : 'Recent Billing Transactions'}
          </h3>
          <button className="btn btn-secondary" onClick={fetchInvoices} disabled={loading} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="table-wrapper">
          {invoices.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
              {isPatient ? 'No payments found yet. Book an appointment to get started.' : 'No billing transactions found. Try booking an appointment.'}
            </p>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>{isPatient ? 'Receipt #' : 'Invoice ID'}</th>
                  {!isPatient && <th>Patient</th>}
                  <th>{isPatient ? 'Reference' : 'Appointment ID'}</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice, index) => (
                  <tr key={invoice.id || index}>
                    <td>
                      <code style={{ color: 'var(--color-primary)' }}>{invoice.id ? invoice.id.substring(0, 8) : 'N/A'}...</code>
                    </td>
                    {!isPatient && (
                      <td>{patients.find(p => p.id === invoice.patientId)?.name || invoice.patientId.substring(0, 8) + '...'}</td>
                    )}
                    <td>
                      <code style={{ color: 'var(--color-text-muted)' }}>{invoice.appointmentId ? invoice.appointmentId.substring(0, 8) : 'N/A'}...</code>
                    </td>
                    <td style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>${invoice.amount.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${invoice.status === 'PAID' ? 'badge-success' : 'badge-danger'}`}>
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
