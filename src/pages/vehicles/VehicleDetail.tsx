import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeToVehicle, updateVehicle } from '../../services/vehicleService';
import { Vehicle, VehicleStatus, VehicleType } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ArrowLeft, Edit3, Save, Trash2, Calendar, Truck, Wrench } from 'lucide-react';
import { VEHICLE_TYPES } from '../../utils/constants';

export const VehicleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // Edit fields
  const [model, setModel] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [type, setType] = useState<VehicleType>('TRUCK');
  const [maxCapacityKg, setMaxCapacityKg] = useState('');
  const [odometerKm, setOdometerKm] = useState('');
  const [status, setStatus] = useState<VehicleStatus>('AVAILABLE');

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToVehicle(id, (v) => {
      setVehicle(v);
      if (v) {
        setModel(v.model);
        setManufacturer(v.manufacturer);
        setType(v.type);
        setMaxCapacityKg(v.maxCapacityKg.toString());
        setOdometerKm(v.odometerKm.toString());
        setStatus(v.status);
      }
      setLoading(false);
    });
    return unsub;
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUser || !vehicle) return;

    if (!model.trim()) {
      showError('Validation Error', 'Model is required');
      return;
    }

    try {
      await updateVehicle(
        id,
        {
          model: model.trim(),
          manufacturer: manufacturer.trim(),
          type,
          maxCapacityKg: parseFloat(maxCapacityKg) || 0,
          odometerKm: parseFloat(odometerKm) || 0,
          status,
        },
        currentUser.uid,
        userProfile?.name || 'Admin'
      );
      success('Updated', 'Vehicle specifications updated successfully.');
      setEditing(false);
    } catch (err: any) {
      showError('Save failed', err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-6 text-center max-w-md mx-auto">
        <Truck className="w-12 h-12 text-amber-500 mx-auto mb-2" />
        <h2 className="font-bold text-lg">Vehicle Not Found</h2>
        <p className="text-xs mt-1">The requested vehicle record does not exist or has been removed.</p>
        <button onClick={() => navigate('/vehicles')} className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors">
          Go back to fleet
        </button>
      </div>
    );
  }

  const canEdit = userProfile?.role === 'ADMIN' || userProfile?.role === 'FLEET_MANAGER';

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/vehicles')}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Fleet
        </button>
        {canEdit && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs px-4 py-2 rounded-xl transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit specifications
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{vehicle.type}</span>
              <StatusBadge status={vehicle.status} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mt-1">{vehicle.registrationNumber}</h1>
            <p className="text-gray-400 text-xs mt-1">Registered: {vehicle.manufacturer} {vehicle.model}</p>
          </div>
          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 border border-gray-100">
            <Truck className="w-6 h-6 text-gray-400" />
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Manufacturer</label>
                <input
                  type="text"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Model *</label>
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Vehicle Type *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as VehicleType)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none"
                >
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status</label>
                <select
                  value={status}
                  disabled={vehicle.status === 'ON_TRIP'}
                  onChange={(e) => setStatus(e.target.value as VehicleStatus)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none disabled:opacity-50"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="ON_TRIP" disabled>ON_TRIP (Controlled by active Trip)</option>
                  <option value="IN_SHOP">IN_SHOP</option>
                  <option value="RETIRED">RETIRED</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Max Capacity (KG)</label>
                <input
                  type="number"
                  value={maxCapacityKg}
                  onChange={(e) => setMaxCapacityKg(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Odometer (KM)</label>
                <input
                  type="number"
                  value={odometerKm}
                  onChange={(e) => setOdometerKm(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-50">
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
              >
                <Save className="w-4 h-4" />
                Save changes
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase">Manufacturer</p>
              <p className="font-bold text-gray-800 text-sm mt-0.5">{vehicle.manufacturer || '—'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase">Model</p>
              <p className="font-bold text-gray-800 text-sm mt-0.5">{vehicle.model}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase">Odometer</p>
              <p className="font-bold text-gray-800 text-sm mt-0.5">{vehicle.odometerKm.toLocaleString()} km</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase">Max Cargo Capacity</p>
              <p className="font-bold text-gray-800 text-sm mt-0.5">{vehicle.maxCapacityKg.toLocaleString()} kg</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase">Acquisition Cost</p>
              <p className="font-bold text-gray-800 text-sm mt-0.5">
                {vehicle.acquisitionCost ? `₹ ${vehicle.acquisitionCost.toLocaleString()}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase">Acquisition Date</p>
              <p className="font-bold text-gray-800 text-sm mt-0.5">
                {vehicle.acquisitionDate ? new Date(vehicle.acquisitionDate).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
