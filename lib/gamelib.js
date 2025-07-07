// ============================================
//  キーボード入力処理
// ============================================

const Key = {};
'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((char, i) => {
    Key[char] = 1 << i;
});

// 特殊キー（A〜Zの次のビットを使う）
Key.Space = 1 << 26;
Key.Left  = 1 << 27;
Key.Up    = 1 << 28;
Key.Right = 1 << 29;
Key.Down  = 1 << 30;

function CheckKey(keyBit)
{
    return (keyFlags & keyBit) !== 0;
}

function CheckKeyDown(keyBit)
{
    return ((keyFlags & keyBit) !== 0) && ((keyFlagsPrev & keyBit) === 0);
}

function CheckKeyUp(keyBit)
{
    return ((keyFlags & keyBit) === 0) && ((keyFlagsPrev & keyBit) !== 0);
}


// ============================================
//  マウス入力処理
// ============================================

// マウス：押されている間
function CheckMouse()
{
    return mouseFlag;
}

// マウス：今フレームで押された
function CheckMouseDown()
{
    return mouseFlag && !mouseFlagPrev;
}

// マウス：今フレームで離された
function CheckMouseUp()
{
    return !mouseFlag && mouseFlagPrev;
}

// マウス座標取得
function GetMouseX()
{
    return mouseX;
}

function GetMouseY()
{
    return mouseY;
}

function GetMousePos()
{
    return { x: mouseX, y: mouseY };
}

// マウスカーソルを非表示にする
function HideMouseCursor()
{
    document.body.style.cursor = 'none';
}

// マウスカーソルを表示する
function ShowMouseCursor()
{
    document.body.style.cursor = 'default';
}

// カスタムカーソルを設定
//   基本的なカーソル
//      SetMouseCursor('default');    // 通常の矢印
//      SetMouseCursor('pointer');    // 手のポインタ
//      SetMouseCursor('text');       // テキスト選択
//      SetMouseCursor('wait');       // 待機（砂時計）
//      SetMouseCursor('crosshair');  // 十字線
//      SetMouseCursor('move');       // 移動
//      SetMouseCursor('not-allowed'); // 禁止
//   リサイズ用カーソル
//      SetMouseCursor('n-resize');   // 上下リサイズ
//      SetMouseCursor('e-resize');   // 左右リサイズ
//      SetMouseCursor('ne-resize');  // 右上左下リサイズ
//      SetMouseCursor('nw-resize');  // 左上右下リサイズ
//   その他
//      SetMouseCursor('help');       // ヘルプ
//      SetMouseCursor('grab');       // つかめる
//      SetMouseCursor('grabbing');   // つかんでいる
function SetMouseCursor(cursorType)
{
    document.body.style.cursor = cursorType;
}


// ============================================
//  時間関係の処理
// ============================================

function DeltaTime()
{
    return deltaTime;
}

function CurrentTime()
{
    return currentTime;
}


// ============================================
//  システム処理
// ============================================

function SetTitle(title)
{
    document.title = title;
}

function GetScreenSize()
{
    return [width, height];
}

function GetFPSText()
{
    return fpsStr;
}

function CaptureScreenImage(filename)
{
    saveCanvas(filename, 'png');
}

function ToggleFullScreen()
{
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Fullscreen error:', err);
        });
    } else {
        document.exitFullscreen();
    }
}


// ============================================
//  オーディオ処理
// ============================================

// 音声管理用の辞書
const audioCache = {};

// 音声ファイルを再生（キャッシュあり）
function PlaySound(filename, startTime = 0)
{
    try {
        let audio = audioCache[filename];
        
        // 初回読み込み時はキャッシュに追加
        if (!audio) {
            audio = new Audio("./assets/" + filename);
            audio.preload = 'auto';
            audioCache[filename] = audio;
        }
        
        // 既に再生中の場合は最初から再生
        if (!audio.paused) {
            audio.pause();
        }
        audio.currentTime = startTime;
        
        // ユーザーインタラクション後でないと再生できない場合のエラーハンドリング
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn(`Sound play failed for ${filename}:`, error.message);
            });
        }
        
        return true;
    } catch (error) {
        console.error(`Failed to play sound ${filename}:`, error);
        return false;
    }
}

// 音声が再生中かどうかチェック
function IsPlayingSound(filename)
{
    const audio = audioCache[filename];
    return audio ? !audio.paused && !audio.ended : false;
}

