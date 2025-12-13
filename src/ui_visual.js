/**
 * ArrayRingの色編集用パネルを作成します。
 */
function createColorPickerPanel(ring) {
    const closePanel = () => {
        if (currentUiPanel) { currentUiPanel.remove(); currentUiPanel = null; }
        editingItem = null;
        if (ring) {
            if (typeof ring.CalculateLayout === 'function') ring.CalculateLayout();
            if (typeof ring.onColorPickerClose === 'function') ring.onColorPickerClose();
        }
    };

    const panelResult = createBasePanel('Color Picker', closePanel);
    if (!panelResult) return;
    const { contentArea } = panelResult;

    // ダークテーマを適用
    currentUiPanel.addClass('dark-theme');
    currentUiPanel.style('width', '240px'); // サイズは固定

    // --- 初期値の取得 ---
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

    // ===========================================================================
    // Visual Picker Area (Ring + Square)
    // ===========================================================================
    const pickerContainer = createDiv('');
    pickerContainer.parent(contentArea);
    pickerContainer.addClass('cp-container');

    // --- 1. Hue Ring ---
    const hueRing = createDiv('');
    hueRing.parent(pickerContainer);
    hueRing.addClass('cp-ring');

    const hueKnob = createDiv('');
    hueKnob.parent(hueRing);
    hueKnob.addClass('cp-knob');

    // --- 2. Mask ---
    const mask = createDiv('');
    mask.parent(pickerContainer);
    mask.addClass('cp-mask');

    // --- 3. SV Square ---
    const svSquare = createDiv('');
    svSquare.parent(pickerContainer);
    svSquare.addClass('cp-sv-square');

    // グラデーションレイヤー
    createDiv('').parent(svSquare).addClass('cp-sv-grad-white');
    createDiv('').parent(svSquare).addClass('cp-sv-grad-black');

    const svKnob = createDiv('');
    svKnob.parent(svSquare);
    svKnob.addClass('cp-knob');
    svKnob.style('border-color', 'black'); // SVノブは黒枠
    svKnob.style('outline', '1px solid white');

    // ===========================================================================
    // UI Update Logic
    // ===========================================================================
    const formatFloat = (val) => {
        let s = parseFloat(val.toFixed(3)).toString();
        if (s.indexOf('.') === -1) s += '.0';
        return s;
    };

    const applyToRing = () => {
        ring.items[1].value = formatFloat(rgba.r);
        ring.items[2].value = formatFloat(rgba.g);
        ring.items[3].value = formatFloat(rgba.b);
        ring.items[4].value = formatFloat(rgba.a);
        if (ring && typeof ring.CalculateLayout === 'function') ring.CalculateLayout();
    };

    const updateUI = (updateInputs = true) => {
        // Hueノブ位置
        const angle = h * Math.PI * 2;
        const knobX = 100 + 90 * Math.sin(angle);
        const knobY = 100 - 90 * Math.cos(angle);
        hueKnob.style('left', `${knobX}px`);
        hueKnob.style('top', `${knobY}px`);

        // SV矩形背景色
        const pureColor = hsvToRgb(h, 1, 1);
        svSquare.style('background-color', `rgb(${pureColor[0] * 255},${pureColor[1] * 255},${pureColor[2] * 255})`);

        // SVノブ位置
        svKnob.style('left', `${s * 100}%`);
        svKnob.style('top', `${(1 - v) * 100}%`);

        if (updateInputs) updateSliders();
    };

    // --- マウスドラッグ処理 ---
    const handleHueDrag = (e) => {
        const rect = hueRing.elt.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        let angle = Math.atan2(dy, dx) + Math.PI / 2;
        if (angle < 0) angle += Math.PI * 2;
        h = angle / (Math.PI * 2);
        const rgb = hsvToRgb(h, s, v);
        rgba.r = rgb[0]; rgba.g = rgb[1]; rgba.b = rgb[2];
        applyToRing();
        updateUI();
    };

    const handleSVDrag = (e) => {
        const rect = svSquare.elt.getBoundingClientRect();
        let x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        let y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
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

    // ===========================================================================
    // Sliders & Hex Area
    // ===========================================================================
    const controlsContainer = createDiv('');
    controlsContainer.parent(contentArea);
    controlsContainer.addClass('slider-container');

    const sliders = {};
    const inputs = {};

    const createSliderRow = (label, colorKey) => {
        const row = createDiv('');
        row.parent(controlsContainer);
        row.addClass('slider-row');

        createDiv(label).parent(row).addClass('slider-label');

        const sliderContainer = createDiv('');
        sliderContainer.parent(row);
        sliderContainer.addClass('slider-track-container');

        const bg = createDiv('').parent(sliderContainer).addClass('slider-bg');
        const slider = createInput('', 'range').parent(sliderContainer).addClass('slider-input-range');
        slider.attribute('min', '0').attribute('max', '255').attribute('step', '1');

        const handle = createDiv('').parent(sliderContainer).addClass('slider-handle-visual');

        const numLabel = createDiv('0').parent(row).addClass('slider-value-display');

        sliders[colorKey] = { slider, bg, handle };
        inputs[colorKey] = numLabel;

        slider.input(() => {
            const val = parseFloat(slider.value()) / 255;
            rgba[colorKey] = val;
            if (colorKey !== 'a') [h, s, v] = rgbToHsv(rgba.r, rgba.g, rgba.b);
            applyToRing();
            updateUI(false);
            updateSliderVisuals();
            numLabel.html(Math.floor(val * 255));
            updateHex();
        });
    };

    createSliderRow('R', 'r');
    createSliderRow('G', 'g');
    createSliderRow('B', 'b');
    createSliderRow('A', 'a');

    // --- Hex Input Area ---
    const hexRow = createDiv('');
    hexRow.parent(controlsContainer);
    hexRow.addClass('slider-row');
    hexRow.style('justify-content', 'space-between');
    hexRow.style('margin-top', '4px');

    createDiv('Hexadecimal').parent(hexRow).addClass('slider-label').style('width', 'auto');

    const hexInput = createDiv('FFFFFF');
    hexInput.parent(hexRow);
    hexInput.addClass('hex-input');

    hexInput.elt.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        const currentHex = rgbToHex(rgba.r, rgba.g, rgba.b);
        const inputVal = prompt("Enter Hex Color (e.g., FFFFFF or #FFFFFF):", currentHex);
        if (inputVal !== null) {
            const rgb = hexToRgb(inputVal);
            if (rgb) {
                rgba.r = rgb.r; rgba.g = rgb.g; rgba.b = rgb.b;
                [h, s, v] = rgbToHsv(rgba.r, rgba.g, rgba.b);
                applyToRing();
                updateUI();
            }
        }
    });

    const updateSliderVisuals = () => {
        const r = Math.floor(rgba.r * 255), g = Math.floor(rgba.g * 255), b = Math.floor(rgba.b * 255);
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
        sliders.r.slider.value(rgba.r * 255); inputs.r.html(Math.floor(rgba.r * 255));
        sliders.g.slider.value(rgba.g * 255); inputs.g.html(Math.floor(rgba.g * 255));
        sliders.b.slider.value(rgba.b * 255); inputs.b.html(Math.floor(rgba.b * 255));
        sliders.a.slider.value(rgba.a * 255); inputs.a.html(Math.floor(rgba.a * 255));
        updateSliderVisuals();
        updateHex();
    };

    const updateHex = () => hexInput.html(rgbToHex(rgba.r, rgba.g, rgba.b));
    updateUI();
}

