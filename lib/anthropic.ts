import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const COACH_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307';

export { COACH_SYSTEM_PROMPT, MODULE_TITLES } from './coach-prompt';
