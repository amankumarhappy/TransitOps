import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { createTrip } from '../../services/tripService';
import { getAllVehicles } from '../../services/vehicleService';
import { getAllDrivers } from '../../services/driverService';
import { Vehicle, Driver } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Route, ArrowLeft, ShieldCheck, AlertTriangle } from 'lucide-react';
import { INDIAN_ROUTES } from '../../utils/constants';

export const TripNew: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  // Available options
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // Form fields
  const [source, setSource] = useState('Patna');
  const [destination, setDestination] = useState('Buxar');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [cargoDescription, setCargoDescription] = useState('');
  const [cargoWeightKg, setCargoWeightKg] = useState('');
  const [plannedDistanceKm, setPlannedDistanceKm] = useState('120');
  const [scheduledDeparture, setScheduledDeparture] = useState('');

  useEffect(() => {
    const loadResources = async () => {
      try {
        const [allVehicles, allDrivers] = await Promise.all([
          getAllVehicles(),
          getAllDrivers(),
        ]);

        // Filter: only AVAILABLE
        setVehicles(allVehicles.filter(v => v.status === 'AVAILABLE'));

        // Filter: only AVAILABLE & License not expired
        const today = new Date();
        const validDrivers = allDrivers.filter(
          d => d.status === 'AVAILABLE' && d.licenseExpiry && new Date(d.licenseExpiry) >= today
        );
        setDrivers(validDrivers);
      } catch (err: any) {
        showError('Initialization Error', 'Could not load active vehicles/drivers.');
      } finally {
        setInitLoading(false);
      }
    };
    loadResources();
  }, []);

  const handleRoutePreset = (src: string, dest: string) => {
    setSource(src);
    setDestination(dest);
    // Rough estimate of distance
    if (src === 'Patna' && dest === 'Buxar') setPlannedDistanceKm('120');
    else if (src === 'Buxar' && dest === 'Ara') setPlannedDistanceKm('60');
    else if (src === 'Patna' && dest === 'Gaya') setPlannedDistanceKm('100');
    else if (src === 'Patna' && dest === 'Muzaffarpur') setPlannedDistanceKm('75');
    else setPlannedDistanceKm('100');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!source.trim() || !destination.trim()) {
      showError('Validation Error', 'Source and Destination are required.');
      return;
    }
    if (!vehicleId) {
      showError('Validation Error', 'Please select an available vehicle.');
      return;
    }
    if (!driverId) {
      showError('Validation Error', 'Please select an available driver.');
      return;
    }
    if (!scheduledDeparture) {
      showError('Validation Error', 'Scheduled departure time is required.');
      return;
    }

    const selectedVehicle = vehicles.find(v => v.id === vehicleId);
    const selectedDriver = drivers.find(d => d.id === driverId);

    if (!selectedVehicle || !selectedDriver) {
      showError('Error', 'Selected vehicle or driver is invalid.');
      return;
    }

    // Capacity check
    const weight = parseFloat(cargoWeightKg) || 0;
    if (weight > selectedVehicle.maxCapacityKg) {
      showError(
        'Capacity Limit Exceeded',
        `Cargo exceeds vehicle capacity by ${(weight - selectedVehicle.maxCapacityKg).toLocaleString()} kg.`
      );
      return;
    }

    setLoading(true);
    try {
      await createTrip(
        {
          source: source.trim(),
          destination: destination.trim(),
          vehicleId,
          vehicleRegistration: selectedVehicle.registrationNumber,
          driverId,
          driverName: selectedDriver.name,
          cargoDescription: cargoDescription.trim() || undefined,
          cargoWeightKg: weight,
          plannedDistanceKm: parseFloat(plannedDistanceKm) || undefined,
          scheduledDeparture,
          createdBy: currentUser.uid,
        },
        currentUser.uid,
        userProfile?.name || 'Dispatcher'
      );
      success('Success', 'Trip scheduled in DRAFT status.');
      navigate('/trips');
    } catch (err: any) {
      showError('Scheduling Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (initLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in pb-10">
      <button
        onClick={() => navigate('/trips')}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Trips
      </button>

      <div>
        <h1 className="text-2xl font-black text-gray-900">Schedule Trip</h1>
        <p className="text-gray-500 text-sm mt-0.5">Assign available assets and schedule a new cargo transport route</p>
      </div>

      {/* Preset Routes */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <p className="text-xs font-bold text-blue-800 mb-2 uppercase tracking-wide">Preset Routes (Bihar)</p>
        <div className="flex flex-wrap gap-2">
          {INDIAN_ROUTES.slice(0, 4).map(r => (
            <button
              key={`${r.source}-${r.destination}`}
              type="button"
              onClick={() => handleRoutePreset(r.source, r.destination)}
              className="px-3 py-1.5 bg-white text-xs font-semibold rounded-lg text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all shadow-sm"
            >
              {r.source} → {r.destination}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Source City *</label>
            <input
              type="text"
              required
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Destination City *</label>
            <input
              type="text"
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Assign Vehicle *</label>
            <select
              required
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none"
            >
              <option value="">Select available vehicle...</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.registrationNumber} ({v.type} · Max {v.maxCapacityKg} kg)
                </option>
              ))}
            </select>
            {vehicles.length === 0 && (
              <p className="text-[10px] text-amber-600 font-semibold mt-1">⚠️ No available vehicles in the fleet.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Assign Driver *</label>
            <select
              required
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none"
            >
              <option value="">Select available driver...</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} (License expiry: {d.licenseExpiry})
                </option>
              ))}
            </select>
            {drivers.length === 0 && (
              <p className="text-[10px] text-amber-600 font-semibold mt-1">⚠️ No available drivers with valid licenses.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cargo Weight (KG) *</label>
            <input
              type="number"
              placeholder="e.g. 5000"
              required
              min="1"
              value={cargoWeightKg}
              onChange={(e) => setCargoWeightKg(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Estimated Distance (KM)</label>
            <input
              type="number"
              placeholder="e.g. 120"
              min="1"
              value={plannedDistanceKm}
              onChange={(e) => setPlannedDistanceKm(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cargo Description</label>
            <input
              type="text"
              placeholder="e.g. Agricultural produce, electronics"
              value={cargoDescription}
              onChange={(e) => setCargoDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none transition-all animate-fade-in"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Scheduled Departure *</label>
            <input
              type="datetime-local"
              required
              value={scheduledDeparture}
              onChange={(e) => setScheduledDeparture(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex gap-3 border-t border-gray-50 pt-4 mt-2">
          <button
            type="submit"
            disabled={loading || vehicles.length === 0 || drivers.length === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 text-sm"
          >
            {loading ? <LoadingSpinner size="sm" /> : <Route className="w-4 h-4" />}
            {loading ? 'Scheduling...' : 'Schedule Trip (DRAFT)'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/trips')}
            className="px-5 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
