using UnityEngine;
using System.Collections.Generic;
using System;

// ----------------------------------------------------------------------------------
// ShapeModule関連のパース処理
// ----------------------------------------------------------------------------------
public static partial class MpsParser
{
    private static ShapeModuleData ParseShapeModule(Scanner scanner, Dictionary<string, Mesh> meshDict, Dictionary<string, Texture2D> textureDict)
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
                case "donutRadius": shape.donutRadius = scanner.ConsumeFloat(); break;
                case "arc": shape.arc = scanner.ConsumeFloat(); break;
                case "arcMode":
                    string arcModeStr = scanner.ConsumeStringInParens();
                    if (Enum.TryParse(arcModeStr, true, out ParticleSystemShapeMultiModeValue arcMode))
                        shape.arcMode = arcMode;
                    break;
                case "arcSpread": shape.arcSpread = scanner.ConsumeFloat(); break;
                case "arcSpeed": shape.arcSpeed = ParseUniversalMinMaxCurve(scanner); break;
                case "length": shape.length = scanner.ConsumeFloat(); break;
                case "emitFrom":
                    string emitStr = scanner.ConsumeStringInParens();
                    if (Enum.TryParse(emitStr, true, out ShapeEmitFrom ef))
                        shape.emitFrom = ef;
                    break;
                case "boxThickness": shape.boxThickness = ParseVector3(scanner); break;

                // Transform
                case "position": shape.position = ParseVector3(scanner); break;
                case "rotation": shape.rotation = ParseVector3(scanner); break;
                case "scale": shape.scale = ParseVector3(scanner); break;

                // Randomize / Align
                case "alignToDirection": shape.alignToDirection = scanner.ConsumeBool(); break;
                case "randomizeDirection": shape.randomizeDirection = scanner.ConsumeFloat(); break;
                case "spherizeDirection": shape.spherizeDirection = scanner.ConsumeFloat(); break;
                case "randomizePosition": shape.randomizePosition = scanner.ConsumeFloat(); break;

                // Mesh
                case "mesh":
                    string meshName = scanner.ConsumeStringInParens();
                    if (meshDict != null && meshDict.TryGetValue(meshName, out Mesh m))
                        shape.mesh = m;
                    break;
                case "meshShapeType":
                    string mstStr = scanner.ConsumeStringInParens();
                    if (Enum.TryParse(mstStr, true, out ParticleSystemMeshShapeType mst))
                        shape.meshShapeType = mst;
                    break;
                case "meshSpawnMode":
                    string msmStr = scanner.ConsumeStringInParens();
                    if (Enum.TryParse(msmStr, true, out ParticleSystemShapeMultiModeValue msm))
                        shape.meshSpawnMode = msm;
                    break;
                case "meshSpawnSpeed": shape.meshSpawnSpeed = ParseUniversalMinMaxCurve(scanner); break;
                case "meshMaterialIndex": shape.meshMaterialIndex = (int)scanner.ConsumeFloat(); break;
                case "useMeshColors": shape.useMeshColors = scanner.ConsumeBool(); break;
                case "normalOffset": shape.normalOffset = scanner.ConsumeFloat(); break;
                case "meshScale": shape.meshScale = scanner.ConsumeFloat(); break;

                // Texture
                case "textureName":
                    string texName = scanner.ConsumeStringInParens();
                    if (textureDict != null && textureDict.TryGetValue(texName, out Texture2D tex))
                        shape.texture = tex;
                    break;
                case "textureClipChannel":
                    string tccStr = scanner.ConsumeStringInParens();
                    if (Enum.TryParse(tccStr, true, out ParticleSystemShapeTextureChannel tcc))
                        shape.textureChannel = tcc;
                    break;
                case "textureClipThreshold": shape.textureClipThreshold = scanner.ConsumeFloat(); break;
                case "textureColorAffectsParticles": shape.textureColorAffectsParticles = scanner.ConsumeBool(); break;
                case "textureAlphaAffectsParticles": shape.textureAlphaAffectsParticles = scanner.ConsumeBool(); break;
                case "textureBilinearFiltering": shape.textureBilinearFiltering = scanner.ConsumeBool(); break;
                case "textureUVChannel": shape.textureUVChannel = (int)scanner.ConsumeFloat(); break;

                default: SkipUnknownValue(scanner); break;
            }
        }
        return shape;
    }
}