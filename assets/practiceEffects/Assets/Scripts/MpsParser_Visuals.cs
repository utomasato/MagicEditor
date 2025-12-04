using UnityEngine;
using System.Collections.Generic;
using System;

// ----------------------------------------------------------------------------------
// 見た目の変化関係
// 
// 含まれるモジュール:
// - Color over Lifetime
// - Color by Speed
// - Size over Lifetime
// - Size by Speed
// - Rotation over Lifetime
// - Rotation by Speed
// ----------------------------------------------------------------------------------
public static partial class MpsParser
{
    private static ColorOverLifetimeModuleData ParseColorOverLifetimeModule(Scanner s)
    {
        var c = new ColorOverLifetimeModuleData { enabled = true };
        while (s.Peek() != ">")
        {
            string k = s.Consume().Substring(1);
            if (k == "enabled") c.enabled = s.ConsumeBool();
            // "gradient" に加えて "color" も受け付けるように変更
            else if (k == "gradient" || k == "color") c.color = ParseGradient(s);
            else SkipUnknownValue(s);
        }
        return c;
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
}