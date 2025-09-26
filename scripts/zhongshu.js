
//右35.25,17.6  下35.25,17.6

let appExternalDir = context.getExternalFilesDir(null).getAbsolutePath();
const configDir = files.join(appExternalDir, "configs");
const configPath = files.join(configDir, "config.json");
let content = files.read(configPath);
let config = JSON.parse(content);


let randomOffset = 5;
function ran() {
    return Math.random() * (2 * randomOffset) - randomOffset;
}



function autorequestScreenCapture() {
    // 先尝试点击 "总是"、"整个"、"全部" 等按钮（最多 20 次）
    //使用mumu模拟器不需要了
    // for (let i = 0; i < 20; i++) {
    //     if (click("总是") || click("整个") || click("全部")) {
    //         break;
    //     }
    //     sleep(100);
    // }

    // 再尝试点击 "允许"、"确定"、"同意"、"开始" 等按钮（最多 30 秒）
    const MAX_RETRIES = 50; // 最多尝试 50 次（10秒）
    for (let i = 0; i < MAX_RETRIES; i++) {
        if (click("开始") || click("确定") || click("同意") || click("允许")) {
            log("已点击截图确认按钮");
            return; // 成功点击后直接退出函数
        }
        sleep(200);
    }
}

// 启动自动点击权限请求
threads.start(autorequestScreenCapture);
//获取截图权限
if (!requestScreenCapture()) {
    toast("请求截图失败");
    exit();
} else toastLog("已获得截图权限");

function findimage(imagepath, xiangsidu, sc = null, region = null) {
    let screen = sc || captureScreen();
    let picture = null;
    try {
        picture = images.read(imagepath);
        if (!picture) throw new Error("模板图片读取失败");

        // 如果指定了区域参数，则只在区域内搜索
        if (region) {
            let result = images.findImage(screen, picture, {
                threshold: xiangsidu,
                region: region
            });
            return result ? {
                x: result.x + (picture.width / 2),
                y: result.y + (picture.height / 2)
            } : null;
        }

        // 默认全屏搜索
        let result = images.findImage(screen, picture, { threshold: xiangsidu });
        return result ? {
            x: result.x + (picture.width / 2),
            y: result.y + (picture.height / 2)
        } : null;
    } catch (e) {
        console.error("图像识别失败:", e);
        return null;
    } finally {
        // 确保资源回收
        if (!sc && screen) screen.recycle(); // 只有自己创建的截图才回收
        if (picture) picture.recycle();
    }
}


function restartgame() {
    home();
    sleep(500);
    launchSettings("com.supercell.hayday");
    // 循环尝试点击"停止"按钮，直到成功
    for (let i = 0; i < 5; i++) {
        if (click("停止")) {
            break; // 点击成功后退出循环               
        }
        sleep(1000);
    }
    sleep(1000);
    for (let i = 0; i < 3; i++) {
        if (click("确定") || click("停止")) {
            toastLog("已停止应用");
            break;// 点击成功后退出循环
        }
        sleep(1000);
    }
    sleep(1000);
    launch("com.supercell.hayday");
    events.broadcast.emit("engine_r", "刷地引擎");

}

//悬浮窗
function showTip(text, duration = 3000) {
    try {
        // 检查text参数
        if (text === null || text === undefined) {
            console.error("showTip: text参数不能为null或undefined");
            return;
        }

        // 预先计算位置
        const targetX = device.width * config.showText.x;
        const targetY = device.height * config.showText.y;

        // 移除旧悬浮窗（避免重复创建）
        const oldTip = ui["__tip_window"];
        if (oldTip) {
            try {
                oldTip.close();
            } catch (e) {
                console.error("关闭旧悬浮窗失败:", e);
            }
        }

        // 使用UI线程创建悬浮窗
        ui.run(() => {
            try {
                // 创建新悬浮窗
                const window = floaty.rawWindow(
                    <frame gravity="right|bottom" bg="#00000000" margin="0">
                        <card
                            w="*"
                            h="auto"
                            cardCornerRadius="26"
                            cardElevation="4dp"
                            cardBackgroundColor="#60000000"
                            foreground="?selectableItemBackground"
                            layout_gravity="center"
                        >
                            <horizontal w="auto" h="auto" padding="0 0">
                                <text
                                    id="text"
                                    singleLine="false"
                                    minWidth="100"
                                    w="auto"
                                    maxWidth="500"
                                    textSize="12"
                                    textColor="#FFFFFF"
                                    padding="10 6"
                                    text={String(text)}
                                    gravity="center"
                                />
                            </horizontal>
                        </card>
                    </frame>
                );

                // 确保window和window.text对象存在
                if (!window || !window.text) {
                    throw new Error("悬浮窗创建失败");
                }

                // 先设置位置，再设置可见性
                window.setPosition(targetX, targetY);
                window.setTouchable(false);

                // 保存引用以便后续关闭
                ui["__tip_window"] = window;

                // 自动关闭（如果设置了duration）
                if (duration > 0) {
                    setTimeout(() => {
                        try {
                            if (window) window.close();
                        } catch (e) {
                            console.error("关闭悬浮窗失败:", e);
                        }
                    }, duration);
                }
            } catch (e) {
                console.error("UI线程中创建悬浮窗失败:", e);
            }
        });
    } catch (e) {
        console.error("showTip函数执行失败:", e);
    }
}

