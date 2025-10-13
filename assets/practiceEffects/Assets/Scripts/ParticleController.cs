using UnityEngine;
using System.Linq; // ToList()を使うために必要

/// <summary>
/// プリセットデータに基づいてパーティクルをカスタマイズして再生します
/// </summary>
[RequireComponent(typeof(ParticleSystem))]
public class ParticleController : MonoBehaviour
{
    private ParticleSystem ps;


    public void CustomizeAndPlay(ParticlePreset preset)
    {
        ps = GetComponent<ParticleSystem>();
        if (ps == null || preset == null) return;

        // --- Main Module ---
        var main = ps.main;
        if (preset.main != null && preset.main.enabled)
        {
            main.startLifetime = new ParticleSystem.MinMaxCurve(preset.main.startLifetime.min, preset.main.startLifetime.max);
            main.startSpeed = new ParticleSystem.MinMaxCurve(preset.main.startSpeed.min, preset.main.startSpeed.max);
            main.startSize = new ParticleSystem.MinMaxCurve(preset.main.startSize.min, preset.main.startSize.max);

            float minRotRad = preset.main.startRotation.min * Mathf.Deg2Rad;
            float maxRotRad = preset.main.startRotation.max * Mathf.Deg2Rad;
            main.startRotation = new ParticleSystem.MinMaxCurve(minRotRad, maxRotRad);
            main.simulationSpace = preset.main.simulationSpace;
        }
        main.startColor = Color.white;

        // --- Emission Module ---
        var emission = ps.emission;
        emission.enabled = preset.emission != null && preset.emission.enabled;
        if (emission.enabled)
        {
            emission.rateOverTime = new ParticleSystem.MinMaxCurve(preset.emission.rateOverTime.min, preset.emission.rateOverTime.max);
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
            velocityOverLifetime.x = new ParticleSystem.MinMaxCurve(preset.velocityOverLifetime.x.min, preset.velocityOverLifetime.x.max);
            velocityOverLifetime.y = new ParticleSystem.MinMaxCurve(preset.velocityOverLifetime.y.min, preset.velocityOverLifetime.y.max);
            velocityOverLifetime.z = new ParticleSystem.MinMaxCurve(preset.velocityOverLifetime.z.min, preset.velocityOverLifetime.z.max);
        }

        // --- Limit Velocity over Lifetime Module ---
        var limitVelocityOverLifetime = ps.limitVelocityOverLifetime;
        limitVelocityOverLifetime.enabled = preset.limitVelocityOverLifetime != null && preset.limitVelocityOverLifetime.enabled;
        if (limitVelocityOverLifetime.enabled)
        {
            limitVelocityOverLifetime.limit = new ParticleSystem.MinMaxCurve(preset.limitVelocityOverLifetime.limit.min, preset.limitVelocityOverLifetime.limit.max);
            limitVelocityOverLifetime.dampen = preset.limitVelocityOverLifetime.dampen;
        }

        // --- Inherit Velocity Module ---
        var inheritVelocity = ps.inheritVelocity;
        inheritVelocity.enabled = preset.inheritVelocity != null && preset.inheritVelocity.enabled;
        if (inheritVelocity.enabled)
        {
            inheritVelocity.mode = preset.inheritVelocity.mode;
            inheritVelocity.curve = new ParticleSystem.MinMaxCurve(preset.inheritVelocity.curve.min, preset.inheritVelocity.curve.max);
        }

        // --- Force over Lifetime Module ---
        var forceOverLifetime = ps.forceOverLifetime;
        forceOverLifetime.enabled = preset.forceOverLifetime != null && preset.forceOverLifetime.enabled;
        if (forceOverLifetime.enabled)
        {
            forceOverLifetime.x = new ParticleSystem.MinMaxCurve(preset.forceOverLifetime.x.min, preset.forceOverLifetime.x.max);
            forceOverLifetime.y = new ParticleSystem.MinMaxCurve(preset.forceOverLifetime.y.min, preset.forceOverLifetime.y.max);
            forceOverLifetime.z = new ParticleSystem.MinMaxCurve(preset.forceOverLifetime.z.min, preset.forceOverLifetime.z.max);
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

        // --- Rotation over Lifetime Module ---
        var rotationOverLifetime = ps.rotationOverLifetime;
        rotationOverLifetime.enabled = preset.rotationOverLifetime != null && preset.rotationOverLifetime.enabled;
        if (rotationOverLifetime.enabled)
        {
            float minRotRad = preset.rotationOverLifetime.z.min * Mathf.Deg2Rad;
            float maxRotRad = preset.rotationOverLifetime.z.max * Mathf.Deg2Rad;
            rotationOverLifetime.z = new ParticleSystem.MinMaxCurve(minRotRad, maxRotRad);
        }

        // --- Size by Speed Module ---
        var sizeBySpeed = ps.sizeBySpeed;
        sizeBySpeed.enabled = preset.sizeBySpeed != null && preset.sizeBySpeed.enabled;
        if (sizeBySpeed.enabled)
        {
            var sbsCurve = new AnimationCurve();
            sbsCurve.AddKey(0.0f, preset.sizeBySpeed.size.min);
            sbsCurve.AddKey(1.0f, preset.sizeBySpeed.size.max);
            sizeBySpeed.size = new ParticleSystem.MinMaxCurve(1.0f, sbsCurve);
            sizeBySpeed.range = preset.sizeBySpeed.range;
        }

        // --- Rotation by Speed Module ---
        var rotationBySpeed = ps.rotationBySpeed;
        rotationBySpeed.enabled = preset.rotationBySpeed != null && preset.rotationBySpeed.enabled;
        if (rotationBySpeed.enabled)
        {
            float minRotRadRbs = preset.rotationBySpeed.z.min * Mathf.Deg2Rad;
            float maxRotRadRbs = preset.rotationBySpeed.z.max * Mathf.Deg2Rad;
            rotationBySpeed.z = new ParticleSystem.MinMaxCurve(minRotRadRbs, maxRotRadRbs);
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
            var animCurve = new AnimationCurve();
            animCurve.AddKey(0.0f, preset.sizeOverLifetime.size.min);
            animCurve.AddKey(1.0f, preset.sizeOverLifetime.size.max);
            sizeOverLifetime.size = new ParticleSystem.MinMaxCurve(1.0f, animCurve);
        }

        // --- Noise Module ---
        var noise = ps.noise;
        noise.enabled = preset.noise != null && preset.noise.enabled;
        if (noise.enabled)
        {
            noise.strength = new ParticleSystem.MinMaxCurve(preset.noise.strength.min, preset.noise.strength.max);
            noise.frequency = preset.noise.frequency;
            noise.scrollSpeed = new ParticleSystem.MinMaxCurve(preset.noise.scrollSpeed.min, preset.noise.scrollSpeed.max);
        }

        // --- Collision Module ---
        var collision = ps.collision;
        collision.enabled = preset.collision != null && preset.collision.enabled;
        if (collision.enabled)
        {
            collision.type = ParticleSystemCollisionType.World; // World固定
            collision.mode = ParticleSystemCollisionMode.Collision3D;
            collision.dampen = new ParticleSystem.MinMaxCurve(preset.collision.dampen.min, preset.collision.dampen.max);
            collision.bounce = new ParticleSystem.MinMaxCurve(preset.collision.bounce.min, preset.collision.bounce.max);
            collision.lifetimeLoss = new ParticleSystem.MinMaxCurve(preset.collision.lifetimeLoss.min, preset.collision.lifetimeLoss.max);
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
            textureSheetAnimation.frameOverTime = new ParticleSystem.MinMaxCurve(preset.textureSheetAnimation.frameOverTime.min, preset.textureSheetAnimation.frameOverTime.max);
        }

        // --- Lights Module ---
        var lights = ps.lights;
        lights.enabled = preset.lights != null && preset.lights.enabled;

        // --- Trails Module ---
        var trails = ps.trails;
        trails.enabled = preset.trails != null && preset.trails.enabled;
        if (trails.enabled)
        {
            trails.lifetime = new ParticleSystem.MinMaxCurve(preset.trails.lifetime.min, preset.trails.lifetime.max);
            var trailWidthCurve = new AnimationCurve();
            trailWidthCurve.AddKey(0.0f, preset.trails.widthOverTrail.min);
            trailWidthCurve.AddKey(1.0f, preset.trails.widthOverTrail.max);
            trails.widthOverTrail = new ParticleSystem.MinMaxCurve(1.0f, trailWidthCurve);
        }

        // --- CustomData Module ---
        var customData = ps.customData;
        customData.enabled = preset.customData != null && preset.customData.enabled;


        // --- Renderer Module ---
        var renderer = ps.GetComponent<ParticleSystemRenderer>();
        renderer.enabled = preset.renderer != null && preset.renderer.enabled;
        if (renderer.enabled)
        {
            if (preset.renderer.material != null)
            {
                renderer.material = preset.renderer.material;
            }
            if (preset.renderer.trailMaterial != null)
            {
                renderer.trailMaterial = preset.renderer.trailMaterial;
            }
        }

        // --- 設定を適用して再生 ---
        ps.Play();
    }
}

