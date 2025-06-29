/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export {
    DEFAULT_EMBEDDING_MODELS, LLMProvider,
    SUPPORTED_MODELS, type AdapterConfig
} from './adapter-factory.js';
export { OpenAIContentGenerator } from './openai-content-generator.js';
export { createOpenAIContentGenerator } from './simple-factory.js';

