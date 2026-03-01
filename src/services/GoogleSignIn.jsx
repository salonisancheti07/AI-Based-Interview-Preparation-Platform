import React from 'react';
import axios from '../services/apiClient';

// Safely decode Google's JWT credential (handles padding + uses GSI helper when present)
const decodeGoogleCredential = (credentialResponse) => {
  if (!credentialResponse?.credential) return null;

  // Prefer the helper shipped with the Google Identity Services script
  const decodeWithGoogle = window.google?.accounts?.id?.decodeJwtResponse;
  if (typeof decodeWithGoogle === 'function') {
    try {
      return decodeWithGoogle(credentialResponse.credential);
    } catch (err) {
      console.warn('decodeJwtResponse failed, falling back to manual decode', err);
    }
  }

  // Manual base64url decode with padding fallback
  try {
    const token = credentialResponse.credential;
    const payload = token.split('.')[1];
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Failed to decode Google credential', err);
    return null;
  }
};

const GoogleSignIn = ({ onSuccess = () => {}, isSignup = false }) => {
  const buttonRef = React.useRef(null);

  const handleGoogleSignIn = async (credentialResponse) => {
    try {
      const googleData = decodeGoogleCredential(credentialResponse);
      if (!googleData?.email) {
        throw new Error('Google credential not received. Check OAuth client settings.');
      }

      // Send to backend
      const response = await axios.post('/api/auth/google', {
        email: googleData.email,
        name: googleData.name,
        googleId: googleData.sub,
        avatar: googleData.picture
      });

      // Response is already unwrapped by apiClient interceptor
      if (response && response.success) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('isAuthenticated', 'true');
        // Hard redirect so protected routes pick up auth immediately
        window.location.replace('/dashboard');
      } else {
        alert('Google sign-in failed: ' + (response?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      alert('Google sign-in failed: ' + (err.response?.data?.message || err.message));
    }
  };

  React.useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn('Missing VITE_GOOGLE_CLIENT_ID. Google Sign-In will not render.');
      return;
    }

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleSignIn
      });

      buttonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: isSignup ? 'signup_with' : 'signin_with',
        shape: 'rectangular'
      });
    };

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      initializeGoogle();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    script.onerror = () => console.error('Failed to load Google Sign-In script');
    document.head.appendChild(script);
  }, [isSignup]);

  return (
    <div
      id="google_signin_button"
      ref={buttonRef}
      style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}
    >
      {/* Google button will be rendered here */}
    </div>
  );
};

export default GoogleSignIn;
