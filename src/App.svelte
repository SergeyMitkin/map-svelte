<script>
    import {fabric} from "fabric";
    import {onMount} from 'svelte';

    let b;
    let imgData;
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
        b = document.getElementById("background_path");
        imgData = b.getAttribute("value");
        c = document.getElementById('mapka');
        c.width = window.innerWidth;
        c.height = window.innerHeight - 50; //50 на панельку
        canvas = new fabric.Canvas(c);
        canvas.selection = false;
        canvas.on('mouse:wheel', function (opt) {
            let delta = opt.e.deltaY;
            let zoom = canvas.getZoom();
            canvas.absolutePan({
                x: originX,
                y: originY
            });
            zoom *= 0.999 ** delta;
            if (zoom > 20) zoom = 20;
            if (zoom < 0.01) zoom = 0.01;
            canvas.zoomToPoint({x: opt.e.offsetX, y: opt.e.offsetY}, zoom);
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
                console.log(e.e.clientX, e.e.clientY);

                originX = originX + (lastX - curX);
                originY = originY + (lastY - curY);
                console.log(originX, originY);

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
        draw(imgData);
    });


    function draw(imgData) {
        fabric.util.loadImage(imgData, function (img) {
            let oImg = new fabric.Image(img);
            oImg.scale(1).set({
                left: 0,
                top: 0,
            });
            canvas.add(oImg);
            canvas.item(0).selectable = false;
        });

    }

    function addRect(e) {
        console.log(canvas.offsetLeft, canvas.offsetTop, e);
        let zoom = canvas.getZoom();
        const rect = new fabric.Rect({

            left: originX / zoom + canvas.width / 2 / zoom,
            top: originY / zoom + canvas.height / 2 / zoom,
            width: 50,
            height: 50,
            fill: "rgba(213,0,0,0.5)"
        });
        canvas.add(rect);
    }
    function showObjects(){
        console.log("OBJECT", canvas.getObjects());

    }
</script>
<div class="map">
    <!--    <div class="panel">-->
    <!--        <button on:click={addPolygon}>{!isAddElement ? "Добавить элемент" : "Завершить рисование"}</button>-->
    <!--    </div>-->
    <canvas bind:this={c} class="mapZone" id="mapka">
    </canvas>
    <div class="panel"><i class="btn" on:click|self={addRect}>+ место</i>
        <i class="btn" on:click|self={showObjects}>Показать элемент</i></div>
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