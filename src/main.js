let config;
const colorsDict = {
    black: "0.0 0.0 0.0", white: "1.0 1.0 1.0", red: "1.0 0.0 0.0", green: "0.0 1.0 0.0",
    blue: "0.0 0.0 1.0", yellow: "1.0 1.0 0.0", cyan: "0.0 1.0 1.0", magenta: "1.0 0.0 1.0",
    gray: "0.5 0.5 0.5", orange: "1.0 0.5 0.0", purple: "0.5 0.0 0.5", brown: "0.6 0.4 0.2"
};
let cameraPos;
let zoomSize;
let rings = [];
let fieldItems = [];
let buttons = [];
let staticButtons = []; // 追加: 静的なボタンを保持
let cursormode = "grad";
let debugMode;
let isUIHidden;
let screenshotRequest = false;
let globalIsClockwise = false;
let startRing = null;

// =============================================
// 入力と状態管理のためのグローバル変数
// (他のファイルから参照されます)
// =============================================
let inputMode;
let panStart = {};
let dragOffset;
let rotateOffset;
let AddObjectMode = "";
let mousePos = {};
let selectRing;
let draggingItem = {};
let lastPressedButton = null;
let currentUiPanel = null;
let currentModalPanel = null; // モーダルパネル(Import/Export)を管理
let currentInputElement = null;
let currentSelectElement = null;
let editingItem = null;

let interpreters = {};    // すべてのインタープリタのインスタンスを保持
let activeInterpreter;    // 現在アクティブなインタープリタ

let consolePanel = null;
let consoleText = null;

let isDraggingConsole = false;
let consoleDragOffset = { x: 0, y: 0 };
let isResizingConsole = false;


/**
 * インタープリタのスタック配列をコンソール表示用にフォーマットします。
 * @param {Array} stack フォーマット対象のスタック配列
 * @returns {string} フォーマット後の文字列
 */

function formatStackForDisplay(stack) {
    // 1. スタックが配列でない、または空である場合は、安全なメッセージを返す
    if (!Array.isArray(stack) || stack.length === 0) {
        return '[]';
    }

    // 2. スタックの各要素に対して、activeInterpreterのformatForOutputを呼び出して文字列に変換する
    //    .map()は必ず配列に対して呼び出す
    const formattedItems = stack.map(item => {
        try {
            // activeInterpreterとformatForOutputが存在することを確認してから呼び出す
            if (activeInterpreter && typeof activeInterpreter.formatForOutput === 'function') {
                return activeInterpreter.formatForOutput(item);
            }
            return '[Interpreter Error]';
        } catch (e) {
            // 万が一、formatForOutput内でエラーが発生した場合も安全に処理を続ける
            return `[Formatting Error: ${e.message}]`;
        }
    });

    // 3. 整形後の文字列配列を、改行で連結して返す
    return `[${formattedItems.join(', ')}]`;
}

/**
 * Checks if a ring can be set as the starting point.
 * @param {MagicRing} targetRing The ring to check.
 * @returns {boolean} True if the ring can be a start point, false otherwise.
 */
function isRingStartable(targetRing) {
    // Must be a MagicRing, not ArrayRing or DictRing
    if (!targetRing || (targetRing.constructor.name !== 'MagicRing' && targetRing.constructor.name !== 'TemplateRing')) {
        return false;
    }

    // Must not be connected from another ring
    for (const r of rings) {
        for (const item of r.items) {
            if (item && item.type === 'joint' && item.value === targetRing) {
                return false; // Found a connection to this ring
            }
        }
    }
    return true; // Conditions met
}


