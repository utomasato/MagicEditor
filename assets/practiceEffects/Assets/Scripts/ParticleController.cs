using UnityEngine;
using System.Linq;
using System.Collections.Generic;

/// <summary>
/// プリセットデータに基づいてパーティクルをカスタマイズして再生します
/// </summary>
[RequireComponent(typeof(ParticleSystem))]
public class ParticleController : MonoBehaviour
{
    private ParticleSystem ps;

    /// <summary>
    /// CurveDataからUnityEngine.AnimationCurveを作成するヘルパー
    /// </summary>
    private AnimationCurve CreateUnityCurve(CurveData curveData, float multiplier)
    {
        if (curveData == null || curveData.keys.Count == 0) return null;

        var unityCurve = new AnimationCurve();
        foreach (var key in curveData.keys)
        {
            unityCurve.AddKey(key.time, key.value * multiplier);
        }
        return unityCurve;
    }

    /// <summary>
    /// MinMaxCurveDataからParticleSystem.MinMaxCurveを生成する汎用ヘルパー関数
    /// </summary>
    /// <param name="data">変換元のデータ</param>
    /// <param name="multiplier">定数やカーブの全てのキーに乗算する値（例: Rad変換）</param>
    /// <returns>パーティクルシステムに適用するMinMaxCurve</returns>
    private ParticleSystem.MinMaxCurve CreatePsMinMaxCurveFromData(MinMaxCurveData data, float multiplier = 1.0f)
    {
        // 1. Two Curves (MinMax Curve) Mode
        // minCurveとcurve(maxCurveとして使用)の両方が存在する場合
        if (data.minCurve != null && data.minCurve.keys.Count > 0 &&
            data.curve != null && data.curve.keys.Count > 0)
        {
            var minCurve = CreateUnityCurve(data.minCurve, multiplier);
            var maxCurve = CreateUnityCurve(data.curve, multiplier);
            return new ParticleSystem.MinMaxCurve(1.0f, minCurve, maxCurve);
        }
        // 2. Single Curve Mode
        else if (data.curve != null && data.curve.keys.Count > 0)
        {
            var maxCurve = CreateUnityCurve(data.curve, multiplier);
            return new ParticleSystem.MinMaxCurve(1.0f, maxCurve);
        }
        // 3. Constant or Random Between Two Constants Mode
        else
        {
            return new ParticleSystem.MinMaxCurve(data.min * multiplier, data.max * multiplier);
        }
    }

    // データがカーブモード（Single or Double）かどうかを判定
    private bool IsCurve(MinMaxCurveData data)
    {
        return (data.curve != null && data.curve.keys.Count > 0) ||
               (data.minCurve != null && data.minCurve.keys.Count > 0);
    }

    // データが「2つのカーブ（Two Curves）」モードかどうかを判定
    private bool IsTwoCurves(MinMaxCurveData data)
    {
        return data.minCurve != null && data.minCurve.keys.Count > 0 &&
               data.curve != null && data.curve.keys.Count > 0;
    }

    // 強制的にシングルカーブモードとしてMinMaxCurveを生成する
    private ParticleSystem.MinMaxCurve CreateCurveMode(MinMaxCurveData data, float multiplier = 1.0f)
    {
        if (IsCurve(data))
        {
            return CreatePsMinMaxCurveFromData(data, multiplier);
        }
        else
        {
            // 定数値をカーブ（始点と終点が同じ値の直線）に変換
            AnimationCurve curve = new AnimationCurve();
            float val = data.min * multiplier;
            curve.AddKey(0.0f, val);
            curve.AddKey(1.0f, val);
            return new ParticleSystem.MinMaxCurve(1.0f, curve);
        }
    }

    // 強制的にTwo CurvesモードとしてMinMaxCurveを生成する
    private ParticleSystem.MinMaxCurve CreateTwoCurvesMode(MinMaxCurveData data, float multiplier = 1.0f)
    {
        if (IsTwoCurves(data))
        {
            return CreatePsMinMaxCurveFromData(data, multiplier);
        }
        else if (IsCurve(data))
        {
            // Single Curve -> Two Curves (MinとMaxに同じカーブを設定)
            var curve = CreateUnityCurve(data.curve, multiplier);
            return new ParticleSystem.MinMaxCurve(1.0f, curve, curve);
        }
        else
        {
            // Constant -> Two Curves (MinとMaxに同じフラットなカーブを設定)
            AnimationCurve curve = new AnimationCurve();
            float val = data.min * multiplier;
            curve.AddKey(0.0f, val);
            curve.AddKey(1.0f, val);
            return new ParticleSystem.MinMaxCurve(1.0f, curve, curve);
        }
    }

