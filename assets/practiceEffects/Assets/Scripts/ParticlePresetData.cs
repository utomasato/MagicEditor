using UnityEngine;
using UnityEngine.Rendering;
using System.Collections.Generic;

// JSONファイル全体を表現するクラス
[System.Serializable]
public class ParticlePresetCollection
{
    public List<ParticlePreset> presets;
}


// -------------------------------------------------------------------
// 汎用的なデータ構造 (Unityの構造体を再現)
// -------------------------------------------------------------------

/// <summary>
/// AnimationCurveのキーフレームを表現するためのクラス。
/// </summary>
[System.Serializable]
public class KeyframeData
{
    public float time;
    public float value;
}

/// <summary>
/// AnimationCurve全体を表現するためのクラス。
/// </summary>
[System.Serializable]
public class CurveData
{
    public List<KeyframeData> keys = new List<KeyframeData>();
}


/// <summary>
/// 定数、MinMax(2定数)、カーブ、MinMaxカーブ(2カーブ)を表現するためのクラス。
/// </summary>
[System.Serializable]
public class MinMaxCurveData
{
    // 定数・MinMax用
    public float min;
    public float max;

    // カーブ用 (Single Curveモード、またはDouble CurveモードのMax側)
    public CurveData curve;

    // Double CurveモードのMin側
    public CurveData minCurve;
}


/// <summary>
/// Gradientのカラーキーを表現するクラス。
/// </summary>
[System.Serializable]
public class ColorKeyData
{
    public Color color;
    public float time;
}

/// <summary>
/// Gradientのアルファキーを表現するクラス。
/// </summary>
[System.Serializable]
public class AlphaKeyData
{
    public float alpha;
    public float time;
}

/// <summary>
/// Gradient全体を表現するクラス。
/// </summary>
[System.Serializable]
public class GradientData
{
    public List<ColorKeyData> colorKeys = new List<ColorKeyData>();
    public List<AlphaKeyData> alphaKeys = new List<AlphaKeyData>();
}

/// <summary>
/// 高度なStartColor指定（2色、2グラディエント、ランダム等）を表現するクラス。
/// </summary>
[System.Serializable]
public class MinMaxGradientData
{
    // モード: "Color", "TwoColors", "Gradient", "TwoGradients", "RandomColor"
    public string mode = "Color";

    public Color colorMin = Color.white;
    public Color colorMax = Color.white;

    public GradientData gradientMin;
    public GradientData gradientMax;
}


/// <summary>
/// EmissionモジュールのBurst設定を格納するクラス。
/// </summary>
[System.Serializable]
public class BurstData
{
    public float time = 0f;
    public MinMaxCurveData count = new MinMaxCurveData { min = 30, max = 30 };
    public int cycleCount = 1;
    public float repeatInterval = 1f;
    public float probability = 1f;
}

/// <summary>
/// UnityのParticleSystemShapeEmitFromを再現するカスタムenum。
/// </summary>
[System.Serializable]
public enum ShapeEmitFrom
{
    Base = 0,
    BaseShell = 1,
    Volume = 2,
    VolumeShell = 3,
    Edge = 4
}

/// <summary>
/// UnityのParticleSystemCollisionModeを再現するカスタムenum。
/// </summary>
[System.Serializable]
public enum CollisionMode
{
    Mode2D = 0,
    Mode3D = 1,
}


// -------------------------------------------------------------------
// 各モジュールの設定を定義するクラス群
// -------------------------------------------------------------------
#region Module Data Classes