function matchColor(checkPoints = [], screenshot, xiangsidu = 16) {
    // 参数验证
    if (!Array.isArray(checkPoints) || checkPoints.length === 0) {
        console.warn("checkPoints必须是非空数组");
        return false;
    }

    let sc = screenshot || captureScreen();
    let screenWidth = sc.width;
    let screenHeight = sc.height;
    let allMatch = true;

    try {
        for (let point of checkPoints) {
            // 坐标验证
            if (point.x >= screenWidth || point.y >= screenHeight) {
                console.warn(`坐标(${point.x},${point.y})超出屏幕范围(${screenWidth}x${screenHeight})`);
                allMatch = false;
                break;
            }

            // 颜色检测
            if (!images.detectsColor(sc, point.color, point.x, point.y, xiangsidu)) {
                allMatch = false;
                break;
            }
        }
    } catch (e) {
        console.error("颜色检测出错:", e);
        allMatch = false;
    } finally {
        // 只有自己创建的截图才回收
        if (!screenshot) {
            sc.recycle();
        }
    }

    return allMatch;
}


/**
 * @param {Array} checkPoints 格式为 ["基准颜色", [dx1, dy1, "颜色1"], [dx2, dy2, "颜色2"], ...]
 * @param {ImageWrapper} [screenshot] 可选截图对象
 * @param {Array} [region] 可选找色区域[x,y,width,height]
 * @param {number} [threshold=16] 相似度阈值（0-255，越小越相似）
 * @returns {{x:number,y:number}|null} 返回坐标对象或null
 */
function findMC(checkPoints, screenshot, region, threshold = 16) {
    // 参数验证
    if (!Array.isArray(checkPoints) || checkPoints.length < 2) {
        throw new Error("参数错误：checkPoints必须为数组且至少包含基准颜色和一个相对点");
    }

    // 分离基准色和相对点
    const firstColor = checkPoints[0];
    const colors = checkPoints.slice(1);

    // 处理截图
    let img = null;
    let shouldRecycle = false;

    if (screenshot && typeof screenshot.getWidth === 'function') {
        img = screenshot;
    } else {
        img = images.captureScreen();
        shouldRecycle = true;
    }

    // 构建options对象
    const options = { threshold: Math.max(0, Math.min(255, threshold)) };
    if (region && Array.isArray(region)) {
        options.region = region;
    }

    try {
        // 执行多点找色
        const result = images.findMultiColors(img, firstColor, colors, options);
        return result ? { x: result.x, y: result.y } : null;
    } catch (e) {
        console.error("执行多点找色失败:", e.message);
        return null;
    } finally {
        // 安全回收截图
        if (shouldRecycle && img && typeof img.recycle === 'function') {
            img.recycle();
        }
    }
}

/**
 * 持续检测是否成功进入主界面（通过菜单图标匹配）
 * @returns {boolean|null} - 检测到菜单返回 `true`，超过重试次数返回 `null`，图片加载失败时也返回 `null`
 * @throws {Error} 当截图或图片处理失败时抛出异常
 * @example
 * // 等待主界面出现（最长30秒）
 * if (checkmenu()) {
 *   console.log("已进入主界面，开始后续操作");
 * } else {
 *   console.log("进入主界面超时");
 * }
 */