function Start() {
    debugMode = false;
    isUIHidden = false;

    interpreters['postscript'] = new PostscriptInterpreter();
    interpreters['lisp'] = new LispInterpreter();
    activeInterpreter = interpreters['postscript'];

    let [width, height] = GetScreenSize();
    SetTitle("MagicEditor");
    SetMouseCursor('grab');

    config = {
        bgColor: color(255, 255, 255),
        gridColor: color(200, 200, 200, 100),
        gridWidth: 100,
        menuHeight: 55,
        menuBgColor: color(55, 55, 55, 200),
        ringWidth: 45,
        arrayWidth: 30,
        minRingCircumference: 50,
        minArrayCircumference: 40,
        itemPadding: 2,
        sigilWidth: 7,
        charSpacing: 0.2,
        charWidth: 1.5,
        jointWidth: 2,
        fontSize: 15,
        fontColor: color(0, 0, 0),
        sigilSize: 40,
        sigilColor: color(0, 0, 0),
        sigilLineWidth: 0.04,
        stringSideWidth: 2,
        nameObjectMinWidth: 8,
        ringRotateHandleWidth: 20,
    };

    staticButtons = [
        new Button(10, 10, 40, 40,
            () => { return AddObjectMode == "ring" ? color(128, 100, 100) : color(255, 200, 200); },
            { x: 0, y: 0 }, { x: 0, y: 0 }, 30, "ring", null,
            () => { AddObjectMode = AddObjectMode == "ring" ? "" : "ring"; }, true),
        new Button(55, 10, 40, 40,
            () => { return AddObjectMode == "sigil" ? color(128, 100, 100) : color(255, 200, 200); },
            { x: 0, y: 0 }, { x: 0, y: 0 }, 30, "sigil", null,
            () => { AddObjectMode = AddObjectMode == "sigil" ? "" : "sigil"; }, true),
        new Button(100, 10, 40, 40,
            () => { return AddObjectMode == "num" ? color(128, 100, 100) : color(255, 200, 200); },
            { x: 0, y: 0 }, { x: 0, y: 0 }, 30, "num", null,
            () => { AddObjectMode = AddObjectMode == "num" ? "" : "num"; }, true),
        new Button(145, 10, 40, 40,
            () => { return AddObjectMode == "str" ? color(128, 100, 100) : color(255, 200, 200); },
            { x: 0, y: 0 }, { x: 0, y: 0 }, 30, "string", null,
            () => { AddObjectMode = AddObjectMode == "str" ? "" : "str"; }, true),
        new Button(190, 10, 40, 40,
            () => { return AddObjectMode == "name" ? color(128, 100, 100) : color(255, 200, 200); },
            { x: 0, y: 0 }, { x: 0, y: 0 }, 30, "name", null,
            () => { AddObjectMode = AddObjectMode == "name" ? "" : "name"; }, true),
        new Button(235, 10, 40, 40,
            () => { return AddObjectMode == "tRing" ? color(128, 100, 100) : color(255, 200, 200); },
            { x: 0, y: 0 }, { x: 0, y: 0 }, 30, "tRing", null,
            () => { AddObjectMode = AddObjectMode == "tRing" ? "" : "tRing"; }, true),

        new Button(-5, 10, 40, 40,
            (instance) => { return instance.isPressed ? color(128, 100, 100) : color(255, 200, 200); },
            { x: 1, y: 0 }, { x: 1, y: 0 }, 17, "Run", color(0, 0, 0),
            () => {
                if (startRing) {
                    const data = { isActive: true, message: "Reset", name: null, value: 0, text: null };
                    sendJsonToUnity("JsReceiver", "ReceiveGeneralData", data);
                    const mpsCode = GenerateSpell(startRing);
                    console.log(mpsCode);
                    try {
                        const result = activeInterpreter.execute(mpsCode);
                        let consoleMessage = '';

                        if (result.output) {
                            consoleMessage += `Output:\n${result.output}\n\n`;
                            console.log(`Output:\n${result.output}`);
                        }
                        console.log("==================")
                        consoleMessage += `Final Stack:\n${formatStackForDisplay(result.stack)}`;
                        console.log(`Final Stack:\n${formatStackForDisplay(result.stack)}`);
                        console.log(`Final dictStack:\n${formatStackForDisplay(result.dictStack)}`)
                        updateConsolePanel(consoleMessage);
                    } catch (e) {
                        updateConsolePanel(`Execution Error:\n${e.message}`);
                        console.log(`Execution Error:\n${e.message}`);
                    }
                }
                console.log(activeInterpreter.stack);
            }),
        new Button(-140, 10, 70, 40,
            (instance) => { return instance.isPressed ? color(110, 110, 128) : color(220, 220, 255); },
            { x: 1, y: 0 }, { x: 1, y: 0 }, 17, "Import", color(0, 0, 0),
            () => { showXMLInputPanel(); }),
        new Button(-65, 10, 70, 40,
            (instance) => { return instance.isPressed ? color(100, 128, 110) : color(200, 255, 220); },
            { x: 1, y: 0 }, { x: 1, y: 0 }, 17, "Export", color(0, 0, 0),
            () => { exportToXML(); }),
        new Button(10, -10, 40, 40,
            (instance) => { return instance.isPressed ? color(100, 100, 100) : color(200, 200, 200); },
            { x: 0, y: 1 }, { x: 0, y: 1 }, 25, "-", color(0, 0, 0),
            () => { ZoomOut(); }),
        new Button(10, -55, 40, 40,
            (instance) => { return instance.isPressed ? color(100, 100, 100) : color(200, 200, 200); },
            { x: 0, y: 1 }, { x: 0, y: 1 }, 25, "=", color(0, 0, 0),
            () => { ZoomReset(); }),
        new Button(10, -100, 40, 40,
            (instance) => { return instance.isPressed ? color(100, 100, 100) : color(200, 200, 200); },
            { x: 0, y: 1 }, { x: 0, y: 1 }, 25, "+", color(0, 0, 0),
            () => { ZoomIn(); }),
        new Button(10, 60, 40, 40,
            () => { return cursormode == "grad" ? color(100, 100, 100) : color(200, 200, 200); },
            { x: 0, y: 0 }, { x: 0, y: 0 }, 17, "🖐️", color(0, 0, 0),
            () => { cursormode = "grad"; SetMouseCursor('grab'); }),
        new Button(55, 60, 40, 40,
            () => { return cursormode == "edit" ? color(100, 100, 100) : color(200, 200, 200); },
            { x: 0, y: 0 }, { x: 0, y: 0 }, 17, "🪶", color(0, 0, 0),
            () => { cursormode = "edit"; SetMouseCursor('default'); }),
        new Button(100, 60, 60, 40,
            (instance) => { return instance.isPressed ? color(100, 110, 128) : color(200, 220, 255); },
            { x: 0, y: 0 }, { x: 0, y: 0 }, 17, "Align", color(0, 0, 0),
            () => { if (startRing) { alignConnectedRings(startRing); } }),
        new Button(165, 60, 85, 40,
            (instance) => { return instance.isPressed ? color(100, 110, 128) : color(200, 220, 255); },
            { x: 0, y: 0 }, { x: 0, y: 0 }, 17, "Straight", color(0, 0, 0),
            () => { if (startRing) { StraightenConnectedJoints(startRing); } }),
        new Button(-10, 60, 40, 40,
            () => { return color(200, 200, 200); },
            { x: 1, y: 0 }, { x: 1, y: 0 }, 20, "👁️", color(0, 0, 0),
            () => { isUIHidden = true; }),
        new Button(-55, 60, 40, 40,
            (instance) => { return instance.isPressed ? color(100, 100, 100) : color(200, 200, 200); },
            { x: 1, y: 0 }, { x: 1, y: 0 }, 20, "📷", color(0, 0, 0),
            () => { isUIHidden = true; screenshotRequest = true; }),
        new Button(5, 105, 30, 15,
            () => { return color(0, 250, 0) },
            { x: 0, y: 0 }, { x: 0, y: 0 }, 12, "> Start", color(100, 100, 100),
            () => {
                if (startRing) { cameraPos.x = startRing.pos.x; cameraPos.y = startRing.pos.y; }
            }, false, false, LEFT),
    ];

    buttons = [...staticButtons];

    zoomSize = 1;
    cameraPos = { x: 0, y: 0 };

    InputInitialize();

    rings = [new MagicRing({ x: 0, y: 0 }),];
    //rings = [new TemplateRing({ x: 0, y: 0 }), ];
    if (rings.length > 0) {
        startRing = rings[0];
        startRing.isStartPoint = true;
    }

    createConsolePanel(); // ui.jsで定義された関数を呼び出す
}

