<script>
    import {fabric} from "fabric";
    import {onMount} from 'svelte';
    import {maxRectId} from "./utils/utils";
    import {isJsonString} from "./utils/utils";

    let isTextHidden = true;
    let isEditTextHidden = true;

    let canvasGroup = document.getElementById("canvas-wrap");
    let actionInput = document.getElementById("action");
    let isView = false; // Режим просмотра/редактирования
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
    let isVis = false;
    // let idVisibleText = 0;

    // $: idVisibleText

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
        if(actionInput && actionInput.getAttribute("value") === 'view'){
            isView = true;
        }

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
            if (e.target && e.target.selectable === false) {
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
            let rect_id = 0;
            canvas.loadFromJSON(jsonData, canvas.renderAll.bind(canvas), function(o, object) {
                // В режиме просмотра и для фона отключается возможность выбора
                if (isView === true || object.type === "image") {
                    object.selectable = false;
                }

                if (object.type === 'rect' || object.type === 'group') {
                    rect_id++;
                    object.rect_id = rect_id;

                    if (object.type === 'rect') {
                        object.on('selected', () => {
                            isTextHidden = false
                        })
                        object.on('deselected', () => {
                            isTextHidden = true
                        })
                    }
                    else if (object.type === 'group') {
                        object.cornerColor = 'white'
                        object.on('deselected', () => {
                            isEditTextHidden = true;
                        })
                        object.on('selected', () => {
                            isEditTextHidden = false
                            isTextHidden = true
                        })

                        object.getObjects().forEach((o) => {
                            o.rect_id = rect_id
                            if (o.type === 'textbox') {
                                o.on('deselected', () => {
                                    groupObjects(o.rect_id);
                                })
                                // o.visible = false
                            }
                        });

                        // object.on('mouseover', (e) => {
                        //     object.destroy();
                        //     let objects = object.getObjects();
                        //     canvas.remove(objects);
                        //     canvas.add(...objects);
                        //     for(let i = 0; i < objects.length; i++) {
                        //         if (objects[i].type === 'textbox') {
                        //             objects[i].visible = true;
                        //         }
                        //     }
                        //     objects = null;
                        //     groupObjects(object.rect_id);
                        //     canvas.requestRenderAll();
                        // })
                    }
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
        let text = new fabric.Textbox('Текст' , {
            fontSize: 20,
            left: activeRect.left,
            top: activeRect.top,
            rect_id: activeRect.rect_id
        })
        text.on('deselected', () => {
            groupObjects(activeRect.rect_id);
            text.opacity = 0
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
                obj.opacity = 1;
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
            rect_id: rect_id,
        });

        group.on('deselected', () => {
            isEditTextHidden = true;
            console.log('deselected');
        })

        group.on('selected', () => {
            isEditTextHidden = false
            isTextHidden = true
            let text_r = group.getObjects('textbox')[0];
            let text_v = text_r.text;
            let text_a = new fabric.Textbox(text_v , {
                fontSize: 20,
                left: group.left,
                top: group.top,
                rect_id: group.rect_id
            })
            text_a.on('deselected', () => {
                groupObjects(text_a.rect_id);
                text_a.opacity = 0
            })
            group.remove(text_r);
            group.addWithUpdate(text_a);
        })
        // group.on('mouseover', () => {
            // group.getObjects('textbox')[0].opacity = 1
            //
            // console.log(group.getObjects('textbox')[0]);
            // canvas.renderAll();
            // group.destroy();
            // let objects = group.getObjects();
            // canvas.remove(objects);
            // canvas.add(...objects);
            // for(let i = 0; i < objects.length; i++) {
            //     if (objects[i].type === 'textbox') {
            //         objects[i].opacity = 1;
            //     }
            // }
            // objects = null;
            // groupObjects(group.rect_id);
            // canvas.requestRenderAll();

            // canvas.renderAll();
            // group.destroy();
            // let objects = group.getObjects();
            // canvas.remove(objects);
            // canvas.add(...objects);
            // for(let i = 0; i < objects.length; i++) {
            //     if (objects[i].type === 'textbox') {
            //         objects[i].visible = true;
            //     }
            // }
            // objects = null;
            // groupObjects(group.rect_id);
            // canvas.requestRenderAll();
        // })
        // group.on('mouseout', () => {
            // console.log('out');
        // })
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
    }

    // Удаление активного элемента
    function removeObject() {
        if (canvas.getActiveObject().type !== "image") {
            canvas.remove(canvas.getActiveObject());
        }
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
                <i class="btn" on:click|self={addText}>Добавить описание</i>
            {/if}
            {#if !isEditTextHidden}
                <i class="btn" on:click|self={editText}>Изменить описание</i>
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