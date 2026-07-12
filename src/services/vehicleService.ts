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
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Vehicle, VehicleStatus } from '../types';
import { COLLECTIONS } from '../utils/constants';
import { logActivity } from './activityService';

export const subscribeToVehicles = (
  callback: (vehicles: Vehicle[]) => void
): Unsubscribe => {
  const q = query(collection(db, COLLECTIONS.VEHICLES), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const vehicles: Vehicle[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Vehicle));
    callback(vehicles);
  });
};

export const subscribeToVehicle = (
  vehicleId: string,
  callback: (v: Vehicle | null) => void
): Unsubscribe => {
  return onSnapshot(doc(db, COLLECTIONS.VEHICLES, vehicleId), (snap) => {
    callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as Vehicle) : null);
  });
};

export const getVehicleById = async (id: string): Promise<Vehicle | null> => {
  const snap = await getDoc(doc(db, COLLECTIONS.VEHICLES, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Vehicle) : null;
};

export const getAllVehicles = async (): Promise<Vehicle[]> => {
  const snap = await getDocs(collection(db, COLLECTIONS.VEHICLES));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Vehicle));
};

export const addVehicle = async (
  vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>,
  byUserId: string,
  byUserName: string
): Promise<string> => {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, COLLECTIONS.VEHICLES), {
    ...vehicleData,
    createdAt: now,
    updatedAt: now,
  });
  await logActivity(byUserId, byUserName, 'CREATE', 'vehicle', ref.id, `Created vehicle: ${vehicleData.registrationNumber}`);
  return ref.id;
};

export const updateVehicle = async (
  id: string,
  data: Partial<Vehicle>,
  byUserId: string,
  byUserName: string
): Promise<void> => {
  await updateDoc(doc(db, COLLECTIONS.VEHICLES, id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
  await logActivity(byUserId, byUserName, 'UPDATE', 'vehicle', id, `Updated vehicle`);
};

export const updateVehicleStatus = async (
  vehicleId: string,
  status: VehicleStatus,
  byUserId: string,
  byUserName: string
): Promise<void> => {
  await updateDoc(doc(db, COLLECTIONS.VEHICLES, vehicleId), {
    status,
    updatedAt: new Date().toISOString(),
  });
  await logActivity(byUserId, byUserName, 'STATUS_CHANGE', 'vehicle', vehicleId, `Vehicle status → ${status}`);
};

export const deleteVehicle = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.VEHICLES, id));
};

export const bulkUpsertVehicles = async (
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
      const q = query(
        collection(db, COLLECTIONS.VEHICLES),
        where('registrationNumber', '==', row.registrationNumber)
      );
      const existing = await getDocs(q);

      const vehicleData: Omit<Vehicle, 'id'> = {
        registrationNumber: row.registrationNumber || '',
        model: row.model || '',
        manufacturer: row.manufacturer || '',
        type: (row.type as any) || 'OTHER',
        maxCapacityKg: parseFloat(row.maxCapacityKg) || 0,
        odometerKm: parseFloat(row.odometerKm) || 0,
        acquisitionDate: row.acquisitionDate || undefined,
        acquisitionCost: row.acquisitionCost ? parseFloat(row.acquisitionCost) : undefined,
        status: (row.status as VehicleStatus) || 'AVAILABLE',
        createdAt: now,
        updatedAt: now,
      };

      if (!existing.empty) {
        batch.update(doc(db, COLLECTIONS.VEHICLES, existing.docs[0].id), {
          ...vehicleData,
          updatedAt: now,
        });
      } else {
        const newRef = doc(collection(db, COLLECTIONS.VEHICLES));
        batch.set(newRef, vehicleData);
      }
      success++;
    } catch (error) {
      console.error("Vehicle import failed for row:", row, error);
      failed++;
    }
  }

  await batch.commit();
  await logActivity(byUserId, byUserName, 'IMPORT', 'vehicle', 'bulk', `Imported ${success} vehicles`);
  return { success, failed };
};
