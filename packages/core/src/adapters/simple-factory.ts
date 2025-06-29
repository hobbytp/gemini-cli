/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContentGenerator } from '../core/contentGenerator.js';
import { OpenAIContentGenerator } from './openai-content-generator.js';

/**
 * 创建OpenAI内容生成器
 */
export function createOpenAIContentGenerator(
  apiKey: string, 
  model: string = 'gpt-4',
  embeddingModel: string = 'text-embedding-ada-002',
  baseURL?: string
): ContentGenerator {
  return new OpenAIContentGenerator(apiKey, model, embeddingModel, baseURL);
} 