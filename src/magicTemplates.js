const templateDatas = {
    fire : { 
        parameters : //このテンプレートで設定できるパラメータ
            {
                scale : {type : "numberOrVector3", defaultValue : "2"},
                position : {type : "vector3", defaultValue : "0 0 0"},
                rotation : {type : "vector3", defaultValue : "-90 0 0"},
                color1 : {type : "color", defaultValue : "1.0 0.6 0.0 1.0"},
                color2 : {type : "color", defaultValue : "1.0 0.0 0.0 1.0"},
            },
        converter : //入力されたパラメータからコードに変換する変換器
            (prms, prmfgs) => {
                    const position = prmfgs.position ? " ~position [ " + prms.position + " ]" : "";
                    return `{dict begin ~root < ~shape (empty) > spawnobj ~setMagic { ~magic $preset magicactivate $magic $root attachtoparent } def ~preset < ~main < ~startLifetime [ 0.5 2 ] ~startSpeed 0.5 ~startSize [ 0.2 0.4 ] ~startRotation [ 0 360 ] > ~emission < ~rateOverTime 50 > ~shape < ~angle 5 ~radius 0.0001 > ~colorOverLifetime < ~gradient < ~colorKeys [ [ ${prms.color1} 0.0 ] [ ${prms.color2} 0.6 ] [ ${prms.color2} 1.0 ] ] ~alphaKeys [ [ 0.0 0.0 ] [ 1.0 0.5 ] [ 0.0 1.0 ] ] > > ~rotationOverLifetime < ~z [ -45 45 ] > ~renderer < ~materialName (Fire_1) > > def $setMagic { $preset ~renderer get dup ~shader (alphablended) put ~sortingFudge 10 put } exec $setMagic $root <${position} ~rotation [ ${prms.rotation} ] ~scale ${prms.scale} > transform end}`;
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
                color : {type : "color", defaultValue : "1.0 0.5 0.0 1.0"},
                speed : {type : "number", defaultValue : "10"}, // startSpeed
                range : {type : "number", defaultValue : "20"}, // startSpeed * startLifetime
                interval : {type : "number", defaultValue : "1"}, // duration
            },
        converter :
            (prms, prmfgs) => {
                const position = prmfgs.position ? " ~position [ " + prms.position + " ]" : "";
                const rotation = prmfgs.rotation ? " ~rotation [ " + prms.rotation + " ]" : "";
                return `{ dict begin ~root < ~shape (empty) > spawnobj ~setMagic { ~magic $preset magicactivate $magic $root attachtoparent } def ~preset < ~main < ~duration ${prms.interval} ~startLifetime ${prms.range/prms.speed} ~startSpeed ${prms.speed} ~startSize [ 30 30 75 ] ~startColor [ ${prms.color} ] > ~emission < ~rateOverTime 0 ~burstCount 2 > ~colorOverLifetime < ~gradient < ~alphaKeys [ [ 0.0 0.0 ] [ 1.0 0.05 ] [ 1.0 0.95 ] [ 0.0 1.0 ] ] > > ~renderer < ~renderMode (Mesh) ~meshDistribution (NonUniformRandom) ~meshes (Bullet) ~materialName (Cross) ~alignment (Local) > > def $setMagic { $preset dup ~rotationOverLifetime < ~z 500 > put ~renderer get ~materialName (Grow_2) put } exec $setMagic { $preset ~renderer get dup ~shader (alphablended) put ~sortingFudge 10 put } exec $setMagic { $preset dup dup ~main get ~startSize [ 15 15 200 ] put ~rotationOverLifetime < ~z -800 > put ~renderer get dup dup dup ~meshes (Cylinder) put ~materialName (Spiral) put ~shader (additive) put ~sortingFudge 0 put } exec $setMagic { $preset dup dup ~main get ~startSize 0.1 put ~trails < ~lifetime 0.2 > put ~renderer < ~materialName (Grow_1) ~trailMaterialName (Trail) ~shader (additive) > put } exec $setMagic { $preset ~renderer get dup ~shader (alphablended) put ~sortingFudge 10 put } exec $setMagic $root <${position}${rotation} ~scale ${prms.scale} > transform end}`;
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
                        const colors = { 
                            black: "0.0 0.0 0.0", white: "1.0 1.0 1.0", red: "1.0 0.0 0.0", green: "0.0 1.0 0.0",
                            blue: "0.0 0.0 1.0", yellow: "1.0 1.0 0.0", cyan: "0.0 1.0 1.0", magenta: "1.0 0.0 1.0",
                            gray: "0.5 0.5 0.5", orange: "1.0 0.5 0.0", purple: "0.5 0.0 0.5", brown: "0.6 0.4 0.2"
                        };
                        
                        if (typeof token == "object" && token.type == "array" && token.value.length >= 3)
                        {
                            prms[lastName] = token.value.slice(0,min(4,token.value.length)).join(" ") + (token.value.length == 3 ? " 1.0" : "");
                            prmfgs[lastName] = true;
                        }
                        else if (typeof token == "string" && token.match(/^\(.*\)$/) && colors[token.slice(1,-1).toLowerCase()])
                        {
                            prms[lastName] = colors[token.slice(1,-1).toLowerCase()] + " 1.0";
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