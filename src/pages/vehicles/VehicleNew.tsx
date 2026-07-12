import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { addVehicle } from '../../services/vehicleService';
import { VehicleType, VehicleStatus } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Truck, ArrowLeft } from 'lucide-react';
import { VEHICLE_TYPES } from '../../utils/constants';

export const VehicleNew: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form states
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [model, setModel] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [type, setType] = useState<VehicleType>('TRUCK');
  const [maxCapacityKg, setMaxCapacityKg] = useState('');
  const [odometerKm, setOdometerKm] = useState('0');
  const [acquisitionDate, setAcquisitionDate] = useState('');
  const [acquisitionCost, setAcquisitionCost] = useState('');
  const [status, setStatus] = useState<VehicleStatus>('AVAILABLE');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!registrationNumber.trim()) {
      showError('Validation Error', 'Registration number is required.');
      return;
    }
    if (!model.trim()) {
      showError('Validation Error', 'Vehicle model is required.');
      return;
    }
    if (!maxCapacityKg || isNaN(Number(maxCapacityKg)) || Number(maxCapacityKg) <= 0) {
      showError('Validation Error', 'Max capacity must be a positive number.');
      return;
    }

    setLoading(true);
    try {
      await addVehicle(
        {
          registrationNumber: registrationNumber.trim().toUpperCase(),
          model: model.trim(),
          manufacturer: manufacturer.trim(),
          type,
          maxCapacityKg: parseFloat(maxCapacityKg),
          odometerKm: parseFloat(odometerKm) || 0,
          acquisitionDate: acquisitionDate || undefined,
          acquisitionCost: acquisitionCost ? parseFloat(acquisitionCost) : undefined,
          status,
        },
        currentUser.uid,
        userProfile?.name || 'Administrator'
      );
      success('Success', `Vehicle ${registrationNumber} added successfully.`);
      navigate('/vehicles');
    } catch (err: any) {
      showError('Creation Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <button
        onClick={() => navigate('/vehicles')}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Fleet
      </button>

      <div>
        <h1 className="text-2xl font-black text-gray-900">Add New Vehicle</h1>
        <p className="text-gray-500 text-sm mt-0.5">Register a new transport asset in TransitOps fleet database</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Registration Number *</label>
            <input
              type="text"
              placeholder="e.g. BR-01-AB-4521"
              required
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Vehicle Type *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as VehicleType)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            >
              {VEHICLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Manufacturer</label>
            <input
              type="text"
              placeholder="e.g. Tata, Mahindra, Ashok Leyland"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Model *</label>
            <input
              type="text"
              placeholder="e.g. LPT 1613, Bolero"
              required
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Max Cargo Capacity (KG) *</label>
            <input
              type="number"
              placeholder="e.g. 8000"
              required
              min="1"
              value={maxCapacityKg}
              onChange={(e) => setMaxCapacityKg(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Initial Odometer (KM)</label>
            <input
              type="number"
              placeholder="e.g. 15000"
              min="0"
              value={odometerKm}
              onChange={(e) => setOdometerKm(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Acquisition Date</label>
            <input
              type="date"
              value={acquisitionDate}
              onChange={(e) => setAcquisitionDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Acquisition Cost (INR)</label>
            <input
              type="number"
              placeholder="e.g. 1800000"
              value={acquisitionCost}
              onChange={(e) => setAcquisitionCost(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as VehicleStatus)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            >
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="IN_SHOP">IN_SHOP</option>
              <option value="RETIRED">RETIRED</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 border-t border-gray-50 pt-4 mt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 text-sm"
          >
            {loading ? <LoadingSpinner size="sm" /> : <Truck className="w-4 h-4" />}
            {loading ? 'Creating...' : 'Register Vehicle'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/vehicles')}
            className="px-5 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
