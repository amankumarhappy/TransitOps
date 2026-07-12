import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, orderBy, Unsubscribe, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Notification, NotificationType } from '../types';
import { COLLECTIONS } from '../utils/constants';

export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
  });
};

export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: NotificationType = 'INFO'
): Promise<void> => {
  await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
    userId,
    title,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString(),
  });
};

export const markNotificationRead = async (notificationId: string): Promise<void> => {
  await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), { read: true });
};

export const markAllRead = async (userId: string): Promise<void> => {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('userId', '==', userId),
    where('read', '==', false)
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.update(d.ref, { read: true }));
  await batch.commit();
};
