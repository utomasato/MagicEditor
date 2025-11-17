using UnityEngine;
using TMPro;
using System;
using UnityEngine.SceneManagement; // ReloadSceneのために追加

[System.Serializable]
public class GeneralData
{
    public bool isActive;
    public string message;
    public string id; // Changed from 'name'
    public float value;
    public string text;
}

public class JsCallbackHandler : MonoBehaviour
{
    [Header("参照するコンポーネント")]
    [Tooltip("UI Text for debugging")]
    [SerializeField] private TextMeshProUGUI UIText;

    [Tooltip("シーン内のSystemManager")]
    [SerializeField] private SystemManager systemManager;

    private void Awake()
    {
        // もしインスペクターから設定されていなければ、シーン内から自動で探す
        if (systemManager == null)
        {
            systemManager = FindObjectOfType<SystemManager>();
            if (systemManager == null)
            {
                Debug.LogError("シーン内にSystemManagerが見つかりません。", this);
            }
        }
    }

    void Start()
    {
        //TestReceiveGeneralData();
    }

    //*
    void Update()
    {
        // "R"キーを押すとシーンがリロードされる例
        if (Input.GetKeyDown(KeyCode.R))
        {
            systemManager.Reset();
        }
        if (Input.GetKeyDown(KeyCode.P))
        {
            TestReceiveGeneralData();
        }
        if (Input.GetKeyDown(KeyCode.T))
        {
            TestTransform();
        }
        if (Input.GetKeyDown(KeyCode.A))
        {
            TestAnimation();
        }
        if (Input.GetKeyDown(KeyCode.O))
        {
            TestObject();
        }
        if (Input.GetKeyDown(KeyCode.C))
        {
            TestAttack();
        }
    }
    //*/


    // Note: Test methods will use name-based logic, update them if needed for ID-based testing.
    void TestReceiveGeneralData()
    {
        //string spellText = "< ~main < ~startLifetime[0.5 2] ~startSpeed 0.5 ~startSize[0.2 0.4] ~startRotation[0 360] > ~emission < ~rateOverTime 50 > ~shape < ~angle 5 ~radius 0.0001 > ~colorOverLifetime < ~gradient < ~colorKeys[[1.0 0.6 0.0 1.0 0.0][1.0 0.0 0.0 1.0 0.6][1.0 0.0 0.0 1.0 1.0]] ~alphaKeys[[0.0 0.0][1.0 0.5][0.0 1.0]] >> ~rotationOverLifetime < ~z[-45 45] > ~renderer < ~materialName(Fire_1) >>";

        string spellText = "<~shape (empty)>";
        string testId = "test-id-from-csharp-0";
        systemManager.CreateObjectFromMps(spellText, testId);

        spellText = "<~main <~duration 1 ~startLifetime 2 ~startSpeed 10 ~startSize [30 30 75] ~startColor [1 0.5 0 1] > ~emission <~rateOverTime 0 ~burstCount 2> ~colorOverLifetime <~gradient<~alphaKeys [[0 0] [1 0.05] [1 0.95] [0 1]]>> ~renderer <~renderMode (Mesh) ~meshDistribution (NonUniformRandom) ~meshes (Bullet) ~materialName (Cross) ~alignment (Local)>>";
        testId = "test-id-from-csharp-1";
        systemManager.CreateAndSpawnParticleFromMps(spellText, testId);
        string parentId = "test-id-from-csharp-0";
        string childId = "test-id-from-csharp-1";
        systemManager.AttachToParent(childId, parentId);

        spellText = "<~main <~duration 1 ~startLifetime 2 ~startSpeed 10 ~startSize [30 30 75] ~startColor [1 0.5 0 1] > ~emission <~rateOverTime 0 ~burstCount 2> ~colorOverLifetime <~gradient<~alphaKeys [[0 0] [1 0.05] [1 0.95] [0 1]]>> ~rotationOverLifetime <~z 500> ~renderer <~renderMode (Mesh) ~meshDistribution (NonUniformRandom) ~meshes (Bullet) ~materialName (Grow_2) ~alignment (Local) >> ";
        testId = "test-id-from-csharp-2";
        systemManager.CreateAndSpawnParticleFromMps(spellText, testId);
        childId = "test-id-from-csharp-2";
        systemManager.AttachToParent(childId, parentId);

        spellText = "<~main <~duration 1 ~startLifetime 2 ~startSpeed 10 ~startSize [15 15 200] ~startColor [1 0.5 0 1] > ~emission <~rateOverTime 0 ~burstCount 2> ~colorOverLifetime <~gradient <~alphaKeys [[0 0] [1 0.05] [1 0.95] [0 1]]>> ~rotationOverLifetime <~z -800> ~renderer <~renderMode (Mesh) ~meshDistribution (NonUniformRandom) ~meshes (Cylinder) ~materialName (Spiral) ~alignment (Local)>>";
        testId = "test-id-from-csharp-3";
        systemManager.CreateAndSpawnParticleFromMps(spellText, testId);
        childId = "test-id-from-csharp-3";
        systemManager.AttachToParent(childId, parentId);
        // col.enabled = scanner.ConsumeBool(); break;

        spellText = "< ~main < ~duration 1 ~startLifetime 2 ~startSpeed 10 ~startSize 0.1 ~startColor [1 0.5 0 1] > ~emission < ~rateOverTime 0 ~burstCount 2> ~colorOverLifetime < ~gradient < ~alphaKeys [[0 0] [1 0.05] [1 0.95] [0 1]]>> ~trail < ~lifetime 0.2 > ~renderer < ~materialName (Grow_1) ~trailMaterialName (Trail) >>";
        testId = "test-id-from-csharp-4";
        systemManager.CreateAndSpawnParticleFromMps(spellText, testId);
        childId = "test-id-from-csharp-4";
        systemManager.AttachToParent(childId, parentId);

        spellText = "<~scale 2>";
        systemManager.TransformObjectById(parentId, spellText);
    }

