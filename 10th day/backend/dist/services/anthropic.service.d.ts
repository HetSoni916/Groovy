export declare class GroqService {
    generateResponse(systemPrompt: string, context: string, question: string): Promise<{
        answer: string;
        usage: {
            inputTokens: number;
            outputTokens: number;
            totalTokens: number;
            cost: number;
            latencyMs: number;
            model: string;
        };
    }>;
}
export declare const groqService: GroqService;
//# sourceMappingURL=anthropic.service.d.ts.map