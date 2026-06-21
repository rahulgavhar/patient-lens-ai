import React, { useEffect, useState } from 'react';
import { BarChart3, Database, Activity, RefreshCw, Heart, TrendingUp, Info, AlertCircle } from 'lucide-react';

export default function Analytics({ token }) {
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      fetchAnalyticsData();
    }
  }, [token]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch Aggregated Stats
      const statsRes = await fetch('http://localhost:4004/api/analytics/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        setError('Failed to fetch analytics aggregates.');
      }

      // 2. Fetch Detailed Records
      const patientsRes = await fetch('http://localhost:4004/api/analytics/patients', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (patientsRes.ok) {
        const patientsData = await patientsRes.json();
        setPatients(patientsData);
      }
    } catch (err) {
      setError('Network connection lost to API Gateway.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getBloodGroupCount = (group) => {
    if (!stats || !stats.bloodGroupDistribution) return 0;
    return stats.bloodGroupDistribution[group] || 0;
  };

  return (
    <div className="fade-in">
      <div className="app-header">
        <div>
          <h2>System Analytics</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Aggregated health metrics and live Kafka update event monitors.</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchAnalyticsData} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Refreshing...' : 'Refresh Logs'}</span>
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {stats ? (
        <>
          <div className="metrics-grid">
            <div className="metric-card glass">
              <div className="metric-info">
                <div>
                  <div className="metric-title">Tracked Patients</div>
                  <div className="metric-value">{stats.patientCount}</div>
                </div>
                <div className="metric-icon-wrapper" style={{ color: 'var(--color-primary)', background: 'rgba(6, 182, 212, 0.1)' }}>
                  <Database size={24} />
                </div>
              </div>
              <div className="metric-trend">
                <span className="trend-up">Synchronized via Kafka</span>
              </div>
            </div>

            <div className="metric-card glass">
              <div className="metric-info">
                <div>
                  <div className="metric-title">Event Transactions</div>
                  <div className="metric-value">{stats.totalEvents}</div>
                </div>
                <div className="metric-icon-wrapper" style={{ color: 'var(--color-secondary)', background: 'rgba(99, 102, 241, 0.1)' }}>
                  <Activity size={24} />
                </div>
              </div>
              <div className="metric-trend">
                <span className="trend-up">Total stream mutations</span>
              </div>
            </div>

            <div className="metric-card glass">
              <div className="metric-info">
                <div>
                  <div className="metric-title">Avg Height (cm)</div>
                  <div className="metric-value">{stats.averageHeight > 0 ? stats.averageHeight : 'N/A'}</div>
                </div>
                <div className="metric-icon-wrapper" style={{ color: 'var(--color-success)', background: 'rgba(16, 185, 129, 0.1)' }}>
                  <TrendingUp size={24} />
                </div>
              </div>
              <div className="metric-trend">
                <span className="trend-up">Mean physical statistics</span>
              </div>
            </div>

            <div className="metric-card glass">
              <div className="metric-info">
                <div>
                  <div className="metric-title">Avg Weight (kg)</div>
                  <div className="metric-value">{stats.averageWeight > 0 ? stats.averageWeight : 'N/A'}</div>
                </div>
                <div className="metric-icon-wrapper" style={{ color: 'var(--color-warning)', background: 'rgba(245, 158, 11, 0.1)' }}>
                  <Heart size={24} />
                </div>
              </div>
              <div className="metric-trend">
                <span className="trend-up">Mean physical statistics</span>
              </div>
            </div>
          </div>

          <div className="panel-grid">
            {/* Left: Patient updates list */}
            <div className="panel glass">
              <h3 className="section-title">
                <BarChart3 size={20} /> Event Activity Monitor
              </h3>
              
              <div className="table-wrapper">
                {patients.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>No telemetry data. Onboard patients to trigger Kafka events.</p>
                ) : (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Patient Name</th>
                        <th>Email</th>
                        <th style={{ textAlign: 'center' }}>Stream Updates</th>
                        <th>Last Transaction Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.sort((a,b) => b.eventCount - a.eventCount).map((p) => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>{p.name}</td>
                          <td>{p.email}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="badge badge-info">{p.eventCount}</span>
                          </td>
                          <td>{p.lastUpdated ? p.lastUpdated.replace('T', ' ').substring(0, 19) : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Right: Blood group stats */}
            <div className="panel glass">
              <h3 className="section-title">
                <Heart size={20} /> Blood Bank Index
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => {
                  const count = getBloodGroupCount(group);
                  const percentage = stats.patientCount > 0 ? ((count / stats.patientCount) * 100) : 0;
                  return (
                    <div key={group} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '500' }}>
                        <span>Blood Group {group}</span>
                        <span style={{ color: 'var(--color-text-primary)' }}>{count} patients ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                        <div style={{ 
                          width: `${percentage}%`, 
                          height: '100%', 
                          background: 'var(--gradient-primary)', 
                          borderRadius: '4px',
                          transition: 'width 0.8s ease'
                        }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="panel glass" style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          {loading ? 'Compiling system statistics...' : 'No statistics available. Please check backend connection.'}
        </div>
      )}
    </div>
  );
}