    // Helper: GradientData を Unity Gradient に変換
    private Gradient CreateUnityGradient(GradientData data)
    {
        if (data == null) return new Gradient();

        Gradient grad = new Gradient();
        // キーがない場合は白を返す
        if (data.colorKeys.Count == 0) return grad;

        var colorKeys = data.colorKeys.Select(k => new GradientColorKey(k.color, k.time)).ToArray();
        var alphaKeys = data.alphaKeys.Select(k => new GradientAlphaKey(k.alpha, k.time)).ToArray();
        grad.SetKeys(colorKeys, alphaKeys);
        return grad;
    }

    public void CustomizeAndPlay(ParticlePreset preset)
    {
        ps = GetComponent<ParticleSystem>();
        if (ps == null || preset == null) return;

        ps.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);

        // --- Main Module ---
        var main = ps.main;
        if (preset.main != null && preset.main.enabled)
        {
            // Basic
            main.duration = preset.main.duration;
            main.loop = preset.main.looping;
            main.prewarm = preset.main.prewarm;
            main.startDelay = new ParticleSystem.MinMaxCurve(preset.main.startDelay.min, preset.main.startDelay.max);
            main.startLifetime = CreatePsMinMaxCurveFromData(preset.main.startLifetime);
            main.startSpeed = CreatePsMinMaxCurveFromData(preset.main.startSpeed);

            // Size
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

            // Rotation
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
            main.flipRotation = preset.main.flipRotation;

            // Physics / Scaling / Simulation
            main.gravityModifier = CreatePsMinMaxCurveFromData(preset.main.gravityModifier);
            main.simulationSpace = preset.main.simulationSpace;
            main.simulationSpeed = preset.main.simulationSpeed;
            main.useUnscaledTime = preset.main.useUnscaledTime;
            main.scalingMode = preset.main.scalingMode;
            main.playOnAwake = preset.main.playOnAwake;
            main.emitterVelocityMode = preset.main.emitterVelocityMode;
            main.maxParticles = preset.main.maxParticles;
            main.stopAction = preset.main.stopAction;
            main.cullingMode = preset.main.cullingMode;
            main.ringBufferMode = preset.main.ringBufferMode;

            // Random Seed
            if (preset.main.autoRandomSeed)
            {
                ps.useAutoRandomSeed = true;
            }
            else
            {
                ps.useAutoRandomSeed = false;
                ps.randomSeed = preset.main.randomSeed;
            }

            // --- Start Colorの適用 ---
            if (preset.main.startColor != null)
            {
                var sc = preset.main.startColor;
                ParticleSystem.MinMaxGradient minMaxGrad = new ParticleSystem.MinMaxGradient(Color.white);

                switch (sc.mode)
                {
                    case "Color":
                        minMaxGrad = new ParticleSystem.MinMaxGradient(sc.colorMax);
                        break;
                    case "TwoColors":
                        minMaxGrad = new ParticleSystem.MinMaxGradient(sc.colorMin, sc.colorMax);
                        break;
                    case "Gradient":
                        minMaxGrad = new ParticleSystem.MinMaxGradient(CreateUnityGradient(sc.gradientMax));
                        break;
                    case "TwoGradients":
                        minMaxGrad = new ParticleSystem.MinMaxGradient(
                            CreateUnityGradient(sc.gradientMin),
                            CreateUnityGradient(sc.gradientMax)
                        );
                        break;
                    case "RandomColor":
                        var g = CreateUnityGradient(sc.gradientMax);
                        minMaxGrad = new ParticleSystem.MinMaxGradient(g);
                        minMaxGrad.mode = ParticleSystemGradientMode.RandomColor;
                        break;
                }

                if (preset.main.randomColor)
                {
                    if (minMaxGrad.mode == ParticleSystemGradientMode.Gradient ||
                        minMaxGrad.mode == ParticleSystemGradientMode.TwoGradients)
                    {
                        minMaxGrad.mode = ParticleSystemGradientMode.RandomColor;
                    }
                }

                main.startColor = minMaxGrad;
            }
            else
            {
                main.startColor = Color.white;
            }
        }

