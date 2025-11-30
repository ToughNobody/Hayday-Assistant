// 导入module模块
const module = require("./module.js");

//全局

let config = module.config;
const doneAddFriendsList = config.addFriendsList.filter(account => account.addFriendsdone === true);

// 启动自动点击权限请求
module.autoSc();

try {
    module.createWindow({ x: 0, y: 0.65 });
} catch (error) {
    console.error("创建窗口失败:", error);
}

function duihuakuang() {
    try {
        let duihua = module.matchColor([{ x: 536, y: 125, color: "#f4eada" },
        { x: 1151, y: 149, color: "#f4ebde" }, { x: 517, y: 506, color: "#f3e7c7" },
        { x: 1166, y: 502, color: "#f3e8c8" }]);
        if (duihua) {
            click(850, 400);
            return true;
        } else return false;
    } catch (error) {
        console.error("duihuakuang函数出错:", error);
        return false;
    }
}

function clickDuihua() {
    try {
        let isfind = false;
        let num = 0;
        maxNum = 4;
        while (num < maxNum) {
            num++;
            module.showTip("检查对话框，第" + num + "次")
            log("检查对话框，第" + num + "次")
            if (duihuakuang()) {
                isfind = true;
                num = 0;
                sleep(500);
            }
            sleep(500);
        };
        return isfind;
    } catch (error) {
        console.error("clickDuihua函数出错:", error);
    }
}


function inputAge() {
    try {
        let ageMenu = null;
        for (let i = 0; i < 5; i++) {
            module.showTip(`检测输入年龄界面，第${i + 1}次`);
            log(`检测输入年龄界面，第${i + 1}次`);
            ageMenu = module.matchColor([{ x: 515, y: 115, color: "#81481a" },
            { x: 586, y: 221, color: "#fec128" }, { x: 746, y: 515, color: "#6bb852" },
            { x: 530, y: 509, color: "#de4e4e" }])
            if (ageMenu) break;
            sleep(1000);
        }
        if (ageMenu) {
            module.showTip("输入年龄");
            log("输入年龄");
            click(640, 240);
            sleep(200);
            click(640, 240);
            sleep(200);
            click(740, 510);
        }
    } catch (error) {
        console.error("inputAge函数出错:", error);
    }
};


function findArrow(isClick = true, posY = 35, maxNum = 30) {
    try {
        let arrow = null;
        let num = 0;
        let pos = null;
        module.showTip("找箭头");
        log("找箭头");
        // 尝试查找两种箭头
        const arrowPatterns = [
            ["#ffe903", [-13, -16, "#fff8b1"], [-7, -19, "#fff8b1"], [-3, -24, "#fff8b2"],
                [15, -23, "#fff27d"], [3, -27, "#fff8b2"], [-10, -38, "#ffef66"],
                [-12, -62, "#ffe903"], [-16, -86, "#ffe903"], [13, -86, "#ffe903"], [6, -69, "#ffe903"]],
            ["#ffea13", [-16, -18, "#fff8ae"], [-9, -32, "#fff388"], [7, -34, "#fff7a8"],
                [6, -21, "#fff69c"], [18, -23, "#fff17b"], [9, -12, "#ffed4f"]]
        ];

        // 持续查找直到找到箭头
        while (!arrow && num < maxNum) {
            arrow = module.findMC(arrowPatterns[0], null, null, 16) ||
                module.findMC(arrowPatterns[1], null, null, 5);
            sleep(100);
            num++;
            if (arrow) {
                num = 0;
                pos = { x: arrow.x, y: arrow.y + posY };
                if (isClick) click(pos.x, pos.y);
                sleep(500)
                continue;
            }
            continue;
        }
        return pos;
    } catch (error) {
        console.error("findArrow函数出错:", error);
        return null;
    }
}

function findSickle() {
    try {
        let arrow = null;
        while (true) {
            arrow = module.findMC(["#a0863d", [27, 5, "#ffeb88"],
                [7, -65, "#ffffff"], [-19, 10, "#ceb868"], [70, 27, "#ffeb88"],
                [39, -72, "#f1f1f3"]], null, null, 5);
            if (arrow) break;
            sleep(100);
        }
        let pos = { x: arrow.x, y: arrow.y };
        return pos;
    } catch (error) {
        console.error("findSickle函数出错:", error);
        return null;
    }
}


