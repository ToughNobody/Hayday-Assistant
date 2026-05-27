

// 导入module模块
const mod = require("./module.js");

let config = mod.config;

let method

/**
 * 1表示未进入购买界面，2表示进入购买界面，3表示进入购买界面编辑界面
 * @param {boolean} isclick 是否点击购买按钮
 * @returns {boolean} 返回true表示进入购买界面，false表示未进入
 */
function buy_menu(isclick = true) {
    //没有点击购买按钮
    //新版
    let buy_button = mod.matchColor([{ x: 83, y: 687, color: "#f4bb3c" },
    { x: 71, y: 661, color: "#2664aa" }]);
    //旧版
    let buy_button2 = mod.matchColor([{ x: 68, y: 653, color: "#2664aa" },
    { x: 85, y: 683, color: "#f7bc3f" }]);
    if (buy_button || buy_button2) {
        if (isclick) {
            click(60 + mod.ran(), 650 + mod.ran())  //点击购买按钮
            console.log("点击购买按钮")
            mod.showTip("点击购买按钮")
        }
        return 1;
    } else if (mod.matchColor([{ x: 641, y: 669, color: "#f5e9cf" },
    { x: 654, y: 660, color: "#3478b8" }])) {
        //打开购买按钮，主界面
        method = 2;
        return 2;
    }
    else if (mod.matchColor([{ x: 560, y: 616, color: "#eacd86" }, { x: 560, y: 649, color: "#3377b7" }, { x: 550, y: 668, color: "#f7ebd0" }])) {
        //打开购买按钮，编辑界面
        method = 3;
        return 3;
    } else {
        return false;
    }
}

function sousuo() {
    // log(buy_button());
    let buyMenu = buy_menu();
    if (buyMenu === 2) {
        sleep(500);
        click(650 + mod.ran(), 420 + mod.ran());  //点击树木栏(主界面)
    } else if (buyMenu === 3) {
        sleep(500);
        click(560 + mod.ran(), 280 + mod.ran());  //点击树木栏(编辑模式)
    } else {
        return false;
    }

    sleep(1000);
    //找到搜索框，直接点击搜索
    if (mod.matchColor([{ x: 52, y: 55, color: "#ffffff" }, { x: 36, y: 44, color: "#f7ce00" }, { x: 84, y: 147, color: "#ffffca" }], null, 6) ||
        mod.matchColor([{ x: 40, y: 49, color: "#ffffff" }, { x: 30, y: 39, color: "#f8cb00" }, { x: 98, y: 120, color: "#ffffca" }], null, 6)) {
        click(320 + mod.ran(), 150 + mod.ran());  //点击搜索框
        mod.showTip("点击搜索框");
        log("点击搜索框");
        return true;
    }
    //未找到搜索框，寻找搜索按钮
    else if (mod.matchColor([{ x: 48, y: 55, color: "#ffffff" }, { x: 33, y: 46, color: "#f9ca00" }, { x: 107, y: 47, color: "#deb475" }], null, 6) ||
        mod.matchColor([{ x: 40, y: 51, color: "#ffffff" }, { x: 29, y: 45, color: "#f8c500" }, { x: 97, y: 46, color: "#ddb274" }], null, 6)) {
        click(45 + mod.ran(), 50 + mod.ran());
        sleep(500);
        if (mod.matchColor([{ x: 52, y: 55, color: "#ffffff" }, { x: 36, y: 44, color: "#f7ce00" }, { x: 84, y: 147, color: "#ffffca" }], null, 6)) {
            click(320 + mod.ran(), 150 + mod.ran());
            mod.showTip("点击搜索框");
            log("点击搜索框");
            return true;
        } else {
            mod.showTip("未识别到搜索框");
            log("未识别到搜索框");
            return false;
        }
    } else {  //未找到搜索按钮和搜索框
        mod.showTip("未找到搜索按钮和搜索框");
        log("未找到搜索按钮和搜索框");
        return false;
    }
}

function setTreeText() {
    if (sousuo()) {
        sleep(500);
        mod.setText_inGame(config.selectedTree.text); //输入搜索内容
        log("输入" + config.selectedTree.text);
        mod.showTip("输入" + config.selectedTree.text);
        sleep(500);
        //检测搜索后的界面
        if (method === 2) {
            if (mod.matchColor([{ x: 45, y: 59, color: "#ffffff" }, { x: 142, y: 151, color: "#ffffca" }, { x: 478, y: 316, color: "#ffc837" }])) {
                log("搜索到");
                return true;  //成功搜索到
            }
        } else if (method === 3) {
            if (mod.matchColor([{ x: 80, y: 126, color: "#ffffca" }, { x: 408, y: 276, color: "#ffc837" }, { x: 408, y: 616, color: "#ffc837" }])) {
                log("搜索到");
                return true;  //成功搜索到
            }
        } else {
            log("未搜索到");
            return false;
        }
    } else {  //未找到，再次寻找
        // find_close();
        log("未找到搜索，再次寻找");
        if (sousuo()) {
            mod.setText_inGame(config.selectedTree.text); //输入搜索内容
            if (mod.matchColor([{ x: 45, y: 59, color: "#ffffff" }, { x: 142, y: 151, color: "#ffffca" }, { x: 478, y: 316, color: "#ffc837" }])) {
                return true;  //成功搜索到
            }
        }
        return false;
    }
}

module.exports = {
    buy_menu: buy_menu,
    setTreeText: setTreeText,
    sousuo: sousuo,
}
