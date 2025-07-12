let config = {};
let cameraPos;
let zoomSize;
let isPanning;
let panStart = {};
let isDragging;
let dragOffset;
let isRotating;
let rotateOffset;
let isAddRing;
let rings = [];
let mousePos = {};
let selectRing;
let buttons = [];

function Start()
{
    let [width, height] = GetScreenSize();
    // タイトルの設定
    SetTitle("MagicEditor");
    SetMouseCursor('grab');       // つかめる
    
    config.bgColor = color(255, 255, 255);
    config.gridColor = color(128, 128, 128, 128);
    config.gridWidth = 100;
    config.menuHeight = 100;
    config.menuBgColor = color(55, 55, 55, 200);
    config.ringWidth = 40;
    config.minRingCircumference = 40;
    config.itemPadding = 3;
    config.sigilWidth = 7;
    config.sigilColor = color(0, 0, 0);
    config.sigilSize = 40;
    config.sigilLineWidth = 0.04;
    config.ringRotateHandleWidth = 20;
    
    buttons = [
        new Button(10, -10, 60, 40, color(200, 200, 200), {x: 0, y: 1}, {x: 0, y: 1}, "-", function(){ZoomOut();}),
        new Button(80, -10, 60, 40, color(200, 200, 200), {x: 0, y: 1}, {x: 0, y: 1}, "=", function(){ZoomReset();}),
        new Button(150, -10, 60, 40, color(200, 200, 200), {x: 0, y: 1}, {x: 0, y: 1}, "+", function(){ZoomIn();}),
        new Button(10, 10, 80, 80, color(255, 200, 200), {x: 0, y: 0}, {x: 0, y: 0}, "Add", function(){isAddRing = true;}),
    ];
    
    zoomSize = 1;
    cameraPos = {x: 0, y: 0};
    isPanning = false;
    panStart = {x: 0, y: 0};
    isDragging = false;
    dragOffset = {x: 0, y: 0};
    isRotating = false;
    isAddRing = false;
    
    mousePos = {x: 0, y: 0};
    
    selectRing = null;
    
    //test
    rings.push(new MagicRing({x: 100, y: 100}));
}

function Update()
{
    let [width, height] = GetScreenSize();
    mousePos = {
        x: (GetMouseX() - width/2)/zoomSize + cameraPos.x,
        y: (GetMouseY() - height/2)/zoomSize + cameraPos.y
    };
    
    // クリック・タッチ 開始
    if (CheckMouseDown() || CheckTouchStart())
    {
        const ClickObj = CheckMouseObject();
        // CheckButtons();
        switch (ClickObj[0])
        {
            case "menu":
            case "button":
                break;
            case "ring":
                selectRing = ClickObj[1][0];
                //console.log(ClickObj[1][1])
                switch (ClickObj[1][1])
                {
                    case "inner":
                        StartDragRing(selectRing, mousePos);
                        break;
                    case "outer":
                        StartRotateRing(selectRing, mousePos);
                }
                break;
            default :
                StartPan(GetMousePos());
        }
        
    }
    // クリック・タッチ 中
    else if (CheckMouse() || CheckTouch())
    {
        if (isAddRing)
        {
            if (!CheckMouseOnMenu()) // マウスがメニューから外れたら
            {
                selectRing = new MagicRing(mousePos);
                rings.push(selectRing);
                StartDragRing(selectRing, mousePos);
                isAddRing = false;
            }
        }
        else if (isDragging)
        {
            DragRing(selectRing, mousePos);
        }
        else if (isRotating)
        {
            RotateRing(selectRing, mousePos);
        }
        else if (isPanning) 
        {
            Pan(GetMousePos());
        }
    }
    // クリック・タッチ 終わり
    else if (CheckMouseUp() || CheckTouchEnded())
    {
        if (isDragging)
        {
            EndDragRing();
        }
        else if (isRotating)
        {
            EndRotateRing();
        }
        else if (isPanning)
        {
            EndPan();
        }
        isAddRing = false;
    }

    if (CheckKeyDown(Key.I))
    {
        ZoomIn();
    }
    if (CheckKeyDown(Key.O))
    {
        ZoomOut();
    }
    if (CheckKeyDown(Key.F))
    {
        ToggleFullScreen();
    }
}

function Draw()
{
    let [width, height] = GetScreenSize();

    Clear(color(255, 255, 255));
    DrawGrid();
    
    PushTransform();
    Translate(width/2, height/2);
    Scale(zoomSize);
    Translate(-cameraPos.x, -cameraPos.y);
    rings.forEach(ring => 
    {
       ring.Draw(); 
    });
    PopTransform();
    
    // メニュー表示
    FillRect(0, 0, width, config.menuHeight, config.menuBgColor);
    DrawButtons();

    // FPS表示
    DrawText(12, "FPS: " + GetFPSText(), width - 10, height - 10, color(0, 0, 0), RIGHT);
    //DrawText(12, "MausePos: (" + mousePos.x + ", " + mousePos.y + ")", width - 10, height - 30, color(0, 0, 0), RIGHT);
    //DrawText(12, "Pos: (" + cameraPos.x + ", " + cameraPos.y + ")", width - 10, height - 50, color(0,0,0), RIGHT);
    DrawText(12, "Size: " + zoomSize, width - 10, height - 30, color(0,0,0),RIGHT);
}

