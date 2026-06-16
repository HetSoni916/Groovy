import { AIProvider, ChatMessage } from '../types';
export declare class GroqProvider implements AIProvider {
    private apiKey;
    private apiUrl;
    constructor();
    generateResponse(messages: ChatMessage[]): Promise<string>;
}
//# sourceMappingURL=groq.d.ts.map