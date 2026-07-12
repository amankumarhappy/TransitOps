import React, { useEffect, useState } from 'react';
import { subscribeToVehicles } from '../../services/vehicleService';
import { subscribeToMaintenance } from '../../services/maintenanceService';
import { subscribeToFuelLogs } from '../../services/fuelService';
import { Vehicle, Maintenance, FuelLog } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Truck, Wrench, Fuel, Plus, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FleetDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs = [
      subscribeToVehicles(v => { setVehicles(v); setLoading(false); }),
      subscribeToMaintenance(setMaintenance),
      subscribeToFuelLogs(setFuelLogs),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const totalVehicles = vehicles.length;
  const inShop = vehicles.filter(v => v.status === 'IN_SHOP').length;
  const available = vehicles.filter(v => v.status === 'AVAILABLE').length;
  const onTrip = vehicles.filter(v => v.status === 'ON_TRIP').length;
  
  const activeServices = maintenance.filter(m => m.status === 'ACTIVE');

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
          <h1 className="text-2xl font-black text-gray-900">Fleet Control Desk</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track mechanical readiness, workshop scheduling, and fuel expenses</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/vehicles/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Vehicle
          </Link>
          <Link
            to="/maintenance"
            className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold px-4 py-2.5 rounded-xl transition-all text-sm bg-white"
          >
            <Wrench className="w-4 h-4" />
            Shop Desk
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3">
            <Truck className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-gray-900">{totalVehicles}</p>
          <p className="text-xs text-gray-500 font-bold mt-0.5 uppercase tracking-wider">Total Fleet</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3">
            <Wrench className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-gray-900">{inShop}</p>
          <p className="text-xs text-gray-500 font-bold mt-0.5 uppercase tracking-wider">In Workshop (In Shop)</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="w-9 h-9 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-3">
            <Truck className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-gray-900">{available}</p>
          <p className="text-xs text-gray-500 font-bold mt-0.5 uppercase tracking-wider">Ready / Available</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3">
            <Fuel className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-gray-900">{fuelLogs.length}</p>
          <p className="text-xs text-gray-500 font-bold mt-0.5 uppercase tracking-wider">Logged Fuels</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Shop entries */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-500" />
            Vehicles Currently in Shop ({activeServices.length})
          </h2>
          {activeServices.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No vehicles in the workshop currently.</p>
          ) : (
            <div className="space-y-3">
              {activeServices.map(s => (
                <div key={s.id} className="p-4 border border-gray-50 rounded-2xl flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm font-mono">{s.vehicleRegistration}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Type: {s.type} · Cost: ₹ {s.cost.toLocaleString()}</p>
                  </div>
                  <Link to="/maintenance" className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs px-3 py-2 rounded-xl transition-all whitespace-nowrap">
                    Complete Servicing
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Odometer & Mileage Summary list */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="text-lg font-black text-gray-900">Vehicle Mileage Tracking</h2>
          <div className="space-y-3 divide-y divide-gray-50 max-h-[300px] overflow-y-auto pr-1">
            {vehicles.map(v => (
              <div key={v.id} className="pt-3 first:pt-0 flex justify-between items-center text-sm">
                <div>
                  <p className="font-bold text-gray-800 font-mono">{v.registrationNumber}</p>
                  <p className="text-xs text-gray-400">{v.manufacturer} {v.model}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-700">{v.odometerKm.toLocaleString()} km</p>
                  <StatusBadge status={v.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
