import React, { useState } from 'react';
import { UserPlus, Users, Sparkles } from 'lucide-react';

export default function Patients({ token, userRole, patients, onPatientCreated }) {
  const canCreate = userRole === 'ADMIN';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleOnboard = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const payload = {
      name,
      email,
      address,
      dateOfBirth,
      height: parseFloat(height) || 0,
      weight: parseFloat(weight) || 0,
      bloodGroup,
      phoneNumber,
      emergencyContact,
      insuranceProvider
    };

    try {
      const response = await fetch('http://localhost:4004/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok || response.status === 201) {
        const newPatient = await response.json();
        setSuccessMsg(`Patient ${newPatient.name} onboarded successfully! Billing account auto-provisioned.`);
        // Reset form
        setName('');
        setEmail('');
        setAddress('');
        setDateOfBirth('');
        setHeight('');
        setWeight('');
        setBloodGroup('O+');
        setPhoneNumber('');
        setEmergencyContact('');
        setInsuranceProvider('');
        
        if (onPatientCreated) {
          onPatientCreated(newPatient);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setErrorMsg(errorData.error || errorData.message || 'Failed to onboard patient. Please check email or inputs.');
      }
    } catch (err) {
      setErrorMsg('Network error. Cannot reach API Gateway.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const setDemoData = () => {
    const timestamp = Date.now();
    setName('Jane Smith');
    setEmail(`jane.smith.${timestamp}@example.com`);
    setAddress('456 Oak Ave, Seattle, WA');
    setDateOfBirth('1992-08-14');
    setHeight('168');
    setWeight('62');
    setBloodGroup('A-');
    setPhoneNumber('+1-206-555-0143');
    setEmergencyContact('Robert Smith (+1-206-555-0144)');
    setInsuranceProvider('Aetna Premium Health');
  };

  return (
    <div className="fade-in">
      <div className="app-header">
        <div>
          <h2>Patient Registry</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Onboard new patients and view registered records.</p>
        </div>
      </div>

      <div className={canCreate ? 'panel-grid' : ''}>
        <div className="panel glass">
          <h3 className="section-title">
            <Users size={20} /> Registered Patients
          </h3>
          
          <div className="table-wrapper">
            {patients.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>No patients registered yet. Onboard one using the form.</p>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Insurance</th>
                    <th>Billing Account</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: '500', color: 'var(--color-text-primary)' }}>{p.name}</td>
                      <td>{p.email}</td>
                      <td>{p.phoneNumber || 'N/A'}</td>
                      <td>{p.insuranceProvider || 'None'}</td>
                      <td>
                        <code style={{ color: 'var(--color-success)' }}>
                          {p.billingAccountId ? p.billingAccountId.substring(0, 8) + '...' : 'PENDING'}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {canCreate && (
        <div className="panel glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 className="section-title" style={{ margin: 0 }}>
              <UserPlus size={20} /> Onboard Patient
            </h3>
            <button type="button" className="btn btn-secondary" onClick={setDemoData} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              <Sparkles size={12} /> Fill Demo
            </button>
          </div>

          {errorMsg && (
            <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleOnboard}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="text" className="form-input" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+1-555-1234" />
            </div>

            <div className="form-group">
              <label className="form-label">Home Address</label>
              <input type="text" className="form-input" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, Seattle, WA" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input type="date" className="form-input" required value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select className="form-select" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Height (cm)</label>
                <input type="number" step="0.1" className="form-input" required value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" />
              </div>
              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input type="number" step="0.1" className="form-input" required value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="65" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Insurance Provider</label>
              <input type="text" className="form-input" required value={insuranceProvider} onChange={(e) => setInsuranceProvider(e.target.value)} placeholder="Blue Shield Corp" />
            </div>

            <div className="form-group">
              <label className="form-label">Emergency Contact Name & Phone</label>
              <input type="text" className="form-input" required value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder="John Doe (+1-555-5678)" />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={submitting}>
              {submitting ? 'Onboarding...' : 'Onboard Patient'}
            </button>
          </form>
        </div>
        )}
      </div>
    </div>
  );
}
