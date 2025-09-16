let config = {};
let cameraPos;
let zoomSize;
let rings = [];
let fieldItems = [];
let buttons = [];
let cursormode = "grad";
let debugMode;
let globalIsClockwise = true;

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


function Start() {
    debugMode = false;

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
        new Button(-10, 10, 50, 50, color(255, 200, 200), { x: 1, y: 0 }, { x: 1, y: 0 }, "▶️", function () { CommitMagicSpell(); }),
        new Button(10, -10, 40, 40, color(200, 200, 200), { x: 0, y: 1 }, { x: 0, y: 1 }, "-", function () { ZoomOut(); }),
        new Button(10, -60, 40, 40, color(200, 200, 200), { x: 0, y: 1 }, { x: 0, y: 1 }, "=", function () { ZoomReset(); }),
        new Button(10, -110, 40, 40, color(200, 200, 200), { x: 0, y: 1 }, { x: 0, y: 1 }, "+", function () { ZoomIn(); }),
        new Button(10, 80, 40, 40, color(200, 200, 200), { x: 0, y: 0 }, { x: 0, y: 0 }, "a", function () { cursormode = "grad"; SetMouseCursor('grab'); }),
        new Button(10, 125, 40, 40, color(200, 200, 200), { x: 0, y: 0 }, { x: 0, y: 0 }, "b", function () { cursormode = "default"; SetMouseCursor('default'); }),
        new Button(10, 180, 160, 40, color(200, 220, 255), { x: 0, y: 0 }, { x: 0, y: 0 }, "Align Rings", () => {
            if (rings.length > 0) {
                alignConnectedRings(rings[0]);
            }
        }),
    ];

    zoomSize = 1;
    cameraPos = { x: 0, y: 0 };

    InputInitialize();

    // MPSコードに対応する魔法陣の構造を生成
    rings = [
        new MagicRing({ x: 0, y: 0 }),     // 0: NEW ROOT
        new DictRing({ x: 0, y: 0 }),      // 1: old root
        new DictRing({ x: 0, y: 0 }),      // 2: main
        new DictRing({ x: 0, y: 0 }),      // 3: emission
        new DictRing({ x: 0, y: 0 }),      // 4: shape
        new DictRing({ x: 0, y: 0 }),      // 5: colorOverLifetime
        new DictRing({ x: 0, y: 0 }),      // 6: rotationOverLifetime
        new DictRing({ x: 0, y: 0 }),      // 7: renderer
        new ArrayRing({ x: 0, y: 0 }),     // 8: startLifetime array
        new ArrayRing({ x: 0, y: 0 }),     // 9: startSize array
        new ArrayRing({ x: 0, y: 0 }),     // 10: startRotation array
        new DictRing({ x: 0, y: 0 }),      // 11: gradient object < ... >
        new ArrayRing({ x: 0, y: 0 }),     // 12: rotation (z) array
        new ArrayRing({ x: 0, y: 0 }),     // 13: colorKeys array [ [...] ]
        new ArrayRing({ x: 0, y: 0 }),     // 14: alphaKeys array [ [...] ]
        new ArrayRing({ x: 0, y: 0 }),     // 15: colorKey 1
        new ArrayRing({ x: 0, y: 0 }),     // 16: colorKey 2
        new ArrayRing({ x: 0, y: 0 }),     // 17: alphaKey 1
        new ArrayRing({ x: 0, y: 0 }),     // 18: alphaKey 2
        new ArrayRing({ x: 0, y: 0 }),     // 19: alphaKey 3
    ];
    rings[0].items.push(new Joint(0, 0, rings[1], rings[0]));
    rings[1].items.push(new Name(0, 0, "main", rings[1]));
    rings[1].items.push(new Joint(0, 0, rings[2], rings[1]));
    rings[1].items.push(new Name(0, 0, "emission", rings[1]));
    rings[1].items.push(new Joint(0, 0, rings[3], rings[1]));
    rings[1].items.push(new Name(0, 0, "shape", rings[1]));
    rings[1].items.push(new Joint(0, 0, rings[4], rings[1]));
    rings[1].items.push(new Name(0, 0, "colorOverLifetime", rings[1]));
    rings[1].items.push(new Joint(0, 0, rings[5], rings[1]));
    rings[1].items.push(new Name(0, 0, "rotationOverLifetime", rings[1]));
    rings[1].items.push(new Joint(0, 0, rings[6], rings[1]));
    rings[1].items.push(new Name(0, 0, "renderer", rings[1]));
    rings[1].items.push(new Joint(0, 0, rings[7], rings[1]));
    rings[2].items.push(new Name(0, 0, "startLifetime", rings[2]));
    rings[2].items.push(new Joint(0, 0, rings[8], rings[2]));
    rings[2].items.push(new Name(0, 0, "startSpeed", rings[2]));
    rings[2].items.push(new Chars(0, 0, "0.5", rings[2]));
    rings[2].items.push(new Name(0, 0, "startSize", rings[2]));
    rings[2].items.push(new Joint(0, 0, rings[9], rings[2]));
    rings[2].items.push(new Name(0, 0, "startRotation", rings[2]));
    rings[2].items.push(new Joint(0, 0, rings[10], rings[2]));
    rings[8].items.push(new Chars(0, 0, "0.5", rings[8]));
    rings[8].items.push(new Chars(0, 0, "1.0", rings[8]));
    rings[9].items.push(new Chars(0, 0, "0.2", rings[9]));
    rings[9].items.push(new Chars(0, 0, "0.4", rings[9]));
    rings[10].items.push(new Chars(0, 0, "0", rings[10]));
    rings[10].items.push(new Chars(0, 0, "360", rings[10]));
    rings[3].items.push(new Name(0, 0, "rateOverTime", rings[3]));
    rings[3].items.push(new Chars(0, 0, "50", rings[3]));
    rings[4].items.push(new Name(0, 0, "angle", rings[4]));
    rings[4].items.push(new Chars(0, 0, "5", rings[4]));
    rings[4].items.push(new Name(0, 0, "radius", rings[4]));
    rings[4].items.push(new Chars(0, 0, "0.0001", rings[4]));
    rings[5].items.push(new Name(0, 0, "gradient", rings[5]));
    rings[5].items.push(new Joint(0, 0, rings[11], rings[5]));
    rings[11].items.push(new Name(0, 0, "colorKeys", rings[11]));
    rings[11].items.push(new Joint(0, 0, rings[13], rings[11]));
    rings[11].items.push(new Name(0, 0, "alphaKeys", rings[11]));
    rings[11].items.push(new Joint(0, 0, rings[14], rings[11]));
    rings[13].items.push(new Joint(0, 0, rings[15], rings[13]));
    rings[13].items.push(new Joint(0, 0, rings[16], rings[13]));
    rings[15].items.push(new Chars(0, 0, "1.0", rings[15]));
    rings[15].items.push(new Chars(0, 0, "0.6", rings[15]));
    rings[15].items.push(new Chars(0, 0, "0.0", rings[15]));
    rings[15].items.push(new Chars(0, 0, "1.0", rings[15]));
    rings[15].items.push(new Chars(0, 0, "0.0", rings[15]));
    rings[16].items.push(new Chars(0, 0, "1.0", rings[16]));
    rings[16].items.push(new Chars(0, 0, "0.0", rings[16]));
    rings[16].items.push(new Chars(0, 0, "0.0", rings[16]));
    rings[16].items.push(new Chars(0, 0, "1.0", rings[16]));
    rings[16].items.push(new Chars(0, 0, "1.0", rings[16]));
    rings[14].items.push(new Joint(0, 0, rings[17], rings[14]));
    rings[14].items.push(new Joint(0, 0, rings[18], rings[14]));
    rings[14].items.push(new Joint(0, 0, rings[19], rings[14]));
    rings[17].items.push(new Chars(0, 0, "0.0", rings[17]));
    rings[17].items.push(new Chars(0, 0, "0.0", rings[17]));
    rings[18].items.push(new Chars(0, 0, "1.0", rings[18]));
    rings[18].items.push(new Chars(0, 0, "0.5", rings[18]));
    rings[19].items.push(new Chars(0, 0, "0.0", rings[19]));
    rings[19].items.push(new Chars(0, 0, "1.0", rings[19]));
    rings[6].items.push(new StringToken(0, 0, "z", rings[6]));
    rings[6].items.push(new Joint(0, 0, rings[12], rings[6]));
    rings[12].items.push(new Chars(0, 0, "-45", rings[12]));
    rings[12].items.push(new Chars(0, 0, "45", rings[12]));
    rings[7].items.push(new Name(0, 0, "materialName", rings[7]));
    rings[7].items.push(new StringToken(0, 0, "Fire_1", rings[7]));
    rings.forEach(ring => ring.CalculateLayout());
    alignConnectedRings(rings[0]);
}

