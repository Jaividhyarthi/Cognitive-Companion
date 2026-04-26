import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Brain, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function DigitalTwinBrain() {
  const navigate = useNavigate();
  const [currentState, setCurrentState] = useState(null);
  const [scenario, setScenario] = useState('');
  const [selectedIntervention, setSelectedIntervention] = useState('');
  const [history, setHistory] = useState([]);
  const fgRef = useRef();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [stateRes, historyRes] = await Promise.all([
        axios.get(`${API_URL}/api/dashboard/current-state`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/dashboard/history?days=30`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setCurrentState(stateRes.data);
      setHistory(historyRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const getColorFromStress = (stress) => {
    if (stress < 40) return '#0D9488';
    if (stress < 60) return '#F59E0B';
    if (stress < 80) return '#F97316';
    return '#EF4444';
  };

  const graphData = {
    nodes: [
      { id: 'core', name: 'Emotional Core', val: 30, color: getColorFromStress(currentState?.stress_level || 0) },
      { id: 'stress', name: 'Stress', val: 15, color: '#EF4444' },
      { id: 'fatigue', name: 'Fatigue', val: 15, color: '#F59E0B' },
      { id: 'stability', name: 'Stability', val: 15, color: '#10B981' },
      { id: 'cognitive', name: 'Cognitive', val: 15, color: '#3B82F6' },
      { id: 'burnout', name: 'Burnout', val: 10, color: '#F97316' },
      { id: 'crisis', name: 'Crisis Monitor', val: 10, color: '#DC2626' }
    ],
    links: [
      { source: 'core', target: 'stress' },
      { source: 'core', target: 'fatigue' },
      { source: 'core', target: 'stability' },
      { source: 'core', target: 'cognitive' },
      { source: 'core', target: 'burnout' },
      { source: 'core', target: 'crisis' }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-white/10 bg-surface/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button 
            data-testid="back-to-dashboard-btn"
            onClick={() => navigate('/dashboard')} 
            className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Brain className="w-6 h-6 text-primary" />
          <span className="text-lg font-heading">My Digital Twin</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-light mb-2">Your Digital Twin Brain</h1>
          <p className="text-slate-400">Explore your emotional state in real-time, run simulations, and test interventions</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div data-testid="twin-brain-visualization" className="bg-surface-elevated border border-white/10 rounded-lg overflow-hidden" style={{ height: '500px' }}>
              <ForceGraph3D
                ref={fgRef}
                graphData={graphData}
                nodeLabel="name"
                nodeAutoColorBy="color"
                nodeColor={node => node.color}
                linkColor={() => 'rgba(100, 116, 139, 0.3)'}
                backgroundColor="#0F172A"
                nodeThreeObject={node => {
                  const sprite = new THREE.Sprite(
                    new THREE.SpriteMaterial({
                      map: new THREE.CanvasTexture(generateNodeTexture(node.name, node.color)),
                      transparent: true
                    })
                  );
                  sprite.scale.set(12, 12, 1);
                  return sprite;
                }}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div data-testid="state-mirror-module" className="bg-surface-elevated border border-white/10 rounded-lg p-6">
              <h2 className="text-lg font-heading mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                State Mirror
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Stress</span>
                  <span className="font-medium">{currentState?.stress_level?.toFixed(1) || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fatigue</span>
                  <span className="font-medium">{currentState?.fatigue_index?.toFixed(1) || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stability</span>
                  <span className="font-medium">{currentState?.emotional_stability?.toFixed(1) || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cognitive Load</span>
                  <span className="font-medium">{currentState?.cognitive_load?.toFixed(1) || 0}</span>
                </div>
              </div>
            </div>

            <div data-testid="simulation-engine-module" className="bg-surface-elevated border border-white/10 rounded-lg p-6">
              <h2 className="text-lg font-heading mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                Simulation Engine
              </h2>
              <Select value={scenario} onValueChange={setScenario}>
                <SelectTrigger data-testid="scenario-select" className="mb-3">
                  <SelectValue placeholder="Select scenario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exam">Exam Tomorrow</SelectItem>
                  <SelectItem value="sleep-dep">Sleep Deprivation (4hrs)</SelectItem>
                  <SelectItem value="overload">Academic Overload</SelectItem>
                  <SelectItem value="isolation">Social Isolation Weekend</SelectItem>
                  <SelectItem value="recovery">Good Sleep + Exercise</SelectItem>
                </SelectContent>
              </Select>
              {scenario && (
                <div className="bg-background border border-white/10 rounded p-3 text-sm">
                  <p className="text-slate-400 mb-2">Predicted impact:</p>
                  <p className="text-accent">+15 stress, -10 stability</p>
                </div>
              )}
            </div>

            <div data-testid="treatment-tester-module" className="bg-surface-elevated border border-white/10 rounded-lg p-6">
              <h2 className="text-lg font-heading mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-alert-low rounded-full"></div>
                Treatment Tester
              </h2>
              <Select value={selectedIntervention} onValueChange={setSelectedIntervention}>
                <SelectTrigger data-testid="intervention-select" className="mb-3">
                  <SelectValue placeholder="Test intervention" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breathing">Breathing Exercise</SelectItem>
                  <SelectItem value="break">Break Reminder</SelectItem>
                  <SelectItem value="sleep">Sleep Guidance</SelectItem>
                  <SelectItem value="music">Music Therapy</SelectItem>
                  <SelectItem value="schedule">Schedule Adjustment</SelectItem>
                </SelectContent>
              </Select>
              {selectedIntervention && (
                <div className="bg-background border border-white/10 rounded p-3 text-sm">
                  <p className="text-slate-400 mb-2">Predicted outcome:</p>
                  <p className="text-alert-low">-15 stress over 6 hours</p>
                  <p className="text-xs text-slate-500 mt-2">Confidence: 78%</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div data-testid="trajectory-recorder-module" className="mt-6 bg-surface-elevated border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-heading mb-4">Trajectory Recorder</h2>
          <div className="grid grid-cols-7 gap-2">
            {history.slice(-30).map((day, idx) => {
              const stress = day.stress_level;
              const color = stress < 40 ? 'bg-green-500' : stress < 60 ? 'bg-yellow-500' : 'bg-red-500';
              return (
                <div 
                  key={idx} 
                  className={`h-12 rounded ${color} opacity-${Math.min(9, Math.floor((idx / 30) * 9) + 1)}0`}
                  title={new Date(day.timestamp).toLocaleDateString()}
                />
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mt-4">Last 30 days of emotional state (green = calm, yellow = moderate, red = high stress)</p>
        </div>
      </main>
    </div>
  );
}

function generateNodeTexture(label, color) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 128;
  canvas.height = 128;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(64, 64, 50, 0, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px Inter';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 64, 64);

  return canvas;
}

export default DigitalTwinBrain;