import React, { useEffect, useState } from 'react';
import { getAllUsers, updateUserStatus, updateUserRole } from '../../services/authService';
import { AppUser, UserRole, Driver } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { UserCog, Shield, Ban, CheckCircle2, UserPlus, Trash2, Mail, Plus, ShieldCheck, FileKey } from 'lucide-react';
import { USER_ROLES } from '../../utils/constants';
import { subscribeToDrivers, addDriver, deleteDriver } from '../../services/driverService';

export const UserManagement: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'users' | 'whitelist'>('users');
  
  // Users state
  const [users, setUsers] = useState<AppUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Drivers/Whitelist state
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [whitelistLoading, setWhitelistLoading] = useState(true);
  
  // Form state
  const [newDriverEmail, setNewDriverEmail] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverLicense, setNewDriverLicense] = useState('');
  const [newDriverExpiry, setNewDriverExpiry] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err: any) {
      showError('Failed to load users', err.message);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    
    // Subscribe to drivers real-time for the whitelist panel
    const unsubscribe = subscribeToDrivers((data) => {
      setDrivers(data);
      setWhitelistLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    if (userId === currentUser?.uid) {
      showError('Action Denied', 'You cannot deactivate your own administrative account.');
      return;
    }
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setUpdatingId(userId);
    try {
      await updateUserStatus(userId, nextStatus);
      success('User Status Updated', `Account status changed to ${nextStatus}.`);
      await loadUsers();
    } catch (err: any) {
      showError('Status Update Failed', err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (userId === currentUser?.uid) {
      showError('Action Denied', 'You cannot downgrade your own administrative role.');
      return;
    }
    setUpdatingId(userId);
    try {
      await updateUserRole(userId, newRole);
      success('Role Promoted', `User role successfully changed to ${newRole}.`);
      await loadUsers();
    } catch (err: any) {
      showError('Role Update Failed', err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!newDriverEmail.trim() || !newDriverEmail.includes('@')) {
      showError('Validation Error', 'A valid email address is required.');
      return;
    }
    if (!newDriverName.trim()) {
      showError('Validation Error', 'Driver name is required.');
      return;
    }

    setIsAdding(true);
    try {
      const emailNormalized = newDriverEmail.trim().toLowerCase();
      
      // Check if email already whitelisted
      const isDuplicate = drivers.some(d => d.email.toLowerCase() === emailNormalized);
      if (isDuplicate) {
        showError('Duplicate Email', 'This driver email is already whitelisted/registered.');
        setIsAdding(false);
        return;
      }

      await addDriver({
        driverId: `DRV-${Date.now().toString().slice(-4)}`,
        name: newDriverName.trim(),
        email: emailNormalized,
        phone: newDriverPhone.trim() || 'N/A',
        licenseNumber: newDriverLicense.trim().toUpperCase() || 'LIC-PENDING',
        licenseExpiry: newDriverExpiry || '2030-12-31',
        status: 'AVAILABLE'
      }, currentUser.uid, userProfile?.name || 'Admin');

      success('Whitelisted Successfully', `Authorized driver email '${emailNormalized}' is now registered.`);
      setNewDriverEmail('');
      setNewDriverName('');
      setNewDriverPhone('');
      setNewDriverLicense('');
      setNewDriverExpiry('');
    } catch (err: any) {
      showError('Setup Failed', err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteWhitelist = async (driverId: string, email: string) => {
    if (window.confirm(`Are you sure you want to remove authorization/driver profile for '${email}'?`)) {
      try {
        await deleteDriver(driverId);
        success('Authorization Revoked', `Driver email ${email} was removed from the whitelist.`);
      } catch (err: any) {
        showError('Revocation Failed', err.message);
      }
    }
  };

  if (usersLoading && whitelistLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Access & Authorization</h1>
        <p className="text-gray-500 text-sm mt-0.5">Control administrative roles, authorized driver emails (whitelist), and employee access credentials</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 gap-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all duration-150 ${
            activeTab === 'users'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Active App Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('whitelist')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all duration-150 ${
            activeTab === 'whitelist'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Pre-Authorized Drivers ({drivers.length})
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left animate-fade-in">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-600 uppercase">
                <tr>
                  <th className="px-6 py-4">Employee Details</th>
                  <th className="px-6 py-4">Auth Email</th>
                  <th className="px-6 py-4">Authorization Role</th>
                  <th className="px-6 py-4">Access Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.uid} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-50 text-blue-600 font-bold rounded-xl flex items-center justify-center">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{u.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">{u.uid}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{u.email}</td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        disabled={updatingId === u.uid || u.uid === currentUser?.uid}
                        onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                        className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:bg-white disabled:opacity-50"
                      >
                        {Object.keys(USER_ROLES).map((roleKey) => (
                          <option key={roleKey} value={roleKey}>
                            {roleKey}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`} />
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.uid !== currentUser?.uid && (
                        <button
                          onClick={() => handleStatusToggle(u.uid, u.status)}
                          disabled={updatingId === u.uid}
                          className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                            u.status === 'ACTIVE'
                              ? 'bg-red-50 hover:bg-red-100 text-red-700'
                              : 'bg-green-50 hover:bg-green-100 text-green-700'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          {u.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Side */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 h-fit space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Authorize New Driver</h3>
                <p className="text-gray-400 text-xs">Pre-authorize email for driver signup</p>
              </div>
            </div>

            <form onSubmit={handleAddWhitelist} className="space-y-4">
              {/* Demo credential info box */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-800 space-y-1">
                <span className="font-extrabold uppercase tracking-wider block text-[9px] text-amber-600">Demo Credentials Activated</span>
                <p>Authorized drivers can instantly sign in with:</p>
                <div className="bg-white/60 border border-amber-200 p-2 rounded-xl font-mono text-[10px] text-gray-800 mt-1 space-y-0.5 leading-snug">
                  <div><span className="font-semibold text-gray-500">Email:</span> name+transitops+2026@gmail.com</div>
                  <div><span className="font-semibold text-gray-500">Password:</span> 123456</div>
                </div>
                <p className="text-[10px] text-amber-700 mt-1">E.g., "John Doe" logins with <span className="font-bold">johndoe+transitops+2026@gmail.com</span>.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Driver Full Name</label>
                <input
                  type="text"
                  value={newDriverName}
                  onChange={e => {
                    const nameVal = e.target.value;
                    setNewDriverName(nameVal);
                    const namePart = nameVal.toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (namePart) {
                      setNewDriverEmail(`${namePart}+transitops+2026@gmail.com`);
                    } else {
                      setNewDriverEmail('');
                    }
                  }}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Authorized Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={newDriverEmail}
                    onChange={e => setNewDriverEmail(e.target.value)}
                    placeholder="driver@transitops.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Phone (Optional)</label>
                <input
                  type="tel"
                  value={newDriverPhone}
                  onChange={e => setNewDriverPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">License (Opt)</label>
                  <input
                    type="text"
                    value={newDriverLicense}
                    onChange={e => setNewDriverLicense(e.target.value)}
                    placeholder="DL-123456"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Expiry (Opt)</label>
                  <input
                    type="date"
                    value={newDriverExpiry}
                    onChange={e => setNewDriverExpiry(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isAdding}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 mt-2"
              >
                <Plus className="w-4 h-4" />
                {isAdding ? 'Authorizing...' : 'Authorize Driver'}
              </button>
            </form>
          </div>

          {/* List Side */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-fit">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Pre-Authorized Driver Roster</h3>
              <p className="text-gray-400 text-xs">These drivers are whitelisted to sign up and login with their corresponding emails</p>
            </div>

            {drivers.length === 0 ? (
              <div className="p-10 text-center text-gray-400 text-sm">
                No pre-authorized drivers yet. Use the form on the left to authorize driver access.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-600 uppercase">
                    <tr>
                      <th className="px-5 py-3">Driver Name / ID</th>
                      <th className="px-5 py-3">Authorized Email</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {drivers.map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <div>
                            <p className="font-bold text-gray-900">{d.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{d.driverId}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-600 font-medium">{d.email}</td>
                        <td className="px-5 py-3">
                          {d.authUid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Registered
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200 animate-pulse">
                              <FileKey className="w-3.5 h-3.5" />
                              Pending Sign-up
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleDeleteWhitelist(d.id, d.email)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Revoke Whitelist Authorization"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export { UserManagement as UserList };
