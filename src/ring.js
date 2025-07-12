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
            new Chars(0, 0, "longName", this),
            new Chars(0, 0, "a", this),
            new Chars(0, 0, "bcdefghijklmnop", this),
            new Chars(0, 0, "BCDEFGHIJKOMNOP", this),
            ];
        this.circumference = 0;
        this.itemRadWidth = {sigil: 0, char: 0, charSpacing:0, padding: 0};
        this.CalculateLayout();
        this.angle = 0;
    }

    Draw() 
    {
        PushTransform();
        Translate(this.pos.x, this.pos.y);
        Rotate(this.angle);
        //FillCircle(0, 0, this.outerradius + config.ringRotateHandleWidth, this.color);
        DrawCircle(0, 0, this.innerradius, color(0,0,0)); // 内側の円
        DrawCircle(0, 0, this.outerradius, color(0,0,0)); // 外側の円
        Rotate(this.itemRadWidth.sigil/2);
        this.items.forEach(item =>
        {
            item.Draw(this.radius, this.itemRadWidth);
            Rotate(-this.itemRadWidth.padding);
        });
        PopTransform();
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
        this.radius = this.circumference;
        this.innerradius = this.radius - config.ringWidth/2;
        this.outerradius = this.radius + config.ringWidth/2;
        this.itemRadWidth = 
        {
            sigil: config.sigilWidth / this.circumference * TWO_PI,
            char: config.charWidth / this.circumference * TWO_PI,
            charSpacing: config.charSpacing / this.circumference * TWO_PI,
            padding: config.itemPadding / this.circumference * TWO_PI,
        };
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
    
    Draw(radius, itemRadWidth)
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
    
    Draw(radius, radWidth)
    {
        Rotate(-radWidth.sigil/2);
        DrawSigil(this.value, 0, -radius);
        //Rotate(-radWidth.sigil/2 - radWidth.padding);
        Rotate(-radWidth.sigil/2);
    }
}

class Chars extends RingItem {
    constructor(x, y, value)
    {
        super();
        this.x = x;
        this.y = y;
        this.type = "char";
        this.value = value;
    }
    
    GetLength()
    {
        return this.value.length * config.charWidth + (this.value.length-1) * config.charSpacing;
    }
    
    Draw(radius, radWidth)
    {
        Rotate(PI);
        Rotate(radWidth.char/2 + radWidth.charSpacing);
        const chars = this.value.split('');
        chars.forEach(char =>
        {
            Rotate(-radWidth.char/2);
            Rotate(-radWidth.charSpacing);
            DrawText(config.fontSize, char, 0, radius, color(0,0,0), CENTER);
            Rotate(-radWidth.char/2);
        });
        Rotate(PI);
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