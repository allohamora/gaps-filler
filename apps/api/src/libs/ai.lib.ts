import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { GEMINI_API_KEY } from 'src/config.js';

export const model = createGoogleGenerativeAI({ apiKey: GEMINI_API_KEY })('gemini-2.5-flash');
