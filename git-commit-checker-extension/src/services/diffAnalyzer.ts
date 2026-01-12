/**
 * 代码差异分析服务
 * 分析 git diff 并智能生成提交描述建议
 */
import { IGitFileStatus, IDiffInfo } from '../models/commitMessage';

export interface DiffAnalysis {
    suggestedType: string;
    suggestedScope?: string;
    suggestedSubject: string;
    suggestedBody?: string;
    summary: string;
}

const EXT_TO_MODULE: Record<string, string> = {
    '.ts': 'typescript', '.tsx': 'react', '.js': 'javascript', '.jsx': 'react',
    '.vue': 'vue', '.py': 'python', '.css': 'styles', '.scss': 'styles',
    '.md': 'docs', '.json': 'config', '.yaml': 'config', '.yml': 'config'
};

const DIR_TO_MODULE: Record<string, string> = {
    'test': 'test', 'tests': 'test', '__tests__': 'test', 'docs': 'docs',
    'config': 'config', 'api': 'api', 'components': 'ui', 'services': 'services',
    'utils': 'utils', 'models': 'models'
};

/**
 * 分析代码差异并生成提交建议
 */
export function analyzeDiff(diffInfo: IDiffInfo): DiffAnalysis {
    const { stagedFiles, additions, deletions } = diffInfo;

    const analysis = analyzeFiles(stagedFiles);
    const suggestedType = determineType(analysis, stagedFiles);
    const suggestedScope = determineScope(stagedFiles);
    const suggestedSubject = generateSubject(analysis, stagedFiles);
    const suggestedBody = generateBody(stagedFiles, additions, deletions);
    const summary = `${stagedFiles.length} 文件 (+${additions}/-${deletions})`;

    return { suggestedType, suggestedScope, suggestedSubject, suggestedBody, summary };
}

interface FileAnalysis {
    added: string[];
    modified: string[];
    deleted: string[];
    hasTest: boolean;
    hasDoc: boolean;
    hasConfig: boolean;
    hasStyle: boolean;
}

function analyzeFiles(files: IGitFileStatus[]): FileAnalysis {
    const analysis: FileAnalysis = {
        added: [], modified: [], deleted: [],
        hasTest: false, hasDoc: false, hasConfig: false, hasStyle: false
    };

    for (const file of files) {
        const path = file.path.toLowerCase();

        if (file.status === 'A') analysis.added.push(file.path);
        else if (file.status === 'M') analysis.modified.push(file.path);
        else if (file.status === 'D') analysis.deleted.push(file.path);

        if (isTestFile(path)) analysis.hasTest = true;
        if (isDocFile(path)) analysis.hasDoc = true;
        if (isConfigFile(path)) analysis.hasConfig = true;
        if (isStyleFile(path)) analysis.hasStyle = true;
    }

    return analysis;
}

function determineType(analysis: FileAnalysis, files: IGitFileStatus[]): string {
    if (analysis.hasTest && files.every(f => isTestFile(f.path))) return 'test';
    if (analysis.hasDoc && files.every(f => isDocFile(f.path))) return 'docs';
    if (analysis.hasConfig && files.every(f => isConfigFile(f.path))) return 'chore';
    if (analysis.hasStyle && files.every(f => isStyleFile(f.path))) return 'style';
    if (analysis.deleted.length > 0 && analysis.added.length === 0 && analysis.modified.length === 0) return 'chore';
    if (analysis.added.length > 0) return 'feat';
    if (analysis.modified.length > 0) return 'fix';
    return 'chore';
}

function determineScope(files: IGitFileStatus[]): string | undefined {
    if (files.length === 0) return undefined;

    const dirs = new Set<string>();
    for (const file of files) {
        const parts = file.path.split('/');
        if (parts.length > 1) {
            for (const part of parts.slice(0, -1)) {
                const module = DIR_TO_MODULE[part.toLowerCase()];
                if (module) { dirs.add(module); break; }
                else if (!['src', 'lib'].includes(part.toLowerCase())) { dirs.add(part); break; }
            }
        }
    }

    return dirs.size === 1 ? Array.from(dirs)[0] : undefined;
}

function generateSubject(analysis: FileAnalysis, files: IGitFileStatus[]): string {
    if (files.length === 1) {
        const file = files[0];
        const name = getFileName(file.path);
        if (file.status === 'A') return `add ${name}`;
        if (file.status === 'M') return `update ${name}`;
        if (file.status === 'D') return `remove ${name}`;
        if (file.status === 'R') return `rename ${name}`;
    }

    if (analysis.added.length > 0 && analysis.modified.length === 0 && analysis.deleted.length === 0) {
        return analysis.added.length === 1 ? `add ${getFileName(analysis.added[0])}` : `add ${analysis.added.length} files`;
    }
    if (analysis.deleted.length > 0 && analysis.added.length === 0 && analysis.modified.length === 0) {
        return analysis.deleted.length === 1 ? `remove ${getFileName(analysis.deleted[0])}` : `remove ${analysis.deleted.length} files`;
    }
    if (analysis.modified.length > 0 && analysis.added.length === 0 && analysis.deleted.length === 0) {
        return analysis.modified.length === 1 ? `update ${getFileName(analysis.modified[0])}` : `update ${analysis.modified.length} files`;
    }

    const changes: string[] = [];
    if (analysis.added.length > 0) changes.push(`+${analysis.added.length}`);
    if (analysis.modified.length > 0) changes.push(`~${analysis.modified.length}`);
    if (analysis.deleted.length > 0) changes.push(`-${analysis.deleted.length}`);
    return `update files (${changes.join(' ')})`;
}

function generateBody(files: IGitFileStatus[], additions: number, deletions: number): string | undefined {
    if (files.length <= 3) return undefined;

    const lines = ['变更文件:'];
    for (const file of files.slice(0, 8)) {
        const s = file.status === 'A' ? '+' : file.status === 'D' ? '-' : '*';
        lines.push(`${s} ${file.path}`);
    }
    if (files.length > 8) lines.push(`... 还有 ${files.length - 8} 个文件`);
    lines.push('', `统计: +${additions} -${deletions}`);
    return lines.join('\n');
}

function getFileName(path: string): string {
    return path.split('/').pop() || path;
}

function isTestFile(path: string): boolean {
    return /\.(test|spec)\.(ts|js|tsx|jsx)$/.test(path) || /\/(test|tests|__tests__)\//.test(path);
}

function isDocFile(path: string): boolean {
    return /\.(md|txt|rst)$/.test(path) || /\/docs?\//.test(path);
}

function isConfigFile(path: string): boolean {
    return /\.(json|yaml|yml|toml|ini)$/.test(path) || /config/.test(path) || path.startsWith('.');
}

function isStyleFile(path: string): boolean {
    return /\.(css|scss|less|sass)$/.test(path);
}
