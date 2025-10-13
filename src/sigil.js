//各シジルの描画

function DrawSigil(token, x, y, rotate = 0, zoom = 1)
{
    PushTransform();
    Translate(x, y);
    Scale(config.sigilSize * zoom);
    Rotate(rotate);
    stroke(config.sigilColor);
    strokeWeight(config.sigilLineWidth);
    noFill();
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
        case "COMPLETE":
            line(-0.25, 0.1, 0.25, 0.1);
            line(0.25, 0.1, 0, -0.4);
            line(-0.25, 0.1, 0, -0.4);
            line(0, -0.4, 0, -0.9);
            break;
        case "pop": // スタックのトップを削除
            line(0.5, -0.5, 0.5, 0.5);
            line(0.5, 0.5, -0.25, 0.5);
            arc(-0.25, 0.25, 0.5, 0.5, HALF_PI, HALF_PI*3);
            line(-0.25, 0, 0.5, 0);
            line(0.25,-0.25,-0.25,0.25);
            line(0.25, 0.25,-0.25, -0.25);
            line(0, 0.3536, 0, -0.3536);
            break;
        case "exch": // スタックのトップとその下を交換する
            line(-0.5, 0.5, 0.5, 0.5);
            line(0.5, 0.5, 0.5, -0.5);
            line(0.5, -0.5, -0.5, -0.5);
            line(0.5, 0, -0.5, 0);
            line(0.25, -0.25, -0.25, 0.25);
            line(-0.25, 0.25, 0, 0.25);
            line(0.25, 0.25, -0.25, -0.25);
            line(-0.25, -0.25, 0, -0.25);
            break;
        case "dup": // トップを複製する
            push();
            translate(0.125,0);
            line(0.25, 0.5, 0, 0.5);
            arc(0,0,1,1,HALF_PI,3*HALF_PI);
            line(0, -0.5, 0.25, -0.5);
            line(0.25, 0.5, 0.25,-0.5);
            line(0, 0.5, 0, -0.5);        
            pop();
            break;
        case "copy": // 配列、辞書、文字列のコピー　or スタックの上から指定された数を複製
            arc(0, 0, 1, 1, -2/3*PI, 2/3*PI);
            arc(-0.25, 0, 1, 1, -2/3*PI, 2/3*PI);
            break;
        case "index": // 指定された深さのオブジェクトを複製する
            line(0, -0.5, 0, 0.5);
            line(-0.25, 0.5, 0.25, 0.5);
            line(-0.25, -0.5, 0.25, -0.5);
            line(0, 0.25, 0.25, 0.25);
            line(0.25, 0.25, 0.25, -0.25);
            break;
        case "roll": // 指定された数の要素を指定された向きと方向にシフトさせる
            line(0.375, -0.5, 0.375, 0.125);
            line(-0.25, -0.5, 0, -0.25);
            push();
            translate(0, 0.125);
            ellipse(0,0,0.75);
            line(-0.1875, -0.3248, 0.0647, -0.2415);
            line(-0.1875, 0.3248, -0.2415, 0.0647);
            line(0.375, 0, 0.1768, 0.1768);
            pop();
            break;
        case "add": // 和
            line( -0.5,  -0.5,    0,  0.5);
            line(    0,   0.5,  0.5, -0.5);
            line(-0.25,     0, 0.25,    0);
            line(    0, -0.25,    0, 0.25);
            break;
        case "sub": // 差
            push();
            translate(0.125, 0);
            arc(0, 0.25, 0.5, 0.5, -HALF_PI, PI);
            arc(0, -0.25,0.5, 0.5, HALF_PI, TWO_PI);
            line(-0.5, -0.25, 0, -0.25);
            pop(); 
            break;
        case "mul": // 積
            line(0.5, -0.5, 0.5, 0.5);
            line(0.5, 0.5, -0.25, -0.25);
            line(-0.5, -0.5, -0.5, 0.5);
            line(-0.5, 0.5, 0.25, -0.25);
            break;
        case "div": // 除算
            line(0.25, -0.5, 0.25, 0.5);
            line(0.25, 0.5, 0, 0.5);
            arc(0, 0, 1, 1, HALF_PI, -HALF_PI);
            line(0, -0.5, 0.25, -0.5);
            ellipse(0.5, 0, config.sigilLineWidth);
            ellipse(0, 0, config.sigilLineWidth);
            break;
        case "idiv": // 整数除算
            line(0.25, -0.5, 0.25, 0.5);
            line(0.25, 0.5, 0, 0.5);
            arc(0, 0, 1, 1, HALF_PI, -HALF_PI);
            line(0, -0.5, 0.25, -0.5);
            ellipse(0.5, 0, config.sigilLineWidth);
            ellipse(0, 0, config.sigilLineWidth);
            push();
            translate(0.25,0);
            line(0.25, -0.25, -0.25, -0.25);
            line(0.25, 0.25, -0.25, 0.25);
            pop();
            break;
        case "mod": // 剰余
            line(0.5, -0.5, 0.5, 0.5);
            line(0.5, 0.5, 0, 0);
            line(-0.5, -0.5, -0.5, 0.5);
            line(-0.5, 0.5, 0, 0);
            ellipse(0, 0, 0.5);
            break;
        case "abs": // 絶対値
            line( -0.5,  0.5, -0.5, -0.5);
            line( -0.5, -0.5,    0,  0.5);
            line(    0,  0.5,  0.5, -0.5);
            line(  0.5, -0.5,  0.5,  0.5);
            line(-0.25,    0, 0.25,    0);
            break;
        case "neg": // 符号反転
            line(0.375, -0.5, 0.375, 0.5);
            line(0.375, 0.5, -0.375, -0.5);
            line(-0.375, -0.5, -0.375, 0.5);
            line(0.25, 0, -0.25, 0);        
            break;
        case "sqrt": // 平方根
            for(let i = 0; i < 2; i++)
            {
              push();
              rotate(i*PI);
              line(0.5, 0.25, 0.375, 0);
              line(0.375, 0, 0.25, 0.5);
              line(0.25, 0.5, -0.5, 0.5);
              pop();
            }
            line(-0.3125, -0.25, 0.3125, 0.25);
            break;
        case "atan": 
            line(0.5, -0.5, 0.5, 0);
            arc(0, 0, 1, 1, 0, PI);
            line(-0.5, 0, -0.5, -0.5);
            ellipse(-0.3535, 0.3535, 0.25);
            line(-0.3535, 0.3535, 0, 0);
            line(0, 0, 0, 0.3535);
            line(0, 0.3535, -0.3535, 0.3535);
            break;
        case "cos":
            ellipse(0, 0, 0.25);
            line(0, 0, -0.3535, 0.3535);
            line(-0.3535, 0.3535, 0, 0.3535);
            arc(0, 0, 1, 1, -3/4*PI, 3/4*PI);
            break;
        case "sin":
            ellipse(0, 0, 0.25);
            line(0.3535, 0, 0.3535, 0.3535);
            line(0.3535, 0.3535, -0.3535, -0.3535);
            line(-0.3535, -0.3535, -0.3535, 0);
            arc(0, 0, 1, 1, PI/4, 3/4*PI);
            arc(0, 0, 1, 1, -3/4*PI, -PI/4);
            break;
        case "rand": // 乱数
            push();
            translate(0, 0.1);
            scale(0.8);
            strokeWeight(config.sigilLineWidth/0.8);
            sigil_parts("rand");
            pop();
            line(0.3464, -0.1, 0.3535, -0.5);
            line(0, -0.3, -0.2, -0.5);
            break;
        case "srand": // シードの設定
            push();
            translate(0, 0.1);
            scale(0.8);
            strokeWeight(config.sigilLineWidth/0.8);
            sigil_parts("rand");
            pop();
            line(0.27, -0.3, -0.27, -0.3);
            line(0.27, -0.3, 0, -0.5);
            line(0, -0.3, 0, -0.5)
            line(-0.27, -0.3, 0, -0.5);
            line(0, -0.5, 0.5, -0.5);
            break;
        case "rrand": // シード値の取得
            push();
            translate(0, -0.1);
            scale(0.8);
            strokeWeight(config.sigilLineWidth/0.8);
            sigil_parts("rand");
            pop();
            line(0, 0.3, -0.5, 0.5);
            line(0, 0.3, 0.5, 0.5);
            line(-0.5, 0.5, 0.5, 0.5);
            ellipse(0, 0.4, config.sigilLineWidth*1.2);
            break;
        case "array": // 指定されたサイズの配列を作成する(要素はすべてnull)
            ellipse(0, 0, 1);
            ellipse(0, 0, 0.5);
            line(0.433, -0.25, 0.5, -0.5);
            line(-0.433, -0.25, -0.5, -0.5);
            break;
        case "string":
            arc(-0.25, 0, 0.5, 0.5, HALF_PI, -HALF_PI);
            line(-0.25, -0.25, 0.25, -0.25);
            arc(0.25, 0, 0.5, 0.5, -HALF_PI, HALF_PI);
            line(0.25, 0.25, -0.25, 0.25);
            for (let i=-0.25; i<0.3; i+=0.125)
                line(-i, -0.125, -i, 0.125);
            arc(0, 0, 1, 1, 0, HALF_PI);
            arc(0, 0, 1, 1, PI, -HALF_PI);
            break;
        case "length":
            line(0.375, 0.5, 0.375, -0.5);
            line(0.375, -0.5, -0.375, -0.5);
            for (let i=-0.25;i<0.4;i+=0.125)
            {
                line(-i, -0.5, -i, -0.25);
            }
            break;
        case "get":
            push();
            translate(0.125, 0);
            sigil_parts("look");
            arc(0.25, 0, 1, 1, HALF_PI, -HALF_PI);
            ellipse(-0.125, 0, -0.25);
            pop();
            break;
        case "put":
            push();
            translate(0.125, 0);
            sigil_parts("write");
            arc(0.25, 0, 1, 1, HALF_PI, -HALF_PI);
            ellipse(-0.125, 0, -0.25);
            pop();
            break;
        case "getinterval": // 部分取得
            push();
            translate(0.125, 0);
            sigil_parts("look");
            translate(0.25, 0);
            arc(0, 0, 1, 1, HALF_PI, -HALF_PI);
            arc(0, 0, 0.75, 0.75, QUARTER_PI*3, QUARTER_PI*5);
            line(-0.3536, 0.3536, -0.1326, 0.1326);
            line(-0.3536, -0.3536, -0.1326, -0.1326);
            pop();
            break;
        case "putinterval":
            push();
            translate(0.125, 0);
            sigil_parts("write");
            translate(0.25, 0);
            arc(0, 0, 1, 1, HALF_PI, -HALF_PI);
            arc(0, 0, 0.75, 0.75, QUARTER_PI*3, QUARTER_PI*5);
            line(-0.3536, 0.3536, -0.1326, 0.1326);
            line(-0.3536, -0.3536, -0.1326, -0.1326);
            pop();
            break;
        case "forall":
            line(0.375, -0.5, 0.375, 0.5);
            line(0.375, 0.5, -0.375, 0.5);
            line(0.375, 0, -0.375, 0);
            ellipse(0, 0, 0.5);
            break;
        case "dict":
            line(-0.5, 0, 0.25, 0.433);
            line(0.25, 0.433, 0.25, -0.433);
            line(0.25, -0.433, -0.5, 0);
            line(-0.25, 0, 0.125, 0.2165);
            line(0.125, 0.2165, 0.125, -0.2165);
            line(0.125, -0.2165, -0.25, 0);
            break;
        case "begin":
            arc(0.25, 0.5, 1, 1, PI, -HALF_PI);
            arc(0.25, -0.5, 1, 1, HALF_PI, PI);
            arc(0.25, 0.5, 0.75, 0.75, PI, -HALF_PI);
            line(0.25, 0.125, 0.25, -0.125);
            arc(0.25, -0.5, 0.75, 0.75, HALF_PI, PI);
            break;
        case "end":
            arc(-0.25, 0.5, 1, 1, -HALF_PI, 0);
            arc(-0.25, -0.5, 1, 1, 0, HALF_PI);
            arc(-0.25, 0.5, 0.75, 0.75, -HALF_PI, 0);
            line(-0.25, 0.125, -0.25, -0.125);
            arc(-0.25, -0.5, 0.75, 0.75, 0, HALF_PI);
            break;
        case "cvi": // 文字(Char)を整数(Integer)に変換
            push();
            Rotate(PI);
            translate(0.65, 0);
            sigil_parts("look");
            pop();
            arc(0.375, 0, 1, 1, HALF_PI, -HALF_PI);
            ellipse(0, 0, -0.25);
            line(0.475, 0.25, 0.35, 0.5);
            line(0.35, 0.5, 0.225, 0.25);
            line(0.4125, 0.375, 0.2875, 0.375);
            arc(0.35, 0.1875, 0.25, 0.125, -HALF_PI, PI);
            arc(0.35, 0.0625, 0.25, 0.125, HALF_PI, TWO_PI);
            arc(0.35, -0.125, 0.25, 0.25, -PI*3/4, PI*3/4);
            line(0.4125, -0.25, 0.4125, -0.5);
            line(0.2875, -0.25, 0.2875, -0.5);
            break;
        case "chr": // 文字コード(Character code)から文字を生成
            push();
            translate(0.125, 0);
            sigil_parts("look");
            pop();
            arc(0.375, 0, 1, 1, HALF_PI, -HALF_PI);
            ellipse(0, 0, -0.25);
            line(0.475, 0.25, 0.35, 0.5);
            line(0.35, 0.5, 0.225, 0.25);
            line(0.4125, 0.375, 0.2875, 0.375);
            arc(0.35, 0.1875, 0.25, 0.125, -HALF_PI, PI);
            arc(0.35, 0.0625, 0.25, 0.125, HALF_PI, TWO_PI);
            arc(0.35, -0.125, 0.25, 0.25, -PI*3/4, PI*3/4);
            line(0.4125, -0.25, 0.4125, -0.5);
            line(0.2875, -0.25, 0.2875, -0.5);
            break;
        case "null":
            ellipse(0, 0, 0.8);
            line(-0.4, 0.4, 0.4, -0.4);
            break;
        case "def":
            ellipse(0, 0, 1);
            line(0, 0.5, 0.433, -0.25);
            line(0.433, -0.25, -0.433, -0.25);
            line(-0.433, -0.25, 0, 0.5);
            break;
        case "eq": // ==
            line(0.5, 0.25, -0.5, 0.25);
            line(0.25, 0.25, 0.25, -0.25);
            line(0.5, -0.25, -0.5, -0.25);
            line(0.25, 0, -0.25, 0);
            break;
        case "ne": // !=
            line(0.5, 0.25, -0.5, 0.25);
            line(0.25, 0.25, 0.25, -0.25);
            line(0.5, -0.25, -0.5, -0.25);
            line(0.25, 0, -0.25, 0);
            line(0.5, 0, 0, 0.5);
            line(0, 0.5, 0, -0.5);
            line(0, -0.5, -0.5, 0);
            break
        case "ge": // >=
            line(0.5, 0.5, 0.5, 0);
            line(0.5, 0, -0.5, 0);
            line(-0.5, 0, 0, 0.25);
            line(0, 0.25, 0.25, 0.25);
            line(0.25, 0, 0.25, -0.5);
            line(0.5, -0.5, -0.5, -0.5);
            line(0.25, -0.25, -0.25, -0.25);
            break;
        case "gt": // >
            line(0.5, 0.5, 0.5, -0.125);
            line(0.5, -0.125, -0.5, -0.125);
            line(-0.5, -0.125, 0, 0.25);
            line(0, 0.25, 0.25, 0.25);
            line(0.375, 0, -0.125, 0);
            line(0.125, 0, 0.125, -0.5);
            break;
        case "le": // <=
            line(0, 0.5, 0.5, 0);
            line(0.5, 0, -0.5, 0);
            line(0.25, 0, 0.25, -0.5);
            line(0.5, -0.5, -0.5, -0.5);
            line(0.25, -0.25, -0.25, -0.25);
            break;
        case "lt": // <
            line(0, 0.5, 0.5, -0.25);
            line(0.5, -0.25, -0.5, -0.25);
            line(0.125, 0, -0.375, 0);
            line(-0.125, 0, -0.125, -0.5);
            break;
        case "and":
            line(-0.25, -0.5, 0 + 0.125 * Math.cos(-PI/6), 0.25 + 0.125 * Math.sin(-PI/6));
            arc(0, 0.25, 0.125*2, 0.125*2, -PI/6, HALF_PI);
            arc(0, 0.25, 0.125*2, 0.125*2, HALF_PI, 7/6*PI);
            line(0 + 0.125 * Math.cos(7/6*PI), 0.25 + 0.125 * Math.sin(7/6*PI), 0.25, -0.5);
            arc(0, 0, 0.375*2, 0.375*2, -3/4*PI, -1/3*PI);
            break;
        case "not":
            line(0.375, -0.5, 0.375, 0.5);
            line(0.375, 0.5, -0.375, -0.5);
            line(-0.375, -0.5, -0.375, 0.5);
            line(0.25, 0, -0.25, 0);
            line(-0.25, 0, -0.25, -0.125);
            break;
        case "or":
            ellipse(0, 0, 0.75);
            line(0, 0.5, 0, 0.125);
            line(0, -0.5, 0, -0.125);
            break;
        case "xor":
            line(-0.5, 0.5, 0.3536, -0.3536);
            line(-0.3536, -0.3536, 0.5, 0.5);
            arc(0, 0, 1, 1, -QUARTER_PI, QUARTER_PI*5)
            break;
        case "true":
            line(0.5, 0.5, -0.5, 0.5);
            line(0.25, 0.25, -0.25, 0.25);
            line(0, 0.5, 0, -0.5);
            break;
        case "false":
            line(0, 0.25, -0.25, 0.25);
            line(-0.5, 0.5, 0, 0.5);
            line(0, 0.5, 0, -0.5);
            line(0.5, -0.5, -0.5, -0.5);
            break;
        case "exec":
            push();
            for (let i=0; i<5;i++)
            {
                line(0, 0.5, 0.2939, -0.4045);
                Rotate(TWO_PI/5);
            }
            pop();
            break;
        case "if":
            line(0, -0.5, 0, 0.5);
            line(0.25, 0.5, -0.25, 0.5);
            line(0.25, -0.5, -0.25, -0.5);
            bezier(0, -0.5, 0, -0.25, -0.25, -0.25, -0.25, 0);
            break;
        case "ifelse":
            line(0, -0.5, 0, 0.5);
            line(0.25, 0.5, -0.25, 0.5);
            line(0.25, -0.5, -0.25, -0.5);
            bezier(0, -0.5, 0, -0.25, 0.25, -0.25, 0.25, 0);
            bezier(0, -0.5, 0, -0.25, -0.25, -0.25, -0.25, 0);
            break;
        case "for":
            line(0.375, -0.5, 0.375, 0.5);
            line(0.375, 0.5, -0.375, 0.5);
            line(0.375, 0, -0.375, 0);
            for(let i = -0.25; i<0.3125; i+=0.125)
                line(-i, -0.125, -i, 0.125);
            break;
        case "repeat":
            for (let i=0; i<3; i++)
                line(-0.125+0.25*i, 0, -0.375+0.25*i, -0.5);
            line(0.375, -0.5, 0.375, 0.5);
            line(0.375, 0.5, -0.125, 0.5);
            arc(-0.125, 0.25, 0.5, 0.5, HALF_PI, HALF_PI*3);
            line(-0.125, 0, 0.375, 0);
            break;
        case "loop":
            line(0.25, 0.5, 0.25, -0.375);
            arc(0.375, -0.375, 0.25, 0.25, PI, HALF_PI);
            line(0.375, -0.25, -0.5, -0.25);
            arc(0, 0, 0.5, 0.5, 0, -HALF_PI);
            break;
        case "exit":
            line(-0.125, 0.375, 0, 0.5);
            line(0, 0.5, 0.25, 0.25);
            line(0.25, 0.25, 0, 0);
            line(0, 0, -0.125, 0.125);
            line(0.25, 0.25, -0.25, 0.25);
            line(0, 0, 0, -0.5);
            line(0.25, -0.25, -0.25, -0.25);
            break;
        case "color":
            arc(0, 0, 1, 1, -5/6*PI, 5/6*PI);
            const r = 0.1333;
            ellipse(0, 0.1333, 0.4);
            ellipse(0.1155, -0.0667, 0.4);
            ellipse(-0.1155, -0.0667, 0.4);
            break;
        case "setcolor":
            arc(0, 0.125, 0.75, 0.75, -5/6*PI, 5/6*PI);
            sigil_parts("set");
            break;
        case "currentcolor":
            arc(0, -0.125, 0.75, 0.75, -5/6*PI, 5/6*PI);
            sigil_parts("current");
            break;
        case "magicactivate":
            ellipse(0, 0, 1);
            line(0, 0.5, 0.433, -0.25);
            line(0.433, -0.25, -0.433, -0.25);
            line(-0.433, -0.25, 0, 0.5);
            line(0, -0.5, 0.433, 0.25);
            line(0.433, 0.25, -0.433, 0.25);
            line(-0.433, 0.25, 0, -0.5);
            arc(0.225, 0.225, 0.25, 0.25, PI, -HALF_PI);
            arc(0.225, -0.025, 0.25, 0.25, HALF_PI, PI);
            arc(-0.025, -0.025, 0.25, 0.25, 0, HALF_PI);
            arc(-0.025, 0.225, 0.25, 0.25, -HALF_PI, 0);
            arc(0, 0.1, 0.2, 0.2, PI, -HALF_PI);
            arc(0, -0.1, 0.2, 0.2, HALF_PI, PI);
            arc(-0.2, -0.1, 0.2, 0.2, 0, HALF_PI);
            arc(-0.2, 0.1, 0.2, 0.2, -HALF_PI, 0);
            arc(0.1, -0.1, 0.1, 0.1, PI, -HALF_PI);
            arc(0.1, -0.2, 0.1, 0.1, HALF_PI, PI);
            arc(0, -0.2, 0.1, 0.1, 0, HALF_PI);
            arc(0, -0.1, 0.1, 0.1, -HALF_PI, 0);
            break;
        case "transform":
            line(0.3, 0, -0.3, 0);
            line(0.3, 0, 0.2, 0.1);
            line(0.3, 0, 0.2, -0.1);
            line(-0.3, 0, -0.2, 0.1);
            line(-0.3, 0, -0.2, -0.1);
            line(0, 0.3, 0, -0.3);
            line(0, 0.3, 0.1, 0.2);
            line(0, 0.3, -0.1, 0.2);
            line(0, -0.3, 0.1, -0.2);
            line(0, -0.3, -0.1, -0.2);
            arc(0, 0, 0.8, 0.8, 0.3, HALF_PI-0.3);
            arc(0, 0, 0.8, 0.8, HALF_PI+0.3, PI-0.3);
            arc(0, 0, 0.8, 0.8, PI+0.3, -HALF_PI-0.3);
            arc(0, 0, 0.8, 0.8, -HALF_PI+0.3, -0.3);
            line(0.4, -0.3, 0.4, -0.4);
            line(0.4, -0.4, 0.3, -0.4);
            line(-0.4, 0.3, -0.4, 0.4);
            line(-0.4, 0.4, -0.3, 0.4);
            break;
        case "animation":
            line(-0.067, 0.375, 0.366, -0.375);
            line(0.366, -0.375, -0.5, -0.375);
            line(-0.5, -0.375, -0.067, 0.375);
            line(0.35, 0.2, 0.15, 0.2)
            line(0.45, 0, 0.25, 0);
            line(0.45, -0.2, 0.35, -0.2);
            break;
        case "print":
            line(0.5, -0.5, 0.5, 0.5);
            line(0.5, 0.5, -0.25, 0.5);
            arc(-0.25, 0.25, 0.5, 0.5, HALF_PI, HALF_PI*3);
            line(-0.25, 0, 0.5, 0);
            for (let i=-0.3; i<0.3; i+=0.125)
                line(-i, 0.125, -i, 0.375);
            break;
        case "stack":
            line(-0.5, 0.25, -0.5, 0.5);
            line(-0.5, 0.5, 0.5, 0.5);
            line(0.5, 0.5, 0.5, 0.25);
            line(0.5, 0.25, 0.2, 0);
            line(-0.2, 0, -0.5, -0.25)        
            line(-0.5, -0.25, -0.5, -0.5);
            line(-0.5, -0.5, 0.5, -0.5)
            line(0.5, -0.5, 0.5, -0.25);
            for (let i=-0.25; i<0.3; i+=0.125)
                line(0.2, i, -0.2, i);
            break;
        case "joint":
            fill(0,0,0);
            circle(0,0,0.15);
            break;
        case "name":
            push();
            translate(0, -0.1);
            const a = 2;
            line(0, 1, 0.866, -0.5);
            line(0.866, -0.5, -0.866, -0.5);
            line(-0.866, -0.5, 0, 1);
            pop();
            break;
        default:
            arc(0, 0.25, 0.5, 0.5, 0, -HALF_PI);
            line(0, 0, 0, -0.25);
            ellipse(0, -0.375, 0.1);
    }
    PopTransform();
}

function sigil_parts(part)
{
    switch(part)
    {
        case "rand":
            line(0, 0.5, -0.433, 0.25);
            line(-0.433, 0.25, -0.433, -0.25);
            line(-0.433, -0.25, 0, -0.5);
            line(0, -0.5, 0.433, -0.25);
            line(0.433, -0.25, 0.433, 0.25);
            line(0.433, 0.25, 0, 0.5);
            line(0, 0, -0.433, 0.25);
            line(0, 0, 0.433, 0.25);
            line(0, 0, 0, -0.5);
            break;
        case "current":
            ellipse(0,0.375,config.sigilLineWidth*1.2);
            line(0.5, 0.5, -0.5, 0.5);
            line(-0.5, 0.5, 0, 0.25);
            line(0, 0.25, 0.5, 0.5);
            break;
        case "look":
            push();
            rotate(HALF_PI);
            sigil_parts("current");
            pop();
            break;
        case "set":
            line(0.25, -0.25, -0.27, -0.25);
            line(0.25, -0.25, 0, -0.5);
            line(0, -0.25, 0, -0.5)
            line(-0.25, -0.25, 0, -0.5);
            line(0, -0.5, 0.5, -0.5);
            break;
        case "write":
            line(-0.5, 0.25, -0.25, 0);
            line(-0.25, 0, -0.5, -0.25);
            line(-0.5, -0.25, -0.5, 0.25);
            line(-0.5, 0, -0.25, 0);
            break;
    }
}

function DrawIcon(a, x, y, size)
{
    PushTransform();
    Translate(x, y);
    Scale(size);
    stroke(config.sigilColor);
    strokeWeight(config.sigilLineWidth);
    noFill();
    switch (a)
    {
        case "ring":
            ellipse(0, 0, 1);
            ellipse(0, 0, 0.8);
            line(0, 0.4, 0.3464, -0.2);
            line(0.3464, -0.2, -0.3464, -0.2);
            line(-0.3464, -0.2, 0, 0.4);
            line(0, -0.4, 0.3464, 0.2);
            line(0.3464, 0.2, -0.3464, 0.2);
            line(-0.3464, 0.2, 0, -0.4);
            break;
        case "sigil":
            const n = 0.9;
            line(-0.5, -0.05, -0.275, -0.5);
            line(-0.275, -0.5, -0.05, -0.05);
            line(-0.3875, -0.275, -0.1625, -0.275);
            line(-0.275, -0.1625, -0.275, -0.3875);

            arc(0.17375, -0.3875, -0.225, -0.225, HALF_PI, TWO_PI);
            arc(0.17375, -0.1625, -0.225, -0.225, -HALF_PI, PI);
            line(0.41675, -0.1625, 0.17375, -0.1625);

            line(-0.05, 0.5, -0.05, 0.05);
            line(-0.05, 0.05, -0.3875, 0.3875);
            line(-0.5, 0.5, -0.5, 0.05);
            line(-0.5, 0.05, -0.1625, 0.3875);

            line(0.1625, 0.5, 0.1625, 0.05);
            line(0.1625, 0.05, 0.275, 0.05);
            arc(0.275, 0.275, -0.45, -0.45, -HALF_PI, HALF_PI);
            line(0.275, 0.5, 0.1625, 0.5);
            ellipse(0.05, 0.275, 0.036);
            ellipse(0.275, 0.275, 0.036);
            break;
        case "num":
            /*　こっちだとSafariで実行時文字の位置がズレる　原因不明 Chromeだと正常に動く
            textSize(0.5);
            textAlign(CENTER,CENTER);
            fill(0);
            strokeWeight(0);
            text("123",0,-0.25);
            text("var",0, 0.25);
            */
            pop();
            DrawText(size*0.5, "123", x, y-size*0.25, config.fontColor, CENTER);
            DrawText(size*0.5, "var", x, y+size*0.25, config.fontColor, CENTER);
            push();
            break;
        case "string":
            /*　こっちだとSafariで実行時文字の位置がズレる　原因不明 Chromeだと正常に動く
            textSize(0.5);
            textAlign(CENTER,CENTER);
            fill(0);
            strokeWeight(0);
            text("Str",0,0);
            */
            pop();
            DrawText(size*0.5, "Str", x, y, config.fontColor, CENTER);
            push();
            break;
        case "name":
            /*　こっちだとSafariで実行時文字の位置がズレる　原因不明 Chromeだと正常に動く
            textSize(0.4);
            textAlign(CENTER,CENTER);
            fill(0);
            strokeWeight(0);
            text("Name",0,0);
            */
            pop();
            DrawText(size*0.5, "Name", x, y, config.fontColor, CENTER);
            push();
            break;
        default:
            /*　こっちだとSafariで実行時文字の位置がズレる　原因不明 Chromeだと正常に動く
            textSize(1);
            textAlign(CENTER,CENTER);
            fill(0);
            strokeWeight(0);
            text(a,0,0);
            */
            pop();
            textSize(size);
            textAlign(CENTER,CENTER);
            fill(0);
            strokeWeight(0);
            text(a,x,y);
            push();
    }
    pop();
}