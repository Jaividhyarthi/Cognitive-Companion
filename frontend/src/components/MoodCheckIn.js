import React, { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MOODS = [
  { score: 1, emoji: '😢', label: 'Very Bad', color: 'bg-red-500' },
  { score: 2, emoji: '😟', label: 'Bad', color: 'bg-orange-500' },
  { score: 3, emoji: '😐', label: 'Okay', color: 'bg-yellow-500' },
  { score: 4, emoji: '🙂', label: 'Good', color: 'bg-lime-500' },
  { score: 5, emoji: '😄', label: 'Great', color: 'bg-green-500' }
];

const STRESSORS = ['academic', 'social', 'health', 'financial', 'relationships', 'other'];

function MoodCheckIn({ onClose }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [notes, setNotes] = useState('');
  const [stressors, setStressors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedMood) {
      toast.error('Please select a mood');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      await axios.post(
        `${API_URL}/api/mood/report`,
        null,
        {
          params: {
            mood_score: selectedMood,
            notes: notes || undefined,
            stressor_tags: stressors
          },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Mood check-in recorded!');
      onClose();
    } catch (error) {
      toast.error('Failed to record mood');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStressor = (stressor) => {
    if (stressors.includes(stressor)) {
      setStressors(stressors.filter(s => s !== stressor));
    } else {
      setStressors([...stressors, stressor]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-elevated border border-white/10 rounded-lg p-6 max-w-md w-full relative">
        <button
          data-testid="mood-checkin-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-background rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-heading mb-6">How are you feeling?</h2>

        <div className="flex justify-between mb-6">
          {MOODS.map(mood => (
            <button
              key={mood.score}
              data-testid={`mood-${mood.score}-btn`}
              onClick={() => setSelectedMood(mood.score)}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                selectedMood === mood.score
                  ? `${mood.color} text-white scale-110`
                  : 'bg-background hover:bg-slate-700'
              }`}
            >
              <span className="text-3xl">{mood.emoji}</span>
              <span className="text-xs">{mood.label}</span>
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label className="text-sm text-slate-400 mb-2 block">What's on your mind? (optional)</label>
          <Textarea
            data-testid="mood-notes-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Share what you're experiencing..."
            className="bg-background border-white/10 min-h-[80px]"
          />
        </div>

        <div className="mb-6">
          <label className="text-sm text-slate-400 mb-2 block">Tag stressors (optional)</label>
          <div className="flex flex-wrap gap-2">
            {STRESSORS.map(stressor => (
              <button
                key={stressor}
                data-testid={`stressor-${stressor}-btn`}
                onClick={() => toggleStressor(stressor)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  stressors.includes(stressor)
                    ? 'bg-primary text-white'
                    : 'bg-background text-slate-400 hover:bg-slate-700'
                }`}
              >
                {stressor}
              </button>
            ))}
          </div>
        </div>

        <Button
          data-testid="mood-submit-btn"
          onClick={handleSubmit}
          disabled={!selectedMood || submitting}
          className="w-full bg-primary hover:bg-primary-hover text-white"
        >
          {submitting ? 'Recording...' : 'Submit Check-In'}
        </Button>
      </div>
    </div>
  );
}

export default MoodCheckIn;