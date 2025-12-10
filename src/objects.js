class MagicRing {
    constructor(pos) {
        this.pos = pos;
        this.radius = 0;
        this.innerradius = 0;
        this.outerradius = 0;
        this.rotate = 0;
        this.color = color(0, 0, 0, 128);
        this.items = [new Sigil(0, 0, "RETURN", this),];
        this.circumference = 0;
        this.itemRadWidth = { sigil: 0, char: 0, charSpacing: 0, padding: 0 };
        this.layouts = [];
        this.angle = 0;
        this.effectiveRadius = 0; // 実効半径を保持するプロパティを追加
        this.isStartPoint = false;
        this.comments = [];

        this.spellstart = "{ ";
        this.spellend = "}";

        // レイアウト計算で使用する設定値を変数として保持
        this.configWidth = config.ringWidth;
        this.configMinCircumference = config.minRingCircumference;

        this.CalculateLayout();

        this.marker = null;
    }

    clone(clonedMap = new Map()) {
        if (clonedMap.has(this)) {
            return clonedMap.get(this);
        }
        const newRing = new this.constructor({ x: this.pos.x + 50, y: this.pos.y + 50 });
        clonedMap.set(this, newRing);
        rings.push(newRing);
        newRing.angle = this.angle;
        newRing.items = this.items.map(item => {
            if (item) {
                const newItem = item.clone(clonedMap);
                newItem.parentRing = newRing;
                return newItem;
            }
            return null;
        });
        newRing.comments = this.comments.map(comment => ({ ...comment }));
        newRing.CalculateLayout();
        return newRing;
    }

    CalculateLayout() {
        if (typeof this.CanAcceptItem === 'function') {
            this.items = this.items.filter(item => this.CanAcceptItem(item));
        }

        this.layouts = [];
        let totalLength = 0;

        this.items.forEach(item => {
            if (item) {
                totalLength += item.GetLength() + config.itemPadding;
            }
        });

        const nullCount = this.items.filter(item => item === null).length;
        totalLength += nullCount * (config.sigilWidth + config.itemPadding);

        // インスタンス変数を使用
        this.circumference = Math.max(totalLength, this.configMinCircumference);
        this.radius = this.circumference;
        this.innerradius = this.radius - this.configWidth / 2;
        this.outerradius = this.radius + this.configWidth / 2;

        this.itemRadWidth = {
            sigil: config.sigilWidth / this.circumference * TWO_PI,
            char: config.charWidth / this.circumference * TWO_PI,
            charSpacing: config.charSpacing / this.circumference * TWO_PI,
            stringSide: config.stringSideWidth / this.circumference * TWO_PI,
            padding: config.itemPadding / this.circumference * TWO_PI,
        };

        const nonNullItems = this.items.filter(item => item !== null);
        if (nonNullItems.length === 0) return;

        const actualTotalLength = nonNullItems.reduce((sum, item) => sum + item.GetLength() + config.itemPadding, 0);
        const excessLength = this.circumference - actualTotalLength;
        const excessAngle = excessLength / this.circumference * TWO_PI;

        let firstItem = this.items.find(item => item !== null);
        if (!firstItem) return;

        let currentAngle = firstItem.GetLength() / this.circumference * PI;

        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            let itemLength = 0;
            if (item) {
                itemLength = item.GetLength();
            } else {
                itemLength = config.sigilWidth;
            }

            currentAngle -= itemLength / this.circumference * PI;
            const itemEndAngle = currentAngle - (itemLength / this.circumference * PI) - this.itemRadWidth.padding / 2 - excessAngle / nonNullItems.length / 2;
            this.layouts.push({ angle: currentAngle, angle2: itemEndAngle });
            currentAngle -= (itemLength / this.circumference * PI + this.itemRadWidth.padding + excessAngle / nonNullItems.length);
        }
    }

    Draw() {
        const direction = globalIsClockwise ? -1 : 1;
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            if (item && item.type === 'joint') {
                const sourceRing = item.value;
                const parentRing = this;

                if (sourceRing && parentRing && i < this.layouts.length) {
                    const layout = this.layouts[i];
                    if (!layout) continue;

                    const startAngleOnRing = parentRing.angle + layout.angle * direction;
                    const p0x = parentRing.pos.x + parentRing.radius * Math.sin(startAngleOnRing);
                    const p0y = parentRing.pos.y - parentRing.radius * Math.cos(startAngleOnRing);

                    const endRadius = sourceRing.outerradius;
                    const endAngle = sourceRing.angle;
                    const p3x = sourceRing.pos.x + (endRadius + 20) * Math.sin(endAngle);
                    const p3y = sourceRing.pos.y - (endRadius + 20) * Math.cos(endAngle);

                    const distance = dist(p0x, p0y, p3x, p3y);
                    const controlDist = distance / 2;

                    const controlAngleP1 = atan2(p0y - parentRing.pos.y, p0x - parentRing.pos.x);
                    const controlAngleP2 = atan2(p3y - sourceRing.pos.y, p3x - sourceRing.pos.x);

                    const p1x = p0x + controlDist * cos(controlAngleP1);
                    const p1y = p0y + controlDist * sin(controlAngleP1);

                    const p2x = p3x + controlDist * cos(controlAngleP2);
                    const p2y = p3y + controlDist * sin(controlAngleP2);

                    noFill();
                    stroke(0, 0, 0);
                    strokeWeight(1);
                    bezier(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y);
                }
            }
        }

        PushTransform();
        Translate(this.pos.x, this.pos.y);
        PushTransform();
        Rotate(this.angle);
        if (debugMode) {
            FillCircle(0, 0, this.outerradius + config.ringRotateHandleWidth, color(200, 200, 200, 100));

            // 実効半径をデバッグ表示
            if (this.effectiveRadius > 0) {
                noFill();
                stroke(255, 0, 0, 150); // 赤色の円
                strokeWeight(1.5 / zoomSize); // ズームに合わせて線の太さを調整
                ellipse(0, 0, this.effectiveRadius * 2);
            }
        }

        this.DrawRingShape();

        this.DrawRingStar();

        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i] && this.layouts[i]) {
                this.items[i].DrawByRing(this.radius, this.layouts[i].angle * direction, this.itemRadWidth);
            }
        }

        if (debugMode) {
            this.DrawDebugLine();
        }
        this.DrawComments();
        PopTransform();
        if (!isUIHidden) this.DrawOption();
        PopTransform();
    }

    DrawRingShape() {
        DrawCircle(0, 0, this.innerradius, color(0, 0, 0));
        DrawCircle(0, 0, this.outerradius, color(0, 0, 0));
        if (this.isStartPoint) {
            DrawCircle(0, 0, this.outerradius + 3, color(0, 0, 0));
        }
    }

    DrawRingStar() {
        const itemn = this.items.length;
        const n = itemn <= 2 ? 5 : itemn;
        const step = floor(n * 2 / 5);
        const onesteprad = TWO_PI / n;
        PushTransform();
        for (let i = 0; i < n; i++) {
            DrawLine(0, -this.innerradius, Math.sin(onesteprad * step) * this.innerradius, -Math.cos(onesteprad * step) * this.innerradius, color(0, 0, 0))
            Rotate(onesteprad);
        }
        PopTransform();
    }

    DrawOption() { }

    DrawComments() {
        this.comments.forEach(comment => {
            let radius = this.outerradius + config.fontSize;
            let charDegWidth = (config.charWidth + config.charSpacing) / radius * 360; // 一文字ごとにずらす角度
            let totalRotation = 0;
            //function applyRotation(deg) { Rotate(-deg/180*PI); totalRotation += deg; }

            PushTransform();
            Rotate((-comment.angle1 / 180 + 1) * PI);
            PushTransform();
            const chars = comment.text.split('');
            chars.forEach(char => {
                DrawText(config.fontSize, char, 0, radius, config.fontColor, CENTER);
                //applyRotation(charDegWidth);
                Rotate(-charDegWidth / 180 * PI);
                totalRotation += charDegWidth;
                if (totalRotation > comment.angle2 || char == "\n") {
                    PopTransform();
                    PushTransform();
                    totalRotation = 0;
                    radius += config.fontSize;
                    charDegWidth = (config.charWidth + config.charSpacing) / radius * 360;

                }
            });
            PopTransform();
            PopTransform();
        });
    }

    DrawDebugLine() {
        const direction = globalIsClockwise ? -1 : 1;
        this.layouts.forEach(l => {
            if (l) {
                PushTransform();
                Rotate(l.angle * direction);
                DrawLine(0, -this.innerradius, 0, -this.outerradius, color(0, 255, 0));
                PopTransform();
                PushTransform();
                Rotate(l.angle2 * direction);
                DrawLine(0, -this.innerradius, 0, -this.outerradius, color(0, 0, 255));
                PopTransform();
            }
        });
    }

    RemoveItem(index) {
        this.items.splice(index, 1);
    }
    InsertItem(item, index) {
        this.items.splice(index, 0, item);
    }

    CheckDistance(pos) {
        return Math.sqrt((pos.x - this.pos.x) ** 2 + (pos.y - this.pos.y) ** 2);
    }

    CheckPosIsOn(pos) {
        const distance = this.CheckDistance(pos)
        if (distance < this.outerradius + config.ringRotateHandleWidth) {
            if (distance < this.outerradius) {
                if (distance < this.innerradius) {
                    return [this, "inner"];
                }
                const iteminfo = this.CheckPosItem(pos);
                return [this, "ring", iteminfo]
            }
            return [this, "outer"];
        }
        return false;
    }

    CheckPosItem(pos) {
        const direction = globalIsClockwise ? -1 : 1;
        const mouseAngle = -PI - Math.atan2(pos.x - this.pos.x, pos.y - this.pos.y);
        const angle = (((mouseAngle - this.angle) / PI * direction % 2 + 2) % 2 - 2) * PI;

        for (let i = 0; i < this.layouts.length; i++) {
            const layout = this.layouts[i];
            if (layout && layout.angle2 <= angle) {
                return { item: this.items[i], index: i };
            }
        }

        let firstItem = this.items.find(item => item !== null);
        let firstItemIndex = this.items.indexOf(firstItem);
        return { item: firstItem, index: firstItemIndex };
    }

    Spell() {
        let spell = "";
        this.items.slice(1).forEach(item => {
            if (item) spell += item.SpellToken() + " ";
        });
        return this.spellstart + spell + this.spellend;
    }
}

