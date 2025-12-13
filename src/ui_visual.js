/**
 * ArrayRingの色編集用パネルを作成します。
 */
function createColorPickerPanel(ring) {
    // パネルを閉じる処理（レイアウト再計算を含む）
    const closePanel = () => {
        // 1. まず現在のパネルをUIから完全に削除する
        if (currentUiPanel) {
            currentUiPanel.remove();
            currentUiPanel = null;
        }
        editingItem = null;

        // 2. その後でリングの計算や、次のパネル（グラディエントエディタ）を開くコールバックを実行する
        if (ring) {
            if (typeof ring.CalculateLayout === 'function') {
                ring.CalculateLayout();
            }
            // グラディエントエディタ復帰用フック
            // (currentUiPanelがnullになった後で呼ぶ必要がある)
            if (typeof ring.onColorPickerClose === 'function') {
                ring.onColorPickerClose();
            }
        }
    };

    const panelResult = createBasePanel('Color Picker', closePanel);
    if (!panelResult) return;
    const { contentArea } = panelResult;

    // パネル全体のスタイル調整
    currentUiPanel.style('background-color', '#282828');
    currentUiPanel.style('color', '#ddd');
    currentUiPanel.style('width', '240px');

    const headerElt = currentUiPanel.elt.children[0];
    if (headerElt) {
        if (headerElt.children[0]) headerElt.children[0].style.color = '#ffffff';
        if (headerElt.children[1]) headerElt.children[1].style.color = '#ffffff';
    }

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

    // --- 1. Hue Ring ---
    const hueRing = createDiv('');
    hueRing.parent(pickerContainer);
    hueRing.style('position', 'absolute');
    hueRing.style('top', '0');
    hueRing.style('left', '0');
    hueRing.style('width', '100%');
    hueRing.style('height', '100%');
    hueRing.style('border-radius', '50%');
    hueRing.style('background', 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)');
    hueRing.style('cursor', 'crosshair');

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

    // --- 2. Mask ---
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

    // --- 3. SV Square ---
    const svSquare = createDiv('');
    svSquare.parent(pickerContainer);
    svSquare.style('position', 'absolute');
    svSquare.style('top', '50%');
    svSquare.style('left', '50%');
    svSquare.style('width', '50%');
    svSquare.style('height', '50%');
    svSquare.style('transform', 'translate(-50%, -50%)');
    svSquare.style('cursor', 'crosshair');

    const svWhite = createDiv('');
    svWhite.parent(svSquare);
    svWhite.style('position', 'absolute');
    svWhite.style('width', '100%');
    svWhite.style('height', '100%');
    svWhite.style('background', 'linear-gradient(to right, #fff, rgba(255,255,255,0))');

    const svBlack = createDiv('');
    svBlack.parent(svSquare);
    svBlack.style('position', 'absolute');
    svBlack.style('width', '100%');
    svBlack.style('height', '100%');
    svBlack.style('background', 'linear-gradient(to bottom, transparent, #000)');

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
        if (ring && typeof ring.CalculateLayout === 'function') {
            ring.CalculateLayout();
        }
    };

    const updateUI = (updateInputs = true) => {
        const angle = h * Math.PI * 2;
        const knobX = 100 + 90 * Math.sin(angle);
        const knobY = 100 - 90 * Math.cos(angle);
        hueKnob.style('left', `${knobX}px`);
        hueKnob.style('top', `${knobY}px`);

        const pureColor = hsvToRgb(h, 1, 1);
        svSquare.style('background-color', `rgb(${pureColor[0] * 255},${pureColor[1] * 255},${pureColor[2] * 255})`);

        svKnob.style('left', `${s * 100}%`);
        svKnob.style('top', `${(1 - v) * 100}%`);

        if (updateInputs) {
            updateSliders();
        }
    };

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

