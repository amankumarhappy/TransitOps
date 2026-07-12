import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  subscribeToMaintenance,
  startMaintenance,
  completeMaintenance,
  cancelMaintenance
} from '../../services/maintenanceService';
import { getAllVehicles } from '../../services/vehicleService';
import { Maintenance as MaintenanceType, Vehicle } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Wrench, Plus, CheckCircle2, XCircle, Trash } from 'lucide-react';
import { MAINTENANCE_TYPES } from '../../utils/constants';

export const Maintenance: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  // Data lists
  const [records, setRecords] = useState<MaintenanceType[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form toggles
  const [showForm, setShowForm] = useState(false);

  // Form fields
  const [vehicleId, setVehicleId] = useState('');
  const [type, setType] = useState<MaintenanceType['type']>('ROUTINE');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const unsub = subscribeToMaintenance((data) => {
      setRecords(data);
      setLoading(false);
    });

    const loadVehicles = async () => {
      try {
        const list = await getAllVehicles();
        // Allow starting maintenance on vehicles that are NOT retired or currently ON_TRIP
        setVehicles(list.filter(v => v.status !== 'RETIRED' && v.status !== 'ON_TRIP'));
      } catch (err: any) {
        showError('Error', 'Failed to fetch vehicles.');
      }
    };
    loadVehicles();

    return unsub;
  }, []);

  const handleStartMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!vehicleId) {
      showError('Validation Error', 'Please select a vehicle.');
      return;
    }

    const selectedVehicle = vehicles.find(v => v.id === vehicleId);
    if (!selectedVehicle) return;

    setActionLoading(true);
    try {
      await startMaintenance(
        {
          vehicleId,
          vehicleRegistration: selectedVehicle.registrationNumber,
          type,
          description: notes.trim() || 'Scheduled maintenance',
          startDate: new Date().toISOString(),
          cost: parseFloat(estimatedCost) || 0,
          status: 'ACTIVE',
        },
        currentUser.uid,
        userProfile?.name || 'Fleet Manager'
      );
      success('Scheduled', `Vehicle ${selectedVehicle.registrationNumber} sent to repair shop.`);
      // Reset form
      setVehicleId('');
      setEstimatedCost('');
      setNotes('');
      setShowForm(false);
    } catch (err: any) {
      showError('Failed to start', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (record: MaintenanceType) => {
    if (!currentUser) return;
    try {
      await completeMaintenance(record.id, record.vehicleId, currentUser.uid, userProfile?.name || 'Fleet Manager');
      success('Completed', `Maintenance for ${record.vehicleRegistration} completed.`);
    } catch (err: any) {
      showError('Failed to complete', err.message);
    }
  };

  const handleCancel = async (record: MaintenanceType) => {
    if (!window.confirm('Are you sure you want to cancel this maintenance event?')) return;
    try {
      await cancelMaintenance(record.id, record.vehicleId);
      success('Cancelled', `Maintenance for ${record.vehicleRegistration} cancelled.`);
    } catch (err: any) {
      showError('Failed to cancel', err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const isFleetManagerOrAdmin = userProfile?.role === 'ADMIN' || userProfile?.role === 'FLEET_MANAGER';

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Maintenance & Shop</h1>
          <p className="text-gray-500 text-sm mt-0.5">Oversee routine servicing, mechanical repairs, and vehicle upkeep</p>
        </div>
        {isFleetManagerOrAdmin && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 text-sm"
          >
            <Plus className="w-4 h-4" />
            Schedule Shop Entry
          </button>
        )}
      </div>

      {/* Start Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm max-w-xl mx-auto space-y-4">
          <h2 className="text-lg font-black text-gray-900">Schedule Vehicle to Shop</h2>
          <form onSubmit={handleStartMaintenance} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select Vehicle</label>
                <select
                  required
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none"
                >
                  <option value="">Choose vehicle...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} ({v.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Service Type</label>
                <select
                  required
                  value={type}
                  onChange={(e) => setType(e.target.value as MaintenanceType['type'])}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none"
                >
                  {MAINTENANCE_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Estimated Cost (INR)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Problem/Service Notes</label>
                <textarea
                  placeholder="Describe issues, servicing checklists, or mechanical faults..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2"
              >
                {actionLoading && <LoadingSpinner size="sm" />}
                Send to Shop
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

      {/* List */}
      {records.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm max-w-md mx-auto">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mx-auto mb-4">
            <Wrench className="w-6 h-6" />
          </div>
          <p className="font-bold text-gray-800">No Maintenance Records</p>
          <p className="text-xs text-gray-500 mt-1">There are currently no scheduled or completed maintenance logs.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-600 uppercase">
                <tr>
                   <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Cost</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  {isFleetManagerOrAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 font-mono">{rec.vehicleRegistration}</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{rec.type}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">₹ {rec.cost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-500 max-w-[180px] truncate" title={rec.description}>{rec.description || '—'}</td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={rec.status} size="sm" />
                    </td>
                    {isFleetManagerOrAdmin && (
                      <td className="px-6 py-4 text-right space-x-2">
                        {rec.status === 'ACTIVE' && (
                          <>
                            <button
                              onClick={() => handleComplete(rec)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg transition-colors"
                              title="Mark Servicing Completed"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Complete
                            </button>
                            <button
                              onClick={() => handleCancel(rec)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition-colors"
                              title="Cancel Event"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </td>
                    )}
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
