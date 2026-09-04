import fs from 'fs';
import path from 'path';
import type { FileItem } from './types.js';

const ROOT_WORKSPACE = path.join(process.cwd(), 'custom_bot');

if (!fs.existsSync(ROOT_WORKSPACE)) {
  fs.mkdirSync(ROOT_WORKSPACE, { recursive: true });
}

export function listWorkspaceFiles(subPath = ''): FileItem[] {
  const targetDir = path.resolve(ROOT_WORKSPACE, subPath);
  if (!targetDir.startsWith(ROOT_WORKSPACE) || !fs.existsSync(targetDir)) {
    return [];
  }

  const entries = fs.readdirSync(targetDir, { withFileTypes: true });
  return entries.map(ent => {
    const full = path.join(targetDir, ent.name);
    const rel = path.relative(ROOT_WORKSPACE, full).replace(/\\/g, '/');
    let size: number | undefined;
    let updatedAt: string | undefined;
    try {
      const st = fs.statSync(full);
      size = st.size;
      updatedAt = st.mtime.toISOString();
    } catch {}
    return {
      name: ent.name,
      path: rel,
      isDirectory: ent.isDirectory(),
      size,
      updatedAt
    };
  });
}

export function readWorkspaceFile(filePath: string): string {
  const target = path.resolve(ROOT_WORKSPACE, filePath);
  if (!target.startsWith(ROOT_WORKSPACE) || !fs.existsSync(target)) {
    throw new Error('File not found or access denied');
  }
  return fs.readFileSync(target, 'utf-8');
}

export function writeWorkspaceFile(filePath: string, content: string): void {
  const target = path.resolve(ROOT_WORKSPACE, filePath);
  if (!target.startsWith(ROOT_WORKSPACE)) {
    throw new Error('Access denied');
  }
  const parent = path.dirname(target);
  if (!fs.existsSync(parent)) {
    fs.mkdirSync(parent, { recursive: true });
  }
  fs.writeFileSync(target, content, 'utf-8');
}

export function deleteWorkspaceFile(filePath: string): void {
  const target = path.resolve(ROOT_WORKSPACE, filePath);
  if (!target.startsWith(ROOT_WORKSPACE) || !fs.existsSync(target)) {
    return;
  }
  const st = fs.statSync(target);
  if (st.isDirectory()) {
    fs.rmSync(target, { recursive: true, force: true });
  } else {
    fs.unlinkSync(target);
  }
}

export function getWorkspaceMeta() {
  let fileCount = 0;
  let totalBytes = 0;

  function scan(dir: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        scan(p);
      } else {
        fileCount++;
        try {
          totalBytes += fs.statSync(p).size;
        } catch {}
      }
    }
  }

  scan(ROOT_WORKSPACE);
  return { fileCount, totalBytes, rootPath: ROOT_WORKSPACE };
}
