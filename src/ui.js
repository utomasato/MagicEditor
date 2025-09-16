// =============================================
// UI Panel Functions
// =============================================

function createBasePanel(titleText, closeCallback, deleteCallback) {
    if (currentUiPanel) return null;
    currentUiPanel = createDiv('');
    currentUiPanel.position(GetMouseX() + 15, GetMouseY() - 10);
    currentUiPanel.style('z-index', '1000');
    currentUiPanel.style('background-color', 'rgba(240, 240, 240, 0.95)');
    currentUiPanel.style('padding', '8px');
    currentUiPanel.style('border-radius', '6px');
    currentUiPanel.style('box-shadow', '0 2px 5px rgba(0,0,0,0.2)');
    currentUiPanel.style('display', 'flex');
    currentUiPanel.style('flex-direction', 'column');
    currentUiPanel.style('gap', '8px');
    currentUiPanel.style('user-select', 'none'); // このパネル内でのテキスト選択を無効化
    currentUiPanel.style('-webkit-user-select', 'none');

    const header = createDiv('');
    header.parent(currentUiPanel);
    header.style('display', 'flex');
    header.style('justify-content', 'space-between');
    header.style('align-items', 'center');
    const title = createP(titleText);
    title.parent(header);
    title.style('margin', '0');
    title.style('font-weight', 'bold');
    title.style('color', '#333');
    const closeButton = createButton('×');
    closeButton.parent(header);
    closeButton.style('border', 'none');
    closeButton.style('background', 'transparent');
    closeButton.style('font-size', '18px');
    closeButton.style('cursor', 'pointer');
    closeButton.style('padding', '0 4px');
    closeButton.elt.addEventListener('mousedown', (e) => { e.stopPropagation(); closeCallback(); });
    const contentArea = createDiv('');
    contentArea.parent(currentUiPanel);
    if (deleteCallback) {
        const footer = createDiv('');
        footer.parent(currentUiPanel);
        footer.style('display', 'flex');
        footer.style('justify-content', 'flex-end');
        footer.style('margin-top', '8px');
        footer.style('border-top', '1px solid #ddd');
        footer.style('padding-top', '8px');
        const deleteButton = createButton('Delete');
        deleteButton.parent(footer);
        deleteButton.style('border', '1px solid #ff4d4d');
        deleteButton.style('background', '#fff');
        deleteButton.style('color', '#ff4d4d');
        deleteButton.style('font-size', '12px');
        deleteButton.style('cursor', 'pointer');
        deleteButton.style('padding', '2px 8px');
        deleteButton.style('border-radius', '4px');
        deleteButton.elt.addEventListener('mousedown', (e) => { e.stopPropagation(); deleteCallback(); });
    }
    return { panel: currentUiPanel, contentArea: contentArea };
}

