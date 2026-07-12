import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { addDriver } from '../../services/driverService';
import { DriverStatus } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Users, ArrowLeft } from 'lucide-react';

export const DriverNew: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form states
  const [driverId, setDriverId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [city, setCity] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [safetyScore, setSafetyScore] = useState('95');
  const [status, setStatus] = useState<DriverStatus>('AVAILABLE');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!name.trim()) {
      showError('Validation Error', 'Driver name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      showError('Validation Error', 'A valid email is required.');
      return;
    }
    if (!licenseNumber.trim()) {
      showError('Validation Error', 'License number is required.');
      return;
    }
    if (!licenseExpiry) {
      showError('Validation Error', 'License expiry date is required.');
      return;
    }

    setLoading(true);
    try {
      await addDriver(
        {
          driverId: driverId.trim().toUpperCase() || `DRV-${Date.now().toString().slice(-4)}`,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          age: age ? parseInt(age) : undefined,
          gender: gender || undefined,
          city: city.trim() || undefined,
          licenseNumber: licenseNumber.trim().toUpperCase(),
          licenseExpiry,
          experienceYears: experienceYears ? parseInt(experienceYears) : undefined,
          safetyScore: safetyScore ? parseInt(safetyScore) : 95,
          status,
        },
        currentUser.uid,
        userProfile?.name || 'Administrator'
      );
      success('Success', `Driver ${name} registered successfully.`);
      navigate('/drivers');
    } catch (err: any) {
      showError('Creation Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <button
        onClick={() => navigate('/drivers')}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Drivers
      </button>

      <div>
        <h1 className="text-2xl font-black text-gray-900">Add New Driver</h1>
        <p className="text-gray-500 text-sm mt-0.5">Register a pre-authorized driver profile. The driver can then sign up with this email.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Driver Employee ID</label>
            <input
              type="text"
              placeholder="e.g. DRV001"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name *</label>
            <input
              type="text"
              placeholder="e.g. Rahul Kumar"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email (For Sign-In Auth) *</label>
            <input
              type="email"
              placeholder="e.g. rahul@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone Number</label>
            <input
              type="text"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">License Number *</label>
            <input
              type="text"
              placeholder="e.g. DL-BR01-20180012345"
              required
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">License Expiry Date *</label>
            <input
              type="date"
              required
              value={licenseExpiry}
              onChange={(e) => setLicenseExpiry(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Age</label>
            <input
              type="number"
              placeholder="e.g. 35"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">City</label>
            <input
              type="text"
              placeholder="e.g. Patna"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Experience Years</label>
            <input
              type="number"
              placeholder="e.g. 5"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Initial Safety Score</label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="95"
              value={safetyScore}
              onChange={(e) => setSafetyScore(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Initial Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as DriverStatus)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            >
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="OFF_DUTY">OFF_DUTY</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 border-t border-gray-50 pt-4 mt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 text-sm"
          >
            {loading ? <LoadingSpinner size="sm" /> : <Users className="w-4 h-4" />}
            {loading ? 'Registering...' : 'Register Driver'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/drivers')}
            className="px-5 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
