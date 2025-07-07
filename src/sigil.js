//各シジルの描画

function DrawSigil(token, x, y, config)
{
    PushTransform();
    Translate(x, y);
    Scale(config.sigilSize);
    stroke(config.sigilColor);
    strokeWeight(config.sigilLineWidth);
    switch(token)
    {
        case "RETURN":
            line(   0,  0.5,  0.38,    0);
            line( 0.38,    0,    0, -0.5);
            line(   0, -0.5, -0.38,    0);
            line(-0.38,    0,    0,  0.5);
            line(   0,  -0.5,   0,    -1);
            line(-0.3, -0.75, 0.3, -0.75);
            break;
        case "abs":
            line( -0.5,  0.5, -0.5, -0.5);
            line( -0.5, -0.5,    0,  0.5);
            line(    0,  0.5,  0.5, -0.5);
            line(  0.5, -0.5,  0.5,  0.5);
            line(-0.25,    0, 0.25,    0);
            break;
        case "add":
            line( -0.5,  -0.5,    0,  0.5);
            line(    0,   0.5,  0.5, -0.5);
            line(-0.25,     0, 0.25,    0);
            line(    0, -0.25,    0, 0.25);
            break;
    }
    PopTransform();
};