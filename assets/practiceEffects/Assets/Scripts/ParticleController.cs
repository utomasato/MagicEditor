using UnityEngine;
using System.Linq; // ToList()を使うために必要

/// <summary>
/// プリセットデータに基づいてパーティクルをカスタマイズして再生します
/// </summary>
[RequireComponent(typeof(ParticleSystem))]
public class ParticleController : MonoBehaviour
{
    private ParticleSystem ps;


    /// <summary>
    /// MinMaxCurveDataからParticleSystem.MinMaxCurveを生成する汎用ヘルパー関数
    /// </summary>
    /// <param name="data">変換元のデータ</param>
    /// <param name="multiplier">定数やカーブの全てのキーに乗算する値（例: Rad変換）</param>
    /// <returns>パーティクルシステムに適用するMinMaxCurve</returns>
    private ParticleSystem.MinMaxCurve CreatePsMinMaxCurveFromData(MinMaxCurveData data, float multiplier = 1.0f)
    {
        // カーブデータが存在し、キーが1つ以上ある場合
        if (data.curve != null && data.curve.keys.Count > 0)
        {
            var unityCurve = new AnimationCurve();
            foreach (var key in data.curve.keys)
            {
                // 乗数を適用してキーを追加
                unityCurve.AddKey(key.time, key.value * multiplier);
            }
            // ParticleSystem.MinMaxCurveはカーブ自体には乗数を適用しないため、
            // グローバルな乗数として1.0fを渡す
            return new ParticleSystem.MinMaxCurve(1.0f, unityCurve);
        }
        else
        {
            // 定数または2定数間のランダム値の場合
            return new ParticleSystem.MinMaxCurve(data.min * multiplier, data.max * multiplier);
        }
    }


    public void CustomizeAndPlay(ParticlePreset preset)
    {
        ps = GetComponent<ParticleSystem>();
        if (ps == null || preset == null) return;

        // 設定を適用する前に、パーティクルシステムを完全に停止してクリアします。
        // これにより "Play on Awake" が有効でも安全に設定を変更できます。
        ps.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);

        // --- Main Module ---
        var main = ps.main;
        if (preset.main != null && preset.main.enabled)
        {
            main.duration = preset.main.duration;
            main.startLifetime = CreatePsMinMaxCurveFromData(preset.main.startLifetime);
            main.startSpeed = CreatePsMinMaxCurveFromData(preset.main.startSpeed);

            main.startSize3D = preset.main.startSize3D;
            if (main.startSize3D)
            {
                main.startSizeX = CreatePsMinMaxCurveFromData(preset.main.startSizeX);
                main.startSizeY = CreatePsMinMaxCurveFromData(preset.main.startSizeY);
                main.startSizeZ = CreatePsMinMaxCurveFromData(preset.main.startSizeZ);
            }
            else
            {
                main.startSize = CreatePsMinMaxCurveFromData(preset.main.startSize);
            }

            main.startRotation3D = preset.main.startRotation3D;
            if (main.startRotation3D)
            {
                main.startRotationX = CreatePsMinMaxCurveFromData(preset.main.startRotationX, Mathf.Deg2Rad);
                main.startRotationY = CreatePsMinMaxCurveFromData(preset.main.startRotationY, Mathf.Deg2Rad);
                main.startRotation = CreatePsMinMaxCurveFromData(preset.main.startRotation, Mathf.Deg2Rad); // Z
            }
            else
            {
                main.startRotation = CreatePsMinMaxCurveFromData(preset.main.startRotation, Mathf.Deg2Rad); // Z
            }

            main.simulationSpace = preset.main.simulationSpace;

            // Start Color
            if (preset.main.startColor != null && preset.main.startColor.colorKeys.Count > 0)
            {
                // カラーキーが1つの場合は単色として扱う
                if (preset.main.startColor.colorKeys.Count == 1)
                {
                    main.startColor = preset.main.startColor.colorKeys[0].color;
                }
                // カラーキーが複数の場合はグラデーションとして扱う
                else
                {
                    Gradient grad = new Gradient();
                    var colorKeys = preset.main.startColor.colorKeys.Select(k => new GradientColorKey(k.color, k.time)).ToArray();
                    var alphaKeys = preset.main.startColor.alphaKeys.Select(k => new GradientAlphaKey(k.alpha, k.time)).ToArray();
                    grad.SetKeys(colorKeys, alphaKeys);
                    main.startColor = new ParticleSystem.MinMaxGradient(grad);
                }
            }
            else
            {
                main.startColor = Color.white; // デフォルトは白
            }
        }


