import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = '/api/internal';

export function internalFetch(path, options = {}) {
  const token = localStorage.getItem('internal_token');
  return fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  }).then(async r => {
    if (r.status === 401) {
      const refresh = localStorage.getItem('internal_refresh');
      if (refresh) {
        const res = await fetch(`${API}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: refresh }),
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('internal_token', data.token);
          localStorage.setItem('internal_refresh', data.refreshToken);
          options.headers = { ...options.headers, Authorization: `Bearer ${data.token}` };
          return fetch(`${API}${path}`, options);
        }
      }
      localStorage.removeItem('internal_token');
      localStorage.removeItem('internal_refresh');
      localStorage.removeItem('internal_employee');
      window.location.href = '/internal/login';
      throw new Error('Session expired');
    }
    return r.json();
  });
}

export default function useInternalAuth() {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(() => {
    try { return JSON.parse(localStorage.getItem('internal_employee')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('internal_token');
    if (!token) {
      setLoading(false);
      if (window.location.pathname.startsWith('/internal') && !window.location.pathname.includes('/login')) {
        navigate('/internal/login');
      }
      return;
    }
    internalFetch('/auth/profile')
      .then(data => {
        if (data.employee) {
          setEmployee({ ...data.employee, role: data.role, department: data.department });
          localStorage.setItem('internal_employee', JSON.stringify({ ...data.employee, role: data.role, department: data.department }));
        } else {
          throw new Error('Invalid session');
        }
      })
      .catch(() => {
        localStorage.removeItem('internal_token');
        localStorage.removeItem('internal_refresh');
        localStorage.removeItem('internal_employee');
        navigate('/internal/login');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const login = async (email, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    localStorage.setItem('internal_token', data.token);
    localStorage.setItem('internal_refresh', data.refreshToken);
    localStorage.setItem('internal_employee', JSON.stringify({ ...data.employee, role: data.role, department: data.department }));
    setEmployee({ ...data.employee, role: data.role, department: data.department });
    return data;
  };

  const logout = async () => {
    try { await internalFetch('/auth/logout', { method: 'POST' }); } catch {}
    localStorage.removeItem('internal_token');
    localStorage.removeItem('internal_refresh');
    localStorage.removeItem('internal_employee');
    setEmployee(null);
    navigate('/internal/login');
  };

  return { employee, login, logout, loading };
}
