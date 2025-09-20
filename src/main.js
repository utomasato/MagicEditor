let config = {};
let cameraPos;
let zoomSize;
let rings = [];
let fieldItems = [];
let buttons = [];
let cursormode = "grad";
let debugMode;
let isUIHidden;
let screenshotRequest = false;
let globalIsClockwise = false;

// =============================================
// 入力と状態管理のためのグローバル変数
// (他のファイルから参照されます)
// =============================================
let isPanning;
let panStart = {};
let isDragging;
let dragOffset;
let isRotating;
let rotateOffset;
let isAddRing;
let isAddSigil;
let isAddNum;
let isAddStr;
let isAddName;
let isAddArrayRing;
let isAddDictRing;
let mousePos = {};
let selectRing;
let isItemDragging;
let draggingItem = {};
let currentUiPanel = null;
let currentInputElement = null;
let currentSelectElement = null;
let editingItem = null;
let isFinishingText = false;

// --- ▼▼▼ ここから追加 ▼▼▼ ---
let interpreters = {};    // すべてのインタープリタのインスタンスを保持
let activeInterpreter;    // 現在アクティブなインタープリタ

let consolePanel = null;
let consoleText = null;

let isDraggingConsole = false;
let consoleDragOffset = { x: 0, y: 0 };
let isResizingConsole = false;
// --- ▲▲▲ ここまで ▲▲▲ ---


