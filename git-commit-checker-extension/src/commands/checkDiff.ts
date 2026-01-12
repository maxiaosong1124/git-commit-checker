/**
 * 检查差异命令模块
 * 显示暂存区的代码差异
 */
import * as vscode from 'vscode';
import { getGitService } from '../services/gitService';

/**
 * 执行检查差异命令
 */
export async function executeCheckDiffCommand(): Promise<void> {
    const gitService = getGitService();

    try {
        // 检查是否是 Git 仓库
        const isGitRepo = await gitService.isGitRepository();
        if (!isGitRepo) {
            vscode.window.showErrorMessage('当前目录不是 Git 仓库');
            return;
        }

        // 检查是否有暂存的更改
        const hasStagedChanges = await gitService.hasStagedChanges();
        if (!hasStagedChanges) {
            vscode.window.showInformationMessage('暂存区没有待提交的更改');
            return;
        }

        // 获取差异信息
        const diffInfo = await gitService.getDiffInfo();

        // 格式化文件状态
        const formatStatus = (status: string): string => {
            switch (status) {
                case 'A': return '新增';
                case 'M': return '修改';
                case 'D': return '删除';
                case 'R': return '重命名';
                case 'C': return '复制';
                default: return '未知';
            }
        };

        // 构建报告内容
        let reportContent = `# Git 暂存区差异报告\n\n`;
        reportContent += `**分支**: ${await gitService.getCurrentBranch()}\n\n`;
        reportContent += `## 📊 变更统计\n\n`;
        reportContent += `| 指标 | 数量 |\n`;
        reportContent += `|------|------|\n`;
        reportContent += `| 文件数 | ${diffInfo.stagedFiles.length} |\n`;
        reportContent += `| 添加行 | +${diffInfo.additions} |\n`;
        reportContent += `| 删除行 | -${diffInfo.deletions} |\n\n`;

        reportContent += `## 📁 文件列表\n\n`;
        reportContent += `| 状态 | 文件路径 |\n`;
        reportContent += `|------|----------|\n`;

        for (const file of diffInfo.stagedFiles) {
            const statusEmoji =
                file.status === 'A' ? '🟢' :
                    file.status === 'M' ? '🟡' :
                        file.status === 'D' ? '🔴' :
                            file.status === 'R' ? '🔵' : '⚪';

            let filePath = file.path;
            if (file.status === 'R' && file.originalPath) {
                filePath = `${file.originalPath} → ${file.path}`;
            }

            reportContent += `| ${statusEmoji} ${formatStatus(file.status)} | \`${filePath}\` |\n`;
        }

        reportContent += `\n## 📝 差异详情\n\n`;
        reportContent += `\`\`\`diff\n${diffInfo.diffContent || '无差异内容'}\n\`\`\`\n`;

        // 创建并显示文档
        const doc = await vscode.workspace.openTextDocument({
            content: reportContent,
            language: 'markdown'
        });

        await vscode.window.showTextDocument(doc, {
            preview: true,
            viewColumn: vscode.ViewColumn.Beside
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`查看差异失败: ${errorMessage}`);
    }
}

/**
 * 快速查看暂存文件列表
 */
export async function showStagedFilesQuickPick(): Promise<void> {
    const gitService = getGitService();

    try {
        const isGitRepo = await gitService.isGitRepository();
        if (!isGitRepo) {
            vscode.window.showErrorMessage('当前目录不是 Git 仓库');
            return;
        }

        const stagedFiles = await gitService.getStagedFiles();
        if (stagedFiles.length === 0) {
            vscode.window.showInformationMessage('暂存区没有文件');
            return;
        }

        const items: vscode.QuickPickItem[] = stagedFiles.map(file => {
            const statusIcon =
                file.status === 'A' ? '$(diff-added)' :
                    file.status === 'M' ? '$(diff-modified)' :
                        file.status === 'D' ? '$(diff-removed)' :
                            '$(file)';

            const statusText =
                file.status === 'A' ? '新增' :
                    file.status === 'M' ? '修改' :
                        file.status === 'D' ? '删除' :
                            file.status === 'R' ? '重命名' : '未知';

            return {
                label: `${statusIcon} ${file.path}`,
                description: statusText,
                detail: file.originalPath ? `从 ${file.originalPath} 重命名` : undefined
            };
        });

        const selected = await vscode.window.showQuickPick(items, {
            title: '暂存区文件列表',
            placeHolder: `共 ${stagedFiles.length} 个文件待提交`,
            canPickMany: false
        });

        if (selected) {
            // 提取文件路径（去掉图标前缀）
            const filePath = selected.label.replace(/^\$\([^)]+\)\s*/, '');

            // 尝试打开文件
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders) {
                const fileUri = vscode.Uri.joinPath(workspaceFolders[0].uri, filePath);
                try {
                    await vscode.window.showTextDocument(fileUri);
                } catch {
                    vscode.window.showWarningMessage(`无法打开文件: ${filePath}`);
                }
            }
        }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`获取暂存文件失败: ${errorMessage}`);
    }
}
