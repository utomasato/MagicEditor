// =============================================
// UI Panel Functions
// =============================================

// 現在開いているファイルのハンドルを保持する変数
let currentFileHandle = null;

// ショートカットキー (Ctrl+S / Cmd+S) の登録
document.addEventListener('keydown', async (e) => {
    // Ctrl+S または Cmd+S
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault(); // ブラウザの保存ダイアログを抑制

        // XMLを生成
        const xmlContent = generateLayoutXML();

        try {
            if (currentFileHandle) {
                // ハンドルがある場合は上書き保存
                const writable = await currentFileHandle.createWritable();
                await writable.write(xmlContent);
                await writable.close();

                // 保存完了の簡易フィードバック
                const msg = createDiv('Saved!');
                msg.style('position', 'fixed');
                msg.style('bottom', '20px');
                msg.style('right', '20px');
                msg.style('background', 'rgba(40, 167, 69, 0.9)');
                msg.style('color', 'white');
                msg.style('padding', '10px 20px');
                msg.style('border-radius', '5px');
                msg.style('z-index', '3000');
                msg.style('font-family', 'sans-serif');
                msg.style('pointer-events', 'none');
                setTimeout(() => msg.remove(), 2000);

            } else {
                // ハンドルがない場合は新規作成（名前を付けて保存）
                if ('showSaveFilePicker' in window) {
                    const opts = {
                        types: [{
                            description: 'XML file',
                            accept: { 'text/xml': ['.xml'] },
                        }],
                        suggestedName: 'magic_circle.xml',
                    };
                    const handle = await window.showSaveFilePicker(opts);
                    const writable = await handle.createWritable();
                    await writable.write(xmlContent);
                    await writable.close();
                    currentFileHandle = handle; // ハンドルを保存
                    alert('保存しました。');
                } else {
                    // File System Access API 非対応ブラウザはダウンロード
                    const blob = new Blob([xmlContent], { type: 'text/xml' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'magic_circle.xml';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
            }
        } catch (err) {
            // キャンセルされた場合は何もしない
            if (err.name !== 'AbortError') {
                console.error(err);
                alert('保存に失敗しました: ' + err.message);
            }
        }
    }
});

/**
 * 現在の状態からXML文字列を生成するヘルパー関数
 * (io.js の exportToXML のロジックを再利用して文字列のみ返す)
 */
function generateLayoutXML() {
    // 1. 各リングに一意のIDを割り振る
    const ringIdMap = new Map();
    rings.forEach((ring, index) => {
        ringIdMap.set(ring, index);
    });

    const startRingId = startRing ? ringIdMap.get(startRing) : -1;

    // 2. XML文字列の構築を開始
    let xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlString += `<MagicCircleLayout startRingId="${startRingId}">\n`;

    // 3. すべてのリングをXMLに変換 (io.jsの関数を使用)
    xmlString += ' <Rings>\n';
    rings.forEach(ring => {
        if (typeof ringToXML === 'function') {
            xmlString += ringToXML(ring, ringIdMap);
        }
    });
    xmlString += ' </Rings>\n';

    // 4. フィールドアイテムをXMLに変換 (io.jsの関数を使用)
    xmlString += ' <FieldItems>\n';
    fieldItems.forEach(item => {
        if (typeof itemToXML === 'function') {
            xmlString += itemToXML(item, ringIdMap);
        }
    });
    xmlString += ' </FieldItems>\n';

    xmlString += '</MagicCircleLayout>\n';
    return xmlString;
}

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
            if (startRing) startRing.isStartPoint = true;
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
        newJoint.pos.x += (ring.radius + 70) * Math.sin(ring.angle + PI / 20);
        newJoint.pos.y -= (ring.radius + 70) * Math.cos(ring.angle + PI / 20);
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
            "fire", "bullet", "charge", "barrier",
        ];
        magicOptions.forEach(opt => { magicSelect.option(opt); });
        magicSelect.selected(ring.magic);

        magicSelect.changed(() => {
            ring.magic = magicSelect.value();
            closePanel(); // パネルを閉じる
        });

        // --- パラメータ追加UI ---
        if (typeof templateDatas !== 'undefined' && templateDatas[ring.magic]) {
            const paramContainer = createDiv('');
            paramContainer.parent(contentArea);
            paramContainer.style('margin-top', '8px');
            paramContainer.style('border-top', '1px solid #ddd');
            paramContainer.style('padding-top', '8px');

            const paramLabel = createP('Add Parameter:');
            paramLabel.parent(paramContainer);
            paramLabel.style('margin', '0 0 4px 0');
            paramLabel.style('font-size', '12px');

            const paramSelect = createSelect();
            paramSelect.parent(paramContainer);
            paramSelect.style('width', '100%');
            paramSelect.option('Select parameter...');

            const params = templateDatas[ring.magic].parameters;
            Object.keys(params).forEach(key => {
                paramSelect.option(key);
            });

            paramSelect.changed(() => {
                const key = paramSelect.value();
                if (key === 'Select parameter...') return;

                const paramDef = params[key];
                if (paramDef) {
                    // 名前オブジェクトを追加
                    ring.items.push(new Name(0, 0, key, ring));

                    const type = paramDef.type;
                    const vals = String(paramDef.defaultValue).split(/\s+/);

                    // vector3 または color の場合、ArrayRing を作成して接続
                    if (type === 'vector3' || type === 'color') {
                        // 新しい ArrayRing を作成 (親リングの近くに配置)
                        // 配置場所は適当に親の右下あたりにする
                        const newRingPos = { x: ring.pos.x + 150, y: ring.pos.y + 150 };
                        const newArrayRing = new ArrayRing(newRingPos);
                        if (type === 'color') newArrayRing.visualEffect = 'color';

                        // グローバルな rings 配列に追加
                        rings.push(newArrayRing);

                        // デフォルト値を ArrayRing に追加
                        vals.forEach(v => {
                            if (v) newArrayRing.items.push(new Chars(0, 0, v, newArrayRing));
                        });
                        newArrayRing.CalculateLayout();

                        // Joint を作成して TemplateRing に追加
                        const joint = new Joint(0, 0, newArrayRing, ring);
                        ring.items.push(joint);

                    } else {
                        // それ以外（数値など）は直接 Chars を追加
                        vals.forEach(v => {
                            if (v) ring.items.push(new Chars(0, 0, v, ring));
                        });
                    }

                    ring.CalculateLayout();
                    paramSelect.selected('Select parameter...');
                }
            });
        }
        // ------------------------

    }
    // TemplateRing 以外の場合、または isNew フラグが立っている場合
    else if (true || ring.isNew) {

        // --- ArrayRing Option ---
        if (ring instanceof ArrayRing) {
            const visualLabel = createP('Visual Effect:');
            visualLabel.parent(contentArea);
            visualLabel.style('margin', '10px 0 2px 0');
            visualLabel.style('border-top', '1px solid #ddd');
            visualLabel.style('padding-top', '8px');

            const visualSelect = createSelect();
            visualSelect.parent(contentArea);
            visualSelect.style('width', '100%');

            const options = ['-', 'color', 'gradient', 'curve'];
            options.forEach(opt => visualSelect.option(opt));

            // Initialize property if missing
            if (!ring.visualEffect) ring.visualEffect = '-';
            visualSelect.selected(ring.visualEffect);

            visualSelect.changed(() => {
                switch (visualSelect.value()) {
                    case 'color':
                        ring.items = [new Sigil(0, 0, "COMPLETE", ring), new Chars(0, 0, "1.0", ring), new Chars(0, 0, "0.5", ring), new Chars(0, 0, "0.0", ring), new Chars(0, 0, "1.0", ring),];
                        break;
                }
                ring.visualEffect = visualSelect.value();
                ring.CalculateLayout();
                // パネル再描画
                closePanel();
                setTimeout(() => createRingPanel(ring), 10);
            });

            // --- Color Preview Rectangle ---
            if (ring.visualEffect === 'color') {
                const colorContainer = createDiv('');
                colorContainer.parent(contentArea);
                colorContainer.style('margin-top', '8px');
                colorContainer.style('cursor', 'pointer');
                colorContainer.style('border', '1px solid #999');
                colorContainer.style('border-radius', '4px');
                colorContainer.style('height', '30px');
                colorContainer.style('display', 'flex');
                colorContainer.style('align-items', 'center');
                colorContainer.style('justify-content', 'center');
                // 市松模様（透明度確認用）
                colorContainer.style('background-image', 'linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%), linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%)');
                colorContainer.style('background-size', '10px 10px');
                colorContainer.style('background-position', '0 0, 5px 5px');

                // 現在の値を取得
                let r = 0, g = 0, b = 0, a = 1;
                if (ring.items.length >= 5) {
                    r = parseFloat(ring.items[1].value) * 255;
                    g = parseFloat(ring.items[2].value) * 255;
                    b = parseFloat(ring.items[3].value) * 255;
                    a = parseFloat(ring.items[4].value);
                }

                const colorPreview = createDiv('');
                colorPreview.parent(colorContainer);
                colorPreview.style('width', '100%');
                colorPreview.style('height', '100%');
                colorPreview.style('background-color', `rgba(${r}, ${g}, ${b}, ${a})`);
                colorPreview.style('display', 'flex');
                colorPreview.style('align-items', 'center');
                colorPreview.style('justify-content', 'center');

                const label = createDiv('Edit Color');
                label.parent(colorPreview);
                label.style('font-size', '10px');
                label.style('color', a > 0.5 ? (r + g + b > 380 ? 'black' : 'white') : 'black');
                label.style('text-shadow', '0 0 2px rgba(128,128,128,0.5)');
                label.style('pointer-events', 'none');

                colorContainer.elt.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    closePanel();
                    // カラーピッカーパネルを開く
                    createColorPickerPanel(ring);
                });
            }
        }
        // ------------------------

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
        typeSelect.option('TemplateRing');
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
                else if (newType === 'TemplateRing') { newRing = new TemplateRing(ring.pos); }
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

