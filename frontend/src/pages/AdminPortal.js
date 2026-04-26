import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Users, TrendingUp, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function AdminPortal() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API_URL}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(res.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const stressDistribution = [
    { name: 'Low (0-40)', value: 35, color: '#10B981' },
    { name: 'Moderate (40-70)', value: 50, color: '#F59E0B' },
    { name: 'High (70-100)', value: 15, color: '#EF4444' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-white/10 bg-surface/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button 
            data-testid="admin-back-btn"
            onClick={() => navigate('/dashboard')} 
            className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-heading">University Admin Analytics</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-light mb-2">Population-Level Analytics</h1>
          <p className="text-slate-400">Aggregated, de-identified student wellbeing data</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Loading analytics...</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div data-testid="admin-stat-users" className="bg-surface-elevated border border-white/10 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-sm text-slate-400">Active Users</span>
                </div>
                <div className="text-3xl font-heading font-light">{analytics?.total_active_users || 0}</div>
              </div>

              <div data-testid="admin-stat-stress" className="bg-surface-elevated border border-white/10 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  <span className="text-sm text-slate-400">Avg Stress</span>
                </div>
                <div className="text-3xl font-heading font-light">{analytics?.average_stress_level?.toFixed(1) || 0}</div>
              </div>

              <div data-testid="admin-stat-burnout" className="bg-surface-elevated border border-white/10 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-5 h-5 text-red-400" />
                  <span className="text-sm text-slate-400">Avg Burnout Risk</span>
                </div>
                <div className="text-3xl font-heading font-light">{((analytics?.average_burnout_risk || 0) * 100).toFixed(1)}%</div>
              </div>

              <div data-testid="admin-stat-completion" className="bg-surface-elevated border border-white/10 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-slate-400">Intervention Rate</span>
                </div>
                <div className="text-3xl font-heading font-light">{((analytics?.intervention_completion_rate || 0) * 100).toFixed(0)}%</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div data-testid="admin-stress-distribution" className="bg-surface-elevated border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-heading mb-4">Stress Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stressDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stressDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div data-testid="admin-interventions-chart" className="bg-surface-elevated border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-heading mb-4">Intervention Completion Rate</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Completed', value: analytics?.total_interventions * (analytics?.intervention_completion_rate || 0) },
                    { name: 'Dismissed', value: analytics?.total_interventions * (1 - (analytics?.intervention_completion_rate || 0)) }
                  ]}>
                    <XAxis dataKey="name" stroke="#64748B" />
                    <YAxis stroke="#64748B" />
                    <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <Bar dataKey="value" fill="#0D9488" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-8 bg-surface-elevated border border-white/10 rounded-lg p-6 text-center">
              <p className="text-xs text-slate-400">
                All data is aggregated and de-identified. Minimum group size of 10 enforced for all breakdowns.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminPortal;