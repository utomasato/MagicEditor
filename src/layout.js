/**
 * 指定されたリングをルートとして、ツリー構造全体のレイアウトを自動的に調整します。
 * @param {MagicRing} startRing レイアウトの基点となるリング
 * @param {boolean} recordUndo Undo/Redoスタックに記録するかどうか（デフォルト: true）
 */
function alignConnectedRings(startRing, recordUndo = true) {
    if (!startRing) return;

    // Capture state BEFORE
    const beforeState = captureSubtreeState(startRing);

    // 始点リングをルートとして、再帰的なレイアウト処理を開始
    layoutSubtreeAndGetEffectiveRadius(startRing, new Set());

    // Capture state AFTER
    const afterState = captureSubtreeState(startRing);

    // ユーザー操作(recordUndo=true)かつ、状態に変化があった場合のみ記録
    if (recordUndo && statesAreDifferent(beforeState, afterState)) {
        redoStack = [];
        actionStack.push(new Action("batch_transform", {
            before: beforeState,
            after: afterState
        }));
    }
}

/**
 * 再帰的にサブツリーのレイアウトを行い、その実効半径を返します。
 * @param {MagicRing} parentRing 現在処理中の親リング
 * @param {Set<MagicRing>} visited 循環参照防止用の訪問済みセット
 * @returns {number} このサブツリーの実効半径
 */
function layoutSubtreeAndGetEffectiveRadius(parentRing, visited) {
    if (!parentRing || visited.has(parentRing)) {
        if (parentRing) {
            parentRing.effectiveRadius = parentRing.outerradius;
        }
        return parentRing ? parentRing.outerradius : 0;
    }
    visited.add(parentRing);

    // レイアウト配列が未計算の場合があるため、ここで計算を実行します
    parentRing.CalculateLayout();

    // 1. 子リングの情報を収集
    const children = [];
    parentRing.items.forEach((item, index) => {
        if (item && item.type === 'joint' && item.value instanceof MagicRing) {
            const targetRing = item.value;
            if (!children.some(c => c.ring === targetRing)) {
                children.push({
                    ring: targetRing,
                    layout: parentRing.layouts[index],
                    effectiveRadius: 0
                });
            }
        }
    });

    if (children.length === 0) {
        parentRing.effectiveRadius = parentRing.outerradius;
        return parentRing.outerradius;
    }

    // 2. 子のサブツリーを再帰的にレイアウトし、実効半径を取得
    children.forEach(child => {
        child.effectiveRadius = layoutSubtreeAndGetEffectiveRadius(child.ring, new Set(visited));
    });

    // 3. 子リングを親の周りに配置
    const ringGap = 50;
    const direction = globalIsClockwise ? -1 : 1; // グローバル変数から描画方向を取得

    children.forEach(child => {
        // 目標の位置と角度を計算
        // layouts[].angleは常に反時計回りなので、directionを乗算して方向を合わせる
        const jointWorldAngle = parentRing.angle + child.layout.angle * direction;
        const alignAngle = jointWorldAngle - HALF_PI;
        const distance = parentRing.outerradius + child.effectiveRadius + ringGap;
        const newX = parentRing.pos.x + distance * cos(alignAngle);
        const newY = parentRing.pos.y + distance * sin(alignAngle);

        // 子の向きは親を向くように設定
        const directionToParent = atan2(parentRing.pos.y - newY, parentRing.pos.x - newX);
        const newAngle = directionToParent + HALF_PI;

        // サブツリー全体を変換
        transformSubtree(child.ring, newX, newY, newAngle);
    });


    // 4. 子リング同士の衝突を解消
    const maxIterations = 10;
    for (let iter = 0; iter < maxIterations; iter++) {
        let collisionFound = false;
        for (let i = 0; i < children.length; i++) {
            for (let j = i + 1; j < children.length; j++) {
                const childA = children[i];
                const childB = children[j];

                const distBetween = dist(childA.ring.pos.x, childA.ring.pos.y, childB.ring.pos.x, childB.ring.pos.y);
                const requiredDist = childA.effectiveRadius + childB.effectiveRadius + 5;

                if (distBetween < requiredDist) {
                    collisionFound = true;
                    const overlap = requiredDist - distBetween;

                    const ringToMoveData = (childA.effectiveRadius >= childB.effectiveRadius) ? childB : childA;

                    const angleFromParent = atan2(ringToMoveData.ring.pos.y - parentRing.pos.y, ringToMoveData.ring.pos.x - parentRing.pos.x);

                    const dx = overlap * cos(angleFromParent);
                    const dy = overlap * sin(angleFromParent);

                    const newX = ringToMoveData.ring.pos.x + dx;
                    const newY = ringToMoveData.ring.pos.y + dy;
                    const directionToParent = atan2(parentRing.pos.y - newY, parentRing.pos.x - newX);
                    const newAngle = directionToParent + HALF_PI;

                    transformSubtree(ringToMoveData.ring, newX, newY, newAngle);
                }
            }
        }
        if (!collisionFound) break;
    }

    // 5. 親リングの新しい実効半径を計算して返す
    let maxExtent = parentRing.outerradius;
    children.forEach(child => {
        const distToChildCenter = dist(parentRing.pos.x, parentRing.pos.y, child.ring.pos.x, child.ring.pos.y);
        maxExtent = max(maxExtent, distToChildCenter + child.effectiveRadius);
    });

    parentRing.effectiveRadius = maxExtent;
    return maxExtent;
}


