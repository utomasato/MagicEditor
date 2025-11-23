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

    // 初期位置を保存
    const initialX = GetMouseX() + 15;
    const initialY = GetMouseY() - 10;

    currentUiPanel = createDiv('');
    currentUiPanel.position(initialX, initialY);
    currentUiPanel.style('z-index', '1000');
    currentUiPanel.style('background-color', 'rgba(240, 240, 240, 0.95)');
    currentUiPanel.style('padding', '8px');
    currentUiPanel.style('border-radius', '6px');
    currentUiPanel.style('box-shadow', '0 2px 5px rgba(0,0,0,0.2)');
    currentUiPanel.style('display', 'flex');
    currentUiPanel.style('flex-direction', 'column');
    currentUiPanel.style('gap', '8px');
    currentUiPanel.style('user-select', 'none');
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

    // setTimeout(..., 0) を使うことで、呼び出し元の関数（createRingPanelなど）が
    // コンテンツを追加し終わった「後」にサイズ計算を実行させる
    setTimeout(() => {
        if (!currentUiPanel) return;

        const elt = currentUiPanel.elt;
        const rect = elt.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let newX = initialX;
        let newY = initialY;
        let needsUpdate = false;

        if (rect.right > viewportWidth - 10) {
            newX = viewportWidth - rect.width - 10;
            needsUpdate = true;
        }
        if (newX < 10) {
            newX = 10;
            needsUpdate = true;
        }
        if (rect.bottom > viewportHeight - 10) {
            newY = viewportHeight - rect.height - 10;
            needsUpdate = true;
        }
        if (newY < 10) {
            newY = 10;
            needsUpdate = true;
        }

        if (needsUpdate) {
            currentUiPanel.position(newX, newY);
        }
    }, 0);
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
        "pop","exch","dup","copy","index", "roll", "add", "sub","mul","div","idiv","mod","abs","neg","sqrt",
        "atan","cos","sin","rand","srand","rrand","array","string","length","get","put","getinterval","putinterval","forall",
        "dict","begin","end","def","eq","ne","ge","gt","le","lt","and","not","or","xor","true","false",
        "exec","if","ifelse","for","repeat","loop","exit","null", 
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