class ArrayRing extends MagicRing {
    constructor(pos) {
        super(pos);
        this.items = [new Sigil(0, 0, "COMPLETE", this)];

        this.configWidth = config.arrayWidth;
        this.configMinCircumference = config.minArrayCircumference;

        this.spellstart = "[ ";
        this.spellend = "]";

        // 視覚効果プロパティ (初期値: '-')
        this.visualEffect = '-';

        this.CalculateLayout();
    }

    // cloneメソッドを追加してvisualEffectを引き継ぐ
    clone(clonedMap = new Map()) {
        const newRing = super.clone(clonedMap);
        newRing.visualEffect = this.visualEffect;
        return newRing;
    }

    DrawRingStar() {
        // 星を描画しない
    }

    DrawOption() {
        switch (this.visualEffect) {
            case "color":
                const [r, g, b, a] = this.items.slice(1).map((item) => parseFloat(item.value) * 255);
                stroke(0);
                strokeWeight(1);
                fill(r, g, b, a);
                rect(-this.innerradius * 0.6, -this.innerradius * 0.6, this.innerradius * 1.2, this.innerradius * 1.2);
                break;
            case "gradient":
                break;
            case "curve":
                break;
            default:
        }
    }

    CanAcceptItem(item) {
        if (!item) return true;

        if (item.type === 'sigil' && item.value !== 'COMPLETE') {
            return false;
        }
        if (item.type === 'name') {
            return false;
        }
        if (item.type === 'string_token' && this.visualEffect === 'color') {
            return false;
        }

        return true;
    }

