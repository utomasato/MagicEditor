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
    if (!targetRing || targetRing.constructor.name !== 'MagicRing') {
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

    buttons = [
        new Button(10, 10, 40, 40, color(255, 200, 200), { x: 0, y: 0 }, { x: 0, y: 0 }, 30, "ring", function () { AddObjectMode = "ring"; },true),
        new Button(55, 10, 40, 40, color(255, 200, 200), { x: 0, y: 0 }, { x: 0, y: 0 }, 30, "sigil", function () { AddObjectMode = "sigil"; },true),
        new Button(100, 10, 40, 40, color(255, 200, 200), { x: 0, y: 0 }, { x: 0, y: 0 }, 30, "num", function () { AddObjectMode = "num"; },true),
        new Button(145, 10, 40, 40, color(255, 200, 200), { x: 0, y: 0 }, { x: 0, y: 0 }, 30, "string", function () { AddObjectMode = "str"; },true),
        new Button(190, 10, 40, 40, color(255, 200, 200), { x: 0, y: 0 }, { x: 0, y: 0 }, 30, "name", function () { AddObjectMode = "name"; },true),
        new Button(-5, 10, 40, 40, color(255, 200, 200), { x: 1, y: 0 }, { x: 1, y: 0 }, 17, "Run", function () {
            if (startRing) {
                const data = {isActive: true, message: "Reset", name: null, value: 0, text: null};
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
        new Button(-150, 10, 80, 40, color(220, 220, 255), { x: 1, y: 0 }, { x: 1, y: 0 }, 17, "Import", () => {
            showXMLInputPanel();
        }),
        new Button(-65, 10, 80, 40, color(200, 255, 220), { x: 1, y: 0 }, { x: 1, y: 0 }, 17, "Export", () => {
            exportToXML();
        }),
        new Button(10, -10, 40, 40, color(200, 200, 200), { x: 0, y: 1 }, { x: 0, y: 1 }, 25, "-", function () { ZoomOut(); }),
        new Button(10, -55, 40, 40, color(200, 200, 200), { x: 0, y: 1 }, { x: 0, y: 1 }, 25, "=", function () { ZoomReset(); }),
        new Button(10, -100, 40, 40, color(200, 200, 200), { x: 0, y: 1 }, { x: 0, y: 1 }, 25, "+", function () { ZoomIn(); }),
        new Button(10, 60, 40, 40, color(200, 200, 200), { x: 0, y: 0 }, { x: 0, y: 0 }, 17, "🖐️", function () { cursormode = "grad"; SetMouseCursor('grab'); }),
        new Button(55, 60, 40, 40, color(200, 200, 200), { x: 0, y: 0 }, { x: 0, y: 0 }, 17, "🪶", function () { cursormode = "default"; SetMouseCursor('default'); }),
        new Button(100, 60, 65, 40, color(200, 220, 255), { x: 0, y: 0 }, { x: 0, y: 0 }, 17, "Align", () => {
            if (startRing) {
                alignConnectedRings(startRing);
            }
        }),
        new Button(-10, 60, 40, 40, color(200, 200, 200), { x: 1, y: 0 }, { x: 1, y: 0 }, 20, "👁️", function () { isUIHidden = true; }),
        new Button(-55, 60, 40, 40, color(200, 200, 200), { x: 1, y: 0 }, { x: 1, y: 0 }, 20, "📷", () => {
            isUIHidden = true;       // UIを非表示に設定
            screenshotRequest = true; // 次の描画フレームで撮影をリクエスト
        }),
    ];

    zoomSize = 1;
    cameraPos = { x: 0, y: 0 };

    InputInitialize();

    rings = [new MagicRing({ x: 0, y: 0 })];
    if (rings.length > 0) {
        startRing = rings[0];
        startRing.isStartPoint = true;
    }
    
    createConsolePanel(); // ui.jsで定義された関数を呼び出す
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
    if (CheckKeyDown(Key.H)) { globalIsClockwise = !globalIsClockwise; }
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

function ZoomIn() { zoomSize = min(5, zoomSize *1.2); }
function ZoomOut() { zoomSize = max(0.1, zoomSize /1.2); }
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
