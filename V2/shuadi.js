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
let statistics = storages.create("statistics");
let configs = storages.create("config");



// 启动自动点击权限请求
module.autoSc();



function main() {
    if (config.accountMethod == "email" || config.switchAccount === false) {
        main_email();
    } else {
        main_save();
    }
}


function main_email() {

    if ((config.shengcang_h || config.shengcang_l) && !timeStorage.get("shengcangTime")) {
        module.timer("shengcangTime", config.shengcangTime * 60);
    }
    if (config.isCangkuStatistics && !timeStorage.get("cangkuStatisticsTime")) {
        module.timer("cangkuStatisticsTime", config.cangkuStatisticsTime * 60);
    }

    try {
        module.createWindow(config.showText);
    } catch (error) {
        console.error("创建窗口失败:", error);
    }

    //主界面判断
    sleep(100);
    module.checkmenu();
    sleep(500);
    if (!config.switchAccount || config.accountList.filter(Account => Account.done).length <= 1) { //不切换账号
        log("不切换账号，找耕地");
        module.huadong();
        sleep(500);

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
                }
            };
            module.operation(AccountConfig);
            log("等待作物成熟");

            //执行升仓
            if ((config.shengcang_h || config.shengcang_l) && config.shengcangTime >= 0 && !module.getTimerState("shengcangTime")) {
                module.shengcang();
                module.timer("shengcangTime", config.shengcangTime * 60);
            }
            //执行仓库统计
            if (config.isCangkuStatistics && config.cangkuStatisticsTime >= 0 && !module.getTimerState("cangkuStatisticsTime")) {
                //进行仓库统计
                let rawData = module.cangkuStatistics(config.cangkuStatisticsPage);
                //将仓库统计结果转换为表格数据
                let rawContentData = module.creatContentData("账号", rawData);
                //在表格前后加入标题，合计列
                let contentData = module.rawContentData2(rawContentData);
                //推送
                module.pushTo(contentData);
                module.timer("cangkuStatisticsTime", config.cangkuStatisticsTime * 60);
            }

            module.find_close();
            sleep(500);
            module.huadong();
            sleep(500);
            module.findland(false)

            while (true) {
                // 获取计时器剩余时间
                let timerState = module.getTimerState(config.selectedCrop.text);
                log(timerState);
                if (timerState) {
                    // 将秒数转换为分钟和秒
                    let minutes = Math.floor(timerState / 60);
                    let seconds = timerState % 60;
                    let timeText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
                    module.showTip(`${config.selectedCrop.text}成熟剩余${timeText}`);
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
        while (true) {

            //新建账号列表
            const doneAccountsList = config.accountList.filter(Account => Account.done === true);

            //是否升仓，是否仓库统计
            let shengcangForEach = false;
            let cangkuStatisticsForEach = false;

            //设定初始仓库数据
            let rawContentData = null;

            //判断是否需要升仓
            if ((config.shengcang_h || config.shengcang_l) && config.shengcangTime >= 0 && !module.getTimerState("shengcangTime")) {
                shengcangForEach = true;
                module.timer("shengcangTime", config.shengcangTime * 60);
            }
            //判断是否需要仓库统计
            if (config.isCangkuStatistics && config.cangkuStatisticsTime >= 0 && !module.getTimerState("cangkuStatisticsTime")) {
                cangkuStatisticsForEach = true;
                module.timer("cangkuStatisticsTime", config.cangkuStatisticsTime * 60);
            }
            doneAccountsList.forEach(Account => {
                if (timeStorage.get("nextAccountToChange") && timeStorage.get("nextAccountToChange") != Account.title) {
                    log("存储中存在下一个要切换的账号:" + timeStorage.get("nextAccountToChange"))
                    return;
                }

                module.switch_account(Account.title);
                log("============当前账号: " + Account.title + "============");
                module.huadong();

                // 计算下一个账号的信息
                let nextAccountIndex = (doneAccountsList.indexOf(Account) + 1) % doneAccountsList.length;
                let nextAccount = doneAccountsList[nextAccountIndex];
                let nextTimerName = nextAccount.title + "计时器";
                timeStorage.put("nextAccountToChange", nextAccount.title);

                module.operation(Account); //执行刷地，售卖

                //升仓
                if (shengcangForEach) {
                    module.shengcang(); //执行升仓
                }
                //仓库统计
                if (cangkuStatisticsForEach) {
                    //执行仓库统计
                    let rawData = module.cangkuStatistics(config.cangkuStatisticsPage);
                    //将仓库统计结果转换为表格数据
                    rawContentData = module.creatContentData(`账号${Account.title}`, rawData, rawContentData);
                }
                while (true) {
                    // 获取下一个账号的计时器状态
                    let nextTimerState = module.getTimerState(nextTimerName);

                    if (!nextTimerState) {
                        // 如果下一个计时器不存在，直接跳出循环
                        break;
                    }

                    // 显示下一个计时器的状态
                    let minutes = Math.floor(nextTimerState / 60);
                    let seconds = nextTimerState % 60;
                    let timeText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
                    module.showTip(`账号:${nextAccount.title} ${config.selectedCrop.text}成熟剩余${timeText}`);

                    if (!nextTimerState) {
                        break;
                    }
                    sleep(1000);
                }
                sleep(1100);
            });

            try {
                module.showDetails(module.getDetails(), { x: 0.4, y: 0.8 }, 3000)
            } catch (error) {
                console.error("showDetails error:", error);
            }
            ;
            if (cangkuStatisticsForEach && rawContentData) {
                //在表格前后加入标题，合计列
                let contentData = module.rawContentData2(rawContentData);
                //推送
                module.pushTo(contentData);
            }
        }

    }

}

