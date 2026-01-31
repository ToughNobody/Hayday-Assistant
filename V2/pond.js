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
let timeStorage = storages.create("times");
let configs = storages.create("config");

// 启动自动点击权限请求
module.autoSc();

try {
    module.createWindow(config.showText);
} catch (error) {
    console.error("创建窗口失败:", error);
}


function main() {
    sleep(100);
    module.checkmenu();
    sleep(500);

    if (!configs.get("switchAccount", false)) {
        log("不切换账号")
        //循环操作

        while (true) {
            let AccountConfig = {
                "title": "",
                "done": true,
                "tomFind": {
                    "enabled": config.tomFind.enabled,
                    "type": config.tomFind.type,
                    "code": config.tomFind.code,
                    "text": config.tomFind.text
                },
                "pond": {
                    "enabled": true,
                    "name": config.pond.name,
                    "ponds": config.pond.ponds
                },
                "honeycomb": {
                    "enabled": true,
                    "name": config.honeycomb.name,
                    "addFlower": config.honeycomb.addFlower
                }
            };
            module.pond_operation(AccountConfig);
            sleep(1000);
            module.find_close();

            while (true) {
                // 获取计时器剩余时间
                let timerState = module.getTimerState("鱼塘计时器");
                log(timerState);
                if (timerState) {
                    // 将秒数转换为分钟和秒
                    let minutes = Math.floor(timerState / 60);
                    let seconds = timerState % 60;
                    let timeText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
                    module.showTip(`鱼塘剩余时间${timeText}`);
                }
                if (!timerState) {
                    break;
                }
                sleep(1000);
            }

        }
    }

    //切换账号
    else {
        log("切换账号");
        //新建账号列表
        const doneAccountsList = config.accountList.filter(account => account.done === true);
        let nextAccount = null;
        while (true) {
            doneAccountsList.forEach(account => {
                //存在下一个账号，且下一个账号不是当前账号
                if (nextAccount && nextAccount !== account.title) {
                    log("下一个账号:" + nextAccount, "当前账号:" + account.title, ",返回")
                    return;
                }
                nextAccount = null;

                module.switch_account(account.title);
                log("============当前账号: " + account.title + "============");

                log("执行" + account.title + "账号的鱼塘操作")

                let accountList_config
                let account_config

                if (config.switchAccount) {
                    accountList_config = configs.get("account_config", null);
                    account_config = accountList_config.find(item => item.title === account.title)
                } else {
                    account_config = account
                }

                try {
                    module.pond_operation(account_config);
                } catch (error) {
                    log("执行" + account.title + "账号的鱼塘操作失败:", error);
                }

                // 获取所有账号信息，找出时间最短的账号
                let shortestTime = Infinity;

                // 遍历所有账号，找出鱼塘计时器剩余时间最短的账号
                for (let acc of doneAccountsList) {

                    let accountPondTime = module.getTimerState(acc.title + "鱼塘计时器");

                    if (accountPondTime === null) {
                        log("账号" + acc.title + ",未执行过，执行")
                        nextAccount = acc.title
                        break;
                    }

                    // 有计时器的账号
                    if (typeof (accountPondTime) === "number" && accountPondTime < shortestTime) {
                        log("账号" + acc.title + ",计时器剩余时间: " + accountPondTime)
                        shortestTime = accountPondTime;
                        nextAccount = acc.title;
                    }
                }

                let isLaunchGame = false;
                let isStopGame = false;
                while (true) {

                    // 获取时间最短账号的计时器剩余时间
                    let nextPondtime = nextAccount ? module.getTimerState(nextAccount + "鱼塘计时器") : null;
                    if (!nextPondtime) break;

                    if (nextPondtime && nextPondtime <= 60 && !isLaunchGame) {
                        log("剩余时间小于60秒,启动游戏")
                        module.showTip("剩余时间小于60秒,启动游戏");
                        launch("com.supercell.hayday");
                        isLaunchGame = true;

                    }
                    if (nextPondtime && nextPondtime > 60 && !isStopGame) {
                        isStopGame = true;
                        home();
                    }
                    if (nextPondtime) {
                        let hours = Math.floor(nextPondtime / 3600);
                        let minutes = Math.floor(nextPondtime / 60) % 60;
                        let seconds = nextPondtime % 60;
                        let timeText = hours > 0 ? `${hours}时${minutes}分${seconds}秒` : minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
                        let details = `鱼塘休息最短剩余时间: ${timeText}，账号: ${nextAccount}`;
                        log(details);
                        module.showTip(details);
                    }
                    if (!nextPondtime) {
                        break;
                    }
                    sleep(1000);
                }
            })
        }
    }

}

main();

