using UnityEngine;
using System.Collections.Generic;
using System;
using System.Globalization;

/// <summary>
/// Transform情報を格納するための構造体。
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
/// 1Dまたは3DのMinMaxCurveデータをまとめて保持するヘルパークラス
/// </summary>
public class AxisSeparatedCurveData
{
    public bool isSeparated; // 3Dモード（separateAxes）かどうか
    public MinMaxCurveData uniform; // 1Dの場合の値
    public MinMaxCurveData x;
    public MinMaxCurveData y;
    public MinMaxCurveData z;
}

/// <summary>
/// p5.jsから送られてくるmpsコードを解析し、ParticlePresetオブジェクトに変換する静的クラスです。
/// </summary>
public static partial class MpsParser
{
    // 文字列をトークン単位で読み進めるためのヘルパークラス
    public class Scanner
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

        public string Peek(int offset = 0)
        {
            if (_position + offset < _tokens.Length) return _tokens[_position + offset];
            return null;
        }

        public string Consume() => _position < _tokens.Length ? _tokens[_position++] : null;

        // 修正: Exceptionを投げずにログのみ出力して処理を継続する
        public void Expect(string token)
        {
            var consumed = Consume();
            if (consumed != token)
            {
                Debug.LogWarning($"Parse Warning: Expected '{token}' but got '{consumed}'. Ignoring error and continuing.");
            }
        }

        public float ConsumeFloat()
        {
            string token = Consume();
            if (token == null)
            {
                Debug.LogWarning($"Parse Warning: Expected a number (float) but reached end of code. Defaulting to 0.0f.");
                return 0.0f;
            }

            if (float.TryParse(token, NumberStyles.Float, CultureInfo.InvariantCulture, out float result))
            {
                return result;
            }
            else
            {
                Debug.LogWarning($"Parse Warning: Expected a number (float) but got '{token}'. Defaulting to 0.0f.");
                return 0.0f;
            }
        }

        public bool ConsumeBool()
        {
            string token = Consume();
            if (token == null)
            {
                Debug.LogWarning($"Parse Warning: Expected a boolean (true/false) but reached end of code. Defaulting to false.");
                return false;
            }

            if (bool.TryParse(token, out bool result))
            {
                return result;
            }
            else
            {
                Debug.LogWarning($"Parse Warning: Expected a boolean (true/false) but got '{token}'. Defaulting to false.");
                return false;
            }
        }

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

    // ... (Helper methods SkipToCloseBracket, etc. remain unchanged)

    // Make utility methods accessible to partial classes
    private static void SkipToCloseBracket(Scanner scanner)
    {
        int safetyCount = 0;
        while (scanner.Peek() != "]" && scanner.Peek() != null)
        {
            string p = scanner.Peek();
            if (p == ">" || p.StartsWith("~")) return;
            scanner.Consume();
            safetyCount++;
            if (safetyCount > 1000) break;
        }
        if (scanner.Peek() == "]") scanner.Consume();
    }

