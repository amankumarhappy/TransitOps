import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInAnonymously } from 'firebase/auth';
import { auth } from '../config/firebase';
import { AppUser, UserRole } from '../types';
import { getUserProfile } from '../services/authService';

interface AuthContextType {
  currentUser: any | null;
  userProfile: AppUser | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  loginAsMock: (email: string, role: UserRole, name: string) => void;
  logoutMock: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  refreshProfile: async () => {},
  loginAsMock: () => {},
  logoutMock: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const mockData = localStorage.getItem('transitops_mock_user');
    if (mockData) {
      try {
        const parsed = JSON.parse(mockData);
        setCurrentUser(parsed.user);
        setUserProfile(parsed.profile);
        return;
      } catch (e) {
        // ignore
      }
    }

    if (currentUser && currentUser.uid !== 'mock-uid') {
      const profile = await getUserProfile(currentUser.uid);
      setUserProfile(profile);
    }
  };

  const loginAsMock = (email: string, role: UserRole, name: string) => {
    const mockUserObj = {
      uid: 'mock-uid-' + role.toLowerCase(),
      email: email,
      displayName: name,
      emailVerified: true,
    };
    const mockProfileObj: AppUser = {
      uid: 'mock-uid-' + role.toLowerCase(),
      name: name,
      email: email,
      role: role,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const data = { user: mockUserObj, profile: mockProfileObj };
    localStorage.setItem('transitops_mock_user', JSON.stringify(data));
    setCurrentUser(mockUserObj);
    setUserProfile(mockProfileObj);
    
    // Sign in anonymously to give Firestore an authenticated request.auth session
    if (auth) {
      signInAnonymously(auth).catch(err => {
        console.warn('Anonymous sign in for mock user failed:', err);
      });
    }
  };

  const logoutMock = () => {
    localStorage.removeItem('transitops_mock_user');
    setCurrentUser(null);
    setUserProfile(null);
    if (auth) {
      auth.signOut().catch(() => {});
    }
  };

  useEffect(() => {
    const mockData = localStorage.getItem('transitops_mock_user');
    if (mockData) {
      try {
        const parsed = JSON.parse(mockData);
        setCurrentUser(parsed.user);
        setUserProfile(parsed.profile);
        setLoading(false);
        
        // Ensure standard Firebase Auth gets signed in anonymously if not already signed in
        if (auth && !auth.currentUser) {
          signInAnonymously(auth).catch(err => {
            console.warn('Anonymous sign in for mock user on load failed:', err);
          });
        }
        return;
      } catch (e) {
        localStorage.removeItem('transitops_mock_user');
      }
    }

    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (user) => {
      // If we have a mock user, let it override
      const currentMock = localStorage.getItem('transitops_mock_user');
      if (currentMock) {
        setLoading(false);
        return;
      }

      setCurrentUser(user);
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch {
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, refreshProfile, loginAsMock, logoutMock }}>
      {children}
    </AuthContext.Provider>
  );
};
