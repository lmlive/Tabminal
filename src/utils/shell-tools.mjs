import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { getAssetContent } from '../assets/generated.mjs';

let extractedPath = null;

export function ensureShellTools() {
    if (extractedPath && fs.existsSync(extractedPath)) {
        return extractedPath;
    }

    // Check if we have embedded shell tools
    const terminalVerContent = getAssetContent('shell/terminal_ver');
    if (!terminalVerContent) {
        // No embedded shell tools, use filesystem
        return path.join(process.cwd(), 'shell');
    }

    // Extract shell tools to temp directory
    extractedPath = path.join(os.tmpdir(), `tabminal-shell-${process.pid}`);
    fs.mkdirSync(extractedPath, { recursive: true });

    // Extract all shell tools
    const shellKeys = [
        'shell/terminal_ver',
    ];

    for (const key of shellKeys) {
        const content = getAssetContent(key);
        if (content) {
            const fileName = key.replace('shell/', '');
            const filePath = path.join(extractedPath, fileName);
            fs.writeFileSync(filePath, content, { mode: 0o755 });
        }
    }

    console.log(`[ShellTools] Extracted to: ${extractedPath}`);
    return extractedPath;
}

export function cleanupShellTools() {
    if (extractedPath && fs.existsSync(extractedPath)) {
        try {
            fs.rmSync(extractedPath, { recursive: true, force: true });
            console.log(`[ShellTools] Cleaned up: ${extractedPath}`);
        } catch (e) {
            console.warn(`[ShellTools] Failed to clean up: ${e.message}`);
        }
    }
}
