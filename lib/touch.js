let touchFlag = false;
let touchFlagPrev = false;

let isLongPressStateFixed = false; // 長押しされているかどうかが確定している
let pressTime = 0; // 継続されて推されている時間
let longPressFlag = false; // 長押しされているかどうか
let pressStartPos = {x:0,y:0};

// タッチされた時
function touchStarted() {
    touchFlag = true;
}    

// タッチが話された時
function touchEnded() {
    touchFlag = false;
}

// タッチ：押されている間
function CheckTouch()
{
    return touchFlag && touchFlagPrev;
}

// タッチ：今フレームで押された
function CheckTouchStart()
{
    return touchFlag && !touchFlagPrev;
}

// タッチ：今フレームで離された
function CheckTouchEnded()
{
    return !touchFlag && touchFlagPrev;
}
