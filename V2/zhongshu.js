
//右35.25,17.6  下35.25,17.6


// 导入module模块
const module = require("./modules/module.js");
const plantTree = require("./modules/module_plantTree.js");

let config = module.config;



function findland_tree(findRange) {
    let range = findRange ? findRange : [410, 140, 860 - 410, 570 - 140];
    let methodNum = 1;
    //秋
    //第一种三点,1
    let land = module.findMC(["#b6c828", [-8, 8, "#99c015"], [10, 0, "#a3c31c"], [-6, 43, "#94bf11"], [-5, 61, "#8abb0b"], [58, 1, "#8fbf10"]], null, range, 10); //[410, 140, 860 - 410, 570 - 140]

    if (!land) {
        methodNum++;
        //第二种三点,2
        land = module.findMC(["#b8c827", [-8, 8, "#aac421"], [8, -2, "#b9c92b"], [-9, -2, "#8ebe10"], [0, 9, "#8ebe10"]], null, range, 9);
    }

    if (!land) {
        methodNum++;
        //小块白色地(鸭脚)，3
        land = module.findMC(["#c1d331", [-7, -1, "#ced834"], [-13, 5, "#dae03f"], [1, 11, "#cbd936"], [-13, -8, "#90be10"]], null, range, 16);
    }
    if (!land) {
        methodNum++;
        //小块白色地(圆圈)，4
        land = module.findMC(["#bcd439", [-5, -4, "#c6d32f"], [-8, -1, "#bdce2b"], [-4, 5, "#a2c323"], [8, 1, "#c1d530"], [-6, -19, "#8abd08"], [10, -13, "#89bd08"]], null, range, 16);
    }

    //春
    if (!land) {
        methodNum++;
        //第三种三点，5
        land = module.findMC(["#98c20e", [-8, 7, "#91bf0e"], [9, 0, "#93c010"], [-9, -3, "#8fbf08"], [2, -7, "#88bc08"], [-1, 8, "#88bf09"], [8, 5, "#88bc08"]], null, range, 2);
    }
    if (!land) {
        methodNum++;
        //小块白色地(鸭脚),6
        land = module.findMC(["#afe534", [1, 7, "#a4da2c"], [-5, 5, "#a9dd32"], [-7, 13, "#89bd09"]], null, range, 5);
    }
    if (!land) {
        methodNum++;
        //小块白色地(圆圈),7
        land = module.findMC(["#a8e22c", [-5, -4, "#b0e32f"], [-8, -1, "#a6de2b"], [-4, 5, "#9de12a"], [8, 1, "#b0e32f"], [-6, -19, "#89bd09"], [10, -13, "#88bc08"]], null, range, 5);
    }
    if (!land) {
        methodNum++;
    }
    log(methodNum);
    return land;
}



function plantTrees(pos) {
    sleep(500);
    let land = pos ? pos : findland_tree();
    log("找地结果", land);
    if (land) {
        module.showTip("找地结果: x:" + land.x + ", y:" + land.y);
    } else {
        module.showTip("未找到空地");
    }

    // log(plantTree.buy_menu());
    if (land && plantTree.buy_menu()) {
        swipe(90 + module.ran(), 270 + module.ran(), land.x, land.y, 200);
        return true;
    }
    return false;
}