function harvestAll(center) {
    try {
        module.showTip("执行手势");
        log("执行手势");
        const safe = (x, y) => [
            Math.max(0, Math.min(x, 1280 - 1)),
            Math.max(0, Math.min(y, 720 - 1))
        ];
        // gestures([0, 3000, [pos.x, pos.y], [safe(pos.x)]],
        //     [0, 3000, [pos.x, pos.y], []]
        // )
        // 参数检查
        if (!center) {
            console.log("错误：center坐标无效");
            return;
        }

        //重复次数
        let rows = 3;

        let center_land = center;
        // 定义偏移量
        // 左移
        const L = {
            x: 6 * -36,
            y: 0
        };
        // 右移
        const R = {
            x: -L.x,
            y: -L.y
        };
        // 换行
        const S = {
            x: 0,
            y: 10 * -18
        };

        let pos1 = [200, 80];
        let pos2 = -150; // Y轴偏移量
        // 安全坐标计算
        let pos_land = {
            x: center_land.x + pos1[0],
            y: center_land.y + pos1[1]
        }
        // log(pos_land, center_land, pos1)
        let harvestTime = 5 * 1000;

        // 构建第一组手势路径
        let firstGroup = [0, harvestTime, safe(center.x, center.y), safe(pos_land.x, pos_land.y),
            safe(50, 700), safe(1200, 650),
            safe(50, 550), safe(1200, 500),
            safe(50, 400), safe(1200, 300),
        ];

        // 构建第二组手势路径（Y偏移）
        let secondGroup = [0, harvestTime, safe(center.x, center.y), safe(pos_land.x, pos_land.y + pos2),
            safe(50, 700 + pos2), safe(1200, 650 + pos2),
            safe(50, 550 + pos2), safe(1200, 500 + pos2),
            safe(50, 400 + pos2), safe(1200, 300 + pos2),
        ];

        // 执行手势
        // log(firstGroup, secondGroup)
        gestures(firstGroup, secondGroup);
    } catch (error) {
        console.error("harvestAll函数出错:", error);
    }
}

function plantCrop(color) {
    try {
        let crop = null;
        while (true) {
            crop = module.findMC(color, null, null, 16);
            if (crop) break;
            sleep(100);
        };
        harvestAll(crop);
        return crop;
    } catch (error) {
        console.error("plantCrop函数出错:", error);
        return null;
    }
}

function clickBuy_Menu(color) {
    try {
        module.showTip("检测买鸡界面");
        log("检测买鸡界面");
        let num = 0;
        while (num < 10) {
            if (module.matchColor(color)) {
                click(65, 650)
                return true;
            }
            num++;
            sleep(500);
        }
    } catch (error) {
        console.error("clickBuy_Menu函数出错:", error);
    }
}


function buyMenu_buy(buyNum, pos, pos0 = [106, 193]) {
    try {
        let buy = null;
        let tryNum = 0;
        module.showTip("购买");
        log("购买");
        for (let i = 0; i < buyNum; i++) {
            while (tryNum < 3) {
                buy = module.matchColor([{ x: 172, y: 50, color: "#deb473" }, { x: 197, y: 108, color: "#ffc225" },
                { x: 498, y: 52, color: "#d4a367" }]);
                if (buy) break;
                tryNum++;
                sleep(500);
            }
            swipe(pos0[0], pos0[1], pos[0], pos[1], 500);
            sleep(1000);
        }
    } catch (error) {
        console.error("buyMenu_buy函数出错:", error);
    }
}

function buy(buyNum, pos, pos0 = [106, 193]) {
    click(65, 650)
    // module.showTip("检测到");
    buyMenu_buy(buyNum, pos, pos0);
}

function levelup() {
    let levelup = null;
    let num = 0;
    while (num < 10) {
        levelup = module.matchColor([{ x: 292, y: 98, color: "#ffffff" },
        { x: 520, y: 93, color: "#88e435" },
        { x: 754, y: 89, color: "#89e534" },
        { x: 861, y: 654, color: "#f6bc3a" },
        { x: 1076, y: 627, color: "#00b7ff" }]);
        sleep(500);
        num++;
    }
    if (levelup) {
        module.showTip("升级了");
        log("升级了");
        click(640, 630);
    }
}

