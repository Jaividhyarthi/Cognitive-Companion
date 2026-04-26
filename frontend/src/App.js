import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { firebaseLogin, firebaseRegister, firebaseGoogleLogin, firebaseLogout } from './lib/firebase';
import LandingPage from './pages/LandingPage';
import OnboardingFlow from './pages/OnboardingFlow';
import StudentDashboard from './pages/StudentDashboard';
import DigitalTwinBrain from './pages/DigitalTwinBrain';
import CounselorPortal from './pages/CounselorPortal';
import AdminPortal from './pages/AdminPortal';
import Settings from './pages/Settings';
import MoodCheckIn from './components/MoodCheckIn';
import { Toaster } from './components/ui/sonner';
import './App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMoodCheckIn, setShowMoodCheckIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setUser(res.data);
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const syncFirebaseUser = async (firebaseUser) => {
    const res = await axios.post(`${API_URL}/api/auth/firebase`, {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName || firebaseUser.email.split('@')[0]
    });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const login = async (email, password) => {
    try {
      const fbUser = await firebaseLogin(email, password);
      return await syncFirebaseUser(fbUser);
    } catch (firebaseError) {
      // Fallback to direct backend auth if Firebase auth fails
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return res.data.user;
    }
  };

  const register = async (userData) => {
    try {
      const fbUser = await firebaseRegister(userData.email, userData.password, userData.name);
      // Also register on backend
      try {
        await axios.post(`${API_URL}/api/auth/register`, userData);
      } catch (e) { /* user may already exist in backend */ }
      return await syncFirebaseUser(fbUser);
    } catch (firebaseError) {
      // Fallback to direct backend registration
      await axios.post(`${API_URL}/api/auth/register`, userData);
      const res = await axios.post(`${API_URL}/api/auth/login`, { email: userData.email, password: userData.password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return res.data.user;
    }
  };

  const loginWithGoogle = async () => {
    const fbUser = await firebaseGoogleLogin();
    return await syncFirebaseUser(fbUser);
  };

  const logout = async () => {
    try { await firebaseLogout(); } catch (e) { /* ignore */ }
    localStorage.removeItem('token');
    setUser(null);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data);
      } catch (e) { /* ignore */ }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser, loginWithGoogle }}>
      <Router>
        <div className="min-h-screen bg-background text-slate-50">
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
            <Route path="/onboarding" element={user ? <OnboardingFlow /> : <Navigate to="/" />} />
            <Route path="/dashboard" element={user ? <StudentDashboard /> : <Navigate to="/" />} />
            <Route path="/twin-brain" element={user ? <DigitalTwinBrain /> : <Navigate to="/" />} />
            <Route path="/counselor" element={user && user.role === 'counselor' ? <CounselorPortal /> : <Navigate to="/" />} />
            <Route path="/admin" element={user && user.role === 'admin' ? <AdminPortal /> : <Navigate to="/" />} />
            <Route path="/settings" element={user ? <Settings /> : <Navigate to="/" />} />
          </Routes>
          
          {user && (
            <>
              <button
                data-testid="mood-checkin-fab"
                onClick={() => setShowMoodCheckIn(true)}
                className="fixed bottom-6 right-6 bg-primary hover:bg-primary-hover text-white rounded-full p-4 shadow-lg z-50 md:bottom-8 md:right-8"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              
              {showMoodCheckIn && (
                <MoodCheckIn onClose={() => setShowMoodCheckIn(false)} />
              )}
            </>
          )}
          
          <Toaster />
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;