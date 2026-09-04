import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Folder,
  File,
  RotateCw,
  Save,
  Check
} from 'lucide-react';
import type { FileItem } from '../types.js';

export const SourceEditor: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const fetchFiles = async () => {
    try {
      setLoadingFiles(true);
      const res = await fetch('/api/files');
      const data = await res.json();
      setFiles(data.files || []);
    } catch {} finally {
      setLoadingFiles(false);
    }
  };

  const handleSelectFile = async (filePath: string) => {
    try {
      setSelectedFile(filePath);
      const res = await fetch(`/api/files/content?path=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      setContent(data.content || '');
    } catch {}
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;
    try {
      setSaving(true);
      await fetch('/api/files/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedFile, content })
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch {} finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[580px]">
      {/* File Tree Left */}
      <div className="md:col-span-1 p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Custom Bot Files
              </span>
            </div>
            <button
              onClick={fetchFiles}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loadingFiles ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[460px]">
            {files.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-6">
                No custom bot files uploaded
              </div>
            ) : (
              files.map((file) => (
                <button
                  key={file.path}
                  onClick={() => !file.isDirectory && handleSelectFile(file.path)}
                  className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    selectedFile === file.path
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  {file.isDirectory ? (
                    <Folder className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  ) : (
                    <File className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className="truncate">{file.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Editor Main */}
      <div className="md:col-span-3 p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <span className="text-xs font-mono font-bold text-slate-300">
            {selectedFile || 'Select a file to view / edit'}
          </span>
          {selectedFile && (
            <button
              onClick={handleSaveFile}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
            >
              {savedSuccess ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{saving ? 'Saving...' : savedSuccess ? 'Saved!' : 'Save Code'}</span>
            </button>
          )}
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="File content will appear here..."
          className="flex-1 w-full bg-slate-950 rounded-lg p-3 font-mono text-xs text-emerald-300/90 border border-slate-800 focus:outline-none focus:border-emerald-500 resize-none"
        />
      </div>
    </div>
  );
};