[System.Serializable]
public class MainModuleData
{
    public bool enabled = true;
    public float duration = 5.0f;
    public bool looping = true;
    public bool prewarm = false;
    public MinMaxCurveData startDelay = new MinMaxCurveData();
    public MinMaxCurveData startLifetime = new MinMaxCurveData { min = 5f, max = 5f };
    public MinMaxCurveData startSpeed = new MinMaxCurveData { min = 5f, max = 5f };
    public bool startSize3D = false;
    public MinMaxCurveData startSize = new MinMaxCurveData { min = 1f, max = 1f };
    public MinMaxCurveData startSizeX = new MinMaxCurveData { min = 1f, max = 1f };
    public MinMaxCurveData startSizeY = new MinMaxCurveData { min = 1f, max = 1f };
    public MinMaxCurveData startSizeZ = new MinMaxCurveData { min = 1f, max = 1f };
    public bool startRotation3D = false;
    public MinMaxCurveData startRotation = new MinMaxCurveData(); // Z
    public MinMaxCurveData startRotationX = new MinMaxCurveData();
    public MinMaxCurveData startRotationY = new MinMaxCurveData();
    public float flipRotation = 0f;
    public MinMaxGradientData startColor = new MinMaxGradientData();
    public bool randomColor = false;
    public MinMaxCurveData gravityModifier = new MinMaxCurveData();
    public ParticleSystemSimulationSpace simulationSpace = ParticleSystemSimulationSpace.Local;
    public Transform customSimulationSpace = null; // ※参照はパース困難なため基本的にはnull
    public float simulationSpeed = 1.0f;
    public bool useUnscaledTime = false;
    public ParticleSystemScalingMode scalingMode = ParticleSystemScalingMode.Hierarchy;
    public bool playOnAwake = true;
    public ParticleSystemEmitterVelocityMode emitterVelocityMode = ParticleSystemEmitterVelocityMode.Transform;
    public int maxParticles = 1000;
    public bool autoRandomSeed = true;
    public uint randomSeed = 0;
    public ParticleSystemStopAction stopAction = ParticleSystemStopAction.None;
    public ParticleSystemCullingMode cullingMode = ParticleSystemCullingMode.Automatic;
    public ParticleSystemRingBufferMode ringBufferMode = ParticleSystemRingBufferMode.Disabled;
}

[System.Serializable]
public class EmissionModuleData
{
    public bool enabled;
    public MinMaxCurveData rateOverTime = new MinMaxCurveData { min = 10f, max = 10f };
    public MinMaxCurveData rateOverDistance = new MinMaxCurveData();
    public List<BurstData> bursts = new List<BurstData>();
    public int minBurstCount = 0;
    public int maxBurstCount = 0;
}

[System.Serializable]
public class ShapeModuleData
{
    public bool enabled;
    public ParticleSystemShapeType shapeType = ParticleSystemShapeType.Cone;
    public bool alignToDirection;
    public float randomizeDirection;
    public float randomizePosition;
    public float spherizeDirection;

    // --- 形状別パラメータ ---
    // Sphere / HemiSphere / Circle
    public float radius = 1f;
    public float radiusThickness = 1f; // 0=Surface, 1=Volume
    public bool fromShell = false;
    public bool fromVolume = true;

    // Cone
    public float angle = 25f;
    public float length = 5f;
    public ShapeEmitFrom emitFrom = ShapeEmitFrom.Base;

    // Box
    public Vector3 boxThickness = Vector3.one;

    // Mesh / SkinnedMeshRenderer / MeshRenderer
    public Mesh mesh;
    public MeshRenderer meshRenderer;
    public SkinnedMeshRenderer skinnedMeshRenderer;
    public ParticleSystemMeshShapeType meshShapeType = ParticleSystemMeshShapeType.Vertex;
    public bool useMeshColors = true;
    public float normalOffset = 0f;
    public float meshScale = 1f;

    // Sprite
    public Sprite sprite;

    // Texture
    public Texture2D texture;
    public ParticleSystemShapeTextureChannel textureChannel = ParticleSystemShapeTextureChannel.Red;
    public int textureUVChannel = 0;
    public float textureColorAffectsParticles = 1f;
    public float textureAlphaAffectsParticles = 1f;
    public float textureBilinearFiltering = 1f;
}

[System.Serializable]
public class VelocityOverLifetimeModuleData
{
    public bool enabled;
    public MinMaxCurveData x = new MinMaxCurveData();
    public MinMaxCurveData y = new MinMaxCurveData();
    public MinMaxCurveData z = new MinMaxCurveData();
    public MinMaxCurveData orbitalX = new MinMaxCurveData();
    public MinMaxCurveData orbitalY = new MinMaxCurveData();
    public MinMaxCurveData orbitalZ = new MinMaxCurveData();
    public Vector3 orbitalOffset = Vector3.zero;
    public MinMaxCurveData radial = new MinMaxCurveData();
    public MinMaxCurveData speedModifier = new MinMaxCurveData { min = 1f, max = 1f };
    public ParticleSystemSimulationSpace space = ParticleSystemSimulationSpace.Local;
}

