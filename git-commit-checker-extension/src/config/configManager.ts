/**
 * 配置管理服务
 * 支持项目级配置文件 (.commitcheckerrc.json)
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { IPluginConfig } from '../models/commitMessage';
import { DEFAULT_CONFIG } from './rules';

/**
 * 配置文件名
 */
const CONFIG_FILE_NAMES = [
    '.commitcheckerrc.json',
    '.commitcheckerrc',
    'commitchecker.config.json'
];

/**
 * 配置管理器
 */
export class ConfigManager {
    private workspaceRoot: string | undefined;
    private cachedConfig: IPluginConfig | null = null;
    private configFileWatcher: vscode.FileSystemWatcher | null = null;

    constructor() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            this.workspaceRoot = workspaceFolders[0].uri.fsPath;
        }

        // 设置配置文件监听
        this.setupConfigWatcher();
    }

    /**
     * 设置配置文件监听器
     */
    private setupConfigWatcher(): void {
        if (!this.workspaceRoot) {
            return;
        }

        // 监听所有可能的配置文件
        const pattern = new vscode.RelativePattern(
            this.workspaceRoot,
            '{.commitcheckerrc.json,.commitcheckerrc,commitchecker.config.json}'
        );

        this.configFileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

        // 配置文件变更时清除缓存
        this.configFileWatcher.onDidChange(() => {
            this.cachedConfig = null;
            vscode.window.showInformationMessage('Git Commit Checker 配置已重新加载');
        });

        this.configFileWatcher.onDidCreate(() => {
            this.cachedConfig = null;
            vscode.window.showInformationMessage('检测到项目配置文件，已加载');
        });

        this.configFileWatcher.onDidDelete(() => {
            this.cachedConfig = null;
            vscode.window.showInformationMessage('项目配置文件已删除，使用默认配置');
        });
    }

    /**
     * 查找项目配置文件
     */
    private findProjectConfig(): string | null {
        if (!this.workspaceRoot) {
            return null;
        }

        for (const fileName of CONFIG_FILE_NAMES) {
            const configPath = path.join(this.workspaceRoot, fileName);
            if (fs.existsSync(configPath)) {
                return configPath;
            }
        }

        return null;
    }

    /**
     * 读取项目配置文件
     */
    private readProjectConfig(): Partial<IPluginConfig> | null {
        const configPath = this.findProjectConfig();
        if (!configPath) {
            return null;
        }

        try {
            const content = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(content);
            return this.validateProjectConfig(config);
        } catch (error) {
            console.error('读取项目配置文件失败:', error);
            vscode.window.showWarningMessage(
                `配置文件解析失败: ${configPath}，使用默认配置`
            );
            return null;
        }
    }

    /**
     * 验证项目配置
     */
    private validateProjectConfig(config: unknown): Partial<IPluginConfig> | null {
        if (!config || typeof config !== 'object') {
            return null;
        }

        const result: Partial<IPluginConfig> = {};
        const rawConfig = config as Record<string, unknown>;

        // 验证 types
        if (Array.isArray(rawConfig.types)) {
            const validTypes = rawConfig.types.filter(
                (t): t is string => typeof t === 'string' && t.length > 0
            );
            if (validTypes.length > 0) {
                result.types = validTypes;
            }
        }

        // 验证 typeDescriptions
        if (rawConfig.typeDescriptions && typeof rawConfig.typeDescriptions === 'object') {
            const descriptions = rawConfig.typeDescriptions as Record<string, unknown>;
            const validDescriptions: Record<string, string> = {};
            for (const [key, value] of Object.entries(descriptions)) {
                if (typeof value === 'string') {
                    validDescriptions[key] = value;
                }
            }
            if (Object.keys(validDescriptions).length > 0) {
                result.typeDescriptions = validDescriptions;
            }
        }

        // 验证数字配置
        if (typeof rawConfig.subjectMaxLength === 'number' && rawConfig.subjectMaxLength > 0) {
            result.subjectMaxLength = rawConfig.subjectMaxLength;
        }

        if (typeof rawConfig.subjectMinLength === 'number' && rawConfig.subjectMinLength >= 0) {
            result.subjectMinLength = rawConfig.subjectMinLength;
        }

        // 验证布尔配置
        if (typeof rawConfig.scopeRequired === 'boolean') {
            result.scopeRequired = rawConfig.scopeRequired;
        }

        if (typeof rawConfig.bodyRequired === 'boolean') {
            result.bodyRequired = rawConfig.bodyRequired;
        }

        return Object.keys(result).length > 0 ? result : null;
    }

    /**
     * 获取 VSCode 设置中的配置
     */
    private getVSCodeConfig(): Partial<IPluginConfig> {
        const vsConfig = vscode.workspace.getConfiguration('gitCommitChecker');

        return {
            types: vsConfig.get<string[]>('types'),
            typeDescriptions: vsConfig.get<Record<string, string>>('typeDescriptions'),
            subjectMaxLength: vsConfig.get<number>('subjectMaxLength'),
            subjectMinLength: vsConfig.get<number>('subjectMinLength'),
            scopeRequired: vsConfig.get<boolean>('scopeRequired'),
            bodyRequired: vsConfig.get<boolean>('bodyRequired')
        };
    }

    /**
     * 获取合并后的配置
     * 优先级: 项目配置 > VSCode 设置 > 默认配置
     */
    getConfig(): IPluginConfig {
        if (this.cachedConfig) {
            return this.cachedConfig;
        }

        // 从默认配置开始
        let config: IPluginConfig = { ...DEFAULT_CONFIG };

        // 合并 VSCode 设置
        const vsConfig = this.getVSCodeConfig();
        config = this.mergeConfig(config, vsConfig);

        // 合并项目配置（最高优先级）
        const projectConfig = this.readProjectConfig();
        if (projectConfig) {
            config = this.mergeConfig(config, projectConfig);
        }

        this.cachedConfig = config;
        return config;
    }

    /**
     * 合并配置
     */
    private mergeConfig(
        base: IPluginConfig,
        override: Partial<IPluginConfig>
    ): IPluginConfig {
        return {
            types: override.types ?? base.types,
            typeDescriptions: override.typeDescriptions
                ? { ...base.typeDescriptions, ...override.typeDescriptions }
                : base.typeDescriptions,
            subjectMaxLength: override.subjectMaxLength ?? base.subjectMaxLength,
            subjectMinLength: override.subjectMinLength ?? base.subjectMinLength,
            scopeRequired: override.scopeRequired ?? base.scopeRequired,
            bodyRequired: override.bodyRequired ?? base.bodyRequired
        };
    }

    /**
     * 刷新配置缓存
     */
    refreshConfig(): void {
        this.cachedConfig = null;
    }

    /**
     * 生成示例配置文件
     */
    async generateSampleConfig(): Promise<void> {
        if (!this.workspaceRoot) {
            vscode.window.showErrorMessage('未找到工作区目录');
            return;
        }

        const sampleConfig = {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "types": [
                "feat",
                "fix",
                "docs",
                "style",
                "refactor",
                "perf",
                "test",
                "build",
                "ci",
                "chore",
                "revert"
            ],
            "typeDescriptions": {
                "feat": "新功能",
                "fix": "Bug 修复",
                "docs": "文档更新",
                "style": "代码格式调整",
                "refactor": "代码重构",
                "perf": "性能优化",
                "test": "测试相关",
                "build": "构建系统变更",
                "ci": "CI 配置变更",
                "chore": "其他杂项",
                "revert": "回滚提交"
            },
            "subjectMaxLength": 50,
            "subjectMinLength": 3,
            "scopeRequired": false,
            "bodyRequired": false
        };

        const configPath = path.join(this.workspaceRoot, '.commitcheckerrc.json');

        try {
            fs.writeFileSync(configPath, JSON.stringify(sampleConfig, null, 2), 'utf8');

            // 打开配置文件
            const doc = await vscode.workspace.openTextDocument(configPath);
            await vscode.window.showTextDocument(doc);

            vscode.window.showInformationMessage('已生成配置文件: .commitcheckerrc.json');
        } catch (error) {
            vscode.window.showErrorMessage(`生成配置文件失败: ${error}`);
        }
    }

    /**
     * 检查是否存在项目配置
     */
    hasProjectConfig(): boolean {
        return this.findProjectConfig() !== null;
    }

    /**
     * 销毁（清理资源）
     */
    dispose(): void {
        if (this.configFileWatcher) {
            this.configFileWatcher.dispose();
        }
    }
}

// 单例
let configManagerInstance: ConfigManager | null = null;

export function getConfigManager(): ConfigManager {
    if (!configManagerInstance) {
        configManagerInstance = new ConfigManager();
    }
    return configManagerInstance;
}

export function resetConfigManager(): void {
    if (configManagerInstance) {
        configManagerInstance.dispose();
        configManagerInstance = null;
    }
}
