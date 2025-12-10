// =============================================
// User Input Handling
// =============================================

function InputInitialize() {
    // 右クリックメニューを無効化（ブラウザ標準メニューが出ないようにする）
    document.oncontextmenu = () => false;

    inputMode = "";
    panStart = { x: 0, y: 0 };
    dragOffset = { x: 0, y: 0 };
    mousePos = { x: 0, y: 0 };
    selectRing = null;
    draggingItem = null;

    if (currentUiPanel) {
        currentUiPanel.remove();
        currentUiPanel = null;
    }
    currentInputElement = null;
    currentSelectElement = null;
    editingItem = null;
}

function mouseWheelTurned(event) {
    if (event.deltaY > 0) { // 奥側
        ZoomOut();
    } else if (event.deltaY < 0) { // 手前側
        ZoomIn();
    } else {
    }
}

function MouseDownEvent() {
    lastPressedButton = null;
    if (isUIHidden) {
        isUIHidden = false;
        return;
    }

    // モーダルパネル(Import/Export)が表示されている場合の処理
    if (currentModalPanel) {
        // 'modal-content'クラスを持つ要素（パネル本体）を取得
        const contentPanelElement = currentModalPanel.elt.querySelector('.modal-content');
        if (contentPanelElement) {
            const panelRect = contentPanelElement.getBoundingClientRect();
            // マウスがパネル本体の内側なら、以降の処理をブロックしてモーダルを維持
            if (mouseX >= panelRect.left && mouseX <= panelRect.right && mouseY >= panelRect.top && mouseY <= panelRect.bottom)
                return;
        }
        // パネルの外側がクリックされたので、パネルを閉じる
        currentModalPanel.remove();
        currentModalPanel = null;
        return; // パネルを閉じる操作をしたので、他の操作は行わない
    }

    if (isMouseOverPanel(currentUiPanel) || isMouseOverPanel(consolePanel)) {
        return;
    }

    if (currentUiPanel) {
        const panelRect = currentUiPanel.elt.getBoundingClientRect();
        if (mouseX < panelRect.left || mouseX > panelRect.right || mouseY < panelRect.top || mouseY > panelRect.bottom) {
            if (!currentInputElement) {
                currentUiPanel.remove();
                currentUiPanel = null;
                currentSelectElement = null;
                editingItem = null;
            }
            return;
        }
    }


    if (GetMouseX() > GetScreenSize()[0]) return;
    const ClickObj = CheckMouseObject();

    if (AddObjectMode != "") {
        if (ClickObj[0] == "button") ClickObj[1].Down();
        return;
    }

    if (cursormode == "grad" && mouseButton === LEFT) {
        switch (ClickObj[0]) // クリックしたものによる分岐
        {
            case "menu":
                break;
            case "button":
                ClickObj[1].Down();
                break;
            case "ring":
                selectRing = ClickObj[1][0];
                switch (ClickObj[1][1]) {
                    case "inner": StartDragRing(selectRing, mousePos); break;
                    case "outer": StartRotateRing(selectRing, mousePos); break;
                    case "ring":
                        const iteminfo = ClickObj[1][2];
                        if (iteminfo.item && iteminfo.index != 0) {
                            if (!selectRing.visualEffect)
                                StartDragItem(iteminfo.item, iteminfo.index);
                        } else {
                            StartRotateRing(selectRing, mousePos);
                        }
                        break;
                }
                break;
            case "item":
                StartDragItem(fieldItems[ClickObj[1]], ClickObj[1]);
                break;
            default:
                StartPan(GetMousePos());
        }
    }
    else if (cursormode == "edit" || mouseButton === RIGHT) {
        switch (ClickObj[0]) {
            case "menu":
                break;
            case "button":
                ClickObj[1].Down();
                break;
            case "ring":
                const ringObject = ClickObj[1][0];
                const clickLocation = ClickObj[1][1];
                const ringItemInfo = ClickObj[1][2];

                if (ringItemInfo && ringItemInfo.item) {
                    const itemInRing = ringItemInfo.item;
                    if (itemInRing.type === 'joint') { createJointPanel(itemInRing); }
                    else if (itemInRing.type === 'sigil') {
                        if (itemInRing.value === "RETURN" || itemInRing.value === "COMPLETE") {
                            createRingPanel(itemInRing.parentRing);
                        } else {
                            createSigilDropdown(itemInRing);
                        }
                    }
                    else { createTextInput(itemInRing); }
                } else if (clickLocation === 'inner') { createRingPanel(ringObject); }
                break;
            case "item":
                const fieldItem = fieldItems[ClickObj[1]];
                if (fieldItem.type === 'joint') { createJointPanel(fieldItem); }
                else if (fieldItem.type === 'sigil') { createSigilDropdown(fieldItem); }
                else { createTextInput(fieldItem); }
                break;
            default:
                if (mouseButton === RIGHT) {
                    createAddObjectPanel();
                } else {
                    StartPan(GetMousePos());
                }
        }
    }
}

