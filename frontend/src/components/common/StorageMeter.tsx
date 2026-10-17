import React from 'react';
import { HardDrive, AlertTriangle } from 'lucide-react';

interface StorageMeterProps {
  usedBytes: number;
  quotaBytes: number;
  compact?: boolean;
}

export const StorageMeter: React.FC<StorageMeterProps> = ({ usedBytes, quotaBytes, compact = false }) => {
  const usedGb = usedBytes / (1024 * 1024 * 1024);
  const quotaGb = quotaBytes / (1024 * 1024 * 1024);
  const percentage = quotaBytes > 0 ? Math.min(100, Math.round((usedBytes / quotaBytes) * 100)) : 0;

  const isNearLimit = percentage >= 80 && percentage < 95;
  const isCritical = percentage >= 95;

  let barColor = 'bg-emerald-500';
  if (isCritical) {
    barColor = 'bg-rose-500';
  } else if (isNearLimit) {
    barColor = 'bg-amber-500';
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2 text-xs">
        <HardDrive className={`w-3.5 h-3.5 ${isCritical ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
        <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div className={`h-full ${barColor}`} style={{ width: `${percentage}%` }} />
        </div>
        <span className="font-medium text-slate-600">{percentage}%</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <HardDrive className="w-4 h-4 text-brand-navy" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Storage Usage</span>
        </div>
        {isCritical && (
          <span className="inline-flex items-center text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
            <AlertTriangle className="w-3 h-3 mr-1" /> Over Limit
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm font-bold text-slate-900">
          {usedGb >= 1 ? `${usedGb.toFixed(2)} GB` : `${(usedGb * 1024).toFixed(0)} MB`}
        </span>
        <span className="text-xs text-slate-500">of {quotaGb.toFixed(1)} GB ({percentage}%)</span>
      </div>

      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isNearLimit && (
        <p className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
          ⚠️ Your storage usage is at {percentage}%. Please contact administration if you need to upgrade your quota.
        </p>
      )}

      {isCritical && (
        <p className="mt-2 text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
          🚨 Storage limit reached! File uploads and operations may be restricted until storage is expanded.
        </p>
      )}
    </div>
  );
};

