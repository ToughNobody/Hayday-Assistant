

//全局

const timerMap = new Map();

let appExternalDir = context.getExternalFilesDir(null).getAbsolutePath();
const configDir = files.join(appExternalDir, "configs");
const configPath = files.join(configDir, "config.json");
let content = files.read(configPath);
let config = JSON.parse(content);



//设定分辨率
let ScreenSize = config.deviceScreenSize;
let Size = ScreenSize.split("×").map(Number).sort((a, b) => b - a);
// setScreenMetrics(Size[0], Size[1]);
// 设计稿参数
const designWidth = 2664, designHeight = 1200;

// 目标设备参数
const targetWidth = Size[0];
const targetHeight = Size[1];
if (Size[0] == 1280 || Size[1] == 720) {
    const SizeCode = 0;
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

//随机值为5的偏移值
let randomOffset = 5;
function ran() {
    return Math.random() * (2 * randomOffset) - randomOffset;
}


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


//自动获取截图权限
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
} else {
    // toastLog("已获得截图权限");
}



// console.setSize(0.4, 0.4).setPosition(
//     0.57, 0.6).setTouchable(false).setExitOnClose(
//     true).show().log("打开控制台")
//setScreenMetrics(1200,2664);
//图片定位
/**
 * 在屏幕中查找模板图片的中心坐标
 * @param {string} imagepath - 模板图片路径（支持相对路径或绝对路径）
 * @param {number} xiangsidu - 匹配相似度阈值（0~1，值越大匹配越严格）
 * @returns { {x: number, y: number} | null } - 返回匹配区域中心坐标，未找到时返回 null
 * @throws {Error} 当截图失败或图片处理异常时抛出错误
 * @example
 * // 查找图片中心点
 * const center = findimage("./icons/button.png", 0.8);
 * if (center) {
 *   click(center.x, center.y); // 点击找到的中心位置
 * }
 */


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


//文字识别，返回坐标中心位置
/**
 * 在指定区域识别屏幕文字并返回匹配文字的坐标
 * @param {string} text - 要查找的目标文字
 * @param {number} [x=null] - 识别区域左上角x坐标（null表示全屏）
 * @param {number} [y=null] - 识别区域左上角y坐标
 * @param {number} [w=null] - 识别区域宽度
 * @param {number} [h=null] - 识别区域高度
 * @returns {Array|null} 返回匹配文字的[x,y]坐标，未找到返回null
 */
