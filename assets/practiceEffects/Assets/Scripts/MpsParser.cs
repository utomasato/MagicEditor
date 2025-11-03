using UnityEngine;
using System.Collections.Generic;
using System;
using System.Globalization;



/// <summary>
/// Transform情報を格納するための構造体。Nullable型を使い、指定されなかった項目は更新しないようにする。
/// </summary>
public struct TransformData
{
    public Vector3? position;
    public Vector3? rotation;
    public Vector3? scale;
}

/// <summary>
/// オブジェクト生成情報を格納するための構造体
/// </summary>
public struct ObjectCreationData
{
    public string objectType;
}


[System.Serializable]
public class AnimationDatas
{
    public bool isActive_pos = false;
    public bool isActive_rot = false;
    public bool isActive_scale = false;
    public AnimationData posAnimData;
    public AnimationData rotAnimData;
    public AnimationData scaleAnimData;
}

[System.Serializable]
public class AnimationData
{
    public Vector3 from = Vector3.zero;
    public Vector3 to = Vector3.zero;
    public float duration = 1000;
    public bool loop = false;
    public bool reverse = false;
    public bool easeIn = false;
    public bool easeOut = false;
}


/// <summary>
/// p5.jsから送られてくるmpsコードを解析し、ParticlePresetオブジェクトに変換する静的クラスです。
/// </summary>
public static class MpsParser
{
    // 文字列をトークン単位で読み進めるためのヘルパークラス
    private class Scanner
    {
        private readonly string[] _tokens;
        private int _position;

        public Scanner(string text)
        {
            text = text.Replace("<", " < ")
                       .Replace(">", " > ")
                       .Replace("[", " [ ")
                       .Replace("]", " ] ")
                       .Replace("(", " ( ")
                       .Replace(")", " ) ")
                       .Replace("~", " ~");
            _tokens = text.Split(new[] { ' ', '\t', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);
            _position = 0;
        }

        public string Peek() => _position < _tokens.Length ? _tokens[_position] : null;
        public string Consume() => _position < _tokens.Length ? _tokens[_position++] : null;
        public void Expect(string token)
        {
            var consumed = Consume();
            if (consumed != token)
                throw new Exception($"Parse Error: Expected '{token}' but got '{consumed}'.");
        }
        public float ConsumeFloat() => float.Parse(Consume(), CultureInfo.InvariantCulture);
        public bool ConsumeBool() => bool.Parse(Consume());

        /// <summary>
        /// '(' から ')' までのトークンを連結して1つの文字列として消費します。スペースを含む文字列に対応します。
        /// </summary>
        public string ConsumeStringInParens()
        {
            Expect("(");
            string content = "";
            while (Peek() != null && Peek() != ")")
            {
                content += Consume() + " ";
            }
            Expect(")");
            return content.Trim();
        }
    }
    /// <summary>
    /// オブジェクト生成用のmpsコードを解析します。
    /// </summary>
    public static ObjectCreationData ParseObjectCreation(string mpsCode)
    {
        var scanner = new Scanner(mpsCode);
        var data = new ObjectCreationData();

        scanner.Expect("<");
        while (scanner.Peek() != null && scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1); // '~' を取り除く
            switch (key)
            {
                case "shape":
                    data.objectType = scanner.ConsumeStringInParens();
                    break;
                default:
                    throw new Exception($"Unknown object creation key: {key}");
            }
        }
        scanner.Expect(">");

        return data;
    }

    /// <summary>
    /// Transform情報（位置、回転、スケール）のmpsコードを解析します。
    /// </summary>
    public static TransformData ParseTransform(string transformCode)
    {
        var scanner = new Scanner(transformCode);
        var data = new TransformData();

        scanner.Expect("<");
        while (scanner.Peek() != null && scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1); // '~' を取り除く
            switch (key)
            {
                case "position":
                    data.position = ParseVector3(scanner);
                    break;
                case "rotation":
                    data.rotation = ParseVector3(scanner);
                    break;
                case "scale":
                    data.scale = ParseVector3(scanner);
                    break;
                default:
                    throw new Exception($"Unknown transform key: {key}");
            }
        }
        scanner.Expect(">");