    // Accessible internally for Shape module
    internal static MinMaxCurveData ParseUniversalMinMaxCurve(Scanner scanner)
    {
        string nextToken = scanner.Peek();
        if (nextToken != null && (nextToken.StartsWith("~") || nextToken == ">"))
        {
            Debug.LogWarning($"Parse Warning: Expected value for curve but found '{nextToken}'. Using default 0.");
            return new MinMaxCurveData { min = 0f, max = 0f };
        }

        if (nextToken != null && nextToken != "[" && nextToken != "<" && !IsNumber(nextToken))
        {
            Debug.LogWarning($"Parse Warning: Expected number or curve start but got '{nextToken}'. Skipping invalid token.");
            SkipUnknownValue(scanner);
            return new MinMaxCurveData { min = 0f, max = 0f };
        }

        if (scanner.Peek() != "[")
        {
            if (scanner.Peek() == "<")
            {
                var data = new MinMaxCurveData();
                data.curve = ParseCurve(scanner);
                return data;
            }
            float val = scanner.ConsumeFloat();
            return new MinMaxCurveData { min = val, max = val };
        }

        scanner.Consume(); // consume [

        nextToken = scanner.Peek();
        bool isCurveStart = (nextToken == "[");

        if (!isCurveStart)
        {
            float min = scanner.ConsumeFloat();
            float max = min;
            if (scanner.Peek() != "]" && IsNumber(scanner.Peek()))
            {
                max = scanner.ConsumeFloat();
            }
            SkipToCloseBracket(scanner);
            return new MinMaxCurveData { min = min, max = max };
        }
        else
        {
            if (IsNumber(scanner.Peek(1)))
            {
                var data = new MinMaxCurveData();
                data.curve = new CurveData();
                while (scanner.Peek() == "[") data.curve.keys.Add(ParseKeyframe(scanner));
                SkipToCloseBracket(scanner);
                return data;
            }

            var firstElementCurve = ParseSingleElementAsCurve(scanner);
            if (scanner.Peek() == "]")
            {
                scanner.Consume();
                return new MinMaxCurveData { curve = firstElementCurve };
            }
            else
            {
                var data = new MinMaxCurveData();
                data.minCurve = firstElementCurve;
                data.curve = ParseSingleElementAsCurve(scanner);
                SkipToCloseBracket(scanner);
                return data;
            }
        }
    }

    // ... (Other parsing methods)

    private static AxisSeparatedCurveData ParseAxisSeparatedCurve(Scanner scanner)
    {
        var result = new AxisSeparatedCurveData();
        if (scanner.Peek() == "<")
        {
            result.isSeparated = true;
            scanner.Consume();
            while (scanner.Peek() != ">" && scanner.Peek() != null)
            {
                string axis = scanner.Consume();
                var val = ParseUniversalMinMaxCurve(scanner);
                if (axis == "~x") result.x = val;
                else if (axis == "~y") result.y = val;
                else if (axis == "~z") result.z = val;
            }
            scanner.Expect(">");
        }
        else
        {
            result.isSeparated = false;
            result.uniform = ParseUniversalMinMaxCurve(scanner);
        }
        return result;
    }

    // Accessible internally for Shape module
    internal static Vector3 ParseVector3(Scanner scanner)
    {
        scanner.Expect("[");
        var x = scanner.ConsumeFloat();
        var y = scanner.ConsumeFloat();
        var z = scanner.ConsumeFloat();
        SkipToCloseBracket(scanner);
        return new Vector3(x, y, z);
    }

    // ... (Object creation, Transform, Animation parsing methods)

    // Updated Parse method signature to include textureDictionary
    public static ParticlePreset Parse(string mpsCode, Dictionary<string, Material> materialDict, Dictionary<string, Mesh> meshDict, Dictionary<string, Texture2D> textureDict)
    {
        var scanner = new Scanner(mpsCode);
        var preset = new ParticlePreset();

        scanner.Expect("<");
        ParseObjectContent(scanner, preset, materialDict, meshDict, textureDict);
        scanner.Expect(">");

        return preset;
    }

    // Updated ParseObjectContent to pass textureDict
    private static void ParseObjectContent(Scanner scanner, ParticlePreset preset, Dictionary<string, Material> materialDict, Dictionary<string, Mesh> meshDict, Dictionary<string, Texture2D> textureDict)
    {
        while (scanner.Peek() != null && scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            scanner.Expect("<");

            switch (key)
            {
                case "main": preset.main = ParseMainModule(scanner); break;
                case "emission": preset.emission = ParseEmissionModule(scanner); break;
                case "shape": preset.shape = ParseShapeModule(scanner, meshDict, textureDict); break;
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
                case "triggers": preset.triggers = new TriggersModuleData { enabled = true }; SkipModuleContent(scanner); break;
                case "subEmitters": preset.subEmitters = new SubEmittersModuleData { enabled = true }; SkipModuleContent(scanner); break;
                case "textureSheetAnimation": preset.textureSheetAnimation = ParseTextureSheetAnimationModule(scanner); break;
                case "lights": preset.lights = new LightsModuleData { enabled = true }; SkipModuleContent(scanner); break;
                case "trails": preset.trails = ParseTrailsModule(scanner); break;
                case "customData": preset.customData = new CustomDataModuleData { enabled = true }; SkipModuleContent(scanner); break;
                case "renderer": preset.renderer = ParseRendererModule(scanner, materialDict, meshDict); break;
                default:
                    Debug.LogWarning($"Unknown MPS module key: '~{key}'. Skipping this module.");
                    SkipModuleContent(scanner);
                    break;
            }
            scanner.Expect(">");
        }
    }

