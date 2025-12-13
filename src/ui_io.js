let currentFileHandle = null;

document.addEventListener('keydown', async (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const xmlContent = generateLayoutXML();
        try {
            if (currentFileHandle) {
                const writable = await currentFileHandle.createWritable();
                await writable.write(xmlContent); await writable.close();
                showToast('Saved!');
            } else {
                if ('showSaveFilePicker' in window) {
                    const handle = await window.showSaveFilePicker({ types: [{ description: 'XML file', accept: { 'text/xml': ['.xml'] } }], suggestedName: 'magic_circle.xml' });
                    const writable = await handle.createWritable();
                    await writable.write(xmlContent); await writable.close();
                    currentFileHandle = handle; alert('保存しました。');
                } else {
                    downloadFile(xmlContent, 'magic_circle.xml');
                }
            }
        } catch (err) { if (err.name !== 'AbortError') alert('保存に失敗しました: ' + err.message); }
    }
});

function showToast(message) {
    const msg = createDiv(message);
    msg.style('position', 'fixed').style('bottom', '20px').style('right', '20px')
        .style('background', 'rgba(40, 167, 69, 0.9)').style('color', 'white')
        .style('padding', '10px 20px').style('border-radius', '5px').style('z-index', '3000')
        .style('font-family', 'sans-serif').style('pointer-events', 'none');
    setTimeout(() => msg.remove(), 2000);
}

function downloadFile(content, fileName) {
    const blob = new Blob([content], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function generateLayoutXML() {
    const ringIdMap = new Map(); rings.forEach((r, i) => ringIdMap.set(r, i));
    const startRingId = startRing ? ringIdMap.get(startRing) : -1;
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<MagicCircleLayout startRingId="${startRingId}">\n <Rings>\n`;
    rings.forEach(r => { if (typeof ringToXML === 'function') xml += ringToXML(r, ringIdMap); });
    xml += ' </Rings>\n <FieldItems>\n';
    fieldItems.forEach(i => { if (typeof itemToXML === 'function') xml += itemToXML(i, ringIdMap); });
    xml += ' </FieldItems>\n</MagicCircleLayout>\n';
    return xml;
}

function createModalBase(titleText, closeCallback) {
    if (currentUiPanel) { currentUiPanel.remove(); currentUiPanel = null; }
    const overlay = createDiv('');
    currentModalPanel = overlay;
    overlay.addClass('modal-overlay');

    const panel = createDiv('');
    panel.parent(overlay);
    panel.addClass('modal-content');

    const header = createDiv('');
    header.parent(panel);
    header.addClass('modal-header');

    const title = createP(titleText).parent(header).addClass('modal-title');
    const closeBtn = createButton('×').parent(header).addClass('ui-btn-close').style('font-size', '24px');
    closeBtn.mousePressed(() => { if (currentModalPanel) { currentModalPanel.remove(); currentModalPanel = null; } if (closeCallback) closeCallback(); });

    return panel;
}

function showXMLPanel(xmlContent) {
    const panel = createModalBase('XML Output');

    const textArea = createElement('textarea').parent(panel).addClass('modal-textarea');
    textArea.value(xmlContent); textArea.attribute('readonly', '');

    const footer = createDiv('').parent(panel).addClass('modal-footer');

    if (currentFileHandle) {
        const overwriteBtn = createButton('💾 上書き保存').parent(footer).addClass('ui-btn').addClass('ui-btn-primary');
        overwriteBtn.mousePressed(async () => {
            try {
                const writable = await currentFileHandle.createWritable();
                await writable.write(textArea.value()); await writable.close();
                alert('上書き保存しました。');
            } catch (err) { alert('失敗しました: ' + err.message); }
        });
    }

    const saveAsBtn = createButton('💾 名前を付けて保存').parent(footer).addClass('ui-btn').style('border-color', '#28a745').style('color', '#28a745');
    saveAsBtn.mousePressed(async () => {
        try {
            if ('showSaveFilePicker' in window) {
                const handle = await window.showSaveFilePicker({ types: [{ description: 'XML file', accept: { 'text/xml': ['.xml'] } }], suggestedName: 'magic_circle.xml' });
                const writable = await handle.createWritable(); await writable.write(textArea.value()); await writable.close();
                currentFileHandle = handle; alert('保存しました。'); showXMLPanel(textArea.value());
            } else { downloadFile(textArea.value(), 'magic_circle.xml'); }
        } catch (err) { if (err.name !== 'AbortError') alert('失敗しました: ' + err.message); }
    });

    const copyBtn = createButton('コピー').parent(footer).addClass('ui-btn');
    copyBtn.mousePressed(() => {
        textArea.elt.select(); document.execCommand('copy');
        copyBtn.html('コピーしました！'); setTimeout(() => copyBtn.html('コピー'), 2000);
    });
}

function showXMLInputPanel() {
    const panel = createModalBase('XML Import');

    const toolbar = createDiv('').parent(panel).style('display', 'flex').style('margin-bottom', '5px');
    const openFileBtn = createButton('📂 ファイルを開く').parent(toolbar).addClass('ui-btn');

    const fileInput = createInput('', 'file').parent(panel).style('display', 'none').attribute('accept', '.xml');
    const textArea = createElement('textarea', 'ここにXMLをペーストしてください...').parent(panel).addClass('modal-textarea');
    textArea.elt.addEventListener('focus', () => { if (textArea.value() === 'ここにXMLをペーストしてください...') textArea.value(''); });

    openFileBtn.mousePressed(async () => {
        if ('showOpenFilePicker' in window) {
            try {
                const [handle] = await window.showOpenFilePicker({ types: [{ description: 'XML Files', accept: { 'text/xml': ['.xml'] } }], multiple: false });
                currentFileHandle = handle;
                const file = await handle.getFile(); textArea.value(await file.text()); errorMsg.hide();
            } catch (err) { if (err.name !== 'AbortError') console.error(err); }
        } else { fileInput.elt.click(); }
    });

    fileInput.elt.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) { const reader = new FileReader(); reader.onload = (e) => { textArea.value(e.target.result); errorMsg.hide(); currentFileHandle = null; }; reader.readAsText(file); }
    });

    const errorMsg = createP('').parent(panel).style('color', 'red').style('font-size', '12px').hide();
    const footer = createDiv('').parent(panel).addClass('modal-footer');

    const handleImport = (mode) => {
        try { importFromXML(textArea.value(), mode); if (currentModalPanel) { currentModalPanel.remove(); currentModalPanel = null; } }
        catch (e) { errorMsg.html(e.message); errorMsg.show(); }
    };

    createButton('追加 (Add)').parent(footer).addClass('ui-btn').style('border-color', '#28a745').style('color', '#28a745').mousePressed(() => handleImport('add'));
    createButton('上書き (Overwrite)').parent(footer).addClass('ui-btn').addClass('ui-btn-danger').mousePressed(() => handleImport('overwrite'));
}