<script>
    import {fabric} from "fabric";
    import {onMount} from 'svelte';
    import {maxRectId} from "./utils/utils";

    let isTextHidden = true;
    let isEditTextHidden = true;
    let isRendered = false

    let canvasGroup = document.getElementById("canvas-wrap");
    let actionInput = document.getElementById("action");
    let isView = false;
    let f;
    let b;
    let j;
    let imgData;
    let jsonData;
    let img
    let c;
    let dataSet = [];
    let canvas = null;
    let isDrug = false;
    let originX = 0;
    let originY = 0;
    let lastX = 0;
    let lastY = 0;

    onMount(() => {
        f = document.getElementById("map-form");
        b = document.getElementById("background_path");
        j = document.getElementById("canvas_json");
        imgData = b.getAttribute("value");
        jsonData = j.getAttribute("value");
        c = document.getElementById('mapka');
        c.width = canvasGroup.clientWidth;
        c.height = window.innerHeight - 50; //50 на панельку
        canvas = new fabric.Canvas(c);
        canvas.selection = false;

        canvas.on('mouse:wheel', function (opt) {
            let delta = opt.e.deltaY;
            let zoom = canvas.getZoom();
            canvas.absolutePan({
                x: originX,
                y: 0
            });
            zoom *= 0.999 ** delta;
            if (zoom > 20) zoom = 20;
            if (zoom < 0.01) zoom = 0.01;
            canvas.zoomToPoint({x: 0, y: 0}, zoom);
            opt.e.preventDefault();
            opt.e.stopPropagation();
        });

        canvas.on("mouse:down", function (e) {
            if (e.target && e.target.selectable == false) {
                isDrug = true;
                canvas.absolutePan({
                    x: originX,
                    y: originY
                });
                lastX = e.e.clientX;
                lastY = e.e.clientY;
            }
        })

        canvas.on("mouse:move", function (e) {
            if (isDrug) {
                let curX = e.e.clientX;
                let curY = e.e.clientY;
                originX = originX + (lastX - curX);
                originY = originY + (lastY - curY);
                canvas.absolutePan({
                    x: originX,
                    y: originY
                });
                // canvas._setupCurrentTransform(curX, curY);
                canvas.renderAll();
                lastX = curX;
                lastY = curY;
            }
        })

        canvas.on("mouse:up", function (e) {
            isDrug = false;
        })
        canvas.on("mouse:out", function () {
            isDrug = false;
        })

        if(isJsonString (jsonData)) {
            canvas.loadFromJSON(jsonData, canvas.renderAll.bind(canvas), function(o, object) {
                if (object.type === "image") {
                    object.selectable = false;
                }
            });
        } else {
            draw(imgData);
        }

        if(f){
            f.addEventListener('submit', function (e){
                e.preventDefault();
                j.setAttribute('value', JSON.stringify(canvas));
                this.submit();
            })
        }

        document.addEventListener('keyup', function (e){
            if(e.key === "Delete") {
                removeObject();
            }
        })

        if(actionInput && actionInput.getAttribute("value") === 'view'){
            isView = true;
        }

        if (isView === true) {
            canvas.on('after:render', function() {
                if (!isRendered) {
                    isRendered = true;
                    canvas.getObjects().forEach((o) => {
                        o.selectable = false;
                    })
                }
            });
        }
    });

    function draw(imgData) {
        fabric.util.loadImage(imgData, function (img) {
            let oImg = new fabric.Image(img);
            oImg.scale(1).set({
                left: 0,
                top: 0,
                selectable: false
            });
            canvas.add(oImg);
            canvas.item(0).selectable = false;
        });
    }

    function addRect(e) {
        // console.log(canvas.offsetLeft, canvas.offsetTop, e);
        let max_id = maxRectId(canvas);
        let zoom = canvas.getZoom();
        let width = 100;
        let height = 100;
        const rect = new fabric.Rect({
            left: originX / zoom + canvas.width / 2 / zoom,
            top: originY / zoom + canvas.height / 2 / zoom,
            width: width,
            height: height,
            fill: "rgba(213,0,0,0.5)",
            rect_id: max_id + 1
        });
        rect.on('selected', () => {
            isTextHidden = false
        })
        rect.on('deselected', () => {
            isTextHidden = true
        })
        canvas.add(rect);
        canvas.renderAll();
    }

    function addText() {
        let activeRect = canvas.getActiveObject();
        const text = new fabric.Textbox('Текст' , {
            fontSize: 20,
            left: activeRect.left,
            top: activeRect.top,
            rect_id: activeRect.rect_id
        })
        text.on('deselected', () => {
            groupObjects(activeRect.rect_id);
        })
        canvas.setActiveObject(text);
        canvas.add(text);
        canvas.renderAll();
    }

    function editText() {
        let activeGroup = canvas.getActiveObject();
        activeGroup.destroy();
        let objects = activeGroup.getObjects();
        canvas.remove(activeGroup);
        canvas.add(...objects);
        activeGroup = null;
        canvas.requestRenderAll();
        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            if (obj instanceof fabric.Textbox) {
                canvas.setActiveObject(obj);
            }
        }
    }

    function groupObjects(rect_id) {
        let objects = canvas.getObjects();
        let group_objects = [];
        let group_index = 0;
        for (let i = 0; i < objects.length; i++) {
            let obj = objects[i];
            if ((obj instanceof fabric.Rect || obj instanceof fabric.Textbox) && obj.rect_id === rect_id){
                group_objects[group_index] = objects[i];
                group_index++;
            }
        }
        let group = new fabric.Group(group_objects, {
            cornerColor: 'white',
            rect_id: rect_id
        });
        group.on('deselected', () => {
            isEditTextHidden = true;
        })
        group.on('selected', () => {
            isEditTextHidden = false
            isTextHidden = true
        })
        canvas.add(group);
        clearCanvas(group_objects);
        canvas.requestRenderAll();
    }

    function clearCanvas(group_objects) {
        group_objects.forEach((o) => {
            canvas.remove(o);
        })
    }

    function showObjects() {
        console.log("OBJECT", canvas.getObjects());
        canvas.getObjects().forEach((o) => {
            o.selectable = false;
        })
    }

    // Удаление активного элемента
    function removeObject() {
        if (canvas.getActiveObject().type !== "image") {
            canvas.remove(canvas.getActiveObject());
        }
    }

    function isJsonString(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }
