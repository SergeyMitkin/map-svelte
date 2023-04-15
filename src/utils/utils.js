import {fabric} from "fabric";

export function maxRectId(canvas) {
    let max_id = 0;
    canvas.getObjects().forEach((o)=>{
        if ((o instanceof fabric.Group || o instanceof fabric.Rect)
            && typeof o.rect_id !== 'undefined' && o.rect_id > max_id)
        {
            max_id = o.rect_id;
        }
    })
    return max_id;
}

export function isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}