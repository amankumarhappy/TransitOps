import React, { useEffect, useState } from 'react';
import {
  Truck, Users, Route, Wrench, TrendingUp, AlertTriangle,
  CheckCircle, Clock, Activity, ArrowUpRight, RefreshCw
} from 'lucide-react';
import { subscribeToVehicles } from '../../services/vehicleService';
import { subscribeToDrivers } from '../../services/driverService';
import { subscribeToTrips } from '../../services/tripService';
import { subscribeToMaintenance } from '../../services/maintenanceService';
import { subscribeToActivityLogs } from '../../services/activityService';
import { Vehicle, Driver, Trip, Maintenance, ActivityLog } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SkeletonCard } from '../../components/common/LoadingSpinner';
import { calcFleetUtilization, formatDate, formatDateTime, timeAgo } from '../../utils/calculations';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Link } from 'react-router-dom';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'];

const KPICard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  sub?: string;
  to?: string;
}> = ({ title, value, icon, color, sub, to }) => {
  const content = (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
        {to && <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />}
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-600 mt-0.5">{title}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
};

export const AdminDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const unsubs = [
      subscribeToVehicles(v => { setVehicles(v); setLoading(false); setLastUpdated(new Date()); }),
      subscribeToDrivers(setDrivers),
      subscribeToTrips(setTrips),
      subscribeToMaintenance(setMaintenance),
      subscribeToActivityLogs(l => setLogs(l.slice(0, 20))),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE').length;
  const onTripVehicles = vehicles.filter(v => v.status === 'ON_TRIP').length;
  const inShopVehicles = vehicles.filter(v => v.status === 'IN_SHOP').length;
  const availableDrivers = drivers.filter(d => d.status === 'AVAILABLE').length;
  const activeTrips = trips.filter(t => t.status === 'DISPATCHED').length;
  const utilization = calcFleetUtilization(vehicles);

  const vehicleChartData = [
    { name: 'Available', value: availableVehicles, color: '#22c55e' },
    { name: 'On Trip', value: onTripVehicles, color: '#3b82f6' },
    { name: 'In Shop', value: inShopVehicles, color: '#f59e0b' },
    { name: 'Retired', value: vehicles.filter(v => v.status === 'RETIRED').length, color: '#6b7280' },
  ].filter(d => d.value > 0);

  const tripChartData = [
    { name: 'Draft', value: trips.filter(t => t.status === 'DRAFT').length },
    { name: 'Dispatched', value: trips.filter(t => t.status === 'DISPATCHED').length },
    { name: 'Completed', value: trips.filter(t => t.status === 'COMPLETED').length },
    { name: 'Cancelled', value: trips.filter(t => t.status === 'CANCELLED').length },
  ];

  const driverStatusData = [
    { name: 'Available', value: drivers.filter(d => d.status === 'AVAILABLE').length, color: '#22c55e' },
    { name: 'On Trip', value: drivers.filter(d => d.status === 'ON_TRIP').length, color: '#3b82f6' },
    { name: 'Off Duty', value: drivers.filter(d => d.status === 'OFF_DUTY').length, color: '#6b7280' },
    { name: 'Suspended', value: drivers.filter(d => d.status === 'SUSPENDED').length, color: '#ef4444' },
  ];

  const recentTrips = trips.slice(0, 5);

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <div className="h-7 bg-gray-200 rounded w-48 animate-pulse mb-2" />
          <div className="h-4 bg-gray-100 rounded w-64 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            {userProfile?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Fleet overview · Last updated {timeAgo(lastUpdated.toISOString())}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Live data
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Vehicles" value={vehicles.length} icon={<Truck className="w-5 h-5 text-blue-600" />} color="bg-blue-100" to="/vehicles" />
        <KPICard title="Available Vehicles" value={availableVehicles} icon={<CheckCircle className="w-5 h-5 text-green-600" />} color="bg-green-100" sub={`${onTripVehicles} on trip`} />
        <KPICard title="In Maintenance" value={inShopVehicles} icon={<Wrench className="w-5 h-5 text-amber-600" />} color="bg-amber-100" to="/maintenance" />
        <KPICard title="Fleet Utilization" value={`${utilization}%`} icon={<TrendingUp className="w-5 h-5 text-purple-600" />} color="bg-purple-100" sub="Vehicles actively on trip" />
        <KPICard title="Total Drivers" value={drivers.length} icon={<Users className="w-5 h-5 text-indigo-600" />} color="bg-indigo-100" to="/drivers" />
        <KPICard title="Available Drivers" value={availableDrivers} icon={<Users className="w-5 h-5 text-green-600" />} color="bg-green-100" />
        <KPICard title="Active Trips" value={activeTrips} icon={<Route className="w-5 h-5 text-blue-600" />} color="bg-blue-100" to="/trips" />
        <KPICard title="Total Trips" value={trips.length} icon={<Activity className="w-5 h-5 text-gray-600" />} color="bg-gray-100" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Fleet Status Donut */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Fleet Status</h3>
          {vehicleChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={vehicleChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {vehicleChartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-gray-400 text-sm">No vehicles yet</div>
          )}
        </div>

        {/* Driver Status */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Driver Availability</h3>
          {drivers.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={driverStatusData} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" name="Drivers" radius={[4, 4, 0, 0]}>
                  {driverStatusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-gray-400 text-sm">No drivers yet</div>
          )}
        </div>

        {/* Trip Status */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Trip Status</h3>
          {trips.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={tripChartData} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" name="Trips" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-gray-400 text-sm">No trips yet</div>
          )}
        </div>
      </div>

      {/* Bottom Row: Recent Trips + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Trips */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Recent Trips</h3>
            <Link to="/trips" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          {recentTrips.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">No trips yet</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentTrips.map(trip => (
                <Link
                  key={trip.id}
                  to={`/trips/${trip.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <Route className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{trip.source} → {trip.destination}</p>
                    <p className="text-xs text-gray-500">{trip.driverName} · {trip.vehicleRegistration}</p>
                  </div>
                  <StatusBadge status={trip.status} size="sm" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Activity Log</h3>
            <Link to="/admin/activity" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          {logs.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">No activity yet</div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {logs.map(log => (
                <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{log.description}</p>
                    <p className="text-xs text-gray-400">{log.userName} · {timeAgo(log.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {maintenance.filter(m => m.status === 'ACTIVE').length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">
              {maintenance.filter(m => m.status === 'ACTIVE').length} vehicle(s) currently in maintenance
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {maintenance.filter(m => m.status === 'ACTIVE').map(m => m.vehicleRegistration).join(', ')}
            </p>
          </div>
          <Link to="/maintenance" className="ml-auto text-xs text-amber-700 font-semibold hover:underline shrink-0">View →</Link>
        </div>
      )}
    </div>
  );
};
