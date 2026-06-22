import React, { useState, useRef } from 'react';
import { Brain, FileText, Image as ImageIcon, ShieldAlert, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';

const PRESETS = [
  {
    id: 'pneumonia',
    title: 'Chest X-Ray: Suspicion of Pneumonia',
    text: '65-year-old male presenting with acute dyspnea, persistent productive cough, and low-grade fever. Chest auscultation reveals crackles in the right lower lung field. Clinical history includes chronic hypertension.',
    sampleName: 'Chest X-Ray (Sample)',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=500&auto=format&fit=crop&q=60' // chest x-ray style placeholder
  },
  {
    id: 'cardiomegaly',
    title: 'Chest X-Ray: Cardiomegaly Screen',
    text: '72-year-old female presenting with progressive orthopnea, bilateral pedal edema, and mild chest discomfort. Physical exam shows jugular venous distention. Clinical notes show suspected congestive cardiac failure.',
    sampleName: 'Cardiac Scan (Sample)',
    imageUrl: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=500&auto=format&fit=crop&q=60' // cardiac style placeholder
  },
  {
    id: 'fracture',
    title: 'Knee Trauma: Osteo-Articular Fracture',
    text: '28-year-old athlete presenting with severe knee swelling and localized pain following an acute hyper-flexion injury during a football match. Inability to bear weight. Suspected joint line fracture.',
    sampleName: 'Joint MRI (Sample)',
    imageUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=500&auto=format&fit=crop&q=60' // bone scan style placeholder
  },
  {
    id: 'normal',
    title: 'Healthy Screening: Standard Lung Scan',
    text: '45-year-old female presenting for routine pre-operative screening prior to elective orthopedic surgery. No cardiopulmonary complaints, non-smoker, lung sounds clear bilaterally.',
    sampleName: 'Normal Lung (Sample)',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=500&auto=format&fit=crop&q=60'
  }
];

export default function MultimodalCdss({ token }) {
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [customText, setCustomText] = useState(PRESETS[0].text);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState(PRESETS[0].imageUrl);
  
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset);
    setCustomText(preset.text);
    setSelectedImage(null);
    setSelectedImageUrl(preset.imageUrl);
    setResults(null);
    setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setSelectedImageUrl(URL.createObjectURL(file));
      setSelectedPreset(null);
      setResults(null);
      setError('');
    }
  };

  const runAnalysis = async () => {
    setLoading(true);
    setError('');
    setResults(null);

    // Simulate step loader for premium UI feedback
    const steps = [
      'Extracting clinical text features...',
      'Initializing ClinicalBERT (emilyalsentzer/Bio_ClinicalBERT) tokenizer...',
      'Mapping visual pixel representations into Vision Transformer (ViT)...',
      'Running cross-modal attention projection math...',
      'Executing bilinear concatenation fusion...'
    ];

    let currentStep = 0;
    setLoadingStep(steps[currentStep]);
    const stepInterval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setLoadingStep(steps[currentStep]);
      }
    }, 600);

    try {
      const formData = new FormData();
      formData.append('clinical_text', customText);

      if (selectedImage) {
        formData.append('image', selectedImage);
      } else {
        // Fetch sample image as blob to send to backend
        const response = await fetch(selectedImageUrl);
        const blob = await response.blob();
        formData.append('image', blob, 'sample_scan.jpg');
      }

      const res = await fetch('https://wake-controller.onrender.com/api/ai/multimodal-decision', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(stepInterval);

      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        const errData = await res.json();
        setError(errData.detail || 'Failed to complete multimodal CDSS analysis.');
      }
    } catch (err) {
      clearInterval(stepInterval);
      setError('Failed to reach backend AI service. Verify that the Docker containers are healthy.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="app-header">
        <div>
          <h2>Multimodal Clinical Decision-Support</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Cross-modal fusion utilizing local tokenized Bio-ClinicalBERT embeddings and visual transformer (ViT) patch attention.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Input Panel */}
        <div className="panel glass" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} style={{ color: 'var(--color-primary)' }} /> Clinical Input
            </h3>
            
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {PRESETS.map(p => (
                <button 
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`btn ${selectedPreset?.id === p.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
                >
                  {p.id.toUpperCase()}
                </button>
              ))}
            </div>

            <textarea 
              className="form-input"
              style={{ width: '100%', minHeight: '120px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }}
              value={customText}
              onChange={(e) => {
                setCustomText(e.target.value);
                setSelectedPreset(null);
              }}
              placeholder="Enter patient clinical history and symptomatic description here..."
            />
          </div>

          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ImageIcon size={18} style={{ color: 'var(--color-secondary)' }} /> Medical Imaging Scan
            </h3>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{ 
                border: '2px dashed var(--color-border)', 
                borderRadius: 'var(--radius-md)', 
                padding: '1.5rem', 
                textAlign: 'center', 
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.02)',
                transition: 'border-color 0.2s',
                marginBottom: '1rem'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
              <ImageIcon size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                {selectedImage ? selectedImage.name : 'Click to Upload Custom Scan'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                Supports JPEG, PNG, or DICOM exports. Or use preset sample below.
              </div>
            </div>

            <div style={{ position: 'relative', width: '100%', maxHeight: '200px', overflow: 'hidden', borderRadius: 'var(--radius-sm)' }}>
              <img 
                src={selectedImageUrl} 
                alt="Selected medical scan" 
                style={{ width: '100%', height: '180px', objectFit: 'cover', opacity: 0.8 }} 
              />
              <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem' }}>
                Active: {selectedPreset ? selectedPreset.sampleName : 'Custom Upload'}
              </div>
            </div>
          </div>

          <button 
            onClick={runAnalysis}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }}
            disabled={loading}
          >
            <Brain size={20} />
            {loading ? 'Processing Fusion...' : 'Run Cross-Modal CDSS Analysis'}
          </button>
        </div>

        {/* Results Panel */}
        <div className="panel glass" style={{ display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
          {loading && (
            <div style={{ margin: 'auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div className="spinner" style={{ borderTopColor: 'var(--color-primary)', width: '40px', height: '40px' }} />
              <div style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>Executing Tensor Fusion Models</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', maxWidth: '300px' }}>
                {loadingStep}
              </div>
            </div>
          )}

          {error && (
            <div style={{ margin: 'auto', textAlign: 'center', maxWidth: '350px', padding: '2rem' }}>
              <AlertCircle size={40} style={{ color: '#fb7185', marginBottom: '1rem' }} />
              <h4 style={{ marginBottom: '0.5rem' }}>Engine Computation Error</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{error}</p>
            </div>
          )}

          {!loading && !error && !results && (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem' }}>
              <Cpu size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <h4>Model Ready</h4>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Configure the clinical history and medical scan on the left and run analysis to calculate fused vectors.</p>
            </div>
          )}

          {results && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CheckCircle2 size={12} /> FUSION COMMIT
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                  Engine: {results.engine}
                </span>
              </div>

              {/* Diagnoses Probability Chart */}
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', marginBottom: '0.75rem' }}>Calculated Diagnostic Probabilities</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {results.diagnoses.map((diag, i) => (
                    <div key={diag.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ fontWeight: i === 0 ? '600' : '400', color: i === 0 ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                          {diag.label}
                        </span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                          {(diag.probability * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            background: i === 0 
                              ? 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))' 
                              : 'rgba(255,255,255,0.2)', 
                            width: `${diag.probability * 100}%`,
                            borderRadius: '3px'
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cross-Modal Attention Distribution */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: '600' }}>
                  <span>Modality Fusion Weights</span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Bilinear Concatenation Projection</span>
                </div>
                <div style={{ height: '18px', background: 'var(--color-secondary)', borderRadius: '9px', display: 'flex', overflow: 'hidden', margin: '0.5rem 0' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      background: 'var(--color-primary)', 
                      width: `${results.fusion_weights.text_contribution * 100}%`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'black',
                      fontWeight: 'bold',
                      fontSize: '0.7rem'
                    }}
                  >
                    ClinicalBERT ({(results.fusion_weights.text_contribution * 100).toFixed(0)}%)
                  </div>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: `${results.fusion_weights.image_contribution * 100}%`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '0.7rem'
                    }}
                  >
                    ViT ({(results.fusion_weights.image_contribution * 100).toFixed(0)}%)
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', fontFamily: 'monospace' }}>
                  <div>Text Embeddings: <code>{JSON.stringify(results.text_modality_shape)}</code></div>
                  <div>Image Embeddings: <code>{JSON.stringify(results.image_modality_shape)}</code></div>
                  <div>Fused Tensors: <code>{JSON.stringify(results.fused_vector_shape)}</code></div>
                </div>
              </div>

              {/* Text Attention Weights */}
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>ClinicalBERT Self-Attention Tokens</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', maxValues: 3, overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', lineHeight: '1.6' }}>
                  {results.text_attention.map((t, idx) => (
                    <span 
                      key={idx}
                      title={`Attention Score: ${t.weight.toFixed(3)}`}
                      style={{ 
                        padding: '0 0.2rem',
                        borderRadius: '3px',
                        background: `rgba(6, 182, 212, ${Math.min(t.weight * 0.9, 0.8)})`,
                        color: t.weight > 0.4 ? 'black' : 'var(--color-text-primary)',
                        fontWeight: t.weight > 0.4 ? '600' : '400',
                        cursor: 'help'
                      }}
                    >
                      {t.token}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {results && (
        <div className="panel glass fade-in" style={{ marginBottom: '2rem' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={16} style={{ color: 'var(--color-secondary)' }} /> Vision Transformer (ViT) Patch Attention Map
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem' }}>
            <div style={{ position: 'relative', width: '100%', height: '300px', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <img 
                src={selectedImageUrl} 
                alt="Visual grid overlay" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              {/* 14x14 grid absolute overlay */}
              <div 
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%', 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(14, 1fr)', 
                  gridTemplateRows: 'repeat(14, 1fr)' 
                }}
              >
                {results.visual_attention_grid.flat().map((weight, idx) => (
                  <div 
                    key={idx}
                    title={`Patch Attention: ${weight.toFixed(3)}`}
                    style={{ 
                      border: '0.5px solid rgba(255, 255, 255, 0.05)',
                      backgroundColor: `rgba(245, 158, 11, ${weight * 0.5})`, // orange attention highlights
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `rgba(245, 158, 11, 0.7)`}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `rgba(245, 158, 11, ${weight * 0.5})`}
                  />
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                <p style={{ marginBottom: '0.75rem' }}>
                  <strong>ViT Image Patch Processing:</strong> The visual scan was divided into a grid of <strong>14x14 patches</strong> (totaling 196 vectors). Self-attention scores are calculated for each patch relative to the text query token projections.
                </p>
                <p>
                  Hover over the image patches on the left to see the relative attention score. Bright orange highlights represent areas of interest matching abnormalities (e.g. consolidation in the lung fields or joint trauma in the orthopedic scan).
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
                  <strong>ClinicalBERT (emilyalsentzer/Bio_ClinicalBERT):</strong> Extracted features represent clinical tokens aligned with MIMIC-III vocabularies.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-warning)' }} />
                  <strong>Vision Transformer (google/vit-base-patch16-224):</strong> Extracted features represent visual patch layers.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
