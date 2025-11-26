using UnityEngine;
using System.Collections.Generic;
using System;

// ----------------------------------------------------------------------------------
// Velocity (速度) 関連のモジュールパース処理を分離したファイル
// 
// 含まれるモジュール:
// - VelocityOverLifetime
// - LimitVelocityOverLifetime
// - InheritVelocity
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
}