/**
 * グラディエントエディタパネルを作成します。
 */
function createGradientEditorPanel(ring, selectionState = null) {
    const closePanel = () => {
        if (currentUiPanel) { currentUiPanel.remove(); currentUiPanel = null; }
        window.removeEventListener('mousemove', onDrag);
        window.removeEventListener('mouseup', onStopDrag);
    };

    const panelResult = createBasePanel('Gradient Editor', closePanel);
    if (!panelResult) return;
    const { contentArea } = panelResult;

    // ダークテーマ適用
    currentUiPanel.addClass('dark-theme');
    currentUiPanel.style('width', '360px');

    // State Initialization
    let { alphaKeys, colorKeys } = parseGradientData(ring);
    if (alphaKeys.length === 0) alphaKeys = [{ t: 0, val: 1, id: 'a_start' }, { t: 1, val: 1, id: 'a_end' }];
    if (colorKeys.length === 0) colorKeys = [{ t: 0, r: 1, g: 1, b: 1, id: 'c_start' }, { t: 1, r: 1, g: 1, b: 1, id: 'c_end' }];

    let selectedKey = null, selectedType = null;
    if (selectionState) {
        const keys = selectionState.type === 'alpha' ? alphaKeys : colorKeys;
        if (selectionState.index >= 0 && selectionState.index < keys.length) {
            selectedKey = keys[selectionState.index]; selectedType = selectionState.type;
        }
    }

    // Logic Functions
    const lerpAlpha = (t) => {
        if (alphaKeys.length === 0) return 1;
        if (t <= alphaKeys[0].t) return alphaKeys[0].val;
        if (t >= alphaKeys[alphaKeys.length - 1].t) return alphaKeys[alphaKeys.length - 1].val;
        for (let i = 0; i < alphaKeys.length - 1; i++) {
            if (t >= alphaKeys[i].t && t <= alphaKeys[i + 1].t) {
                const range = alphaKeys[i + 1].t - alphaKeys[i].t;
                return alphaKeys[i].val + (alphaKeys[i + 1].val - alphaKeys[i].val) * (range === 0 ? 0 : (t - alphaKeys[i].t) / range);
            }
        }
        return 1;
    };

    const lerpColor = (t) => {
        if (colorKeys.length === 0) return { r: 1, g: 1, b: 1 };
        if (t <= colorKeys[0].t) return colorKeys[0];
        if (t >= colorKeys[colorKeys.length - 1].t) return colorKeys[colorKeys.length - 1];
        for (let i = 0; i < colorKeys.length - 1; i++) {
            if (t >= colorKeys[i].t && t <= colorKeys[i + 1].t) {
                const range = colorKeys[i + 1].t - colorKeys[i].t;
                const ratio = range === 0 ? 0 : (t - colorKeys[i].t) / range;
                return {
                    r: colorKeys[i].r + (colorKeys[i + 1].r - colorKeys[i].r) * ratio,
                    g: colorKeys[i].g + (colorKeys[i + 1].g - colorKeys[i].g) * ratio,
                    b: colorKeys[i].b + (colorKeys[i + 1].b - colorKeys[i].b) * ratio
                };
            }
        }
        return { r: 1, g: 1, b: 1 };
    };

    const updatePreview = () => {
        const stops = [];
        for (let i = 0; i <= 20; i++) {
            const t = i / 20;
            const a = lerpAlpha(t);
            const c = lerpColor(t);
            stops.push(`rgba(${c.r * 255},${c.g * 255},${c.b * 255},${a}) ${t * 100}%`);
        }
        gradientPreview.style('background', `linear-gradient(to right, ${stops.join(', ')})`);
    };

    const saveData = () => applyGradientToRing(ring, alphaKeys, colorKeys);

    // UI Layout
    const topContainer = createDiv('');
    topContainer.parent(contentArea);
    topContainer.style('padding', '10px 10px 0 10px');

    const editorContainer = createDiv('');
    editorContainer.parent(topContainer);
    editorContainer.addClass('ge-editor-container');

    const gradientBar = createDiv('');
    gradientBar.parent(editorContainer);
    gradientBar.addClass('ge-bar');

    const gradientPreview = createDiv('');
    gradientPreview.parent(gradientBar);
    gradientPreview.addClass('ge-preview-layer');

    const controlsDiv = createDiv('');
    controlsDiv.parent(contentArea);
    controlsDiv.addClass('ge-controls');

    const renderMarkers = () => {
        editorContainer.elt.querySelectorAll('.ge-marker').forEach(e => e.remove());
        const createMarker = (key, type) => {
            const m = createDiv('');
            m.addClass('ge-marker');
            m.parent(editorContainer);
            m.style('left', '10px');
            m.style('margin-left', `calc(${key.t} * (100% - 20px) - 6px)`);

            const isSelected = (selectedKey === key);
            const borderCol = isSelected ? 'orange' : '#fff';

            const shape = createDiv('');
            shape.parent(m);
            shape.addClass('ge-marker-shape');

            if (type === 'alpha') {
                m.style('top', '10px');
                shape.style('background', `rgb(${Math.floor(key.val * 255)}, ${Math.floor(key.val * 255)}, ${Math.floor(key.val * 255)})`);
                shape.style('border', `2px solid ${borderCol}`);
                shape.style('border-radius', '2px 2px 50% 50%');
            } else {
                m.style('top', `${25 + 30 + 5}px`); // 25 + barHeight + 5
                shape.style('background', `rgb(${key.r * 255},${key.g * 255},${key.b * 255})`);
                shape.style('border', `2px solid ${borderCol}`);
                shape.style('border-radius', '50% 50% 2px 2px');
            }

            m.elt.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                selectedKey = key; selectedType = type;
                renderMarkers(); updateControls();
                const startX = e.clientX;
                const trackWidth = editorContainer.elt.offsetWidth - 20;
                const startT = key.t;

                const dragMove = (ev) => {
                    const dx = ev.clientX - startX;
                    key.t = Math.max(0, Math.min(1, startT + dx / trackWidth));
                    if (type === 'alpha') alphaKeys.sort((a, b) => a.t - b.t);
                    else colorKeys.sort((a, b) => a.t - b.t);
                    renderMarkers(); updatePreview(); updateControls();
                };
                const dragUp = () => {
                    window.removeEventListener('mousemove', dragMove);
                    window.removeEventListener('mouseup', dragUp);
                    saveData();
                };
                window.addEventListener('mousemove', dragMove);
                window.addEventListener('mouseup', dragUp);
            });
        };
        alphaKeys.forEach(k => createMarker(k, 'alpha'));
        colorKeys.forEach(k => createMarker(k, 'color'));
    };

    gradientBar.elt.addEventListener('mousedown', (e) => {
        e.stopPropagation(); e.preventDefault();
        const rect = gradientBar.elt.getBoundingClientRect();
        const t = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = e.clientY - rect.top;

        if (y < rect.height / 2) {
            const newKey = { t, val: lerpAlpha(t), id: Date.now() };
            alphaKeys.push(newKey); alphaKeys.sort((a, b) => a.t - b.t);
            selectedKey = newKey; selectedType = 'alpha';
        } else {
            const newCol = lerpColor(t);
            const newKey = { t, ...newCol, id: Date.now() };
            colorKeys.push(newKey); colorKeys.sort((a, b) => a.t - b.t);
            selectedKey = newKey; selectedType = 'color';
        }
        renderMarkers(); updatePreview(); updateControls(); saveData();
    });

    const updateControls = () => {
        controlsDiv.html('');
        if (!selectedKey) {
            createDiv('Click bar to add key.<br>Click marker to edit.').parent(controlsDiv).style('color', '#888').style('font-size', '12px');
            return;
        }
        const locGroup = createDiv('').parent(controlsDiv).addClass('ui-row');
        createDiv('Loc:').parent(locGroup).addClass('ui-label');
        const locInput = createInput((selectedKey.t * 100).toFixed(1)).parent(locGroup).addClass('ui-input-dark').style('width', '35px').style('text-align', 'right');
        createDiv('%').parent(locGroup).addClass('ui-label');

        locInput.elt.onchange = () => {
            let val = parseFloat(locInput.value());
            if (isNaN(val)) return;
            selectedKey.t = Math.max(0, Math.min(100, val)) / 100;
            if (selectedType === 'alpha') alphaKeys.sort((a, b) => a.t - b.t); else colorKeys.sort((a, b) => a.t - b.t);
            renderMarkers(); updatePreview(); saveData();
        };

        if (selectedType === 'alpha') {
            const valGroup = createDiv('').parent(controlsDiv).addClass('ui-row');
            createDiv('Alpha:').parent(valGroup).addClass('ui-label');
            const alphaSlider = createInput(Math.floor(selectedKey.val * 255), 'range').parent(valGroup).attribute('min', 0).attribute('max', 255).style('width', '60px');
            const alphaNum = createInput(Math.floor(selectedKey.val * 255)).parent(valGroup).addClass('ui-input-dark').style('width', '30px').style('text-align', 'right');

            const onAlphaChange = (v) => {
                selectedKey.val = v / 255; renderMarkers(); updatePreview(); saveData();
            };
            alphaSlider.input(() => { alphaNum.value(alphaSlider.value()); onAlphaChange(alphaSlider.value()); });
            alphaNum.input(() => { let v = Math.max(0, Math.min(255, parseInt(alphaNum.value()) || 0)); alphaSlider.value(v); onAlphaChange(v); });

        } else {
            const colGroup = createDiv('').parent(controlsDiv).addClass('ui-row');
            createDiv('Color:').parent(colGroup).addClass('ui-label');
            const colorBox = createDiv('').parent(colGroup)
                .style('width', '30px').style('height', '20px')
                .style('background', `rgb(${selectedKey.r * 255}, ${selectedKey.g * 255}, ${selectedKey.b * 255})`)
                .style('border', '1px solid white').style('cursor', 'pointer');

            colorBox.elt.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                const idx = colorKeys.indexOf(selectedKey);
                const mockRing = {
                    items: [null, { value: selectedKey.r }, { value: selectedKey.g }, { value: selectedKey.b }, { value: 1.0 }],
                    CalculateLayout: () => {
                        selectedKey.r = parseFloat(mockRing.items[1].value);
                        selectedKey.g = parseFloat(mockRing.items[2].value);
                        selectedKey.b = parseFloat(mockRing.items[3].value);
                        saveData();
                    },
                    onColorPickerClose: () => createGradientEditorPanel(ring, { type: 'color', index: idx })
                };
                closePanel(); createColorPickerPanel(mockRing);
            });
        }

        const delBtn = createButton('Del').parent(controlsDiv).addClass('ui-btn').addClass('ui-btn-danger').style('margin-left', 'auto').style('padding', '2px 6px');
        delBtn.elt.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            if ((selectedType === 'alpha' && alphaKeys.length > 1) || (selectedType === 'color' && colorKeys.length > 1)) {
                if (selectedType === 'alpha') alphaKeys = alphaKeys.filter(k => k !== selectedKey);
                else colorKeys = colorKeys.filter(k => k !== selectedKey);
                selectedKey = null; renderMarkers(); updatePreview(); updateControls(); saveData();
            } else {
                alert("Cannot delete the last key.");
            }
        });
    };

    updatePreview(); renderMarkers(); updateControls();
    let onDrag, onStopDrag;
}