/**
 * グラディエントエディタパネルを作成します。
 * (selectionState引数で、パネル再開時の選択状態を復元)
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

    // パネルスタイル設定
    currentUiPanel.style('width', '360px');
    currentUiPanel.style('background-color', '#333');
    currentUiPanel.style('color', '#eee');

    // --- ヘッダーの視認性向上 ---
    // createBasePanelで作られたヘッダー要素を取得し、文字色を白にする
    const headerElt = currentUiPanel.elt.children[0];
    if (headerElt) {
        // タイトル
        if (headerElt.children[0]) headerElt.children[0].style.color = '#ffffff';
        // 閉じるボタン
        if (headerElt.children[1]) headerElt.children[1].style.color = '#ffffff';
    }

    // --- State Initialization ---
    let { alphaKeys, colorKeys } = parseGradientData(ring);

    if (alphaKeys.length === 0) {
        alphaKeys = [{ t: 0, val: 1, id: 'a_start' }, { t: 1, val: 1, id: 'a_end' }];
    }
    if (colorKeys.length === 0) {
        colorKeys = [{ t: 0, r: 1, g: 1, b: 1, id: 'c_start' }, { t: 1, r: 1, g: 1, b: 1, id: 'c_end' }];
    }

    let selectedKey = null;
    let selectedType = null;

    // 状態復元
    if (selectionState) {
        const keys = selectionState.type === 'alpha' ? alphaKeys : colorKeys;
        if (selectionState.index >= 0 && selectionState.index < keys.length) {
            selectedKey = keys[selectionState.index];
            selectedType = selectionState.type;
        }
    }

    // --- Logic Functions ---
    const lerpAlpha = (t) => {
        if (alphaKeys.length === 0) return 1;
        if (t <= alphaKeys[0].t) return alphaKeys[0].val;
        if (t >= alphaKeys[alphaKeys.length - 1].t) return alphaKeys[alphaKeys.length - 1].val;
        for (let i = 0; i < alphaKeys.length - 1; i++) {
            if (t >= alphaKeys[i].t && t <= alphaKeys[i + 1].t) {
                const range = alphaKeys[i + 1].t - alphaKeys[i].t;
                const ratio = range === 0 ? 0 : (t - alphaKeys[i].t) / range;
                return alphaKeys[i].val + (alphaKeys[i + 1].val - alphaKeys[i].val) * ratio;
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
        const steps = 20;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const a = lerpAlpha(t);
            const c = lerpColor(t);
            stops.push(`rgba(${c.r * 255},${c.g * 255},${c.b * 255},${a}) ${t * 100}%`);
        }
        gradientPreview.style('background', `linear-gradient(to right, ${stops.join(', ')})`);
    };

    const saveData = () => {
        applyGradientToRing(ring, alphaKeys, colorKeys);
    };

    // --- UI Layout ---
    const topContainer = createDiv('');
    topContainer.parent(contentArea);
    topContainer.style('padding', '10px 10px 0 10px');

    const editorHeight = 80;
    const barHeight = 30;

    const editorContainer = createDiv('');
    editorContainer.parent(topContainer);
    editorContainer.style('position', 'relative');
    editorContainer.style('height', `${editorHeight}px`);
    editorContainer.style('margin-bottom', '10px');
    editorContainer.style('user-select', 'none');

    // バー
    const gradientBar = createDiv('');
    gradientBar.parent(editorContainer);
    gradientBar.style('position', 'absolute');
    gradientBar.style('left', '10px');
    gradientBar.style('right', '10px');
    gradientBar.style('top', '25px');
    gradientBar.style('height', `${barHeight}px`);
    gradientBar.style('border', '1px solid #555');
    gradientBar.style('background-image', 'linear-gradient(45deg, #666 25%, transparent 25%, transparent 75%, #666 75%), linear-gradient(45deg, #666 25%, transparent 25%, transparent 75%, #666 75%)');
    gradientBar.style('background-size', '10px 10px');
    gradientBar.style('background-color', '#333');
    gradientBar.style('cursor', 'pointer');

    // プレビュー
    const gradientPreview = createDiv('');
    gradientPreview.parent(gradientBar);
    gradientPreview.style('width', '100%');
    gradientPreview.style('height', '100%');
    gradientPreview.style('pointer-events', 'none');

    // コントロール
    const controlsDiv = createDiv('');
    controlsDiv.parent(contentArea);
    controlsDiv.style('padding', '10px');
    controlsDiv.style('background', '#2a2a2a');
    controlsDiv.style('border-radius', '4px');
    controlsDiv.style('display', 'flex');
    controlsDiv.style('gap', '10px');
    controlsDiv.style('align-items', 'center');
    controlsDiv.style('min-height', '40px');

    // --- マーカー描画 ---
    const renderMarkers = () => {
        const existing = editorContainer.elt.querySelectorAll('.marker');
        existing.forEach(e => e.remove());

        const createMarker = (key, type) => {
            const m = createDiv('');
            m.addClass('marker');
            m.parent(editorContainer);
            m.style('position', 'absolute');
            m.style('width', '12px');
            m.style('height', '12px');
            m.style('cursor', 'pointer');
            m.style('z-index', '100');
            m.style('left', '10px');
            m.style('margin-left', `calc(${key.t} * (100% - 20px) - 6px)`);

            const isSelected = (selectedKey === key);
            const borderCol = isSelected ? 'orange' : '#fff';

            const shape = createDiv('');
            shape.parent(m);
            shape.style('width', '100%');
            shape.style('height', '100%');
            shape.style('box-sizing', 'border-box');

            if (type === 'alpha') {
                m.style('top', '10px');
                shape.style('background', `rgb(${Math.floor(key.val * 255)}, ${Math.floor(key.val * 255)}, ${Math.floor(key.val * 255)})`);
                shape.style('border', `2px solid ${borderCol}`);
                shape.style('border-radius', '2px 2px 50% 50%');
            } else {
                m.style('top', `${25 + barHeight + 5}px`);
                shape.style('background', `rgb(${key.r * 255},${key.g * 255},${key.b * 255})`);
                shape.style('border', `2px solid ${borderCol}`);
                shape.style('border-radius', '50% 50% 2px 2px');
            }

            m.elt.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                selectedKey = key;
                selectedType = type;
                renderMarkers();
                updateControls();

                const startX = e.clientX;
                const trackWidth = editorContainer.elt.offsetWidth - 20;
                const startT = key.t;

                const dragMove = (ev) => {
                    const dx = ev.clientX - startX;
                    let newT = startT + dx / trackWidth;
                    newT = Math.max(0, Math.min(1, newT));
                    key.t = newT;

                    if (type === 'alpha') alphaKeys.sort((a, b) => a.t - b.t);
                    else colorKeys.sort((a, b) => a.t - b.t);

                    renderMarkers();
                    updatePreview();
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
        };

        alphaKeys.forEach(k => createMarker(k, 'alpha'));
        colorKeys.forEach(k => createMarker(k, 'color'));
    };

    // バークリック
    gradientBar.elt.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();

        const rect = gradientBar.elt.getBoundingClientRect();
        const x = e.clientX - rect.left;
        let t = x / rect.width;
        t = Math.max(0, Math.min(1, t));

        const y = e.clientY - rect.top;
        if (y < rect.height / 2) {
            const newVal = lerpAlpha(t);
            const newKey = { t, val: newVal, id: Date.now() };
            alphaKeys.push(newKey);
            alphaKeys.sort((a, b) => a.t - b.t);
            selectedKey = newKey;
            selectedType = 'alpha';
        } else {
            const newCol = lerpColor(t);
            const newKey = { t, ...newCol, id: Date.now() };
            colorKeys.push(newKey);
            colorKeys.sort((a, b) => a.t - b.t);
            selectedKey = newKey;
            selectedType = 'color';
        }
        renderMarkers();
        updatePreview();
        updateControls();
        saveData();
    });

    const updateControls = () => {
        controlsDiv.html('');
        if (!selectedKey) {
            const help = createDiv('Click bar to add key.<br>Click marker to edit.');
            help.parent(controlsDiv);
            help.style('color', '#888');
            help.style('font-size', '12px');
            return;
        }

        const locGroup = createDiv('');
        locGroup.parent(controlsDiv);
        locGroup.style('display', 'flex');
        locGroup.style('align-items', 'center');
        createDiv('Loc:').parent(locGroup).style('font-size', '12px').style('color', '#ccc').style('margin-right', '4px');
        const locInput = createInput((selectedKey.t * 100).toFixed(1));
        locInput.parent(locGroup);
        locInput.style('width', '35px');
        locInput.style('background', '#444');
        locInput.style('color', 'white');
        locInput.style('border', 'none');
        locInput.style('text-align', 'right');
        createDiv('%').parent(locGroup).style('font-size', '12px').style('color', '#ccc').style('margin-left', '2px');

        locInput.elt.onchange = () => {
            let val = parseFloat(locInput.value());
            if (isNaN(val)) return;
            selectedKey.t = Math.max(0, Math.min(100, val)) / 100;
            if (selectedType === 'alpha') alphaKeys.sort((a, b) => a.t - b.t);
            else colorKeys.sort((a, b) => a.t - b.t);
            renderMarkers();
            updatePreview();
            saveData();
        };

        if (selectedType === 'alpha') {
            const valGroup = createDiv('');
            valGroup.parent(controlsDiv);
            valGroup.style('display', 'flex');
            valGroup.style('align-items', 'center');
            valGroup.style('margin-left', '8px');
            createDiv('Alpha:').parent(valGroup).style('font-size', '12px').style('color', '#ccc').style('margin-right', '4px');

            const alphaSlider = createInput(Math.floor(selectedKey.val * 255), 'range');
            alphaSlider.parent(valGroup);
            alphaSlider.attribute('min', 0);
            alphaSlider.attribute('max', 255);
            alphaSlider.style('width', '60px');

            const alphaNum = createInput(Math.floor(selectedKey.val * 255));
            alphaNum.parent(valGroup);
            alphaNum.style('width', '30px');
            alphaNum.style('background', '#444');
            alphaNum.style('color', 'white');
            alphaNum.style('border', 'none');
            alphaNum.style('text-align', 'right');
            alphaNum.style('margin-left', '4px');

            const onAlphaChange = (v) => {
                selectedKey.val = v / 255;
                renderMarkers();
                updatePreview();
                saveData();
            };
            alphaSlider.input(() => { alphaNum.value(alphaSlider.value()); onAlphaChange(alphaSlider.value()); });
            alphaNum.input(() => {
                let v = parseInt(alphaNum.value()) || 0;
                v = Math.max(0, Math.min(255, v));
                alphaSlider.value(v);
                onAlphaChange(v);
            });

        } else {
            const colGroup = createDiv('');
            colGroup.parent(controlsDiv);
            colGroup.style('display', 'flex');
            colGroup.style('align-items', 'center');
            colGroup.style('margin-left', '8px');
            createDiv('Color:').parent(colGroup).style('font-size', '12px').style('color', '#ccc').style('margin-right', '4px');

            const colorBox = createDiv('');
            colorBox.parent(colGroup);
            colorBox.style('width', '30px');
            colorBox.style('height', '20px');
            colorBox.style('background', `rgb(${selectedKey.r * 255}, ${selectedKey.g * 255}, ${selectedKey.b * 255})`);
            colorBox.style('border', '1px solid white');
            colorBox.style('cursor', 'pointer');

            colorBox.elt.addEventListener('mousedown', (e) => {
                e.stopPropagation();

                const idx = colorKeys.indexOf(selectedKey);

                const mockRing = {
                    items: [
                        null,
                        { value: selectedKey.r },
                        { value: selectedKey.g },
                        { value: selectedKey.b },
                        { value: 1.0 }
                    ],
                    CalculateLayout: () => {
                        selectedKey.r = parseFloat(mockRing.items[1].value);
                        selectedKey.g = parseFloat(mockRing.items[2].value);
                        selectedKey.b = parseFloat(mockRing.items[3].value);
                        saveData();
                    },
                    onColorPickerClose: () => {
                        createGradientEditorPanel(ring, { type: 'color', index: idx });
                    }
                };

                closePanel();
                createColorPickerPanel(mockRing);
            });
        }

        const delBtn = createButton('Del');
        delBtn.parent(controlsDiv);
        delBtn.style('margin-left', 'auto');
        delBtn.style('background', '#d33');
        delBtn.style('color', 'white');
        delBtn.style('border', 'none');
        delBtn.style('border-radius', '3px');
        delBtn.style('cursor', 'pointer');
        delBtn.style('padding', '2px 6px');

        delBtn.elt.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            if (selectedType === 'alpha' && alphaKeys.length > 1) {
                alphaKeys = alphaKeys.filter(k => k !== selectedKey);
            } else if (selectedType === 'color' && colorKeys.length > 1) {
                colorKeys = colorKeys.filter(k => k !== selectedKey);
            } else {
                alert("Cannot delete the last key.");
                return;
            }
            selectedKey = null;
            renderMarkers();
            updatePreview();
            updateControls();
            saveData();
        });
    };

    updatePreview();
    renderMarkers();
    updateControls();
    let onDrag, onStopDrag;
}

// =============================================
// Gradient Editor Helpers
// =============================================

/**
 * リングのJointからグラディエントのキー（Alpha/Color）を抽出します。
 * 戻り値: { alphaKeys: [{t, val, id}], colorKeys: [{t, r, g, b, id}] }
 */
