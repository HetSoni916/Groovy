import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { Repository, FileInfo, RepoSummary } from '../types';
import { scanDirectory } from './parser';
import { chunkFiles } from './chunker';

const repos = new Map<string, Repository>();

function computeHash(dirPath: string): string {
  let hash = '';
  function walk(dir: string) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch { return; }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== 'build') {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        try {
          const stat = fs.statSync(fullPath);
          hash += entry.name + stat.size + stat.mtimeMs;
        } catch { /* skip */ }
      }
    }
  }
  walk(dirPath);
  return crypto.createHash('md5').update(hash).digest('hex');
}

function detectTechStack(files: FileInfo[]): string[] {
  const stack = new Set<string>();
  const allContent = files.map(f => f.content).join('\n');
  for (const file of files) {
    const ext = path.extname(file.path).toLowerCase();
    switch (ext) {
      case '.ts':
      case '.tsx':
        stack.add('TypeScript');
        break;
      case '.js':
      case '.jsx':
        stack.add('JavaScript');
        break;
      case '.py':
        stack.add('Python');
        break;
      case '.java':
        stack.add('Java');
        break;
      case '.cpp':
      case '.hpp':
      case '.c':
      case '.h':
        stack.add('C++');
        break;
      case '.html':
      case '.htm':
        stack.add('HTML');
        break;
      case '.css':
      case '.scss':
      case '.less':
        stack.add('CSS');
        break;
      case '.json':
        if (file.path === 'package.json') {
          try {
            const pkg = JSON.parse(file.content);
            if (pkg.dependencies) {
              const deps = Object.keys(pkg.dependencies);
              if (deps.includes('react') || deps.includes('react-dom')) stack.add('React');
              if (deps.includes('vue') || deps.includes('nuxt')) stack.add('Vue.js');
              if (deps.includes('@angular/core')) stack.add('Angular');
              if (deps.includes('next')) stack.add('Next.js');
              if (deps.includes('express')) stack.add('Express.js');
              if (deps.includes('nestjs') || deps.includes('@nestjs/core')) stack.add('NestJS');
              if (deps.includes('typeorm') || deps.includes('prisma') || deps.includes('sequelize')) stack.add('ORM');
              if (deps.includes('socket.io')) stack.add('Socket.IO');
            }
            if (pkg.devDependencies) {
              const devDeps = Object.keys(pkg.devDependencies);
              if (devDeps.includes('typescript')) stack.add('TypeScript');
              if (devDeps.includes('jest') || devDeps.includes('vitest') || devDeps.includes('mocha')) stack.add('Testing Framework');
              if (devDeps.includes('tailwindcss') || devDeps.includes('postcss')) stack.add('Tailwind CSS');
              if (devDeps.includes('eslint')) stack.add('ESLint');
              if (devDeps.includes('prettier')) stack.add('Prettier');
              if (devDeps.includes('webpack') || devDeps.includes('vite') || devDeps.includes('rollup')) stack.add('Bundler');
            }
          } catch { /* ignore parse errors */ }
        }
        if (file.path.endsWith('composer.json')) stack.add('PHP');
        break;
      case '.yaml':
      case '.yml':
        if (file.path === 'docker-compose.yml' || file.path === 'docker-compose.yaml') stack.add('Docker');
        break;
      case '.go':
        stack.add('Go');
        break;
      case '.rs':
        stack.add('Rust');
        break;
      case '.rb':
        stack.add('Ruby');
        break;
      case '.kt':
        stack.add('Kotlin');
        break;
      case '.swift':
        stack.add('Swift');
        break;
    }
  }

  // Check for framework-specific patterns
  if (allContent.includes('@app.route') || allContent.includes('flask')) stack.add('Flask');
  if (allContent.includes('from django') || allContent.includes('django.urls')) stack.add('Django');
  if (allContent.includes('require(\'express\')') || allContent.includes('from \'express\'') || allContent.includes('require("express")') || allContent.includes('from "express"')) stack.add('Express.js');
  if (allContent.includes('@Entity') || allContent.includes('@Table')) stack.add('TypeORM');
  if (allContent.includes('prisma')) stack.add('Prisma');

  return [...stack];
}

function findEntryPoints(files: FileInfo[]): string[] {
  const entryNames = ['main.py', 'index.js', 'index.ts', 'app.js', 'app.ts', 'main.js', 'main.ts', 'server.js', 'server.ts', 'cli.js', 'cli.ts'];
  const entries: string[] = [];
  for (const name of entryNames) {
    const match = files.find(f => f.path.endsWith(name));
    if (match) entries.push(match.path);
  }
  // Also look for entry in package.json
  const pkgFile = files.find(f => f.path === 'package.json');
  if (pkgFile) {
    try {
      const pkg = JSON.parse(pkgFile.content);
      if (pkg.main) entries.push(pkg.main);
      if (pkg.bin) {
        if (typeof pkg.bin === 'string') entries.push(pkg.bin);
        else entries.push(...Object.values(pkg.bin) as string[]);
      }
    } catch { /* ignore */ }
  }
  return [...new Set(entries)];
}