/**
 * カーブエディタパネルを作成します。
 */
function createCurveEditorPanel(ring) {
    const closePanel = () => {
        if (currentUiPanel) { currentUiPanel.remove(); currentUiPanel = null; }
    };

    const panelResult = createBasePanel('Curve Editor', closePanel);
    if (!panelResult) return;
    const { contentArea } = panelResult;

    // ダークテーマ適用
    currentUiPanel.addClass('dark-theme');
    currentUiPanel.style('width', '360px');

    // State Initialization
    let { points, maxValue, minValue } = parseCurveData(ring);
    if (points.length === 0) {
        points = [{ t: 0, val: minValue, id: 'start' }, { t: 1, val: maxValue, id: 'end' }];
    }

    let selectedPoint = null;

    const saveData = () => applyCurveToRing(ring, points, maxValue, minValue);

    // UI Layout
    // Min/Max Value Input Area
    const headerControls = createDiv('');
    headerControls.parent(contentArea);
    headerControls.addClass('ui-row');
    headerControls.style('justify-content', 'flex-end');
    headerControls.style('padding-bottom', '5px');

    // Min Value Input
    createDiv('Min:').parent(headerControls).addClass('ui-label');
    const minValInput = createDiv(minValue.toString());
    minValInput.parent(headerControls);
    minValInput.addClass('hex-input');
    minValInput.style('width', '40px');
    minValInput.style('margin-right', '10px');

    minValInput.elt.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        const inputVal = prompt("Enter Min Value:", minValue);
        if (inputVal !== null) {
            const val = parseFloat(inputVal);
            if (!isNaN(val)) {
                minValue = val;
                minValInput.html(minValue);
                render();
                updateControls();
                saveData();
            }
        }
    });

    // Max Value Input
    createDiv('Max:').parent(headerControls).addClass('ui-label');
    const maxValInput = createDiv(maxValue.toString());
    maxValInput.parent(headerControls);
    maxValInput.addClass('hex-input'); // Reuse hex-input style
    maxValInput.style('width', '40px');

    maxValInput.elt.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        const inputVal = prompt("Enter Max Value:", maxValue);
        if (inputVal !== null) {
            const val = parseFloat(inputVal);
            if (!isNaN(val) && val > minValue) {
                maxValue = val;
                maxValInput.html(maxValue); // Update display
                render();
                updateControls();
                saveData();
            }
        }
    });

    const editorContainer = createDiv('');
    editorContainer.parent(contentArea);
    editorContainer.addClass('ce-editor-container');

    // グリッド線とラベルを更新する関数
    const updateGrid = () => {
        // 既存のグリッド要素を削除
        editorContainer.elt.querySelectorAll('.ce-grid-line-h').forEach(e => e.remove());
        editorContainer.elt.querySelectorAll('.ce-grid-line-v').forEach(e => e.remove());
        editorContainer.elt.querySelectorAll('.ce-grid-label').forEach(e => e.remove());
        editorContainer.elt.querySelectorAll('.ce-grid-line-h-zero').forEach(e => e.remove());

        // 縦線（時間軸）
        for (let i = 1; i < 4; i++) {
            createDiv('').parent(editorContainer).addClass('ce-grid-line-v').style('left', `${i * 25}%`);
        }

        // 横線と目盛り（値軸）
        const steps = 4;
        for (let i = 0; i <= steps; i++) {
            const ratio = i / steps;
            const val = minValue + (maxValue - minValue) * ratio;
            const yPos = (1 - ratio) * 100; // topからの%

            // 線 (端以外)
            if (i > 0 && i < steps) {
                // 通常のグリッド線
                if (Math.abs(val) > 0.001) {
                    const line = createDiv('');
                    line.parent(editorContainer);
                    line.addClass('ce-grid-line-h');
                    line.style('top', `${yPos}%`);
                }
            }

            // ラベル (左寄せ)
            const label = createDiv(val.toFixed(2));
            label.parent(editorContainer);
            label.addClass('ce-grid-label');
            label.style('position', 'absolute');
            label.style('left', '2px'); // 左寄せ
            label.style('top', `${yPos}%`);
            label.style('transform', 'translateY(-50%)');
            label.style('font-size', '10px');
            label.style('color', '#888');
            label.style('pointer-events', 'none');
            label.style('text-shadow', '1px 1px 0 #000');
        }

        // Y=0 の線 (範囲内にある場合)
        if (minValue <= 0 && maxValue >= 0) {
            const zeroRatio = (0 - minValue) / (maxValue - minValue);
            const zeroYPos = (1 - zeroRatio) * 100;

            const zeroLine = createDiv('');
            zeroLine.parent(editorContainer);
            zeroLine.addClass('ce-grid-line-h-zero');
            // スタイルを直接適用 (またはCSSに追加)
            zeroLine.style('position', 'absolute');
            zeroLine.style('left', '0');
            zeroLine.style('right', '0');
            zeroLine.style('height', '2px');
            zeroLine.style('background-color', 'rgba(255, 255, 255, 0.5)'); // 太めの白線
            zeroLine.style('top', `${zeroYPos}%`);
            zeroLine.style('pointer-events', 'none');
        }
    };

    // SVG Layer for lines
    const svgNS = "http://www.w3.org/2000/svg";
    const svgLayer = document.createElementNS(svgNS, "svg");
    svgLayer.setAttribute("class", "ce-svg-layer");
    editorContainer.elt.appendChild(svgLayer);

    const polyline = document.createElementNS(svgNS, "path"); // pathに変更
    polyline.setAttribute("fill", "none");
    polyline.setAttribute("stroke", "#00ff00");
    polyline.setAttribute("stroke-width", "2");
    svgLayer.appendChild(polyline);

    const controlsDiv = createDiv('');
    controlsDiv.parent(contentArea);
    controlsDiv.addClass('ge-controls'); // Reuse styles

    const render = () => {
        updateGrid();

        // Render Points
        editorContainer.elt.querySelectorAll('.ce-point').forEach(e => e.remove());

        // Sort points by t
        points.sort((a, b) => a.t - b.t);

        const width = editorContainer.elt.offsetWidth;
        const height = editorContainer.elt.offsetHeight;

        // Catmull-Rom スプラインを使用してパスを生成
        const pathD = getSplinePath(points, width, height, maxValue, minValue);
        polyline.setAttribute("d", pathD);

        const range = maxValue - minValue;

        points.forEach(p => {
            const x = p.t * width;
            const normalizedVal = (p.val - minValue) / range;
            const y = (1 - normalizedVal) * height;

            const dot = createDiv('');
            dot.parent(editorContainer);
            dot.addClass('ce-point');
            dot.style('left', `${x}px`);
            dot.style('top', `${y}px`);

            if (p === selectedPoint) dot.addClass('selected');

            dot.elt.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                selectedPoint = p;
                render();
                updateControls();

                const startX = e.clientX;
                const startY = e.clientY;
                const startT = p.t;
                const startVal = p.val;

                const dragMove = (ev) => {
                    const dx = ev.clientX - startX;
                    const dy = ev.clientY - startY;

                    p.t = Math.max(0, Math.min(1, startT + dx / width));

                    // 値の更新ロジック修正
                    const valChange = -(dy / height) * range;
                    p.val = Math.max(minValue, Math.min(maxValue, startVal + valChange));

                    render();
                    updateControls();
                };

                const dragUp = () => {
                    window.removeEventListener('mousemove', dragMove);
                    window.removeEventListener('mouseup', dragUp);
                    saveData();
                };
                window.addEventListener('mousemove', dragMove);
                window.addEventListener('mouseup', dragUp);
            });
        });
    };

    editorContainer.elt.addEventListener('dblclick', (e) => {
        // Add point
        const rect = editorContainer.elt.getBoundingClientRect();
        const t = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

        // Y coordinate to Value
        const yRatio = 1 - (e.clientY - rect.top) / rect.height; // 0 (bottom) to 1 (top)
        const range = maxValue - minValue;
        const val = Math.max(minValue, Math.min(maxValue, minValue + yRatio * range));

        const newPoint = { t, val, id: Date.now() };
        points.push(newPoint);
        selectedPoint = newPoint;
        render();
        updateControls();
        saveData();
    });

    const updateControls = () => {
        controlsDiv.html('');
        if (!selectedPoint) {
            createDiv('Double click or use Add btn to key.<br>Drag point to move.').parent(controlsDiv).style('color', '#888').style('font-size', '12px');
        }

        const inputGroup = createDiv('').parent(controlsDiv).addClass('ui-row');
        if (selectedPoint) {
            createDiv('T:').parent(inputGroup).addClass('ui-label');
            const tInput = createInput((selectedPoint.t).toFixed(3)).parent(inputGroup).addClass('ui-input-dark').style('width', '40px');

            createDiv('V:').parent(inputGroup).addClass('ui-label');
            const vInput = createInput((selectedPoint.val).toFixed(3)).parent(inputGroup).addClass('ui-input-dark').style('width', '40px');

            const updateFromInputs = () => {
                selectedPoint.t = Math.max(0, Math.min(1, parseFloat(tInput.value()) || 0));
                selectedPoint.val = Math.max(minValue, Math.min(maxValue, parseFloat(vInput.value()) || 0));
                render();
                saveData();
            };

            tInput.changed(updateFromInputs);
            vInput.changed(updateFromInputs);
        }

        const btnGroup = createDiv('').parent(controlsDiv).addClass('ui-row').style('margin-left', 'auto').style('gap', '4px');

        const addBtn = createButton('Add').parent(btnGroup).addClass('ui-btn').style('padding', '2px 6px');
        addBtn.elt.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            const newPoint = { t: 0.5, val: minValue + (maxValue - minValue) * 0.5, id: Date.now() };
            points.push(newPoint);
            selectedPoint = newPoint;
            render();
            updateControls();
            saveData();
        });

        const delBtn = createButton('Del').parent(btnGroup).addClass('ui-btn').addClass('ui-btn-danger').style('padding', '2px 6px');
        delBtn.elt.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            if (points.length > 2) {
                if (selectedPoint) {
                    points = points.filter(p => p !== selectedPoint);
                    selectedPoint = null;
                    render();
                    updateControls();
                    saveData();
                } else {
                    alert("Select a point to delete.");
                }
            } else {
                alert("Cannot delete. Minimum 2 points required.");
            }
        });
    };

    // Observe Resize to redraw (simple hack)
    const ro = new ResizeObserver(() => render());
    ro.observe(editorContainer.elt);

    render();
    updateControls();
}

