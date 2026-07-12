import { collection, addDoc, getDocs, onSnapshot, query, orderBy, Unsubscribe } from 'firebase/firestore';
import { db } from '../config/firebase';
import { FuelLog } from '../types';
import { COLLECTIONS } from '../utils/constants';

export const subscribeToFuelLogs = (callback: (logs: FuelLog[]) => void): Unsubscribe => {
  const q = query(collection(db, COLLECTIONS.FUEL_LOGS), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as FuelLog)));
  });
};

export const addFuelLog = async (data: Omit<FuelLog, 'id' | 'createdAt'>): Promise<string> => {
  const ref = await addDoc(collection(db, COLLECTIONS.FUEL_LOGS), {
    ...data,
    totalCost: data.liters * data.costPerLiter,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
};
