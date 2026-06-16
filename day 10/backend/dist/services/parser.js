"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanDirectory = scanDirectory;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const IGNORE_DIRS = new Set(['node_modules', 'dist', 'build', '.git', '__pycache__', '.next', '.nuxt', 'target', 'venv', '.venv']);
const IGNORE_FILES = new Set(['.env', '.env.local', '.env.production']);
const BINARY_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg', '.webp', '.mp4', '.avi', '.mov', '.mkv', '.mp3', '.wav', '.ogg', '.flac', '.woff', '.woff2', '.ttf', '.eot', '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z', '.exe', '.dll', '.so', '.dylib', '.pyc', '.o', '.a', '.lib', '.obj']);
const EXT_LANG_MAP = {
    '.js': 'javascript', '.jsx': 'javascript', '.ts': 'typescript', '.tsx': 'typescript',
    '.py': 'python', '.java': 'java',
    '.cpp': 'cpp', '.hpp': 'cpp', '.c': 'cpp', '.h': 'cpp', '.cc': 'cpp', '.cxx': 'cpp',
    '.html': 'html', '.htm': 'html',
    '.css': 'css', '.scss': 'css', '.less': 'css',
    '.json': 'json', '.yaml': 'yaml', '.yml': 'yaml',
    '.md': 'markdown', '.mdx': 'markdown',
    '.sql': 'sql', '.rb': 'ruby', '.go': 'go', '.rs': 'rust', '.swift': 'swift', '.kt': 'kotlin',
    '.sh': 'bash', '.bash': 'bash', '.zsh': 'bash',
    '.xml': 'xml', '.toml': 'toml', '.ini': 'ini', '.cfg': 'ini',
    '.vue': 'vue', '.svelte': 'svelte', '.astro': 'astro',
};
function isBinaryFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (BINARY_EXTS.has(ext))
        return true;
    try {
        const buffer = fs.readFileSync(filePath);
        const head = buffer.slice(0, 8192);
        return head.includes(0);
    }
    catch {
        return true;
    }
}
function extractJSTS(content, lines) {
    const functions = [];
    const classes = [];
    const imports = [];
    const exports = [];
    const funcRegex = /(?:async\s+)?function\s+(\w+)|(\w+)\s*=\s*(?:async\s+)?(?:function|\(|=>)/g;
    const classRegex = /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/g;
    const importRegex = /(?:import\s+.*?from\s+['"])([^'"]+)/g;
    const exportRegex = /export\s+(default\s+)?(?:const|let|var|function|class|type|interface)\s+(\w+)/g;
    let m;
    while ((m = funcRegex.exec(content)) !== null) {
        const name = m[1] || m[2];
        const lineNum = content.substring(0, m.index).split('\n').length;
        functions.push({ name, startLine: lineNum, endLine: findBlockEnd(lines, lineNum) });
    }
    while ((m = classRegex.exec(content)) !== null) {
        const name = m[1];
        const startLine = content.substring(0, m.index).split('\n').length;
        const endLine = findBlockEnd(lines, startLine);
        const methods = extractMethods(content, startLine, endLine);
        classes.push({ name, startLine, endLine, methods });
    }
    while ((m = importRegex.exec(content)) !== null) {
        imports.push(m[1]);
    }
    // Handle static imports like `import foo from 'bar'` already handled above
    // Also handle dynamic imports
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((m = dynamicImportRegex.exec(content)) !== null) {
        imports.push(m[1]);
    }
    while ((m = exportRegex.exec(content)) !== null) {
        const name = m[2];
        if (m[1])
            exports.push(`default ${name}`);
        else
            exports.push(name);
    }
    return { functions, classes, imports: [...new Set(imports)], exports: [...new Set(exports)] };
}
function extractPython(content, lines) {
    const functions = [];
    const classes = [];
    const imports = [];
    const exports = [];
    const funcRegex = /(?:async\s+)?def\s+(\w+)\s*\(/g;
    const classRegex = /(?:class\s+(\w+))/g;
    const importRegex = /(?:import\s+(\S+)|from\s+(\S+)\s+import)/g;
    const allRegex = /__all__\s*=\s*\[([^\]]+)\]/g;
    let m;
    while ((m = funcRegex.exec(content)) !== null) {
        const name = m[1];
        const startLine = content.substring(0, m.index).split('\n').length;
        functions.push({ name, startLine, endLine: findPythonBlockEnd(lines, startLine) });
    }
    while ((m = classRegex.exec(content)) !== null) {
        const name = m[1];
        const startLine = content.substring(0, m.index).split('\n').length;
        const endLine = findPythonBlockEnd(lines, startLine);
        const methods = extractPythonMethods(content, startLine, endLine);
        classes.push({ name, startLine, endLine, methods });
    }
    while ((m = importRegex.exec(content)) !== null) {
        imports.push(m[1] || m[2]);
    }
    while ((m = allRegex.exec(content)) !== null) {
        const items = m[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
        exports.push(...items);
    }
    return { functions, classes, imports: [...new Set(imports)], exports: [...new Set(exports)] };
}
function extractJava(content, lines) {
    const functions = [];
    const classes = [];
    const imports = [];
    const exports = [];
    const funcRegex = /(?:public|private|protected|static)?\s*(?:public|private|protected|static)?\s+\w+\s+(\w+)\s*\(/g;
    const classRegex = /(?:public|private|protected)?\s*(?:abstract|final)?\s*class\s+(\w+)/g;
    const importRegex = /import\s+(?:static\s+)?(\S+);/g;
    let m;
    while ((m = funcRegex.exec(content)) !== null) {
        const name = m[1];
        const startLine = content.substring(0, m.index).split('\n').length;
        functions.push({ name, startLine, endLine: findBlockEnd(lines, startLine) });
    }
    while ((m = classRegex.exec(content)) !== null) {
        const name = m[1];
        const startLine = content.substring(0, m.index).split('\n').length;
        const endLine = findBlockEnd(lines, startLine);
        const methods = extractMethods(content, startLine, endLine);
        classes.push({ name, startLine, endLine, methods });
    }
    while ((m = importRegex.exec(content)) !== null) {
        imports.push(m[1]);
    }
    return { functions, classes, imports: [...new Set(imports)], exports: [...new Set(exports)] };
}
function extractCPP(content, lines) {
    const functions = [];
    const classes = [];
    const imports = [];
    const exports = [];
    const funcRegex = /(\w+)\s*\([^)]*\)\s*(?:const\s*)?(?:{|;)/g;
    const classRegex = /(?:class|struct)\s+(\w+)/g;
    const includeRegex = /#include\s+[<"]([^>"]+)[>"]/g;
    let m;
    while ((m = funcRegex.exec(content)) !== null) {
        const name = m[1];
        if (name === 'if' || name === 'for' || name === 'while' || name === 'switch' || name === 'catch')
            continue;
        const startLine = content.substring(0, m.index).split('\n').length;
        functions.push({ name, startLine, endLine: findBlockEnd(lines, startLine) });
    }
    while ((m = classRegex.exec(content)) !== null) {
        const name = m[1];
        const startLine = content.substring(0, m.index).split('\n').length;
        const endLine = findBlockEnd(lines, startLine);
        classes.push({ name, startLine, endLine, methods: [] });
    }
    while ((m = includeRegex.exec(content)) !== null) {
        imports.push(m[1]);
    }
    return { functions, classes, imports: [...new Set(imports)], exports: [...new Set(exports)] };
}
function findBlockEnd(lines, startLine) {
    let depth = 0;
    let found = false;
    for (let i = startLine - 1; i < lines.length; i++) {
        const line = lines[i];
        for (const ch of line) {
            if (ch === '{') {
                depth++;
                found = true;
            }
            else if (ch === '}') {
                depth--;
            }
        }
        if (found && depth <= 0)
            return i + 1;
    }
    return lines.length;
}
function findPythonBlockEnd(lines, startLine) {
    const baseIndent = lines[startLine - 1]?.search(/\S/) ?? 0;
    for (let i = startLine; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed === '' || trimmed.startsWith('#'))
            continue;
        const indent = lines[i].search(/\S/);
        if (indent <= baseIndent && trimmed !== '')
            return i;
    }
    return lines.length;
}
function extractMethods(content, startLine, endLine) {
    const methods = [];
    const block = content.split('\n').slice(startLine - 1, endLine).join('\n');
    const methodRegex = /(?:public|private|protected|static)?\s*(?:public|private|protected|static)?\s+\w+\s+(\w+)\s*\(/g;
    let m;
    while ((m = methodRegex.exec(block)) !== null) {
        if (m[1] && m[1] !== 'class' && m[1] !== 'function')
            methods.push(m[1]);
    }
    return methods;
}
function extractPythonMethods(content, startLine, endLine) {
    const methods = [];
    const block = content.split('\n').slice(startLine - 1, endLine);
    for (const line of block) {
        const m = line.match(/^\s+def\s+(\w+)\s*\(/);
        if (m)
            methods.push(m[1]);
    }
    return methods;
}
function generateSummary(content, language) {
    const lines = content.split('\n');
    // Try comment block at top
    if (language === 'javascript' || language === 'typescript' || language === 'java' || language === 'cpp') {
        if (lines[0]?.trim().startsWith('/**') || lines[0]?.trim().startsWith('/*')) {
            const commentLines = [];
            for (const line of lines) {
                if (line.trim().startsWith('*/'))
                    break;
                if (line.trim().startsWith('*'))
                    commentLines.push(line.replace(/^\s*\*\s?/, ''));
                else if (line.trim().startsWith('/*'))
                    commentLines.push(line.replace(/^\s*\/\*\*?\s?/, ''));
            }
            if (commentLines.length > 0)
                return commentLines.join(' ').trim().substring(0, 200);
        }
        if (lines[0]?.trim().startsWith('//')) {
            const commentLines = [];
            for (const line of lines) {
                if (!line.trim().startsWith('//'))
                    break;
                commentLines.push(line.replace(/^\s*\/\/\s?/, ''));
            }
            if (commentLines.length > 0)
                return commentLines.join(' ').trim().substring(0, 200);
        }
    }
    if (language === 'python') {
        if ((lines[0]?.trim().startsWith('"""') || lines[0]?.trim().startsWith("'''"))) {
            const quote = lines[0].trim().slice(0, 3);
            const commentLines = [];
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim().startsWith(quote))
                    break;
                commentLines.push(lines[i].trim());
            }
            if (commentLines.length > 0)
                return commentLines.join(' ').substring(0, 200);
        }
        if (lines[0]?.trim().startsWith('#')) {
            const commentLines = [];
            for (const line of lines) {
                if (!line.trim().startsWith('#'))
                    break;
                commentLines.push(line.replace(/^\s*#\s?/, ''));
            }
            if (commentLines.length > 0)
                return commentLines.join(' ').substring(0, 200);
        }
    }
    // Fallback: first 200 non-empty chars
    const nonEmpty = lines.filter(l => l.trim()).slice(0, 5).join(' ').trim();
    return nonEmpty.substring(0, 200);
}
function scanDirectory(dirPath) {
    const files = [];
    function walk(dir) {
        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        }
        catch {
            return;
        }
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (!IGNORE_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
                    walk(fullPath);
                }
                continue;
            }
            if (IGNORE_FILES.has(entry.name))
                continue;
            const ext = path.extname(entry.name).toLowerCase();
            const language = EXT_LANG_MAP[ext];
            if (!language)
                continue;
            if (isBinaryFile(fullPath))
                continue;
            let content;
            try {
                content = fs.readFileSync(fullPath, 'utf-8');
            }
            catch {
                continue;
            }
            const stat = fs.statSync(fullPath);
            const lines = content.split('\n');
            let functions = [];
            let classes = [];
            let imports = [];
            let exports = [];
            if (language === 'javascript' || language === 'typescript') {
                const parsed = extractJSTS(content, lines);
                functions = parsed.functions;
                classes = parsed.classes;
                imports = parsed.imports;
                exports = parsed.exports;
            }
            else if (language === 'python') {
                const parsed = extractPython(content, lines);
                functions = parsed.functions;
                classes = parsed.classes;
                imports = parsed.imports;
                exports = parsed.exports;
            }
            else if (language === 'java') {
                const parsed = extractJava(content, lines);
                functions = parsed.functions;
                classes = parsed.classes;
                imports = parsed.imports;
                exports = parsed.exports;
            }
            else if (language === 'cpp') {
                const parsed = extractCPP(content, lines);
                functions = parsed.functions;
                classes = parsed.classes;
                imports = parsed.imports;
                exports = parsed.exports;
            }
            const summary = generateSummary(content, language);
            const relativePath = path.relative(dirPath, fullPath);
            files.push({
                id: (0, uuid_1.v4)(),
                path: relativePath,
                language,
                content,
                size: stat.size,
                functions,
                classes,
                imports,
                exports,
                summary,
            });
        }
    }
    walk(dirPath);
    return files;
}
//# sourceMappingURL=parser.js.map