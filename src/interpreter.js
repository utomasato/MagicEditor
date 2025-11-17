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
        this.dictStack = [{}]; // 0番目はグローバル辞書
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
            dict: () => { this.stack.push({ type: 'dict', value: {} }); },
            begin: () => {
                const dict = this.stack.pop();
                if (typeof dict !== 'object' || dict === null || dict.type !== 'dict') {
                    throw new Error("`begin` requires a dictionary on the stack.");
                }
                this.dictStack.push(dict.value);
            },
            end: () => {
                if (this.dictStack.length > 1) {
                    this.dictStack.pop();
                } else {
                    throw new Error("Cannot `end` the base dictionary.");
                }
            },
            def: () => {
                const value = this.stack.pop();
                let key = this.stack.pop();
                if (typeof key !== 'string' || !key.startsWith('~')) {
                    throw new Error("`def` requires a literal name (e.g., ~myVar) as a key.");
                }
                // 現在の辞書（dictStackの末尾）に定義
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
                
                // --- 変更点: ヘルパーメソッド generateUUID() を使用 ---
                const id = this.generateUUID(); 
                const resolvedVal = this.resolveVariablesInStructure(val);
                
                const data = {
                    isActive: true,
                    message: "MagicSpell",
                    value: 0,
                    id: id,
                    text: this.formatForOutput(resolvedVal)
                };

                sendJsonToUnity("JsReceiver", "ReceiveGeneralData", data);

                if (key) {
                    const variableName = key.substring(1);
                    const unityObjectRef = { type: 'unityObject', value: id }; 
                    this.dictStack[this.dictStack.length - 1][variableName] = unityObjectRef;
                }
            },
            spawnobj: () => {
                const val = this.stack.pop();
                let key = null;
                if (this.stack.length > 0 && typeof this.stack[this.stack.length - 1] === 'string' && this.stack[this.stack.length - 1].startsWith('~')) {
                    key = this.stack.pop();
                }
                
                // --- 変更点: ヘルパーメソッド generateUUID() を使用 ---
                const id = this.generateUUID(); 
                const resolvedVal = this.resolveVariablesInStructure(val);
                
                const data = {
                    isActive: true,
                    message: "CreateObject",
                    value: 0,
                    id: id,
                    text: this.formatForOutput(resolvedVal)
                };

                sendJsonToUnity("JsReceiver", "ReceiveGeneralData", data);

                if (key) {
                    const variableName = key.substring(1);
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
            attachtoparent: () => {
                const parentObjRef = this.stack.pop();
                const childObjRef = this.stack.pop();
                if ((typeof parentObjRef !== 'object' || parentObjRef === null || parentObjRef.type !== 'unityObject' || !parentObjRef.value)
                    && (typeof childObjRef !== 'object' || childObjRef === null || childObjRef.type !== 'unityObject' || !childObjRef.value)) {
                    throw new Error("`attachtoparent` requires a Unity object reference on the stack.");
                }

                const data = {
                    message: "AttachToParent",
                    id: childObjRef.value, // Use the ID from the object reference
                    text: parentObjRef.value
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

    /**
     * UUIDを生成します。
     * crypto.randomUUID が使える場合はそれを使用し（セキュアコンテキスト）、
     * 使えない場合（HTTPなどの非セキュアコンテキスト）は Math.random() ベースの代替機能を使用します。
     */
    generateUUID() {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    // --- 修正された resolveVariablesInStructure ---
    resolveVariablesInStructure(structure) {
        
        // 1. { type: 'variable_name', value: 'x' } の処理
        if (typeof structure === 'object' && structure !== null && structure.type === 'variable_name') {
            const value = this.lookupVariable(structure.value);
            if (value !== undefined) {
                // 変数が見つかった (例: value = 1 や value = [1, 2, {type: 'variable_name', value: 'a'}])
                // 返ってきた値 (value) も解決が必要な可能性があるため、再帰呼び出しする
                return this.resolveVariablesInStructure(value);
            } else {
                // 変数が見つからない
                return null; // または undefined
            }
        }
        
        // 2. プリミティブ型 (string, number, boolean) はそのまま返す
        if (typeof structure !== 'object' || structure === null) {
            // 'add' や 1 や '~pos' など。
            // これらは変数解決の対象外 (string 'add' は run ループでコマンドとして処理される)
            return structure;
        }

        // 3. 生の配列 (JSの配列)
        if (Array.isArray(structure)) {
            // (例: { type: 'array' } の .value や、プロシージャ { ... } )
            // 配列の各アイテムを再帰的に解決
            return structure.map(item => this.resolveVariablesInStructure(item));
        }

        // 4. { type: 'array', ... } オブジェクト
        if (structure.type === 'array') {
            if (Array.isArray(structure.value)) {
                const newStructure = { ...structure };
                // value (トークンの配列) の各要素を解決
                newStructure.value = structure.value.map(item => this.resolveVariablesInStructure(item)); 
                return newStructure;
            }
            // value が配列でない場合は、そのまま返す (またはエラー)
            return structure;
        }
        
        // 5. { type: 'dict', ... } オブジェクト
        if (structure.type === 'dict') {
            const newStructure = { ...structure, value: {} };
            for (const key in structure.value) {
                if (Object.hasOwnProperty.call(structure.value, key)) {
                    // キーは解決しない
                    // 値を解決
                    const resolvedValue = this.resolveVariablesInStructure(structure.value[key]); 
                    newStructure.value[key] = resolvedValue;
                }
            }
            return newStructure;
        }
        
        // 6. その他のオブジェクト (例: { type: 'unityObject', ... } )
        //    これらは変更せずにそのまま返す
        return structure;
    }
    // --- 修正ここまで ---
    
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
            // --- 追加: variable_name を表示できるように (デバッグ用) ---
            case 'variable_name':
                return `($${val.value})`;
            // --- 追加ここまで ---
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
                    
                    if (current_char === '\\') { // エスケープ文字
                         if (i + 1 < code.length) {
                            content += current_char; // \ も content に含める
                            content += code[i + 1]; // 次の文字も content に含める
                            i += 2;
                        } else {
                            throw new Error("Parse error: Escape character (\\) at end of procedure/array.");
                        }
                        continue;
                    }

                    if (current_char === '(') {
                        let str_level = 1;
                        content += current_char;
                        i++;
                         while(i < code.length && str_level > 0) {
                            if (code[i] === '\\') { // 文字列内のエスケープ
                                if (i + 1 < code.length) {
                                    content += code[i];
                                    content += code[i+1];
                                    i += 2;
                                } else {
                                    throw new Error("Parse error: Escape character (\\) at end of string in procedure/array.");
                                }
                            } else if(code[i] === '(') {
                                str_level++;
                                content += code[i];
                                i++;
                            } else if(code[i] === ')') {
                                str_level--;
                                content += code[i];
                                i++;
                            } else {
                                content += code[i];
                                i++;
                            }
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
                    // --- 修正: 配列リテラルをパースする際、中身のトークンも渡す ---
                    // (以前は innerTokens をそのまま value にしていたが、
                    //  PostScript の配列は実行時に評価されるのではなく、
                    //  リテラルとして中身 (数値や変数名トークン) を保持すべき)
                    tokens.push({ type: 'array', value: innerTokens });
                    // --- 修正ここまで ---
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
                    // --- 修正: 辞書リテラルのキーの ~ を削除しない ---
                    if (typeof key === 'string' && key.startsWith('~')) {
                         // dictObject[key.substring(1)] = innerTokens[j + 1]; // 旧: キーは ~ を除外
                         dictObject[key] = innerTokens[j + 1]; // 新: キーの ~ を保持
                    } else if (typeof key === 'object' && key.type === 'literal_name') {
                         dictObject[key.value] = innerTokens[j + 1]; // キーは \ を除外
                    } else {
                         // 数値や文字列キーも許可 (PostScript準拠)
                         dictObject[String(key)] = innerTokens[j + 1];
                    }
                }
                tokens.push({ type: 'dict', value: dictObject });
                continue;
            }

            if (char === '(') {
                let level = 1;
                let content = '';
                i++;
                while (i < code.length && level > 0) {
                    if (code[i] === '\\') { // エスケープ文字
                        if (i + 1 < code.length) {
                            content += code[i]; // '\' を content に追加
                            content += code[i + 1]; // エスケープ対象文字を content に追加
                            i += 2;
                        } else {
                             throw new Error("Parse error: Escape character (\\) at end of string literal.");
                        }
                    } else if (code[i] === '(') {
                        level++;
                        content += code[i]; // '(' を content に追加
                        i++;
                    } else if (code[i] === ')') {
                        level--;
                        if (level > 0) content += code[i]; // ')' を content に追加 (最後の ')' 以外)
                        i++;
                    } else {
                        content += code[i]; // 通常文字を content に追加
                        i++;
                    }
                }
                if (level !== 0) throw new Error("Mismatched parentheses in string literal.");
                tokens.push(`(${content})`); // content にはエスケープ文字が含まれたまま
                continue;
            }

            let currentToken = '';
            
            // --- 修正： \、$、~ で始まるトークンのパース処理 ---
            
            if (code[i] === '\\') { // エスケープされたリテラル名
                i++; // \ をスキップ
                while (i < code.length && !/[\s\{\}\[\]\<\>\(\)]/.test(code[i])) {
                     if (code[i] === '\\') { // トークン途中のエスケープ
                        if (i + 1 < code.length) {
                            currentToken += code[i + 1]; // \ は含めず、次の文字だけ
                            i += 2;
                        } else {
                            throw new Error("Parse error: Escape character (\\) at end of code in token.");
                        }
                    } else {
                        currentToken += code[i];
                        i++;
                    }
                }
                if (currentToken) tokens.push({ type: 'literal_name', value: currentToken }); // \add -> { type: 'literal_name', value: 'add' }

            } else if (code[i] === '$') { // Chars由来の変数名
                i++; // $ をスキップ
                while (i < code.length && !/[\s\{\}\[\]\<\>\(\)]/.test(code[i])) {
                     if (code[i] === '\\') { // トークン途中のエスケープ
                        if (i + 1 < code.length) {
                            currentToken += code[i + 1]; // \ は含めず、次の文字だけ
                            i += 2;
                        } else {
                            throw new Error("Parse error: Escape character (\\) at end of code in token.");
                        }
                    } else {
                        currentToken += code[i];
                        i++;
                    }
                }
                if (currentToken) tokens.push({ type: 'variable_name', value: currentToken }); // $add -> { type: 'variable_name', value: 'add' }

            } else if (code[i] === '~') { // Name由来の変数名 (def用)
                currentToken += code[i]; // ~ を含める
                i++;
                 while (i < code.length && !/[\s\{\}\[\]\<\>\(\)]/.test(code[i])) {
                     if (code[i] === '\\') { // トークン途中のエスケープ
                        if (i + 1 < code.length) {
                            currentToken += '\\'; // \ も含める
                            currentToken += code[i+1]; // 次の文字も
                            i += 2;
                        } else {
                            throw new Error("Parse error: Escape character (\\) at end of code in token.");
                        }
                    } else {
                        currentToken += code[i];
                        i++;
                    }
                }
                
                if (currentToken.length > 1) { // ~add や ~\\~
                    // def で処理するために、エスケープを解決したキーを ~ につけて渡す
                    let key = currentToken.substring(1).replace(/\\(.)/g, '$1');
                    tokens.push("~" + key);
                } else if (currentToken === '~') {
                    // ~ 単体はリテラル名として扱う (\~ と同じ)
                     tokens.push({ type: 'literal_name', value: '~' });
                }

            } else { // 通常のトークン（コマンド、数値、エスケープなしリテラル）
                 while (i < code.length && !/[\s\{\}\[\]\<\>\(\)]/.test(code[i])) {
                    if (code[i] === '\\') { // トークン途中のエスケープ
                        if (i + 1 < code.length) {
                            currentToken += code[i + 1]; // \ は含めず、次の文字だけ
                            i += 2;
                        } else {
                            throw new Error("Parse error: Escape character (\\) at end of code in token.");
                        }
                    } else {
                        currentToken += code[i];
                        i++;
                    }
                }
                if(currentToken) tokens.push(currentToken);
            }
            // --- 修正ここまで ---
        }
        return tokens;
    }


    lookupVariable(key) {
        // dictStackの上から（最後に追加されたものから）順番に探す
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
                let strContent = token.slice(1, -1);
                // エスケープ文字 (\( \_ \) \\ など) を解決
                strContent = strContent.replace(/\\(.)/g, '$1'); 
                this.stack.push({ type: 'string', value: strContent.split('') });
            
            // ★ literal_name (\add や \~ など)
            } else if (typeof token === 'object' && token !== null && token.type === 'literal_name') {
                // \ でエスケープされたものは、リテラル値 (文字列) を積む
                this.stack.push(token.value); 

            // ★ variable_name (Chars由来 $add) の処理
            } else if (typeof token === 'object' && token !== null && token.type === 'variable_name') {
                // Chars (例: $add) は、変数としてのみ検索する
                const value = this.lookupVariable(token.value);
                if (value !== undefined) {
                    // 変数が見つかった
                    if (typeof value === 'object' && value !== null && value.type === 'unityObject') {
                        this.stack.push(value);
                    } else if (Array.isArray(value)) {
                        this.run(value); // プロシージャ実行
                    } else {
                        this.stack.push(value); // 値を積む (例: 1)
                    }
                } else {
                    // 変数が見つからない場合、コマンド検索は *せず* エラー
                    throw new Error(`Undefined variable: ${token.value}`);
                }

            } else if (typeof token === 'string' && token.startsWith('~')) {
                 this.stack.push(token);
            } else if (!isNaN(parseFloat(token)) && isFinite(token)) {
                this.stack.push(parseFloat(token));
            } else if (Array.isArray(token)) {
                this.stack.push(token);
            } else if (typeof token === 'object' && token !== null && token.type && (token.type === 'array' || token.type === 'dict')) {
                // --- 修正: 配列や辞書リテラルは、中身の変数を解決してから積む ---
                const resolvedToken = this.resolveVariablesInStructure(token);
                this.stack.push(resolvedToken);
                // --- 修正ここまで ---
                
            // --- ★ Sigil (または数値以外) の処理 ---
            } else if (typeof token === 'string') {
                // Sigil (例: add) は、コマンドとしてのみ検索する
                if (this.commands[token]) {
                    this.commands[token](); // コマンド実行
                } else {
                    // Sigil由来のトークンがコマンドにも変数にもない場合
                    // (※変数検索はしないのがユーザーの要望)
                    throw new Error(`Undefined command: ${token}`);
                }
            // --- ★ 変更ここまで ---

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
            dictStack: this.dictStack,
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