/**
 * 验证器核心逻辑 - 纯函数实现
 * 不依赖 VSCode API，方便单元测试
 */
import { ICommitMessage, IValidationResult, IPluginConfig } from '../models/commitMessage';
import { COMMIT_MESSAGE_REGEX, VALIDATION_RULES, DEFAULT_CONFIG } from '../config/rules';

/**
 * 解析 commit 信息
 */
export function parseCommitMessage(rawMessage: string): ICommitMessage | null {
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
        let bodyStartIndex = 1;
        while (bodyStartIndex < lines.length && !lines[bodyStartIndex].trim()) {
            bodyStartIndex++;
        }

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
export function validateCommitMessage(
    message: string,
    config: IPluginConfig = DEFAULT_CONFIG
): IValidationResult {
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
    const parsed = parseCommitMessage(message);

    if (!parsed) {
        result.isValid = false;
        result.errors.push('提交信息格式不正确，应为: type(scope): subject');
        return result;
    }

    // 验证 type
    if (!config.types.includes(parsed.type)) {
        result.isValid = false;
        result.errors.push(
            `无效的提交类型 "${parsed.type}"，允许的类型: ${config.types.join(', ')}`
        );
    }

    // 验证 type 格式
    if (!VALIDATION_RULES.TYPE_PATTERN.test(parsed.type)) {
        result.isValid = false;
        result.errors.push('提交类型必须是小写字母');
    }

    // 验证 scope（如果配置为必填）
    if (config.scopeRequired && !parsed.scope) {
        result.isValid = false;
        result.errors.push('scope 是必填项');
    }

    // 验证 scope 格式（如果存在）
    if (parsed.scope && !VALIDATION_RULES.SCOPE_PATTERN.test(parsed.scope)) {
        result.isValid = false;
        result.errors.push('scope 格式不正确，只允许字母、数字、下划线、连字符、斜杠和点');
    }

    // 验证 subject 长度
    if (parsed.subject.length > config.subjectMaxLength) {
        result.isValid = false;
        result.errors.push(
            `subject 长度超过限制 (${parsed.subject.length}/${config.subjectMaxLength})`
        );
    }

    if (parsed.subject.length < config.subjectMinLength) {
        result.isValid = false;
        result.errors.push(
            `subject 长度不足 (${parsed.subject.length}/${config.subjectMinLength})`
        );
    }

    // 验证 subject 不以句号结尾（警告）
    if (!VALIDATION_RULES.SUBJECT_NO_PERIOD.test(parsed.subject)) {
        result.warnings.push('subject 不应以句号结尾');
    }

    // 验证 body（如果配置为必填）
    if (config.bodyRequired && !parsed.body) {
        result.isValid = false;
        result.errors.push('body 是必填项');
    }

    return result;
}

/**
 * 验证 type
 */
export function validateType(
    type: string,
    config: IPluginConfig = DEFAULT_CONFIG
): IValidationResult {
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

    if (!config.types.includes(type)) {
        result.isValid = false;
        result.errors.push(`无效的提交类型: ${type}`);
    }

    return result;
}

/**
 * 验证 subject
 */
export function validateSubject(
    subject: string,
    config: IPluginConfig = DEFAULT_CONFIG
): IValidationResult {
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

    if (subject.length > config.subjectMaxLength) {
        result.isValid = false;
        result.errors.push(
            `subject 长度超过限制 (${subject.length}/${config.subjectMaxLength})`
        );
    }

    if (subject.length < config.subjectMinLength) {
        result.isValid = false;
        result.errors.push(
            `subject 长度不足 (${subject.length}/${config.subjectMinLength})`
        );
    }

    return result;
}

/**
 * 构建 commit 信息
 */
export function buildCommitMessage(
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
