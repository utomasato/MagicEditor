const templateDatas = {
    fire: {
        parameters: //このテンプレートで設定できるパラメータ
        {
            scale: { type: "numberOrVector3", defaultValue: "1" },
            position: { type: "vector3", defaultValue: "0 0 0" },
            rotation: { type: "vector3", defaultValue: "-90 0 0" },
            color1: { type: "color", defaultValue: "1.0 0.6 0.0" },
            color2: { type: "color", defaultValue: "1.0 0.0 0.0" },
        },
        converter: //入力されたパラメータからコードに変換する変換器
            (prms, prmfgs) => {
                return `{dict begin ~root < ~shape (empty) > spawnobj ~setMagic { ~magic $preset magicactivate $magic $root attachtoparent } def ~preset < ~main < ~startLifetime [ 0.5 2 ] ~startSpeed 0.5 ~startSize [ 0.2 0.4 ] ~startRotation [ 0 360 ] > ~emission < ~rateOverTime 50 > ~shape < ~angle 5 ~radius 0.0001 > ~colorOverLifetime < ~gradient < ~colorKeys [ [ 0.0 ${prms.color1} 1.0 ] [ 0.6 ${prms.color2} 1.0 ] [ 1.0 ${prms.color2} 1.0 ] ] ~alphaKeys [ [ 0.0 0.0 ] [ 0.5 1.0 ] [ 1.0 0.0 ] ] > > ~rotationOverLifetime < ~z [ -45 45 ] > ~renderer < ~material <~texture (Smoke_1)> > > def $setMagic { $preset ~renderer get dup ~material <~shader (AlphaBlended) ~texture (Smoke_1)> put ~sortingFudge 10 put } exec $setMagic $root < ~position [ ${prms.position} ] ~rotation [ ${prms.rotation} ] ~scale ${prms.scale} > transform $root end}`;
            },
        invalidVariableNames: // 入れてほしくない変数（例えば　scaleにrootとか入れられられると困る）
            ["root", "setMagic", "magic", "preset"],
    },
    bullet: {
        parameters:
        {
            scale: { type: "numberOrVector3", defaultValue: "2" },
            position: { type: "vector3", defaultValue: "0 0 0" },
            rotation: { type: "vector3", defaultValue: "0 0 0" },
            color: { type: "color", defaultValue: "1.0 0.5 0.0" },
            speed: { type: "number", defaultValue: "10" }, // startSpeed
            range: { type: "number", defaultValue: "20" }, // startSpeed * startLifetime
            interval: { type: "number", defaultValue: "1" }, // duration
        },
        converter:
            (prms, prmfgs) => {
                return `{ dict begin ~root < ~shape (empty) > spawnobj ~setMagic { ~magic $preset magicactivate $magic $root attachtoparent } def ~preset < ~main < ~duration ${prms.interval} ~startLifetime ${prms.range / prms.speed} ~startSpeed ${prms.speed} ~startSize < ~x 30 ~y 30 ~z 75 > ~startColor [ ${prms.color} 1 ] > ~emission < ~rateOverTime 0 ~burstCount 2 > ~colorOverLifetime < ~gradient < ~alphaKeys [ [ 0.0 0.0 ] [ 0.05 1.0 ] [ 0.95 1.0 ] [ 1.0 0.0 ] ] > > ~renderer < ~renderMode (Mesh) ~meshDistribution (NonUniformRandom) ~meshes (Bullet) ~material < ~texture (Glow_2) > ~alignment (Local) > > def $setMagic { $preset ~rotationOverLifetime < ~z 500 > put $preset ~renderer get ~material < ~texture (Glow_3) > put } exec $setMagic { $preset ~renderer get dup ~material < ~shader (AlphaBlended) ~texture (Glow_3) > put ~sortingFudge 10 put } exec $setMagic { $preset ~main get ~startSize < ~x 10 ~y 10 ~z 200 > put $preset ~rotationOverLifetime < ~z 800 > put $preset ~renderer get dup dup ~meshes (Cylinder_1) put ~material < ~texture (Spiral) ~shader (Additive) > put ~sortingFudge 0 put } exec $setMagic { $preset ~main get ~startSize 0.1 put $preset ~trails < ~lifetime 0.2 > put $preset ~renderer < ~material < ~texture (Glow_1) > ~trailMaterial < ~texture (Trail_1) > > put } exec $setMagic { $preset ~renderer get dup ~trailMaterial < ~shader (AlphaBlended) ~texture (Trail_1) > put ~sortingFudge 10 put } exec $setMagic $root < ~position [ ${prms.position} ] ~rotation [ ${prms.rotation} ] ~scale ${prms.scale} > transform $root end}`;
            },
        invalidVariableNames:
            ["root", "setMagic", "magic", "preset"],
    },
    charge: {
        parameters:
        {
            scale: { type: "numberOrVector3", defaultValue: "2" },
            position: { type: "vector3", defaultValue: "0 0 0" },
            rotation: { type: "vector3", defaultValue: "0 0 0" },
            color1: { type: "color", defaultValue: "1 0.5 0" }, // core smoke
            color2: { type: "color", defaultValue: "1 0.5 0" }, // trail
            color3: { type: "color", defaultValue: "0.25 0.125 0" }, // black
            color4: { type: "color", defaultValue: "1 0.8 0.6" }, // dot
            interval: { type: "number", defaultValue: "2" },
        },
        converter:
            (prms, prmfgs) => {
                const position = prmfgs.position ? " ~position [ " + prms.position + " ]" : "";
                const rotation = prmfgs.rotation ? " ~rotation [ " + prms.rotation + " ]" : "";
                return `{ dict begin ~root < ~shape (empty) > spawnobj ~setMagic { ~magic $preset magicactivate $magic $root attachtoparent } def ~preset < ~main < ~duration ${prms.interval} ~startLifetime 1 ~startSpeed 0 ~startColor [ ${prms.color2} 1 ] > ~emission < ~rateOverTime 0 ~bursts [<~count 20>] > ~shape < ~shape (Sphere) ~radius 4 ~radiusThickness 0.2 > ~velocityOverLifetime < ~orbitalY [ [ 0 0 ] [ 1 15 ] ] ~radial -5 > ~colorOverLifetime < ~gradient < ~alphaKeys [ [ 0.0 0.0 ] [ 0.2 1.0 ] [ 1.0 1.0 ] ] > > ~trails < ~lifetime [ 0.1 0.2 ] ~minVertexDistance 0.1 ~sizeAffectsWidth false ~widthOverTrail [ [ 0 0.05 ] [ 1 0 ] ] > ~renderer < ~renderMode (None) ~trailMaterialName (Smoke_2) > > def $setMagic { $preset dup dup dup ~main get ~startColor [ ${prms.color3} 1 ] put ~emission get ~bursts [<~count 8>] put ~trails get ~widthOverTrail [ [ 0 0.15 ] [ 1 0.02 ] ] put ~renderer get ~shader (alphablended) put } exec $setMagic { $preset ~main get dup dup ~startLifetime [ 0.7 1 ] put ~startSize [ 0.2 0.3 ] put ~startColor [ ${prms.color4} 1 ] put $preset ~emission get ~bursts [<~count 20>] put $preset ~velocityOverLifetime < ~orbitalY [ [ 0 0 ] [ 1 10 ] ] ~radial [ -2 -3 ] > put $preset ~colorOverLifetime get ~gradient get ~alphaKeys [ [ 0 0 ] [ 0.2 1 ] [ 0.8 1 ] [ 1 0 ] ] put $preset ~trails get ~enabled false put $preset ~renderer < ~materialName (Cross) > put } exec $setMagic { $preset ~main get dup dup ~startSize [ 2 3 ] put ~startRotation [ 0 360 ] put ~startColor [ ${prms.color1} 0.1 ] put $preset ~emission get ~bursts [<~count 100>] put $preset ~velocityOverLifetime < ~orbitalY [ [ 0 1 ] [ 1 20 ] ] ~radial -5 > put $preset ~colorOverLifetime get ~gradient get ~alphaKeys [ [ 0 0 ] [ 1 0.5 ] ] put $preset ~sizeOverLifetime < ~size [ [ 0 1 ] [ 0.5 1 ] [ 1 0 ] ] > put $preset ~renderer < ~materialName (Smoke_2) > put } exec $setMagic { $preset ~main get ~startColor [ ${prms.color1} 0.05 ] put $preset ~renderer get dup ~shader (alphablended) put ~sortingFudge 10 put } exec $setMagic ~preset < ~main < ~duration ${prms.interval} ~startDelay 0.2 ~startLifetime 1 ~startSpeed 0 ~startSize 1.5 ~startColor [ ${prms.color1} 1 ] > ~emission < ~rateOverTime 0 ~bursts [<~count 5>] > ~sizeOverLifetime < ~size [ [ 0 0 ] [ 0.3 0.6 ] [ 0.7 1 ] [ 1 0 ] ] > ~renderer < ~materialName (Grow_1) > > def $setMagic { $preset ~main get ~startColor [ ${prms.color1} 1 ] put $preset ~renderer get dup ~shader (alphablended) put ~sortingFudge 10 put } exec $setMagic $root <${position}${rotation} ~scale ${prms.scale} > transform $root end}`;
            },
        invalidVariableNames:
            ["root", "setMagic", "magic", "preset"],
    },
    barrier: {
        parameters: {
            scale: { type: "numberOrVector3", defaultValue: "2" },
            position: { type: "vector3", defaultValue: "0 0 0" },
            rotation: { type: "vector3", defaultValue: "0 0 0" },
        },
        converter: //入力されたパラメータからコードに変換する変換器
            (prms, prmfgs) => {
                return `{ dict begin ~root < ~shape (empty) > spawnobj ~setMagic { ~magic $preset magicactivate $magic $root attachtoparent } def ~preset < ~main < ~startLifetime 2 ~startSpeed 0 ~startSize 100 ~startRotation < ~x [ 0 360 ] ~y [ 0 360 ] ~z [ 0 360 ] > ~startColor [ 0.4 0.8 1 1 ] > ~emission < ~rateOverTime 2 > ~colorOverLifetime < ~gradient < ~alphaKeys [ [ 0.0 0.0 ] [ 0.3 1.0 ] [ 1.0 0.0 ] ] > > ~customData < ~x 0.2 ~y 0.2 ~z 0.85 ~w 0.35 > ~renderer < ~renderMode (Mesh) ~meshes (Sphere_1) ~material < ~texture (Smoke_4) ~shader (Aura) > ~alignment (Local) > > def $setMagic $magic < ~position [ 0 0.7 0 ] > transform { $preset ~customData < ~x 0.2 ~y 0.2 ~z 2.8 ~w 1 > put $preset ~renderer get ~material < ~shader (Aura) > put } exec $setMagic $magic < ~position [ 0 0.7 0 ] > transform { $preset ~main get ~startRotation < ~y [ 0 360 ] > put $preset ~sizeOverLifetime < ~size [ [ 0 0.5 ] [ 1 1 ] ] > put $preset ~customData < ~x -0.3 ~y [ -0.3 0.3 ] ~z 0.8 ~w 0.35 > put $preset ~renderer get dup ~meshes (Ring_1) put ~material < ~texture (Smoke_4) ~shader (Aura) > put } exec $setMagic $root < ~scale 1 > transform $root end }`;
            },
        invalidVariableNames: // 入れてほしくない変数（例えば　scaleにrootとか入れられられると困る）
            ["root", "setMagic", "magic", "preset"],
    },
};


