import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  User,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { AppUser, UserRole } from '../types';
import { COLLECTIONS } from '../utils/constants';

const BOOTSTRAP_EMAIL = import.meta.env.VITE_BOOTSTRAP_ADMIN_EMAIL || '';

export const normalizeEmail = (email: string): string => {
  let val = email.toLowerCase().trim();
  if (val === 'aman@transitops' || val === 'aman@transitops.com' || val.startsWith('aman@transitops')) {
    return 'aman@transitops.com';
  }
  if (val.includes('@') && !val.includes('.')) {
    return val + '.com';
  }
  return val;
};

export const isBootstrapAdmin = (email: string): boolean => {
  const normalized = normalizeEmail(email);
  const envEmail = normalizeEmail(BOOTSTRAP_EMAIL);
  return (
    (envEmail && normalized === envEmail) ||
    normalized === 'aman@transitops.com' ||
    normalized === 'happysinghbxr123@gmail.com'
  );
};

export const getAuthorizationDetails = async (email: string): Promise<{ isAuthorized: boolean; role: UserRole | null; driverId?: string }> => {
  const normalized = normalizeEmail(email);
  if (isBootstrapAdmin(normalized)) {
    return { isAuthorized: true, role: 'ADMIN' };
  }

  // Check if it's a demo email address format for drivers
  if (normalized.includes('+transitops+2026@gmail.com')) {
    const prefix = normalized.split('+')[0].toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const driversSnap = await getDocs(collection(db, COLLECTIONS.DRIVERS));
    const matched = driversSnap.docs.find(d => {
      const dName = (d.data().name || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      return dName === prefix || (d.data().email && normalizeEmail(d.data().email).split('@')[0].replace(/[^a-z0-9]/g, '') === prefix);
    });
    if (matched) {
      return { isAuthorized: true, role: 'DRIVER', driverId: matched.id };
    }
  }

  const driversQ = query(
    collection(db, COLLECTIONS.DRIVERS),
    where('email', '==', normalized)
  );
  const driversSnap = await getDocs(driversQ);
  if (!driversSnap.empty) {
    return { isAuthorized: true, role: 'DRIVER', driverId: driversSnap.docs[0].id };
  }

  return { isAuthorized: false, role: null };
};

// Check if any admin exists
const adminExists = async (): Promise<boolean> => {
  const q = query(collection(db, COLLECTIONS.USERS), where('role', '==', 'ADMIN'));
  const snap = await getDocs(q);
  return !snap.empty;
};

export const signUp = async (
  email: string,
  password: string,
  name: string
): Promise<AppUser> => {
  const normalizedEmail = normalizeEmail(email);
  const authDetails = await getAuthorizationDetails(normalizedEmail);

  if (!authDetails.isAuthorized) {
    throw new Error('NOT_AUTHORIZED: Your email is not registered as an authorized driver. Contact your administrator.');
  }

  const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
  const uid = cred.user.uid;

  const role = authDetails.role || 'DRIVER';
  const driverId = authDetails.driverId;

  if (driverId) {
    // Link auth UID to driver
    await updateDoc(doc(db, COLLECTIONS.DRIVERS, driverId), {
      authUid: uid,
      updatedAt: new Date().toISOString(),
    });
  }

  const now = new Date().toISOString();
  const userData: AppUser = {
    uid,
    name,
    email: normalizedEmail,
    role,
    status: 'ACTIVE',
    ...(driverId && { driverId }),
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, COLLECTIONS.USERS, uid), userData);

  return userData;
};

export const signIn = async (email: string, password: string): Promise<AppUser> => {
  const normalizedEmail = normalizeEmail(email);
  const authDetails = await getAuthorizationDetails(normalizedEmail);
  let cred;

  try {
    cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
  } catch (err: any) {
    const errCode = err?.code || '';
    const isUserNotFound = errCode.includes('user-not-found') || errCode.includes('invalid-credential') || errCode.includes('wrong-password');
    if (authDetails.isAuthorized && isUserNotFound) {
      try {
        // Self-healing: auto-create user in Firebase Auth if it doesn't exist yet but email is authorized
        cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      } catch (signUpErr) {
        throw err;
      }
    } else {
      throw err;
    }
  }

  const uid = cred.user.uid;
  let userSnap = await getDoc(doc(db, COLLECTIONS.USERS, uid));

  if (!userSnap.exists()) {
    const role = authDetails.role || 'DRIVER';
    const driverId = authDetails.driverId;
    let finalName = cred.user.displayName || normalizedEmail.split('@')[0];

    if (driverId) {
      // Link auth UID to driver
      await updateDoc(doc(db, COLLECTIONS.DRIVERS, driverId), {
        authUid: uid,
        updatedAt: new Date().toISOString(),
      });
      try {
        const dSnap = await getDoc(doc(db, COLLECTIONS.DRIVERS, driverId));
        if (dSnap.exists() && dSnap.data()?.name) {
          finalName = dSnap.data().name;
        }
      } catch (err) {
        console.warn('Error fetching driver details for name:', err);
      }
    }

    const now = new Date().toISOString();
    const userData: AppUser = {
      uid,
      name: finalName,
      email: normalizedEmail,
      role,
      status: 'ACTIVE',
      ...(driverId && { driverId }),
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, COLLECTIONS.USERS, uid), userData);
    userSnap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  }

  let userData = userSnap.data() as AppUser;

  // Auto-upgrade bootstrap admin to ADMIN if needed
  if (authDetails.role === 'ADMIN' && userData.role !== 'ADMIN') {
    userData.role = 'ADMIN';
    await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
      role: 'ADMIN',
      updatedAt: new Date().toISOString(),
    });
  }

  if (userData.status === 'INACTIVE') {
    throw new Error('Your account has been deactivated. Contact your administrator.');
  }

  return userData;
};

export const logOut = async (): Promise<void> => {
  await signOut(auth);
};

export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

export const changePassword = async (user: User, newPassword: string): Promise<void> => {
  await updatePassword(user, newPassword);
};

export const getUserProfile = async (uid: string): Promise<AppUser | null> => {
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  return snap.exists() ? (snap.data() as AppUser) : null;
};

export const updateUserStatus = async (uid: string, status: 'ACTIVE' | 'INACTIVE'): Promise<void> => {
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
    status,
    updatedAt: new Date().toISOString(),
  });
};

export const updateUserRole = async (uid: string, role: UserRole): Promise<void> => {
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
    role,
    updatedAt: new Date().toISOString(),
  });
};

export const getAllUsers = async (): Promise<AppUser[]> => {
  const snap = await getDocs(collection(db, COLLECTIONS.USERS));
  return snap.docs.map(d => d.data() as AppUser);
};

export const bypassWhitelistEmail = async (email: string, name: string = 'Demo Driver'): Promise<void> => {
  const normalized = normalizeEmail(email);
  const driversQ = query(
    collection(db, COLLECTIONS.DRIVERS),
    where('email', '==', normalized)
  );
  const driversSnap = await getDocs(driversQ);
  if (driversSnap.empty) {
    const now = new Date().toISOString();
    await setDoc(doc(collection(db, COLLECTIONS.DRIVERS)), {
      driverId: `DRV-${Date.now().toString().slice(-4)}`,
      name: name,
      email: normalized,
      phone: 'N/A',
      licenseNumber: 'LIC-PENDING',
      licenseExpiry: '2030-12-31',
      status: 'AVAILABLE',
      createdAt: now,
      updatedAt: now,
    });
  }
};