function checkmenu() {

    const MAX_RETRY = 30; // 最大尝试次数（30秒）
    const RETRY_INTERVAL = 1000; // 每次检测间隔（毫秒）

    for (let i = 0; i < MAX_RETRY; i++) {
        let sc = null;

        try {
            //新版界面
            let allMatch = matchColor([{ x: 47, y: 177, color: "#ffffff" },
            { x: 70, y: 662, color: "#2664aa" },
            { x: 1213, y: 661, color: "#f2ded3" }]);

            //老板界面
            let allMatch2 = matchColor([{ x: 39, y: 177, color: "#ffffff" },
            { x: 68, y: 654, color: "#2662a9" },
            { x: 1208, y: 659, color: "#f0e0d6" }]);

            if (allMatch || allMatch2) {
                log(`第 ${i + 1} 次检测: 已进入主界面`);
                showTip(`第 ${i + 1} 次检测: 已进入主界面`);
                return true;
            }
        } catch (e) {
            console.error("检测过程中出错:", e);
            // return false;
        } finally {

        }

        //未找到则等待
        sleep(RETRY_INTERVAL);
        log(`第 ${i + 1} 次检测: 未找到菜单，继续等待...`);
        showTip(`第 ${i + 1} 次检测: 未找到菜单，继续等待...`);
        sc = captureScreen();
        find_close(sc);
        sc.recycle();
    }

    // 超过最大重试次数
    log(`超过最大重试次数 ${MAX_RETRY} 次，未检测到主界面`);
    showTip(`超过最大重试次数 ${MAX_RETRY} 次，未检测到主界面`);
    home();
    // 尝试重启游戏
    log("尝试重启");
    restartgame();

}


function close() {
    let close_button = findimage(files.join(config.photoPath, "close.png"), 0.5);
    if (close_button) {
        click(close_button.x + ran(), close_button.y + ran())
        console.log("点击叉叉")
        showTip("点击叉叉")
    } else {
        // click(2110, 125)
        // console.log("未识别到叉，点击默认坐标")

    }
}

/**
 * @returns 如果找到并处理了关闭按钮或返回主界面，返回 `true`；否则返回 `false`
 * 寻找是否有关闭按钮或者在其他页面
 */
function find_close(screenshot1, action = null) {
    let sc = screenshot1 || captureScreen();

    //识别叉叉
    let close_button = findimage(files.join(config.photoPath, "close.png"), 0.5, sc);
    if (close_button) {
        click(close_button.x + ran(), close_button.y + ran());
        console.log("点击叉叉");
        showTip("点击叉叉");
        return true;
    }

    //进入小镇
    let homebtn1 = matchColor([{ x: 212, y: 36, color: "#f73d46" },
    { x: 188, y: 615, color: "#cf9be6" },
    { x: 220, y: 662, color: "#55cf58" }],
        screenshot = sc);
    if (homebtn1) {
        click(200 + ran(), 645 + ran());
        console.log("进入小镇，回到主界面");
        showTip("进入小镇，回到主界面");
        checkmenu();
        return true;
    }

    //进入鱼塘
    let homebtn2 = matchColor([{ x: 44, y: 177, color: "#ffffff" },
    { x: 88, y: 637, color: "#c687de" },
    { x: 101, y: 657, color: "#5ad05c" }],
        screenshot = sc);
    if (homebtn2) {
        click(60 + ran(), 630 + ran());
        console.log("进入鱼塘，回到主界面");
        showTip("进入鱼塘，回到主界面");
        checkmenu();
        return true;
    }

    //升级
    let levelup = matchColor([{ x: 292, y: 98, color: "#ffffff" },
    { x: 520, y: 93, color: "#88e435" },
    { x: 754, y: 89, color: "#89e534" },
    { x: 861, y: 654, color: "#f6bc3a" },
    { x: 1076, y: 627, color: "#00b7ff" }],
        screenshot = sc);
    if (levelup) {
        log("升级了！")
        showTip("升级了！")
        click(637 + ran(), 642 + ran());
        sleep(2000);
        checkmenu();
        return true;
    }

    //断开连接
    let disconnect = matchColor([{ x: 279, y: 222, color: "#fff9db" },
    { x: 435, y: 62, color: "#deb476" },
    { x: 630, y: 202, color: "#ffe9d6" },
    { x: 647, y: 632, color: "#fada75" }],
        screenshot = sc);
    if (disconnect) {
        console.log("断开连接，重试");
        showTip("断开连接，重试");
        click(640 + ran(), 660 + ran())
        sleep(1000);
        checkmenu();
        return true;
    }

    //切换账号页面
    let switchAccount = matchColor([{ x: 56, y: 63, color: "#ffffff" },
    { x: 530, y: 70, color: "#041d51" },
    { x: 38, y: 687, color: "#52b4dd" },
    { x: 550, y: 697, color: "#0e3683" }],
        screenshot = sc);
    if (switchAccount) {
        console.log("切换账号界面，返回主菜单");
        showTip("切换账号界面，返回主菜单");
        click(56 + ran(), 63 + ran());
        sleep(800);
        click(1150 + ran(), 70 + ran());
        return true;
    }

    //进入购买界面
    let buy_button = matchColor([{ x: 679, y: 578, color: "#7bbfe4" },
    { x: 648, y: 612, color: "#f0d98a" },
    { x: 682, y: 683, color: "#f4bd3f" }],
        screenshot = sc)
    if (buy_button) {
        console.log("进入购买界面，返回主菜单");
        showTip("进入购买界面，返回主菜单");
        click(650 + ran(), 620 + ran());
        return true;
    }

    //识别稻草人，左边肩膀，乌鸦身子，脚
    let daocaoren = matchColor([{ x: 86, y: 406, color: "#bbb2e7" },
    { x: 166, y: 372, color: "#282b38" },
    { x: 162, y: 394, color: "#ce9b00" }],
        screenshot = sc);
    if (daocaoren) {
        log("识别到稻草人");
        showTip("识别到稻草人");
        jiaocheng();
        return true;
    }
    return false;
}

