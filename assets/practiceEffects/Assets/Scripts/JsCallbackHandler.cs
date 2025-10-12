using UnityEngine;
using TMPro;
using System;

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

    }


    // Note: Test methods will use name-based logic, update them if needed for ID-based testing.
    void TestReceiveGeneralData()
    {
        string spellText = " <~main <~startLifetime [0.5 2] ~startSpeed 0.5 ~startSize [0.2 0.4] ~startRotation [0 360]> ~emission <~rateOverTime 50> ~shape <~angle 5 ~radius 0.0001> ~colorOverLifetime <~gradient <~colorKeys [[1.0 0.6 0.0 1.0 0.0] [1.0 0.0 0.0 1.0 0.6] [1.0 0.0 0.0 1.0 1.0]] ~alphaKeys [[0.0 0.0] [1.0 0.5] [0.0 1.0]]>> ~rotationOverLifetime <~z [-45 45]> ~renderer <~materialName (Fire_1)>>";
        // ID is now generated in JS, so we pass an empty string or a test ID here.
        string testId = "test-id-from-csharp-1";
        systemManager.CreateAndSpawnParticleFromMps(spellText, testId);
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



    public void ReceiveGeneralData(string jsonString)
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
        }
    }
}
