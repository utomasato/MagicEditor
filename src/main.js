let config = {};
let cameraPos;
let zoomSize;
let isPanning;
let panStart = {};
let rings = [];
let mousePos = {};

function Start()
{
    let [width, height] = GetScreenSize();
    // タイトルの設定
    SetTitle("nm-canvas");
    SetMouseCursor('grab');       // つかめる
    
    config.sigilColor = color(0,0,0);
    config.sigilSize = 10;
    config.sigilLineWidth = 0.04;
    config.gridColor = color(128,128,128,128);
    config.gridWidth = 100;
    
    zoomSize = 1;
    cameraPos = {x: 0, y: 0};
    isPanning = false;
    panStart = {x: 0, y:0};
    
    let mousePos= {x: 0, y: 0};
    
    rings.push(new MagicRing({x: 0, y: 0}));
    rings.push(new MagicRing({x: 100, y: 100}));
}

function Update()
{
    let [width, height] = GetScreenSize();
    if (CheckMouseDown())
    {
        StartPan(GetMousePos());
    }
    if (CheckMouse() )
    {
        Pan(GetMousePos());
    }
    if (CheckMouseUp() )
    {
        EndPan();
    }
    if (CheckKeyDown(Key.I))
    {
        ZoomIn();
    }
    if (CheckKeyDown(Key.O))
    {
        ZoomOut();
    }
    mousePos = {
        x: (GetMouseX() - width/2)/zoomSize + cameraPos.x,
        y: (GetMouseY() - height/2)/zoomSize + cameraPos.y
    };
    
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
    
    // FPS表示
    DrawText(12, "FPS: " + GetFPSText(), width - 10, height - 10, color(0, 0, 0), RIGHT);
    DrawText(12, "MausePos: (" + mousePos.x + ", " + mousePos.y + ")", width - 10, height - 30, color(0, 0, 0), RIGHT);
    DrawText(12, "Pos: (" + cameraPos.x + ", " + cameraPos.y + ")", width - 10, height - 50, color(0,0,0), RIGHT);
    DrawText(12, "Size: " + zoomSize, width - 10, height - 70, color(0,0,0),RIGHT);
    //console.log("Hello");
}

function OnResize()
{
    let [width, height] = GetScreenSize();
}

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

function ZoomIn()
{
    zoomSize += 0.1;
}
function ZoomOut()
{
    zoomSize -= 0.1;
    if (zoomSize < 0.1) zoomSize = 0.1;
}

function StartPan(mousePos)
{
    isPanning = true;
    panStart = mousePos;
    SetMouseCursor('grabbing');
    console.log("hello");
}

function Pan(mousePos)
{
    if (!isPanning) return;
    const dx = mousePos.x - panStart.x;
    const dy = mousePos.y - panStart.y;
    cameraPos.x -= dx / zoomSize;
    cameraPos.y -= dy / zoomSize;
    panStart = mousePos;
}

function EndPan()
{
    isPanning = false;
    SetMouseCursor('grab');
}


