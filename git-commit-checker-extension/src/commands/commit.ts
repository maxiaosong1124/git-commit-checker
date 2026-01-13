/**
 * 提交命令模块
 * 处理 Git Commit 的完整流程
 */
import * as vscode from 'vscode';
import { getGitService } from '../services/gitService';
import { getValidatorService } from '../services/validatorService';
import {
    showCommitInputFlow,
    showSmartCommitInputFlow,
    showDiffPreview,
    showCommitConfirmation,
    showAIGenerateOption,
    showAICommitInputFlow
} from '../ui/quickInput';

/**
 * 执行提交命令
 */
export async function executeCommitCommand(): Promise<void> {
    const gitService = getGitService();
    const validator = getValidatorService();

    try {
        // Step 1: 检查是否是 Git 仓库
        const isGitRepo = await gitService.isGitRepository();
        if (!isGitRepo) {
            vscode.window.showErrorMessage('当前目录不是 Git 仓库');
            return;
        }

        // Step 2: 检查是否有暂存的更改
        const hasStagedChanges = await gitService.hasStagedChanges();
        if (!hasStagedChanges) {
            const result = await vscode.window.showWarningMessage(
                '暂存区没有待提交的更改，请先使用 git add 添加文件',
                '查看帮助'
            );
            if (result === '查看帮助') {
                vscode.window.showInformationMessage(
                    '提示: 使用 "git add <文件名>" 或 "git add ." 将更改添加到暂存区'
                );
            }
            return;
        }

        // Step 3: 获取差异信息并显示预览
        const diffInfo = await gitService.getDiffInfo();
        const shouldContinue = await showDiffPreview(
            diffInfo.stagedFiles.map(f => ({ path: f.path, status: f.status })),
            diffInfo.additions,
            diffInfo.deletions
        );

        if (!shouldContinue) {
            vscode.window.showInformationMessage('已取消提交');
            return;
        }

        // Step 4: 询问用户选择提交方式
        const commitMethod = await showAIGenerateOption();
        if (!commitMethod) {
            vscode.window.showInformationMessage('已取消提交');
            return;
        }

        // Step 5: 根据用户选择引导填写 commit 信息
        let commitMessage;
        switch (commitMethod) {
            case 'ai':
                commitMessage = await showAICommitInputFlow(diffInfo);
                break;
            case 'smart':
                commitMessage = await showSmartCommitInputFlow(diffInfo);
                break;
            case 'manual':
                commitMessage = await showCommitInputFlow();
                break;
        }

        if (!commitMessage) {
            vscode.window.showInformationMessage('已取消提交');
            return;
        }

        // Step 5: 验证 commit 信息
        const validation = validator.validate(commitMessage.raw);
        if (!validation.isValid) {
            vscode.window.showErrorMessage(
                `提交信息验证失败:\n${validation.errors.join('\n')}`
            );
            return;
        }

        // 显示警告（如果有）
        if (validation.warnings.length > 0) {
            const proceed = await vscode.window.showWarningMessage(
                `警告: ${validation.warnings.join(', ')}`,
                '继续提交',
                '取消'
            );
            if (proceed !== '继续提交') {
                return;
            }
        }

        // Step 6: 确认提交
        const confirmed = await showCommitConfirmation(commitMessage.raw);
        if (!confirmed) {
            vscode.window.showInformationMessage('已取消提交');
            return;
        }

        // Step 7: 执行提交
        await gitService.commit(commitMessage.raw);

        // 显示成功消息
        const branch = await gitService.getCurrentBranch();
        vscode.window.showInformationMessage(
            `✅ 提交成功！[${branch}] ${commitMessage.type}: ${commitMessage.subject}`
        );

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`提交失败: ${errorMessage}`);
    }
}

/**
 * 快速提交命令（跳过预览确认）
 */
export async function executeQuickCommitCommand(): Promise<void> {
    const gitService = getGitService();
    const validator = getValidatorService();

    try {
        // 检查基本条件
        const isGitRepo = await gitService.isGitRepository();
        if (!isGitRepo) {
            vscode.window.showErrorMessage('当前目录不是 Git 仓库');
            return;
        }

        const hasStagedChanges = await gitService.hasStagedChanges();
        if (!hasStagedChanges) {
            vscode.window.showWarningMessage('暂存区没有待提交的更改');
            return;
        }

        // 直接进入输入流程
        const commitMessage = await showCommitInputFlow();
        if (!commitMessage) {
            return;
        }

        // 验证
        const validation = validator.validate(commitMessage.raw);
        if (!validation.isValid) {
            vscode.window.showErrorMessage(
                `提交信息验证失败: ${validation.errors.join(', ')}`
            );
            return;
        }

        // 执行提交
        await gitService.commit(commitMessage.raw);

        const branch = await gitService.getCurrentBranch();
        vscode.window.showInformationMessage(
            `✅ 提交成功！[${branch}] ${commitMessage.type}: ${commitMessage.subject}`
        );

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`提交失败: ${errorMessage}`);
    }
}
