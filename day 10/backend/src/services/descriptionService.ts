import { Repository } from '../types';
import { GroqProvider } from '../providers/groq';

const descriptionCache = new Map<string, { description: string; timestamp: number }>();
const CACHE_TTL = 3600000;

export async function generateProjectDescription(repo: Repository): Promise<string> {
  const cached = descriptionCache.get(repo.id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.description;
  }

  const fileList = repo.files.map(f => f.path).join('\n');
  const prompt = `You are a codebase analyzer. Given the following file list from a project named "${repo.name}", describe what this project does in 2-3 sentences. Focus on its functionality and purpose, not just the tech stack. Be concise.

Files:
${fileList}

Project name: ${repo.name}

Description:`;

  try {
    const provider = new GroqProvider();
    const description = await provider.generateResponse([
      { role: 'system', content: 'You are a codebase analyzer. Describe what the project does briefly.' },
      { role: 'user', content: prompt },
    ]);

    const cleanDesc = description.trim();
    descriptionCache.set(repo.id, { description: cleanDesc, timestamp: Date.now() });
    return cleanDesc;
  } catch {
    const fallback = generateFallbackDescription(repo);
    descriptionCache.set(repo.id, { description: fallback, timestamp: Date.now() });
    return fallback;
  }
}

function generateFallbackDescription(repo: Repository): string {
  const fileCount = repo.files.length;
  const hasFrontend = repo.files.some(f => /\.(tsx|jsx|vue|svelte|html)$/i.test(f.path));
  const hasBackend = repo.files.some(f => /server\.(ts|js)|app\.(ts|js)|routes?\/|controllers?\//i.test(f.path));
  const hasTests = repo.files.some(f => /__tests__|\.test\.|\.spec\.|test_/i.test(f.path));
  const hasDatabase = repo.files.some(f => /\.sql$|prisma|schema|migrations/i.test(f.path));

  const parts = [`${repo.name}`];
  if (hasFrontend && hasBackend) parts.push('full-stack application');
  else if (hasFrontend) parts.push('frontend application');
  else if (hasBackend) parts.push('backend application');
  else parts.push('project');

  parts.push(`with ${fileCount} files`);
  if (hasTests) parts.push('including tests');
  if (hasDatabase) parts.push('and database support');

  return parts.join(' ') + '.';
}