/**
 * 指定されたリングとそのすべての子孫リングを、指定されたオフセット分だけ移動させます。
 * @param {MagicRing} ringToMove - 移動を開始するリング
 * @param {number} dx - X方向の移動量
 * @param {number} dy - Y方向の移動量
 * @param {Set<MagicRing>} movedRings - この移動操作で既に動かしたリングのセット
 */
function moveRingAndDescendants(ringToMove, dx, dy, movedRings) {
    if (!ringToMove || movedRings.has(ringToMove)) {
        return;
    }
    movedRings.add(ringToMove);

    ringToMove.pos.x += dx;
    ringToMove.pos.y += dy;

    const children = ringToMove.items
        .filter(item => item && item.type === 'joint' && item.value instanceof MagicRing)
        .map(joint => joint.value);

    [...new Set(children)].forEach(child => {
        moveRingAndDescendants(child, dx, dy, movedRings);
    });
}

/**
 * 指定されたリングのサブツリー全体を、指定された中心点(cx, cy)周りに角度angleだけ回転させます。
 * @param {MagicRing} ring - 回転を開始するリング
 * @param {number} cx - 回転の中心X座標
 * @param {number} cy - 回転の中心Y座標
 * @param {number} angle - 回転させる角度（ラジアン）
 * @param {Set<MagicRing>} rotatedRings - 無限再帰防止用のセット
 */
function rotateSubtreeAroundPoint(ring, cx, cy, angle, rotatedRings) {
    if (!ring || rotatedRings.has(ring)) {
        return;
    }
    rotatedRings.add(ring);

    const relX = ring.pos.x - cx;
    const relY = ring.pos.y - cy;
    const cosA = cos(angle);
    const sinA = sin(angle);
    ring.pos.x = cx + (relX * cosA - relY * sinA);
    ring.pos.y = cy + (relX * sinA + relY * cosA);

    ring.angle += angle;

    const children = ring.items
        .filter(item => item && item.type === 'joint' && item.value instanceof MagicRing)
        .map(joint => joint.value);

    [...new Set(children)].forEach(child => {
        rotateSubtreeAroundPoint(child, cx, cy, angle, rotatedRings);
    });
}

/**
 * 指定されたリングの位置と角度を更新し、その変化に応じてサブツリー全体を適切に変換（移動＆回転）します。
 * @param {MagicRing} ringToUpdate - 更新対象のリング
 * @param {number} newX - 新しい目標X座標
 * @param {number} newY - 新しい目標Y座標
 * @param {number} newAngle - 新しい目標角度 (ラジアン)
 */
function transformSubtree(ringToUpdate, newX, newY, newAngle) {
    const oldPos = { x: ringToUpdate.pos.x, y: ringToUpdate.pos.y };
    const oldAngle = ringToUpdate.angle;

    const dx = newX - oldPos.x;
    const dy = newY - oldPos.y;

    const angleChange = newAngle - oldAngle;

    moveRingAndDescendants(ringToUpdate, dx, dy, new Set());

    if (abs(angleChange) > 0.001) {
        const children = ringToUpdate.items
            .filter(item => item && item.type === 'joint' && item.value instanceof MagicRing)
            .map(joint => joint.value);

        [...new Set(children)].forEach(child => {
            rotateSubtreeAroundPoint(
                child,
                newX,
                newY,
                angleChange,
                new Set([ringToUpdate])
            );
        });
    }

    ringToUpdate.angle = newAngle;
}

/**
 * StartRingから繋がるすべてのJointを直線化します。
 * @param {MagicRing} startRing 
 * @param {boolean} recordUndo Undo/Redoスタックに記録するかどうか（デフォルト: true）
 */
function StraightenConnectedJoints(startRing, recordUndo = true) {
    if (!startRing) return;

    // Capture state BEFORE
    const beforeState = captureSubtreeState(startRing);

    _straightenRecursively(startRing);

    // Capture state AFTER
    const afterState = captureSubtreeState(startRing);

    // ユーザー操作(recordUndo=true)かつ、状態に変化があった場合のみ記録
    if (recordUndo && statesAreDifferent(beforeState, afterState)) {
        redoStack = [];
        actionStack.push(new Action("batch_transform", {
            before: beforeState,
            after: afterState
        }));
    }
}

function _straightenRecursively(ring) {
    if (!ring) return;
    ring.items.forEach(item => {
        if (item && item.type === 'joint' && item.value) {
            // 個別のStraighten呼び出しではUndoを記録しない (false)
            item.Straighten(false);
            _straightenRecursively(item.value);
        }
    });
}

function captureSubtreeState(rootRing, visited = new Set()) {
    if (!rootRing || visited.has(rootRing)) return [];
    visited.add(rootRing);

    let state = [{
        ring: rootRing,
        pos: { x: rootRing.pos.x, y: rootRing.pos.y },
        angle: rootRing.angle
    }];

    // Traverse children via joints
    rootRing.items.forEach(item => {
        if (item && item.type === 'joint' && item.value instanceof MagicRing) {
            state = state.concat(captureSubtreeState(item.value, visited));
        }
    });
    return state;
}

function statesAreDifferent(before, after) {
    if (before.length !== after.length) return true;
    for (let i = 0; i < before.length; i++) {
        if (before[i].ring !== after[i].ring) return true;
        if (Math.abs(before[i].pos.x - after[i].pos.x) > 0.001) return true;
        if (Math.abs(before[i].pos.y - after[i].pos.y) > 0.001) return true;
        if (Math.abs(before[i].angle - after[i].angle) > 0.001) return true;
    }
    return false;
}