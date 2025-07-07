class MagicRing 
{
    constructor(pos) 
    {
        this.x = pos.x;
        this.y = pos.y;
        this.radius = 30;
        this.color = color(150, 150, 150);
    }

    Draw() 
    {
        Translate(this.x, this.y);
        FillCircle(0, 0, this.radius, this.color);
    }
}