function OnResize()
{
    let [width, height] = GetScreenSize();
}

// グリッド描画
function DrawGrid()
{
    let [width, height] = GetScreenSize();
    const gw = config.gridWidth /　(2 ** floor(Math.log(zoomSize)/Math.log(2)));
    const xnum = width / gw / zoomSize;
    for (let i = Math.floor(-xnum / 2 + cameraPos.x / gw); i < Math.ceil(xnum / 2 + cameraPos.x / gw); i++)
    {
        const x = width/2 - (cameraPos.x - gw * i) * zoomSize;
        const w = i%5 ? 1 : 2;
        DrawLine(x, 0, x, height, config.gridColor, w);
    }
    const ynum = height / gw / zoomSize;
    for (let i = Math.floor(-ynum / 2 + cameraPos.y / gw); i < Math.ceil(ynum / 2 + cameraPos.y / gw); i++)
    {
        const y = height/2 - (cameraPos.y - gw * i) * zoomSize;
        const w = i%5 ? 1 : 2;
        DrawLine(0, y, width, y, config.gridColor, w);    
    }
}

// ---------------------------------------------
// マウスの位置に何があるか
// ---------------------------------------------
function CheckMouseObject()
{
    if (CheckButtons())
    {
        return ["button"];
    }
    if (CheckMouseOnMenu())
    {
        return ["menu"];
    }
    const ring = CheckMouseOnRing();
    if (ring)
    {
        return ["ring", ring];
    }
    
    return [null];
}

function CheckMouseOnRing()
{
    let hitRing;
    for (const ring of rings)
    {
        hitRing = ring.CheckPosIsOn(mousePos);
        if (hitRing) break;
    }
    return hitRing;
}

function CheckMouseOnMenu()
{
    if (GetMouseY() < config.menuHeight)
    {
        return true;
    }
    return false;
}

// ---------------------------------------------
// ボタン
// ---------------------------------------------
function DrawButtons()
{
    buttons.forEach (btn =>
    {
        btn.Draw();
    })
}

function CheckButtons()
{   
    let isbutton = false;
    buttons.forEach (btn =>
    {
        const result = btn.CheckPressed();
        if (result) isbutton = true;
    });
    return isbutton;
}



// ---------------------------------------------
// ズームインアウト
// ---------------------------------------------
function ZoomIn()
{
    zoomSize += 0.1;
    if (zoomSize > 5) zoomSize = 5;
}
function ZoomOut()
{
    zoomSize -= 0.1;
    if (zoomSize < 0.1) zoomSize = 0.1;
}
function ZoomReset()
{
    zoomSize = 1;
}

// ---------------------------------------------
// リングをドラッグして動かす
// ---------------------------------------------
function StartDragRing(ring, pos)
{
    isDragging = true;
    dragOffset.x = ring.pos.x - pos.x;
    dragOffset.y = ring.pos.y - pos.y; 
    console.log("StartDrag");  
}

function DragRing(ring, pos)
{
    if (!isDragging) return;
    ring.pos.x = pos.x + dragOffset.x;
    ring.pos.y = pos.y + dragOffset.y;
    console.log("Drag");
}

function EndDragRing()
{
    isDragging = false;
    console.log("EndDrag");
}

// ---------------------------------------------
// リングをドラッグして回す
// ---------------------------------------------
function StartRotateRing(ring, pos)
{
    isRotating = true;
    const mouseAngle = Math.atan2(pos.y - ring.pos.y, pos.x - ring.pos.x);
    rotateOffset = (ring.angle) - mouseAngle;
    console.log("StartRotate");
}

function RotateRing(ring, pos)
{
    if(!isRotating) return;
    const mouseAngle = Math.atan2(pos.y - ring.pos.y, pos.x - ring.pos.x);
    const newAngleRad = mouseAngle + rotateOffset;
    ring.angle = newAngleRad;
    console.log("Rotate");
}

function EndRotateRing()
{
    isRotating = false;
    console.log("EndRotate");
}

// ---------------------------------------------
// 描画範囲を移動させる
// ---------------------------------------------
function StartPan(mousePos)
{
    isPanning = true;
    panStart = mousePos;
    SetMouseCursor('grabbing');
    console.log("panStart");
}

function Pan(mousePos)
{
    if (!isPanning) return;
    const dx = mousePos.x - panStart.x;
    const dy = mousePos.y - panStart.y;
    cameraPos.x -= dx / zoomSize;
    cameraPos.y -= dy / zoomSize;
    panStart = mousePos;
    console.log("pan");
}

function EndPan()
{
    if (!isPanning) return;
    isPanning = false;
    SetMouseCursor('grab');
    console.log("panEnd");
}


