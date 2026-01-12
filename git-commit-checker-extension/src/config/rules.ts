/**
 * 默认配置和规则
 */
import { IPluginConfig, ITypeOption } from '../models/commitMessage';

/**
 * 默认提交类型列表
 */
export const DEFAULT_TYPES: string[] = [
    'feat',
    'fix',
    'docs',
    'style',
    'refactor',
    'perf',
    'test',
    'build',
    'ci',
    'chore',
    'revert'
];

/**
 * 默认类型描述
 */
export const DEFAULT_TYPE_DESCRIPTIONS: Record<string, string> = {
    feat: '新功能',
    fix: 'Bug 修复',
    docs: '文档更新',
    style: '代码格式调整（不影响代码逻辑）',
    refactor: '代码重构',
    perf: '性能优化',
    test: '测试相关',
    build: '构建系统或外部依赖变更',
    ci: 'CI 配置变更',
    chore: '其他杂项',
    revert: '回滚提交'
};

/**
 * 类型对应的 emoji 图标
 */
export const TYPE_EMOJIS: Record<string, string> = {
    feat: '✨',
    fix: '🐛',
    docs: '📚',
    style: '💄',
    refactor: '♻️',
    perf: '⚡',
    test: '✅',
    build: '🔧',
    ci: '👷',
    chore: '🔨',
    revert: '⏪'
};

/**
 * 获取类型选项列表
 */
export function getTypeOptions(
    types: string[],
    descriptions: Record<string, string>
): ITypeOption[] {
    return types.map(type => ({
        type,
        description: descriptions[type] || type,
        label: `${TYPE_EMOJIS[type] || '📝'} ${type}: ${descriptions[type] || type}`
    }));
}

/**
 * 默认插件配置
 */
export const DEFAULT_CONFIG: IPluginConfig = {
    types: DEFAULT_TYPES,
    typeDescriptions: DEFAULT_TYPE_DESCRIPTIONS,
    subjectMaxLength: 50,
    subjectMinLength: 3,
    scopeRequired: false,
    bodyRequired: false
};

/**
 * Commit 信息格式正则表达式
 * 格式: type(scope): subject
 */
export const COMMIT_MESSAGE_REGEX = /^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/;

/**
 * 验证规则常量
 */
export const VALIDATION_RULES = {
    /** type 必须是字母组成 */
    TYPE_PATTERN: /^[a-z]+$/,
    /** scope 允许的字符 */
    SCOPE_PATTERN: /^[\w\-/.]+$/,
    /** subject 不能以大写字母开头（可选规则） */
    SUBJECT_LOWERCASE: /^[a-z]/,
    /** subject 不能以句号结尾 */
    SUBJECT_NO_PERIOD: /[^.]$/
};
