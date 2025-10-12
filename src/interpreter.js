/**
 * 魔法陣のコードを解釈し、実行するインタープリタ群。
 * 異なる言語仕様（PostScript, Lispなど）を試せるように、クラスとして定義されています。
 */

// =============================================
// PostScript風インタープリタ
// =============================================
class PostscriptInterpreter {
    constructor() {
        this.stack = [];
        this.dictStack = [{}];
        this.commandLoopLevel = 0;
        this.output = [];

        this.commands = {
            pop: () => { this.stack.pop(); },
            exch: () => { const [a, b] = [this.stack.pop(), this.stack.pop()]; this.stack.push(a, b); },
            dup: () => { const a = this.stack[this.stack.length - 1]; this.stack.push(a); },
            copy: () => {
                const n = this.stack.pop();
                const items = this.stack.slice(-n);
                this.stack.push(...items);
            },
            index: () => {
                const n = this.stack.pop();
                this.stack.push(this.stack[this.stack.length - 1 - n]);
            },
            roll: () => {
                let [count, n] = [this.stack.pop(), this.stack.pop()];
                if (n < 0) return;
                const items = this.stack.splice(this.stack.length - n);
                count = count % n;
                if (count < 0) count += n;
                const rotated = items.slice(-count).concat(items.slice(0, -count));
                this.stack.push(...rotated);
            },
            add: () => { const [b, a] = [this.stack.pop(), this.stack.pop()]; this.stack.push(a + b); },
            sub: () => { const [b, a] = [this.stack.pop(), this.stack.pop()]; this.stack.push(a - b); },
            mul: () => { const [b, a] = [this.stack.pop(), this.stack.pop()]; this.stack.push(a * b); },
            div: () => { const [b, a] = [this.stack.pop(), this.stack.pop()]; this.stack.push(a / b); },
            idiv: () => { const [b, a] = [this.stack.pop(), this.stack.pop()]; this.stack.push(Math.trunc(a / b)); },
            mod: () => { const [b, a] = [this.stack.pop(), this.stack.pop()]; this.stack.push(a % b); },
            abs: () => { this.stack.push(Math.abs(this.stack.pop())); },
            neg: () => { this.stack.push(-this.stack.pop()); },
            sqrt: () => { this.stack.push(Math.sqrt(this.stack.pop())); },
            atan: () => { const [x, y] = [this.stack.pop(), this.stack.pop()]; this.stack.push(Math.atan2(y, x) * 180 / Math.PI); },
            cos: () => { this.stack.push(Math.cos(this.stack.pop() * Math.PI / 180)); },
            sin: () => { this.stack.push(Math.sin(this.stack.pop() * Math.PI / 180)); },
            rand: () => { this.stack.push(Math.floor(Math.random() * 2147483647)); },
            srand: () => { /* Not implemented */ },
            rrand: () => { /* Not implemented */ },
            length: () => {
                const obj = this.stack.pop();
                let len;
                if (typeof obj === 'object' && obj !== null && (obj.type === 'array' || obj.type === 'string') && Array.isArray(obj.value)) {
                    len = obj.value.length;
                } else if (typeof obj === 'object' && obj !== null && obj.type === 'dict') {
                    len = Object.keys(obj.value).length;
                } else if (typeof obj === 'string') {
                    len = obj.length;
                } else {
                    throw new Error("`length` requires an array, dictionary, or string.");
                }
                this.stack.push(len);
            },
            get: () => {
                const indexOrKey = this.stack.pop();
                const collection = this.stack.pop();
                let val = null;

                if (typeof collection === 'object' && collection !== null && collection.type === 'array' && Array.isArray(collection.value)) {
                    val = collection.value[indexOrKey];
                } else if (typeof collection === 'object' && collection !== null && collection.type === 'string' && Array.isArray(collection.value)) {
                    val = collection.value[indexOrKey].charCodeAt(0);
                } else if (typeof collection === 'object' && collection !== null && collection.type === 'dict') {
                    // 連想配列として直接アクセス
                    val = collection.value[String(indexOrKey)];
                } else {
                    throw new Error("`get` requires an array, dictionary, or string.");
                }
                this.stack.push(val !== undefined ? val : null); // 見つからない場合はnullをpush
            },
            put: () => {
                const value = this.stack.pop();
                const indexOrKey = this.stack.pop();
                const collection = this.stack.pop();

                if (typeof collection === 'object' && collection !== null && collection.type === 'array' && Array.isArray(collection.value)) {
                    collection.value[indexOrKey] = value;
                } else if (typeof collection === 'object' && collection !== null && collection.type === 'string' && Array.isArray(collection.value)) {
                    collection.value[indexOrKey] = String.fromCharCode(value);
                } else if (typeof collection === 'object' && collection !== null && collection.type === 'dict') {
                    // 連想配列として直接値を設定
                    collection.value[String(indexOrKey)] = value;
                } else {
                    throw new Error("`put` requires an array, dictionary, or string.");
                }
            },
            string: () => {
                const n = this.stack.pop();
                this.stack.push({ type: 'string', value: new Array(n).fill('\0') });
            },
            cvi: () => {
                const str = this.stack.pop();
                let charCode = -1;
                if (typeof str === 'object' && str !== null && str.type === 'string' && str.value.length > 0) {
                    charCode = str.value[0].charCodeAt(0);
                } else if (typeof str === 'string' && str.length > 0) {
                    charCode = str.charCodeAt(0);
                } else {
                    throw new Error("`cvi` requires a string.");
                }
                this.stack.push(charCode);
            },
            chr: () => {
                const charCode = this.stack.pop();
                if (typeof charCode !== 'number') {
                    throw new Error("`chr` requires an integer.");
                }
                this.stack.push({ type: 'string', value: [String.fromCharCode(charCode)] });
            },
            getinterval: () => { const [count, index, arr] = [this.stack.pop(), this.stack.pop(), this.stack.pop()]; this.stack.push(arr.slice(index, index + count)); },
            putinterval: () => { const [subArr, index, arr] = [this.stack.pop(), this.stack.pop(), this.stack.pop()]; arr.splice(index, subArr.length, ...subArr); },
            array: () => {
                const n = this.stack.pop();
                if (typeof n !== 'number' || !Number.isInteger(n) || n < 0) {
                    throw new Error("`array` requires a non-negative integer.");
                }
                const newArr = new Array(n).fill(null);
                this.stack.push({ type: 'array', value: newArr });
            },
            forall: () => {
                const proc = this.stack.pop();
                const collection = this.stack.pop();
                
                const procedure = Array.isArray(proc) ? proc : (proc.value || []);

                if (typeof collection === 'object' && collection !== null && collection.type === 'array' && Array.isArray(collection.value)) {
                     for (const token of collection.value) {
                        this.stack.push(token); // 配列の要素をスタックに積む
                        this.run(procedure);
                    }
                } else if (typeof collection === 'object' && collection !== null && collection.type === 'dict') {
                    for (const [key, value] of Object.entries(collection.value)) {
                        this.stack.push(key);
                        this.stack.push(value);
                        this.run(procedure);
                    }
                } else if (Array.isArray(collection)) { // 生の配列もサポート
                     for (const item of collection) {
                        this.stack.push(item);
                        this.run(procedure);
                    }
                } else {
                    throw new Error("`forall` requires an array or dictionary on the stack.");
                }
            },
            dict: () => { this.stack.push({ type: 'dict', value: {} }); }, // 修正: 空のオブジェクトを生成
            def: () => {
                const value = this.stack.pop();
                let key = this.stack.pop();
                if (typeof key !== 'string' || !key.startsWith('~')) {
                    throw new Error("`def` requires a literal name (e.g., ~myVar) as a key.");
                }
                this.dictStack[this.dictStack.length - 1][key.substring(1)] = value;
            },
            eq: () => { const [b, a] = [this.stack.pop(), this.stack.pop()]; this.stack.push(a === b); },
            ne: () => { const [b, a] = [this.stack.pop(), this.stack.pop()]; this.stack.push(a !== b); },
            ge: () => { const [b, a] = [this.stack.pop(), this.stack.pop()]; this.stack.push(a >= b); },
            gt: () => { const [b, a] = [this.stack.pop(), this.stack.pop()]; this.stack.push(a > b); },
            le: () => { const [b, a] = [this.stack.pop(), this.stack.pop()]; this.stack.push(a <= b); },
            lt: () => { const [b, a] = [this.stack.pop(), this.stack.pop()]; this.stack.push(a < b); },
            and: () => { const [b, a] = [this.stack.pop(), this.stack.pop()]; this.stack.push(a && b); },
            or: () => { const [b, a] = [this.stack.pop(), this.stack.pop()]; this.stack.push(a || b); },
            xor: () => { const [b, a] = [this.stack.pop(), this.stack.pop()]; this.stack.push(Boolean(a) !== Boolean(b)); },
            not: () => { this.stack.push(!this.stack.pop()); },
            true: () => { this.stack.push(true); },
            false: () => { this.stack.push(false); },
            null: () => { this.stack.push(null); },
            exec: () => {
                const proc = this.stack.pop();
                if (proc === undefined) {
                    throw new Error("`exec`: Stack underflow. Requires a procedure on the stack.");
                }
                if (Array.isArray(proc)) {
                    this.run(proc);
                    return;
                }
                if (typeof proc === 'string' && proc.startsWith('~')) {
                    const value = this.lookupVariable(proc.substring(1));
                    if (value === undefined) throw new Error(`\`exec\`: Undefined variable ${proc}`);
                    if (Array.isArray(value)) {
                        this.run(value);
                        return;
                    }
                }
                throw new Error(`\`exec\`: Requires a procedure but received a different type.`);
            },
            if: () => {
                const proc = this.stack.pop();
                const bool = this.stack.pop();
                if (bool) this.run(proc);
            },
            ifelse: () => {
                const proc2 = this.stack.pop();
                const proc1 = this.stack.pop();
                const bool = this.stack.pop();
                if (bool) this.run(proc1);
                else this.run(proc2);
            },
            repeat: () => {
                const proc = this.stack.pop();
                const n = this.stack.pop();
                for (let i = 0; i < n; i++) this.run(proc);
            },
            for: () => {
                const proc = this.stack.pop();
                const limit = this.stack.pop();
                const inc = this.stack.pop();
                let i = this.stack.pop();
                if (inc > 0) {
                    for (; i <= limit; i += inc) { this.stack.push(i); this.run(proc); }
                } else {
                    for (; i >= limit; i += inc) { this.stack.push(i); this.run(proc); }
                }
            },
            loop: () => {
                const proc = this.stack.pop();
                this.commandLoopLevel++;
                try {
                    while (true) { this.run(proc); }
                } catch (e) {
                    if (e.message === 'EXIT_LOOP' && e.level === this.commandLoopLevel) {} 
                    else { throw e; }
                } finally {
                    this.commandLoopLevel--;
                }
            },
            exit: () => { throw { message: 'EXIT_LOOP', level: this.commandLoopLevel }; },
            magicactivate: () => {
                const val = this.stack.pop();
                let key = null;
                if (this.stack.length > 0 && typeof this.stack[this.stack.length - 1] === 'string' && this.stack[this.stack.length - 1].startsWith('~')) {
                    key = this.stack.pop();
                }
                
                const id = crypto.randomUUID(); // Generate a unique ID
                const resolvedVal = this.resolveVariablesInStructure(val);
                
                const data = {
                    isActive: true,
                    message: "MagicSpell",
                    value: 0,
                    id: id, // Changed from 'name'
                    text: this.formatForOutput(resolvedVal)
                };

                sendJsonToUnity("JsReceiver", "ReceiveGeneralData", data);

                if (key) {
                    const variableName = key.substring(1);
                    // Store the reference with the ID
                    const unityObjectRef = { type: 'unityObject', value: id }; 
                    this.dictStack[this.dictStack.length - 1][variableName] = unityObjectRef;
                }
            },
            transform: () => {
                const transformDict = this.stack.pop();
                const unityObjectRef = this.stack.pop();
                if (typeof unityObjectRef !== 'object' || unityObjectRef === null || unityObjectRef.type !== 'unityObject' || !unityObjectRef.value) {
                    throw new Error("`transform` requires a Unity object reference on the stack.");
                }

                const resolvedDict = this.resolveVariablesInStructure(transformDict);
                const data = {
                    message: "TransformObject",
                    id: unityObjectRef.value, // Use the ID from the object reference
                    text: this.formatForOutput(resolvedDict)
                };

                sendJsonToUnity("JsReceiver", "ReceiveGeneralData", data);
            },
            animation: () => {
                const animationDict = this.stack.pop();
                const unityObjectRef = this.stack.pop();
                if (typeof unityObjectRef !== 'object' || unityObjectRef === null || unityObjectRef.type !== 'unityObject' || !unityObjectRef.value) {
                    throw new Error("`transform` requires a Unity object reference on the stack.");
                }

                const resolvedDict = this.resolveVariablesInStructure(animationDict);
                const data = {
                    message: "Animation",
                    id: unityObjectRef.value, // Use the ID from the object reference
                    text: this.formatForOutput(resolvedDict)
                };

                sendJsonToUnity("JsReceiver", "ReceiveGeneralData", data);
            },
            print: () => {
                const val = this.stack.pop();
                if (typeof val === 'object' && val !== null && val.type === 'string') {
                    this.output.push(val.value.join(''));
                } else if (typeof val === 'string') {
                    this.output.push(val);
                } else {
                    this.output.push(this.formatForOutput(val));
                }
            },
            stack: () => {
                [...this.stack].reverse().forEach(val => {
                    this.output.push(this.formatForOutput(val));
                });
            },
            color: () => { 
                const [b, g, r] = [this.stack.pop(), this.stack.pop(), this.stack.pop()];
                this.stack.push(['color', r, g, b]);
            }
        };
    }
    
