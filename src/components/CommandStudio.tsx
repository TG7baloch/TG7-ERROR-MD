import React, { useState } from 'react';
import {
  Code2,
  Search,
  Check,
  X,
  Plus,
  Trash2,
  Edit2
} from 'lucide-react';
import type { BotCommand } from '../types.js';

interface CommandStudioProps {
  commands: BotCommand[];
  onToggle: (id: string) => void;
  onSave: (command: BotCommand) => void;
  onDelete: (id: string) => void;
}

const CATEGORIES = [
  { id: 'all', name: 'All Categories' },
  { id: 'downloader', name: '📥 Media Downloaders' },
  { id: 'media', name: '🎬 Movies, Anime & Streaming' },
  { id: 'audio', name: '🎙️ Real Voice & Songs (1-50)' },
  { id: 'group', name: '🛡️ Group & Admin' },
  { id: 'tools', name: '🛠️ Tools & 100 Fonts' },
  { id: 'search', name: '🌐 Search & HD Photos' },
  { id: 'islamic', name: '🕌 Islamic Suite' },
  { id: 'fun', name: '🎪 Fun & Shayari' },
  { id: 'ai', name: '🤖 AI Studio' },
  { id: 'photoeditor', name: '📸 Photo Studio & Remini' },
  { id: 'reactions', name: '🎭 Action Reactions' },
  { id: 'whatsapp', name: '👁️ WhatsApp & RVO' },
  { id: 'stickers', name: '🎨 Sticker Lab' },
  { id: 'owner', name: '👑 Owner VIP' }
];

export const CommandStudio: React.FC<CommandStudioProps> = ({
  commands,
  onToggle,
  onSave,
  onDelete
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingCommand, setEditingCommand] = useState<BotCommand | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredCommands = commands.filter((cmd) => {
    if (selectedCategory === 'audio') {
      if (
        !(
          (cmd.category === 'fun' && cmd.name.startsWith('audio')) ||
          cmd.category === 'audio' ||
          cmd.tags?.includes('voice')
        )
      ) {
        return false;
      }
    } else if (selectedCategory !== 'all' && cmd.category !== selectedCategory) {
      return false;
    }

    if (
      searchQuery &&
      !cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !cmd.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingCommand({
      id: `cmd_${Date.now()}`,
      name: '',
      aliases: [],
      description: '',
      category: 'tools',
      permission: 'all',
      enabled: true,
      responseType: 'text',
      usage: '',
      tags: []
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cmd: BotCommand) => {
    setEditingCommand({ ...cmd });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCommand && editingCommand.name.trim()) {
      onSave(editingCommand);
      setIsModalOpen(false);
      setEditingCommand(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Code2 className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white">VIP Command Studio</span>
          <span className="text-xs text-slate-400">
            ({filteredCommands.length} of {commands.length})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search commands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Command</span>
          </button>
        </div>
      </div>

      {/* Commands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCommands.map((cmd) => (
          <div
            key={cmd.id}
            className={`p-4 rounded-xl bg-slate-900/80 border transition-all flex flex-col justify-between ${
              cmd.enabled
                ? 'border-slate-800 hover:border-slate-700'
                : 'border-rose-950/40 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm font-bold text-emerald-400">
                    .{cmd.name}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 uppercase">
                    {cmd.category}
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onToggle(cmd.id)}
                    className={`p-1 rounded cursor-pointer ${
                      cmd.enabled
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                    title={cmd.enabled ? 'Enabled' : 'Disabled'}
                  >
                    {cmd.enabled ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleOpenEdit(cmd)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(cmd.id)}
                    className="p-1 rounded bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-300 line-clamp-2 mb-3">
                {cmd.description || 'No description provided'}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono truncate">{cmd.usage || `.${cmd.name}`}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-950 font-semibold text-slate-400">
                {cmd.permission}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && editingCommand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingCommand.id.startsWith('cmd_') ? 'Add New Command' : 'Edit Command'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Command Name (without dot)
                </label>
                <input
                  type="text"
                  required
                  value={editingCommand.name}
                  onChange={(e) =>
                    setEditingCommand({ ...editingCommand, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="e.g. ping, customcmd"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                  <select
                    value={editingCommand.category}
                    onChange={(e) =>
                      setEditingCommand({ ...editingCommand, category: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Permission</label>
                  <select
                    value={editingCommand.permission}
                    onChange={(e) =>
                      setEditingCommand({
                        ...editingCommand,
                        permission: e.target.value as any
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">Everyone (All)</option>
                    <option value="admin">Group Admins</option>
                    <option value="owner">Bot Owner Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description</label>
                <input
                  type="text"
                  value={editingCommand.description}
                  onChange={(e) =>
                    setEditingCommand({ ...editingCommand, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="What does this command do?"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Usage Syntax</label>
                <input
                  type="text"
                  value={editingCommand.usage || ''}
                  onChange={(e) =>
                    setEditingCommand({ ...editingCommand, usage: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder=".mycmd <param>"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  Save Command
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
