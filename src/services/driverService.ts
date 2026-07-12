import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Unsubscribe,
  writeBatch,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Driver, DriverStatus } from '../types';
import { COLLECTIONS } from '../utils/constants';
import { logActivity } from './activityService';
import { createNotification } from './notificationService';

// ---- Real-time listener ----
export const subscribeToDrivers = (
  callback: (drivers: Driver[]) => void
): Unsubscribe => {
  const q = query(collection(db, COLLECTIONS.DRIVERS), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const drivers: Driver[] = snap.docs.map(d => {
      const data = d.data();
      const namePart = (data.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const email = `${namePart}+transitops+2026@gmail.com`;
      return { id: d.id, ...data, email } as Driver;
    });
    callback(drivers);
  });
};

export const subscribeToDriver = (
  driverId: string,
  callback: (driver: Driver | null) => void
): Unsubscribe => {
  return onSnapshot(doc(db, COLLECTIONS.DRIVERS, driverId), (snap) => {
    if (!snap.exists()) {
      callback(null);
    } else {
      const data = snap.data();
      const namePart = (data.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const email = `${namePart}+transitops+2026@gmail.com`;
      callback({ id: snap.id, ...data, email } as Driver);
    }
  });
};

export const subscribeToDriverByUid = (
  uid: string,
  callback: (driver: Driver | null) => void,
  email?: string | null
): Unsubscribe => {
  const q = query(collection(db, COLLECTIONS.DRIVERS));
  return onSnapshot(q, (snap) => {
    if (snap.empty) {
      callback(null);
      return;
    }

    // 1. Try matching by exact authUid
    let matchedDoc = snap.docs.find(d => d.data().authUid === uid);

    // 2. Fallback to matching by email (stored or derived)
    if (!matchedDoc && email) {
      const targetEmail = email.toLowerCase().trim();
      matchedDoc = snap.docs.find(d => {
        const data = d.data();
        const storedEmail = (data.email || '').toLowerCase().trim();
        const namePart = (data.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const derivedEmail = `${namePart}+transitops+2026@gmail.com`;
        return storedEmail === targetEmail || derivedEmail === targetEmail;
      });
    }

    // 3. Fallback: match by name part from mock driver login
    if (!matchedDoc && uid.startsWith('mock-uid-')) {
      const namePartFromEmail = email ? email.split('+')[0].toLowerCase().replace(/[^a-z0-9]/g, '') : '';
      if (namePartFromEmail) {
        matchedDoc = snap.docs.find(d => {
          const data = d.data();
          const namePart = (data.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          return namePart === namePartFromEmail;
        });
      }
    }

    if (matchedDoc) {
      const data = matchedDoc.data();
      const namePart = (data.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const emailVal = data.email || `${namePart}+transitops+2026@gmail.com`;
      callback({ id: matchedDoc.id, ...data, email: emailVal } as Driver);
    } else {
      callback(null);
    }
  });
};

// ---- One-time reads ----
export const getDriverById = async (id: string): Promise<Driver | null> => {
  const snap = await getDoc(doc(db, COLLECTIONS.DRIVERS, id));
  if (!snap.exists()) return null;
  const data = snap.data();
  const namePart = (data.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const email = `${namePart}+transitops+2026@gmail.com`;
  return { id: snap.id, ...data, email } as Driver;
};

export const getAllDrivers = async (): Promise<Driver[]> => {
  const snap = await getDocs(collection(db, COLLECTIONS.DRIVERS));
  return snap.docs.map(d => {
    const data = d.data();
    const namePart = (data.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const email = `${namePart}+transitops+2026@gmail.com`;
    return { id: d.id, ...data, email } as Driver;
  });
};

// ---- CRUD ----
export const addDriver = async (
  driverData: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>,
  byUserId: string,
  byUserName: string
): Promise<string> => {
  const now = new Date().toISOString();
  const namePart = (driverData.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const email = `${namePart}+transitops+2026@gmail.com`;
  const ref = await addDoc(collection(db, COLLECTIONS.DRIVERS), {
    ...driverData,
    email,
    createdAt: now,
    updatedAt: now,
  });
  await logActivity(byUserId, byUserName, 'CREATE', 'driver', ref.id, `Created driver: ${driverData.name}`);
  return ref.id;
};

export const updateDriver = async (
  id: string,
  data: Partial<Driver>,
  byUserId: string,
  byUserName: string
): Promise<void> => {
  const updateData = { ...data };
  if (data.name) {
    const namePart = data.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    updateData.email = `${namePart}+transitops+2026@gmail.com`;
  }
  await updateDoc(doc(db, COLLECTIONS.DRIVERS, id), {
    ...updateData,
    updatedAt: new Date().toISOString(),
  });
  await logActivity(byUserId, byUserName, 'UPDATE', 'driver', id, `Updated driver`);
};

export const updateDriverStatus = async (
  driverId: string,
  status: DriverStatus,
  byUserId: string,
  byUserName: string
): Promise<void> => {
  await updateDoc(doc(db, COLLECTIONS.DRIVERS, driverId), {
    status,
    updatedAt: new Date().toISOString(),
  });
  await logActivity(byUserId, byUserName, 'STATUS_CHANGE', 'driver', driverId, `Driver status → ${status}`);
};

export const deleteDriver = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.DRIVERS, id));
};

// ---- Bulk import ----
export const bulkUpsertDrivers = async (
  rows: Record<string, string>[],
  byUserId: string,
  byUserName: string
): Promise<{ success: number; failed: number }> => {
  const batch = writeBatch(db);
  let success = 0;
  let failed = 0;
  const now = new Date().toISOString();

  for (const row of rows) {
    try {
      // Check if license number exists
      const q = query(
        collection(db, COLLECTIONS.DRIVERS),
        where('licenseNumber', '==', row.license_number)
      );
      const existing = await getDocs(q);

      const dName = row.driver_name || '';
      const namePart = dName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const email = `${namePart}+transitops+2026@gmail.com`;

      const driverData: Omit<Driver, 'id'> = {
        driverId: row.driver_id || '',
        name: dName,
        email,
        phone: row.phone_number || '',
        age: row.age ? parseInt(row.age) : undefined,
        gender: row.gender || undefined,
        city: row.city || undefined,
        licenseNumber: row.license_number || '',
        licenseExpiry: row.license_expiry || '',
        experienceYears: row.experience_years ? parseInt(row.experience_years) : undefined,
        status: (row.status as DriverStatus) || 'AVAILABLE',
        createdAt: now,
        updatedAt: now,
      };

      if (!existing.empty) {
        // Update existing
        batch.update(doc(db, COLLECTIONS.DRIVERS, existing.docs[0].id), {
          ...driverData,
          updatedAt: now,
        });
      } else {
        // Add new
        const newRef = doc(collection(db, COLLECTIONS.DRIVERS));
        batch.set(newRef, driverData);
      }
      success++;
    } catch (error) {
      console.error("Driver import failed for row:", row, error);
      failed++;
    }
  }

  await batch.commit();
  await logActivity(byUserId, byUserName, 'IMPORT', 'driver', 'bulk', `Imported ${success} drivers`);
  return { success, failed };
};