[System.Serializable]
public class LimitVelocityOverLifetimeModuleData
{
    public bool enabled;
    public bool separateAxes = false;
    public MinMaxCurveData limitX = new MinMaxCurveData();
    public MinMaxCurveData limitY = new MinMaxCurveData();
    public MinMaxCurveData limitZ = new MinMaxCurveData();
    public MinMaxCurveData limit = new MinMaxCurveData();
    public float dampen = 0f;
    public ParticleSystemSimulationSpace space = ParticleSystemSimulationSpace.Local;
}

[System.Serializable]
public class InheritVelocityModuleData
{
    public bool enabled;
    public ParticleSystemInheritVelocityMode mode = ParticleSystemInheritVelocityMode.Initial;
    public MinMaxCurveData curve = new MinMaxCurveData { min = 1f, max = 1f };
}

[System.Serializable]
public class ForceOverLifetimeModuleData
{
    public bool enabled;
    public MinMaxCurveData x = new MinMaxCurveData();
    public MinMaxCurveData y = new MinMaxCurveData();
    public MinMaxCurveData z = new MinMaxCurveData();
    public ParticleSystemSimulationSpace space = ParticleSystemSimulationSpace.Local;
    public bool randomized = false;
}

[System.Serializable]
public class ColorOverLifetimeModuleData
{
    public bool enabled;
    public GradientData color = new GradientData();
}

[System.Serializable]
public class ColorBySpeedModuleData
{
    public bool enabled;
    public GradientData color = new GradientData();
    public Vector2 range = new Vector2(0, 1);
}

[System.Serializable]
public class SizeOverLifetimeModuleData
{
    public bool enabled;
    public bool separateAxes = false;
    public MinMaxCurveData size = new MinMaxCurveData { min = 1f, max = 1f };
    public MinMaxCurveData x = new MinMaxCurveData { min = 1f, max = 1f };
    public MinMaxCurveData y = new MinMaxCurveData { min = 1f, max = 1f };
    public MinMaxCurveData z = new MinMaxCurveData { min = 1f, max = 1f };
}

[System.Serializable]
public class SizeBySpeedModuleData
{
    public bool enabled;
    public bool separateAxes = false;
    public MinMaxCurveData size = new MinMaxCurveData();
    public MinMaxCurveData x = new MinMaxCurveData();
    public MinMaxCurveData y = new MinMaxCurveData();
    public MinMaxCurveData z = new MinMaxCurveData();
    public Vector2 range = new Vector2(0, 1);
}

[System.Serializable]
public class RotationOverLifetimeModuleData
{
    public bool enabled;
    public bool separateAxes = false;
    public MinMaxCurveData x = new MinMaxCurveData();
    public MinMaxCurveData y = new MinMaxCurveData();
    public MinMaxCurveData z = new MinMaxCurveData();
}

[System.Serializable]
public class RotationBySpeedModuleData
{
    public bool enabled;
    public bool separateAxes = false;
    public MinMaxCurveData x = new MinMaxCurveData();
    public MinMaxCurveData y = new MinMaxCurveData();
    public MinMaxCurveData z = new MinMaxCurveData();
    public Vector2 range = new Vector2(0, 1);
}

[System.Serializable]
public class ExternalForcesModuleData
{
    public bool enabled;
    public MinMaxCurveData multiplier = new MinMaxCurveData { min = 1f, max = 1f };
    public LayerMask influenceMask;
}

