import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Brain, Shield, TrendingUp, Music, Bell, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

function LandingPage() {
  const navigate = useNavigate();
  const { login, register, loginWithGoogle } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    university: '',
    student_id: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast.success('Welcome back!');
      } else {
        await register(formData);
        toast.success('Account created successfully!');
        navigate('/onboarding');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || 'Authentication failed');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      toast.success('Welcome!');
      if (!user.onboarding_completed) {
        navigate('/onboarding');
      }
    } catch (error) {
      toast.error(error.message || 'Google sign-in failed');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-white/10 bg-surface/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            <span className="text-xl font-heading font-medium">Cognitive Mirror AI</span>
          </div>
          <Button 
            data-testid="nav-get-started-btn"
            onClick={() => setShowAuth(true)} 
            className="bg-primary hover:bg-primary-hover text-white"
          >
            Get Started
          </Button>
        </div>
      </nav>

      <section 
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1764336312138-14a5368a6cd3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2ODl8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGdsb3dpbmclMjBicmFpbiUyMG5ldHdvcmt8ZW58MHx8fHwxNzc2MDY3NDgxfDA&ixlib=rb-4.1.0&q=85')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-slate-900/80"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light tracking-tight mb-6">
            Your emotional future,<br />predicted. Your wellbeing,<br />protected.
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 mb-8 leading-relaxed max-w-2xl mx-auto">
            Cognitive Mirror AI creates a Digital Twin of your mental state, predicting stress 24 hours ahead and intervening before crisis strikes.
          </p>
          <Button 
            data-testid="hero-get-started-btn"
            onClick={() => setShowAuth(true)} 
            size="lg" 
            className="bg-primary hover:bg-primary-hover text-white text-lg px-8 py-6"
          >
            Start Your Journey
          </Button>
        </div>
      </section>

      <section className="py-24 bg-surface">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading text-center mb-16 tracking-tight">
            How Your Digital Twin Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-surface-elevated border border-white/10 p-8 rounded-lg">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-heading mb-3">Monitor</h3>
              <p className="text-slate-400 leading-relaxed">
                Continuous tracking of stress, fatigue, emotional stability, cognitive load, and burnout risk through wearable integration and behavioral signals.
              </p>
            </div>
            <div className="bg-surface-elevated border border-white/10 p-8 rounded-lg">
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-heading mb-3">Predict</h3>
              <p className="text-slate-400 leading-relaxed">
                24-hour emotional forecasting using your Digital Twin. See stress spikes before they happen, with confidence intervals and event markers.
              </p>
            </div>
            <div className="bg-surface-elevated border border-white/10 p-8 rounded-lg">
              <div className="w-12 h-12 bg-alert-low/20 rounded-lg flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-alert-low" />
              </div>
              <h3 className="text-xl font-heading mb-3">Intervene</h3>
              <p className="text-slate-400 leading-relaxed">
                Real-time interventions scaled to severity: gentle nudges for mild stress, guided breathing for moderate, and music therapy + counselor alerts for crisis.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading text-center mb-16 tracking-tight">
            Platform Features
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-heading mb-2">Music Therapy Integration</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  Auto-play soothing playlists during crisis alerts. Supports Spotify, YouTube, and Apple Music based on your subscription.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-heading mb-2">Privacy-First Design</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  Granular consent management. You control every data stream. GDPR and FERPA compliant. Data encrypted at rest and in transit.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-heading mb-2">Counselor Portal</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  Therapists see aggregated trends for consented students. Flag high-risk individuals early, with 7-day alert history.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-heading mb-2">Interactive Digital Twin</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  Explore your emotional brain in 3D. Run "what-if" simulations. Test interventions. See your trajectory over time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-surface">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex gap-3 items-center justify-center mb-6">
            <Shield className="w-8 h-8 text-primary" />
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-4">Compliance & Research Ethics</p>
          <p className="text-slate-300 leading-relaxed">
            Cognitive Mirror AI is a <strong>non-diagnostic</strong> wellbeing support tool. It does not replace professional mental health services. All data handling complies with GDPR, FERPA, and university research ethics standards.
          </p>
        </div>
      </section>

      <footer className="py-24 bg-background border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-heading mb-8 tracking-tight">
            Ready to know your emotional future?
          </h2>
          <Button 
            data-testid="footer-get-started-btn"
            onClick={() => setShowAuth(true)} 
            size="lg" 
            className="bg-primary hover:bg-primary-hover text-white text-lg px-8 py-6"
          >
            Create Your Digital Twin
          </Button>
        </div>
      </footer>

      {showAuth && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-elevated border border-white/10 rounded-lg p-8 max-w-md w-full relative">
            <h2 className="text-2xl font-heading mb-6">{isLogin ? 'Sign In' : 'Create Account'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <Input
                    data-testid="auth-name-input"
                    type="text"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required={!isLogin}
                    className="bg-background border-white/10"
                  />
                  <Input
                    data-testid="auth-university-input"
                    type="text"
                    placeholder="University"
                    value={formData.university}
                    onChange={(e) => setFormData({...formData, university: e.target.value})}
                    className="bg-background border-white/10"
                  />
                  <Input
                    data-testid="auth-student-id-input"
                    type="text"
                    placeholder="Student ID"
                    value={formData.student_id}
                    onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                    className="bg-background border-white/10"
                  />
                </>
              )}
              <Input
                data-testid="auth-email-input"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                className="bg-background border-white/10"
              />
              <Input
                data-testid="auth-password-input"
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                className="bg-background border-white/10"
              />
              <Button 
                data-testid="auth-submit-btn"
                type="submit" 
                className="w-full bg-primary hover:bg-primary-hover text-white"
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-surface-elevated px-2 text-slate-400">or</span>
              </div>
            </div>

            <Button
              data-testid="google-signin-btn"
              type="button"
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full flex items-center justify-center gap-3 border-white/10 hover:bg-background"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            <div className="mt-4 text-center">
              <button
                data-testid="auth-toggle-btn"
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:text-primary-hover text-sm"
              >
                {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
              </button>
            </div>
            <button
              data-testid="auth-close-btn"
              onClick={() => setShowAuth(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;