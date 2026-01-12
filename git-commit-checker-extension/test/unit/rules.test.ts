/**
 * 规则配置单元测试
 */
import { expect } from 'chai';
import {
    DEFAULT_TYPES,
    DEFAULT_TYPE_DESCRIPTIONS,
    TYPE_EMOJIS,
    getTypeOptions,
    DEFAULT_CONFIG,
    COMMIT_MESSAGE_REGEX,
    VALIDATION_RULES
} from '../../src/config/rules';

describe('Rules Configuration', () => {

    describe('DEFAULT_TYPES', () => {

        it('应该包含所有标准的 conventional commit 类型', () => {
            const expectedTypes = [
                'feat', 'fix', 'docs', 'style', 'refactor',
                'perf', 'test', 'build', 'ci', 'chore', 'revert'
            ];

            for (const type of expectedTypes) {
                expect(DEFAULT_TYPES).to.include(type);
            }
        });

        it('应该有 11 种默认类型', () => {
            expect(DEFAULT_TYPES).to.have.lengthOf(11);
        });

    });

    describe('DEFAULT_TYPE_DESCRIPTIONS', () => {

        it('每个默认类型都应该有描述', () => {
            for (const type of DEFAULT_TYPES) {
                expect(DEFAULT_TYPE_DESCRIPTIONS[type]).to.be.a('string');
                expect(DEFAULT_TYPE_DESCRIPTIONS[type].length).to.be.greaterThan(0);
            }
        });

    });

    describe('TYPE_EMOJIS', () => {

        it('每个默认类型都应该有 emoji', () => {
            for (const type of DEFAULT_TYPES) {
                expect(TYPE_EMOJIS[type]).to.be.a('string');
            }
        });

    });

    describe('getTypeOptions', () => {

        it('应该返回正确格式的类型选项', () => {
            const options = getTypeOptions(DEFAULT_TYPES, DEFAULT_TYPE_DESCRIPTIONS);

            expect(options).to.have.lengthOf(DEFAULT_TYPES.length);

            for (const option of options) {
                expect(option).to.have.property('type');
                expect(option).to.have.property('description');
                expect(option).to.have.property('label');
            }
        });

        it('应该在 label 中包含 emoji', () => {
            const options = getTypeOptions(['feat'], { feat: '新功能' });

            expect(options[0].label).to.include('✨');
            expect(options[0].label).to.include('feat');
        });

    });

    describe('DEFAULT_CONFIG', () => {

        it('应该有正确的默认值', () => {
            expect(DEFAULT_CONFIG.types).to.deep.equal(DEFAULT_TYPES);
            expect(DEFAULT_CONFIG.subjectMaxLength).to.equal(50);
            expect(DEFAULT_CONFIG.subjectMinLength).to.equal(3);
            expect(DEFAULT_CONFIG.scopeRequired).to.be.false;
            expect(DEFAULT_CONFIG.bodyRequired).to.be.false;
        });

    });

    describe('COMMIT_MESSAGE_REGEX', () => {

        it('应该匹配有效的 commit 信息格式', () => {
            const validMessages = [
                'feat: add feature',
                'fix(auth): fix bug',
                'docs: update readme',
                'refactor(api): refactor code',
                'chore: update deps'
            ];

            for (const msg of validMessages) {
                expect(COMMIT_MESSAGE_REGEX.test(msg)).to.be.true;
            }
        });

        it('应该不匹配无效的 commit 信息格式', () => {
            const invalidMessages = [
                'invalid message',
                'no colon here',
                ': missing type',
                'feat without colon'
            ];

            for (const msg of invalidMessages) {
                expect(COMMIT_MESSAGE_REGEX.test(msg)).to.be.false;
            }
        });

        it('应该正确提取 type、scope 和 subject', () => {
            const match = 'fix(auth): fix login bug'.match(COMMIT_MESSAGE_REGEX);

            expect(match).to.not.be.null;
            expect(match![1]).to.equal('fix');
            expect(match![2]).to.equal('auth');
            expect(match![3]).to.equal('fix login bug');
        });

    });

    describe('VALIDATION_RULES', () => {

        describe('TYPE_PATTERN', () => {
            it('应该只匹配小写字母', () => {
                expect(VALIDATION_RULES.TYPE_PATTERN.test('feat')).to.be.true;
                expect(VALIDATION_RULES.TYPE_PATTERN.test('Feat')).to.be.false;
                expect(VALIDATION_RULES.TYPE_PATTERN.test('FEAT')).to.be.false;
                expect(VALIDATION_RULES.TYPE_PATTERN.test('feat1')).to.be.false;
            });
        });

        describe('SCOPE_PATTERN', () => {
            it('应该匹配有效的 scope', () => {
                expect(VALIDATION_RULES.SCOPE_PATTERN.test('auth')).to.be.true;
                expect(VALIDATION_RULES.SCOPE_PATTERN.test('user-api')).to.be.true;
                expect(VALIDATION_RULES.SCOPE_PATTERN.test('api/v2')).to.be.true;
                expect(VALIDATION_RULES.SCOPE_PATTERN.test('module.sub')).to.be.true;
            });

            it('应该不匹配无效的 scope', () => {
                expect(VALIDATION_RULES.SCOPE_PATTERN.test('invalid scope')).to.be.false;
                expect(VALIDATION_RULES.SCOPE_PATTERN.test('scope@special')).to.be.false;
            });
        });

        describe('SUBJECT_NO_PERIOD', () => {
            it('应该匹配不以句号结尾的文本', () => {
                expect(VALIDATION_RULES.SUBJECT_NO_PERIOD.test('add feature')).to.be.true;
                expect(VALIDATION_RULES.SUBJECT_NO_PERIOD.test('fix bug')).to.be.true;
            });

            it('应该不匹配以句号结尾的文本', () => {
                expect(VALIDATION_RULES.SUBJECT_NO_PERIOD.test('add feature.')).to.be.false;
            });
        });

    });

});
