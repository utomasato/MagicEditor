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

    // ----------------------------------------------------------------------------------
    // ヘルパー関数: 余分な要素のスキップ処理
    // ----------------------------------------------------------------------------------

    /// <summary>
    /// 閉じカッコ ']' が出るまでトークンを読み飛ばします。
    /// 要素数が多すぎる場合や、不正な値が含まれている場合に、次の構文まで安全に進めるために使用します。
    /// </summary>
    private static void SkipToCloseBracket(Scanner scanner)
    {
        int safetyCount = 0;
        while (scanner.Peek() != "]" && scanner.Peek() != null)
        {
            // 安全策: 明らかに構造が壊れている場合（次のモジュールや閉じタグが見えた場合）はスキップを中断
            string p = scanner.Peek();
            if (p == ">" || p.StartsWith("~"))
            {
                Debug.LogWarning($"Parse Warning: Hit unexpected token '{p}' while skipping to ']'. Stop skipping.");
                return;
            }

            scanner.Consume(); // 余分な要素を消費

            safetyCount++;
            if (safetyCount > 1000) // 無限ループ防止
            {
                Debug.LogWarning("Parse Warning: Infinite loop detected while skipping tokens.");
                break;
            }
        }

        if (scanner.Peek() == "]")
        {
            scanner.Consume();
        }
        else
        {
            Debug.LogWarning("Parse Warning: Expected ']' not found.");
        }
    }

    // ----------------------------------------------------------------------------------
    // 新しい汎用パース関数群
    // ----------------------------------------------------------------------------------

    /// <summary>
    /// "< ... >" なら3Dモードとして各軸(~x, ~y, ~z)を読み込み、それ以外なら1Dモードとして読み込みます。
    /// </summary>
    private static AxisSeparatedCurveData ParseAxisSeparatedCurve(Scanner scanner)
    {
        var result = new AxisSeparatedCurveData();

        // 次のトークンが '<' なら 3D (Separated) モード
        if (scanner.Peek() == "<")
        {
            result.isSeparated = true;
            scanner.Consume(); // '<' 消費

            while (scanner.Peek() != ">" && scanner.Peek() != null)
            {
                string axis = scanner.Consume(); // ~x, ~y, ~z などのタグ

                // タグの次にある「値」を汎用関数で読み込む
                var val = ParseUniversalMinMaxCurve(scanner);

                if (axis == "~x") result.x = val;
                else if (axis == "~y") result.y = val;
                else if (axis == "~z") result.z = val;
                else
                {
                    Debug.LogWarning($"Unknown axis tag '{axis}' inside <...>. Expected ~x, ~y, or ~z.");
                }
            }
            scanner.Expect(">");
        }
        else
        {
            // 1D (Uniform) モード
            result.isSeparated = false;
            result.uniform = ParseUniversalMinMaxCurve(scanner);
        }

        return result;
    }

    /// <summary>
    /// 定数、MinMax([min max])、カーブ([[time value]...])、TwoCurves([[Curve] [Curve]])、混合([[Curve] [min max]])
    /// すべてをよしなに解釈してパースします。
    /// </summary>
    private static MinMaxCurveData ParseUniversalMinMaxCurve(Scanner scanner)
    {
        string nextToken = scanner.Peek();

        // --- ▼▼▼ 不正データのスキップ処理 ▼▼▼ ---
        if (nextToken != null && (nextToken.StartsWith("~") || nextToken == ">"))
        {
            Debug.LogWarning($"Parse Warning: Expected value for curve but found '{nextToken}'. Using default 0.");
            return new MinMaxCurveData { min = 0f, max = 0f };
        }

        if (nextToken != null && nextToken != "[" && nextToken != "<" && !IsNumber(nextToken))
        {
            Debug.LogWarning($"Parse Warning: Expected number or curve start but got '{nextToken}'. Skipping invalid token.");
            SkipUnknownValue(scanner); // 不正なトークンを消費して進める
            return new MinMaxCurveData { min = 0f, max = 0f };
        }
        // --- ▲▲▲ スキップ処理ここまで ▲▲▲ ---

        // 1. 定数 ( '[' で始まらない場合 )
        if (scanner.Peek() != "[")
        {
            // 古い形式: <~keys ...> (Single Curve) の対応
            if (scanner.Peek() == "<")
            {
                var data = new MinMaxCurveData();
                data.curve = ParseCurve(scanner);
                return data;
            }

            float val = scanner.ConsumeFloat();
            return new MinMaxCurveData { min = val, max = val };
        }

        // '[' で始まる場合
        scanner.Consume(); // '[' 消費 (Outer)

        // 次が数値なら -> [min max] (MinMax定数)
        // 次が '[' なら -> [[...]] (カーブ または 2カーブ)

        nextToken = scanner.Peek();
        bool isCurveStart = (nextToken == "[");

        if (!isCurveStart)
        {
            // --- MinMax Constant: [min max] ---
            float min = scanner.ConsumeFloat();

            // 要素が1つだけ [val] の場合も考慮
            float max = min;
            // 次が数値であれば max として採用
            if (scanner.Peek() != "]" && IsNumber(scanner.Peek()))
            {
                max = scanner.ConsumeFloat();
            }

            // 修正: 余分な要素があればスキップする (例: [30 30 75] -> 75を無視)
            SkipToCloseBracket(scanner);

            return new MinMaxCurveData { min = min, max = max };
        }
        else
        {
            // --- Curve Mode ---
            // ここでの構造: [[...

            // 重要: [[0 0.05] [1 0]] のような形式の場合、
            // [ [キーフレーム] [キーフレーム] ] (Single Curve) なのか
            // [ [要素1] [要素2] ] (Two Curves / Two Constants) なのかが曖昧。

            // 先読みを行い、次のトークンが数値であれば「キーフレーム」とみなして Single Curve モードを強制する。
            if (IsNumber(scanner.Peek(1)))
            {
                // Single Curve List Mode: [ [t v] [t v] ... ]
                var data = new MinMaxCurveData();
                data.curve = new CurveData();

                while (scanner.Peek() == "[")
                {
                    data.curve.keys.Add(ParseKeyframe(scanner));
                }
                SkipToCloseBracket(scanner);
                return data;
            }

            // --- Two Elements / Wrapped Single Curve Mode ---
            // 上記以外の場合は、ParseSingleElementAsCurve を使って再帰的に要素を読み込む。
            // 形式例: [ [[t v]...] [[t v]...] ]  (Two Curves)
            // 形式例: [ [min max] [min max] ]  (Two Constants -> MinMaxCurve)

            // まず1つ目の要素（Min側、またはSingleカーブそのもの）を読み込む
            var firstElementCurve = ParseSingleElementAsCurve(scanner);

            // もし閉じカッコ ']' が来ていたら、それは Single Curve モード
            if (scanner.Peek() == "]")
            {
                scanner.Consume(); // ']' 消費
                return new MinMaxCurveData { curve = firstElementCurve };
            }
            else
            {
                // まだ続きがある -> Two Curves (Mixed) モード
                var data = new MinMaxCurveData();
                data.minCurve = firstElementCurve; // 1つ目はMinCurveへ

                // 2つ目の要素を読み込む（Max側）
                data.curve = ParseSingleElementAsCurve(scanner);

                // もし3つ以上あっても無視して消費
                SkipToCloseBracket(scanner);

                return data;
            }
        }
    }

    /// <summary>
    /// [ ... ] で囲まれた1つの要素を「CurveData」として読み込みます。
    /// カーブ([[t v]...])ならそのまま、定数範囲([min max])ならフラットなカーブに変換します。
    /// </summary>
    private static CurveData ParseSingleElementAsCurve(Scanner scanner)
    {
        scanner.Expect("[");
        var curve = new CurveData();

        // 中身がカーブキーフレームの配列 ([[t v]...]) か、数値 ([min max]) か
        if (scanner.Peek() == "[")
        {
            // カーブキーフレーム群
            while (scanner.Peek() == "[")
            {
                curve.keys.Add(ParseKeyframe(scanner));
            }
        }
        else
        {
            // 数値（定数またはMinMax） -> フラットなカーブに変換
            float val1 = scanner.ConsumeFloat();
            float val2 = val1;
            if (scanner.Peek() != "]")
            {
                val2 = scanner.ConsumeFloat();
            }
            // 混合使用時の簡易対応: 平均値をとって定数カーブにする
            float avg = (val1 + val2) / 2f;
            curve.keys.Add(new KeyframeData { time = 0f, value = avg });
            curve.keys.Add(new KeyframeData { time = 1f, value = avg });
        }

        // 修正: 余分な要素があればスキップ
        SkipToCloseBracket(scanner);
        return curve;
    }

    private static KeyframeData ParseKeyframe(Scanner scanner)
    {
        scanner.Expect("[");
        float t = scanner.ConsumeFloat();
        float v = scanner.ConsumeFloat();
        // 修正: 余分な要素があればスキップ
        SkipToCloseBracket(scanner);
        return new KeyframeData { time = t, value = v };
    }

    private static MinMaxGradientData ParseMinMaxGradient(Scanner scanner)
    {
        var data = new MinMaxGradientData();

        // 1. (Random) の判定
        if (scanner.Peek() == "(Random)")
        {
            scanner.Consume();
            data.mode = "RandomColor";
            // ランダム用にレインボーのグラデーションを自動生成してセット
            data.gradientMax = CreateRainbowGradient();
            return data;
        }

        // 2. 従来の <~gradient ...> 形式の場合 (後方互換性)
        if (scanner.Peek() == "<")
        {
            data.mode = "Gradient";
            data.gradientMax = ParseGradient(scanner);
            return data;
        }

        // 3. 配列形式のパース
        if (scanner.Peek() != "[")
        {
            SkipUnknownValue(scanner);
            return data;
        }

        scanner.Expect("["); // 外側の [

        // 次が数値なら -> [r g b a] (Single Color)
        if (IsNumber(scanner.Peek()))
        {
            data.mode = "Color";
            data.colorMax = ParseColorRGBA(scanner, false); // 既に [ は消費済みなのでfalse
        }
        // 次が [ なら -> 2色, Gradient, 2Gradient のいずれか
        else if (scanner.Peek() == "[")
        {
            scanner.Expect("["); // 2層目の [

            if (scanner.Peek() == "[")
            {
                // --- Two Gradients: [[[key]...]] ---
                data.mode = "TwoGradients";
                // Gradient 1 (Min)
                data.gradientMin = ParseGradientKeysBlock(scanner, true); // 既に [ は消費済み

                // Gradient 2 (Max)
                scanner.Expect("[");
                data.gradientMax = ParseGradientKeysBlock(scanner, false);
                // 修正: 余分な要素があればスキップ
                SkipToCloseBracket(scanner);
            }
            else
            {
                // ここで中身が Color(4要素) か Key(5要素) かを判定
                List<float> firstBlock = ParseFloatListInsideBrackets(scanner); // 2層目の ] まで読む

                if (firstBlock.Count >= 5) // Count >= 5 であれば GradientKey とみなす
                {
                    // --- Gradient: [[t r g b a] [t r g b a]...] ---
                    data.mode = "Gradient";
                    data.gradientMax = new GradientData();
                    AddKeyToGradient(data.gradientMax, firstBlock);

                    // 残りのキーを読み込む
                    while (scanner.Peek() == "[")
                    {
                        scanner.Expect("[");
                        var block = ParseFloatListInsideBrackets(scanner);
                        AddKeyToGradient(data.gradientMax, block);
                    }
                    SkipToCloseBracket(scanner);
                }
                else // Count == 4 とみなす
                {
                    // --- Two Colors: [[r g b a] [r g b a]] ---
                    data.mode = "TwoColors";
                    if (firstBlock.Count >= 4)
                        data.colorMin = new Color(firstBlock[0], firstBlock[1], firstBlock[2], firstBlock[3]);

                    // 2つ目の色
                    scanner.Expect("[");
                    var secondBlock = ParseFloatListInsideBrackets(scanner);
                    if (secondBlock.Count >= 4)
                        data.colorMax = new Color(secondBlock[0], secondBlock[1], secondBlock[2], secondBlock[3]);

                    SkipToCloseBracket(scanner);
                }
            }
        }

        return data;
    }

    private static GradientData CreateRainbowGradient()
    {
        var g = new GradientData();
        g.colorKeys.Add(new ColorKeyData { time = 0.0f, color = Color.red });
        g.colorKeys.Add(new ColorKeyData { time = 0.2f, color = Color.yellow });
        g.colorKeys.Add(new ColorKeyData { time = 0.4f, color = Color.green });
        g.colorKeys.Add(new ColorKeyData { time = 0.6f, color = Color.cyan });
        g.colorKeys.Add(new ColorKeyData { time = 0.8f, color = Color.blue });
        g.colorKeys.Add(new ColorKeyData { time = 1.0f, color = Color.magenta });

        g.alphaKeys.Add(new AlphaKeyData { time = 0.0f, alpha = 1.0f });
        g.alphaKeys.Add(new AlphaKeyData { time = 1.0f, alpha = 1.0f });
        return g;
    }


    // ----------------------------------------------------------------------------------
    // メイン処理
    // ----------------------------------------------------------------------------------

    public static ObjectCreationData ParseObjectCreation(string mpsCode)
    {
        var scanner = new Scanner(mpsCode);
        var data = new ObjectCreationData();

        scanner.Expect("<");
        while (scanner.Peek() != null && scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            switch (key)
            {
                case "shape":
                    data.objectType = scanner.ConsumeStringInParens();
                    break;
                default:
                    Debug.LogWarning($"Unknown object creation key: '~{key}'. Skipping.");
                    SkipUnknownValue(scanner);
                    break;
            }
        }
        scanner.Expect(">");
        return data;
    }

    public static TransformData ParseTransform(string transformCode)
    {
        var scanner = new Scanner(transformCode);
        var data = new TransformData();

        scanner.Expect("<");
        while (scanner.Peek() != null && scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            switch (key)
            {
                case "position":
                    data.position = ParseVector3(scanner);
                    break;
                case "rotation":
                    data.rotation = ParseVector3(scanner);
                    break;
                case "scale":
                    if (scanner.Peek() == "[")
                    {
                        data.scale = ParseVector3(scanner);
                    }
                    else
                    {
                        float x = scanner.ConsumeFloat();
                        data.scale = new Vector3(x, x, x);
                    }
                    break;
                default:
                    Debug.LogWarning($"Unknown transform key: '~{key}'. Skipping.");
                    SkipUnknownValue(scanner);
                    break;
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
        // 修正: 余分な要素があればスキップ
        SkipToCloseBracket(scanner);
        return new Vector3(x, y, z);
    }

    public static AnimationDatas ParseAnimation(string animationCode)
    {
        var scanner = new Scanner(animationCode);
        var data = new AnimationDatas();

        scanner.Expect("<");
        while (scanner.Peek() != null && scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            switch (key)
            {
                case "position":
                    scanner.Expect("<");
                    data.isActive_pos = true;
                    data.posAnimData = ParseAnimElement(scanner);
                    scanner.Expect(">");
                    break;
                case "rotate":
                    scanner.Expect("<");
                    data.isActive_rot = true;
                    data.rotAnimData = ParseAnimElement(scanner);
                    scanner.Expect(">");
                    break;
                case "scale":
                    scanner.Expect("<");
                    data.isActive_scale = true;
                    data.scaleAnimData = ParseAnimElement(scanner);
                    scanner.Expect(">");
                    break;
                default:
                    Debug.LogWarning($"Unknown animation key: '~{key}'. Skipping.");
                    SkipUnknownValue(scanner);
                    break;
            }
        }
        scanner.Expect(">");
        return data;
    }

    private static AnimationData ParseAnimElement(Scanner scanner)
    {
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
                default:
                    Debug.LogWarning($"Unknown animation module key: '~{key}'. Skipping.");
                    SkipUnknownValue(scanner);
                    break;
            }
        }
        return animData;
    }

    public static ParticlePreset Parse(string mpsCode, Dictionary<string, Material> materialDict, Dictionary<string, Mesh> meshDict)
    {
        var scanner = new Scanner(mpsCode);
        var preset = new ParticlePreset();

        scanner.Expect("<");
        ParseObjectContent(scanner, preset, materialDict, meshDict);
        scanner.Expect(">");

        return preset;
    }

    private static void ParseObjectContent(Scanner scanner, ParticlePreset preset, Dictionary<string, Material> materialDict, Dictionary<string, Mesh> meshDict)
    {
        while (scanner.Peek() != null && scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            scanner.Expect("<");

            switch (key)
            {
                case "main": preset.main = ParseMainModule(scanner); break; // 別ファイル(partial)で定義
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
            while (scanner.Peek() != null && scanner.Peek() != ")")
            {
                scanner.Consume();
            }
            scanner.Consume();
        }
        else
        {
            scanner.Consume();
        }
    }

    private static void SkipModuleContent(Scanner scanner)
    {
        int depth = 0;
        while (scanner.Peek() != null)
        {
            string token = scanner.Peek();
            if (token == "<") depth++;
            else if (token == ">")
            {
                if (depth == 0) return;
                depth--;
            }
            scanner.Consume();
        }
    }

    private static void SkipBracketContent(Scanner scanner)
    {
        int depth = 0;
        while (scanner.Peek() != null)
        {
            string token = scanner.Peek();
            if (token == "[") depth++;
            else if (token == "]")
            {
                if (depth == 0) return;
                depth--;
            }
            scanner.Consume();
        }
    }

    // ----------------------------------------------------------------------------------
    // 各モジュールのパース処理
    // MainModuleは別ファイル (MpsParser_MainModule.cs) へ移動
    // ----------------------------------------------------------------------------------

    private static Color ParseColorRGBA(Scanner scanner, bool expectOpenBracket = true)
    {
        if (expectOpenBracket) scanner.Expect("[");
        float r = scanner.ConsumeFloat();
        float g = scanner.ConsumeFloat();
        float b = scanner.ConsumeFloat();
        float a = scanner.ConsumeFloat();
        // 修正: 余分な要素があればスキップ
        SkipToCloseBracket(scanner);
        return new Color(r, g, b, a);
    }

    private static List<float> ParseFloatListInsideBrackets(Scanner scanner)
    {
        List<float> list = new List<float>();
        while (scanner.Peek() != "]" && scanner.Peek() != null)
        {
            list.Add(scanner.ConsumeFloat());
        }
        scanner.Expect("]");
        return list;
    }

    private static GradientData ParseGradientKeysBlock(Scanner scanner, bool startConsumed)
    {
        var grad = new GradientData();
        if (!startConsumed) scanner.Expect("[");

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

    private static bool IsNumber(string token)
    {
        if (string.IsNullOrEmpty(token)) return false;
        return char.IsDigit(token[0]) || token[0] == '-' || token[0] == '.';
    }

    // ------------------------------------

    private static ShapeModuleData ParseShapeModule(Scanner scanner)
    {
        var shape = new ShapeModuleData { enabled = true };
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            switch (key)
            {
                case "enabled": shape.enabled = scanner.ConsumeBool(); break;
                case "shape":
                    string shapeTypeStr = scanner.ConsumeStringInParens();
                    if (Enum.TryParse(shapeTypeStr, true, out ParticleSystemShapeType shapeType))
                        shape.shapeType = shapeType;
                    else
                        shape.shapeType = ParticleSystemShapeType.Cone;
                    break;
                case "angle": shape.angle = scanner.ConsumeFloat(); break;
                case "radius": shape.radius = scanner.ConsumeFloat(); break;
                case "radiusThickness": shape.radiusThickness = scanner.ConsumeFloat(); break;
                default: SkipUnknownValue(scanner); break;
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
            switch (key)
            {
                case "enabled": col.enabled = scanner.ConsumeBool(); break;
                case "gradient": col.color = ParseGradient(scanner); break;
                default: SkipUnknownValue(scanner); break;
            }
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
                case "enabled": rot.enabled = scanner.ConsumeBool(); break;

                case "separateAxes":
                case "z": // 従来の1D記述はZとして扱うことが多い
                case "rotation":
                    var data = ParseAxisSeparatedCurve(scanner);
                    rot.separateAxes = data.isSeparated;
                    if (data.isSeparated)
                    {
                        rot.x = data.x;
                        rot.y = data.y;
                        rot.z = data.z;
                    }
                    else
                    {
                        rot.z = data.uniform; // 1Dモードの時はZに値を入れて制御
                    }
                    break;

                // 個別軸指定（互換性のため）
                case "x": rot.x = ParseUniversalMinMaxCurve(scanner); rot.separateAxes = true; break;
                case "y": rot.y = ParseUniversalMinMaxCurve(scanner); rot.separateAxes = true; break;

                default: SkipUnknownValue(scanner); break;
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
                case "enabled": lvol.enabled = scanner.ConsumeBool(); break;
                case "limit": lvol.limit = ParseUniversalMinMaxCurve(scanner); break;
                case "dampen": lvol.dampen = scanner.ConsumeFloat(); break;
                default: SkipUnknownValue(scanner); break;
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
                case "enabled": iv.enabled = scanner.ConsumeBool(); break;
                case "mode":
                    string modeStr = scanner.Consume();
                    if (Enum.TryParse(modeStr, true, out ParticleSystemInheritVelocityMode mode))
                        iv.mode = mode;
                    break;
                case "curve": iv.curve = ParseUniversalMinMaxCurve(scanner); break;
                default: SkipUnknownValue(scanner); break;
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
                case "enabled": cbs.enabled = scanner.ConsumeBool(); break;
                case "color": cbs.color = ParseGradient(scanner); break;
                case "range":
                    scanner.Expect("[");
                    cbs.range = new Vector2(scanner.ConsumeFloat(), scanner.ConsumeFloat());
                    // 修正: 余分な要素があればスキップ
                    SkipToCloseBracket(scanner);
                    break;
                default: SkipUnknownValue(scanner); break;
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
                case "enabled": sbs.enabled = scanner.ConsumeBool(); break;
                case "size": sbs.size = ParseUniversalMinMaxCurve(scanner); break;
                case "range":
                    scanner.Expect("[");
                    sbs.range = new Vector2(scanner.ConsumeFloat(), scanner.ConsumeFloat());
                    // 修正: 余分な要素があればスキップ
                    SkipToCloseBracket(scanner);
                    break;
                default: SkipUnknownValue(scanner); break;
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
                case "enabled": rbs.enabled = scanner.ConsumeBool(); break;
                case "z": rbs.z = ParseUniversalMinMaxCurve(scanner); break;
                case "range":
                    scanner.Expect("[");
                    rbs.range = new Vector2(scanner.ConsumeFloat(), scanner.ConsumeFloat());
                    // 修正: 余分な要素があればスキップ
                    SkipToCloseBracket(scanner);
                    break;
                default: SkipUnknownValue(scanner); break;
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
            switch (key)
            {
                case "enabled": ef.enabled = scanner.ConsumeBool(); break;
                case "multiplier": ef.multiplier = ParseUniversalMinMaxCurve(scanner); break;
                default: SkipUnknownValue(scanner); break;
            }
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
                case "enabled": collision.enabled = scanner.ConsumeBool(); break;
                case "dampen": collision.dampen = ParseUniversalMinMaxCurve(scanner); break;
                case "bounce": collision.bounce = ParseUniversalMinMaxCurve(scanner); break;
                case "lifetimeLoss": collision.lifetimeLoss = ParseUniversalMinMaxCurve(scanner); break;
                default: SkipUnknownValue(scanner); break;
            }
        }
        return collision;
    }

    private static VelocityOverLifetimeModuleData ParseVelocityOverLifetimeModule(Scanner scanner)
    {
        var vol = new VelocityOverLifetimeModuleData { enabled = true };
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            switch (key)
            {
                case "x": vol.x = ParseUniversalMinMaxCurve(scanner); break;
                case "y": vol.y = ParseUniversalMinMaxCurve(scanner); break;
                case "z": vol.z = ParseUniversalMinMaxCurve(scanner); break;
                case "space":
                    string spaceStr = scanner.ConsumeStringInParens();
                    if (Enum.TryParse(spaceStr, true, out ParticleSystemSimulationSpace space))
                        vol.space = space;
                    else
                        vol.space = ParticleSystemSimulationSpace.Local;
                    break;
                case "orbitalX": vol.orbitalX = ParseUniversalMinMaxCurve(scanner); break;
                case "orbitalY": vol.orbitalY = ParseUniversalMinMaxCurve(scanner); break;
                case "orbitalZ": vol.orbitalZ = ParseUniversalMinMaxCurve(scanner); break;
                case "offset": vol.orbitalOffset = ParseVector3(scanner); break;
                case "offsetX": vol.orbitalOffset.x = scanner.ConsumeFloat(); break;
                case "offsetY": vol.orbitalOffset.y = scanner.ConsumeFloat(); break;
                case "offsetZ": vol.orbitalOffset.z = scanner.ConsumeFloat(); break;
                case "radial": vol.radial = ParseUniversalMinMaxCurve(scanner); break;
                case "speedModifier": vol.speedModifier = ParseUniversalMinMaxCurve(scanner); break;
                default: SkipUnknownValue(scanner); break;
            }
        }
        return vol;
    }

    private static ForceOverLifetimeModuleData ParseForceOverLifetimeModule(Scanner scanner)
    {
        var fol = new ForceOverLifetimeModuleData { enabled = true };
        while (scanner.Peek() != ">")
        {
            string token = scanner.Consume();
            string axis = "";
            if (token.StartsWith("~")) axis = token.Substring(1);
            else if (token.StartsWith("(")) axis = token.Replace("(", "").Replace(")", "");
            else axis = token;

            switch (axis)
            {
                case "x": fol.x = ParseUniversalMinMaxCurve(scanner); break;
                case "y": fol.y = ParseUniversalMinMaxCurve(scanner); break;
                case "z": fol.z = ParseUniversalMinMaxCurve(scanner); break;
                default: SkipUnknownValue(scanner); break;
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
                case "enabled": noise.enabled = scanner.ConsumeBool(); break;
                case "strength": noise.strength = ParseUniversalMinMaxCurve(scanner); break;
                case "frequency": noise.frequency = scanner.ConsumeFloat(); break;
                case "scrollSpeed": noise.scrollSpeed = ParseUniversalMinMaxCurve(scanner); break;
                default: SkipUnknownValue(scanner); break;
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
                case "enabled": tsa.enabled = scanner.ConsumeBool(); break;
                case "tilesX": tsa.numTilesX = (int)scanner.ConsumeFloat(); break;
                case "tilesY": tsa.numTilesY = (int)scanner.ConsumeFloat(); break;
                case "frameOverTime": tsa.frameOverTime = ParseUniversalMinMaxCurve(scanner); break;
                default: SkipUnknownValue(scanner); break;
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
                case "enabled": trails.enabled = scanner.ConsumeBool(); break;
                case "mode":
                    string modeStr = scanner.ConsumeStringInParens();
                    if (Enum.TryParse(modeStr, true, out ParticleSystemTrailMode mode))
                        trails.mode = mode;
                    break;
                case "ratio": trails.ratio = scanner.ConsumeFloat(); break;
                case "lifetime": trails.lifetime = ParseUniversalMinMaxCurve(scanner); break;
                case "minVertexDistance": trails.minVertexDistance = scanner.ConsumeFloat(); break;
                case "worldSpace": trails.worldSpace = scanner.ConsumeBool(); break;
                case "dieWithParticles": trails.dieWithParticles = scanner.ConsumeBool(); break;
                case "ribbonCount": trails.ribbonCount = (int)scanner.ConsumeFloat(); break;
                case "splitSubEmitterRibbons": trails.splitSubEmitterRibbons = scanner.ConsumeBool(); break;
                case "textureMode":
                    string texModeStr = scanner.ConsumeStringInParens();
                    if (Enum.TryParse(texModeStr, true, out ParticleSystemTrailTextureMode texMode))
                        trails.textureMode = texMode;
                    break;
                case "sizeAffectsWidth": trails.sizeAffectsWidth = scanner.ConsumeBool(); break;
                case "sizeAffectsLifetime": trails.sizeAffectsLifetime = scanner.ConsumeBool(); break;
                case "inheritParticleColor": trails.inheritParticleColor = scanner.ConsumeBool(); break;
                case "colorOverLifetime": trails.colorOverLifetime = ParseGradient(scanner); break;
                case "widthOverTrail": trails.widthOverTrail = ParseUniversalMinMaxCurve(scanner); break;
                case "colorOverTrail": trails.colorOverTrail = ParseGradient(scanner); break;
                case "generateLightingData": trails.generateLightingData = scanner.ConsumeBool(); break;
                default: SkipUnknownValue(scanner); break;
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
            switch (key)
            {
                case "enabled": sol.enabled = scanner.ConsumeBool(); break;
                case "size":
                case "separateAxes":
                    var data = ParseAxisSeparatedCurve(scanner);
                    sol.separateAxes = data.isSeparated;
                    if (data.isSeparated)
                    {
                        sol.x = data.x;
                        sol.y = data.y;
                        sol.z = data.z;
                    }
                    else
                    {
                        sol.size = data.uniform;
                    }
                    break;
                default: SkipUnknownValue(scanner); break;
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
                case "enabled": renderer.enabled = scanner.ConsumeBool(); break;
                case "renderMode":
                    string renderModeStr = scanner.ConsumeStringInParens();
                    if (Enum.TryParse(renderModeStr, true, out ParticleSystemRenderMode mode))
                        renderer.renderMode = mode;
                    break;
                case "meshDistribution":
                    string distStr = scanner.ConsumeStringInParens();
                    if (Enum.TryParse(distStr, true, out ParticleSystemMeshDistribution dist))
                        renderer.meshDistribution = dist;
                    break;
                case "meshes":
                    string meshNamesStr = scanner.ConsumeStringInParens();
                    string[] meshNames = meshNamesStr.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                    foreach (var meshName in meshNames)
                    {
                        if (meshDict.TryGetValue(meshName, out Mesh mesh))
                            renderer.meshes.Add(mesh);
                    }
                    break;
                case "materialName":
                    string materialName = scanner.ConsumeStringInParens();
                    if (materialDict.TryGetValue(materialName, out Material mat))
                        renderer.material = mat;
                    break;
                case "trailMaterialName":
                    string trailMaterialName = scanner.ConsumeStringInParens();
                    if (materialDict.TryGetValue(trailMaterialName, out Material trailMat))
                        renderer.trailMaterial = trailMat;
                    break;
                case "alignment":
                    string aligStr = scanner.ConsumeStringInParens();
                    if (Enum.TryParse(aligStr, true, out ParticleSystemRenderSpace alig))
                        renderer.alignment = alig;
                    break;
                case "shader":
                case "blendMode":
                    renderer.blendMode = scanner.ConsumeStringInParens();
                    break;
                case "sortingFudge":
                    renderer.sortingFudge = scanner.ConsumeFloat();
                    break;
                default: SkipUnknownValue(scanner); break;
            }
        }
        return renderer;
    }

    // ----------------------------------------------------------------------------------
    // カーブパースのヘルパー (旧 ParseCurve は ParseUniversalMinMaxCurve に統合されましたが、
    // 古い <~keys ...> 形式の互換性のために残しています)
    // ----------------------------------------------------------------------------------

    private static GradientData ParseGradient(Scanner scanner)
    {
        var gradient = new GradientData { colorKeys = new List<ColorKeyData>(), alphaKeys = new List<AlphaKeyData>() };
        scanner.Expect("<");
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            switch (key)
            {
                case "colorKeys": gradient.colorKeys = ParseColorKeysList(scanner); break;
                case "alphaKeys": gradient.alphaKeys = ParseAlphaKeysList(scanner); break;
                default: SkipUnknownValue(scanner); break;
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
            string key = scanner.Consume().Substring(1);
            if (key == "keys") curve.keys = ParseKeysList(scanner);
            else SkipUnknownValue(scanner);
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
            List<float> values = new List<float>();
            while (scanner.Peek() != "]" && scanner.Peek() != null)
            {
                values.Add(scanner.ConsumeFloat());
            }
            if (values.Count == 2) keyList.Add(new KeyframeData { time = values[0], value = values[1] });
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
            List<float> values = new List<float>();
            while (scanner.Peek() != "]" && scanner.Peek() != null)
            {
                values.Add(scanner.ConsumeFloat());
            }
            if (values.Count == 5)
            {
                keyList.Add(new ColorKeyData { time = values[0], color = new Color(values[1], values[2], values[3], values[4]) });
            }
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
            List<float> values = new List<float>();
            while (scanner.Peek() != "]" && scanner.Peek() != null)
            {
                values.Add(scanner.ConsumeFloat());
            }
            if (values.Count == 2)
            {
                keyList.Add(new AlphaKeyData { time = values[0], alpha = values[1] });
            }
            scanner.Expect("]");
        }
        scanner.Expect("]");
        return keyList;
    }
}