function createCommentPanel(ring) {
    const closePanel = () => { 
        if (currentUiPanel) { 
            currentUiPanel.remove(); 
            currentUiPanel = null; 
        } 
        editingItem = null; 
    };

    const panelResult = createBasePanel('Edit Comments', closePanel, null, null);
    if (!panelResult) return;
    const { contentArea } = panelResult;

    // 数値入力取得用のヘルパー関数
    const getNumberInput = (message, defaultValue) => {
        let input = prompt(message, defaultValue);
        while (input !== null) {
            const num = parseFloat(input);
            if (!isNaN(num)) {
                return num;
            }
            alert("数値ではありません。正しい数値を入力してください。");
            input = prompt(message, defaultValue); // 再試行
        }
        return null; // キャンセルされた場合
    };
    
    // メインのコンテナ
    const container = createDiv('');
    container.parent(contentArea);
    container.style('display', 'flex');
    container.style('flex-direction', 'column');
    container.style('gap', '5px');
    container.style('max-height', '300px');
    container.style('overflow-y', 'auto');

    // ヘッダー行
    const headerRow = createDiv('');
    headerRow.parent(container);
    headerRow.style('display', 'grid');
    headerRow.style('grid-template-columns', '2fr 1fr 1fr 100px'); // text, angle1, angle2, buttons
    headerRow.style('gap', '5px');
    headerRow.style('font-weight', 'bold');
    headerRow.style('border-bottom', '1px solid #ccc');
    headerRow.style('padding-bottom', '5px');
    headerRow.style('margin-bottom', '5px');
    
    createDiv('Text').parent(headerRow);
    createDiv('Ang1').parent(headerRow);
    createDiv('Ang2').parent(headerRow);
    createDiv('').parent(headerRow);

    // コメントリスト表示
    const renderComments = () => {
        // 既存のコメント行をクリア（ヘッダーは残す）
        const children = container.elt.children;
        while (children.length > 1) {
            container.elt.removeChild(children[1]);
        }

        ring.comments.forEach((comment, index) => {
            const row = createDiv('');
            row.parent(container);
            row.style('display', 'grid');
            row.style('grid-template-columns', '2fr 1fr 1fr 100px');
            row.style('gap', '5px');
            row.style('align-items', 'center');
            row.style('padding', '4px 0');
            row.style('border-bottom', '1px solid #eee');

            // Text
            const textDiv = createDiv(comment.text);
            textDiv.parent(row);
            textDiv.style('white-space', 'nowrap');
            textDiv.style('overflow', 'hidden');
            textDiv.style('text-overflow', 'ellipsis');
            textDiv.attribute('title', comment.text);
            textDiv.style('font-size', '12px');
            // テキストボックス風スタイル
            textDiv.style('background', '#fff');
            textDiv.style('border', '1px solid #ccc');
            textDiv.style('border-radius', '4px');
            textDiv.style('padding', '4px');
            textDiv.style('height', '24px');
            textDiv.style('line-height', '16px');

            // Angle1
            const ang1Div = createDiv(comment.angle1);
            ang1Div.parent(row);
            ang1Div.style('font-size', '12px');
            // テキストボックス風スタイル
            ang1Div.style('background', '#fff');
            ang1Div.style('border', '1px solid #ccc');
            ang1Div.style('border-radius', '4px');
            ang1Div.style('padding', '4px');
            ang1Div.style('height', '24px');
            ang1Div.style('line-height', '16px');

            // Angle2
            const ang2Div = createDiv(comment.angle2);
            ang2Div.parent(row);
            ang2Div.style('font-size', '12px');
            // テキストボックス風スタイル
            ang2Div.style('background', '#fff');
            ang2Div.style('border', '1px solid #ccc');
            ang2Div.style('border-radius', '4px');
            ang2Div.style('padding', '4px');
            ang2Div.style('height', '24px');
            ang2Div.style('line-height', '16px');

            // Buttons
            const btnContainer = createDiv('');
            btnContainer.parent(row);
            btnContainer.style('display', 'flex');
            btnContainer.style('gap', '4px');

            const editBtn = createButton('編集');
            editBtn.parent(btnContainer);
            editBtn.style('padding', '2px 6px');
            editBtn.style('font-size', '10px');
            editBtn.style('cursor', 'pointer');
            editBtn.elt.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                // 編集フロー
                const newText = prompt("テキストを入力してください:", comment.text);
                if (newText === null) return;

                const newAngle1 = getNumberInput("Angle1 (開始角度) を入力してください:", comment.angle1);
                if (newAngle1 === null) return;

                const newAngle2 = getNumberInput("Angle2 (範囲角度) を入力してください:", comment.angle2);
                if (newAngle2 === null) return;

                comment.text = newText;
                comment.angle1 = newAngle1;
                comment.angle2 = newAngle2;
                
                // UI更新（再描画）
                closePanel();
                setTimeout(() => createCommentPanel(ring), 10);
            });

            const delBtn = createButton('削除');
            delBtn.parent(btnContainer);
            delBtn.style('padding', '2px 6px');
            delBtn.style('font-size', '10px');
            delBtn.style('color', 'white');
            delBtn.style('background-color', '#ff4d4d');
            delBtn.style('border', 'none');
            delBtn.style('border-radius', '3px');
            delBtn.style('cursor', 'pointer');
            delBtn.elt.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                if (confirm("このコメントを削除しますか？")) {
                    ring.comments.splice(index, 1);
                    // UI更新（再描画）
                    closePanel();
                    setTimeout(() => createCommentPanel(ring), 10);
                }
            });
        });
    };

    renderComments();

    // 追加ボタン
    const addBtn = createButton('＋ コメントを追加');
    addBtn.parent(contentArea);
    addBtn.style('width', '100%');
    addBtn.style('margin-top', '10px');
    addBtn.style('padding', '6px');
    addBtn.style('cursor', 'pointer');
    addBtn.style('background-color', '#f0f0f0');
    addBtn.style('border', '1px dashed #999');
    
    addBtn.elt.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        // 新規作成ダイアログフロー
        const defaultText = "New Comment";
        const newText = prompt("新しいコメントのテキスト:", defaultText);
        if (newText === null) return;

        const newAngle1 = getNumberInput("Angle1 (開始角度):", "0");
        if (newAngle1 === null) return;

        const newAngle2 = getNumberInput("Angle2 (範囲角度):", "45");
        if (newAngle2 === null) return;
        
        ring.comments.push({
            text: newText,
            angle1: newAngle1,
            angle2: newAngle2
        });
        // UI更新
        closePanel();
        setTimeout(() => createCommentPanel(ring), 10);
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
        fieldItems.forEach(item => {
            if (item && item.type === 'joint' && item.value === ring) {
                item.value = null;
            }
        });
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

    // --- Marker Input (Modified to use Prompt) ---
    const markerContainer = createDiv('');
    markerContainer.parent(contentArea);
    markerContainer.style('display', 'flex');
    markerContainer.style('align-items', 'center');
    markerContainer.style('gap', '8px');
    markerContainer.style('margin-top', '0px');
    markerContainer.style('border-top', '1px solid #ddd');
    markerContainer.style('padding-top', '0px');

    const markerLabel = createP('Marker:');
    markerLabel.parent(markerContainer);
    //markerLabel.style('margin', '0');
    //markerLabel.style('font-size', '14px');

    // Display current value (Read-only)
    const markerDisplay = createP(ring.marker || '');
    markerDisplay.parent(markerContainer);
    markerDisplay.style('flex-grow', '1');
    markerDisplay.style('border', '1px solid #ccc');
    markerDisplay.style('border-radius', '4px');
    markerDisplay.style('padding', '4px');
    markerDisplay.style('background', '#f9f9f9'); // Read-only appearance
    markerDisplay.style('min-height', '1.5em'); // Ensure height even if empty
    markerDisplay.style('white-space', 'nowrap');
    markerDisplay.style('overflow', 'hidden');
    markerDisplay.style('text-overflow', 'ellipsis');

    // Edit Button triggers Prompt
    const editMarkerButton = createButton('編集');
    editMarkerButton.parent(markerContainer);
    editMarkerButton.style('cursor', 'pointer');
    
    editMarkerButton.elt.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        const newValue = prompt("マーカー名を入力してください:", ring.marker || "");
        
        if (newValue !== null) {
            ring.marker = newValue;
            markerDisplay.html(newValue);
            closePanel(); // パネルを閉じる
        }
    });
    // --------------------

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
    
    const straightenButton = createButton('このリングから直線化');
    straightenButton.parent(buttonContainer);
    straightenButton.style('width', '100%');
    straightenButton.style('padding', '5px');
    straightenButton.style('cursor', 'pointer');
    straightenButton.elt.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        StraightenConnectedJoints(ring);
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
    
    const commentButton = createButton('コメントを編集する');
    commentButton.parent(buttonContainer);
    commentButton.style('width', '100%');
    commentButton.style('padding', '5px');
    commentButton.style('cursor', 'pointer');
    commentButton.elt.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        // 既存のパネルを閉じてからコメントパネルを開く
        closePanel();
        // パネルが完全に閉じるのを少し待つ（DOM処理の安全のため）
        setTimeout(() => {
            createCommentPanel(ring);
        }, 10);
    });

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
            "fire", "bullet", "charge"
        ];
        magicOptions.forEach(opt => { magicSelect.option(opt); });
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
                newRing.marker = ring.marker; // マーカーを引き継ぐ

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