    CheckPosIsOn(pos) {
        if (inputMode == "itemDrag" && draggingItem && !this.CanAcceptItem(draggingItem.item)) {
            return false;
        }
        return super.CheckPosIsOn(pos);
    }
}

class DictRing extends MagicRing {
    constructor(pos) {
        super(pos);
        this.items = [new Sigil(0, 0, "COMPLETE", this)];
        this.spellstart = "< ";
        this.spellend = ">";
        this.CalculateLayout();
    }

    DrawRingStar() {
        // 星を描画しない
    }

    DrawRingShape() {
        const numVertices = Math.max(this.items.length, 6);
        const angleStep = TWO_PI / numVertices;
        const doubleLineOffset = 3;

        noFill();
        stroke(0, 0, 0);
        strokeWeight(1);

        beginShape();
        for (let i = 0; i < numVertices; i++) {
            const angle = i * angleStep;
            vertex(this.innerradius * sin(angle), -this.innerradius * cos(angle));
        }
        endShape(CLOSE);

        const correctedOuterRadius = this.outerradius / cos(PI / numVertices);
        beginShape();
        for (let i = 0; i < numVertices; i++) {
            const angle = i * angleStep;
            vertex(correctedOuterRadius * sin(angle), -correctedOuterRadius * cos(angle));
        }
        endShape(CLOSE);

        const secondOuterRadius = correctedOuterRadius - doubleLineOffset;
        beginShape();
        for (let i = 0; i < numVertices; i++) {
            const angle = i * angleStep;
            vertex(secondOuterRadius * sin(angle), -secondOuterRadius * cos(angle));
        }
        endShape(CLOSE);
    }

    CanAcceptItem(item) {
        /*
        if (!item) return true;

        if (item.type === 'sigil' && item.value !== 'COMPLETE') {
            return false;
        }
        */
        return true;
    }

    CheckPosIsOn(pos) {
        if (inputMode == "itemDrag" && draggingItem && !this.CanAcceptItem(draggingItem.item)) {
            return false;
        }
        return super.CheckPosIsOn(pos);
    }
}

class TemplateRing extends MagicRing {
    constructor(pos) {
        super(pos);
        this.items = [new Sigil(0, 0, "RETURN", this)];
        //this.spellstart = "< ";
        //this.spellend = ">";
        this.magic = "fire"
        this.CalculateLayout();
    }

