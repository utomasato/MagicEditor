using UnityEngine;
using System.Collections.Generic;

// インスペクターに表示するための、名前とマテリアルのペアを保持するクラス
[System.Serializable]
public class MaterialEntry
{
    public string name;
    public Material material;
}

/// <summary>
/// ゲーム全体の設定を管理し、各機能（ParticleGeneratorなど）に指示を出す司令塔クラス。
/// </summary>
public class SystemManager : MonoBehaviour
{
    public List<GameObject> GeneratedObjects;

    [Header("参照するコンポーネント")]
    [Tooltip("パーティクルの生成を担当するGenerator")]
    public ParticleGenerator particleGenerator;

    [Header("マテリアルリスト")]
    [Tooltip("名前とマテリアルを紐付けて登録します")]
    public List<MaterialEntry> materialList;

    // --- Private Fields ---
    private Dictionary<string, Material> materialDictionary;
    private Dictionary<string, GameObject> namedGeneratedObjects = new Dictionary<string, GameObject>();

    void Awake()
    {
        materialDictionary = new Dictionary<string, Material>();
        foreach (var entry in materialList)
        {
            if (entry != null && !string.IsNullOrEmpty(entry.name) && entry.material != null)
            {
                if (!materialDictionary.ContainsKey(entry.name))
                {
                    materialDictionary.Add(entry.name, entry.material);
                }
            }
        }
    }

    /// <summary>
    /// p5.jsから受け取ったmpsコードを元にパーティクルを生成し、再生します。
    /// </summary>
    /// <param name="mpsCode">p5.jsで生成された文字列</param>
    /// <param name="objectName">p5.jsで指定されたオブジェクト名</param>
    public void CreateAndSpawnParticleFromMps(string mpsCode, string objectName)
    {
        if (string.IsNullOrEmpty(mpsCode))
        {
            Debug.LogWarning("空のmpsコードを受け取ったため、パーティクルの生成をスキップしました。");
            return;
        }

        try
        {
            ParticlePreset preset = MpsParser.Parse(mpsCode, materialDictionary);

            if (particleGenerator != null)
            {
                GameObject newParticleObject = particleGenerator.SpawnParticle(Vector3.zero, preset);

                if (!string.IsNullOrEmpty(objectName))
                {
                    if (namedGeneratedObjects.ContainsKey(objectName))
                    {
                        namedGeneratedObjects.Remove(objectName);
                    }
                    namedGeneratedObjects.Add(objectName, newParticleObject);
                }
            }
            else
            {
                Debug.LogError("ParticleGeneratorがSystemManagerに設定されていません。", this);
            }
        }
        catch (System.Exception e)
        {
            Debug.LogError($"MPSコードの解析中にエラーが発生しました: {e.Message}\n{e.StackTrace}");
        }
    }

    // --- ▼▼▼ ここから追加 ▼▼▼ ---
    /// <summary>
    /// 指定された名前のGameObjectのTransformを更新します。
    /// </summary>
    /// <param name="objectName">対象のオブジェクト名</param>
    /// <param name="transformCode">位置、回転、スケール情報を含むmps文字列</param>
    public void TransformNamedObject(string objectName, string transformCode)
    {
        if (string.IsNullOrEmpty(objectName) || !namedGeneratedObjects.ContainsKey(objectName))
        {
            Debug.LogWarning($"Transform対象のオブジェクト '{objectName}' が見つかりません。");
            return;
        }

        GameObject objToTransform = namedGeneratedObjects[objectName];
        if (objToTransform == null)
        {
            Debug.LogWarning($"対象のオブジェクト '{objectName}' は既に破棄されています。");
            namedGeneratedObjects.Remove(objectName);
            return;
        }

        try
        {
            TransformData transformData = MpsParser.ParseTransform(transformCode);

            if (transformData.position.HasValue)
            {
                objToTransform.transform.position = transformData.position.Value;
            }
            if (transformData.rotation.HasValue)
            {
                objToTransform.transform.eulerAngles = transformData.rotation.Value;
            }
            if (transformData.scale.HasValue)
            {
                objToTransform.transform.localScale = transformData.scale.Value;
            }
        }
        catch (System.Exception e)
        {
            Debug.LogError($"Transformコードの解析中にエラーが発生しました: {e.Message}\n{e.StackTrace}");
        }
    }
    // --- ▲▲▲ ここまで追加 ▲▲▲ ---

    public void Reset()
    {
        foreach (GameObject obj in GeneratedObjects)
        {
            Destroy(obj);
        }
        GeneratedObjects.Clear();
        namedGeneratedObjects.Clear();
    }
}

