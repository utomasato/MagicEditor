using UnityEngine;
//using UnityEngine.SceneManagement;
using TMPro;

[System.Serializable]
public class GeneralData
{
    public bool isActive;
    public string message;
    public string name;
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

    void Update()
    {
        // "R"キーを押すとシーンがリロードされる例
        if (Input.GetKeyDown(KeyCode.R))
        {
            systemManager.Reset();
        }
        if (Input.GetKeyDown(KeyCode.T))
        {
            TestReceiveGeneralData();
        }
    }

    void TestReceiveGeneralData()
    {
        // --- Test for MagicSpell ---
        string spellText = "< ~main < ~startLifetime[0.5 1.0] ~startSpeed 0.5 ~startSize[0.2 0.4] ~startRotation[0 360] > ~emission < ~rateOverTime 50 > ~shape < ~angle 5 ~radius 0.0001 > ~colorOverLifetime < ~gradient < ~colorKeys[[1.0 0.6 0.0 1.0 0.0][1.0 0.0 0.0 1.0 1.0]] ~alphaKeys[[0.0 0.0][1.0 0.5][0.0 1.0]] > > ~rotationOverLifetime < (z)[-45 45] > ~renderer < ~materialName(Fire_1) > >";
        string spellName = "testEffect1";
        systemManager.CreateAndSpawnParticleFromMps(spellText, spellName);

        // --- Test for TransformObject ---
        // Note: This requires an object named "testEffect1" to exist.
        // It's called after a short delay to simulate a separate command.
        //Invoke("TestTransform", 2.0f);
    }

    void TestTransform()
    {
        string transformText = "< ~position [2 1 0] ~rotation [0 90 0] ~scale [2 2 2] >";
        string transformName = "testEffect1";
        systemManager.TransformNamedObject(transformName, transformText);
    }


    public void ReceiveGeneralData(string jsonString)
    {
        GeneralData data = JsonUtility.FromJson<GeneralData>(jsonString);

        Debug.Log("====== JavaScriptからのデータ受信 ======");
        Debug.Log("message: " + data.message);
        Debug.Log("name: " + data.name);
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
                systemManager.CreateAndSpawnParticleFromMps(data.text, data.name);
                break;
            // --- ▼▼▼ ここから追加 ▼▼▼ ---
            case "TransformObject":
                systemManager.TransformNamedObject(data.name, data.text);
                break;
                // --- ▲▲▲ ここまで追加 ▲▲▲ ---
        }
    }
}