[System.Serializable]
public class NoiseModuleData
{
    public bool enabled;
    public bool separateAxes = false;
    public MinMaxCurveData strength = new MinMaxCurveData { min = 1f, max = 1f };
    public MinMaxCurveData strengthX = new MinMaxCurveData { min = 1f, max = 1f };
    public MinMaxCurveData strengthY = new MinMaxCurveData { min = 1f, max = 1f };
    public MinMaxCurveData strengthZ = new MinMaxCurveData { min = 1f, max = 1f };
    public float frequency = 0.5f;
    public bool damping = true;
    public int octaveCount = 1;
    public float octaveMultiplier = 0.5f;
    public float octaveScale = 2f;
    public ParticleSystemNoiseQuality quality = ParticleSystemNoiseQuality.High;
    public MinMaxCurveData scrollSpeed = new MinMaxCurveData();
    public bool remapEnabled = false;
    public MinMaxCurveData remapX = new MinMaxCurveData();
    public MinMaxCurveData remapY = new MinMaxCurveData();
    public MinMaxCurveData remapZ = new MinMaxCurveData();
}

[System.Serializable]
public class CollisionModuleData
{
    public bool enabled;
    public ParticleSystemCollisionType type = ParticleSystemCollisionType.Planes;
    public CollisionMode mode = CollisionMode.Mode3D;
    public List<Transform> planes = new List<Transform>();
    public MinMaxCurveData dampen = new MinMaxCurveData { min = 1f, max = 1f };
    public MinMaxCurveData bounce = new MinMaxCurveData { min = 1f, max = 1f };
    public MinMaxCurveData lifetimeLoss = new MinMaxCurveData();
    public float minKillSpeed = 0f;
    public float maxKillSpeed = float.MaxValue;
    public LayerMask collidesWith;
    public bool enableDynamicColliders = false;
    public int maxCollisionShapes = 256;
    public float radiusScale = 1f;
    public bool sendCollisionMessages = false;
    public float colliderForce = 0f;
    public bool multiplyColliderForceByCollisionAngle = true;
    public bool multiplyColliderForceByParticleSpeed = true;
    public bool multiplyColliderForceByParticleSize = true;
}

[System.Serializable]
public class TriggersModuleData
{
    public bool enabled;
    public List<ParticleSystem.ColliderData> colliders = new List<ParticleSystem.ColliderData>();
    public ParticleSystemOverlapAction inside = ParticleSystemOverlapAction.Kill;
    public ParticleSystemOverlapAction outside = ParticleSystemOverlapAction.Ignore;
    public ParticleSystemOverlapAction enter = ParticleSystemOverlapAction.Ignore;
    public ParticleSystemOverlapAction exit = ParticleSystemOverlapAction.Ignore;
    public float radiusScale = 1f;
}

[System.Serializable]
public class SubEmittersModuleData
{
    public bool enabled;
    public List<ParticleSystem> birth = new List<ParticleSystem>();
    public List<ParticleSystem> collision = new List<ParticleSystem>();
    public List<ParticleSystem> death = new List<ParticleSystem>();
}

[System.Serializable]
public class TextureSheetAnimationModuleData
{
    public bool enabled;
    public ParticleSystemAnimationMode mode = ParticleSystemAnimationMode.Grid;
    public int numTilesX = 1;
    public int numTilesY = 1;
    public ParticleSystemAnimationType animation = ParticleSystemAnimationType.WholeSheet;
    public bool useRandomRow = false;
    public MinMaxCurveData frameOverTime = new MinMaxCurveData();
    public MinMaxCurveData startFrame = new MinMaxCurveData();
    public int cycleCount = 1;
    public int rowIndex = 0;
    public UVChannelFlags affectedUVChannels = UVChannelFlags.UV0;
    public bool flipU = false;
    public bool flipV = false;
    public List<Sprite> sprites = new List<Sprite>();
}

[System.Serializable]
public class LightsModuleData
{
    public bool enabled;
    public Light lightPrefab;
    public float ratio = 1f;
    public bool useRandomDistribution = true;
    public bool useParticleColor = true;
    public bool sizeAffectsRange = false;
    public bool alphaAffectsIntensity = true;
    public MinMaxCurveData range = new MinMaxCurveData { min = 1f, max = 1f };
    public MinMaxCurveData intensity = new MinMaxCurveData { min = 1f, max = 1f };
    public int maxLights = 20;
}

