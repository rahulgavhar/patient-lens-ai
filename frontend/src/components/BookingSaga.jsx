import React, { useState, useEffect } from 'react';
import { ShieldCheck, CreditCard, BellRing, Radio, Sparkles, Terminal, FileText, AlertCircle } from 'lucide-react';

export default function BookingSaga({ token, userRole, patients, doctors, onBookingComplete }) {
  const isPatient = userRole === 'PATIENT';

  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [amount, setAmount] = useState('150.00');
  const [slotDatetime, setSlotDatetime] = useState('');
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');

  // Saga State
  const [sagaRunning, setSagaRunning] = useState(false);
  const [bookingStatus, setBookingStatus] = useState('IDLE'); // 'IDLE', 'SUCCESS', 'FAILED'
  const [sagaLogs, setSagaLogs] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Initializing step states
  const [steps, setSteps] = useState([
    { id: 1, name: isPatient ? 'Requesting' : 'Saga Initiated', icon: ShieldCheck, state: 'idle', desc: isPatient ? 'Verifying details' : 'Initialize state PENDING' },
    { id: 2, name: isPatient ? 'Payment' : 'gRPC Payment', icon: CreditCard, state: 'idle', desc: isPatient ? 'Processing payment' : 'Call payment-service via gRPC' },
    { id: 3, name: isPatient ? 'Notifying' : 'gRPC Notification', icon: BellRing, state: 'idle', desc: isPatient ? 'Sending confirmation' : 'Call notification-service via gRPC' },
    { id: 4, name: isPatient ? 'Finalizing' : 'Kafka Broadcast', icon: Radio, state: 'idle', desc: isPatient ? 'Updating records' : 'Publish appointment.created' },
    { id: 5, name: 'Confirmed', icon: Sparkles, state: 'idle', desc: isPatient ? 'Appointment booked' : 'Saga Commit / Rollback' }
  ]);

  useEffect(() => {
    // Set default tomorrow datetime
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const tzoffset = tomorrow.getTimezoneOffset() * 60000; 
    const localISOTime = (new Date(tomorrow - tzoffset)).toISOString().slice(0, 16);
    setSlotDatetime(localISOTime);

    if (patients.length > 0) {
      setPatientId(patients[0].id);
    }
    if (doctors.length > 0) {
      setDoctorId(doctors[0].id);
    }
  }, [patients, doctors]);

  const addLog = (msg, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setSagaLogs(prev => [...prev, { time, msg, type }]);
  };

  const updateStepState = (stepId, state) => {
    setSteps(prev => prev.map(s => {
      if (s.id === stepId) {
        return { ...s, state };
      }
      return s;
    }));
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!patientId || !doctorId) {
      alert("Please select a patient and a doctor first!");
      return;
    }

    setSagaRunning(true);
    setBookingStatus('IDLE');
    setInvoice(null);
    setErrorMessage('');
    setSagaLogs([]);
    
    // Reset steps
    setSteps(prev => prev.map((s, idx) => ({
      ...s,
      state: 'idle',
      name: idx === 4 ? (parseFloat(amount) === 999 ? 'Cancelled' : 'Confirmed') : s.name
    })));

    const selectedPatient = patients.find(p => p.id === patientId);
    const selectedDoctor = doctors.find(d => d.id === doctorId);

    // 1. Saga Initiated
    updateStepState(1, 'pending');
    addLog(`Saga Orchestrator: Booking request received for patient ${selectedPatient.name} with ${selectedDoctor.name}`, 'info');
    await sleep(600);
    updateStepState(1, 'completed');
    addLog(`Saga Orchestrator: Database record saved in PENDING state. Internal ID generated.`, 'info');

    // 2. Payment step pending
    updateStepState(2, 'pending');
    addLog(`gRPC client: Invoking Payment Service processPayment() gRPC endpoint on port 9006...`, 'grpc');
    await sleep(800);

    const payload = {
      patientId,
      doctorId,
      slotDatetime,
      amount: parseFloat(amount)
    };

    try {
      const response = await fetch('https://wake-controller.onrender.com/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok || response.status === 201) {
        const appointmentData = await response.json();
        
        // Happy path
        updateStepState(2, 'completed');
        addLog(`gRPC response: Payment SUCCESS. Payment ID: TXN_${appointmentData.id.substring(0, 8)}. Charged: $${amount}`, 'grpc');
        await sleep(500);

        // 3. Notification step
        updateStepState(3, 'pending');
        addLog(`gRPC client: Invoking Notification Service sendConfirmation() gRPC endpoint on port 9008...`, 'grpc');
        await sleep(700);
        updateStepState(3, 'completed');
        addLog(`gRPC response: SMS / Email confirmation status: SENT. Message successfully queued.`, 'grpc');
        await sleep(500);

        // 4. Kafka step
        updateStepState(4, 'pending');
        addLog(`Kafka producer: Publishing event 'appointment.created' on topic 'appointment-events'...`, 'kafka');
        await sleep(600);
        updateStepState(4, 'completed');
        addLog(`Kafka broker: Event acknowledged by billing-service Kafka consumer.`, 'kafka');
        await sleep(500);

        // 5. Success
        updateStepState(5, 'completed');
        setBookingStatus('SUCCESS');
        addLog(`Saga Orchestrator: Commit transaction. Appointment status changed to CONFIRMED.`, 'info');
        
        // Fetch invoice from billing service (routed via gateway)
        addLog(`REST client: Querying billing service for generated invoice...`, 'info');
        await sleep(1000); // Wait for Kafka consumer to finish processing and write to billing DB
        
        try {
          const invRes = await fetch(`https://wake-controller.onrender.com/api/billing/invoices/appointment/${appointmentData.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (invRes.ok) {
            const invData = await invRes.json();
            if (invData && invData.length > 0) {
              setInvoice(invData[0]);
              addLog(`REST response: Invoice retrieved. Invoice status: PAID. Total: $${amount}`, 'info');
            } else {
              addLog(`REST warning: Invoice not found or Kafka processing delayed.`, 'kafka');
            }
          } else {
            addLog(`REST warning: Failed to pull invoice. Gateway returned HTTP ${invRes.status}`, 'info');
          }
        } catch (invoiceErr) {
          console.error("Error fetching invoice:", invoiceErr);
        }

        if (onBookingComplete) {
          onBookingComplete();
        }

      } else {
        // Handle failure
        updateStepState(2, 'failed');
        addLog(`gRPC response: Payment FAILED. Reason: Limit exceeded or insufficient funds ($999.00 block).`, 'grpc');
        await sleep(600);

        // Compensating step - Notification of failure
        updateStepState(3, 'failed');
        addLog(`gRPC client (Compensation): Invoking notification-service to issue payment failure SMS alert...`, 'grpc');
        await sleep(700);
        updateStepState(3, 'completed');
        addLog(`gRPC response: Compensation notification sent.`, 'grpc');
        await sleep(500);

        // Kafka cancellation
        updateStepState(4, 'failed');
        addLog(`Kafka producer: Publishing compensation event 'appointment.cancelled' on topic 'appointment-events'...`, 'kafka');
        await sleep(600);
        updateStepState(4, 'completed');
        addLog(`Kafka broker: Cancellation event broadcasted.`, 'kafka');
        await sleep(500);

        // End as Cancelled
        updateStepState(5, 'failed');
        setBookingStatus('FAILED');
        setErrorMessage(isPatient ? 'Payment was rejected and appointment is cancelled.' : 'Saga Transaction Aborted. Payment was rejected and status is CANCELLED.');
        addLog(`Saga Orchestrator: Compensation executed. Appointment status rolled back to CANCELLED.`, 'info');
      }

    } catch (err) {
      updateStepState(2, 'failed');
      setBookingStatus('FAILED');
      setErrorMessage(isPatient ? 'Network connection lost. Please try again.' : 'Network connection lost to API Gateway. Cannot complete Saga.');
      addLog(`System Error: ${err.message}`, 'info');
    } finally {
      setSagaRunning(false);
    }
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const filteredDoctors = doctors.filter(d => 
    d.name.toLowerCase().includes(doctorSearchTerm.toLowerCase()) || 
    d.specialization.toLowerCase().includes(doctorSearchTerm.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="app-header">
        <div>
          <h2>{isPatient ? 'Book an Appointment' : 'Saga Appointment Portal'}</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{isPatient ? 'Schedule a secure visit with your doctor.' : 'Experience gRPC transactions and Kafka compensating rollbacks in real time.'}</p>
        </div>
      </div>

      <div className="panel-grid">
        <div className="panel glass">
          <h3 className="section-title">
            <ShieldCheck size={20} /> {isPatient ? 'Booking Progress' : 'Saga Orchestrator Pipeline'}
          </h3>

          <div className="saga-visualizer">
            <div className="saga-header">
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status Tracker</span>
                <h4 style={{ color: sagaRunning ? 'var(--color-primary)' : 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {sagaRunning ? (
                    <>
                      <span className="badge badge-info" style={{ animation: 'pulse-glow 1s infinite alternate' }}>{isPatient ? 'Processing' : 'Processing Saga'}</span>
                    </>
                  ) : bookingStatus === 'SUCCESS' ? (
                    <span className="badge badge-success">{isPatient ? 'Confirmed' : 'Saga Committed'}</span>
                  ) : bookingStatus === 'FAILED' ? (
                    <span className="badge badge-danger">{isPatient ? 'Failed' : 'Saga Rolled Back'}</span>
                  ) : (
                    <span className="badge badge-info" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)' }}>Ready</span>
                  )}
                </h4>
              </div>
            </div>

            <div className="saga-steps-container">
              <div className="saga-connector-line"></div>
              <div 
                className="saga-connector-line-progress" 
                style={{ 
                  width: `${
                    steps.filter(s => s.state === 'completed').length * 22.5
                  }%` 
                }}
              ></div>
              
              {steps.map((step) => {
                const IconComponent = step.icon;
                return (
                  <div key={step.id} className={`saga-step ${step.state}`}>
                    <div className="saga-step-node">
                      <IconComponent />
                    </div>
                    <div className="saga-step-label">{step.name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{step.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {!isPatient && (
            <div style={{ marginTop: '2rem' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                <Terminal size={16} /> Live Orchestration Logs
              </h4>
              <div className="live-logger">
                {sagaLogs.length === 0 ? (
                  <div className="log-entry" style={{ color: 'var(--color-text-muted)' }}>Waiting to trigger saga...</div>
                ) : (
                  sagaLogs.map((log, index) => (
                    <div key={index} className="log-entry">
                      <span className="log-time">[{log.time}]</span>
                      <span className={`log-type-${log.type}`}>
                        [{log.type.toUpperCase()}]
                      </span>{' '}
                      <span>{log.msg}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="panel glass">
          <h3 className="section-title">
            <Sparkles size={20} /> Setup Transaction
          </h3>

          <form onSubmit={handleBooking}>
            {!isPatient && (
              <div className="form-group">
                <label className="form-label">Select Patient</label>
                <select className="form-select" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Select Doctor & Specialization</label>
              {doctors.length === 0 ? (
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No specialists are currently available in the network.
                </div>
              ) : (
                <>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Search by name or specialization..." 
                    value={doctorSearchTerm} 
                    onChange={(e) => setDoctorSearchTerm(e.target.value)}
                    style={{ marginBottom: '0.75rem' }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto', padding: '0.25rem' }}>
                    {filteredDoctors.length === 0 ? (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)' }}>No doctors match your search.</div>
                    ) : (
                      filteredDoctors.map(d => (
                        <div 
                          key={d.id} 
                          onClick={() => setDoctorId(d.id)}
                          style={{ 
                            padding: '0.75rem', 
                            borderRadius: 'var(--radius-md)', 
                            border: `2px solid ${doctorId === d.id ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)'}`,
                            background: doctorId === d.id ? 'rgba(6, 182, 212, 0.1)' : 'rgba(0,0,0,0.2)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ fontWeight: '600', color: doctorId === d.id ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>{d.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{d.specialization}</div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Appointment Time</label>
              <input type="datetime-local" className="form-input" required value={slotDatetime} onChange={(e) => setSlotDatetime(e.target.value)} />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Charge Amount ($)</label>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {!isPatient && (
                    <>
                      <button type="button" className="btn btn-secondary" onClick={() => setAmount('150.00')} style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}>
                        Happy Path ($150)
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => setAmount('999.00')} style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', color: 'var(--color-accent)' }}>
                        Failure ($999)
                      </button>
                    </>
                  )}
                </div>
              </div>
              <input type="number" step="0.01" className="form-input" required value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={sagaRunning || patients.length === 0}>
              {sagaRunning ? (isPatient ? 'Processing...' : 'Saga Processing...') : (isPatient ? 'Confirm Appointment' : 'Execute Booking Saga')}
            </button>
          </form>

          {errorMessage && (
            <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginTop: '1.5rem', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {invoice && (
            <div className="invoice-card fade-in">
              <div className="invoice-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-success)', fontWeight: '700', fontSize: '0.9rem' }}>
                  <FileText size={16} /> BILLING RECEIPT
                </span>
                <span className="badge badge-success">PAID</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', borderBottom: '1px dashed var(--color-border)', paddingBottom: '0.5rem' }}>
                Invoice ID: {invoice.id}
              </div>
              <div className="invoice-detail">
                <span>Patient Account ID:</span>
                <span style={{ color: 'var(--color-text-primary)' }}>{invoice.patientId.substring(0, 10)}...</span>
              </div>
              <div className="invoice-detail">
                <span>Appointment Ref:</span>
                <span style={{ color: 'var(--color-text-primary)' }}>{invoice.appointmentId.substring(0, 10)}...</span>
              </div>
              <div className="invoice-detail" style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                <span style={{ fontWeight: '600' }}>Total Charged:</span>
                <span style={{ fontWeight: '700', color: 'var(--color-success)', fontSize: '1.05rem' }}>${invoice.amount.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
