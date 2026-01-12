/**
 * Git Commit Checker VSCode 插件入口
 * 
 * 这个插件用于检查和规范 Git Commit 提交信息格式，
 * 确保团队代码提交规范的统一性。
 */
import * as vscode from 'vscode';
import { executeCommitCommand, executeQuickCommitCommand } from './commands/commit';
import { executeCheckDiffCommand, showStagedFilesQuickPick } from './commands/checkDiff';
import { getValidatorService, resetValidatorService } from './services/validatorService';
import { resetGitService } from './services/gitService';

/**
 * 插件激活时调用
 */
export function activate(context: vscode.ExtensionContext): void {
    console.log('Git Commit Checker 插件已激活');

    // 注册命令: 提交（带预览）
    const commitCommand = vscode.commands.registerCommand(
        'gitCommitChecker.commit',
        executeCommitCommand
    );

    // 注册命令: 快速提交（无预览）
    const quickCommitCommand = vscode.commands.registerCommand(
        'gitCommitChecker.quickCommit',
        executeQuickCommitCommand
    );

    // 注册命令: 查看差异
    const checkDiffCommand = vscode.commands.registerCommand(
        'gitCommitChecker.checkDiff',
        executeCheckDiffCommand
    );

    // 注册命令: 显示暂存文件列表
    const stagedFilesCommand = vscode.commands.registerCommand(
        'gitCommitChecker.stagedFiles',
        showStagedFilesQuickPick
    );

    // 监听配置变更
    const configWatcher = vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('gitCommitChecker')) {
            // 刷新验证器配置
            getValidatorService().refreshConfig();
            vscode.window.showInformationMessage('Git Commit Checker 配置已更新');
        }
    });

    // 监听工作区变更
    const workspaceWatcher = vscode.workspace.onDidChangeWorkspaceFolders(() => {
        // 重置服务实例以适应新的工作区
        resetGitService();
        resetValidatorService();
    });

    // 注册到上下文，确保插件停用时正确清理
    context.subscriptions.push(
        commitCommand,
        quickCommitCommand,
        checkDiffCommand,
        stagedFilesCommand,
        configWatcher,
        workspaceWatcher
    );

    // 显示欢迎消息（首次激活）
    const hasShownWelcome = context.globalState.get<boolean>('hasShownWelcome');
    if (!hasShownWelcome) {
        vscode.window.showInformationMessage(
            '欢迎使用 Git Commit Checker！使用快捷键 Ctrl+Shift+G C 开始规范化提交。',
            '了解更多'
        ).then(selection => {
            if (selection === '了解更多') {
                vscode.commands.executeCommand(
                    'vscode.open',
                    vscode.Uri.parse('https://www.conventionalcommits.org/')
                );
            }
        });
        context.globalState.update('hasShownWelcome', true);
    }
}

/**
 * 插件停用时调用
 */
export function deactivate(): void {
    console.log('Git Commit Checker 插件已停用');

    // 清理服务实例
    resetGitService();
    resetValidatorService();
}
