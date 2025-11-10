// =============================================
// UI Panel Functions
// =============================================

/**
 * Checks if the mouse cursor is currently over the given UI panel element.
 * @param {p5.Element} panelElement The panel element to check.
 * @returns {boolean} True if the mouse is over the panel, false otherwise.
 */
function isMouseOverPanel(panelElement) {
    if (!panelElement || !panelElement.elt) return false;
    const panelRect = panelElement.elt.getBoundingClientRect();
    if (mouseX >= panelRect.left && mouseX <= panelRect.right &&
        mouseY >= panelRect.top && mouseY <= panelRect.bottom) {
        return true;
    }
    return false;
}

function createBasePanel(titleText, closeCallback, deleteCallback, duplicateCallback) {
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
    
    if (deleteCallback || duplicateCallback) {
        const footer = createDiv('');
        footer.parent(currentUiPanel);
        footer.style('display', 'flex');
        footer.style('justify-content', 'flex-end');
        footer.style('gap', '8px'); 
        footer.style('margin-top', '8px');
        footer.style('border-top', '1px solid #ddd');
        footer.style('padding-top', '8px');

        if (duplicateCallback) {
            const duplicateButton = createButton('複製');
            duplicateButton.parent(footer);
            duplicateButton.style('border', '1px solid #4d4dff');
            duplicateButton.style('background', '#fff');
            duplicateButton.style('color', '#4d4dff');
            duplicateButton.style('font-size', '12px');
            duplicateButton.style('cursor', 'pointer');
            duplicateButton.style('padding', '2px 8px');
            duplicateButton.style('border-radius', '4px');
            duplicateButton.elt.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                duplicateCallback();
            });
        }

        if (deleteCallback) {
            const deleteButton = createButton('削除');
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
    }
    return { panel: currentUiPanel, contentArea: contentArea };
}

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
        const newValue = prompt("新しい値を入力してください:", item.value || "");

        if (newValue !== null) {
            item.value = newValue;
            valueDisplay.html(newValue);
            if (item.parentRing) {
                item.parentRing.CalculateLayout();
            }
        }
        
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
    
    const sigilOptions = [
        "pop","exch","dup","copy","index", "roll", "add", "sub","mul","div","idiv","mod","abs","neg","sqrt",
        "atan","cos","sin","rand","srand","rrand","array","string","length","get","put","getinterval","putinterval","forall",
        "dict","begin","end","def","eq","ne","ge","gt","le","lt","and","not","or","xor","true","false",
        "exec","if","ifelse","for","repeat","loop","exit","null", "magicactivate", "spawnobj", "transform", "attachtoparent", "animation", "print", "stack", "cvi", "chr"
    ];

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
        if (ring === startRing) {
            startRing = rings.find(r => isRingStartable(r)) || (rings.length > 0 ? rings[0] : null);
            if(startRing) startRing.isStartPoint = true;
        }
        closePanel();
    };
    const handleDuplicate = () => {
        ring.clone(); // cloneメソッド内でrings配列への追加が行われるため、ここでのpushは不要
        closePanel();
    };

    const panelResult = createBasePanel('Ring Settings', closePanel, handleDelete, handleDuplicate);
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

    const isStartable = isRingStartable(ring);
    const isCurrentStart = (ring === startRing);

    if (isCurrentStart) {
        const startIndicator = createP('This is the starting ring.');
        startIndicator.parent(contentArea);
        startIndicator.style('margin', '5px 0 0 0');
        startIndicator.style('padding', '4px');
        startIndicator.style('font-size', '12px');
        startIndicator.style('font-style', 'italic');
        startIndicator.style('color', '#333');
        startIndicator.style('background-color', '#fffbe6');
        startIndicator.style('border', '1px solid #ffe58f');
        startIndicator.style('border-radius', '4px');
        startIndicator.style('text-align', 'center');
    } else if (isStartable) {
        const setStartButton = createButton('Set as Start Point');
        setStartButton.parent(buttonContainer);
        setStartButton.style('width', '100%');
        setStartButton.style('padding', '5px');
        setStartButton.style('cursor', 'pointer');
        setStartButton.elt.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            if (startRing) {
                startRing.isStartPoint = false;
            }
            startRing = ring;
            ring.isStartPoint = true;
            closePanel();
        });
    }

    // --- Ring Type or Magic Type selection ---
    // TemplateRing の場合は magic プロパティを変更するUI
    if (ring instanceof TemplateRing) {
        const magicLabel = createP('Magic Type:');
        magicLabel.parent(contentArea);
        magicLabel.style('margin', '10px 0 2px 0');
        magicLabel.style('border-top', '1px solid #ddd');
        magicLabel.style('padding-top', '8px');

        const magicSelect = createSelect();
        magicSelect.parent(contentArea);
        
        const magicOptions = [
            "fire", "bullet", 
        ];
        magicOptions.forEach(opt => { magicSelect.option(opt); });
        //magicSelect.option('fire');
        //magicSelect.option('bullet');
        /*
        // 現在設定されている値がリストになければ追加（将来的な拡張のため）
        const currentMagic = ring.magic;
        if (currentMagic !== 'fire' && currentMagic !== 'bullet') {
            magicSelect.option(currentMagic);
        }*/
        magicSelect.selected(ring.magic);
        
        magicSelect.changed(() => {
            ring.magic = magicSelect.value();
            // objects.js の DrawRingStar が this.magic を参照するよう修正済み
            closePanel(); // パネルを閉じる
        });

    } 
    // TemplateRing 以外の場合、または isNew フラグが立っている場合
    else if (true || ring.isNew) { 
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
        typeSelect.option('TemplateRing'); // TemplateRing を選択肢に追加
        typeSelect.selected(ring.constructor.name);

        typeSelect.changed(() => {
            const newType = typeSelect.value();
            const ringIndex = rings.indexOf(ring);

            if (ringIndex !== -1 && ring.constructor.name !== newType) {
                let newRing;
                // 新しいタイプのリングインスタンスを作成
                if (newType === 'MagicRing') { newRing = new MagicRing(ring.pos); }
                else if (newType === 'ArrayRing') { newRing = new ArrayRing(ring.pos); }
                else if (newType === 'DictRing') { newRing = new DictRing(ring.pos); }
                else if (newType === 'TemplateRing') { newRing = new TemplateRing(ring.pos); } // TemplateRing の分岐を追加
                else { newRing = new MagicRing(ring.pos); } // デフォルト

                // 既存のアイテムを引き継ぐ (先頭の 'RETURN' or 'COMPLETE' は除く)
                newRing.items = newRing.items.concat(ring.items.slice(1));
                
                newRing.CalculateLayout();
                newRing.isNew = false; // isNew フラグを倒す
                newRing.angle = ring.angle; // 角度を引き継ぐ
                newRing.isStartPoint = ring.isStartPoint; // 開始点フラグを引き継ぐ

                rings[ringIndex] = newRing; // 配列内のインスタンスを置き換え
                
                // 既存の Joint があれば接続先を新しいリングインスタンスに更新
                rings.forEach(r => {
                    r.items.forEach(item => {
                        if (item && item.type === 'joint' && item.value === ring) {
                            item.value = newRing;
                        }
                    });
                });
                
                // startRing だった場合も更新
                if (startRing === ring) {
                    startRing = newRing;
                }
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
    
    // 修正: .checked() メソッドではなく .elt.checked プロパティを使用して初期値を設定
    executeCheckbox.elt.checked = item.isExecute;
    
    executeCheckbox.elt.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });

    executeCheckbox.changed(() => {
        // 修正: .checked() メソッドではなく .elt.checked プロパティを使用して値を取得
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
        // 修正: .checked() メソッドではなく .elt.checked プロパティを使用して値を設定
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

                transformSubtree(connectedRing, newChildX, newChildY, newChildAngle);

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

function createConsolePanel() {
    consolePanel = createDiv('');
    consolePanel.position(60, GetScreenSize()[1] - 160);
    consolePanel.size(300, 150);
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

    const startDrag = (e) => {
        if (e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION') return;
        e.preventDefault();
        isDraggingConsole = true;
        
        const currentMouseX = e.touches ? e.touches[0].clientX : e.clientX;
        const currentMouseY = e.touches ? e.touches[0].clientY : e.clientY;

        consoleDragOffset.x = currentMouseX - consolePanel.position().x;
        consoleDragOffset.y = currentMouseY - consolePanel.position().y;

        window.addEventListener('mousemove', doDrag);
        window.addEventListener('mouseup', stopDrag);
        window.addEventListener('touchmove', doDrag, { passive: false });
        window.addEventListener('touchend', stopDrag);
    };

    const doDrag = (e) => {
        if (!isDraggingConsole) return;
        const currentMouseX = e.touches ? e.touches[0].clientX : e.clientX;
        const currentMouseY = e.touches ? e.touches[0].clientY : e.clientY;
        consolePanel.position(currentMouseX - consoleDragOffset.x, currentMouseY - consoleDragOffset.y);
    };

    const stopDrag = () => {
        isDraggingConsole = false;
        window.removeEventListener('mousemove', doDrag);
        window.removeEventListener('mouseup', stopDrag);
        window.removeEventListener('touchmove', doDrag);
        window.removeEventListener('touchend', stopDrag);
    };

    header.elt.addEventListener('mousedown', startDrag);
    header.elt.addEventListener('touchstart', startDrag, { passive: false });
    
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

    const startResize = (e) => {
        e.stopPropagation();
        e.preventDefault();
        isResizingConsole = true;
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        window.addEventListener('mousemove', doResize);
        window.addEventListener('mouseup', stopResize);
        window.addEventListener('touchmove', doResize, { passive: false });
        window.addEventListener('touchend', stopResize);
    };

    const doResize = (e) => {
        if (!isResizingConsole) return;
        const currentMouseX = e.touches ? e.touches[0].clientX : e.clientX;
        const currentMouseY = e.touches ? e.touches[0].clientY : e.clientY;
        const panelPos = consolePanel.position();
        const newWidth = currentMouseX - panelPos.x;
        const newHeight = currentMouseY - panelPos.y;
        consolePanel.size(max(150, newWidth), max(80, newHeight));
    };

    const stopResize = () => {
        isResizingConsole = false;
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        window.removeEventListener('mousemove', doResize);
        window.removeEventListener('mouseup', stopResize);
        window.removeEventListener('touchmove', doResize);
        window.removeEventListener('touchend', stopResize);
    };

    resizeHandle.elt.addEventListener('mousedown', startResize);
    resizeHandle.elt.addEventListener('touchstart', startResize, { passive: false });
}

/**
 * XMLコンテンツを表示するためのモーダルパネルを作成します。
 * @param {string} xmlContent 表示するXML文字列
 */
function showXMLPanel(xmlContent) {
    if (currentUiPanel) {
        currentUiPanel.remove();
        currentUiPanel = null;
    }

    const overlay = createDiv('');
    currentModalPanel = overlay;
    overlay.style('position', 'fixed');
    overlay.style('top', '0');
    overlay.style('left', '0');
    overlay.style('width', '100%');
    overlay.style('height', '100%');
    overlay.style('background', 'rgba(0, 0, 0, 0.7)');
    overlay.style('display', 'flex');
    overlay.style('justify-content', 'center');
    overlay.style('align-items', 'center');
    overlay.style('z-index', '2000');

    const panel = createDiv('');
    panel.parent(overlay);
    panel.addClass('modal-content');
    panel.style('width', '80vw');
    panel.style('height', '80vh');
    panel.style('max-width', '800px');
    panel.style('max-height', '600px');
    panel.style('background', '#f5f5f5');
    panel.style('border-radius', '8px');
    panel.style('box-shadow', '0 4px 15px rgba(0,0,0,0.2)');
    panel.style('display', 'flex');
    panel.style('flex-direction', 'column');
    panel.style('padding', '15px');
    
    const header = createDiv('');
    header.parent(panel);
    header.style('display', 'flex');
    header.style('justify-content', 'space-between');
    header.style('align-items', 'center');
    header.style('margin-bottom', '10px');
    header.style('flex-shrink', '0');

    const title = createP('XML Output');
    title.parent(header);
    title.style('margin', '0');
    title.style('font-size', '18px');
    title.style('font-weight', 'bold');

    const closeButton = createButton('×');
    closeButton.parent(header);
    closeButton.style('border', 'none');
    closeButton.style('background', 'transparent');
    closeButton.style('font-size', '24px');
    closeButton.style('cursor', 'pointer');
    closeButton.mousePressed(() => {
        if (currentModalPanel) {
            currentModalPanel.remove();
            currentModalPanel = null;
        }
    });

    const textArea = createElement('textarea');
    textArea.value(xmlContent);
    textArea.parent(panel);
    textArea.attribute('readonly', '');
    textArea.style('width', '100%');
    textArea.style('flex-grow', '1');
    textArea.style('resize', 'none');
    textArea.style('border', '1px solid #ccc');
    textArea.style('border-radius', '4px');
    textArea.style('padding', '10px');
    textArea.style('font-family', 'monospace');
    textArea.style('font-size', '14px');
    textArea.style('background-color', '#fff');

    const footer = createDiv('');
    footer.parent(panel);
    footer.style('display', 'flex');
    footer.style('justify-content', 'flex-end');
    footer.style('margin-top', '10px');
    footer.style('flex-shrink', '0');

    const copyButton = createButton('クリップボードにコピー');
    copyButton.parent(footer);
    copyButton.style('padding', '8px 15px');
    copyButton.style('border', '1px solid #007bff');
    copyButton.style('background-color', '#007bff');
    copyButton.style('color', 'white');
    copyButton.style('border-radius', '4px');
    copyButton.style('cursor', 'pointer');

    copyButton.mousePressed(() => {
        textArea.elt.select();
        document.execCommand('copy');
        copyButton.html('コピーしました！');
        setTimeout(() => {
            copyButton.html('クリップボードにコピー');
        }, 2000);
    });
}
/**
 * XMLをペーストしてインポートするためのモーダルパネルを作成します。
 */
function showXMLInputPanel() {
    if (currentUiPanel) {
        currentUiPanel.remove();
        currentUiPanel = null;
    }

    const overlay = createDiv('');
    currentModalPanel = overlay;
    overlay.style('position', 'fixed');
    overlay.style('top', '0');
    overlay.style('left', '0');
    overlay.style('width', '100%');
    overlay.style('height', '100%');
    overlay.style('background', 'rgba(0, 0, 0, 0.7)');
    overlay.style('display', 'flex');
    overlay.style('justify-content', 'center');
    overlay.style('align-items', 'center');
    overlay.style('z-index', '2000');

    const panel = createDiv('');
    panel.parent(overlay);
    panel.addClass('modal-content');
    panel.style('width', '80vw');
    panel.style('height', '80vh');
    panel.style('max-width', '800px');
    panel.style('max-height', '600px');
    panel.style('background', '#f5f5f5');
    panel.style('border-radius', '8px');
    panel.style('box-shadow', '0 4px 15px rgba(0,0,0,0.2)');
    panel.style('display', 'flex');
    panel.style('flex-direction', 'column');
    panel.style('padding', '15px');
    
    const header = createDiv('');
    header.parent(panel);
    header.style('display', 'flex');
    header.style('justify-content', 'space-between');
    header.style('align-items', 'center');
    header.style('margin-bottom', '10px');
    header.style('flex-shrink', '0');

    const title = createP('XML Import');
    title.parent(header);
    title.style('margin', '0');
    title.style('font-size', '18px');
    title.style('font-weight', 'bold');

    const closeButton = createButton('×');
    closeButton.parent(header);
    closeButton.style('border', 'none');
    closeButton.style('background', 'transparent');
    closeButton.style('font-size', '24px');
    closeButton.style('cursor', 'pointer');
    closeButton.mousePressed(() => {
        if (currentModalPanel) {
            currentModalPanel.remove();
            currentModalPanel = null;
        }
    });

    const textArea = createElement('textarea', 'ここにXMLをペーストしてください...');
    textArea.parent(panel);
    textArea.style('width', '100%');
    textArea.style('flex-grow', '1');
    textArea.style('resize', 'none');
    textArea.style('border', '1px solid #ccc');
    textArea.style('border-radius', '4px');
    textArea.style('padding', '10px');
    textArea.style('font-family', 'monospace');
    textArea.style('font-size', '14px');
    textArea.style('background-color', '#fff');
    textArea.elt.addEventListener('focus', () => {
        if (textArea.value() === 'ここにXMLをペーストしてください...') {
            textArea.value('');
        }
    });

    const errorMsg = createP('');
    errorMsg.parent(panel);
    errorMsg.style('color', 'red');
    errorMsg.style('margin', '5px 0 0 0');
    errorMsg.style('font-size', '12px');
    errorMsg.style('text-align', 'right');
    errorMsg.style('flex-shrink', '0');
    errorMsg.hide();

    const footer = createDiv('');
    footer.parent(panel);
    footer.style('display', 'flex');
    footer.style('justify-content', 'flex-end');
    footer.style('gap', '10px');
    footer.style('margin-top', '10px');
    footer.style('flex-shrink', '0');

    const handleImport = (mode) => {
        try {
            const xmlContent = textArea.value();
            importFromXML(xmlContent, mode);
            if (currentModalPanel) {
                currentModalPanel.remove();
                currentModalPanel = null;
            }
        } catch (e) {
            errorMsg.html(e.message);
            errorMsg.show();
        }
    };

    const addButton = createButton('追加 (Add)');
    addButton.parent(footer);
    addButton.style('padding', '8px 15px');
    addButton.style('border', '1px solid #28a745');
    addButton.style('background-color', '#28a745');
    addButton.style('color', 'white');
    addButton.style('border-radius', '4px');
    addButton.style('cursor', 'pointer');
    addButton.mousePressed(() => handleImport('add'));

    const overwriteButton = createButton('上書き (Overwrite)');
    overwriteButton.parent(footer);
    overwriteButton.style('padding', '8px 15px');
    overwriteButton.style('border', '1px solid #dc3545');
    overwriteButton.style('background-color', '#dc3545');
    overwriteButton.style('color', 'white');
    overwriteButton.style('border-radius', '4px');
    overwriteButton.style('cursor', 'pointer');
    overwriteButton.mousePressed(() => handleImport('overwrite'));
}