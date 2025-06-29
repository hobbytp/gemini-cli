/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    Candidate,
    ContentUnion,
    CountTokensParameters,
    CountTokensResponse,
    EmbedContentParameters,
    EmbedContentResponse,
    GenerateContentParameters,
    GenerateContentResponse,
} from '@google/genai';
import OpenAI from 'openai';
import { ContentGenerator } from '../core/contentGenerator.js';

/**
 * OpenAI内容生成器
 * 实现ContentGenerator接口，提供与OpenAI API的集成
 */
export class OpenAIContentGenerator implements ContentGenerator {
  private client: OpenAI;
  private model: string;
  private embeddingModel: string;

  constructor(
    apiKey: string, 
    model: string = 'gpt-4', 
    embeddingModel: string = 'text-embedding-ada-002',
    baseURL?: string
  ) {
    this.client = new OpenAI({
      apiKey,
      baseURL,
    });
    this.model = model;
    this.embeddingModel = embeddingModel;
  }

  async generateContent(request: GenerateContentParameters): Promise<GenerateContentResponse> {
    try {
      const messages = this.convertToOpenAIMessages(request);
      
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        stream: false,
      });

      return this.convertToGeminiResponse(response);
    } catch (error) {
      throw new Error(`OpenAI API调用失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async generateContentStream(
    request: GenerateContentParameters,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    const self = this;
    return (async function* (): AsyncGenerator<GenerateContentResponse> {
      try {
        const messages = self.convertToOpenAIMessages(request);
        
        const stream = await self.client.chat.completions.create({
          model: self.model,
          messages,
          stream: true,
        });

        for await (const chunk of stream) {
          if (chunk.choices && chunk.choices.length > 0) {
            const choice = chunk.choices[0];
            if (choice.delta?.content) {
              yield self.convertStreamChunkToGeminiResponse(chunk);
            }
          }
        }
      } catch (error) {
        throw new Error(`OpenAI流式API调用失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    })();
  }

  async countTokens(request: CountTokensParameters): Promise<CountTokensResponse> {
    try {
      // OpenAI没有直接的token计数API，我们使用简单的估算
      const text = this.extractTextFromRequest(request);
      const estimatedTokens = Math.ceil(text.length / 4); // 粗略估算

      return {
        totalTokens: estimatedTokens,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async embedContent(request: EmbedContentParameters): Promise<EmbedContentResponse> {
    try {
      const text = this.extractTextFromEmbedRequest(request);
      
      const response = await this.client.embeddings.create({
        model: this.embeddingModel,
        input: text,
      });

      return {
        embeddings: [
          {
            values: response.data[0]?.embedding || []
          }
        ]
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 将Gemini格式的请求转换为OpenAI格式
   */
  private convertToOpenAIMessages(request: GenerateContentParameters): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    // 处理系统指令
    if (request.config?.systemInstruction) {
      const systemContent = this.extractTextFromContent(request.config.systemInstruction);
      if (systemContent) {
        messages.push({
          role: 'system',
          content: systemContent,
        });
      }
    }

    // 处理对话内容
    if (Array.isArray(request.contents)) {
      for (const content of request.contents) {
        const text = this.extractTextFromContent(content);
        const role = this.extractRoleFromContent(content);
        if (text) {
          messages.push({
            role: role === 'model' ? 'assistant' : 'user',
            content: text,
          });
        }
      }
    } else if (request.contents) {
      const text = this.extractTextFromContent(request.contents);
      const role = this.extractRoleFromContent(request.contents);
      if (text) {
        messages.push({
          role: role === 'model' ? 'assistant' : 'user',
          content: text,
        });
      }
    }

    return messages;
  }

  /**
   * 从Content对象中提取文本
   */
  private extractTextFromContent(content: ContentUnion): string {
    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map(part => this.extractTextFromPart(part))
        .filter(text => text)
        .join('');
    }

    if (content && typeof content === 'object' && 'parts' in content && Array.isArray(content.parts)) {
      return content.parts
        .map(part => this.extractTextFromPart(part))
        .filter(text => text)
        .join('');
    }

    return '';
  }

  /**
   * 从Content对象中提取角色
   */
  private extractRoleFromContent(content: ContentUnion): string {
    if (content && typeof content === 'object' && 'role' in content && typeof content.role === 'string') {
      return content.role;
    }
    return 'user';
  }

  /**
   * 从Part对象中提取文本
   */
  private extractTextFromPart(part: any): string {
    if (typeof part === 'string') {
      return part;
    }
    
    if (part && typeof part === 'object') {
      if (part.text && typeof part.text === 'string') {
        return part.text;
      }
    }
    
    return '';
  }

  /**
   * 将OpenAI响应转换为Gemini格式
   */
  private convertToGeminiResponse(response: OpenAI.Chat.Completions.ChatCompletion): GenerateContentResponse {
    const choice = response.choices[0];
    
    const geminiResponse = new GenerateContentResponse();
    
    // 设置候选项
    const candidate: Candidate = {
      content: {
        parts: [{ text: choice.message.content || '' }],
        role: 'model'
      },
      finishReason: this.convertFinishReason(choice.finish_reason),
      index: 0
    };
    
    geminiResponse.candidates = [candidate];
    
    // 设置使用元数据
    if (response.usage) {
      geminiResponse.usageMetadata = {
        promptTokenCount: response.usage.prompt_tokens,
        candidatesTokenCount: response.usage.completion_tokens,
        totalTokenCount: response.usage.total_tokens,
      };
    }
    
    return geminiResponse;
  }

  /**
   * 将OpenAI流式响应块转换为Gemini格式
   */
  private convertStreamChunkToGeminiResponse(chunk: OpenAI.Chat.Completions.ChatCompletionChunk): GenerateContentResponse {
    const choice = chunk.choices[0];
    
    const geminiResponse = new GenerateContentResponse();
    
    const candidate: Candidate = {
      content: {
        parts: [{ text: choice.delta?.content || '' }],
        role: 'model'
      },
      finishReason: this.convertFinishReason(choice.finish_reason),
      index: 0
    };
    
    geminiResponse.candidates = [candidate];
    
    return geminiResponse;
  }

  /**
   * 转换结束原因
   */
  private convertFinishReason(reason: string | null): any {
    if (!reason) return undefined;
    
    switch (reason) {
      case 'stop':
        return 'STOP';
      case 'length':
        return 'MAX_TOKENS';
      case 'content_filter':
        return 'SAFETY';
      default:
        return 'OTHER';
    }
  }

  /**
   * 从请求中提取文本用于token计数
   */
  private extractTextFromRequest(request: CountTokensParameters): string {
    let text = '';
    
    if (typeof request === 'object' && 'contents' in request) {
      const contents = Array.isArray(request.contents) ? request.contents : [request.contents];
      
      for (const content of contents) {
        if (typeof content === 'object' && 'parts' in content && content.parts) {
          for (const part of content.parts) {
            if (typeof part === 'object' && part && 'text' in part && part.text) {
              text += part.text + ' ';
            }
          }
        }
      }
    }
    
    return text;
  }

  /**
   * 从嵌入请求中提取文本
   */
  private extractTextFromEmbedRequest(request: EmbedContentParameters): string {
    if (typeof request === 'object' && 'contents' in request) {
      const contents = Array.isArray(request.contents) ? request.contents : [request.contents];
      
      for (const content of contents) {
        if (typeof content === 'object' && 'parts' in content && content.parts) {
          for (const part of content.parts) {
            if (typeof part === 'object' && part && 'text' in part && part.text) {
              return part.text;
            }
          }
        }
      }
    }
    
    return '';
  }

  /**
   * 处理错误并转换为统一格式
   */
  private handleError(error: any): Error {
    if (error instanceof OpenAI.APIError) {
      return new Error(`OpenAI API Error: ${error.message} (${error.status})`);
    }
    
    if (error instanceof Error) {
      return error;
    }

    return new Error(`Unknown OpenAI error: ${String(error)}`);
  }
}

/**
 * 创建OpenAI内容生成器的工厂函数
 */
export function createOpenAIContentGenerator(
  apiKey: string, 
  model?: string, 
  embeddingModel?: string,
  baseURL?: string
): OpenAIContentGenerator {
  return new OpenAIContentGenerator(apiKey, model, embeddingModel, baseURL);
} 