function main_save() {

    let appExternalDir = context.getExternalFilesDir(null).getAbsolutePath();
    /**
 * 复制应用内的storage.xml和storage_new.xml文件到指定目录
 * @param {string} name 存档名称，用于创建子目录
 * @param {string} direction 操作方向，"export"导出或"import"导入，默认"export"
 * @returns {boolean} 全部文件导入或导出成功返回true，失败返回false
 */
    function copy_shell(name, direction = "export") {
        let sourcePath1 = "/data/data/com.supercell.hayday/shared_prefs/storage.xml";
        let sourcePath2 = "/data/data/com.supercell.hayday/shared_prefs/storage_new.xml";
        let saveDir = files.join(appExternalDir + "/卡通农场小助手存档", name);
        let savePath1 = files.join(saveDir, "storage.xml");
        let savePath2 = files.join(saveDir, "storage_new.xml");

        // 确保目标目录存在
        files.ensureDir(saveDir + "/1");

        if (direction === "export") {
            // 导出：从应用目录复制到存档目录
            console.log("正在导出文件..." + name);

            // 使用cp命令复制第一个文件
            let command1 = `cp "${sourcePath1}" "${savePath1}"`;
            let result1 = shell(command1, true);

            if (result1.code === 0) {
                console.log("storage.xml 文件导出成功");
            } else {
                console.log("storage.xml 文件导出失败: " + result1.error);
            }

            // 使用cp命令复制第二个文件
            let command2 = `cp "${sourcePath2}" "${savePath2}"`;
            let result2 = shell(command2, true);

            if (result2.code === 0) {
                console.log("storage_new.xml 文件导出成功");
            } else {
                console.log("storage_new.xml 文件导出失败: " + result2.error);
            }

            // 检查两个文件是否都复制成功并返回结果
            if (result1.code === 0 && result2.code === 0) {
                console.log("所有文件导出成功");
                return true;
            } else {
                console.log("部分文件导出失败");
                return false;
            }
        } else if (direction === "import") {
            // 导入：从存档目录复制到应用目录
            console.log("正在导入文件..." + name);

            // 使用cp命令复制第一个文件
            let command1 = `cp "${savePath1}" "${sourcePath1}"`;
            let result1 = shell(command1, true);

            if (result1.code === 0) {
                console.log("storage.xml 文件导入成功");
            } else {
                console.log("storage.xml 文件导入失败: " + result1.error);
            }

            // 使用cp命令复制第二个文件
            let command2 = `cp "${savePath2}" "${sourcePath2}"`;
            let result2 = shell(command2, true);

            if (result2.code === 0) {
                console.log("storage_new.xml 文件导入成功");
            } else {
                console.log("storage_new.xml 文件导入失败: " + result2.error);
            }

            // 检查两个文件是否都复制成功并返回结果
            if (result1.code === 0 && result2.code === 0) {
                console.log("所有文件导入成功");
                return true;
            } else {
                console.log("部分文件导入失败");
                return false;
            }
        } else {
            console.log("参数错误：direction 参数必须是 'export' 或 'import'");
            return false;
        }
    }

    /**
     * 查找下一个账号
     * @returns {string} 下一个账号的名称
     * 会更改存储中的nextAccountToChange和currentAccount
     */
    function findNextAccount() {
        // 获取当前账号
        let account = timeStorage.get("currentAccount");

        //新建账号列表
        const doneAccountsList = config.saveAccountList.filter(account => account.done === true);

        // 计算下一个账号的信息
        let currentIndex = -1;
        if (account) {
            if (typeof account === 'object') {
                // 处理对象类型的账号
                currentIndex = doneAccountsList.findIndex(acc => acc.title === account.title);
            } else {
                // 处理字符串类型的账号
                currentIndex = doneAccountsList.findIndex(acc => acc.title === account);
            }
        }
        // 如果没找到当前账号，则默认使用第一个账号
        if (currentIndex === -1 && doneAccountsList.length > 0) {
            currentIndex = 0;
            account = doneAccountsList[0].title; // 更新account为第一个账号的标题
        }
        let nextAccountIndex = (currentIndex + 1) % doneAccountsList.length;
        let nextAccount = doneAccountsList[nextAccountIndex];
        timeStorage.put("nextAccountToChange", nextAccount.title);
        return nextAccount.title; // 返回下一个账号的名称
    }

    /**
     * 复制账号文件，如果失败则尝试下一个账号
     * @param {string} account 账号名称
     * @returns {string|null} 成功复制的账号名称，如果全部失败则返回null
     */
    function copyAccountWithRetry(account) {
        // 如果复制账号文件失败，则尝试下一个账号，直到复制成功或完成一轮
        let copyResult = copy_shell(account, "import"); // 复制账号文件
        let originalAccount = account;
        let attempts = 0;
        const maxAttempts = config.saveAccountList.filter(acc => acc.done === true).length;

        while (!copyResult && attempts < maxAttempts) {
            console.log("复制账号文件失败，尝试下一个账号...");
            account = findNextAccount(); // 获取下一个账号
            console.log("尝试账号: " + account);
            copyResult = copy_shell(account, "import"); // 尝试复制下一个账号的文件
            attempts++;

            // 如果回到原始账号，说明已经尝试了一轮
            if (account === originalAccount) {
                break;
            }
        }

        if (!copyResult) {
            console.log("所有账号都复制失败了");
            return null;
        } else {
            console.log("成功复制账号文件: " + account);
            timeStorage.put("currentAccount", account); // 更新当前账号
            return account;
        }
    }

    // 新建账号列表
    const doneAccountsList = config.saveAccountList.filter(account => account.done === true);

    if ((config.shengcang_h || config.shengcang_l) && !timeStorage.get("shengcangTime")) {
        module.timer("shengcangTime", config.shengcangTime * 60);
    }
    if (config.isCangkuStatistics && !timeStorage.get("cangkuStatisticsTime")) {
        module.timer("cangkuStatisticsTime", config.cangkuStatisticsTime * 60);
    }

    while (true) {

        //操，这玩意报错，查半天
        // if (ui["tip_window"]) {
        //     module.closeWindow();
        // }

        //是否升仓，是否仓库统计
        let shengcangForEach = false;
        let cangkuStatisticsForEach = false;

        //设定初始仓库数据
        let rawContentData = null;

        //判断是否需要升仓
        if ((config.shengcang_h || config.shengcang_l) && config.shengcangTime >= 0 && !module.getTimerState("shengcangTime")) {
            shengcangForEach = true;
            module.timer("shengcangTime", config.shengcangTime * 60);
        }
        //判断是否需要仓库统计
        if (config.isCangkuStatistics && config.cangkuStatisticsTime >= 0 && !module.getTimerState("cangkuStatisticsTime")) {
            cangkuStatisticsForEach = true;
            module.timer("cangkuStatisticsTime", config.cangkuStatisticsTime * 60);
        }

        doneAccountsList.forEach(currentAccount => {

            let stop_result = shell("am force-stop " + "com.supercell.hayday", true);
            if (stop_result.code === 0) {
                console.log("使用am force-stop命令成功停止应用");
                toast("卡通农场已停止运行");
            } else {
                console.log("am force-stop命令执行失败: " + stop_result.error);
            }

            copyAccountWithRetry(currentAccount.title); // 复制账号文件
            sleep(1000);
            launch("com.supercell.hayday"); // 启动应用
            sleep(1000);
            try {
                if (!ui["tip_window"]) {
                    module.createWindow(config.showText);
                }
            } catch (error) {
                console.error("创建窗口失败:", error);
            }
            log("============当前账号: " + currentAccount.title + "============");

            // 计算下一个账号的信息
            let nextAccountIndex = (doneAccountsList.indexOf(currentAccount) + 1) % doneAccountsList.length;
            let nextAccount = doneAccountsList[nextAccountIndex];
            let nextTimerName = nextAccount.title + "计时器";
            timeStorage.put("nextAccountToChange", nextAccount.title);
            log("下一个账号: " + nextAccount.title + ", 计时器名称: " + nextTimerName);


            //主界面判断
            sleep(100);
            module.checkmenu();
            sleep(500);

            module.huadong();

            module.operation(currentAccount); //执行刷地，售卖

            //升仓
            if (shengcangForEach) {
                module.shengcang(); //执行升仓
            }
            //仓库统计
            if (cangkuStatisticsForEach) {
                //执行仓库统计
                let rawData = module.cangkuStatistics(config.cangkuStatisticsPage);
                //将仓库统计结果转换为表格数据
                rawContentData = module.creatContentData(`账号${currentAccount.title}`, rawData, rawContentData);
            }
            while (true) {
                // 获取下一个账号的计时器状态
                let nextTimerState = module.getTimerState(nextTimerName);

                if (!nextTimerState) {
                    // 如果下一个计时器不存在，直接跳出循环
                    break;
                }

                // 显示下一个计时器的状态
                let minutes = Math.floor(nextTimerState / 60);
                let seconds = nextTimerState % 60;
                let timeText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
                module.showTip(`账号:${nextAccount.title} ${config.selectedCrop.text}成熟剩余${timeText}`);

                if (!nextTimerState) {
                    break;
                }
                sleep(1000);
            }
            sleep(1100);

            try {
                module.showDetails(module.getDetails(), { x: 0.4, y: 0.8 }, 3000)
            } catch (error) {
                console.error("showDetails error:", error);
            }

            if (cangkuStatisticsForEach && rawContentData) {
                //在表格前后加入标题，合计列
                let contentData = module.rawContentData2(rawContentData);
                //推送
                module.pushTo(contentData);
            }

        })
    }


}





main()