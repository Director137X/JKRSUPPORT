import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const COACH_MODEL = 'claude-sonnet-4-5';

export { COACH_SYSTEM_PROMPT, MODULE_TITLES } from './coach-prompt';