        // --- Emission Module ---
        var emission = ps.emission;
        emission.enabled = preset.emission != null && preset.emission.enabled;
        if (emission.enabled)
        {
            emission.rateOverTime = CreatePsMinMaxCurveFromData(preset.emission.rateOverTime);
            if (preset.emission.maxBurstCount > 0)
            {
                emission.rateOverTime = 0;
                int burstCount = Random.Range(preset.emission.minBurstCount, preset.emission.maxBurstCount + 1);
                emission.SetBursts(new ParticleSystem.Burst[] { new ParticleSystem.Burst(0.0f, (short)burstCount) });
            }
        }

        // --- Shape Module ---
        var shape = ps.shape;
        shape.enabled = preset.shape != null && preset.shape.enabled;
        if (shape.enabled)
        {
            shape.shapeType = preset.shape.shapeType; // ★ プリセットから形状タイプを設定
            shape.angle = preset.shape.angle;
            shape.radius = preset.shape.radius;
        }

        // --- Velocity over Lifetime Module ---
        var velocityOverLifetime = ps.velocityOverLifetime;
        velocityOverLifetime.enabled = preset.velocityOverLifetime != null && preset.velocityOverLifetime.enabled;
        if (velocityOverLifetime.enabled)
        {
            velocityOverLifetime.x = CreatePsMinMaxCurveFromData(preset.velocityOverLifetime.x);
            velocityOverLifetime.y = CreatePsMinMaxCurveFromData(preset.velocityOverLifetime.y);
            velocityOverLifetime.z = CreatePsMinMaxCurveFromData(preset.velocityOverLifetime.z);
        }

        // --- Limit Velocity over Lifetime Module ---
        var limitVelocityOverLifetime = ps.limitVelocityOverLifetime;
        limitVelocityOverLifetime.enabled = preset.limitVelocityOverLifetime != null && preset.limitVelocityOverLifetime.enabled;
        if (limitVelocityOverLifetime.enabled)
        {
            limitVelocityOverLifetime.limit = CreatePsMinMaxCurveFromData(preset.limitVelocityOverLifetime.limit);
            limitVelocityOverLifetime.dampen = preset.limitVelocityOverLifetime.dampen;
        }

        // --- Inherit Velocity Module ---
        var inheritVelocity = ps.inheritVelocity;
        inheritVelocity.enabled = preset.inheritVelocity != null && preset.inheritVelocity.enabled;
        if (inheritVelocity.enabled)
        {
            inheritVelocity.mode = preset.inheritVelocity.mode;
            inheritVelocity.curve = CreatePsMinMaxCurveFromData(preset.inheritVelocity.curve);
        }

        // --- Force over Lifetime Module ---
        var forceOverLifetime = ps.forceOverLifetime;
        forceOverLifetime.enabled = preset.forceOverLifetime != null && preset.forceOverLifetime.enabled;
        if (forceOverLifetime.enabled)
        {
            forceOverLifetime.x = CreatePsMinMaxCurveFromData(preset.forceOverLifetime.x);
            forceOverLifetime.y = CreatePsMinMaxCurveFromData(preset.forceOverLifetime.y);
            forceOverLifetime.z = CreatePsMinMaxCurveFromData(preset.forceOverLifetime.z);
        }

