import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('ll_user');
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const login = async (email, password, captchaToken) => {
    const { data } = await api.post('/auth/login', {
      email,
      password,
      ...(captchaToken ? { turnstileToken: captchaToken } : {}),
    });
    localStorage.setItem('ll_user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const register = async (name, email, password, captchaToken) => {
    const { data } = await api.post('/auth/register', {
      name,
      email,
      password,
      ...(captchaToken ? { turnstileToken: captchaToken } : {}),
    });
    localStorage.setItem('ll_user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('ll_user');
    setUser(null);
  };

  const updateProfile = async (userData) => {
    const { data } = await api.put('/auth/profile', userData);
    localStorage.setItem('ll_user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const requestOtp = async (email, captchaToken) => {
    await api.post('/auth/send-otp', {
      email,
      ...(captchaToken ? { turnstileToken: captchaToken } : {}),
    });
  };

  const verifyOtp = async (email, otp, name) => {
    const { data } = await api.post('/auth/verify-otp', { email, otp, name });
    localStorage.setItem('ll_user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const googleLogin = async (credential) => {
    const { data } = await api.post('/auth/google', { credential });
    localStorage.setItem('ll_user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, requestOtp, verifyOtp, googleLogin }}>
      {children}
    </AuthContext.Provider>
  );
};
