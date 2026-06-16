import { AIProvider, ChatMessage } from '../types';
export declare class CohereProvider implements AIProvider {
    private apiKey;
    constructor();
    generateResponse(messages: ChatMessage[]): Promise<string>;
}
//# sourceMappingURL=cohere.d.ts.map