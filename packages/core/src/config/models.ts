/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-pro';
export const DEFAULT_GEMINI_FLASH_MODEL = 'gemini-2.5-flash';
export const DEFAULT_GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001';

// OpenAI模型配置
export const DEFAULT_OPENAI_MODEL = 'gpt-4';
export const DEFAULT_OPENAI_EMBEDDING_MODEL = 'text-embedding-ada-002';

// 模型映射 - 根据认证类型确定默认模型
export const DEFAULT_MODELS_BY_AUTH_TYPE = {
  'oauth-personal': DEFAULT_GEMINI_MODEL,
  'gemini-api-key': DEFAULT_GEMINI_MODEL,
  'vertex-ai': DEFAULT_GEMINI_MODEL,
  'openai-api-key': DEFAULT_OPENAI_MODEL,
} as const;
