import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';
import { Brain, Bell, Settings, TrendingUp, TrendingDown, Minus, Music } from 'lucide-react';
import { Button } from '../components/ui/button';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import MusicPlayer from '../components/MusicPlayer';
import AlertOverlay from '../components/AlertOverlay';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function StudentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [currentState, setCurrentState] = useState(null);
  const [history, setHistory] = useState([]);
  const [prediction, setPrediction] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);

  useEffect(() => {
    if (!user?.onboarding_completed) {
      navigate('/onboarding');
      return;
    }
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [stateRes, historyRes, predictionRes, interventionsRes, alertsRes] = await Promise.all([
        axios.get(`${API_URL}/api/dashboard/current-state`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/dashboard/history?days=7`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/dashboard/prediction?hours=24`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/interventions`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/alerts`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setCurrentState(stateRes.data);
      setHistory(historyRes.data);
      setPrediction(predictionRes.data);
      setInterventions(interventionsRes.data);
      setAlerts(alertsRes.data);

      const unacknowledged = alertsRes.data.find(a => !a.acknowledged);
      if (unacknowledged) {
        setActiveAlert(unacknowledged);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ title, value, max = 100, trend, sparklineData = [], testId }) => {
    const percentage = (value / max) * 100;
    const trendIcon = trend > 0 ? <TrendingUp className="w-4 h-4" /> : trend < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />;
    const trendColor = trend > 0 ? 'text-red-400' : trend < 0 ? 'text-green-400' : 'text-slate-400';

    return (
      <div data-testid={testId} className="bg-surface-elevated border border-white/10 rounded-lg p-6 hover:-translate-y-1 transition-transform">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-300">{title}</h3>
          <span className={trendColor}>{trendIcon}</span>
        </div>
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-3xl font-heading font-light">{value.toFixed(1)}</div>
            <div className="text-xs text-slate-500">out of {max}</div>
          </div>
          <div className="w-16 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line type="monotone" dataKey="value" stroke="#0D9488" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-glow rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-xl">Loading your Digital Twin...</div>
      </div>
    );
  }

  const last7Days = history.slice(-7).map(h => ({ value: h.stress_level }));

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-white/10 bg-surface/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Brain className="w-6 h-6 text-primary" />
            <span className="text-lg font-heading">Cognitive Mirror AI</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              data-testid="nav-notifications-btn"
              className="relative p-2 hover:bg-surface-elevated rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {alerts.filter(a => !a.acknowledged).length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            <button 
              data-testid="nav-twin-brain-btn"
              onClick={() => navigate('/twin-brain')} 
              className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors text-sm"
            >
              My Digital Twin
            </button>
            <button 
              data-testid="nav-settings-btn"
              onClick={() => navigate('/settings')} 
              className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button 
              data-testid="nav-logout-btn"
              onClick={logout} 
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div data-testid="dashboard-welcome-card" className="mb-8">
          <h1 className="text-3xl font-heading font-light mb-2">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name}
          </h1>
          <p className="text-slate-400">Here's your emotional snapshot</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Stress Level"
            value={currentState?.stress_level || 0}
            trend={-1}
            sparklineData={last7Days}
            testId="metric-card-stress"
          />
          <MetricCard
            title="Fatigue Index"
            value={currentState?.fatigue_index || 0}
            trend={0}
            sparklineData={last7Days}
            testId="metric-card-fatigue"
          />
          <MetricCard
            title="Emotional Stability"
            value={currentState?.emotional_stability || 0}
            trend={1}
            sparklineData={last7Days}
            testId="metric-card-stability"
          />
          <MetricCard
            title="Cognitive Load"
            value={currentState?.cognitive_load || 0}
            trend={0}
            sparklineData={last7Days}
            testId="metric-card-cognitive"
          />
          <MetricCard
            title="Burnout Risk"
            value={(currentState?.burnout_risk || 0) * 100}
            trend={-1}
            sparklineData={last7Days}
            testId="metric-card-burnout"
          />
          <MetricCard
            title="Crisis Risk (Non-Diagnostic)"
            value={(currentState?.crisis_risk || 0) * 100}
            trend={0}
            sparklineData={last7Days}
            testId="metric-card-crisis"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div data-testid="prediction-panel" className="bg-surface-elevated border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-heading mb-4">24-Hour Stress Prediction</h2>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={prediction}>
                <defs>
                  <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#64748B"
                  tickFormatter={(val) => new Date(val).getHours() + ':00'}
                />
                <YAxis stroke="#64748B" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)' }}
                  labelFormatter={(val) => new Date(val).toLocaleTimeString()}
                />
                <Area 
                  type="monotone" 
                  dataKey="stress_level" 
                  stroke="#F59E0B" 
                  fill="url(#stressGradient)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-500 mt-2">Predicted stress trajectory based on your patterns and upcoming events</p>
          </div>

          <div data-testid="interventions-panel" className="bg-surface-elevated border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading">Recent Interventions</h2>
              <button 
                data-testid="music-therapy-toggle"
                onClick={() => setShowMusicPlayer(!showMusicPlayer)}
                className="p-2 bg-primary/20 hover:bg-primary/30 rounded-lg transition-colors"
              >
                <Music className="w-5 h-5 text-primary" />
              </button>
            </div>
            <div className="space-y-3 max-h-[250px] overflow-y-auto">
              {interventions.length === 0 ? (
                <p className="text-slate-400 text-sm">No interventions yet. We'll recommend actions when needed.</p>
              ) : (
                interventions.map((intervention, idx) => (
                  <div key={idx} className="bg-background border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{intervention.type}</span>
                      <span className={
                        `text-xs px-2 py-1 rounded ${
                          intervention.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          intervention.status === 'dismissed' ? 'bg-slate-700 text-slate-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`
                      }>
                        {intervention.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Tier {intervention.severity_tier} • {new Date(intervention.triggered_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {currentState?.contributing_factors && currentState.contributing_factors.length > 0 && (
          <div data-testid="contributing-factors" className="bg-surface-elevated border border-white/10 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-heading mb-4">Top Contributing Factors</h2>
            <div className="space-y-3">
              {currentState.contributing_factors.map((factor, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-300">{factor.factor}</span>
                      <span className="text-xs text-slate-500">{(factor.weight * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${factor.weight * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-surface-elevated border border-white/10 rounded-lg p-6 text-center">
          <p className="text-xs text-slate-400">
            Cognitive Mirror AI is a non-diagnostic wellbeing support tool. It does not replace professional mental health services.
          </p>
        </div>
      </main>

      {showMusicPlayer && <MusicPlayer onClose={() => setShowMusicPlayer(false)} />}
      {activeAlert && <AlertOverlay alert={activeAlert} onClose={() => setActiveAlert(null)} />}

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-elevated border-t border-white/10 flex">
        <button 
          data-testid="mobile-nav-dashboard"
          className="flex-1 py-4 text-center text-primary border-t-2 border-primary"
        >
          Dashboard
        </button>
        <button 
          data-testid="mobile-nav-twin"
          onClick={() => navigate('/twin-brain')} 
          className="flex-1 py-4 text-center text-slate-400"
        >
          Twin Brain
        </button>
        <button 
          data-testid="mobile-nav-settings"
          onClick={() => navigate('/settings')} 
          className="flex-1 py-4 text-center text-slate-400"
        >
          Settings
        </button>
      </div>
    </div>
  );
}

export default StudentDashboard;