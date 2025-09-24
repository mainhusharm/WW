// Comprehensive Gemini API service supporting all available models

export interface GeminiModel {
  name: string;
  displayName: string;
  description: string;
  maxTokens: number;
  capabilities: string[];
  isExperimental?: boolean;
}

export interface GeminiResponse {
  text: string;
  model: string;
  tokens: number;
  responseTime: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface GeminiRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topK?: number;
  topP?: number;
  safetySettings?: any[];
  generationConfig?: any;
}

// All available Gemini models as of 2024
export const GEMINI_MODELS: GeminiModel[] = [
  {
    name: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    description: 'Most capable model for complex tasks',
    maxTokens: 8192,
    capabilities: ['text', 'code', 'reasoning', 'analysis']
  },
  {
    name: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    description: 'Fast and efficient for most tasks',
    maxTokens: 8192,
    capabilities: ['text', 'code', 'reasoning', 'analysis']
  },
  {
    name: 'gemini-1.5-flash-8b',
    displayName: 'Gemini 1.5 Flash 8B',
    description: 'Lightweight model for simple tasks',
    maxTokens: 8192,
    capabilities: ['text', 'code']
  },
  {
    name: 'gemini-2.0-flash-exp',
    displayName: 'Gemini 2.0 Flash (Experimental)',
    description: 'Latest experimental model with enhanced capabilities',
    maxTokens: 32768,
    capabilities: ['text', 'code', 'reasoning', 'analysis', 'multimodal'],
    isExperimental: true
  },
  {
    name: 'gemini-pro',
    displayName: 'Gemini Pro',
    description: 'Original Gemini Pro model',
    maxTokens: 2048,
    capabilities: ['text', 'code']
  },
  {
    name: 'gemini-pro-vision',
    displayName: 'Gemini Pro Vision',
    description: 'Multimodal model with vision capabilities',
    maxTokens: 4096,
    capabilities: ['text', 'code', 'vision', 'multimodal']
  }
];

class GeminiService {
  private static instance: GeminiService;
  private apiKey: string = '';
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models';

  private constructor() {}

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  public getAvailableModels(): GeminiModel[] {
    return GEMINI_MODELS;
  }

  public getModelByName(name: string): GeminiModel | undefined {
    return GEMINI_MODELS.find(model => model.name === name);
  }

  public getRecommendedModel(useCase: 'fast' | 'balanced' | 'advanced' | 'experimental' = 'balanced'): GeminiModel {
    switch (useCase) {
      case 'fast':
        return GEMINI_MODELS.find(m => m.name === 'gemini-1.5-flash') || GEMINI_MODELS[0];
      case 'advanced':
        return GEMINI_MODELS.find(m => m.name === 'gemini-1.5-pro') || GEMINI_MODELS[0];
      case 'experimental':
        return GEMINI_MODELS.find(m => m.name === 'gemini-2.0-flash-exp') || GEMINI_MODELS[0];
      case 'balanced':
      default:
        return GEMINI_MODELS.find(m => m.name === 'gemini-1.5-flash') || GEMINI_MODELS[0];
    }
  }

  public async generateContent(request: GeminiRequest): Promise<GeminiResponse> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not set');
    }

    const model = request.model || this.getRecommendedModel().name;
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/${model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: request.prompt
            }]
          }],
          generationConfig: {
            temperature: request.temperature || 0.7,
            topK: request.topK || 40,
            topP: request.topP || 0.95,
            maxOutputTokens: request.maxTokens || 1024,
            ...request.generationConfig
          },
          safetySettings: request.safetySettings || [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response format from Gemini API');
      }

      const text = data.candidates[0].content.parts[0].text;
      const usage = data.usageMetadata;

      return {
        text,
        model,
        tokens: usage?.totalTokenCount || 0,
        responseTime,
        usage: usage ? {
          promptTokens: usage.promptTokenCount || 0,
          completionTokens: usage.candidatesTokenCount || 0,
          totalTokens: usage.totalTokenCount || 0
        } : undefined
      };

    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  public async testApiKey(apiKey: string): Promise<{ valid: boolean; message: string; models?: string[] }> {
    const originalKey = this.apiKey;
    this.setApiKey(apiKey);

    try {
      // Test with a simple prompt using the fastest model
      const testModel = this.getRecommendedModel('fast');
      const response = await this.generateContent({
        prompt: 'Hello, this is a test message.',
        model: testModel.name,
        maxTokens: 10
      });

      // Get list of available models for this API key
      const modelsResponse = await fetch(`${this.baseUrl}?key=${apiKey}`);
      let availableModels: string[] = [];
      
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        availableModels = modelsData.models?.map((m: any) => m.name) || [];
      }

      return {
        valid: true,
        message: `API key is valid. Tested with ${testModel.displayName}`,
        models: availableModels
      };

    } catch (error) {
      return {
        valid: false,
        message: error instanceof Error ? error.message : 'API key test failed'
      };
    } finally {
      this.setApiKey(originalKey);
    }
  }

  public async listAvailableModels(apiKey?: string): Promise<string[]> {
    const key = apiKey || this.apiKey;
    if (!key) {
      throw new Error('API key required to list models');
    }

    try {
      const response = await fetch(`${this.baseUrl}?key=${key}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      return data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      console.error('Error fetching available models:', error);
      return [];
    }
  }

  public createTradingPrompt(userContext: any, message: string): string {
    return `You are an expert trading coach and financial advisor. Use this context to provide personalized advice:

User Context: ${JSON.stringify(userContext, null, 2)}

User Question: ${message}

Provide a helpful, actionable response focused on trading education, strategy, risk management, and market analysis. Be specific and practical in your advice.`;
  }

  public createSignalAnalysisPrompt(signal: any, marketContext: any): string {
    return `Analyze this trading signal and provide insights:

Signal Data: ${JSON.stringify(signal, null, 2)}
Market Context: ${JSON.stringify(marketContext, null, 2)}

Please provide:
1. Signal strength assessment
2. Risk/reward analysis
3. Market conditions consideration
4. Entry/exit recommendations
5. Risk management suggestions`;
  }
}

export default GeminiService.getInstance();
