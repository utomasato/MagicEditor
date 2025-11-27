const templateDatas = {
    fire : { 
        parameters : //このテンプレートで設定できるパラメータ
            {
                scale : {type : "numberOrVector3", defaultValue : "2"},
                position : {type : "vector3", defaultValue : "0 0 0"},
                rotation : {type : "vector3", defaultValue : "-90 0 0"},
                color1 : {type : "color", defaultValue : "1.0 0.6 0.0"},
                color2 : {type : "color", defaultValue : "1.0 0.0 0.0"},
            },
        converter : //入力されたパラメータからコードに変換する変換器
            (prms, prmfgs) => {
                    const position = prmfgs.position ? " ~position [ " + prms.position + " ]" : "";
                    return `{dict begin ~root < ~shape (empty) > spawnobj ~setMagic { ~magic $preset magicactivate $magic $root attachtoparent } def ~preset < ~main < ~startLifetime [ 0.5 2 ] ~startSpeed 0.5 ~startSize [ 0.2 0.4 ] ~startRotation [ 0 360 ] > ~emission < ~rateOverTime 50 > ~shape < ~angle 5 ~radius 0.0001 > ~colorOverLifetime < ~gradient < ~colorKeys [ [ 0.0 ${prms.color1} 1.0 ] [ 0.6 ${prms.color2} 1.0 ] [ 1.0 ${prms.color2} 1.0 ] ] ~alphaKeys [ [ 0.0 0.0 ] [ 0.5 1.0 ] [ 1.0 0.0 ] ] > > ~rotationOverLifetime < ~z [ -45 45 ] > ~renderer < ~material <~texture (Smoke_1)> > > def $setMagic { $preset ~renderer get dup ~material <~shader (AlphaBlended) ~texture (Smoke_1)> put ~sortingFudge 10 put } exec $setMagic $root <${position} ~rotation [ ${prms.rotation} ] ~scale ${prms.scale} > transform end}`;
                },
        invalidVariableNames : // 入れてほしくない変数（例えば　scaleにrootとか入れられられると困る）
            ["root", "setMagic", "magic", "preset"],
    },
    bullet : {
        parameters :
            {
                scale : {type : "numberOrVector3", defaultValue : "2"},
                position : {type : "vector3", defaultValue : "0 0 0"},
                rotation : {type : "vector3", defaultValue : "0 0 0"},
                color : {type : "color", defaultValue : "1.0 0.5 0.0"},
                speed : {type : "number", defaultValue : "10"}, // startSpeed
                range : {type : "number", defaultValue : "20"}, // startSpeed * startLifetime
                interval : {type : "number", defaultValue : "2"}, // duration
            },
        converter :
            (prms, prmfgs) => {
                const position = prmfgs.position ? " ~position [ " + prms.position + " ]" : "";
                const rotation = prmfgs.rotation ? " ~rotation [ " + prms.rotation + " ]" : "";
                return `{ dict begin ~root < ~shape (empty) > spawnobj ~setMagic { ~magic $preset magicactivate $magic $root attachtoparent } def ~preset < ~main < ~duration ${prms.interval} ~startLifetime ${prms.range/prms.speed} ~startSpeed ${prms.speed} ~startSize < ~x 30 ~y 30 ~z 75 > ~startColor [ ${prms.color} 1.0 ] > ~emission < ~rateOverTime 0 ~bursts [<~count 2>] > ~colorOverLifetime < ~gradient < ~alphaKeys [ [ 0.0 0.0 ] [ 0.05 1.0 ] [ 0.95 1.0 ] [ 1.0 0.0 ] ] > > ~renderer < ~renderMode (Mesh) ~meshDistribution (NonUniformRandom) ~meshes (Bullet) ~material <~texture (Glow_2)> ~alignment (Local) > > def $setMagic { $preset dup ~rotationOverLifetime < ~z 500 > put ~renderer get  ~material <~texture (Glow_2)> put } exec $setMagic { $preset ~renderer get dup ~shader (alphablended) put ~sortingFudge 10 put } exec $setMagic { $preset dup dup ~main get ~startSize < ~x 8 ~y 8 ~z 200 > put ~rotationOverLifetime < ~z 800 > put ~renderer get dup dup ~meshes (Cylinder) put ~material <~shader (Additive) ~texture (Spiral)> put ~sortingFudge 0 put } exec $setMagic { $preset dup dup ~main get ~startSize 0.1 put ~trails < ~lifetime 0.2 > put ~renderer < ~material <~texture (Glow_1)> ~trailMaterial <~shader (Additive) ~texture (Trail_1)> ~shader (additive) > put } exec $setMagic { $preset ~renderer get dup ~shader (alphablended) put ~sortingFudge 10 put } exec $setMagic $root <${position}${rotation} ~scale ${prms.scale} > transform end}`;
            },
        invalidVariableNames :
            ["root", "setMagic", "magic", "preset"],
    },
    charge : {
        parameters :
            {
                scale : {type : "numberOrVector3", defaultValue : "2"},
                position : {type : "vector3", defaultValue : "0 0 0"},
                rotation : {type : "vector3", defaultValue : "0 0 0"},
                color1 : {type : "color", defaultValue : "1 0.5 0"}, // core smoke
                color2 : {type : "color", defaultValue : "1 0.5 0"}, // trail
                color3 : {type : "color", defaultValue : "0.25 0.125 0"}, // black
                color4 : {type : "color", defaultValue : "1 0.8 0.6"}, // dot
                interval : {type : "number", defaultValue : "2"},
            },
        converter :
            (prms, prmfgs) => {
                const position = prmfgs.position ? " ~position [ " + prms.position + " ]" : "";
                const rotation = prmfgs.rotation ? " ~rotation [ " + prms.rotation + " ]" : "";
                return `{ dict begin ~root < ~shape (empty) > spawnobj ~setMagic { ~magic $preset magicactivate $magic $root attachtoparent } def ~preset < ~main < ~duration ${prms.interval} ~startLifetime 1 ~startSpeed 0 ~startColor [ ${prms.color2} 1 ] > ~emission < ~rateOverTime 0 ~bursts [<~count 20>] > ~shape < ~shape (Sphere) ~radius 4 ~radiusThickness 0.2 > ~velocityOverLifetime < ~orbitalY [ [ 0 0 ] [ 1 15 ] ] ~radial -5 > ~colorOverLifetime < ~gradient < ~alphaKeys [ [ 0.0 0.0 ] [ 0.2 1.0 ] [ 1.0 1.0 ] ] > > ~trails < ~lifetime [ 0.1 0.2 ] ~minVertexDistance 0.1 ~sizeAffectsWidth false ~widthOverTrail [ [ 0 0.05 ] [ 1 0 ] ] > ~renderer < ~renderMode (None) ~trailMaterialName (Smoke_2) > > def $setMagic { $preset dup dup dup ~main get ~startColor [ ${prms.color3} 1 ] put ~emission get ~bursts [<~count 8>] put ~trails get ~widthOverTrail [ [ 0 0.15 ] [ 1 0.02 ] ] put ~renderer get ~shader (alphablended) put } exec $setMagic { $preset ~main get dup dup ~startLifetime [ 0.7 1 ] put ~startSize [ 0.2 0.3 ] put ~startColor [ ${prms.color4} 1 ] put $preset ~emission get ~bursts [<~count 20>] put $preset ~velocityOverLifetime < ~orbitalY [ [ 0 0 ] [ 1 10 ] ] ~radial [ -2 -3 ] > put $preset ~colorOverLifetime get ~gradient get ~alphaKeys [ [ 0 0 ] [ 0.2 1 ] [ 0.8 1 ] [ 1 0 ] ] put $preset ~trails get ~enabled false put $preset ~renderer < ~materialName (Cross) > put } exec $setMagic { $preset ~main get dup dup ~startSize [ 2 3 ] put ~startRotation [ 0 360 ] put ~startColor [ ${prms.color1} 0.1 ] put $preset ~emission get ~bursts [<~count 100>] put $preset ~velocityOverLifetime < ~orbitalY [ [ 0 1 ] [ 1 20 ] ] ~radial -5 > put $preset ~colorOverLifetime get ~gradient get ~alphaKeys [ [ 0 0 ] [ 1 0.5 ] ] put $preset ~sizeOverLifetime < ~size [ [ 0 1 ] [ 0.5 1 ] [ 1 0 ] ] > put $preset ~renderer < ~materialName (Smoke_2) > put } exec $setMagic { $preset ~main get ~startColor [ ${prms.color1} 0.05 ] put $preset ~renderer get dup ~shader (alphablended) put ~sortingFudge 10 put } exec $setMagic ~preset < ~main < ~duration ${prms.interval} ~startDelay 0.2 ~startLifetime 1 ~startSpeed 0 ~startSize 1.5 ~startColor [ ${prms.color1} 1 ] > ~emission < ~rateOverTime 0 ~bursts [<~count 5>] > ~sizeOverLifetime < ~size [ [ 0 0 ] [ 0.3 0.6 ] [ 0.7 1 ] [ 1 0 ] ] > ~renderer < ~materialName (Grow_1) > > def $setMagic { $preset ~main get ~startColor [ ${prms.color1} 1 ] put $preset ~renderer get dup ~shader (alphablended) put ~sortingFudge 10 put } exec $setMagic $root <${position}${rotation} ~scale ${prms.scale} > transform end}`;
            },
        invalidVariableNames :
            ["root", "setMagic", "magic", "preset"],
    },
};


