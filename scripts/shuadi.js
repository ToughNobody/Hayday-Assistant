// 导入module模块
const module = require("./module.js");

//全局

let config = module.config;



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
threads.start(module.autorequestScreenCapture);
//获取截图权限
if (!requestScreenCapture()) {
    toast("请求截图失败");
    exit();
} else {
    // toastLog("已获得截图权限");
}






function main() {

    if (config.isShengcang) {
        module.shengcang_setTime();
        log(global.shengcangTimeout)
    }
    if (config.isCangkuStatistics) {
        module.cangkuStatistics_setTime();
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
            if (config.isShengcang && config.shengcangTime >= 0 && global.shengcangTimeout) {
                module.shengcang();
                global.shengcangTimeout = false;
                module.shengcang_setTime();
            }
            //执行仓库统计
            if (config.isCangkuStatistics && config.cangkuStatisticsTime >= 0 && global.cangkuStatisticsTimeout) {
                //进行仓库统计
                let rowData = module.cangkuStatistics();
                //将仓库统计结果转换为表格数据
                let rowContentData = module.creatContentData("账号", rowData);
                //在表格前后加入标题，合计列
                let contentData = module.rowContentData2(rowContentData);
                //推送
                module.pushTo(contentData);
                global.cangkuStatisticsTimeout = false;
                module.cangkuStatistics_setTime();
            }

            while (true) {
                // 获取计时器剩余时间
                let timerState = module.getTimerState(global.currentTimerName);
                if (timerState) {
                    // 将秒数转换为分钟和秒
                    let minutes = Math.floor(timerState.remainingTime / 60);
                    let seconds = timerState.remainingTime % 60;
                    let timeText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
                    module.showTip(`${config.selectedCrop.text}成熟剩余${timeText}`);
                }
                if (!timerThread.isAlive()) {
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
            let rowContentData = null;

            //判断是否需要升仓
            if (config.isShengcang && config.shengcangTime >= 0 && global.shengcangTimeout) {
                shengcangForEach = true;
                global.shengcangTimeout = false;
                module.shengcang_setTime();
            }
            //判断是否需要仓库统计
            if (config.isCangkuStatistics && config.cangkuStatisticsTime >= 0 && global.cangkuStatisticsTimeout) {
                cangkuStatisticsForEach = true;
                global.cangkuStatisticsTimeout = false;
                module.cangkuStatistics_setTime();
            }
            doneAccountsList.forEach(account => {
                // 检查账号是否启用
                if (!account.done) {
                    log("账号 " + account.title + " 已禁用，跳过");
                    return;
                }

                module.switch_account(account.title);
                log("============当前账号: " + account.title + "============");
                module.huadong();
                // log("等待作物成熟");

                // 计算下一个账号的信息
                let nextAccountIndex = (doneAccountsList.indexOf(account) + 1) % doneAccountsList.length;
                let nextAccount = doneAccountsList[nextAccountIndex];
                let nextTimerName = nextAccount.title + config.selectedCrop.text;

                module.operation(account.title); //执行刷地，售卖

                //升仓
                if (shengcangForEach) {
                    module.shengcang(); //执行升仓
                }
                //仓库统计
                if (cangkuStatisticsForEach) {
                    //执行仓库统计
                    let rowData = module.cangkuStatistics();
                    //将仓库统计结果转换为表格数据
                    rowContentData = module.creatContentData(`账号${account.title}`, rowData, rowContentData);
                }
                while (true) {
                    // 获取下一个账号的计时器状态
                    let nextTimerState = module.getTimerState(nextTimerName);

                    if (!nextTimerState) {
                        // 如果下一个计时器不存在，直接跳出循环
                        break;
                    }

                    // 显示下一个计时器的状态
                    let minutes = Math.floor(nextTimerState.remainingTime / 60);
                    let seconds = nextTimerState.remainingTime % 60;
                    let timeText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
                    module.showTip(`账号:${nextAccount.title} ${config.selectedCrop.text}成熟剩余${timeText}`);

                    if (!timerThread.isAlive()) {
                        break;
                    }
                    sleep(1000);
                }
                sleep(1100);
            });
            if (cangkuStatisticsForEach && rowContentData) {
                //在表格前后加入标题，合计列
                let contentData = module.rowContentData2(rowContentData);
                //推送
                module.pushTo(contentData);
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