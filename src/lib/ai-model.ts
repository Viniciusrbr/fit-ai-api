import { createGroq } from '@ai-sdk/groq';
import { createOpenRouter, type LanguageModelV4 } from '@openrouter/ai-sdk-provider';
import { APICallError, type LanguageModelMiddleware, wrapLanguageModel } from 'ai';
import { env } from '@/env';

const groq = createGroq({ apiKey: env.GROQ_API_KEY });
const openrouter = createOpenRouter({ apiKey: env.OPENROUTER_API_KEY });

// Redireciona pro fallback só quando for rate limit (429)
const createFallbackMiddleware = (fallback: LanguageModelV4): LanguageModelMiddleware => {
	const isRateLimit = (error: unknown) =>
		APICallError.isInstance(error) && error.statusCode === 429;

	return {
		wrapStream: async ({ doStream, params }) => {
			try {
				return await doStream();
			} catch (error) {
				if (isRateLimit(error)) {
					console.warn('[ai] Groq 429 — caindo pro OpenRouter');
					return fallback.doStream(params);
				}
				throw error;
			}
		},
		// mesmo tratamento pro caso non-streaming (generateText/generateObject)
		wrapGenerate: async ({ doGenerate, params }) => {
			try {
				return await doGenerate();
			} catch (error) {
				if (isRateLimit(error)) {
					console.warn('[ai] Groq 429 — caindo pro OpenRouter');
					return fallback.doGenerate(params);
				}
				throw error;
			}
		},
	};
};

export const coachModel = wrapLanguageModel({
	model: groq('llama-3.3-70b-versatile'),
	middleware: createFallbackMiddleware(openrouter('meta-llama/llama-3.3-70b-instruct:free')),
});
