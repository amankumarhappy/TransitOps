import { collection, addDoc, getDocs, onSnapshot, query, orderBy, Unsubscribe } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Expense } from '../types';
import { COLLECTIONS } from '../utils/constants';

export const subscribeToExpenses = (callback: (expenses: Expense[]) => void): Unsubscribe => {
  const q = query(collection(db, COLLECTIONS.EXPENSES), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense)));
  });
};

export const addExpense = async (data: Omit<Expense, 'id' | 'createdAt'>): Promise<string> => {
  const ref = await addDoc(collection(db, COLLECTIONS.EXPENSES), {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
};
