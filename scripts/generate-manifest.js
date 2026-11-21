'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'manifest.json');

const SKIP_DIR = new Set(['.git', 'logs', 'scripts', 'skills']);
const SKIP_FILE = new Set([
    'module.config.json',
    '.gitignore',
    '.gitattributes',
    'manifest.json',
]);
const NO_OVERWRITE = new Set(['config.json', 'skills.json']);

function sha256(filePath) {
    const raw = fs.readFileSync(filePath);
    // UTF-16 / binary skill dumps: hash the exact bytes GitHub raw serves.
    if (raw.includes(0)) {
        return crypto.createHash('sha256').update(raw).digest('hex');
    }
    // UTF-8 text: GitHub raw + gitattributes serve LF.
    const normalized = Buffer.from(raw.toString('utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n'), 'utf8');
    return crypto.createHash('sha256').update(normalized).digest('hex');
}

function walk(dir, relBase = '') {
    const out = [];
    for (const name of fs.readdirSync(dir).sort()) {
        if (SKIP_DIR.has(name) || SKIP_FILE.has(name)) continue;
        const full = path.join(dir, name);
        const rel = relBase ? `${relBase}/${name}` : name;
        if (fs.statSync(full).isDirectory()) {
            out.push(...walk(full, rel));
        } else {
            out.push(rel);
        }
    }
    return out;
}

const files = {};
for (const rel of walk(ROOT)) {
    const hash = sha256(path.join(ROOT, rel.split('/').join(path.sep)));
    files[rel] = NO_OVERWRITE.has(rel) ? { overwrite: false, hash } : hash;
}

fs.writeFileSync(OUT, JSON.stringify({ files }, null, 4).replace(/\r\n/g, '\n') + '\n');
console.log(`Wrote ${path.relative(process.cwd(), OUT)} (${Object.keys(files).length} files)`);
