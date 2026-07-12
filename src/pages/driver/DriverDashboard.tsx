import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  subscribeToDriverByUid,
  updateDriverStatus
} from '../../services/driverService';
import {
  subscribeToDriverTrips,
  completeTrip
} from '../../services/tripService';
import {
  subscribeToVehicles,
  updateVehicleStatus
} from '../../services/vehicleService';
import { addFuelLog } from '../../services/fuelService';
import { startMaintenance } from '../../services/maintenanceService';
import { Driver, Trip, Vehicle, MaintenanceType, DriverStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Route, CheckCircle2, Moon, Sun, AlertTriangle, ShieldCheck, MapPin, Truck,
  Coffee, Compass, Power, Wrench, Droplet, ClipboardList, Check, Calendar, ArrowRight
} from 'lucide-react';

export const DriverDashboard: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  // Real-time states
  const [driver, setDriver] = useState<Driver | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [vehicleTab, setVehicleTab] = useState<'status' | 'fuel' | 'maintenance'>('status');
  
  // Fuel log form state
  const [fuelLiters, setFuelLiters] = useState<string>('');
  const [fuelCostPerLiter, setFuelCostPerLiter] = useState<string>('');
  const [fuelOdometer, setFuelOdometer] = useState<string>('');
  const [isLoggingFuel, setIsLoggingFuel] = useState(false);

  // Maintenance form state
  const [maintType, setMaintType] = useState<MaintenanceType>('ROUTINE');
  const [maintDesc, setMaintDesc] = useState<string>('');
  const [maintCost, setMaintCost] = useState<string>('0');
  const [isSubmittingMaint, setIsSubmittingMaint] = useState(false);

  const [completingId, setCompletingId] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const unsubDriver = subscribeToDriverByUid(currentUser.uid, (d) => {
      setDriver(d);
      setLoading(false);
    }, currentUser.email);

    const unsubVehicles = subscribeToVehicles((list) => {
      setVehicles(list);
    });

    return () => {
      unsubDriver();
      unsubVehicles();
    };
  }, [currentUser]);

  useEffect(() => {
    if (!driver) return;

    const unsubTrips = subscribeToDriverTrips(driver.id, (t) => {
      setTrips(t);
    });

    return () => {
      unsubTrips();
    };
  }, [driver]);

  // Find active trip
  const activeTrip = trips.find(t => t.status === 'DISPATCHED');
  const pastTrips = trips.filter(t => t.status !== 'DISPATCHED');

  // Auto-select vehicle from active trip if available
  useEffect(() => {
    if (activeTrip && activeTrip.vehicleId) {
      setSelectedVehicleId(activeTrip.vehicleId);
    } else if (vehicles.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [activeTrip, vehicles]);

  const activeVehicle = vehicles.find(v => v.id === selectedVehicleId);

  // Status updates
  const handleStatusChange = async (newStatus: DriverStatus) => {
    if (!driver || !currentUser) return;
    setIsUpdatingStatus(true);
    try {
      await updateDriverStatus(driver.id, newStatus, currentUser.uid, userProfile?.name || 'Driver');
      success('Status Updated', `Your status is now ${newStatus.replace('_', ' ')}.`);
    } catch (err: any) {
      showError('Failed to update status', err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Complete Trip
  const handleCompleteTrip = async (tripId: string) => {
    if (!currentUser || !driver) return;
    setCompletingId(tripId);
    try {
      await completeTrip(tripId, undefined, currentUser.uid, userProfile?.name || 'Driver');
      success('Trip Completed!', 'Your status is set to AVAILABLE. Trip registered successfully.');
    } catch (err: any) {
      showError('Failed to complete trip', err.message);
    } finally {
      setCompletingId(null);
    }
  };

  // Log fuel
  const handleLogFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !driver || !activeVehicle) return;

    const litersVal = parseFloat(fuelLiters);
    const costVal = parseFloat(fuelCostPerLiter);
    const odoVal = parseFloat(fuelOdometer);

    if (isNaN(litersVal) || litersVal <= 0) {
      showError('Validation Error', 'Please enter valid liters of fuel.');
      return;
    }
    if (isNaN(costVal) || costVal <= 0) {
      showError('Validation Error', 'Please enter a valid fuel cost.');
      return;
    }
    if (isNaN(odoVal) || odoVal <= 0) {
      showError('Validation Error', 'Please enter a valid odometer reading.');
      return;
    }

    setIsLoggingFuel(true);
    try {
      await addFuelLog({
        vehicleId: activeVehicle.id,
        vehicleRegistration: activeVehicle.registrationNumber,
        tripId: activeTrip?.id || '',
        date: new Date().toISOString().split('T')[0],
        liters: litersVal,
        costPerLiter: costVal,
        totalCost: litersVal * costVal,
        odometerKm: odoVal
      });

      success('Fuel Logged', `Successfully added ${litersVal}L for vehicle ${activeVehicle.registrationNumber}.`);
      setFuelLiters('');
      setFuelCostPerLiter('');
      setFuelOdometer('');
    } catch (err: any) {
      showError('Fuel Logging Failed', err.message);
    } finally {
      setIsLoggingFuel(false);
    }
  };

  // Log maintenance ticket
  const handleLogMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !driver || !activeVehicle) return;

    if (!maintDesc.trim()) {
      showError('Validation Error', 'Please provide a clear description of the maintenance issue.');
      return;
    }

    setIsSubmittingMaint(true);
    try {
      await startMaintenance({
        vehicleId: activeVehicle.id,
        vehicleRegistration: activeVehicle.registrationNumber,
        type: maintType,
        description: maintDesc.trim(),
        startDate: new Date().toISOString().split('T')[0],
        cost: parseFloat(maintCost) || 0,
        status: 'ACTIVE'
      }, currentUser.uid, userProfile?.name || 'Driver');

      success('Issue Logged Successfully', `Vehicle ${activeVehicle.registrationNumber} status updated to IN_SHOP for repair.`);
      setMaintDesc('');
    } catch (err: any) {
      showError('Maintenance Ticket Failed', err.message);
    } finally {
      setIsSubmittingMaint(false);
    }
  };

  // Toggle vehicle status
  const toggleVehicleStatus = async () => {
    if (!currentUser || !driver || !activeVehicle) return;
    const nextStatus = activeVehicle.status === 'AVAILABLE' ? 'IN_SHOP' : 'AVAILABLE';
    try {
      await updateVehicleStatus(activeVehicle.id, nextStatus, currentUser.uid, userProfile?.name || 'Driver');
      success('Vehicle Status Updated', `${activeVehicle.registrationNumber} is now ${nextStatus === 'AVAILABLE' ? 'Active & Running' : 'Required Maintenance (In Shop)'}.`);
    } catch (err: any) {
      showError('Failed to change vehicle status', err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold">Driver Profile Missing</h2>
        <p className="text-sm mt-1">Your user profile is not linked to an authorized driver record. Please contact your administrator.</p>
      </div>
    );
  }

  const greeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in pb-10">
      {/* Welcome Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{greeting()}, {driver.name.split(' ')[0]}!</h1>
          <p className="text-gray-500 text-xs mt-1">Employee ID: {driver.employeeId || 'N/A'} · License: {driver.licenseNumber}</p>
        </div>
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
          <Truck className="w-6 h-6" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-400 text-xs font-semibold">Safety Score</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-green-600">{driver.safetyScore || 95}</span>
            <span className="text-xs text-gray-400">/ 100</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-400 text-xs font-semibold">License Expiry</p>
          <p className="text-sm font-bold text-gray-800 mt-2 truncate">
            {driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>

      {/* Driver Status Controller Matrix */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div>
          <h3 className="font-bold text-gray-800 text-sm">Update Your Active Status</h3>
          <p className="text-xs text-gray-400 mt-0.5">Your status affects live dispatching queues instantly</p>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl">
          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider pl-2">Current:</span>
          <StatusBadge status={driver.status} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => handleStatusChange('AVAILABLE')}
            disabled={isUpdatingStatus || driver.status === 'ON_TRIP'}
            className={`flex flex-col items-center justify-center p-3.5 rounded-2xl font-bold transition-all border ${
              driver.status === 'AVAILABLE'
                ? 'bg-green-50 text-green-700 border-green-300 ring-2 ring-green-100'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
            } disabled:opacity-50`}
          >
            <Compass className="w-5 h-5 mb-1.5" />
            <span className="text-xs">On Duty</span>
          </button>

          <button
            onClick={() => handleStatusChange('BREAK')}
            disabled={isUpdatingStatus || driver.status === 'ON_TRIP'}
            className={`flex flex-col items-center justify-center p-3.5 rounded-2xl font-bold transition-all border ${
              driver.status === 'BREAK'
                ? 'bg-amber-50 text-amber-700 border-amber-300 ring-2 ring-amber-100'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
            } disabled:opacity-50`}
          >
            <Coffee className="w-5 h-5 mb-1.5" />
            <span className="text-xs">On Break</span>
          </button>

          <button
            onClick={() => handleStatusChange('DRIVING')}
            disabled={isUpdatingStatus || driver.status === 'ON_TRIP'}
            className={`flex flex-col items-center justify-center p-3.5 rounded-2xl font-bold transition-all border ${
              driver.status === 'DRIVING'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300 ring-2 ring-indigo-100'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
            } disabled:opacity-50`}
          >
            <Route className="w-5 h-5 mb-1.5" />
            <span className="text-xs">Driving</span>
          </button>

          <button
            onClick={() => handleStatusChange('OFF_DUTY')}
            disabled={isUpdatingStatus || driver.status === 'ON_TRIP'}
            className={`flex flex-col items-center justify-center p-3.5 rounded-2xl font-bold transition-all border ${
              driver.status === 'OFF_DUTY'
                ? 'bg-slate-50 text-slate-700 border-slate-300 ring-2 ring-slate-100'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
            } disabled:opacity-50`}
          >
            <Power className="w-5 h-5 mb-1.5" />
            <span className="text-xs">Off Duty</span>
          </button>
        </div>
      </div>

      {/* Real-time Vehicle Hub */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
              <Truck className="w-4.5 h-4.5 text-blue-600" />
              My Assigned Vehicle Status
            </h3>
            <p className="text-xs text-gray-400">View and report current vehicle specifications & failures</p>
          </div>

          {/* Select vehicle */}
          {!activeTrip && (
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:bg-white"
            >
              <option value="">-- Choose a Vehicle --</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.registrationNumber} ({v.manufacturer} {v.model})</option>
              ))}
            </select>
          )}
        </div>

        {activeVehicle ? (
          <div className="space-y-4">
            {/* Quick specifications display */}
            <div className="bg-gray-50 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Registration</p>
                <p className="text-xs font-black text-gray-800">{activeVehicle.registrationNumber}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Model</p>
                <p className="text-xs font-bold text-gray-800 truncate">{activeVehicle.manufacturer} {activeVehicle.model}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Run Status</p>
                <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-0.5 ${
                  activeVehicle.status === 'AVAILABLE'
                    ? 'bg-green-100 text-green-700'
                    : activeVehicle.status === 'IN_SHOP'
                    ? 'bg-amber-100 text-amber-700 animate-pulse'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {activeVehicle.status === 'AVAILABLE' ? 'RUNNING / OK' : activeVehicle.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Sub-tabs for Vehicle Hub */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setVehicleTab('status')}
                className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all ${
                  vehicleTab === 'status' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Toggle Running State
              </button>
              <button
                onClick={() => setVehicleTab('fuel')}
                className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all ${
                  vehicleTab === 'fuel' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Log Fuel Fill
              </button>
              <button
                onClick={() => setVehicleTab('maintenance')}
                className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all ${
                  vehicleTab === 'maintenance' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Report Repair Ticket
              </button>
            </div>

            {/* TAB CONTENT: Running state */}
            {vehicleTab === 'status' && (
              <div className="space-y-3 p-1 animate-fade-in">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Is the vehicle running properly? If the vehicle needs immediate attention or breaks down on the road, toggle its running state to <strong>REQUIRED MAINTENANCE (In Shop)</strong>. This warns dispatchers instantly.
                </p>
                <button
                  onClick={toggleVehicleStatus}
                  className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                    activeVehicle.status === 'AVAILABLE'
                      ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                      : 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100'
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  {activeVehicle.status === 'AVAILABLE' ? 'Report Required Maintenance (Go In Shop)' : 'Resolve & Set Vehicle to Running (Go Active)'}
                </button>
              </div>
            )}

            {/* TAB CONTENT: Fuel Logging */}
            {vehicleTab === 'fuel' && (
              <form onSubmit={handleLogFuel} className="space-y-3 p-1 animate-fade-in">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Log a real fuel entry for this vehicle. Liters, price, and odometer will be updated in the databases.
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Liters</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={fuelLiters}
                      onChange={e => setFuelLiters(e.target.value)}
                      placeholder="e.g. 45"
                      className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Price/L (₹)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={fuelCostPerLiter}
                      onChange={e => setFuelCostPerLiter(e.target.value)}
                      placeholder="e.g. 96"
                      className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Odometer (km)</label>
                    <input
                      type="number"
                      required
                      value={fuelOdometer}
                      onChange={e => setFuelOdometer(e.target.value)}
                      placeholder={activeVehicle.odometerKm ? String(activeVehicle.odometerKm + 50) : "e.g. 12050"}
                      className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-400"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoggingFuel}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Droplet className="w-4 h-4" />
                  {isLoggingFuel ? 'Saving Log...' : 'Submit Fuel Log Entry'}
                </button>
              </form>
            )}

            {/* TAB CONTENT: Repair / Maintenance logging */}
            {vehicleTab === 'maintenance' && (
              <form onSubmit={handleLogMaintenance} className="space-y-3 p-1 animate-fade-in">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Log a vehicle issue directly. This creates a real maintenance ticket and sets the vehicle status to <strong>IN_SHOP</strong> instantly.
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Issue Severity</label>
                    <select
                      value={maintType}
                      onChange={e => setMaintType(e.target.value as MaintenanceType)}
                      className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:bg-white"
                    >
                      <option value="ROUTINE">Routine Servicing</option>
                      <option value="INSPECTION">Mandatory Inspection</option>
                      <option value="REPAIR">Repair Required</option>
                      <option value="EMERGENCY">Roadside Breakdown</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Est Cost (₹, Optional)</label>
                    <input
                      type="number"
                      value={maintCost}
                      onChange={e => setMaintCost(e.target.value)}
                      placeholder="0"
                      className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Issue Description & Remarks</label>
                  <textarea
                    required
                    value={maintDesc}
                    onChange={e => setMaintDesc(e.target.value)}
                    placeholder="e.g. Back left tire is flat, engine check-light turned red on the highway."
                    rows={2}
                    className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingMaint}
                  className="w-full bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-red-500/10"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {isSubmittingMaint ? 'Submitting Ticket...' : 'File Damage & Send to Repair Yard'}
                </button>
              </form>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic text-center py-4">No vehicle selected. Choose a vehicle from the dropdown above.</p>
        )}
      </div>

      {/* Current Trip Card */}
      <div className="space-y-3">
        <h2 className="font-black text-gray-900 text-base flex items-center gap-2">
          <Route className="w-5 h-5 text-blue-600" />
          Active Assigned Trip
        </h2>

        {activeTrip ? (
          <div className="bg-[#0f2240] text-white rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 bg-blue-500/20 w-32 h-32 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-blue-300 font-semibold tracking-wider uppercase">Trip Code</p>
                <p className="text-lg font-black">{activeTrip.tripCode}</p>
              </div>
              <StatusBadge status="DISPATCHED" size="sm" />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <div className="w-0.5 flex-1 bg-white/20 my-1" />
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-white/50">Source Location</p>
                    <p className="font-bold">{activeTrip.source}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50">Destination Location</p>
                    <p className="font-bold">{activeTrip.destination}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 text-xs text-white/70">
              <div>
                <p className="text-white/40">Vehicle Registration</p>
                <p className="font-bold text-white mt-0.5">{activeTrip.vehicleRegistration}</p>
              </div>
              <div>
                <p className="text-white/40">Cargo weight & desc</p>
                <p className="font-bold text-white mt-0.5">{activeTrip.cargoWeightKg} kg ({activeTrip.cargoDescription || 'General Cargo'})</p>
              </div>
            </div>

            <button
              onClick={() => handleCompleteTrip(activeTrip.id)}
              disabled={completingId === activeTrip.id}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-all text-sm"
            >
              {completingId === activeTrip.id ? (
                <LoadingSpinner size="sm" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {completingId === activeTrip.id ? 'Completing Trip...' : 'Mark Trip as Completed'}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
            <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-gray-700">No Active Trips</p>
            <p className="text-xs text-gray-400 mt-1">You do not have any active trip dispatched at this time.</p>
          </div>
        )}
      </div>

      {/* Past Trips History */}
      <div className="space-y-3">
        <h2 className="font-black text-gray-900 text-base">My Completed Trips</h2>
        {pastTrips.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6 bg-white border border-gray-100 rounded-3xl">No completed trips yet.</p>
        ) : (
          <div className="space-y-3">
            {pastTrips.map(t => (
              <div key={t.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{t.source} → {t.destination}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Code: {t.tripCode} · Vehicle: {t.vehicleRegistration}</p>
                </div>
                <StatusBadge status={t.status} size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
