function createCommentPanel(ring) {
    const closePanel = () => {
        if (currentUiPanel) { currentUiPanel.remove(); currentUiPanel = null; }
        editingItem = null;
    };

    const panelResult = createBasePanel('Edit Comments', closePanel, null, null);
    if (!panelResult) return;
    const { contentArea } = panelResult;

    const getNumberInput = (message, defaultValue) => {
        let input = prompt(message, defaultValue);
        while (input !== null) {
            const num = parseFloat(input);
            if (!isNaN(num)) return num;
            alert("数値ではありません。正しい数値を入力してください。");
            input = prompt(message, defaultValue);
        }
        return null;
    };

    const container = createDiv('');
    container.parent(contentArea);
    container.addClass('comment-list-container');

    const headerRow = createDiv('');
    headerRow.parent(container);
    headerRow.addClass('comment-grid-header');

    createDiv('Text').parent(headerRow);
    createDiv('Ang1').parent(headerRow);
    createDiv('Ang2').parent(headerRow);
    createDiv('').parent(headerRow);

    const renderComments = () => {
        // ヘッダー以外の既存行をクリア
        const children = Array.from(container.elt.children);
        for (let i = 1; i < children.length; i++) container.elt.removeChild(children[i]);

        ring.comments.forEach((comment, index) => {
            const row = createDiv('');
            row.parent(container);
            row.addClass('comment-grid-row');

            const textDiv = createDiv(comment.text).parent(row).addClass('comment-cell').attribute('title', comment.text);
            const ang1Div = createDiv(comment.angle1).parent(row).addClass('comment-cell');
            const ang2Div = createDiv(comment.angle2).parent(row).addClass('comment-cell');

            const btnContainer = createDiv('').parent(row).addClass('ui-row').style('gap', '4px');

            const editBtn = createButton('編集').parent(btnContainer).addClass('ui-btn').style('padding', '2px 6px').style('font-size', '10px');
            editBtn.elt.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                const newText = prompt("テキストを入力してください:", comment.text);
                if (newText === null) return;
                const newAngle1 = getNumberInput("Angle1:", comment.angle1);
                if (newAngle1 === null) return;
                const newAngle2 = getNumberInput("Angle2:", comment.angle2);
                if (newAngle2 === null) return;
                comment.text = newText; comment.angle1 = newAngle1; comment.angle2 = newAngle2;
                closePanel(); setTimeout(() => createCommentPanel(ring), 10);
            });

            const delBtn = createButton('削除').parent(btnContainer).addClass('ui-btn').addClass('ui-btn-danger').style('padding', '2px 6px').style('font-size', '10px');
            delBtn.elt.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                if (confirm("このコメントを削除しますか？")) {
                    ring.comments.splice(index, 1);
                    closePanel(); setTimeout(() => createCommentPanel(ring), 10);
                }
            });
        });
    };

    renderComments();

    const addBtn = createButton('＋ コメントを追加');
    addBtn.parent(contentArea);
    addBtn.addClass('ui-btn');
    addBtn.addClass('ui-btn-block');

    addBtn.elt.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        const newText = prompt("新しいコメントのテキスト:", "New Comment");
        if (newText === null) return;
        const newAngle1 = getNumberInput("Angle1:", "0");
        if (newAngle1 === null) return;
        const newAngle2 = getNumberInput("Angle2:", "45");
        if (newAngle2 === null) return;
        ring.comments.push({ text: newText, angle1: newAngle1, angle2: newAngle2 });
        closePanel(); setTimeout(() => createCommentPanel(ring), 10);
    });
}