function UpdateMarkerButtons() {
    buttons = [...staticButtons]; // 静的ボタンでリセット

    // マーカー付きリングを検索
    const markedRings = rings.filter(r => r.marker && r.marker.trim() !== "");

    // 必要であればソート（ここではマーカー名順）
    markedRings.sort((a, b) => a.marker.localeCompare(b.marker));

    let yPos = 125; // Startボタンの下から配置開始

    markedRings.forEach(ring => {
        buttons.push(
            new Button(5, yPos, 30, 15,
                () => { return color(0, 250, 0) },
                { x: 0, y: 0 }, { x: 0, y: 0 }, 12, "> " + ring.marker, color(100, 100, 100),
                () => {
                    cameraPos.x = ring.pos.x;
                    cameraPos.y = ring.pos.y;
                }, false, false, LEFT)
        );
        yPos += 20; // 次のボタンの位置
    });
}

function Update() {
    let [width, height] = GetScreenSize();

    UpdateMarkerButtons();

    mousePos = {
        x: (GetMouseX() - width / 2) / zoomSize + cameraPos.x,
        y: (GetMouseY() - height / 2) / zoomSize + cameraPos.y
    };

    // マウスイベント
    if (CheckMouseDown() || CheckTouchStart()) { MouseDownEvent(); }
    else if (CheckMouse() || CheckTouch()) { MouseHoldEvent(); }
    else if (CheckMouseUp() || CheckTouchEnded()) { MouseUpEvent(); }

    // デバッグボタン
    if (CheckKeyDown(Key.D)) { debugMode = !debugMode; } // デバッグボタン
    //if (CheckKeyDown(Key.H)) { globalIsClockwise = !globalIsClockwise; }
    // 入力モード ショートカット
    if (CheckKeyDown(Key.A)) { cursormode = "grad"; SetMouseCursor('grab'); }
    if (CheckKeyDown(Key.S)) { cursormode = "edit"; SetMouseCursor('default'); }
    // 追加 ショートカット    
    if (CheckKeyDown(Key.Q)) { staticButtons[0].Down(); }
    if (CheckKeyDown(Key.W)) { staticButtons[1].Down(); }
    if (CheckKeyDown(Key.E)) { staticButtons[2].Down(); }
    if (CheckKeyDown(Key.R)) { staticButtons[3].Down(); }
    if (CheckKeyDown(Key.T)) { staticButtons[4].Down(); }
    if (CheckKeyDown(Key.Y)) { staticButtons[5].Down(); }
}

