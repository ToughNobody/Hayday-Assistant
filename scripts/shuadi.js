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

//设定分辨率
let ScreenSize = config.deviceScreenSize;
let Size = ScreenSize.split("×").map(Number).sort((a, b) => b - a);
// setScreenMetrics(Size[0], Size[1]);
// 设计稿参数
const designWidth = 2664, designHeight = 1200;

// 目标设备参数
const targetWidth = Size[0];
const targetHeight = Size[1];
/**
 * 基于density原始值的坐标转换
 * @param {number} x 设计稿x坐标（基于2664×1200分辨率）
 * @param {number} y 设计稿y坐标
 * @param {number} [baseDensity=524] 设计稿的density原始值
 */
function adapt(x, y) {


    // 1. 仅分辨率缩放
    const xScaled = x * (targetWidth / designWidth);//0.48
    const yScaled = y * (targetHeight / designHeight);//0.6

    return [Math.round(xScaled), Math.round(yScaled)];
}


// 启动自动点击权限请求
module.autoSc();



function main() {
    if (config.accountMethod == "email") {
        main_email();
    } else {
        main_save();
    }
}


function main_email() {

    if (config.isShengcang && !timeStorage.get("shengcangTime")) {
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
    sleep(1000);
    module.checkmenu();
    sleep(500);
    if (!config.switchAccount || config.accountList.filter(account => account.done).length <= 1) { //不切换账号
        log("不切换账号，找耕地");
        module.huadong();
        sleep(1100);

        //循环操作
        while (true) {
            module.operation();
            log("等待作物成熟");

            //执行升仓
            if (config.isShengcang && config.shengcangTime >= 0 && !module.getTimerState("shengcangTime")) {
                module.shengcang();
                module.timer("shengcangTime", config.shengcangTime * 60);
            }
            //执行仓库统计
            if (config.isCangkuStatistics && config.cangkuStatisticsTime >= 0 && !module.getTimerState("cangkuStatisticsTime")) {
                //进行仓库统计
                let rowData = module.cangkuStatistics(config.cangkuStatisticsPage);
                //将仓库统计结果转换为表格数据
                let rowContentData = module.creatContentData("账号", rowData);
                //在表格前后加入标题，合计列
                let contentData = module.rowContentData2(rowContentData);
                //推送
                module.pushTo(contentData);
                module.timer("cangkuStatisticsTime", config.cangkuStatisticsTime * 60);
            }

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
            const doneAccountsList = config.accountList.filter(account => account.done === true);

            //是否升仓，是否仓库统计
            let shengcangForEach = false;
            let cangkuStatisticsForEach = false;

            //设定初始仓库数据
            let rowContentData = statistics.get("rowContentData") || null;

            //判断是否需要升仓
            if (config.isShengcang && config.shengcangTime >= 0 && !module.getTimerState("shengcangTime")) {
                shengcangForEach = true;
                module.timer("shengcangTime", config.shengcangTime * 60);
            }
            //判断是否需要仓库统计
            if (config.isCangkuStatistics && config.cangkuStatisticsTime >= 0 && !module.getTimerState("cangkuStatisticsTime")) {
                cangkuStatisticsForEach = true;
                module.timer("cangkuStatisticsTime", config.cangkuStatisticsTime * 60);
            }
            doneAccountsList.forEach(account => {
                if (timeStorage.get("nextAccountToChange") && timeStorage.get("nextAccountToChange") != account.title) {
                    log("存储中存在下一个要切换的账号:" + timeStorage.get("nextAccountToChange"))
                    return;
                }

                module.switch_account(account.title);
                log("============当前账号: " + account.title + "============");
                module.huadong();
                // log("等待作物成熟");

                // 计算下一个账号的信息
                let nextAccountIndex = (doneAccountsList.indexOf(account) + 1) % doneAccountsList.length;
                let nextAccount = doneAccountsList[nextAccountIndex];
                let nextTimerName = nextAccount.title + "计时器";
                timeStorage.put("nextAccountToChange", nextAccount.title);

                module.operation(account.title); //执行刷地，售卖

                //升仓
                if (shengcangForEach) {
                    module.shengcang(); //执行升仓
                }
                //仓库统计
                if (cangkuStatisticsForEach) {
                    //执行仓库统计
                    let rowData = module.cangkuStatistics(config.cangkuStatisticsPage);
                    //将仓库统计结果转换为表格数据
                    rowContentData = module.creatContentData(`账号${account.title}`, rowData, rowContentData);
                    statistics.put("rowContentData", rowContentData);
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
            if (cangkuStatisticsForEach && rowContentData) {
                //在表格前后加入标题，合计列
                let contentData = module.rowContentData2(rowContentData);
                //推送
                module.pushTo(contentData);
                statistics.remove("rowContentData");
            }
        }

    }

}

function main_save() {

    if (config.isShengcang && !timeStorage.get("shengcangTime")) {
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

    if (!config.switchAccount || config.saveAccountList.filter(account => account.done).length <= 1) { //不切换账号

        //主界面判断
        sleep(1000);
        module.checkmenu();
        sleep(500);

        if (config.isShengcang && !timeStorage.get("shengcangTime")) {
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

        log("不切换账号，找耕地");
        module.huadong();
        sleep(1100);

        //循环操作
        while (true) {
            module.operation();
            log("等待作物成熟");

            //执行升仓
            if (config.isShengcang && config.shengcangTime >= 0 && !module.getTimerState("shengcangTime")) {
                module.shengcang();
                module.timer("shengcangTime", config.shengcangTime * 60);
            }
            //执行仓库统计
            if (config.isCangkuStatistics && config.cangkuStatisticsTime >= 0 && !module.getTimerState("cangkuStatisticsTime")) {
                //进行仓库统计
                let rowData = module.cangkuStatistics(config.cangkuStatisticsPage);
                //将仓库统计结果转换为表格数据
                let rowContentData = module.creatContentData("账号", rowData);
                //在表格前后加入标题，合计列
                let contentData = module.rowContentData2(rowContentData);
                //推送
                module.pushTo(contentData);
                module.timer("cangkuStatisticsTime", config.cangkuStatisticsTime * 60);
            }

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
        let nextTimerName = nextAccount.title + "计时器";
        timeStorage.put("nextAccountToChange", nextAccount.title);
        log("下一个账号: " + nextAccount.title + ", 计时器名称: " + nextTimerName);
        log("============当前账号: " + account + "============");

        //是否升仓，是否仓库统计
        let shengcangForEach = false;
        let cangkuStatisticsForEach = false;

        //设定初始仓库数据
        let rowContentData = statistics.get("rowContentData") || null;

        //判断是否需要升仓
        if (config.isShengcang && config.shengcangTime >= 0 && !module.getTimerState("shengcangTime")) {
            shengcangForEach = true;
            module.timer("shengcangTime", config.shengcangTime * 60);
        }
        //判断是否需要仓库统计
        if (config.isCangkuStatistics && config.cangkuStatisticsTime >= 0 && !module.getTimerState("cangkuStatisticsTime")) {
            cangkuStatisticsForEach = true;
            module.timer("cangkuStatisticsTime", config.cangkuStatisticsTime * 60);
        }

        //主界面判断
        sleep(1000);
        module.checkmenu();
        sleep(500);

        module.huadong();

        module.operation(account); //执行刷地，售卖

        //升仓
        if (shengcangForEach) {
            module.shengcang(); //执行升仓
        }
        //仓库统计
        if (cangkuStatisticsForEach) {
            //执行仓库统计
            let rowData = module.cangkuStatistics(config.cangkuStatisticsPage);
            //将仓库统计结果转换为表格数据
            rowContentData = module.creatContentData(`账号${account}`, rowData, rowContentData);
            statistics.put("rowContentData", rowContentData);
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
        ;
        if (cangkuStatisticsForEach && rowContentData) {
            //在表格前后加入标题，合计列
            let contentData = module.rowContentData2(rowContentData);
            //推送
            module.pushTo(contentData);
            statistics.remove("rowContentData");
        }
        events.broadcast.emit("switchSaveAccount", nextAccount.title); //广播切换账号事件
    }

}




//
// threads.start(() => {
//     while (true) {
//         sleep(5000);
//         let disconnect = findimage(files.join(config.photoPath, "disconnected.png"), 0.8)
//         if (disconnect) {
//             click(adapt(1300, 1100))
//         }
//     }
// })


main()