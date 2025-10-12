using System;
using System.Collections;
using System.Collections.Generic;
using System.Data.Common;
using UnityEngine;

public class TransformAnimation : MonoBehaviour
{
    private bool isActive_pos;
    private bool isActive_rot;
    private bool isActive_scale;
    private AnimationData animData_pos;
    private AnimationData animData_rot;
    private AnimationData animData_scale;

    float posTimer = 0.0f;
    float rotTimer = 0.0f;
    float scaleTimer = 0.0f;
    bool isReversing_pos = false;
    bool isReversing_rot = false;
    bool isReversing_scale = false;

    public void Initialize(AnimationDatas animDatas)
    {
        if (animDatas.isActive_pos)
        {
            isActive_pos = true;
            animData_pos = animDatas.posAnimData;
        }
        if (animDatas.isActive_rot)
        {
            isActive_rot = true;
            animData_rot = animDatas.rotAnimData;
        }
        if (animDatas.isActive_scale)
        {
            isActive_scale = true;
            animData_scale = animDatas.scaleAnimData;
        }
    }

    void Update()
    {
        if (isActive_pos)
        {
            PositionAnimation();
        }
        if (isActive_rot)
        {
            RotateAnimation();
        }
        if (isActive_scale)
        {
            ScaleAnimation();
        }
    }

    private void PositionAnimation()
    {
        float t;
        if (isReversing_pos) t = 1.0f - posTimer * 1000 / animData_pos.duration;
        else t = posTimer * 1000 / animData_pos.duration;

        float fx;
        if (animData_pos.easeIn && animData_pos.easeOut)
            fx = (1.0f - Mathf.Cos(t * Mathf.PI)) / 2;
        else if (animData_pos.easeIn && !animData_pos.easeOut)
            fx = 1.0f - Mathf.Cos(t * Mathf.PI / 2);
        else if (!animData_pos.easeIn && animData_pos.easeOut)
            fx = Mathf.Sin(t * Mathf.PI / 2);
        else fx = t;

        transform.position = Vector3.Lerp(animData_pos.from, animData_pos.to, fx);

        posTimer += Time.deltaTime;
        if (animData_pos.loop && posTimer * 1000 >= animData_pos.duration)
        {
            posTimer -= animData_pos.duration / 1000;
            if (animData_pos.reverse)
            {
                isReversing_pos = !isReversing_pos;
            }
        }
    }

    private void RotateAnimation()
    {
        float t;
        if (isReversing_rot) t = 1.0f - rotTimer * 1000 / animData_rot.duration;
        else t = rotTimer * 1000 / animData_rot.duration;

        float fx;
        if (animData_rot.easeIn && animData_rot.easeOut)
            fx = (1.0f - Mathf.Cos(t * Mathf.PI)) / 2;
        else if (animData_rot.easeIn && !animData_rot.easeOut)
            fx = 1.0f - Mathf.Cos(t * Mathf.PI / 2);
        else if (!animData_rot.easeIn && animData_rot.easeOut)
            fx = Mathf.Sin(t * Mathf.PI / 2);
        else fx = t;

        transform.eulerAngles = Vector3.Lerp(animData_rot.from, animData_rot.to, fx);

        rotTimer += Time.deltaTime;
        if (animData_rot.loop && rotTimer * 1000 >= animData_rot.duration)
        {
            rotTimer -= animData_rot.duration / 1000;
            if (animData_rot.reverse)
            {
                isReversing_rot = !isReversing_rot;
            }
        }
    }
    private void ScaleAnimation()
    {
        float t;
        if (isReversing_scale) t = 1.0f - scaleTimer * 1000 / animData_scale.duration;
        else t = scaleTimer * 1000 / animData_scale.duration;

        float fx;
        if (animData_scale.easeIn && animData_scale.easeOut)
            fx = (1.0f - Mathf.Cos(t * Mathf.PI)) / 2;
        else if (animData_scale.easeIn && !animData_scale.easeOut)
            fx = 1.0f - Mathf.Cos(t * Mathf.PI / 2);
        else if (!animData_scale.easeIn && animData_scale.easeOut)
            fx = Mathf.Sin(t * Mathf.PI / 2);
        else fx = t;

        transform.localScale = Vector3.Lerp(animData_scale.from, animData_scale.to, fx);

        scaleTimer += Time.deltaTime;
        if (animData_scale.loop && scaleTimer * 1000 >= animData_scale.duration)
        {
            scaleTimer -= animData_scale.duration / 1000;
            if (animData_scale.reverse)
            {
                isReversing_scale = !isReversing_scale;
            }
        }
    }
}
