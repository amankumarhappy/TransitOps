import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { subscribeToDrivers, deleteDriver } from '../../services/driverService';
import { Driver } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Users, Search, Plus, Trash2, Eye, ShieldAlert } from 'lucide-react';

export const DriverList: React.FC = () => {
  const { userProfile } = useAuth();
  const { success, error: showError } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const unsub = subscribeToDrivers((d) => {
      setDrivers(d);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete driver ${name}?`)) return;
    try {
      await deleteDriver(id);
      success('Deleted', `Driver ${name} has been removed.`);
    } catch (err: any) {
      showError('Failed to delete', err.message);
    }
  };

  const isLicenseExpired = (expiryStr: string) => {
    if (!expiryStr) return false;
    return new Date(expiryStr) < new Date();
  };

  const filteredDrivers = drivers.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter ? d.status === statusFilter : true;
    return matchSearch && matchStatus;
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
          <h1 className="text-2xl font-black text-gray-900">Drivers</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage operator profiles, safety ratings, and availability</p>
        </div>
        {canEdit && (
          <Link
            to="/drivers/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 text-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Driver
          </Link>
        )}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email, license number..."
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
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="ON_TRIP">ON_TRIP</option>
          <option value="OFF_DUTY">OFF_DUTY</option>
          <option value="SUSPENDED">SUSPENDED</option>
        </select>
      </div>

      {/* Grid */}
      {filteredDrivers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm max-w-md mx-auto mt-6">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mx-auto mb-4">
            <Users className="w-6 h-6" />
          </div>
          <p className="font-bold text-gray-800">No Drivers Found</p>
          <p className="text-xs text-gray-500 mt-1">Try adjusting your filters or search query, or register a new driver.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrivers.map((driver) => {
            const expired = isLicenseExpired(driver.licenseExpiry);
            return (
              <div
                key={driver.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div>
                      <h3 className="text-lg font-black text-gray-900 truncate max-w-[150px]">{driver.name}</h3>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{driver.driverId || 'DRV-N/A'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <StatusBadge status={driver.status} />
                      {expired && (
                        <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          <ShieldAlert className="w-3 h-3" />
                          LIC EXPIRED
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-500 mb-4 border-t border-gray-50 pt-3">
                    <p>
                      <span className="font-semibold text-gray-700">Email:</span> {driver.email}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">Phone:</span> {driver.phone || '—'}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">License:</span> {driver.licenseNumber}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">Safety Score:</span>{' '}
                      <span className="font-bold text-green-600">{driver.safetyScore || 95} / 100</span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-gray-50 pt-4 mt-2">
                  <Link
                    to={`/drivers/${driver.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold py-2 rounded-lg transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Profile
                  </Link>
                  {canEdit && (
                    <button
                      onClick={() => handleDelete(driver.id, driver.name)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete driver"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
