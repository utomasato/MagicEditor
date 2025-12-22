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

    /*
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
        //testBullet();
        //testCharge();
        //testFire();
        testBarrier();
    }

    void testBarrier()
    {
        string spellText;
        string parentId;
        string childId;

        spellText = "<~shape (cube)>";
        parentId = "test-id-from-csharp-0";
        systemManager.CreateObjectFromMps(spellText, parentId);

        // aura
        spellText = "<~main <~startLifetime 2 ~startSpeed 0 ~startSize 100 ~startRotation <~x [0 360] ~y [0 360] ~z [0 360]> ~startColor [0.4 0.8 1 1] > ~emission <~rateOverTime 2 > ~colorOverLifetime <~gradient<~alphaKeys [[0 0] [0.3 1] [1 0]]>> ~customData < ~x 0.21 ~y 0.21 ~z 0.86 ~w 0.35 > ~renderer <~renderMode (Mesh) ~meshes (Sphere_1)  ~material <~texture (Smoke_4) ~shader (Aura)> ~alignment (Local)> > ";
        childId = "test-id-from-csharp-1";
        systemManager.CreateAndSpawnParticleFromMps(spellText, childId);
        systemManager.AttachToParent(childId, parentId);

        // fresnel
        spellText = "<~main <~startLifetime 2 ~startSpeed 0 ~startSize 100 ~startRotation <~x [0 360] ~y [0 360] ~z [0 360]> ~startColor [0.4 0.8 1 1] > ~emission <~rateOverTime 2 > ~colorOverLifetime <~gradient<~alphaKeys [[0 0] [0.3 1] [1 0]]>> ~customData < ~x 0.21 ~y 0.21 ~z 2.8 ~w 1 > ~renderer <~renderMode (Mesh) ~meshes (Sphere_1)  ~material < ~shader (Aura)> ~alignment (Local)> > ";
        childId = "test-id-from-csharp-2";
        systemManager.CreateAndSpawnParticleFromMps(spellText, childId);
        systemManager.AttachToParent(childId, parentId);

        // ring
        spellText = "<~main <~startLifetime 2 ~startSpeed 0 ~startSize 125 ~startRotation < ~y [0 360] > ~startColor [0.4 0.8 1 1] > ~emission <~rateOverTime 2 > ~colorOverLifetime <~gradient<~alphaKeys [[0 0] [0.3 1] [1 0]]>> ~sizeOverLifetime < ~size [[0 0.5] [1 1]] > ~customData < ~x -0.3 ~y [-0.3 0.3] ~z 0.8 ~w 0.35 > ~renderer <~renderMode (Mesh) ~meshes (Ring_1) ~material <~texture (Smoke_4) ~shader (Aura)> ~alignment (Local)> > ";
        childId = "test-id-from-csharp-3";
        systemManager.CreateAndSpawnParticleFromMps(spellText, childId);
        systemManager.AttachToParent(childId, parentId);
    }
    void testFire()
    {
        string spellText;
        string testId;
        string parentId;
        string childId;

        spellText = "<~shape (empty)>";
        testId = "test-id-from-csharp-0";
        systemManager.CreateObjectFromMps(spellText, testId);

        spellText = "<~main <~startLifetime [0.5 2] ~startSpeed 0.5 ~startSize [0.2 0.4] ~startRotation [0 360]> ~emission <~rateOverTime 50> ~shape <~angle 5 ~radius 0.0001> ~colorOverLifetime <~gradient <~colorKeys [[0.0 1.0 0.6 0.0 1.0] [0.6 1.0 0.0 0.0 1.0] [1.0 1.0 0.0 0.0 1.0]] ~alphaKeys [[0 0] [0.5 1] [1 0]]>> ~rotationOverLifetime <~z [-45 45]> ~renderer <~material <~texture (Smoke_1)>>>";
        testId = "test-id-from-csharp-1";
        systemManager.CreateAndSpawnParticleFromMps(spellText, testId);
        parentId = "test-id-from-csharp-0";
        childId = "test-id-from-csharp-1";
        systemManager.AttachToParent(childId, parentId);

        spellText = "<~main <~startLifetime [0.5 2] ~startSpeed 0.5 ~startSize [0.2 0.4] ~startRotation [0 360]> ~emission <~rateOverTime 50> ~shape <~angle 5 ~radius 0.0001> ~colorOverLifetime <~gradient <~colorKeys [[0.0 1.0 0.6 0.0 1.0] [0.6 1.0 0.0 0.0 1.0] [1.0 1.0 0.0 0.0 1.0]] ~alphaKeys [[0 0] [0.5 1.0] [1.0 0.0]]>> ~rotationOverLifetime <~z [-45 45]> ~renderer <~materialName (Fire_1) ~shader (alphablended) ~sortingFudge 10>>";
        testId = "test-id-from-csharp-2";
        systemManager.CreateAndSpawnParticleFromMps(spellText, testId);
        childId = "test-id-from-csharp-2";
        systemManager.AttachToParent(childId, parentId);
        spellText = "<~scale 2>";
        systemManager.TransformObjectById(parentId, spellText);
    }

    void testBullet()
    {
        string spellText;
        string testId;
        string parentId;
        string childId;

        spellText = "<~shape (empty)>";
        testId = "test-id-from-csharp-0";
        systemManager.CreateObjectFromMps(spellText, testId);
        // cross
        spellText = "<~main <~duration 1 ~startLifetime 2 ~startSpeed 10 ~startSize <~x 30 ~y 30 ~z 75> ~startColor [1 0.5 0 1] > ~emission <~rateOverTime 0 ~burstCount 2> ~colorOverLifetime <~gradient<~alphaKeys [[0 0] [0.05 1] [0.95 1] [1 0]]>> ~renderer <~renderMode (Mesh) ~meshDistribution (NonUniformRandom) ~meshes (Bullet) ~material<~texture (Glow_2)> ~alignment (Local)>>";
        testId = "test-id-from-csharp-1";
        systemManager.CreateAndSpawnParticleFromMps(spellText, testId);
        parentId = "test-id-from-csharp-0";
        childId = "test-id-from-csharp-1";
        systemManager.AttachToParent(childId, parentId);
        // wave
        spellText = "<~main <~duration 1 ~startLifetime 2 ~startSpeed 10 ~startSize <~x 30 ~y 30 ~z 75> ~startColor [1 0.5 0 1] > ~emission <~rateOverTime 0 ~burstCount 2> ~colorOverLifetime <~gradient<~alphaKeys [[0 0] [0.05 1] [0.95 1] [1 0]]>> ~rotationOverLifetime <~z 500> ~renderer <~renderMode (Mesh) ~meshDistribution (NonUniformRandom) ~meshes (Bullet) ~material <~texture (Glow_3)> ~alignment (Local) >> ";
        testId = "test-id-from-csharp-2";
        systemManager.CreateAndSpawnParticleFromMps(spellText, testId);
        childId = "test-id-from-csharp-2";
        systemManager.AttachToParent(childId, parentId);
        // wave alp
        spellText = "<~main <~duration 1 ~startLifetime 2 ~startSpeed 10 ~startSize <~x 30 ~y 30 ~z 75> ~startColor [1 0.5 0 1] > ~emission <~rateOverTime 0 ~burstCount 2> ~colorOverLifetime <~gradient<~alphaKeys [[0 0] [0.05 1] [0.95 1] [1 0]]>> ~rotationOverLifetime <~z 500> ~renderer <~renderMode (Mesh) ~meshDistribution (NonUniformRandom) ~meshes (Bullet) ~material <~shader (AlphaBlended) ~texture (Glow_3)> ~sortingFudge 10 ~alignment (Local) >> ";
        testId = "test-id-from-csharp-5";
        systemManager.CreateAndSpawnParticleFromMps(spellText, testId);
        childId = "test-id-from-csharp-5";
        systemManager.AttachToParent(childId, parentId);
        //spiral
        spellText = "<~main <~duration 1 ~startLifetime 2 ~startSpeed 10 ~startSize <~x 10 ~y 10 ~z 200> ~startColor [1 0.5 0 1] > ~emission <~rateOverTime 0 ~burstCount 2> ~colorOverLifetime <~gradient <~alphaKeys [[0 0] [0.05 1] [0.95 1] [1 0]]>> ~rotationOverLifetime <~z -800> ~renderer <~renderMode (Mesh) ~meshDistribution (NonUniformRandom) ~meshes (Cylinder_1) ~material <~texture (Spiral)> ~alignment (Local)>>";
        testId = "test-id-from-csharp-3";
        systemManager.CreateAndSpawnParticleFromMps(spellText, testId);
        childId = "test-id-from-csharp-3";
        systemManager.AttachToParent(childId, parentId);
        // trail
        spellText = "< ~main < ~duration 1 ~startLifetime 2 ~startSpeed 10 ~startSize 0.1 ~startColor [1 0.5 0 1] > ~emission < ~rateOverTime 0 ~burstCount 2> ~colorOverLifetime < ~gradient < ~alphaKeys [[0 0] [0.05 1] [0.95 1] [1 0]]>> ~trails < ~lifetime 0.2 > ~renderer < ~material <~texture (Glow_1)> ~trailMaterial<~texture (Trail_1)> >>";
        testId = "test-id-from-csharp-4";
        systemManager.CreateAndSpawnParticleFromMps(spellText, testId);
        childId = "test-id-from-csharp-4";
        systemManager.AttachToParent(childId, parentId);
        // trail alp
        spellText = "< ~main < ~duration 1 ~startLifetime 2 ~startSpeed 10 ~startSize 0.1 ~startColor [1 0.5 0 1] > ~emission < ~rateOverTime 0 ~burstCount 2> ~colorOverLifetime < ~gradient < ~alphaKeys [[0 0] [0.05 1] [0.95 1] [1 0]]>> ~trails < ~lifetime 0.2 > ~renderer < ~material <~shader (AlphaBlended) ~texture (Glow_1)> ~trailMaterial<~shader (AlphaBlended) ~texture (Trail_1)> ~sortingFudge 10 >>";
        testId = "test-id-from-csharp-6";
        systemManager.CreateAndSpawnParticleFromMps(spellText, testId);
        childId = "test-id-from-csharp-6";
        systemManager.AttachToParent(childId, parentId);
        spellText = "<~scale 5>";
        systemManager.TransformObjectById(parentId, spellText);
    }

    void testCharge()
    {
        string spellText;
        string testId;
        string parentId;
        string childId;
        spellText = "<~shape (empty)>";
        testId = "test-id-from-csharp-0";
        systemManager.CreateObjectFromMps(spellText, testId);
        // trail
        spellText = "<~main <~duration 2 ~startLifetime 1 ~startSpeed 0 ~startColor [1 0.5 0 1] > ~emission <~rateOverTime 0 ~bursts [<~count 20>]> ~shape <~shape (Sphere) ~radius 4 ~radiusThickness 0.2> ~velocityOverLifetime <~orbitalY [[0 0] [1 15]] ~radial -5> ~colorOverLifetime < ~gradient < ~alphaKeys [[0 0] [0.2 1] [1 1]]>> ~trails <~lifetime [0.1 0.2] ~minVertexDistance 0.1 ~sizeAffectsWidth false ~widthOverTrail [[0 0.05] [1 0]]> ~renderer <~renderMode (None) ~trailMaterial < ~shader (Additive) ~texture (Smoke_2)> > >";
        testId = "test-id-from-csharp-1";
        systemManager.CreateAndSpawnParticleFromMps(spellText, testId);
        parentId = "test-id-from-csharp-0";
        childId = "test-id-from-csharp-1";
        systemManager.AttachToParent(childId, parentId);
        // trailBlack
        spellText = "<~main <~duration 2 ~startLifetime 1 ~startSpeed 0 ~startColor [0.25 0.2 0 1] > ~emission <~rateOverTime 0 ~bursts [<~count 8>]> ~shape <~shape (Sphere) ~radius 4 ~radiusThickness 0.2> ~velocityOverLifetime <~orbitalY [[0 0] [1 15]] ~radial -5> ~colorOverLifetime < ~gradient < ~alphaKeys [[0 0] [1 0.2] [1 1]]>> ~trails <~lifetime [0.1 0.2] ~minVertexDistance 0.1 ~sizeAffectsWidth false ~widthOverTrail [[0 0.15] [1 0.02]]> ~renderer <~renderMode (None) ~trailMaterial < ~shader (AlphaBlended) ~texture (Smoke_2)> >>";
        testId = "test-id-from-csharp-2";
        systemManager.CreateAndSpawnParticleFromMps(spellText, testId);
        parentId = "test-id-from-csharp-0";
        childId = "test-id-from-csharp-2";
        systemManager.AttachToParent(childId, parentId);
        // dot
        spellText = "<~main <~duration 2 ~startLifetime [0.7 1] ~startSpeed 0 ~startSize [0.2 0.3] ~startColor [1 0.8 0.6 1] > ~emission <~rateOverTime 0 ~bursts [<~count 20>]> ~shape <~shape (Sphere) ~radius 4 ~radiusThickness 0.2> ~velocityOverLifetime <~orbitalY [[0 0] [1 10]] ~radial [-2 -3]> ~colorOverLifetime < ~gradient < ~alphaKeys [[0 0] [0.2 1] [0.8 1] [1 0]]>> ~renderer <~material < ~texture (Glow_2)>>>";
        testId = "test-id-from-csharp-3";
        systemManager.CreateAndSpawnParticleFromMps(spellText, testId);
        parentId = "test-id-from-csharp-0";
        childId = "test-id-from-csharp-3";
        systemManager.AttachToParent(childId, parentId);
        // smoke
        spellText = "<~main <~duration 2 ~startLifetime [0.7 1] ~startSpeed 0 ~startSize [2 3] ~startRotation [0 360] ~startColor [1 0.5 0 0.1] > ~emission <~rateOverTime 0 ~bursts [<~count 100>]> ~shape <~shape (Sphere) ~radius 4 ~radiusThickness 0.2> ~velocityOverLifetime <~orbitalY [[0 01] [1 20]] ~radial -5> ~colorOverLifetime < ~gradient < ~alphaKeys [[0 0] [1 0.5]]>> ~sizeOverLifetime <~size [[0 1] [0.5 1] [1 0]]> ~renderer <~materialName (Smoke_2)>>";
        testId = "test-id-from-csharp-4";
        systemManager.CreateAndSpawnParticleFromMps(spellText, testId);
        parentId = "test-id-from-csharp-0";
        childId = "test-id-from-csharp-4";
        systemManager.AttachToParent(childId, parentId);
        // smoke_alp
        spellText = "<~main <~duration 2 ~startLifetime [0.7 1] ~startSpeed 0 ~startSize [2 3] ~startRotation [0 360] ~startColor [1 0.5 0 0.05] > ~emission <~rateOverTime 0 ~bursts [<~count 100>]> ~shape <~shape (Sphere) ~radius 4 ~radiusThickness 0.2> ~velocityOverLifetime <~orbitalY [[0 01] [1 20]] ~radial -5> ~colorOverLifetime < ~gradient < ~alphaKeys [[0 0] [1 0.5]]>> ~sizeOverLifetime <~size [[0 1] [0.5 1] [1 0]]> ~renderer <~materialName (Smoke_2) ~shader (alphablended) ~sortingFudge 10>>";
        testId = "test-id-from-csharp-4-2";
        systemManager.CreateAndSpawnParticleFromMps(spellText, testId);
        parentId = "test-id-from-csharp-0";
        childId = "test-id-from-csharp-4-2";
        systemManager.AttachToParent(childId, parentId);
        // core
        spellText = "<~main <~duration 2 ~startDelay 0.2 ~startLifetime 1 ~startSpeed 0 ~startSize 1.5 ~startColor [1 0.5 0 1] > ~emission <~rateOverTime 0 ~bursts [<~count 5>]> ~sizeOverLifetime <~size [[0 0] [0.3 0.6] [0.7 1] [0.8 0.2] [1 0]]> ~renderer <~materialName (Grow_1)>>";
        testId = "test-id-from-csharp-5";
        systemManager.CreateAndSpawnParticleFromMps(spellText, testId);
        parentId = "test-id-from-csharp-0";
        childId = "test-id-from-csharp-5";
        systemManager.AttachToParent(childId, parentId);
        // core_alp
        spellText = "<~main <~duration 2 ~startDelay 0.2 ~startLifetime 1 ~startSpeed 0 ~startSize 1.5 ~startColor [0.5 0.3 0 1] > ~emission <~rateOverTime 0 ~bursts [<~count 5>]> ~sizeOverLifetime <~size [[0 0] [0.3 0.6] [0.7 1] [0.8 0.2] [1 0]]> ~renderer <~materialName (Grow_1) ~shader (alphablended) ~sortingFudge 10>>";
        testId = "test-id-from-csharp-5-2";
        systemManager.CreateAndSpawnParticleFromMps(spellText, testId);
        parentId = "test-id-from-csharp-0";
        childId = "test-id-from-csharp-5-2";
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
        string objectText = "<~shape (cube) >";
        string testId = "test-id-from-csharp-100";
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
    }
}