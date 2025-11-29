const kResizeDebounceTime = 100; // ミリ秒
const kFPSUpdateDuration = 20;

let canvas;
let resizeTimeout;
let lastResizeTime = 0;
let fpsUpdateCount = kFPSUpdateDuration;
let fpsStr = "";
let keyFlags = 0;
let keyFlagsPrev = 0;    // 前フレームの状態
let mouseFlag = false;
let mouseFlagPrev = false;

// DeltaTime関連の変数
let currentTime = 0;
let previousTime = 0;
let deltaTime = 0;

/*
function setup() {
    // 正確なビューポートサイズを取得
    let canvasWidth = window.innerWidth;
    let canvasHeight = window.innerHeight;
    
    canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent(document.body);

    // キャンバスのスタイルを明示的に設定
    canvas.style('display', 'block');
    canvas.style('position', 'fixed');
    canvas.style('top', '0');
    canvas.style('left', '0');
    canvas.style('z-index', '1');
    
    // pixelDensityを設定（Retinaディスプレイ対応）
    pixelDensity(displayDensity());
    
    // フレームレートの設定
    frameRate(60);

    // DeltaTime初期化
    currentTime = millis() / 1000.0;
    previousTime = currentTime;

    // ゲーム実装での初期化
    Start();
    
    // キャンバス情報の更新
    updateInfo();
}
*/

function setup() {
    // 1. 左側のコンテナ要素を取得します
    const p5Container = document.getElementById('p5-container');

    // 2. コンテナの現在のサイズに合わせてキャンバスを作成します
    let canvas = createCanvas(p5Container.offsetWidth, p5Container.offsetHeight);
    
    // 3. 作成したキャンバスを左側のコンテナの子要素として配置します
    canvas.parent('p5-container');

    // pixelDensityを設定（Retinaディスプレイ対応）
    pixelDensity(displayDensity());
    
    // フレームレートの設定
    frameRate(60);

    // DeltaTime初期化
    // ※もしp5.jsの機能だけでよければ、p5.jsにはdeltaTimeという組み込み変数があります
    currentTime = millis() / 1000.0;
    previousTime = currentTime;

    // ゲーム実装での初期化
    Start();
    
    // キャンバス情報の更新
    updateInfo();
}

function draw() {
    UpdateDeltaTime();
    UpdateFPS();
    Update();
    Draw();

    keyFlagsPrev = keyFlags;
    mouseFlagPrev = mouseFlag;
    touchFlagPrev = touchFlag; // 追加
}

function UpdateDeltaTime() {
    currentTime = millis() / 1000.0;
    deltaTime = currentTime - previousTime;
    
    // 異常に大きなdeltaTimeの場合は制限する（最大0.1秒 = 10FPS相当）
    // タブ切り替えなどで長時間停止した場合の対策
    if (deltaTime > 0.1) {
        deltaTime = 0.1;
    }
    
    previousTime = currentTime;
}

function UpdateFPS() {
    fpsUpdateCount++;
    if (fpsUpdateCount >= kFPSUpdateDuration) {
        fpsUpdateCount = 0;
        fpsStr = `${frameRate().toFixed(1)}`;
    }
}
/*
function windowResized() {
    let now = millis();
    
    // デバウンス処理（連続したリサイズイベントを制御）
    if (now - lastResizeTime < kResizeDebounceTime) {
        clearTimeout(resizeTimeout);
    }
    
    resizeTimeout = setTimeout(() => {
        handleResize();
    }, kResizeDebounceTime);
    
    lastResizeTime = now;
}

function handleResize() {
    // 正確なビューポートサイズでリサイズ
    let newWidth = window.innerWidth;
    let newHeight = window.innerHeight;
    
    resizeCanvas(newWidth, newHeight);
    
    // 高DPI対応を再設定
    pixelDensity(displayDensity());

    // リサイズ時の対応の実装    
    OnResize();
    
    // 情報更新
    updateInfo();
}
*/
function windowResized() {
    let now = millis();
    if (now - lastResizeTime < kResizeDebounceTime) {
        clearTimeout(resizeTimeout);
    }
    resizeTimeout = setTimeout(() => {
        handleResize();
    }, kResizeDebounceTime);
    lastResizeTime = now;
}

function handleResize() {
    // ★★★ 修正箇所 ★★★
    // 1. 左側のコンテナ要素を取得します
    const p5Container = document.getElementById('p5-container');
    
    // 2. コンテナが存在すれば、そのサイズでキャンバスをリサイズします
    if (p5Container) {
        resizeCanvas(p5Container.offsetWidth, p5Container.offsetHeight);
    }

    // --- 以下は元のコードを維持 ---
    pixelDensity(displayDensity());
    if (typeof OnResize === 'function') {
        OnResize(); // OnResize関数があれば呼び出す
    }
    updateInfo();
}

function updateInfo() {
    document.getElementById('canvas-size').textContent = `${width} × ${height}`;
    //document.getElementById('window-size').textContent = `${window.innerWidth} × ${window.innerHeight}`;
    document.getElementById('pixel-ratio').textContent = displayDensity();
    //document.getElementById('orientation').textContent = getOrientation();
}

function getOrientation() {
    if (width > height) {
        return 'Landscape';
    } else if (width < height) {
        return 'Portrait';
    } else {
        return 'Square';
    }
}

// マウス/タッチ
function mousePressed() {
    mouseFlag = true;
}    

function mouseReleased() {
    mouseFlag = false;
}

// キーボードショートカット
function keyPressed() {
    const upper = key.toUpperCase();
    if (Key[upper] !== undefined) {
        keyFlags |= Key[upper]; // ビットを立てる
    } else {
        switch (keyCode) {
        case 32:
            keyFlags |= Key.Space;
            break;
        case LEFT_ARROW:
            keyFlags |= Key.Left;
            break;
        case UP_ARROW:
            keyFlags |= Key.Up;
            break;
        case RIGHT_ARROW:
            keyFlags |= Key.Right;
            break;
        case DOWN_ARROW:
            keyFlags |= Key.Down;
            break;
        }
    }
}

function keyReleased() {
    const upper = key.toUpperCase();
    if (Key[upper] !== undefined) {
        keyFlags &= ~Key[upper]; // ビットを下げる
    } else {
        switch (keyCode) {
        case 32:
            keyFlags &= ~Key.Space;
            break;
        case LEFT_ARROW:
            keyFlags &= ~Key.Left;
            break;
        case UP_ARROW:
            keyFlags &= ~Key.Up;
            break;
        case RIGHT_ARROW:
            keyFlags &= ~Key.Right;
            break;
        case DOWN_ARROW:
            keyFlags &= ~Key.Down;
            break;
        }
    }
}

// フルスクリーン変更時のイベント
document.addEventListener('fullscreenchange', () => {
    // フルスクリーン切り替え後にリサイズ処理
    setTimeout(() => {
        handleResize();
    }, 100);
});

// モバイルデバイスの画面回転対応
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        handleResize();
    }, 500); // 回転完了を待つ
});

// ページの可視性変更（タブ切り替え等）への対応
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        noLoop(); // 非表示時は描画停止
    } else {
        loop(); // 表示時は描画再開
    }
});