/**
 * テキスト編集可能なアイテム（Chars, StringToken, Name）のパネルを作成します。
 */
function createTextInput(item) {
    const closePanel = () => { if (currentUiPanel) { currentUiPanel.remove(); currentUiPanel = null; } editingItem = null; };
    const handleDelete = () => {
        if (item.parentRing) { const ring = item.parentRing; const index = ring.items.indexOf(item); if (index > -1) { ring.RemoveItem(index); ring.CalculateLayout(); } }
        else { fieldItems = fieldItems.filter(fItem => fItem !== item); }
        closePanel();
    };
    const handleDuplicate = () => {
        const newItem = item.clone(new Map());
        if (item.parentRing) { const ring = item.parentRing; const index = ring.items.indexOf(item); ring.InsertItem(newItem, index + 1); newItem.parentRing = ring; ring.CalculateLayout(); }
        else { const index = fieldItems.indexOf(item); newItem.pos = { x: item.pos.x + 30, y: item.pos.y }; fieldItems.splice(index + 1, 0, newItem); }
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

        if (newValue !== null) {
            item.value = newValue; valueDisplay.html(newValue);
            if (item.parentRing) item.parentRing.CalculateLayout();
        }
        closePanel();
    });
}

function createSigilDropdown(item) {
    const closeDropdown = () => { if (currentUiPanel) { currentUiPanel.remove(); currentUiPanel = null; } currentSelectElement = null; editingItem = null; };
    const handleDelete = () => {
        if (item.parentRing) { const ring = item.parentRing; const index = ring.items.indexOf(item); if (index > -1) { ring.RemoveItem(index); ring.CalculateLayout(); } }
        else { fieldItems = fieldItems.filter(fItem => fItem !== item); }
        closeDropdown();
    };
    const handleDuplicate = () => {
        const newItem = item.clone(new Map());
        if (item.parentRing) { const ring = item.parentRing; const index = ring.items.indexOf(item); ring.InsertItem(newItem, index + 1); newItem.parentRing = ring; ring.CalculateLayout(); }
        else { const index = fieldItems.indexOf(item); newItem.pos = { x: item.pos.x + 30, y: item.pos.y }; fieldItems.splice(index + 1, 0, newItem); }
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
            editingItem.value = currentSelectElement.value();
            if (editingItem.parentRing) { editingItem.parentRing.CalculateLayout(); }
        }
        closeDropdown();
    });
}

function createJointPanel(item) {
    const closePanel = () => { if (currentUiPanel) { currentUiPanel.remove(); currentUiPanel = null; } editingItem = null; };
    const handleDelete = () => {
        if (item.parentRing) { const ring = item.parentRing; const index = ring.items.indexOf(item); if (index > -1) { ring.RemoveItem(index); ring.CalculateLayout(); } }
        else { fieldItems = fieldItems.filter(fItem => fItem !== item); }
        closePanel();
    };
    const handleDuplicate = () => {
        const newItem = item.clone(new Map());
        if (item.parentRing) { const ring = item.parentRing; const index = ring.items.indexOf(item); ring.InsertItem(newItem, index + 1); newItem.parentRing = ring; ring.CalculateLayout(); }
        else { const index = fieldItems.indexOf(item); newItem.pos = { x: item.pos.x + 30, y: item.pos.y }; fieldItems.splice(index + 1, 0, newItem); }
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
    executeCheckbox.changed(() => {
        item.isExecute = executeCheckbox.elt.checked;
        if (item.parentRing) item.parentRing.CalculateLayout();
    });

    const executeLabel = createP('Execute (exec)');
    executeLabel.parent(executeContainer);
    executeLabel.style('margin', '0').style('cursor', 'pointer');
    executeLabel.elt.addEventListener('mousedown', (e) => {
        e.stopPropagation(); item.isExecute = !item.isExecute; executeCheckbox.elt.checked = item.isExecute;
        if (item.parentRing) item.parentRing.CalculateLayout();
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