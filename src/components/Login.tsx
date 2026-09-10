import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import './Login.css';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '616161çaykara') {
      setError(false);
      sessionStorage.setItem('hazine_auth', 'true');
      onLoginSuccess();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="login-container">
      <div className="login-overlay"></div>
      <div className="login-card">
        <div className="login-logo">
          <img src="/logo_3d.jpg" alt="HP Logo" style={{ width: '100px', height: '100px', objectFit: 'contain', borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
        </div>
        <h1 className="login-title">Hazine Parselleri</h1>
        <p className="login-subtitle">Sisteme giriş yapmak için parolanızı giriniz.</p>
        
        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">Hatalı parola! Lütfen tekrar deneyin.</div>}
          
          <div className="password-input-container">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Parola"
              autoFocus
            />
            <Lock className="password-input-icon" size={20} />
          </div>
          
          <button type="submit" className="login-btn">
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              Giriş Yap <ArrowRight size={18} />
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
