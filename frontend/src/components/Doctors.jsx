import React, { useState } from 'react';
import { UserCheck, Search, Plus, Award, Stethoscope, Building, Calendar } from 'lucide-react';

export default function Doctors({ token, userRole, doctors, onDoctorCreated }) {
  const canCreate = userRole === 'ADMIN';
  const [searchTerm, setSearchTerm] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('All');
  
  // Onboarding doctor form state
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [specialization, setSpecialization] = useState('Cardiology');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const specializationsList = ['All', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology', 'Diagnostic Medicine'];

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const payload = {
      name,
      email,
      specialization,
      licenseNumber,
      phoneNumber,
      yearsOfExperience: parseInt(yearsOfExperience) || 0,
      hospitalName,
      joinedDate: new Date().toISOString().split('T')[0]
    };

    try {
      const response = await fetch('http://localhost:4004/api/doctors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok || response.status === 201) {
        const newDoc = await response.json();
        setSuccessMsg(`Dr. ${newDoc.name} successfully registered to the network!`);
        setName('');
        setEmail('');
        setLicenseNumber('');
        setPhoneNumber('');
        setYearsOfExperience('');
        setHospitalName('');
        setShowForm(false);
        if (onDoctorCreated) {
          onDoctorCreated(newDoc);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setErrorMsg(errorData.error || errorData.message || 'Failed to onboard doctor. Duplicate license or email.');
      }
    } catch (err) {
      setErrorMsg('Network error. Cannot reach API Gateway.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = specializationFilter === 'All' || doc.specialization === specializationFilter;
    return matchesSearch && matchesSpecialty;
  });

  const generateLicense = () => {
    setLicenseNumber(`LIC-${Date.now().toString().slice(-6)}`);
  };

  return (
    <div className="fade-in">
      <div className="app-header">
        <div>
          <h2>Specialist Network</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Search and onboard doctors across clinical divisions.</p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={18} /> {showForm ? 'View Directory' : 'Onboard Doctor'}
          </button>
        )}
      </div>

      {canCreate && showForm ? (
        <div className="panel glass max-w-2xl" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h3 className="section-title">
            <UserCheck size={20} /> Register Specialist
          </h3>

          {errorMsg && (
            <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAddDoctor}>
            <div className="form-group">
              <label className="form-label">Doctor Name</label>
              <input type="text" className="form-input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Gregory House" />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="house@hospital.com" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Specialization</label>
                <select className="form-select" value={specialization} onChange={(e) => setSpecialization(e.target.value)}>
                  {specializationsList.filter(s => s !== 'All').map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>License Number</label>
                  <button type="button" className="btn btn-secondary" onClick={generateLicense} style={{ padding: '0.1rem 0.3rem', fontSize: '0.65rem' }}>Auto-Gen</button>
                </div>
                <input type="text" className="form-input" required value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="LIC-98273" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Years of Experience</label>
                <input type="number" className="form-input" required value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} placeholder="12" />
              </div>
              <div className="form-group">
                <label className="form-label">Hospital Affiliation</label>
                <input type="text" className="form-input" required value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} placeholder="Princeton Plainsboro" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="text" className="form-input" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+1-555-0199" />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={submitting}>
              {submitting ? 'Registering...' : 'Register Doctor'}
            </button>
          </form>
        </div>
      ) : (
        <>
          {successMsg && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              {successMsg}
            </div>
          )}

          <div className="glass" style={{ display: 'flex', gap: '1rem', padding: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flexGrow: 1, minWidth: '250px' }}>
              <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', width: '18px', height: '18px' }} />
              <input type="text" className="form-input" style={{ paddingLeft: '2.8rem' }} placeholder="Search doctors by name or division..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {specializationsList.map(spec => (
                <button key={spec} className={`btn ${specializationFilter === spec ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => setSpecializationFilter(spec)}>
                  {spec}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {filteredDoctors.length === 0 ? (
              <div className="glass" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No doctors matched your criteria.
              </div>
            ) : (
              filteredDoctors.map(doc => (
                <div key={doc.id} className="glass card fade-in" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--gradient-primary)' }}></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div className="avatar" style={{ fontSize: '1.2rem', width: '48px', height: '48px' }}>
                      {doc.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.15rem' }}>{doc.name}</h4>
                      <span className="badge badge-info" style={{ marginTop: '0.25rem' }}>{doc.specialization}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Award size={16} style={{ color: 'var(--color-primary)' }} />
                      <span><strong>Experience:</strong> {doc.yearsOfExperience} years</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Stethoscope size={16} style={{ color: 'var(--color-secondary)' }} />
                      <span><strong>License:</strong> <code>{doc.licenseNumber}</code></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Building size={16} style={{ color: 'var(--color-success)' }} />
                      <span><strong>Facility:</strong> {doc.hospitalName || 'Affiliated Clinic'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={16} style={{ color: 'var(--color-warning)' }} />
                      <span><strong>Joined:</strong> {doc.joinedDate || '2026-01-01'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