        // --- Color over Lifetime Module ---
        var colorOverLifetime = ps.colorOverLifetime;
        colorOverLifetime.enabled = preset.colorOverLifetime != null && preset.colorOverLifetime.enabled;
        if (colorOverLifetime.enabled && preset.colorOverLifetime.color != null)
        {
            Gradient grad = new Gradient();
            var colorKeys = preset.colorOverLifetime.color.colorKeys.Select(k => new GradientColorKey(k.color, k.time)).ToArray();
            var alphaKeys = preset.colorOverLifetime.color.alphaKeys.Select(k => new GradientAlphaKey(k.alpha, k.time)).ToArray();
            grad.SetKeys(colorKeys, alphaKeys);
            colorOverLifetime.color = grad;
        }

        // --- Color by Speed Module ---
        var colorBySpeed = ps.colorBySpeed;
        colorBySpeed.enabled = preset.colorBySpeed != null && preset.colorBySpeed.enabled;
        if (colorBySpeed.enabled)
        {
            Gradient cbsGrad = new Gradient();
            var cbsColorKeys = preset.colorBySpeed.color.colorKeys.Select(k => new GradientColorKey(k.color, k.time)).ToArray();
            var cbsAlphaKeys = preset.colorBySpeed.color.alphaKeys.Select(k => new GradientAlphaKey(k.alpha, k.time)).ToArray();
            cbsGrad.SetKeys(cbsColorKeys, cbsAlphaKeys);
            colorBySpeed.color = cbsGrad;
            colorBySpeed.range = preset.colorBySpeed.range;
        }


        // --- Size by Speed Module ---
        var sizeBySpeed = ps.sizeBySpeed;
        sizeBySpeed.enabled = preset.sizeBySpeed != null && preset.sizeBySpeed.enabled;
        if (sizeBySpeed.enabled)
        {
            sizeBySpeed.size = CreatePsMinMaxCurveFromData(preset.sizeBySpeed.size);
            sizeBySpeed.range = preset.sizeBySpeed.range;
        }

        // --- Rotation by Speed Module ---
        var rotationBySpeed = ps.rotationBySpeed;
        rotationBySpeed.enabled = preset.rotationBySpeed != null && preset.rotationBySpeed.enabled;
        if (rotationBySpeed.enabled)
        {
            rotationBySpeed.z = CreatePsMinMaxCurveFromData(preset.rotationBySpeed.z, Mathf.Deg2Rad);
            rotationBySpeed.range = preset.rotationBySpeed.range;
        }

        // --- External Forces Module ---
        var externalForces = ps.externalForces;
        externalForces.enabled = preset.externalForces != null && preset.externalForces.enabled;
        if (externalForces.enabled)
        {
            externalForces.multiplier = preset.externalForces.multiplier.min;
        }

        // --- Size over Lifetime Module ---
        var sizeOverLifetime = ps.sizeOverLifetime;
        sizeOverLifetime.enabled = preset.sizeOverLifetime != null && preset.sizeOverLifetime.enabled;
        if (sizeOverLifetime.enabled)
        {
            sizeOverLifetime.size = CreatePsMinMaxCurveFromData(preset.sizeOverLifetime.size);
        }

        // --- Rotation over Lifetime Module ---
        var rotationOverLifetime = ps.rotationOverLifetime;
        rotationOverLifetime.enabled = preset.rotationOverLifetime != null && preset.rotationOverLifetime.enabled;
        if (rotationOverLifetime.enabled)
        {
            rotationOverLifetime.separateAxes = preset.rotationOverLifetime.separateAxes;
            if (rotationOverLifetime.separateAxes)
            {
                // 3D (XYZ分離)
                rotationOverLifetime.x = CreatePsMinMaxCurveFromData(preset.rotationOverLifetime.x, Mathf.Deg2Rad);
                rotationOverLifetime.y = CreatePsMinMaxCurveFromData(preset.rotationOverLifetime.y, Mathf.Deg2Rad);
                rotationOverLifetime.z = CreatePsMinMaxCurveFromData(preset.rotationOverLifetime.z, Mathf.Deg2Rad);
            }
            else
            {
                // 1D (Z軸のみ)
                rotationOverLifetime.z = CreatePsMinMaxCurveFromData(preset.rotationOverLifetime.z, Mathf.Deg2Rad);
            }
        }