function MouseHoldEvent() {
    if (isUIHidden) return;
    if (GetMouseX() > GetScreenSize()[0]) return;
    if (!CheckMouseOnMenu()) {
        let newItem;
        switch (AddObjectMode) {
            case "ring":
                selectRing = new MagicRing(mousePos);
                selectRing.isNew = true;
                rings.push(selectRing);
                StartDragRing(selectRing, mousePos);
                break;
            case "sigil":
                newItem = new Sigil(0, 0, "add", null);
                newItem.isNew = true;
                fieldItems.push(newItem);
                StartDragItem(newItem, fieldItems.length - 1);
                break;
            case "num":
                newItem = new Chars(0, 0, "0", null);
                newItem.isNew = true;
                fieldItems.push(newItem);
                StartDragItem(newItem, fieldItems.length - 1);
                break;
            case "str":
                newItem = new StringToken(0, 0, "Hello", null);
                newItem.isNew = true;
                fieldItems.push(newItem);
                StartDragItem(newItem, fieldItems.length - 1);
                break;
            case "name":
                newItem = new Name(0, 0, "name", null);
                newItem.isNew = true;
                fieldItems.push(newItem);
                StartDragItem(newItem, fieldItems.length - 1);
                break;
            case "tRing":
                selectRing = new TemplateRing(mousePos);
                selectRing.isNew = true;
                rings.push(selectRing);
                StartDragRing(selectRing, mousePos);
                break;
        }
        AddObjectMode = "";
    }
    switch (inputMode) {
        case "ringDrag":
            DragRing(selectRing, mousePos);
            break;
        case "rotate":
            RotateRing(selectRing, mousePos);
            //RotateRing(selectRing, mousePos);
            break;
        case "pan":
            Pan(GetMousePos());
            break;
        case "itemDrag":
            break;
    }
}

function MouseUpEvent() {
    if (isUIHidden) return;
    if (GetMouseX() > GetScreenSize()[0]) return;
    switch (inputMode) {
        case "ringDrag":
            EndDragRing();
            break;
        case "rotate":
            EndRotateRing();
            break;
        case "pan":
            EndPan();
            break;
        case "itemDrag":
            EndDragItem();
            break;
    }
    inputMode = "";
    if (lastPressedButton) lastPressedButton.Up();
}


function CheckMouseObject() {
    const button = CheckButtons();
    if (button) { return ["button", button]; }
    if (CheckMouseOnMenu()) { return ["menu"]; }
    const ring = CheckMouseOnRing();
    if (ring) { return ["ring", ring]; }
    const hititem = CheckMouseOnItem();
    if (hititem[0]) { return ["item", hititem[1]]; }
    return [null];
}

function CheckMouseOnRing() {
    let hitRing;
    for (const ring of rings) {
        hitRing = ring.CheckPosIsOn(mousePos);
        if (hitRing) break;
    }
    return hitRing;
}

function CheckMouseOnItem() {
    let ishit = false;
    let index = 0;
    for (let i = 0; i < fieldItems.length; i++) {
        ishit = fieldItems[i].CheckPosIsOn(mousePos);
        if (ishit) { index = i; break; }
    }
    return [ishit, index];
}

function CheckMouseOnMenu() {
    return GetMouseY() < config.menuHeight;
}

function DrawButtons() {
    buttons.forEach(btn => { btn.Draw(); })
}

function CheckButtons() {
    let result = null;
    for (const btn of buttons) {
        result = btn.CheckPressed();
        if (result) break;
    }
    return result;
}

function StartDragRing(ring, pos) {
    inputMode = "ringDrag";
    dragOffset.x = ring.pos.x - pos.x;
    dragOffset.y = ring.pos.y - pos.y;
}

function DragRing(ring, pos) {
    const oldPos = { x: ring.pos.x, y: ring.pos.y };
    const newX = pos.x + dragOffset.x;
    const newY = pos.y + dragOffset.y;
    const dx = newX - oldPos.x;
    const dy = newY - oldPos.y;
    moveRingAndDescendants(ring, dx, dy, new Set());
}