// 音声を一時停止
function PauseSound(filename)
{
    try {
        const audio = audioCache[filename];
        if (audio && !audio.paused) {
            audio.pause();
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Failed to pause sound ${filename}:`, error);
        return false;
    }
}

// 音声を停止（最初に戻す）
function StopSound(filename)
{
    try {
        const audio = audioCache[filename];
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Failed to stop sound ${filename}:`, error);
        return false;
    }
}

// 音声のボリューム設定（0.0-1.0）
function SetSoundVolume(filename, volume)
{
    try {
        // ボリュームを0.0-1.0の範囲に制限
        volume = Math.max(0.0, Math.min(1.0, volume));
        
        const audio = audioCache[filename];
        if (audio) {
            audio.volume = volume;
            return true;
        } else {
            // まだロードされていない場合は、プリロードしてボリュームを設定
            const newAudio = new Audio("./assets/" + filename);
            newAudio.preload = 'auto';
            newAudio.volume = volume;
            audioCache[filename] = newAudio;
            return true;
        }
    } catch (error) {
        console.error(`Failed to set volume for ${filename}:`, error);
        return false;
    }
}

// 全ての音声を停止
function StopAllSounds()
{
    try {
        Object.values(audioCache).forEach(audio => {
            if (audio && !audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
        return true;
    } catch (error) {
        console.error('Failed to stop all sounds:', error);
        return false;
    }
}

// 音声キャッシュをクリア（メモリ解放）
function ClearSoundCache()
{
    try {
        Object.values(audioCache).forEach(audio => {
            if (audio) {
                audio.pause();
                audio.src = '';
            }
        });
        
        // キャッシュをクリア
        Object.keys(audioCache).forEach(key => {
            delete audioCache[key];
        });
        
        return true;
    } catch (error) {
        console.error('Failed to clear sound cache:', error);
        return false;
    }
}


// ============================================
//  グラフィックス描画処理
// ============================================

function Clear(color)
{
    background(color);
}

function DrawLine(x0, y0, x1, y1, color, width = 1)
{
    stroke(color);
    strokeWeight(width);
    line(x0, y0, x1, y1);
}

function DrawCircle(cx, cy, radius, color, width = 1)
{
    strokeWeight(width);
    noFill();
    stroke(color);
    circle(cx, cy, radius * 2);
}

function FillCircle(cx, cy, radius, color)
{
    fill(color);
    noStroke();
    circle(cx, cy, radius * 2);
}

// 楕円の枠線を描画
function DrawEllipse(cx, cy, w, h, color, width = 1)
{
   strokeWeight(width);
   noFill();
   stroke(color);
   ellipse(cx, cy, w, h);
}

// 楕円を塗りつぶし
function FillEllipse(cx, cy, w, h, color)
{
   fill(color);
   noStroke();
   ellipse(cx, cy, w, h);
}

// 円弧・扇形の枠線を描画
function DrawArc(cx, cy, w, h, startAngle, endAngle, color, width = 1)
{
   strokeWeight(width);
   noFill();
   stroke(color);
   arc(cx, cy, w, h, startAngle, endAngle);
}

// 円弧・扇形を塗りつぶし
function FillArc(cx, cy, w, h, startAngle, endAngle, color)
{
   fill(color);
   noStroke();
   arc(cx, cy, w, h, startAngle, endAngle);
}

// 四角形の枠線を描画
function DrawRect(x, y, w, h, color, width = 1)
{
    strokeWeight(width);
    noFill();
    stroke(color);
    rect(x, y, w, h);
}

// 四角形を塗りつぶし
function FillRect(x, y, w, h, color)
{
    fill(color);
    noStroke();
    rect(x, y, w, h);
}

// 角丸四角形の枠線を描画
function DrawRoundRect(x, y, w, h, radius, color, width = 1)
{
   strokeWeight(width);
   noFill();
   stroke(color);
   rect(x, y, w, h, radius);
}

// 角丸四角形を塗りつぶし
function FillRoundRect(x, y, w, h, radius, color)
{
   fill(color);
   noStroke();
   rect(x, y, w, h, radius);
}

// 三角形の枠線を描画
function DrawTriangle(x1, y1, x2, y2, x3, y3, color, width = 1)
{
    strokeWeight(width);
    noFill();
    stroke(color);
    triangle(x1, y1, x2, y2, x3, y3);
}

// 三角形を塗りつぶし
function FillTriangle(x1, y1, x2, y2, x3, y3, color)
{
    fill(color);
    noStroke();
    triangle(x1, y1, x2, y2, x3, y3);
}

// グラデーション用のレンダーテクスチャキャッシュ
const gradientTextureCache = {};

// 水平グラデーションテクスチャを生成（キャッシュ付き、density対応）
function CreateGradientTextureH(w, h, c0, c1, cacheKey = null)
{
    // キャッシュキーが指定されていて、既にキャッシュがある場合
    if (cacheKey && gradientTextureCache[cacheKey]) {
        return gradientTextureCache[cacheKey];
    }
    
    let texture = createGraphics(w, h);
    
    // 現在のpixelDensityを取得してテクスチャにも適用
    let dpr = pixelDensity();
    texture.pixelDensity(dpr);
    
    texture.loadPixels();
    
    // 実際のピクセル配列のサイズ
    let actualW = w * dpr;
    let actualH = h * dpr;
    
    for (let x = 0; x < actualW; x++) {
        let inter = map(x, 0, actualW - 1, 0, 1);
        let c = lerpColor(c0, c1, inter);
        
        for (let y = 0; y < actualH; y++) {
            let index = (y * actualW + x) * 4;
            texture.pixels[index] = red(c);
            texture.pixels[index + 1] = green(c);
            texture.pixels[index + 2] = blue(c);
            texture.pixels[index + 3] = alpha(c);
        }
    }
    
    texture.updatePixels();
    
    // キャッシュに保存
    if (cacheKey) {
        gradientTextureCache[cacheKey] = texture;
    }
    
    return texture;
}

// 垂直グラデーションテクスチャを生成（キャッシュ付き、density対応）
function CreateGradientTextureV(w, h, c0, c1, cacheKey = null)
{
    if (cacheKey && gradientTextureCache[cacheKey]) {
        return gradientTextureCache[cacheKey];
    }
    
    let texture = createGraphics(w, h);
    
    let dpr = pixelDensity();
    texture.pixelDensity(dpr);
    
    texture.loadPixels();
    
    let actualW = w * dpr;
    let actualH = h * dpr;
    
    for (let y = 0; y < actualH; y++) {
        let inter = map(y, 0, actualH - 1, 0, 1);
        let c = lerpColor(c0, c1, inter);
        
        for (let x = 0; x < actualW; x++) {
            let index = (y * actualW + x) * 4;
            texture.pixels[index] = red(c);
            texture.pixels[index + 1] = green(c);
            texture.pixels[index + 2] = blue(c);
            texture.pixels[index + 3] = alpha(c);
        }
    }
    
    texture.updatePixels();
    
    if (cacheKey) {
        gradientTextureCache[cacheKey] = texture;
    }
    
    return texture;
}

// 最適化されたグラデーション四角形描画（density対応）
function FillRectGradientH(x, y, w, h, c0, c1)
{
    let dpr = pixelDensity();
    
    // 標準的なサイズのテクスチャを作成（pixel densityも考慮）
    let textureW = Math.min(256, Math.abs(w));
    let textureH = Math.min(256, Math.abs(h));
    
    let cacheKey = `h_${textureW}_${textureH}_${dpr}_${c0.toString()}_${c1.toString()}`;
    let gradientTexture = CreateGradientTextureH(textureW, textureH, c0, c1, cacheKey);
    
    // テクスチャを指定サイズで描画
    image(gradientTexture, x, y, w, h);
}

function FillRectGradientV(x, y, w, h, c0, c1)
{
    let dpr = pixelDensity();
    
    let textureW = Math.min(256, Math.abs(w));
    let textureH = Math.min(256, Math.abs(h));
    
    let cacheKey = `v_${textureW}_${textureH}_${dpr}_${c0.toString()}_${c1.toString()}`;
    let gradientTexture = CreateGradientTextureV(textureW, textureH, c0, c1, cacheKey);
    
    image(gradientTexture, x, y, w, h);
}

// レンズ形状を枠線描画
function DrawLensShape(cx, cy, width, height, color, strokeWidth = 1)
{
    stroke(color);
    strokeWeight(strokeWidth);
    noFill();
    
    beginShape();
    
    let leftX = cx - width/2;
    let rightX = cx + width/2;
    
    vertex(leftX, cy); // 左端
    
    // 上側の曲線（より急な立ち上がり）
    let steps = 20;
    for (let i = 1; i < steps; i++) {
        let t = i / steps;
        let x = lerp(leftX, rightX, t);
        let curve = sin(PI * t);
        let sharpening = pow(curve, 0.7); // 端を鋭くする
        let y = cy - height/2 * sharpening;
        vertex(x, y);
    }
    
    vertex(rightX, cy); // 右端
    
    // 下側の曲線
    for (let i = 1; i < steps; i++) {
        let t = i / steps;
        let x = lerp(rightX, leftX, t);
        let curve = sin(PI * t);
        let sharpening = pow(curve, 0.7);
        let y = cy + height/2 * sharpening;
        vertex(x, y);
    }
    
    endShape(CLOSE);
}

// レンズ形状を塗りつぶし
function FillLensShape(cx, cy, width, height, color)
{
    fill(color);
    noStroke();
    
    beginShape();
    
    let leftX = cx - width/2;
    let rightX = cx + width/2;
    
    vertex(leftX, cy); // 左端
    
    // 上側の曲線
    let steps = 25;
    for (let i = 1; i < steps; i++) {
        let t = i / steps;
        let x = lerp(leftX, rightX, t);
        let curve = sin(PI * t);
        let sharpening = pow(curve, 0.7);
        let y = cy - height/2 * sharpening;
        vertex(x, y);
    }
    
    vertex(rightX, cy); // 右端
    
    // 下側の曲線
    for (let i = 1; i < steps; i++) {
        let t = i / steps;
        let x = lerp(rightX, leftX, t);
        let curve = sin(PI * t);
        let sharpening = pow(curve, 0.7);
        let y = cy + height/2 * sharpening;
        vertex(x, y);
    }
    
    endShape(CLOSE);
}


// ============================================
//  テキスト描画処理
// ============================================

function DrawText(fontSize, str, x, y, color, align=LEFT)
{
    fill(color);
    noStroke();
    textFont("Menlo");
    textAlign(align, CENTER);
    textSize(fontSize);
    text(str, x, y);
}

// 絵文字を描画
function DrawEmoji(fontSize, emojiStr, x, y, angle = 0, flipped = false)
{
    // width = height = fontSize とする
    let width = fontSize;
    let height = fontSize;

    // 現在の描画状態を保存
    push();
    
    // 座標を移動
    translate(x, y);
    
    // 回転を適用
    if (angle !== 0) {
        rotate(angle);
    }
    
    // 反転を適用
    if (flipped) {
        scale(-1, 1);
    }
    
    // フォント設定
    textFont('"Apple Color Emoji", "Segoe UI Emoji"');
    
    // 基準となるフォントサイズを設定（例：48px）
    const baseFontSize = 48;
    textSize(baseFontSize);
    
    // 実際の文字サイズを測定
    const actualWidth = textWidth(emojiStr);
    const actualHeight = baseFontSize; // 大体フォントサイズと同じ
    
    // 目標サイズとの比率を計算
    const scaleX = width / actualWidth;
    const scaleY = height / actualHeight;
    
    // スケールを適用（アスペクト比を保持する場合は小さい方を使用）
    const finalScale = Math.min(scaleX, scaleY);
    scale(finalScale, finalScale);
    
    textAlign(CENTER, CENTER);
    fill(255, 255, 255, 255);
    noStroke();
    text(emojiStr, 0, 0);
    
    // 描画状態を復元
    pop();
}

// 絵文字の実際の描画サイズを取得（テキスト幅）
function GetEmojiWidth(emojiStr, fontSize)
{
    push();
    textFont('"Apple Color Emoji", "Segoe UI Emoji"');
    textSize(fontSize);
    const w = textWidth(emojiStr);
    pop();
    return w;
}


// ============================================
//  アフィン変換
// ============================================

// 変換行列の状態を保存
function PushTransform()
{
    push();
}

// 変換行列の状態を復元
function PopTransform()
{
    pop();
}

// 座標の移動
function Translate(x, y)
{
    translate(x, y);
}

// 回転（ラジアン）
function Rotate(angle)
{
    rotate(angle);
}

// スケール（拡大・縮小）
function Scale(sx, sy = null)
{
    if (sy === null) {
        // 引数が1つの場合は等倍スケール
        scale(sx);
    } else {
        // 引数が2つの場合はX,Y別々にスケール
        scale(sx, sy);
    }
}

