import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import Loader from '../components/Loader';
import { useToast } from '../context/ToastContext';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const { addToast } = useToast();

  const processedCode = useRef(null);

  useEffect(() => {
    const code = searchParams.get('code');
    
    if (!code) {
      setError('No authorization code received');
      return;
    }

    // Prevent double-firing in React Strict Mode
    if (processedCode.current === code) return;
    processedCode.current = code;

    const handleCallback = async () => {
      try {
        const redirectUri = `${window.location.origin}/auth/callback`;
        const codeVerifier = sessionStorage.getItem('code_verifier');
        
        // Use connectEmail if the user is already logged in, otherwise googleCallback
        const token = localStorage.getItem('access_token');
        if (token) {
           await authAPI.connectEmail(code, redirectUri, codeVerifier);
           addToast('Gmail account connected successfully!', 'success');
           navigate('/accounts', { replace: true });
        } else {
           const res = await authAPI.googleCallback(code, redirectUri, codeVerifier);
           const { access, refresh, user } = res.data;
           login(access, refresh, user);
           addToast(`Welcome back, ${user.first_name || 'user'}!`, 'success');
           navigate('/', { replace: true });
        }
        sessionStorage.removeItem('code_verifier');
      } catch (err) {
        console.error('Auth callback failed:', err);
        setError(err.response?.data?.error || 'Authentication failed. Please try again.');
        addToast(err.response?.data?.error || 'Authentication failed. Please try again.', 'error');
      }
    };

    handleCallback();
  }, [searchParams, login, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-full bg-brand-red/15 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-2">Authentication Failed</h2>
          <p className="text-sm text-text-secondary mb-6">{error}</p>
          <button onClick={() => navigate('/login')} className="btn-primary w-full">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return <Loader fullScreen text="Completing sign in..." />;
}