/*需要点击的教程
11级农场勋章
14级汤姆有动画
20级礼券
*/
/**
 * 
 * @param {*} 
 */
function jiaocheng() {
    while (true) {
        let sc = captureScreen();
        //识别稻草人
        let jiaocheng20 = matchColor([{ x: 86, y: 406, color: "#bbb2e7" },
        { x: 166, y: 372, color: "#282b38" },
        { x: 162, y: 394, color: "#ce9b00" }], sc);
        if (jiaocheng20) {
            log("识别到稻草人，点击");
            showTip("识别到稻草人，点击");
            click(1055 + ran(), 600 + ran());
            sleep(300);
            click(1055 + ran(), 600 + ran());
        } else {
            break;
        }
        sleep(1000);
    }
}


// /** 
//  * 点击购买按钮，如果点开了购买界面返回true，没找到返回false
// */
// function buy_button() {
//     //没有点开购买按钮
//     let buy_button = matchColor([{ x: 83, y: 687, color: "#f4bb3c" },
//     { x: 71, y: 661, color: "#2664aa" }])
//     if (buy_button) {
//         click(51 + ran(), 600 + ran())  //点击购买按钮
//         console.log("点击购买按钮")
//         showTip("点击购买按钮")
//         return true;
//     } else if (matchColor([{ x: 649, y: 615, color: "#efd98b" }, { x: 652, y: 652, color: "#3377b7" }, { x: 632, y: 665, color: "#f6e8cf" }]) ||
//         matchColor([{ x: 560, y: 612, color: "#f1dc8d" }, { x: 563, y: 654, color: "#3376b7" }, { x: 545, y: 665, color: "#f7ebd2" }])) {
//         return true;
//     } else {
//         return false;
//     }
// }

/**
 * 1表示未进入购买界面，2表示进入购买界面，3表示进入购买界面编辑界面
 * @param {boolean} isclick 是否点击购买按钮
 * @returns {boolean} 返回true表示进入购买界面，false表示未进入
 */