function Draw() {
    let [width, height] = GetScreenSize();
    Clear(color(255, 255, 255));
    if (!isUIHidden) {
        DrawGrid();
    }

    PushTransform();
    Translate(width / 2, height / 2);
    Scale(zoomSize);
    Translate(-cameraPos.x, -cameraPos.y);
    rings.forEach(ring => { ring.Draw(); });
    fieldItems.forEach(item => { item.DrawByCanvas(); });
    PopTransform();

    if (draggingItem && draggingItem.item) { draggingItem.item.DrawByDrag(); }

    if (!isUIHidden) {
        FillRect(0, 0, width, config.menuHeight, config.menuBgColor);
        DrawButtons();
        DrawText(12, "FPS: " + GetFPSText(), width - 10, height - 10, color(0, 0, 0), RIGHT);
        DrawText(12, "Size: " + zoomSize, width - 10, height - 30, color(0, 0, 0), RIGHT);
        if (debugMode) {
            DrawText(12, "MousePos: (" + mousePos.x.toFixed(2) + ", " + mousePos.y.toFixed(2) + ")", width - 10, height - 50, color(0, 0, 0), RIGHT);
            DrawText(12, "CameraPos: (" + cameraPos.x.toFixed(2) + ", " + cameraPos.y.toFixed(2) + ")", width - 10, height - 70, color(0, 0, 0), RIGHT);
            DrawText(12, "AddObjectMode: (" + AddObjectMode + ")", width - 10, height - 90, color(0, 0, 0), RIGHT);
            DrawText(12, "CursorMode: (" + cursormode + ")", width - 10, height - 110, color(0, 0, 0), RIGHT);
        }
    }
    else if (screenshotRequest) {
        saveCanvas('MagicCircle.png'); // 画像を保存
        screenshotRequest = false;     // リクエストフラグをリセット
        isUIHidden = false;            // UIを再表示
    }
}

function OnResize() { }

function DrawGrid() {
    let [width, height] = GetScreenSize();
    const gw = config.gridWidth / (2 ** floor(Math.log(zoomSize) / Math.log(2)));
    const xnum = width / gw / zoomSize;
    for (let i = Math.floor(-xnum / 2 + cameraPos.x / gw); i < Math.ceil(xnum / 2 + cameraPos.x / gw); i++) {
        const x = width / 2 - (cameraPos.x - gw * i) * zoomSize;
        const w = i % 5 ? 1 : 2;
        DrawLine(x, 0, x, height, config.gridColor, w);
    }
    const ynum = height / gw / zoomSize;
    for (let i = Math.floor(-ynum / 2 + cameraPos.y / gw); i < Math.ceil(ynum / 2 + cameraPos.y / gw); i++) {
        const y = height / 2 - (cameraPos.y - gw * i) * zoomSize;
        const w = i % 5 ? 1 : 2;
        DrawLine(0, y, width, y, config.gridColor, w);
    }
}

function ZoomIn() { zoomSize = min(5, zoomSize * 1.2); }
function ZoomOut() { zoomSize = zoomSize / 1.2; }
function ZoomReset() { zoomSize = 1; }

function updateConsolePanel(message) {
    if (consoleText) {
        // テキスト内の改行文字(\n)をHTMLの<br>タグに変換して表示
        consoleText.html(message.replace(/\n/g, '<br>'));
    }
}

function setInterpreter(name) {
    if (interpreters[name]) {
        activeInterpreter = interpreters[name];
        updateConsolePanel(`Interpreter switched to: ${name}`);
    } else {
        console.error(`Interpreter not found: ${name}`);
    }
}

function CommitMagicSpell() {
    const magicSpell = GenerateSpell(startRing);
    const data = {
        isActive: true,
        message: "MagicSpell",
        value: 0,
        text: magicSpell,
    };
    sendJsonToUnity('JsReceiver', 'ReceiveGeneralData', data);
}

function GenerateSpell(ringToStart) {
    if (ringToStart) {
        const spell = ringToStart.Spell();
        // return spell;
        return spell.slice(1, -1) // 一番外側の{}を外す
    }
    return "";
}