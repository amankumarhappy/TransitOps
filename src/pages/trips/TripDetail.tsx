import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  subscribeToTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip
} from '../../services/tripService';
import { Trip } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ArrowLeft, Play, CheckCircle2, XCircle, Route, Info } from 'lucide-react';

export const TripDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToTrip(id, (t: Trip | null) => {
      setTrip(t);
      setLoading(false);
    });
    return unsub;
  }, [id]);

  const handleDispatch = async () => {
    if (!id || !currentUser) return;
    setActionLoading(true);
    try {
      await dispatchTrip(id, currentUser.uid, userProfile?.name || 'Dispatcher');
      success('Dispatched!', 'The trip status has been set to DISPATCHED. Vehicle and driver status updated.');
    } catch (err: any) {
      showError('Dispatch Failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!id || !currentUser) return;
    setActionLoading(true);
    try {
      await completeTrip(id, undefined, currentUser.uid, userProfile?.name || 'Dispatcher');
      success('Completed!', 'The trip status has been set to COMPLETED. Assets are now available.');
    } catch (err: any) {
      showError('Completion Failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id || !currentUser) return;
    if (!window.confirm('Are you sure you want to cancel this trip?')) return;
    setActionLoading(true);
    try {
      await cancelTrip(id, currentUser.uid, userProfile?.name || 'Dispatcher');
      success('Cancelled', 'The trip has been cancelled. Assets have been released.');
    } catch (err: any) {
      showError('Cancellation Failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-6 text-center max-w-md mx-auto">
        <Route className="w-12 h-12 text-amber-500 mx-auto mb-2" />
        <h2 className="font-bold text-lg">Trip Not Found</h2>
        <p className="text-xs mt-1">The requested trip could not be found in operations records.</p>
        <button onClick={() => navigate('/trips')} className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors">
          Go back to trips
        </button>
      </div>
    );
  }

  const role = userProfile?.role;
  const isDispatcherOrAdmin = role === 'ADMIN' || role === 'DISPATCHER';

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in pb-10">
      <button
        onClick={() => navigate('/trips')}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Trips
      </button>

      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                TRIP ID: {trip.tripCode}
              </span>
              <StatusBadge status={trip.status} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mt-2">
              {trip.source} → {trip.destination}
            </h1>
            <p className="text-xs text-gray-400 mt-1">Cargo description: {trip.cargoDescription || 'No description'}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
            <Route className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        {/* Detailed Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase">Assigned Vehicle</p>
            <p className="font-bold text-gray-800 text-sm mt-0.5 font-mono">{trip.vehicleRegistration}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase">Assigned Operator</p>
            <p className="font-bold text-gray-800 text-sm mt-0.5">{trip.driverName}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase">Cargo Weight</p>
            <p className="font-bold text-gray-800 text-sm mt-0.5">{trip.cargoWeightKg.toLocaleString()} kg</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase">Planned Distance</p>
            <p className="font-bold text-gray-800 text-sm mt-0.5">{trip.plannedDistanceKm ? `${trip.plannedDistanceKm.toLocaleString()} km` : '—'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase">Scheduled Departure</p>
            <p className="font-bold text-gray-800 text-sm mt-0.5">
              {trip.scheduledDeparture ? new Date(trip.scheduledDeparture).toLocaleString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase">Actual Departure</p>
            <p className="font-bold text-gray-800 text-sm mt-0.5">
              {trip.dispatchedAt ? new Date(trip.dispatchedAt).toLocaleString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase">Actual Arrival</p>
            <p className="font-bold text-gray-800 text-sm mt-0.5">
              {trip.completedAt ? new Date(trip.completedAt).toLocaleString() : '—'}
            </p>
          </div>
        </div>

        {/* Action Controls for Dispatcher / Admin */}
        {isDispatcherOrAdmin && (
          <div className="border-t border-gray-100 pt-6 mt-6">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-4">Operations Dispatch Controls</h3>
            
            {actionLoading ? (
              <div className="flex justify-center py-2">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {trip.status === 'DRAFT' && (
                  <>
                    <button
                      onClick={handleDispatch}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/10"
                    >
                      <Play className="w-4 h-4" />
                      Dispatch Trip
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel Trip
                    </button>
                  </>
                )}

                {trip.status === 'DISPATCHED' && (
                  <>
                    <button
                      onClick={handleComplete}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-green-600/10"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Complete Trip
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel Trip
                    </button>
                  </>
                )}

                {trip.status === 'COMPLETED' && (
                  <p className="text-xs text-green-600 font-bold flex items-center gap-1.5 bg-green-50 border border-green-100 px-3.5 py-2 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                    Trip Completed and verified. Assets returned to pool.
                  </p>
                )}

                {trip.status === 'CANCELLED' && (
                  <p className="text-xs text-red-600 font-bold flex items-center gap-1.5 bg-red-50 border border-red-100 px-3.5 py-2 rounded-xl">
                    <XCircle className="w-4 h-4" />
                    Trip Cancelled. Assets released back to availability pools.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