    clone(clonedMap = new Map()) {
        const newRing = super.clone(clonedMap);
        newRing.magic = this.magic;
        return newRing;
    }

    DrawRingStar() {
        //super.DrawRingStar();
        DrawElement(this.magic, 0, 0, this.innerradius / 30)
    }

    Spell() {
        let spell = "";
        this.items.slice(1).forEach(item => {
            if (item) spell += item.SpellToken() + " ";
        });
        return magicTemplates(this.magic, spell);
    }
}

class RingItem {
    constructor(x, y, value, parentRing) {
        this.pos = { x: x, y: y };
        this.type = "item";
        this.value = value;
        this.parentRing = parentRing;
    }

    clone(clonedMap) {
        // this.constructor を使うことで、呼び出し元のクラス（Sigil, Charsなど）の新しいインスタンスを生成できる
        const newItem = new this.constructor(this.pos.x, this.pos.y, this.value, null);
        return newItem;
    }

    GetLength() { return 0; }
    DrawByRing(radius, layout, itemRadWidth) { }
    DrawByCanvas() { }
    DrawByDrag() { }
    SetValue(newValue) { this.value = newValue; }
    CheckPosIsOn(pos) { return false; }
    SpellToken() { return this.value; }
}

class Sigil extends RingItem {
    constructor(x, y, value, parentRing) {
        super(x, y, value, parentRing);
        this.type = "sigil";
    }

    GetLength() {
        return config.sigilWidth;
    }

    DrawByRing(radius, angle, itemRadWidth) {
        const direction = globalIsClockwise ? -1 : 1;
        PushTransform();
        Rotate(angle);
        if (globalIsClockwise && this.value != "RETURN" && this.value != "COMPLETE") {
            Rotate(PI);
            DrawSigil(this.value, 0, radius);
        }
        else {
            DrawSigil(this.value, 0, -radius);
        }
        PopTransform();
    }

    DrawByDrag() {
        const ClickObj = CheckMouseObject(false);
        if (ClickObj[0] == "ring") {
            const ring = ClickObj[1][0];
            const mouseAngle = (ring.visualEffect == null || ring.visualEffect === '-')
                ? Math.atan2(ring.pos.x - mousePos.x, ring.pos.y - mousePos.y)
                : 0;
            if (globalIsClockwise)
                DrawSigil(this.value, GetMouseX(), GetMouseY(), -mouseAngle + PI, zoomSize);
            else
                DrawSigil(this.value, GetMouseX(), GetMouseY(), -mouseAngle, zoomSize);
        }
        else {
            DrawSigil(this.value, GetMouseX(), GetMouseY(), PI, zoomSize);
        }
    }

    DrawByCanvas() {
        if (debugMode) {
            DrawRect(this.pos.x - this.GetLength() * PI, this.pos.y - config.sigilSize / 2, this.GetLength() * TWO_PI, config.sigilSize, color(0, 255, 0));
        }
        DrawSigil(this.value, this.pos.x, this.pos.y, PI);
    }

    CheckPosIsOn(pos) {
        if (this.pos.x - config.sigilSize / 2 < pos.x && pos.x < this.pos.x + config.sigilSize / 2 && this.pos.y - config.sigilSize / 2 < pos.y && pos.y < this.pos.y + config.sigilSize / 2) {
            return true;
        }
        return false;
    }
}

class Chars extends RingItem {
    constructor(x, y, value, parentRing) {
        super(x, y, value, parentRing);
        this.type = "chars";
    }

    GetLength() {
        return this.value.length * config.charWidth + (this.value.length - 1) * config.charSpacing;
    }

    DrawByRing(radius, angle, itemRadWidth) {
        const direction = globalIsClockwise ? -1 : 1;
        PushTransform();
        Rotate(angle);
        if (!globalIsClockwise) Rotate(PI);
        const radwide = this.GetLength() / radius * TWO_PI;
        Rotate((radwide / 2 - itemRadWidth.char / 2) * direction);
        const chars = this.value.split('');
        chars.forEach(char => {
            DrawText(config.fontSize, char, 0, radius * direction, config.fontColor, CENTER);
            Rotate((-itemRadWidth.char - itemRadWidth.charSpacing) * direction);
        });
        PopTransform();
    }

    DrawByDrag() {
        const ClickObj = CheckMouseObject(false);
        if (ClickObj[0] == "ring") {
            const ring = ClickObj[1][0];
            const mouseAngle = (ring.visualEffect == null || ring.visualEffect === '-')
                ? Math.atan2(ring.pos.x - mousePos.x, ring.pos.y - mousePos.y)
                : PI;
            PushTransform();
            Translate(GetMouseX(), GetMouseY());
            Rotate(-mouseAngle);
            if (!globalIsClockwise) Rotate(PI);
            DrawText(config.fontSize * zoomSize, this.value, 0, 0, config.fontColor, CENTER);
            PopTransform();
        }
        else {
            DrawText(config.fontSize * zoomSize, this.value, GetMouseX(), GetMouseY(), config.fontColor, CENTER);
        }
    }

