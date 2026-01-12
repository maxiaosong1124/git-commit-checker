/**
 * 工具函数单元测试
 */
import { expect } from 'chai';
import {
    getErrorMessage,
    truncate,
    formatFileSize,
    escapeRegex,
    capitalize
} from '../../src/utils/helpers';

describe('Helpers', () => {

    describe('getErrorMessage', () => {

        it('应该从 Error 对象获取消息', () => {
            const error = new Error('test error');
            expect(getErrorMessage(error)).to.equal('test error');
        });

        it('应该处理字符串错误', () => {
            expect(getErrorMessage('string error')).to.equal('string error');
        });

        it('应该将其他类型转换为字符串', () => {
            expect(getErrorMessage(123)).to.equal('123');
            expect(getErrorMessage(null)).to.equal('null');
        });

    });

    describe('truncate', () => {

        it('应该截断超长字符串', () => {
            const result = truncate('this is a long string', 10);
            expect(result).to.equal('this is...');
            expect(result.length).to.equal(10);
        });

        it('应该保持短字符串不变', () => {
            expect(truncate('short', 10)).to.equal('short');
        });

        it('应该处理边界情况', () => {
            expect(truncate('12345', 5)).to.equal('12345');
            expect(truncate('123456', 5)).to.equal('12...');
        });

    });

    describe('formatFileSize', () => {

        it('应该格式化字节', () => {
            expect(formatFileSize(0)).to.equal('0 B');
            expect(formatFileSize(500)).to.equal('500 B');
        });

        it('应该格式化 KB', () => {
            expect(formatFileSize(1024)).to.equal('1 KB');
            expect(formatFileSize(2048)).to.equal('2 KB');
        });

        it('应该格式化 MB', () => {
            expect(formatFileSize(1024 * 1024)).to.equal('1 MB');
        });

        it('应该格式化 GB', () => {
            expect(formatFileSize(1024 * 1024 * 1024)).to.equal('1 GB');
        });

    });

    describe('escapeRegex', () => {

        it('应该转义正则表达式特殊字符', () => {
            expect(escapeRegex('hello.world')).to.equal('hello\\.world');
            expect(escapeRegex('a*b+c?')).to.equal('a\\*b\\+c\\?');
            expect(escapeRegex('[test]')).to.equal('\\[test\\]');
            expect(escapeRegex('(a|b)')).to.equal('\\(a\\|b\\)');
        });

        it('应该保持普通字符串不变', () => {
            expect(escapeRegex('hello world')).to.equal('hello world');
            expect(escapeRegex('abc123')).to.equal('abc123');
        });

    });

    describe('capitalize', () => {

        it('应该将首字母大写', () => {
            expect(capitalize('hello')).to.equal('Hello');
            expect(capitalize('world')).to.equal('World');
        });

        it('应该处理空字符串', () => {
            expect(capitalize('')).to.equal('');
        });

        it('应该保持已大写的字符串', () => {
            expect(capitalize('Hello')).to.equal('Hello');
        });

        it('应该只改变第一个字符', () => {
            expect(capitalize('hELLO')).to.equal('HELLO');
        });

    });

});