    private static void SkipUnknownValue(Scanner scanner)
    {
        string next = scanner.Peek();
        if (next == "<")
        {
            scanner.Consume();
            SkipModuleContent(scanner);
            scanner.Consume();
        }
        else if (next == "[")
        {
            scanner.Consume();
            SkipBracketContent(scanner);
            scanner.Consume();
        }
        else if (next == "(")
        {
            scanner.Consume();
            while (scanner.Peek() != null && scanner.Peek() != ")") scanner.Consume();
            scanner.Consume();
        }
        else scanner.Consume();
    }
    private static void SkipModuleContent(Scanner scanner)
    {
        int d = 0;
        while (scanner.Peek() != null)
        {
            string t = scanner.Peek();
            if (t == "<") d++;
            else if (t == ">")
            {
                if (d == 0) return;
                d--;
            }
            scanner.Consume();
        }
    }
    private static void SkipBracketContent(Scanner scanner)
    {
        int d = 0;
        while (scanner.Peek() != null)
        {
            string t = scanner.Peek();
            if (t == "[") d++;
            else if (t == "]")
            {
                if (d == 0) return;
                d--;
            }
            scanner.Consume();
        }
    }

    private static Color ParseColorRGBA(Scanner scanner, bool expectOpenBracket = true)
    {
        if (expectOpenBracket) scanner.Expect("[");
        float r = scanner.ConsumeFloat();
        float g = scanner.ConsumeFloat();
        float b = scanner.ConsumeFloat();
        float a = scanner.ConsumeFloat();
        SkipToCloseBracket(scanner);
        return new Color(r, g, b, a);
    }
    private static List<float> ParseFloatListInsideBrackets(Scanner scanner)
    {
        List<float> l = new List<float>();
        while (scanner.Peek() != "]" && scanner.Peek() != null) l.Add(scanner.ConsumeFloat());
        scanner.Expect("]");
        return l;
    }
    private static bool IsNumber(string token)
    {
        if (string.IsNullOrEmpty(token)) return false;
        return char.IsDigit(token[0]) || token[0] == '-' || token[0] == '.';
    }

    private static CurveData ParseSingleElementAsCurve(Scanner scanner)
    {
        scanner.Expect("[");
        var curve = new CurveData();
        if (scanner.Peek() == "[")
        {
            while (scanner.Peek() == "[") curve.keys.Add(ParseKeyframe(scanner));
        }
        else
        {
            float v1 = scanner.ConsumeFloat();
            float v2 = v1;
            if (scanner.Peek() != "]") v2 = scanner.ConsumeFloat();
            float avg = (v1 + v2) / 2f;
            curve.keys.Add(new KeyframeData { time = 0f, value = avg });
            curve.keys.Add(new KeyframeData { time = 1f, value = avg });
        }
        SkipToCloseBracket(scanner);
        return curve;
    }
    private static KeyframeData ParseKeyframe(Scanner scanner)
    {
        scanner.Expect("[");
        float t = scanner.ConsumeFloat();
        float v = scanner.ConsumeFloat();
        SkipToCloseBracket(scanner);
        return new KeyframeData { time = t, value = v };
    }