    DrawByCanvas() {
        if (debugMode) {
            DrawRect(this.pos.x - this.GetLength() * PI, this.pos.y - config.fontSize / 2, this.GetLength() * TWO_PI, config.fontSize, color(0, 255, 0));
        }
        DrawText(config.fontSize, this.value, this.pos.x, this.pos.y, config.fontColor, CENTER);
    }

    CheckPosIsOn(pos) {
        if (this.pos.x - this.GetLength() * PI < pos.x && pos.x < this.pos.x + this.GetLength() * PI && this.pos.y - config.fontSize / 2 < pos.y && pos.y < this.pos.y + config.fontSize / 2) {
            return true;
        }
        return false;
    }

    // --- Chars の SpellToken を $ プレフィックスと数値対応に変更 ---
    SpellToken() {
        const value = this.value;

        // 1. 値が null や空文字列、空白でないかチェックし、
        //    さらに isFinite() で純粋な数値 ( "1", "-0.5" ) かどうかを判定
        //    ( isFinite("1a") や isFinite("add") は false になる )
        if (value !== null && value.trim() !== "" && isFinite(value)) {
            // 数値の場合は、 $ をつけずにそのまま返す
            // (interpreter.js の run ループが !isNaN で数値として処理する)
            return value;
        }

        // 2. 数値でない場合 ( "add", "x", "1a" など) は、変数として扱う
        //    \ と PostScript構文文字 ($ も含む) をエスケープ
        let escapedValue = this.value.replace(/[\\~{}<>()\[\]$]/g, (match) => '\\' + match);

        // $ を先頭につけて変数名として扱う
        // (Charsの 'add' は '$add' となり、Sigilの 'add' と区別される)
        escapedValue = "$" + escapedValue;

        return escapedValue;
    }
}

class StringToken extends RingItem {
    constructor(x, y, value, parentRing) {
        super(x, y, value, parentRing);
        this.type = "string_token";
    }

    GetLength() {
        return this.value.length * config.charWidth + (this.value.length - 1) * config.charSpacing + config.stringSideWidth * 2;
    }

    DrawByRing(radius, angle, itemRadWidth) {
        const direction = globalIsClockwise ? -1 : 1;
        PushTransform();
        Rotate(angle);
        if (!globalIsClockwise) Rotate(PI);
        const radwide = this.GetLength() / radius * TWO_PI;
        Rotate((radwide / 2 - itemRadWidth.stringSide) * direction);
        arc(0, radius * direction, config.stringSideWidth * TWO_PI * 2, config.stringSideWidth * TWO_PI * 2, HALF_PI, -HALF_PI);
        Rotate(-itemRadWidth.char / 2 * direction);
        const chars = this.value.split('');
        chars.forEach(char => {
            DrawText(config.fontSize, char, 0, radius * direction, config.fontColor, CENTER);
            Rotate((-itemRadWidth.char - itemRadWidth.charSpacing) * direction);
        });
        Rotate((itemRadWidth.char / 2 + itemRadWidth.charSpacing) * direction);
        noFill();
        stroke(config.sigilColor);
        strokeWeight(1);
        arc(0, radius * direction, config.stringSideWidth * TWO_PI * 2, config.stringSideWidth * TWO_PI * 2, -HALF_PI, HALF_PI);
        const innerlineradius = (radius - config.stringSideWidth * TWO_PI) * 2;
        const outerlineradius = (radius + config.stringSideWidth * TWO_PI) * 2
        const outlinewidth = this.value.length * itemRadWidth.char + (this.value.length - 1) * itemRadWidth.charSpacing;
        if (globalIsClockwise) {
            arc(0, 0, innerlineradius, innerlineradius, -HALF_PI - outlinewidth, -HALF_PI);
            arc(0, 0, outerlineradius, outerlineradius, -HALF_PI - outlinewidth, -HALF_PI);
        }
        else {
            arc(0, 0, innerlineradius, innerlineradius, HALF_PI, HALF_PI + outlinewidth);
            arc(0, 0, outerlineradius, outerlineradius, HALF_PI, HALF_PI + outlinewidth);
        }
        PopTransform();
    }

