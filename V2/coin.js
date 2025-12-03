// 导入module模块
let module;
try {
    module = require("./module.js");
    if (!module) {
        throw new Error("模块导入结果为空");
    }
    console.log("模块导入成功");
} catch (error) {
    console.error("模块导入失败:", error);
    // 尝试重新导入
    try {
        // 清除缓存后重试
        delete require.cache[require.resolve("./module.js")];
        module = require("./module.js");
        if (!module) {
            throw new Error("重新导入模块结果为空");
        }
        console.log("模块重新导入成功");
    } catch (retryError) {
        console.error("重新导入模块失败:", retryError);
        // 可以在这里添加更多错误处理或退出程序
        toast("模块导入失败，请检查module.js文件");
        exit();
    }
}
// let module = require("/storage/emulated/0/脚本/卡通农场小助手/module.js");

//全局

let config = module.config;
let configs = storages.create("config");
let cangkuItemColor = module.cangkuItemColor;
let otherItemColor = module.otherItemColor;
let allItemColor = module.allItemColor;

// 启动自动点击权限请求
module.autoSc();

try {
    module.createWindow(config.showText);
} catch (error) {
    console.error("创建窗口失败:", error);
}

function main() {
    module.checkmenu();
    // module.switch_account("boooody0");
    while (true) {

        sleep(500)
        module.huadong();
        sleep(1200);
        while (!openshop()) { }
        let sellPlan = sell
        sellPlan = module.sellPlanValidate(sellPlan);
        if (sellPlan) {
            log("商店售卖计划:" + JSON.stringify(sellPlan))
            module.shop_sell(sellPlan, allItemColor, null, 2)
        }
        sleep(100)
        module.find_close();
        //这里账号名
        module.switch_account("111");


        module.openFriendMenu();
        sleep(500)
        click(550, 150)
        sleep(1000)

        //双击账号===========================这里坐标
        click(500, 450)
        sleep(100)
        click(500, 450)

        sleep(500)
        while (!friendButton()) { }


        module.huadong()
        sleep(1500)
        while (!openshop()) { }

        sleep(1000)
        gestures([0, 100, [250, 270]], [0, 100, [430, 270]], [0, 100, [620, 270]], [0, 100, [800, 270]], [0, 100, [990, 270]],
            [0, 100, [250, 470]], [0, 100, [430, 470]], [0, 100, [620, 470]], [0, 100, [800, 470]], [0, 100, [990, 470]]
        )
        //商店右滑
        sleep(1000)
        const [x1, y1] = [960, 390];
        const [x2, y2] = [288, 390];
        swipe(x1 + module.ran(), y1 + module.ran(), x2 + module.ran(), y2 + module.ran(), 1000);
        console.log("商店右滑")
        sleep(500)
        gestures([0, 100, [250, 270]], [0, 100, [430, 270]], [0, 100, [620, 270]], [0, 100, [800, 270]], [0, 100, [990, 270]],
            [0, 100, [250, 470]], [0, 100, [430, 470]], [0, 100, [620, 470]], [0, 100, [800, 470]], [0, 100, [990, 470]]
        )
        sleep(500)
        module.find_close();
        sleep(500)
        module.find_close();
        sleep(1000)
        module.checkmenu();
        //回来售卖
        sleep(500)
        module.huadong();
        sleep(1500);

        while (!openshop()) { }

        sellPlan = sell
        sellPlan = module.sellPlanValidate(sellPlan);
        if (sellPlan) {
            log("商店售卖计划:" + JSON.stringify(sellPlan))
            module.shop_sell(sellPlan, allItemColor, null, 0)
        }
        sleep(100)
        module.find_close();

        //切回大号买1金物品
        //这里账号
        module.switch_account("boooody0");

        sleep(1000);
        module.openFriendMenu();

        sleep(500)
        click(550, 150)
        sleep(1000)

        //双击账号===========================这里坐标
        click(500, 550)
        sleep(100)
        click(500, 550)

        sleep(500)
        while (!friendButton()) { }

        sleep(500)
        module.huadong()
        sleep(1500)
        while (!openshop()) { }

        sleep(1000)
        gestures([0, 100, [250, 270]], [0, 100, [430, 270]], [0, 100, [620, 270]], [0, 100, [800, 270]], [0, 100, [990, 270]],
            [0, 100, [250, 470]], [0, 100, [430, 470]], [0, 100, [620, 470]], [0, 100, [800, 470]], [0, 100, [990, 470]]
        )
        //商店右滑
        sleep(1000)

        swipe(x1 + module.ran(), y1 + module.ran(), x2 + module.ran(), y2 + module.ran(), 1000);
        console.log("商店右滑")
        sleep(500)
        gestures([0, 100, [250, 270]], [0, 100, [430, 270]], [0, 100, [620, 270]], [0, 100, [800, 270]], [0, 100, [990, 270]],
            [0, 100, [250, 470]], [0, 100, [430, 470]], [0, 100, [620, 470]], [0, 100, [800, 470]], [0, 100, [990, 470]]
        )
        sleep(500)
        module.find_close();
        sleep(500)
        module.find_close();
        sleep(1000)
        module.checkmenu();

    }
}

