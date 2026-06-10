import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourceRoots = ['app', 'resources/js', 'routes'];
const ignoredDirectories = new Set(['node_modules', 'vendor', 'public', 'storage', 'bootstrap', '.git']);
const checkedExtensions = new Set(['.php', '.ts', '.tsx', '.js', '.jsx']);
const defaultThreshold = 350;
const thresholdArg = process.argv.find((arg) => arg.startsWith('--threshold='));
const threshold = thresholdArg ? Number(thresholdArg.split('=')[1]) : defaultThreshold;
const strict = process.argv.includes('--strict');

function walk(directory, files = []) {
    for (const entry of readdirSync(directory)) {
        const fullPath = path.join(directory, entry);
        const relativePath = path.relative(root, fullPath);
        const stats = statSync(fullPath);

        if (stats.isDirectory()) {
            if (!ignoredDirectories.has(entry)) {
                walk(fullPath, files);
            }

            continue;
        }

        if (checkedExtensions.has(path.extname(entry))) {
            files.push(relativePath);
        }
    }

    return files;
}

const rows = sourceRoots
    .flatMap((sourceRoot) => walk(path.join(root, sourceRoot)))
    .map((file) => ({
        file,
        lines: readFileSync(path.join(root, file), 'utf8').split(/\r\n|\r|\n/).length,
    }))
    .sort((first, second) => second.lines - first.lines);
const oversized = rows.filter((row) => row.lines > threshold);

console.log(`Checked ${rows.length} source files. Threshold: ${threshold} lines.`);
console.table(rows.slice(0, 20));

if (oversized.length > 0) {
    console.log(`\nFiles over ${threshold} lines:`);
    console.table(oversized);

    if (strict) {
        process.exitCode = 1;
    }
}
