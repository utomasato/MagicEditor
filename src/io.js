/**
 * XMLエスケープが必要な文字を処理するヘルパー関数
 */
function escapeXML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

/**
 * リングやアイテムの情報をXML文字列に変換する
 * @param {RingItem} item - 対象のアイテム
 * @param {Map<MagicRing, number>} ringIdMap - リングとそのIDのマップ
 * @returns {string} - アイテムのXML文字列
 */
function itemToXML(item, ringIdMap) {
    if (!item) return '';

    let value = item.value;
    // Jointの場合、接続先のリングのIDを値として使用する
    if (item.type === 'joint' && item.value instanceof MagicRing) {
        value = ringIdMap.get(item.value);
        if (value === undefined) value = -1; // 念のため、見つからない場合は-1
    }

    let attributes = `type="${item.type}" value="${escapeXML(value)}"`;
    if (item.type === 'joint') {
        attributes += ` isExecute="${item.isExecute}"`;
    }
    // フィールドアイテム（親リングがない）の場合、座標も保存
    if (!item.parentRing) {
        attributes += ` x="${item.pos.x.toFixed(2)}" y="${item.pos.y.toFixed(2)}"`;
    }
    return `    <Item ${attributes} />\n`;
}


/**
 * リングの情報をXML文字列に変換する
 * @param {MagicRing} ring - 対象のリング
 * @param {Map<MagicRing, number>} ringIdMap - リングとそのIDのマップ
 * @returns {string} - リングのXML文字列
 */
function ringToXML(ring, ringIdMap) {
    const ringId = ringIdMap.get(ring);
    const ringType = ring.constructor.name; // MagicRing, ArrayRing, DictRing, TemplateRing

    // Markerがあれば属性に追加
    const markerAttr = ring.marker ? ` marker="${escapeXML(ring.marker)}"` : '';

    // TemplateRingの場合、magicプロパティを属性に追加
    let magicAttr = '';
    if (ringType === 'TemplateRing' && ring.magic) {
        magicAttr = ` magic="${escapeXML(ring.magic)}"`;
    }

    // ArrayRingの場合、visualEffectプロパティを属性に追加
    let visualEffectAttr = '';
    if (ringType === 'ArrayRing' && ring.visualEffect) {
        visualEffectAttr = ` visualEffect="${escapeXML(ring.visualEffect)}"`;
    }

    let xml = `  <Ring id="${ringId}" type="${ringType}" x="${ring.pos.x.toFixed(2)}" y="${ring.pos.y.toFixed(2)}" angle="${ring.angle.toFixed(4)}"${markerAttr}${magicAttr}${visualEffectAttr}>\n`;

    // コメントの保存
    if (ring.comments && Array.isArray(ring.comments)) {
        xml += `    <Comments>\n`;
        ring.comments.forEach(comment => {
            xml += `      <Comment text="${escapeXML(comment.text)}" angle1="${comment.angle1}" angle2="${comment.angle2}" />\n`;
        });
        xml += `    </Comments>\n`;
    }

    xml += `    <Items>\n`;
    ring.items.forEach(item => {
        xml += `  ` + itemToXML(item, ringIdMap);
    });
    xml += `    </Items>\n`;
    xml += `  </Ring>\n`;
    return xml;
}

/**
 * 現在の魔法陣のレイアウト全体をXML形式で書き出す
 */
function exportToXML() {
    // 1. 各リングに一意のIDを割り振る
    const ringIdMap = new Map();
    rings.forEach((ring, index) => {
        ringIdMap.set(ring, index);
    });

    const startRingId = startRing ? ringIdMap.get(startRing) : -1;

    // 2. XML文字列の構築を開始
    let xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlString += `<MagicCircleLayout startRingId="${startRingId}">\n`;

    // 3. すべてのリングをXMLに変換
    xmlString += ' <Rings>\n';
    rings.forEach(ring => {
        xmlString += ringToXML(ring, ringIdMap);
    });
    xmlString += ' </Rings>\n';

    // 4. どのリングにも属していないアイテム（フィールドアイテム）をXMLに変換
    xmlString += ' <FieldItems>\n';
    fieldItems.forEach(item => {
        xmlString += itemToXML(item, ringIdMap);
    });
    xmlString += ' </FieldItems>\n';

    xmlString += '</MagicCircleLayout>\n';

    // 5. 生成したXML文字列をモーダルパネルで表示
    showXMLPanel(xmlString);
}

/**
 * XML文字列から魔法陣のレイアウトを復元する
 * @param {string} xmlString - インポートするXML文字列
 * @param {('overwrite'|'add')} mode - 'overwrite'は既存を全削除、'add'は追加
 */