/**
 * Catmull-RomスプラインをSVGの三次ベジェ曲線パスデータに変換します。
 * @param {Array} points - ソートされた {t, val} の配列
 * @param {number} width - 描画領域の幅
 * @param {number} height - 描画領域の高さ
 * @param {number} maxValue - 値の最大値
 * @param {number} minValue - 値の最小値
 * @returns {string} SVG path要素のd属性文字列
 */
function getSplinePath(points, width, height, maxValue, minValue) {
    if (points.length < 2) return "";

    const range = maxValue - minValue;
    if (range === 0) return "";

    // 座標変換ヘルパー
    const toX = t => t * width;
    const toY = v => (1 - (v - minValue) / range) * height; // Y反転 & スケール

    const p = points.map(pt => ({ x: toX(pt.t), y: toY(pt.val) }));

    let d = `M ${p[0].x} ${p[0].y}`;

    for (let i = 0; i < p.length - 1; i++) {
        const p0 = i > 0 ? p[i - 1] : p[0];
        const p1 = p[i];
        const p2 = p[i + 1];
        const p3 = i < p.length - 2 ? p[i + 2] : p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;

        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return d;
}


// Helper functions
function parseGradientData(ring) {
    const alphaKeys = [], colorKeys = [];
    ring.items.forEach(item => {
        if (item && item.type === 'joint' && item.value instanceof ArrayRing) {
            const childRing = item.value;
            if (childRing.items.length >= 6) {
                const getVal = (idx) => (childRing.items[idx] && childRing.items[idx].value) ? parseFloat(childRing.items[idx].value) : 0;
                const t = getVal(1), r = getVal(2), g = getVal(3), b = getVal(4), a = getVal(5);
                const id = Math.random().toString(36).substr(2, 9);
                alphaKeys.push({ t, val: a, id: id + "_a" });
                colorKeys.push({ t, r, g, b, id: id + "_c" });
            }
        }
    });
    alphaKeys.sort((a, b) => a.t - b.t); colorKeys.sort((a, b) => a.t - b.t);
    return { alphaKeys, colorKeys };
}

function applyGradientToRing(ring, alphaKeys, colorKeys) {
    const timeSet = new Set();
    alphaKeys.forEach(k => timeSet.add(k.t)); colorKeys.forEach(k => timeSet.add(k.t));
    const times = Array.from(timeSet).sort((a, b) => a - b);
    const lerpVal = (v0, v1, t) => v0 + (v1 - v0) * t;

    const getAlphaAt = (t) => {
        if (alphaKeys.length === 0) return 1;
        if (t <= alphaKeys[0].t) return alphaKeys[0].val;
        if (t >= alphaKeys[alphaKeys.length - 1].t) return alphaKeys[alphaKeys.length - 1].val;
        for (let i = 0; i < alphaKeys.length - 1; i++) {
            if (t >= alphaKeys[i].t && t <= alphaKeys[i + 1].t) {
                const range = alphaKeys[i + 1].t - alphaKeys[i].t;
                return lerpVal(alphaKeys[i].val, alphaKeys[i + 1].val, (range === 0 ? 0 : (t - alphaKeys[i].t) / range));
            }
        }
        return 1;
    };
    const getColorAt = (t) => {
        if (colorKeys.length === 0) return { r: 1, g: 1, b: 1 };
        if (t <= colorKeys[0].t) return colorKeys[0];
        if (t >= colorKeys[colorKeys.length - 1].t) return colorKeys[colorKeys.length - 1];
        for (let i = 0; i < colorKeys.length - 1; i++) {
            if (t >= colorKeys[i].t && t <= colorKeys[i + 1].t) {
                const range = colorKeys[i + 1].t - colorKeys[i].t;
                const ratio = range === 0 ? 0 : (t - colorKeys[i].t) / range;
                return { r: lerpVal(colorKeys[i].r, colorKeys[i + 1].r, ratio), g: lerpVal(colorKeys[i].g, colorKeys[i + 1].g, ratio), b: lerpVal(colorKeys[i].b, colorKeys[i + 1].b, ratio) };
            }
        }
        return { r: 1, g: 1, b: 1 };
    };

    const existingJoints = ring.items.filter(item => item instanceof Joint && item.value instanceof ArrayRing);
    let newItems = [];
    if (ring.items.length > 0 && ring.items[0] instanceof Sigil) newItems.push(ring.items[0]);
    else newItems.push(new Sigil(0, 0, "COMPLETE", ring));

    times.forEach((t, i) => {
        const a = getAlphaAt(t), c = getColorAt(t);
        const fmt = (n) => parseFloat(n.toFixed(3)).toString();
        let targetRing, targetJoint;

        if (i < existingJoints.length) {
            targetJoint = existingJoints[i]; targetRing = targetJoint.value;
            while (targetRing.items.length < 6) targetRing.items.push(new Chars(0, 0, "0", targetRing));
            targetRing.items[1].value = fmt(t); targetRing.items[2].value = fmt(c.r); targetRing.items[3].value = fmt(c.g); targetRing.items[4].value = fmt(c.b); targetRing.items[5].value = fmt(a);
            targetRing.CalculateLayout();
        } else {
            targetRing = new ArrayRing({ x: ring.pos.x + 100, y: ring.pos.y + 100 });
            rings.push(targetRing);
            targetRing.items.push(new Chars(0, 0, fmt(t), targetRing)); targetRing.items.push(new Chars(0, 0, fmt(c.r), targetRing)); targetRing.items.push(new Chars(0, 0, fmt(c.g), targetRing)); targetRing.items.push(new Chars(0, 0, fmt(c.b), targetRing)); targetRing.items.push(new Chars(0, 0, fmt(a), targetRing));
            targetRing.CalculateLayout();
            targetJoint = new Joint(0, 0, targetRing, ring);
        }
        newItems.push(targetJoint);
    });

    if (existingJoints.length > times.length) {
        for (let i = times.length; i < existingJoints.length; i++) {
            const joint = existingJoints[i], childRing = joint.value;
            const globalIdx = rings.indexOf(childRing);
            if (globalIdx !== -1) rings.splice(globalIdx, 1);
        }
    }
    ring.items = newItems; ring.CalculateLayout();
    if (typeof alignConnectedRings === 'function') alignConnectedRings(ring);
}

// Curve Utility Functions
function parseCurveData(ring) {
    const points = [];
    //リングのプロパティから取得
    let maxValue = ring.maxValue !== undefined ? ring.maxValue : 1.0;
    let minValue = ring.minValue !== undefined ? ring.minValue : 0.0;

    ring.items.forEach(item => {
        if (item && item.type === 'joint' && item.value instanceof ArrayRing) {
            const childRing = item.value;
            if (childRing.items.length >= 3) {
                const getVal = (idx) => (childRing.items[idx] && childRing.items[idx].value) ? parseFloat(childRing.items[idx].value) : 0;
                const t = getVal(1);
                const val = getVal(2);
                const id = Math.random().toString(36).substr(2, 9);
                points.push({ t, val, id });
            }
        }
    });
    points.sort((a, b) => a.t - b.t);
    return { points, maxValue, minValue };
}

function applyCurveToRing(ring, points, maxValue, minValue) {
    points.sort((a, b) => a.t - b.t);
    const existingJoints = ring.items.filter(item => item instanceof Joint && item.value instanceof ArrayRing);
    let newItems = [];
    if (ring.items.length > 0 && ring.items[0] instanceof Sigil) newItems.push(ring.items[0]);
    else newItems.push(new Sigil(0, 0, "COMPLETE", ring));

    // Min/Maxをリングのプロパティに保存
    ring.maxValue = maxValue;
    ring.minValue = minValue;

    const fmt = (n) => parseFloat(n.toFixed(3)).toString();

    points.forEach((p, i) => {
        let targetRing, targetJoint;
        if (i < existingJoints.length) {
            targetJoint = existingJoints[i]; targetRing = targetJoint.value;
            while (targetRing.items.length < 3) targetRing.items.push(new Chars(0, 0, "0", targetRing));
            targetRing.items[1].value = fmt(p.t);
            targetRing.items[2].value = fmt(p.val);
            targetRing.CalculateLayout();
        } else {
            targetRing = new ArrayRing({ x: ring.pos.x + 100, y: ring.pos.y + 100 });
            rings.push(targetRing);
            targetRing.items.push(new Chars(0, 0, fmt(p.t), targetRing));
            targetRing.items.push(new Chars(0, 0, fmt(p.val), targetRing));
            targetRing.CalculateLayout();
            targetJoint = new Joint(0, 0, targetRing, ring);
        }
        newItems.push(targetJoint);
    });

    // Cleanup extra
    if (existingJoints.length > points.length) {
        for (let i = points.length; i < existingJoints.length; i++) {
            const joint = existingJoints[i], childRing = joint.value;
            const globalIdx = rings.indexOf(childRing);
            if (globalIdx !== -1) rings.splice(globalIdx, 1);
        }
    }
    ring.items = newItems; ring.CalculateLayout();
    if (typeof alignConnectedRings === 'function') alignConnectedRings(ring);
}

// Color Utility Functions
function rgbToHsv(r, g, b) {
    let max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, h, s, v = max;
    s = max === 0 ? 0 : d / max;
    if (max === min) h = 0; else {
        switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; }
        h /= 6;
    }
    return [h, s, v];
}
function hsvToRgb(h, s, v) {
    let r, g, b, i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    switch (i % 6) { case 0: r = v; g = t; b = p; break; case 1: r = q; g = v; b = p; break; case 2: r = p; g = v; b = t; break; case 3: r = p; g = q; b = v; break; case 4: r = t; g = p; b = v; break; case 5: r = v; g = p; b = q; break; }
    return [r, g, b];
}
function rgbToHex(r, g, b) {
    const toHex = (c) => { const hex = Math.round(c * 255).toString(16); return hex.length === 1 ? "0" + hex : hex; };
    return (toHex(r) + toHex(g) + toHex(b)).toUpperCase();
}
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => r + r + g + g + b + b));
    return result ? { r: parseInt(result[1], 16) / 255, g: parseInt(result[2], 16) / 255, b: parseInt(result[3], 16) / 255 } : null;
}