        // --- Noise Module ---
        var noise = ps.noise;
        noise.enabled = preset.noise != null && preset.noise.enabled;
        if (noise.enabled)
        {
            noise.strength = CreatePsMinMaxCurveFromData(preset.noise.strength);
            noise.frequency = preset.noise.frequency;
            noise.scrollSpeed = CreatePsMinMaxCurveFromData(preset.noise.scrollSpeed);
        }

        // --- Collision Module ---
        var collision = ps.collision;
        collision.enabled = preset.collision != null && preset.collision.enabled;
        if (collision.enabled)
        {
            collision.type = ParticleSystemCollisionType.World; // World固定
            collision.mode = ParticleSystemCollisionMode.Collision3D;
            collision.dampen = CreatePsMinMaxCurveFromData(preset.collision.dampen);
            collision.bounce = CreatePsMinMaxCurveFromData(preset.collision.bounce);
            collision.lifetimeLoss = CreatePsMinMaxCurveFromData(preset.collision.lifetimeLoss);
        }

        // --- Triggers Module ---
        var trigger = ps.trigger;
        trigger.enabled = preset.triggers != null && preset.triggers.enabled;

        // --- SubEmitters Module ---
        var subEmitters = ps.subEmitters;
        subEmitters.enabled = preset.subEmitters != null && preset.subEmitters.enabled;

        // --- Texture Sheet Animation Module ---
        var textureSheetAnimation = ps.textureSheetAnimation;
        textureSheetAnimation.enabled = preset.textureSheetAnimation != null && preset.textureSheetAnimation.enabled;
        if (textureSheetAnimation.enabled)
        {
            textureSheetAnimation.mode = ParticleSystemAnimationMode.Grid;
            textureSheetAnimation.numTilesX = preset.textureSheetAnimation.numTilesX;
            textureSheetAnimation.numTilesY = preset.textureSheetAnimation.numTilesY;
            textureSheetAnimation.frameOverTime = CreatePsMinMaxCurveFromData(preset.textureSheetAnimation.frameOverTime);
        }

        // --- Lights Module ---
        var lights = ps.lights;
        lights.enabled = preset.lights != null && preset.lights.enabled;

        // --- Trails Module ---
        var trails = ps.trails;
        trails.enabled = preset.trails != null && preset.trails.enabled;
        if (trails.enabled)
        {
            trails.lifetime = CreatePsMinMaxCurveFromData(preset.trails.lifetime);
            trails.widthOverTrail = CreatePsMinMaxCurveFromData(preset.trails.widthOverTrail);
        }

        // --- CustomData Module ---
        var customData = ps.customData;
        customData.enabled = preset.customData != null && preset.customData.enabled;


        // --- Renderer Module ---
        var renderer = ps.GetComponent<ParticleSystemRenderer>();
        renderer.enabled = preset.renderer != null && preset.renderer.enabled;
        if (renderer.enabled)
        {
            renderer.renderMode = preset.renderer.renderMode;

            if (renderer.renderMode == ParticleSystemRenderMode.Mesh && preset.renderer.meshes.Count > 0)
            {
                renderer.meshDistribution = preset.renderer.meshDistribution;
                // SetMeshesは配列を受け取るため、ListをArrayに変換
                renderer.SetMeshes(preset.renderer.meshes.ToArray());
            }

            if (preset.renderer.material != null)
            {
                // 【修正】元のアセットを書き換えないように、マテリアルのコピー（インスタンス）を作成して割り当てる
                renderer.material = new Material(preset.renderer.material);
            }
            if (preset.renderer.trailMaterial != null)
            {
                // 【修正】元のアセットを書き換えないように、マテリアルのコピー（インスタンス）を作成して割り当てる
                renderer.trailMaterial = new Material(preset.renderer.trailMaterial);
            }
            renderer.alignment = preset.renderer.alignment;
            renderer.sortingFudge = preset.renderer.sortingFudge;

            // ★ シェーダー（ブレンドモード）の適用
            if (!string.IsNullOrEmpty(preset.renderer.blendMode))
            {
                string mode = preset.renderer.blendMode.ToLower();

                // メインマテリアルへ適用
                // 既にコピーされているので、安全に変更可能
                if (renderer.material != null)
                {
                    Material mat = renderer.material;
                    ApplyBlendModeToMaterial(mat, mode);
                    renderer.material = mat; // 変更を反映
                }

                // トレイルマテリアルへ適用
                // 既にコピーされているので、安全に変更可能
                if (renderer.trailMaterial != null)
                {
                    Material trailMat = renderer.trailMaterial;
                    ApplyBlendModeToMaterial(trailMat, mode);
                    renderer.trailMaterial = trailMat; // 変更を反映
                }
            }
        }

