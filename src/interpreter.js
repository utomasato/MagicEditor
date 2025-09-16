/**
 * PostScript風のmpsコードを解釈して実行するスタックベースの仮想マシン
 */
class PostscriptInterpreter {
    constructor() {
        this.operandStack = [];
        this.buildCoreDictionary();
    }

    buildCoreDictionary() {
        this.coreDefs = new Map();
        // --- Stack Operations ---
        this.coreDefs.set('pop', () => {
            if (this.operandStack.length < 1) throw new Error("Stack underflow in 'pop'");
            this.operandStack.pop();
        });
        this.coreDefs.set('dup', () => {
            if (this.operandStack.length < 1) throw new Error("Stack underflow in 'dup'");
            const a = this.operandStack[this.operandStack.length - 1];
            this.operandStack.push(a);
        });
         this.coreDefs.set('exch', () => {
            if (this.operandStack.length < 2) throw new Error("Stack underflow in 'exch'");
            const b = this.operandStack.pop();
            const a = this.operandStack.pop();
            this.operandStack.push(b);
            this.operandStack.push(a);
        });
        // --- Arithmetic ---
        this.coreDefs.set('add', () => {
            if (this.operandStack.length < 2) throw new Error("Stack underflow in 'add'");
            const b = this.operandStack.pop();
            const a = this.operandStack.pop();
            this.operandStack.push(a + b);
        });
        this.coreDefs.set('sub', () => {
            if (this.operandStack.length < 2) throw new Error("Stack underflow in 'sub'");
            const b = this.operandStack.pop();
            const a = this.operandStack.pop();
            this.operandStack.push(a - b);
        });
        this.coreDefs.set('mul', () => {
            if (this.operandStack.length < 2) throw new Error("Stack underflow in 'mul'");
            const b = this.operandStack.pop();
            const a = this.operandStack.pop();
            this.operandStack.push(a * b);
        });
        this.coreDefs.set('div', () => {
            if (this.operandStack.length < 2) throw new Error("Stack underflow in 'div'");
            const b = this.operandStack.pop();
            const a = this.operandStack.pop();
            this.operandStack.push(a / b);
        });
    }

    tokenize(str) {
        const regex = /<|>|\[|\]|\(.*?\)|\S+/g;
        return str.match(regex) || [];
    }

    execute(codeString) {
        this.operandStack = [];
        const tokens = this.tokenize(codeString);

        for (const token of tokens) {
            if (!isNaN(parseFloat(token)) && isFinite(token)) {
                this.operandStack.push(parseFloat(token));
            }
            else if (token.startsWith('(') && token.endsWith(')')) {
                this.operandStack.push(token.slice(1, -1));
            }
            else if (this.coreDefs.has(token)) {
                this.coreDefs.get(token)();
            }
            else {
                 this.operandStack.push(token);
            }
        }
        return this.operandStack;
    }
}

/**
 * Lisp風のS式を解釈して実行するインタープリタ
 */
class LispInterpreter {
    constructor() {
        this.env = this.createGlobalEnv();
    }

    createGlobalEnv() {
        const env = new Map();
        env.set('add', (args) => args.reduce((a, b) => a + b, 0));
        env.set('sub', (args) => args.length === 1 ? -args[0] : args.reduce((a, b) => a - b));
        env.set('mul', (args) => args.reduce((a, b) => a * b, 1));
        env.set('div', (args) => args.reduce((a, b) => a / b));
        // Alias
        env.set('+', env.get('add'));
        env.set('-', env.get('sub'));
        env.set('*', env.get('mul'));
        env.set('/', env.get('div'));
        return env;
    }

    tokenize(str) {
        return str.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ').trim().split(/\s+/);
    }

    parse(tokens) {
        if (tokens.length === 0) throw new Error("Unexpected EOF");
        const token = tokens.shift();
        if (token === '(') {
            const list = [];
            while (tokens[0] !== ')') {
                list.push(this.parse(tokens));
            }
            tokens.shift(); // pop ')'
            return list;
        } else if (token === ')') {
            throw new Error("Unexpected ')'");
        } else {
            const num = parseFloat(token);
            return isNaN(num) ? token : num;
        }
    }

    evaluate(x, env = this.env) {
        if (typeof x === 'string') {
            return env.get(x);
        } else if (typeof x === 'number') {
            return x;
        } else if (!Array.isArray(x)) {
            throw new Error("Invalid expression");
        } else if (x.length === 0) {
            return null; // Empty list evaluates to null
        } else {
            const proc = this.evaluate(x[0], env);
            if (typeof proc !== 'function') throw new Error(`${x[0]} is not a function`);
            const args = x.slice(1).map(arg => this.evaluate(arg, env));
            return proc(args);
        }
    }
    
    execute(codeString) {
        // Lispは通常一つの式を評価するが、ここでは最初の式のみを評価する
        const tokens = this.tokenize(`(${codeString})`);
        const parsed = this.parse(tokens);
        const result = this.evaluate(parsed);
        // UIの一貫性のため、結果を配列でラップして返す
        return [result];
    }
}

