using UnityEngine;

// MaterialEntryクラスはこのファイルでは不要になりますが、
// 司令塔となる別のクラスで必要になるため、ここではコメントアウトまたは削除します。
// [System.Serializable]
// public class MaterialEntry { ... }

/// <summary>
/// プレハブからパーティクルを生成し、コントローラーに設定データを渡す役割のみを担います。
/// JSONの読み込みやマテリアルの管理は行いません。
/// </summary>
public class ParticleGenerator : MonoBehaviour
{
    public SystemManager systemManager;
    [Header("エディタから設定")]
    [Tooltip("生成するパーティクルのPrefab")]
    public GameObject particlePrefab;

    /// <summary>
    /// 指定された設定データとマテリアルを使って、特定の位置にパーティクルを生成します。
    /// </summary>
    /// <param name="position">生成するワールド座標</param>
    /// <param name="preset">使用するプリセットのデータ構造体</param>
    /// <returns>生成されたパーティクルオブジェクト</returns>
    // --- ▼▼▼ ここから修正 ▼▼▼ ---
    public GameObject SpawnParticle(Vector3 position, ParticlePreset preset)
    // --- ▲▲▲ ここまで修正 ▲▲▲ ---
    {
        // --- 事前チェック ---
        if (particlePrefab == null)
        {
            Debug.LogError("Particle Prefabが設定されていません！", this);
            return null;
        }

        if (preset == null)
        {
            Debug.LogError("無効なプリセットデータが渡されました。", this);
            return null;
        }

        // --- パーティクルの生成と設定 ---

        // 1. Prefabからインスタンスを作成
        GameObject particleInstance = Instantiate(particlePrefab, position, Quaternion.identity);
        systemManager.GeneratedObjects.Add(particleInstance);

        // 2. インスタンスからParticleControllerを取得
        ParticleController controller = particleInstance.GetComponent<ParticleController>();

        if (controller != null)
        {
            // 3. プリセットオブジェクトとマテリアルを渡してパーティクルをカスタマイズ
            controller.CustomizeAndPlay(preset);
        }
        else
        {
            Debug.LogWarning("パーティクルのPrefabにParticleControllerスクリプトがアタッチされていません。", particleInstance);
        }

        // --- ▼▼▼ ここから追加 ▼▼▼ ---
        // 4. 生成したインスタンスを返す
        return particleInstance;
        // --- ▲▲▲ ここまで追加 ▲▲▲ ---
    }
}
