

// 导入module模块
// const module = require("./modules/module.js");
// const plantTree = require("./modules/module_plantTree.js");
const module = require("/storage/emulated/0/脚本/Hayday-Assistant/V2/modules/module.js");
const plantTree = require("/storage/emulated/0/脚本/Hayday-Assistant/V2/modules/module_plantTree.js");

let config = module.config;


const Touch = (function () {

    const MAX_FINGERS = 10;

    let dev = null;
    let nextId = 1;
    const fingers = {}; // id -> trackingId

    const Screen = {
        WIDTH: 1280,
        HEIGHT: 720,

        /**
         * 竖屏逻辑坐标 → 横屏真实坐标
         */
        toLandscape(x, y) {
            // log(y, this.HEIGHT - x);
            return [this.HEIGHT - y, x];
        }
    };

    /* ========== 设备自动识别 ========== */
    function findTouchDevice() {
        const r = shell("getevent -p", true);
        if (r.code !== 0) return null;

        const lines = r.result.split("\n");

        for (let i = 0; i < lines.length; i++) {
            // ✅ 专门针对你这台模拟器
            if (lines[i].includes("Xiaomi Input")) {
                const m = lines[i - 1].match(/add device \d+: (.+)/);
                if (m) {
                    return m[1].replace(/"/g, "");
                }
            }
        }
        return null;
    }

    dev = findTouchDevice();
    if (!dev) throw new Error("未找到触摸设备");

    log("✅ 使用触摸设备:", dev);

    /* ========== 基础发送 ========== */
    function send(type, code, value) {
        shell(`sendevent ${dev} ${type} ${code} ${value}`, true);
    }

    function syn() {
        send(0, 0, 0);
    }

    /* ========== 工具 ========== */
    function allocTrackingId() {
        return nextId++;
    }

    /* ========== 对外 API ========== */

    /**
     * @param {number} x
     * @param {number} y
     * @returns {number} fingerId
     */
    function down(x, y) {
        [x, y] = Screen.toLandscape(x, y);
        const trackingId = allocTrackingId();
        const id = trackingId % MAX_FINGERS;

        fingers[id] = trackingId;

        send(3, 57, trackingId); // ABS_MT_TRACKING_ID
        send(3, 53, x);          // ABS_MT_POSITION_X
        send(3, 54, y);          // ABS_MT_POSITION_Y
        syn();

        return id;
    }

    /**
     * @param {number} id
     * @param {number} x
     * @param {number} y
     */
    function move(id, x, y) {
        [x, y] = Screen.toLandscape(x, y);
        if (!(id in fingers)) return;
        send(3, 57, fingers[id]);
        send(3, 53, x);
        send(3, 54, y);
        syn();
    }

    /**
     * @param {number} id
     */
    function up(id) {
        if (!(id in fingers)) return;
        send(3, 57, -1);
        syn();
        delete fingers[id];
    }

    /**
     * 按住拖拽 + 停留 + 继续拖
     */
    function drag(fromX, fromY, toX, toY, holdMs, stepCount = 10) {
        [fromX, fromY] = Screen.toLandscape(fromX, fromY);
        [toX, toY] = Screen.toLandscape(toX, toY);
        const dx = (toX - fromX) / stepCount;
        const dy = (toY - fromY) / stepCount;

        const id = down(fromX, fromY);

        for (let i = 1; i <= stepCount; i++) {
            move(id, fromX + dx * i, fromY + dy * i);
            sleep(16);
        }

        sleep(holdMs);

        up(id);
    }

    /**
 * 路径拖拽（支持任意点）
 * @param {number[][]} path [[x,y], [x,y], ...]
 * @param {number[]} holdMs 每个点后的停留时间
 * @param {number} steps 每段插值步数
 */
    function dragPath(path, holdMs, steps = 10) {
        [path[0][0], path[0][1]] = Screen.toLandscape(path[0][0], path[0][1]);
        for (let i = 1; i < path.length; i++) {
            [path[i][0], path[i][1]] = Screen.toLandscape(path[i][0], path[i][1]);
        }
        if (path.length < 2) return;

        let curX = path[0][0];
        let curY = path[0][1];
        const id = down(curX, curY);

        for (let i = 1; i < path.length; i++) {
            const [tx, ty] = path[i];
            const dx = (tx - curX) / steps;
            const dy = (ty - curY) / steps;

            for (let s = 1; s <= steps; s++) {
                move(
                    id,
                    Math.round(curX + dx * s),
                    Math.round(curY + dy * s)
                );
                sleep(16);
            }

            curX = tx;
            curY = ty;
            move(id, curX, curY);
            syn();

            if (holdMs[i] > 0) {
                sleep(holdMs[i]);
            }
        }

        up(id);
    }

    return {
        down,
        move,
        up,
        drag,
        dragPath
    };

})();

/**
 * 种植树木
 * @param {object} pos 种植位置
 * @returns {boolean} 返回true表示成功种植，false表示失败
 */
function plantTrees(pos) {
    sleep(500);
    let land = pos;
    log("种植位置", land);
    module.showTip("x:" + land.x + ", y:" + land.y);

    // log(plantTree.buy_menu());
    let buyMenu = plantTree.buy_menu();
    if (!buyMenu) {
        toast("未获取到购买菜单");
        return false;
    } else if (buyMenu === 1) {
        //点击购买按钮
        sleep(500);
    }

    // swipe(90 + module.ran(), 270 + module.ran(), land.x, land.y, 200);
    let id = Touch.down(90 + module.ran(), 270 + module.ran());
    sleep(50);

    Touch.move(id, 800 + module.ran(), 400 + module.ran());
    sleep(500);

    Touch.move(id, land.x, land.y);
    // sleep(10);

    Touch.up(id);
    return true;

}


function main() {
    try {
        module.createWindow();
    } catch (error) {
        console.error(error);
    }
    // let treePosArr = storages.create("plantTreeInfo").get("treePos");
    let treePosArr = [ { col: 0, row: 0, x: 630.9, y: 407.5 },
  { col: 0, row: 1, x: 595.9, y: 390 },
  { col: 0, row: 2, x: 560.9, y: 372.5 },
  { col: 1, row: 0, x: 665.9, y: 390 },
  { col: 1, row: 1, x: 630.9, y: 372.5 },
  { col: 1, row: 2, x: 595.9, y: 355 },
  { col: 2, row: 0, x: 700.9, y: 372.5 },
  { col: 2, row: 1, x: 665.9, y: 355 },
  { col: 2, row: 2, x: 630.9, y: 337.5 } ]
    if (!treePosArr) {
        toastLog("未获取到种植位置");
        exit();
    }

    while (true) {
        if (plantTree.setTreeText()) {
            break;
        }
        sleep(500);
    };

    for (let i = 0; i < treePosArr.length; i++) {
        let treePos = treePosArr[i];
        let success = plantTrees({ "x": treePos.x, "y": treePos.y });

        // sleep(1000);
    };

}
main();

    // while (true) {
    //     let success = plantTree.setTreeText();
    //     log(success);
    //     if (success) {
    //         break;
    //     }
    //     sleep(500);
    // };

