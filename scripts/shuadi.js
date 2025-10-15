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

let crop;
let crop_sail;

//小麦
if (config.selectedCrop.code == 0) {
    crop = ["#ffef14", [9, -32, "#d59b08"], [-8, 20, "#b56000"], [-32, 28, "#f3c107"], [29, 30, "#ffdf7c"]];
    crop_sail = ["#fff00a", [-4, -2, "#ffffff"], [-20, 28, "#ffde05"], [6, -34, "#fed704"], [-20, 2, "#feef08"]];
}
//玉米
if (config.selectedCrop.code == 1) {
    crop = ["#f8e605", [49, 31, "#ffdf7c"], [-31, 35, "#8f9504"], [33, -30, "#f8ef02"], [-17, -9, "#a5a905"]];
    crop_sail = ["#faf350", [7, 23, "#8c9104"], [-24, 1, "#a8ad05"], [-34, 38, "#888d04"], [28, -24, "#fbf115"]];
}
//胡萝卜
if (config.selectedCrop.code == 2) {
    crop = ["#ffd100", [24, 21, "#ffdf7c"], [33, -29, "#48951b"], [-31, 29, "#ff9700"], [-7, -7, "#ffe000"]];
    crop_sail = ["#ffba00", [26, -25, "#509b1f"], [-4, 10, "#ff8a00"], [-30, 24, "#ffb300"], [36, -45, "#7bc333"]];
}
//大豆
if (config.selectedCrop.code == 3) {
    crop = ["#eff083", [13, 32, "#ffdf7c"], [-33, 39, "#dde249"], [-32, -5, "#f1f278"], [19, -31, "#b1ba13"]];
    crop_sail = ["#dde163", [-29, 26, "#909a0f"], [23, 9, "#eeef72"], [-13, -3, "#ced24e"], [-29, 54, "#dde148"]];
}

// 启动自动点击权限请求
module.autoSc();




function main() {

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