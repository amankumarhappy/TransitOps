import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { subscribeToVehicles, deleteVehicle } from '../../services/vehicleService';
import { Vehicle } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Truck, Search, Plus, SlidersHorizontal, Trash2, Eye } from 'lucide-react';
import { VEHICLE_TYPES } from '../../utils/constants';

export const VehicleList: React.FC = () => {
  const { userProfile } = useAuth();
  const { success, error: showError } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState<'reg' | 'capacity' | 'odometer'>('reg');

  useEffect(() => {
    const unsub = subscribeToVehicles((v) => {
      setVehicles(v);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleDelete = async (id: string, reg: string) => {
    if (!window.confirm(`Are you sure you want to delete vehicle ${reg}?`)) return;
    try {
      await deleteVehicle(id);
      success('Deleted', `Vehicle ${reg} deleted successfully.`);
    } catch (err: any) {
      showError('Failed to delete', err.message);
    }
  };

  const filteredVehicles = vehicles
    .filter((v) => {
      const matchSearch =
        v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter ? v.status === statusFilter : true;
      const matchType = typeFilter ? v.type === typeFilter : true;
      return matchSearch && matchStatus && matchType;
    })
    .sort((a, b) => {
      if (sortBy === 'reg') return a.registrationNumber.localeCompare(b.registrationNumber);
      if (sortBy === 'capacity') return b.maxCapacityKg - a.maxCapacityKg;
      if (sortBy === 'odometer') return b.odometerKm - a.odometerKm;
      return 0;
    });

  const canEdit = userProfile?.role === 'ADMIN' || userProfile?.role === 'FLEET_MANAGER';

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
          <h1 className="text-2xl font-black text-gray-900">Vehicle Fleet</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage and track your operational transport vehicles</p>
        </div>
        {canEdit && (
          <Link
            to="/vehicles/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 text-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Vehicle
          </Link>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search registration, model, manufacturer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:bg-white"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="ON_TRIP">ON_TRIP</option>
            <option value="IN_SHOP">IN_SHOP</option>
            <option value="RETIRED">RETIRED</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:bg-white"
          >
            <option value="">All Types</option>
            {VEHICLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:bg-white"
          >
            <option value="reg">Sort by: Registration</option>
            <option value="capacity">Sort by: Capacity</option>
            <option value="odometer">Sort by: Odometer</option>
          </select>
        </div>
      </div>

      {/* Grid or Empty */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm max-w-md mx-auto mt-6">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mx-auto mb-4">
            <Truck className="w-6 h-6" />
          </div>
          <p className="font-bold text-gray-800">No Vehicles Found</p>
          <p className="text-xs text-gray-500 mt-1">Try adjusting your filters or search query, or add a new vehicle record.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {vehicle.type}
                    </span>
                    <h3 className="text-lg font-black text-gray-900 mt-1">{vehicle.registrationNumber}</h3>
                  </div>
                  <StatusBadge status={vehicle.status} />
                </div>

                <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                  <p>
                    <span className="font-semibold text-gray-700">Make/Model:</span> {vehicle.manufacturer} {vehicle.model}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">Max Capacity:</span> {vehicle.maxCapacityKg.toLocaleString()} kg
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">Odometer:</span> {vehicle.odometerKm.toLocaleString()} km
                  </p>
                </div>
              </div>

              <div className="flex gap-2 border-t border-gray-50 pt-4 mt-2">
                <Link
                  to={`/vehicles/${vehicle.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold py-2 rounded-lg transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Details
                </Link>
                {canEdit && (
                  <button
                    onClick={() => handleDelete(vehicle.id, vehicle.registrationNumber)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete vehicle"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