function magicTemplates(magic, spell)
{
    const [prms, prmfgs] = code2parameters(templateDatas[magic], spell)
    console.log(prms);
    const convertedSpell = templateDatas[magic].converter(prms, prmfgs);
    return convertedSpell;
}

function code2parameters(magicData, spell)
{
    const tokens = activeInterpreter.parse(spell);
    console.log(tokens);
    let lastName = null;
    let prms = Object.fromEntries(
        Object.entries(magicData.parameters).map(([key, value]) => [key, value.defaultValue])
    );
    let prmfgs = Object.fromEntries(
        Object.entries(magicData.parameters).map(([key, value]) => [key, false])
    );
    for (let i = 0; i < tokens.length; i++)
    {
        const token = tokens[i];
        if (lastName)
        {
            if (prms[lastName])
            {
                if (typeof token == "object" && token.type == "variable_name") // 変数が代入されようとしている時
                {
                    if (!(magicData.invalidVariableNames.includes(token.value)))
                    {
                        prms[lastName] = "$" + token.value;
                        prmfgs[lastName] = true;
                    }
                    lastName = null;
                    continue;
                }
                
                switch (magicData.parameters[lastName].type)
                {
                    case "boolean":
                        if (typeof token == "string" && (token in ["true", "false"]))
                        {
                            prms[lastName] = token;
                            prmfgs[lastName] = true;
                        }
                        break;
                    case "number":
                        if (typeof token == "string")
                        {
                            prms[lastName] = token;
                            prmfgs[lastName] = true;
                        }
                        break;
                    case "vector3":
                        if (typeof token == "object" && token.type == "array" && token.value.length >= 3)
                        {
                            prms[lastName] = token.value.slice(0,3).join(" ");
                            prmfgs[lastName] = true;
                        }
                        break;
                    case "numberOrVector3":
                        if (typeof token == "string")
                        {
                            prms[lastName] = token;
                            prmfgs[lastName] = true;
                        }
                        else if (typeof token == "object" && token.type == "array" && token.value.length >= 3)
                        {
                            prms[lastName] = "[ " + token.value.slice(0,3).join(" ") + " ]";
                            prmfgs[lastName] = true;
                        }
                        break
                    case "color":
                        if (typeof token == "object" && token.type == "array" && token.value.length >= 3)
                        {
                            prms[lastName] = token.value.slice(0,3).join(" ");
                            prmfgs[lastName] = true;
                        }
                        else if (typeof token == "string" && token.match(/^\(.*\)$/) && colorsDict[token.slice(1,-1).toLowerCase()])
                        {
                            prms[lastName] = colorsDict[token.slice(1,-1).toLowerCase()];
                            prmfgs[lastName] = true;
                        }
                        break;
                }
            }
            lastName = null;
        }
        else
        {
            if (token[0] === "~")
            {
                lastName = token.slice(1).toLowerCase();
            }
        }
    }
    return [prms, prmfgs];
}