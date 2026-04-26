import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Bell, Download, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';

function Settings() {
  const navigate = useNavigate();
  const [consents, setConsents] = useState({
    wearable: true,
    phone: true,
    mood: true,
    calendar: true,
    academic: true,
    research: true,
    counselor_access: false
  });

  const [notifications, setNotifications] = useState({
    push: true,
    email: false,
    sms: false
  });

  const [musicTherapy, setMusicTherapy] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-white/10 bg-surface/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button 
            data-testid="settings-back-btn"
            onClick={() => navigate('/dashboard')} 
            className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-heading">Settings</span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-light mb-2">Settings & Privacy</h1>
          <p className="text-slate-400">Manage your data, consent, and preferences</p>
        </div>

        <div className="space-y-6">
          <div data-testid="consent-management-section" className="bg-surface-elevated border border-white/10 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-heading">Consent Management</h2>
            </div>
            <div className="space-y-4">
              {[
                { key: 'wearable', label: 'Wearable Data' },
                { key: 'phone', label: 'Phone Signals' },
                { key: 'mood', label: 'Self-Report Mood' },
                { key: 'calendar', label: 'Calendar Access' },
                { key: 'academic', label: 'Academic Schedule' },
                { key: 'research', label: 'Research Consent' },
                { key: 'counselor_access', label: 'Counselor Access' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <Label htmlFor={item.key} className="text-sm">{item.label}</Label>
                  <Switch
                    id={item.key}
                    data-testid={`consent-toggle-${item.key}`}
                    checked={consents[item.key]}
                    onCheckedChange={(checked) => setConsents({...consents, [item.key]: checked})}
                  />
                </div>
              ))}
            </div>
          </div>

          <div data-testid="notification-preferences-section" className="bg-surface-elevated border border-white/10 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-heading">Notification Preferences</h2>
            </div>
            <div className="space-y-4">
              {[
                { key: 'push', label: 'Push Notifications' },
                { key: 'email', label: 'Email Alerts' },
                { key: 'sms', label: 'SMS Alerts' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <Label htmlFor={item.key} className="text-sm">{item.label}</Label>
                  <Switch
                    id={item.key}
                    data-testid={`notification-toggle-${item.key}`}
                    checked={notifications[item.key]}
                    onCheckedChange={(checked) => setNotifications({...notifications, [item.key]: checked})}
                  />
                </div>
              ))}
            </div>
          </div>

          <div data-testid="music-therapy-section" className="bg-surface-elevated border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-heading mb-4">Music Therapy</h2>
            <div className="flex items-center justify-between py-3">
              <div>
                <Label htmlFor="music-therapy" className="text-sm">Enable Music Therapy</Label>
                <p className="text-xs text-slate-500 mt-1">Auto-play calming music during crisis alerts</p>
              </div>
              <Switch
                id="music-therapy"
                data-testid="music-therapy-toggle"
                checked={musicTherapy}
                onCheckedChange={setMusicTherapy}
              />
            </div>
          </div>

          <div data-testid="data-management-section" className="bg-surface-elevated border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-heading mb-4">Data Management</h2>
            <div className="space-y-3">
              <Button 
                data-testid="export-data-btn"
                variant="outline" 
                className="w-full flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download My Data
              </Button>
              <Button 
                data-testid="delete-account-btn"
                variant="destructive" 
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Delete My Account
              </Button>
              <p className="text-xs text-slate-500 text-center mt-2">
                Account deletion is subject to a 90-day retention policy
              </p>
            </div>
          </div>

          <div data-testid="privacy-policy-section" className="bg-surface-elevated border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-heading mb-4">Privacy & Compliance</h2>
            <div className="space-y-3 text-sm text-slate-400">
              <p>Cognitive Mirror AI complies with GDPR and FERPA regulations.</p>
              <p>Your data is encrypted at rest and in transit.</p>
              <p>You can withdraw consent at any time.</p>
              <div className="pt-3 border-t border-white/5">
                <a href="#" className="text-primary hover:text-primary-hover">Privacy Policy</a>
                {' • '}
                <a href="#" className="text-primary hover:text-primary-hover">Terms of Service</a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Settings;