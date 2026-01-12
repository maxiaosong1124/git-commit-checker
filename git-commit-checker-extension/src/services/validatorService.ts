/**
 * Commit 信息验证器服务
 * 负责解析和验证 commit 信息格式
 */
import * as vscode from 'vscode';
import {
    ICommitMessage,
    IValidationResult,
    IPluginConfig
} from '../models/commitMessage';
import {
    DEFAULT_CONFIG,
    COMMIT_MESSAGE_REGEX,
    VALIDATION_RULES
} from '../config/rules';

/**
 * 验证器服务类
 */
export class ValidatorService {
    private config: IPluginConfig;

    constructor() {
        this.config = this.loadConfig();
    }

    /**
     * 从 VSCode 设置加载配置
     */
    private loadConfig(): IPluginConfig {
        const vsConfig = vscode.workspace.getConfiguration('gitCommitChecker');

        return {
            types: vsConfig.get<string[]>('types') || DEFAULT_CONFIG.types,
            typeDescriptions: vsConfig.get<Record<string, string>>('typeDescriptions') || DEFAULT_CONFIG.typeDescriptions,
            subjectMaxLength: vsConfig.get<number>('subjectMaxLength') || DEFAULT_CONFIG.subjectMaxLength,
            subjectMinLength: vsConfig.get<number>('subjectMinLength') || DEFAULT_CONFIG.subjectMinLength,
            scopeRequired: vsConfig.get<boolean>('scopeRequired') || DEFAULT_CONFIG.scopeRequired,
            bodyRequired: vsConfig.get<boolean>('bodyRequired') || DEFAULT_CONFIG.bodyRequired
        };
    }

    /**
     * 刷新配置
     */
    refreshConfig(): void {
        this.config = this.loadConfig();
    }

    /**
     * 获取当前配置
     */
    getConfig(): IPluginConfig {
        return { ...this.config };
    }

    /**
     * 解析 commit 信息
     */
    parseMessage(rawMessage: string): ICommitMessage | null {
        const lines = rawMessage.trim().split('\n');
        if (lines.length === 0 || !lines[0]) {
            return null;
        }

        const firstLine = lines[0].trim();
        const match = firstLine.match(COMMIT_MESSAGE_REGEX);

        if (!match) {
            return null;
        }

        const [, type, scope, subject] = match;

        // 解析 body 和 footer
        let body: string | undefined;
        let footer: string | undefined;

        if (lines.length > 1) {
            // 跳过空行，获取 body
            let bodyStartIndex = 1;
            while (bodyStartIndex < lines.length && !lines[bodyStartIndex].trim()) {
                bodyStartIndex++;
            }

            // 查找 footer（以特定关键词开头的行）
            const footerKeywords = ['BREAKING CHANGE:', 'Closes', 'Fixes', 'Refs', 'Issue'];
            let footerStartIndex = -1;

            for (let i = bodyStartIndex; i < lines.length; i++) {
                const line = lines[i].trim();
                if (footerKeywords.some(keyword => line.startsWith(keyword))) {
                    footerStartIndex = i;
                    break;
                }
            }

            if (footerStartIndex > bodyStartIndex) {
                body = lines.slice(bodyStartIndex, footerStartIndex).join('\n').trim() || undefined;
                footer = lines.slice(footerStartIndex).join('\n').trim() || undefined;
            } else if (bodyStartIndex < lines.length) {
                body = lines.slice(bodyStartIndex).join('\n').trim() || undefined;
            }
        }

        return {
            type,
            scope: scope || undefined,
            subject,
            body,
            footer,
            raw: rawMessage
        };
    }

