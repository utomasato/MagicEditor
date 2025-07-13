class MagicRing 
{
    constructor(pos) 
    {
        this.pos = pos;
        this.radius = 0;
        this.innerradius = 0;
        this.outerradius = 0;
        this.rotate = 0;
        this.color = color(0, 0, 0, 128);
        this.items = [new Sigil(0, 0, "RETURN", this),
            new Sigil(0, 0, "add", this),
            new Chars(0, 0, "longName", this),
            new Chars(0, 0, "a", this),
            new Sigil(0, 0, "sub", this),
            new Chars(0, 0, "bcdefghijklmnop", this),
            new Sigil(0, 0, "mul", this),
            new Chars(0, 0, "BCDEFGHIJKOMNOP", this),
            new Sigil(0, 0, "div", this),
            ];
        this.circumference = 0;
        this.itemRadWidth = {sigil: 0, char: 0, charSpacing:0, padding: 0};
        this.layouts = [];
        this.CalculateLayout();
        this.angle = 0;
    }

    
    CalculateLayout()
    {
        // リングの長さを求める
        let totalLength = 0;
        this.items.forEach(item => 
        {
           totalLength += item.GetLength() + config.itemPadding;
        });
        this.circumference = Math.max(totalLength, config.minRingCircumference);
        // 円周の長さから半径を求める
        this.radius = this.circumference;
        this.innerradius = this.radius - config.ringWidth/2;
        this.outerradius = this.radius + config.ringWidth/2;
        
        // 各アイテムの要素ごとのリング内での角度を求める
        this.itemRadWidth = 
        {
            sigil: config.sigilWidth / this.circumference * TWO_PI,
            char: config.charWidth / this.circumference * TWO_PI,
            charSpacing: config.charSpacing / this.circumference * TWO_PI,
            padding: config.itemPadding / this.circumference * TWO_PI,
        };
        
        let currentAngle = this.items[0].GetLength() / this.circumference * PI;
        this.items.forEach(item =>
        {
            currentAngle -= item.GetLength() / this.circumference * PI; // アイテムの描画位置(中心)
            const itemEndAngle = currentAngle - (item.GetLength() / this.circumference * PI) - this.itemRadWidth.padding/2; // 次のアイテムとの境目
            this.layouts.push({item: item, angle: currentAngle, angle2: itemEndAngle}); // [描画されるアイテム, 描画される位置(中心), 次のアイテムとの境目]
            currentAngle -= (item.GetLength() / this.circumference * PI + this.itemRadWidth.padding);
        });
    }
    
    Draw() 
    {
        
        PushTransform();
        Translate(this.pos.x, this.pos.y);
        Rotate(this.angle);
        DrawCircle(0, 0, this.innerradius, color(0,0,0)); // 内側の円
        DrawCircle(0, 0, this.outerradius, color(0,0,0)); // 外側の円

        this.layouts.forEach(l=>{
            l.item.Draw(this.radius, l.angle, this.itemRadWidth)
        });
        if(debugMode){
            this.DrawDebugLine();
        }
        PopTransform();
        
    }
    DrawDebugLine()
    {
        this.layouts.forEach(l=>{
            PushTransform();
            Rotate(l.angle);
            DrawLine(0, -this.innerradius, 0, -this.outerradius, color(0,255,0));
            PopTransform();
            PushTransform();
            Rotate(l.angle2);
            DrawLine(0, -this.innerradius, 0, -this.outerradius, color(0,0,255));
            PopTransform();
        });
    }
    CheckDistance(pos)
    {
        return Math.sqrt((pos.x - this.pos.x)**2 + (pos.y - this.pos.y)**2);
    }
    
    CheckPosIsOn(pos)
    {
        const distance = this.CheckDistance(pos)
        if (distance < this.outerradius + config.ringRotateHandleWidth)
        {
            if (distance < this.outerradius)
            {
                if (distance < this.innerradius)
                {
                    return [this, "inner"];
                }
                return [this, "ring"]
            }
            return [this, "outer"];
        }
        return null;
    }
}

class RingItem {
    constructor(x, y, value, ring)
    {
        this.x = x;
        this.y = y;
        this.type = "item";
        this.value = value;
        this.ring = ring;
    }
    
    GetLength()
    {
        return 0;
    }
    
    Draw(radius, layout, itemRadWidth)
    {
    }
    
    SetValue(newValue)
    {
        this.value = newValue;
    }
}

class Sigil extends RingItem {
    constructor(x, y, value)
    {
        super();
        //this.x = x;
        //this.y = y;
        this.type = "sigil";
        this.value = value;
    }
    
    GetLength()
    {
        return config.sigilWidth;
    }

    Draw(radius, angle, itemRadWidth)
    {
        PushTransform();
        Rotate(angle);
        DrawSigil(this.value, 0, -radius);
        PopTransform();
    }
}

class Chars extends RingItem {
    constructor(x, y, value)
    {
        super();
        this.x = x;
        this.y = y;
        this.type = "chars";
        this.value = value;
    }
    
    GetLength()
    {
        return this.value.length * config.charWidth + (this.value.length-1) * config.charSpacing;
    }
    
    Draw(radius, angle, itemRadWidth)
    {
        PushTransform();
        Rotate(angle + PI);
        const radwide = this.GetLength() / radius * TWO_PI;
        Rotate(radwide/2 - itemRadWidth.char/2);
        const chars = this.value.split('');
        chars.forEach(char =>
        {
            DrawText(config.fontSize, char, 0, radius, config.fontColor, CENTER);
            Rotate(-itemRadWidth.char-itemRadWidth.charSpacing);
        });
        PopTransform();
    }
}

class Button
{
    constructor(x, y, w, h, color, anchor, pivot, text, pressed)
    {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = color;
        this.anchor = anchor;
        this.pivot = pivot;
        this.text = text;
        this.pressed = pressed;
    }
    
    Draw()
    {
        let [width, height] = GetScreenSize();
        const x = width * this.anchor.x + this.x - this.w * this.pivot.x;
        const y = height * this.anchor.y + this.y - this.h * this.pivot.y;
        //FillRect(x, y, this.w, this.h, this.color);
        DrawRoundRect(x, y, this.w, this.h, 10, color(0,0,0), 3); 
        FillRoundRect(x, y, this.w, this.h, 10, this.color);
        DrawText(24, this.text, x + this.w/2, y + this.h/2, color(0, 0, 0), CENTER);
    }
    
    CheckPressed()
    {
        let [width, height] = GetScreenSize();
        const x = width * this.anchor.x + this.x - this.w * this.pivot.x;
        const y = height * this.anchor.y + this.y - this.h * this.pivot.y;
        if (x < GetMouseX() && GetMouseX() < x + this.w && y < GetMouseY() && GetMouseY() < y + this.h)
        {
            this.pressed();
            return true;
        }
        return false;
    }
}