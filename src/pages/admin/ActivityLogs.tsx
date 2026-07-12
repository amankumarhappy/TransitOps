import React, { useEffect, useState } from 'react';
import { subscribeToActivityLogs } from '../../services/activityService';
import { ActivityLog } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Activity, ShieldAlert, Clock, User } from 'lucide-react';

export const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToActivityLogs((data) => {
      setLogs(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Activity Logs</h1>
        <p className="text-gray-500 text-sm mt-0.5">Tamper-proof real-time audit logs of administrative and dispatch operations</p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm max-w-md mx-auto">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mx-auto mb-4">
            <Activity className="w-6 h-6" />
          </div>
          <p className="font-bold text-gray-800">No Activity Logs Found</p>
          <p className="text-xs text-gray-500 mt-1">Actions performed on the platform will automatically log here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="max-h-[70vh] overflow-y-auto divide-y divide-gray-50">
            {logs.map((log) => (
              <div key={log.id} className="p-4 sm:p-5 hover:bg-gray-50/50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md uppercase">
                      {log.action}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-md uppercase">
                      {log.entityType}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">ID: {log.entityId}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{log.description}</p>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400 font-medium whitespace-nowrap shrink-0">
                  <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-600 font-bold">{log.userName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