function findJiaSuBtn() {
    module.showTip("寻找加速按钮");
    log("寻找加速按钮");
    let jiasu = null;
    let num = 0;
    while (num < 15) {
        let sc = captureScreen();

        // 尝试查找两种加速按钮
        const patterns = [
            ["#ffffff", [-86, 58, "#ffffff"], [-195, 59, "#ffffff"], [-80, 30, "#1966af"], [-445, 32, "#ffffff"]],
            ["#fcfaf8", [33, 24, "#fab402"], [-25, 14, "#f8be02"], [70, -5, "#fffbdd"], [-1, -27, "#fffffd"], [5, 57, "#fffff6"]]
        ];

        for (let pattern of patterns) {
            jiasu = module.findMC(pattern, sc);
            if (jiasu) {
                module.showTip("找到加速按钮")
                log("找到加速按钮")
                num = 0; // 重置计数器
                sleep(300);
                click(jiasu.x, jiasu.y);
                break; // 找到并点击后退出当前循环
            }
        }

        sleep(100);
        num++;
    }
}

function zhizuo(color) {
    module.showTip("拖动");
    log("拖动");
    let zhizuo = null;
    let num = 0;
    while (num < 10) {
        zhizuo = module.findMC(color);
        if (zhizuo) {
            swipe(zhizuo.x, zhizuo.y, zhizuo.x + 80, zhizuo.y + 200, 500);
            break;
        }
        sleep(500);
        num++;
    }
}

function dingdan() {
    module.showTip("卡车订单");
    log("卡车订单");
    let dingdan = null;
    let num = 0;
    while (num < 10) {
        dingdan = module.matchColor([{ x: 491, y: 74, color: "#ddb374" },
        { x: 805, y: 70, color: "#d4a66b" }, { x: 1098, y: 158, color: "#fcd05c" },
        { x: 1132, y: 54, color: "#ec404b" }]);
        if (dingdan) break;
        sleep(1000);
        num++;
    }
    click(1060, 610);
    return true;
}

function fangke() {
    module.showTip("访客");
    log("访客");
    let fangke = null;
    let num = 0;
    while (num < 10) {
        fangke = module.matchColor([{ x: 182, y: 627, color: "#52e17e" },
        { x: 602, y: 95, color: "#f4ead7" }, { x: 1094, y: 106, color: "#f4eada" },
        { x: 615, y: 540, color: "#f6c749" }, { x: 1149, y: 542, color: "#f7b531" }]);
        if (fangke) break;
        sleep(500);
        num++;
    }
    click(870, 630);
}

function friendMenu() {
    let friendMenu = null;
    let num = 0;
    while (num < 10) {
        friendMenu = module.matchColor([{ x: 256, y: 542, color: "#ffcb42" },
        { x: 214, y: 591, color: "#c48f4c" }, { x: 265, y: 647, color: "#c48f4c" },
        { x: 302, y: 630, color: "#c48f4c" }, { x: 210, y: 672, color: "#ffbf1d" },
        { x: 262, y: 615, color: "#ca922b" }, { x: 430, y: 540, color: "#fff9db" }])
        if (friendMenu) break;
        sleep(500);
        num++;
    }
    if (friendMenu) {
        click(450, 610);
    }
}

function shopMenu() {
    try {
        let shopMenu = null;
        sleep(1000);
        shopMenu = module.matchColor([{ x: 84, y: 143, color: "#ff3b25" },
        { x: 153, y: 135, color: "#fffbd5" }, { x: 247, y: 139, color: "#ff3420" },
        { x: 313, y: 137, color: "#fffbd6" }, { x: 1076, y: 64, color: "#eb3f49" },
        { x: 1176, y: 197, color: "#b14b1e" }])
        if (shopMenu) {
            module.showTip("买买买");
            log("买买买");
            gestures([0, 100, [450, 260]],
                [0, 100, [640, 260]],
                [0, 100, [830, 260]],
                [0, 100, [450, 470]],
                [0, 100, [640, 470]],
                [0, 100, [830, 470]]);
        } else {
            findArrow()
            sleep(1000);
            module.showTip("买买买");
            log("买买买");
            gestures([0, 100, [450, 260]],
                [0, 100, [640, 260]],
                [0, 100, [830, 260]],
                [0, 100, [450, 470]],
                [0, 100, [640, 470]],
                [0, 100, [830, 470]]);
        }
    } catch (error) {
        console.error("shopMenu函数出错:", error);
    }
}

