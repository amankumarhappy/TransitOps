import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Truck, AlertCircle } from 'lucide-react';
import { signUp } from '../../services/authService';
import { useToast } from '../../contexts/ToastContext';

export const Signup: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2240] via-[#1a3a6b] to-[#0f2240] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-white rounded-3xl p-4 mb-4 ring-4 ring-white/10 shadow-xl max-w-xs mx-auto">
            <img src="/logo.jpg" alt="TransitOps Logo" className="h-16 w-auto object-contain" referrerPolicy="no-referrer" />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 shadow-2xl text-center">
          <div className="inline-flex items-center justify-center bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 text-amber-400">
            <AlertCircle className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-black text-white mb-2">Registration Disabled</h2>
          <p className="text-sm text-blue-200 mb-6 leading-relaxed">
            Direct account creation has been deactivated for security and verification purposes.
          </p>

          <div className="bg-black/30 rounded-2xl p-4 mb-6 border border-white/5">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">To get your account:</span>
            <p className="text-sm font-medium text-white">Please contact your administrator at:</p>
            <a 
              href="mailto:amankumarhappy1@gmail.com" 
              className="text-amber-300 hover:text-amber-200 text-base font-bold underline block mt-2"
            >
              amankumarhappy1@gmail.com
            </a>
          </div>

          <p className="text-xs text-blue-300 mb-6">
            The administrator will register your driver profile or vehicle and authorize your credentials.
          </p>

          <Link
            to="/login"
            className="inline-block w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30"
          >
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
