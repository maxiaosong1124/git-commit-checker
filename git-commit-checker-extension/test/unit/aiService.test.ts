/**
 * AI 服务单元测试
 * 测试核心纯函数逻辑（不依赖 VSCode）
 */
import { expect } from 'chai';
import {
    buildSystemPrompt,
    buildUserPrompt,
    truncateDiff,
    parseAIResponse
} from '../../src/services/aiService.core';

describe('AI Service Core', () => {
    describe('buildSystemPrompt', () => {
        it('should return a non-empty system prompt', () => {
            const prompt = buildSystemPrompt();
            expect(prompt).to.be.a('string');
            expect(prompt.length).to.be.greaterThan(100);
        });

        it('should include conventional commit types', () => {
            const prompt = buildSystemPrompt();
            expect(prompt).to.include('feat');
            expect(prompt).to.include('fix');
            expect(prompt).to.include('docs');
            expect(prompt).to.include('refactor');
        });

        it('should request JSON format output', () => {
            const prompt = buildSystemPrompt();
            expect(prompt).to.include('JSON');
        });
    });

    describe('buildUserPrompt', () => {
        it('should include file list', () => {
            const files = [
                { path: 'src/index.ts', status: 'M' as const },
                { path: 'src/utils.ts', status: 'A' as const }
            ];
            const prompt = buildUserPrompt('diff content', files);

            expect(prompt).to.include('src/index.ts');
            expect(prompt).to.include('src/utils.ts');
        });

        it('should include diff content', () => {
            const diffContent = '+ const x = 1;\n- const x = 2;';
            const prompt = buildUserPrompt(diffContent, []);

            expect(prompt).to.include(diffContent);
        });

        it('should translate file status to Chinese', () => {
            const files = [
                { path: 'file1.ts', status: 'A' as const },
                { path: 'file2.ts', status: 'M' as const },
                { path: 'file3.ts', status: 'D' as const }
            ];
            const prompt = buildUserPrompt('', files);

            expect(prompt).to.include('新增');
            expect(prompt).to.include('修改');
            expect(prompt).to.include('删除');
        });
    });

    describe('truncateDiff', () => {
        it('should not truncate short content', () => {
            const content = 'short content';
            const result = truncateDiff(content, 1000);
            expect(result).to.equal(content);
        });

        it('should truncate long content', () => {
            const content = 'a'.repeat(2000);
            const result = truncateDiff(content, 1000);

            expect(result.length).to.be.lessThan(2000);
            expect(result).to.include('truncated');
        });

        it('should truncate at line boundaries', () => {
            const lines = Array(100).fill('this is a test line').join('\n');
            const result = truncateDiff(lines, 500);

            // Result should contain truncation note
            expect(result).to.include('truncated');
            // Result should be shorter than original
            expect(result.length).to.be.lessThan(lines.length);
        });
    });

    describe('parseAIResponse', () => {
        it('should parse valid JSON response', () => {
            const response = JSON.stringify({
                type: 'feat',
                scope: 'auth',
                subject: 'add login feature',
                body: 'Implemented OAuth2 login',
                reasoning: 'New authentication feature'
            });

            const result = parseAIResponse(response);

            expect(result.type).to.equal('feat');
            expect(result.scope).to.equal('auth');
            expect(result.subject).to.equal('add login feature');
            expect(result.body).to.equal('Implemented OAuth2 login');
            expect(result.reasoning).to.equal('New authentication feature');
        });

        it('should parse JSON wrapped in markdown code block', () => {
            const response = '```json\n{"type": "fix", "subject": "correct typo"}\n```';
            const result = parseAIResponse(response);

            expect(result.type).to.equal('fix');
            expect(result.subject).to.equal('correct typo');
        });

        it('should parse JSON in code block without language', () => {
            const response = '```\n{"type": "docs", "subject": "update readme"}\n```';
            const result = parseAIResponse(response);

            expect(result.type).to.equal('docs');
            expect(result.subject).to.equal('update readme');
        });

        it('should normalize type to lowercase', () => {
            const response = JSON.stringify({
                type: 'FEAT',
                subject: 'test'
            });
            const result = parseAIResponse(response);

            expect(result.type).to.equal('feat');
        });

        it('should handle optional fields', () => {
            const response = JSON.stringify({
                type: 'chore',
                subject: 'update deps'
            });
            const result = parseAIResponse(response);

            expect(result.type).to.equal('chore');
            expect(result.subject).to.equal('update deps');
            expect(result.scope).to.be.undefined;
            expect(result.body).to.be.undefined;
            expect(result.reasoning).to.be.undefined;
        });

        it('should throw error for missing type', () => {
            const response = JSON.stringify({
                subject: 'missing type'
            });

            expect(() => parseAIResponse(response)).to.throw('Missing required fields');
        });

        it('should throw error for missing subject', () => {
            const response = JSON.stringify({
                type: 'feat'
            });

            expect(() => parseAIResponse(response)).to.throw('Missing required fields');
        });

        it('should throw error for invalid JSON', () => {
            const response = 'not valid json';

            expect(() => parseAIResponse(response)).to.throw('Failed to parse');
        });
    });
});
