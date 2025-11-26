using UnityEngine;
using System.Collections.Generic;
using System;

// ----------------------------------------------------------------------------------
// 動き関係
// 
// 含まれるモジュール:
// - VelocityOverLifetime
// - LimitVelocityOverLifetime
// - InheritVelocity
// - Force over Lifetime
// - External Forces
// - Noise
// - Collision
// ----------------------------------------------------------------------------------
public static partial class MpsParser
{
    private static VelocityOverLifetimeModuleData ParseVelocityOverLifetimeModule(Scanner scanner)
    {
        var velocity = new VelocityOverLifetimeModuleData { enabled = true };
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            switch (key)
            {
                case "x": velocity.x = ParseUniversalMinMaxCurve(scanner); break;
                case "y": velocity.y = ParseUniversalMinMaxCurve(scanner); break;
                case "z": velocity.z = ParseUniversalMinMaxCurve(scanner); break;

                case "space":
                    string spaceStr = scanner.ConsumeStringInParens();
                    if (Enum.TryParse(spaceStr, true, out ParticleSystemSimulationSpace space))
                        velocity.space = space;
                    else
                        velocity.space = ParticleSystemSimulationSpace.Local;
                    break;

                case "orbitalX": velocity.orbitalX = ParseUniversalMinMaxCurve(scanner); break;
                case "orbitalY": velocity.orbitalY = ParseUniversalMinMaxCurve(scanner); break;
                case "orbitalZ": velocity.orbitalZ = ParseUniversalMinMaxCurve(scanner); break;

                case "offset": velocity.orbitalOffset = ParseVector3(scanner); break;
                case "offsetX": velocity.orbitalOffset.x = scanner.ConsumeFloat(); break;
                case "offsetY": velocity.orbitalOffset.y = scanner.ConsumeFloat(); break;
                case "offsetZ": velocity.orbitalOffset.z = scanner.ConsumeFloat(); break;

                case "radial": velocity.radial = ParseUniversalMinMaxCurve(scanner); break;
                case "speedModifier": velocity.speedModifier = ParseUniversalMinMaxCurve(scanner); break;

                default:
                    SkipUnknownValue(scanner);
                    break;
            }
        }
        return velocity;
    }

    private static LimitVelocityOverLifetimeModuleData ParseLimitVelocityOverLifetimeModule(Scanner scanner)
    {
        var limitVelocity = new LimitVelocityOverLifetimeModuleData { enabled = true };
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            switch (key)
            {
                case "enabled": limitVelocity.enabled = scanner.ConsumeBool(); break;
                case "limit": limitVelocity.limit = ParseUniversalMinMaxCurve(scanner); break;
                case "dampen": limitVelocity.dampen = scanner.ConsumeFloat(); break;
                default:
                    SkipUnknownValue(scanner);
                    break;
            }
        }
        return limitVelocity;
    }

    private static InheritVelocityModuleData ParseInheritVelocityModule(Scanner scanner)
    {
        var inheritVelocity = new InheritVelocityModuleData { enabled = true };
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            switch (key)
            {
                case "enabled": inheritVelocity.enabled = scanner.ConsumeBool(); break;
                case "mode":
                    if (Enum.TryParse(scanner.ConsumeStringInParens(), true, out ParticleSystemInheritVelocityMode mode))
                        inheritVelocity.mode = mode;
                    break;
                case "curve": inheritVelocity.curve = ParseUniversalMinMaxCurve(scanner); break;
                default:
                    SkipUnknownValue(scanner);
                    break;
            }
        }
        return inheritVelocity;
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
}