    void TestTransform()
    {
        string transformText = "< ~position [0 0 0] ~rotation [-90 0 0] ~scale [2 2 2] >";
        string testId = "test-id-from-csharp-1";
        systemManager.TransformObjectById(testId, transformText);
    }

    void TestAnimation()
    {
        string animationText = "<~position <~from [0 0 0] ~to [5 5 5] ~duration 3000 ~loop true ~reverse true ~easeIn true ~easeOut true> ~rotate < ~from[0 0 0] ~to[0 360 0] ~duration 4000 ~loop true > ~scale < ~from[1 1 1] ~to[3 3 3] ~duration 5000 ~loop true ~easeIn true >> ";
        string testId = "test-id-from-csharp-1";
        systemManager.AnimationObjectById(testId, animationText);
    }

    void TestObject()
    {
        string objectText = "<~shape (cube)>";
        string testId = "test-id-from-csharp-100";
        systemManager.CreateObjectFromMps(objectText, testId);
        testId = "test-id-from-csharp-200";
        systemManager.CreateObjectFromMps(objectText, testId);
    }

    void TestAttack()
    {
        string parentId = "test-id-from-csharp-100";
        string childId = "test-id-from-csharp-200";
        systemManager.AttachToParent(childId, parentId);
    }



    public void ReceiveGeneralData(string jsonString)
    {
        // ▼▼▼ 修正 ▼▼▼
        // メソッド全体をtry...catchで囲み、JSONのパースエラーや
        // SystemManagerで捕捉されなかった予期せぬエラーをキャッチする
        try
        {
            GeneralData data = JsonUtility.FromJson<GeneralData>(jsonString);

            Debug.Log("====== JavaScriptからのデータ受信 ======");
            Debug.Log("message: " + data.message);
            Debug.Log("id: " + data.id); // Changed from 'name'
            Debug.Log("text: " + data.text);
            Debug.Log("=====================================");

            if (systemManager == null)
            {
                Debug.LogError("SystemManagerへの参照が設定されていません。", this);
                return;
            }

            switch (data.message)
            {
                case "Reset":
                    systemManager.Reset();
                    break;
                case "MagicSpell":
                    systemManager.CreateAndSpawnParticleFromMps(data.text, data.id); // Pass ID
                    break;
                case "TransformObject":
                    systemManager.TransformObjectById(data.id, data.text); // Use new method and pass ID
                    break;
                case "Animation":
                    systemManager.AnimationObjectById(data.id, data.text);
                    break;
                case "CreateObject":
                    systemManager.CreateObjectFromMps(data.text, data.id);
                    break;
                case "AttachToParent":
                    // AttachToParentのdata.textはparentIdを想定
                    systemManager.AttachToParent(data.id, data.text);
                    break;
            }
        }
        catch (System.Exception e)
        {
            // ここでキャッチされるのは、JsonUtilityの失敗か、
            // SystemManagerが（try...catchしているにも関わらず）
            // 握りつぶさずにスローした重大な例外
            Debug.LogError($"[JsCallbackHandler] 致命的なエラーが発生しました: {e.Message}\n{e.StackTrace}");

            // ユーザーの提案に基づき、致命的なエラーが発生した場合は
            // シーンをリロードして復旧を試みる
            if (systemManager != null)
            {
                Debug.LogWarning("致命的なエラーを検出。復旧のためシーンをリロードします。");
                systemManager.ReloadScene();
            }
            else
            {
                // SystemManagerが見つからない場合でもリロードを実行
                Debug.LogWarning("SystemManagerがnullですが、復旧のためシーンをリロードします。");
                SceneManager.LoadScene(SceneManager.GetActiveScene().name);
            }
        }
        // ▲▲▲ 修正 ▲▲▲
    }
}