function parseGradientData(ring) {
    const alphaKeys = [];
    const colorKeys = [];

    // Jointで接続された子リング（キーフレーム）を走査
    ring.items.forEach(item => {
        if (item && item.type === 'joint' && item.value instanceof ArrayRing) {
            const childRing = item.value;

            // ArrayRingは先頭に "COMPLETE" があるため、データは index 1 から始まる
            // 期待する構造: [COMPLETE, Time, R, G, B, A] (長さ6以上)
            if (childRing.items.length >= 6) {
                const getVal = (idx) => {
                    const it = childRing.items[idx];
                    return (it && it.value) ? parseFloat(it.value) : 0;
                };

                const t = getVal(1); // Time
                const r = getVal(2);
                const g = getVal(3);
                const b = getVal(4);
                const a = getVal(5);

                const id = Math.random().toString(36).substr(2, 9);

                alphaKeys.push({ t, val: a, id: id + "_a" });
                colorKeys.push({ t, r, g, b, id: id + "_c" });
            }
        }
    });

    // 時間順にソート
    alphaKeys.sort((a, b) => a.t - b.t);
    colorKeys.sort((a, b) => a.t - b.t);

    return { alphaKeys, colorKeys };
}

/**
 * 分離された Alpha/Color キーを統合し、リングの Joint として再構築します。
 * ArrayRingの構造 [COMPLETE, Time, R, G, B, A] を維持します。
 */
