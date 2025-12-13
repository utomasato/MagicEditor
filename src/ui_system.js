// =============================================
// UI Panel Functions
// =============================================

function createConsolePanel() {
    consolePanel = createDiv('');
    // CSSクラスでスタイル適用
    consolePanel.addClass('console-panel');

    // 初期配置 (JSで計算が必要な部分は残す)
    consolePanel.position(60, GetScreenSize()[1] - 160);
    consolePanel.size(300, 150);
    consolePanel.style('position', 'absolute');
    consolePanel.style('z-index', '1000');

    const header = createDiv('');
    header.parent(consolePanel);
    header.addClass('console-header');

    const startDrag = (e) => {
        if (e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION') return;
        e.preventDefault();
        isDraggingConsole = true;
        const cmX = e.touches ? e.touches[0].clientX : e.clientX;
        const cmY = e.touches ? e.touches[0].clientY : e.clientY;
        consoleDragOffset.x = cmX - consolePanel.position().x;
        consoleDragOffset.y = cmY - consolePanel.position().y;
        window.addEventListener('mousemove', doDrag); window.addEventListener('mouseup', stopDrag);
        window.addEventListener('touchmove', doDrag, { passive: false }); window.addEventListener('touchend', stopDrag);
    };
    const doDrag = (e) => {
        if (!isDraggingConsole) return;
        const cmX = e.touches ? e.touches[0].clientX : e.clientX;
        const cmY = e.touches ? e.touches[0].clientY : e.clientY;
        consolePanel.position(cmX - consoleDragOffset.x, cmY - consoleDragOffset.y);
    };
    const stopDrag = () => {
        isDraggingConsole = false;
        window.removeEventListener('mousemove', doDrag); window.removeEventListener('mouseup', stopDrag);
        window.removeEventListener('touchmove', doDrag); window.removeEventListener('touchend', stopDrag);
    };

    header.elt.addEventListener('mousedown', startDrag);
    header.elt.addEventListener('touchstart', startDrag, { passive: false });

    const title = createP('Console');
    title.parent(header);
    title.style('margin', '0').style('font-weight', 'bold');

    const languageSelect = createSelect();
    languageSelect.parent(header);
    languageSelect.addClass('ui-select');
    languageSelect.style('width', 'auto').style('background', '#444').style('color', '#fff').style('border', 'none');
    languageSelect.option('postscript');
    languageSelect.option('lisp');
    languageSelect.changed(() => { setInterpreter(languageSelect.value()); });

    consoleText = createP('Ready.');
    consoleText.parent(consolePanel);
    consoleText.addClass('console-text');

    const resizeHandle = createDiv('');
    resizeHandle.parent(consolePanel);
    resizeHandle.addClass('resize-handle');

    const startResize = (e) => {
        e.stopPropagation(); e.preventDefault(); isResizingConsole = true;
        document.body.style.userSelect = 'none'; document.body.style.webkitUserSelect = 'none';
        window.addEventListener('mousemove', doResize); window.addEventListener('mouseup', stopResize);
        window.addEventListener('touchmove', doResize, { passive: false }); window.addEventListener('touchend', stopResize);
    };
    const doResize = (e) => {
        if (!isResizingConsole) return;
        const cmX = e.touches ? e.touches[0].clientX : e.clientX;
        const cmY = e.touches ? e.touches[0].clientY : e.clientY;
        const pPos = consolePanel.position();
        consolePanel.size(Math.max(150, cmX - pPos.x), Math.max(80, cmY - pPos.y));
    };
    const stopResize = () => {
        isResizingConsole = false;
        document.body.style.userSelect = ''; document.body.style.webkitUserSelect = '';
        window.removeEventListener('mousemove', doResize); window.removeEventListener('mouseup', stopResize);
        window.removeEventListener('touchmove', doResize); window.removeEventListener('touchend', stopResize);
    };

    resizeHandle.elt.addEventListener('mousedown', startResize);
    resizeHandle.elt.addEventListener('touchstart', startResize, { passive: false });
}

/**
 * 右クリックでオブジェクトを追加するためのパネルを作成します。
 */
function createAddObjectPanel() {
    if (currentUiPanel) { currentUiPanel.remove(); currentUiPanel = null; }
    const closePanel = () => { if (currentUiPanel) { currentUiPanel.remove(); currentUiPanel = null; } };
    const panelResult = createBasePanel('Add Object', closePanel);
    if (!panelResult) return;

    const { contentArea } = panelResult;
    const spawnX = typeof mousePos !== 'undefined' ? mousePos.x : 0;
    const spawnY = typeof mousePos !== 'undefined' ? mousePos.y : 0;
    const spawnPos = { x: spawnX, y: spawnY };

    const items = [
        { label: 'Ring', type: 'MagicRing' }, { label: 'Sigil', type: 'Sigil' },
        { label: 'Num', type: 'Num' }, { label: 'String', type: 'String' },
        { label: 'Name', type: 'Name' }, { label: 'Template', type: 'TemplateRing' }
    ];

    items.forEach(item => {
        const btn = createButton(item.label);
        btn.parent(contentArea);
        btn.addClass('ui-btn');
        btn.style('width', '100%').style('text-align', 'left').style('margin-bottom', '4px');

        btn.elt.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            let newObj = null;
            switch (item.type) {
                case 'MagicRing': newObj = new MagicRing(spawnPos); rings.push(newObj); break;
                case 'TemplateRing': newObj = new TemplateRing(spawnPos); rings.push(newObj); break;
                case 'Sigil': newObj = new Sigil(spawnPos.x, spawnPos.y, "add", null); fieldItems.push(newObj); break;
                case 'Num': newObj = new Chars(spawnPos.x, spawnPos.y, "0", null); fieldItems.push(newObj); break;
                case 'String': newObj = new StringToken(spawnPos.x, spawnPos.y, "string", null); fieldItems.push(newObj); break;
                case 'Name': newObj = new Name(spawnPos.x, spawnPos.y, "name", null); fieldItems.push(newObj); break;
            }
            if (newObj) newObj.isNew = true;
            closePanel();
        });
    });
}