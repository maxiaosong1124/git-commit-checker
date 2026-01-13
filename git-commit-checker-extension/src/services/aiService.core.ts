/**
 * AI 服务核心逻辑（纯函数）
 * 可独立测试，不依赖 VSCode 环境
 */
import { IGitFileStatus } from '../models/commitMessage';

/**
 * AI 生成的提交信息接口
 */
export interface AIGeneratedCommit {
    type: string;
    scope?: string;
    subject: string;
    body?: string;
    reasoning?: string;
}

/**
 * 构建系统提示词
 */
export function buildSystemPrompt(): string {
    return `你是一个 Git 提交信息专家。根据提供的代码差异（git diff），生成符合 Conventional Commits 规范的提交信息。

规范格式: <type>(<scope>): <subject>

允许的 type:
- feat: 新功能
- fix: Bug 修复
- docs: 文档更新
- style: 代码格式调整（不影响代码逻辑）
- refactor: 代码重构
- perf: 性能优化
- test: 测试相关
- build: 构建系统或外部依赖变更
- ci: CI 配置变更
- chore: 其他杂项

要求:
1. subject 必须简洁明了，不超过 50 个字符
2. scope 是可选的，表示影响范围
3. 使用英文，动词开头，不要句号结尾
4. 如果变更复杂，可以添加 body 说明

你必须返回 JSON 格式:
{
  "type": "feat",
  "scope": "optional-scope",
  "subject": "add new feature",
  "body": "optional detailed description",
  "reasoning": "brief explanation of why you chose this"
}`;
}

/**
 * 构建用户提示词
 */
export function buildUserPrompt(diffContent: string, stagedFiles: IGitFileStatus[]): string {
    const fileList = stagedFiles.map(f => {
        const statusMap: Record<string, string> = {
            'A': '新增', 'M': '修改', 'D': '删除', 'R': '重命名'
        };
        return `- [${statusMap[f.status] || f.status}] ${f.path}`;
    }).join('\n');

    return `请根据以下代码差异生成提交信息:

## 变更文件列表:
${fileList}

## 代码差异 (git diff):
\`\`\`diff
${diffContent}
\`\`\`

请返回 JSON 格式的提交信息。`;
}

/**
 * 裁剪 diff 内容
 */
export function truncateDiff(diffContent: string, maxLength: number): string {
    if (diffContent.length <= maxLength) {
        return diffContent;
    }

    // 尝试保留更多文件的开头部分
    const lines = diffContent.split('\n');
    const result: string[] = [];
    let currentLength = 0;
    const truncateNote = '\n... (diff content truncated) ...';
    const reservedLength = truncateNote.length;

    for (const line of lines) {
        if (currentLength + line.length + 1 > maxLength - reservedLength) {
            result.push(truncateNote);
            break;
        }
        result.push(line);
        currentLength += line.length + 1;
    }

    return result.join('\n');
}

/**
 * 解析 AI 响应
 */
export function parseAIResponse(content: string): AIGeneratedCommit {
    // 尝试提取 JSON
    let jsonStr = content;

    // 处理可能包含 markdown 代码块的情况
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
    }

    try {
        const parsed = JSON.parse(jsonStr);

        // 验证必需字段
        if (!parsed.type || !parsed.subject) {
            throw new Error('Missing required fields: type and subject');
        }

        return {
            type: String(parsed.type).toLowerCase(),
            scope: parsed.scope ? String(parsed.scope) : undefined,
            subject: String(parsed.subject),
            body: parsed.body ? String(parsed.body) : undefined,
            reasoning: parsed.reasoning ? String(parsed.reasoning) : undefined
        };
    } catch (e) {
        throw new Error(`Failed to parse AI response: ${e instanceof Error ? e.message : String(e)}`);
    }
}
