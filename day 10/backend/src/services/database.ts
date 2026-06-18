import { Pool } from 'pg';
import { Repository, FileInfo, CodeChunk, RepoSummary } from '../types';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDb(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS codebase_repos (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        summary JSONB
      );
      CREATE TABLE IF NOT EXISTS codebase_files (
        id UUID PRIMARY KEY,
        repo_id UUID NOT NULL REFERENCES codebase_repos(id) ON DELETE CASCADE,
        path TEXT NOT NULL,
        language TEXT NOT NULL,
        content TEXT NOT NULL,
        size BIGINT NOT NULL,
        functions JSONB DEFAULT '[]',
        classes JSONB DEFAULT '[]',
        imports TEXT[] DEFAULT '{}',
        exports TEXT[] DEFAULT '{}',
        summary TEXT DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS codebase_chunks (
        id UUID PRIMARY KEY,
        repo_id UUID NOT NULL REFERENCES codebase_repos(id) ON DELETE CASCADE,
        file_id UUID NOT NULL,
        file_path TEXT NOT NULL,
        start_line INT NOT NULL,
        end_line INT NOT NULL,
        content TEXT NOT NULL,
        summary TEXT DEFAULT '',
        token_count INT DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_repo_files ON codebase_files(repo_id);
      CREATE INDEX IF NOT EXISTS idx_repo_chunks ON codebase_chunks(repo_id);
    `);
  } finally {
    client.release();
  }
}

export async function saveRepo(repo: Repository): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO codebase_repos (id, name, hash, created_at, summary)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET name = $2, hash = $3, summary = $5`,
      [repo.id, repo.name, repo.hash, repo.createdAt,
       repo.summary ? JSON.stringify(repo.summary) : null]
    );

    for (const file of repo.files) {
      await client.query(
        `INSERT INTO codebase_files (id, repo_id, path, language, content, size, functions, classes, imports, exports, summary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET content = $5, functions = $7, classes = $8, imports = $9, exports = $10, summary = $11`,
        [file.id, repo.id, file.path, file.language, file.content, file.size,
         JSON.stringify(file.functions), JSON.stringify(file.classes),
         file.imports, file.exports, file.summary]
      );
    }

    for (const chunk of repo.chunks) {
      await client.query(
        `INSERT INTO codebase_chunks (id, repo_id, file_id, file_path, start_line, end_line, content, summary, token_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET content = $7, summary = $8, token_count = $9`,
        [chunk.id, repo.id, chunk.fileId, chunk.filePath, chunk.startLine, chunk.endLine,
         chunk.content, chunk.summary, chunk.tokenCount]
      );
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function getRepo(id: string): Promise<Repository | undefined> {
  const client = await pool.connect();
  try {
    const repoResult = await client.query('SELECT * FROM codebase_repos WHERE id = $1', [id]);
    if (repoResult.rows.length === 0) return undefined;

    const row = repoResult.rows[0];
    const filesResult = await client.query(
      'SELECT * FROM codebase_files WHERE repo_id = $1 ORDER BY path', [id]
    );
    const chunksResult = await client.query(
      'SELECT * FROM codebase_chunks WHERE repo_id = $1 ORDER BY file_path, start_line', [id]
    );

    const files: FileInfo[] = filesResult.rows.map(f => ({
      id: f.id,
      path: f.path,
      language: f.language,
      content: f.content,
      size: f.size,
      functions: f.functions || [],
      classes: f.classes || [],
      imports: f.imports || [],
      exports: f.exports || [],
      summary: f.summary || '',
    }));

    const chunks: CodeChunk[] = chunksResult.rows.map(c => ({
      id: c.id,
      fileId: c.file_id,
      filePath: c.file_path,
      startLine: c.start_line,
      endLine: c.end_line,
      content: c.content,
      summary: c.summary || '',
      tokenCount: c.token_count || 0,
    }));

    return {
      id: row.id,
      name: row.name,
      hash: row.hash,
      files,
      chunks,
      summary: row.summary || undefined,
      createdAt: row.created_at,
    };
  } finally {
    client.release();
  }
}

export async function listRepos(): Promise<{ id: string; name: string; createdAt: string; totalFiles: number }[]> {
  const result = await pool.query(
    `SELECT r.id, r.name, r.created_at,
            COUNT(f.id)::int AS total_files
     FROM codebase_repos r
     LEFT JOIN codebase_files f ON f.repo_id = r.id
     GROUP BY r.id, r.name, r.created_at
     ORDER BY r.created_at DESC`
  );
  return result.rows.map(r => ({
    id: r.id,
    name: r.name,
    createdAt: r.created_at,
    totalFiles: r.total_files,
  }));
}

export async function deleteRepo(id: string): Promise<void> {
  await pool.query('DELETE FROM codebase_repos WHERE id = $1', [id]);
}