function Start() {
    debugMode = false;
    isUIHidden = false;

    // --- ▼▼▼ ここから追加 ▼▼▼ ---
    interpreters['postscript'] = new PostscriptInterpreter();
    interpreters['lisp'] = new LispInterpreter();
    activeInterpreter = interpreters['postscript']; 
    // --- ▲▲▲ ここまで ▲▲▲ ---

    let [width, height] = GetScreenSize();
    SetTitle("MagicEditor");
    SetMouseCursor('grab');

    config = {
        bgColor: color(255, 255, 255),
        gridColor: color(200, 200, 200, 100),
        gridWidth: 100,
        menuHeight: 70,
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

    buttons = [
        new Button(10, 10, 50, 50, color(255, 200, 200), { x: 0, y: 0 }, { x: 0, y: 0 }, "ring", function () { isAddRing = true; }),
        new Button(70, 10, 50, 50, color(255, 200, 200), { x: 0, y: 0 }, { x: 0, y: 0 }, "sigil", function () { isAddSigil = true; }),
        new Button(130, 10, 50, 50, color(255, 200, 200), { x: 0, y: 0 }, { x: 0, y: 0 }, "num", function () { isAddNum = true; }),
        new Button(190, 10, 50, 50, color(255, 200, 200), { x: 0, y: 0 }, { x: 0, y: 0 }, "str", function () { isAddStr = true; }),
        new Button(250, 10, 50, 50, color(255, 200, 200), { x: 0, y: 0 }, { x: 0, y: 0 }, "name", function () { isAddName = true; }),
        new Button(-10, 10, 50, 50, color(255, 200, 200), { x: 1, y: 0 }, { x: 1, y: 0 }, "▶️", function () {
                if (rings.length > 0) {
                const mpsCode = GenerateSpell(rings[0]);
                console.log(mpsCode);
                try {
                    const result = activeInterpreter.execute(mpsCode);
                    let consoleMessage = '';
                    
                    if (result.output) {
                        consoleMessage += `Output:\n${result.output}\n\n`;
                    }
                    consoleMessage += `Final Stack:\n[${result.stack.join(', ')}]`;
                    
                    updateConsolePanel(consoleMessage);
                } catch (e) {
                    updateConsolePanel(`Execution Error:\n${e.message}`);
                }
            }
        }),
        new Button(10, -10, 40, 40, color(200, 200, 200), { x: 0, y: 1 }, { x: 0, y: 1 }, "-", function () { ZoomOut(); }),
        new Button(10, -60, 40, 40, color(200, 200, 200), { x: 0, y: 1 }, { x: 0, y: 1 }, "=", function () { ZoomReset(); }),
        new Button(10, -110, 40, 40, color(200, 200, 200), { x: 0, y: 1 }, { x: 0, y: 1 }, "+", function () { ZoomIn(); }),
        new Button(10, -210, 40, 40, color(200, 200, 200), { x: 0, y: 1 }, { x: 0, y: 1 }, "👁️", function () { isUIHidden = true; }),
        new Button(10, -160, 40, 40, color(200, 200, 200), { x: 0, y: 1 }, { x: 0, y: 1 }, "📷", () => {
            isUIHidden = true;       // UIを非表示に設定
            screenshotRequest = true; // 次の描画フレームで撮影をリクエスト
        }),
        new Button(10, 80, 40, 40, color(200, 200, 200), { x: 0, y: 0 }, { x: 0, y: 0 }, "a", function () { cursormode = "grad"; SetMouseCursor('grab'); }),
        new Button(60, 80, 40, 40, color(200, 200, 200), { x: 0, y: 0 }, { x: 0, y: 0 }, "b", function () { cursormode = "default"; SetMouseCursor('default'); }),
        new Button(110, 80, 160, 40, color(200, 220, 255), { x: 0, y: 0 }, { x: 0, y: 0 }, "Align Rings", () => {
            if (rings.length > 0) {
                alignConnectedRings(rings[0]);
            }
        }),
        // --- ▼▼▼ ここから修正 ▼▼▼ ---
        new Button(-160, 10, 80, 50, color(220, 220, 255), { x: 1, y: 0 }, { x: 1, y: 0 }, "Import", () => {
            showXMLInputPanel();
        }),
        new Button(-70, 10, 80, 50, color(200, 255, 220), { x: 1, y: 0 }, { x: 1, y: 0 }, "Export", () => {
            exportToXML();
        }),
        
        // --- ▲▲▲ ここまで ▲▲▲ ---
    ];

    zoomSize = 1;
    cameraPos = { x: 0, y: 0 };

    InputInitialize();

    rings = [new MagicRing({ x: 0, y: 0 })];
    
    // --- ▼▼▼ ここから追加 ▼▼▼ ---
    createConsolePanel(); // ui.jsで定義された関数を呼び出す
    // --- ▲▲▲ ここまで ▲▲▲ ---
}

function Update() {
    let [width, height] = GetScreenSize();
    mousePos = {
        x: (GetMouseX() - width / 2) / zoomSize + cameraPos.x,
        y: (GetMouseY() - height / 2) / zoomSize + cameraPos.y
    };

    if (CheckMouseDown() || CheckTouchStart()) { MouseDownEvent(); }
    else if (CheckMouse() || CheckTouch()) { MouseHoldEvent(); }
    else if (CheckMouseUp() || CheckTouchEnded()) { MouseUpEvent(); }

    if (CheckKeyDown(Key.D)) { debugMode = !debugMode; }
}

function Draw() {
    let [width, height] = GetScreenSize();
    Clear(color(255, 255, 255));
    if (!isUIHidden)
    {
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

    if (!isUIHidden)
    {
        FillRect(0, 0, width, config.menuHeight, config.menuBgColor);
        DrawButtons();
        DrawText(12, "FPS: " + GetFPSText(), width - 10, height - 10, color(0, 0, 0), RIGHT);
        DrawText(12, "Size: " + zoomSize, width - 10, height - 30, color(0, 0, 0), RIGHT);
        if (debugMode) {
            DrawText(12, "MousePos: (" + mousePos.x.toFixed(2) + ", " + mousePos.y.toFixed(2) + ")", width - 10, height - 50, color(0, 0, 0), RIGHT);
            DrawText(12, "CameraPos: (" + cameraPos.x.toFixed(2) + ", " + cameraPos.y.toFixed(2) + ")", width - 10, height - 70, color(0, 0, 0), RIGHT);
        }
    }
    else if (screenshotRequest) 
    {
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

function ZoomIn() { zoomSize = min(5, zoomSize + 0.1); }
function ZoomOut() { zoomSize = max(0.1, zoomSize - 0.1); }
function ZoomReset() { zoomSize = 1; }

// --- ▼▼▼ ここから追加 ▼▼▼ ---
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
// --- ▲▲▲ ここまで ▲▲▲ ---

function CommitMagicSpell() {
    const magicSpell = GenerateSpell();
    const data = {
        isActive: true,
        message: "MagicSpell",
        value: 0,
        text: magicSpell,
    };
    sendJsonToUnity('JsReceiver', 'ReceiveGeneralData', data);
}

function GenerateSpell() {
    if (rings.length > 0) {
        const spell = rings[0].Spell();
        return spell;
    }
    return "";
}

