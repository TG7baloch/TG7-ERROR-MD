import React, { useState, useEffect } from 'react';
import {
  Clock,
  Cpu,
  Zap,
  HardDrive,
  Copy,
  Check,
  ExternalLink,
  Upload,
  RefreshCw,
  Shield,
  Sparkles,
  Terminal,
  Activity,
  Server,
  ShieldCheck
} from 'lucide-react';
import type { BotStatus, BotConfig } from '../types.js';

interface StatusOverviewProps {
  status: BotStatus | null;
  config: BotConfig | null;
  onNavigateTab: (tab: string) => void;
}

export const StatusOverview: React.FC<StatusOverviewProps> = ({
  status,
  config,
  onNavigateTab
}) => {
  const isConnected = status?.connected ?? false;
  const [copied, setCopied] = useState(false);
  const [pingTesting, setPingTesting] = useState(false);
  const [pingResult, setPingResult] = useState<any>(null);
  const [bannerInfo, setBannerInfo] = useState<{ isVideo?: boolean; isCustom?: boolean } | null>(null);
  const [bannerTimestamp, setBannerTimestamp] = useState<number>(Date.now());
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerSuccessMsg, setBannerSuccessMsg] = useState<string | null>(null);

  const keepAliveUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/ping` : '/api/ping';

  // Format uptime
  const formatUptime = (totalSeconds: number) => {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const copyKeepAlive = () => {
    navigator.clipboard.writeText(keepAliveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const testPing = async () => {
    setPingTesting(true);
    try {
      const res = await fetch('/api/ping');
      const data = await res.json();
      setPingResult(data);
    } catch (e: any) {
      setPingResult({ status: 'error', error: e.message });
    } finally {
      setPingTesting(false);
    }
  };

  useEffect(() => {
    fetch('/api/banner')
      .then(res => res.json())
      .then(data => {
        if (data.bannerInfo) setBannerInfo(data.bannerInfo);
      })
      .catch(() => {});
  }, []);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const isVideo = file.type.startsWith('video/');
        const res = await fetch('/api/banner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Data, isVideo, mime: file.type })
        });
        const data = await res.json();
        if (data.success) {
          setBannerInfo(data.bannerInfo);
          setBannerTimestamp(Date.now());
          setBannerSuccessMsg('Custom banner updated successfully!');
          setTimeout(() => setBannerSuccessMsg(null), 3000);
        }
      };
      reader.readAsDataURL(file);
    } catch (e: any) {
      alert(`Failed to upload banner: ${e.message}`);
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleResetBanner = async () => {
    try {
      const res = await fetch('/api/banner', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setBannerInfo(data.bannerInfo);
        setBannerTimestamp(Date.now());
        setBannerSuccessMsg('Banner reset to default!');
        setTimeout(() => setBannerSuccessMsg(null), 3000);
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner Status */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="relative flex h-3 w-3">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isConnected ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    isConnected ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isConnected
                  ? `TG7 24/7 Engine Active • Online as +${status?.botNumber || config?.ownerNumber}`
                  : 'Bot Offline / Standby • Session Ready in Memory'}
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">
              Equipped with 24/7 Multi-Device WebSocket keep-alive, auto-reconnect on network drop, Anti-Delete DM Vault, and 2,275+ interactive commands suite.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('session')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Pairing & Slots</span>
            </button>
            <button
              onClick={() => onNavigateTab('logs')}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Terminal className="w-4 h-4" />
              <span>Live Console</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Engine Uptime</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {isConnected ? formatUptime(status?.uptimeSeconds || 0) : '0h 0m 0s'}
          </div>
          <div className="mt-2 flex items-center text-xs text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            <span>24/7 Continuous Guard</span>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Memory Allocation</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {status?.memoryUsageMb || 38} MB
          </div>
          <div className="mt-2 text-xs text-slate-400">Optimized Node.js Garbage Collector</div>
        </div>

        {/* Stat 3 */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Commands Run</span>
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {status?.totalCommandsExecuted || 0}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Processed {status?.totalMessagesProcessed || 0} incoming events
          </div>
        </div>

        {/* Stat 4 */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Saved View-Once Media</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {status?.antiDeleteVaultCount || 0} Files
          </div>
          <div className="mt-2 text-xs text-amber-400/90 flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            <span>Saved Across Reboots</span>
          </div>
        </div>
      </div>

      {/* 24/7 Always-Online & UptimeRobot Keep-Alive Hub */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900/90 border border-emerald-500/40 p-6 shadow-2xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Activity className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">
                24/7 Always-Online & UptimeRobot Keep-Alive Hub
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                ZERO DEPLOY REQUIRED
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl">
              Keep your TG7 WhatsApp bot active 24/7 without paying or deploying. When you add this Keep-Alive URL to UptimeRobot or Cron-Job.org, it automatically pings your bot every 1–5 minutes so the container never goes to sleep and auto-restores your WhatsApp connection instantly!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://uptimerobot.com"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
            >
              <span>Open UptimeRobot</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://cron-job.org"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
            >
              <span>Cron-Job.org</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Your Live 24/7 Keep-Alive / Uptime Monitor URL:</span>
            <span className="text-[11px] text-emerald-400 font-mono">Returns HTTP 200 & Socket Self-Heal</span>
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 flex items-center bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 font-mono text-xs text-emerald-400 select-all overflow-x-auto">
              <Server className="w-4 h-4 mr-2 text-slate-500 flex-shrink-0" />
              <span className="truncate">{keepAliveUrl}</span>
            </div>
            <button
              onClick={copyKeepAlive}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg ${
                copied
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>Copied URL!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-emerald-400" />
                  <span>Copy URL</span>
                </>
              )}
            </button>
            <button
              onClick={testPing}
              disabled={pingTesting}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${pingTesting ? 'animate-spin' : ''}`} />
              <span>{pingTesting ? 'Testing...' : 'Test Ping Now'}</span>
            </button>
          </div>

          {pingResult && (
            <div
              className={`mt-2 p-3 rounded-xl border text-xs flex items-center justify-between ${
                pingResult.status === 'ok'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              <span>
                Status: <strong>{pingResult.status}</strong> • Engine:{' '}
                {pingResult.engine || 'TG7 24/7 Supervisor'} • Online:{' '}
                {pingResult.online ? 'YES' : 'STANDBY'} • Pings:{' '}
                {pingResult.pingsReceived || 1}
              </span>
              <span className="font-mono text-[11px]">
                {pingResult.timestamp?.slice(11, 19)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Menu Banner Management Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                VIP Menu Command Media Banner
              </h3>
              <p className="text-xs text-slate-400">
                Appears on .menu, .help, and major response headers sent to users
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>{uploadingBanner ? 'Uploading...' : 'Upload New Banner'}</span>
              <input
                type="file"
                accept="image/*,video/mp4"
                onChange={handleBannerUpload}
                disabled={uploadingBanner}
                className="hidden"
              />
            </label>
            {bannerInfo?.isCustom && (
              <button
                onClick={handleResetBanner}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <span>Reset to Default</span>
              </button>
            )}
          </div>
        </div>

        {bannerSuccessMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400 flex items-center space-x-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{bannerSuccessMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          <div className="relative rounded-lg overflow-hidden border border-slate-800 max-h-48 flex items-center justify-center bg-black/50">
            {bannerInfo?.isVideo ? (
              <video
                key={bannerTimestamp}
                src={`/api/banner/media?t=${bannerTimestamp}`}
                autoPlay
                loop
                muted
                playsInline
                className="w-full max-h-48 object-contain rounded-lg"
              />
            ) : (
              <img
                key={bannerTimestamp}
                src={`/api/banner/media?t=${bannerTimestamp}`}
                alt="Active Command Banner"
                className="w-full max-h-48 object-contain rounded-lg"
                onError={(e: any) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
              {bannerInfo?.isVideo ? 'MP4 Video / GIF' : 'HD JPEG / PNG'}
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="font-semibold text-white">How to change banner anytime:</div>
            <div className="space-y-1.5 font-mono text-[11px] text-slate-400">
              <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                <span className="text-emerald-400 font-bold">Via WhatsApp:</span> Reply to any photo or video with <code className="text-white">.setbanner</code> or <code className="text-white">.setpp</code>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                <span className="text-cyan-400 font-bold">Via Web UI:</span> Click <span className="text-white font-semibold">Upload New Banner</span> button above
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                <span className="text-rose-400 font-bold">To Reset:</span> Send <code className="text-white">.resetbanner</code> or click Reset button
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Work Mode</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Current operating mode: <span className="text-emerald-400 font-bold uppercase">{config?.workMode || 'PUBLIC'}</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">AI Neural Intelligence</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Gemini 2.5 Flash status: <span className="text-cyan-400 font-bold">{config?.geminiAiEnabled ? 'ENABLED' : 'DISABLED'}</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 mt-0.5">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Bot Command Prefix</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Current prefix: <span className="text-purple-400 font-mono font-bold">[ {config?.prefix || '.'} ]</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