// =============================================
// Color Conversion Helpers
// =============================================

function rgbToHsv(r, g, b) {
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, v = max;
    let d = max - min;
    s = max === 0 ? 0 : d / max;

    if (max === min) {
        h = 0; // achromatic
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, v];
}

function hsvToRgb(h, s, v) {
    let r, g, b;
    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return [r, g, b];
}

function rgbToHex(r, g, b) {
    const toHex = (c) => {
        const hex = Math.round(c * 255).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };
    return (toHex(r) + toHex(g) + toHex(b)).toUpperCase();
}

function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : null;
}
/**
 * ArrayRingの色編集用パネルを作成します。
 */
function createColorPickerPanel(ring) {
    // パネルを閉じる処理（レイアウト再計算を含む）
    const closePanel = () => {
        if (ring && typeof ring.CalculateLayout === 'function') {
            ring.CalculateLayout();
        }

        if (currentUiPanel) {
            currentUiPanel.remove();
            currentUiPanel = null;
        }
        editingItem = null;
    };

    const panelResult = createBasePanel('Color Picker', closePanel);
    if (!panelResult) return;
    const { contentArea } = panelResult;

    // パネル全体のスタイル調整
    currentUiPanel.style('background-color', '#282828');
    currentUiPanel.style('color', '#ddd');
    currentUiPanel.style('width', '240px');

    // 初期値の取得
    const getRGBA = () => {
        if (ring.items.length < 5) return { r: 1, g: 1, b: 1, a: 1 };
        return {
            r: parseFloat(ring.items[1].value),
            g: parseFloat(ring.items[2].value),
            b: parseFloat(ring.items[3].value),
            a: parseFloat(ring.items[4].value)
        };
    };

    let rgba = getRGBA();
    let [h, s, v] = rgbToHsv(rgba.r, rgba.g, rgba.b);

    // =============================================
    // Visual Picker Area (Ring + Square)
    // =============================================
    const pickerContainer = createDiv('');
    pickerContainer.parent(contentArea);
    pickerContainer.style('position', 'relative');
    pickerContainer.style('width', '200px');
    pickerContainer.style('height', '200px');
    pickerContainer.style('margin', '0 auto 10px auto');
    pickerContainer.style('user-select', 'none');

    // --- 1. Hue Ring (外側のリング) ---
    const hueRing = createDiv('');
    hueRing.parent(pickerContainer);
    hueRing.style('position', 'absolute');
    hueRing.style('top', '0');
    hueRing.style('left', '0');
    hueRing.style('width', '100%');
    hueRing.style('height', '100%');
    hueRing.style('border-radius', '50%');
    // Unityと同様の時計回りのグラデーション
    hueRing.style('background', 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)');
    hueRing.style('cursor', 'crosshair');

    // Hue Selector Knob
    const hueKnob = createDiv('');
    hueKnob.parent(hueRing);
    hueKnob.style('position', 'absolute');
    hueKnob.style('width', '12px');
    hueKnob.style('height', '12px');
    hueKnob.style('border', '2px solid white');
    hueKnob.style('border-radius', '50%');
    hueKnob.style('transform', 'translate(-50%, -50%)');
    hueKnob.style('pointer-events', 'none');
    hueKnob.style('box-shadow', '0 0 2px rgba(0,0,0,0.5)');

    // --- 2. Mask (リングと四角の間の隙間) ---
    const mask = createDiv('');
    mask.parent(pickerContainer);
    mask.style('position', 'absolute');
    mask.style('top', '15%');
    mask.style('left', '15%');
    mask.style('width', '70%');
    mask.style('height', '70%');
    mask.style('background-color', '#282828');
    mask.style('border-radius', '50%');
    mask.style('pointer-events', 'none');

    // --- 3. SV Square (内側の四角) ---
    const svSquare = createDiv('');
    svSquare.parent(pickerContainer);
    svSquare.style('position', 'absolute');
    svSquare.style('top', '50%');
    svSquare.style('left', '50%');
    svSquare.style('width', '50%');
    svSquare.style('height', '50%');
    svSquare.style('transform', 'translate(-50%, -50%)');
    svSquare.style('cursor', 'crosshair');

    // 白（彩度）のグラデーション（左→右）
    const svWhite = createDiv('');
    svWhite.parent(svSquare);
    svWhite.style('position', 'absolute');
    svWhite.style('width', '100%');
    svWhite.style('height', '100%');
    svWhite.style('background', 'linear-gradient(to right, #fff, rgba(255,255,255,0))');

    // 黒（明度）のグラデーション（透明→黒）
    const svBlack = createDiv('');
    svBlack.parent(svSquare);
    svBlack.style('position', 'absolute');
    svBlack.style('width', '100%');
    svBlack.style('height', '100%');
    svBlack.style('background', 'linear-gradient(to bottom, transparent, #000)');

    // SV Selector Knob
    const svKnob = createDiv('');
    svKnob.parent(svSquare);
    svKnob.style('position', 'absolute');
    svKnob.style('width', '10px');
    svKnob.style('height', '10px');
    svKnob.style('border', '2px solid black');
    svKnob.style('outline', '1px solid white');
    svKnob.style('border-radius', '50%');
    svKnob.style('transform', 'translate(-50%, -50%)');
    svKnob.style('pointer-events', 'none');

    // =============================================
    // UI Update Logic
    // =============================================

    // 数値をフォーマットするヘルパー関数
    const formatFloat = (val) => {
        // 3桁で丸めて数値化することで不要な0 ("0.500" -> 0.5) を除去
        let s = parseFloat(val.toFixed(3)).toString();
        // 整数になってしまった場合 ("1") は ".0" を付与して "1.0" にする
        if (s.indexOf('.') === -1) {
            s += '.0';
        }
        return s;
    };

    const applyToRing = () => {
        ring.items[1].value = formatFloat(rgba.r);
        ring.items[2].value = formatFloat(rgba.g);
        ring.items[3].value = formatFloat(rgba.b);
        ring.items[4].value = formatFloat(rgba.a);
    };

    const updateUI = (updateInputs = true) => {
        // Hue Ring Knob Position
        const angle = h * Math.PI * 2;
        const r = 100 * 0.92;
        const knobX = 100 + 90 * Math.sin(angle);
        const knobY = 100 - 90 * Math.cos(angle);
        hueKnob.style('left', `${knobX}px`);
        hueKnob.style('top', `${knobY}px`);

        // SV Square Background
        const pureColor = hsvToRgb(h, 1, 1);
        svSquare.style('background-color', `rgb(${pureColor[0] * 255},${pureColor[1] * 255},${pureColor[2] * 255})`);

        // SV Knob Position
        svKnob.style('left', `${s * 100}%`);
        svKnob.style('top', `${(1 - v) * 100}%`);

        if (updateInputs) {
            updateSliders();
        }
    };

    // マウス操作: Hue Ring
    const handleHueDrag = (e) => {
        const rect = hueRing.elt.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;

        let angle = Math.atan2(dy, dx);
        angle += Math.PI / 2;
        if (angle < 0) angle += Math.PI * 2;

        h = angle / (Math.PI * 2);

        const rgb = hsvToRgb(h, s, v);
        rgba.r = rgb[0]; rgba.g = rgb[1]; rgba.b = rgb[2];
        applyToRing();
        updateUI();
    };

    // マウス操作: SV Square
    const handleSVDrag = (e) => {
        const rect = svSquare.elt.getBoundingClientRect();
        let x = (e.clientX - rect.left) / rect.width;
        let y = (e.clientY - rect.top) / rect.height;

        x = Math.max(0, Math.min(1, x));
        y = Math.max(0, Math.min(1, y));

        s = x;
        v = 1 - y;

        const rgb = hsvToRgb(h, s, v);
        rgba.r = rgb[0]; rgba.g = rgb[1]; rgba.b = rgb[2];
        applyToRing();
        updateUI();
    };

    const setupDrag = (element, handler) => {
        element.elt.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            handler(e);
            const moveHandler = (ev) => handler(ev);
            const upHandler = () => {
                window.removeEventListener('mousemove', moveHandler);
                window.removeEventListener('mouseup', upHandler);
            };
            window.addEventListener('mousemove', moveHandler);
            window.addEventListener('mouseup', upHandler);
        });
    };

    setupDrag(hueRing, handleHueDrag);
    setupDrag(svSquare, handleSVDrag);

    // =============================================
    // Sliders & Hex Area
    // =============================================
    const controlsContainer = createDiv('');
    controlsContainer.parent(contentArea);
    controlsContainer.style('display', 'flex');
    controlsContainer.style('flex-direction', 'column');
    controlsContainer.style('gap', '4px');
    controlsContainer.style('padding-top', '10px');

    const sliders = {};
    const inputs = {};

    const createSliderRow = (label, colorKey) => {
        const row = createDiv('');
        row.parent(controlsContainer);
        row.style('display', 'flex');
        row.style('align-items', 'center');
        row.style('gap', '8px');

        const labelDiv = createDiv(label);
        labelDiv.parent(row);
        labelDiv.style('width', '15px');
        labelDiv.style('font-size', '12px');
        labelDiv.style('color', '#ccc');

        const sliderContainer = createDiv('');
        sliderContainer.parent(row);
        sliderContainer.style('flex-grow', '1');
        sliderContainer.style('position', 'relative');
        sliderContainer.style('height', '18px');

        const bg = createDiv('');
        bg.parent(sliderContainer);
        bg.style('width', '100%');
        bg.style('height', '100%');
        bg.style('border-radius', '3px');
        bg.style('position', 'absolute');
        bg.style('z-index', '0');

        const slider = createInput('', 'range');
        slider.parent(sliderContainer);
        slider.style('width', '100%');
        slider.style('height', '100%');
        slider.style('position', 'absolute');
        slider.style('top', '0');
        slider.style('left', '0');
        slider.style('opacity', '0');
        slider.style('cursor', 'pointer');
        slider.style('margin', '0');
        slider.attribute('min', '0');
        slider.attribute('max', '255');
        slider.attribute('step', '1');

        const handle = createDiv('');
        handle.parent(sliderContainer);
        handle.style('position', 'absolute');
        handle.style('top', '0');
        handle.style('bottom', '0');
        handle.style('width', '4px');
        handle.style('background', 'white');
        handle.style('box-shadow', '0 0 2px black');
        handle.style('pointer-events', 'none');
        handle.style('z-index', '1');

        const numInput = createInput('0');
        numInput.parent(row);
        numInput.style('width', '40px');
        numInput.style('background', '#444');
        numInput.style('color', '#fff');
        numInput.style('border', '1px solid #555');
        numInput.style('border-radius', '3px');
        numInput.style('text-align', 'right');
        numInput.style('font-size', '12px');

        sliders[colorKey] = { slider, bg, handle };
        inputs[colorKey] = numInput;

        slider.input(() => {
            const val = parseFloat(slider.value()) / 255;
            rgba[colorKey] = val;

            if (colorKey !== 'a') {
                [h, s, v] = rgbToHsv(rgba.r, rgba.g, rgba.b);
            }
            applyToRing();
            updateUI(false);
            updateSliderVisuals();
            numInput.value(Math.floor(val * 255));
            updateHex();
        });

        numInput.input(() => {
            let val = parseInt(numInput.value());
            if (isNaN(val)) val = 0;
            val = Math.max(0, Math.min(255, val));
            rgba[colorKey] = val / 255;
            if (colorKey !== 'a') {
                [h, s, v] = rgbToHsv(rgba.r, rgba.g, rgba.b);
            }
            applyToRing();
            updateUI();
        });
    };

    createSliderRow('R', 'r');
    createSliderRow('G', 'g');
    createSliderRow('B', 'b');
    createSliderRow('A', 'a');

    // Hex Input
    const hexRow = createDiv('');
    hexRow.parent(controlsContainer);
    hexRow.style('display', 'flex');
    hexRow.style('justify-content', 'space-between');
    hexRow.style('align-items', 'center');
    hexRow.style('margin-top', '4px');

    const hexLabel = createDiv('Hexadecimal');
    hexLabel.parent(hexRow);
    hexLabel.style('font-size', '12px');
    hexLabel.style('color', '#ccc');

    const hexInput = createInput('FFFFFF');
    hexInput.parent(hexRow);
    hexInput.style('width', '80px');
    hexInput.style('background', '#444');
    hexInput.style('color', '#fff');
    hexInput.style('border', '1px solid #555');
    hexInput.style('border-radius', '3px');
    hexInput.style('padding', '2px');

    hexInput.elt.addEventListener('change', () => {
        const rgb = hexToRgb(hexInput.value());
        if (rgb) {
            rgba.r = rgb.r; rgba.g = rgb.g; rgba.b = rgb.b;
            [h, s, v] = rgbToHsv(rgba.r, rgba.g, rgba.b);
            applyToRing();
            updateUI();
        }
    });

    const updateSliderVisuals = () => {
        const r = Math.floor(rgba.r * 255);
        const g = Math.floor(rgba.g * 255);
        const b = Math.floor(rgba.b * 255);

        sliders.r.bg.style('background', `linear-gradient(to right, rgb(0,${g},${b}), rgb(255,${g},${b}))`);
        sliders.r.handle.style('left', `${rgba.r * 100}%`);

        sliders.g.bg.style('background', `linear-gradient(to right, rgb(${r},0,${b}), rgb(${r},255,${b}))`);
        sliders.g.handle.style('left', `${rgba.g * 100}%`);

        sliders.b.bg.style('background', `linear-gradient(to right, rgb(${r},${g},0), rgb(${r},${g},255))`);
        sliders.b.handle.style('left', `${rgba.b * 100}%`);

        sliders.a.bg.style('background', `linear-gradient(to right, rgba(${r},${g},${b},0), rgba(${r},${g},${b},1)), url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAIklEQVQYV2NkYGD4D8SMQAwCcOAfeCnDjISwU8fA8H8wAwBi2xH7s8Xw+gAAAABJRU5ErkJggg==')`);
        sliders.a.bg.style('background-blend-mode', 'normal');
        sliders.a.handle.style('left', `${rgba.a * 100}%`);
    };

    const updateSliders = () => {
        sliders.r.slider.value(rgba.r * 255);
        inputs.r.value(Math.floor(rgba.r * 255));

        sliders.g.slider.value(rgba.g * 255);
        inputs.g.value(Math.floor(rgba.g * 255));

        sliders.b.slider.value(rgba.b * 255);
        inputs.b.value(Math.floor(rgba.b * 255));

        sliders.a.slider.value(rgba.a * 255);
        inputs.a.value(Math.floor(rgba.a * 255));

        updateSliderVisuals();
        updateHex();
    };

    const updateHex = () => {
        hexInput.value(rgbToHex(rgba.r, rgba.g, rgba.b));
    };

    updateUI();
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

    // --- 上書き保存ボタン (ファイルハンドルがある場合のみ表示) ---
    if (currentFileHandle) {
        const overwriteButton = createButton('💾 上書き保存 (Overwrite)');
        overwriteButton.parent(footer);
        overwriteButton.style('padding', '8px 15px');
        overwriteButton.style('border', '1px solid #0056b3');
        overwriteButton.style('background-color', '#0056b3');
        overwriteButton.style('color', 'white');
        overwriteButton.style('border-radius', '4px');
        overwriteButton.style('cursor', 'pointer');
        overwriteButton.style('margin-right', '10px');

        overwriteButton.mousePressed(async () => {
            try {
                const xmlContent = textArea.value();
                // 既存のハンドルに書き込む
                const writable = await currentFileHandle.createWritable();
                await writable.write(xmlContent);
                await writable.close();
                alert('上書き保存しました。');
            } catch (err) {
                console.error(err);
                alert('上書き保存に失敗しました: ' + err.message);
            }
        });
    }

    // --- 名前を付けて保存ボタン ---
    const saveAsButton = createButton('💾 名前を付けて保存 (Save As)');
    saveAsButton.parent(footer);
    saveAsButton.style('padding', '8px 15px');
    saveAsButton.style('border', '1px solid #28a745');
    saveAsButton.style('background-color', '#28a745');
    saveAsButton.style('color', 'white');
    saveAsButton.style('border-radius', '4px');
    saveAsButton.style('cursor', 'pointer');
    saveAsButton.style('margin-right', '10px');

    saveAsButton.mousePressed(async () => {
        try {
            const xmlContent = textArea.value();

            // Check for File System Access API support
            if ('showSaveFilePicker' in window) {
                const opts = {
                    types: [{
                        description: 'XML file',
                        accept: { 'text/xml': ['.xml'] },
                    }],
                    suggestedName: 'magic_circle.xml',
                };
                // 保存時に新しいハンドルを取得して更新
                const handle = await window.showSaveFilePicker(opts);
                const writable = await handle.createWritable();
                await writable.write(xmlContent);
                await writable.close();
                currentFileHandle = handle; // ハンドルを更新
                alert('保存しました。次回から「上書き保存」が可能です。');

                // パネルを再描画して「上書き保存」ボタンを表示させる
                if (currentModalPanel) {
                    currentModalPanel.remove();
                    currentModalPanel = null;
                }
                showXMLPanel(xmlContent);

            } else {
                // Fallback
                const blob = new Blob([xmlContent], { type: 'text/xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'magic_circle.xml';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            // Fail silently if user cancelled
            if (err.name !== 'AbortError') {
                console.error(err);
                alert('保存に失敗しました: ' + err.message);
            }
        }
    });

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

    // --- ファイル入力 (Fallback用) ---
    const fileInput = createInput('', 'file');
    fileInput.parent(panel);
    fileInput.attribute('accept', '.xml');
    fileInput.style('display', 'none');

    // --- ツールバー（ファイルを開くボタン） ---
    const toolbar = createDiv('');
    toolbar.parent(panel);
    toolbar.style('display', 'flex');
    toolbar.style('margin-bottom', '5px');

    const openFileBtn = createButton('📂 ファイルを開く (Open XML)');
    openFileBtn.parent(toolbar);
    openFileBtn.style('padding', '5px 10px');
    openFileBtn.style('cursor', 'pointer');
    openFileBtn.style('font-size', '12px');

    openFileBtn.mousePressed(async () => {
        // File System Access API を優先して使用
        if ('showOpenFilePicker' in window) {
            try {
                const [handle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'XML Files',
                        accept: { 'text/xml': ['.xml'] }
                    }],
                    multiple: false
                });
                // ハンドルを保存（これで上書きが可能になる）
                currentFileHandle = handle;

                const file = await handle.getFile();
                const text = await file.text();
                textArea.value(text);
                errorMsg.hide();
            } catch (err) {
                // キャンセルされた場合は無視
                if (err.name !== 'AbortError') console.error(err);
            }
        } else {
            // 非対応ブラウザは従来の方法
            fileInput.elt.click();
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

    // --- ファイルが選択されたときの処理 (Fallback) ---
    fileInput.elt.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                textArea.value(e.target.result);
                errorMsg.hide(); // エラーメッセージがあれば隠す
                // 注意: <input>経由ではハンドルが取得できないため上書き不可
                currentFileHandle = null;
            };
            reader.readAsText(file);
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

/**
 * 右クリックでオブジェクトを追加するためのパネルを作成します。
 */
function createAddObjectPanel() {
    if (currentUiPanel) {
        currentUiPanel.remove();
        currentUiPanel = null;
    }

    const closePanel = () => {
        if (currentUiPanel) {
            currentUiPanel.remove();
            currentUiPanel = null;
        }
    };

    const panelResult = createBasePanel('Add Object', closePanel);
    if (!panelResult) return;

    const { contentArea } = panelResult;

    // 現在のマウス位置（ワールド座標）を取得して、オブジェクトの生成位置とする
    // mousePosはグローバル変数と想定
    const spawnX = typeof mousePos !== 'undefined' ? mousePos.x : 0;
    const spawnY = typeof mousePos !== 'undefined' ? mousePos.y : 0;
    const spawnPos = { x: spawnX, y: spawnY };

    const items = [
        { label: 'Ring', type: 'MagicRing' },
        { label: 'Sigil', type: 'Sigil' },
        { label: 'Num', type: 'Num' },
        { label: 'String', type: 'String' },
        { label: 'Name', type: 'Name' },
        { label: 'Template', type: 'TemplateRing' }
    ];

    items.forEach(item => {
        const btn = createButton(item.label);
        btn.parent(contentArea);
        btn.style('width', '100%');
        btn.style('padding', '8px');
        btn.style('margin-bottom', '4px');
        btn.style('text-align', 'left');
        btn.style('cursor', 'pointer');
        btn.style('border', '1px solid #ccc');
        btn.style('background', '#fff');
        btn.style('border-radius', '4px');

        btn.elt.addEventListener('mousedown', (e) => {
            e.stopPropagation();

            let newObj = null;
            switch (item.type) {
                case 'MagicRing':
                    newObj = new MagicRing({ x: spawnPos.x, y: spawnPos.y });
                    rings.push(newObj);
                    break;
                case 'TemplateRing':
                    newObj = new TemplateRing({ x: spawnPos.x, y: spawnPos.y });
                    rings.push(newObj);
                    break;
                case 'Sigil':
                    newObj = new Sigil(spawnPos.x, spawnPos.y, "add", null);
                    fieldItems.push(newObj);
                    break;
                case 'Num':
                    newObj = new Chars(spawnPos.x, spawnPos.y, "0", null);
                    fieldItems.push(newObj);
                    break;
                case 'String':
                    newObj = new StringToken(spawnPos.x, spawnPos.y, "string", null);
                    fieldItems.push(newObj);
                    break;
                case 'Name':
                    newObj = new Name(spawnPos.x, spawnPos.y, "name", null);
                    fieldItems.push(newObj);
                    break;
            }

            if (newObj) {
                newObj.isNew = true;
            }

            closePanel();
        });
    });
}