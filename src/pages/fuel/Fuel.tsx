import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { subscribeToFuelLogs, addFuelLog } from '../../services/fuelService';
import { getAllVehicles } from '../../services/vehicleService';
import { FuelLog, Vehicle } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Fuel, Plus } from 'lucide-react';

export const FuelPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { success, error: showError } = useToast();

  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form toggle
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [vehicleId, setVehicleId] = useState('');
  const [liters, setLiters] = useState('');
  const [costPerLiter, setCostPerLiter] = useState('');
  const [odometerKm, setOdometerKm] = useState('');

  useEffect(() => {
    const unsub = subscribeToFuelLogs((data) => {
      setLogs(data);
      setLoading(false);
    });

    const loadVehicles = async () => {
      try {
        const list = await getAllVehicles();
        setVehicles(list.filter(v => v.status !== 'RETIRED'));
      } catch (err) {
        showError('Error', 'Failed to fetch vehicles.');
      }
    };
    loadVehicles();

    return unsub;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!vehicleId) {
      showError('Validation Error', 'Vehicle is required');
      return;
    }
    const selectedVehicle = vehicles.find(v => v.id === vehicleId);
    if (!selectedVehicle) return;

    const lit = parseFloat(liters) || 0;
    const cost = parseFloat(costPerLiter) || 0;

    if (lit <= 0 || cost <= 0) {
      showError('Validation Error', 'Liters and Cost must be positive.');
      return;
    }

    setActionLoading(true);
    try {
      await addFuelLog({
        vehicleId,
        vehicleRegistration: selectedVehicle.registrationNumber,
        liters: lit,
        costPerLiter: cost,
        totalCost: lit * cost,
        odometerKm: parseFloat(odometerKm) || 0,
        date: new Date().toISOString(),
      });
      success('Logged', `Fuel entry added for ${selectedVehicle.registrationNumber}.`);
      setLiters('');
      setCostPerLiter('');
      setOdometerKm('');
      setShowForm(false);
    } catch (err: any) {
      showError('Failed to log fuel', err.message);
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

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Fuel Logs</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track gas intake, fuel costs, and fleet efficiency</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 text-sm"
          >
            <Plus className="w-4 h-4" />
            Log Fuel Intake
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm max-w-xl mx-auto">
          <h2 className="text-lg font-black text-gray-900 mb-4">Log Fuel Fill</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select Vehicle</label>
                <select
                  required
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none"
                >
                  <option value="">Select vehicle...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Liters Refuelled</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 45.5"
                  value={liters}
                  onChange={(e) => setLiters(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cost Per Liter (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 96.42"
                  value={costPerLiter}
                  onChange={(e) => setCostPerLiter(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Odometer (KM)</label>
                <input
                  type="number"
                  placeholder="e.g. 15024"
                  value={odometerKm}
                  onChange={(e) => setOdometerKm(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none"
                />
              </div>
            </div>

            {liters && costPerLiter && (
              <div className="bg-blue-50 text-blue-800 p-3.5 rounded-xl text-xs font-bold">
                Total Fill Cost: ₹ {(parseFloat(liters) * parseFloat(costPerLiter)).toFixed(2)}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2"
              >
                {actionLoading && <LoadingSpinner size="sm" />}
                Log Entry
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Logs Table */}
      {logs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm max-w-md mx-auto">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mx-auto mb-4">
            <Fuel className="w-6 h-6" />
          </div>
          <p className="font-bold text-gray-800">No Fuel Records Found</p>
          <p className="text-xs text-gray-500 mt-1">Refuel transactions logged by drivers will display here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-600 uppercase">
                <tr>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Liters</th>
                  <th className="px-6 py-4">Price / L</th>
                  <th className="px-6 py-4">Total Cost</th>
                  <th className="px-6 py-4">Odometer</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 font-mono">{log.vehicleRegistration}</td>
                    <td className="px-6 py-4 text-gray-800">{log.liters} L</td>
                    <td className="px-6 py-4 text-gray-500">₹ {log.costPerLiter}</td>
                    <td className="px-6 py-4 font-bold text-blue-600">₹ {log.totalCost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">{log.odometerKm.toLocaleString()} km</td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : '—'}
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
export { FuelPage as Fuel };
