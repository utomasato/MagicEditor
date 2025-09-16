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

function finishTextInput() {
    if (isFinishingText) return;
    isFinishingText = true;
    if (currentInputElement && editingItem) {
        editingItem.value = currentInputElement.value();
        if (editingItem.parentRing) {
            editingItem.parentRing.CalculateLayout();
        }
    }
    if (currentUiPanel) {
        currentUiPanel.remove();
        currentUiPanel = null;
    }
    currentInputElement = null;
    editingItem = null;
    setTimeout(() => { isFinishingText = false; }, 50);
}

function createTextInput(item) {
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
        finishTextInput();
    };
    const panelResult = createBasePanel('Edit Value', finishTextInput, handleDelete);
    if (!panelResult) return;
    const { contentArea } = panelResult;
    editingItem = item;
    currentInputElement = createInput(item.value);
    currentInputElement.parent(contentArea);
    currentInputElement.style('border', '1px solid #ccc');
    currentInputElement.style('padding', '4px');
    currentInputElement.style('font-size', '14px');
    const inputEl = currentInputElement.elt;
    inputEl.focus();
    inputEl.selectionStart = inputEl.selectionEnd = inputEl.value.length;
    const keyInterceptor = (e) => {
        e.stopImmediatePropagation();
        if (e.key === 'Enter') {
            e.preventDefault();
            finishTextInput();
        }
    };
    inputEl.addEventListener('keydown', keyInterceptor, true);
    inputEl.addEventListener('blur', finishTextInput);
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
        newJoint.pos.x += ring.outerradius + 40;
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
                
                // --- ▼▼▼ ここから修正 ▼▼▼ ---
                
                // 1. 描画方向とJointのリング上の角度を取得
                const direction = globalIsClockwise ? -1 : 1;
                const jointLocalAngle = parentRing.layouts[jointIndex].angle;

                // 2. Jointの出口のグローバルな角度を計算
                const jointGlobalAngle = parentRing.angle + jointLocalAngle * direction;

                // 3. 親リングと子リングの現在の距離を計算（これを維持する）
                const currentDistance = dist(parentRing.pos.x, parentRing.pos.y, connectedRing.pos.x, connectedRing.pos.y);
                
                // 4. 子リングの新しい位置を計算 (p5.jsの角度系に補正)
                const p5Angle = jointGlobalAngle - HALF_PI;
                const newChildX = parentRing.pos.x + currentDistance * cos(p5Angle);
                const newChildY = parentRing.pos.y + currentDistance * sin(p5Angle);

                // 5. 子リングの新しい角度を計算（親を向くように）
                const angleToParent = atan2(parentRing.pos.y - newChildY, parentRing.pos.x - newChildX);
                const newChildAngle = angleToParent + HALF_PI;

                // 6. 子リングのサブツリー全体を移動・回転させる
                transformSubtree(connectedRing, newChildX, newChildY, newChildAngle);

                // --- ▲▲▲ ここまで ▲▲▲ ---

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