    // Gradient parsers
    private static MinMaxGradientData ParseMinMaxGradient(Scanner scanner)
    {
        var data = new MinMaxGradientData();
        if (scanner.Peek() == "(Random)")
        {
            scanner.Consume();
            data.mode = "RandomColor";
            data.gradientMax = CreateRainbowGradient();
            return data;
        }
        if (scanner.Peek() == "<")
        {
            data.mode = "Gradient";
            data.gradientMax = ParseGradient(scanner);
            return data;
        }
        if (scanner.Peek() != "[") { SkipUnknownValue(scanner); return data; }
        scanner.Expect("[");
        if (IsNumber(scanner.Peek())) { data.mode = "Color"; data.colorMax = ParseColorRGBA(scanner, false); }
        else if (scanner.Peek() == "[")
        {
            scanner.Expect("[");
            if (scanner.Peek() == "[")
            {
                data.mode = "TwoGradients";
                data.gradientMin = ParseGradientKeysBlock(scanner, true);
                scanner.Expect("[");
                data.gradientMax = ParseGradientKeysBlock(scanner, false);
                SkipToCloseBracket(scanner);
            }
            else
            {
                List<float> firstBlock = ParseFloatListInsideBrackets(scanner);
                if (firstBlock.Count >= 5)
                {
                    data.mode = "Gradient";
                    data.gradientMax = new GradientData();
                    AddKeyToGradient(data.gradientMax, firstBlock);
                    while (scanner.Peek() == "[")
                    {
                        scanner.Expect("[");
                        var block = ParseFloatListInsideBrackets(scanner);
                        AddKeyToGradient(data.gradientMax, block);
                    }
                    SkipToCloseBracket(scanner);
                }
                else
                {
                    data.mode = "TwoColors";
                    if (firstBlock.Count >= 4) data.colorMin = new Color(firstBlock[0], firstBlock[1], firstBlock[2], firstBlock[3]);
                    scanner.Expect("[");
                    var secondBlock = ParseFloatListInsideBrackets(scanner);
                    if (secondBlock.Count >= 4) data.colorMax = new Color(secondBlock[0], secondBlock[1], secondBlock[2], secondBlock[3]);
                    SkipToCloseBracket(scanner);
                }
            }
        }
        return data;
    }
    private static GradientData CreateRainbowGradient()
    {
        var g = new GradientData();
        g.colorKeys.Add(new ColorKeyData { time = 0f, color = Color.red });
        g.colorKeys.Add(new ColorKeyData { time = 1f, color = Color.magenta });
        g.alphaKeys.Add(new AlphaKeyData { time = 0f, alpha = 1f });
        g.alphaKeys.Add(new AlphaKeyData { time = 1f, alpha = 1f });
        return g;
    }

    private static GradientData ParseGradientKeysBlock(Scanner scanner, bool startConsumed)
    {
        var grad = new GradientData();
        if (!startConsumed)
            scanner.Expect("[");
        while (scanner.Peek() == "[")
        {
            scanner.Expect("[");
            var val = ParseFloatListInsideBrackets(scanner);
            AddKeyToGradient(grad, val);
        }
        scanner.Expect("]");
        return grad;
    }
    private static void AddKeyToGradient(GradientData grad, List<float> val)
    {
        if (val.Count >= 5)
        {
            float t = val[0];
            Color col = new Color(val[1], val[2], val[3], val[4]);
            grad.colorKeys.Add(new ColorKeyData { time = t, color = col });
            grad.alphaKeys.Add(new AlphaKeyData { time = t, alpha = col.a });
        }
    }