    /**
     * 验证 commit 信息
     */
    validate(message: string): IValidationResult {
        const result: IValidationResult = {
            isValid: true,
            errors: [],
            warnings: []
        };

        // 空消息检查
        if (!message || !message.trim()) {
            result.isValid = false;
            result.errors.push('提交信息不能为空');
            return result;
        }

        // 解析消息
        const parsed = this.parseMessage(message);

        if (!parsed) {
            result.isValid = false;
            result.errors.push('提交信息格式不正确，应为: type(scope): subject');
            return result;
        }

        // 验证 type
        if (!this.config.types.includes(parsed.type)) {
            result.isValid = false;
            result.errors.push(
                `无效的提交类型 "${parsed.type}"，允许的类型: ${this.config.types.join(', ')}`
            );
        }

        // 验证 type 格式
        if (!VALIDATION_RULES.TYPE_PATTERN.test(parsed.type)) {
            result.isValid = false;
            result.errors.push('提交类型必须是小写字母');
        }

        // 验证 scope（如果配置为必填）
        if (this.config.scopeRequired && !parsed.scope) {
            result.isValid = false;
            result.errors.push('scope 是必填项');
        }

        // 验证 scope 格式（如果存在）
        if (parsed.scope && !VALIDATION_RULES.SCOPE_PATTERN.test(parsed.scope)) {
            result.isValid = false;
            result.errors.push('scope 格式不正确，只允许字母、数字、下划线、连字符、斜杠和点');
        }

        // 验证 subject 长度
        if (parsed.subject.length > this.config.subjectMaxLength) {
            result.isValid = false;
            result.errors.push(
                `subject 长度超过限制 (${parsed.subject.length}/${this.config.subjectMaxLength})`
            );
        }

        if (parsed.subject.length < this.config.subjectMinLength) {
            result.isValid = false;
            result.errors.push(
                `subject 长度不足 (${parsed.subject.length}/${this.config.subjectMinLength})`
            );
        }

        // 验证 subject 不以句号结尾（警告）
        if (!VALIDATION_RULES.SUBJECT_NO_PERIOD.test(parsed.subject)) {
            result.warnings.push('subject 不应以句号结尾');
        }

        // 验证 body（如果配置为必填）
        if (this.config.bodyRequired && !parsed.body) {
            result.isValid = false;
            result.errors.push('body 是必填项');
        }

        return result;
    }

    /**
     * 验证单个字段
     */
    validateType(type: string): IValidationResult {
        const result: IValidationResult = {
            isValid: true,
            errors: [],
            warnings: []
        };

        if (!type) {
            result.isValid = false;
            result.errors.push('请选择提交类型');
            return result;
        }

        if (!this.config.types.includes(type)) {
            result.isValid = false;
            result.errors.push(`无效的提交类型: ${type}`);
        }

        return result;
    }

    validateSubject(subject: string): IValidationResult {
        const result: IValidationResult = {
            isValid: true,
            errors: [],
            warnings: []
        };

        if (!subject || !subject.trim()) {
            result.isValid = false;
            result.errors.push('subject 不能为空');
            return result;
        }

        if (subject.length > this.config.subjectMaxLength) {
            result.isValid = false;
            result.errors.push(
                `subject 长度超过限制 (${subject.length}/${this.config.subjectMaxLength})`
            );
        }

        if (subject.length < this.config.subjectMinLength) {
            result.isValid = false;
            result.errors.push(
                `subject 长度不足 (${subject.length}/${this.config.subjectMinLength})`
            );
        }

        return result;
    }

    /**
     * 构建完整的 commit 信息
     */
    buildCommitMessage(
        type: string,
        scope: string | undefined,
        subject: string,
        body?: string,
        footer?: string
    ): string {
        let message = type;

        if (scope) {
            message += `(${scope})`;
        }

        message += `: ${subject}`;

        if (body) {
            message += `\n\n${body}`;
        }

        if (footer) {
            message += `\n\n${footer}`;
        }

        return message;
    }
}

// 导出单例
let validatorInstance: ValidatorService | null = null;

export function getValidatorService(): ValidatorService {
    if (!validatorInstance) {
        validatorInstance = new ValidatorService();
    }
    return validatorInstance;
}

export function resetValidatorService(): void {
    validatorInstance = null;
}
