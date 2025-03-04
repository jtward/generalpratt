const times = (n, f) => {
    const r = [];
	let index = -1;
	while (++index < n) {
		r.push(f());
	}
    return r;
};

const identity = (a) => a;
const valid = () => true;

const syntaxError = (message) => {
	return {
		name: 'SyntaxError',
		message
	};
};

const END = {
	id: {}
};

const expect = (token, expectedId) => {
	if (token.id !== expectedId) {
		const end = 'end of input';
		const expectedString = (expectedId === END.id) ? end : `'${expectedId}'`;
		const foundString = (token === END) ? end : `'${token.value}'`;

		throw syntaxError(`Expected ${expectedString} but found ${foundString}.`);
	}
};

const parseTree = ({ id, value, loc, transform, verify }, subtrees) => {
	const node = {
		id,
		value,
		loc,
		subtrees
	};

	const validity = verify(node);
	if (validity === true) {
		return transform(node);
	}
	else {
		throw syntaxError(validity);
	}
};

const parseExpression = (symbols) => {
	return (tokens) => {
		let peekToken, done;

		const next = () => {
			if (done) {
				throw syntaxError('Unexpected end of input.');
			}

			done = !tokens.length;
			const token = peekToken;
			if (done) {
				peekToken = END;
			}
			else {
				const { type, value, loc } = tokens.shift();
				const symbol = symbols[type === 'operator' ? value : type];

				peekToken = {
					id: symbol.id,
					value,
					subtrees: [],
					leftBindingPower: symbol.leftBindingPower,
					arity: symbol.arity,
					matches: symbol.matches,
					prefix: symbol.prefix,
					transform: symbol.transform,
					verify: symbol.verify,
					loc
				};
			}
			return token;
		};

		const parseExpression = (rightBindingPower) => {
            let token = next();
            let left;
            if (token.arity === 0) {
                left = parseTree(token, undefined);
            } else if (token.prefix) {
                // nud
                const subtrees = times(token.arity, () => parseExpression(token.leftBindingPower));
                left = parseTree(token, subtrees);
                if (token.matches) {
                    expect(peekToken, token.matches);
					next(); // skip over matching token
                }
            } else {
                throw syntaxError(`Expected a value or prefix operator but found \'${token.value}\'.`);
            }
            while (rightBindingPower < peekToken.leftBindingPower) {
                token = next();
                if (token.arity === 1) {
                    left = parseTree(token, [left]);
                } else {
                    left = parseTree(token, [left, parseExpression(token.leftBindingPower)]);
                }
            }
            return left;
		};

		next();
		const ast = parseExpression(0);
		expect(peekToken, END.id);
		return ast;
	};
};

const toSymbol = ({ leftBindingPower = 0, arity = 0, matches, prefix = false, transform = identity, verify = valid }, id) => {
	return {
		id,
		leftBindingPower,
		arity,
		matches,
		prefix,
		transform,
		verify
	};
};

export const expressionParser = (inputSymbols) => {
	const symbols = Object.fromEntries(
		Object.entries(inputSymbols).map(
			([key, value]) => [key, toSymbol(value, key)]));

	return parseExpression(symbols);
};
