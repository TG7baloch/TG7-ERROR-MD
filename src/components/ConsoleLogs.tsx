import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Search, Trash2 } from 'lucide-react';
import type { LogEntry } from '../types.js';

interface ConsoleLogsProps {
  logs: LogEntry[];
  onClear: () => void;
}

export const ConsoleLogs: React.FC<ConsoleLogsProps> = ({ logs, onClear }) => {
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const logContainerRef = useRef<HTMLDivElement>(null);

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== 'all' && log.level !== filterLevel) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs.length]);

  const renderBadge = (level: string) => {
    switch (level) {
      case 'command':
      case 'cmd':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
            CMD
          </span>
        );
      case 'whatsapp':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            WA
          </span>
        );
      case 'anti_delete':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            VAULT
          </span>
        );
      case 'error':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
            ERR
          </span>
        );
      case 'warn':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            WARN
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
            INFO
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Control bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white">Live Execution Terminal</span>
          <span className="text-xs text-slate-400">({filteredLogs.length} events)</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Events</option>
            <option value="command">Commands</option>
            <option value="whatsapp">WhatsApp Sync</option>
            <option value="anti_delete">Anti-Delete</option>
            <option value="error">Errors</option>
            <option value="info">Info</option>
          </select>

          <button
            onClick={onClear}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Clear Logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal View */}
      <div
        ref={logContainerRef}
        className="h-[520px] overflow-y-auto rounded-xl bg-slate-950 border border-slate-800/80 p-4 font-mono text-xs space-y-2 select-text"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
            <Terminal className="w-8 h-8 opacity-40" />
            <span>No log entries recorded yet</span>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start space-x-2.5 py-1 px-2 rounded hover:bg-slate-900/60 transition-colors"
            >
              <span className="text-slate-500 shrink-0 select-none">
                [{log.timestamp}]
              </span>
              <div className="shrink-0">{renderBadge(log.level)}</div>
              <span className="text-slate-300 break-all leading-relaxed">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
