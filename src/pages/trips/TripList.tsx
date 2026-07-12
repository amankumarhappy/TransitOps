import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { subscribeToTrips } from '../../services/tripService';
import { Trip } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Route, Search, Plus, Eye, Calendar } from 'lucide-react';

export const TripList: React.FC = () => {
  const { userProfile } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const unsub = subscribeToTrips((t) => {
      setTrips(t);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filteredTrips = trips.filter((t) => {
    const matchSearch =
      t.tripCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.vehicleRegistration.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter ? t.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const canCreate = userProfile?.role === 'ADMIN' || userProfile?.role === 'DISPATCHER';

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
          <h1 className="text-2xl font-black text-gray-900">Trips</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track cargo dispatches, assignments, and routes in real-time</p>
        </div>
        {canCreate && (
          <Link
            to="/trips/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 text-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create Trip
          </Link>
        )}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search code, route, driver name, vehicle registration..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:bg-white shrink-0"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="DISPATCHED">DISPATCHED</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* List */}
      {filteredTrips.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm max-w-md mx-auto mt-6">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mx-auto mb-4">
            <Route className="w-6 h-6" />
          </div>
          <p className="font-bold text-gray-800">No Trips Found</p>
          <p className="text-xs text-gray-500 mt-1">Try adjusting your search criteria or schedule a new cargo trip.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-600 uppercase">
                <tr>
                  <th className="px-6 py-4">Trip Code</th>
                  <th className="px-6 py-4">Route</th>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Driver</th>
                  <th className="px-6 py-4">Departure</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTrips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 font-mono">{trip.tripCode}</td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {trip.source} → {trip.destination}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">{trip.vehicleRegistration}</td>
                    <td className="px-6 py-4 text-gray-700">{trip.driverName}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {trip.scheduledDeparture ? new Date(trip.scheduledDeparture).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={trip.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/trips/${trip.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