function friendButton() {
    while (true) {//点开好友栏
        let friendMenu = module.matchColor([{ x: 256, y: 542, color: "#ffcb42" },
        { x: 214, y: 591, color: "#c48f4c" }, { x: 265, y: 647, color: "#c48f4c" },
        { x: 302, y: 630, color: "#c48f4c" }, { x: 210, y: 672, color: "#ffbf1d" },
        { x: 262, y: 615, color: "#ca922b" }, { x: 430, y: 540, color: "#fff9db" }])
        if (friendMenu) {
            module.showTip("关闭好友栏");
            log("关闭好友栏")
            let friendButton = module.findMC(["#f0e0d6", [-2, -28, "#fbf5f4"],
                [-20, -10, "#a24801"], [7, 30, "#f3bf41"]]);
            if (friendButton) {
                log("点击好友按钮")
                click(friendButton.x + module.ran(), friendButton.y + module.ran());
                sleep(200);
            }
            else {
                //老板界面
                friendButton = module.findMC(["#fdf8f4", [5, 32, "#f2ded3"],
                    [-17, 18, "#a44900"], [11, 54, "#f7c342"],
                    [37, 26, "#a54b00"]]);
                if (friendButton) {
                    log("点击好友按钮")
                    click(friendButton.x + module.ran(), friendButton.y + module.ran());
                    sleep(200);
                }
            }
            return true;
        }
        sleep(1000)
    }

}

function openshop() {
    let maxAttempts = 2; // 最大尝试次数
    try {
        for (let i = 0; i < maxAttempts; i++) {
            let findshop_1 = findshop();
            if (findshop_1 === true) return true;
            if (findshop_1) {
                console.log("打开路边小店");
                module.showTip("打开路边小店");
                sleep(300);
                click(findshop_1.x + config.shopOffset.x + module.ran(), findshop_1.y + config.shopOffset.y + module.ran());
                sleep(100)
                if (module.matchColor([{ x: 120, y: 70, color: "#fc5134" }, { x: 177, y: 76, color: "#fefefd" }, { x: 263, y: 72, color: "#fd5335" }])) {

                    return true; // 成功找到并点击
                }
            }

            if (i < maxAttempts - 1) { // 如果不是最后一次尝试，就滑动重找
                console.log("未找到商店，尝试滑动重新寻找");
                module.showTip("未找到商店，尝试滑动重新寻找");
                sleep(1000);
                module.huadong();
                sleep(1200);
            }
        }
    } catch (error) {
        log(error);
    }
    console.log("多次尝试后仍未找到商店");
    module.showTip("多次尝试后仍未找到商店");
    return false; // 表示未能成功打开商店
};

function findshop(silence = false) {
    console.log("找" + config.landFindMethod);
    let center;
    for (let i = 0; i < 5; i++) {
        try {
            if (module.matchColor([{ x: 120, y: 70, color: "#fc5134" }, { x: 177, y: 76, color: "#fefefd" }, { x: 263, y: 72, color: "#fd5335" }])) {
                return true;
            }
            if (!silence) module.showTip("第 " + (i + 1) + " 次检测" + config.landFindMethod);
            if (config.landFindMethod == "商店") {
                center = module.findimage(files.join(config.photoPath, "shop.png"), 0.6);
                if (!center) {
                    center = module.findimage(files.join(config.photoPath, "shop1.png"), 0.6);
                };
            } else {
                center = module.findimage(files.join(config.photoPath, "bakery.png"), 0.6);
                if (!center) {
                    center = module.findimage(files.join(config.photoPath, "bakery1.png"), 0.6);
                };
            };
        } catch (error) {
            log(error);
        }
        if (center) break
        else {
            // find_close();
            sleep(500);
        }
    }
    if (center) {
        console.log("找到" + config.landFindMethod + "，坐标: " + center.x + "," + center.y,);
        // 找到面包房
        return center;
    } else {
        console.log("未找到" + config.landFindMethod);
        // 未找到面包房
        return false;
    }
}

let randomOffset = 5; // 随机偏移量
function ran() {
    return Math.random() * (2 * randomOffset) - randomOffset;
}

sell = [{ item: "紫色连衣裙", sellNum: -1, "done": true }]

main();

