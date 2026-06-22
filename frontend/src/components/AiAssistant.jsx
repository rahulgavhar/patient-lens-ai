import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, UploadCloud, FileText, AlertCircle, Sparkles, BookOpen } from 'lucide-react';

export default function AiAssistant({ token }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Hello! I am your AI Medical Assistant. Upload medical reports or patient records in PDF format, and ask me any questions about them. (Note: Do not use for actual medical decisions.)',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // File upload state
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (token) {
      fetchChatHistory();
    }
  }, [token]);

  const fetchChatHistory = async () => {
    try {
      const response = await fetch('https://wake-controller.onrender.com/api/ai/chat_history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const historyData = await response.json();
        if (Array.isArray(historyData) && historyData.length > 0) {
          const loadedMessages = [];
          
          // Add default welcome message first
          loadedMessages.push({
            id: 1,
            sender: 'ai',
            text: 'Hello! I am your AI Medical Assistant. Upload medical reports or patient records in PDF format, and ask me any questions about them. (Note: Do not use for actual medical decisions.)',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });

          // Add each chat pair from the history
          historyData.forEach((chat, idx) => {
            let timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (chat.timestamp) {
              const d = new Date(chat.timestamp.replace(' ', 'T'));
              if (!isNaN(d.getTime())) {
                timeString = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }
            }
            
            loadedMessages.push({
              id: `user-${chat.id || idx}`,
              sender: 'user',
              text: chat.question,
              time: timeString
            });

            loadedMessages.push({
              id: `ai-${chat.id || idx}`,
              sender: 'ai',
              text: chat.answer,
              time: timeString
            });
          });

          setMessages(loadedMessages);
        }
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadStatus('Uploading PDF and generating Pinecone vector embeddings...');
    setUploadError('');

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await fetch('https://wake-controller.onrender.com/api/ai/upload_pdfs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setUploadStatus('Document successfully analyzed and loaded into vector store!');
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            sender: 'ai',
            text: `I have successfully analyzed "${files[0].name}" and updated my medical knowledge base. You can now ask questions about this report!`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setUploadError(errorData.error || 'Failed to process document embeddings.');
        setUploadStatus('');
      }
    } catch (err) {
      setUploadError('Network error. Unable to reach AI Service.');
      setUploadStatus('');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText;
    setInputText('');
    setSending(true);

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);

    const formData = new FormData();
    formData.append('question', userText);

    try {
      const response = await fetch('https://wake-controller.onrender.com/api/ai/ask_question', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        
        const aiMsg = {
          id: Date.now() + 1,
          sender: 'ai',
          text: data.answer || 'I am sorry, I could not formulate an answer.',
          context: data.context || [],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: `Error: ${errorData.error || 'An error occurred while answering your question.'}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: 'Connection Error: Unable to query LLM/Pinecone chain.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const sampleQuestions = [
    "What is the patient's cholesterol level in the report?",
    "Are there any signs of high blood pressure?",
    "What medical diagnosis is mentioned?",
    "Are there any prescription drugs or medication changes?"
  ];

  return (
    <div className="fade-in" style={{ height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
      <div className="app-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2>AI Medical Assistant</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Ask complex medical questions using RAG context lookup over PDF charts.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', flexGrow: 1, minHeight: 0 }}>
        {/* Document Uploader Side Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="panel glass" style={{ padding: '1.5rem' }}>
            <h3 className="section-title" style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
              <UploadCloud size={18} /> Analyze PDF Record
            </h3>
            
            <div 
              style={{
                border: '2px dashed var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.01)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
              onClick={() => fileInputRef.current.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="application/pdf" 
                style={{ display: 'none' }} 
              />
              <UploadCloud size={32} style={{ color: 'var(--color-primary)', marginBottom: '0.75rem' }} />
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', fontWeight: '500' }}>
                {uploading ? 'Analyzing and Embedding...' : 'Select Patient PDF Chart'}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                Upload lab reports, prescriptions, or clinical files
              </p>
            </div>

            {uploadStatus && (
              <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginTop: '1rem', fontSize: '0.8rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Sparkles size={14} style={{ flexShrink: 0 }} />
                <span>{uploadStatus}</span>
              </div>
            )}

            {uploadError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginTop: '1rem', fontSize: '0.8rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          <div className="panel glass" style={{ padding: '1.5rem', flexGrow: 1, overflowY: 'auto' }}>
            <h3 className="section-title" style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
              <BookOpen size={18} /> Suggested Queries
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sampleQuestions.map((q, index) => (
                <button
                  key={index}
                  className="btn btn-secondary"
                  style={{
                    padding: '0.75rem 1rem',
                    fontSize: '0.825rem',
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                    lineHeight: '1.3'
                  }}
                  disabled={sending}
                  onClick={() => setInputText(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Conversational Interface */}
        <div className="panel glass" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', minHeight: 0 }}>
          {/* Messages Area */}
          <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }} className="fade-in">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row' }}>
                  <div className="avatar" style={{ 
                    width: '32px', 
                    height: '32px', 
                    fontSize: '0.85rem', 
                    background: msg.sender === 'user' ? 'var(--color-secondary)' : 'var(--color-primary)' 
                  }}>
                    {msg.sender === 'user' ? 'ME' : <Bot size={16} />}
                  </div>
                  <div>
                    <div style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: msg.sender === 'user' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: msg.sender === 'user' ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid var(--color-border)',
                      fontSize: '0.925rem',
                      lineHeight: '1.5',
                      color: 'var(--color-text-primary)'
                    }}>
                      {msg.text}
                    </div>
                    
                    {/* Source Documents Context */}
                    {msg.context && msg.context.length > 0 && (
                      <details style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        <summary style={{ cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-primary)' }}>
                          <FileText size={12} /> View Matched Context Sources ({msg.context.length})
                        </summary>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', background: '#020617', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                          {msg.context.map((doc, idx) => (
                            <div key={idx} style={{ paddingBottom: idx === msg.context.length - 1 ? 0 : '0.5rem', borderBottom: idx === msg.context.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                              <div style={{ color: 'var(--color-text-muted)', fontWeight: '600', marginBottom: '0.15rem' }}>Source chunk {idx + 1}:</div>
                              <div>"{doc.page_content}"</div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                    
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', float: 'right', marginTop: '0.25rem' }}>{msg.time}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {sending && (
              <div style={{ alignSelf: 'flex-start' }} className="fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="avatar" style={{ width: '32px', height: '32px', background: 'var(--color-primary)' }}>
                    <Bot size={16} />
                  </div>
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.85rem',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)', animation: 'pulse-glow 0.8s infinite alternate' }}></span>
                    Consulting LangChain RAG pipeline & LLM...
                  </div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Form input bar */}
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
            <input
              type="text"
              className="form-input"
              style={{ flexGrow: 1, margin: 0 }}
              required
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a question about the uploaded medical chart..."
              disabled={sending}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 1.5rem' }} disabled={sending || !inputText.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