function inputName() {
    try {
        log("农场起名");
        module.showTip("查找起名界面");
        let name = null;
        let num = 0;
        while (num < 10) {
            log("第" + num + "次查找起名界面");
            name = module.findMC(["#81481a", [-87, -80, "#deb578"],
                [296, -65, "#d5a468"], [339, 84, "#fec128"],
                [-88, 72, "#fec128"], [33, 168, "#979797"]]);
            if (name) break;
            sleep(500);
            num++;
        }
        if (name) {
            module.showTip("起个响亮的名字");
            log("起个响亮的名字");
            click(name.x, name.y);
            sleep(500);
            setText("新号");
            sleep(500);
            click(630, 340);
        } else {
            log("没有找到起名界面");
        }
    } catch (error) {
        console.error("inputName函数出错:", error);
    }
}


function jiazai() {
    try {
        let jiazai = null;
        let tiaoguo = null;
        let num = 0;
        module.showTip("检测加载页面");
        log("检测加载页面");
        while (num < 10) {
            let sc = captureScreen();
            //检测加载界面新手教程动画右下角的跳过按钮
            tiaoguo = module.matchColor([{ x: 1001, y: 622, color: "#ffffff" },
            { x: 1025, y: 625, color: "#ffffff" }, { x: 1012, y: 627, color: "#f6be3e" },
            { x: 1036, y: 623, color: "#f6ca4d" }], sc);
            if (tiaoguo) {
                click(1100, 620);
                num = 0;
                continue;
            }

            jiazai = module.matchColor([{ x: 438, y: 565, color: "#fcffa2" },
            { x: 409, y: 550, color: "#85cbec" }, { x: 418, y: 585, color: "#c4e3e8" },
            { x: 867, y: 546, color: "#7ec8ed" }, { x: 861, y: 587, color: "#c7e3e8" }], sc);
            if (!jiazai && num > 3) {
                sleep(4000)
                break
            };
            sleep(1000);
            num++;
        }
    } catch (error) {
        console.error("jiazai函数出错:", error);
    }
}


function findGLG() {
    try {
        let glg = null;
        let num = 0;
        let pos = null;
        module.showTip("找格雷格");
        log("找格雷格");
        // 尝试查找两种
        const Patterns = [
            ["#742f34", [-12, -24, "#ca7233"], [-12, -13, "#b3816c"]],
            ["#7d3439", [-2, -25, "#e39845"], [-5, -38, "#ebb7a2"]]
        ];

        // 持续查找直到找到格雷格
        while (num < 5) {
            glg = module.findMC(Patterns[0]) ||
                module.findMC(Patterns[1]);
            sleep(1000);
            num++;
            if (glg) {
                num = 0;
                pos = { x: glg.x, y: glg.y };
                module.showTip("点击格雷格");
                log("点击格雷格");
                click(pos.x, pos.y);
                // log(pos)
                sleep(2000);
                if (clickDuihua()) break;
                continue;
            }
            continue;
        }
        return pos;
    } catch (error) {
        console.error("findGLG函数出错:", error);
        return null;
    }
}

