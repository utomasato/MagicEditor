let isPanning;
let panStart = {};
let isDragging;
let dragOffset;
let isRotating;
let rotateOffset;
let isAddRing;
let mousePos = {};
let selectRing;

function MouseDownEvent()
{
    const ClickObj = CheckMouseObject();
    switch (ClickObj[0])
    {
        case "menu":
        case "button":
            break;
        case "ring":
            selectRing = ClickObj[1][0];
            switch (ClickObj[1][1])
            {
                case "inner":
                    StartDragRing(selectRing, mousePos);
                    break;
                case "outer":
                    StartRotateRing(selectRing, mousePos);
                    break;
                case "ring":
                    break;
            }
            break;
        default :
            StartPan(GetMousePos());
    }
}

function MouseHoldEvent()
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

function MouseUpEvent()
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