function EndDragRing() {
    if (CheckMouseObject()[0] == "menu") {
        rings.forEach(r => {
            r.items.forEach(item => {
                if (item && item.type === 'joint' && item.value === selectRing) {
                    item.value = null;
                }
            });
        });
        rings = rings.filter(item => item !== selectRing);
        if (selectRing === startRing) {
            startRing = rings.find(r => isRingStartable(r)) || (rings.length > 0 ? rings[0] : null);
            if (startRing) startRing.isStartPoint = true;
        }
        fieldItems.forEach(item => {
            if (item && item.type === 'joint' && item.value === selectRing) {
                item.value = null;
            }
        });
    }
    inputMode = "";
    if (selectRing && selectRing.isNew) {
        createRingPanel(selectRing);
        selectRing.isNew = false;
    }
}

function StartRotateRing(ring, pos) {
    inputMode = "rotate";
    const mouseAngle = Math.atan2(pos.y - ring.pos.y, pos.x - ring.pos.x);
    rotateOffset = ring.angle - mouseAngle;
}

function RotateRing(ring, pos) {
    const oldAngle = ring.angle;
    const mouseAngle = Math.atan2(pos.y - ring.pos.y, pos.x - ring.pos.x);
    const newAngle = mouseAngle + rotateOffset;
    const angleChange = newAngle - oldAngle;

    if (abs(angleChange) > 0.001) {
        const children = ring.items
            .filter(item => item && item.type === 'joint' && item.value instanceof MagicRing)
            .map(joint => joint.value);

        [...new Set(children)].forEach(child => {
            rotateSubtreeAroundPoint(child, ring.pos.x, ring.pos.y, angleChange, new Set([ring]));
        });
    }
    ring.angle = newAngle;
}

function EndRotateRing(ring) {
    inputMode = "";
}

function StartDragItem(item, index) {
    inputMode = "itemDrag";
    draggingItem = { item: item, index: index };
    if (item.parentRing)
        item.parentRing.items[index] = null;
    else
        fieldItems.splice(index, 1);
}

function EndDragItem() {
    if (!draggingItem || !draggingItem.item) {
        inputMode = "itemDrag";
        draggingItem = null;
        return;
    }
    const obj = CheckMouseObject();
    const draggedItem = draggingItem.item;
    const originalRing = draggedItem.parentRing;
    const originalIndex = draggingItem.index;
    if (originalRing) {
        originalRing.RemoveItem(originalIndex);
    }
    switch (obj[0]) {
        case "menu":
            draggedItem.parentRing = null;
            break;
        case "ring":
            const newring = obj[1][0];
            if (newring.visualEffect == null || newring.visualEffect === '-') {
                const iteminfo = newring.CheckPosItem(mousePos);

                if (iteminfo.item == null) {
                    newring.InsertItem(draggedItem, iteminfo.index);
                } else {
                    if (newring == originalRing) {
                        if (originalIndex <= iteminfo.index + 1 && iteminfo.index)
                            newring.InsertItem(draggedItem, iteminfo.index);
                        else
                            newring.InsertItem(draggedItem, iteminfo.index + 1);
                    } else {
                        newring.InsertItem(draggedItem, iteminfo.index + 1);
                    }
                }
                draggedItem.parentRing = newring;
                newring.CalculateLayout();
                break;
            }
        default:
            draggedItem.parentRing = null;
            fieldItems.push(draggedItem);
            draggedItem.pos = mousePos;
    }

    if (draggedItem && draggedItem.isNew) {
        if (draggedItem.type === 'joint') { createJointPanel(draggedItem); }
        else if (draggedItem.type === 'sigil') { if (draggedItem.value != "RETURN" && draggedItem.value != "COMPLETE") { createSigilDropdown(draggedItem); } }
        else { createTextInput(draggedItem); }
        draggedItem.isNew = false;
    }

    draggingItem = null;
    inputMode = "";
    if (originalRing) {
        originalRing.CalculateLayout();
    }
}

function StartPan(mousePos) {
    inputMode = "pan";
    panStart = mousePos;
    SetMouseCursor('grabbing');
}

function Pan(mousePos) {
    const dx = mousePos.x - panStart.x;
    const dy = mousePos.y - panStart.y;
    cameraPos.x -= dx / zoomSize;
    cameraPos.y -= dy / zoomSize;
    panStart = mousePos;
}

function EndPan() {
    inputMode = "";
    SetMouseCursor('grab');
}