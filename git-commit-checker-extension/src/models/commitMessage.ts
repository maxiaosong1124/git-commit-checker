/**
 * Commit 信息数据模型
 */
export interface ICommitMessage {
    /** 提交类型，如 feat、fix 等 */
    type: string;
    /** 影响范围（可选） */
    scope?: string;
    /** 简短描述 */
    subject: string;
    /** 详细描述（可选） */
    body?: string;
    /** 页脚信息（可选），如关联的 Issue */
    footer?: string;
    /** 原始完整信息 */
    raw: string;
}

/**
 * 验证结果接口
 */
export interface IValidationResult {
    /** 是否验证通过 */
    isValid: boolean;
    /** 错误信息列表 */
    errors: string[];
    /** 警告信息列表 */
    warnings: string[];
}

/**
 * Git 文件状态
 */
export interface IGitFileStatus {
    /** 文件路径 */
    path: string;
    /** 状态: A(添加), M(修改), D(删除), R(重命名) */
    status: 'A' | 'M' | 'D' | 'R' | 'C' | 'U' | '?';
    /** 原文件路径（重命名时使用） */
    originalPath?: string;
}

/**
 * 代码差异信息
 */
export interface IDiffInfo {
    /** 暂存的文件列表 */
    stagedFiles: IGitFileStatus[];
    /** 差异详情 */
    diffContent: string;
    /** 添加的行数 */
    additions: number;
    /** 删除的行数 */
    deletions: number;
}

/**
 * 插件配置接口
 */
export interface IPluginConfig {
    /** 允许的提交类型 */
    types: string[];
    /** 类型描述映射 */
    typeDescriptions: Record<string, string>;
    /** subject 最大长度 */
    subjectMaxLength: number;
    /** subject 最小长度 */
    subjectMinLength: number;
    /** scope 是否必填 */
    scopeRequired: boolean;
    /** body 是否必填 */
    bodyRequired: boolean;
}

/**
 * 提交类型选项
 */
export interface ITypeOption {
    /** 类型标识 */
    type: string;
    /** 类型描述 */
    description: string;
    /** 显示标签 */
    label: string;
}
