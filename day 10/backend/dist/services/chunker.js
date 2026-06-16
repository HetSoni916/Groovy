"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chunkFiles = chunkFiles;
const uuid_1 = require("uuid");
const tokenizer_1 = require("../utils/tokenizer");
const MAX_CHUNK_LINES = 100;
function generateChunkSummary(content) {
    const lines = content.split('\n').filter(l => l.trim());
    const firstLines = lines.slice(0, 3).join(' ').trim();
    return firstLines.substring(0, 150) || content.substring(0, 150);
}
function chunkFiles(files) {
    const chunks = [];
    for (const file of files) {
        const lines = file.content.split('\n');
        const boundaries = [];
        // Collect function and class boundaries
        for (const fn of file.functions) {
            boundaries.push({ start: fn.startLine, end: fn.endLine, type: 'function', name: fn.name });
        }
        for (const cls of file.classes) {
            boundaries.push({ start: cls.startLine, end: cls.endLine, type: 'class', name: cls.name });
            if (cls.methods.length > 0) {
                // Try to split class methods into sub-chunks
                // But keep smaller classes whole
            }
        }
        if (boundaries.length === 0) {
            // No functions/classes - split by lines
            for (let i = 0; i < lines.length; i += MAX_CHUNK_LINES) {
                const end = Math.min(i + MAX_CHUNK_LINES, lines.length);
                const content = lines.slice(i, end).join('\n');
                chunks.push({
                    id: (0, uuid_1.v4)(),
                    fileId: file.id,
                    filePath: file.path,
                    startLine: i + 1,
                    endLine: end,
                    content,
                    summary: generateChunkSummary(content),
                    tokenCount: (0, tokenizer_1.countTokens)(content),
                });
            }
        }
        else {
            // Sort boundaries by start
            boundaries.sort((a, b) => a.start - b.start);
            // Merge overlapping/nested boundaries
            const merged = [];
            for (const b of boundaries) {
                if (merged.length === 0) {
                    merged.push({ start: b.start, end: b.end });
                }
                else {
                    const last = merged[merged.length - 1];
                    if (b.start <= last.end + 1) {
                        last.end = Math.max(last.end, b.end);
                    }
                    else {
                        merged.push({ start: b.start, end: b.end });
                    }
                }
            }
            // Create chunks for non-boundary gaps and boundary regions
            let prevEnd = 0;
            for (const region of merged) {
                // Gap before this region
                if (region.start - 1 > prevEnd) {
                    const gapLines = lines.slice(prevEnd, region.start - 1);
                    if (gapLines.length > 0) {
                        const gapContent = gapLines.join('\n');
                        if (gapContent.trim()) {
                            chunks.push({
                                id: (0, uuid_1.v4)(),
                                fileId: file.id,
                                filePath: file.path,
                                startLine: prevEnd + 1,
                                endLine: region.start - 1,
                                content: gapContent,
                                summary: generateChunkSummary(gapContent),
                                tokenCount: (0, tokenizer_1.countTokens)(gapContent),
                            });
                        }
                    }
                }
                // The region itself
                const regionLines = lines.slice(region.start - 1, region.end);
                const regionContent = regionLines.join('\n');
                // If region is very large, sub-chunk it
                if (regionLines.length > MAX_CHUNK_LINES) {
                    for (let i = 0; i < regionLines.length; i += MAX_CHUNK_LINES) {
                        const subEnd = Math.min(i + MAX_CHUNK_LINES, regionLines.length);
                        const subContent = regionLines.slice(i, subEnd).join('\n');
                        chunks.push({
                            id: (0, uuid_1.v4)(),
                            fileId: file.id,
                            filePath: file.path,
                            startLine: region.start + i,
                            endLine: region.start + subEnd - 1,
                            content: subContent,
                            summary: generateChunkSummary(subContent),
                            tokenCount: (0, tokenizer_1.countTokens)(subContent),
                        });
                    }
                }
                else {
                    chunks.push({
                        id: (0, uuid_1.v4)(),
                        fileId: file.id,
                        filePath: file.path,
                        startLine: region.start,
                        endLine: region.end,
                        content: regionContent,
                        summary: generateChunkSummary(regionContent),
                        tokenCount: (0, tokenizer_1.countTokens)(regionContent),
                    });
                }
                prevEnd = region.end;
            }
            // Trailing gap
            if (prevEnd < lines.length) {
                const gapLines = lines.slice(prevEnd);
                if (gapLines.length > 0) {
                    const gapContent = gapLines.join('\n');
                    if (gapContent.trim()) {
                        chunks.push({
                            id: (0, uuid_1.v4)(),
                            fileId: file.id,
                            filePath: file.path,
                            startLine: prevEnd + 1,
                            endLine: lines.length,
                            content: gapContent,
                            summary: generateChunkSummary(gapContent),
                            tokenCount: (0, tokenizer_1.countTokens)(gapContent),
                        });
                    }
                }
            }
        }
    }
    return chunks;
}
//# sourceMappingURL=chunker.js.map