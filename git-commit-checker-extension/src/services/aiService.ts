/**
 * AI 智能描述生成服务
 * 使用 OpenAI 格式 API 根据代码差异生成 commit 描述
 */
import * as vscode from 'vscode';
import { IGitFileStatus } from '../models/commitMessage';
import {
    AIGeneratedCommit,
    buildSystemPrompt,
    buildUserPrompt,
    truncateDiff,
    parseAIResponse
} from './aiService.core';

// 重新导出核心类型
export { AIGeneratedCommit } from './aiService.core';

/**
 * AI 服务配置接口
 */
interface AIConfig {
    enabled: boolean;
    apiKey: string;
    endpoint: string;
    model: string;
    timeout: number;
    maxDiffLength: number;
}

/**
 * 获取 AI 配置
 */
function getAIConfig(): AIConfig {
    const config = vscode.workspace.getConfiguration('gitCommitChecker.ai');
    return {
        enabled: config.get<boolean>('enabled', false),
        apiKey: config.get<string>('apiKey', ''),
        endpoint: config.get<string>('endpoint', 'https://api.openai.com/v1'),
        model: config.get<string>('model', 'gpt-4o-mini'),
        timeout: config.get<number>('timeout', 30000),
        maxDiffLength: config.get<number>('maxDiffLength', 8000)
    };
}

/**
 * AI 服务类
 */
export class AIService {
    private config: AIConfig;

    constructor() {
        this.config = getAIConfig();
    }

    /**
     * 刷新配置
     */
    refreshConfig(): void {
        this.config = getAIConfig();
    }

    /**
     * 检查 AI 功能是否可用
     */
    isEnabled(): boolean {
        return this.config.enabled && !!this.config.apiKey;
    }

    /**
     * 检查配置是否完整
     */
    isConfigured(): boolean {
        return !!this.config.apiKey && !!this.config.endpoint;
    }

    /**
     * 生成提交描述
     */
    async generateCommitMessage(
        diffContent: string,
        stagedFiles: IGitFileStatus[]
    ): Promise<AIGeneratedCommit> {
        this.refreshConfig();

        if (!this.isConfigured()) {
            throw new Error('AI 服务未配置。请在设置中配置 API Key 和端点。');
        }

        // 裁剪 diff 内容
        const truncatedDiff = truncateDiff(diffContent, this.config.maxDiffLength);

        // 构建请求
        const messages = [
            { role: 'system', content: buildSystemPrompt() },
            { role: 'user', content: buildUserPrompt(truncatedDiff, stagedFiles) }
        ];

        const requestBody = {
            model: this.config.model,
            messages: messages,
            temperature: 0.3,
            max_tokens: 500
        };

        // 发送请求
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        try {
            const endpoint = this.config.endpoint.replace(/\/$/, '');
            const response = await fetch(`${endpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed (${response.status}): ${errorText}`);
            }

            const data = await response.json() as {
                choices?: Array<{ message?: { content?: string } }>;
            };

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid API response format');
            }

            const content = data.choices[0].message.content;
            if (!content) {
                throw new Error('Empty response from AI');
            }
            return parseAIResponse(content);

        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error(`AI 请求超时 (${this.config.timeout}ms)`);
                }
                throw error;
            }
            throw new Error(`AI 请求失败: ${String(error)}`);
        }
    }

    /**
     * 测试 API 连接
     */
    async testConnection(): Promise<boolean> {
        this.refreshConfig();

        if (!this.isConfigured()) {
            return false;
        }

        try {
            const endpoint = this.config.endpoint.replace(/\/$/, '');
            const response = await fetch(`${endpoint}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`
                }
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}

// 导出单例
let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
    if (!aiServiceInstance) {
        aiServiceInstance = new AIService();
    }
    return aiServiceInstance;
}

export function resetAIService(): void {
    aiServiceInstance = null;
}

// 导出辅助函数供测试使用
export const testHelpers = {
    buildSystemPrompt,
    buildUserPrompt,
    truncateDiff,
    parseAIResponse,
    getAIConfig
};