</script>
<div class="map">
    <!--    <div class="panel">-->
    <!--        <button on:click={addPolygon}>{!isAddElement ? "Добавить элемент" : "Завершить рисование"}</button>-->
    <!--    </div>-->
    <canvas bind:this={c} class="mapZone" id="mapka">
    </canvas>

    {#if (!isView)}
        <div class="panel">
            <i class="btn" on:click|self={addRect}>+ место</i>
            <i class="btn" on:click|self={removeObject}>- место</i>
            {#if !isTextHidden}
                <i hidden={isTextHidden} class="btn" on:click|self={addText}>Добавить описание</i>
            {/if}
            {#if !isEditTextHidden}
                <i hidden={isEditTextHidden} class="btn" on:click|self={editText}>Изменить описание</i>
            {/if}
            <i class="btn" on:click|self={showObjects}>Показать элемент</i>
        </div>
    {/if}
</div>

<style>
    .panel {
        position: absolute;
        z-index: 1000;
        width: max-content;
        height: auto;
        top: 0px;
        right: 0px;
        background: rgba(255, 255, 255, 0.9);
        padding: 5px 4px;
        border: 1px solid black;
        border-radius: 3px;
    }

    .btn {
        border: 1px solid black;
        background-color: #999999;
        color: white;
        padding: 1px 7px 6px 1px;
        display: inline-block;
        cursor: pointer;
    }

    .map {
        position: relative;
        flex-grow: 1;
    }

    .mapZone {
        flex-grow: 1;
    }
</style>