    DrawByDrag() {
        const ClickObj = CheckMouseObject(false);
        PushTransform();

        Translate(GetMouseX(), GetMouseY());
        if (ClickObj[0] == "ring") {
            const ring = ClickObj[1][0];
            const mouseAngle = (ring.visualEffect == null || ring.visualEffect === '-')
                ? Math.atan2(ring.pos.x - mousePos.x, ring.pos.y - mousePos.y)
                : PI;
            Rotate(-mouseAngle);
            if (!globalIsClockwise) Rotate(PI);
        }
        Scale(zoomSize);
        DrawText(config.fontSize, this.value, 0, 0, config.fontColor, CENTER);
        const textlen = config.fontSize * this.value.length * 0.6;
        const outlineradius = config.stringSideWidth * TWO_PI;
        DrawLine(-textlen / 2, outlineradius, textlen / 2, outlineradius, color(config.sigilColor));
        DrawLine(-textlen / 2, -outlineradius, textlen / 2, -outlineradius, color(config.sigilColor));
        noFill();
        arc(-textlen / 2, 0, outlineradius * 2, outlineradius * 2, HALF_PI, -HALF_PI);
        arc(textlen / 2, 0, outlineradius * 2, outlineradius * 2, -HALF_PI, HALF_PI);
        PopTransform();
    }

    DrawByCanvas() {
        if (debugMode) {
            DrawRect(this.pos.x - this.GetLength() * PI, this.pos.y - config.fontSize / 2, this.GetLength() * TWO_PI, config.fontSize, color(0, 255, 0));
        }
        DrawText(config.fontSize, this.value, this.pos.x, this.pos.y, config.fontColor, CENTER);
        const textlen = config.fontSize * this.value.length * 0.6;
        const outlineradius = config.stringSideWidth * TWO_PI;
        DrawLine(this.pos.x - textlen / 2, this.pos.y + outlineradius, this.pos.x + textlen / 2, this.pos.y + outlineradius, color(config.sigilColor));
        DrawLine(this.pos.x - textlen / 2, this.pos.y - outlineradius, this.pos.x + textlen / 2, this.pos.y - outlineradius, color(config.sigilColor));
        noFill();
        arc(this.pos.x - textlen / 2, this.pos.y, outlineradius * 2, outlineradius * 2, HALF_PI, -HALF_PI);
        arc(this.pos.x + textlen / 2, this.pos.y, outlineradius * 2, outlineradius * 2, -HALF_PI, HALF_PI);
    }

    CheckPosIsOn(pos) {
        if (this.pos.x - this.GetLength() * PI < pos.x && pos.x < this.pos.x + this.GetLength() * PI && this.pos.y - config.fontSize / 2 < pos.y && pos.y < this.pos.y + config.fontSize / 2) {
            return true;
        }
        return false;
    }

    SpellToken() {
        // \ と ( と ) と $ をエスケープ
        const escapedValue = this.value.replace(/[\\()$]/g, (match) => '\\' + match);
        return "(" + escapedValue + ")";
    }
}

class Name extends RingItem {
    constructor(x, y, value, parentRing) {
        super(x, y, value, parentRing);
        this.type = "name";
    }

    GetLength() {
        return max(this.value.length * config.charWidth + (this.value.length - 1) * config.charSpacing, config.nameObjectMinWidth);
    }

    DrawByRing(radius, angle, itemRadWidth) {
        const direction = globalIsClockwise ? -1 : 1;
        PushTransform();
        Rotate(angle);
        DrawSigil("name", 0, -radius);
        if (!globalIsClockwise) Rotate(PI);
        const radwide = (this.value.length * config.charWidth + (this.value.length - 1) * config.charSpacing) / radius * TWO_PI;
        Rotate((radwide / 2 - itemRadWidth.char / 2) * direction);
        const chars = this.value.split('');
        chars.forEach(char => {
            DrawText(config.fontSize, char, 0, radius * direction, config.fontColor, CENTER);
            Rotate((-itemRadWidth.char - itemRadWidth.charSpacing) * direction);
        });
        PopTransform();
    }

    DrawByDrag() {
        const ClickObj = CheckMouseObject(false);
        PushTransform();

        Translate(GetMouseX(), GetMouseY());
        if (ClickObj[0] == "ring") {
            const ring = ClickObj[1][0];
            const mouseAngle = (ring.visualEffect == null || ring.visualEffect === '-')
                ? Math.atan2(ring.pos.x - mousePos.x, ring.pos.y - mousePos.y)
                : 0;
            Rotate(-mouseAngle);
            if (!globalIsClockwise) Rotate(PI);
        }
        Scale(zoomSize);
        DrawText(config.fontSize, this.value, 0, 0, config.fontColor, CENTER);
        DrawSigil("name", 0, 0, PI);
        PopTransform();
    }

