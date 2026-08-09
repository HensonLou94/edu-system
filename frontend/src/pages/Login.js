import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('请填写邮箱和密码');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>🎓</div>
          <h1 style={styles.title}>教培管理系统</h1>
          <p style={styles.subtitle}>登录你的账号</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.errorAlert}>⚠️ {error}</div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              style={styles.input}
              autoFocus
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 50%, #F5F3FF 100%)',
    padding: 20,
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
    padding: '48px 40px',
    width: '100%',
    maxWidth: 400,
    animation: 'fadeIn 0.4s ease',
  },
  header: {
    textAlign: 'center',
    marginBottom: 36,
  },
  logo: {
    fontSize: 42,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--gray-900)',
    margin: '0 0 6px',
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--gray-400)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  errorAlert: {
    padding: '10px 14px',
    background: '#FEF2F2',
    color: '#DC2626',
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 8,
    border: '1px solid #FECACA',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--gray-700)',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid var(--gray-300)',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '11px 0',
    background: 'var(--primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
    transition: 'background 0.2s',
  },
};
