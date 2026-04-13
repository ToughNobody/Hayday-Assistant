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



let config = module.config;




function main() {
    try {
        module.createWindow(config.showText);
    } catch (error) {
        console.error("创建窗口失败:", error);
    }

    //主界面判断
    sleep(100);
    module.checkmenu();
    sleep(500);

    //新建账号列表
    const doneAccountsList = config.accountList.filter(account => account.done === true);


    //设定初始仓库数据
    let cangkuStatisticsData = [];

    doneAccountsList.forEach(account => {

        module.switch_account(account.title);
        log("============当前账号: " + account.title + "============");
        module.huadong();
        sleep(500);
        let isFindShop = module.findshop()
        if (!isFindShop) {
            if (module.find_close()) sleep(500)
            module.huadong()
        }
        module.findland(false)

        //执行仓库统计
        let rawData = module.cangkuStatistics(config.cangkuStatisticsPage);
        if (!rawData) {
            log("账号" + account.title + "仓库统计数据为空");
            return;
        }
        rawData["账号"] = account.title
        //将仓库统计结果添加到统计数据
        cangkuStatisticsData.push(rawData);
    });

    //输出原始数据
    log(module.convertToText(cangkuStatisticsData));

    //转换函数

    //传入数据

    //解析输出

    

}


