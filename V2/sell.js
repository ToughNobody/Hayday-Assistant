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
// let cangkuItemColor = module.cangkuItemColor;
let allItemColor = module.allItemColor;

let timeStorage = storages.create("times");
let statistics = storages.create("statistics");
let configs = storages.create("config");

// 启动自动点击权限请求
module.autoSc();

try {
    module.createWindow(config.showText);
} catch (error) {
    console.error("创建窗口失败:", error);
}

let sell_accountList = configs.get("sell_accountList");

//主界面判断
sleep(100);
module.checkmenu();
sleep(500);
// config.accountList.filter(account => account.done).length <= 1
if (sell_accountList[0].done || sell_accountList.filter(account => account.done).length == 0) { //不切换账号
    log("不切换账号");

    //清粉丝
    if (configs.get("clearFans")) {
        module.clearFans();
        sleep(500);
    }
    
    //加好友
    if (sell_accountList[0].addFriend && sell_accountList[0].addFriend.trim() !== "") {
        let addFriendsList = sell_accountList[0].addFriend.split(",");
        module.addFriends(addFriendsList);
    }

    module.find_close();
    sleep(500);
    module.find_close();

    module.huadong();
    sleep(1200);
    while (!module.openshop()) { }

    let sellPlan = module.sellPlanValidate(sell_accountList[0].sellPlan);
    if (sellPlan) {
        log("商店售卖计划:" + JSON.stringify(sellPlan))
        module.shop_sell(sellPlan, allItemColor, null, sell_accountList[0].price)
    }
    sleep(100)
    module.close();

} else {
    log("切换账号");
    sell_accountList.filter(account => account.account !== "当前" && account.done).forEach(account => {

        module.switch_account(account.account);
        log("============当前账号: " + account.account + "============");

        //清粉丝
        if (configs.get("clearFans")) {
            module.clearFans();
            sleep(500);
        }
        //加好友
        if (account.addFriend && account.addFriend.trim() !== "") {
            let addFriendsList = account.addFriend.split(",");
            module.addFriends(addFriendsList);
        }

        module.find_close();
        sleep(500);
        module.find_close();

        module.huadong();
        sleep(1200);
        while (!module.openshop()) { }

        let sellPlan = module.sellPlanValidate(account.sellPlan);
        if (sellPlan) {
            log("商店售卖计划:" + JSON.stringify(sellPlan))
            module.shop_sell(sellPlan, allItemColor, null, account.price)
        }
        sleep(100)
        module.close();

    })
}
