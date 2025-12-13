/**
 * テキスト編集可能なアイテム（Chars, StringToken, Name）のパネルを作成します。
 * ブラウザ標準のpromptダイアログを使用します。
 * @param {RingItem} item 編集対象のアイテム
 */
function createTextInput(item) {
    const closePanel = () => {
        if (currentUiPanel) {
            currentUiPanel.remove();
            currentUiPanel = null;
        }
        editingItem = null;
    };

    const handleDelete = () => {
        if (item.parentRing) {
            const ring = item.parentRing;
            const index = ring.items.indexOf(item);
            if (index > -1) {
                ring.RemoveItem(index);
                ring.CalculateLayout();
            }
        } else {
            fieldItems = fieldItems.filter(fItem => fItem !== item);
        }
        closePanel();
    };

    const handleDuplicate = () => {
        const newItem = item.clone(new Map());
        if (item.parentRing) {
            const ring = item.parentRing;
            const index = ring.items.indexOf(item);
            ring.InsertItem(newItem, index + 1);
            newItem.parentRing = ring; // 複製したアイテムに親リングを正しく設定
            ring.CalculateLayout();
        } else {
            const index = fieldItems.indexOf(item);
            newItem.pos = { x: item.pos.x + 30, y: item.pos.y };
            fieldItems.splice(index + 1, 0, newItem);
        }
        closePanel();
    };

    const panelResult = createBasePanel('Edit Value', closePanel, handleDelete, handleDuplicate);
    if (!panelResult) return;

    const { contentArea } = panelResult;
    editingItem = item;

    const valueContainer = createDiv('');
    valueContainer.parent(contentArea);
    valueContainer.style('display', 'flex');
    valueContainer.style('align-items', 'center');
    valueContainer.style('gap', '8px');

    const valueDisplay = createP(item.value);
    valueDisplay.parent(valueContainer);
    valueDisplay.style('margin', '0');
    valueDisplay.style('flex-grow', '1');
    valueDisplay.style('padding', '4px');
    valueDisplay.style('background', '#fff');
    valueDisplay.style('border', '1px solid #ccc');
    valueDisplay.style('border-radius', '4px');
    valueDisplay.style('min-width', '100px');

    const editButton = createButton('編集');
    editButton.parent(valueContainer);

    editButton.elt.addEventListener('mousedown', (e) => {
        e.stopPropagation();

        let newValue = prompt("新しい値を入力してください:", item.value || "");

        // item のクラス名を取得
        const itemClassName = item.constructor.name;
        const isStringToken = (itemClassName === 'StringToken');

        // newValue が null (キャンセル) になるまでループ
        while (newValue !== null) {

            // StringToken 以外の場合のみ検証
            if (!isStringToken) {
                // 1. 空文字列のチェック
                if (newValue === "") {
                    newValue = prompt("値が入力されていません。再度入力してください:", item.value || "");
                    continue; // ループの最初に戻る
                }

                // 2. 空白文字のチェック
                if (/\s/.test(newValue)) {
                    newValue = prompt("空白文字は使用できません。再度入力してください:", newValue);
                    continue; // ループの最初に戻る
                }
            }

            // 検証OK (StringToken は常にOK)
            break;
        }

        // キャンセルされなかった (newValue が null でない) 場合のみ値を更新
        if (newValue !== null) {
            // --- 変更：エスケープされていない元の値をそのまま保存・表示 ---
            item.value = newValue;
            valueDisplay.html(newValue); // 表示もエスケープされていない値にする
            if (item.parentRing) {
                item.parentRing.CalculateLayout();
            }
        }

        // 最終的にパネルを閉じる
        closePanel();
    });
}

function createSigilDropdown(item) {
    const closeDropdown = () => {
        if (currentUiPanel) { currentUiPanel.remove(); currentUiPanel = null; }
        currentSelectElement = null; editingItem = null;
    };
    const handleDelete = () => {
        if (item.parentRing) {
            const ring = item.parentRing;
            const index = ring.items.indexOf(item);
            if (index > -1) { ring.RemoveItem(index); ring.CalculateLayout(); }
        } else { fieldItems = fieldItems.filter(fItem => fItem !== item); }
        closeDropdown();
    };

    const handleDuplicate = () => {
        const newItem = item.clone(new Map());
        if (item.parentRing) {
            const ring = item.parentRing;
            const index = ring.items.indexOf(item);
            ring.InsertItem(newItem, index + 1);
            newItem.parentRing = ring; // 複製したアイテムに親リングを正しく設定
            ring.CalculateLayout();
        } else {
            const index = fieldItems.indexOf(item);
            newItem.pos = { x: item.pos.x + 30, y: item.pos.y };
            fieldItems.splice(index + 1, 0, newItem);
        }
        closeDropdown();
    };

    const panelResult = createBasePanel('Select Sigil', closeDropdown, handleDelete, handleDuplicate);
    if (!panelResult) return;
    const { contentArea } = panelResult;
    editingItem = item;
    currentSelectElement = createSelect();
    currentSelectElement.parent(contentArea);

    const sigils = [
        "pop", "exch", "dup", "copy", "index", "roll", "add", "sub", "mul", "div", "idiv", "mod", "abs", "neg", "sqrt",
        "atan", "cos", "sin", "rand", "srand", "rrand", "array", "string", "length", "get", "put", "getinterval", "putinterval", "forall",
        "dict", "begin", "end", "def", "eq", "ne", "ge", "gt", "le", "lt", "and", "not", "or", "xor", "true", "false",
        "exec", "if", "ifelse", "for", "repeat", "loop", "exit", "null",
        "magicactivate", "spawnobj", "transform", "attachtoparent", "animation",
        "print", "stack", "cvi", "chr"
    ];

    sigils.forEach(opt => { currentSelectElement.option(opt); });
    currentSelectElement.selected(item.value);
    currentSelectElement.changed(() => {
        if (editingItem) {
            editingItem.value = currentSelectElement.value();
            if (editingItem.parentRing) { editingItem.parentRing.CalculateLayout(); }
        }
        closeDropdown();
    });
}

