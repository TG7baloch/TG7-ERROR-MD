import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Save,
  Check
} from 'lucide-react';
import type { BotConfig } from '../types.js';

interface SettingsPanelProps {
  config: BotConfig | null;
  onSaveConfig: (config: BotConfig) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onSaveConfig }) => {
  const [formData, setFormData] = useState<BotConfig | null>(config);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  if (!formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleToggle = (key: keyof BotConfig) => {
    setFormData((prev) => (prev ? { ...prev, [key]: !prev[key] } : null));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Bot Identity */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Bot Identity & Parameters</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Bot Name</label>
              <input
                type="text"
                value={formData.botName}
                onChange={(e) => setFormData({ ...formData, botName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Owner Name</label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Owner Number</label>
                <input
                  type="text"
                  value={formData.ownerNumber}
                  onChange={(e) => setFormData({ ...formData, ownerNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Command Prefix</label>
                <input
                  type="text"
                  value={formData.prefix}
                  onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono text-center font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Work Mode</label>
                <select
                  value={formData.workMode}
                  onChange={(e) => setFormData({ ...formData, workMode: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="public">Public (Everyone)</option>
                  <option value="private">Private (Owner Only)</option>
                  <option value="groups">Groups Only</option>
                  <option value="self">Self (Bot Only)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Security Toggles */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Security & 24/7 Shield Toggles</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/60">
              <div>
                <span className="text-xs font-bold text-white block">Anti-Delete DM Shield</span>
                <span className="text-[11px] text-slate-400">
                  Instantly forward deleted messages to Owner DM
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.antiDelete}
                onChange={() => handleToggle('antiDelete')}
                className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/60">
              <div>
                <span className="text-xs font-bold text-white block">Anti-ViewOnce Unlocker</span>
                <span className="text-[11px] text-slate-400">
                  Enable automatic decryption of ephemeral view-once media
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.antiViewOnce}
                onChange={() => handleToggle('antiViewOnce')}
                className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/60">
              <div>
                <span className="text-xs font-bold text-white block">Auto-Status Viewer</span>
                <span className="text-[11px] text-slate-400">
                  Automatically mark status stories as seen (Disabled for zero lag)
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.autoStatusView}
                onChange={() => handleToggle('autoStatusView')}
                className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/60">
              <div>
                <span className="text-xs font-bold text-white block">Always Online 24/7 Presence</span>
                <span className="text-[11px] text-slate-400">
                  Keep WhatsApp presence actively online
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.alwaysOnline}
                onChange={() => handleToggle('alwaysOnline')}
                className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/60">
              <div>
                <span className="text-xs font-bold text-white block">Google Gemini 2.5 AI Engine</span>
                <span className="text-[11px] text-slate-400">
                  Enable neural intelligence and .ai command
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.geminiAiEnabled}
                onChange={() => handleToggle('geminiAiEnabled')}
                className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          {savedSuccess ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{savedSuccess ? 'Settings Saved & Synced!' : 'Save & Persist Settings'}</span>
        </button>
      </div>
    </form>
  );
};