function magicTemplates(magic, spell) {
    const [prms, prmfgs] = code2parameters(templateDatas[magic], spell)
    console.log(prms);
    const convertedSpell = templateDatas[magic].converter(prms, prmfgs);
    return convertedSpell;
}

function code2parameters(magicData, spell) {
    const tokens = activeInterpreter.parse(spell);
    console.log(tokens);
    let lastName = null;
    let prms = Object.fromEntries(
        Object.entries(magicData.parameters).map(([key, value]) => [key, value.defaultValue])
    );
    let prmfgs = Object.fromEntries(
        Object.entries(magicData.parameters).map(([key, value]) => [key, false])
    );

    // 配列内のトークンを文字列化するヘルパー関数
    const tokenToString = (token) => {
        if (typeof token === 'string') return token;
        if (typeof token === 'object' && token.type === 'variable_name') return "$" + token.value;
        return "";
    };

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (lastName) {
            if (prms[lastName]) {
                if (typeof token == "object" && token.type == "variable_name") // 変数が代入されようとしている時
                {
                    if (!(magicData.invalidVariableNames.includes(token.value))) {
                        prms[lastName] = "$" + token.value;
                        prmfgs[lastName] = true;
                    }
                    lastName = null;
                    continue;
                }

                switch (magicData.parameters[lastName].type) {
                    case "boolean":
                        if (typeof token == "string" && (token in ["true", "false"])) {
                            prms[lastName] = token;
                            prmfgs[lastName] = true;
                        }
                        break;
                    case "number":
                        if (typeof token == "string") {
                            prms[lastName] = token.match(/^\s*-?0+(\.0+)?\s*$/) ? "0.001" : token;
                            prmfgs[lastName] = true;
                        }
                        break;
                    case "vector3":
                        if (typeof token == "object" && token.type == "array" && token.value.length >= 3) {
                            // 変数オブジェクトを文字列に戻して結合
                            prms[lastName] = token.value.slice(0, 3).map(tokenToString).join(" ");
                            prmfgs[lastName] = true;
                        }
                        break;
                    case "numberOrVector3":
                        if (typeof token == "string") {
                            prms[lastName] = token;
                            prmfgs[lastName] = true;
                        }
                        else if (typeof token == "object" && token.type == "array" && token.value.length >= 3) {
                            prms[lastName] = "[ " + token.value.slice(0, 3).map(tokenToString).join(" ") + " ]";
                            prmfgs[lastName] = true;
                        }
                        break
                    case "color":
                        if (typeof token == "object" && token.type == "array" && token.value.length >= 3) {
                            prms[lastName] = token.value.slice(0, 3).map(tokenToString).join(" ");
                            prmfgs[lastName] = true;
                        }
                        else if (typeof token == "string" && token.match(/^\(.*\)$/) && colorsDict[token.slice(1, -1).toLowerCase()]) {
                            prms[lastName] = colorsDict[token.slice(1, -1).toLowerCase()];
                            prmfgs[lastName] = true;
                        }
                        break;
                }
            }
            lastName = null;
        }
        else {
            if (token[0] === "~") {
                lastName = token.slice(1).toLowerCase();
            }
        }
    }
    return [prms, prmfgs];
}