    resolveVariablesInStructure(structure) {
        if (typeof structure !== 'object' || structure === null) {
            if (typeof structure === 'string' && !structure.startsWith('~') && isNaN(parseFloat(structure))) {
                 const lookedUpValue = this.lookupVariable(structure);
                 return lookedUpValue !== undefined ? lookedUpValue : structure;
            }
            return structure;
        }

        if (Array.isArray(structure)) {
            return structure.map(item => this.resolveVariablesInStructure(item));
        }

        if (structure.type === 'array') {
            if (Array.isArray(structure.value)) {
                const newStructure = { ...structure };
                newStructure.value = structure.value.map(item => this.resolveVariablesInStructure(item));
                return newStructure;
            }
        }
        
        if (structure.type === 'dict') {
            const newStructure = { ...structure, value: {} };
            for (const key in structure.value) {
                if (Object.hasOwnProperty.call(structure.value, key)) {
                    // キーは変数解決しない（通常はリテラルのため）
                    const resolvedValue = this.resolveVariablesInStructure(structure.value[key]);
                    newStructure.value[key] = resolvedValue;
                }
            }
            return newStructure;
        }
        
        return structure;
    }
    
    formatForOutput(val) {
        if (val === null) return 'null';
        if (val === undefined) return 'undefined';
        const type = typeof val;
        if (type !== 'object') {
            return String(val);
        }
        if (Array.isArray(val)) {
            return `{${val.map(item => this.formatForOutput(item)).join(' ')}}`;
        }
        if (!val.type) {
             // 一般的なオブジェクトの場合
            return JSON.stringify(val);
        }
        switch (val.type) {
            case 'unityObject':
                //return "unity";
                return `UnityObject: ${val.value}`;
            case 'string':
                const stringContent = Array.isArray(val.value) ? val.value.join('') : '';
                return `(${stringContent})`;
            case 'array':
                const arrayContent = Array.isArray(val.value)
                    ? val.value.map(item => this.formatForOutput(item)).join(' ')
                    : '';
                return `[${arrayContent}]`;
            case 'dict':
                const dictContent = Object.entries(val.value)
                    .map(([key, value]) => `${key} ${this.formatForOutput(value)}`)
                    .join(' ');
                return `<${dictContent}>`;
            default:
                return `[Unknown Type: ${val.type}]`;
        }
    }

