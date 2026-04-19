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



try {
    module.createWindow(config.showText);
} catch (error) {
    console.error("创建窗口失败:", error);
}


/**
 * 获取账号时间
 * @param {Array} AccountNameArray - 账号名称数组
 * @returns {Object} - 包含账号名称、定时器类型和时间的对象 {
                    accountName: AccountName,
                    timerType: timerType,
                    time: timerState
                }
 */
function getAccountTime(AccountNameArray) {
    let timerResults = [];
    const timerTypes = ["鱼塘计时器", "蜂糖计时器", "Tom计时器"];

    for (let AccountName of AccountNameArray) {
        for (let timerType of timerTypes) {
            //排除未雇佣汤姆的账号
            if (timerType == "Tom计时器" && timeStorage.get(AccountName + "TomIsWork") == null) {
                continue;
            }
            let timerState = module.getTimerState(AccountName + timerType);
            log(`${AccountName}${timerType}: ${timerState}`);

            let timerTypeName = ["鱼塘", "蜂蜜", "汤姆"];
            if (timerState !== undefined && timerState !== null) {
                timerResults.push({
                    accountName: AccountName,
                    timerName: timerTypeName[timerTypes.indexOf(timerType)],
                    timerType: timerType,
                    time: timerState
                });
            }
        }
    }
    log(timerResults);

    if (timerResults.length === 0) {
        return null;
    }

    timerResults.sort((a, b) => a.time - b.time);
    log(timerResults);
    return timerResults[0];
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
            module.initAllTimers([AccountConfig]);


            try {
                if (config.tomFind.enabled && AccountConfig.tomFind.enabled) {
                    module.tomOperation(AccountConfig);
                }
            } catch (error) {
                toastLog(error)
            }

            try {
                if (config.honeycomb.enabled && AccountConfig.honeycomb.enabled) {
                    module.honeycomb_operation(AccountConfig);
                }
            } catch (error) {
                toastLog(error)
            }

            try {
                if (config.pond.enabled && AccountConfig.pond.enabled) {
                    module.pond_operation(AccountConfig);
                }
            } catch (error) {
                toastLog(error)
            }

            sleep(1000);
            module.find_close();

            // 获取计时器剩余时间
            let timerInfo = getAccountTime([AccountConfig.title]);
            log(timerInfo);
            let timerType = timerInfo.timerType;

            while (true) {
                // 获取计时器剩余时间
                let timerState = module.getTimerState(AccountConfig.title + timerType);
                if (timerState) {
                    // 将秒数转换为分钟和秒
                    let minutes = Math.floor(timerState / 60);
                    let seconds = timerState % 60;
                    let timeText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
                    module.showTip(`${timerInfo.accountName} ${timerInfo.timerType}剩余时间${timeText}`);
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
        log(doneAccountsList);
        const doneAccountTitles = doneAccountsList.map(account => account.title);
        const filteredAccounts = configs.get("account_config", []).filter(item => doneAccountTitles.includes(item.title));
        log(filteredAccounts);
        module.initAllTimers(filteredAccounts);
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

                log("执行" + account.title)

                let accountList_config
                let account_config

                if (config.switchAccount) {
                    accountList_config = configs.get("account_config", null);
                    account_config = accountList_config.find(item => item.title === account.title)
                } else {
                    account_config = account
                }

                try {
                    if (config.tomFind.enabled && account_config.tomFind.enabled) {
                        module.tomOperation(account_config);
                    }
                } catch (error) {
                    toastLog(error)
                }

                try {
                    if (config.honeycomb.enabled && account_config.honeycomb.enabled) {
                        module.honeycomb_operation(account_config);
                    }
                } catch (error) {
                    toastLog(error)
                }

                try {
                    if (config.pond.enabled && account_config.pond.enabled) {
                        module.pond_operation(account_config);
                    }
                } catch (error) {
                    toastLog(error)
                }

                let AccountNameArray = doneAccountsList.map(account => account.title);
                let timerInfo = getAccountTime(AccountNameArray);
                if (!timerInfo) {
                    log("计时数组为空,执行下一个账号")
                    return;
                }
                log(timerInfo);
                let timerType = timerInfo.timerType;
                nextAccount = timerInfo.accountName;


                let isLaunchGame = false;
                let isStopGame = false;
                while (true) {

                    // 获取时间最短账号的计时器剩余时间
                    let nextTime = module.getTimerState(nextAccount + timerType);
                    if (!nextTime) break;

                    if (nextTime && nextTime <= 60 && !isLaunchGame) {
                        log("剩余时间小于60秒,启动游戏")
                        module.showTip("剩余时间小于60秒,启动游戏");
                        launch("com.supercell.hayday");
                        isLaunchGame = true;

                    }
                    if (nextTime && nextTime > 60 && !isStopGame) {
                        isStopGame = true;
                        home();
                    }
                    if (nextTime) {
                        let hours = Math.floor(nextTime / 3600);
                        let minutes = Math.floor(nextTime / 60) % 60;
                        let seconds = nextTime % 60;
                        let timeText = hours > 0 ? `${hours}时${minutes}分${seconds}秒` : minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
                        let details = `${timerInfo.accountName} ${timerInfo.timerType}剩余时间${timeText}`;
                        log(details);
                        module.showTip(details);
                    }
                    if (!nextTime) {
                        break;
                    }
                    sleep(1000);
                }
            })
        }
    }

}

main();