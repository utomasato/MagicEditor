/**
 * テキスト編集可能なアイテム（Chars, StringToken, Name）のパネルを作成します。
 */
function createTextInput(item) {
    const closePanel = () => { if (currentUiPanel) { currentUiPanel.remove(); currentUiPanel = null; } editingItem = null; };
    const handleDelete = () => {
        const fromRing = item.parentRing;
        const fromIndex = fromRing ? fromRing.items.indexOf(item) : -1;
        const fromPos = { x: item.pos.x, y: item.pos.y };

        if (item.parentRing) { const ring = item.parentRing; const index = ring.items.indexOf(item); if (index > -1) { ring.RemoveItem(index); ring.CalculateLayout(); } }
        else { fieldItems = fieldItems.filter(fItem => fItem !== item); }

        redoStack = [];
        actionStack.push(new Action("item_remove", {
            item: item,
            fromRing: fromRing,
            fromIndex: fromIndex,
            fromPos: fromPos
        }));

        closePanel();
    };
    const handleDuplicate = () => {
        const newItem = item.clone(new Map());
        let toRing = null;
        let toIndex = -1;
        let toPos = { x: item.pos.x + 30, y: item.pos.y };

        if (item.parentRing) { const ring = item.parentRing; const index = ring.items.indexOf(item); ring.InsertItem(newItem, index + 1); newItem.parentRing = ring; ring.CalculateLayout(); toRing = ring; toIndex = index + 1; }
        else { const index = fieldItems.indexOf(item); newItem.pos = toPos; fieldItems.splice(index + 1, 0, newItem); }

        redoStack = [];
        actionStack.push(new Action("item_move", {
            item: newItem,
            toRing: toRing,
            toIndex: toIndex,
            toPos: toPos,
            isNewItem: true
        }));

        closePanel();
    };

    const panelResult = createBasePanel('Edit Value', closePanel, handleDelete, handleDuplicate);
    if (!panelResult) return;
    const { contentArea } = panelResult;
    editingItem = item;

    const valueContainer = createDiv('');
    valueContainer.parent(contentArea);
    valueContainer.addClass('ui-row');

    const valueDisplay = createP(item.value);
    valueDisplay.parent(valueContainer);
    valueDisplay.addClass('ui-input');
    valueDisplay.style('flex-grow', '1');
    valueDisplay.style('min-width', '100px');
    valueDisplay.style('background', '#f9f9f9'); // Read-only look

    const editButton = createButton('編集');
    editButton.parent(valueContainer);
    editButton.addClass('ui-btn');

    editButton.elt.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        let newValue = prompt("新しい値を入力してください:", item.value || "");
        const itemClassName = item.constructor.name;
        const isStringToken = (itemClassName === 'StringToken');

        while (newValue !== null) {
            if (!isStringToken) {
                if (newValue === "") { newValue = prompt("値が入力されていません。再度入力してください:", item.value || ""); continue; }
                if (/\s/.test(newValue)) { newValue = prompt("空白文字は使用できません。再度入力してください:", newValue); continue; }
            }
            break;
        }

        if (newValue !== null && newValue !== item.value) {
            const oldValue = item.value;
            item.value = newValue; valueDisplay.html(newValue);
            if (item.parentRing) item.parentRing.CalculateLayout();

            // Undo/Redo記録
            redoStack = [];
            actionStack.push(new Action("item_change_value", {
                item: item,
                oldValue: oldValue,
                newValue: newValue
            }));
        }
        closePanel();
    });
}

function createSigilDropdown(item) {
    const closeDropdown = () => { if (currentUiPanel) { currentUiPanel.remove(); currentUiPanel = null; } currentSelectElement = null; editingItem = null; };
    const handleDelete = () => {
        const fromRing = item.parentRing;
        const fromIndex = fromRing ? fromRing.items.indexOf(item) : -1;
        const fromPos = { x: item.pos.x, y: item.pos.y };

        if (item.parentRing) { const ring = item.parentRing; const index = ring.items.indexOf(item); if (index > -1) { ring.RemoveItem(index); ring.CalculateLayout(); } }
        else { fieldItems = fieldItems.filter(fItem => fItem !== item); }

        redoStack = [];
        actionStack.push(new Action("item_remove", {
            item: item,
            fromRing: fromRing,
            fromIndex: fromIndex,
            fromPos: fromPos
        }));

        closeDropdown();
    };
    const handleDuplicate = () => {
        const newItem = item.clone(new Map());
        let toRing = null;
        let toIndex = -1;
        let toPos = { x: item.pos.x + 30, y: item.pos.y };

        if (item.parentRing) { const ring = item.parentRing; const index = ring.items.indexOf(item); ring.InsertItem(newItem, index + 1); newItem.parentRing = ring; ring.CalculateLayout(); toRing = ring; toIndex = index + 1; }
        else { const index = fieldItems.indexOf(item); newItem.pos = toPos; fieldItems.splice(index + 1, 0, newItem); }

        redoStack = [];
        actionStack.push(new Action("item_move", {
            item: newItem,
            toRing: toRing,
            toIndex: toIndex,
            toPos: toPos,
            isNewItem: true
        }));

        closeDropdown();
    };

    const panelResult = createBasePanel('Select Sigil', closeDropdown, handleDelete, handleDuplicate);
    if (!panelResult) return;
    const { contentArea } = panelResult;
    editingItem = item;

    currentSelectElement = createSelect();
    currentSelectElement.parent(contentArea);
    currentSelectElement.addClass('ui-select');

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
            const oldValue = editingItem.value;
            const newValue = currentSelectElement.value();

            if (oldValue !== newValue) {
                editingItem.value = newValue;
                if (editingItem.parentRing) { editingItem.parentRing.CalculateLayout(); }

                // Undo/Redo記録
                redoStack = [];
                actionStack.push(new Action("item_change_value", {
                    item: editingItem,
                    oldValue: oldValue,
                    newValue: newValue
                }));
            }
        }
        closeDropdown();
    });
}