    public static ObjectCreationData ParseObjectCreation(string mpsCode)
    {
        var scanner = new Scanner(mpsCode);
        var data = new ObjectCreationData();
        scanner.Expect("<");
        while (scanner.Peek() != null && scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            if (key == "shape") data.objectType = scanner.ConsumeStringInParens();
            else SkipUnknownValue(scanner);
        }
        scanner.Expect(">");
        return data;
    }
    public static TransformData ParseTransform(string c)
    {
        var scanner = new Scanner(c);
        var d = new TransformData();
        scanner.Expect("<");
        while (scanner.Peek() != null && scanner.Peek() != ">")
        {
            string k = scanner.Consume().Substring(1);
            switch (k)
            {
                case "position":
                    d.position = ParseVector3(scanner);
                    break;
                case "rotation":
                    d.rotation = ParseVector3(scanner);
                    break;
                case "scale":
                    if (scanner.Peek() == "[") d.scale = ParseVector3(scanner);
                    else
                    {
                        float x = scanner.ConsumeFloat();
                        d.scale = new Vector3(x, x, x);
                    }
                    break;
                default:
                    SkipUnknownValue(scanner);
                    break;
            }
        }
        scanner.Expect(">");
        return d;
    }
    public static AnimationDatas ParseAnimation(string c)
    {
        var s = new Scanner(c);
        var d = new AnimationDatas();
        s.Expect("<");
        while (s.Peek() != null && s.Peek() != ">")
        {
            string k = s.Consume().Substring(1);
            switch (k)
            {
                case "position":
                    s.Expect("<");
                    d.isActive_pos = true;
                    d.posAnimData = ParseAnimElement(s);
                    s.Expect(">");
                    break;
                case "rotate":
                    s.Expect("<");
                    d.isActive_rot = true;
                    d.rotAnimData = ParseAnimElement(s);
                    s.Expect(">");
                    break;
                case "scale":
                    s.Expect("<");
                    d.isActive_scale = true;
                    d.scaleAnimData = ParseAnimElement(s);
                    s.Expect(">");
                    break;
                default:
                    SkipUnknownValue(s);
                    break;
            }
        }
        s.Expect(">");
        return d;
    }
    private static AnimationData ParseAnimElement(Scanner s)
    {
        var a = new AnimationData();
        while (s.Peek() != ">")
        {
            string k = s.Consume().Substring(1);
            switch (k)
            {
                case "from": a.from = ParseVector3(s); break;
                case "to": a.to = ParseVector3(s); break;
                case "duration": a.duration = s.ConsumeFloat(); break;
                case "loop": a.loop = s.ConsumeBool(); break;
                case "reverse": a.reverse = s.ConsumeBool(); break;
                case "easeIn": a.easeIn = s.ConsumeBool(); break;
                case "easeOut": a.easeOut = s.ConsumeBool(); break;
                default: SkipUnknownValue(s); break;
            }
        }
        return a;
    }

    // Old helpers
    private static GradientData ParseGradient(Scanner scanner)
    {
        var g = new GradientData();
        scanner.Expect("<");
        while (scanner.Peek() != ">")
        {
            string k = scanner.Consume().Substring(1);
            if (k == "colorKeys") g.colorKeys = ParseColorKeysList(scanner);
            else if (k == "alphaKeys") g.alphaKeys = ParseAlphaKeysList(scanner);
            else SkipUnknownValue(scanner);
        }
        scanner.Expect(">");
        return g;
    }
    private static CurveData ParseCurve(Scanner scanner)
    {
        var c = new CurveData();
        scanner.Expect("<");
        while (scanner.Peek() != ">")
        {
            if (scanner.Consume().Substring(1) == "keys") c.keys = ParseKeysList(scanner);
            else SkipUnknownValue(scanner);
        }
        scanner.Expect(">");
        return c;
    }
    private static List<KeyframeData> ParseKeysList(Scanner scanner)
    {
        var l = new List<KeyframeData>();
        scanner.Expect("[");
        while (scanner.Peek() == "[")
        {
            scanner.Expect("[");
            List<float> v = new List<float>();
            while (scanner.Peek() != "]" && scanner.Peek() != null) v.Add(scanner.ConsumeFloat());
            if (v.Count == 2) l.Add(new KeyframeData { time = v[0], value = v[1] });
            scanner.Expect("]");
        }
        scanner.Expect("]");
        return l;
    }
    private static List<ColorKeyData> ParseColorKeysList(Scanner s)
    {
        var l = new List<ColorKeyData>();
        s.Expect("[");
        while (s.Peek() == "[")
        {
            s.Expect("[");
            List<float> v = new List<float>();
            while (s.Peek() != "]" && s.Peek() != null) v.Add(s.ConsumeFloat());
            if (v.Count == 5) l.Add(new ColorKeyData { time = v[0], color = new Color(v[1], v[2], v[3], v[4]) });
            s.Expect("]");
        }
        s.Expect("]");
        return l;
    }
    private static List<AlphaKeyData> ParseAlphaKeysList(Scanner s)
    {
        var l = new List<AlphaKeyData>();
        s.Expect("[");
        while (s.Peek() == "[")
        {
            s.Expect("[");
            List<float> v = new List<float>();
            while (s.Peek() != "]" && s.Peek() != null) v.Add(s.ConsumeFloat());
            if (v.Count == 2) l.Add(new AlphaKeyData { time = v[0], alpha = v[1] });
            s.Expect("]");
        }
        s.Expect("]");
        return l;
    }