function createRingPanel(ring) {
    const closePanel = () => { if (currentUiPanel) { currentUiPanel.remove(); currentUiPanel = null; } editingItem = null; };
    const handleDelete = () => {
        const oldPos = { x: ring.pos.x, y: ring.pos.y };
        const wasStartPoint = ring.isStartPoint;
        const connectedJoints = [];
        rings.forEach(r => {
            r.items.forEach(item => { if (item && item.type === 'joint' && item.value === ring) connectedJoints.push(item); });
        });
        fieldItems.forEach(item => { if (item && item.type === 'joint' && item.value === ring) connectedJoints.push(item); });

        rings.forEach(r => {
            r.items.forEach(item => { if (item && item.type === 'joint' && item.value === ring) item.value = null; });
        });
        rings = rings.filter(r => r !== ring);
        if (ring === startRing) {
            startRing = rings.find(r => isRingStartable(r)) || (rings.length > 0 ? rings[0] : null);
            if (startRing) startRing.isStartPoint = true;
        }
        fieldItems.forEach(item => { if (item && item.type === 'joint' && item.value === ring) item.value = null; });

        redoStack = [];
        actionStack.push(new Action("ring_remove", {
            ring: ring,
            connectedJoints: connectedJoints,
            oldPos: oldPos,
            wasStartPoint: wasStartPoint
        }));

        closePanel();
    };
    const handleDuplicate = () => {
        const newRing = ring.clone();
        redoStack = [];
        actionStack.push(new Action("ring_add", {
            ring: newRing
        }));
        closePanel();
    };

    const panelResult = createBasePanel('Ring Settings', closePanel, handleDelete, handleDuplicate);
    if (!panelResult) return;
    const { contentArea } = panelResult;

    editingItem = ring;

    // --- Marker Input ---
    const markerContainer = createDiv('');
    markerContainer.parent(contentArea);
    markerContainer.addClass('ui-row');
    markerContainer.addClass('ui-divider');
    markerContainer.style('margin-top', '0'); border = 'none'; // リセット

    createDiv('Marker:').parent(markerContainer).addClass('ui-label');

    const markerDisplay = createP(ring.marker || '');
    markerDisplay.parent(markerContainer);
    markerDisplay.addClass('ui-input');
    markerDisplay.style('flex-grow', '1');
    markerDisplay.style('background', '#f9f9f9');
    markerDisplay.style('min-height', '1.5em');
    markerDisplay.style('white-space', 'nowrap'); markerDisplay.style('overflow', 'hidden'); markerDisplay.style('text-overflow', 'ellipsis');

    const editMarkerButton = createButton('編集').parent(markerContainer).addClass('ui-btn');
    editMarkerButton.elt.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        const newValue = prompt("マーカー名を入力してください:", ring.marker || "");
        if (newValue !== null) { ring.marker = newValue; markerDisplay.html(newValue); closePanel(); }
    });

    // --- Action Buttons ---
    const buttonContainer = createDiv('');
    buttonContainer.parent(contentArea);
    buttonContainer.addClass('ui-content');
    buttonContainer.style('margin-top', '5px');

    let parentRing = null;
    for (const r of rings) {
        if (r === ring) continue;
        if (r.items.some(item => item && item.type === 'joint' && item.value === ring)) { parentRing = r; break; }
    }

    if (parentRing) {
        const goToParentButton = createButton('親へ移動').parent(buttonContainer).addClass('ui-btn').addClass('ui-btn-block');
        goToParentButton.style('order', '-1');
        goToParentButton.elt.addEventListener('mousedown', (e) => { e.stopPropagation(); cameraPos.x = parentRing.pos.x; cameraPos.y = parentRing.pos.y; closePanel(); });
    }

    const alignButton = createButton('このリングから整列').parent(buttonContainer).addClass('ui-btn').addClass('ui-btn-block');
    alignButton.elt.addEventListener('mousedown', (e) => { e.stopPropagation(); alignConnectedRings(ring); closePanel(); });

    const straightenButton = createButton('このリングから直線化').parent(buttonContainer).addClass('ui-btn').addClass('ui-btn-block');
    straightenButton.elt.addEventListener('mousedown', (e) => { e.stopPropagation(); StraightenConnectedJoints(ring); closePanel(); });

    const jointButton = createButton('Create Joint').parent(buttonContainer).addClass('ui-btn').addClass('ui-btn-block');
    jointButton.elt.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        const newJoint = new Joint(ring.pos.x, ring.pos.y, ring, null);
        newJoint.pos.x += (ring.radius + 70) * Math.sin(ring.angle + PI / 20);
        newJoint.pos.y -= (ring.radius + 70) * Math.cos(ring.angle + PI / 20);
        fieldItems.push(newJoint);

        redoStack = [];
        actionStack.push(new Action("item_move", {
            item: newJoint,
            toRing: null,
            toIndex: -1,
            toPos: { x: newJoint.pos.x, y: newJoint.pos.y },
            isNewItem: true
        }));

        closePanel();
    });

    if (ring === startRing) {
        createP('This is the starting ring.').parent(contentArea).addClass('start-indicator');
    } else if (isRingStartable(ring)) {
        const setStartButton = createButton('Set as Start Point').parent(buttonContainer).addClass('ui-btn').addClass('ui-btn-block');
        setStartButton.elt.addEventListener('mousedown', (e) => {
            e.stopPropagation();

            redoStack = [];
            actionStack.push(new Action("change_start_point", {
                oldStartRing: startRing,
                newStartRing: ring
            }));

            if (startRing) startRing.isStartPoint = false;
            startRing = ring;
            ring.isStartPoint = true;

            closePanel();
        });
    }

    const commentButton = createButton('コメントを編集する').parent(buttonContainer).addClass('ui-btn').addClass('ui-btn-block');
    commentButton.elt.addEventListener('mousedown', (e) => { e.stopPropagation(); closePanel(); setTimeout(() => createCommentPanel(ring), 10); });

    // --- Type Specific UI ---
    if (ring instanceof TemplateRing) {
        createDiv('Magic Type:').parent(contentArea).addClass('ui-label').addClass('ui-divider');
        const magicSelect = createSelect().parent(contentArea).addClass('ui-select');
        ["fire", "bullet", "charge", "barrier"].forEach(opt => magicSelect.option(opt));
        magicSelect.selected(ring.magic);
        magicSelect.changed(() => { ring.magic = magicSelect.value(); closePanel(); });

        if (typeof templateDatas !== 'undefined' && templateDatas[ring.magic]) {
            const paramContainer = createDiv('').parent(contentArea).addClass('ui-divider');
            createDiv('Add Parameter:').parent(paramContainer).addClass('ui-label').style('margin-bottom', '4px');
            const paramSelect = createSelect().parent(paramContainer).addClass('ui-select');
            paramSelect.option('Select parameter...');
            Object.keys(templateDatas[ring.magic].parameters).forEach(key => paramSelect.option(key));

            paramSelect.changed(() => {
                const key = paramSelect.value();
                if (key === 'Select parameter...') return;
                const paramDef = templateDatas[ring.magic].parameters[key];
                if (paramDef) {
                    const newItem = new Name(0, 0, key, ring);
                    ring.items.push(newItem);
                    redoStack = [];
                    actionStack.push(new Action("item_move", {
                        item: newItem,
                        toRing: ring,
                        toIndex: ring.items.length - 1,
                        toPos: null,
                        isNewItem: true
                    }));

                    const type = paramDef.type;
                    const vals = String(paramDef.defaultValue).split(/\s+/);
                    if (type === 'vector3' || type === 'color') {
                        const newRingPos = { x: ring.pos.x + 150, y: ring.pos.y + 150 };
                        const newArrayRing = new ArrayRing(newRingPos);
                        if (type === 'color') newArrayRing.visualEffect = 'color';
                        rings.push(newArrayRing);

                        actionStack.push(new Action("ring_add", { ring: newArrayRing }));

                        vals.forEach(v => {
                            if (v) {
                                const arrItem = new Chars(0, 0, v, newArrayRing);
                                newArrayRing.items.push(arrItem);
                                // Note: 子リング内のアイテム追加も個別に記録するか、リング追加に含めるか。
                                // ここではリング追加アクションでリング丸ごと管理されると仮定するが、
                                // itemsへのpushなので厳密にはリングの中身が変わっている。
                                // 簡略化のため、リング追加時は初期アイテムも込みとする。
                            }
                        });
                        newArrayRing.CalculateLayout();

                        const newJoint = new Joint(0, 0, newArrayRing, ring);
                        ring.items.push(newJoint);
                        actionStack.push(new Action("item_move", {
                            item: newJoint,
                            toRing: ring,
                            toIndex: ring.items.length - 1,
                            toPos: null,
                            isNewItem: true
                        }));

                    } else {
                        vals.forEach(v => {
                            if (v) {
                                const valItem = new Chars(0, 0, v, ring);
                                ring.items.push(valItem);
                                actionStack.push(new Action("item_move", {
                                    item: valItem,
                                    toRing: ring,
                                    toIndex: ring.items.length - 1,
                                    toPos: null,
                                    isNewItem: true
                                }));
                            }
                        });
                    }
                    ring.CalculateLayout(); paramSelect.selected('Select parameter...');
                }
            });
        }
    } else if (true || ring.isNew) {
        if (ring instanceof ArrayRing) {
            createDiv('Visual Effect:').parent(contentArea).addClass('ui-label').addClass('ui-divider');
            const visualSelect = createSelect().parent(contentArea).addClass('ui-select');
            ['-', 'color', 'gradient', 'curve'].forEach(opt => visualSelect.option(opt));
            if (!ring.visualEffect) ring.visualEffect = '-';
            visualSelect.selected(ring.visualEffect);

            visualSelect.changed(() => {
                const oldVisualEffect = ring.visualEffect;
                const oldItems = [...ring.items];
                const oldRingsLength = rings.length;

                ring.visualEffect = visualSelect.value();
                if (typeof ring.CanAcceptItem === 'function') ring.items = ring.items.filter(item => ring.CanAcceptItem(item));
                switch (visualSelect.value()) {
                    case 'color':
                        ring.items = ring.items.slice(0, 5);
                        const head = ring.items.length > 0 ? ring.items[0] : new Sigil(0, 0, "COMPLETE", ring);
                        let validItems = ring.items.slice(1).filter(item => item instanceof Chars && item.value !== null && item.value.trim() !== "" && isFinite(item.value));
                        if (validItems.length > 4) validItems = validItems.slice(0, 4);
                        validItems.forEach(item => { let val = parseFloat(item.value); if (val < 0) val = 0; if (val > 1) val = 1; item.value = val.toString(); });
                        const defaults = ["0.0", "0.0", "0.0", "1.0"];
                        for (let i = validItems.length; i < 4; i++) validItems.push(new Chars(0, 0, defaults[i], ring));
                        ring.items = [head, ...validItems];
                        break;
                    case "gradient":
                        ring.items = ring.items.slice(0, 1);
                        [0.0, 1.0].forEach(t => {
                            const keyRing = new ArrayRing({ x: ring.pos.x + 100, y: ring.pos.y + 100 });
                            keyRing.visualEffect = "gradient-sub";
                            rings.push(keyRing);
                            keyRing.items.push(new Chars(0, 0, t.toFixed(1), keyRing));
                            for (let i = 0; i < 4; i++) keyRing.items.push(new Chars(0, 0, "1.0", keyRing));
                            keyRing.CalculateLayout();
                            ring.items.push(new Joint(0, 0, keyRing, ring));
                        });
                        break;
                    case "curve":
                        ring.items = ring.items.slice(0, 1);
                        [{ t: 0, v: 0 }, { t: 1, v: 1 }].forEach(p => {
                            const keyRing = new ArrayRing({ x: ring.pos.x + 100, y: ring.pos.y + 100 });
                            rings.push(keyRing);
                            keyRing.visualEffect = "curve-sub";
                            keyRing.items.push(new Chars(0, 0, p.t.toFixed(1), keyRing));
                            keyRing.items.push(new Chars(0, 0, p.v.toFixed(1), keyRing));
                            keyRing.CalculateLayout();
                            ring.items.push(new Joint(0, 0, keyRing, ring));
                        });
                        break;
                }

                const newRings = rings.slice(oldRingsLength);

                redoStack = [];
                actionStack.push(new Action("ring_change_visual_effect", {
                    ring: ring,
                    oldVisualEffect: oldVisualEffect,
                    newVisualEffect: ring.visualEffect,
                    oldItems: oldItems,
                    newItems: [...ring.items],
                    createdRings: newRings
                }));

                closePanel();
                ring.CalculateLayout();
                if (typeof alignConnectedRings === 'function') alignConnectedRings(ring, false);
                setTimeout(() => createRingPanel(ring), 10);
            });

            if (ring.visualEffect === 'color') {
                const colorContainer = createDiv('').parent(contentArea).addClass('preview-box');
                let r = 0, g = 0, b = 0, a = 1;
                if (ring.items.length >= 5) { r = parseFloat(ring.items[1].value) * 255; g = parseFloat(ring.items[2].value) * 255; b = parseFloat(ring.items[3].value) * 255; a = parseFloat(ring.items[4].value); }
                const colorPreview = createDiv('').parent(colorContainer).style('width', '100%').style('height', '100%').style('background-color', `rgba(${r}, ${g}, ${b}, ${a})`).style('display', 'flex').style('align-items', 'center').style('justify-content', 'center');
                createDiv('Edit Color').parent(colorPreview).addClass('preview-label').style('color', a > 0.5 ? (r + g + b > 380 ? 'black' : 'white') : 'black');
                colorContainer.elt.addEventListener('mousedown', (e) => { e.stopPropagation(); closePanel(); createColorPickerPanel(ring); });
            }

            if (ring.visualEffect === 'gradient') {
                const gradContainer = createDiv('').parent(contentArea).addClass('preview-box');
                const { alphaKeys, colorKeys } = parseGradientData(ring);
                let gradientCSS = 'linear-gradient(to right, #888, #888)';
                if (colorKeys.length > 0) {
                    gradientCSS = `linear-gradient(to right, white, black)`;
                }
                createDiv('').parent(gradContainer).style('width', '100%').style('height', '100%').style('background', gradientCSS);
                createDiv('Edit Gradient').parent(gradContainer).addClass('preview-label').style('position', 'absolute').style('top', '50%').style('left', '50%').style('transform', 'translate(-50%, -50%)');
                gradContainer.elt.addEventListener('mousedown', (e) => { e.stopPropagation(); closePanel(); createGradientEditorPanel(ring); });
            }

            if (ring.visualEffect === 'curve') {
                const rangeContainer = createDiv('').parent(contentArea).addClass('ui-row').style('gap', '5px').style('margin-bottom', '5px');

                const createNumInput = (label, val, setter) => {
                    const wrap = createDiv('').parent(rangeContainer).style('display', 'flex').style('align-items', 'center').style('flex', '1');
                    createDiv(label).parent(wrap).style('font-size', '10px').style('margin-right', '3px');
                    const inp = createInput(String(val), 'number').parent(wrap).style('width', '100%').style('min-width', '40px');
                    inp.changed(() => {
                        const oldVal = val;
                        const newVal = parseFloat(inp.value());
                        setter(newVal);

                        redoStack = [];
                        actionStack.push(new Action("ring_change_property", {
                            ring: ring,
                            propertyName: label === 'Min:' ? 'minValue' : 'maxValue',
                            oldValue: oldVal,
                            newValue: newVal
                        }));
                    });
                };

                createNumInput('Min:', ring.minValue, (v) => ring.minValue = v);
                createNumInput('Max:', ring.maxValue, (v) => ring.maxValue = v);

                const curveContainer = createDiv('').parent(contentArea).addClass('preview-box');

                // SVG Preview
                const svgNS = "http://www.w3.org/2000/svg";
                const svg = document.createElementNS(svgNS, "svg");
                svg.setAttribute("width", "100%");
                svg.setAttribute("height", "100%");
                svg.style.backgroundColor = "#222";

                const polyline = document.createElementNS(svgNS, "polyline");
                polyline.setAttribute("fill", "none");
                polyline.setAttribute("stroke", "#0f0");
                polyline.setAttribute("stroke-width", "2");

                const points = [];
                ring.items.forEach(item => {
                    if (item && item.type === 'joint' && item.value instanceof ArrayRing) {
                        const childRing = item.value;
                        if (childRing.items.length >= 3) {
                            const getVal = (idx) => (childRing.items[idx] && childRing.items[idx].value)
                                ? parseFloat(childRing.items[idx].value)
                                : 0;
                            points.push({ t: getVal(1), val: getVal(2) });
                        }
                    }
                });
                points.sort((a, b) => a.t - b.t);

                // Using viewBox
                svg.setAttribute("viewBox", "0 0 100 100");
                svg.setAttribute("preserveAspectRatio", "none");

                let pointsStr = "";
                points.forEach(p => {
                    pointsStr += `${p.t * 100},${(1 - p.val) * 100} `;
                });
                polyline.setAttribute("points", pointsStr);

                svg.appendChild(polyline);
                curveContainer.elt.appendChild(svg);

                createDiv('Edit Curve').parent(curveContainer).addClass('preview-label').style('position', 'absolute').style('top', '50%').style('left', '50%').style('transform', 'translate(-50%, -50%)');

                curveContainer.elt.addEventListener('mousedown', (e) => { e.stopPropagation(); closePanel(); createCurveEditorPanel(ring); });
            }
        }

        createDiv('Ring Type:').parent(contentArea).addClass('ui-label').addClass('ui-divider');
        const typeSelect = createSelect().parent(contentArea).addClass('ui-select');
        ['MagicRing', 'ArrayRing', 'DictRing', 'TemplateRing'].forEach(opt => typeSelect.option(opt));
        typeSelect.selected(ring.constructor.name);
        typeSelect.changed(() => {
            const newType = typeSelect.value();
            const ringIndex = rings.indexOf(ring);
            if (ringIndex !== -1 && ring.constructor.name !== newType) {
                let newRing;
                if (newType === 'MagicRing') newRing = new MagicRing(ring.pos);
                else if (newType === 'ArrayRing') newRing = new ArrayRing(ring.pos);
                else if (newType === 'DictRing') newRing = new DictRing(ring.pos);
                else if (newType === 'TemplateRing') newRing = new TemplateRing(ring.pos);
                else newRing = new MagicRing(ring.pos);

                newRing.items = newRing.items.concat(ring.items.slice(1));
                // itemのparentRingを更新
                newRing.items.forEach(item => { if (item) item.parentRing = newRing; });

                newRing.CalculateLayout(); newRing.isNew = false; newRing.angle = ring.angle; newRing.isStartPoint = ring.isStartPoint; newRing.marker = ring.marker;

                // Undo/Redo アクション記録
                redoStack = [];
                actionStack.push(new Action("ring_change_type", {
                    oldRing: ring,
                    newRing: newRing
                }));

                // Swapを実行
                rings[ringIndex] = newRing;
                rings.forEach(r => { r.items.forEach(item => { if (item && item.type === 'joint' && item.value === ring) item.value = newRing; }); });
                fieldItems.forEach(item => { if (item && item.type === 'joint' && item.value === ring) item.value = newRing; });
                if (startRing === ring) startRing = newRing;
            }
            closePanel();
        });
    }
}