    DrawByCanvas() {
        if (debugMode) {
            DrawRect(this.pos.x - this.GetLength() * PI, this.pos.y - config.fontSize / 2, this.GetLength() * TWO_PI, config.fontSize, color(0, 255, 0));
            DrawRect(this.pos.x - config.sigilSize, this.pos.y - config.sigilSize, config.sigilSize * 2, config.sigilSize * 2, color(0, 255, 0));
        }
        DrawText(config.fontSize, this.value, this.pos.x, this.pos.y, config.fontColor, CENTER);
        DrawSigil("name", this.pos.x, this.pos.y, PI);
    }

    CheckPosIsOn(pos) {
        const textCollider = this.pos.x - this.GetLength() * PI < pos.x && pos.x < this.pos.x + this.GetLength() * PI && this.pos.y - config.fontSize / 2 < pos.y && pos.y < this.pos.y + config.fontSize / 2;
        const sigilCollider = this.pos.x - config.sigilSize < pos.x && pos.x < this.pos.x + config.sigilSize && this.pos.y - config.sigilSize < pos.y && pos.y < this.pos.y + config.sigilSize;
        if (textCollider || sigilCollider) {
            return true;
        }
        return false;
    }

    SpellToken() {
        // \ と PostScript構文文字 ($ も含む) をエスケープ
        const escapedValue = this.value.replace(/[\\~{}<>()\[\]$]/g, (match) => '\\' + match);
        return "~" + escapedValue;
    }
}

class Joint extends RingItem {
    constructor(x, y, value, parentRing) {
        super(x, y, value, parentRing);
        this.type = "joint";
        this.isExecute = false;
    }

    clone(clonedMap) {
        let clonedValue = null;
        if (this.value instanceof MagicRing) {
            clonedValue = this.value.clone(clonedMap);
        }
        const newJoint = new Joint(this.pos.x, this.pos.y, clonedValue, null);
        newJoint.isExecute = this.isExecute; // isExecute の状態もコピー
        return newJoint;
    }

    GetLength() {
        if (this.isExecute) return config.sigilWidth;
        return config.jointWidth;
    }

    DrawByRing(radius, angle, itemRadWidth) {
        PushTransform();
        Rotate(angle);
        DrawSigil("joint", 0, -radius);
        if (this.isExecute) {
            const direction = globalIsClockwise ? 1 : -1;
            if (globalIsClockwise) Rotate(PI);
            DrawSigil("exec", 0, direction * radius);
        }
        PopTransform();
    }

    DrawByDrag() {
        const sourceRing = this.value;

        if (sourceRing) {
            const radius = sourceRing.outerradius;
            const angle = sourceRing.angle;
            const ringConnectionX_world = sourceRing.pos.x + (radius + 20) * Math.sin(angle);
            const ringConnectionY_world = sourceRing.pos.y - (radius + 20) * Math.cos(angle);

            const [screenWidth, screenHeight] = GetScreenSize();
            const ringConnectionX_screen = (ringConnectionX_world - cameraPos.x) * zoomSize + screenWidth / 2;
            const ringConnectionY_screen = (ringConnectionY_world - cameraPos.y) * zoomSize + screenHeight / 2;

            const p0x = GetMouseX();
            const p0y = GetMouseY();

            const p3x = ringConnectionX_screen;
            const p3y = ringConnectionY_screen;

            const distance = dist(p0x, p0y, p3x, p3y);
            const controlDist = distance / 2;

            const ringCenter_screen_x = (sourceRing.pos.x - cameraPos.x) * zoomSize + screenWidth / 2;
            const ringCenter_screen_y = (sourceRing.pos.y - cameraPos.y) * zoomSize + screenHeight / 2;
            const controlAngle = atan2(p3y - ringCenter_screen_y, p3x - ringCenter_screen_x);

            const p1x = p0x - controlDist * cos(controlAngle);
            const p1y = p0y - controlDist * sin(controlAngle);

            const p2x = p3x + controlDist * cos(controlAngle);
            const p2y = p3y + controlDist * sin(controlAngle);

            noFill();
            stroke(0, 0, 0);
            strokeWeight(1);
            bezier(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y);
        }

        const ClickObj = CheckMouseObject(false);
        if (ClickObj[0] == "ring") {
            const ring = ClickObj[1][0];
            const mouseAngle = Math.atan2(ring.pos.x - mousePos.x, ring.pos.y - mousePos.y);
            DrawSigil("joint", GetMouseX(), GetMouseY(), -mouseAngle, zoomSize);
            if (this.isExecute) DrawSigil("exec", GetMouseX(), GetMouseY(), -mouseAngle, zoomSize);
        }
        else {
            DrawSigil("joint", GetMouseX(), GetMouseY(), PI, zoomSize);
            if (this.isExecute) DrawSigil("exec", GetMouseX(), GetMouseY(), PI, zoomSize);
        }
    }

