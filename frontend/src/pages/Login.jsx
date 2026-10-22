import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Lock, Mail, Briefcase, ArrowRight, ShieldCheck, UserCheck, Wrench } from 'lucide-react';
import AlertBanner from '../components/AlertBanner';

const Login = () => {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('IT');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleQuickFill = (demoEmail, demoPassword) => {
    setIsLoginTab(true);
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isLoginTab) {
        if (!email.trim() || !password) {
          setErrorMsg('Please enter both email and password.');
          setLoading(false);
          return;
        }

        const user = await login(email.trim(), password);
        // Role-based redirection
        if (user.role === 'admin') {
          navigate('/admin');
        } else if (user.role === 'facility_manager') {
          navigate('/facility');
        } else {
          navigate('/dashboard');
        }
      } else {
        // Registration tab (employees only)
        if (!email.trim() || !password || !department) {
          setErrorMsg('All fields are required.');
          setLoading(false);
          return;
        }

        await register({ department, email: email.trim(), password });
        setSuccessMsg('Account created successfully! You can now log in.');
        setIsLoginTab(true);
      }
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Authentication failed. Please check credentials.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)',
        padding: '2rem 1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: '#ffffff',
          borderRadius: 'var(--border-radius-xl)',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
          overflow: 'hidden',
        }}
      >
        {/* Brand Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e40af, #2563eb)',
            padding: '2rem 2rem 1.75rem',
            color: '#ffffff',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Building2 size={32} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.25rem' }}>
            Smart Meeting Room
          </h1>
          <p style={{ color: '#bfdbfe', fontSize: '0.88rem' }}>
            Intelligent Room & Resource Sharing Platform
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setIsLoginTab(true);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            style={{
              flex: 1,
              padding: '0.9rem',
              border: 'none',
              background: isLoginTab ? '#ffffff' : 'transparent',
              fontWeight: 700,
              fontSize: '0.92rem',
              color: isLoginTab ? '#2563eb' : '#64748b',
              borderBottom: isLoginTab ? '2px solid #2563eb' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLoginTab(false);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            style={{
              flex: 1,
              padding: '0.9rem',
              border: 'none',
              background: !isLoginTab ? '#ffffff' : 'transparent',
              fontWeight: 700,
              fontSize: '0.92rem',
              color: !isLoginTab ? '#2563eb' : '#64748b',
              borderBottom: !isLoginTab ? '2px solid #2563eb' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Employee Registration
          </button>
        </div>

        <div style={{ padding: '1.75rem 2rem 2rem' }}>
          {errorMsg && <AlertBanner type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}
          {successMsg && <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

          <form onSubmit={handleSubmit}>
            {!isLoginTab && (
              <div className="form-group">
                <label className="form-label">
                  Department <span className="required">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    className="form-control"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                  >
                    <option value="IT">IT</option>
                    <option value="Management">Management</option>
                    <option value="Travel Agency">Travel Agency</option>
                  </select>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Company Email <span className="required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-control"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Password <span className="required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
              style={{ marginTop: '0.75rem' }}
            >
              {loading ? (
                'Processing...'
              ) : isLoginTab ? (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div
            style={{
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px dashed #cbd5e1',
            }}
          >
            <p
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#64748b',
                marginBottom: '0.65rem',
                textAlign: 'center',
              }}
            >
              ⚡ Quick Demo Credentials
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickFill('admin.it@company.com', 'Admin@123')}
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.2rem', gap: '0.25rem' }}
                title="Login as IT Admin"
              >
                <ShieldCheck size={14} color="#6d28d9" />
                <span>Admin</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickFill('facility@company.com', 'Facility@123')}
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.2rem', gap: '0.25rem' }}
                title="Login as Facility Manager"
              >
                <Wrench size={14} color="#059669" />
                <span>Manager</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickFill('employee@company.com', 'User@123')}
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.2rem', gap: '0.25rem' }}
                title="Login as Employee"
              >
                <UserCheck size={14} color="#2563eb" />
                <span>Employee</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
