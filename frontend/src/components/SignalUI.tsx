import React from 'react';

interface SignalUIProps {
  loading: boolean;
  error: string | null;
  data: unknown[];
  children: React.ReactNode;
}

export const SignalContainer = ({ loading, error, data, children }: SignalUIProps) => {
  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 animate-pulse">
      <div className="text-gray-500 font-mono">RETRIEVING_SIGNALS...</div>
    </div>
  );

  if (error) return (
    <div className="p-10 border border-red-900 bg-red-900/10 text-red-500 font-mono text-center">
      <div className="mb-2">ERROR_UNABLE_TO_REACH_OBSERVATORY</div>
      <div className="text-xs opacity-50">{error}</div>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-4 px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
      >
        RETRY_HANDSHAKE
      </button>
    </div>
  );

  if (!data || data.length === 0) return (
    <div className="p-20 text-gray-600 font-mono text-center">
      NO_TECTONIC_ACTIVITY_DETECTED_IN_CURRENT_WINDOW
    </div>
  );

  return <>{children}</>;
};