function Update() {
    let [width, height] = GetScreenSize();
    mousePos = {
        x: (GetMouseX() - width / 2) / zoomSize + cameraPos.x,
        y: (GetMouseY() - height / 2) / zoomSize + cameraPos.y
    };

    // input.jsで定義された関数を呼び出す
    if (CheckMouseDown() || CheckTouchStart()) { MouseDownEvent(); }
    else if (CheckMouse() || CheckTouch()) { MouseHoldEvent(); }
    else if (CheckMouseUp() || CheckTouchEnded()) { MouseUpEvent(); }

    if (CheckKeyDown(Key.D)) { debugMode = !debugMode; }
}

function Draw() {
    let [width, height] = GetScreenSize();
    Clear(color(255, 255, 255));
    DrawGrid();

    PushTransform();
    Translate(width / 2, height / 2);
    Scale(zoomSize);
    Translate(-cameraPos.x, -cameraPos.y);
    rings.forEach(ring => { ring.Draw(); });
    fieldItems.forEach(item => { item.DrawByCanvas(); });
    PopTransform();

    if (draggingItem && draggingItem.item) { draggingItem.item.DrawByDrag(); }

    FillRect(0, 0, width, config.menuHeight, config.menuBgColor);
    DrawButtons(); // input.jsで定義
    DrawText(12, "FPS: " + GetFPSText(), width - 10, height - 10, color(0, 0, 0), RIGHT);
    DrawText(12, "Size: " + zoomSize, width - 10, height - 30, color(0, 0, 0), RIGHT);
    if (debugMode) {
        DrawText(12, "MousePos: (" + mousePos.x.toFixed(2) + ", " + mousePos.y.toFixed(2) + ")", width - 10, height - 50, color(0, 0, 0), RIGHT);
        DrawText(12, "CameraPos: (" + cameraPos.x.toFixed(2) + ", " + cameraPos.y.toFixed(2) + ")", width - 10, height - 70, color(0, 0, 0), RIGHT);
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
    // ルートリングのSpell()を呼び出す
    if (rings.length > 0) {
        const spell = rings[0].Spell();
        return spell;
    }
    return "";
}

