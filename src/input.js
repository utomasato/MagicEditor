// =============================================
// User Input Handling
// =============================================

function InputInitialize()
{
    isPanning = false;
    panStart = {x: 0, y: 0};
    isDragging = false;
    dragOffset = {x: 0, y: 0};
    isRotating = false;
    isAddRing = false;
    isAddSigil = false;
    isAddNum = false;
    isAddStr = false;
    isAddName = false;
    isAddArrayRing = false;
    isAddDictRing = false;
    mousePos = {x: 0, y: 0};
    selectRing = null;
    isItemDragging = false;
    draggingItem = null;

    if (currentUiPanel) {
        currentUiPanel.remove();
        currentUiPanel = null;
    }
    currentInputElement = null;
    currentSelectElement = null;
    editingItem = null;
}

function MouseDownEvent()
{
    if (isMouseOverPanel(currentUiPanel) || isMouseOverPanel(consolePanel)) {
        return;
    }
    
    if (currentUiPanel) {
        const panelRect = currentUiPanel.elt.getBoundingClientRect();
        if (mouseX < panelRect.left || mouseX > panelRect.right || mouseY < panelRect.top || mouseY > panelRect.bottom) {
            if (currentInputElement) {
                finishTextInput(); 
            } else {
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
    switch (cursormode)
    {
        case "grad":
            switch (ClickObj[0])
            {
                case "menu":
                case "button":
                    break;
                case "ring":
                    selectRing = ClickObj[1][0];
                    switch (ClickObj[1][1])
                    {
                        case "inner": StartDragRing(selectRing, mousePos); break;
                        case "outer": StartRotateRing(selectRing, mousePos); break;
                        case "ring":
                            const iteminfo = ClickObj[1][2];
                            if (iteminfo.item && iteminfo.index != 0) {
                                StartDragItem(iteminfo.item, iteminfo.index);
                            } else { 
                                StartRotateRing(selectRing, mousePos);
                            }
                            break;
                    }
                    break;
                case "item": StartDragItem(fieldItems[ClickObj[1]], ClickObj[1]); break;
                default : StartPan(GetMousePos());
            }
            break;
        case "default":
            switch (ClickObj[0])
            {
                case "menu":
                case "button": break;
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
                default : StartPan(GetMousePos());
            }
            break;
    }
}

function MouseHoldEvent()
{
    if (GetMouseX() > GetScreenSize()[0]) return;
    if (isAddRing) { if (!CheckMouseOnMenu()) { selectRing = new MagicRing(mousePos); selectRing.isNew = true; rings.push(selectRing); StartDragRing(selectRing, mousePos); isAddRing = false; } }
    else if (isAddArrayRing) { if (!CheckMouseOnMenu()){ selectRing = new ArrayRing(mousePos); selectRing.isNew = true; rings.push(selectRing); StartDragRing(selectRing, mousePos); isAddArrayRing = false; } }
    else if (isAddDictRing) { if (!CheckMouseOnMenu()){ selectRing = new DictRing(mousePos); selectRing.isNew = true; rings.push(selectRing); StartDragRing(selectRing, mousePos); isAddDictRing = false; } }
    else if (isAddSigil) { if (!CheckMouseOnMenu()) { const newItem = new Sigil(0, 0, "add", null); newItem.isNew = true; fieldItems.push(newItem); StartDragItem(newItem, fieldItems.length-1); isAddSigil = false; } }
    else if (isAddNum) { if (!CheckMouseOnMenu()) { const newItem = new Chars(0, 0, "0", null); newItem.isNew = true; fieldItems.push(newItem); StartDragItem(newItem, fieldItems.length-1); isAddNum = false; } }
    else if (isAddStr) { if (!CheckMouseOnMenu()) { const newItem = new StringToken(0, 0, "Hello", null); newItem.isNew = true; fieldItems.push(newItem); StartDragItem(newItem, fieldItems.length-1); isAddStr = false; } }
    else if (isAddName) { if (!CheckMouseOnMenu()) { const newItem = new Name(0, 0, "name", null); newItem.isNew = true; fieldItems.push(newItem); StartDragItem(newItem, fieldItems.length-1); isAddName = false; } }
    else if (isDragging) { DragRing(selectRing, mousePos); }
    else if (isRotating) { RotateRing(selectRing, mousePos); }
    else if (isPanning) { Pan(GetMousePos()); }
    else if (isItemDragging) { }
}

function MouseUpEvent()
{
    if (GetMouseX() > GetScreenSize()[0]) return;
    if (isDragging) { EndDragRing(); }
    else if (isRotating) { EndRotateRing(); }
    else if (isPanning) { EndPan(); }
    else if (isItemDragging) { EndDragItem(); }
    isAddRing = false;
}


function CheckMouseObject()
{
    if (CheckButtons()) { return ["button"]; }
    if (CheckMouseOnMenu()) { return ["menu"]; }
    const ring = CheckMouseOnRing();
    if (ring) { return ["ring", ring]; }
    const hititem = CheckMouseOnItem();
    if (hititem[0]) { return ["item", hititem[1]]; }
    return [null];
}

function CheckMouseOnRing()
{
    let hitRing;
    for (const ring of rings) {
        hitRing = ring.CheckPosIsOn(mousePos);
        if (hitRing) break;
    }
    return hitRing;
}

function CheckMouseOnItem()
{
    let ishit = false;
    let index = 0;
    for (let i = 0; i < fieldItems.length; i++) {
        ishit = fieldItems[i].CheckPosIsOn(mousePos);
        if (ishit) { index = i; break; }
    }
    return [ishit, index];
}

function CheckMouseOnMenu()
{
    return GetMouseY() < config.menuHeight;
}

function DrawButtons()
{
    buttons.forEach (btn => { btn.Draw(); })
}

function CheckButtons()
{   
    let isbutton = false;
    buttons.forEach (btn => {
        const result = btn.CheckPressed();
        if (result) isbutton = true;
    });
    return isbutton;
}

function StartDragRing(ring, pos)
{
    isDragging = true;
    dragOffset.x = ring.pos.x - pos.x;
    dragOffset.y = ring.pos.y - pos.y;  
}

function DragRing(ring, pos)
{
    if (!isDragging) return;
    const oldPos = { x: ring.pos.x, y: ring.pos.y };
    const newX = pos.x + dragOffset.x;
    const newY = pos.y + dragOffset.y;
    const dx = newX - oldPos.x;
    const dy = newY - oldPos.y;
    moveRingAndDescendants(ring, dx, dy, new Set());
}

function EndDragRing()
{
    if (CheckMouseObject()[0] == "menu")
    {
        rings = rings.filter(item => item !== selectRing);
    }
    isDragging = false;
    if (selectRing && selectRing.isNew) {
        createRingPanel(selectRing);
        selectRing.isNew = false; 
    }
}

function StartRotateRing(ring, pos)
{
    isRotating = true;
    const mouseAngle = Math.atan2(pos.y - ring.pos.y, pos.x - ring.pos.x);
    rotateOffset = ring.angle - mouseAngle;
}

function RotateRing(ring, pos)
{
    if(!isRotating) return;
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

function EndRotateRing(ring)
{
    isRotating = false;
}

function StartDragItem(item, index)
{
    isItemDragging = true;
    draggingItem = {item: item, index: index};
    if (item.parentRing)
        item.parentRing.items[index] = null;
    else
        fieldItems.splice(index,1);
}

function EndDragItem()
{
    if (!draggingItem || !draggingItem.item) {
        isItemDragging = false;
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
    switch(obj[0]) 
    {
        case "menu":
            draggedItem.parentRing = null;
            break;
        case "ring":
            const newring = obj[1][0];
            const iteminfo = newring.CheckPosItem(mousePos);
            
            if (iteminfo.item == null) { 
                newring.InsertItem(draggedItem, iteminfo.index);
            } else {
                if (newring == originalRing) {
                    if (originalIndex <= iteminfo.index+1 && iteminfo.index)
                        newring.InsertItem(draggedItem, iteminfo.index);
                    else
                        newring.InsertItem(draggedItem, iteminfo.index +1);
                } else {
                    newring.InsertItem(draggedItem, iteminfo.index + 1);
                }
            }
            draggedItem.parentRing = newring;
            newring.CalculateLayout();
            break;
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
    isItemDragging = false;
    if (originalRing) {
        originalRing.CalculateLayout();
    }
}

function StartPan(mousePos)
{
    isPanning = true;
    panStart = mousePos;
    SetMouseCursor('grabbing');
}

function Pan(mousePos)
{
    if (!isPanning) return;
    const dx = mousePos.x - panStart.x;
    const dy = mousePos.y - panStart.y;
    cameraPos.x -= dx / zoomSize;
    cameraPos.y -= dy / zoomSize;
    panStart = mousePos;
}

function EndPan()
{
    if (!isPanning) return;
    isPanning = false;
    SetMouseCursor('grab');
}

