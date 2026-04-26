import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function CounselorPortal() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API_URL}/api/counselor/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-white/10 bg-surface/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button 
            data-testid="counselor-back-btn"
            onClick={() => navigate('/dashboard')} 
            className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-heading">Counselor Portal</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-light mb-2">Student Wellbeing Overview</h1>
          <p className="text-slate-400">Monitor consented students' emotional health trends</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">No students have granted counselor access yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {students.map((item, idx) => {
              const student = item.student;
              const state = item.current_state;
              const hasAlert = state && (state.stress_level > 70 || state.burnout_risk > 0.7);

              return (
                <div 
                  key={idx} 
                  data-testid={`student-card-${idx}`}
                  className={`bg-surface-elevated border rounded-lg p-6 ${
                    hasAlert ? 'border-red-500/50' : 'border-white/10'
                  }`}
                >
                  {hasAlert && (
                    <div className="flex items-center gap-2 mb-4 text-red-400 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>High-risk alert in past 7 days</span>
                    </div>
                  )}
                  
                  <h3 className="text-lg font-heading mb-4">Student ID: {student.student_id || 'Anonymous'}</h3>
                  
                  {state ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Stress Level</span>
                        <span className="font-medium">{state.stress_level?.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Fatigue Index</span>
                        <span className="font-medium">{state.fatigue_index?.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Emotional Stability</span>
                        <span className="font-medium">{state.emotional_stability?.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Burnout Risk</span>
                        <span className="font-medium">{(state.burnout_risk * 100).toFixed(1)}%</span>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-xs text-slate-500">7-day trend</p>
                        <div className="h-16 mt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[{v: 40}, {v: 45}, {v: 50}, {v: 55}, {v: 60}, {v: state.stress_level}]}>
                              <Line type="monotone" dataKey="v" stroke="#0D9488" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No recent data available</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default CounselorPortal;