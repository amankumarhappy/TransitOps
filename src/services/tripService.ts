import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Unsubscribe,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Trip, TripStatus } from '../types';
import { COLLECTIONS } from '../utils/constants';
import { logActivity } from './activityService';
import { createNotification } from './notificationService';
import { generateTripCode } from '../utils/calculations';

export const subscribeToTrips = (
  callback: (trips: Trip[]) => void
): Unsubscribe => {
  const q = query(collection(db, COLLECTIONS.TRIPS), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const trips: Trip[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Trip));
    callback(trips);
  });
};

export const subscribeToDriverTrips = (
  driverId: string,
  callback: (trips: Trip[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, COLLECTIONS.TRIPS),
    where('driverId', '==', driverId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Trip)));
  });
};

export const getTripById = async (id: string): Promise<Trip | null> => {
  const snap = await getDoc(doc(db, COLLECTIONS.TRIPS, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Trip) : null;
};

export const createTrip = async (
  tripData: Omit<Trip, 'id' | 'tripCode' | 'status' | 'createdAt' | 'updatedAt'>,
  byUserId: string,
  byUserName: string
): Promise<string> => {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, COLLECTIONS.TRIPS), {
    ...tripData,
    tripCode: generateTripCode(),
    status: 'DRAFT',
    createdAt: now,
    updatedAt: now,
  });
  await logActivity(byUserId, byUserName, 'CREATE', 'trip', ref.id, `Created trip: ${tripData.source} → ${tripData.destination}`);
  return ref.id;
};

// Atomic dispatch: updates trip + vehicle + driver in one transaction
export const dispatchTrip = async (
  tripId: string,
  byUserId: string,
  byUserName: string
): Promise<void> => {
  await runTransaction(db, async (transaction) => {
    const tripRef = doc(db, COLLECTIONS.TRIPS, tripId);
    const tripSnap = await transaction.get(tripRef);
    if (!tripSnap.exists()) throw new Error('Trip not found');
    const trip = tripSnap.data() as Trip;

    if (trip.status !== 'DRAFT') throw new Error('Only DRAFT trips can be dispatched');

    const vehicleRef = doc(db, COLLECTIONS.VEHICLES, trip.vehicleId);
    const vehicleSnap = await transaction.get(vehicleRef);
    if (!vehicleSnap.exists()) throw new Error('Vehicle not found');
    const vehicle = vehicleSnap.data();
    if (vehicle.status !== 'AVAILABLE') throw new Error(`Vehicle is ${vehicle.status} — cannot dispatch`);

    const driverRef = doc(db, COLLECTIONS.DRIVERS, trip.driverId);
    const driverSnap = await transaction.get(driverRef);
    if (!driverSnap.exists()) throw new Error('Driver not found');
    const driver = driverSnap.data();
    if (driver.status !== 'AVAILABLE') throw new Error(`Driver is ${driver.status} — cannot dispatch`);

    const now = new Date().toISOString();

    transaction.update(tripRef, { status: 'DISPATCHED', dispatchedAt: now, updatedAt: now });
    transaction.update(vehicleRef, { status: 'ON_TRIP', currentTripId: tripId, updatedAt: now });
    transaction.update(driverRef, { status: 'ON_TRIP', currentTripId: tripId, updatedAt: now });
  });

  await logActivity(byUserId, byUserName, 'DISPATCH', 'trip', tripId, `Trip dispatched`);

  // Notify the driver
  const tripSnap = await getDoc(doc(db, COLLECTIONS.TRIPS, tripId));
  if (tripSnap.exists()) {
    const trip = tripSnap.data() as Trip;
    const driversQ = query(collection(db, COLLECTIONS.DRIVERS), where('__name__', '==', trip.driverId));
    const driverSnap = await getDocs(driversQ);
    if (!driverSnap.empty) {
      const driver = driverSnap.docs[0].data();
      if (driver.authUid) {
        await createNotification(driver.authUid, 'Trip Dispatched', `Your trip to ${trip.destination} has been dispatched.`, 'INFO');
      }
    }
  }
};

// Atomic complete: updates trip + vehicle + driver in one transaction
export const completeTrip = async (
  tripId: string,
  actualDistanceKm: number | undefined,
  byUserId: string,
  byUserName: string
): Promise<void> => {
  await runTransaction(db, async (transaction) => {
    const tripRef = doc(db, COLLECTIONS.TRIPS, tripId);
    const tripSnap = await transaction.get(tripRef);
    if (!tripSnap.exists()) throw new Error('Trip not found');
    const trip = tripSnap.data() as Trip;

    if (trip.status !== 'DISPATCHED') throw new Error('Only DISPATCHED trips can be completed');

    const now = new Date().toISOString();

    transaction.update(tripRef, {
      status: 'COMPLETED',
      completedAt: now,
      ...(actualDistanceKm && { actualDistanceKm }),
      updatedAt: now,
    });
    transaction.update(doc(db, COLLECTIONS.VEHICLES, trip.vehicleId), {
      status: 'AVAILABLE',
      currentTripId: null,
      updatedAt: now,
    });
    transaction.update(doc(db, COLLECTIONS.DRIVERS, trip.driverId), {
      status: 'AVAILABLE',
      currentTripId: null,
      updatedAt: now,
    });
  });

  await logActivity(byUserId, byUserName, 'COMPLETE', 'trip', tripId, `Trip completed`);
};

export const cancelTrip = async (
  tripId: string,
  byUserId: string,
  byUserName: string
): Promise<void> => {
  await runTransaction(db, async (transaction) => {
    const tripRef = doc(db, COLLECTIONS.TRIPS, tripId);
    const tripSnap = await transaction.get(tripRef);
    if (!tripSnap.exists()) throw new Error('Trip not found');
    const trip = tripSnap.data() as Trip;

    const now = new Date().toISOString();
    transaction.update(tripRef, { status: 'CANCELLED', updatedAt: now });

    // If dispatched, release vehicle and driver
    if (trip.status === 'DISPATCHED') {
      transaction.update(doc(db, COLLECTIONS.VEHICLES, trip.vehicleId), {
        status: 'AVAILABLE', currentTripId: null, updatedAt: now,
      });
      transaction.update(doc(db, COLLECTIONS.DRIVERS, trip.driverId), {
        status: 'AVAILABLE', currentTripId: null, updatedAt: now,
      });
    }
  });

  await logActivity(byUserId, byUserName, 'CANCEL', 'trip', tripId, `Trip cancelled`);
};

export const subscribeToTrip = (
  id: string,
  callback: (trip: Trip | null) => void
): Unsubscribe => {
  return onSnapshot(doc(db, COLLECTIONS.TRIPS, id), (snap) => {
    callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as Trip) : null);
  });
};