    // Module parsers from original (Velocity, etc.)
    // ... Assuming these exist in the file. I will include the ones present in original upload.
    private static ColorOverLifetimeModuleData ParseColorOverLifetimeModule(Scanner s)
    {
        var c = new ColorOverLifetimeModuleData { enabled = true };
        while (s.Peek() != ">")
        {
            string k = s.Consume().Substring(1);
            if (k == "enabled") c.enabled = s.ConsumeBool();
            else if (k == "gradient") c.color = ParseGradient(s);
            else SkipUnknownValue(s);
        }
        return c;
    }
    private static RotationOverLifetimeModuleData ParseRotationOverLifetimeModule(Scanner s)
    {
        var r = new RotationOverLifetimeModuleData { enabled = true };
        while (s.Peek() != ">")
        {
            string k = s.Consume().Substring(1);
            if (k == "enabled") r.enabled = s.ConsumeBool();
            else if (k == "separateAxes" || k == "z" || k == "rotation")
            {
                var d = ParseAxisSeparatedCurve(s);
                r.separateAxes = d.isSeparated;
                if (d.isSeparated)
                {
                    r.x = d.x;
                    r.y = d.y;
                    r.z = d.z;
                }
                else r.z = d.uniform;
            }
            else if (k == "x")
            {
                r.x = ParseUniversalMinMaxCurve(s);
                r.separateAxes = true;
            }
            else if (k == "y")
            {
                r.y = ParseUniversalMinMaxCurve(s);
                r.separateAxes = true;
            }
            else SkipUnknownValue(s);
        }
        return r;
    }
    private static ColorBySpeedModuleData ParseColorBySpeedModule(Scanner s)
    {
        var m = new ColorBySpeedModuleData { enabled = true };
        while (s.Peek() != ">")
        {
            string k = s.Consume().Substring(1);
            if (k == "enabled") m.enabled = s.ConsumeBool();
            else if (k == "color") m.color = ParseGradient(s);
            else if (k == "range")
            {
                s.Expect("[");
                m.range = new Vector2(s.ConsumeFloat(), s.ConsumeFloat());
                SkipToCloseBracket(s);
            }
            else SkipUnknownValue(s);
        }
        return m;
    }
    private static SizeBySpeedModuleData ParseSizeBySpeedModule(Scanner s)
    {
        var m = new SizeBySpeedModuleData { enabled = true };
        while (s.Peek() != ">")
        {
            string k = s.Consume().Substring(1);
            if (k == "enabled") m.enabled = s.ConsumeBool();
            else if (k == "size") m.size = ParseUniversalMinMaxCurve(s);
            else if (k == "range")
            {
                s.Expect("[");
                m.range = new Vector2(s.ConsumeFloat(), s.ConsumeFloat());
                SkipToCloseBracket(s);
            }
            else SkipUnknownValue(s);
        }
        return m;
    }
    private static RotationBySpeedModuleData ParseRotationBySpeedModule(Scanner s)
    {
        var m = new RotationBySpeedModuleData { enabled = true };
        while (s.Peek() != ">")
        {
            string k = s.Consume().Substring(1);
            if (k == "enabled") m.enabled = s.ConsumeBool();
            else if (k == "z") m.z = ParseUniversalMinMaxCurve(s);
            else if (k == "range")
            {
                s.Expect("[");
                m.range = new Vector2(s.ConsumeFloat(), s.ConsumeFloat());
                SkipToCloseBracket(s);
            }
            else SkipUnknownValue(s);
        }
        return m;
    }
    private static ExternalForcesModuleData ParseExternalForcesModule(Scanner s)
    {
        var m = new ExternalForcesModuleData { enabled = true };
        while (s.Peek() != ">")
        {
            string k = s.Consume().Substring(1);
            if (k == "enabled") m.enabled = s.ConsumeBool();
            else if (k == "multiplier") m.multiplier = ParseUniversalMinMaxCurve(s);
            else SkipUnknownValue(s);
        }
        return m;
    }
    private static CollisionModuleData ParseCollisionModule(Scanner s)
    {
        var m = new CollisionModuleData { enabled = true };
        while (s.Peek() != ">")
        {
            string k = s.Consume().Substring(1);
            if (k == "enabled") m.enabled = s.ConsumeBool();
            else if (k == "dampen") m.dampen = ParseUniversalMinMaxCurve(s);
            else if (k == "bounce") m.bounce = ParseUniversalMinMaxCurve(s);
            else if (k == "lifetimeLoss") m.lifetimeLoss = ParseUniversalMinMaxCurve(s);
            else SkipUnknownValue(s);
        }
        return m;
    }

