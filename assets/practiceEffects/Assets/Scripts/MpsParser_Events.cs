using UnityEngine;
using System.Collections.Generic;
using System;

// ----------------------------------------------------------------------------------
// 見た目の変化関係
// 
// 含まれるモジュール:
// - (Sub Emitters)
// - (Triggers)
// - Custom Data
// ----------------------------------------------------------------------------------
public static partial class MpsParser
{
    private static CustomDataModuleData ParseCustomDataModule(Scanner s)
    {
        var m = new CustomDataModuleData { enabled = true };
        while (s.Peek() != ">")
        {
            string k = s.Consume().Substring(1);
            if (k == "enabled") m.enabled = s.ConsumeBool();
            else if (k == "mode")
            {
                if (Enum.TryParse(s.ConsumeStringInParens(), true, out ParticleSystemCustomDataMode mode)) m.mode = mode;
            }
            else if (k == "vectorComponentCount") m.vectorComponentCount = (uint)s.ConsumeFloat();
            else if (k == "vec1" || k == "x") m.vec1 = ParseUniversalMinMaxCurve(s);
            else if (k == "vec2" || k == "y") m.vec2 = ParseUniversalMinMaxCurve(s);
            else if (k == "vec3" || k == "z") m.vec3 = ParseUniversalMinMaxCurve(s);
            else if (k == "vec4" || k == "w") m.vec4 = ParseUniversalMinMaxCurve(s);
            else if (k == "color") m.color = ParseGradient(s);
            else SkipUnknownValue(s);
        }
        return m;
    }
}