function buy_menu(isclick = true) {
    //没有点击购买按钮
    //新版
    let buy_button = matchColor([{ x: 83, y: 687, color: "#f4bb3c" },
    { x: 71, y: 661, color: "#2664aa" }]);
    //旧版
    let buy_button2 = matchColor([{ x: 68, y: 653, color: "#2664aa" },
    { x: 85, y: 683, color: "#f7bc3f" }]);
    if (buy_button || buy_button2) {
        if (isclick) {
            click(60 + ran(), 650 + ran())  //点击购买按钮
            console.log("点击购买按钮")
            showTip("点击购买按钮")
        }
        return 1;
    } else if (matchColor([{ x: 641, y: 669, color: "#f5e9cf" },
    { x: 654, y: 660, color: "#3478b8" }])) {
        //打开购买按钮，主界面
        global.method = 2;
        return 2;
    }
    else if (matchColor([{ x: 560, y: 616, color: "#eacd86" }, { x: 560, y: 649, color: "#3377b7" }, { x: 550, y: 668, color: "#f7ebd0" }])) {
        //打开购买按钮，编辑界面
        global.method = 3;
        return 3;
    } else {
        return false;
    }
}

function findland(findRange) {
    let range = findRange ? findRange : [410, 140, 860 - 410, 570 - 140];
    let methodNum = 1;
    //秋
    //第一种三点,1
    let land = findMC(["#b6c828", [-8, 8, "#99c015"], [10, 0, "#a3c31c"], [-6, 43, "#94bf11"], [-5, 61, "#8abb0b"], [58, 1, "#8fbf10"]], null, range, 10); //[410, 140, 860 - 410, 570 - 140]

    if (!land) {
        methodNum++;
        //第二种三点,2
        land = findMC(["#b8c827", [-8, 8, "#aac421"], [8, -2, "#b9c92b"], [-9, -2, "#8ebe10"], [0, 9, "#8ebe10"]], null, range, 9);
    }

    if (!land) {
        methodNum++;
        //小块白色地(鸭脚)，3
        land = findMC(["#c1d331", [-7, -1, "#ced834"], [-13, 5, "#dae03f"], [1, 11, "#cbd936"], [-13, -8, "#90be10"]], null, range, 16);
    }
    if (!land) {
        methodNum++;
        //小块白色地(圆圈)，4
        land = findMC(["#bcd439", [-5, -4, "#c6d32f"], [-8, -1, "#bdce2b"], [-4, 5, "#a2c323"], [8, 1, "#c1d530"], [-6, -19, "#8abd08"], [10, -13, "#89bd08"]], null, range, 16);
    }

    //春
    if (!land) {
        methodNum++;
        //第三种三点，5
        land = findMC(["#98c20e", [-8, 7, "#91bf0e"], [9, 0, "#93c010"], [-9, -3, "#8fbf08"], [2, -7, "#88bc08"], [-1, 8, "#88bf09"], [8, 5, "#88bc08"]], null, range, 2);
    }
    if (!land) {
        methodNum++;
        //小块白色地(鸭脚),6
        land = findMC(["#afe534", [1, 7, "#a4da2c"], [-5, 5, "#a9dd32"], [-7, 13, "#89bd09"]], null, range, 5);
    }
    if (!land) {
        methodNum++;
        //小块白色地(圆圈),7
        land = findMC(["#a8e22c", [-5, -4, "#b0e32f"], [-8, -1, "#a6de2b"], [-4, 5, "#9de12a"], [8, 1, "#b0e32f"], [-6, -19, "#89bd09"], [10, -13, "#88bc08"]], null, range, 5);
    }
    if (!land) {
        methodNum++;
    }
    log(methodNum);
    return land;
}

function sousuo() {
    // log(buy_button());
    if (buy_menu() === 2) {
        sleep(500);
        click(650 + ran(), 420 + ran());  //点击树木栏(主界面)
    } else if (buy_menu() === 3) {
        sleep(500);
        click(560 + ran(), 280 + ran());  //点击树木栏(编辑模式)
    } else {
        return false;
    }

    sleep(500);
    //找到搜索框，直接点击搜索
    if (matchColor([{ x: 52, y: 55, color: "#ffffff" }, { x: 36, y: 44, color: "#f7ce00" }, { x: 84, y: 147, color: "#ffffca" }]) ||
        matchColor([{ x: 40, y: 49, color: "#ffffff" }, { x: 30, y: 39, color: "#f8cb00" }, { x: 98, y: 120, color: "#ffffca" }])) {
        click(320 + ran(), 150 + ran());  //点击搜索框
        showTip("点击搜索框");
        log("点击搜索框");
        return true;
    }
    //未找到搜索框，寻找搜索按钮
    else if (matchColor([{ x: 48, y: 55, color: "#ffffff" }, { x: 33, y: 46, color: "#f9ca00" }, { x: 107, y: 47, color: "#deb475" }]) ||
        matchColor([{ x: 40, y: 51, color: "#ffffff" }, { x: 29, y: 45, color: "#f8c500" }, { x: 97, y: 46, color: "#ddb274" }])) {
        click(45 + ran(), 50 + ran());
        sleep(500);
        if (matchColor([{ x: 52, y: 55, color: "#ffffff" }, { x: 36, y: 44, color: "#f7ce00" }, { x: 84, y: 147, color: "#ffffca" }])) {
            click(320 + ran(), 150 + ran());
            showTip("点击搜索框");
            log("点击搜索框");
            return true;
        } else {
            showTip("未识别到搜索框");
            log("未识别到搜索框");
            return false;
        }
    } else {  //未找到搜索按钮和搜索框
        showTip("未找到搜索按钮和搜索框");
        log("未找到搜索按钮和搜索框");
        return false;
    }
}

