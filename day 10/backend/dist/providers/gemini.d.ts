import { AIProvider, ChatMessage } from '../types';
export declare class GeminiProvider implements AIProvider {
    private apiKey;
    constructor();
    generateResponse(messages: ChatMessage[]): Promise<string>;
}
//# sourceMappingURL=gemini.d.ts.map