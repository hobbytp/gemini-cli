/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { AdapterFactory, LLMProvider } from './adapter-factory.js';

describe('AdapterFactory', () => {
  describe('validateConfig', () => {
    it('should validate valid OpenAI config', () => {
      const config = {
        provider: LLMProvider.OPENAI,
        apiKey: 'sk-test-key',
        model: 'gpt-4',
      };

      const result = AdapterFactory.validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate valid Gemini config', () => {
      const config = {
        provider: LLMProvider.GEMINI,
        apiKey: 'test-gemini-key',
        model: 'gemini-2.5-pro',
      };

      const result = AdapterFactory.validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject config without API key', () => {
      const config = {
        provider: LLMProvider.OPENAI,
        apiKey: '',
        model: 'gpt-4',
      };

      const result = AdapterFactory.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('API key is required');
    });

    it('should reject config without model', () => {
      const config = {
        provider: LLMProvider.OPENAI,
        apiKey: 'sk-test-key',
        model: '',
      };

      const result = AdapterFactory.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Model is required');
    });
  });

  describe('isModelSupported', () => {
    it('should return true for supported OpenAI models', () => {
      expect(AdapterFactory.isModelSupported(LLMProvider.OPENAI, 'gpt-4')).toBe(true);
      expect(AdapterFactory.isModelSupported(LLMProvider.OPENAI, 'gpt-4o')).toBe(true);
    });

    it('should return true for supported Gemini models', () => {
      expect(AdapterFactory.isModelSupported(LLMProvider.GEMINI, 'gemini-2.5-pro')).toBe(true);
      expect(AdapterFactory.isModelSupported(LLMProvider.GEMINI, 'gemini-2.5-flash')).toBe(true);
    });

    it('should return false for unsupported models', () => {
      expect(AdapterFactory.isModelSupported(LLMProvider.OPENAI, 'unknown-model')).toBe(false);
      expect(AdapterFactory.isModelSupported(LLMProvider.GEMINI, 'unknown-model')).toBe(false);
    });
  });

  describe('inferProviderFromModel', () => {
    it('should infer OpenAI provider from OpenAI models', () => {
      expect(AdapterFactory.inferProviderFromModel('gpt-4')).toBe(LLMProvider.OPENAI);
      expect(AdapterFactory.inferProviderFromModel('gpt-4o')).toBe(LLMProvider.OPENAI);
    });

    it('should infer Gemini provider from Gemini models', () => {
      expect(AdapterFactory.inferProviderFromModel('gemini-2.5-pro')).toBe(LLMProvider.GEMINI);
      expect(AdapterFactory.inferProviderFromModel('gemini-2.5-flash')).toBe(LLMProvider.GEMINI);
    });

    it('should return null for unknown models', () => {
      expect(AdapterFactory.inferProviderFromModel('unknown-model')).toBe(null);
    });
  });

  describe('getSupportedProviders', () => {
    it('should return all supported providers', () => {
      const providers = AdapterFactory.getSupportedProviders();
      expect(providers).toContain(LLMProvider.GEMINI);
      expect(providers).toContain(LLMProvider.OPENAI);
      expect(providers).toContain(LLMProvider.VERTEX_AI);
    });
  });

  describe('getSupportedModels', () => {
    it('should return OpenAI models for OpenAI provider', () => {
      const models = AdapterFactory.getSupportedModels(LLMProvider.OPENAI);
      expect(models).toContain('gpt-4');
      expect(models).toContain('gpt-4o');
      expect(models).toContain('gpt-3.5-turbo');
    });

    it('should return Gemini models for Gemini provider', () => {
      const models = AdapterFactory.getSupportedModels(LLMProvider.GEMINI);
      expect(models).toContain('gemini-2.5-pro');
      expect(models).toContain('gemini-2.5-flash');
    });
  });
}); 