function main() {
    try {
        sleep(1000);
        jiazai();
        clickDuihua();
        sleep(1000);
        //输入年龄
        inputAge();
        sleep(1000);
        findArrow();
        sleep(1000);
        harvestAll(findSickle());
        sleep(1000);
        findArrow();
        sleep(1000);
        plantCrop(["#ffef14", [9, -32, "#d59b08"], [-8, 20, "#b56000"], [-32, 28, "#f3c107"], [29, 30, "#ffdf7c"]]);
        sleep(1000);
        //买鸡
        buy(2, [860, 310]);
        levelup()
        sleep(1000);
        buy(1, [888, 320]);
        findJiaSuBtn();
        sleep(2000);
        //买耕地
        buy(1, [640, 320]);
        sleep(500);
        buyMenu_buy(1, [730, 350]);
        sleep(500);
        buyMenu_buy(1, [560, 360]);
        sleep(500);
        //种玉米
        findArrow();
        sleep(1000);
        plantCrop(["#f8e605", [49, 31, "#ffdf7c"], [-31, 35, "#8f9504"], [33, -30, "#f8ef02"], [-17, -9, "#a5a905"]]);
        findJiaSuBtn();
        sleep(1000);
        //收玉米
        findArrow();
        sleep(1000);
        harvestAll(findSickle());
        sleep(2000);
        //做饲料
        findArrow()
        sleep(1000);
        zhizuo(["#ffffff", [-50, 26, "#d3ab83"], [1, 27, "#ff655a"], [35, -7, "#d1a87f"], [-5, -13, "#ff5949"]]);
        sleep(500);
        findJiaSuBtn();
        //升级
        levelup();
        sleep(1000);
        findArrow();
        sleep(500);
        plantCrop(["#ffffff", [-50, 26, "#d3ab83"], [1, 27, "#ff655a"], [35, -7, "#d1a87f"], [-5, -13, "#ff5949"]])
        sleep(500);
        findJiaSuBtn();
        if (!plantCrop(["#ffec51", [-2, -26, "#aa5b16"], [60, 22, "#ffef8c"],
            [76, 38, "#ffef8c"], [-22, 2, "#f6c539"]])) {
            findArrow();
            sleep(1000);
            plantCrop(["#ffec51", [-2, -26, "#aa5b16"], [60, 22, "#ffef8c"],
                [76, 38, "#ffef8c"], [-22, 2, "#f6c539"]]);
        }
        sleep(1000);
        clickDuihua();
        //点击卡车订单面板
        findArrow(true, 100);//订单
        dingdan();
        clickDuihua();
        sleep(2000);
        //点击卡车
        findArrow(true, 50);
        sleep(500);
        //升级
        levelup();
        sleep(3000);
        //买面包房
        buy(1, [870, 370], [300, 200]);
        findJiaSuBtn();
        sleep(4000);
        findArrow();
        //做面包
        zhizuo(["#d09516", [40, 48, "#ffef8c"],
            [68, 66, "#ffef8c"], [24, -20, "#dcac18"], [-18, 46, "#d89e17"]]);
        findJiaSuBtn();
        sleep(5000);
        clickDuihua();
        sleep(1000);
        //访客
        fangke();
        sleep(500);
        findArrow(true, 100);//订单
        dingdan();
        sleep(500);
        levelup();
        sleep(9000);
        //格雷格
        if (!findGLG()) {
            gestures([0, 100, [630, 377]],
                [0, 100, [630, 377]],
                [0, 100, [830, 260]],
                [0, 100, [838, 375]],
                [0, 100, [735, 434]],
                [0, 100, [712, 305]],
                [0, 100, [818, 437]]);
        }
        clickDuihua();
        findArrow(true, 80);//点击好友按钮
        friendMenu();
        sleep(1500);
        //到格雷格的农场
        jiazai()
        clickDuihua();
        //点击商店
        sleep(500);
        findArrow();
        shopMenu();
        sleep(500);
        click(1080, 65);
        //退出商店，一段画面移动
        sleep(2000);
        clickDuihua();
        findArrow();
        sleep(1000);
        click(1000, 420);
        sleep(1000);
        findArrow();
        //点击home按钮，回到农场
        click(50, 645);
        sleep(1000);
        //检测加载界面
        jiazai();
        //起名
        clickDuihua();
        inputName()
        clickDuihua()
        if (doneAddFriendsList.length) {
            let nameMap = doneAddFriendsList.map(item => {
                return item.addFriendstitle
            });
            module.addFriends(nameMap);
            sleep(1000);
            //点击叉号
            click(1115, 90);
            sleep(1000);
            click(1222, 466);
        }
        module.showTip("完成");
        sleep(2000);
    } catch (error) {
        console.error("main函数出错:", error);
    }
}


main()