function findEnvVars(files: FileInfo[]): string[] {
  const vars = new Set<string>();

  // Check .env.example files
  for (const file of files) {
    if (file.path.endsWith('.env.example') || file.path === '.env.example') {
      const lines = file.content.split('\n');
      for (const line of lines) {
        const m = line.match(/^(\w+)=/);
        if (m) vars.add(m[1]);
      }
    }
  }

  // Also find process.env.X references in JS/TS files
  for (const file of files) {
    if (['.js', '.jsx', '.ts', '.tsx', '.py'].includes(path.extname(file.path))) {
      const envRefs = file.content.matchAll(/(?:process\.env\.(\w+)|os\.environ\[['"](\w+)['"]\])/g);
      for (const match of envRefs) {
        vars.add(match[1] || match[2]);
      }
    }
  }

  return [...vars];
}

function findApiRoutes(files: FileInfo[]): string[] {
  const routes: string[] = [];

  for (const file of files) {
    // Express routes
    const expressPatterns = [
      ...file.content.matchAll(/\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/g),
      ...file.content.matchAll(/\.route\s*\(\s*['"]([^'"]+)['"]/g),
      ...file.content.matchAll(/router\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/g),
    ];
    for (const match of expressPatterns) {
      const method = match[1]?.toUpperCase() || 'ANY';
      const route = match[2] || match[3];
      routes.push(`${method} ${route}`);
    }

    // Flask routes
    const flaskPatterns = file.content.matchAll(/@\w+\.route\s*\(\s*['"]([^'"]+)['"]/g);
    for (const match of flaskPatterns) {
      routes.push(`GET ${match[1]}`);
    }

    // FastAPI routes
    const fastapiPatterns = file.content.matchAll(/@\w+\.(get|post|put|delete)\(['"]([^'"]+)['"]/g);
    for (const match of fastapiPatterns) {
      routes.push(`${match[1].toUpperCase()} ${match[2]}`);
    }
  }

  return [...new Set(routes)];
}

function buildFolderStructure(files: FileInfo[]): string {
  const tree = new Map<string, Set<string>>();

  for (const file of files) {
    const parts = file.path.replace(/\\/g, '/').split('/');
    let current = '';
    for (let i = 0; i < parts.length - 1; i++) {
      const parent = current;
      current = current ? `${current}/${parts[i]}` : parts[i];
      if (!tree.has(parent)) tree.set(parent, new Set());
      tree.get(parent)!.add(current);
    }
    // Add file to its parent dir
    const parent = current;
    if (!tree.has(parent)) tree.set(parent, new Set());
    tree.get(parent)!.add(file.path.replace(/\\/g, '/'));
  }

  function printTree(dir: string, indent: string): string {
    const children = tree.get(dir);
    if (!children) return '';
    let result = '';
    const sorted = [...children].sort();
    for (let i = 0; i < sorted.length; i++) {
      const child = sorted[i];
      const isLast = i === sorted.length - 1;
      const isDir = tree.has(child) || (sorted.filter(s => s.startsWith(child + '/')).length > 0);
      const prefix = isLast ? '└── ' : '├── ';
      const nextIndent = isLast ? '    ' : '│   ';
      if (isDir && !child.includes('/')) {
        result += `${indent}${prefix}${child.split('/').pop()}/\n`;
        result += printTree(child, indent + nextIndent);
      } else if (isDir) {
        result += `${indent}${prefix}${child.split('/').pop()}/\n`;
        result += printTree(child, indent + nextIndent);
      } else {
        result += `${indent}${prefix}${child.split('/').pop()}\n`;
      }
    }
    return result;
  }

  return printTree('', '');
}

function getTotalLines(files: FileInfo[]): number {
  return files.reduce((sum, f) => sum + f.content.split('\n').length, 0);
}

function generateProjectName(dirPath: string): string {
  const name = path.basename(path.resolve(dirPath));
  return name;
}

export async function processRepo(name: string, dirPath: string): Promise<Repository> {
  const resolvedPath = path.resolve(dirPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Directory not found: ${resolvedPath}`);
  }

  const hash = computeHash(resolvedPath);

  // Check if already cached with same hash
  for (const [_, repo] of repos) {
    if (repo.hash === hash) {
      return repo;
    }
  }

  const files = scanDirectory(resolvedPath);
  const chunks = chunkFiles(files);
  const projectName = generateProjectName(resolvedPath);

  const repo: Repository = {
    id: uuidv4(),
    name: projectName,
    hash,
    files,
    chunks,
    createdAt: new Date().toISOString(),
  };

  // Build summary
  const summary: RepoSummary = {
    projectName,
    techStack: detectTechStack(files),
    totalFiles: files.length,
    totalLines: getTotalLines(files),
    entryPoints: findEntryPoints(files),
    envVars: findEnvVars(files),
    apiRoutes: findApiRoutes(files),
    folderStructure: buildFolderStructure(files),
  };

  repo.summary = summary;
  repos.set(repo.id, repo);

  return repo;
}

export function getRepo(id: string): Repository | undefined {
  return repos.get(id);
}

export function getSummary(id: string): RepoSummary | undefined {
  return repos.get(id)?.summary;
}

export function listRepos(): { id: string; name: string; createdAt: string; totalFiles: number }[] {
  return [...repos.values()].map(r => ({
    id: r.id,
    name: r.name,
    createdAt: r.createdAt,
    totalFiles: r.files.length,
  }));
}
