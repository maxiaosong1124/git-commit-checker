/**
 * 验证器核心逻辑单元测试
 */
import { expect } from 'chai';
import {
    parseCommitMessage,
    validateCommitMessage,
    validateType,
    validateSubject,
    buildCommitMessage
} from '../../src/services/validator.core';
import { DEFAULT_CONFIG } from '../../src/config/rules';
import { IPluginConfig } from '../../src/models/commitMessage';

describe('Validator Core', () => {

    describe('parseCommitMessage', () => {

        it('应该正确解析简单的 commit 信息', () => {
            const result = parseCommitMessage('feat: add new feature');

            expect(result).to.not.be.null;
            expect(result!.type).to.equal('feat');
            expect(result!.scope).to.be.undefined;
            expect(result!.subject).to.equal('add new feature');
        });

        it('应该正确解析带 scope 的 commit 信息', () => {
            const result = parseCommitMessage('fix(auth): fix login bug');

            expect(result).to.not.be.null;
            expect(result!.type).to.equal('fix');
            expect(result!.scope).to.equal('auth');
            expect(result!.subject).to.equal('fix login bug');
        });

        it('应该正确解析带 body 的 commit 信息', () => {
            const message = `feat(api): add user endpoint

This adds a new REST endpoint for user management.
It includes CRUD operations.`;

            const result = parseCommitMessage(message);

            expect(result).to.not.be.null;
            expect(result!.type).to.equal('feat');
            expect(result!.scope).to.equal('api');
            expect(result!.body).to.include('REST endpoint');
        });

        it('应该正确解析带 footer 的 commit 信息', () => {
            const message = `fix: fix critical bug

Fixed a memory leak issue.

Closes #123`;

            const result = parseCommitMessage(message);

            expect(result).to.not.be.null;
            expect(result!.body).to.include('memory leak');
            expect(result!.footer).to.equal('Closes #123');
        });

        it('应该正确解析 BREAKING CHANGE', () => {
            const message = `feat: change API format

BREAKING CHANGE: The response format has changed.`;

            const result = parseCommitMessage(message);

            expect(result).to.not.be.null;
            expect(result!.body).to.include('BREAKING CHANGE');
        });

        it('应该对空消息返回 null', () => {
            expect(parseCommitMessage('')).to.be.null;
            expect(parseCommitMessage('   ')).to.be.null;
        });

        it('应该对格式不正确的消息返回 null', () => {
            expect(parseCommitMessage('invalid message')).to.be.null;
            expect(parseCommitMessage('no colon here')).to.be.null;
        });

    });

    describe('validateCommitMessage', () => {

        it('应该验证通过有效的 commit 信息', () => {
            const result = validateCommitMessage('feat: add new feature');

            expect(result.isValid).to.be.true;
            expect(result.errors).to.be.empty;
        });

        it('应该对空消息返回错误', () => {
            const result = validateCommitMessage('');

            expect(result.isValid).to.be.false;
            expect(result.errors).to.include('提交信息不能为空');
        });

        it('应该对格式错误的消息返回错误', () => {
            const result = validateCommitMessage('invalid message');

            expect(result.isValid).to.be.false;
            expect(result.errors[0]).to.include('格式不正确');
        });

        it('应该对无效的 type 返回错误', () => {
            const result = validateCommitMessage('invalid: some message');

            expect(result.isValid).to.be.false;
            expect(result.errors[0]).to.include('无效的提交类型');
        });

        it('应该验证所有有效的默认 type', () => {
            const types = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'];

            for (const type of types) {
                const result = validateCommitMessage(`${type}: test message`);
                expect(result.isValid).to.be.true;
            }
        });

        it('应该对超长的 subject 返回错误', () => {
            const longSubject = 'a'.repeat(60);
            const result = validateCommitMessage(`feat: ${longSubject}`);

            expect(result.isValid).to.be.false;
            expect(result.errors[0]).to.include('长度超过限制');
        });

        it('应该对过短的 subject 返回错误', () => {
            const result = validateCommitMessage('feat: ab');

            expect(result.isValid).to.be.false;
            expect(result.errors[0]).to.include('长度不足');
        });

        it('应该在 subject 以句号结尾时返回警告', () => {
            const result = validateCommitMessage('feat: add feature.');

            expect(result.isValid).to.be.true;
            expect(result.warnings).to.include('subject 不应以句号结尾');
        });

        it('应该在 scopeRequired 为 true 时验证 scope', () => {
            const config: IPluginConfig = {
                ...DEFAULT_CONFIG,
                scopeRequired: true
            };

            const result = validateCommitMessage('feat: no scope', config);

            expect(result.isValid).to.be.false;
            expect(result.errors).to.include('scope 是必填项');
        });

        it('应该在 bodyRequired 为 true 时验证 body', () => {
            const config: IPluginConfig = {
                ...DEFAULT_CONFIG,
                bodyRequired: true
            };

            const result = validateCommitMessage('feat: no body', config);

            expect(result.isValid).to.be.false;
            expect(result.errors).to.include('body 是必填项');
        });

        it('应该支持自定义 types', () => {
            const config: IPluginConfig = {
                ...DEFAULT_CONFIG,
                types: ['custom', 'special']
            };

            const result1 = validateCommitMessage('custom: test', config);
            expect(result1.isValid).to.be.true;

            const result2 = validateCommitMessage('feat: test', config);
            expect(result2.isValid).to.be.false;
        });

        it('应该支持自定义 subjectMaxLength', () => {
            const config: IPluginConfig = {
                ...DEFAULT_CONFIG,
                subjectMaxLength: 20
            };

            const result = validateCommitMessage('feat: this is a longer message', config);

            expect(result.isValid).to.be.false;
            expect(result.errors[0]).to.include('长度超过限制');
        });

    });

    describe('validateType', () => {

        it('应该对有效的 type 返回 true', () => {
            const result = validateType('feat');
            expect(result.isValid).to.be.true;
        });

        it('应该对空 type 返回错误', () => {
            const result = validateType('');
            expect(result.isValid).to.be.false;
            expect(result.errors).to.include('请选择提交类型');
        });

        it('应该对无效的 type 返回错误', () => {
            const result = validateType('invalid');
            expect(result.isValid).to.be.false;
        });

    });

    describe('validateSubject', () => {

        it('应该对有效的 subject 返回 true', () => {
            const result = validateSubject('add new feature');
            expect(result.isValid).to.be.true;
        });

        it('应该对空 subject 返回错误', () => {
            const result = validateSubject('');
            expect(result.isValid).to.be.false;
            expect(result.errors).to.include('subject 不能为空');
        });

        it('应该对过长的 subject 返回错误', () => {
            const result = validateSubject('a'.repeat(60));
            expect(result.isValid).to.be.false;
        });

    });

    describe('buildCommitMessage', () => {

        it('应该构建简单的 commit 信息', () => {
            const result = buildCommitMessage('feat', undefined, 'add feature');
            expect(result).to.equal('feat: add feature');
        });

        it('应该构建带 scope 的 commit 信息', () => {
            const result = buildCommitMessage('fix', 'auth', 'fix bug');
            expect(result).to.equal('fix(auth): fix bug');
        });

        it('应该构建带 body 的 commit 信息', () => {
            const result = buildCommitMessage('feat', 'api', 'add endpoint', 'This is the body');
            expect(result).to.equal('feat(api): add endpoint\n\nThis is the body');
        });

        it('应该构建完整的 commit 信息', () => {
            const result = buildCommitMessage(
                'feat',
                'auth',
                'add login',
                'Added login feature',
                'Closes #123'
            );

            expect(result).to.include('feat(auth): add login');
            expect(result).to.include('Added login feature');
            expect(result).to.include('Closes #123');
        });

    });

});