        // --- Emission Module ---
        var emission = ps.emission;
        emission.enabled = preset.emission != null && preset.emission.enabled;
        if (emission.enabled)
        {
            emission.rateOverTime = CreatePsMinMaxCurveFromData(preset.emission.rateOverTime);

            // Rate Over Distance (Optional support if needed, just a float/curve)
            // emission.rateOverDistance = CreatePsMinMaxCurveFromData(preset.emission.rateOverDistance);

            List<ParticleSystem.Burst> unityBursts = new List<ParticleSystem.Burst>();

            if (preset.emission.bursts != null && preset.emission.bursts.Count > 0)
            {
                foreach (var bData in preset.emission.bursts)
                {
                    short minCount = (short)bData.count.min;
                    short maxCount = (short)bData.count.max;
                    var burst = new ParticleSystem.Burst(bData.time, minCount, maxCount, bData.cycleCount, bData.repeatInterval);
                    burst.probability = bData.probability;
                    unityBursts.Add(burst);
                }
            }

            if (unityBursts.Count == 0 && preset.emission.maxBurstCount > 0)
            {
                short min = (short)preset.emission.minBurstCount;
                short max = (short)preset.emission.maxBurstCount;
                unityBursts.Add(new ParticleSystem.Burst(0.0f, min, max));
            }
            emission.SetBursts(unityBursts.ToArray());
        }

        // --- Shape Module ---
        var shape = ps.shape;
        shape.enabled = preset.shape != null && preset.shape.enabled;
        if (shape.enabled)
        {
            var sData = preset.shape;

            // Basic
            shape.shapeType = sData.shapeType;
            shape.angle = sData.angle;
            shape.radius = sData.radius;
            shape.radiusThickness = sData.radiusThickness;
            shape.donutRadius = sData.donutRadius;

            // Arc
            shape.arc = sData.arc;
            shape.arcMode = sData.arcMode;
            shape.arcSpread = sData.arcSpread;
            shape.arcSpeed = CreatePsMinMaxCurveFromData(sData.arcSpeed);

            // Cone / Box
            shape.length = sData.length;
            shape.boxThickness = sData.boxThickness;

            // Transform
            shape.position = sData.position;
            shape.rotation = sData.rotation;

            // 修正: meshScaleは非推奨のため scale に統合
            shape.scale = sData.scale * sData.meshScale;

            // Align / Random
            shape.alignToDirection = sData.alignToDirection;
            shape.randomDirectionAmount = sData.randomizeDirection;
            shape.sphericalDirectionAmount = sData.spherizeDirection;
            shape.randomPositionAmount = sData.randomizePosition;

            // Mesh
            if (sData.mesh != null)
                shape.mesh = sData.mesh;

            shape.meshShapeType = sData.meshShapeType;
            shape.meshSpawnMode = sData.meshSpawnMode;
            shape.meshSpawnSpeed = CreatePsMinMaxCurveFromData(sData.meshSpawnSpeed);
            shape.meshMaterialIndex = sData.meshMaterialIndex;
            shape.useMeshColors = sData.useMeshColors;
            shape.normalOffset = sData.normalOffset;
            // 削除: shape.meshScale = sData.meshScale; 

            // Texture
            if (sData.texture != null)
                shape.texture = sData.texture;

            shape.textureClipChannel = sData.textureChannel;
            shape.textureClipThreshold = sData.textureClipThreshold;
            shape.textureColorAffectsParticles = sData.textureColorAffectsParticles;
            shape.textureAlphaAffectsParticles = sData.textureAlphaAffectsParticles;
            shape.textureBilinearFiltering = sData.textureBilinearFiltering;
            shape.textureUVChannel = sData.textureUVChannel;
        }