/**
 * テキスト編集可能なアイテム（Chars, StringToken, Name）のパネルを作成します。
 * p5.domの入力ボックスの代わりに、ブラウザ標準のpromptダイアログを使用します。
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

    const panelResult = createBasePanel('Edit Value', closePanel, handleDelete);
    if (!panelResult) return;

    const { contentArea } = panelResult;
    editingItem = item;

    // 値を表示するコンテナ
    const valueContainer = createDiv('');
    valueContainer.parent(contentArea);
    valueContainer.style('display', 'flex');
    valueContainer.style('align-items', 'center');
    valueContainer.style('gap', '8px');

    // 現在の値を表示するエリア
    const valueDisplay = createP(item.value);
    valueDisplay.parent(valueContainer);
    valueDisplay.style('margin', '0');
    valueDisplay.style('flex-grow', '1');
    valueDisplay.style('padding', '4px');
    valueDisplay.style('background', '#fff');
    valueDisplay.style('border', '1px solid #ccc');
    valueDisplay.style('border-radius', '4px');
    valueDisplay.style('min-width', '100px');

    // 編集ボタン
    const editButton = createButton('編集');
    editButton.parent(valueContainer);
    
    // 編集ボタンが押されたら、promptダイアログを表示
    editButton.elt.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        const newValue = prompt("新しい値を入力してください:", item.value || "");

        // ユーザーがキャンセルしなかった場合のみ値を更新
        if (newValue !== null) {
            item.value = newValue;
            valueDisplay.html(newValue); // パネル上の表示も更新
            if (item.parentRing) {
                item.parentRing.CalculateLayout();
            }
            closePanel();
        }
        
        // --- ▼▼▼ ここから修正 ▼▼▼ ---
        // ダイアログが閉じた後、必ずパネルも閉じる
        // closePanel();
        // --- ▲▲▲ ここまで ▲▲▲ ---
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
    const panelResult = createBasePanel('Select Sigil', closeDropdown, handleDelete);
    if (!panelResult) return;
    const { contentArea } = panelResult;
    editingItem = item;
    currentSelectElement = createSelect();
    currentSelectElement.parent(contentArea);
    const sigilOptions = ["pop", "exch", "dup", "copy", "index", "roll", "add", "sub", "mul", "div", "idiv", "mod", "abs", "neg", "sqrt", "atan", "cos", "sin", "rand", "srand", "rrand", "array", "string", "length", "get", "put", "getinterval", "putinterval", "forall", "dict", "begin", "end", "def", "eq", "ne", "ge", "gt", "le", "lt", "and", "not", "or", "xor", "true", "false", "exec", "if", "ifelse", "for", "repeat", "loop", "exit", "color", "setcolor", "currentcolor", "print", "stack"];
    sigilOptions.forEach(opt => { currentSelectElement.option(opt); });
    currentSelectElement.selected(item.value);
    currentSelectElement.changed(() => {
        if (editingItem) {
            editingItem.value = currentSelectElement.value();
            if (editingItem.parentRing) { editingItem.parentRing.CalculateLayout(); }
        }
        closeDropdown();
    });
}

function createRingPanel(ring) {
    const closePanel = () => { if (currentUiPanel) { currentUiPanel.remove(); currentUiPanel = null; } editingItem = null; };
    const handleDelete = () => {
        rings.forEach(r => {
            r.items.forEach(item => {
                if (item && item.type === 'joint' && item.value === ring) {
                    item.value = null;
                }
            });
        });
        rings = rings.filter(r => r !== ring);
        closePanel();
    };

    const panelResult = createBasePanel('Ring Settings', closePanel, handleDelete);
    if (!panelResult) return;
    const { contentArea } = panelResult;

    editingItem = ring;

    const buttonContainer = createDiv('');
    buttonContainer.parent(contentArea);
    buttonContainer.style('display', 'flex');
    buttonContainer.style('flex-direction', 'column');
    buttonContainer.style('gap', '5px');
    buttonContainer.style('margin-top', '5px');

    let parentRing = null;
    for (const r of rings) {
        if (r === ring) continue;
        if (r.items.some(item => item && item.type === 'joint' && item.value === ring)) {
            parentRing = r;
            break;
        }
    }

    if (parentRing) {
        const goToParentButton = createButton('親へ移動');
        goToParentButton.parent(buttonContainer);
        goToParentButton.style('width', '100%');
        goToParentButton.style('padding', '5px');
        goToParentButton.style('cursor', 'pointer');
        goToParentButton.style('order', '-1');
        goToParentButton.elt.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            cameraPos.x = parentRing.pos.x;
            cameraPos.y = parentRing.pos.y;
            closePanel();
        });
    }
    
    const alignButton = createButton('このリングから整列');
    alignButton.parent(buttonContainer);
    alignButton.style('width', '100%');
    alignButton.style('padding', '5px');
    alignButton.style('cursor', 'pointer');
    alignButton.elt.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        alignConnectedRings(ring);
        closePanel();
    });

    const jointButton = createButton('Create Joint');
    jointButton.parent(buttonContainer);
    jointButton.style('width', '100%');
    jointButton.style('padding', '5px');
    jointButton.style('cursor', 'pointer');
    jointButton.elt.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        const newJoint = new Joint(ring.pos.x, ring.pos.y, ring, null);
        newJoint.pos.x +=  (ring.radius + 70) * Math.sin(ring.angle + PI/20);
        newJoint.pos.y -=  (ring.radius + 70) * Math.cos(ring.angle + PI/20);
        fieldItems.push(newJoint);
        closePanel();
    });

    if (ring.isNew) {
        const typeLabel = createP('Ring Type:');
        typeLabel.parent(contentArea);
        typeLabel.style('margin', '10px 0 2px 0');
        typeLabel.style('border-top', '1px solid #ddd');
        typeLabel.style('padding-top', '8px');

        const typeSelect = createSelect();
        typeSelect.parent(contentArea);
        typeSelect.option('MagicRing');
        typeSelect.option('ArrayRing');
        typeSelect.option('DictRing');
        typeSelect.selected(ring.constructor.name);

        typeSelect.changed(() => {
            const newType = typeSelect.value();
            const ringIndex = rings.indexOf(ring);

            if (ringIndex !== -1 && ring.constructor.name !== newType) {
                let newRing;
                if (newType === 'MagicRing') { newRing = new MagicRing(ring.pos); }
                else if (newType === 'ArrayRing') { newRing = new ArrayRing(ring.pos); }
                else { newRing = new DictRing(ring.pos); }
                newRing.isNew = false;
                rings[ringIndex] = newRing;
                rings.forEach(r => {
                    r.items.forEach(item => {
                        if (item && item.type === 'joint' && item.value === ring) {
                            item.value = newRing;
                        }
                    });
                });
            }
            closePanel();
        });
    }
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
    const panelResult = createBasePanel('Joint Settings', closePanel, handleDelete);
    if (!panelResult) return;
    editingItem = item;

    const connectedRing = item.value;
    const parentRing = item.parentRing;

    if (connectedRing && connectedRing instanceof MagicRing) {
        const buttonContainer = createDiv('');
        buttonContainer.parent(panelResult.contentArea);
        buttonContainer.style('display', 'flex');
        buttonContainer.style('flex-direction', 'column');
        buttonContainer.style('gap', '5px');

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
                
                const jointIndex = parentRing.items.indexOf(item);
                if (jointIndex === -1 || !parentRing.layouts[jointIndex]) {
                    closePanel();
                    return;
                }
                
                const direction = globalIsClockwise ? -1 : 1;
                const jointLocalAngle = parentRing.layouts[jointIndex].angle;

                const jointGlobalAngle = parentRing.angle + jointLocalAngle * direction;

                const currentDistance = dist(parentRing.pos.x, parentRing.pos.y, connectedRing.pos.x, connectedRing.pos.y);
                
                const p5Angle = jointGlobalAngle - HALF_PI;
                const newChildX = parentRing.pos.x + currentDistance * cos(p5Angle);
                const newChildY = parentRing.pos.y + currentDistance * sin(p5Angle);

                const angleToParent = atan2(parentRing.pos.y - newChildY, parentRing.pos.x - newChildX);
                const newChildAngle = angleToParent + HALF_PI;

                transformSubtree(connectedRing, newChildX, newChildAngle);

                closePanel();
            });
        }

    } else {
        const message = createP('未接続です');
        message.parent(panelResult.contentArea);
        message.style('margin', '0');
        message.style('color', '#888');
    }
}

function createConsolePanel() {
    consolePanel = createDiv('');
    consolePanel.position(GetScreenSize()[0] + 25, GetScreenSize()[1] - 160);
    consolePanel.size(GetScreenSize()[0] - 35, 150);
    consolePanel.style('z-index', '1000');
    consolePanel.style('background-color', 'rgba(30, 30, 30, 0.85)');
    consolePanel.style('border-radius', '6px');
    consolePanel.style('box-shadow', '0 2px 5px rgba(0,0,0,0.2)');
    consolePanel.style('display', 'flex');
    consolePanel.style('flex-direction', 'column');
    consolePanel.style('font-family', 'monospace');
    consolePanel.style('color', '#eee');
    consolePanel.style('position', 'absolute');

    const header = createDiv('');
    header.parent(consolePanel);
    header.style('padding', '8px 8px');
    header.style('background-color', 'rgba(50, 50, 50, 0.9)');
    header.style('display', 'flex');
    header.style('justify-content', 'space-between');
    header.style('align-items', 'center');
    header.style('cursor', 'move');

    header.elt.addEventListener('mousedown', (e) => {
        if (e.target.tagName !== 'SELECT' && e.target.tagName !== 'OPTION') {
            isDraggingConsole = true;
            consoleDragOffset.x = mouseX - consolePanel.position().x;
            consoleDragOffset.y = mouseY - consolePanel.position().y;
            e.preventDefault();
        }
    });
    
    const title = createP('Console');
    title.parent(header);
    title.style('margin', '0');

    const languageSelect = createSelect();
    languageSelect.parent(header);
    languageSelect.option('postscript');
    languageSelect.option('lisp');
    languageSelect.changed(() => {
        setInterpreter(languageSelect.value());
    });

    consoleText = createP('Ready.');
    consoleText.parent(consolePanel);
    consoleText.style('padding', '8px');
    consoleText.style('margin', '0');
    consoleText.style('flex-grow', '1');
    consoleText.style('white-space', 'pre-wrap');
    consoleText.style('word-wrap', 'break-word');
    consoleText.style('overflow-y', 'auto');

    const resizeHandle = createDiv('');
    resizeHandle.parent(consolePanel);
    resizeHandle.style('width', '20px');
    resizeHandle.style('height', '20px');
    resizeHandle.style('position', 'absolute');
    resizeHandle.style('right', '0');
    resizeHandle.style('bottom', '0');
    resizeHandle.style('cursor', 'se-resize');

    resizeHandle.elt.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        isResizingConsole = true;
    });
}

