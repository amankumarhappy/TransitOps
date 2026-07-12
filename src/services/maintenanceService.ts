import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  Unsubscribe,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Maintenance, MaintenanceStatus } from '../types';
import { COLLECTIONS } from '../utils/constants';
import { logActivity } from './activityService';

export const subscribeToMaintenance = (
  callback: (records: Maintenance[]) => void
): Unsubscribe => {
  const q = query(collection(db, COLLECTIONS.MAINTENANCE), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Maintenance)));
  });
};

export const createMaintenance = async (
  data: Omit<Maintenance, 'id' | 'createdAt' | 'updatedAt'>,
  byUserId: string,
  byUserName: string
): Promise<string> => {
  await runTransaction(db, async (transaction) => {
    const vehicleRef = doc(db, COLLECTIONS.VEHICLES, data.vehicleId);
    const vehicleSnap = await transaction.get(vehicleRef);
    if (!vehicleSnap.exists()) throw new Error('Vehicle not found');

    const now = new Date().toISOString();
    const newRef = doc(collection(db, COLLECTIONS.MAINTENANCE));
    transaction.set(newRef, { ...data, status: 'ACTIVE', createdAt: now, updatedAt: now });
    transaction.update(vehicleRef, { status: 'IN_SHOP', updatedAt: now });
  });

  const ref = await addDoc(collection(db, COLLECTIONS.MAINTENANCE), {});
  await logActivity(byUserId, byUserName, 'CREATE', 'maintenance', ref.id, `Maintenance started for ${data.vehicleRegistration}`);
  return ref.id;
};

// Simpler version using two separate writes (transaction above may have ref issue)
export const startMaintenance = async (
  data: Omit<Maintenance, 'id' | 'createdAt' | 'updatedAt'>,
  byUserId: string,
  byUserName: string
): Promise<string> => {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, COLLECTIONS.MAINTENANCE), {
    ...data,
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  });
  // Set vehicle to IN_SHOP
  await updateDoc(doc(db, COLLECTIONS.VEHICLES, data.vehicleId), {
    status: 'IN_SHOP',
    updatedAt: now,
  });
  await logActivity(byUserId, byUserName, 'MAINTENANCE_START', 'vehicle', data.vehicleId, `Maintenance started: ${data.type}`);
  return ref.id;
};

export const completeMaintenance = async (
  maintenanceId: string,
  vehicleId: string,
  byUserId: string,
  byUserName: string
): Promise<void> => {
  const now = new Date().toISOString();
  await updateDoc(doc(db, COLLECTIONS.MAINTENANCE, maintenanceId), {
    status: 'COMPLETED',
    completedDate: now,
    updatedAt: now,
  });

  // Check if any other active maintenance for this vehicle
  const q = query(
    collection(db, COLLECTIONS.MAINTENANCE),
    where('vehicleId', '==', vehicleId),
    where('status', '==', 'ACTIVE')
  );
  const snap = await getDocs(q);
  if (snap.empty) {
    await updateDoc(doc(db, COLLECTIONS.VEHICLES, vehicleId), {
      status: 'AVAILABLE',
      updatedAt: now,
    });
  }
  await logActivity(byUserId, byUserName, 'MAINTENANCE_COMPLETE', 'vehicle', vehicleId, `Maintenance completed`);
};

export const cancelMaintenance = async (
  maintenanceId: string,
  vehicleId: string
): Promise<void> => {
  const now = new Date().toISOString();
  await updateDoc(doc(db, COLLECTIONS.MAINTENANCE, maintenanceId), {
    status: 'CANCELLED',
    updatedAt: now,
  });
  const q = query(
    collection(db, COLLECTIONS.MAINTENANCE),
    where('vehicleId', '==', vehicleId),
    where('status', '==', 'ACTIVE')
  );
  const snap = await getDocs(q);
  if (snap.empty) {
    await updateDoc(doc(db, COLLECTIONS.VEHICLES, vehicleId), {
      status: 'AVAILABLE',
      updatedAt: now,
    });
  }
};
