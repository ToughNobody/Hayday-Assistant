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
            module.find_close()
            module.huadong()
            module.tomOperation();
            log("执行汤姆")
            // timeStorage.put("Tom计时器",10)

            let tomIsWorkName = "TomIsWork"
            let tom_isWork = timeStorage.get(tomIsWorkName) !== null;//是否在工作
            if (!tom_isWork) {
                log("没有雇佣汤姆,3秒后退出")
                module.showTip("没有雇佣汤姆,3秒后退出");
                sleep(3000);
                home();
                exit();
            }

            let isLaunchGame = false;
            let isStopGame = false;
            while (true) {
                // 获取计时器剩余时间
                let tomTime = module.getTimerState("Tom计时器");
                if (tomTime <= 60) {
                    if (!isLaunchGame) {
                        log("剩余时间小于60秒,启动游戏")
                        module.showTip("剩余时间小于60秒,启动游戏");
                        launch("com.supercell.hayday");
                        isLaunchGame = true;
                    }
                }

                if (tomTime && tomTime > 60 && !isStopGame) {
                    isStopGame = true;
                    home();
                }

                if (tomTime) {
                    let hours = Math.floor(tomTime / 3600);
                    let minutes = Math.floor(tomTime / 60) % 60;
                    let seconds = tomTime % 60;
                    let timeText = hours > 0 ? `${hours}时${minutes}分${seconds}秒` : minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
                    let details = `汤姆休息剩余时间: ${timeText}`;
                    module.showTip(details);
                }

                if (!tomTime) {
                    break;
                }
                sleep(1000);
            }
        }
    }
    else {
        log("切换账号")

        //新建账号列表
        const doneAccountsList = config.accountList.filter(account => account.done === true);
        let nextAccount = null;
        while (true) {
            doneAccountsList.forEach(account => {
                let tomIsWorkName = account.title + "TomIsWork"
                let tom_isWork = timeStorage.get(tomIsWorkName) !== null;//是否在工作
                if (!tom_isWork) {
                    log(account.title + "账号" + account.title + "没有雇佣汤姆")
                    module.showTip(account.title + "账号" + account.title + "没有雇佣汤姆");
                    return
                }

                //存在下一个账号，且下一个账号不是当前账号
                if (nextAccount && nextAccount !== account.title) {
                    log("下一个账号:" + nextAccount, "当前账号:" + account.title, ",返回")
                    return;
                }
                nextAccount = null;

                module.switch_account(account.title);
                log("============当前账号: " + account.title + "============");

                module.huadong()
                log("执行" + account.title + "账号的汤姆")
                module.tomOperation(account.title);

                // 获取所有账号信息，找出时间最短的账号
                let shortestTime = Infinity;

                // 遍历所有账号，找出汤姆计时器剩余时间最短的账号
                for (let acc of doneAccountsList) {

                    let accountTomTime = module.getTimerState(acc.title + "Tom计时器");
                    let accountTomIsWorkName = acc.title + "TomIsWork"
                    let accountTom_isWork = timeStorage.get(accountTomIsWorkName) !== null;//是否在工作

                    if (!accountTom_isWork) {
                        log(acc.title + "账号" + acc.title + "没有雇佣汤姆,跳过")
                        continue;
                    }

                    if ((timeStorage.get(accountTomIsWorkName) === undefined) && accountTomTime === null) {
                        log("账号" + acc.title + ",未执行过，执行")
                        nextAccount = acc.title
                        break;
                    }

                    // 有计时器的账号
                    if (typeof (accountTomTime) === "number" && accountTomTime < shortestTime) {
                        log("账号" + acc.title + ",计时器剩余时间: " + accountTomTime)
                        shortestTime = accountTomTime;
                        nextAccount = acc.title;
                    }
                }

                let isLaunchGame = false;
                let isStopGame = false;
                while (true) {
                    // 获取时间最短账号的计时器剩余时间
                    let nextTomtime = nextAccount ? module.getTimerState(nextAccount + "Tom计时器") : null;
                    if (!nextTomtime) break;

                    if (nextTomtime && nextTomtime <= 60 && !isLaunchGame) {
                        log("剩余时间小于60秒,启动游戏")
                        module.showTip("剩余时间小于60秒,启动游戏");
                        launch("com.supercell.hayday");
                        isLaunchGame = true;

                    }
                    if (nextTomtime && nextTomtime > 60 && !isStopGame) {
                        isStopGame = true;
                        home();
                    }
                    if (nextTomtime) {
                        let hours = Math.floor(nextTomtime / 3600);
                        let minutes = Math.floor(nextTomtime / 60) % 60;
                        let seconds = nextTomtime % 60;
                        let timeText = hours > 0 ? `${hours}时${minutes}分${seconds}秒` : minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
                        let details = `汤姆休息最短剩余时间: ${timeText}，账号: ${nextAccount}`;
                        log(details);
                        module.showTip(details);
                    }
                    if (!nextTomtime) {
                        break;
                    }
                    sleep(1000);
                }
            })
        }
    }
}

main();