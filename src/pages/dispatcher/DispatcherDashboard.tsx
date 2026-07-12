import React, { useEffect, useState } from 'react';
import { subscribeToVehicles } from '../../services/vehicleService';
import { subscribeToDrivers } from '../../services/driverService';
import { subscribeToTrips } from '../../services/tripService';
import { Vehicle, Driver, Trip } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Route, CheckCircle, Truck, Users, Plus, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DispatcherDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs = [
      subscribeToVehicles(v => { setVehicles(v); setLoading(false); }),
      subscribeToDrivers(setDrivers),
      subscribeToTrips(setTrips),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE').length;
  const availableDrivers = drivers.filter(d => d.status === 'AVAILABLE').length;
  const activeTrips = trips.filter(t => t.status === 'DISPATCHED');
  const draftTrips = trips.filter(t => t.status === 'DRAFT');

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Dispatcher Control Center</h1>
          <p className="text-gray-500 text-sm mt-0.5">Real-time load planning, asset matching, and route dispatches</p>
        </div>
        <Link
          to="/trips/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 text-sm"
        >
          <Plus className="w-4 h-4" />
          Plan & Dispatch Cargo
        </Link>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="w-9 h-9 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-3">
            <Truck className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-gray-900">{availableVehicles}</p>
          <p className="text-xs text-gray-500 font-bold mt-0.5 uppercase tracking-wider">Available Trucks</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="w-9 h-9 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-gray-900">{availableDrivers}</p>
          <p className="text-xs text-gray-500 font-bold mt-0.5 uppercase tracking-wider">Available Drivers</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3">
            <Route className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-gray-900">{activeTrips.length}</p>
          <p className="text-xs text-gray-500 font-bold mt-0.5 uppercase tracking-wider">Dispatched Active</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="w-9 h-9 bg-gray-50 text-gray-600 rounded-xl flex items-center justify-center mb-3">
            <Plus className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-gray-900">{draftTrips.length}</p>
          <p className="text-xs text-gray-500 font-bold mt-0.5 uppercase tracking-wider">Draft Plans</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dispatched / Active */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="text-lg font-black text-gray-900">Active Cargo on Transit ({activeTrips.length})</h2>
          {activeTrips.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No active dispatches at the moment.</p>
          ) : (
            <div className="space-y-3">
              {activeTrips.map(t => (
                <div key={t.id} className="p-4 border border-gray-50 rounded-2xl flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{t.source} → {t.destination}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">Code: {t.tripCode} · Vehicle: {t.vehicleRegistration} · Driver: {t.driverName}</p>
                  </div>
                  <Link to={`/trips/${t.id}`} className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs px-3 py-2 rounded-xl transition-all whitespace-nowrap">
                    Control
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Draft Trips Pending Dispatch */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="text-lg font-black text-gray-900">Pending Load Plans ({draftTrips.length})</h2>
          {draftTrips.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">All schedules are dispatched or complete.</p>
          ) : (
            <div className="space-y-3">
              {draftTrips.map(t => (
                <div key={t.id} className="p-4 border border-gray-50 rounded-2xl flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{t.source} → {t.destination}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">Code: {t.tripCode} · Vehicle: {t.vehicleRegistration} · Driver: {t.driverName}</p>
                  </div>
                  <Link to={`/trips/${t.id}`} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-xl transition-all whitespace-nowrap">
                    Dispatch
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