    parse(code) {
        const tokens = [];
        let i = 0;
        while (i < code.length) {
            const char = code[i];

            if (/\s/.test(char)) {
                i++;
                continue;
            }

            if (char === '{' || char === '[') {
                const startBracket = char;
                const endBracket = { '{': '}', '[': ']' }[startBracket];
                let level = 1;
                let content = '';
                i++;
                while (i < code.length && level > 0) {
                    const current_char = code[i];
                    if (current_char === '(') {
                        let str_level = 1;
                        content += current_char;
                        i++;
                         while(i < code.length && str_level > 0) {
                            if(code[i] === '(') str_level++;
                            if(code[i] === ')') str_level--;
                            content += code[i];
                            i++;
                        }
                        continue;
                    }
                    if (current_char === startBracket) level++;
                    if (current_char === endBracket) level--;
                    if (level > 0) content += current_char;
                    i++;
                }
                if (level !== 0) throw new Error(`Mismatched brackets. Expected '${endBracket}' but not found.`);

                const innerTokens = this.parse(content);
                if (startBracket === '{') {
                    tokens.push(innerTokens);
                } else { // '['
                    tokens.push({ type: 'array', value: innerTokens });
                }
                continue;
            }
            
            if (char === '<') {
                let level = 1;
                let content = '';
                i++;
                while (i < code.length && level > 0) {
                    const current_char = code[i];
                    if (current_char === '<') level++;
                    if (current_char === '>') level--;
                    if (level > 0) content += current_char;
                    i++;
                }
                if (level !== 0) throw new Error("Mismatched angle brackets for dictionary.");

                const innerTokens = this.parse(content);
                const dictObject = {};
                if (innerTokens.length % 2 !== 0) {
                    throw new Error("Dictionary literal must have an even number of elements (key-value pairs).");
                }
                for (let j = 0; j < innerTokens.length; j += 2) {
                    let key = innerTokens[j];
                    dictObject[String(key)] = innerTokens[j + 1];
                }
                tokens.push({ type: 'dict', value: dictObject });
                continue;
            }

            if (char === '(') {
                let level = 1;
                let content = '';
                i++;
                while (i < code.length && level > 0) {
                    if (code[i] === '(') level++;
                    if (code[i] === ')') level--;
                    if (level > 0) content += code[i];
                    i++;
                }
                if (level !== 0) throw new Error("Mismatched parentheses in string literal.");
                tokens.push(`(${content})`);
                continue;
            }

            let currentToken = '';
            while (i < code.length && !/[\s\{\}\[\]\<\>\(\)]/.test(code[i])) {
                currentToken += code[i];
                i++;
            }
            if(currentToken) tokens.push(currentToken);
        }
        return tokens;
    }


