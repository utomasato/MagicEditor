using UnityEngine;
using System.Collections.Generic;
using System;

// ----------------------------------------------------------------------------------
// 見た目の変化関係
// 
// 含まれるモジュール:
// - Renderer
// - Texture Sheet Animation
// - Trails
// - (Lights)
// ----------------------------------------------------------------------------------
public static partial class MpsParser
{
    // 引数に shaderDict と textureDict を追加
    private static RendererModuleData ParseRendererModule(Scanner s, Dictionary<string, Material> md, Dictionary<string, Mesh> msd, Dictionary<string, Shader> sd, Dictionary<string, Texture2D> td)
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
            // 既存のマテリアル指定
            else if (k == "materialName") { if (md.TryGetValue(s.ConsumeStringInParens(), out Material mat)) m.material = mat; }
            // 動的マテリアル指定 (~material <~shader (Name) ~texture (Name)>)
            else if (k == "material")
            {
                s.Expect("<");
                while (s.Peek() != ">")
                {
                    string subKey = s.Consume().Substring(1);
                    if (subKey == "shader")
                    {
                        string shaderName = s.ConsumeStringInParens();
                        if (sd.TryGetValue(shaderName, out Shader shader))
                        {
                            m.shader = shader;
                        }
                        else
                        {
                            Debug.LogWarning($"Shader '{shaderName}' not found in dictionary.");
                        }
                    }
                    else if (subKey == "texture")
                    {
                        string textureName = s.ConsumeStringInParens();
                        if (td.TryGetValue(textureName, out Texture2D tex))
                        {
                            m.mainTexture = tex;
                        }
                        else
                        {
                            Debug.LogWarning($"Texture '{textureName}' not found in dictionary.");
                        }
                    }
                    else
                    {
                        SkipUnknownValue(s);
                    }
                }
                s.Expect(">");
            }
            else if (k == "trailMaterialName") { if (md.TryGetValue(s.ConsumeStringInParens(), out Material tm)) m.trailMaterial = tm; }
            // 追加: 動的トレイルマテリアル指定 (~trailMaterial <~shader (Name) ~texture (Name)>)
            else if (k == "trailMaterial")
            {
                s.Expect("<");
                while (s.Peek() != ">")
                {
                    string subKey = s.Consume().Substring(1);
                    if (subKey == "shader")
                    {
                        string shaderName = s.ConsumeStringInParens();
                        if (sd.TryGetValue(shaderName, out Shader shader))
                        {
                            m.trailShader = shader;
                        }
                        else
                        {
                            Debug.LogWarning($"Trail Shader '{shaderName}' not found in dictionary.");
                        }
                    }
                    else if (subKey == "texture")
                    {
                        string textureName = s.ConsumeStringInParens();
                        if (td.TryGetValue(textureName, out Texture2D tex))
                        {
                            m.trailTexture = tex;
                        }
                        else
                        {
                            Debug.LogWarning($"Trail Texture '{textureName}' not found in dictionary.");
                        }
                    }
                    else
                    {
                        SkipUnknownValue(s);
                    }
                }
                s.Expect(">");
            }
            else if (k == "alignment") { if (Enum.TryParse(s.ConsumeStringInParens(), true, out ParticleSystemRenderSpace rs)) m.alignment = rs; }
            else if (k == "shader" || k == "blendMode") m.blendMode = s.ConsumeStringInParens();
            else if (k == "sortingFudge") m.sortingFudge = s.ConsumeFloat();
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
}