function applyGradientToRing(ring, alphaKeys, colorKeys) {
    // 1. 全てのユニークな時間ポイントを収集
    const timeSet = new Set();
    alphaKeys.forEach(k => timeSet.add(k.t));
    colorKeys.forEach(k => timeSet.add(k.t));
    const times = Array.from(timeSet).sort((a, b) => a - b);

    const lerpVal = (v0, v1, t) => v0 + (v1 - v0) * t;

    // 2. 補間関数
    const getAlphaAt = (t) => {
        if (alphaKeys.length === 0) return 1;
        if (t <= alphaKeys[0].t) return alphaKeys[0].val;
        if (t >= alphaKeys[alphaKeys.length - 1].t) return alphaKeys[alphaKeys.length - 1].val;
        for (let i = 0; i < alphaKeys.length - 1; i++) {
            if (t >= alphaKeys[i].t && t <= alphaKeys[i + 1].t) {
                const range = alphaKeys[i + 1].t - alphaKeys[i].t;
                const ratio = range === 0 ? 0 : (t - alphaKeys[i].t) / range;
                return lerpVal(alphaKeys[i].val, alphaKeys[i + 1].val, ratio);
            }
        }
        return 1;
    };

    const getColorAt = (t) => {
        if (colorKeys.length === 0) return { r: 1, g: 1, b: 1 };
        if (t <= colorKeys[0].t) return { r: colorKeys[0].r, g: colorKeys[0].g, b: colorKeys[0].b };
        if (t >= colorKeys[colorKeys.length - 1].t) return { r: colorKeys[colorKeys.length - 1].r, g: colorKeys[colorKeys.length - 1].g, b: colorKeys[colorKeys.length - 1].b };
        for (let i = 0; i < colorKeys.length - 1; i++) {
            if (t >= colorKeys[i].t && t <= colorKeys[i + 1].t) {
                const range = colorKeys[i + 1].t - colorKeys[i].t;
                const ratio = range === 0 ? 0 : (t - colorKeys[i].t) / range;
                return {
                    r: lerpVal(colorKeys[i].r, colorKeys[i + 1].r, ratio),
                    g: lerpVal(colorKeys[i].g, colorKeys[i + 1].g, ratio),
                    b: lerpVal(colorKeys[i].b, colorKeys[i + 1].b, ratio)
                };
            }
        }
        return { r: 1, g: 1, b: 1 };
    };

    // 4. リングアイテムの更新

    // 現在接続されている Joint とその先の子リングを取得
    const existingJoints = ring.items.filter(item => item instanceof Joint && item.value instanceof ArrayRing);

    // 親リングの先頭（COMPLETE）を確保
    // 通常 ArrayRing なら items[0] は COMPLETE シジル
    let newItems = [];
    if (ring.items.length > 0 && ring.items[0] instanceof Sigil) {
        newItems.push(ring.items[0]);
    } else {
        newItems.push(new Sigil(0, 0, "COMPLETE", ring));
    }

    times.forEach((t, i) => {
        const a = getAlphaAt(t);
        const c = getColorAt(t);
        const fmt = (n) => parseFloat(n.toFixed(3)).toString();

        let targetRing;
        let targetJoint;

        if (i < existingJoints.length) {
            // --- 既存再利用 ---
            targetJoint = existingJoints[i];
            targetRing = targetJoint.value;

            // アイテム数が足りない場合は補充 ( [COMPLETE, Time, R, G, B, A] )
            // items[0] は COMPLETE なので、長さが 6 未満なら追加
            while (targetRing.items.length < 6) {
                targetRing.items.push(new Chars(0, 0, "0", targetRing));
            }

            // 値更新 (Index 1〜5)
            targetRing.items[1].value = fmt(t);
            targetRing.items[2].value = fmt(c.r);
            targetRing.items[3].value = fmt(c.g);
            targetRing.items[4].value = fmt(c.b);
            targetRing.items[5].value = fmt(a);

            targetRing.CalculateLayout();
        } else {
            // --- 新規作成 ---
            // new ArrayRing() した時点で items[0] に COMPLETE が入っている
            targetRing = new ArrayRing({ x: ring.pos.x + 100, y: ring.pos.y + 100 });
            rings.push(targetRing);

            targetRing.items.push(new Chars(0, 0, fmt(t), targetRing)); // 1: Time
            targetRing.items.push(new Chars(0, 0, fmt(c.r), targetRing)); // 2: R
            targetRing.items.push(new Chars(0, 0, fmt(c.g), targetRing)); // 3: G
            targetRing.items.push(new Chars(0, 0, fmt(c.b), targetRing)); // 4: B
            targetRing.items.push(new Chars(0, 0, fmt(a), targetRing));   // 5: A

            targetRing.CalculateLayout();
            targetJoint = new Joint(0, 0, targetRing, ring);
        }

        newItems.push(targetJoint);
    });

    // 余分なリングの削除
    if (existingJoints.length > times.length) {
        for (let i = times.length; i < existingJoints.length; i++) {
            const joint = existingJoints[i];
            const childRing = joint.value;
            const globalIdx = rings.indexOf(childRing);
            if (globalIdx !== -1) {
                rings.splice(globalIdx, 1);
            }
        }
    }

    ring.items = newItems;
    ring.CalculateLayout();
    if (typeof alignConnectedRings === 'function') {
        alignConnectedRings(ring);
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