function setTreeText() {
    if (sousuo()) {
        sleep(500);
        setText(config.selectedTree.text); //输入搜索内容
        log("输入" + config.selectedTree.text);
        showTip("输入" + config.selectedTree.text);
        sleep(500);
        //检测搜索后的界面
        if (global.method === 2) {
            if (matchColor([{ x: 45, y: 59, color: "#ffffff" }, { x: 142, y: 151, color: "#ffffca" }, { x: 478, y: 316, color: "#ffc837" }])) {
                log("搜索到");
                return true;  //成功搜索到
            }
        } else if (global.method === 3) {
            if (matchColor([{ x: 80, y: 126, color: "#ffffca" }, { x: 408, y: 276, color: "#ffc837" }, { x: 408, y: 616, color: "#ffc837" }])) {
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
            setText(config.selectedTree.text); //输入搜索内容
            if (matchColor([{ x: 45, y: 59, color: "#ffffff" }, { x: 142, y: 151, color: "#ffffca" }, { x: 478, y: 316, color: "#ffc837" }])) {
                return true;  //成功搜索到
            }
        }
        return false;

    }
}

function plantTrees(pos) {
    sleep(500);
    let land = pos ? pos : findland();
    log("找地结果", land);
    if (land) {
        showTip("找地结果: x:" + land.x + ", y:" + land.y);
    } else {
        showTip("未找到空地");
    }

    log(buy_menu());
    if (land && buy_menu()) {
        swipe(90 + ran(), 270 + ran(), land.x, land.y, 200);
        return true;
    }
    return false;
}

// while (true) {
//     plantTrees();
//     // sleep(2000)
// }
function main() {
    while (true) {
        if (setTreeText()) {
            break;
        }
        sleep(500);
    };

    //设置滑动方向
    let right = 36;
    let down = 18;
    let shouldSwipe = "up";

    //找地范围[410, 140, 860 - 410, 570 - 140]  左上角x，左上角y，宽，高
    let searchRange = [410, 140, 860 - 410, 570 - 140];
    let firstPos = null;//每一行第一块地
    let lastPos = null;//上一块地
    let lastPos_1 = null;//中间变量
    let shouldSwitch = false; //是否换行
    let click_buy_botton_Num = 0; //点击购买按钮次数
    let plantFalseNum = 0; //种植失败次数

    //是否在范围内
    function inRange(Pos) {
        if (Pos && (searchRange[0] <= Pos.x && Pos.x <= searchRange[2] + searchRange[0]) && (searchRange[1] <= Pos.y && Pos.y <= searchRange[3] + searchRange[1])) {
            log(Pos, "在范围内");
            return true;
        } else {
            log(Pos, "不在范围内");
            return false;
        }
    }

    while (true) {

        //设定种植失败次数
        plantFalseNum = 0;
        click_buy_botton_Num = 0;

        //种植循环，十次未找到地就退出
        while (true) {

            if (plantFalseNum >= 10 || click_buy_botton_Num >= 5) break; //连续10次没有找到地，就退出，进行滑动

            if (buy_menu() === 1) {
                click_buy_botton_Num++;
                log("点击购买按钮次数", click_buy_botton_Num);
                showTip("点击购买按钮次数", click_buy_botton_Num);
                // sleep(500);
                continue;
            }
            //如果要换行，有第一块地
            if (shouldSwitch && firstPos) {
                //如果下一行的地在范围内
                if (inRange({ x: firstPos.x, y: firstPos.y + down })) {
                    firstPos = findland([firstPos.x - right * 0.5, firstPos.y + down * 1.5, right, down]);
                    log("换行找地结果", firstPos);
                    //如果找到第一块地
                    if (firstPos) {
                        plantFalseNum = 0;
                        click_buy_botton_Num = 0;
                        lastPos = firstPos;
                        log("换行，找第一块地", firstPos);
                        continue;
                    } else { //未找到第一块地
                        firstPos = null;
                        lastPos = null;
                        shouldSwitch = false;
                        log("换行，未找到第一块地");
                        continue;
                    }
                } else { //下一块地不在范围内
                    firstPos = null;
                    lastPos = null;
                    shouldSwitch = false;
                    log("换行，下一块地不在范围内");
                    continue;
                }
            }

            if (!lastPos) {
                //检测左边一列,如果找到地
                let findpos1 = findland([700, 140, 900 - 700, 570 - 140])
                if (findpos1) {
                    plantFalseNum = 0;
                    click_buy_botton_Num = 0;
                    log("左边一列找到地", findpos1);
                    lastPos = findpos1;
                    firstPos = findpos1;
                    continue;
                } else {  //左边一列没有找到地，全部区域内找地
                    log("左边一列未找到地，全部区域内找地");
                    let findpos2 = findland([410, 140, 600 - 410, 570 - 140]);
                    //如果找到地
                    if (findpos2) {
                        plantFalseNum = 0;
                        click_buy_botton_Num = 0;
                        log("全部区域内找到地", findpos2);
                        lastPos = findpos2;
                        firstPos = findpos2;
                        continue;
                    } else { //没有找到地
                        plantFalseNum++;
                        log("全部区域内未找到地，种植失败次数", plantFalseNum);
                        showTip("未找到地，失败次数" + plantFalseNum);
                        // sleep(500);
                        continue;
                    }
                }
            } else { //有上一块地
                //种树
                plantTrees(lastPos);
                //种完树，找下一块地，如果下一块地在范围内
                let nextPos = { x: lastPos.x + right, y: lastPos.y + down };
                if (inRange(nextPos)) {
                    log("找下一块地");
                    lastPos_1 = findland([lastPos.x + right * 0.5, lastPos.y + down * 0.5, right, down]);
                    lastPos = lastPos_1 ? lastPos_1 : null;
                    log("找下一块地结果", lastPos);
                    continue;
                } else { //下一块地不在范围内
                    log("下一块地不在范围内，准备换行");
                    shouldSwitch = true;
                    lastPos = null;
                    continue;
                }
            }

        }
        //     if (!plantTrees()) {
        //         plantFalseNum++;
        //         log("种植失败次数", plantFalseNum);
        //     } else {
        //         plantFalseNum = 0;
        //     }
        // }



        //滑动
        // let isSwipe = true;  //是否滑动
        let isSwipe = config.treeShouldSwipe; //是否滑动
        if (isSwipe) {
            log(buy_menu(false))
            if (buy_menu(false) == 2) {
                click(660 + ran(), 650 + ran())
            } else if (buy_menu(false) == 3) {
                click(560 + ran(), 630 + ran())
            }
            sleep(500);
            //上滑
            if (shouldSwipe == "up") {
                log("上滑");
                showTip("上滑");
                swipe(640 + ran(), 360 + ran(), 640 - right * 10 + ran(), 360 + down * 10 + ran(), 1000);
                shouldSwipe = "down";
            } else if (shouldSwipe == "down") {
                log("下滑");
                showTip("下滑");
                swipe(640 + ran(), 360 + ran(), 640 + right * 10 + ran(), 360 - down * 10 + ran(), 1000);
                shouldSwipe = "right";
            } else if (shouldSwipe == "right") {
                log("右滑");
                showTip("右滑");
                swipe(640 + ran(), 360 + ran(), 640 - right * 10 + ran(), 360 - down * 10 + ran(), 1000);
                shouldSwipe = "up";
            }
            sleep(500);
        }

    }


}
main();


// while (true) {
// log(buy_menu())
// sleep(1000)
// }
