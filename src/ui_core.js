function createBasePanel(titleText, closeCallback, deleteCallback, duplicateCallback) {
    if (currentUiPanel) return null;

    // 初期位置を保存
    const initialX = GetMouseX() + 15;
    const initialY = GetMouseY() - 10;

    // パネルの作成 (CSSクラス 'ui-panel' を付与)
    currentUiPanel = createDiv('');
    currentUiPanel.addClass('ui-panel');
    currentUiPanel.position(initialX, initialY);

    // ヘッダー (CSSクラス 'ui-panel-header' を付与)
    const header = createDiv('');
    header.parent(currentUiPanel);
    header.addClass('ui-panel-header');

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
    title.addClass('ui-panel-title');

    const closeButton = createButton('×');
    closeButton.parent(header);
    closeButton.addClass('ui-btn-close');

    // 閉じるボタンクリック時にドラッグが始まらないようイベント伝播を止める
    closeButton.elt.addEventListener('mousedown', (e) => { e.stopPropagation(); closeCallback(); });
    closeButton.elt.addEventListener('touchstart', (e) => { e.stopPropagation(); }, { passive: false });

    const contentArea = createDiv('');
    contentArea.parent(currentUiPanel);
    contentArea.addClass('ui-content');

    if (deleteCallback || duplicateCallback) {
        const footer = createDiv('');
        footer.parent(currentUiPanel);
        footer.addClass('ui-footer');

        if (duplicateCallback) {
            const duplicateButton = createButton('複製');
            duplicateButton.parent(footer);
            duplicateButton.addClass('ui-btn');
            duplicateButton.addClass('ui-btn-duplicate');

            duplicateButton.elt.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                duplicateCallback();
            });
        }

        if (deleteCallback) {
            const deleteButton = createButton('削除');
            deleteButton.parent(footer);
            deleteButton.addClass('ui-btn');
            deleteButton.addClass('ui-btn-delete');

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