/**
 * Git 操作服务模块
 * 封装所有 Git 相关的操作
 */
import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import { IGitFileStatus, IDiffInfo } from '../models/commitMessage';

const execAsync = promisify(exec);

/**
 * Git 服务类
 */
export class GitService {
    private workspaceRoot: string;

    constructor() {
        // 获取当前工作区根目录
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            this.workspaceRoot = workspaceFolders[0].uri.fsPath;
        } else {
            this.workspaceRoot = '';
        }
    }

    /**
     * 执行 Git 命令
     */
    private async execGit(command: string): Promise<string> {
        if (!this.workspaceRoot) {
            throw new Error('未找到工作区目录');
        }

        try {
            const { stdout } = await execAsync(`git ${command}`, {
                cwd: this.workspaceRoot,
                encoding: 'utf8',
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer
            });
            return stdout.trim();
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error(`Git 命令执行失败: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * 检查当前目录是否是 Git 仓库
     */
    async isGitRepository(): Promise<boolean> {
        try {
            await this.execGit('rev-parse --git-dir');
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 获取当前分支名
     */
    async getCurrentBranch(): Promise<string> {
        try {
            return await this.execGit('rev-parse --abbrev-ref HEAD');
        } catch {
            return 'unknown';
        }
    }

    /**
     * 获取暂存区文件列表
     */
    async getStagedFiles(): Promise<IGitFileStatus[]> {
        try {
            const output = await this.execGit('diff --cached --name-status');
            if (!output) {
                return [];
            }

            const files: IGitFileStatus[] = [];
            const lines = output.split('\n');

            for (const line of lines) {
                if (!line.trim()) {
                    continue;
                }

                const parts = line.split('\t');
                const status = parts[0].charAt(0) as IGitFileStatus['status'];
                const path = parts[1];

                const fileStatus: IGitFileStatus = { path, status };

                // 处理重命名的情况 (R100 old_path new_path)
                if (status === 'R' && parts.length >= 3) {
                    fileStatus.originalPath = parts[1];
                    fileStatus.path = parts[2];
                }

                files.push(fileStatus);
            }

            return files;
        } catch {
            return [];
        }
    }

    /**
     * 获取暂存区代码差异
     */
    async getStagedDiff(): Promise<string> {
        try {
            return await this.execGit('diff --cached');
        } catch {
            return '';
        }
    }

    /**
     * 获取完整的差异信息
     */
    async getDiffInfo(): Promise<IDiffInfo> {
        const stagedFiles = await this.getStagedFiles();
        const diffContent = await this.getStagedDiff();

        // 统计添加和删除的行数
        let additions = 0;
        let deletions = 0;

        try {
            const shortstat = await this.execGit('diff --cached --shortstat');
            const match = shortstat.match(/(\d+) insertions?\(\+\).*?(\d+) deletions?\(-\)/);
            if (match) {
                additions = parseInt(match[1], 10);
                deletions = parseInt(match[2], 10);
            } else {
                // 尝试只匹配插入
                const insertMatch = shortstat.match(/(\d+) insertions?\(\+\)/);
                if (insertMatch) {
                    additions = parseInt(insertMatch[1], 10);
                }
                // 尝试只匹配删除
                const deleteMatch = shortstat.match(/(\d+) deletions?\(-\)/);
                if (deleteMatch) {
                    deletions = parseInt(deleteMatch[1], 10);
                }
            }
        } catch {
            // 忽略统计错误
        }

        return {
            stagedFiles,
            diffContent,
            additions,
            deletions
        };
    }

    /**
     * 执行 Git Commit
     */
    async commit(message: string): Promise<void> {
        // 转义消息中的特殊字符
        const escapedMessage = message.replace(/"/g, '\\"');
        await this.execGit(`commit -m "${escapedMessage}"`);
    }

    /**
     * 检查是否有暂存的更改
     */
    async hasStagedChanges(): Promise<boolean> {
        const files = await this.getStagedFiles();
        return files.length > 0;
    }

    /**
     * 获取最近的 commit 信息
     */
    async getLastCommitMessage(): Promise<string> {
        try {
            return await this.execGit('log -1 --pretty=%B');
        } catch {
            return '';
        }
    }

    /**
     * 获取仓库远程地址
     */
    async getRemoteUrl(): Promise<string> {
        try {
            return await this.execGit('remote get-url origin');
        } catch {
            return '';
        }
    }
}

// 导出单例
let gitServiceInstance: GitService | null = null;

export function getGitService(): GitService {
    if (!gitServiceInstance) {
        gitServiceInstance = new GitService();
    }
    return gitServiceInstance;
}

export function resetGitService(): void {
    gitServiceInstance = null;
}