[System.Serializable]
public class TrailsModuleData
{
    public bool enabled;
    public ParticleSystemTrailMode mode = ParticleSystemTrailMode.PerParticle;
    public float ratio = 1f;
    public MinMaxCurveData lifetime = new MinMaxCurveData { min = 1f, max = 1f };
    public float minVertexDistance = 0.1f;
    public bool worldSpace = false;
    public bool dieWithParticles = true;

    // Ribbon options
    public int ribbonCount = 1;
    public bool splitSubEmitterRibbons = false;

    public ParticleSystemTrailTextureMode textureMode = ParticleSystemTrailTextureMode.Stretch;

    public bool sizeAffectsWidth = true;
    public bool sizeAffectsLifetime = false;

    public bool inheritParticleColor = true;
    public GradientData colorOverLifetime = new GradientData();

    public MinMaxCurveData widthOverTrail = new MinMaxCurveData { min = 1f, max = 1f };
    public GradientData colorOverTrail = new GradientData();

    public bool generateLightingData = false;
}

[System.Serializable]
public class CustomDataModuleData
{
    public bool enabled;
    public ParticleSystemCustomDataMode mode = ParticleSystemCustomDataMode.Vector;
    public uint vectorComponentCount = 0; // 0 to 4
    public MinMaxCurveData vec1 = new MinMaxCurveData();
    public MinMaxCurveData vec2 = new MinMaxCurveData();
    public MinMaxCurveData vec3 = new MinMaxCurveData();
    public MinMaxCurveData vec4 = new MinMaxCurveData();
    public GradientData color = new GradientData();
}

[System.Serializable]
public class RendererModuleData
{
    public bool enabled = true;
    public ParticleSystemRenderMode renderMode = ParticleSystemRenderMode.Billboard;
    public Material material;
    public Material trailMaterial;
    public ParticleSystemSortMode sortMode = ParticleSystemSortMode.None;
    public float sortingFudge = 0f;
    public float minParticleSize = 0f;
    public float maxParticleSize = 0.5f;
    public ParticleSystemRenderSpace alignment = ParticleSystemRenderSpace.View;
    public Vector3 pivot = Vector3.zero;
    public Vector2 flip = Vector2.zero;

    // --- RenderMode別パラメータ ---
    // Billboard
    public float normalDirection = 1f;

    // Stretched Billboard
    public float cameraScale = 1f;
    public float speedScale = 0f;
    public float lengthScale = 2f;

    // Mesh
    public List<Mesh> meshes = new List<Mesh>();
    public ParticleSystemMeshDistribution meshDistribution = ParticleSystemMeshDistribution.UniformRandom;
    public bool useCustomVertexStreams = false;
    public int vertexStreamCount = 0;

    public string blendMode;
}

#endregion

// -------------------------------------------------------------------
// 個々のパーティクルプリセットを定義するクラス
// -------------------------------------------------------------------
[System.Serializable]
public class ParticlePreset
{
    public string name;

    // 各モジュールの設定を保持
    public MainModuleData main;
    public EmissionModuleData emission;
    public ShapeModuleData shape;
    public VelocityOverLifetimeModuleData velocityOverLifetime;
    public LimitVelocityOverLifetimeModuleData limitVelocityOverLifetime;
    public InheritVelocityModuleData inheritVelocity;
    public ForceOverLifetimeModuleData forceOverLifetime;
    public ColorOverLifetimeModuleData colorOverLifetime;
    public ColorBySpeedModuleData colorBySpeed;
    public SizeOverLifetimeModuleData sizeOverLifetime;
    public SizeBySpeedModuleData sizeBySpeed;
    public RotationOverLifetimeModuleData rotationOverLifetime;
    public RotationBySpeedModuleData rotationBySpeed;
    public ExternalForcesModuleData externalForces;
    public NoiseModuleData noise;
    public CollisionModuleData collision;
    public TriggersModuleData triggers;
    public SubEmittersModuleData subEmitters;
    public TextureSheetAnimationModuleData textureSheetAnimation;
    public LightsModuleData lights;
    public TrailsModuleData trails;
    public CustomDataModuleData customData;
    public RendererModuleData renderer;
}