function importFromXML(xmlString, mode) {
    if (!xmlString) {
        throw new Error("XML content is empty.");
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        throw new Error("Invalid XML format.");
    }

    const layoutElement = xmlDoc.getElementsByTagName('MagicCircleLayout')[0];
    const startRingId = layoutElement ? layoutElement.getAttribute('startRingId') : null;

    if (mode === 'overwrite') {
        rings = [];
        fieldItems = [];
    }

    const ringElements = xmlDoc.getElementsByTagName('Ring');
    const tempRingMap = new Map(); // XMLのIDと新しいRingインスタンスを紐付ける
    const allNewJoints = []; // 作成したJointをすべて一時保存

    // --- ステップ1: すべてのリングインスタンスを先に生成 ---
    for (const ringEl of ringElements) {
        const id = ringEl.getAttribute('id');
        const type = ringEl.getAttribute('type');
        const x = parseFloat(ringEl.getAttribute('x'));
        const y = parseFloat(ringEl.getAttribute('y'));
        const angle = parseFloat(ringEl.getAttribute('angle'));
        const marker = ringEl.getAttribute('marker'); // マーカー属性の読み込み
        const magic = ringEl.getAttribute('magic');   // magic属性の読み込み (TemplateRing用)
        const visualEffect = ringEl.getAttribute('visualEffect'); // visualEffect属性の読み込み (ArrayRing用)

        let newRing;
        switch (type) {
            case 'ArrayRing':
                newRing = new ArrayRing({ x, y });
                if (visualEffect) newRing.visualEffect = visualEffect; // visualEffectがあれば設定
                break;
            case 'DictRing':
                newRing = new DictRing({ x, y });
                break;
            case 'TemplateRing':
                newRing = new TemplateRing({ x, y });
                if (magic) newRing.magic = magic; // magic属性があれば設定
                break;
            case 'MagicRing':
            default:
                newRing = new MagicRing({ x, y });
                break;
        }

        newRing.angle = angle;
        if (marker) newRing.marker = marker; // マーカーを設定

        // コメントの読み込み
        // XMLにCommentsタグがある場合は、デフォルトのコメントをクリアしてXMLの内容で上書きする
        const commentsEl = ringEl.querySelector('Comments');
        if (commentsEl) {
            newRing.comments = []; // 初期化
            const commentEls = commentsEl.children;
            for (const cEl of commentEls) {
                if (cEl.tagName === 'Comment') {
                    newRing.comments.push({
                        text: cEl.getAttribute('text') || "",
                        angle1: parseFloat(cEl.getAttribute('angle1')) || 0,
                        angle2: parseFloat(cEl.getAttribute('angle2')) || 0
                    });
                }
            }
        }

        newRing.items = []; // デフォルトのアイテムを一旦クリア

        rings.push(newRing);
        tempRingMap.set(id, newRing);
    }

    const createItemFromElement = (itemEl, parentRing) => {
        const type = itemEl.getAttribute('type');
        let value = itemEl.getAttribute('value');
        const x = parseFloat(itemEl.getAttribute('x'));
        const y = parseFloat(itemEl.getAttribute('y'));

        // 型に応じて値を変換
        if (type === 'chars' && !isNaN(parseFloat(value))) {
            value = value; // Keep as string for now, ps interpreter handles it
        }

        let newItem;
        switch (type) {
            case 'sigil': newItem = new Sigil(x, y, value, parentRing); break;
            case 'chars': newItem = new Chars(x, y, value, parentRing); break;
            case 'string_token': newItem = new StringToken(x, y, value, parentRing); break;
            case 'name': newItem = new Name(x, y, value, parentRing); break;
            case 'joint':
                // Jointの接続先(value)は後のステップで解決する
                newItem = new Joint(x, y, value, parentRing);
                const isExecuteAttr = itemEl.getAttribute('isExecute');
                if (isExecuteAttr === 'true') {
                    newItem.isExecute = true;
                } else {
                    newItem.isExecute = false; // デフォルトは false
                }
                allNewJoints.push(newItem); // 解決待ちリストに追加
                break;
            default: return null;
        }
        return newItem;
    };

    // --- ステップ2: 各リングにアイテムを追加 ---
    for (const ringEl of ringElements) {
        const id = ringEl.getAttribute('id');
        const ringInstance = tempRingMap.get(id);
        if (!ringInstance) continue;

        const itemElements = ringEl.querySelector('Items').children;
        for (const itemEl of itemElements) {
            const newItem = createItemFromElement(itemEl, ringInstance);
            if (newItem) {
                ringInstance.items.push(newItem);
            }
        }
    }

    // --- ステップ3: フィールドアイテムを追加 ---
    const fieldItemElements = xmlDoc.querySelector('FieldItems')?.children;
    if (fieldItemElements) {
        for (const itemEl of fieldItemElements) {
            const newItem = createItemFromElement(itemEl, null);
            if (newItem) {
                newItem.pos = { x: parseFloat(itemEl.getAttribute('x')), y: parseFloat(itemEl.getAttribute('y')) };
                fieldItems.push(newItem);
            }
        }
    }

    // --- ステップ4: すべてのJointの接続先を解決 ---
    allNewJoints.forEach(joint => {
        const ringId = joint.value; // この時点ではvalueはID文字列
        const connectedRing = tempRingMap.get(String(ringId));
        if (connectedRing) {
            joint.value = connectedRing;
        } else {
            joint.value = null; // 対応するリングが見つからない場合
        }
    });

    // --- ステップ5: 開始リングを設定 ---
    if (startRing) {
        startRing.isStartPoint = false; // Reset old start ring flag
    }
    startRing = null;

    if (startRingId !== null && tempRingMap.has(startRingId)) {
        startRing = tempRingMap.get(startRingId);
    }

    // Fallback if start ring not found or not specified
    if (!startRing && rings.length > 0) {
        // Find a suitable start ring or default to the first one
        startRing = rings.find(r => isRingStartable(r)) || rings[0];
    }

    // Set the start point flag
    if (startRing) {
        rings.forEach(r => r.isStartPoint = (r === startRing));
    }


    // --- ステップ6: すべてのリングのレイアウトを再計算 ---
    rings.forEach(ring => ring.CalculateLayout());
}