    private static ForceOverLifetimeModuleData ParseForceOverLifetimeModule(Scanner s)
    {
        var m = new ForceOverLifetimeModuleData { enabled = true };
        while (s.Peek() != ">")
        {
            string t = s.Consume();
            string k = t.StartsWith("~") ? t.Substring(1) : (t.StartsWith("(") ? t.Replace("(", "").Replace(")", "") : t);
            switch (k)
            {
                case "x": m.x = ParseUniversalMinMaxCurve(s); break;
                case "y": m.y = ParseUniversalMinMaxCurve(s); break;
                case "z": m.z = ParseUniversalMinMaxCurve(s); break;
                default: SkipUnknownValue(s); break;
            }
        }
        return m;
    }
    private static NoiseModuleData ParseNoiseModule(Scanner s)
    {
        var m = new NoiseModuleData { enabled = true };
        while (s.Peek() != ">")
        {
            string k = s.Consume().Substring(1);
            if (k == "enabled") m.enabled = s.ConsumeBool();
            else if (k == "strength") m.strength = ParseUniversalMinMaxCurve(s);
            else if (k == "frequency") m.frequency = s.ConsumeFloat();
            else if (k == "scrollSpeed") m.scrollSpeed = ParseUniversalMinMaxCurve(s);
            else SkipUnknownValue(s);
        }
        return m;
    }
    private static TextureSheetAnimationModuleData ParseTextureSheetAnimationModule(Scanner s)
    {
        var m = new TextureSheetAnimationModuleData { enabled = true };
        while (s.Peek() != ">")
        {
            string k = s.Consume().Substring(1);
            if (k == "enabled") m.enabled = s.ConsumeBool();
            else if (k == "tilesX") m.numTilesX = (int)s.ConsumeFloat();
            else if (k == "tilesY") m.numTilesY = (int)s.ConsumeFloat();
            else if (k == "frameOverTime") m.frameOverTime = ParseUniversalMinMaxCurve(s);
            else SkipUnknownValue(s);
        }
        return m;
    }
    private static TrailsModuleData ParseTrailsModule(Scanner s)
    {
        var m = new TrailsModuleData { enabled = true };
        while (s.Peek() != ">")
        {
            string k = s.Consume().Substring(1);
            switch (k)
            {
                case "enabled": m.enabled = s.ConsumeBool(); break;
                case "mode": if (Enum.TryParse(s.ConsumeStringInParens(), true, out ParticleSystemTrailMode tm)) m.mode = tm; break;
                case "ratio": m.ratio = s.ConsumeFloat(); break;
                case "lifetime": m.lifetime = ParseUniversalMinMaxCurve(s); break;
                case "minVertexDistance": m.minVertexDistance = s.ConsumeFloat(); break;
                case "worldSpace": m.worldSpace = s.ConsumeBool(); break;
                case "dieWithParticles": m.dieWithParticles = s.ConsumeBool(); break;
                case "ribbonCount": m.ribbonCount = (int)s.ConsumeFloat(); break;
                case "splitSubEmitterRibbons": m.splitSubEmitterRibbons = s.ConsumeBool(); break;
                case "textureMode": if (Enum.TryParse(s.ConsumeStringInParens(), true, out ParticleSystemTrailTextureMode ttm)) m.textureMode = ttm; break;
                case "sizeAffectsWidth": m.sizeAffectsWidth = s.ConsumeBool(); break;
                case "sizeAffectsLifetime": m.sizeAffectsLifetime = s.ConsumeBool(); break;
                case "inheritParticleColor": m.inheritParticleColor = s.ConsumeBool(); break;
                case "colorOverLifetime": m.colorOverLifetime = ParseGradient(s); break;
                case "widthOverTrail": m.widthOverTrail = ParseUniversalMinMaxCurve(s); break;
                case "colorOverTrail": m.colorOverTrail = ParseGradient(s); break;
                case "generateLightingData": m.generateLightingData = s.ConsumeBool(); break;
                default: SkipUnknownValue(s); break;
            }
        }
        return m;
    }
    private static SizeOverLifetimeModuleData ParseSizeOverLifetimeModule(Scanner s)
    {
        var m = new SizeOverLifetimeModuleData { enabled = true };
        while (s.Peek() != ">")
        {
            string k = s.Consume().Substring(1);
            if (k == "enabled") m.enabled = s.ConsumeBool();
            else if (k == "size" || k == "separateAxes")
            {
                var d = ParseAxisSeparatedCurve(s);
                m.separateAxes = d.isSeparated;
                if (d.isSeparated) { m.x = d.x; m.y = d.y; m.z = d.z; }
                else m.size = d.uniform;
            }
            else SkipUnknownValue(s);
        }
        return m;
    }
    private static RendererModuleData ParseRendererModule(Scanner s, Dictionary<string, Material> md, Dictionary<string, Mesh> msd)
    {
        var m = new RendererModuleData { enabled = true };
        while (s.Peek() != ">")
        {
            string k = s.Consume().Substring(1);
            if (k == "enabled") m.enabled = s.ConsumeBool();
            else if (k == "renderMode")
            {
                if (Enum.TryParse(s.ConsumeStringInParens(), true, out ParticleSystemRenderMode rm)) m.renderMode = rm;
            }
            else if (k == "meshDistribution")
            {
                if (Enum.TryParse(s.ConsumeStringInParens(), true, out ParticleSystemMeshDistribution dist)) m.meshDistribution = dist;
            }
            else if (k == "meshes")
            {
                string[] ns = s.ConsumeStringInParens().Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                foreach (var n in ns) if (msd.TryGetValue(n, out Mesh me)) m.meshes.Add(me);
            }
            else if (k == "materialName") { if (md.TryGetValue(s.ConsumeStringInParens(), out Material mat)) m.material = mat; }
            else if (k == "trailMaterialName") { if (md.TryGetValue(s.ConsumeStringInParens(), out Material tm)) m.trailMaterial = tm; }
            else if (k == "alignment") { if (Enum.TryParse(s.ConsumeStringInParens(), true, out ParticleSystemRenderSpace rs)) m.alignment = rs; }
            else if (k == "shader" || k == "blendMode") m.blendMode = s.ConsumeStringInParens();
            else if (k == "sortingFudge") m.sortingFudge = s.ConsumeFloat();
            else SkipUnknownValue(s);
        }
        return m;
    }
}