import React from 'react';
import axios from 'axios';
import { X, AlertTriangle, Activity, Music } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function AlertOverlay({ alert, onClose }) {
  const handleAcknowledge = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${API_URL}/api/alerts/${alert.id}/acknowledge`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Alert acknowledged');
      onClose();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const getTierConfig = (tier) => {
    switch (tier) {
      case 1:
        return {
          color: 'bg-green-500',
          borderColor: 'border-green-500',
          icon: Activity,
          title: 'Advisory Notice'
        };
      case 2:
        return {
          color: 'bg-amber-500',
          borderColor: 'border-amber-500',
          icon: AlertTriangle,
          title: 'Moderate Stress Alert'
        };
      case 3:
        return {
          color: 'bg-red-500',
          borderColor: 'border-red-500',
          icon: AlertTriangle,
          title: 'Critical Emotional Spike'
        };
      default:
        return {
          color: 'bg-slate-500',
          borderColor: 'border-slate-500',
          icon: Activity,
          title: 'Alert'
        };
    }
  };

  const config = getTierConfig(alert.severity_tier);
  const Icon = config.icon;

  return (
    <div 
      data-testid="alert-overlay"
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div className={`bg-surface-elevated border-2 ${config.borderColor} rounded-lg p-8 max-w-lg w-full relative`}>
        <button
          data-testid="alert-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-background rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 ${config.color} rounded-full flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-heading">{config.title}</h2>
            <p className="text-sm text-slate-400">Tier {alert.severity_tier}</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-slate-300 mb-3">
            {alert.message || `Your ${alert.trigger_metric} has reached ${alert.trigger_value.toFixed(1)}. We recommend taking action.`}
          </p>
          <div className="bg-background border border-white/10 rounded-lg p-4">
            <p className="text-sm font-medium text-primary mb-1">Recommended Action:</p>
            <p className="text-sm text-slate-300">
              {alert.recommended_action || 'Take a 5-minute break and practice deep breathing.'}
            </p>
          </div>
        </div>

        {alert.severity_tier === 3 && (
          <div className="mb-6 bg-primary/10 border border-primary/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Music className="w-5 h-5 text-primary" />
              <span className="font-medium text-primary">Music Therapy Available</span>
            </div>
            <p className="text-sm text-slate-300">
              We can start playing calming music to help stabilize your emotional state.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            data-testid="alert-acknowledge-btn"
            onClick={handleAcknowledge}
            className="flex-1 bg-primary hover:bg-primary-hover text-white"
          >
            Acknowledge
          </Button>
          <Button
            data-testid="alert-dismiss-btn"
            onClick={onClose}
            variant="outline"
          >
            Dismiss
          </Button>
        </div>

        {alert.severity_tier === 3 && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-slate-400 text-center">
              If you are in immediate danger, please contact emergency services or a trusted person.
            </p>
          </div>
        )}

        <button
          data-testid="report-false-alarm-btn"
          className="mt-4 w-full text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Report False Alarm
        </button>
      </div>
    </div>
  );
}

export default AlertOverlay;