        return data;
    }

    private static Vector3 ParseVector3(Scanner scanner)
    {
        scanner.Expect("[");
        var x = scanner.ConsumeFloat();
        var y = scanner.ConsumeFloat();
        var z = scanner.ConsumeFloat();
        scanner.Expect("]");
        return new Vector3(x, y, z);
    }

    /// <summary>
    /// Animation情報（位置、回転、スケール）のmpsコードを解析します。
    /// </summary>
    public static AnimationDatas ParseAnimation(string animationCode)
    {
        var scanner = new Scanner(animationCode);
        var data = new AnimationDatas();

        scanner.Expect("<");
        while (scanner.Peek() != null && scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1); // '~' を取り除く
            switch (key)
            {
                case "position":
                    data.isActive_pos = true;
                    data.posAnimData = ParseAnimElement(scanner);
                    break;
                case "rotate":
                    data.isActive_rot = true;
                    data.rotAnimData = ParseAnimElement(scanner);
                    break;
                case "scale":
                    data.isActive_scale = true;
                    data.scaleAnimData = ParseAnimElement(scanner);
                    break;
                default:
                    throw new Exception($"Unknown animation key: {key}");
            }
        }
        scanner.Expect(">");

        return data;
    }

    private static AnimationData ParseAnimElement(Scanner scanner)
    {
        scanner.Expect("<");
        var animData = new AnimationData();
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            switch (key)
            {
                case "from": animData.from = ParseVector3(scanner); break;
                case "to": animData.to = ParseVector3(scanner); break;
                case "duration": animData.duration = scanner.ConsumeFloat(); break;
                case "loop": animData.loop = scanner.ConsumeBool(); break;
                case "reverse": animData.reverse = scanner.ConsumeBool(); break;
                case "easeIn": animData.easeIn = scanner.ConsumeBool(); break;
                case "easeOut": animData.easeOut = scanner.ConsumeBool(); break;
                default: throw new Exception($"Unknown animation module key: {key}");
            }
        }
        scanner.Expect(">");
        return animData;
    }


    /// <summary>
    /// mpsコード文字列をParticlePresetオブジェクトに変換するメイン関数
    /// </summary>
    public static ParticlePreset Parse(string mpsCode, Dictionary<string, Material> materialDict, Dictionary<string, Mesh> meshDict)
    {
        var scanner = new Scanner(mpsCode);
        var preset = new ParticlePreset();

        scanner.Expect("<");
        ParseObjectContent(scanner, preset, materialDict, meshDict);
        scanner.Expect(">");

        return preset;
    }

    // オブジェクト '<' ... '>' の中身を解析
    private static void ParseObjectContent(Scanner scanner, ParticlePreset preset, Dictionary<string, Material> materialDict, Dictionary<string, Mesh> meshDict)
    {
        while (scanner.Peek() != null && scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            scanner.Expect("<");

            switch (key)
            {
                case "main": preset.main = ParseMainModule(scanner); break;
                case "emission": preset.emission = ParseEmissionModule(scanner); break;
                case "shape": preset.shape = ParseShapeModule(scanner); break;
                case "velocityOverLifetime": preset.velocityOverLifetime = ParseVelocityOverLifetimeModule(scanner); break;
                case "limitVelocityOverLifetime": preset.limitVelocityOverLifetime = ParseLimitVelocityOverLifetimeModule(scanner); break;
                case "inheritVelocity": preset.inheritVelocity = ParseInheritVelocityModule(scanner); break;
                case "forceOverLifetime": preset.forceOverLifetime = ParseForceOverLifetimeModule(scanner); break;
                case "colorOverLifetime": preset.colorOverLifetime = ParseColorOverLifetimeModule(scanner); break;
                case "colorBySpeed": preset.colorBySpeed = ParseColorBySpeedModule(scanner); break;
                case "sizeOverLifetime": preset.sizeOverLifetime = ParseSizeOverLifetimeModule(scanner); break;
                case "sizeBySpeed": preset.sizeBySpeed = ParseSizeBySpeedModule(scanner); break;
                case "rotationOverLifetime": preset.rotationOverLifetime = ParseRotationOverLifetimeModule(scanner); break;
                case "rotationBySpeed": preset.rotationBySpeed = ParseRotationBySpeedModule(scanner); break;
                case "externalForces": preset.externalForces = ParseExternalForcesModule(scanner); break;
                case "noise": preset.noise = ParseNoiseModule(scanner); break;
                case "collision": preset.collision = ParseCollisionModule(scanner); break;
                case "triggers": preset.triggers = new TriggersModuleData { enabled = true }; break;
                case "subEmitters": preset.subEmitters = new SubEmittersModuleData { enabled = true }; break;
                case "textureSheetAnimation": preset.textureSheetAnimation = ParseTextureSheetAnimationModule(scanner); break;
                case "lights": preset.lights = new LightsModuleData { enabled = true }; break;
                case "trails": preset.trails = ParseTrailsModule(scanner); break;
                case "customData": preset.customData = new CustomDataModuleData { enabled = true }; break;
                case "renderer": preset.renderer = ParseRendererModule(scanner, materialDict, meshDict); break;
                default: throw new Exception($"Unknown preset key: {key}");
            }
            scanner.Expect(">");
        }
    }

    private static MainModuleData ParseMainModule(Scanner scanner)
    {
        var main = new MainModuleData();
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            switch (key)
            {
                case "duration": main.duration = scanner.ConsumeFloat(); break;
                case "startLifetime": main.startLifetime = ParseMinMaxCurveOrConstant(scanner); break;
                case "startSpeed": main.startSpeed = ParseMinMaxCurveOrConstant(scanner); break;
                case "startSize3D": main.startSize3D = scanner.ConsumeBool(); break;
                case "startSize":
                    if (scanner.Peek() == "[")
                    {
                        scanner.Consume(); // 最初の'['を消費
                        if (scanner.Peek() == "[")
                        {
                            // 3Dレンジ形式: [[minX maxX] [minY maxY] [minZ maxZ]]
                            main.startSize3D = true;
                            main.startSizeX = ParseMinMaxCurve(scanner);
                            main.startSizeY = ParseMinMaxCurve(scanner);
                            main.startSizeZ = ParseMinMaxCurve(scanner);
                            scanner.Expect("]"); // 最後の']'を消費
                        }
                        else
                        {
                            // 1Dレンジ [min max] または 3D固定 [x y z]
                            var values = new List<float>();
                            while (scanner.Peek() != "]")
                            {
                                values.Add(scanner.ConsumeFloat());
                            }
                            scanner.Expect("]"); // 最後の']'を消費

                            if (values.Count == 2)
                            {
                                // 1Dレンジ
                                main.startSize3D = false;
                                main.startSize = new MinMaxCurveData { min = values[0], max = values[1] };
                            }
                            else if (values.Count == 3)
                            {
                                // 3D固定
                                main.startSize3D = true;
                                main.startSizeX = new MinMaxCurveData { min = values[0], max = values[0] };
                                main.startSizeY = new MinMaxCurveData { min = values[1], max = values[1] };
                                main.startSizeZ = new MinMaxCurveData { min = values[2], max = values[2] };
                            }
                            else
                            {
                                throw new Exception($"Invalid number of arguments for startSize. Expected 2 for a range or 3 for a 3D constant, but got {values.Count}.");
                            }
                        }
                    }
                    else
                    {
                        // 定数
                        main.startSize3D = false;
                        float value = scanner.ConsumeFloat();
                        main.startSize = new MinMaxCurveData { min = value, max = value };
                    }
                    break;
                case "startRotation": main.startRotation = ParseMinMaxCurveOrConstant(scanner); break;
                case "startColor":
                    if (scanner.Peek() == "[") // 単色 [r g b a]
                    {
                        scanner.Expect("[");
                        float r = scanner.ConsumeFloat();
                        float g = scanner.ConsumeFloat();
                        float b = scanner.ConsumeFloat();
                        float a = scanner.ConsumeFloat();
                        scanner.Expect("]");
                        var singleColor = new Color(r, g, b, a);

                        // 単色をシンプルなグラデーションとして表現
                        main.startColor = new GradientData();
                        main.startColor.colorKeys.Add(new ColorKeyData { color = singleColor, time = 0.0f });
                        main.startColor.alphaKeys.Add(new AlphaKeyData { alpha = singleColor.a, time = 0.0f });
                    }
                    else // グラデーション < ... >
                    {
                        main.startColor = ParseGradient(scanner);
                    }
                    break;
                case "simulationSpace":
                    string spaceStr = scanner.ConsumeStringInParens();
                    if (Enum.TryParse(spaceStr, true, out ParticleSystemSimulationSpace space))
                    {
                        main.simulationSpace = space;
                    }
                    else
                    {
                        Debug.LogWarning($"Unknown simulation space '{spaceStr}'. Defaulting to Local.");
                        main.simulationSpace = ParticleSystemSimulationSpace.Local;
                    }
                    break;
                default: throw new Exception($"Unknown main module key: {key}");
            }
        }
        return main;
    }

    private static EmissionModuleData ParseEmissionModule(Scanner scanner)
    {
        var emission = new EmissionModuleData { enabled = true };
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            switch (key)
            {
                case "rateOverTime":
                    emission.rateOverTime = ParseMinMaxCurveOrConstant(scanner);
                    break;
                case "burstCount":
                    var curve = ParseMinMaxCurveOrConstant(scanner);
                    emission.minBurstCount = (int)curve.min;
                    emission.maxBurstCount = (int)curve.max;
                    break;
                default:
                    throw new Exception($"Unknown emission module key: {key}");
            }
        }
        return emission;
    }

    private static ShapeModuleData ParseShapeModule(Scanner scanner)
    {
        var shape = new ShapeModuleData { enabled = true };
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            switch (key)
            {
                case "shape":
                    string shapeTypeStr = scanner.ConsumeStringInParens();
                    if (Enum.TryParse(shapeTypeStr, true, out ParticleSystemShapeType shapeType))
                    {
                        shape.shapeType = shapeType;
                    }
                    else
                    {
                        Debug.LogWarning($"Unknown shape type '{shapeTypeStr}'. Defaulting to Cone.");
                        shape.shapeType = ParticleSystemShapeType.Cone;
                    }
                    break;
                case "angle": shape.angle = scanner.ConsumeFloat(); break;
                case "radius": shape.radius = scanner.ConsumeFloat(); break;
                default: throw new Exception($"Unknown shape module key: {key}");
            }
        }
        return shape;
    }

    private static ColorOverLifetimeModuleData ParseColorOverLifetimeModule(Scanner scanner)
    {
        var col = new ColorOverLifetimeModuleData { enabled = true };
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            if (key == "gradient") col.color = ParseGradient(scanner);
            else throw new Exception($"Unknown colorOverLifetime module key: {key}");
        }
        return col;
    }

    private static RotationOverLifetimeModuleData ParseRotationOverLifetimeModule(Scanner scanner)
    {
        var rot = new RotationOverLifetimeModuleData { enabled = true };
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            switch (key)
            {
                case "separateAxes": rot.separateAxes = scanner.ConsumeBool(); break;
                case "x": rot.x = ParseMinMaxCurveOrConstant(scanner); break;
                case "y": rot.y = ParseMinMaxCurveOrConstant(scanner); break;
                case "z": rot.z = ParseMinMaxCurveOrConstant(scanner); break;
                default: throw new Exception($"Unknown rotationOverLifetime module key: {key}");
            }
        }
        return rot;
    }

    private static LimitVelocityOverLifetimeModuleData ParseLimitVelocityOverLifetimeModule(Scanner scanner)
    {
        var lvol = new LimitVelocityOverLifetimeModuleData { enabled = true };
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            switch (key)
            {
                case "limit": lvol.limit = ParseMinMaxCurveOrConstant(scanner); break;
                case "dampen": lvol.dampen = scanner.ConsumeFloat(); break;
                default: throw new Exception($"Unknown limitVelocityOverLifetime module key: {key}");
            }
        }
        return lvol;
    }

    private static InheritVelocityModuleData ParseInheritVelocityModule(Scanner scanner)
    {
        var iv = new InheritVelocityModuleData { enabled = true };
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            switch (key)
            {
                case "mode":
                    string modeStr = scanner.Consume();
                    if (Enum.TryParse(modeStr, true, out ParticleSystemInheritVelocityMode mode))
                        iv.mode = mode;
                    break;
                case "curve": iv.curve = ParseMinMaxCurveOrConstant(scanner); break;
                default: throw new Exception($"Unknown inheritVelocity module key: {key}");
            }
        }
        return iv;
    }

    private static ColorBySpeedModuleData ParseColorBySpeedModule(Scanner scanner)
    {
        var cbs = new ColorBySpeedModuleData { enabled = true };
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            switch (key)
            {
                case "color": cbs.color = ParseGradient(scanner); break;
                case "range":
                    scanner.Expect("[");
                    cbs.range = new Vector2(scanner.ConsumeFloat(), scanner.ConsumeFloat());
                    scanner.Expect("]");
                    break;
                default: throw new Exception($"Unknown colorBySpeed module key: {key}");
            }
        }
        return cbs;
    }

    private static SizeBySpeedModuleData ParseSizeBySpeedModule(Scanner scanner)
    {
        var sbs = new SizeBySpeedModuleData { enabled = true };
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            switch (key)
            {
                case "size": sbs.size = ParseMinMaxCurveOrConstant(scanner); break;
                case "range":
                    scanner.Expect("[");
                    sbs.range = new Vector2(scanner.ConsumeFloat(), scanner.ConsumeFloat());
                    scanner.Expect("]");
                    break;
                default: throw new Exception($"Unknown sizeBySpeed module key: {key}");
            }
        }
        return sbs;
    }

    private static RotationBySpeedModuleData ParseRotationBySpeedModule(Scanner scanner)
    {
        var rbs = new RotationBySpeedModuleData { enabled = true };
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            switch (key)
            {
                case "z": rbs.z = ParseMinMaxCurveOrConstant(scanner); break;
                case "range":
                    scanner.Expect("[");
                    rbs.range = new Vector2(scanner.ConsumeFloat(), scanner.ConsumeFloat());
                    scanner.Expect("]");
                    break;
                default: throw new Exception($"Unknown rotationBySpeed module key: {key}");
            }
        }
        return rbs;
    }

    private static ExternalForcesModuleData ParseExternalForcesModule(Scanner scanner)
    {
        var ef = new ExternalForcesModuleData { enabled = true };
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            if (key == "multiplier") ef.multiplier = ParseMinMaxCurveOrConstant(scanner);
            else throw new Exception($"Unknown externalForces module key: {key}");
        }
        return ef;
    }

    private static CollisionModuleData ParseCollisionModule(Scanner scanner)
    {
        var collision = new CollisionModuleData { enabled = true };
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            switch (key)
            {
                case "dampen": collision.dampen = ParseMinMaxCurveOrConstant(scanner); break;
                case "bounce": collision.bounce = ParseMinMaxCurveOrConstant(scanner); break;
                case "lifetimeLoss": collision.lifetimeLoss = ParseMinMaxCurveOrConstant(scanner); break;
                default: throw new Exception($"Unknown collision module key: {key}");
            }
        }
        return collision;
    }

    private static VelocityOverLifetimeModuleData ParseVelocityOverLifetimeModule(Scanner scanner)
    {
        var vol = new VelocityOverLifetimeModuleData { enabled = true };
        while (scanner.Peek() != ">")
        {
            string axis = scanner.ConsumeStringInParens();
            switch (axis)
            {
                case "x": vol.x = ParseMinMaxCurveOrConstant(scanner); break;
                case "y": vol.y = ParseMinMaxCurveOrConstant(scanner); break;
                case "z": vol.z = ParseMinMaxCurveOrConstant(scanner); break;
                default: throw new Exception($"Unknown velocityOverLifetime axis: {axis}");
            }
        }
        return vol;
    }

    private static ForceOverLifetimeModuleData ParseForceOverLifetimeModule(Scanner scanner)
    {
        var fol = new ForceOverLifetimeModuleData { enabled = true };
        while (scanner.Peek() != ">")
        {
            string axis = scanner.ConsumeStringInParens();
            switch (axis)
            {
                case "x": fol.x = ParseMinMaxCurveOrConstant(scanner); break;
                case "y": fol.y = ParseMinMaxCurveOrConstant(scanner); break;
                case "z": fol.z = ParseMinMaxCurveOrConstant(scanner); break;
                default: throw new Exception($"Unknown forceOverLifetime axis: {axis}");
            }
        }
        return fol;
    }

    private static NoiseModuleData ParseNoiseModule(Scanner scanner)
    {
        var noise = new NoiseModuleData { enabled = true };
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            switch (key)
            {
                case "strength": noise.strength = ParseMinMaxCurveOrConstant(scanner); break;
                case "frequency": noise.frequency = scanner.ConsumeFloat(); break;
                case "scrollSpeed": noise.scrollSpeed = ParseMinMaxCurveOrConstant(scanner); break;
                default: throw new Exception($"Unknown noise module key: {key}");
            }
        }
        return noise;
    }

    private static TextureSheetAnimationModuleData ParseTextureSheetAnimationModule(Scanner scanner)
    {
        var tsa = new TextureSheetAnimationModuleData { enabled = true };
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            switch (key)
            {
                case "tilesX": tsa.numTilesX = (int)scanner.ConsumeFloat(); break;
                case "tilesY": tsa.numTilesY = (int)scanner.ConsumeFloat(); break;
                case "frameOverTime": tsa.frameOverTime = ParseMinMaxCurveOrConstant(scanner); break;
                default: throw new Exception($"Unknown textureSheetAnimation module key: {key}");
            }
        }
        return tsa;
    }

    private static TrailsModuleData ParseTrailsModule(Scanner scanner)
    {
        var trails = new TrailsModuleData { enabled = true };
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            switch (key)
            {
                case "lifetime": trails.lifetime = ParseMinMaxCurveOrConstant(scanner); break;
                case "widthOverTrail": trails.widthOverTrail = ParseMinMaxCurveOrConstant(scanner); break;
                default: throw new Exception($"Unknown trails module key: {key}");
            }
        }
        return trails;
    }

    private static SizeOverLifetimeModuleData ParseSizeOverLifetimeModule(Scanner scanner)
    {
        var sol = new SizeOverLifetimeModuleData { enabled = true };
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            if (key == "size")
            {
                sol.size = ParseMinMaxCurveOrConstant(scanner);
            }
            else
            {
                throw new Exception($"Unknown sizeOverLifetime module key: {key}");
            }
        }
        return sol;
    }

    private static RendererModuleData ParseRendererModule(Scanner scanner, Dictionary<string, Material> materialDict, Dictionary<string, Mesh> meshDict)
    {
        var renderer = new RendererModuleData { enabled = true };
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            switch (key)
            {
                case "renderMode":
                    string renderModeStr = scanner.ConsumeStringInParens();
                    if (Enum.TryParse(renderModeStr, true, out ParticleSystemRenderMode mode))
                    {
                        renderer.renderMode = mode;
                    }
                    else
                    {
                        Debug.LogWarning($"Unknown render mode '{renderModeStr}'. Defaulting to Billboard.");
                        renderer.renderMode = ParticleSystemRenderMode.Billboard;
                    }
                    break;
                case "meshDistribution":
                    string distStr = scanner.ConsumeStringInParens();
                    if (Enum.TryParse(distStr, true, out ParticleSystemMeshDistribution dist))
                    {
                        renderer.meshDistribution = dist;
                    }
                    else
                    {
                        Debug.LogWarning($"Unknown mesh distribution '{distStr}'. Defaulting to Triangle.");
                    }
                    break;
                case "meshes":
                    string meshNamesStr = scanner.ConsumeStringInParens();
                    string[] meshNames = meshNamesStr.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                    foreach (var meshName in meshNames)
                    {
                        if (meshDict.TryGetValue(meshName, out Mesh mesh))
                        {
                            renderer.meshes.Add(mesh);
                        }
                        else
                        {
                            Debug.LogWarning($"Mesh with name '{meshName}' not found in SystemManager's mesh list.");
                        }
                    }
                    break;
                // --- ▲▲▲ ここまで追加 ▲▲▲ ---
                case "materialName":
                    string materialName = scanner.ConsumeStringInParens();
                    if (materialDict.TryGetValue(materialName, out Material mat))
                    {
                        renderer.material = mat;
                    }
                    else
                    {
                        Debug.LogError($"Material '{materialName}' not found in SystemManager's material list.");
                    }
                    break;
                case "trailMaterialName":
                    string trailMaterialName = scanner.ConsumeStringInParens();
                    if (materialDict.TryGetValue(trailMaterialName, out Material trailMat))
                    {
                        renderer.trailMaterial = trailMat;
                    }
                    else
                    {
                        Debug.LogError($"Trail Material '{trailMaterialName}' not found in SystemManager's material list.");
                    }
                    break;
                case "alignment":
                    string aligStr = scanner.ConsumeStringInParens();
                    if (Enum.TryParse(aligStr, true, out ParticleSystemRenderSpace alig))
                    {
                        renderer.alignment = alig;
                    }
                    else
                    {
                        Debug.LogWarning($"Unknown alignment '{aligStr}'. Defaulting to Triangle.");
                    }
                    break;
                default:
                    throw new Exception($"Unknown renderer module key: {key}");
            }
        }
        return renderer;
    }

    private static MinMaxCurveData ParseMinMaxCurveOrConstant(Scanner scanner)
    {
        var data = new MinMaxCurveData();
        if (scanner.Peek() == "[")
        {
            scanner.Expect("[");
            data.min = scanner.ConsumeFloat();
            data.max = scanner.ConsumeFloat();
            scanner.Expect("]");
        }
        else if (scanner.Peek() == "<")
        {
            data.curve = ParseCurve(scanner);
            data.min = 0; // Curve使用時はmin/maxは使わない
            data.max = 0;
        }
        else
        {
            float value = scanner.ConsumeFloat();
            data.min = value;
            data.max = value;
        }
        return data;
    }
    // --- ▲▲▲ ここまで修正 ▲▲▲ ---

    private static MinMaxCurveData ParseMinMaxCurve(Scanner scanner)
    {
        scanner.Expect("[");
        var min = scanner.ConsumeFloat();
        var max = scanner.ConsumeFloat();
        scanner.Expect("]");
        return new MinMaxCurveData { min = min, max = max };
    }

    private static GradientData ParseGradient(Scanner scanner)
    {
        var gradient = new GradientData { colorKeys = new List<ColorKeyData>(), alphaKeys = new List<AlphaKeyData>() };
        scanner.Expect("<");
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            switch (key)
            {
                case "colorKeys":
                    gradient.colorKeys = ParseColorKeysList(scanner);
                    break;
                case "alphaKeys":
                    gradient.alphaKeys = ParseAlphaKeysList(scanner);
                    break;
                default:
                    throw new Exception($"Unknown gradient key: {key}");
            }
        }
        scanner.Expect(">");
        return gradient;
    }

    private static CurveData ParseCurve(Scanner scanner)
    {
        var curve = new CurveData();
        scanner.Expect("<");
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1); // ~key を消費
            if (key == "keys")
            {
                curve.keys = ParseKeysList(scanner);
            }
            else
            {
                throw new Exception($"Unknown curve key: {key}");
            }
        }
        scanner.Expect(">");
        return curve;
    }

    private static List<KeyframeData> ParseKeysList(Scanner scanner)
    {
        var keyList = new List<KeyframeData>();
        scanner.Expect("[");
        while (scanner.Peek() == "[")
        {
            scanner.Expect("[");
            float time = scanner.ConsumeFloat();
            float value = scanner.ConsumeFloat();
            keyList.Add(new KeyframeData { time = time, value = value });
            scanner.Expect("]");
        }
        scanner.Expect("]");
        return keyList;
    }

    private static List<ColorKeyData> ParseColorKeysList(Scanner scanner)
    {
        var keyList = new List<ColorKeyData>();
        scanner.Expect("[");
        while (scanner.Peek() == "[")
        {
            scanner.Expect("[");
            float r = scanner.ConsumeFloat();
            float g = scanner.ConsumeFloat();
            float b = scanner.ConsumeFloat();
            float a = scanner.ConsumeFloat();
            float time = scanner.ConsumeFloat();
            keyList.Add(new ColorKeyData { color = new Color(r, g, b, a), time = time });
            scanner.Expect("]");
        }
        scanner.Expect("]");
        return keyList;
    }

    private static List<AlphaKeyData> ParseAlphaKeysList(Scanner scanner)
    {
        var keyList = new List<AlphaKeyData>();
        scanner.Expect("[");
        while (scanner.Peek() == "[")
        {
            scanner.Expect("[");
            float alpha = scanner.ConsumeFloat();
            float time = scanner.ConsumeFloat();
            keyList.Add(new AlphaKeyData { alpha = alpha, time = time });
            scanner.Expect("]");
        }
        scanner.Expect("]");
        return keyList;
    }
}