    lookupVariable(key) {
        for (let i = this.dictStack.length - 1; i >= 0; i--) {
            if (key in this.dictStack[i]) {
                return this.dictStack[i][key];
            }
        }
        return undefined;
    }

    run(tokens) {
        for (const token of tokens) {
            if (token === null) {
                this.stack.push(null);
            } else if (typeof token === 'string' && token.startsWith('(') && token.endsWith(')')) {
                this.stack.push({ type: 'string', value: token.slice(1, -1).split('') });
            } else if (typeof token === 'string' && this.commands[token]) {
                this.commands[token]();
            } else if (typeof token === 'string' && token.startsWith('~')) {
                 this.stack.push(token);
            } else if (!isNaN(parseFloat(token)) && isFinite(token)) {
                this.stack.push(parseFloat(token));
            } else if (Array.isArray(token)) {
                this.stack.push(token);
            } else if (typeof token === 'object' && token !== null && token.type && (token.type === 'array' || token.type === 'dict')) {
                const resolvedToken = this.resolveVariablesInStructure(token);
                this.stack.push(resolvedToken);
            } else if (typeof token === 'string') {
                const value = this.lookupVariable(token);
                if (value !== undefined) {
                    if (typeof value === 'object' && value !== null && value.type === 'unityObject') {
                        this.stack.push(value);
                    } else if (Array.isArray(value)) {
                        this.run(value);
                    } else {
                        this.stack.push(value);
                    }
                } else {
                    throw new Error(`Undefined command or variable: ${token}`);
                }
            } else {
                 this.stack.push(token);
            }
        }
    }

    execute(code) {
        this.stack = [];
        this.dictStack = [{}];
        this.commandLoopLevel = 0;
        this.output = [];

        try {
            const tokens = this.parse(code);
            this.run(tokens);
        } catch (e) {
            if(e.message === 'EXIT_LOOP') {
                throw new Error("`exit` was called outside of a `loop`.");
            }
            throw e;
        }
        
        return {
            stack: this.stack,
            output: this.output.join('\n')
        };
    }
}


// =============================================
// Lisp風インタープリタ (プレースホルダー)
// =============================================
class LispInterpreter {
    constructor() { this.stack = []; }
    execute(code) {
        this.stack = [];
        return {
            stack: ["Lisp interpreter is not yet implemented."],
            output: ""
        };
    }
}
