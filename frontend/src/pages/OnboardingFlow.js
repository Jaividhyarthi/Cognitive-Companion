import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function OnboardingFlow() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    consents: {
      wearable: false,
      phone: false,
      mood: false,
      calendar: false,
      academic: false,
      research: false
    },
    wearables: [],
    baseline: {
      stress_response_type: '',
      stress_recovery_speed: '',
      coping_style: '',
      chronotype: '',
      sleep_hours: 7,
      sleep_variability: '',
      social_type: '',
      stress_social_behavior: '',
      social_media_pattern: '',
      academic_identity: '',
      grade_impact: '',
      academic_stressor: '',
      music_receptivity: '',
      preferred_modality: '',
      best_intervention: ''
    }
  });

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_URL}/api/onboarding/complete`, {
        stress_personality: {
          response_type: formData.baseline.stress_response_type,
          recovery_speed: formData.baseline.stress_recovery_speed,
          coping_style: formData.baseline.coping_style
        },
        sleep_baseline: {
          chronotype: formData.baseline.chronotype,
          typical_hours: formData.baseline.sleep_hours,
          variability: formData.baseline.sleep_variability
        },
        social_baseline: {
          type: formData.baseline.social_type,
          stress_behavior: formData.baseline.stress_social_behavior,
          social_media_pattern: formData.baseline.social_media_pattern
        },
        academic_relationship: {
          identity_weight: formData.baseline.academic_identity,
          grade_impact: formData.baseline.grade_impact,
          primary_stressor: formData.baseline.academic_stressor
        },
        treatment_preferences: {
          music_receptivity: formData.baseline.music_receptivity,
          preferred_modality: formData.baseline.preferred_modality,
          best_intervention: formData.baseline.best_intervention
        },
        emotional_awareness: {}
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Onboarding complete! Generating your baseline...');
      if (refreshUser) await refreshUser();
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to complete onboarding');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-surface-elevated border border-white/10 rounded-lg p-8">
        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map(s => (
              <div
                key={s}
                className={`h-1 flex-1 rounded ${
                  s <= step ? 'bg-primary' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-slate-400">Step {step} of 5</p>
        </div>

        {step === 1 && (
          <div data-testid="onboarding-step-1">
            <h2 className="text-2xl font-heading mb-4">Welcome to Cognitive Mirror AI</h2>
            <p className="text-slate-300 mb-6">Let's set up your Digital Twin. This will take about 5 minutes.</p>
            <div className="space-y-4">
              <p className="text-sm text-slate-400">First, let's get your consent for data collection:</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div data-testid="onboarding-step-2">
            <h2 className="text-2xl font-heading mb-6">Consent Management</h2>
            <div className="space-y-4">
              {[
                { key: 'wearable', label: 'Wearable Data', desc: 'Heart rate, sleep, activity from connected devices' },
                { key: 'phone', label: 'Phone Signals', desc: 'Screen time, app usage patterns' },
                { key: 'mood', label: 'Self-Report Mood', desc: 'Your manual mood check-ins' },
                { key: 'calendar', label: 'Calendar Access', desc: 'Academic schedule and events' },
                { key: 'academic', label: 'Academic Schedule', desc: 'Course load and exam dates' },
                { key: 'research', label: 'Research Consent', desc: 'Use data for wellbeing research (anonymized)' }
              ].map(item => (
                <div key={item.key} className="flex items-start gap-3 p-4 bg-background rounded-lg">
                  <Checkbox
                    data-testid={`consent-${item.key}-checkbox`}
                    checked={formData.consents[item.key]}
                    onCheckedChange={(checked) => 
                      setFormData({
                        ...formData,
                        consents: { ...formData.consents, [item.key]: checked }
                      })
                    }
                  />
                  <div>
                    <Label className="text-sm font-medium">{item.label}</Label>
                    <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div data-testid="onboarding-step-3">
            <h2 className="text-2xl font-heading mb-6">Connect Wearables (Optional)</h2>
            <p className="text-slate-400 mb-6 text-sm">For demo purposes, we'll simulate wearable data. In production, connect your device here.</p>
            <div className="grid grid-cols-2 gap-4">
              {['Fitbit', 'Oura Ring', 'Apple Watch', 'Google Fit'].map(device => (
                <button
                  key={device}
                  data-testid={`wearable-${device.toLowerCase().replace(' ', '-')}-btn`}
                  className="p-4 bg-background hover:bg-slate-700 border border-white/10 rounded-lg text-center transition-colors"
                >
                  <div className="font-medium mb-1">{device}</div>
                  <div className="text-xs text-slate-400">Simulated</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div data-testid="onboarding-step-4">
            <h2 className="text-2xl font-heading mb-6">Mood Calibration Questionnaire</h2>
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <Label className="text-sm mb-2 block">Stress Response Type</Label>
                <RadioGroup 
                  value={formData.baseline.stress_response_type}
                  onValueChange={(val) => setFormData({...formData, baseline: {...formData.baseline, stress_response_type: val}})}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="threshold" id="threshold" />
                    <Label htmlFor="threshold" className="text-sm font-normal">Threshold (sudden spike)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="slow-build" id="slow-build" />
                    <Label htmlFor="slow-build" className="text-sm font-normal">Slow build</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="combined" id="combined" />
                    <Label htmlFor="combined" className="text-sm font-normal">Combined</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm mb-2 block">Sleep Hours (typical)</Label>
                <Slider
                  data-testid="sleep-hours-slider"
                  value={[formData.baseline.sleep_hours]}
                  onValueChange={(val) => setFormData({...formData, baseline: {...formData.baseline, sleep_hours: val[0]}})}
                  min={4}
                  max={12}
                  step={0.5}
                  className="mb-2"
                />
                <div className="text-sm text-slate-400">{formData.baseline.sleep_hours} hours</div>
              </div>

              <div>
                <Label className="text-sm mb-2 block">Social Baseline</Label>
                <RadioGroup 
                  value={formData.baseline.social_type}
                  onValueChange={(val) => setFormData({...formData, baseline: {...formData.baseline, social_type: val}})}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="introvert" id="introvert" />
                    <Label htmlFor="introvert" className="text-sm font-normal">Introvert</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="extrovert" id="extrovert" />
                    <Label htmlFor="extrovert" className="text-sm font-normal">Extrovert</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ambivert" id="ambivert" />
                    <Label htmlFor="ambivert" className="text-sm font-normal">Ambivert</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm mb-2 block">Music Therapy Receptivity</Label>
                <RadioGroup 
                  value={formData.baseline.music_receptivity}
                  onValueChange={(val) => setFormData({...formData, baseline: {...formData.baseline, music_receptivity: val}})}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="high" />
                    <Label htmlFor="high" className="text-sm font-normal">High</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium" className="text-sm font-normal">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="low" />
                    <Label htmlFor="low" className="text-sm font-normal">Low</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div data-testid="onboarding-step-5" className="text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-heading mb-4">Ready to Launch</h2>
            <p className="text-slate-300 mb-6">
              Your baseline profile is complete. We'll start collecting your emotional data over the next 3-7 days to calibrate your Digital Twin.
            </p>
            <div className="bg-background border border-white/10 rounded-lg p-6">
              <div className="text-sm text-slate-400 mb-2">Baseline Collection Progress</div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-1/4 rounded-full"></div>
              </div>
              <div className="text-xs text-slate-500 mt-2">Estimated: 3-7 days</div>
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-8">
          {step > 1 && (
            <Button 
              data-testid="onboarding-back-btn"
              onClick={handleBack} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          {step < 5 ? (
            <Button 
              data-testid="onboarding-next-btn"
              onClick={handleNext} 
              className="flex-1 bg-primary hover:bg-primary-hover text-white flex items-center justify-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button 
              data-testid="onboarding-complete-btn"
              onClick={handleComplete} 
              className="flex-1 bg-primary hover:bg-primary-hover text-white"
            >
              Complete Onboarding
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OnboardingFlow;