    DrawByCanvas() {
        const sourceRing = this.value;

        if (sourceRing) {
            const p0x = this.pos.x;
            const p0y = this.pos.y;

            const radius = sourceRing.outerradius;
            const angle = sourceRing.angle;
            const p3x = sourceRing.pos.x + (radius + 20) * Math.sin(angle);
            const p3y = sourceRing.pos.y - (radius + 20) * Math.cos(angle);

            const distance = dist(p0x, p0y, p3x, p3y);
            const controlDist = distance / 2;
            const controlAngle = atan2(p3y - sourceRing.pos.y, p3x - sourceRing.pos.x);

            const p1x = p0x - controlDist * cos(controlAngle);
            const p1y = p0y - controlDist * sin(controlAngle);

            const p2x = p3x + controlDist * cos(controlAngle);
            const p2y = p3y + controlDist * sin(controlAngle);

            noFill();
            stroke(0, 0, 0);
            strokeWeight(1);
            bezier(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y);
        }

        if (debugMode) {
            DrawRect(this.pos.x - this.GetLength() * PI, this.pos.y - config.sigilSize / 2, this.GetLength() * TWO_PI, config.sigilSize, color(0, 255, 0));
        }
        DrawSigil("joint", this.pos.x, this.pos.y, PI);
        if (this.isExecute) DrawSigil("exec", this.pos.x, this.pos.y, PI);
    }

    CheckPosIsOn(pos) {
        if (this.pos.x - config.sigilSize / 2 < pos.x && pos.x < this.pos.x + config.sigilSize / 2 && this.pos.y - config.sigilSize / 2 < pos.y && pos.y < this.pos.y + config.sigilSize / 2) {
            return true;
        }
        return false;
    }

    SetValue(newValue) {
    }

    SpellToken() {
        if (this.value && typeof this.value.Spell === 'function') {
            const spell = this.value.Spell();
            return spell + (this.isExecute ? " exec" : "");
            //return spell;
        }
        return "";
    }

    Straighten() {
        const connectedRing = this.value;
        const jointIndex = this.parentRing.items.indexOf(this);
        if (jointIndex === -1 || !this.parentRing.layouts[jointIndex]) {
            return;
        }

        const direction = globalIsClockwise ? -1 : 1;
        const jointLocalAngle = this.parentRing.layouts[jointIndex].angle;

        const jointGlobalAngle = this.parentRing.angle + jointLocalAngle * direction;

        const currentDistance = dist(this.parentRing.pos.x, this.parentRing.pos.y, connectedRing.pos.x, connectedRing.pos.y);

        const p5Angle = jointGlobalAngle - HALF_PI;
        const newChildX = this.parentRing.pos.x + currentDistance * cos(p5Angle);
        const newChildY = this.parentRing.pos.y + currentDistance * sin(p5Angle);

        const angleToParent = atan2(this.parentRing.pos.y - newChildY, this.parentRing.pos.x - newChildX);
        const newChildAngle = angleToParent + HALF_PI;

        transformSubtree(connectedRing, newChildX, newChildY, newChildAngle);
    }
}

class Button {
    constructor(x, y, w, h, colorFunc, anchor, pivot, size, text, textColor, pressedFunc, isIcon = false, shouldDrawRect = true, align = CENTER) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.colorFunc = colorFunc;
        this.anchor = anchor;
        this.pivot = pivot;
        this.size = size;
        this.text = text;
        this.textColor = textColor;
        this.pressedFunc = pressedFunc;
        this.isIcon = isIcon;
        this.isPressed = false;
        this.shouldDrawRect = shouldDrawRect;
        this.align = align;
    }

    Draw() {
        let [width, height] = GetScreenSize();
        const x = width * this.anchor.x + this.x - this.w * this.pivot.x;
        const y = height * this.anchor.y + this.y - this.h * this.pivot.y;
        if (this.shouldDrawRect) {
            DrawRoundRect(x, y, this.w, this.h, 10, color(0, 0, 0), 3);
            FillRoundRect(x, y, this.w, this.h, 10, this.colorFunc(this));
        }
        if (debugMode) DrawRect(x, y, this.w, this.h, color(0, 255, 0));
        if (this.isIcon) {
            DrawIcon(this.text, x + this.w / 2, y + this.h / 2, this.size);
        }
        else {
            DrawText(this.size, this.text, x + this.w / 2, y + this.h / 2, this.textColor, this.align);
        }
    }

    CheckPressed() {
        let [width, height] = GetScreenSize();
        const x = width * this.anchor.x + this.x - this.w * this.pivot.x;
        const y = height * this.anchor.y + this.y - this.h * this.pivot.y;
        if (x < GetMouseX() && GetMouseX() < x + this.w && y < GetMouseY() && GetMouseY() < y + this.h) {
            return this;
        }
        return false;
    }

    Down() {
        this.pressedFunc();
        this.isPressed = true;
        lastPressedButton = this;
    }

    Up() {
        this.isPressed = false;
        lastPressedButton = null;
    }
}