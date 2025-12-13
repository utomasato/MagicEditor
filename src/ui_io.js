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