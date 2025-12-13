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
    header.style('cursor', 'move'); // ドラッグ可能カーソル

    // --- ドラッグ機能の実装 ---
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    const startDrag = (e) => {
        // ボタンなどのインタラクティブ要素上ではドラッグを開始しない
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;

        e.preventDefault();
        isDragging = true;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // 現在のパネル位置からのオフセットを計算
        const pos = currentUiPanel.position();
        dragOffset.x = clientX - pos.x;
        dragOffset.y = clientY - pos.y;

        window.addEventListener('mousemove', doDrag);
        window.addEventListener('mouseup', stopDrag);
        window.addEventListener('touchmove', doDrag, { passive: false });
        window.addEventListener('touchend', stopDrag);
    };

    const doDrag = (e) => {
        if (!isDragging) return;
        e.preventDefault(); // タッチデバイスでのスクロール防止

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        currentUiPanel.position(clientX - dragOffset.x, clientY - dragOffset.y);
    };

    const stopDrag = () => {
        isDragging = false;
        window.removeEventListener('mousemove', doDrag);
        window.removeEventListener('mouseup', stopDrag);
        window.removeEventListener('touchmove', doDrag);
        window.removeEventListener('touchend', stopDrag);
    };

    // ヘッダーにドラッグイベントを登録
    header.elt.addEventListener('mousedown', startDrag);
    header.elt.addEventListener('touchstart', startDrag, { passive: false });
    // ------------------------

    const title = createP(titleText);
    title.parent(header);
    title.style('margin', '0');
    title.style('font-weight', 'bold');
    title.style('color', '#333');
    // タイトル要素上でもドラッグイベントがバブリングするので、これ以上の設定は不要

    const closeButton = createButton('×');
    closeButton.parent(header);
    closeButton.style('border', 'none');
    closeButton.style('background', 'transparent');
    closeButton.style('font-size', '18px');
    closeButton.style('cursor', 'pointer');
    closeButton.style('padding', '0 4px');
    // 閉じるボタンクリック時にドラッグが始まらないようイベント伝播を止める
    closeButton.elt.addEventListener('mousedown', (e) => { e.stopPropagation(); closeCallback(); });
    closeButton.elt.addEventListener('touchstart', (e) => { e.stopPropagation(); }, { passive: false });

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

    // 初期配置の調整（画面外にはみ出ないように）
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