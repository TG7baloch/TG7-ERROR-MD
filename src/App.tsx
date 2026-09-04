import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { StatusOverview } from './components/StatusOverview.tsx';
import { ConsoleLogs } from './components/ConsoleLogs.tsx';
import { CommandStudio } from './components/CommandStudio.tsx';
import { SessionManager } from './components/SessionManager.tsx';
import { SourceEditor } from './components/SourceEditor.tsx';
import { SettingsPanel } from './components/SettingsPanel.tsx';
import type { BotStatus, BotConfig, LogEntry, BotCommand, SessionSlot } from './types.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [commands, setCommands] = useState<BotCommand[]>([]);
  const [slots, setSlots] = useState<SessionSlot[]>([]);
  const [loadingAction, setLoadingAction] = useState<boolean>(false);
  const [loadingPairing, setLoadingPairing] = useState<boolean>(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.status) setStatus(data.status);
      if (data.config) setConfig(data.config);
    } catch {}
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
    } catch {}
  };

  const fetchCommands = async () => {
    try {
      const res = await fetch('/api/commands');
      const data = await res.json();
      if (data.commands) setCommands(data.commands);
    } catch {}
  };

  const fetchSlots = async () => {
    try {
      const res = await fetch('/api/slots');
      const data = await res.json();
      if (data.slots) setSlots(data.slots);
    } catch {}
  };

  useEffect(() => {
    fetchStatus();
    fetchLogs();
    fetchCommands();
    fetchSlots();

    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    setLoadingAction(true);
    try {
      await fetch('/api/start', { method: 'POST' });
      await fetchStatus();
    } catch {} finally {
      setLoadingAction(false);
    }
  };

  const handleStop = async () => {
    setLoadingAction(true);
    try {
      await fetch('/api/stop', { method: 'POST' });
      await fetchStatus();
    } catch {} finally {
      setLoadingAction(false);
    }
  };

  const handleRestart = async () => {
    setLoadingAction(true);
    try {
      await fetch('/api/restart', { method: 'POST' });
      await fetchStatus();
    } catch {} finally {
      setLoadingAction(false);
    }
  };

  const handlePair = async (phoneNumber: string) => {
    setLoadingPairing(true);
    try {
      await fetch('/api/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });
      await fetchStatus();
    } catch {} finally {
      setLoadingPairing(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      await fetch('/api/logs/clear', { method: 'POST' });
      setLogs([]);
    } catch {}
  };

  const handleToggleCommand = async (id: string) => {
    try {
      await fetch(`/api/commands/${id}/toggle`, { method: 'POST' });
      fetchCommands();
    } catch {}
  };

  const handleSaveCommand = async (cmd: BotCommand) => {
    try {
      await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cmd)
      });
      fetchCommands();
    } catch {}
  };

  const handleDeleteCommand = async (id: string) => {
    try {
      await fetch(`/api/commands/${id}`, { method: 'DELETE' });
      fetchCommands();
    } catch {}
  };

  const handleSaveConfig = async (updatedConfig: BotConfig) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig)
      });
      const data = await res.json();
      if (data.config) setConfig(data.config);
    } catch {}
  };

  const handleCreateSlot = async (name: string) => {
    try {
      await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      fetchSlots();
    } catch {}
  };

  const handleDeleteSlot = async (id: string) => {
    try {
      await fetch(`/api/slots/${id}`, { method: 'DELETE' });
      fetchSlots();
    } catch {}
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        status={status}
        config={config}
        onStart={handleStart}
        onStop={handleStop}
        onRestart={handleRestart}
        loadingAction={loadingAction}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <StatusOverview
            status={status}
            config={config}
            onNavigateTab={setActiveTab}
          />
        )}
        {activeTab === 'logs' && (
          <ConsoleLogs
            logs={logs}
            onClear={handleClearLogs}
          />
        )}
        {activeTab === 'commands' && (
          <CommandStudio
            commands={commands}
            onToggle={handleToggleCommand}
            onSave={handleSaveCommand}
            onDelete={handleDeleteCommand}
          />
        )}
        {activeTab === 'session' && (
          <SessionManager
            status={status}
            config={config}
            slots={slots}
            onRequestPairing={handlePair}
            onDeleteSlot={handleDeleteSlot}
            onCreateSlot={handleCreateSlot}
            loadingPairing={loadingPairing}
          />
        )}
        {activeTab === 'files' && <SourceEditor />}
        {activeTab === 'settings' && (
          <SettingsPanel
            config={config}
            onSaveConfig={handleSaveConfig}
          />
        )}
      </main>

      <footer className="border-t border-slate-800/60 py-4 text-center text-xs text-slate-500">
        TG7 ERROR MD 24/7 Engine • Powered by High-Performance Multi-Device WebSockets
      </footer>
    </div>
  );
}
