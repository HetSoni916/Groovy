"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStore = void 0;
class VectorStore {
    constructor() {
        this.chunks = new Map();
        this.termFreqs = new Map();
        this.idf = new Map();
        this.dirty = true;
    }
    addChunk(id, text, metadata) {
        this.chunks.set(id, { id, text, metadata });
        const tf = new Map();
        const terms = this.tokenize(text);
        for (const term of terms) {
            tf.set(term, (tf.get(term) || 0) + 1);
        }
        const norm = Math.sqrt(terms.length) || 1;
        for (const [term, count] of tf) {
            tf.set(term, count / norm);
        }
        this.termFreqs.set(id, tf);
        this.dirty = true;
    }
    clear() {
        this.chunks.clear();
        this.termFreqs.clear();
        this.idf.clear();
        this.dirty = true;
    }
    rebuildIndex() {
        const n = this.chunks.size;
        if (n === 0)
            return;
        const docFreq = new Map();
        for (const [_, tf] of this.termFreqs) {
            for (const term of tf.keys()) {
                docFreq.set(term, (docFreq.get(term) || 0) + 1);
            }
        }
        for (const [term, df] of docFreq) {
            this.idf.set(term, Math.log((n + 1) / (df + 1)) + 1);
        }
        this.dirty = false;
    }
    search(query, topK) {
        if (this.dirty)
            this.rebuildIndex();
        if (this.chunks.size === 0)
            return [];
        const queryTerms = this.tokenize(query);
        const queryVec = new Map();
        const qNorm = Math.sqrt(queryTerms.length) || 1;
        for (const term of queryTerms) {
            queryVec.set(term, ((queryVec.get(term) || 0) + 1) / qNorm);
        }
        const scores = [];
        for (const [id, tf] of this.termFreqs) {
            let dot = 0;
            for (const [term, qtf] of queryVec) {
                const dtf = tf.get(term) || 0;
                const idfVal = this.idf.get(term) || 1;
                dot += qtf * dtf * idfVal;
            }
            let queryMag = 0;
            for (const qtf of queryVec.values()) {
                queryMag += qtf * qtf;
            }
            let docMag = 0;
            for (const dtf of tf.values()) {
                docMag += dtf * dtf;
            }
            const denom = Math.sqrt(queryMag) * Math.sqrt(docMag);
            const score = denom > 0 ? dot / denom : 0;
            if (score > 0) {
                scores.push({ id, score });
            }
        }
        scores.sort((a, b) => b.score - a.score);
        const top = scores.slice(0, topK);
        return top.map(s => ({
            chunk: this.chunks.get(s.id).metadata,
            score: s.score,
        }));
    }
    get size() {
        return this.chunks.size;
    }
    tokenize(text) {
        const cleaned = text.toLowerCase().replace(/[^a-z0-9\s_]/g, ' ');
        const tokens = cleaned.split(/\s+/).filter(t => t.length > 1 && t.length <= 50);
        const stopWords = new Set([
            'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
            'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
            'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
            'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
            'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
            'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
            'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
            'just', 'because', 'but', 'and', 'or', 'if', 'while', 'that', 'this',
            'these', 'those', 'it', 'its', 'what', 'which', 'who', 'whom',
            'about', 'up', 'down', 'like', 'also', 'get', 'got', 'gotten',
            'make', 'made', 'let', 'us', 'one', 'two', 'new', 'return', 'import',
            'export', 'function', 'class', 'const', 'let', 'var', 'def',
        ]);
        return tokens.filter(t => !stopWords.has(t));
    }
}
exports.VectorStore = VectorStore;
//# sourceMappingURL=vectorStore.js.map