        // --- Velocity over Lifetime Module ---
        var velocityOverLifetime = ps.velocityOverLifetime;
        velocityOverLifetime.enabled = preset.velocityOverLifetime != null && preset.velocityOverLifetime.enabled;
        if (velocityOverLifetime.enabled)
        {
            velocityOverLifetime.x = CreatePsMinMaxCurveFromData(preset.velocityOverLifetime.x);
            velocityOverLifetime.y = CreatePsMinMaxCurveFromData(preset.velocityOverLifetime.y);
            velocityOverLifetime.z = CreatePsMinMaxCurveFromData(preset.velocityOverLifetime.z);
            velocityOverLifetime.space = preset.velocityOverLifetime.space;

            bool hasTwoCurves = IsTwoCurves(preset.velocityOverLifetime.orbitalX) ||
                                IsTwoCurves(preset.velocityOverLifetime.orbitalY) ||
                                IsTwoCurves(preset.velocityOverLifetime.orbitalZ);

            bool hasAnyCurve = IsCurve(preset.velocityOverLifetime.orbitalX) ||
                               IsCurve(preset.velocityOverLifetime.orbitalY) ||
                               IsCurve(preset.velocityOverLifetime.orbitalZ);

            if (hasTwoCurves)
            {
                velocityOverLifetime.orbitalX = CreateTwoCurvesMode(preset.velocityOverLifetime.orbitalX);
                velocityOverLifetime.orbitalY = CreateTwoCurvesMode(preset.velocityOverLifetime.orbitalY);
                velocityOverLifetime.orbitalZ = CreateTwoCurvesMode(preset.velocityOverLifetime.orbitalZ);
            }
            else if (hasAnyCurve)
            {
                velocityOverLifetime.orbitalX = CreateCurveMode(preset.velocityOverLifetime.orbitalX);
                velocityOverLifetime.orbitalY = CreateCurveMode(preset.velocityOverLifetime.orbitalY);
                velocityOverLifetime.orbitalZ = CreateCurveMode(preset.velocityOverLifetime.orbitalZ);
            }
            else
            {
                velocityOverLifetime.orbitalX = CreatePsMinMaxCurveFromData(preset.velocityOverLifetime.orbitalX);
                velocityOverLifetime.orbitalY = CreatePsMinMaxCurveFromData(preset.velocityOverLifetime.orbitalY);
                velocityOverLifetime.orbitalZ = CreatePsMinMaxCurveFromData(preset.velocityOverLifetime.orbitalZ);
            }

            velocityOverLifetime.orbitalOffsetX = new ParticleSystem.MinMaxCurve(preset.velocityOverLifetime.orbitalOffset.x);
            velocityOverLifetime.orbitalOffsetY = new ParticleSystem.MinMaxCurve(preset.velocityOverLifetime.orbitalOffset.y);
            velocityOverLifetime.orbitalOffsetZ = new ParticleSystem.MinMaxCurve(preset.velocityOverLifetime.orbitalOffset.z);

            velocityOverLifetime.radial = CreatePsMinMaxCurveFromData(preset.velocityOverLifetime.radial);
            velocityOverLifetime.speedModifier = CreatePsMinMaxCurveFromData(preset.velocityOverLifetime.speedModifier);
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
            colorOverLifetime.color = CreateUnityGradient(preset.colorOverLifetime.color);
        }

        // --- Color by Speed Module ---
        var colorBySpeed = ps.colorBySpeed;
        colorBySpeed.enabled = preset.colorBySpeed != null && preset.colorBySpeed.enabled;
        if (colorBySpeed.enabled)
        {
            colorBySpeed.color = CreateUnityGradient(preset.colorBySpeed.color);
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
            sizeOverLifetime.separateAxes = preset.sizeOverLifetime.separateAxes;
            if (sizeOverLifetime.separateAxes)
            {
                sizeOverLifetime.x = CreatePsMinMaxCurveFromData(preset.sizeOverLifetime.x);
                sizeOverLifetime.y = CreatePsMinMaxCurveFromData(preset.sizeOverLifetime.y);
                sizeOverLifetime.z = CreatePsMinMaxCurveFromData(preset.sizeOverLifetime.z);
            }
            else
            {
                sizeOverLifetime.size = CreatePsMinMaxCurveFromData(preset.sizeOverLifetime.size);
            }
        }