function createJointPanel(item) {
    const closePanel = () => { if (currentUiPanel) { currentUiPanel.remove(); currentUiPanel = null; } editingItem = null; };
    const handleDelete = () => {
        if (item.parentRing) {
            const ring = item.parentRing;
            const index = ring.items.indexOf(item);
            if (index > -1) { ring.RemoveItem(index); ring.CalculateLayout(); }
        } else { fieldItems = fieldItems.filter(fItem => fItem !== item); }
        closePanel();
    };

    const handleDuplicate = () => {
        const newItem = item.clone(new Map());
        if (item.parentRing) {
            const ring = item.parentRing;
            const index = ring.items.indexOf(item);
            ring.InsertItem(newItem, index + 1);
            newItem.parentRing = ring; // 複製したアイテムに親リングを正しく設定
            ring.CalculateLayout();
        } else {
            const index = fieldItems.indexOf(item);
            newItem.pos = { x: item.pos.x + 30, y: item.pos.y };
            fieldItems.splice(index + 1, 0, newItem);
        }
        closePanel();
    };

    const panelResult = createBasePanel('Joint Settings', closePanel, handleDelete, handleDuplicate);
    if (!panelResult) return;
    editingItem = item;

    // --- isExecute トグルを追加 ---
    const executeContainer = createDiv('');
    executeContainer.parent(panelResult.contentArea);
    executeContainer.style('display', 'flex');
    executeContainer.style('align-items', 'center');
    executeContainer.style('gap', '8px');
    executeContainer.style('margin-bottom', '8px'); // 他要素との間隔

    const executeCheckbox = createInput(null, 'checkbox');
    executeCheckbox.parent(executeContainer);
    executeCheckbox.style('cursor', 'pointer');

    // .checked() メソッドではなく .elt.checked プロパティを使用して初期値を設定
    executeCheckbox.elt.checked = item.isExecute;

    executeCheckbox.elt.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });

    executeCheckbox.changed(() => {
        // .checked() メソッドではなく .elt.checked プロパティを使用して値を取得
        item.isExecute = executeCheckbox.elt.checked;
        // isExecute が変わると GetLength() が変わる可能性があるため、親リングのレイアウトを再計算
        if (item.parentRing) {
            item.parentRing.CalculateLayout();
        }
    });

    const executeLabel = createP('Execute (exec)');
    executeLabel.parent(executeContainer);
    executeLabel.style('margin', '0');
    executeLabel.style('font-size', '14px');
    executeLabel.style('cursor', 'pointer');
    // ラベルクリックでもチェックボックスがトグルするようにする
    executeLabel.elt.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        item.isExecute = !item.isExecute;
        // .checked() メソッドではなく .elt.checked プロパティを使用して値を設定
        executeCheckbox.elt.checked = item.isExecute;
        if (item.parentRing) {
            item.parentRing.CalculateLayout();
        }
    });
    // ----------------------------

    const connectedRing = item.value;
    const parentRing = item.parentRing;

    if (connectedRing && connectedRing instanceof MagicRing) {
        const buttonContainer = createDiv('');
        buttonContainer.parent(panelResult.contentArea);
        buttonContainer.style('display', 'flex');
        buttonContainer.style('flex-direction', 'column');
        buttonContainer.style('gap', '5px');
        buttonContainer.style('border-top', '1px solid #ddd'); // 区切り線
        buttonContainer.style('padding-top', '8px');      // 区切り線との間隔
        buttonContainer.style('margin-top', '8px');       // isExecute との間隔

        const goToButton = createButton('接続先へ移動');
        goToButton.parent(buttonContainer);
        goToButton.style('width', '100%');
        goToButton.style('padding', '5px');
        goToButton.style('cursor', 'pointer');

        goToButton.elt.addEventListener('mousedown', e => {
            e.stopPropagation();
            cameraPos.x = connectedRing.pos.x;
            cameraPos.y = connectedRing.pos.y;
            closePanel();
        });

        if (parentRing) {
            const straightenButton = createButton('接続線を直線化');
            straightenButton.parent(buttonContainer);
            straightenButton.style('width', '100%');
            straightenButton.style('padding', '5px');
            straightenButton.style('cursor', 'pointer');

            straightenButton.elt.addEventListener('mousedown', e => {
                e.stopPropagation();
                item.Straighten();
                closePanel();
            });
        }

    } else {
        const message = createP('未接続です');
        message.parent(panelResult.contentArea);
        message.style('margin', '0');
        message.style('color', '#888');
        message.style('border-top', '1px solid #ddd'); // 区切り線
        message.style('padding-top', '8px');      // 区切り線との間隔
        message.style('margin-top', '8px');       // isExecute との間隔
    }
}