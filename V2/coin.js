
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

//全局
let config = module.config;
let configs = storages.create("config");
let cangkuItemColor = module.cangkuItemColor;
let otherItemColor = module.otherItemColor;
let allItemColor = module.allItemColor;

//改此处============================

照片文件夹 = config.coin_picDirPath

let 主号 = config.coin_mainAccount;
let 主号农场名 = config.coin_mainAccount_picName   //照片名称

let 小号 = config.coin_subAccount;
let 小号农场名 = config.coin_subAccount_picName     //照片名称

let 导金币物品 = config.coin_item   

//==================================

sell = [{ item: 导金币物品, sellNum: -1, "done": true }]

//1  365
//2  450
//3  550
//4  640


// let 大号点小号 = { x: 500, y: 640 };
// let 小号点大号 = { x: 500, y: 450 };


// let module = require("/storage/emulated/0/脚本/卡通农场小助手/module.js");

// 启动自动点击权限请求
module.autoSc();

try {
    module.createWindow(config.showText);
} catch (error) {
    console.error("创建窗口失败:", error);
}

// configs.put("findAccountMethod","ocr")


function main() {
    module.checkmenu();
    module.switch_account(主号);
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
        module.switch_account(小号);


        module.openFriendMenu();
        sleep(500)
        click(550, 150)
        sleep(1000)

        //双击账号===========================这里坐标
        findFriend(主号农场名)

        sleep(500)
        while (!friendButton()) { module.close() }


        module.huadong()
        sleep(1500)
        while (!openshop()) { }

        sleep(1000)
        gestures([0, 100, [250, 270]], [0, 100, [430, 270]], [0, 100, [620, 270]], [0, 100, [800, 270]], [0, 100, [990, 270]],
            [0, 100, [250, 470]], [0, 100, [430, 470]], [0, 100, [620, 470]], [0, 100, [800, 470]], [0, 100, [990, 470]]
        )
        //商店右滑
        sleep(1000)
        if (module.matchColor([{ x: 332, y: 64, color: "#dfb57a" },
        { x: 1119, y: 67, color: "#ed424d" }, { x: 1120, y: 109, color: "#f3c341" },
        { x: 629, y: 407, color: "#ffeb3e" }, { x: 1091, y: 252, color: "#fff9db" },
        { x: 923, y: 599, color: "#f6b633" }])) {
            toastLog("倒金币完成")
            engines.myEngine().forceStop();
        }
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

        module.switch_account(主号);

        sleep(1000);
        module.openFriendMenu();

        sleep(500)
        click(550, 150)
        sleep(1000)

        //双击账号
        findFriend(小号农场名)

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
        module.close();
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
                if (module.inShop()) {

                    return true; // 成功找到并点击
                }
            }

            if (i < maxAttempts - 1) { // 如果不是最后一次尝试，就滑动重找
                console.log("未找到商店，尝试滑动重新寻找");
                module.showTip("未找到商店，尝试滑动重新寻找");
                module.close();
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
            if (module.inShop()) {
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

function findFriend(Account) {
    const MAX_SCROLL_DOWN = 5; // 最多下滑5次

    let found = false; // 是否找到目标
    let scrollDownCount = 0; // 当前下滑次数
    let isEnd = false;
    let AccountIma = null;

    AccountIma = files.join(照片文件夹, Account + ".png");
    log("账号图片路径：" + AccountIma);
    module.showTip("");
    while (!found) {
        sleep(500);

        let addFriendMenu = module.matchColor([{ x: 146, y: 84, color: "#f4da4e" },
        { x: 132, y: 106, color: "#fefdfc" }, { x: 346, y: 45, color: "#dfb479" },
        { x: 1109, y: 76, color: "#f34853" }])
        if (!addFriendMenu) {
            module.openFriendMenu();
            sleep(500)
            click(550, 150)
            sleep(1000)
        }

        let is_find_Account = null;

        is_find_Account = module.findimage(AccountIma, 0.9);

        if (is_find_Account) { //如果找到账号名称，则点击
            log(`找到账号${Account}`);
            // module.showTip(`找到账号${Account}`);
            sleep(500);
            click(is_find_Account.x + module.ran(), is_find_Account.y + module.ran());
            sleep(300);
            click(is_find_Account.x + module.ran(), is_find_Account.y + module.ran());
            sleep(300)
            click(is_find_Account.x + module.ran(), is_find_Account.y + module.ran());
            sleep(500);
            found = true;
            break;
        }
        if (scrollDownCount < MAX_SCROLL_DOWN) {
            swipe(600, 630, 600, 350, 1000); // 下滑
            scrollDownCount++;
            log(`未找到账号，第 ${scrollDownCount} 次下滑...`);
            // module.showTip(`未找到账号，第 ${scrollDownCount} 次下滑...`);
            sleep(1500);

            continue;
        }

        else if (scrollDownCount >= MAX_SCROLL_DOWN) {
            log(`未找到账号，上滑回顶部...`);
            // module.showTip("未找到账号，上滑回顶部");
            swipe(600, 350, 600, 630, 300);
            sleep(500)
            swipe(600, 350, 600, 630, 300);
            sleep(500)
            scrollDownCount = 0;
        }
    }
    return;
}



main();

