import React, { useState, useEffect, useRef } from 'react';
import {
  Brain, CalendarCheck, Network, Activity, ArrowRight, ShieldCheck,
  Stethoscope, HeartPulse, Users, Clock, CheckCircle2, Star,
  ChevronRight, Zap, Lock, BarChart3, MessageSquare, Sparkles
} from 'lucide-react';

/* ─── Animated counter hook ─── */
function useCountUp(target, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!startOnView) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted.current) {
          hasStarted.current = true;
          let start = 0;
          const step = target / (duration / 16);
          const timer = setInterval(() => {
            start += step;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration, startOnView]);

  return { count, ref };
}

/* ─── Stat Card ─── */
function StatCard({ icon: Icon, value, suffix, label, color }) {
  const { count, ref } = useCountUp(value);
  return (
    <div className="stat-card" ref={ref}>
      <div className="stat-icon" style={{ color, background: `${color}15` }}>
        <Icon size={22} />
      </div>
      <div className="stat-value" style={{ color }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function LandingPage({ onNavigateToAuth }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="landing-page">

      {/* ───────── Navbar ───────── */}
      <nav className={`landing-nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="landing-brand">
          <Activity className="brand-icon" size={28} />
          <span className="brand-text">PatientLens AI</span>
        </div>
        <div className="nav-links">
          <a href="#features" className="nav-link-item">Features</a>
          <a href="#how-it-works" className="nav-link-item">How It Works</a>
          <a href="#testimonials" className="nav-link-item">Testimonials</a>
          <button className="btn btn-primary nav-cta" onClick={onNavigateToAuth}>
            Get Started <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      {/* ───────── Hero ───────── */}
      <header className="landing-hero">
        {/* Ambient orbs */}
        <div className="hero-orb hero-orb-1"></div>
        <div className="hero-orb hero-orb-2"></div>
        <div className="hero-orb hero-orb-3"></div>

        <div className="hero-content fade-in">
          <div className="hero-badge">
            <Sparkles size={14} style={{ marginRight: '0.4rem' }} />
            Trusted by 500+ Healthcare Professionals
          </div>
          <h1 className="hero-title">
            The Future of<br />
            <span className="text-gradient">Clinical Intelligence</span>
          </h1>
          <p className="hero-subtitle">
            PatientLens AI seamlessly combines diagnostic AI, secure patient management,
            and intelligent appointment scheduling into one unified platform —
            built for doctors, patients, and administrators.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary hero-btn hero-btn-glow" onClick={onNavigateToAuth}>
              Start Free Trial <ArrowRight size={18} />
            </button>
            <a href="#features" className="btn btn-secondary hero-btn">
              See How It Works
            </a>
          </div>
          <p className="hero-trust-line">
            <Lock size={14} /> HIPAA Compliant &nbsp;•&nbsp; No credit card required &nbsp;•&nbsp; Setup in 2 minutes
          </p>
        </div>
      </header>

      {/* ───────── Live Stats Banner ───────── */}
      <section className="stats-banner">
        <StatCard icon={Users} value={12400} suffix="+" label="Patients Managed" color="#06b6d4" />
        <StatCard icon={Stethoscope} value={540} suffix="+" label="Doctors Onboard" color="#6366f1" />
        <StatCard icon={CalendarCheck} value={98} suffix="%" label="Booking Success" color="#10b981" />
        <StatCard icon={HeartPulse} value={3200} suffix="+" label="AI Diagnostics Run" color="#ec4899" />
      </section>

      {/* ───────── Features ───────── */}
      <section id="features" className="features-section">
        <div className="landing-container">
          <div className="section-header-landing">
            <div className="section-pill">Core Platform</div>
            <h2 className="section-heading">Everything You Need,<br /><span className="text-gradient">In One Place</span></h2>
            <p className="section-subheading">
              From AI-powered diagnostics to frictionless scheduling, PatientLens delivers a complete healthcare ecosystem.
            </p>
          </div>

          <div className="features-grid">
            {/* Card 1 */}
            <div className="feature-card glass">
              <div className="feature-card-accent" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}></div>
              <div className="feature-icon-wrapper" style={{ color: '#06b6d4', background: 'rgba(6, 182, 212, 0.1)' }}>
                <Brain size={28} />
              </div>
              <h3 className="feature-title">AI Clinical Decision Support</h3>
              <p className="feature-desc">
                Our multimodal AI engine fuses text analysis with medical imaging to provide real-time diagnostic validation and clinical recommendations.
              </p>
              <ul className="feature-bullets">
                <li><CheckCircle2 size={14} /> X-Ray & MRI analysis</li>
                <li><CheckCircle2 size={14} /> ClinicalBERT text processing</li>
                <li><CheckCircle2 size={14} /> Cross-modal attention maps</li>
              </ul>
            </div>

            {/* Card 2 */}
            <div className="feature-card glass">
              <div className="feature-card-accent" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}></div>
              <div className="feature-icon-wrapper" style={{ color: '#6366f1', background: 'rgba(99, 102, 241, 0.1)' }}>
                <MessageSquare size={28} />
              </div>
              <h3 className="feature-title">Medical AI Assistant</h3>
              <p className="feature-desc">
                A conversational AI chatbot trained on your uploaded medical documents, providing instant answers grounded in your own clinical data.
              </p>
              <ul className="feature-bullets">
                <li><CheckCircle2 size={14} /> Upload PDFs & clinical notes</li>
                <li><CheckCircle2 size={14} /> Retrieval-Augmented Generation</li>
                <li><CheckCircle2 size={14} /> Per-user isolated knowledge</li>
              </ul>
            </div>

            {/* Card 3 */}
            <div className="feature-card glass">
              <div className="feature-card-accent" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}></div>
              <div className="feature-icon-wrapper" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                <CalendarCheck size={28} />
              </div>
              <h3 className="feature-title">Smart Appointment Booking</h3>
              <p className="feature-desc">
                Fully automated scheduling with integrated payment processing, real-time notifications, and instant billing — all in one click.
              </p>
              <ul className="feature-bullets">
                <li><CheckCircle2 size={14} /> Instant booking confirmation</li>
                <li><CheckCircle2 size={14} /> Integrated payment gateway</li>
                <li><CheckCircle2 size={14} /> Automated invoice generation</li>
              </ul>
            </div>

            {/* Card 4 */}
            <div className="feature-card glass">
              <div className="feature-card-accent" style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)' }}></div>
              <div className="feature-icon-wrapper" style={{ color: '#ec4899', background: 'rgba(236, 72, 153, 0.1)' }}>
                <ShieldCheck size={28} />
              </div>
              <h3 className="feature-title">Enterprise-Grade Security</h3>
              <p className="feature-desc">
                Role-based access control ensures patients, doctors, and administrators only see what they're authorized to — end-to-end encrypted.
              </p>
              <ul className="feature-bullets">
                <li><CheckCircle2 size={14} /> JWT token authentication</li>
                <li><CheckCircle2 size={14} /> Role-based permissions</li>
                <li><CheckCircle2 size={14} /> Tenant-isolated data</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── How It Works ───────── */}
      <section id="how-it-works" className="how-section">
        <div className="landing-container">
          <div className="section-header-landing">
            <div className="section-pill">Simple & Powerful</div>
            <h2 className="section-heading">Get Started in <span className="text-gradient">3 Easy Steps</span></h2>
          </div>

          <div className="steps-row">
            <div className="step-card">
              <div className="step-number">01</div>
              <div className="step-icon-wrap">
                <Lock size={24} />
              </div>
              <h4 className="step-title">Create Your Account</h4>
              <p className="step-desc">Register as a Patient, Doctor, or Admin in seconds. No paperwork required.</p>
            </div>
            <div className="step-connector"><ChevronRight size={24} /></div>

            <div className="step-card">
              <div className="step-number">02</div>
              <div className="step-icon-wrap">
                <Zap size={24} />
              </div>
              <h4 className="step-title">Explore AI Tools</h4>
              <p className="step-desc">Upload clinical data, run diagnostics, or chat with your AI medical assistant instantly.</p>
            </div>
            <div className="step-connector"><ChevronRight size={24} /></div>

            <div className="step-card">
              <div className="step-number">03</div>
              <div className="step-icon-wrap">
                <HeartPulse size={24} />
              </div>
              <h4 className="step-title">Manage & Monitor</h4>
              <p className="step-desc">Book appointments, track patient records, view analytics, and get real-time notifications.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Testimonials ───────── */}
      <section id="testimonials" className="testimonials-section">
        <div className="landing-container">
          <div className="section-header-landing">
            <div className="section-pill">What People Say</div>
            <h2 className="section-heading">Trusted by <span className="text-gradient">Medical Professionals</span></h2>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card glass">
              <div className="testimonial-stars">
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />)}
              </div>
              <p className="testimonial-text">
                "PatientLens has transformed how we handle diagnostics. The AI-powered clinical decision support catches patterns we might miss during a busy shift."
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" style={{ background: 'linear-gradient(135deg, #06b6d4, #6366f1)' }}>DH</div>
                <div>
                  <div className="testimonial-name">Dr. Helena Park</div>
                  <div className="testimonial-role">Chief of Radiology, Metro General</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card glass">
              <div className="testimonial-stars">
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />)}
              </div>
              <p className="testimonial-text">
                "Booking appointments used to take 15 minutes on the phone. Now my patients do it themselves in under a minute with instant confirmation."
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>RK</div>
                <div>
                  <div className="testimonial-name">Dr. Rajesh Kumar</div>
                  <div className="testimonial-role">General Practitioner, HealthFirst Clinic</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card glass">
              <div className="testimonial-stars">
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />)}
              </div>
              <p className="testimonial-text">
                "As a patient, I love having instant access to my records and being able to ask the AI assistant about my reports. It's like having a doctor on call 24/7."
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" style={{ background: 'linear-gradient(135deg, #ec4899, #6366f1)' }}>SJ</div>
                <div>
                  <div className="testimonial-name">Sarah Johnson</div>
                  <div className="testimonial-role">Patient, PatientLens User</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── CTA Banner ───────── */}
      <section className="cta-banner">
        <div className="cta-orb cta-orb-1"></div>
        <div className="cta-orb cta-orb-2"></div>
        <div className="cta-content">
          <h2 className="cta-title">Ready to Transform Your Practice?</h2>
          <p className="cta-subtitle">
            Join thousands of healthcare professionals who trust PatientLens AI for smarter diagnostics, seamless scheduling, and secure patient management.
          </p>
          <button className="btn btn-primary hero-btn hero-btn-glow" onClick={onNavigateToAuth}>
            Get Started for Free <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ───────── Footer ───────── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-col">
            <div className="landing-brand" style={{ marginBottom: '1rem' }}>
              <Activity className="brand-icon" size={22} />
              <span className="brand-text" style={{ fontSize: '1.1rem' }}>PatientLens AI</span>
            </div>
            <p className="footer-tagline">Intelligent medicine, orchestrated perfectly.</p>
          </div>
          <div className="footer-col">
            <h4 className="footer-heading">Platform</h4>
            <a href="#features" className="footer-link">Features</a>
            <a href="#how-it-works" className="footer-link">How It Works</a>
            <a href="#testimonials" className="footer-link">Testimonials</a>
          </div>
          <div className="footer-col">
            <h4 className="footer-heading">For Users</h4>
            <button onClick={onNavigateToAuth} className="footer-link" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>Sign In</button>
            <button onClick={onNavigateToAuth} className="footer-link" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>Register</button>
          </div>
          <div className="footer-col">
            <h4 className="footer-heading">Compliance</h4>
            <span className="footer-link">HIPAA Compliant</span>
            <span className="footer-link">SOC 2 Type II</span>
            <span className="footer-link">GDPR Ready</span>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} PatientLens AI Systems. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
