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
                ring.visualEffect = visualSelect.value();

                // アイテムのフィルタリングと初期化
                if (typeof ring.CanAcceptItem === 'function') {
                    ring.items = ring.items.filter(item => ring.CanAcceptItem(item));
                }

                switch (visualSelect.value()) {
                    case 'color':
                        // colorモード用初期化: 最初の5要素を確保
                        ring.items = ring.items.slice(0, 5);
                        const head = ring.items.length > 0 ? ring.items[0] : new Sigil(0, 0, "COMPLETE", ring);
                        let validItems = ring.items.slice(1).filter(item => {
                            return item instanceof Chars &&
                                item.value !== null &&
                                item.value.trim() !== "" &&
                                isFinite(item.value);
                        });

                        if (validItems.length > 4) validItems = validItems.slice(0, 4);

                        validItems.forEach(item => {
                            let val = parseFloat(item.value);
                            if (val < 0.0) val = 0.0;
                            if (val > 1.0) val = 1.0;
                            item.value = val.toString();
                        });

                        // デフォルト値 (R=0, G=0, B=0, A=1) で埋める
                        const defaults = ["0.0", "0.0", "0.0", "1.0"];
                        for (let i = validItems.length; i < 4; i++) {
                            validItems.push(new Chars(0, 0, defaults[i], ring));
                        }

                        ring.items = [head, ...validItems];
                        break;

                    case "gradient":
                        ring.items = ring.items.slice(0, 1); // Headのみ残す

                        // 初期キーフレーム作成 (Start: 白, End: 白)
                        const initKeys = [0.0, 1.0];
                        initKeys.forEach(t => {
                            const keyRing = new ArrayRing({ x: ring.pos.x + 100, y: ring.pos.y + 100 });
                            keyRing.visualEffect = "gradient-sub"
                            rings.push(keyRing);
                            // [Time, R, G, B, A]
                            keyRing.items.push(new Chars(0, 0, t.toFixed(1), keyRing));
                            keyRing.items.push(new Chars(0, 0, "1.0", keyRing));
                            keyRing.items.push(new Chars(0, 0, "1.0", keyRing));
                            keyRing.items.push(new Chars(0, 0, "1.0", keyRing));
                            keyRing.items.push(new Chars(0, 0, "1.0", keyRing));
                            keyRing.CalculateLayout();
                            ring.items.push(new Joint(0, 0, keyRing, ring));
                        });
                        break;

                    case "curve":
                        // curveモード (現状ロジックなし、必要なら追加)
                        ring.items = ring.items.slice(0, 1);
                        break;
                }

                // パネル再描画
                closePanel();
                ring.CalculateLayout();
                if (typeof alignConnectedRings === 'function') alignConnectedRings(ring);
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
                // 市松模様
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
                    createColorPickerPanel(ring);
                });
            }

            // --- Gradient Preview / Editor Button ---
            if (ring.visualEffect === 'gradient') {
                const gradContainer = createDiv('');
                gradContainer.parent(contentArea);
                gradContainer.style('margin-top', '8px');
                gradContainer.style('cursor', 'pointer');
                gradContainer.style('border', '1px solid #999');
                gradContainer.style('border-radius', '4px');
                gradContainer.style('height', '30px');
                gradContainer.style('position', 'relative');

                // 市松模様
                gradContainer.style('background-image', 'linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%), linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%)');
                gradContainer.style('background-size', '10px 10px');
                gradContainer.style('background-position', '0 0, 5px 5px');

                // グラディエントの簡易プレビュー生成
                const { alphaKeys, colorKeys } = parseGradientData(ring);

                let gradientCSS = 'linear-gradient(to right, #888, #888)';
                if (colorKeys.length > 0) {
                    const stops = [];
                    // 10ステップでサンプリングしてCSSグラディエントを作る
                    for (let i = 0; i <= 10; i++) {
                        const t = i / 10;

                        // カラー補間
                        let c = { r: 1, g: 1, b: 1 };
                        if (t <= colorKeys[0].t) c = colorKeys[0];
                        else if (t >= colorKeys[colorKeys.length - 1].t) c = colorKeys[colorKeys.length - 1];
                        else {
                            for (let k = 0; k < colorKeys.length - 1; k++) {
                                if (t >= colorKeys[k].t && t <= colorKeys[k + 1].t) {
                                    const r = (t - colorKeys[k].t) / (colorKeys[k + 1].t - colorKeys[k].t);
                                    c = {
                                        r: colorKeys[k].r + (colorKeys[k + 1].r - colorKeys[k].r) * r,
                                        g: colorKeys[k].g + (colorKeys[k + 1].g - colorKeys[k].g) * r,
                                        b: colorKeys[k].b + (colorKeys[k + 1].b - colorKeys[k].b) * r
                                    };
                                    break;
                                }
                            }
                        }

                        // アルファ補間
                        let a = 1;
                        if (alphaKeys.length > 0) {
                            if (t <= alphaKeys[0].t) a = alphaKeys[0].val;
                            else if (t >= alphaKeys[alphaKeys.length - 1].t) a = alphaKeys[alphaKeys.length - 1].val;
                            else {
                                for (let k = 0; k < alphaKeys.length - 1; k++) {
                                    if (t >= alphaKeys[k].t && t <= alphaKeys[k + 1].t) {
                                        const r = (t - alphaKeys[k].t) / (alphaKeys[k + 1].t - alphaKeys[k].t);
                                        a = alphaKeys[k].val + (alphaKeys[k + 1].val - alphaKeys[k].val) * r;
                                        break;
                                    }
                                }
                            }
                        }
                        stops.push(`rgba(${Math.floor(c.r * 255)},${Math.floor(c.g * 255)},${Math.floor(c.b * 255)},${a}) ${t * 100}%`);
                    }
                    gradientCSS = `linear-gradient(to right, ${stops.join(', ')})`;
                }

                const previewDiv = createDiv('');
                previewDiv.parent(gradContainer);
                previewDiv.style('width', '100%');
                previewDiv.style('height', '100%');
                previewDiv.style('background', gradientCSS);

                const label = createDiv('Edit Gradient');
                label.parent(gradContainer);
                label.style('position', 'absolute');
                label.style('top', '50%');
                label.style('left', '50%');
                label.style('transform', 'translate(-50%, -50%)');
                label.style('font-size', '10px');
                label.style('color', 'white');
                label.style('text-shadow', '0 0 2px black');
                label.style('pointer-events', 'none');

                gradContainer.elt.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    closePanel();
                    createGradientEditorPanel(ring);
                });
            }
        }

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