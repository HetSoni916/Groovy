"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStructuredOutput = generateStructuredOutput;
const openai_1 = __importDefault(require("openai"));
const env_1 = require("../config/env");
const cost_1 = require("../utils/cost");
const logger_1 = require("../utils/logger");
const client = new openai_1.default({ apiKey: env_1.env.OPENAI_API_KEY });
async function generateStructuredOutput(args) {
    const response = await client.responses.create({
        model: env_1.env.OPENAI_MODEL,
        input: args.prompt,
        text: {
            format: {
                type: 'json_schema',
                name: args.name,
                strict: true,
                schema: args.schema,
            },
        },
    });
    const rawText = response.output_text;
    if (!rawText) {
        throw new Error('The LLM returned an empty response.');
    }
    let data;
    try {
        data = JSON.parse(rawText);
    }
    catch (error) {
        logger_1.logger.error('llm.invalid_json', { name: args.name, rawText, error: String(error) });
        throw new Error('The LLM returned malformed structured data.');
    }
    const inputTokens = response.usage?.input_tokens ?? 0;
    const outputTokens = response.usage?.output_tokens ?? 0;
    const estimatedCost = (0, cost_1.estimateCost)(env_1.env.OPENAI_MODEL, inputTokens, outputTokens);
    logger_1.logger.info('llm.response', { model: env_1.env.OPENAI_MODEL, name: args.name, inputTokens, outputTokens, estimatedCost });
    return { data, usage: { inputTokens, outputTokens, estimatedCost } };
}
//# sourceMappingURL=client.js.map