import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Truck, Shield, KeyRound, UserCheck } from 'lucide-react';
import { signIn, bypassWhitelistEmail } from '../../services/authService';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

const DEFAULT_DEMO_DRIVERS = [
  { id: 'default_drv_009', name: 'Neha Kumari', employeeId: 'DRV009', status: 'AVAILABLE', licenseNumber: 'DL-BR01-20200090123' },
  { id: 'default_drv_002', name: 'Amit Singh', employeeId: 'DRV002', status: 'AVAILABLE', licenseNumber: 'DL-BR01-20200023456' },
  { id: 'default_drv_007', name: 'Deepak Kumar', employeeId: 'DRV007', status: 'AVAILABLE', licenseNumber: 'DL-BR06-20190078901' },
  { id: 'default_drv_010', name: 'Pooja Singh', employeeId: 'DRV010', status: 'OFF_DUTY', licenseNumber: 'DL-BR01-20210001234' },
  { id: 'default_drv_003', name: 'Sanjay Yadav', employeeId: 'DRV003', status: 'AVAILABLE', licenseNumber: 'DL-BR04-20150034567' },
  { id: 'default_drv_004', name: 'Vikash Sharma', employeeId: 'DRV004', status: 'OFF_DUTY', licenseNumber: 'DL-BR01-20190045678' },
  { id: 'default_drv_001', name: 'Rajesh Kumar', employeeId: 'DRV001', status: 'AVAILABLE', licenseNumber: 'DL-BR01-20180012345' },
  { id: 'default_drv_008', name: 'Arjun Prasad', employeeId: 'DRV008', status: 'AVAILABLE', licenseNumber: 'DL-BR01-20130089012' },
  { id: 'default_drv_006', name: 'Manoj Gupta', employeeId: 'DRV006', status: 'ON_TRIP', licenseNumber: 'DL-BR02-20160067890' },
  { id: 'default_drv_005', name: 'Rohit Verma', employeeId: 'DRV005', status: 'AVAILABLE', licenseNumber: 'DL-BR44-20210056789' },
];

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { error: showError, success } = useToast();
  const { loginAsMock } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
 
  // Admin Setup & Bypass States
  const [setupEmail, setSetupEmail] = useState('a@gmail.com');
  const [setupName, setSetupName] = useState('Aman Kumar Happy');
  const [isWhitelisting, setIsWhitelisting] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(true);
  const [drivers, setDrivers] = useState<any[]>(
    DEFAULT_DEMO_DRIVERS.map(d => {
      const namePart = d.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const email = `${namePart}+transitops+2026@gmail.com`;
      return {
        id: d.id,
        driverId: d.employeeId,
        name: d.name,
        email,
        phone: `9876501${d.employeeId.slice(-3)}`,
        licenseNumber: d.licenseNumber,
        status: d.status,
        safetyScore: 95
      };
    })
  );
 
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const snap = await getDocs(collection(db, 'drivers'));
        const existingList = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any[];

        const missing = DEFAULT_DEMO_DRIVERS.filter(
          def => !existingList.some(ext => (ext.driverId === def.employeeId || ext.name === def.name))
        );

        if (missing.length > 0) {
          const { addDoc } = await import('firebase/firestore');
          const now = new Date().toISOString();
          const promises = missing.map(drv => {
            const namePart = drv.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const email = `${namePart}+transitops+2026@gmail.com`;
            const phoneSuffix = drv.employeeId.slice(-3);
            const phone = `9876501${phoneSuffix}`;
            return addDoc(collection(db, 'drivers'), {
              driverId: drv.employeeId,
              name: drv.name,
              email: email,
              phone: phone,
              licenseNumber: drv.licenseNumber,
              licenseExpiry: '2029-05-14',
              status: drv.status,
              safetyScore: 95,
              createdAt: now,
              updatedAt: now,
            });
          });
          await Promise.all(promises);
          
          // Refetch to get complete Firestore lists
          const finalSnap = await getDocs(collection(db, 'drivers'));
          const finalList = finalSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setDrivers(finalList);
        } else {
          setDrivers(existingList);
        }
      } catch (err) {
        console.warn('Error loading/seeding drivers for demo list:', err);
      }
    };
    fetchDrivers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const normalized = email.toLowerCase().trim();

    // Check for special Admin override
    if (normalized === 'aman@transitops.com' && password === '@aman#SINGH0818') {
      try {
        const user = await signIn(normalized, password);
        success('Logged In', `Welcome back, ${user.name}!`);
        navigate('/admin/dashboard');
        return;
      } catch (err: any) {
        console.warn('Firebase login failed for admin, falling back to mock session:', err);
        loginAsMock('aman@transitops.com', 'ADMIN', 'Aman Kumar Happy');
        success('Direct Admin Login', 'Welcome back, Aman! Logged in as ADMIN.');
        navigate('/admin/dashboard');
        return;
      } finally {
        setLoading(false);
      }
    }

    // Try standard driver with demo password "123456" fallback as mock if firebase has issues
    try {
      const user = await signIn(normalized, password);
      const routes: Record<string, string> = {
        ADMIN: '/admin/dashboard',
        FLEET_MANAGER: '/fleet/dashboard',
        DISPATCHER: '/dispatcher/dashboard',
        DRIVER: '/driver/dashboard',
      };
      navigate(routes[user.role] || '/driver/dashboard');
    } catch (err: any) {
      const msg = err?.message || '';
      if (normalized.includes('+transitops+2026@gmail.com') && password === '123456') {
        // Fallback to instant mock driver session if real firebase is not responding
        const namePart = normalized.split('+')[0];
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        loginAsMock(normalized, 'DRIVER', formattedName + ' (Demo)');
        success('Direct Driver Login', `Welcome back, ${formattedName}! Logged in as DRIVER.`);
        navigate('/driver/dashboard');
      } else if (msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found')) {
        showError('Invalid credentials', 'Check your email and password.');
      } else if (msg.includes('deactivated')) {
        showError('Account deactivated', msg);
      } else {
        showError('Login failed', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupEmail) return;
    setIsWhitelisting(true);
    try {
      await bypassWhitelistEmail(setupEmail, setupName || 'Authorized Driver');
      success('Pre-Authorized Success', `Email '${setupEmail}' is now whitelisted! You can now register with it on the Sign Up page.`);
    } catch (err: any) {
      showError('Pre-Authorization Failed', err.message);
    } finally {
      setIsWhitelisting(false);
    }
  };

  const handleQuickLogin = (role: 'ADMIN' | 'DRIVER' | 'FLEET_MANAGER' | 'DISPATCHER', emailAddr: string, name: string) => {
    try {
      loginAsMock(emailAddr, role, name);
      success('Instant Login', `Welcome back, ${name}! Logged in as ${role}.`);
      const routes: Record<string, string> = {
        ADMIN: '/admin/dashboard',
        FLEET_MANAGER: '/fleet/dashboard',
        DISPATCHER: '/dispatcher/dashboard',
        DRIVER: '/driver/dashboard',
      };
      navigate(routes[role] || '/driver/dashboard');
    } catch (err: any) {
      showError('Bypass failed', err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2240] via-[#1a3a6b] to-[#0f2240] flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg space-y-6 animate-fade-in">
        {/* Logo card */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center bg-white rounded-3xl p-4 mb-2 ring-4 ring-white/10 shadow-xl max-w-xs mx-auto">
            <img src="/logo.jpg" alt="TransitOps Logo" className="h-16 w-auto object-contain" referrerPolicy="no-referrer" />
          </div>
        </div>



        {/* Regular Login Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Sign In</h2>
            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="hidden text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 border border-amber-400/30 px-2 py-1 rounded-lg bg-amber-400/10 animate-pulse"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {showAdminPanel ? 'Hide Admin Tool' : 'Show Admin Tool'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="aman@transitops.com"
                  className="w-full bg-white/10 text-white placeholder-blue-300/50 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300" />
                <input
                  id="login-password"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/10 text-white placeholder-blue-300/50 border border-white/20 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-blue-300 hover:text-white transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-lg shadow-blue-500/30"
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-blue-300 text-sm">
              New driver?{' '}
              <Link to="/signup" className="text-white font-semibold hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-blue-400/60 text-xs mt-6">
          © 2026 TransitOps — Secure Fleet Operations
        </p>
      </div>
    </div>
  );
};
