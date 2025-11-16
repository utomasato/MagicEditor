function magicTemplates(magic, spell)
{
    let convertedSpell = "";
    switch (magic)
    {
        case "fire":
            // 大きさ　勢い　収束度　色 揺らぎ
            convertedSpell = `{ dict begin ~preset < ~main < ~startLifetime [ 0.5 2 ] ~startSpeed 0.5 ~startSize [ 0.2 0.4 ] ~startRotation [ 0 360 ] > ~emission < ~rateOverTime 50 > ~shape < ~angle 5 ~radius 0.0001 > ~colorOverLifetime < ~gradient < ~colorKeys [ [ 1.0 0.6 0.0 1.0 0.0 ] [ 1.0 0.0 0.0 1.0 0.6 ] [ 1.0 0.0 0.0 1.0 1.0 ] ] ~alphaKeys [ [ 0.0 0.0 ] [ 1.0 0.5 ] [ 0.0 1.0 ] ] > > ~rotationOverLifetime < ~z [ -45 45 ] > ~renderer < ~materialName (Fire_1) > > def ~magic preset magicactivate magic dup < ~rotation [ -90 0 0 ] ~scale 1 > transform end }`;
            break;
        case "bullet":
            // 大きさ　色　射程　速度
            convertedSpell = `{ dict begin ~root < ~shape (empty) > spawnobj ~setMagic { ~magic preset magicactivate magic root attachtoparent } def ~preset < ~main < ~duration 1 ~startLifetime 2 ~startSpeed 10 ~startSize [ 30 30 75 ] ~startColor [ 1 0.5 0 1 ] > ~emission < ~rateOverTime 0 ~burstCount 2 > ~colorOverLifetime < ~gradient < ~alphaKeys [ [ 0.0 0.0 ] [ 1.0 0.05 ] [ 1.0 0.95 ] [ 0.0 1.0 ] ] > > ~renderer < ~renderMode (Mesh) ~meshDistribution (NonUniformRandom) ~meshes (Bullet) ~materialName (Cross) ~alignment (Local) > > def setMagic { preset dup ~rotationOverLifetime < ~z 500 > put ~renderer get ~materialName (Grow_2) put } exec setMagic { preset dup dup ~main get ~startSize [ 15 15 200 ] put ~rotationOverLifetime < ~z -800 > put ~renderer get dup ~meshes (Cylinder) put ~materialName (Spiral) put } exec setMagic { preset dup dup ~main get ~startSize 0.1 put ~trails < ~lifetime 0.2 > put ~renderer < ~materialName (Grow_1) ~trailMaterialName (Trail) > put } exec setMagic root　dup < ~scale 2 > transform end }`;
            break;
        default:
    }
    return convertedSpell;
}