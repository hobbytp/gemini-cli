/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContentGenerator } from '../core/contentGenerator.js';
import { OpenAIContentGenerator } from './openai-content-generator.js';

/**
 * LLM提供商枚举
 */
export enum LLMProvider {
  GEMINI = 'gemini',
  OPENAI = 'openai',
  VERTEX_AI = 'vertex-ai',
}

/**
 * 适配器配置接口
 */
export interface AdapterConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  embeddingModel?: string;
  vertexai?: boolean;
  baseUrl?: string;
}

/**
 * 支持的模型映射
 */
export const SUPPORTED_MODELS = {
  [LLMProvider.GEMINI]: [
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
  ],
  [LLMProvider.OPENAI]: [
    'gpt-4',
    'gpt-4-turbo',
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-3.5-turbo',
  ],
  [LLMProvider.VERTEX_AI]: [
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
  ],
};

/**
 * 默认嵌入模型映射
 */
export const DEFAULT_EMBEDDING_MODELS = {
  [LLMProvider.GEMINI]: 'gemini-embedding-001',
  [LLMProvider.OPENAI]: 'text-embedding-ada-002',
  [LLMProvider.VERTEX_AI]: 'gemini-embedding-001',
};

/**
 * 适配器工厂类
 * 负责根据配置创建相应的LLM适配器
 */
export class AdapterFactory {
  /**
   * 创建LLM适配器
   */
  static createAdapter(config: AdapterConfig): ContentGenerator {
    const { provider, apiKey, model, embeddingModel, vertexai, baseUrl } = config;

    // 验证API密钥
    if (!apiKey) {
      throw new Error(`API key is required for ${provider} provider`);
    }

    // 验证模型是否支持
    if (!this.isModelSupported(provider, model)) {
      console.warn(`Model ${model} may not be officially supported for ${provider}`);
    }

    const effectiveEmbeddingModel = embeddingModel || DEFAULT_EMBEDDING_MODELS[provider];

    switch (provider) {
      case LLMProvider.OPENAI:
        return new OpenAIContentGenerator(apiKey, model, effectiveEmbeddingModel);

      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }

  /**
   * 检查模型是否受支持
   */
  static isModelSupported(provider: LLMProvider, model: string): boolean {
    const supportedModels = SUPPORTED_MODELS[provider];
    return supportedModels ? supportedModels.includes(model) : false;
  }

  /**
   * 获取提供商的支持模型列表
   */
  static getSupportedModels(provider: LLMProvider): string[] {
    return SUPPORTED_MODELS[provider] || [];
  }

  /**
   * 从模型名称推断提供商
   */
  static inferProviderFromModel(model: string): LLMProvider | null {
    for (const [provider, models] of Object.entries(SUPPORTED_MODELS)) {
      if (models.includes(model)) {
        return provider as LLMProvider;
      }
    }
    return null;
  }

  /**
   * 获取所有支持的提供商
   */
  static getSupportedProviders(): LLMProvider[] {
    return Object.values(LLMProvider);
  }

  /**
   * 验证配置
   */
  static validateConfig(config: AdapterConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.provider) {
      errors.push('Provider is required');
    }

    if (!config.apiKey) {
      errors.push('API key is required');
    }

    if (!config.model) {
      errors.push('Model is required');
    }

    if (config.provider && !this.getSupportedProviders().includes(config.provider)) {
      errors.push(`Unsupported provider: ${config.provider}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
} 