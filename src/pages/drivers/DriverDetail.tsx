import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeToDriver, updateDriver } from '../../services/driverService';
import { Driver, DriverStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ArrowLeft, Edit3, Save, Users, ShieldAlert, Award } from 'lucide-react';

export const DriverDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // Edit fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [safetyScore, setSafetyScore] = useState('');
  const [status, setStatus] = useState<DriverStatus>('AVAILABLE');

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToDriver(id, (d) => {
      setDriver(d);
      if (d) {
        setName(d.name);
        setEmail(d.email);
        setPhone(d.phone || '');
        setCity(d.city || '');
        setLicenseNumber(d.licenseNumber);
        setLicenseExpiry(d.licenseExpiry);
        setSafetyScore((d.safetyScore || 95).toString());
        setStatus(d.status);
      }
      setLoading(false);
    });
    return unsub;
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUser || !driver) return;

    if (!name.trim()) {
      showError('Validation Error', 'Name is required');
      return;
    }

    try {
      await updateDriver(
        id,
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          city: city.trim(),
          licenseNumber: licenseNumber.trim().toUpperCase(),
          licenseExpiry,
          safetyScore: parseInt(safetyScore) || 95,
          status,
        },
        currentUser.uid,
        userProfile?.name || 'Admin'
      );
      success('Updated', 'Driver profile updated successfully.');
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

  if (!driver) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-6 text-center max-w-md mx-auto">
        <Users className="w-12 h-12 text-amber-500 mx-auto mb-2" />
        <h2 className="font-bold text-lg">Driver Profile Not Found</h2>
        <p className="text-xs mt-1">The requested driver record does not exist or has been removed.</p>
        <button onClick={() => navigate('/drivers')} className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors">
          Go back to drivers list
        </button>
      </div>
    );
  }

  const expired = driver.licenseExpiry ? new Date(driver.licenseExpiry) < new Date() : false;
  const canEdit = userProfile?.role === 'ADMIN' || userProfile?.role === 'FLEET_MANAGER';

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/drivers')}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Drivers
        </button>
        {canEdit && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs px-4 py-2 rounded-xl transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Profile
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{driver.driverId}</span>
              <StatusBadge status={driver.status} />
              {expired && (
                <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                  <ShieldAlert className="w-3 h-3" />
                  LIC EXPIRED
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-gray-900 mt-1">{driver.name}</h1>
            <p className="text-gray-400 text-xs mt-1">Authorized Operator</p>
          </div>
          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 border border-gray-100">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">License Number *</label>
                <input
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">License Expiry Date *</label>
                <input
                  type="date"
                  required
                  value={licenseExpiry}
                  onChange={(e) => setLicenseExpiry(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Safety Score (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={safetyScore}
                  onChange={(e) => setSafetyScore(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Availability Status</label>
                <select
                  value={status}
                  disabled={driver.status === 'ON_TRIP'}
                  onChange={(e) => setStatus(e.target.value as DriverStatus)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none disabled:opacity-50"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="ON_TRIP" disabled>ON_TRIP (Controlled by Trip)</option>
                  <option value="OFF_DUTY">OFF_DUTY</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
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
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase">Email</p>
                <p className="font-bold text-gray-800 text-sm mt-0.5 truncate">{driver.email}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase">Phone</p>
                <p className="font-bold text-gray-800 text-sm mt-0.5">{driver.phone || '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase">License Number</p>
                <p className="font-bold text-gray-800 text-sm mt-0.5 font-mono">{driver.licenseNumber}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase">License Expiry</p>
                <p className="font-bold text-gray-800 text-sm mt-0.5">
                  {driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase">City</p>
                <p className="font-bold text-gray-800 text-sm mt-0.5">{driver.city || '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase">Safety Score</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Award className="w-4 h-4 text-green-500" />
                  <p className="font-bold text-green-600 text-sm">{driver.safetyScore || 95} / 100</p>
                </div>
              </div>
            </div>

            {driver.authUid ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-xs text-green-800 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Account Linked (Driver has registered an online login profile).</span>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <span>Pending Registration (Driver has not signed up with their email yet).</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