function createJointPanel(item) {
    const closePanel = () => { if (currentUiPanel) { currentUiPanel.remove(); currentUiPanel = null; } editingItem = null; };
    const handleDelete = () => {
        const fromRing = item.parentRing;
        const fromIndex = fromRing ? fromRing.items.indexOf(item) : -1;
        const fromPos = { x: item.pos.x, y: item.pos.y };

        if (item.parentRing) { const ring = item.parentRing; const index = ring.items.indexOf(item); if (index > -1) { ring.RemoveItem(index); ring.CalculateLayout(); } }
        else { fieldItems = fieldItems.filter(fItem => fItem !== item); }

        redoStack = [];
        actionStack.push(new Action("item_remove", {
            item: item,
            fromRing: fromRing,
            fromIndex: fromIndex,
            fromPos: fromPos
        }));

        closePanel();
    };
    const handleDuplicate = () => {
        const newItem = item.clone(new Map());
        let toRing = null;
        let toIndex = -1;
        let toPos = { x: item.pos.x + 30, y: item.pos.y };

        if (item.parentRing) { const ring = item.parentRing; const index = ring.items.indexOf(item); ring.InsertItem(newItem, index + 1); newItem.parentRing = ring; ring.CalculateLayout(); toRing = ring; toIndex = index + 1; }
        else { const index = fieldItems.indexOf(item); newItem.pos = toPos; fieldItems.splice(index + 1, 0, newItem); }

        redoStack = [];
        actionStack.push(new Action("item_move", {
            item: newItem,
            toRing: toRing,
            toIndex: toIndex,
            toPos: toPos,
            isNewItem: true
        }));

        closePanel();
    };

    const panelResult = createBasePanel('Joint Settings', closePanel, handleDelete, handleDuplicate);
    if (!panelResult) return;
    editingItem = item;

    // --- isExecute Toggle ---
    const executeContainer = createDiv('');
    executeContainer.parent(panelResult.contentArea);
    executeContainer.addClass('ui-row');
    executeContainer.style('margin-bottom', '8px');

    const executeCheckbox = createInput(null, 'checkbox');
    executeCheckbox.parent(executeContainer);
    executeCheckbox.style('cursor', 'pointer');
    executeCheckbox.elt.checked = item.isExecute;
    executeCheckbox.elt.addEventListener('mousedown', (e) => e.stopPropagation());

    // Checkbox change event
    executeCheckbox.changed(() => {
        const oldValue = item.isExecute;
        const newValue = executeCheckbox.elt.checked;

        if (oldValue !== newValue) {
            item.isExecute = newValue;
            if (item.parentRing) item.parentRing.CalculateLayout();

            // Undo/Redo記録
            redoStack = [];
            actionStack.push(new Action("item_change_property", {
                item: item,
                propertyName: "isExecute",
                oldValue: oldValue,
                newValue: newValue
            }));
        }
    });

    const executeLabel = createP('Execute (exec)');
    executeLabel.parent(executeContainer);
    executeLabel.style('margin', '0').style('cursor', 'pointer');

    // Label click event (toggles checkbox)
    executeLabel.elt.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        const oldValue = item.isExecute;
        const newValue = !item.isExecute;

        item.isExecute = newValue;
        executeCheckbox.elt.checked = newValue;

        if (item.parentRing) item.parentRing.CalculateLayout();

        // Undo/Redo記録
        redoStack = [];
        actionStack.push(new Action("item_change_property", {
            item: item,
            propertyName: "isExecute",
            oldValue: oldValue,
            newValue: newValue
        }));
    });

    const connectedRing = item.value;
    const parentRing = item.parentRing;

    if (connectedRing && connectedRing instanceof MagicRing) {
        const buttonContainer = createDiv('');
        buttonContainer.parent(panelResult.contentArea);
        buttonContainer.addClass('ui-content');
        buttonContainer.addClass('ui-divider');

        const goToButton = createButton('接続先へ移動').parent(buttonContainer).addClass('ui-btn').addClass('ui-btn-block');
        goToButton.elt.addEventListener('mousedown', e => {
            e.stopPropagation(); cameraPos.x = connectedRing.pos.x; cameraPos.y = connectedRing.pos.y; closePanel();
        });

        if (parentRing) {
            const straightenButton = createButton('接続線を直線化').parent(buttonContainer).addClass('ui-btn').addClass('ui-btn-block');
            straightenButton.elt.addEventListener('mousedown', e => { e.stopPropagation(); item.Straighten(); closePanel(); });
        }
    } else {
        createP('未接続です').parent(panelResult.contentArea).addClass('ui-divider').style('color', '#888').style('text-align', 'center');
    }
}