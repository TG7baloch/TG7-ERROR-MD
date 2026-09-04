import React, { useState } from 'react';
import {
  KeyRound,
  Zap,
  Sparkles,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  QrCode,
  Copy,
  Check,
  Play,
  Square,
  Loader2,
  Info,
  Smartphone,
  Cloud,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Globe,
  Terminal
} from 'lucide-react';
import type { BotStatus, BotConfig, SessionSlot } from '../types.js';

interface SessionManagerProps {
  status: BotStatus | null;
  config: BotConfig | null;
  slots: SessionSlot[];
  onRequestPairing: (phone: string) => Promise<void>;
  onDeleteSlot: (id: string) => Promise<void>;
  onCreateSlot: (name: string) => Promise<void>;
  loadingPairing: boolean;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  status,
  config,
  slots,
  onRequestPairing,
  onDeleteSlot,
  onCreateSlot,
  loadingPairing
}) => {
  const isConnected = status?.connected ?? false;
  const [sessionInput, setSessionInput] = useState(config?.savedSessionId || '');
  const [importing, setImporting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Render 24/7 Deployment Export states
  const [exportingSession, setExportingSession] = useState(false);
  const [exportedSessionId, setExportedSessionId] = useState<string | null>(null);
  const [copiedExported, setCopiedExported] = useState(false);
  const [showRenderGuide, setShowRenderGuide] = useState(false);

  // Pairing code state
  const [phoneNumber, setPhoneNumber] = useState(config?.ownerNumber || '');
  const [copiedCode, setCopiedCode] = useState(false);

  // Slot modal state
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [newSlotName, setNewSlotName] = useState('');
  const [actionSlotId, setActionSlotId] = useState<string | null>(null);

  const handleStartSession = async () => {
    if (!sessionInput.trim()) return;
    setImporting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: 'Session imported and bot engine starting successfully!' });
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to start session' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', text: e.message });
    } finally {
      setImporting(false);
    }
  };

  const handleValidate = async () => {
    if (!sessionInput.trim()) return;
    setValidating(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/session/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionInput.trim() })
      });
      const data = await res.json();
      if (data.valid) {
        setFeedback({ type: 'success', text: `Session Valid! Format: ${data.format}, Keys: ${data.keysFound || 'Valid'}` });
      } else {
        setFeedback({ type: 'error', text: data.error || 'Invalid session format' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', text: e.message });
    } finally {
      setValidating(false);
    }
  };

  const handleRepair = async () => {
    setRepairing(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/session/repair', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: 'Ratchet and Bad MAC healed safely!' });
      } else {
        setFeedback({ type: 'error', text: data.error || 'Repair failed' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', text: `Repair failed: ${e.message}` });
    } finally {
      setRepairing(false);
    }
  };

  const handleClearSession = async () => {
    if (confirm('Are you sure you want to clear the saved session credentials and disconnect?')) {
      try {
        const res = await fetch('/api/session/clear', { method: 'POST' });
        if (res.ok) {
          setSessionInput('');
          setFeedback({ type: 'success', text: 'WhatsApp Session cleared successfully.' });
        }
      } catch (e: any) {
        setFeedback({ type: 'error', text: `Failed to clear session: ${e.message}` });
      }
    }
  };

  const handleExportSession = async () => {
    setExportingSession(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/session/export');
      const data = await res.json();
      if (data.success && data.sessionId) {
        setExportedSessionId(data.sessionId);
        await navigator.clipboard.writeText(data.sessionId);
        setCopiedExported(true);
        setTimeout(() => setCopiedExported(false), 4000);
        setFeedback({
          type: 'success',
          text: `✅ Session ID exported (${data.length} chars) and copied to your clipboard! Paste this as SESSION_ID on Render.`
        });
      } else {
        setFeedback({
          type: 'error',
          text: data.error || 'No active session credentials found. Link bot first!'
        });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', text: `Export failed: ${e.message}` });
    } finally {
      setExportingSession(false);
    }
  };

  const copyPairingCode = () => {
    if (status?.pairingCode) {
      navigator.clipboard.writeText(status.pairingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCreateSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSlotName.trim()) {
      await onCreateSlot(newSlotName.trim());
      setNewSlotName('');
      setIsSlotModalOpen(false);
    }
  };

  const handleStartSlot = async (slotId: string) => {
    setActionSlotId(slotId);
    try {
      await fetch(`/api/slots/${slotId}/start`, { method: 'POST' });
    } finally {
      setActionSlotId(null);
    }
  };

  const handleStopSlot = async (slotId: string) => {
    setActionSlotId(slotId);
    try {
      await fetch(`/api/slots/${slotId}/stop`, { method: 'POST' });
    } finally {
      setActionSlotId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Method 1: Direct Session ID Starter */}
      <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 shadow-xl shadow-emerald-950/20 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white tracking-wide">
                  Direct Session ID Starter
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                  Instant 1-Click Login
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Paste your WhatsApp Session ID string below and start the bot engine immediately without scanning QR or OTP.
              </p>
            </div>
          </div>

          {isConnected && (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Bot Online: +{status?.botNumber}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
            <span>Paste WhatsApp Session String / Creds JSON:</span>
            {config?.savedSessionId && (
              <span className="text-[11px] font-normal text-emerald-400 font-mono">
                Saved Session Present ({config.savedSessionId.slice(0, 16)}...)
              </span>
            )}
          </label>
          <textarea
            rows={3}
            value={sessionInput}
            onChange={(e) => setSessionInput(e.target.value)}
            placeholder="Paste your Session ID here (e.g. Silva~H4sIAAAAA... or TG7~... or Base64 JSON / Pastebin URL)"
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono transition-all resize-y"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-300">Supported Formats:</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 font-mono text-emerald-400">
            Silva~...
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 font-mono text-cyan-400">
            TG7~...
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 font-mono text-blue-400">
            Flash MD
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 font-mono text-purple-400">
            Base64 JSON
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 font-mono text-amber-400">
            creds.json
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 font-mono text-pink-400">
            Pastebin URL
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleStartSession}
              disabled={importing || !sessionInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-extrabold flex items-center space-x-2 transition-all shadow-lg shadow-emerald-500/25 cursor-pointer"
            >
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 fill-current" />
              )}
              <span>{importing ? 'Importing & Starting...' : 'Start Bot With Session'}</span>
            </button>

            <button
              onClick={handleValidate}
              disabled={validating || !sessionInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-all border border-slate-700 cursor-pointer"
            >
              {validating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-emerald-400" />
              )}
              <span>{validating ? 'Testing...' : 'Test / Validate String'}</span>
            </button>

            <button
              onClick={handleRepair}
              disabled={repairing}
              title="Fix Bad MAC and session decryption ratchet desync without losing your login"
              className="px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 disabled:opacity-50 text-xs font-semibold flex items-center space-x-1.5 transition-all border border-cyan-500/30 cursor-pointer"
            >
              {repairing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              )}
              <span>{repairing ? 'Healing Ratchet...' : 'Auto-Heal Session / Fix Bad MAC'}</span>
            </button>

            <button
              onClick={handleExportSession}
              disabled={exportingSession}
              title="Export session string to paste into Render.com environment variable (SESSION_ID)"
              className="px-4 py-2.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/40 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-md shadow-blue-950/40"
            >
              {exportingSession ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : copiedExported ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Cloud className="w-4 h-4 text-blue-400" />
              )}
              <span>{copiedExported ? 'Copied to Clipboard!' : 'Export Session ID (for Render)'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowRenderGuide(!showRenderGuide)}
              className="px-3.5 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Cloud className="w-3.5 h-3.5 text-indigo-400" />
              <span>Render 24/7 Guide</span>
              {showRenderGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {(config?.savedSessionId || isConnected) && (
              <button
                onClick={handleClearSession}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Session / Log Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Exported Session Preview Banner */}
        {exportedSessionId && (
          <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/40 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-300 flex items-center space-x-1.5">
                <Cloud className="w-4 h-4 text-blue-400" />
                <span>Your Render SESSION_ID string is ready!</span>
              </span>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(exportedSessionId);
                  setCopiedExported(true);
                  setTimeout(() => setCopiedExported(false), 3000);
                }}
                className="px-2.5 py-1 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-[11px] flex items-center space-x-1 transition-all cursor-pointer"
              >
                {copiedExported ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedExported ? 'Copied' : 'Copy Again'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-300">
              Render dashboard mein <strong>Environment Variables</strong> tab khol kar <code className="text-emerald-300 font-mono">SESSION_ID</code> variable banayein aur ye value paste kar dein. Bot Render par 24/7 bina QR scan kiye live ho jayega!
            </p>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-blue-200 truncate select-all">
              {exportedSessionId}
            </div>
          </div>
        )}

        {/* Render 24/7 Deployment Step-by-Step Guide Accordion */}
        {showRenderGuide && (
          <div className="p-5 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Cloud className="w-5 h-5 text-indigo-400" />
                <h4 className="font-bold text-white text-sm">Render.com Par 24/7 Deploy Karne Ka Complete Tareeqa (Beginner Guide)</h4>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                100% Free & 24/7
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[11px] border border-indigo-500/40">1</span>
                  <span>Code GitHub Par Upload Karein</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Is project ka code apne GitHub account par push karein ya AI Studio ke menu se <strong>Export to GitHub</strong> use karein. Repo ko <em>Private</em> ya <em>Public</em> rakh sakte hain.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[11px] border border-indigo-500/40">2</span>
                  <span>Render.com Par Web Service Banayein</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <strong>dashboard.render.com</strong> par jayen, <strong>New +</strong> &rarr; <strong>Web Service</strong> click karein, aur apni GitHub repo select karein.
                </p>
                <div className="bg-slate-950 p-2 rounded-lg font-mono text-[10px] text-slate-300 space-y-0.5 border border-slate-800/80">
                  <div><strong>Build Command:</strong> <span className="text-emerald-400">npm install && npm run build</span></div>
                  <div><strong>Start Command:</strong> <span className="text-emerald-400">npm start</span></div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[11px] border border-indigo-500/40">3</span>
                  <span>Environment Variables Set Karein</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Render ke <strong>Environment</strong> section mein ye variables add karein:
                </p>
                <div className="bg-slate-950 p-2 rounded-lg font-mono text-[10px] text-slate-300 space-y-0.5 border border-slate-800/80">
                  <div><span className="text-cyan-400">PORT</span> = 3000</div>
                  <div><span className="text-cyan-400">SESSION_ID</span> = [Copy kiya hua Session ID]</div>
                  <div><span className="text-cyan-400">OWNER_NUMBER</span> = 923327306747</div>
                  <div><span className="text-cyan-400">WORK_MODE</span> = public</div>
                  <div><span className="text-cyan-400">GEMINI_API_KEY</span> = [Your AI Key]</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[11px] border border-indigo-500/40">4</span>
                  <span>24/7 Keep-Alive (Sleep Rokne Ka Tareeqa)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Render Free Tier 15 minutes baad so jata hai. Isko 24/7 jagaye rakhne keliye <strong>uptimerobot.com</strong> (Free) par monitor banayein:
                </p>
                <div className="bg-slate-950 p-2 rounded-lg font-mono text-[10px] text-slate-300 space-y-0.5 border border-slate-800/80">
                  <div><strong>Monitor Type:</strong> HTTP(s)</div>
                  <div><strong>URL:</strong> https://[your-render-url]/api/ping</div>
                  <div><strong>Interval:</strong> Every 5 minutes</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {feedback && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold flex items-start space-x-2 transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            )}
            <span className="leading-relaxed">{feedback.text}</span>
          </div>
        )}
      </div>

      {/* Multi-Tenant Friend Slots */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Multi-Tenant Friend Slots</h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                  {slots.length} Slot{slots.length !== 1 ? 's' : ''} Configured
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Add friends' WhatsApp Session IDs so they can use the bot on their own number. 1-Button Start in the navbar boots everyone simultaneously with 100% strict socket isolation.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSlotModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-purple-500/20 cursor-pointer self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>+ Add Friend Slot</span>
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-start space-x-2.5 text-xs text-purple-300">
          <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            <strong>Strict Multi-Tenant Isolation:</strong> Each slot runs an isolated WhatsApp socket. Your View-Once media, anti-delete recoveries, and commands will <em>never</em> leak into your friend's account, and their data will never cross into yours.
          </span>
        </div>

        {slots.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center space-y-3">
            <p className="text-xs text-slate-400">No friend slots added yet. Click "+ Add Friend Slot" to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{slot.name}</h4>
                    <p className="text-xs text-slate-400 font-mono">
                      {slot.phoneNumber ? `+${slot.phoneNumber}` : 'No phone linked'}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      Snippet: {slot.sessionIdSnippet || 'No Session ID'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {slot.liveStatus?.connected ? (
                      <button
                        onClick={() => handleStopSlot(slot.id)}
                        disabled={actionSlotId === slot.id}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-semibold flex items-center space-x-1 border border-rose-500/20"
                      >
                        <Square className="w-3 h-3" />
                        <span>Stop</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartSlot(slot.id)}
                        disabled={actionSlotId === slot.id}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold flex items-center space-x-1 border border-emerald-500/20"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Start</span>
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteSlot(slot.id)}
                      className="p-1 rounded-lg bg-slate-800 hover:text-rose-400 text-slate-400 transition-colors"
                      title="Delete Slot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-900 text-slate-500">
                  <span>Prefix: {slot.prefix || '.'}</span>
                  <span className={slot.liveStatus?.connected ? 'text-emerald-400' : 'text-slate-500'}>
                    {slot.liveStatus?.connected ? 'Live Connected' : 'Stopped'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Method 2 & Method 3: Pairing Code & QR Scanner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Method 2: Pairing Code */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Method 2: 8-Digit Pairing Code</h3>
          </div>
          <p className="text-xs text-slate-300">
            Enter your WhatsApp number with country code (no + or spaces) to receive an official 8-character pairing code:
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 923327306747"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                onClick={() => onRequestPairing(phoneNumber)}
                disabled={loadingPairing || isConnected}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                {loadingPairing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                <span>{loadingPairing ? 'Generating...' : 'Get Code'}</span>
              </button>
            </div>

            {status?.pairingCode && (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                    WhatsApp Pairing Code
                  </span>
                  <span className="font-mono text-2xl font-black text-white tracking-widest">
                    {status.pairingCode}
                  </span>
                </div>
                <button
                  onClick={copyPairingCode}
                  className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                >
                  {copiedCode ? (
                    <Check className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Method 3: QR Scanner */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Method 3: Direct QR Scanner</h3>
          </div>

          {isConnected ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center space-y-2">
              <ShieldCheck className="w-12 h-12 text-emerald-400" />
              <span className="text-sm font-bold text-white">Bot Is Online & Synced</span>
              <span className="text-xs text-emerald-400 font-mono">+{status?.botNumber}</span>
            </div>
          ) : status?.qrCode ? (
            <div className="p-3 rounded-2xl bg-white shadow-xl">
              <img src={status.qrCode} alt="WhatsApp QR Code" className="w-48 h-48" />
            </div>
          ) : (
            <div className="w-48 h-48 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-slate-500 space-y-2">
              <QrCode className="w-8 h-8 opacity-40" />
              <span className="text-xs">QR code generates automatically on start</span>
            </div>
          )}
        </div>
      </div>

      {/* Add Slot Modal */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Add Multi-Tenant Friend Slot</h3>
            <form onSubmit={handleCreateSlotSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Friend / Slot Name
                </label>
                <input
                  type="text"
                  required
                  value={newSlotName}
                  onChange={(e) => setNewSlotName(e.target.value)}
                  placeholder="e.g. Ali, Brother, Secondary Bot"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSlotModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  Create Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
