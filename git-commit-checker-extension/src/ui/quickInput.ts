/**
 * 快速输入 UI 组件
 * 提供交互式的 commit 信息输入界面
 */
import * as vscode from 'vscode';
import { getValidatorService } from '../services/validatorService';
import { getTypeOptions } from '../config/rules';
import { ICommitMessage, IDiffInfo } from '../models/commitMessage';
import { analyzeDiff, DiffAnalysis } from '../services/diffAnalyzer';

/**
 * QuickPick 选项接口
 */
interface IQuickPickTypeItem extends vscode.QuickPickItem {
    type: string;
}

/**
 * 多步骤输入流程
 * 引导用户填写规范的 commit 信息
 */
export async function showCommitInputFlow(): Promise<ICommitMessage | undefined> {
    const validator = getValidatorService();
    const config = validator.getConfig();

    // Step 1: 选择提交类型
    const type = await selectCommitType(config.types, config.typeDescriptions);
    if (!type) {
        return undefined; // 用户取消
    }

    // Step 2: 输入 scope (可选)
    const scope = await inputScope(config.scopeRequired);
    if (scope === undefined && config.scopeRequired) {
        return undefined; // 用户取消且 scope 必填
    }

    // Step 3: 输入 subject
    const subject = await inputSubject(config.subjectMaxLength, config.subjectMinLength);
    if (!subject) {
        return undefined; // 用户取消
    }

    // Step 4: 输入 body (可选)
    const body = await inputBody();

    // Step 5: 输入 footer (可选)
    const footer = await inputFooter();

    // 构建完整消息
    const rawMessage = validator.buildCommitMessage(type, scope || undefined, subject, body, footer);

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
 * 带自动建议的智能提交流程
 * 分析代码差异并自动生成提交描述建议
 */
export async function showSmartCommitInputFlow(diffInfo: IDiffInfo): Promise<ICommitMessage | undefined> {
    const validator = getValidatorService();
    const config = validator.getConfig();

    // 分析代码差异
    const analysis = analyzeDiff(diffInfo);

    // 显示分析摘要
    vscode.window.showInformationMessage(
        `📊 代码分析: ${analysis.summary} | 建议: ${analysis.suggestedType}: ${analysis.suggestedSubject}`
    );

    // Step 1: 选择提交类型（使用建议值作为默认选中）
    const type = await selectCommitTypeWithSuggestion(
        config.types,
        config.typeDescriptions,
        analysis.suggestedType
    );
    if (!type) return undefined;

    // Step 2: 输入 scope（使用建议值）
    const scope = await inputScopeWithSuggestion(config.scopeRequired, analysis.suggestedScope);
    if (scope === undefined && config.scopeRequired) return undefined;

    // Step 3: 输入 subject（使用建议值）
    const subject = await inputSubjectWithSuggestion(
        config.subjectMaxLength,
        config.subjectMinLength,
        analysis.suggestedSubject
    );
    if (!subject) return undefined;

    // Step 4: 输入 body（使用建议值）
    const body = await inputBodyWithSuggestion(analysis.suggestedBody);

    // Step 5: 输入 footer
    const footer = await inputFooter();

    const rawMessage = validator.buildCommitMessage(type, scope || undefined, subject, body, footer);

    return { type, scope: scope || undefined, subject, body, footer, raw: rawMessage };
}

/**
 * 选择提交类型（带建议高亮）
 */
async function selectCommitTypeWithSuggestion(
    types: string[],
    typeDescriptions: Record<string, string>,
    suggestedType: string
): Promise<string | undefined> {
    const typeOptions = getTypeOptions(types, typeDescriptions);

    const items: IQuickPickTypeItem[] = typeOptions.map(opt => ({
        label: opt.type === suggestedType ? `$(star) ${opt.label} $(arrow-left) 推荐` : opt.label,
        description: opt.type === suggestedType ? '基于代码差异分析' : '',
        detail: `选择此类型用于: ${opt.description}`,
        type: opt.type
    }));

    // 将建议类型移到最前面
    items.sort((a, b) => {
        if (a.type === suggestedType) return -1;
        if (b.type === suggestedType) return 1;
        return 0;
    });

    const selected = await vscode.window.showQuickPick(items, {
        title: '🤖 智能提交 - 步骤 1/5: 选择提交类型',
        placeHolder: '已根据代码差异分析推荐类型，请确认或选择其他类型'
    });

    return selected?.type;
}

/**
 * 输入 scope（带建议值）
 */
async function inputScopeWithSuggestion(required: boolean, suggestedScope?: string): Promise<string | undefined> {
    const scope = await vscode.window.showInputBox({
        title: '🤖 智能提交 - 步骤 2/5: 输入影响范围 (scope)',
        prompt: suggestedScope
            ? `建议: ${suggestedScope}（直接按回车使用建议，或输入其他值）`
            : (required ? '请输入本次修改影响的模块或范围（必填）' : '可选，按回车跳过'),
        value: suggestedScope || '',
        placeHolder: '例如: auth, api, ui, database',
        validateInput: (value) => {
            if (required && !value.trim()) return 'scope 是必填项';
            if (value && !/^[\w\-/.]+$/.test(value)) return 'scope 格式不正确';
            return undefined;
        }
    });

    if (scope === undefined) return undefined;
    return scope.trim() || undefined;
}

/**
 * 输入 subject（带建议值）
 */
async function inputSubjectWithSuggestion(
    maxLength: number,
    minLength: number,
    suggestedSubject: string
): Promise<string | undefined> {
    const subject = await vscode.window.showInputBox({
        title: '🤖 智能提交 - 步骤 3/5: 输入简短描述 (subject)',
        prompt: `自动生成的描述已填入，可直接使用或修改 (${minLength}-${maxLength} 字符)`,
        value: suggestedSubject,
        placeHolder: '用一句话描述本次修改的内容',
        validateInput: (value) => {
            const trimmed = value.trim();
            if (!trimmed) return 'subject 不能为空';
            if (trimmed.length < minLength) return `至少需要 ${minLength} 个字符`;
            if (trimmed.length > maxLength) return `不能超过 ${maxLength} 个字符`;
            if (trimmed.endsWith('.')) return 'subject 不应以句号结尾';
            return undefined;
        }
    });

    if (subject === undefined) return undefined;
    return subject.trim();
}

/**
 * 输入 body（带建议值）
 */
async function inputBodyWithSuggestion(suggestedBody?: string): Promise<string | undefined> {
    if (!suggestedBody) {
        return inputBody();
    }

    const options: vscode.QuickPickItem[] = [
        { label: '$(check) 使用自动生成的描述', description: '基于文件变更列表' },
        { label: '$(edit) 自定义描述', description: '手动输入详细说明' },
        { label: '$(arrow-right) 跳过', description: '不添加详细描述' }
    ];

    const selected = await vscode.window.showQuickPick(options, {
        title: '🤖 智能提交 - 步骤 4/5: 添加详细描述 (body)',
        placeHolder: '已自动生成变更描述'
    });

    if (!selected || selected.label.includes('跳过')) return undefined;
    if (selected.label.includes('自动生成')) return suggestedBody;

    return inputBody();
}

/**
 * Step 1: 选择提交类型
 */
async function selectCommitType(
    types: string[],
    typeDescriptions: Record<string, string>
): Promise<string | undefined> {
    const typeOptions = getTypeOptions(types, typeDescriptions);

    const items: IQuickPickTypeItem[] = typeOptions.map(opt => ({
        label: opt.label,
        description: '',
        detail: `选择此类型用于: ${opt.description}`,
        type: opt.type
    }));

    const selected = await vscode.window.showQuickPick(items, {
        title: 'Git Commit - 步骤 1/5: 选择提交类型',
        placeHolder: '请选择本次提交的类型',
        matchOnDescription: true,
        matchOnDetail: true
    });

    return selected?.type;
}

/**
 * Step 2: 输入 scope
 */
async function inputScope(required: boolean): Promise<string | undefined> {
    const scope = await vscode.window.showInputBox({
        title: 'Git Commit - 步骤 2/5: 输入影响范围 (scope)',
        prompt: required
            ? '请输入本次修改影响的模块或范围（必填）'
            : '请输入本次修改影响的模块或范围（可选，按回车跳过）',
        placeHolder: '例如: auth, api, ui, database',
        validateInput: (value) => {
            if (required && !value.trim()) {
                return 'scope 是必填项';
            }
            if (value && !/^[\w\-/.]+$/.test(value)) {
                return 'scope 只允许字母、数字、下划线、连字符、斜杠和点';
            }
            return undefined;
        }
    });

    // 用户按 ESC 取消
    if (scope === undefined) {
        return undefined;
    }

    return scope.trim() || undefined;
}

/**
 * Step 3: 输入 subject
 */
async function inputSubject(maxLength: number, minLength: number): Promise<string | undefined> {
    const subject = await vscode.window.showInputBox({
        title: 'Git Commit - 步骤 3/5: 输入简短描述 (subject)',
        prompt: `请输入简短的提交描述（${minLength}-${maxLength} 个字符）`,
        placeHolder: '用一句话描述本次修改的内容',
        validateInput: (value) => {
            const trimmed = value.trim();
            if (!trimmed) {
                return 'subject 不能为空';
            }
            if (trimmed.length < minLength) {
                return `subject 至少需要 ${minLength} 个字符（当前 ${trimmed.length} 个）`;
            }
            if (trimmed.length > maxLength) {
                return `subject 不能超过 ${maxLength} 个字符（当前 ${trimmed.length} 个）`;
            }
            if (trimmed.endsWith('.')) {
                return 'subject 不应以句号结尾';
            }
            return undefined;
        }
    });

    if (subject === undefined) {
        return undefined;
    }

    return subject.trim();
}

/**
 * Step 4: 输入 body
 */
async function inputBody(): Promise<string | undefined> {
    const options: vscode.QuickPickItem[] = [
        { label: '$(arrow-right) 跳过', description: '不添加详细描述' },
        { label: '$(edit) 添加详细描述', description: '打开编辑器输入详细说明' }
    ];

    const selected = await vscode.window.showQuickPick(options, {
        title: 'Git Commit - 步骤 4/5: 添加详细描述 (body)',
        placeHolder: '是否需要添加更详细的描述？'
    });

    if (!selected || selected.label.includes('跳过')) {
        return undefined;
    }

    // 打开多行输入
    const body = await vscode.window.showInputBox({
        title: 'Git Commit - 输入详细描述',
        prompt: '请输入详细的修改说明（可以使用 \\n 表示换行）',
        placeHolder: '描述为什么要做这个修改，以及修改了什么'
    });

    if (body === undefined || !body.trim()) {
        return undefined;
    }

    // 处理换行符
    return body.replace(/\\n/g, '\n').trim();
}

/**
 * Step 5: 输入 footer
 */
async function inputFooter(): Promise<string | undefined> {
    const options: vscode.QuickPickItem[] = [
        { label: '$(arrow-right) 跳过', description: '不添加关联信息' },
        { label: '$(issues) 关联 Issue', description: '添加关联的 Issue 编号' },
        { label: '$(warning) Breaking Change', description: '标记为破坏性变更' }
    ];

    const selected = await vscode.window.showQuickPick(options, {
        title: 'Git Commit - 步骤 5/5: 添加关联信息 (footer)',
        placeHolder: '是否需要关联 Issue 或标记 Breaking Change？'
    });

    if (!selected || selected.label.includes('跳过')) {
        return undefined;
    }

    if (selected.label.includes('Issue')) {
        const issueNumber = await vscode.window.showInputBox({
            title: 'Git Commit - 关联 Issue',
            prompt: '请输入关联的 Issue 编号',
            placeHolder: '例如: #123 或 Closes #123'
        });

        if (issueNumber && issueNumber.trim()) {
            const value = issueNumber.trim();
            // 自动添加 Closes 前缀（如果没有）
            if (/^#?\d+$/.test(value)) {
                return `Closes ${value.startsWith('#') ? value : '#' + value}`;
            }
            return value;
        }
    } else if (selected.label.includes('Breaking Change')) {
        const breakingChange = await vscode.window.showInputBox({
            title: 'Git Commit - Breaking Change',
            prompt: '请描述破坏性变更的内容',
            placeHolder: '例如: API 参数格式变更，需要更新调用方'
        });

        if (breakingChange && breakingChange.trim()) {
            return `BREAKING CHANGE: ${breakingChange.trim()}`;
        }
    }

    return undefined;
}

/**
 * 显示差异预览
 */
export async function showDiffPreview(
    stagedFiles: Array<{ path: string; status: string }>,
    additions: number,
    deletions: number
): Promise<boolean> {
    const fileList = stagedFiles
        .map(f => {
            const statusIcon =
                f.status === 'A' ? '$(diff-added)' :
                    f.status === 'M' ? '$(diff-modified)' :
                        f.status === 'D' ? '$(diff-removed)' :
                            '$(file)';
            return `${statusIcon} ${f.path}`;
        })
        .join('\n');

    const message = `
📊 暂存区变更统计:
━━━━━━━━━━━━━━━━━━━━
文件数: ${stagedFiles.length}
添加行: +${additions}
删除行: -${deletions}

📁 文件列表:
${fileList}
  `.trim();

    const result = await vscode.window.showInformationMessage(
        `准备提交 ${stagedFiles.length} 个文件 (+${additions}/-${deletions})`,
        { modal: false },
        '继续提交',
        '查看详情',
        '取消'
    );

    if (result === '查看详情') {
        const doc = await vscode.workspace.openTextDocument({
            content: message,
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc, { preview: true });

        // 再次询问
        const confirm = await vscode.window.showInformationMessage(
            '确认继续提交？',
            '继续提交',
            '取消'
        );
        return confirm === '继续提交';
    }

    return result === '继续提交';
}

/**
 * 显示提交确认
 */
export async function showCommitConfirmation(message: string): Promise<boolean> {
    const preview = message.length > 100
        ? message.substring(0, 100) + '...'
        : message;

    const result = await vscode.window.showInformationMessage(
        `确认提交: "${preview}"`,
        { modal: true },
        '确认提交',
        '取消'
    );

    return result === '确认提交';
}
