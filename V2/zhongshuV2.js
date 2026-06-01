

// 导入module模块
const module = require("./modules/module.js");
const plantTree = require("./modules/module_plantTree.js");
// const module = require("/storage/emulated/0/脚本/Hayday-Assistant/V2/modules/module.js");
// const plantTree = require("/storage/emulated/0/脚本/Hayday-Assistant/V2/modules/module_plantTree.js");

let config = module.config;
let configs = storages.create("config");

let gesturesFirstPos = [90, 270];
if (configs.get("selectedTree").text === "石榴树") {
    gesturesFirstPos = [280, 270];
}
//建议种植区域X:[340,900],Y:[120,600]

const Touch = (function () {

    function down(x, y) {
        shell(`input motionevent DOWN ${x} ${y}`, true);
        return 0;
    }

    function move(x, y) {
        shell(`input motionevent MOVE ${x} ${y}`, true);
    }

    function up(x, y) {
        x = x || 0;
        y = y || 0;
        shell(`input motionevent UP ${x} ${y}`, true);
    }

    function drag(fromX, fromY, toX, toY, holdMs, stepCount = 10) {
        const dx = (toX - fromX) / stepCount;
        const dy = (toY - fromY) / stepCount;

        down(fromX, fromY);

        for (let i = 1; i <= stepCount; i++) {
            move(0, fromX + dx * i, fromY + dy * i);
            sleep(16);
        }

        sleep(holdMs);

        up(0);
    }

    function dragPath(path, holdMs, steps = 10) {
        if (path.length < 2) return;

        let curX = path[0][0];
        let curY = path[0][1];
        down(curX, curY);

        for (let i = 1; i < path.length; i++) {
            const [tx, ty] = path[i];
            const dx = (tx - curX) / steps;
            const dy = (ty - curY) / steps;

            for (let s = 1; s <= steps; s++) {
                move(
                    0,
                    Math.round(curX + dx * s),
                    Math.round(curY + dy * s)
                );
                sleep(16);
            }

            curX = tx;
            curY = ty;
            move(0, curX, curY);

            if (holdMs[i] > 0) {
                sleep(holdMs[i]);
            }
        }

        up(0);
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
        toast("未进入购买菜单");
        return false;
    } else if (buyMenu === 1) {
        //点击购买按钮
        sleep(500);
    }

    // swipe(90 + module.ran(), 270 + module.ran(), land.x, land.y, 200);

    Touch.down(gesturesFirstPos[0] + module.ran(), gesturesFirstPos[1] + module.ran());
    sleep(50);

    Touch.move(800 + module.ran(), 400 + module.ran());
    sleep(500);
    // sleep(1000)

    Touch.move(land.x, land.y);
    // sleep(1000);

    Touch.up(land.x, land.y);
    return true;

}


function main() {
    try {
        module.createWindow();
    } catch (error) {
        console.error(error);
    }
    let treePosArr = storages.create("plantTreeInfo").get("treePos");
    if (!treePosArr) {
        toastLog("未获取到种植位置");
        exit();
    }

    if (!config.treeSearch) {
        while (true) {
            if (plantTree.setTreeText()) {
                break;
            }
            sleep(500);
        };
    } else {
        plantTree.buy_menu();
        sleep(2000)
    }

    //不知道为什么每次的第一次总是滑动不了,这里先预热一下,哈哈哈,绝了
    log("执行手势");
    Touch.down(90 + module.ran(), 570 + module.ran());
    sleep(50);

    Touch.move(800 + module.ran(), 400 + module.ran());
    sleep(500);
    // sleep(1000)

    Touch.move(90, 570);
    // sleep(1000);

    Touch.up(90, 570);
    log("执行手势完成");

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

