using UnityEngine;
using UnityEngine.EventSystems;

public class CameraCon : MonoBehaviour
{
    [Header("回転速度 (0.1 〜 0.5くらい推奨)")]
    // Input.mousePositionはピクセル単位なので、数値は小さくしてください
    public float sensitivity = 0.2f;

    [Header("縦回転の制限角度")]
    public float maxYAngle = 80f;
    public float minYAngle = -40f;

    private float currentX = 0f;
    private float currentY = 0f;

    // 直前のフレームのマウス位置を保存する変数
    private Vector3 lastMousePosition;
    private bool isRotating = false;

    void Start()
    {
        Vector3 angles = transform.eulerAngles;
        currentX = angles.y;
        currentY = angles.x;
    }

    void Update()
    {
        // 1. 押した瞬間 (初期化)
        if (Input.GetMouseButtonDown(0))
        {
            // UIの上なら処理しない
            if (IsPointerOverUI())
            {
                isRotating = false;
                return;
            }

            // ここが重要：押した瞬間の位置を「基準点」として保存する
            lastMousePosition = Input.mousePosition;
            isRotating = true;
        }

        // 2. 離した瞬間
        if (Input.GetMouseButtonUp(0))
        {
            isRotating = false;
        }

        // 3. ドラッグ中 (回転処理)
        if (isRotating && Input.GetMouseButton(0))
        {
            // 現在のマウス位置を取得
            Vector3 currentMousePosition = Input.mousePosition;

            // 【ここが修正点】
            // Input.GetAxisを使わず、自分で「現在の位置 - 直前の位置」を計算する
            // これにより、予期せぬ「ワープ」の影響を受けなくなります
            float moveX = (currentMousePosition.x - lastMousePosition.x) * sensitivity;
            float moveY = (currentMousePosition.y - lastMousePosition.y) * sensitivity;

            // 角度を加算
            currentX += moveX;
            currentY -= moveY;

            // 縦回転の制限
            currentY = Mathf.Clamp(currentY, minYAngle, maxYAngle);

            // 回転適用
            transform.rotation = Quaternion.Euler(currentY, currentX, 0);

            // 「現在の位置」を「直前の位置」として更新（次フレームのため）
            lastMousePosition = currentMousePosition;
        }
    }

    // UI判定用
    bool IsPointerOverUI()
    {
        if (EventSystem.current.IsPointerOverGameObject()) return true;
        if (Input.touchCount > 0)
        {
            Touch touch = Input.GetTouch(0);
            if (EventSystem.current.IsPointerOverGameObject(touch.fingerId)) return true;
        }
        return false;
    }
}