function findtext(text, x = null, y = null, w = null, h = null) {
    let region = [x, y, w, h];
    sleep(500);
    let sc = captureScreen();
    let results = ocr.paddle.detect(sc, region);

    // let targetText = "  "; // 你要点击的文字

    let targetText = text;

    for (let i = 0; i < results.length; i++) {
        let result = results[i];
        let recognizedText = result.label;
        // let confidence = result.confidence;
        let bounds = result.bounds;

        if (recognizedText && recognizedText.includes(targetText)) {
            log("找到目标文字: " + recognizedText);

            // 计算中心点坐标
            let centerX = bounds.left + (bounds.right - bounds.left) / 2;
            let centerY = bounds.top + (bounds.bottom - bounds.top) / 2;
            // log("点击坐标: (" + centerX + ", " + centerY + ")");
            // click(centerX, centerY);
            sc.recycle();
            return {
                x: centerX,
                y: centerY
            };
        }
    }
    sc.recycle();
    return false;
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



//checkmenu 检查主菜单

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
        let menu = null;
        let sc = null;

        try {
            let sc = captureScreen();
            let screenWidth = sc.width;
            let screenHeight = sc.height;

            // 动态调整检测坐标
            let checkPoints = [];
            if (Size[0] == 1280 && Size[1] == 720) {
                checkPoints = [
                    { x: 50, y: 206, color: "#f3bb00" },  // 菜单按钮
                    { x: 52, y: 652, color: "#3377b7" },  // 购买按钮
                    { x: Math.min(1255, screenWidth - 1), y: Math.min(665, screenHeight - 1), color: "#a24700" }  // 好友按钮
                ];
            } else {
                checkPoints = [
                    // { x: adapt(84, 344)[0], y: adapt(84, 344)[1], color: "#f3bb00" },
                    // { x: adapt(86, 1092)[0], y: adapt(86, 1092)[1], color: "#3377b7" },
                    { x: Math.min(adapt(2622, 1112)[0], screenWidth - 1), y: Math.min(adapt(2622, 1112)[1], screenHeight - 1), color: "#a24700" }
                ];
            }

            let allMatch = true;
            for (let point of checkPoints) {
                if (point.x >= screenWidth || point.y >= screenHeight) {
                    console.warn(`坐标(${point.x},${point.y})超出屏幕范围(${screenWidth}x${screenHeight})`);
                    allMatch = false;
                    break;
                }

                try {
                    if (!images.detectsColor(sc, point.color, point.x, point.y, 32)) {
                        allMatch = false;
                        break;
                    }
                } catch (e) {
                    console.error(`颜色检测出错:`, e);
                    allMatch = false;
                    break;
                }
            }

            sc.recycle();

            if (allMatch) {
                log(`第 ${i + 1} 次检测: 已进入主界面`);
                showTip(`第 ${i + 1} 次检测: 已进入主界面`);
                return true;
            }
        } catch (e) {
            console.error("检测过程中出错:", e);
            // return false;
        } finally {
            // 确保资源回收（即使发生异常）
            if (menu) menu.recycle();
            if (sc) sc.recycle();
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





//点击叉号
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


//滑动
function huadong() {
    //缩放
    gestures([0, 200, [420 + ran(), 133 + ran()], [860 + ran(), 133 + ran()]],
        [0, 200, [1000 + ran(), 133 + ran()], [860 + ran(), 133 + ran()]
        ]);
    sleep(200);
    //缩放
    gestures([0, 200, [420 + ran(), 250 + ran()], [860 + ran(), 250 + ran()]],
        [0, 200, [1000 + ran(), 250 + ran()], [860 + ran(), 250 + ran()]
        ]);
    sleep(100);
    //左滑
    swipe(300 + ran(), 125 + ran(), 980 + ran(), 720, 200);
    sleep(100)
    //左滑
    swipe(300 + ran(), 125 + ran(), 980 + ran(), 720, 200);
    sleep(100)
    //下滑
    gesture(1000, [730 + ran(), 580 + ran()],
        [710 + ran(), 270 + ran()],
    );
}

//找耕地，并点击
/**
 * 查找并点击商店附近的耕地位置
 * @param {boolean} isclick - 是否执行点击操作，默认为true
 * @returns {object|null} 返回耕地中心坐标对象{x,y}，若未找到商店则返回null
 * @description 该函数首先查找商店位置，然后根据商店位置计算相邻耕地坐标
 *              主要用于定位耕地位置
 */
function findland(isclick = true) {

    let pos_shop = findshop()

    if (pos_shop) {
        console.log("找到商店，点击耕地")
        // showTip("点击耕地");

        let center_land = {
            x: pos_shop.x + config.landOffset.x,
            y: pos_shop.y + config.landOffset.y,
        };
        if (isclick) {
            click(center_land.x, center_land.y); //100,-30
        }

        return center_land

    } else {
        return null;
    }
}
//找商店，只寻找

function findshop() {
    console.log("找" + config.landFindMethod);
    let center;
    if (config.landFindMethod == "商店") {
        center = findimage(files.join(config.photoPath, "shop.png"), 0.6);
        if (!center) {
            center = findimage(files.join(config.photoPath, "shop1.png"), 0.6);
        }
        if (center) {
            //找到商店
            console.log("找到" + config.landFindMethod + "，坐标: " + center.x + "," + center.y,);
            return center;
        } else {
            console.log("未找到" + config.landFindMethod);
            //未找到商店;
            return false;
        }
    } else {
        center = findimage(files.join(config.photoPath, "bakery.png"), 0.6);
        if (!center) {
            center = findimage(files.join(config.photoPath, "bakery1.png"), 0.6);
        };
    };
    if (center) {
        console.log("找到" + config.landFindMethod + "，坐标: " + center.x + "," + center.y,);
        // 找到面包房
        return center;
    } else {
        console.log("未找到" + config.landFindMethod);
        // 未找到面包房
        return false;
    }
}
//打开路边小店
function openshop() {
    let maxAttempts = 2; // 最大尝试次数
    for (let i = 0; i < maxAttempts; i++) {
        let findshop_1 = findshop();
        if (findshop_1) {
            console.log("打开路边小店");
            showTip("打开路边小店");
            sleep(300);
            click(findshop_1.x + config.shopOffset.x + ran(), findshop_1.y + config.shopOffset.y + ran());
            return true; // 成功找到并点击
        }

        if (i < maxAttempts - 1) { // 如果不是最后一次尝试，就滑动重找
            console.log("未找到商店，尝试滑动重新寻找");
            showTip("未找到商店，尝试滑动重新寻找");
            sleep(1000);
            huadong();
            sleep(1100);
        }
    }
    console.log("多次尝试后仍未找到商店");
    showTip("多次尝试后仍未找到商店");
    return false; // 表示未能成功打开商店
};
//     try {
//         click(findshop_1.x + config.shopOffset.x, findshop_1.y + config.shopOffset.y)
//     } catch (e) {
//         console.log(e.message)
//     }


//从头开始滑动找耕地
function findland_click() {

    huadong();
    sleep(1100)

    let findland_click_pos = findland()
    if (findland_click_pos) {
        return findland_click_pos
    } else {
        checkmenu()
    }
}

//收割，播种
function harvest(center) {
    // 参数检查
    if (!center) {
        console.log("错误：center坐标无效");
        return;
    }
    let center_land = findland(false);
    // 定义偏移量
    const L = {
        x: config.harvestOffset.x,
        y: config.harvestOffset.y
    }; // 左移
    const R = {
        x: -L.x,
        y: -L.y
    }; // 右移
    const S = {
        x: config.harvestOffset.x2,
        y: config.harvestOffset.y2
    }; // 换行

    let pos1 = [config.firstland.x, config.firstland.y]
    let pos2 = config.distance
    // 安全坐标计算
    let pos_land = {
        x: center_land.x + pos1[0],
        y: center_land.y + pos1[1]
    }
    const safe = (x, y) => [
        Math.max(0, Math.min(x, device.width - 1)),
        Math.max(0, Math.min(y, device.height - 1))
    ];

    gestures([0, 5000,
        safe(center.x, center.y),
        safe(pos_land.x, pos_land.y),
        safe(pos_land.x + L.x, pos_land.y + L.y),
        safe(pos_land.x + L.x + S.x, pos_land.y + L.y + S.y),
        safe(pos_land.x + L.x + S.x + R.x, pos_land.y + L.y + S.y + R.y),
        safe(pos_land.x + 2 * L.x + S.x + R.x, pos_land.y + 2 * L.y + S.y + R.y),
        safe(pos_land.x + 2 * L.x + 2 * S.x + R.x, pos_land.y + 2 * L.y + 2 * S.y + R.y),
        safe(pos_land.x + 2 * L.x + 2 * S.x + 2 * R.x, pos_land.y + 2 * L.y + 2 * S.y + 2 * R.y),
        safe(pos_land.x + 3 * L.x + 2 * S.x + 2 * R.x, pos_land.y + 3 * L.y + 2 * S.y + 2 * R.y),
        safe(pos_land.x + 3 * L.x + 3 * S.x + 2 * R.x, pos_land.y + 3 * L.y + 3 * S.y + 2 * R.y),
        safe(pos_land.x + 3 * L.x + 3 * S.x + 3 * R.x, pos_land.y + 3 * L.y + 3 * S.y + 3 * R.y),
        safe(pos_land.x + 4 * L.x + 3 * S.x + 3 * R.x, pos_land.y + 4 * L.y + 3 * S.y + 3 * R.y),
        safe(pos_land.x + 4 * L.x + 4 * S.x + 3 * R.x, pos_land.y + 4 * L.y + 4 * S.y + 3 * R.y),
        safe(pos_land.x + 4 * L.x + 4 * S.x + 4 * R.x, pos_land.y + 4 * L.y + 4 * S.y + 4 * R.y),
        safe(pos_land.x + 5 * L.x + 4 * S.x + 4 * R.x, pos_land.y + 5 * L.y + 4 * S.y + 4 * R.y),
        safe(pos_land.x + 5 * L.x + 5 * S.x + 4 * R.x, pos_land.y + 5 * L.y + 5 * S.y + 4 * R.y)
    ],

        // 第二组手势路径（Y-100）
        [0, 5000,
            safe(center.x, center.y),
            safe(pos_land.x, pos_land.y + pos2),
            safe(pos_land.x + L.x, pos_land.y + L.y + pos2),
            safe(pos_land.x + L.x + S.x, pos_land.y + L.y + S.y + pos2),
            safe(pos_land.x + L.x + S.x + R.x, pos_land.y + L.y + S.y + R.y + pos2),
            safe(pos_land.x + 2 * L.x + S.x + R.x, pos_land.y + 2 * L.y + S.y + R.y + pos2),
            safe(pos_land.x + 2 * L.x + 2 * S.x + R.x, pos_land.y + 2 * L.y + 2 * S.y + R.y + pos2),
            safe(pos_land.x + 2 * L.x + 2 * S.x + 2 * R.x, pos_land.y + 2 * L.y + 2 * S.y + 2 * R.y + pos2),
            safe(pos_land.x + 3 * L.x + 2 * S.x + 2 * R.x, pos_land.y + 3 * L.y + 2 * S.y + 2 * R.y + pos2),
            safe(pos_land.x + 3 * L.x + 3 * S.x + 2 * R.x, pos_land.y + 3 * L.y + 3 * S.y + 2 * R.y + pos2),
            safe(pos_land.x + 3 * L.x + 3 * S.x + 3 * R.x, pos_land.y + 3 * L.y + 3 * S.y + 3 * R.y + pos2),
            safe(pos_land.x + 4 * L.x + 3 * S.x + 3 * R.x, pos_land.y + 4 * L.y + 3 * S.y + 3 * R.y + pos2),
            safe(pos_land.x + 4 * L.x + 4 * S.x + 3 * R.x, pos_land.y + 4 * L.y + 4 * S.y + 3 * R.y + pos2),
            safe(pos_land.x + 4 * L.x + 4 * S.x + 4 * R.x, pos_land.y + 4 * L.y + 4 * S.y + 4 * R.y + pos2),
            safe(pos_land.x + 5 * L.x + 4 * S.x + 4 * R.x, pos_land.y + 5 * L.y + 4 * S.y + 4 * R.y + pos2),
            safe(pos_land.x + 5 * L.x + 5 * S.x + 4 * R.x, pos_land.y + 5 * L.y + 5 * S.y + 4 * R.y + pos2)
        ]);
}

//多图识别
function findimages(imagepath, xiangsidu, max_number) {
    let sc = captureScreen();
    //let sc = images.read("/storage/emulated/0/脚本/卡通农场/pictures/coin.png")
    if (!sc) {
        console.log("截图失败");
        return [];
    }
    let picture = images.read(imagepath);
    if (!picture) {
        sc.recycle();
        console.log("图片读取出错，请检查路径");
        return [];
    }
    let results = images.matchTemplate(sc, picture, {
        max: max_number,
        threshold: xiangsidu
    }).matches || [];
    const results1 = [];

    if (results.length > 0) {
        // 提取所有坐标
        results.forEach((match, index) => {
            let {
                x,
                y
            } = match.point;
            console.log(`目标${index + 1}: (${x}, ${y})`);
            //click(x, y);
            results1.push({
                x,
                y
            })
        });
    } else {
        console.log("多图识别调用：未找到目标");
    }

    sc.recycle();
    picture.recycle();
    return results1;

}

function harvest_wheat() {

    sleep(1000)
    let center_sickle = findMC(["#c6b65d", [-9, 9, "#b5984d"], [39, -1, "#ffdf7c"], [10, -62, "#f3f2f6"], [55, -72, "#e5e5e6"]]);
    if (center_sickle) {
        console.log("找到镰刀,准备收割，坐标: " +
            center_sickle.x + "," + center_sickle.y);
        showTip("找到镰刀，准备收割");
    } else {
        console.log("未找到镰刀");
        showTip("未找到镰刀");
    };
    sleep(500);
    try {
        harvest(center_sickle);
    } catch (e) {
        console.error("收割harvest出错:", e);
    }
    sleep(300);
    let sc = captureScreen();
    find_close(sc);
    sc.recycle();
}

//收金币
function coin() {
    console.log("收金币");
    // showTip("收金币");
    let allcenters = [];
    let centers1 = findimages(files.join(config.photoPath, "shopsold1.png"), 0.8, 10);
    allcenters.push(centers1);
    sleep(100);
    let centers2 = findimages(files.join(config.photoPath, "shopSold1.png"), 0.8, 10);
    allcenters = centers1.concat(centers2);
    allcenters.sort((a, b) => a.x - b.x);
    allcenters = centers1
    console.log("有" + allcenters.length + "个金币可以收");
    console.log(allcenters)
    if (allcenters.length > 0) {
        showTip("有" + allcenters.length + "个金币可以收")
    }
    allcenters.forEach(target => {
        let pos = adapt(100, 100);
        click(target.x + pos[0] + ran(), target.y + pos[1] + ran());
        sleep(100);
    });
}


//商店货架寻找小麦，发布广告
function find_ad() {
    let shop_coin = findimage(files.join(config.photoPath, "shop_coin.png"), 0.4);
    if (shop_coin) {
        //如果找到货架上的小麦
        let [x1, y1] = adapt(-120, -80);
        click(shop_coin.x + x1 + ran(), shop_coin.y + y1 + ran()); //点击小麦
        sleep(300);
        // let ad = findtext("立即发布广告", 800, 450, 2000 - 800, 800 - 450);
        let ad = matchColor([{ x: 765, y: 423, color: "#fbba15" }, { x: 496, y: 499, color: "#cbcbcb" }]);
        if (ad) {
            console.log("可以发布广告");
            if (SizeCode == 0) {
                click(800 + ran(), 330 + ran());
            } else {
                click(adapt(1600 + ran(), 560 + ran()))
            }

            sleep(100);
            if (SizeCode == 0) {
                click(640 + ran(), 500 + ran());
            } else {
                click(adapt(1350 + ran(), 840 + ran()))
            }

            return true;
        }

    } else {
        console.log("发布广告时未找到可上架物品");
        showTip("发布广告时未找到可上架物品");
        return false;

    }
}



//商店售卖
function shop() {
    console.log("当前操作:商店");
    showTip("商店售卖");
    sleep(300);
    coin();
    sleep(1000);
    let shopEnd = false;
    let shopisswipe = false;
    let maxAttempts = 5; // 最大尝试次数
    let attempts = 0; // 当前尝试次数

    // 检查是否还在商店界面
    if (!matchColor([{ x: 120, y: 70, color: "#fc5134" }, { x: 177, y: 76, color: "#fefefd" }, { x: 263, y: 72, color: "#fd5335" }])) {
        console.log("未检测到商店界面，可能已关闭");
        return;
    }

    while (!shopEnd && attempts < maxAttempts) {
        // 每次循环开始时检查是否还在商店界面
        // if (!matchColor([{ x: 120, y: 70, color: "#fc5134" }, { x: 177, y: 76, color: "#fefefd" }, { x: 263, y: 72, color: "#fd5335" }])) {
        //     console.log("商店界面已关闭，退出循环");
        //     return;
        // }
        if (shopisswipe) {
            shopEnd = matchColor([{ x: 990, y: 292, color: "#cccccc" }]);
            if (shopEnd) {
                log("右滑到顶了");
                showTip("右滑到顶了");
            }
        }
        sleep(300);
        //找空闲货架
        let kongxian = findMC(["#f1e044", [15, -2, "#7b593d"], [-8, 57, "#e4ad3d"], [-10, 67, "#f7ce8d"]], null, [160, 130, 1100 - 160, 600 - 130], 20);

        if (kongxian) { //有空闲货架点击上架
            console.log("找到空闲货架");
            showTip("找到空闲货架");
            click(kongxian.x + ran(), kongxian.y + ran()); //点击空闲货架
            console.log("点击空闲货架")
            sleep(100);
            if (SizeCode == 0) {
                click(200 + ran(), 200 + ran());
            } else {
                click(adapt(550 + ran(), 370 + ran()))
            }//点击售卖粮仓按钮
            console.log("点击粮仓按钮")
            sleep(100);

            let wheat_sail = findMC(crop_sail, null, [270, 120, 650 - 270, 680 - 120], 16);

            // let wheat = images.findImage(
            //     captureScreen(), wheat_sail, {
            //         threshold: 0.3,
            //         region: [700, 200, 700, 900]
            //     });
            if (wheat_sail) {   //找到售卖货架上的作物

                click(wheat_sail.x + ran(), wheat_sail.y + ran()); //点击小麦
                console.log("点击" + config.selectedCrop.text);
                // showTip("点击"+config.selectedCrop.text);

                //识别数量(1650,270),(1760,410)
                sleep(300);
                // let num10 = findimage(files.join(config.photoPath, "10.png"), 0.6); //识别小麦数量
                let num10 = matchColor([{ x: 847, y: 195, color: "#000000" },
                { x: 860, y: 189, color: "#10100f" },
                { x: 856, y: 231, color: "#000000" },
                { x: 909, y: 230, color: "#000000" },
                { x: 875, y: 208, color: "#faf4d7" },
                { x: 861, y: 209, color: "#5e5c51" }
                ])
                if (num10) {
                    console.log(config.selectedCrop.text + "数量≥20");
                    console.log("修改售价");
                    if (config.shopPrice.code == 0) {
                        if (SizeCode == 0) {
                            click(860 + ran(), 360 + ran());
                        } else {
                            click(adapt(1728 + ran(), 630 + ran()))
                        };//修改售价(最低)
                    } else if (config.shopPrice.code == 2) {
                        if (SizeCode == 0) {
                            click(1020 + ran(), 370 + ran());
                        } else {
                            click(adapt(1960 + ran(), 620 + ran()))
                        }
                    }
                    sleep(100);
                    if (SizeCode == 0) {
                        click(940 + ran(), 660 + ran());
                    } else {
                        click(adapt(1850 + ran(), 1120 + ran()))
                    };//上架
                    console.log("上架");
                    sleep(100);
                    kongxian = findMC(["#f1e044", [15, -2, "#7b593d"], [-8, 57, "#e4ad3d"], [-10, 67, "#f7ce8d"]], null, [160, 130, 1100 - 160, 600 - 130]);
                } else {
                    console.log(config.selectedCrop.text + "数量不足20,结束售卖");
                    showTip(config.selectedCrop.text + "数量不足20,结束售卖");
                    close();
                    log(config.selectedCrop.text + "数量不足，退出售卖")
                    break;
                }
            } else {   //没找到售卖货架上的作物
                console.log("未识别到" + config.selectedCrop.text);
                showTip("未识别到" + config.selectedCrop.text);
                // toast("未识别到小麦")
                close();
                break;
            }
        } else {    //没有空闲货架
            console.log("未找到空闲货架");
            showTip("未找到空闲货架");
            attempts++;
            sleep(200)
            const [x1, y1] = adapt(2000, 650);
            const [x2, y2] = adapt(600, 650);
            swipe(x1 + ran(), y1 + ran(), x2 + ran(), y2 + ran(), 600);
            console.log("商店右滑")
            sleep(400);
            coin();
        }
        shopisswipe = true;
    }
    console.log("发布广告");
    showTip("发布广告");
    sleep(300);
    coin();
    sleep(500);
    let shop_coin = findimage(files.join(config.photoPath, "shop_coin.png"), 0.6);
    if (shop_coin) {
        //如果找到货架上的金币

        click(shop_coin.x + ran(), shop_coin.y + ran()); //点击可上架物品
        log("发布广告：点击" + config.selectedCrop.text)
        sleep(300);

        let ad = matchColor([{ x: 750, y: 420, color: "#fff9db" }]);
        if (!ad) {
            console.log("可以发布广告");
            if (SizeCode == 0) {
                click(800 + ran(), 330 + ran());
            } else {
                click(adapt(1600 + ran(), 560 + ran()))
            }

            sleep(100);
            if (SizeCode == 0) {
                click(640 + ran(), 500 + ran());
            } else {
                click(adapt(1350 + ran(), 840 + ran()))
            }
            sleep(200);
            close();
        } else {
            console.log("广告正在冷却或已发布广告");
            showTip("广告正在冷却或已发布广告");
            sleep(200);
            close();
            sleep(100);
        }
    } else {  //如果没有找到货架上的物品
        coin();
        sleep(500);
        let is_find_ad = find_ad();
        log("发布广告：没找到货架上的物品");
        if (!is_find_ad) {
            const [x3, y3] = adapt(600, 650);
            const [x4, y4] = adapt(2250, 650);
            swipe(x3 + ran(), y3 + ran(), x4 + ran(), y4 + ran(), 600);
            sleep(400);
            is_find_ad = find_ad();
            if (!is_find_ad) {
                console.log("未能发布广告")
                sleep(200)
                close();
                sleep(100);
            }
            sleep(200);
            close();
        } else {
            sleep(200);
            close();
        }
    }
    sleep(500);
    find_close();
    sleep(500);
    find_close();
}

//寻找是否有关闭按钮或者在其他页面
function find_close(screenshot1) {
    let sc = screenshot1 || captureScreen();
    let close_button = findimage(files.join(config.photoPath, "close.png"), 0.5, sc);
    if (close_button) {
        click(close_button.x + ran(), close_button.y + ran());
        console.log("点击叉叉");
        showTip("点击叉叉");
        return true;
    }

    let homebtn1 = matchColor([{ x: 161, y: 39, color: "#f4323a" },
    { x: 213, y: 40, color: "#f63540" },
    { x: 235, y: 629, color: "#c686dc" },
    { x: 248, y: 649, color: "#5ed261" }],
        screenshot = sc);
    if (homebtn1) {
        click(200 + ran(), 645 + ran());
        console.log("回到主界面");
        showTip("回到主界面");
        checkmenu();
        return true;
    }

    let homebtn2 = matchColor([{ x: 113, y: 642, color: "#5cd260" }, //进入鱼塘
    { x: 80, y: 645, color: "#a563c7" },
    { x: 91, y: 596, color: "#e9c900" }],
        screenshot = sc);
    if (homebtn2) {
        click(60 + ran(), 630 + ran());
        console.log("回到主界面");
        showTip("回到主界面");
        checkmenu();
        return true;
    }

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
        return true;
    }

    // let disconnect = findimage(files.join(config.photoPath, "disconnected.png"), 0.8, sc);
    let disconnect = matchColor([{ x: 279, y: 222, color: "#fff9db" },
    { x: 435, y: 62, color: "#deb476" },
    { x: 630, y: 202, color: "#ffe9d6" },
    { x: 647, y: 632, color: "#fada75" }],
        screenshot = sc);
    if (disconnect) {
        console.log("断开连接，重试");
        showTip("断开连接，重试");
        if (SizeCode == 0) {
            click(640 + ran(), 660 + ran())
        } else { click(adapt(1300 + ran(), 1100 + ran())) };
        sleep(1000);
        checkmenu();
        return true;
    }

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

    return false;
}

function switch_account(Account, num = 0) {
    console.log("切换账号" + Account);
    showTip("切换账号" + Account);
    sleep(700)
    let huanhao1 = matchColor([{ x: 44, y: 189, color: "#ffffff" }, { x: 40, y: 166, color: "#ffffff" }, { x: 51, y: 206, color: "#f3bb00" }]);

    let sc = captureScreen();
    find_close(sc);
    sc.recycle();
    sleep(300);

    if (huanhao1) {
        click(41 + ran(), 184 + ran());
    }
    sleep(700);
    let huanhao2 = matchColor([{ x: 112, y: 402, color: "#fefbfa" }, { x: 133, y: 396, color: "#f7c045" }, { x: 340, y: 409, color: "#f6b42f" }]);
    if (huanhao2) {

        click(225 + ran(), 404 + ran());
    }
    sleep(800);
    let huanhao3 = matchColor([{ x: 455, y: 66, color: "#dfb577" }, { x: 615, y: 162, color: "#2660a9" }, { x: 729, y: 186, color: "#ffffff" }]);
    if (huanhao3) {

        click(750 + ran(), 175 + ran());
        let findAccountMenuNum = 0;    //寻找账号菜单次数
        while (true) {
            findAccountMenuNum++;
            if (findAccountMenuNum > 5 && num < 3) {
                num++
                console.log(`未识别到切换账号界面，重试第${num}次`)
                showTip(`未识别到切换账号界面，重试第${num}次`)
                sleep(3000);
                find_close();
                sleep(200);
                find_close();
                let nums = num
                num = switch_account(Account, nums);
            } else if (findAccountMenuNum > 5 && num >= 3) {
                console.log("重试次数过多，重进游戏");
                showTip("重试次数过多，重进游戏");
                restartgame();
            }
            if (matchColor([{ x: 56, y: 63, color: "#ffffff" },
            { x: 530, y: 70, color: "#041d51" },
            { x: 38, y: 687, color: "#52b4dd" },
            { x: 550, y: 697, color: "#0e3683" }])) {
                break;
            }
            sleep(1000);
        }

        const MAX_SCROLL_DOWN = 3; // 最多下滑3次
        const MAX_SCROLL_UP = 2; // 最多上滑2次

        let found = false; // 是否找到目标
        let scrollDownCount = 0; // 当前下滑次数
        let scrollUpCount = 0; // 当前上滑次数
        let AccountIma = files.join(config.photoPath, Account + ".png");
        while (!found) {

            let is_find_Account = findimage(AccountIma, 0.7);

            if (is_find_Account) { //如果找到账号名称，则点击
                log(`找到账号${Account}`);
                showTip(`找到账号${Account}`);
                sleep(500);
                click(is_find_Account.x + ran(), is_find_Account.y + ran());
                sleep(500);
                found = true;
                break;
            }
            if (scrollDownCount < MAX_SCROLL_DOWN) {
                const [x1, y1] = adapt(2000, 1000);
                const [x2, y2] = adapt(2000, 100);
                swipe(x1 + ran(), y1 + ran(), x2 + ran(), y2 + ran(), [500]); // 下滑
                scrollDownCount++;
                log(`未找到账号，第 ${scrollDownCount} 次下滑...`);
                showTip(`未找到账号，第 ${scrollDownCount} 次下滑...`);
                sleep(1500);
                continue;
            }
            else if (scrollUpCount > MAX_SCROLL_UP) {
                log("未找到目标账号，重启游戏");
                show("未找到目标账号，重启游戏");
                restartgame();
            }
            // 1270,0
            else if (scrollDownCount >= MAX_SCROLL_DOWN) {
                log(`未找到账号，上滑回顶部...`);
                showTip("未找到账号，上滑回顶部");
                const [x3, y3] = adapt(2000, 100);
                const [x4, y4] = adapt(2000, 1000);
                swipe(x3 + ran(), y3 + ran(), x4 + ran(), y4 + ran(), [500]); // 上划
                sleep(200);
                swipe(x3 + ran(), y3 + ran(), x4 + ran(), y4 + ran(), [500]); // 上划
                sleep(200);
                swipe(x3 + ran(), y3 + ran(), x4 + ran(), y4 + ran(), [500]); // 上划
                sleep(200);
                swipe(x3 + ran(), y3 + ran(), x4 + ran(), y4 + ran(), [500]); // 上划
                sleep(200);
                scrollDownCount = 0;
                scrollUpCount++;
            } else {


            }
        }
    } else {
        if (num < 3) {
            num++
            console.log(`未识别到切换账号按钮，重试第${num}次`)
            sleep(3000);
            find_close();
            sleep(200);
            find_close();
            let nums = num
            num = switch_account(Account, nums);
        } else {
            console.log("超过最大尝试次数，重进游戏")
            restartgame();
        }
    }
    sleep(2000);
    checkmenu();
    return num;
}


// function timer(second = 120) {
//     for (let i = second; i >= 0; i--) {
//         global.remainingTime = i
//         sleep(1000);
//     }
// }


/**
 * 全局计时器存储Map
 * @type {Map<string, Thread>} 
 * @description 用于存储所有活动的计时器线程，键为计时器名称，值为对应的线程对象
 */


/**
 * 启动一个新的计时器
 * @param {string} timer_Name - 计时器的唯一标识名称（用于区分不同计时器）
 * @param {number} [seconds=120] - 计时时长（单位：秒，默认120秒）
 * @example
 * // 启动一个90秒的计时器
 * timer("任务倒计时", 90);
 */
function timer(timer_Name, seconds = 120) {
    // 停止已有同名计时器
    if (timerMap.has(timer_Name)) {
        timerMap.get(timer_Name).interrupt();
    }

    // 创建一个对象来存储每个计时器的状态
    if (!global.timerStates) {
        global.timerStates = {};
    }

    global.timerThread = threads.start(function () {
        for (let i = seconds; i >= 0; i--) {
            // log(`${timer_Name} 剩余时间: ${i}秒`);
            // 将剩余时间存储在计时器特定的状态对象中
            global.timerStates[timer_Name] = {
                remainingTime: i,
                name: timer_Name
            };

            sleep(1000);
        }

        timerMap.delete(timer_Name);
        // 清理计时器状态
        if (global.timerStates && global.timerStates[timer_Name]) {
            delete global.timerStates[timer_Name];
        }
    });

    timerMap.set(timer_Name, timerThread);
}

// 获取特定计时器的状态
function getTimerState(timer_Name) {
    if (global.timerStates && global.timerStates[timer_Name]) {
        return global.timerStates[timer_Name];
    }
    return null;
}

function stopTimer(timer_Name) {
    if (timerMap.has(timer_Name)) {
        timerMap.get(timer_Name).interrupt();
        timerMap.delete(timer_Name);

    } else {
        log(`未找到计时器: ${timer_Name}`);
    }
}




//循环操作
function operation(Account) {
    //收小麦
    let sc1 = captureScreen();
    find_close(sc1);
    sleep(200);
    let is_findland = findland();
    if (!is_findland) {
        findland_click();
    }
    console.log("收割" + config.selectedCrop.text);
    showTip(`收割${config.selectedCrop.text}`);
    harvest_wheat();

    //找耕地
    sleep(1500);
    find_close();
    sleep(500);
    center_land = findland();
    console.log("寻找耕地");
    //找不到重新找耕地
    if (!center_land) {
        console.log("未找到，重新寻找耕地");
        findland_click();
    }


    //种小麦
    console.log("准备种" + config.selectedCrop.text);
    showTip(`准备种${config.selectedCrop.text}`);
    sleep(500)
    let center_wheat = findMC(crop);
    if (center_wheat) {
        console.log("找到" + config.selectedCrop.text + "，坐标: " +
            center_wheat.x + "," + center_wheat.y);
    } else {
        console.log("未找到小麦");
        showTip("未找到" + config.selectedCrop.text);
        let next_button = findimage(files.join(config.photoPath, "next.png"), 0.8);

        if (next_button) {

            let maxTries = 50;
            let tries = 0;
            while (tries < maxTries) {
                click(next_button.x + ran(), next_button.y + ran());
                sleep(1000);
                center_wheat = findMC(crop);
                if (center_wheat) {
                    break;
                }
            }
            if (tries > maxTries) {
                log("种植时未能找到作物，退出操作");
                return false;
            }
        }
    }
    // sleep(500);
    console.log("种" + config.selectedCrop.text);
    showTip(`种${config.selectedCrop.text}`);
    try {
        harvest(center_wheat);
    } catch (e) {
        console.error("种植harvest出错:", e);
    }
    //设定计时器
    let timerName = config.switchAccount ? Account + config.selectedCrop.text : config.selectedCrop.text;
    if (config.selectedCrop.code == 0) timer(timerName, 117);
    else if (config.selectedCrop.code == 1) timer(timerName, 294);
    else if (config.selectedCrop.code == 2) timer(timerName, 590);
    else if (config.selectedCrop.code == 3) timer(timerName, 1170);

    // 保存当前计时器名称，以便在其他地方使用
    global.currentTimerName = timerName;
    //打开路边小店
    sleep(500);
    //缩放
    gestures([0, 200, [420 + ran(), 133 + ran()], [860 + ran(), 133 + ran()]],
        [0, 200, [1000 + ran(), 133 + ran()], [860 + ran(), 133 + ran()]
        ]);

    sleep(500);
    openshop();

    //开始售卖
    console.log("===开始售卖系列操作===")
    shop();
}




function main() {

    //打开游戏


    //主界面判断
    sleep(1000);
    checkmenu();
    sleep(500);
    if (!config.switchAccount || config.accountNames.length == 0) { //不切换账号
        log("不切换账号，找耕地");
        huadong();

        sleep(1100);


        //循环操作
        while (true) {
            operation();
            log("等待作物成熟");
            while (true) {
                // 获取计时器剩余时间
                let timerState = getTimerState(global.currentTimerName);
                if (timerState) {
                    showTip(`${config.selectedCrop.text}成熟剩余${timerState.remainingTime}秒`);
                }
                if (!timerThread.isAlive()) {
                    break;
                }
                sleep(1000);
            }
        }
    } else {
        log("切换账号");
        while (true) {
            config.accountNames.forEach(Account => {
                switch_account(Account);
                log("===当前账号: " + Account + "===");
                huadong();
                log("等待作物成熟");

                // 计算下一个账号的信息（在循环外计算一次）
                let nextAccountIndex = (config.accountNames.indexOf(Account) + 1) % config.accountNames.length;
                let nextAccount = config.accountNames[nextAccountIndex];
                let nextTimerName = nextAccount + config.selectedCrop.text;

                operation(Account); //执行刷地，售卖
                while (true) {
                    // 获取下一个账号的计时器状态
                    let nextTimerState = getTimerState(nextTimerName);

                    if (!nextTimerState) {
                        // 如果下一个计时器不存在，直接跳出循环
                        break;
                    }

                    // 显示下一个计时器的状态
                    showTip(`账号:${nextAccount} ${config.selectedCrop.text}成熟剩余${nextTimerState.remainingTime}秒`);

                    if (!timerThread.isAlive()) {
                        break;
                    }
                    sleep(1000);
                }
                sleep(1100);
            });

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