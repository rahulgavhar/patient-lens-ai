import React, { useEffect, useState } from 'react';
import { User, Shield, Receipt, Calendar, Activity, Phone, Mail, Award, Heart, Plus, Trash2, Edit3, Save, X, Stethoscope, Pill, ClipboardList, FileText, Sparkles } from 'lucide-react';

export default function PatientRecords({ token, userRole, username, userEmail, patients, doctors = [] }) {
  const isPatient = userRole === 'PATIENT';
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('medical-records');

  // Form states for creating/editing medical records
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [formDiagnosis, setFormDiagnosis] = useState('');
  const [formPrescription, setFormPrescription] = useState('');
  const [formLabResults, setFormLabResults] = useState('');
  const [formVitals, setFormVitals] = useState('');
  const [formConsultationNotes, setFormConsultationNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // AI Summary states
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // ML Risk Prediction states
  const [riskAge, setRiskAge] = useState(0);
  const [riskBmi, setRiskBmi] = useState(0);
  const [riskSystolicBp, setRiskSystolicBp] = useState(120);
  const [riskGlucose, setRiskGlucose] = useState(95);
  const [riskFamilyHistory, setRiskFamilyHistory] = useState({
    diabetes: false,
    hypertension: false,
    heartDisease: false,
    stroke: false
  });
  const [riskResults, setRiskResults] = useState(null);
  const [predictingRisk, setPredictingRisk] = useState(false);

  // Timeline summary states
  const [timelineSummaries, setTimelineSummaries] = useState({});
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [expandedRecordIds, setExpandedRecordIds] = useState({});

  // Lab trends states
  const [labTrends, setLabTrends] = useState(null);
  const [labTrendsLoading, setLabTrendsLoading] = useState(false);

  // Securely resolve patient selection: patients can only view their own
  const selectedPatient = isPatient 
    ? patients.find(p => p.email === userEmail || p.email === username) || patients[0]
    : patients.find(p => p.id === selectedPatientId);

  // Resolve current doctor info for creations
  const currentDoctor = doctors.find(d => d.email === userEmail || d.email === username) || {
    id: '323e4567-e89b-12d3-a456-426614174007', // Fallback to seeded dr.house ID
    name: userRole === 'DOCTOR' ? (username || 'Dr. House') : 'Dr. Admin'
  };

  useEffect(() => {
    if (patients.length > 0 && !selectedPatientId) {
      if (isPatient) {
        const mine = patients.find(p => p.email === userEmail || p.email === username);
        if (mine) {
          setSelectedPatientId(mine.id);
        } else {
          setSelectedPatientId(patients[0].id);
        }
      } else {
        setSelectedPatientId(patients[0].id);
      }
    }
  }, [patients, isPatient, userEmail, username, selectedPatientId]);

  useEffect(() => {
    if (selectedPatient && token) {
      fetchPatientData(selectedPatient.id);
    }
  }, [selectedPatient, token]);

  useEffect(() => {
    // Reset AI summary and lab trends when patient selection changes
    setAiSummary(null);
    setAiLoading(false);
    setLabTrends(null);
    setLabTrendsLoading(false);
  }, [selectedPatientId]);

  useEffect(() => {
    if (selectedPatient) {
      // Calculate age
      let age = 0;
      if (selectedPatient.dateOfBirth) {
        const birthDate = new Date(selectedPatient.dateOfBirth);
        if (!isNaN(birthDate.getTime())) {
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }
      }
      
      // Calculate BMI
      let bmi = 0;
      if (selectedPatient.height && selectedPatient.weight) {
        const heightM = selectedPatient.height / 100;
        bmi = parseFloat((selectedPatient.weight / (heightM * heightM)).toFixed(1));
      }
      
      setRiskAge(age);
      setRiskBmi(bmi);
      setRiskSystolicBp(120);
      setRiskGlucose(95);
      setRiskFamilyHistory({
        diabetes: false,
        hypertension: false,
        heartDisease: false,
        stroke: false
      });
      setRiskResults(null);
    }
  }, [selectedPatientId]);

  const handlePredictRisk = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setPredictingRisk(true);
    setRiskResults(null);

    const payload = {
      age: parseFloat(riskAge) || 0,
      bmi: parseFloat(riskBmi) || 0,
      systolicBp: parseFloat(riskSystolicBp) || 120,
      glucose: parseFloat(riskGlucose) || 95,
      familyHistory: {
        diabetes: !!riskFamilyHistory.diabetes,
        hypertension: !!riskFamilyHistory.hypertension,
        heartDisease: !!riskFamilyHistory.heartDisease,
        stroke: !!riskFamilyHistory.stroke
      }
    };

    try {
      const res = await fetch(`https://wake-controller.onrender.com/api/ai/predict-risk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setRiskResults(data);
      } else {
        alert("Failed to compute disease risk prediction. Check if ai-service is running.");
      }
    } catch (err) {
      console.error("Error predicting risk:", err);
      alert("Network error: Failed to reach risk prediction service.");
    } finally {
      setPredictingRisk(false);
    }
  };

  useEffect(() => {
    // Reset summaries and toggles when patient selection changes
    setTimelineSummaries({});
    setExpandedRecordIds({});
  }, [selectedPatientId]);

  useEffect(() => {
    if (activeSubTab === 'timeline' && medicalRecords.length > 0) {
      const hasAllSummaries = medicalRecords.every(r => timelineSummaries[r.id]);
      if (!hasAllSummaries && !timelineLoading) {
        fetchTimelineSummaries();
      }
    }
  }, [activeSubTab, medicalRecords]);

  const fetchTimelineSummaries = async () => {
    if (medicalRecords.length === 0) return;
    setTimelineLoading(true);
    try {
      const payloadRecords = medicalRecords.map(rec => ({
        id: rec.id,
        createdAt: rec.createdAt,
        doctorName: rec.doctorName,
        diagnosis: rec.diagnosis,
        prescription: rec.prescription || '',
        labResults: rec.labResults || '',
        vitals: rec.vitals || '',
        consultationNotes: rec.consultationNotes || ''
      }));

      const res = await fetch(`https://wake-controller.onrender.com/api/ai/timeline-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ records: payloadRecords })
      });

      if (res.ok) {
        const data = await res.json();
        setTimelineSummaries(data.summaries || {});
      } else {
        console.error("Failed to generate timeline summaries");
      }
    } catch (err) {
      console.error("Timeline summary error:", err);
    } finally {
      setTimelineLoading(false);
    }
  };

  const toggleExpandRecord = (recId) => {
    setExpandedRecordIds(prev => ({ ...prev, [recId]: !prev[recId] }));
  };

  const fetchLabTrends = async () => {
    if (!selectedPatient) return;
    setLabTrendsLoading(true);
    setLabTrends(null);
    try {
      const res = await fetch(`https://wake-controller.onrender.com/api/ai/lab-trends/${selectedPatient.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setLabTrends(data.trends);
      } else {
        alert("Failed to analyze clinical trends. Check if ai-service is running and GROQ_API_KEY is active.");
      }
    } catch (e) {
      console.error("Lab trends error:", e);
      alert("Network error: Failed to reach AI service.");
    } finally {
      setLabTrendsLoading(false);
    }
  };

  const fetchPatientData = async (patientId) => {
    setLoading(true);
    try {
      // 1. Fetch invoices
      const invoicesRes = await fetch(`https://wake-controller.onrender.com/api/billing/invoices/patient/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (invoicesRes.ok) {
        const invData = await invoicesRes.json();
        setInvoices(invData);
      }

      // 2. Fetch appointments
      const apptRes = await fetch(`https://wake-controller.onrender.com/api/appointments/patient/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (apptRes.ok) {
        const apptData = await apptRes.json();
        setAppointments(apptData);
      }

      // 3. Fetch medical records
      const recordsRes = await fetch(`https://wake-controller.onrender.com/api/medical-records/patient/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (recordsRes.ok) {
        const recordsData = await recordsRes.json();
        // Sort newest first
        recordsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setMedicalRecords(recordsData);
      } else {
        setMedicalRecords([]);
      }
    } catch (err) {
      console.error("Error fetching patient details:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAiSummary = async () => {
    if (!selectedPatient) return;
    setAiLoading(true);
    setAiSummary(null);
    try {
      const res = await fetch(`https://wake-controller.onrender.com/api/ai/appointment-prep/${selectedPatient.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.summary);
      } else {
        alert("Failed to generate AI pre-visit summary. Ensure ai-service is running and GROQ_API_KEY is active.");
      }
    } catch (e) {
      console.error("AI summary error:", e);
      alert("Network error: Failed to reach AI service.");
    } finally {
      setAiLoading(false);
    }
  };

  const clearForm = () => {
    setFormDiagnosis('');
    setFormPrescription('');
    setFormLabResults('');
    setFormVitals('');
    setFormConsultationNotes('');
  };

  const renderSymptomIntake = (symptomIntakeStr) => {
    if (!symptomIntakeStr) return <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No symptoms reported</span>;
    try {
      const intake = JSON.parse(symptomIntakeStr);
      const getSeverityColor = (sev) => {
        if (!sev) return 'var(--color-text-muted)';
        const s = sev.toLowerCase();
        if (s.includes('mild')) return 'var(--color-success)';
        if (s.includes('mod')) return 'var(--color-warning)';
        return 'var(--color-accent)';
      };
      return (
        <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0.25rem 0' }}>
          <div><strong>Symptom:</strong> {intake.symptoms}</div>
          <div><strong>Duration:</strong> {intake.duration} &bull; <strong>Severity:</strong> <span style={{ color: getSeverityColor(intake.severity), fontWeight: 'bold' }}>{intake.severity}</span></div>
          <div>
            <strong>Triage:</strong> <span style={{ color: 'var(--color-primary)', fontWeight: '500' }}>{intake.recommendedTriage}</span>
            {intake.triageScore && (
              <span className={`badge ${
                intake.triageScore === 3 ? 'badge-danger' : 
                intake.triageScore === 2 ? 'badge-warning' : 'badge-success'
              }`} style={{ marginLeft: '0.5rem', fontSize: '0.7rem', padding: '0.1rem 0.35rem' }}>
                Priority {intake.triageScore}
              </span>
            )}
          </div>
        </div>
      );
    } catch (e) {
      return <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{symptomIntakeStr}</span>;
    }
  };

  const handleEditClick = (rec) => {
    setEditingRecordId(rec.id);
    setFormDiagnosis(rec.diagnosis || '');
    setFormPrescription(rec.prescription || '');
    setFormLabResults(rec.labResults || '');
    setFormVitals(rec.vitals || '');
    setFormConsultationNotes(rec.consultationNotes || '');
    setShowAddForm(true);
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this medical record? This cannot be undone.")) {
      return;
    }
    try {
      const res = await fetch(`https://wake-controller.onrender.com/api/medical-records/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setMedicalRecords(prev => prev.filter(r => r.id !== id));
      } else {
        alert("Failed to delete the medical record.");
      }
    } catch (e) {
      console.error("Delete record error:", e);
    }
  };

  const handleSaveMedicalRecord = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setSaving(true);

    const payload = {
      patientId: selectedPatient.id,
      doctorId: currentDoctor.id,
      doctorName: currentDoctor.name,
      diagnosis: formDiagnosis,
      prescription: formPrescription,
      labResults: formLabResults,
      vitals: formVitals,
      consultationNotes: formConsultationNotes
    };

    try {
      const url = editingRecordId 
        ? `https://wake-controller.onrender.com/api/medical-records/${editingRecordId}`
        : 'https://wake-controller.onrender.com/api/medical-records';
      
      const method = editingRecordId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedRec = await res.json();
        if (editingRecordId) {
          setMedicalRecords(prev => prev.map(r => r.id === editingRecordId ? savedRec : r));
        } else {
          setMedicalRecords(prev => [savedRec, ...prev]);
        }
        setShowAddForm(false);
        setEditingRecordId(null);
        clearForm();
      } else {
        alert("Failed to save clinical entry.");
      }
    } catch (err) {
      console.error("Save record error:", err);
      alert("Network error: Failed to save record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in">
      {/* Self-contained keyframe definitions for spin animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div className="app-header">
        <div>
          <h2>{isPatient ? 'My Medical Records' : 'Patient Profiles & Charts'}</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{isPatient ? 'View your clinical consultation notes, prescriptions, and lab tests.' : 'Lookup clinical summaries, billing accounts, and historical logs.'}</p>
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
          {/* Left Column Stack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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

            {/* Disease Risk Assessment Card (visible only to DOCTOR and ADMIN roles) */}
            {(!isPatient && (userRole === 'DOCTOR' || userRole === 'ADMIN')) && (
              <div className="panel glass fade-in" style={{ padding: '2rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-primary)', marginBottom: '1.25rem', fontSize: '1.2rem' }}>
                  <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
                  Disease Risk Prediction (ML)
                </h3>
                
                <form onSubmit={handlePredictRisk} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Age (Years)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        style={{ width: '100%', padding: '0.5rem' }} 
                        value={riskAge} 
                        onChange={(e) => setRiskAge(e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>BMI</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        className="form-input" 
                        style={{ width: '100%', padding: '0.5rem' }} 
                        value={riskBmi} 
                        onChange={(e) => setRiskBmi(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Systolic BP (mmHg)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        style={{ width: '100%', padding: '0.5rem' }} 
                        value={riskSystolicBp} 
                        onChange={(e) => setRiskSystolicBp(e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Glucose (mg/dL)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        style={{ width: '100%', padding: '0.5rem' }} 
                        value={riskGlucose} 
                        onChange={(e) => setRiskGlucose(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                    <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '0.5rem', display: 'block' }}>Family History of:</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                        <input 
                          type="checkbox" 
                          checked={riskFamilyHistory.diabetes} 
                          onChange={(e) => setRiskFamilyHistory(prev => ({ ...prev, diabetes: e.target.checked }))} 
                        />
                        Diabetes
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                        <input 
                          type="checkbox" 
                          checked={riskFamilyHistory.hypertension} 
                          onChange={(e) => setRiskFamilyHistory(prev => ({ ...prev, hypertension: e.target.checked }))} 
                        />
                        Hypertension
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                        <input 
                          type="checkbox" 
                          checked={riskFamilyHistory.heartDisease} 
                          onChange={(e) => setRiskFamilyHistory(prev => ({ ...prev, heartDisease: e.target.checked }))} 
                        />
                        Heart Disease
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                        <input 
                          type="checkbox" 
                          checked={riskFamilyHistory.stroke} 
                          onChange={(e) => setRiskFamilyHistory(prev => ({ ...prev, stroke: e.target.checked }))} 
                        />
                        Stroke
                      </label>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem', padding: '0.6rem' }}
                    disabled={predictingRisk}
                  >
                    <Activity size={16} />
                    {predictingRisk ? 'Analyzing Vitals...' : 'Run Risk Prediction'}
                  </button>
                </form>

                {riskResults && (
                  <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                    <h4 style={{ color: 'var(--color-text-primary)', fontSize: '0.95rem', fontWeight: '600' }}>Inference Outcomes:</h4>
                    
                    {[
                      { label: 'Diabetes', val: riskResults.diabetesRisk, key: 'diabetes' },
                      { label: 'Hypertension', val: riskResults.hypertensionRisk, key: 'hypertension' },
                      { label: 'Heart Disease', val: riskResults.heartDiseaseRisk, key: 'heartDisease' },
                      { label: 'Stroke', val: riskResults.strokeRisk, key: 'stroke' }
                    ].map((item) => {
                      const pct = Math.round(item.val * 100);
                      let barColor = 'var(--color-success)';
                      if (pct > 60) barColor = 'var(--color-accent)';
                      else if (pct > 30) barColor = 'var(--color-warning)';
                      
                      return (
                        <div key={item.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: '500', color: 'var(--color-text-primary)' }}>{item.label} Risk</span>
                            <span style={{ fontWeight: '600', color: barColor }}>{pct}%</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: barColor, transition: 'width 0.6s ease' }} />
                          </div>
                          
                          {/* Contributing Factors */}
                          {riskResults.contributingFactors && riskResults.contributingFactors[item.key] && (
                            <ul style={{ paddingLeft: '1rem', marginTop: '0.15rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                              {riskResults.contributingFactors[item.key].map((factor, idx) => (
                                <li key={idx}>{factor}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}

                    <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', lineHeight: '1.4', marginTop: '0.5rem', background: 'rgba(244, 63, 94, 0.05)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(244, 63, 94, 0.15)' }}>
                      <strong>Disclaimer:</strong> This tool provides risk indicators based on statistical model inference and does not constitute a formal diagnosis.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Clinical & Historical Timeline Tabs (Right Column) */}
          <div className="panel glass" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
              <button 
                className={`btn ${activeSubTab === 'medical-records' ? 'btn-primary' : 'btn-secondary'}`} 
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} 
                onClick={() => { setActiveSubTab('medical-records'); setShowAddForm(false); }}
              >
                <Activity size={16} /> Clinical Records ({medicalRecords.length})
              </button>
              <button 
                className={`btn ${activeSubTab === 'timeline' ? 'btn-primary' : 'btn-secondary'}`} 
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} 
                onClick={() => { setActiveSubTab('timeline'); setShowAddForm(false); }}
              >
                <Calendar size={16} /> Health Timeline ({medicalRecords.length})
              </button>
              <button 
                className={`btn ${activeSubTab === 'invoices' ? 'btn-primary' : 'btn-secondary'}`} 
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} 
                onClick={() => { setActiveSubTab('invoices'); setShowAddForm(false); }}
              >
                <Receipt size={16} /> Invoices ({invoices.length})
              </button>
              <button 
                className={`btn ${activeSubTab === 'appointments' ? 'btn-primary' : 'btn-secondary'}`} 
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} 
                onClick={() => { setActiveSubTab('appointments'); setShowAddForm(false); }}
              >
                <Calendar size={16} /> Appointment Saga Logs ({appointments.length})
              </button>
            </div>

            {loading ? (
              <p style={{ color: 'var(--color-text-secondary)', padding: '2rem', textAlign: 'center' }}>Loading historical events...</p>
            ) : activeSubTab === 'medical-records' ? (
              <div>
                {/* AI Summary Loading State */}
                {aiLoading && (
                  <div className="glass fade-in" style={{ padding: '2rem', marginBottom: '1.5rem', textAlign: 'center', border: '1px dashed var(--color-border-active)' }}>
                    <div style={{ border: '3px solid rgba(6, 182, 212, 0.1)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', width: '32px', height: '32px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>AI is compiling past visits, vitals, and reports to synthesize pre-visit summary...</p>
                  </div>
                )}

                {/* AI Summary Display Card */}
                {aiSummary && !aiLoading && (
                  <div className="glass fade-in" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid rgba(6, 182, 212, 0.3)', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)', position: 'relative' }}>
                    <button 
                      style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                      onClick={() => setAiSummary(null)}
                      title="Hide summary"
                    >
                      <X size={18} />
                    </button>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>
                      <Sparkles size={18} style={{ color: 'var(--color-primary)' }} /> Pre-Visit AI Summary (Llama 3.3)
                    </h3>
                    <div style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                      {aiSummary}
                    </div>
                  </div>
                )}

                {/* Lab Trends AI Loading State */}
                {labTrendsLoading && (
                  <div className="glass fade-in" style={{ padding: '2rem', marginBottom: '1.5rem', textAlign: 'center', border: '1px dashed var(--color-border-active)' }}>
                    <div style={{ border: '3px solid rgba(16, 185, 129, 0.1)', borderTop: '3px solid var(--color-success)', borderRadius: '50%', width: '32px', height: '32px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>AI is parsing historical vital charts and lab results to compile clinical progressions...</p>
                  </div>
                )}

                {/* Lab Trends AI Display Card */}
                {labTrends && !labTrendsLoading && (
                  <div className="glass fade-in" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.3)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)', position: 'relative' }}>
                    <button 
                      style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                      onClick={() => setLabTrends(null)}
                      title="Hide trends"
                    >
                      <X size={18} />
                    </button>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)', marginBottom: '1rem', fontSize: '1.1rem' }}>
                      <Activity size={18} style={{ color: 'var(--color-success)' }} /> Clinical Lab Trends AI (Llama 3.3)
                    </h3>
                    <div style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                      {labTrends}
                    </div>
                  </div>
                )}

                {/* Save/Edit Medical Record Form */}
                {showAddForm ? (
                  <div className="panel glass fade-in" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--color-border-active)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                      <Plus size={20} style={{ color: 'var(--color-primary)' }} />
                      {editingRecordId ? 'Edit Clinical Entry' : 'New Consultation Entry'}
                    </h3>
                    
                    <form onSubmit={handleSaveMedicalRecord}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-primary)' }}>
                            <Activity size={14} style={{ color: 'var(--color-success)' }} /> Patient Vitals
                          </label>
                          <textarea 
                            className="form-input" 
                            rows="2"
                            style={{ width: '100%', height: '80px', resize: 'vertical' }}
                            placeholder="e.g., BP: 120/80 mmHg | Temp: 98.6°F | HR: 72 bpm"
                            value={formVitals}
                            onChange={(e) => setFormVitals(e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-primary)' }}>
                            <ClipboardList size={14} style={{ color: 'var(--color-warning)' }} /> Clinical Diagnosis
                          </label>
                          <textarea 
                            className="form-input" 
                            rows="2"
                            style={{ width: '100%', height: '80px', resize: 'vertical' }}
                            placeholder="e.g., Acute seasonal bronchitis, mild throat inflammation"
                            value={formDiagnosis}
                            onChange={(e) => setFormDiagnosis(e.target.value)}
                            required
                          />
                        </div>

                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-primary)' }}>
                            <Pill size={14} style={{ color: 'var(--color-accent)' }} /> Prescription Instructions
                          </label>
                          <textarea 
                            className="form-input" 
                            rows="3"
                            style={{ width: '100%', height: '100px', resize: 'vertical' }}
                            placeholder="e.g., Amoxicillin 500mg (1 tab 3x daily for 7 days) | Cough Syrup 10ml (twice daily)"
                            value={formPrescription}
                            onChange={(e) => setFormPrescription(e.target.value)}
                          />
                        </div>

                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-primary)' }}>
                            <FileText size={14} style={{ color: 'var(--color-secondary)' }} /> Lab Reports / Vitals Notes
                          </label>
                          <textarea 
                            className="form-input" 
                            rows="2"
                            style={{ width: '100%', height: '80px', resize: 'vertical' }}
                            placeholder="e.g., Normal CBC, mild elevated neutrophils. Recommend blood test follow up."
                            value={formLabResults}
                            onChange={(e) => setFormLabResults(e.target.value)}
                          />
                        </div>

                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-primary)' }}>
                            <User size={14} style={{ color: 'var(--color-primary)' }} /> Consultation SOAP Notes
                          </label>
                          <textarea 
                            className="form-input" 
                            rows="3"
                            style={{ width: '100%', height: '100px', resize: 'vertical' }}
                            placeholder="e.g., Patient reports severe dry cough and body chills for 3 days. Denies shortness of breath."
                            value={formConsultationNotes}
                            onChange={(e) => setFormConsultationNotes(e.target.value)}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          type="button" 
                          className="btn btn-secondary"
                          onClick={() => {
                            setShowAddForm(false);
                            setEditingRecordId(null);
                            clearForm();
                          }}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="btn btn-primary"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                          disabled={saving}
                        >
                          <Save size={16} /> {saving ? 'Saving...' : 'Save Clinical Entry'}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div>
                    {/* Add Record & AI Prep Summary Trigger (Doctors and Admins only) */}
                    {(userRole === 'DOCTOR' || userRole === 'ADMIN') && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <button 
                          className="btn btn-secondary"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', borderColor: 'var(--color-border-active)' }}
                          onClick={fetchAiSummary}
                          disabled={aiLoading || !selectedPatient}
                        >
                          <Sparkles size={16} style={{ color: 'var(--color-primary)' }} /> 
                          {aiLoading ? 'Analyzing Chart...' : 'AI Pre-Visit Summary'}
                        </button>
                        <button 
                          className="btn btn-secondary"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', borderColor: 'var(--color-border-active)' }}
                          onClick={fetchLabTrends}
                          disabled={labTrendsLoading || !selectedPatient}
                        >
                          <Activity size={16} style={{ color: 'var(--color-success)' }} /> 
                          {labTrendsLoading ? 'Extracting Trends...' : 'Lab Trends AI'}
                        </button>
                        <button 
                          className="btn btn-primary"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                          onClick={() => { clearForm(); setEditingRecordId(null); setShowAddForm(true); }}
                        >
                          <Plus size={16} /> Add Clinical Record
                        </button>
                      </div>
                    )}

                    {/* Medical Records List */}
                    {medicalRecords.length === 0 ? (
                      <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>No clinical medical records found for this patient.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {medicalRecords.map((rec) => (
                          <div className="glass fade-in" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-primary)' }} key={rec.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                              <div>
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-primary)' }}>
                                  <Stethoscope size={16} style={{ color: 'var(--color-primary)' }} />
                                  Consultation Summary
                                </h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                                  Practitioner: <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{rec.doctorName}</span> &bull; {new Date(rec.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              
                              {(userRole === 'DOCTOR' || userRole === 'ADMIN') && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button 
                                    className="btn btn-secondary" 
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                    onClick={() => handleEditClick(rec)}
                                  >
                                    <Edit3 size={12} /> Edit
                                  </button>
                                  <button 
                                    className="btn btn-secondary" 
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'rgba(244, 63, 94, 0.1)', color: 'var(--color-accent)', border: '1px solid rgba(244, 63, 94, 0.2)' }}
                                    onClick={() => handleDeleteClick(rec.id)}
                                  >
                                    <Trash2 size={12} /> Delete
                                  </button>
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                              {rec.vitals && (
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                                  <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <Activity size={12} style={{ color: 'var(--color-success)' }} /> Vitals
                                  </div>
                                  <p style={{ color: 'var(--color-text-secondary)', whiteSpace: 'pre-line' }}>{rec.vitals}</p>
                                </div>
                              )}

                              {rec.diagnosis && (
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                                  <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <ClipboardList size={12} style={{ color: 'var(--color-warning)' }} /> Diagnosis
                                  </div>
                                  <p style={{ color: 'var(--color-text-secondary)', whiteSpace: 'pre-line' }}>{rec.diagnosis}</p>
                                </div>
                              )}

                              {rec.prescription && (
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', gridColumn: 'span 2' }}>
                                  <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <Pill size={12} style={{ color: 'var(--color-accent)' }} /> Prescription & Medication
                                  </div>
                                  <p style={{ color: 'var(--color-text-secondary)', whiteSpace: 'pre-line' }}>{rec.prescription}</p>
                                </div>
                              )}

                              {rec.labResults && (
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', gridColumn: 'span 2' }}>
                                  <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <FileText size={12} style={{ color: 'var(--color-secondary)' }} /> Lab / Diagnostics Reports
                                  </div>
                                  <p style={{ color: 'var(--color-text-secondary)', whiteSpace: 'pre-line' }}>{rec.labResults}</p>
                                </div>
                              )}

                              {rec.consultationNotes && (
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', gridColumn: 'span 2' }}>
                                  <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <User size={12} style={{ color: 'var(--color-primary)' }} /> Clinical SOAP Notes
                                  </div>
                                  <p style={{ color: 'var(--color-text-secondary)', whiteSpace: 'pre-line' }}>{rec.consultationNotes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : activeSubTab === 'timeline' ? (
              <div>
                {timelineLoading ? (
                  <div className="glass fade-in" style={{ padding: '3rem', textAlign: 'center' }}>
                    <div style={{ border: '3px solid rgba(6, 182, 212, 0.1)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', width: '36px', height: '36px', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }}></div>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>AI is analyzing past medical reports to generate chronological timeline event summaries...</p>
                  </div>
                ) : medicalRecords.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>No medical records available to construct timeline.</p>
                ) : (
                  <div style={{ position: 'relative', paddingLeft: '2rem', borderLeft: '2px solid var(--color-border)', margin: '1rem 0' }}>
                    {medicalRecords.map((rec) => {
                      const summary = timelineSummaries[rec.id] || "Generating summary...";
                      const isExpanded = !!expandedRecordIds[rec.id];
                      return (
                        <div key={rec.id} style={{ marginBottom: '2rem', position: 'relative' }}>
                          {/* Timeline node dot indicator */}
                          <div style={{ 
                            position: 'absolute', 
                            left: 'calc(-2rem - 9px)', 
                            top: '4px', 
                            width: '16px', 
                            height: '16px', 
                            borderRadius: '50%', 
                            background: 'var(--color-primary)', 
                            border: '3px solid var(--color-bg)',
                            boxShadow: 'var(--shadow-glow)'
                          }} />
                          
                          {/* Timeline Event Card */}
                          <div 
                            className="glass" 
                            style={{ 
                              padding: '1.25rem', 
                              cursor: 'pointer', 
                              transition: 'transform 0.2s ease, border-color 0.2s ease',
                              border: isExpanded ? '1px solid var(--color-border-active)' : '1px solid var(--color-border)',
                              background: isExpanded ? 'rgba(6, 182, 212, 0.03)' : 'var(--color-surface)'
                            }}
                            onClick={() => toggleExpandRecord(rec.id)}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-active)'; }}
                            onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {new Date(rec.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                Practitioner: <strong>{rec.doctorName}</strong>
                              </span>
                            </div>
                            
                            <h4 style={{ color: 'var(--color-text-primary)', fontSize: '0.95rem', margin: '0.25rem 0' }}>
                              {rec.diagnosis}
                            </h4>
                            
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', lineHeight: '1.5', marginTop: '0.5rem', fontStyle: 'italic' }}>
                              &ldquo;{summary}&rdquo;
                            </p>
                            
                            {/* Expand clinical details indicator */}
                            <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: '600' }}>
                                {isExpanded ? 'Hide Consultation Details' : 'View Full Consultation SOAP Details &rarr;'}
                              </span>
                            </div>
                            
                            {/* Expanded soap notes details */}
                            {isExpanded && (
                              <div style={{ 
                                marginTop: '1.25rem', 
                                borderTop: '1px solid var(--color-border)', 
                                paddingTop: '1.25rem',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '1rem',
                                fontSize: '0.85rem'
                              }} onClick={(e) => e.stopPropagation() /* Prevent close on inner click */}>
                                {rec.vitals && (
                                  <div style={{ background: 'rgba(255, 255, 255, 0.01)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                                    <div style={{ fontWeight: '600', color: 'var(--color-success)', marginBottom: '0.25rem' }}>Vitals</div>
                                    <p style={{ color: 'var(--color-text-secondary)' }}>{rec.vitals}</p>
                                  </div>
                                )}
                                
                                {rec.prescription && (
                                  <div style={{ background: 'rgba(255, 255, 255, 0.01)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                                    <div style={{ fontWeight: '600', color: 'var(--color-accent)', marginBottom: '0.25rem' }}>Prescriptions</div>
                                    <p style={{ color: 'var(--color-text-secondary)' }}>{rec.prescription}</p>
                                  </div>
                                )}
                                
                                {rec.labResults && (
                                  <div style={{ background: 'rgba(255, 255, 255, 0.01)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', gridColumn: 'span 2' }}>
                                    <div style={{ fontWeight: '600', color: 'var(--color-secondary)', marginBottom: '0.25rem' }}>Lab Results</div>
                                    <p style={{ color: 'var(--color-text-secondary)' }}>{rec.labResults}</p>
                                  </div>
                                )}
                                
                                {rec.consultationNotes && (
                                  <div style={{ background: 'rgba(255, 255, 255, 0.01)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', gridColumn: 'span 2' }}>
                                    <div style={{ fontWeight: '600', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>SOAP Notes</div>
                                    <p style={{ color: 'var(--color-text-secondary)' }}>{rec.consultationNotes}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : activeSubTab === 'invoices' ? (
              <div className="table-wrapper">
                {invoices.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>No billing invoices found.</p>
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
                        <th>Symptoms (AI)</th>
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
                          <td>{renderSymptomIntake(appt.symptomIntake)}</td>
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
