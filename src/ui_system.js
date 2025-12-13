// =============================================
// UI Panel Functions
// =============================================

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