function main() {
    try {
        module.createWindow();
    } catch (error) {
        console.error(error);
    }
    
    while (true) {
        if (plantTree.setTreeText()) {
            break;
        }
        sleep(500);
    };

    //设置滑动方向
    let right = 36;
    let down = 18;
    let shouldSwipe = "up";

    //找地范围[410, 140, 860 - 410, 570 - 140]  左上角x，左上角y，宽，高
    let searchRange = [410, 140, 860 - 410, 570 - 140];
    let firstPos = null;//每一行第一块地
    let lastPos = null;//上一块地
    let lastPos_1 = null;//中间变量
    let shouldSwitch = false; //是否换行
    let click_buy_botton_Num = 0; //点击购买按钮次数
    let plantFalseNum = 0; //种植失败次数

    //是否在范围内
    function inRange(Pos) {
        if (Pos && (searchRange[0] <= Pos.x && Pos.x <= searchRange[2] + searchRange[0]) && (searchRange[1] <= Pos.y && Pos.y <= searchRange[3] + searchRange[1])) {
            log(Pos, "在范围内");
            return true;
        } else {
            log(Pos, "不在范围内");
            return false;
        }
    }

    while (true) {

        //设定种植失败次数
        plantFalseNum = 0;
        click_buy_botton_Num = 0;

        //种植循环，十次未找到地就退出
        while (true) {

            if (plantFalseNum >= 10 || click_buy_botton_Num >= 5) break; //连续10次没有找到地，就退出，进行滑动

            if (plantTree.buy_menu() === 1) {
                click_buy_botton_Num++;
                log("点击购买按钮次数", click_buy_botton_Num);
                module.showTip("点击购买按钮次数", click_buy_botton_Num);
                // sleep(500);
                continue;
            }
            //如果要换行，有第一块地
            if (shouldSwitch && firstPos) {
                //如果下一行的地在范围内
                if (inRange({ x: firstPos.x, y: firstPos.y + down })) {
                    firstPos = findland_tree([firstPos.x - right * 0.5, firstPos.y + down * 1.5, right, down]);
                    log("换行找地结果", firstPos);
                    //如果找到第一块地
                    if (firstPos) {
                        plantFalseNum = 0;
                        click_buy_botton_Num = 0;
                        lastPos = firstPos;
                        log("换行，找第一块地", firstPos);
                        continue;
                    } else { //未找到第一块地
                        firstPos = null;
                        lastPos = null;
                        shouldSwitch = false;
                        log("换行，未找到第一块地");
                        continue;
                    }
                } else { //下一块地不在范围内
                    firstPos = null;
                    lastPos = null;
                    shouldSwitch = false;
                    log("换行，下一块地不在范围内");
                    continue;
                }
            }

            if (!lastPos) {
                //检测左边一列,如果找到地
                let findpos1 = findland_tree([700, 140, 900 - 700, 570 - 140])
                if (findpos1) {
                    plantFalseNum = 0;
                    click_buy_botton_Num = 0;
                    log("左边一列找到地", findpos1);
                    lastPos = findpos1;
                    firstPos = findpos1;
                    continue;
                } else {  //左边一列没有找到地，全部区域内找地
                    log("左边一列未找到地，全部区域内找地");
                    let findpos2 = findland_tree([410, 140, 600 - 410, 570 - 140]);
                    //如果找到地
                    if (findpos2) {
                        plantFalseNum = 0;
                        click_buy_botton_Num = 0;
                        log("全部区域内找到地", findpos2);
                        lastPos = findpos2;
                        firstPos = findpos2;
                        continue;
                    } else { //没有找到地
                        plantFalseNum++;
                        log("全部区域内未找到地，种植失败次数", plantFalseNum);
                        module.showTip("未找到地，失败次数" + plantFalseNum);
                        // sleep(500);
                        continue;
                    }
                }
            } else { //有上一块地
                //种树
                plantTrees(lastPos);
                //种完树，找下一块地，如果下一块地在范围内
                let nextPos = { x: lastPos.x + right, y: lastPos.y + down };
                if (inRange(nextPos)) {
                    log("找下一块地");
                    lastPos_1 = findland_tree([lastPos.x + right * 0.5, lastPos.y + down * 0.5, right, down]);
                    lastPos = lastPos_1 ? lastPos_1 : null;
                    log("找下一块地结果", lastPos);
                    continue;
                } else { //下一块地不在范围内
                    log("下一块地不在范围内，准备换行");
                    shouldSwitch = true;
                    lastPos = null;
                    continue;
                }
            }

        }
        //     if (!plantTrees()) {
        //         plantFalseNum++;
        //         log("种植失败次数", plantFalseNum);
        //     } else {
        //         plantFalseNum = 0;
        //     }
        // }



        //滑动
        // let isSwipe = true;  //是否滑动
        let isSwipe = config.treeShouldSwipe; //是否滑动
        if (isSwipe) {
            // log(plantTree.buy_menu(false))
            if (plantTree.buy_menu(false) == 2) {
                click(660 + module.ran(), 650 + module.ran())
            } else if (plantTree.buy_menu(false) == 3) {
                click(560 + module.ran(), 630 + module.ran())
            }
            sleep(500);
            //上滑
            if (shouldSwipe == "up") {
                log("上滑");
                module.showTip("上滑");
                swipe(640 + module.ran(), 360 + module.ran(), 640 - right * 10 + module.ran(), 360 + down * 10 + module.ran(), 1000);
                shouldSwipe = "down";
            } else if (shouldSwipe == "down") {
                log("下滑");
                module.showTip("下滑");
                swipe(640 + module.ran(), 360 + module.ran(), 640 + right * 10 + module.ran(), 360 - down * 10 + module.ran(), 1000);
                shouldSwipe = "right";
            } else if (shouldSwipe == "right") {
                log("右滑");
                module.showTip("右滑");
                swipe(640 + module.ran(), 360 + module.ran(), 640 - right * 10 + module.ran(), 360 - down * 10 + module.ran(), 1000);
                shouldSwipe = "up";
            }
            sleep(500);
        }

    }


}
main();


// while (true) {
// log(plantTree.buy_menu())
// sleep(1000)
// }
