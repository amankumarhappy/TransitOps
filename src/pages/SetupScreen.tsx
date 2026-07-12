import React from 'react';
import { Terminal, ExternalLink, Copy } from 'lucide-react';

const Step: React.FC<{ n: number; title: string; description: string; code?: string }> = ({ n, title, description, code }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
      {n}
    </div>
    <div className="flex-1 pb-6 border-l-2 border-blue-100 pl-4 -ml-4">
      <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-600 mb-2">{description}</p>
      {code && (
        <div className="bg-gray-900 text-green-400 rounded-lg px-4 py-2 text-xs font-mono flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 shrink-0" />
          <span>{code}</span>
        </div>
      )}
    </div>
  </div>
);

export const SetupScreen: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-[#0f2240] via-[#1a3a6b] to-[#0f2240] flex items-center justify-center p-6">
    <div className="max-w-lg w-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-400/20 rounded-2xl mb-4 ring-1 ring-amber-400/30">
          <Terminal className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-2xl font-black text-white">Firebase Setup Required</h1>
        <p className="text-blue-300 text-sm mt-2">Configure your Firebase credentials to launch TransitOps</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-2xl">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-blue-600 text-xs font-bold">!</span>
          Quick Setup Guide
        </h2>

        <div className="space-y-0">
          <Step n={1} title="Create Firebase Project" description="Go to console.firebase.google.com and create a new project." />
          <Step n={2} title="Enable Authentication" description="In Firebase console: Authentication → Sign-in method → Enable Email/Password." />
          <Step n={3} title="Create Firestore Database" description="Firestore Database → Create database → Start in test mode." />
          <Step n={4} title="Get Config Keys" description="Project Settings → Your apps → Add web app → Copy firebaseConfig object." />
          <Step n={5} title="Create .env file" description="Copy .env.example to .env and paste your Firebase config values." code="cp .env.example .env" />
          <Step n={6} title="Set Admin Email" description="In .env, set VITE_BOOTSTRAP_ADMIN_EMAIL to your email address." />
          <Step n={7} title="Restart the dev server" description="Save .env and restart the dev server to load new environment variables." code="npm run dev" />
        </div>

        <a
          href="https://console.firebase.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors"
        >
          Open Firebase Console
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="mt-4 bg-white/10 rounded-xl p-4 border border-white/20">
        <p className="text-xs text-blue-300 font-mono">
          # .env.example<br />
          VITE_FIREBASE_API_KEY=AIza...<br />
          VITE_FIREBASE_AUTH_DOMAIN=yourapp.firebaseapp.com<br />
          VITE_FIREBASE_PROJECT_ID=your-project-id<br />
          VITE_BOOTSTRAP_ADMIN_EMAIL=admin@yourorg.com
        </p>
      </div>
    </div>
  </div>
);
