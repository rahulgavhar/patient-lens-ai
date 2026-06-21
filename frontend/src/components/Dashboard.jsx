import React, { useEffect, useState } from 'react';
import { Users, UserCheck, Receipt, DollarSign, Activity } from 'lucide-react';

export default function Dashboard({ token, patients, doctors }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (patients.length > 0 && token) {
      fetchInvoices();
    }
  }, [patients, token]);

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

  return (
    <div className="fade-in">
      <div className="app-header">
        <div>
          <h2>Dashboard</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Welcome to PatientLens AI control panel.</p>
        </div>
      </div>

      <div className="metrics-grid">
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

        <div className="metric-card glass">
          <div className="metric-info">
            <div>
              <div className="metric-title">Paid Invoices</div>
              <div className="metric-value">{invoices.filter(i => i.status === 'PAID').length}</div>
            </div>
            <div className="metric-icon-wrapper" style={{ color: 'var(--color-success)', background: 'rgba(16, 185, 129, 0.1)' }}>
              <Receipt size={24} />
            </div>
          </div>
          <div className="metric-trend">
            <span className="trend-up">Processed via Kafka</span>
          </div>
        </div>

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
      </div>

      <div className="panel glass">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 className="section-title" style={{ margin: 0 }}>
            <Activity size={20} /> Recent Billing Transactions
          </h3>
          <button className="btn btn-secondary" onClick={fetchInvoices} disabled={loading} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="table-wrapper">
          {invoices.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>No billing transactions found. Try booking an appointment.</p>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Patient ID</th>
                  <th>Appointment ID</th>
                  <th>Amount</th>
                  <th>Billing Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice, index) => (
                  <tr key={invoice.id || index}>
                    <td>
                      <code style={{ color: 'var(--color-primary)' }}>{invoice.id ? invoice.id.substring(0, 8) : 'N/A'}...</code>
                    </td>
                    <td>{patients.find(p => p.id === invoice.patientId)?.name || invoice.patientId.substring(0, 8) + '...'}</td>
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
