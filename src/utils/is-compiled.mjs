import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Determine if running from compiled binary
// In compiled binary, process.argv[1] will not end with .mjs
// and __dirname will point to binary location, not source
const isCompiled = !process.argv[1].endsWith('.mjs');

export { isCompiled };

export function detectMode() {
    return {
        isCompiled,
        isSource: !isCompiled,
    };
}

// Helper to determine public directory path
export function getPublicDir() {
    if (isCompiled) {
        // Assets are embedded, return null
        return null;
    } else {
        // Running from source, use filesystem
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        return path.join(__dirname, '..', 'public');
    }
}