        // --- 設定を適用して再生 ---
        ps.Play();
    }

    /// <summary>
    /// 指定されたマテリアルにブレンドモード（シェーダー変更含む）を適用するヘルパー関数
    /// </summary>
    private void ApplyBlendModeToMaterial(Material mat, string mode)
    {
        Debug.Log($"Applying Blend Mode: {mode} to material: {mat.name} (Shader: {mat.shader.name})");

        // 現在のシェーダーがレガシー系（Mobile/Particles/〜）かどうか判定
        bool isMobileShader = mat.shader.name.Contains("Mobile/Particles");
        bool isLegacyShader = mat.shader.name.Contains("Legacy Shaders/Particles");

        // レガシー系シェーダーの場合はプロパティ変更ではなくシェーダーを差し替える
        if (isMobileShader || isLegacyShader)
        {
            Shader newShader = null;
            string prefix = isMobileShader ? "Mobile/Particles/" : "Legacy Shaders/Particles/";

            if (mode == "additive")
            {
                newShader = Shader.Find(prefix + "Additive");
            }
            else if (mode == "alphablended")
            {
                newShader = Shader.Find(prefix + "Alpha Blended");
            }

            if (newShader != null)
            {
                mat.shader = newShader;
            }
            else
            {
                // 同等のレガシーシェーダーが見つからない場合、Standard Unlitへのフォールバックを試みる
                Debug.LogWarning($"Requested legacy shader for mode '{mode}' not found. Falling back to Standard Unlit.");
                var standardShader = Shader.Find("Particles/Standard Unlit");
                if (standardShader != null)
                {
                    mat.shader = standardShader;
                    ApplyStandardBlendProperties(mat, mode);
                }
            }
        }
        else
        {
            // Standard Particle Shader などの場合はプロパティで制御
            ApplyStandardBlendProperties(mat, mode);
        }
    }

    /// <summary>
    /// Standard Particle Shader向けのブレンド設定を適用するヘルパー関数
    /// </summary>
    private void ApplyStandardBlendProperties(Material mat, string mode)
    {
        if (mode == "additive")
        {
            // Additive設定
            if (mat.HasProperty("_Mode")) mat.SetFloat("_Mode", 4.0f); // 4: Additive
            mat.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.SrcAlpha);
            mat.SetInt("_DstBlend", (int)UnityEngine.Rendering.BlendMode.One);
            mat.SetInt("_ZWrite", 0);
            mat.DisableKeyword("_ALPHATEST_ON");
            mat.DisableKeyword("_ALPHABLEND_ON");
            mat.EnableKeyword("_ALPHAPREMULTIPLY_ON");
            mat.renderQueue = 3000;
        }
        else if (mode == "alphablended")
        {
            // Alpha Blended設定
            if (mat.HasProperty("_Mode")) mat.SetFloat("_Mode", 2.0f); // 2: Fade / AlphaBlend
            mat.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.SrcAlpha);
            mat.SetInt("_DstBlend", (int)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);
            mat.SetInt("_ZWrite", 0);
            mat.DisableKeyword("_ALPHATEST_ON");
            mat.EnableKeyword("_ALPHABLEND_ON");
            mat.DisableKeyword("_ALPHAPREMULTIPLY_ON");
            mat.renderQueue = 3000;
        }
    }
}