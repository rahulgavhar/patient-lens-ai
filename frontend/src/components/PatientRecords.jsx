import React, { useEffect, useState } from 'react';
import { User, Shield, Receipt, Calendar, Activity, Phone, Mail, Award, Heart } from 'lucide-react';

export default function PatientRecords({ token, userRole, username, patients }) {
  const isPatient = userRole === 'PATIENT';
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('invoices');

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  useEffect(() => {
    if (patients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(patients[0].id);
    }
  }, [patients]);

  useEffect(() => {
    if (selectedPatientId && token) {
      fetchPatientData();
    }
  }, [selectedPatientId, token]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      // Fetch invoices
      const invoicesRes = await fetch(`https://wake-controller.onrender.com/api/billing/invoices/patient/${selectedPatientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (invoicesRes.ok) {
        const invData = await invoicesRes.json();
        setInvoices(invData);
      }

      // Fetch appointments
      const apptRes = await fetch(`https://wake-controller.onrender.com/api/appointments/patient/${selectedPatientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (apptRes.ok) {
        const apptData = await apptRes.json();
        setAppointments(apptData);
      }
    } catch (err) {
      console.error("Error fetching patient details:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="app-header">
        <div>
          <h2>{isPatient ? 'My Medical Records' : 'Patient Profiles & Charts'}</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{isPatient ? 'View your medical summary, invoices, and appointment history.' : 'Lookup complete medical summaries, billing accounts, and event logs.'}</p>
        </div>
      </div>

      {!isPatient && (
        <div style={{ marginBottom: '2rem' }} className="glass">
          <div style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>Select Patient Record:</label>
            <select className="form-select" style={{ maxWidth: '350px', margin: 0 }} value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)}>
              {patients.length === 0 ? (
                <option value="">No onboarded patients found</option>
              ) : (
                patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                ))
              )}
            </select>
          </div>
        </div>
      )}

      {selectedPatient ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          {/* Medical Summary Card */}
          <div className="panel glass fade-in" style={{ padding: '2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem' }}>
              <div className="avatar" style={{ width: '64px', height: '64px', fontSize: '1.5rem', margin: '0 auto 1rem' }}>
                {selectedPatient.name.split(' ').map(n => n[0]).join('')}
              </div>
              <h3>{selectedPatient.name}</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Patient ID: <code>{selectedPatient.id.substring(0, 8)}...</code></p>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                <span className="badge badge-info"><Heart size={12} style={{ marginRight: '0.25rem' }} /> Blood {selectedPatient.bloodGroup || 'N/A'}</span>
                <span className="badge badge-success">Active Chart</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Mail size={16} style={{ color: 'var(--color-primary)' }} />
                <div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Email Address</div>
                  <div style={{ color: 'var(--color-text-primary)' }}>{selectedPatient.email}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Phone size={16} style={{ color: 'var(--color-secondary)' }} />
                <div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Phone Number</div>
                  <div style={{ color: 'var(--color-text-primary)' }}>{selectedPatient.phoneNumber || 'N/A'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Calendar size={16} style={{ color: 'var(--color-success)' }} />
                <div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Date of Birth</div>
                  <div style={{ color: 'var(--color-text-primary)' }}>{selectedPatient.dateOfBirth || 'N/A'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Award size={16} style={{ color: 'var(--color-warning)' }} />
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Height</div>
                    <div style={{ color: 'var(--color-text-primary)' }}>{selectedPatient.height ? `${selectedPatient.height} cm` : 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Weight</div>
                    <div style={{ color: 'var(--color-text-primary)' }}>{selectedPatient.weight ? `${selectedPatient.weight} kg` : 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Shield size={16} style={{ color: 'var(--color-accent)' }} />
                  <div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Insurance Provider</div>
                    <div style={{ color: 'var(--color-text-primary)', fontWeight: '500' }}>{selectedPatient.insuranceProvider || 'Not Provided'}</div>
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(6, 182, 212, 0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--color-border-active)', marginTop: '0.5rem' }}>
                <div style={{ color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Billing Account</div>
                <code style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', display: 'block', wordBreak: 'break-all' }}>
                  {selectedPatient.billingAccountId || 'PROVISIONING...'}
                </code>
              </div>
            </div>
          </div>

          {/* Transactions / History Timeline Tabs */}
          <div className="panel glass" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <button className={`btn ${activeSubTab === 'invoices' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setActiveSubTab('invoices')}>
                <Receipt size={16} /> Invoices ({invoices.length})
              </button>
              <button className={`btn ${activeSubTab === 'appointments' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setActiveSubTab('appointments')}>
                <Calendar size={16} /> Appointment Saga Logs ({appointments.length})
              </button>
            </div>

            {loading ? (
              <p style={{ color: 'var(--color-text-secondary)', padding: '2rem', textAlign: 'center' }}>Loading historical events...</p>
            ) : activeSubTab === 'invoices' ? (
              <div className="table-wrapper">
                {invoices.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>No billing invoices found. Execute an appointment to generate billing clearing accounts.</p>
                ) : (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Invoice ID</th>
                        <th>Appointment ID</th>
                        <th>Amount</th>
                        <th>Billing Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td><code style={{ color: 'var(--color-primary)' }}>{inv.id.substring(0, 8)}...</code></td>
                          <td><code style={{ color: 'var(--color-text-muted)' }}>{inv.appointmentId.substring(0, 8)}...</code></td>
                          <td style={{ fontWeight: '600' }}>${inv.amount.toFixed(2)}</td>
                          <td>
                            <span className={`badge ${inv.status === 'PAID' ? 'badge-success' : 'badge-danger'}`}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              <div className="table-wrapper">
                {appointments.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>No appointment bookings found for this patient.</p>
                ) : (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Booking ID</th>
                        <th>Doctor Ref</th>
                        <th>Date & Time</th>
                        <th>Charge</th>
                        <th>Transaction Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appt) => (
                        <tr key={appt.id}>
                          <td><code style={{ color: 'var(--color-text-muted)' }}>{appt.id.substring(0, 8)}...</code></td>
                          <td>{appt.doctorId.substring(0, 8)}...</td>
                          <td>{appt.slotDatetime.replace('T', ' ')}</td>
                          <td style={{ fontWeight: '600' }}>${appt.amount.toFixed(2)}</td>
                          <td>
                            <span className={`badge ${
                              appt.status === 'CONFIRMED' ? 'badge-success' : 
                              appt.status === 'CANCELLED' ? 'badge-danger' : 'badge-info'
                            }`}>
                              {appt.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="panel glass" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Please onboard a patient first to view medical records.
        </div>
      )}
    </div>
  );
}
