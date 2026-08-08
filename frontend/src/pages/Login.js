import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #4F46E5 100%)',
    padding: 20,
  },
  card: {
    background: '#FFFFFF',
    borderRadius: 16,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
  logo: {
    textAlign: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  logoSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #D1D5DB',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
  },
  inputFocus: {
    borderColor: '#4F46E5',
    boxShadow: '0 0 0 3px rgba(79,70,229,0.1)',
  },
  error: {
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  submitBtn: {
    width: '100%',
    padding: '12px 0',
    background: '#4F46E5',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.15s, transform 0.1s',
    marginTop: 8,
  },
  submitBtnDisabled: {
    background: '#A5B4FC',
    cursor: 'not-allowed',
  },
  hint: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
    color: '#9CA3AF',
  },
};

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('请输入邮箱和密码');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || '登录失败，请检查账号密码';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🎓</div>
          <h1 style={styles.logoText}>教培管理系统</h1>
          <p style={styles.logoSub}>Education & Training Management</p>
        </div>

        {error && (
          <div style={styles.error}>
            <span>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>邮箱</label>
            <input
              type="email"
              placeholder="请输入邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField('')}
              style={{
                ...styles.input,
                ...(focusedField === 'email' ? styles.inputFocus : {}),
              }}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>密码</label>
            <input
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField('')}
              style={{
                ...styles.input,
                ...(focusedField === 'password' ? styles.inputFocus : {}),
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              ...(loading ? styles.submitBtnDisabled : {}),
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = '#4338CA';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = '#4F46E5';
            }}
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        <p style={styles.hint}>
          如需账号请联系管理员
        </p>
      </div>
    </div>
  );
}
