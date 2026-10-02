import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');
const html = await readFile(path.join(distDir, 'index.html'), 'utf8');
const entryMatch = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/);

if (!entryMatch) throw new Error('Could not find the production entry script in dist/index.html');

const entryPath = path.join(distDir, entryMatch[1].replace(/^\//, ''));
const entryBytes = (await stat(entryPath)).size;
const entryLimitBytes = 500 * 1024;
if (entryBytes >= entryLimitBytes) {
  throw new Error(`Entry script is ${(entryBytes / 1024).toFixed(1)} KiB; expected under 500 KiB`);
}

const files = await readdir(path.join(distDir, 'assets'));
const requiredChunks = ['OmskApp', 'SpbApp', 'OmskAdmin', 'SpbAdmin', 'AdminPage'];
const missingChunks = requiredChunks.filter(name => !files.some(file => file.startsWith(`${name}-`) && file.endsWith('.js')));
if (missingChunks.length > 0) throw new Error(`Missing lazy route chunks: ${missingChunks.join(', ')}`);

const sourceMaps = files.filter(file => file.endsWith('.map'));
if (sourceMaps.length > 0) throw new Error(`Unexpected source maps in production output: ${sourceMaps.join(', ')}`);

console.log(`Build output OK: entry script ${(entryBytes / 1024).toFixed(1)} KiB; ${requiredChunks.length} lazy route chunks; no source maps.`);
