import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
  Auth,
  UserCredential
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase for client side only
let app: any | undefined;
let auth: any | undefined;
let googleProvider: any | undefined;

if (typeof window !== 'undefined') {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    
    // Add an auth state change listener for debugging
    auth.onAuthStateChanged((user: any) => {
      console.log('Auth state changed:', user ? 'User signed in' : 'User signed out');
      if (user) {
        console.log('User email:', user.email);
      }
    });
  } catch (error) {
    console.error('Firebase client initialization error', error);
  }
}

interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
  redirectUrl?: string;
  message?: string;
  data?: any;
}

export const signInWithGoogle = async (): Promise<AuthResult> => {
  if (typeof window === 'undefined') {
    return { success: false, error: 'This function can only be called on the client side' };
  }

  if (!auth || !googleProvider) {
    console.error('Firebase auth not initialized');
    return { success: false, error: 'Authentication service is not available' };
  }

  try {
    console.log('Starting Google sign in...');
    
    // Add a small delay to ensure the popup isn't blocked
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Open a blank popup to check if popups are allowed
    const popupCheck = window.open('', '_blank');
    if (!popupCheck || popupCheck.closed || typeof popupCheck.closed === 'undefined') {
      return { 
        success: false, 
        error: 'Please allow popups for this site to sign in with Google' 
      };
    }
    popupCheck.close();

    try {
      console.log('Calling signInWithPopup...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Sign in successful, user:', result.user?.email);
      
      const user = result.user;
      if (!user) {
        throw new Error('No user returned from sign in');
      }
      
      // Send the ID token to your backend for verification and session creation
      console.log('Getting ID token...');
      const idToken = await user.getIdToken();
      
      console.log('Sending token to backend...');
      const response = await fetch('/api/auth/firebase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: idToken }),
        credentials: 'include' // Important for sending cookies
      });

      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      try {
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
          console.log('Firebase auth response:', data);
        } else {
          // If not JSON, read as text to see what we got
          const text = await response.text();
          console.error('Non-JSON response from server:', text);
          throw new Error('Server returned an invalid response. Please try again.');
        }

        if (!response.ok || data.status !== 'success') {
          throw new Error(data.message || 'Authentication failed');
        }
      } catch (error) {
        console.error('Error parsing response:', error);
        throw new Error('Failed to process authentication response. Please try again.');
      }

      return { 
        success: true, 
        user: data.data,
        message: data.message 
      };
      
    } catch (popupError) {
      console.error('Popup error:', popupError);
      throw popupError;
    }
    
  } catch (error) {
    console.error('Google sign in error:', error);
    
    let errorMessage = 'Failed to sign in with Google';
    if (error instanceof Error) {
      if (error.message.includes('popup-closed-by-user')) {
        errorMessage = 'Sign in was cancelled';
      } else if (error.message.includes('popup-blocked')) {
        errorMessage = 'Popup was blocked. Please allow popups for this site.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return { 
      success: false, 
      error: errorMessage
    };
  }
};

export const signOut = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    // Ensure auth is initialized
    if (typeof window === 'undefined' || !auth) {
      throw new Error('Firebase Auth not initialized');
    }
    
    // Sign out from Firebase
    await firebaseSignOut(auth);
    
    // Also call your backend to clear the session
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.warn('Failed to clear server session:', e);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to sign out' 
    };
  }
};

// Initialize auth state listener for debugging
if (typeof window !== 'undefined' && auth) {
  import('firebase/auth').then(({ onAuthStateChanged }) => {
    // We've already checked that auth exists in the if condition
    onAuthStateChanged(auth!, (user: any) => {
      if (user) {
        console.log('Auth state: User is signed in', user.email);
      } else {
        console.log('Auth state: No user signed in');
      }
    });
  });
}

export { auth, googleProvider };

