using UnityEngine;
using System.Collections.Generic;
using System;

// ----------------------------------------------------------------------------------
// EmissionModuleとそれに関連するStartColorのパース処理を分離したファイル
// ----------------------------------------------------------------------------------
public static partial class MpsParser
{
    private static EmissionModuleData ParseEmissionModule(Scanner scanner)
    {
        var emission = new EmissionModuleData { enabled = true };
        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1);
            switch (key)
            {
                case "enabled": emission.enabled = scanner.ConsumeBool(); break;
                case "rateOverTime": emission.rateOverTime = ParseUniversalMinMaxCurve(scanner); break;

                // 従来の簡易指定 (後方互換性のため維持)
                case "burstCount":
                    var curve = ParseUniversalMinMaxCurve(scanner);
                    emission.minBurstCount = (int)curve.min;
                    emission.maxBurstCount = (int)curve.max;
                    break;

                // 新しい複数バースト指定: ~bursts [ <... > <... > ]
                case "bursts":
                    emission.bursts = ParseBurstList(scanner);
                    break;

                default:
                    SkipUnknownValue(scanner);
                    break;
            }
        }
        return emission;
    }

    private static List<BurstData> ParseBurstList(Scanner scanner)
    {
        var list = new List<BurstData>();

        // リスト開始 '[' を期待
        if (scanner.Peek() != "[")
        {
            Debug.LogWarning("Parse Warning: Expected '[' for bursts list.");
            return list;
        }
        scanner.Consume();

        // ']' が来るまでバースト定義 '< ... >' を読み込む
        while (scanner.Peek() != "]" && scanner.Peek() != null)
        {
            if (scanner.Peek() == "<")
            {
                list.Add(ParseBurstData(scanner));
            }
            else
            {
                // 何か不正なトークンがあればスキップして次へ
                Debug.LogWarning($"Parse Warning: Unexpected token '{scanner.Peek()}' in bursts list. Expected '<'.");
                scanner.Consume();
            }
        }
        scanner.Expect("]");
        return list;
    }

    private static BurstData ParseBurstData(Scanner scanner)
    {
        var burst = new BurstData();
        scanner.Expect("<");

        while (scanner.Peek() != ">")
        {
            string key = scanner.Consume().Substring(1); // remove '~'
            switch (key)
            {
                case "time":
                    burst.time = scanner.ConsumeFloat();
                    break;
                case "count":
                    // CountはMinMaxCurveとして読み込む (定数 or ランダム範囲)
                    burst.count = ParseUniversalMinMaxCurve(scanner);
                    break;
                case "cycles":
                    burst.cycleCount = (int)scanner.ConsumeFloat();
                    break;
                case "interval":
                    burst.repeatInterval = scanner.ConsumeFloat();
                    break;
                case "probability":
                    burst.probability = scanner.ConsumeFloat();
                    break;
                default:
                    SkipUnknownValue(scanner);
                    break;
            }
        }
        scanner.Expect(">");
        return burst;
    }
}