import { expect } from 'chai';
import { expressionParser } from '../src/index.js';

describe('Pratt Expression Parser', () => {
    // Define symbols for basic arithmetic
    const symbols = {
        number: { arity: 0 },
        '+': {
            arity: 2,
            leftBindingPower: 10, 
        },
        '-': {
            arity: 2,
            leftBindingPower: 10,
        },
        '*': {
            arity: 2,
            leftBindingPower: 20,
        },
        '/': {
            arity: 2,
            leftBindingPower: 20,
        },
        '!': {
            arity: 1,
            leftBindingPower: 30,
        },
        '~': {
            arity: 1,
            prefix: true,
        },
        '(': {
            arity: 1,
            matches: ')',
            leftBindingPower: 0,
            prefix: true,
            transform: (node) => node.subtrees[0],
        },
        ')': { arity: 0 },
        'v': {
            arity: 0,
            verify: () => 'Verification failed, found \'v\'',
        },
        'two-prefix': {
            arity: 2,
            prefix: true,
        },
    };

    const parser = expressionParser(symbols);

    // Helper to create token array from string
    const tokenize = (str) => {
        const tokens = [];
        str.split(/\s+/).forEach((value, index) => {
            const type = isNaN(value) ? 'operator' : 'number';
            tokens.push({
                type,
                value,
                loc: { start: index, end: index + 1 }
            });
        });
        return tokens;
    };

    it('parses a single number', () => {
        const tokens = tokenize('42');
        const ast = parser(tokens);
        expect(ast).to.deep.equal({
            id: 'number',
            value: '42',
            loc: { start: 0, end: 1 },
            subtrees: undefined
        });
    });

    it('handles unary prefix operators', () => {
        const tokens = tokenize('~ 3');
        const ast = parser(tokens);
        expect(ast).to.deep.equal({
            id: '~',
            value: '~',
            loc: { start: 0, end: 1 },
            subtrees: [{ id: 'number', value: '3', loc: { start: 1, end: 2 }, subtrees: undefined }]
        });
    });

    it('handles consecutive unary prefix operators', () => {
        const tokens = tokenize('~ ~ 3');
        const ast = parser(tokens);
        expect(ast).to.deep.equal({
            id: '~',
            value: '~',
            loc: { start: 0, end: 1 },
            subtrees: [{
                id: '~',
                value: '~',
                loc: { start: 1, end: 2 },
                subtrees: [{ id: 'number', value: '3', loc: { start: 2, end: 3 }, subtrees: undefined }]
            }]
        });
    });

    it('handles postfix operators', () => {
        const tokens = tokenize('3 !');
        const ast = parser(tokens);
        expect(ast).to.deep.equal({
            id: '!',
            value: '!',
            loc: { start: 1, end: 2 },
            subtrees: [{ id: 'number', value: '3', loc: { start: 0, end: 1 }, subtrees: undefined }]
        });
    });

    it('parses simple addition', () => {
        const tokens = tokenize('1 + 2');
        const ast = parser(tokens);
        expect(ast).to.deep.equal({
            id: '+',
            value: '+',
            loc: { start: 1, end: 2 },
            subtrees: [
                { id: 'number', value: '1', loc: { start: 0, end: 1 }, subtrees: undefined },
                { id: 'number', value: '2', loc: { start: 2, end: 3 }, subtrees: undefined }
            ]
        });
    });

    it('respects operator precedence (multiplication before addition)', () => {
        const tokens = tokenize('2 + 3 * 4');
        const ast = parser(tokens);
        expect(ast).to.deep.equal({
            id: '+',
            value: '+',
            loc: { start: 1, end: 2 },
            subtrees: [
                { id: 'number', value: '2', loc: { start: 0, end: 1 }, subtrees: undefined },
                {
                    id: '*',
                    value: '*',
                    loc: { start: 3, end: 4 },
                    subtrees: [
                        { id: 'number', value: '3', loc: { start: 2, end: 3 }, subtrees: undefined },
                        { id: 'number', value: '4', loc: { start: 4, end: 5 }, subtrees: undefined }
                    ]
                }
            ]
        });
    });

    it('respects operator precedence 2 (multiplication before addition)', () => {
        const tokens = tokenize('2 * 3 + 4');
        const ast = parser(tokens);
        expect(ast).to.deep.equal({
            id: '+',
            value: '+',
            loc: { start: 3, end: 4 },
            subtrees: [
                {
                    id: '*',
                    value: '*',
                    loc: { start: 1, end: 2 },
                    subtrees: [
                        { id: 'number', value: '2', loc: { start: 0, end: 1 }, subtrees: undefined },
                        { id: 'number', value: '3', loc: { start: 2, end: 3 }, subtrees: undefined }
                    ]
                },
                { id: 'number', value: '4', loc: { start: 4, end: 5 }, subtrees: undefined }
            ]
        });
    });

    it('handles parentheses for grouping', () => {
        const tokens = tokenize('( 2 + 3 ) * 4');
        const ast = parser(tokens);
        expect(ast).to.deep.equal({
            id: '*',
            value: '*',
            loc: { start: 5, end: 6 },
            subtrees: [
                {
                    id: '+',
                    value: '+',
                    loc: { start: 2, end: 3 },
                    subtrees: [
                        { id: 'number', value: '2', loc: { start: 1, end: 2 }, subtrees: undefined },
                        { id: 'number', value: '3', loc: { start: 3, end: 4 }, subtrees: undefined }
                    ]
                },
                { id: 'number', value: '4', loc: { start: 6, end: 7 }, subtrees: undefined }
            ]
        });
    });

    it('handles prefix operators before a grouping operator', () => {
        const tokens = tokenize('~ ( 3 + 4 )');
        const ast = parser(tokens);
        expect(ast).to.deep.equal({
            id: '~',
            value: '~',
            loc: { start: 0, end: 1 },
            subtrees: [{
                id: '+',
                value: '+',
                loc: { start: 3, end: 4 },
                subtrees: [
                    { id: 'number', value: '3', loc: { start: 2, end: 3 }, subtrees: undefined },
                    { id: 'number', value: '4', loc: { start: 4, end: 5 }, subtrees: undefined }
                ]
            }]
        });
    });

    it('handles prefix and postfix operators', () => {
        const tokens = tokenize('~ 3 !');
        const ast = parser(tokens);
        expect(ast).to.deep.equal({
            id: '~',
            value: '~',
            loc: { start: 0, end: 1 },
            subtrees: [{
                id: '!',
                value: '!',
                loc: { start: 2, end: 3 },
                subtrees: [{ id: 'number', value: '3', loc: { start: 1, end: 2 }, subtrees: undefined }]
            }]
        });
    });

    it('handles 2-ary prefix operators', () => {
        const tokens = tokenize('two-prefix 3 4');
        const ast = parser(tokens);
        expect(ast).to.deep.equal({
            id: 'two-prefix',
            value: 'two-prefix',
            loc: { start: 0, end: 1 },
            subtrees: [
                { id: 'number', value: '3', loc: { start: 1, end: 2 }, subtrees: undefined },
                { id: 'number', value: '4', loc: { start: 2, end: 3 }, subtrees: undefined }
            ]
        });
    });

    it('throws syntax error on mismatched parentheses', () => {
        const tokens = tokenize('( 2 + 3');
        expect(() => parser(tokens)).to.throw(/Expected '\)' but found end of input/);
    });

    it('throws syntax error on unexpected operator', () => {
        const tokens = tokenize('2 + + 3');
        expect(() => parser(tokens)).to.throw(/Expected a value or prefix operator but found '\+'/);
    });

    it('throws syntax error on incomplete expression', () => {
        const tokens = tokenize('2 +');
        expect(() => parser(tokens)).to.throw(/Unexpected end of input/);
    });

    it('throws an error when a postfix operator is used prefix', () => {
        const tokens = tokenize('! 3');
        expect(() => parser(tokens)).to.throw(/Expected a value or prefix operator but found '!'/);
    });

    it('throws syntax error when a unary operator is used in infix position', () => {
        const tokens = tokenize('( 2 + 3 ) ! 4');
        expect(() => parser(tokens)).to.throw(/Expected end of input but found '4'/);
    });

    it('throws an error when verifying a token fails', () => {
        const tokens = tokenize('v');
        expect(() => parser(tokens)).to.throw(/Verification failed, found 'v'/);
    });
});