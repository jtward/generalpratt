# GeneralPratt v0.0.1

## Overview

GeneralPratt is a library that outputs Pratt parsers (also known as a top-down operator precedence parsers). The parsers it outputs are inspired by Douglas Crockford's [Top Down Operator Precedence parser for simplified JavaScript](https://crockford.com/javascript/tdop/tdop.html). Pratt parsers handle operator precedence and associativity based on binding powers.

GeneralPratt takes as input the symbols that make up the language to be parsed, and outputs a parser that can be used to parse an array of tokens and construct an abstract syntax tree (AST) as a plain JSON object. This is in contrast to Douglas Crockford's parser which only parses simplified JavaScript. GeneralPratt was developed initially to be used to parse the logic language [CTL](https://en.wikipedia.org/wiki/Computation_tree_logic).

GeneralPratt currently only supports parsing single expressions, which means that in its current state it cannot be used to parse languages that include higher level structures such as statements, and has for example no built-in support for things like variable assignment and scope. However this is sufficient to parse simple languages like CTL.

## Usage example

Suppose we want to be able to parse simple mathematical expressions consisting of addition and multiplication of integer values.

```javascript
import { expressionParser } from 'GeneralPratt';

const symbols = {
  "number": { arity: 0 },
  "+": { leftBindingPower: 10, arity: 2 },
  "*": { leftBindingPower: 20, arity: 2 }
};
const parser = expressionParser(symbols);
const tokens = [
  { type: "number", value: "1" },
  { type: "operator", value: "+" },
  { type: "number", value: "2" },
  { type: "operator", value: "*" },
  { type: "number", value: "3" }
];
const ast = parser(tokens);
```

The resulting AST would look like:

```json
{
  "id": "+",
  "subtrees": [
    {
        "id": "number",
        "value": "1"
    },
    {
      "id": "*",
      "subtrees": [
        {
            "id": "number",
            "value": "2"
        },
        {
            "id": "number",
            "value": "3"
        }
      ]
    }
  ]
}
```
