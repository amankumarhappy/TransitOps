import { collection, addDoc, getDocs, onSnapshot, query, orderBy, Unsubscribe } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ActivityLog } from '../types';
import { COLLECTIONS } from '../utils/constants';

export const subscribeToActivityLogs = (
  callback: (logs: ActivityLog[]) => void
): Unsubscribe => {
  const q = query(collection(db, COLLECTIONS.ACTIVITY_LOGS), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as ActivityLog)));
  });
};

export const logActivity = async (
  userId: string,
  userName: string,
  action: string,
  entityType: string,
  entityId: string,
  description: string
): Promise<void> => {
  try {
    await addDoc(collection(db, COLLECTIONS.ACTIVITY_LOGS), {
      userId,
      userName,
      action,
      entityType,
      entityId,
      description,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // Non-critical — don't throw if activity logging fails
  }
};