        // --- Rotation over Lifetime Module ---
        var rotationOverLifetime = ps.rotationOverLifetime;
        rotationOverLifetime.enabled = preset.rotationOverLifetime != null && preset.rotationOverLifetime.enabled;
        if (rotationOverLifetime.enabled)
        {
            rotationOverLifetime.separateAxes = preset.rotationOverLifetime.separateAxes;
            if (rotationOverLifetime.separateAxes)
            {
                rotationOverLifetime.x = CreatePsMinMaxCurveFromData(preset.rotationOverLifetime.x, Mathf.Deg2Rad);
                rotationOverLifetime.y = CreatePsMinMaxCurveFromData(preset.rotationOverLifetime.y, Mathf.Deg2Rad);
                rotationOverLifetime.z = CreatePsMinMaxCurveFromData(preset.rotationOverLifetime.z, Mathf.Deg2Rad);
            }
            else
            {
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
            collision.type = ParticleSystemCollisionType.World;
            collision.mode = ParticleSystemCollisionMode.Collision3D;
            collision.dampen = CreatePsMinMaxCurveFromData(preset.collision.dampen);
            collision.bounce = CreatePsMinMaxCurveFromData(preset.collision.bounce);
            collision.lifetimeLoss = CreatePsMinMaxCurveFromData(preset.collision.lifetimeLoss);
        }

        // --- Triggers Module, SubEmitters, Lights, CustomData ---
        var trigger = ps.trigger;
        trigger.enabled = preset.triggers != null && preset.triggers.enabled;

        var subEmitters = ps.subEmitters;
        subEmitters.enabled = preset.subEmitters != null && preset.subEmitters.enabled;

        var lights = ps.lights;
        lights.enabled = preset.lights != null && preset.lights.enabled;

        var customData = ps.customData;
        customData.enabled = preset.customData != null && preset.customData.enabled;

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

        // --- Trails Module ---
        var trails = ps.trails;
        trails.enabled = preset.trails != null && preset.trails.enabled;
        if (trails.enabled)
        {
            trails.mode = preset.trails.mode;
            trails.ratio = preset.trails.ratio;
            trails.lifetime = CreatePsMinMaxCurveFromData(preset.trails.lifetime);
            trails.minVertexDistance = preset.trails.minVertexDistance;
            trails.worldSpace = preset.trails.worldSpace;
            trails.dieWithParticles = preset.trails.dieWithParticles;

            trails.ribbonCount = preset.trails.ribbonCount;
            trails.splitSubEmitterRibbons = preset.trails.splitSubEmitterRibbons;

            trails.textureMode = preset.trails.textureMode;
            trails.sizeAffectsWidth = preset.trails.sizeAffectsWidth;
            trails.sizeAffectsLifetime = preset.trails.sizeAffectsLifetime;
            trails.inheritParticleColor = preset.trails.inheritParticleColor;

            if (preset.trails.colorOverLifetime != null && preset.trails.colorOverLifetime.colorKeys.Count > 0)
            {
                trails.colorOverLifetime = new ParticleSystem.MinMaxGradient(CreateUnityGradient(preset.trails.colorOverLifetime));
            }

            trails.widthOverTrail = CreatePsMinMaxCurveFromData(preset.trails.widthOverTrail);

            if (preset.trails.colorOverTrail != null && preset.trails.colorOverTrail.colorKeys.Count > 0)
            {
                trails.colorOverTrail = new ParticleSystem.MinMaxGradient(CreateUnityGradient(preset.trails.colorOverTrail));
            }
            trails.generateLightingData = preset.trails.generateLightingData;
        }

        // --- Renderer Module ---
        var renderer = ps.GetComponent<ParticleSystemRenderer>();
        renderer.enabled = preset.renderer != null && preset.renderer.enabled;
        if (renderer.enabled)
        {
            renderer.renderMode = preset.renderer.renderMode;

            if (renderer.renderMode == ParticleSystemRenderMode.Mesh && preset.renderer.meshes.Count > 0)
            {
                renderer.meshDistribution = preset.renderer.meshDistribution;
                renderer.SetMeshes(preset.renderer.meshes.ToArray());
            }

            if (preset.renderer.material != null)
            {
                renderer.material = new Material(preset.renderer.material);
            }
            if (preset.renderer.trailMaterial != null)
            {
                renderer.trailMaterial = new Material(preset.renderer.trailMaterial);
            }
            renderer.alignment = preset.renderer.alignment;
            renderer.sortingFudge = preset.renderer.sortingFudge;

            if (!string.IsNullOrEmpty(preset.renderer.blendMode))
            {
                string mode = preset.renderer.blendMode.ToLower();
                if (renderer.material != null)
                {
                    Material mat = renderer.material;
                    ApplyBlendModeToMaterial(mat, mode);
                    renderer.material = mat;
                }
                if (renderer.trailMaterial != null)
                {
                    Material trailMat = renderer.trailMaterial;
                    ApplyBlendModeToMaterial(trailMat, mode);
                    renderer.trailMaterial = trailMat;
                }
            }
        }

        ps.Play();
    }

    private void ApplyBlendModeToMaterial(Material mat, string mode)
    {
        bool isMobileShader = mat.shader.name.Contains("Mobile/Particles");
        bool isLegacyShader = mat.shader.name.Contains("Legacy Shaders/Particles");

        if (isMobileShader || isLegacyShader)
        {
            Shader newShader = null;
            string prefix = isMobileShader ? "Mobile/Particles/" : "Legacy Shaders/Particles/";

            if (mode == "additive") newShader = Shader.Find(prefix + "Additive");
            else if (mode == "alphablended") newShader = Shader.Find(prefix + "Alpha Blended");

            if (newShader != null) mat.shader = newShader;
            else
            {
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
            ApplyStandardBlendProperties(mat, mode);
        }
    }

    private void ApplyStandardBlendProperties(Material mat, string mode)
    {
        if (mode == "additive")
        {
            if (mat.HasProperty("_Mode")) mat.SetFloat("_Mode", 4.0f);
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
            if (mat.HasProperty("_Mode")) mat.SetFloat("_Mode", 2.0f);
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