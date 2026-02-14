


//全局

const Font = require("./img_Base64.js");
const color_lib = require("./color_lib.js");
const timerMap = new Map();


let appExternalDir = context.getExternalFilesDir(null).getAbsolutePath();

let configs = storages.create("config"); // 创建配置存储对象
let config = configs.get("config");

let token_storage = storages.create("token_storage");
let timeStorage = storages.create("times");
let statistics = storages.create("statistics");

//都取左上为基准点
const cangkuItemColor = color_lib.cangkuItemColor;

// 仓库统计物品颜色
const cangkuStatisticsItemColor = color_lib.cangkuStatisticsItemColor;

//汤姆物品颜色
const tomItemColor = color_lib.tomItemColor;


//其他物品颜色
const otherItemColor = color_lib.otherItemColor;

const allItemColor = color_lib.allItemColor;

const ckNumColor = color_lib.ckNumColor;

//先竖着放，后横着放
const machineColor = color_lib.machineColor;

//crop_sell 识别 130,80
const cropItemColor = color_lib.cropItemColor;

let sicklePoints = allItemColor["镰刀"];


//作物颜色
const cropName = config.selectedCrop.text

let crop = cropItemColor[cropName].crop;
let crop_plant = cropItemColor[cropName].crop_plant;
let crop_sell = cropItemColor[cropName].crop_sell;


let randomOffset = 5; // 随机偏移量
function ran() {
    return Math.random() * (2 * randomOffset) - randomOffset;
}

//自动获取截图权限
function autoSc() {

    let isclick = false;
    // 如果配置了截图坐标，则依次点击填入的坐标
    if ((config.screenshotCoords.coord1.x !== 0 || config.screenshotCoords.coord1.y !== 0) ||
        (config.screenshotCoords.coord2.x !== 0 || config.screenshotCoords.coord2.y !== 0) ||
        (config.screenshotCoords.coord3.x !== 0 || config.screenshotCoords.coord3.y !== 0)) {
        sleep(1000);
        isclick = true;
    }
    // 点击coord1坐标
    if (config.screenshotCoords.coord1.x !== 0 ||
        config.screenshotCoords.coord1.y !== 0) {
        click(parseInt(config.screenshotCoords.coord1.x), parseInt(config.screenshotCoords.coord1.y));
        sleep(500); // 等待500毫秒
    }

    // 点击coord2坐标
    if (config.screenshotCoords.coord2.x !== 0 ||
        config.screenshotCoords.coord2.y !== 0) {
        click(parseInt(config.screenshotCoords.coord2.x), parseInt(config.screenshotCoords.coord2.y));
        sleep(500); // 等待500毫秒
    }

    // 点击coord3坐标
    if (config.screenshotCoords.coord3.x !== 0 ||
        config.screenshotCoords.coord3.y !== 0) {
        click(parseInt(config.screenshotCoords.coord3.x), parseInt(config.screenshotCoords.coord3.y));
        sleep(500); // 等待500毫秒
    }

    if (isclick == false) {    // 再尝试点击 "允许"、"确定"、"同意"、"开始" 等按钮（最多 10 秒）

        //等待截屏权限申请并同意
        let testThread = threads.start(function () {
            packageName("com.android.systemui").text("立即开始").waitFor();
            text("立即开始").click();
        });

        threads.start(function () {
            if (!requestScreenCapture(true)) {
                toast("请求截图失败");
                exit();
            } else {
                sleep(1000);
                testThread.interrupt();
            }
        });
    }
    sleep(1000);
}


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
    let screen = null;
    let picture = null;

    try {
        screen = sc || captureScreen();
        if (!screen) {
            console.log("截图失败");
            return null;
        }

        picture = images.read(imagepath);
        if (!picture) {
            toast("模板图片读取失败,读取路径:" + imagepath);
            log("模板图片读取失败,读取路径:" + imagepath);
            return null;
        }

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
        try {
            if (!sc && screen) screen.recycle(); // 只有自己创建的截图才回收
            if (picture) picture.recycle();
        } catch (recycleError) {
            log("资源回收出错: " + recycleError);
        }
    }
}

function checkRoot() {
    try {
        // 方法一：通过执行su命令检测Root权限
        function checkRootByShell() {
            try {
                let result = shell("su -c id", true);
                if (result.code === 0) {
                    console.log("✅ Root检测(Shell方式): 已Root");
                    return true;
                } else {
                    console.log("❌ Root检测(Shell方式): 未Root");
                    return false;
                }
            } catch (e) {
                console.log("⚠️ Root检测(Shell方式)异常: " + e);
                return false;
            }
        }

        // 方法二：检查常见路径下是否存在su文件
        function checkRootBySuPath() {
            const paths = [
                "/system/app/Superuser.apk",
                "/sbin/su",
                "/system/bin/su",
                "/system/xbin/su",
                "/data/local/xbin/su",
                "/data/local/bin/su",
                "/system/sd/xbin/su",
                "/system/bin/failsafe/su",
                "/data/local/su"
            ];

            for (let i = 0; i < paths.length; i++) {
                if (files.exists(paths[i])) {
                    console.log("✅ Root检测(Path方式): 发现su文件 - " + paths[i]);
                    return true;
                }
            }
            console.log("❌ Root检测(Path方式): 未发现su文件");
            return false;
        }

        // 方法三：检查Build Tags是否包含test-keys
        function checkBuildTags() {
            let buildTags = device.buildTags || "";
            if (buildTags.includes("test-keys")) {
                console.log("✅ Root检测(Build Tags方式): 包含test-keys");
                return true;
            } else {
                console.log("❌ Root检测(Build Tags方式): 不包含test-keys");
                return false;
            }
        }

        // 综合判断Root状态
        function isDeviceRooted() {
            // 如果任意一种方式检测到Root，则认为设备已Root
            if (checkRootByShell() || checkRootBySuPath() || checkBuildTags()) {
                return true;
            } else {
                return false;
            }
        }

        return isDeviceRooted();
    } catch (e) {
        console.log("Root检查异常: " + e);
        return false;
    }
}

function restartgame() {
    try {

        if (configs.get("returnDesktop", false)) {
            home();
            for (let i = 0; i < 15; i++) {
                showTip("返回桌面后,等待" + (15 - i) + "秒后再打开游戏");
                sleep(1000);
            }
            launch("com.supercell.hayday")
            return;
        }

        home();
        sleep(100);
        let packageName = "com.supercell.hayday";
        let rootStopSuccess = false;

        // 尝试使用Root方式停止应用
        if (configs.get("restartWithShell", false)) {
            try {
                // 获取应用的PID
                let pidResult = shell("pidof " + packageName, true);
                log(pidResult);
                if (pidResult.code === 0 && pidResult.result) {
                    let pid = pidResult.result.trim();
                    console.log("获取到应用PID: " + pid);

                    // 使用kill命令终止进程
                    let result = shell("kill " + pid, true);
                    if (result.code === 0) {
                        console.log("使用PID成功停止应用");
                        sleep(1000);
                        log("启动卡通农场");
                        launch("com.supercell.hayday");
                        rootStopSuccess = true;
                    } else {
                        console.log("kill命令执行失败: " + result.error);
                    }
                } else {
                    console.log("未能获取到应用PID: " + (pidResult.error || "无PID返回"));
                }
            } catch (e) {
                console.log("使用PID停止应用时出错: " + e);
            }
        }

        // 如果Root方式失败或未使用Root方式，则使用非Root方式停止应用
        if (!rootStopSuccess || !configs.get("restartWithShell", false)) {
            sleep(500);
            app.openAppSetting("com.supercell.hayday")

            // 循环尝试点击"停止"按钮，直到成功
            for (let i = 0; i < 5; i++) {
                if (click("停止")) {
                    log("点击停止按钮");
                    break;
                }
                sleep(1000);
            }

            sleep(500);
            for (let i = 0; i < 3; i++) {
                if (click("确定")) {
                    toastLog("已停止应用");
                    break;
                }
                sleep(300);
            }

            sleep(300);
            log("launch方法启动卡通农场");
            launch("com.supercell.hayday");
            sleep(100)

            if (currentPackage() != "com.supercell.hayday") {
                log("最后的倔强了,bro")
                home();
                sleep(500);
                click("卡通农场")
                log("点击卡通农场")
            }
        }
    } catch (error) {
        log(error);
    }
}

//悬浮窗

function createWindow(position) {
    try {
        // 创建悬浮窗
        window = floaty.rawWindow(
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
                    <vertical w="auto" h="auto" padding="0 0">
                        <text
                            id="text"
                            singleLine="false"
                            minWidth="60"
                            w="auto"
                            maxWidth="500"
                            textSize="12"
                            textColor="#FFFFFF"
                            padding="10 6"
                            text=""
                            gravity="center"
                        />
                    </vertical>
                </card>
            </frame>
        );
        // 确保window和window.text对象存在
        if (!window || !window.text) {
            throw new Error("悬浮窗创建失败");
        }

        // 预先计算位置
        let targetX, targetY;
        if (position) {
            // 使用传入的坐标
            targetX = 1280 * position.x;
            targetY = 720 * position.y;
        } else {
            // 使用默认配置
            targetX = 1280 * config.showText.x;
            targetY = 720 * config.showText.y;
        }
        // 设置位置和不可触摸
        window.setPosition(targetX, targetY);
        // window.setTouchable(false);

        // 保存引用以便后续使用
        ui["tip_window"] = window;

    } catch (e) {
        console.error("createTipWindow函数执行失败:", e);
    }
}

function showTip(text) {

    try {
        if (ui["tip_window"]) {
            ui.run(function () {
                window.text.setText(text);
            })
        }
    } catch (error) {
        log(error);
    }
}

function closeWindow() {
    try {
        ui.run(() => {
            log(window, ui["tip_window"])
            if (window) {
                window.close();
                window = null;
                return;
            }
            if (ui["tip_window"]) {
                ui["tip_window"].close();
                ui["tip_window"] = null;
            }
        })
    } catch (e) {
        console.error("关闭悬浮窗失败:", e);
    }
}

function showDetails(text, position, duration) {
    try {
        // 创建悬浮窗
        window_details = floaty.rawWindow(
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
                    <vertical w="auto" h="auto" padding="0 0">
                        <text
                            id="text"
                            singleLine="false"
                            minWidth="100"
                            w="auto"
                            maxWidth="500"
                            textSize="12"
                            textColor="#FFFFFF"
                            padding="10 6"
                            text=""
                            gravity="center"
                        />
                    </vertical>
                </card>
            </frame>
        );
        // 确保window_details和window_details.text对象存在
        if (!window_details || !window_details.text) {
            throw new Error("悬浮窗创建失败");
        }

        // 预先计算位置
        let targetX, targetY;
        if (position) {
            // 使用传入的坐标
            targetX = 1280 * position.x;
            targetY = 720 * position.y;
        } else {
            // 使用默认配置
            targetX = 1280 * config.showText.x;
            targetY = 720 * config.showText.y;
        }
        // 设置位置和不可触摸
        window_details.setPosition(targetX, targetY);
        // window_details.setTouchable(false);

    } catch (e) {
        console.error("createTipWindow函数执行失败:", e);
    }

    ui.run(function () {
        window_details.text.setText(text);
    })

    ui.run(() => {
        if (duration > 0) {
            setTimeout(() => {
                try {
                    if (window_details) window_details.close();
                } catch (e) {
                    console.error("关闭悬浮窗失败:", e);
                }
            }, duration);
        }
    })


}

function getDetails() {
    let details = "";
    try {
        if ((config.shengcang_h || config.shengcang_l) && config.shengcangTime >= 0) {
            let shengcangTimeState = getTimerState("shengcangTime");
            if (shengcangTimeState) {
                let minutes = Math.floor(shengcangTimeState / 60);
                let seconds = shengcangTimeState % 60;
                let timeText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
                details += `升仓剩余时间: ${timeText}\n`;
            }
        }

        if (config.isCangkuStatistics && config.cangkuStatisticsTime >= 0) {
            let cangkuStatisticsTimeState = getTimerState("cangkuStatisticsTime");
            if (cangkuStatisticsTimeState) {
                let minutes = Math.floor(cangkuStatisticsTimeState / 60);
                let seconds = cangkuStatisticsTimeState % 60;
                let timeText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
                details += `仓库统计剩余时间: ${timeText}\n`;
            }
        }
    } catch (error) {
        log(error);
    }

    return details;
}


/**
 * 
 * @param {*} targetText 需要寻找的目标文字
 * @param {*} sc 截图
 * @param {*} region 寻找区域
 * @returns 如果找到返回目标文字的中心点坐标，否则返回null
 */
function findText(targetText, sc, region) {

    let results = [];
    let img = sc ? sc : captureScreen();
    if (region) {
        try {
            img = images.clip(img, region[0], region[1], region[2], region[3])
        } catch (error) {
            log(error)
        }
    }

    try {
        let ocrResult = gmlkit.ocr(img, "zh")
        if (!ocrResult || !ocrResult.children) {
            return null;
        }

        ocrResult.children.forEach(child => {
            if (child.level === 1 && child.text && child.bounds) {
                results.push({
                    text: child.text,
                    bounds: { left: child.bounds.left + region[0], top: child.bounds.top + region[1], right: child.bounds.right + region[0], bottom: child.bounds.bottom + region[1] },
                    x: child.bounds.left + region[0],
                    y: child.bounds.top + region[1],
                    width: child.bounds.right - child.bounds.left,
                    height: child.bounds.bottom - child.bounds.top
                });
            }
        });

        for (let i = 0; i < results.length; i++) {
            let result = results[i];
            let recognizedText = result.text;
            let bounds = result.bounds;

            if (recognizedText && recognizedText.replace(/\s/g, "").includes(targetText.replace(/\s/g, ""))) {
                log("找到目标文字: " + recognizedText);

                // 计算中心点坐标
                let centerX = bounds.left + (bounds.right - bounds.left) / 2;
                let centerY = bounds.top + (bounds.bottom - bounds.top) / 2;
                return {
                    x: centerX,
                    y: centerY
                };
            }
        }
        log("未找到目标文字: " + targetText);
        log("OCR识别结果:", ocrResult.text)
        return null;
    } catch (error) {

    } finally {
        img.recycle();
    }
}



function matchColor(checkPoints = [], screenshot, xiangsidu = 8) {
    // 参数验证
    if (!Array.isArray(checkPoints) || checkPoints.length === 0) {
        console.warn("checkPoints必须是非空数组");
        return false;
    }

    let sc = screenshot || captureScreen();
    let xiangsidu = xiangsidu || 8;
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
 * @param {number} [threshold=16] 相似度阈值，默认16
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
    threshold = threshold || 16;

    // 处理截图
    let img = null;
    let shouldRecycle = false;

    if (screenshot && typeof screenshot.getWidth === 'function') {
        img = screenshot;
    } else {
        img = images.captureScreen();
        shouldRecycle = true;
    }

    // 构建findOptions对象
    const findOptions = {
        threshold: Math.max(0, Math.min(255, threshold))
    };

    // 处理region参数
    if (region && Array.isArray(region) && region.length === 4) {
        findOptions.region = region;
    }

    try {
        const result = images.findMultiColors(img, firstColor, colors, findOptions);
        // log(findOptions)
        return result ? { x: result.x, y: result.y } : null;
    } catch (e) {
        console.error("执行多点找色失败:", e.message);
        console.error("错误堆栈:", e.stack);
        return null;
    } finally {
        // 安全回收截图
        if (shouldRecycle && img && typeof img.recycle === 'function') {
            img.recycle();
        }
    }
}

function findNum_findMC(sc, region, xiangsidu = 32) {
    // 参数验证
    if (!sc || typeof sc.getWidth !== "function") {
        console.warn("findNum: 无效的截图参数");
        return [];
    }



    let itemColor = ckNumColor;


    // 查找所有匹配的坐标
    let matches1 = [];

    // 使用try-finally确保截图资源被回收
    try {
        // 确定搜索区域
        region = region ? region : [0, 0, sc.getWidth(), sc.getHeight()];
        xiangsidu = xiangsidu ? xiangsidu : 32;

        // console.log("findNum函数开始执行，搜索区域:", region, "相似度:", xiangsidu);

        // 首先遍历所有可能的数字/符号，查找最左侧的数字
        Object.keys(itemColor).forEach((key) => {
            let color = itemColor[key];
            // console.log("正在查找数字/符号:", key);
            let result = findMC(color, sc, region, xiangsidu);
            if (result) {
                // console.log(`找到数字/符号: ${key} 坐标: (${result.x}, ${result.y})`);
                matches1.push({
                    key: key,
                    x: result.x,
                    y: result.y
                });
            }
        });

        // 如果没有找到任何匹配，返回空数组
        if (matches1.length === 0) {
            // console.log("未找到任何匹配，返回空数组");
            return [];
        }

        // 按X坐标从小到大排序，找到最左侧的数字
        matches1.sort((a, b) => a.x - b.x);
        let firstDigit = matches1[0];

        // 用于存储最终结果的数组
        let finalResults = [firstDigit];

        // 设置初始搜索区域为第一个数字的右侧到区域最右侧
        let startX = firstDigit.x + 1;
        let regionWidth = region[2] - (startX - region[0]);
        // console.log(`第一个数字的X坐标: ${firstDigit.x}，新搜索区域起点X: ${startX}，剩余宽度: ${regionWidth}`);

        // 如果剩余区域宽度小于30，直接返回第一个数字
        if (regionWidth < 30) {
            // console.log("剩余区域宽度小于30，直接返回第一个数字");
            return [firstDigit.key];
        }

        // 设置新的搜索区域
        let currentRegion = [
            startX,
            region[1],
            regionWidth,
            region[3]
        ];
        // console.log("设置新的搜索区域:", currentRegion);

        // 循环查找直到没有更多匹配或区域宽度小于30
        let iterationCount = 0;
        let lastFoundX = firstDigit.x; // 记录上次找到的X坐标，用于防止死循环

        while (true) {
            iterationCount++;
            // console.log(`开始第${iterationCount}次循环，当前搜索区域:`, currentRegion);

            let foundInThisIteration = false;
            let currentMatches = [];

            // 在当前区域内查找所有匹配
            Object.keys(itemColor).forEach((key) => {
                let color = itemColor[key];
                let result = findMC(color, sc, currentRegion, xiangsidu);
                if (result) {
                    currentMatches.push({
                        key: key,
                        x: result.x,
                        y: result.y
                    });
                    foundInThisIteration = true;
                }
            });

            // 如果当前区域没有找到匹配，结束循环
            if (!foundInThisIteration) {
                // console.log(`第${iterationCount}次循环未找到匹配，结束循环`);
                break;
            }

            // console.log(`第${iterationCount}次循环找到${currentMatches.length}个匹配`);

            // 找到X坐标最小的匹配
            currentMatches.sort((a, b) => a.x - b.x);
            let leftmostMatch = currentMatches[0];
            // console.log(`第${iterationCount}次循环找到最左侧的数字: ${leftmostMatch.key} 坐标: (${leftmostMatch.x}, ${leftmostMatch.y})`);

            // 检查是否与上次找到的数字位置相同，或者坐标超出当前搜索区域
            if (leftmostMatch.x === lastFoundX ||
                leftmostMatch.x - lastFoundX <= 5 ||
                leftmostMatch.x < currentRegion[0] ||
                leftmostMatch.x >= currentRegion[0] + currentRegion[2]) {
                // console.log(`检测到问题坐标 (${leftmostMatch.x})，将搜索区域向右移动1像素`);

                // 检查搜索区域宽度是否已经小于等于0
                if (currentRegion[2] <= 0) {
                    // console.log("搜索区域宽度已经小于等于0，结束循环");
                    break;
                }

                // 将搜索区域向右移动1像素
                currentRegion[0] += 1;
                currentRegion[2] -= 1;
                // console.log(`调整后的搜索区域:`, currentRegion);

                // 更新上次找到的X坐标
                lastFoundX = leftmostMatch.x;
                continue; // 跳过本次循环，重新查找
            }

            // 更新上次找到的X坐标
            lastFoundX = leftmostMatch.x;

            // 添加到最终结果
            finalResults.push(leftmostMatch);

            // 更新搜索区域，排除已找到的部分
            let foundX = leftmostMatch.x;
            regionWidth = currentRegion[2] - (foundX + 1 - currentRegion[0]);
            // console.log(`找到数字的X坐标: ${foundX}，新剩余宽度: ${regionWidth}`);

            // 如果剩余区域宽度小于30，结束循环
            if (regionWidth < 30) {
                // console.log("剩余区域宽度小于30，结束循环");
                break;
            }

            // 更新搜索区域为已找到位置的右侧
            currentRegion = [
                foundX + 1,
                currentRegion[1],
                regionWidth,
                currentRegion[3]
            ];
            // console.log("更新后的搜索区域:", currentRegion);
        }

        // 按X坐标对最终结果进行排序
        finalResults.sort((a, b) => a.x - b.x);
        // console.log("最终识别结果:", finalResults.map(item => item.key).join(''));

        // 返回识别到的数字/符号的键值
        return finalResults.map(item => item.key).join('');
    } finally {
        // 如果是内部创建的截图，确保回收
        if (sc && typeof sc.recycle === "function") {
            try {
                sc.recycle();
            } catch (e) {
                console.error("回收截图资源失败:", e);
            }
        }
    }
}

/**
 * 从图片中识别数字
 * @param {Image} img - 要识别的图片，如果没有则自动截图
 * @param {Array} region - 识别区域 [x, y, width, height]，如果没有则使用整张图片
 * @param {string} color - 二值化颜色，默认为"#FFFFFF"
 * @param {number} threshold - 颜色阈值，默认为16
 * @returns {number} 识别到的数字，如果未识别到则返回0
 */
function recognizeNumber(img, region, color = "#FFFFFF", threshold = 16) {
    let sourceImg = img || captureScreen();
    let processedImg = sourceImg;

    // 如果指定了区域，则裁剪图片
    if (region && region.length === 4) {
        try {
            processedImg = images.clip(sourceImg, region[0], region[1], region[2], region[3]);
        } catch (error) {
            log("图片裁剪出错: " + error);
            return 0;
        }
    }

    // 二值化处理
    let binaryImg;
    try {
        binaryImg = images.interval(processedImg, color, threshold);

        // OCR识别
        const ocrResult = gmlkit.ocr(binaryImg, "zh").text;
        // log("OCR识别结果: " + ocrResult);

        // 从OCR结果中提取数字
        const numMatch = ocrResult.match(/\d+/);
        const result = numMatch ? parseInt(numMatch[0]) : 0;
        // log("提取到的数字: " + result);

        return result;
    } catch (error) {
        log("OCR识别出错: " + error);
        return 0;
    } finally {
        // 释放图片资源
        if (processedImg !== sourceImg) {
            processedImg.recycle();
        }
        if (binaryImg) {
            binaryImg.recycle();
        }
    }
}

/**
 * 使用垂直投影分割法分割字符（可配置间隔像素数）
 * @param {Array} binaryArray - 二值化数组
 * @param {number} width - 图片宽度
 * @param {number} height - 图片高度
 * @param {number} maxGap - 允许的最大间隔像素数，默认为1
 * @returns {Array} 分割后的字符段数组
 */
function verticalProjectionSegmentation(binaryArray, width, height, maxGap) {
    // 设置默认间隔像素数为1
    maxGap = maxGap !== undefined ? maxGap : 1;
    // 计算垂直投影（每列的黑色像素数）
    var verticalProjection = [];
    for (var x = 0; x < width; x++) {
        var count = 0;
        for (var y = 0; y < height; y++) {
            var index = y * width + x;
            if (binaryArray[index] === 1) {
                count++;
            }
        }
        verticalProjection.push(count);
    }

    // 根据垂直投影分割字符（改进版，容忍1像素间隔）
    var segments = [];
    var inChar = false;
    var startPos = 0;
    var gapCount = 0; // 用于记录连续的空隙列数

    for (var x = 0; x < width; x++) {
        if (verticalProjection[x] > 0) {
            // 当前列有黑色像素
            if (!inChar) {
                // 开始一个新的字符
                inChar = true;
                startPos = x;
                gapCount = 0; // 重置间隙计数
            } else {
                // 正在字符中，重置间隙计数
                gapCount = 0;
            }
        } else {
            // 当前列没有黑色像素
            if (inChar) {
                // 正在字符中，增加间隙计数
                gapCount++;
                // 如果间隙超过允许的最大间隔像素数，则结束当前字符
                if (gapCount > maxGap) {
                    inChar = false;
                    var endPos = x - gapCount + 1; // 回退到第一个间隙位置

                    // 计算字符的垂直范围（上下边界）
                    var minY = height;
                    var maxY = 0;
                    for (var y = 0; y < height; y++) {
                        for (var cx = startPos; cx < endPos; cx++) {
                            var index = y * width + cx;
                            if (binaryArray[index] === 1) {
                                if (y < minY) minY = y;
                                if (y > maxY) maxY = y;
                            }
                        }
                    }

                    // 如果没有找到黑色像素，则跳过这个字符段
                    if (minY >= height || maxY < 0) {
                        continue;
                    }

                    // 提取字符区域的像素数据
                    var charWidth = endPos - startPos;
                    var charHeight = maxY - minY + 1;
                    var charPixels = [];
                    var countOnes = 0; // 添加计数器

                    for (var y = minY; y <= maxY; y++) {
                        for (var cx = startPos; cx < endPos; cx++) {
                            var index = y * width + cx;
                            charPixels.push(binaryArray[index]);
                            if (binaryArray[index] === 1) {
                                countOnes++; // 统计1的数量
                            }
                        }
                    }

                    segments.push({
                        pixels: charPixels,
                        num: countOnes,
                        startX: startPos,
                        endX: endPos,
                        minY: minY,
                        maxY: maxY,
                        width: charWidth,
                        height: charHeight,
                    });

                    gapCount = 0; // 重置间隙计数
                }
            }
        }
    }

    // 处理最后一个字符（如果图片以字符结尾）
    if (inChar) {
        var endPos = width;

        // 计算字符的垂直范围（上下边界）
        var minY = height;
        var maxY = 0;
        for (var y = 0; y < height; y++) {
            for (var cx = startPos; cx < endPos; cx++) {
                var index = y * width + cx;
                if (binaryArray[index] === 1) {
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }

        // 如果没有找到黑色像素，则跳过这个字符段
        if (minY < height && maxY >= 0) {
            // 提取字符区域的像素数据
            var charWidth = endPos - startPos;
            var charHeight = maxY - minY + 1;
            var charPixels = [];
            var countOnes = 0; // 添加计数器

            for (var y = minY; y <= maxY; y++) {
                for (var cx = startPos; cx < endPos; cx++) {
                    var index = y * width + cx;
                    charPixels.push(binaryArray[index]);
                    if (binaryArray[index] === 1) {
                        countOnes++; // 统计1的数量
                    }
                }
            }

            segments.push({
                pixels: charPixels,
                num: countOnes,
                startX: startPos,
                endX: endPos,
                minY: minY,
                maxY: maxY,
                width: charWidth,
                height: charHeight,
            });
        }
    }

    return segments;
}

function simpleConnectedComponentAnalysis(binaryArray, width, height, minArea) {
    if (minArea === undefined) minArea = 10;

    let visited = Array(height).fill().map(() => Array(width).fill(false));
    let regions = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let index = y * width + x;

            if (!visited[y][x] && binaryArray[index] === 1) {
                let region = {
                    minX: x, maxX: x,
                    minY: y, maxY: y,
                    pixelCount: 0
                };

                // 使用栈进行区域生长（避免递归深度限制）
                let stack = [[x, y]];
                visited[y][x] = true;

                while (stack.length > 0) {
                    let [cx, cy] = stack.pop();
                    let cIndex = cy * width + cx;

                    // 更新边界框
                    region.minX = Math.min(region.minX, cx);
                    region.maxX = Math.max(region.maxX, cx);
                    region.minY = Math.min(region.minY, cy);
                    region.maxY = Math.max(region.maxY, cy);
                    region.pixelCount++;

                    // 检查8邻域
                    let directions = [
                        [-1, -1], [-1, 0], [-1, 1],
                        [0, -1], [0, 1],
                        [1, -1], [1, 0], [1, 1]
                    ];

                    for (let [dx, dy] of directions) {
                        let nx = cx + dx, ny = cy + dy;
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            let nIndex = ny * width + nx;
                            if (!visited[ny][nx] && binaryArray[nIndex] === 1) {
                                visited[ny][nx] = true;
                                stack.push([nx, ny]);
                            }
                        }
                    }
                }

                if (region.pixelCount >= minArea) {
                    regions.push({
                        startX: region.minX,
                        endX: region.maxX,
                        minY: region.minY,
                        maxY: region.maxY,
                        width: region.maxX - region.minX + 1,
                        height: region.maxY - region.minY + 1,
                        area: region.pixelCount
                    });
                }
            }
        }
    }

    // 按x坐标排序
    regions.sort((a, b) => a.startX - b.startX);

    return regions;
}

function 分割识别(binaryImg, pngFiles, xiangsidu) {

    // 获取二值化图像的位图数据
    var binaryBitmap = binaryImg.getBitmap();
    var width = binaryImg.getWidth();
    var height = binaryImg.getHeight();

    // 创建二值化数组
    var binaryArray = [];
    // 遍历二值化图像每个像素
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            // 通过bitmap获取当前像素颜色
            var pixelColor = binaryBitmap.getPixel(x, y);
            // 非匹配区域为-16777216（0xFF000000），匹配区域为-1（0xFFFFFFFF）
            if (pixelColor === -1) {
                binaryArray.push(1); // 匹配区域
            } else {
                binaryArray.push(0); // 非匹配区域
            }
        }
    }

    // 使用垂直投影分割法分割字符
    var segments = verticalProjectionSegmentation(binaryArray, width, height);

    // 遍历segments，如果有width超过25的，采用simpleConnectedComponentAnalysis再分割
    let newSegments = [];
    for (let i = 0; i < segments.length; i++) {
        let segment = segments[i];
        // 如果宽度超过25，则使用连通域分析再次分割
        if (segment.width > 25) {
            // 创建该segment对应的二值化数组部分
            let segmentBinaryArray = segment.pixels;
            let segmentWidth = segment.width;
            let segmentHeight = segment.height;

            // 使用连通域分析进行再次分割
            let subRegions = simpleConnectedComponentAnalysis(segmentBinaryArray, segmentWidth, segmentHeight, 10);

            // 将子区域转换为segments格式并添加到newSegments中
            for (let j = 0; j < subRegions.length; j++) {
                let subRegion = subRegions[j];
                // 调整坐标，使其相对于原始图像
                newSegments.push({
                    startX: segment.startX + subRegion.startX,
                    endX: segment.startX + subRegion.endX,
                    minY: segment.minY + subRegion.minY,
                    maxY: segment.minY + subRegion.maxY,
                    width: subRegion.width,
                    height: subRegion.height
                });
            }
        } else {
            // 宽度不超过25的直接添加
            newSegments.push({
                startX: segment.startX,
                endX: segment.endX,
                minY: segment.minY,
                maxY: segment.maxY,
                width: segment.width,
                height: segment.height
            });
        }
    }

    // 使用新的segments替换原来的segments
    segments = newSegments;

    // 用于存储最终结果的字符串
    let recognizedText = "";

    // 预先转换所有Base64图像
    let templates = [];
    for (let font of pngFiles) {
        let image_base64 = font.value;
        let template = images.fromBase64(image_base64);
        templates.push({ fontName: font.key, template: template });
    }

    // 使用try-finally确保截图资源被回收
    try {
        // 对每个分割出来的字符进行识别
        for (var i = 0; i < segments.length; i++) {
            var segment = segments[i];

            // 调整字符切割区域，上下左右各增加3像素，但确保不超出图像范围
            let x = Math.max(0, segment.startX - 3);
            let y = Math.max(0, segment.minY - 3);
            let w = Math.min(segment.width + 6, binaryImg.getWidth() - x);
            let h = Math.min(segment.height + 6, binaryImg.getHeight() - y);
            let image_clip_char = images.clip(binaryImg, x, y, w, h);

            let Match = null;

            for (let item of templates) {
                let fontName = item.fontName;
                let template = item.template;

                let result = null;
                if (template.getWidth() <= image_clip_char.getWidth() && template.getHeight() <= image_clip_char.getHeight()) {
                    try { result = images.findImage(image_clip_char, template, { threshold: xiangsidu }); }
                    catch (e) {
                        console.error("图像识别失败(分割识别):", e);
                        result = null;
                    }
                }

                if (result) {
                    Match = fontName;
                }
            }

            // 回收字符图像资源
            image_clip_char.recycle();

            // 添加识别结果
            if (Match) {
                recognizedText += Match;
            } else {
                recognizedText += ""; // 未识别的字符用 代替
            }
        }

        return recognizedText;
    } catch (e) {
        console.error("图像识别失败:", e);
        return null;
    } finally {
        // 统一回收所有模板图像资源
        for (let item of templates) {
            item.template.recycle();
        }
    }
}

/**
 * 
 * @param {*} sc 未处理大照片
 * @param {*} region 搜索、裁剪区域
 * @param {*} color 匹配颜色
 * @param {*} threshold 阈值
 * @param {*} FontLibrary 字库数组
 * @param {*} xiangsidu 相似度
 * @param {*} mode 识别模式
 * @description image_clip为裁剪后的大照片，binaryImg为二值化图像，image_clip_char是二值化照片后裁剪用来识别的大图片
 * @returns 识别结果
 */
function findFont(sc, region, color, threshold = 16, FontLibrary, xiangsidu = 0.6, mode) {
    let img = null;
    let image_clip = null;
    let binaryImg = null;
    let templates1 = [];

    try {
        // 参数验证
        img = sc || captureScreen();

        let pngFiles = Object.entries(FontLibrary).map(([key, value]) => ({ key, value }));

        // 确定搜索区域
        region = region ? region : [0, 0, img.getWidth(), img.getHeight()];
        image_clip = images.clip(img, region[0], region[1], region[2], region[3]);
        // images.save(image_clip, "/storage/emulated/0/$MuMu12Shared/Screenshots/字库/商店仓库统计/" + Date.now() + ".png");//测试用，截取识别部位图片
        threshold = threshold ? threshold : 16;
        binaryImg = images.interval(image_clip, color, threshold);

        if (mode == "clip") {
            let pngFiles1 = pngFiles.filter(entry => ["小时", "分", "秒"].includes(entry.key));
            let pngFiles2 = pngFiles.filter(entry => !["小时", "分", "秒"].includes(entry.key));

            // 预先转换所有Base64图像
            for (let font of pngFiles1) {
                let image_base64 = font.value;
                let template = images.fromBase64(image_base64);
                templates1.push({ fontName: font.key, template: template });
            }

            let Match = [];

            for (let item of templates1) {
                let fontName = item.fontName;
                let template = item.template;

                let image_clip_char = images.clip(binaryImg, 0, 0, binaryImg.getWidth(), binaryImg.getHeight());

                let result = null;
                try { result = images.findImage(image_clip_char, template, { threshold: xiangsidu }); }
                catch (e) {
                    console.error("图像识别失败(clip):", e);
                    result = null;
                }
                if (result) {
                    Match.push({
                        font: fontName,
                        startx: result.x,
                        starty: result.y,
                        endx: result.x + template.getWidth(),
                        endy: result.y + template.getHeight(),
                        width: template.getWidth(),
                        height: template.getHeight(),
                    });
                }
                image_clip_char.recycle();
                template.recycle(); // 回收template资源
            };

            // 将Match按startx排序
            Match.sort(function (a, b) {
                return a.startx - b.startx;
            });

            if (Match.length == 0) {
                log("未识别到字符:match长度为0")
                return "";
            }

            let recognizedText = "";

            //分割图片（按小时，分，秒分割）
            for (let i = 0; i <= Match.length; i++) {
                let image_clip_char_min = null;
                if (i == 0) { image_clip_char_min = images.clip(binaryImg, 0, 0, Match[i].startx, binaryImg.getHeight()); }
                else if (i == Match.length) { image_clip_char_min = images.clip(binaryImg, Match[i - 1].endx, 0, binaryImg.getWidth() - Match[i - 1].endx, binaryImg.getHeight()); }
                else { image_clip_char_min = images.clip(binaryImg, Match[i - 1].endx, 0, Match[i].startx - Match[i - 1].endx, binaryImg.getHeight()); }
                // 识别字符

                let char = 分割识别(image_clip_char_min, pngFiles2, xiangsidu);
                // 添加识别结果

                if (char && i < Match.length) {
                    recognizedText += char;
                    recognizedText += Match[i].font;
                    // log(recognizedText)
                } else {
                    char += "?"; // 未识别的字符用?代替
                }
                // log(recognizedText)
                // 回收资源
                image_clip_char_min.recycle();
            }

            //返回识别结果
            return recognizedText;
        }

        // 调用分割识别函数
        let recognizedText = 分割识别(binaryImg, pngFiles, xiangsidu);

        return recognizedText;
    } catch (error) {
        console.error("findFont识别失败:", error);
        return "";
    } finally {
        // 在finally块中回收所有图片资源
        try {
            if (binaryImg && typeof binaryImg.recycle === 'function') {
                binaryImg.recycle();
            }
            if (image_clip && typeof image_clip.recycle === 'function') {
                image_clip.recycle();
            }
        } catch (e) {
            console.error("回收图片资源失败:", e);
        }
    }
}

/**
 * 识别剩余时间,通过识别加速按钮位置确定时间文本位置
 * @returns {string} - 识别到的时间字符串，格式为 "HH小时MM分SS秒"
 */
function findFont_remainingTime() {
    //识别剩余时间
    let jiasu = click_waitFor(null, null, allItemColor["jiasuButton"], 5, 16, 200);
    if (jiasu) {
        let region0 = [jiasu.x - 351, jiasu.y + 27, jiasu.x - 147, jiasu.y + 88];
        let region = [region0[0], region0[1], region0[2] - region0[0], region0[3] - region0[1]];
        let result = findFont(null, region, "#FFFFFF", 8, Font.FontLibrary_timeRemaining, 0.8, mode = "clip");
        return result || "";
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
        // 获取截图
        let sc = captureScreen();

        try {
            //新版界面
            let allMatch = findMC(["#f0e0d6", [-2, -28, "#fbf5f4"],
                [-20, -10, "#a24801"], [7, 30, "#f3bf41"]], sc, [1140, 570, 120, 130]);

            //老板界面
            let allMatch2 = findMC(["#fdf8f4", [5, 32, "#f2ded3"],
                [-17, 18, "#a44900"], [11, 54, "#f7c342"],
                [37, 26, "#a54b00"]], sc, [1140, 570, 120, 130]);

            if (allMatch || allMatch2) {
                log(`第 ${i + 1} 次检测: 已进入主界面`);
                showTip(`第 ${i + 1} 次检测: 已进入主界面`);
                return true;
            }
        } catch (e) {
            console.error("检测过程中出错:", e);
        }

        //未找到则等待
        sleep(RETRY_INTERVAL);
        log(`第 ${i + 1} 次检测: 未找到菜单，继续等待...`);
        showTip(`第 ${i + 1} 次检测: 未找到菜单，继续等待...`);

        // 寻找关闭
        if (i % 2 == 0) find_close(sc, ["except_jiazai"]);
    }

    // 超过最大重试次数
    log(`超过最大重试次数 ${MAX_RETRY} 次，未检测到主界面`);
    showTip(`超过最大重试次数 ${MAX_RETRY} 次，未检测到主界面`);
    // 尝试重启游戏
    log("尝试重启");
    restartgame();
    checkmenu();
}

/**
 * 打开好友菜单,自动点到好友簿页面，但不会选择“游戏内好友”
 * @returns {boolean} - 如果成功打开好友菜单则返回 `true`，否则返回 `false`
 */
function openFriendMenu() {
    for (let i = 0; i < 6; i++) {

        let sc = captureScreen();

        if (matchColor([{ x: 146, y: 84, color: "#f4da4e" },
        { x: 132, y: 106, color: "#fefdfc" }, { x: 346, y: 45, color: "#dfb479" },
        { x: 1109, y: 76, color: "#f34853" }], sc)) {
            log("已打开好友菜单")
            break;
        }

        //好友簿
        let friendMenu = matchColor([{ x: 256, y: 542, color: "#ffcb42" },
        { x: 214, y: 591, color: "#c48f4c" }, { x: 265, y: 647, color: "#c48f4c" },
        { x: 302, y: 630, color: "#c48f4c" }, { x: 210, y: 672, color: "#ffbf1d" },
        { x: 262, y: 615, color: "#ca922b" }, { x: 430, y: 540, color: "#fff9db" }], sc)
        if (friendMenu) {
            log("已打开好友栏,点击好友簿")
            click(255, 600);
            sleep(200);
            break;
        }
        //新版界面
        let friendButton = findMC(["#f0e0d6", [-2, -28, "#fbf5f4"],
            [-20, -10, "#a24801"], [7, 30, "#f3bf41"]], sc, [1140, 570, 120, 130]);
        if (friendButton) {
            log("点击好友按钮")
            click(friendButton.x + ran(), friendButton.y + ran());
            sleep(200);
        }
        else {
            //老板界面
            friendButton = findMC(["#fdf8f4", [5, 32, "#f2ded3"],
                [-17, 18, "#a44900"], [11, 54, "#f7c342"],
                [37, 26, "#a54b00"]], sc, [1140, 570, 120, 130]);
            if (friendButton) {
                log("点击好友按钮")
                click(friendButton.x + ran(), friendButton.y + ran());
                sleep(200);
            }
        }

        friendMenu = matchColor([{ x: 256, y: 542, color: "#ffcb42" },
        { x: 214, y: 591, color: "#c48f4c" }, { x: 265, y: 647, color: "#c48f4c" },
        { x: 302, y: 630, color: "#c48f4c" }, { x: 210, y: 672, color: "#ffbf1d" },
        { x: 262, y: 615, color: "#ca922b" }, { x: 430, y: 540, color: "#fff9db" }])

        if (friendMenu) click(255, 600);
        sleep(200);
        let addFriendMenu = null;
        num = 0;

        addFriendMenu = matchColor([{ x: 146, y: 84, color: "#f4da4e" },
        { x: 132, y: 106, color: "#fefdfc" }, { x: 346, y: 45, color: "#dfb479" },
        { x: 1109, y: 76, color: "#f34853" }])
        if (addFriendMenu) {
            log("已打开加好友菜单")
            break;
        }
        sleep(300)
    }
}

/**
 * 打开下方好友栏
 * @returns {boolean} - 如果成功打开好友则返回 `true`，否则返回 `false`
 */
function openFriend() {

    for (let i = 0; i < 6; i++) {//好友簿
        let sc = captureScreen();
        let friendMenu = matchColor([{ x: 256, y: 542, color: "#ffcb42" },
        { x: 214, y: 591, color: "#c48f4c" }, { x: 265, y: 647, color: "#c48f4c" },
        { x: 302, y: 630, color: "#c48f4c" }, { x: 210, y: 672, color: "#ffbf1d" },
        { x: 262, y: 615, color: "#ca922b" }, { x: 430, y: 540, color: "#fff9db" }], sc)
        if (!friendMenu) {
            //新版界面
            let friendButton = findMC(["#f0e0d6", [-2, -28, "#fbf5f4"],
                [-20, -10, "#a24801"], [7, 30, "#f3bf41"]], sc, [1140, 570, 120, 130]);
            if (friendButton) {
                log("点击好友按钮")
                click(friendButton.x + ran(), friendButton.y + ran());
                sleep(200);
            }
            else {
                //老板界面
                friendButton = findMC(["#fdf8f4", [5, 32, "#f2ded3"],
                    [-17, 18, "#a44900"], [11, 54, "#f7c342"],
                    [37, 26, "#a54b00"]], sc, [1140, 570, 120, 130]);
                if (friendButton) {
                    log("点击好友按钮")
                    click(friendButton.x + ran(), friendButton.y + ran());
                    sleep(200);
                }
            }
        }

        friendMenu = matchColor([{ x: 256, y: 542, color: "#ffcb42" },
        { x: 214, y: 591, color: "#c48f4c" }, { x: 265, y: 647, color: "#c48f4c" },
        { x: 302, y: 630, color: "#c48f4c" }, { x: 210, y: 672, color: "#ffbf1d" },
        { x: 262, y: 615, color: "#ca922b" }, { x: 430, y: 540, color: "#fff9db" }])

        if (friendMenu) return true;
        sleep(300)
    }
    return false;
}

function addFriends(addFriendsList) {

    openFriendMenu();
    sleep(500);
    if (matchColor([{ x: 371, y: 145, color: "#ffd158" }])) {
        click(410, 150)
        sleep(1000)
    }
    // 处理名称，确保每个名称都以#开头
    let nameMap = addFriendsList.map(item => {
        // 如果第一个字符不是#，则添加#
        return item.charAt(0) === '#' ? item : '#' + item;
    });

    for (let name of nameMap) {
        showTip("加好友" + name);
        log("加好友" + name);
        click(500, 260);
        sleep(500);
        setText_inGame(name);
        sleep(500);
        click(980, 250);
        sleep(100);
        waitFor_click([780, 400], [{ x: 719, y: 402, color: "#51cb30" }, { x: 863, y: 403, color: "#4dca2b" }], null, 10, 16);

    }
}

function clearFans() {
    openFriendMenu();
    sleep(500)
    if (matchColor([{ x: 790, y: 149, color: "#ffd158" }])) {
        click(820, 150)
        sleep(1000)
    }
    while (true) {
        if (click_waitFor(null, [{ x: 921, y: 322, color: "#f7b530" }], null, 10, 16)) {
            click(880 + ran(), 320 + ran())
            sleep(100);
            click(880 + ran(), 320 + ran())
        } else break;
        sleep(1000);
    }
}



//点击叉号
function close() {
    try {

        //识别叉叉
        let sc = captureScreen();
        let close_button = findMC(["#ef444f", [-7, -1, "#ef444d"], [26, 2, "#faca3f"],
            [-24, 4, "#f9ca3f"], [-12, 13, "#e7363e"], [2, 37, "#f3c241"],
            [15, 16, "#e5373f"], [1, 16, "#9d1719"]], sc);//小×
        if (!close_button) {
            close_button = findMC(["#ed404b", [-13, -15, "#f54e5a"], [15, -14, "#ee444e"],
                [13, 11, "#e43840"], [-17, 10, "#e6363e"], [26, 0, "#f9cd42"],
                [-2, -23, "#f7df5c"], [-29, 1, "#f9cd42"], [-1, 29, "#f6cc44"]], sc);//大×
        }

        if (close_button) {
            click(close_button.x + ran(), close_button.y + ran())
            console.log("点击叉叉,close")
            // showTip("点击叉叉")
        } else {
            // click(2110, 125)
            // console.log("未识别到叉，点击默认坐标")

        }
    } catch (error) {
        log("close函数出错" + error)
    }
}


//滑动
function huadong(right = false) {
    try {
        showTip("滑动寻找")
        //缩放
        gestures([0, 200, [420 + ran(), 200 + ran()], [860 + ran(), 200 + ran()]],
            [0, 200, [1000 + ran(), 200 + ran()], [860 + ran(), 200 + ran()]
            ]);
        sleep(200);
        //缩放
        gestures([0, 200, [420 + ran(), 250 + ran()], [860 + ran(), 250 + ran()]],
            [0, 200, [1000 + ran(), 250 + ran()], [860 + ran(), 250 + ran()]
            ]);
        sleep(100);
        //右滑
        swipe(600 + ran(), 300 + ran(), 550 + ran(), 250 + ran(), 100);
        sleep(50)
        //左滑
        swipe(250 + ran(), 150 + ran(), 980 + ran(), 720, 200);
        sleep(200)
        //左滑
        if (right) {
            swipe(300 + ran(), 150 + ran(), 980 + ran(), 720, 200);
            sleep(200)
        }
        //下滑
        gesture(1000, [650 + ran(), 580 + ran()],
            [630 + ran(), 250 + ran()]);
        //右滑
        if (right) {
            sleep(100)
            swipe(600 + ran(), 580 + ran(), 600 - 350 + ran(), 580 - 200 + ran(), 1000);
            sleep(350)
        }

    } catch (error) {
        log(error)
    }
}

function huadong_zuoshang() {
    //缩放
    gestures([0, 200, [420 + ran(), 200 + ran()], [860 + ran(), 200 + ran()]],
        [0, 200, [1000 + ran(), 200 + ran()], [860 + ran(), 200 + ran()]
        ]);
    sleep(200);
    //缩放
    gestures([0, 200, [420 + ran(), 250 + ran()], [860 + ran(), 250 + ran()]],
        [0, 200, [1000 + ran(), 250 + ran()], [860 + ran(), 250 + ran()]
        ]);
    sleep(100);
    //右滑
    swipe(600 + ran(), 300 + ran(), 550 + ran(), 250 + ran(), 100);
    sleep(50)
    //左滑
    swipe(250 + ran(), 150 + ran(), 980 + ran(), 720, 200);
    sleep(200)
}

/**
 * 调整视角到正确位置
 * 根据商店坐标定位商店，调整视角到商店位置
 * @param {Array} [x, y] - 商店坐标偏移量，默认[60, 50]
 * @param {Array} [endX, endY] - 目标位置偏移量，默认[250, 400]
 * @returns {boolean} - 如果调整成功则返回 `true`，否则返回 `false`
 */
function huadong_adjust([x, y], [endX, endY]) {
    let shopPos = findshop(false, 3);
    if (shopPos) {
        const [_x, _y] = (x && y) ? [x, y] : [60, 50]
        const [_endX, _endY] = (endX && endY) ? [endX + _x, endY + _y] : [250, 400]
        log(Math.abs(shopPos.x + _x - _endX), Math.abs(shopPos.y + _y - _endY))
        const distance = Math.sqrt(Math.pow(shopPos.x + _x - _endX, 2) + Math.pow(shopPos.y + _y - _endY, 2));
        if (distance < 100) {
            log("调整视角到正确位置,无需滑动")
            return true;
        }
        swipe(shopPos.x + _x, shopPos.y + _y, _endX, _endY, 300);
        sleep(50);
        click(_endX, _endY);
        sleep(100);
        return true;
    } else {
        log("未识别到商店")
        return false;
    }
}

/**
 * 寻找渔船,视角需在左上角
 * @returns 渔船坐标,未找到返回false
 */
function find_yuchuan() {
    for (let i = 0; i < 10; i++) {
        showTip("第" + (i + 1) + "次寻找渔船");

        let sc = captureScreen();
        if (matchColor([{ x: 887, y: 125, color: "#498d9c" }, { x: 823, y: 155, color: "#498d9c" }], sc, 16)) {
            log("已到左上角,确定固定位置")
            return { x: 508, y: 329 }
        }
        let yuchuan1 = findMC(machineColor["渔船"][0], sc, null, 16);
        let yuchuan2 = findMC(machineColor["渔船"][1], sc, null, 16);
        log("渔船定位", yuchuan1, yuchuan2)
        if (yuchuan1 || yuchuan2) {
            return yuchuan1 || yuchuan2;
        }
        sleep(500);
    }

    log("未找到渔船")
    return false;

}

function huadong_pond() {
    //缩放
    gestures([0, 200, [300 + ran(), 120 + ran()], [710 + ran(), 120 + ran()]],
        [0, 200, [1000 + ran(), 120 + ran()], [710 + ran(), 120 + ran()]
        ]);
    sleep(200);

    //右滑
    swipe(920 + ran(), 100 + ran(), 250 + ran(), 350, 100);
    sleep(300)

    //缩放
    gestures([0, 200, [420 + ran(), 250 + ran()], [710 + ran(), 250 + ran()]],
        [0, 200, [1000 + ran(), 250 + ran()], [710 + ran(), 250 + ran()]
        ]);
    sleep(200);

    //右滑
    swipe(920 + ran(), 100 + ran(), 250 + ran(), 350, 100);
    sleep(300)

}

/**
 * 点击指定鱼塘,点击后无等待时间
 * @param {*} pondNum 鱼塘编号
 * @param {*} huadong 是否滑动视角到右上角
 */
function find_fishPond(pondNum, huadong = false) {
    if (huadong) {
        huadong_pond()
    }
    if (pondNum == 1) {
        click(320 + ran(), 350 + ran())
    } else if (pondNum == 2) {
        //上部中间
        swipe(320 + ran(), 220 + ran(), 1000 + ran(), 220 + ran(), 500)
        sleep(10)
        click(900 + ran(), 120 + ran())
        sleep(100)

        click(680 + ran(), 270 + ran())
    } else if (pondNum == 3) {
        //上部中间
        swipe(320 + ran(), 220 + ran(), 1000 + ran(), 220 + ran(), 500)
        sleep(10)
        click(900 + ran(), 120 + ran())
        sleep(100)

        click(350 + ran(), 405 + ran())
    } else if (pondNum == 4) {
        //左滑到顶再下滑
        swipe(200 + ran(), 170 + ran(), 1000 + ran(), 175 + ran(), 100)
        sleep(300)
        swipe(820 + ran(), 480 + ran(), 300 + ran(), 100 + ran(), 800)
        sleep(10);
        click(300 + ran(), 100 + ran())
        sleep(100)

        click(440 + ran(), 280 + ran())
    } else if (pondNum == 5) {
        //左滑到顶再右下滑
        swipe(300 + ran(), 270 + ran(), 1100 + ran(), 275 + ran(), 100)
        sleep(300)
        swipe(820 + ran(), 480 + ran(), 300 + ran(), 100 + ran(), 800)
        sleep(10);
        click(300 + ran(), 100 + ran())
        sleep(100)

        click(780 + ran(), 370 + ran())
    } else if (pondNum == 6) {
        //直接下滑一段距离
        swipe(790 + ran(), 360 + ran(), 950 + ran(), 100 + ran(), 500)
        sleep(10)
        click(950 + ran(), 100 + ran())
        sleep(100)

        click(390 + ran(), 600 + ran())
    } else if (pondNum == 7) {
        click(380 + ran(), 600 + ran())
    } else if (pondNum == 8) {
        //直接下滑一段距离
        swipe(790 + ran(), 360 + ran(), 950 + ran(), 100 + ran(), 500)
        sleep(10)
        click(950 + ran(), 100 + ran())
        sleep(100)

        click(890 + ran(), 380 + ran())
    } else if (pondNum == 9) {
        //直接下滑到顶
        swipe(530, 610, 500, 100, 200)
        sleep(400)

        click(600 + ran(), 200 + ran())
    } else if (pondNum == 10) {
        //下滑两段
        swipe(790 + ran(), 360 + ran(), 950 + ran(), 100 + ran(), 500)
        sleep(10)
        click(950 + ran(), 100 + ran())
        sleep(100)
        swipe(720 + ran(), 515 + ran(), 900 + ran(), 100 + ran(), 500)
        sleep(10)
        click(900 + ran(), 100 + ran())
        sleep(100)

        click(310 + ran(), 400 + ran())
    } else if (pondNum == 11) {
        //左滑到顶再下滑
        swipe(240 + ran(), 620 + ran(), 1000 + ran(), 120 + ran(), 100)
        sleep(300)

        click(960 + ran(), 250 + ran())

    } else if (pondNum == 12) {
        //左滑到顶再下滑
        swipe(240 + ran(), 620 + ran(), 1000 + ran(), 120 + ran(), 100)
        sleep(400)

        click(615 + ran(), 110 + ran())
    } else if (pondNum == 13) {
        //左滑到顶再下滑
        swipe(240 + ran(), 620 + ran(), 1000 + ran(), 120 + ran(), 100)
        sleep(400)

        click(550 + ran(), 300 + ran())
    } else if (pondNum == 14) {
        //左滑到顶再下滑
        swipe(240 + ran(), 620 + ran(), 1000 + ran(), 120 + ran(), 100)
        sleep(400)

        click(825 + ran(), 500 + ran())
    } else if (pondNum == 15) {
        //直接下滑到顶
        swipe(530, 610, 500, 100, 200)
        sleep(400)

        click(300 + ran(), 430 + ran())
    } else if (pondNum == 16) {
        //鸭毛
        //垂直下滑一段距离
        swipe(780 + ran(), 370 + ran(), 775 + ran(), 50 + ran(), 500)
        sleep(10)
        click(775 + ran(), 50 + ran())
        sleep(100)

        click(1000 + ran(), 460 + ran())
    }
}

/**
 * 视角需在右上角
 * 点击织网机，收集并制作
 * @returns {boolean} 是否成功点击织网机
 */
function click_netMaker() {
    for (let i = 0; i < 15; i++) {
        let open = findMC(allItemColor["普通渔网"])
        if (open) {
            log("已打开织网机")
            return true
        } else {
            if (matchColor([{ x: 291, y: 564, color: "#fffadb" }, { x: 771, y: 669, color: "#fff9d7" },
            { x: 1035, y: 569, color: "#fffad8" }, { x: 1229, y: 306, color: "#fffdeb" },
            { x: 1171, y: 88, color: "#ed414c" }, { x: 1126, y: 94, color: "#fbbe34" }])) {
                log("没有解锁织网机")
                showTip("没有解锁织网机")
                return false;
            }
        }
        click(1022 + ran(), 190 + ran())

        sleep(500);
    }
    return false
}

/**
 * 点击机器，收集
 * @param {Array} pos 机器坐标 [x, y]
 * @param {string|Array} itemInfo 物品名称或颜色数组
 * @returns {boolean} 是否成功点击织网机
 */
function click_machine([pos_x, pos_y], itemInfo) {

    let itemName, itemColor;
    if (typeof itemInfo === 'string') {
        itemName = itemInfo;
        if (!itemName || !allItemColor[itemName]) {
            log("错误：未提供物品名称或物品名称不存在", itemName);
            return false;
        }
        itemColor = allItemColor[itemName];
    } else if (Array.isArray(itemInfo)) {
        itemColor = itemInfo;
    } else {
        log("错误：传入参数类型不正确，应为字符串或数组", item);
        return false;
    }

    for (let i = 0; i < 15; i++) {
        let open = findMC(itemColor)
        if (open) {
            log("已打开机器")
            return true
        }
        // else {
        //     if (matchColor([{ x: 291, y: 564, color: "#fffadb" }, { x: 771, y: 669, color: "#fff9d7" },
        //     { x: 1035, y: 569, color: "#fffad8" }, { x: 1229, y: 306, color: "#fffdeb" },
        //     { x: 1171, y: 88, color: "#ed414c" }, { x: 1126, y: 94, color: "#fbbe34" }])) {
        //         log("没有解锁织网机")
        //         showTip("没有解锁织网机")
        //         return false;
        //     }
        // }
        click(pos_x + ran(), pos_y + ran())

        sleep(500);
    }
    return false
}

/**
 * 视角需在右上角
 * 点击生产栏位，生产物品
 * @param {string} itemName 物品名称
 * @returns {boolean} 是否成功点击生产栏位
 */
function netMaker_produce(itemName) {
    if (!itemName || !allItemColor[itemName]) {
        log("错误：未提供物品名称或物品名称不存在", itemName);
        return false;
    }
    itemColor = allItemColor[itemName]
    let item = findMC(itemColor)
    for (let i = 0; i < 15; i++) {
        if (item) {
            swipe(item.x + ran(), item.y + ran(), 1022 + ran(), 190 + ran(), 300)
            close()//防止制作神奇渔网
            if (click_waitFor(null, null, allItemColor["生产栏位已满"], 5, 16, 100)) {
                log("生产栏位已满")
                showTip("生产栏位已满")
                return true
            }
        }
    }
}

/**
 * 界面需在机器生产界面,制作物品
 * 可传入物品名称或物品颜色,优先使用物品颜色
 * @param {string|array} itemInfo 物品名称或物品颜色
 * @param {array} pos 物品拖动坐标
 * @returns {boolean} 是否成功点击生产栏位
 */
function machine_produce(itemInfo, [x, y]) {
    let itemName, itemColor;
    if (typeof itemInfo === 'string') {
        itemName = itemInfo;
        if (!itemName || !allItemColor[itemName]) {
            log("错误：未提供物品名称或物品名称不存在", itemName);
            return false;
        }
        itemColor = allItemColor[itemName];
    } else if (Array.isArray(itemInfo)) {
        itemColor = itemInfo;
    } else {
        log("错误：传入参数类型不正确，应为字符串或数组", item);
        return false;
    }
    let item = findMC(itemColor)
    for (let i = 0; i < 15; i++) {
        if (!item) continue;
        swipe(item.x + ran(), item.y + ran(), x + ran(), y + ran(), 300);
        for (let j = 0; j < 5; j++) {
            if (findMC(allItemColor["生产栏位已满"])) {
                log("生产栏位已满")
                showTip("生产栏位已满")
                return true
            } else if (findMC(allItemColor["资源不足"])) {
                log("资源不足")
                showTip("资源不足")
                close()
                return true
            }
            sleep(100);
        }
    }
}

/**
 * 视角需在右上角,不需要在龙虾池内
 * @returns {boolean} 是否成功点击龙虾网
 */
function collect_lobster() {
    click(950 + ran(), 310 + ran())
    sleep(100);
    let net = click_waitFor(null, null, allItemColor["龙虾网"])
    if (net) {
        let L = { x: -200, y: 0 }
        let R = { x: -L.x, y: -L.y }
        let S = { x: 0, y: -25 }

        let pos1 = [1065, 250]
        let pos2 = [1065, 420]
        let pos3 = [(pos1[0] + pos2[0]) / 2, (pos1[1] + pos2[1]) / 2]

        let group1 = [0, 3000, [net.x, net.y], pos3, pos1]
        let group2 = [0, 3000, [net.x, net.y], pos3, pos2]
        let harvestGroup1 = getHarvestGroup(group1, L, R, S, 3)
        let harvestGroup2 = getHarvestGroup(group2, L, R, S, 3)
        try {
            gestures(harvestGroup1, harvestGroup2);
        } catch (error) {
            log(error)
        }
        return true
    }
}

/**
 * 视角无需确定,会滑动到顶部
 * 点击小鸭沙龙,收集鸭毛
 * @returns {boolean} 是否成功收获鸭毛
 */
function collect_duckSalon() {
    let salon
    for (let i = 0; i < 3; i++) {
        find_fishPond(16, true)
        sleep(500);
        salon = click_waitFor(null, null, allItemColor["鸭毛梳"])
        if (salon) break;
    }
    if (salon) {
        1130, 500
        let L = { x: -240, y: 0 }
        let R = { x: -L.x, y: -L.y }
        let S = { x: 0, y: -25 }

        let pos1 = [1130, 280]
        let pos2 = [1130, 500]
        let pos3 = [(pos1[0] + pos2[0]) / 2, (pos1[1] + pos2[1]) / 2]

        let group1 = [0, 3000, [salon.x, salon.y], pos3, pos1]
        let group2 = [0, 3000, [salon.x, salon.y], pos3, pos2]
        let harvestGroup1 = getHarvestGroup(group1, L, R, S, 3)
        let harvestGroup2 = getHarvestGroup(group2, L, R, S, 3)
        try {
            gestures(harvestGroup1, harvestGroup2);
        } catch (error) {
            log(error)
        }
        return true
    } else {
        log("未找到鸭毛梳")
        return false
    }
}

/**
 * 需点开鱼塘
 * @param {string} itemName 物品名称
 * @returns {boolean} 是否成功点击织网机
 */
function put_net(itemName) {
    for (let i = 0; i < 10; i++) {
        sleep(300)
        let item = findMC(allItemColor[itemName])
        if (item) {
            swipe(item.x + ran(), item.y + ran(), item.x + 70 + ran(), item.y + 170 + ran(), 200);
            return true;
        } else {
            let next_button = click_waitFor(null, null, allItemColor["nextButton"])
            if (next_button) {
                click(next_button.x + ran(), next_button.y + ran())
                sleep(200)
            } else {
                log("未找到nextButton")
                return false;
            }
        }
    }
    return false;
}

function pond_operation(account_config) {
    let accountName = account_config.title !== undefined ? account_config.title : account_config
    let pondTimerName = accountName ? accountName + "鱼塘计时器" : "鱼塘计时器";
    let pondTime = getTimerState(pondTimerName);
    if (pondTime) {
        let hours = Math.floor(pondTime / 3600);
        let minutes = Math.floor(pondTime / 60) % 60;
        let seconds = pondTime % 60;
        let timeText = hours > 0 ? `${hours}时${minutes}分${seconds}秒` : minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
        details = `鱼塘最短剩余时间: ${timeText}`;
        log(details);
        showTip(details);
        return true
    }

    let pondNum = account_config.pond.ponds.length > 0 ? account_config.pond.ponds : config.pond.ponds
    if (pondNum.length == 0) {
        log("未配置鱼塘,结束本次鱼塘")
        showTip("未配置鱼塘,结束本次鱼塘")
        return false;
    }


    log("========== 鱼塘 ==========");
    sleep(100);
    find_close();
    sleep(100);
    log("开始寻找渔船")
    showTip("开始寻找渔船")

    let yuchuanPos = null
    for (let i = 0; i < 2; i++) {
        huadong_zuoshang();
        yuchuanPos = find_yuchuan();
        if (yuchuanPos) {
            click(yuchuanPos.x + ran(), yuchuanPos.y + ran());
            let enter = false;
            for (let j = 0; j < 30; j++) {
                sleep(1000);
                let sc = captureScreen();
                //新版界面
                let allMatch = findMC(["#f0e0d6", [-2, -28, "#fbf5f4"],
                    [-20, -10, "#a24801"], [7, 30, "#f3bf41"]], sc, [1140, 570, 120, 130]);

                //老板界面
                let allMatch2 = findMC(["#fdf8f4", [5, 32, "#f2ded3"],
                    [-17, 18, "#a44900"], [11, 54, "#f7c342"],
                    [37, 26, "#a54b00"]], sc, [1140, 570, 120, 130]);

                let homebtn = findMC(["#62d365", [-5, -12, "#c787db"], [1, 11, "#55cf58"]],
                    screenshot = sc, [0, 600, 240, 110]);

                if ((allMatch || allMatch2) && homebtn) {
                    log(`第 ${j + 1} 次检测: 已进入鱼塘`);
                    showTip(`第 ${j + 1} 次检测: 已进入鱼塘`);
                    enter = true;
                    break;
                }
                log(`第 ${j + 1} 次检测: 未进入鱼塘`)
                showTip(`第 ${j + 1} 次检测: 未进入鱼塘`)
                close()
            }
            if (!enter) {
                log("未进入鱼塘,结束本次鱼塘")
                showTip("未进入鱼塘,结束本次鱼塘")
                return false;
            }
            break;
        }
    }
    if (!yuchuanPos) {
        log("未找到渔船,结束本次鱼塘")
        showTip("未找到渔船,结束本次鱼塘")
        return false;
    }

    sleep(1500);

    let allItem = { "鱼片": "普通渔网", "龙虾尾": "捕虾笼", "鸭毛": "捕鸭器" }
    let item = account_config.pond.name
    let itemName = allItem[item];
    let Times = [];

    let netMaker = null

    if (item == "鱼片") {
        Times.push(4 * 60 * 60)//4小时
        huadong_pond()
        netMaker = click_netMaker()
        netMaker_produce(itemName)
    } else if (item == "龙虾尾") {
        Times.push(2 * 60 * 60)//2小时
        huadong_pond()
        collect_lobster()
        sleep(500);
        huadong_pond()
        netMaker = click_netMaker()
        netMaker_produce(itemName)
    } else if (item == "鸭毛") {
        Times.push(1 * 60 * 60)//1小时
        collect_duckSalon()
        sleep(500);
        huadong_pond()
        netMaker = click_netMaker()
        netMaker_produce(itemName)
    }

    if (!netMaker) {
        log("未解锁织网机,结束本次鱼塘")
        showTip("未解锁织网机,结束本次鱼塘")
        return false;
    }

    for (let num of pondNum) {

        log(`执行${num}号鱼塘`)
        showTip(`执行${num}号鱼塘`)
        find_fishPond(num, true);
        sleep(1000);
        let pondIsEmpty = false
        let pondIsOccupied = false

        if (findMC(allItemColor["红色鱼饵"]) || findMC(allItemColor["nextButton"])) {
            log(num + "号鱼塘为空")
            showTip(num + "号鱼塘为空")
            pondIsEmpty = true
        } else if (findMC(allItemColor["jiasuButton"])) {
            log(num + "号鱼塘正在冷却")
            showTip(num + "号鱼塘正在冷却")
            pondIsOccupied = true

            //识别剩余时间
            let remainingTime = findFont_remainingTime()

            if (remainingTime) {
                log(remainingTime)
                showTip(remainingTime)
                let time = extractTime(remainingTime);
                Times.push(time.hours * 60 * 60 + time.minutes * 60 + time.seconds)
            }
        } else if (item == "鱼片") {
            log("点击渔网")
            showTip("点击渔网")
            sleep(1000);
            click(640 + ran(), 360 + ran())
            sleep(500)
            click(640 + ran(), 360 + ran())
            sleep(1500)
        } else if (findMC(allItemColor["可供收集"])) {
            pondIsOccupied = true
        }

        if (pondIsOccupied) {
            log(num + "号鱼塘被占用,跳过撒网")
            showTip(num + "号鱼塘被占用,跳过撒网")
            continue;
        }

        if (item != "鱼片") {
            sleep(500)
            if (!(findMC(allItemColor["红色鱼饵"]) || findMC(allItemColor["nextButton"])) && !pondIsOccupied) {
                log("未检测到放置渔网界面")
                showTip("未检测到放置渔网界面")
                find_fishPond(num, true);
            }
        }

        if (!pondIsEmpty) {
            sleep(500)
            find_fishPond(num, true);
        }
        put_net(itemName)

        sleep(500)

        if (matchColor([{ x: 330, y: 103, color: "#d4a366" },
        { x: 340, y: 76, color: "#ddb376" }, { x: 1117, y: 66, color: "#ee444e" },
        { x: 1093, y: 216, color: "#fff9db" }, { x: 850, y: 586, color: "#f5d155" }])) {
            log("资源不足")
            showTip("资源不足")
            click(1120 + ran(), 70 + ran())
            break;
        }
    }

    let minTime = Times.sort((a, b) => a - b)[0]
    log(`最小时间: ${minTime}秒`)
    timer(pondTimerName, minTime)

}

function honeycomb_operation(account_config) {
    let accountName = account_config.title !== undefined ? account_config.title : account_config
    let currentHoneycombTimerName = accountName ? accountName + "蜂糖计时器" : "蜂糖计时器";

    let selectedHoneycomb = account_config.honeycomb && account_config.honeycomb.name ? account_config.honeycomb.name : config.honeycomb.name
    let honeyColor;
    if (selectedHoneycomb == "蜂蜜") {
        honeyColor = allItemColor["蜂蜜_A"]
    } else if (selectedHoneycomb == "蜂蜡") {
        honeyColor = allItemColor["蜂蜡_A"]
    } else honeyColor = null;


    let honeycombTime = getTimerState(currentHoneycombTimerName);
    if (honeycombTime) {
        let hours = Math.floor(honeycombTime / 3600);
        let minutes = Math.floor(honeycombTime / 60) % 60;
        let seconds = honeycombTime % 60;
        let timeText = hours > 0 ? `${hours}时${minutes}分${seconds}秒` : minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
        details = `蜂糖剩余时间: ${timeText}`;
        log(details);
        showTip(details);
        return true
    }

    log("========== 蜂糖 ==========");
    sleep(100);
    find_close();
    sleep(100);
    log("准备执行 蜂蜜")
    showTip("准备执行 蜂蜜")

    //收获蜂糖===============
    for (let i = 0; i < 3; i++) {
        huadong()
        // sleep(100);

        //滑动微调
        huadong_adjust([60, 50], [250, 400])
        sleep(500)

        let honeyTreePos = find_honeyTree(10) //检测5秒
        if (honeyTreePos) {
            log("点击蜂蜜树")
            click(honeyTreePos.x, honeyTreePos.y)
            sleep(500);
            let collect_honey_pos = findMC(allItemColor["蜂糖篮_可收集"])
            if (collect_honey_pos) {   //如果找到蜂糖篮_可收集，执行收获操作
                log("可收集蜂糖");
                showTip("可收集蜂糖");
                let L = { x: 300, y: 0 }
                let R = { x: -L.x, y: -L.y }
                let S = { x: 0, y: -25 }

                let pos1 = [collect_honey_pos.x, collect_honey_pos.y]
                let pos2 = [collect_honey_pos.x, collect_honey_pos.y + 200]
                let pos3 = [(pos1[0] + pos2[0]) / 2, (pos1[1] + pos2[1]) / 2]

                let group1 = [0, 3000, [collect_honey_pos.x, collect_honey_pos.y], pos3, pos1]
                let group2 = [0, 3000, [collect_honey_pos.x, collect_honey_pos.y], pos3, pos2]
                let harvestGroup1 = getHarvestGroup(group1, L, R, S, 3)
                let harvestGroup2 = getHarvestGroup(group2, L, R, S, 3)
                try {
                    gestures(harvestGroup1, harvestGroup2);
                } catch (error) {
                    log(error)
                }
                // 收获完成后，设置35分钟计时器
                timer(currentHoneycombTimerName, 35 * 60)
                break;
            } else if (findMC(allItemColor["蜂糖篮_不可收集"])) {
                log("蜂糖未成熟")
                showTip("蜂糖未成熟")
                break;
            } else {
                log("第" + (i + 1) + "次,未检测到蜂蜜树界面")
                showTip("第" + (i + 1) + "次,未检测到蜂蜜树界面")
            }
        }
    }
    //=================收获结束=================

    // 制作

    if (!honeyColor) {
        log("蜂糖不制作,结束")
        showTip("蜂糖不制作,结束")
        return;
    }

    for (let i = 0; i < 3; i++) {

        let honeyTreePos = find_honeyTree(10) //检测5秒
        let honey_machine_pos = [honeyTreePos.x + 58, honeyTreePos.y + 45]
        if (honeyTreePos) {
            click_machine(honey_machine_pos, honeyColor)
            sleep(500);
            let honey_pos = findMC(allItemColor['蜂蜜'])
            if (honey_pos) {
                log("检测到摇蜜机界面")
                showTip("检测到摇蜜机界面")
                machine_produce(honeyColor, [honey_machine_pos[0], honey_machine_pos[1]])
                break;
            } else {
                log("第" + (i + 1) + "次,未检测到摇蜜机界面")
                showTip("第" + (i + 1) + "次,未检测到摇蜜机界面")
            }
        } else {
            huadong()

            //滑动微调
            huadong_adjust([60, 50], [250, 400])
        }
    }


    //种花蜜丛===============

    // ======================

}

/**
 * 查找蜂糖树
 * 每次间隔500ms
 * @param {number} maxTry 最大尝试次数
 * @returns {object} 返回蜂蜜树坐标
 */
function find_honeyTree(maxTry) {
    let maxTry_ = maxTry || 10

    let honeyTreePos = null

    for (let i = 0; i < maxTry_; i++) {
        let sc = captureScreen();

        let baozhi = findMC(allItemColor["报纸1"], sc, null, 20) || findMC(allItemColor["报纸2"], sc, null, 20);
        if (baozhi) {
            honeyTreePos = { x: baozhi.x + 242, y: baozhi.y - 130 }
            log("报纸确定蜂蜜树位置,坐标：" + honeyTreePos.x + "," + honeyTreePos.y)
            if (honeyTreePos.x > 1000 || honeyTreePos.x < 300 || honeyTreePos.y > 600 || honeyTreePos.y < 100) {
                log("坐标超出范围,继续检测")
            }
            else break;
        }

        let youxiang = findMC(allItemColor["邮箱1"], sc) || findMC(allItemColor["邮箱2"], sc, null, 20);
        if (youxiang) {
            honeyTreePos = { x: youxiang.x + 186, y: youxiang.y - 168 }
            log("邮箱确定蜂蜜树位置,坐标：" + honeyTreePos.x + "," + honeyTreePos.y)
            if (honeyTreePos.x > 1000 || honeyTreePos.x < 300 || honeyTreePos.y > 600 || honeyTreePos.y < 100) {
                log("坐标超出范围,继续检测")
            }
            else break;
        }

        let shop = findshop(silence = true, maxTry = 1);
        if (shop) {
            honeyTreePos = { x: shop.x + 442, y: shop.y - 77 }
            log("商店确定蜂蜜树位置,坐标：" + honeyTreePos.x + "," + honeyTreePos.y)
            if (honeyTreePos.x > 1000 || honeyTreePos.x < 300 || honeyTreePos.y > 600 || honeyTreePos.y < 100) {
                log("坐标超出范围,继续检测")
            }
            else break;
        }

        log("第" + (i + 1) + "次寻找蜂蜜树")
        showTip("第" + (i + 1) + "次寻找蜂蜜树")
        sleep(500);

    }

    if (honeyTreePos) {
        log("找到蜂蜜树，坐标：" + honeyTreePos.x + "," + honeyTreePos.y)
        showTip("找到蜂蜜树")
        return honeyTreePos;
    } else {
        // 循环结束后仍未找到，返回null
        log("未找到蜂蜜树")
        showTip("未找到蜂蜜树")
        return null;
    }
}

/**
 * 查找报纸箱
 * 每次间隔500ms
 * @param {number} maxTry 最大尝试次数
 * @returns {boolean} 返回报纸坐标
 */
function find_baozhi(maxTry = 20) {
    for (let i = 0; i < maxTry; i++) {
        let sc = captureScreen();
        let baozhi = findMC(allItemColor["报纸1"], sc, null, 20) || findMC(allItemColor["报纸2"], sc, null, 20);

        if (baozhi) {
            return baozhi;
        }
        sleep(500);
    }
}

/**
 * 查找邮箱
 * 每次间隔500ms
 * @param {number} maxTry 最大尝试次数
 * @returns {boolean} 返回邮箱坐标
 */
function find_youxiang(maxTry = 20) {
    for (let i = 0; i < maxTry; i++) {
        let sc = captureScreen();
        let youxiang = findMC(allItemColor["邮箱1"], sc) || findMC(allItemColor["邮箱2"], sc, null, 20);

        if (youxiang) {
            return youxiang;
        }
        sleep(500);
    }
}

function tomOperation(account_config) {
    let accountName = account_config.title !== undefined ? account_config.title : account_config
    let currentTomTimerName = accountName ? accountName + "Tom计时器" : "Tom计时器";

    let tomIsWorkName = accountName ? accountName + "TomIsWork" : "TomIsWork"
    let tom_isWork = timeStorage.get(tomIsWorkName) !== null;//是否在工作

    //如果汤姆在休息，输出剩余时间
    let tomTime = getTimerState(currentTomTimerName);
    if (tomTime) {
        let hours = Math.floor(tomTime / 3600);
        let minutes = Math.floor(tomTime / 60) % 60;
        let seconds = tomTime % 60;
        let timeText = hours > 0 ? `${hours}时${minutes}分${seconds}秒` : minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
        details = `汤姆休息剩余时间: ${timeText}`;
        log(details);
        showTip(details);
        return true
    }

    //如果没有雇佣汤姆，输出提示，并返回false
    if (!tom_isWork) {
        log("没有雇佣汤姆")
        showTip("没有雇佣汤姆");
        return false;
    }


    if ((config.tomFind.enabled || config.selectedFunction.code == 3) && account_config.tomFind.enabled && !tomTime && tom_isWork) {    //汤姆
        log("========== 汤姆 ==========");

        let findItemType = (account_config.tomFind && account_config.tomFind.type) || config.tomFind.type;
        let findItem = (account_config.tomFind && account_config.tomFind.text) || config.tomFind.text;
        if (!findItem) {
            log("Tom:未配置要找的物品")
            showTip("Tom:未配置要找的物品")
            return false;
        }

        sleep(100)
        find_close();
        sleep(100);

        if (!huadong_adjust([60, 50], [210, 240])) {
            huadong()
            huadong_adjust([60, 50], [210, 240])
        }
        sleep(350)
        let tomPos = clickTom();
        sleep(500);
        let tomState = tomToFind(tomPos, findItemType, findItem);
        if (tomState === null) {
            log("未雇佣汤姆");
            showTip("未雇佣汤姆");
            timeStorage.put(tomIsWorkName, null);
        } else if (tomState === false) {
            timeStorage.put(tomIsWorkName, false);
        } else if (tomState === undefined) { }
        else {
            let tomTimeSecend = tomState.hours * 60 * 60 + tomState.minutes * 60 + tomState.seconds;
            //设定计时器
            let timerName = accountName ? accountName + "Tom计时器" : "Tom计时器";
            timer(timerName, tomTimeSecend);
            timeStorage.put(tomIsWorkName, true);
        }
        if (config.switchAccount === false && !config.selectedFunction.code == 3) {//不换账号并且不是仅汤姆滑动回去
            sleep(500);
            swipe(600 - 350 + ran(), 580 - 200 + ran(), 600 + ran(), 580 + ran(), 1000);
        }

    }
}

function findTom() {
    for (let i = 0; i < 20; i++) {
        let sc = captureScreen();

        let box = findMC(["#cc9759", [32, 0, "#6f371c"],
            [34, 5, "#c8a250"], [42, 2, "#87b80e"],
            [40, 12, "#87b50f"], [11, -23, "#cdc921"]])
        if (box) {
            tomPos = { x: box.x + 20, y: box.y };
            log("盒子定位汤姆,坐标:" + tomPos.x + "," + tomPos.y)
            if (tomPos.x < 1280 && tomPos.y < 720) {
                return tomPos;
            } else {
                return null
            }
        }

        let baozhi1 = findMC(["#8f4e21", [0, -14, "#904f21"],
            [9, -39, "#d0cec9"], [-1, -34, "#d60808"],
            [-15, -8, "#aba79d"], [-12, -24, "#ecdeaf"]], sc);
        let baozhi2 = findMC(["#74401c", [0, -10, "#382517ff"],
            [8, -33, "#bebcb8"], [11, -23, "#7e7c75"],
            [-2, -29, "#b90707"], [-18, -13, "#9f916f"],
            [-14, -1, "#86837c"]], sc);

        if (baozhi1 || baozhi2) {
            let baozhi = baozhi1 || baozhi2;
            tomPos = { x: baozhi.x + 194, y: baozhi.y + 140 };
            log("报纸定位汤姆,坐标:" + tomPos.x + "," + tomPos.y)
            if (tomPos.x < 1280 && tomPos.y < 720) {
                return tomPos;
            } else {
                return null
            }
        }

        let youxiang1 = findMC(["#66605d", [13, -10, "#6f9692"],
            [13, -23, "#ce1d1d"], [1, -23, "#9ecbd0"], [-12, -27, "#93c0c5"]
        ], sc);
        let youxiang2 = findMC(["#5f5a56", [14, -10, "#678783"],
            [13, -20, "#a91717"], [-10, -28, "#87acad"], [3, -20, "#7fa4a7"]
        ], sc);

        if (youxiang1 || youxiang2) {
            let youxiang = youxiang1 || youxiang2;
            tomPos = { x: youxiang.x + 140, y: youxiang.y + 99 };
            log("邮箱定位汤姆,坐标:" + tomPos.x + "," + tomPos.y)
            if (tomPos.x < 1280 && tomPos.y < 720) {
                return tomPos;
            } else {
                return null
            }
        }

        sleep(500);
    }
    log("未找到汤姆")
    showTip("未找到汤姆")
    return null;
}

function clickTom() {
    log("找汤姆")
    showTip("找汤姆")
    let tomPos = findTom();
    if (tomPos) {
        log("点击汤姆")
        showTip("点击汤姆");
        click(tomPos.x, tomPos.y);
        return tomPos;
    } else {
        find_close();
        log("重新寻找汤姆")
        showTip("重新寻找汤姆");
        huadong(right = true);
        sleep(500);
        let tomPos = findTom();
        if (tomPos) {
            log("点击汤姆")
            showTip("点击汤姆");
            click(tomPos.x, tomPos.y);
            return tomPos;
        } else return false;
    }
}

function tomMenu() {
    //汤姆剩余时间不足2小时
    let menu5 = findMC(["#ff6133", [90, 7, "#ff6133"], [-110, -225, "#f3ead7"], [428, -232, "#f4ebde"]])
    if (menu5) {
        log("汤姆剩余时间不足2小时")
        return "没有雇佣汤姆"
    }
    //寻找页面
    let menu1 = findMC(["#deb477", [583, 22, "#d3a265"], [694, 1, "#ec414b"],
        [676, 98, "#fcd05c"], [628, 102, "#fff9db"]]);
    if (menu1) {
        return "寻找"
    }
    //等待页面
    let menu2 = matchColor([{ x: 559, y: 184, color: "#f4eadb" }, { x: 1122, y: 186, color: "#f4ebde" },
    { x: 601, y: 233, color: "#7b593d" }, { x: 988, y: 233, color: "#7b593d" },
    { x: 1111, y: 297, color: "#f3e7c8" }]);
    if (menu2) {
        return "等待"
    }
    //没有雇佣汤姆页面
    let menu3 =
        //花钻雇佣界面(带下方绿色免费框)
        findMC(["#ea3e48", [-212, 46, "#f4eadb"], [-237, 144, "#f3e7c7"],
            [-51, 296, "#fdc025"], [-262, 302, "#febc1e"], [-478, 298, "#fdbe23"]]) ||
        //花钻雇佣界面(带下方绿色免费框) 第二版(回归)
        findMC(["#f4ead7", [554, -46, "#ee444e"], [518, 151, "#f3e8cc"],
            [528, 507, "#5bc739"]]) ||

        //小盒界面
        findMC(["#f4eada", [-51, 116, "#f3e8cd"], [-181, 188, "#a45c25"],
            [-163, 238, "#8e3e12"], [-251, 247, "#c2742e"], [-133, 276, "#a25b25"]])
    if (menu3) {
        return "没有雇佣汤姆"
    }

    let menu4 = matchColor([{ x: 624, y: 96, color: "#f5ebd8" },
    { x: 1135, y: 124, color: "#f4ead8" }, { x: 1004, y: 530, color: "#f6c243" }])
    if (menu4) {
        return "选择数量"
    }

    let menu6 = matchColor([{ x: 571, y: 96, color: "#f4eada" }, { x: 1108, y: 118, color: "#f4eada" },
    { x: 675, y: 370, color: "#f7bb3b" }, { x: 982, y: 378, color: "#f6b430" }, { x: 784, y: 369, color: "#f5d55b" }])
    if (menu6) {
        return "第一次"
    }

    //没有找到符合的页面
    return null;
}

/**
 * 
 * @param {*} tomPos 汤姆坐标
 * @param {*} findItemType 查找类型
 * @param {*} findItem 查找内容
 * @returns 找到返回休息时间，休息返回剩余时间，未雇佣返回null，未找到返回false
 * @description 点击汤姆后进行操作，需自行设置计时器
 */
function tomToFind(tomPos, findItemType, findItem) {

    //第一次点击汤姆
    function tom_operation1() {
        let findNum = 0;
        while (findNum < 3) {
            // 根据类型确定点击坐标
            let x = 230 + ran();
            let y = 350 + ran();
            if (findItemType == "粮仓") {
                y = 230 + ran();
            } else if (findItemType != "货仓") {
                // 默认情况也点击货仓位置
                y = 350 + ran();
            }

            // 执行点击和输入操作
            click(x, y);
            sleep(500);
            //点击搜索

            if (!matchColor([{ x: 730, y: 253, color: "#ffffca" }, { x: 452, y: 226, color: "#ffffca" }], null, 6)) {//相似度6不能高了
                let searchButton = findMC(["#ffffff", [8, -7, "#f5d500"], [13, -17, "#ffffff"],
                    [-17, -9, "#f9ca00"], [8, 23, "#f4be00"]], null, [131, 34, 500 - 131, 333 - 34])
                if (searchButton) {
                    log("点击搜索按钮")
                    click(searchButton.x + ran(), searchButton.y + ran())
                    sleep(500);
                } else {
                    log("未找到搜索按钮");
                    showTip("未找到搜索按钮");
                    findNum++
                    continue;
                }
            }
            //点击输入框
            click(490 + ran(), 230 + ran());
            log("输入搜索内容:" + findItem);
            showTip("输入搜索内容:" + findItem);
            sleep(500);
            setText_inGame(findItem); //输入搜索内容
            sleep(150)
            //检测是否有文字颜色
            if (!images.findColorInRegion(captureScreen(), "#753e36", 311, 190, 681 - 311, 258 - 190)) {
                log("文字未输入成功")
                showTip("文字未输入成功");
                findNum++
                continue;
            }

            //点击物品
            sleep(350);
            let firstPos = [380, 370]
            let step = [190, 100]
            let firstcolorPos = [{ x: 380, y: 370 }, { x: 361, y: 350 }, { x: 409, y: 396 }, { x: 417, y: 346 }, { x: 366, y: 400 }]
            let color = "#fff9db"
            let isFind = false;

            //如果搜索后第二格没有物品
            if (matchColor([{ x: firstcolorPos[0].x + step[0], y: firstcolorPos[0].y, color: color },
            { x: firstcolorPos[1].x + step[0], y: firstcolorPos[1].y, color: color },
            { x: firstcolorPos[2].x + step[0], y: firstcolorPos[2].y, color: color },
            { x: firstcolorPos[3].x + step[0], y: firstcolorPos[3].y, color: color },
            { x: firstcolorPos[4].x + step[0], y: firstcolorPos[4].y, color: color }])) {
                isFind = true;
                click(firstPos[0] + ran(), firstPos[1] + ran())
            } else {
                for (let i = 0; i < 2; i++) {
                    if (isFind) {
                        break;
                    }
                    if (!tomItemColor[findItem]) {
                        sleep(200)
                        click(firstPos[0] + ran(), firstPos[1] + ran())
                        isFind = true;
                        break;
                    }
                    sleep(200)
                    itemPos = findMC(tomItemColor[findItem], null, [287, 294, 675 - 287, 651 - 294])
                    if (itemPos) {
                        log("找到该物品,坐标:" + itemPos.x + "," + itemPos.y)
                        showTip("找到 " + findItem)
                        isFind = true;
                        click(itemPos.x + ran(), itemPos.y + ran())
                    }
                    if (!isFind) {
                        swipe(490, 600, 490, 365, 500)
                        sleep(10)
                        click(490, 365)
                    }
                }
            }

            if (!isFind) {
                log("没找到该物品,点击第一个物品")
                click(firstPos[0] + ran(), firstPos[1] + ran())
            }

            // 点击 开始寻找 按钮
            sleep(500);
            if (matchColor([{ x: 752, y: 459, color: "#f6bd3d" }, { x: 1029, y: 464, color: "#f6bc3a" }])) {
                click(890 + ran(), 460 + ran());
                //第一次回来
                log("等待汤姆中,请勿进行任何操作...");
                showTip("等待汤姆中,请勿进行任何操作...");
                sleep(25000);
                showTip("汤姆第一次返回");
                return true;
            } else {
                sleep(500);
                findNum++;
            }
            //没有点到物品，开始寻找 按钮是灰色
        }
        return false
    }

    function tom_operation2(tomPos, inTomMenu = false) {

        function tom_operation2_click(tomPos) {
            click(1080 + ran(), 370 + ran());
            //第二次回来
            log("等待汤姆中,请勿进行任何操作...");
            showTip("等待汤姆中,请勿进行任何操作...");
            sleep(25000);
            log("收取物品");
            showTip("收取物品");
            click(tomPos.x, tomPos.y);
        }

        if (inTomMenu) {
            tom_operation2_click(tomPos);
            return true;
        }

        let findNum = 0;
        while (findNum < 3) {

            if (findNum != 0) {
                sleep(500);
                tomPos = clickTom();
            }

            for (let i = 0; i < 3; i++) {
                showTip("汤姆第一次返回，点击汤姆")
                if (findNum == 0 && i == 0 && tomPos) click(tomPos.x, tomPos.y);
                sleep(1000);
                //选择找的数量
                if (!matchColor([{ x: 624, y: 96, color: "#f5ebd8" },
                { x: 1135, y: 124, color: "#f4ead8" }, { x: 1004, y: 530, color: "#f6c243" }])) {
                    continue;
                }
                tom_operation2_click(tomPos);
                return true;
            }
            findNum++;
        }
        return false;
    }

    /**
     * @description 验证汤姆的点击
     * @param {*} tomPos 汤姆坐标
     * @returns 找到返回汤姆休息时间
     */
    function tom_operation3(tomPos) {
        //验证汤姆的点击
        let findNum = 0
        while (findNum < 3) {
            sleep(1000);
            click(tomPos.x, tomPos.y);
            let tom_menu = tomMenu();
            if (tom_menu == "等待" || tom_menu == "没有雇佣汤姆") {
                log("成功收取物品");
                showTip("成功收取物品");
                let tomTimeStr = findFont(null, [838, 406, 1005 - 838, 453 - 406], "#FFFFFF", 8, Font.FontLibrary_Tom, 0.7, mode = "clip");
                let tomTimeStr_fixed = tomTimeStr.replace(/(\d*)小时/, function (match, p1) {
                    // 如果没有数字或者数字不是1，则替换为1
                    if (p1 === "" || p1 !== "1") {
                        return "1小时";
                    }
                    // 如果是1，则保持不变
                    return match;
                });
                let tomTime = extractTime(tomTimeStr_fixed);
                showTip("汤姆剩余时间:" + tomTime.hours + "小时" + tomTime.minutes + "分钟" + tomTime.seconds + "秒");
                sleep(1000);
                click(200 + ran(), 420 + ran());
                isfindTom = true;
                return tomTime;
            } else {
                clickTom();
                findNum++;
            }
        }
    }

    function tom_find(tomPos) {

        tom_operation1();

        tom_operation2(tomPos);

        let tomTime = tom_operation3(tomPos);
        return tomTime;
    }

    let isfindTom = false;
    let findNum = 0;

    while (!isfindTom && findNum < 3) {
        for (let i = 0; i < 5; i++) {
            log("第 " + (i + 1) + " 次检测汤姆页面");
            showTip("第 " + (i + 1) + " 次检测汤姆页面");
            let tom_menu = tomMenu();
            if (tom_menu == "寻找") {
                findNum = 0;
                log("检测到汤姆页面");
                showTip("检测到汤姆页面");
                let tomTime = tom_find(tomPos);
                isfindTom = true;
                return tomTime;
            } else if (tom_menu == "选择数量") {
                findNum = 0;
                tom_operation2(tomPos, true);
            } else if (tom_menu == "等待") {
                findNum = 0;
                let tomTimeStr = findFont(null, [838, 406, 1005 - 838, 453 - 406], "#FFFFFF", 8, Font.FontLibrary_Tom, 0.7, mode = "clip");
                if (!tomTimeStr) {
                    if (findMC(["#ff6133", [90, 7, "#ff6133"], [-110, -225, "#f3ead7"], [428, -232, "#f4ebde"]])) {
                        log("剩余时间不足2小时")
                        showTip("剩余时间不足2小时")
                        return null;
                    }
                }
                let tomTimeStr_fixed = tomTimeStr.replace(/(\d*)小时/, function (match, p1) {
                    // 如果没有数字或者数字不是1，则替换为1
                    if (p1 === "" || p1 !== "1") {
                        return "1小时";
                    }
                    // 如果是1，则保持不变
                    return match;
                });
                let tomTime = extractTime(tomTimeStr_fixed);
                showTip("汤姆剩余时间:" + tomTime.hours + "小时" + tomTime.minutes + "分钟" + tomTime.seconds + "秒");
                sleep(1000);
                click(200 + ran(), 420 + ran());
                isfindTom = true;
                return tomTime;
            } else if (tom_menu == "没有雇佣汤姆") {
                findNum = 0;
                log("没有雇佣汤姆");
                showTip("没有雇佣汤姆");
                sleep(1000);
                click(200 + ran(), 420 + ran());
                isfindTom = true;
                return null;
            } else if (tom_menu == "第一次") {
                findNum = 0;
                log("第一次雇佣汤姆");
                showTip("第一次雇佣汤姆");
                if (config.tom_firstHire) {
                    log("第一次雇佣汤姆，点击雇佣")
                    sleep(1000);
                    click(760 + ran(), 500 + ran())
                    sleep(1000);
                    let tomTime = tom_find(tomPos);
                    return tomTime;
                }
                else {
                    log("第一次雇佣汤姆，点击取消")
                    sleep(1000);
                    click(200 + ran(), 420 + ran());
                }
                isfindTom = true;
                return null;
            }

            else sleep(500);
        }
        if (!isfindTom) {
            log("未检测到汤姆页面");
            showTip("未检测到汤姆页面");
            clickTom();
            findNum++;
        }
    }
    return false;
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

    let pos_shop = findshop(false);

    if (pos_shop) {
        console.log("找到商店，点击耕地")
        // showTip("点击耕地");

        let center_land = {
            x: pos_shop.x + config.landOffset.x,
            y: pos_shop.y + config.landOffset.y,
        };

        //滑动微调
        if (center_land.x < 300 || center_land.y > 500 || center_land.y < 300) {
            const [x, y] = [10, 40];
            swipe(center_land.x + x, center_land.y + y, 644 + x, 460 + y, 300);
            click(644 + x, 460 + y);

            pos_shop = findshop(true);

            center_land = {
                x: pos_shop.x + config.landOffset.x,
                y: pos_shop.y + config.landOffset.y,
            };
        }

        if (isclick) {
            try {
                click(center_land.x, center_land.y); //100,-30
            } catch (error) {
                log(error);
            }
        }

        return center_land

    } else {
        return null;
    }
}
//找商店，只寻找

/**
 * 查找商店或面包房位置
 * @param {boolean} silence - 是否静默，默认为false,为true会显示showTip
 * @param {number} maxTry - 最大尝试次数，默认为5
 * @returns {object|boolean} 返回商店中心坐标对象{x,y}，若未找到商店则返回false
 * @description 该函数根据配置的查找方式（商店或面包房）定位对应位置
 *              主要用于辅助定位耕地位置
 */
function findshop(silence = false, maxTry = 5) {
    console.log("找" + config.landFindMethod);
    let center;
    for (let i = 0; i < maxTry; i++) {
        try {
            if (!silence) showTip("第 " + (i + 1) + " 次检测" + config.landFindMethod);
            if (config.landFindMethod == "商店") {
                center = findimage(files.join(config.photoPath, "shop.png"), 0.6);
                if (!center) {
                    center1 = findimage(files.join(config.photoPath, "shop1.png"), 0.6);
                    if (center1) center = { x: center1.x - 5, y: center1.y };
                };
            } else {
                center = findimage(files.join(config.photoPath, "bakery.png"), 0.6);
                if (!center) {
                    center = findimage(files.join(config.photoPath, "bakery1.png"), 0.6);
                };
            };
        } catch (error) {
            log(error);
        }
        if (center) break
        else {
            find_close();
            if (i < maxTry - 1) sleep(500);
        }
    }
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
    try {
        for (let i = 0; i < maxAttempts; i++) {
            let findshop_1 = findshop();
            if (findshop_1) {
                console.log("打开路边小店");
                showTip("打开路边小店");
                sleep(300);
                click(findshop_1.x + config.shopOffset.x + ran(), findshop_1.y + config.shopOffset.y + ran());
                sleep(100)
                if (inShop()) {
                    return true; // 成功找到并点击
                }
            }

            if (i < maxAttempts - 1) { // 如果不是最后一次尝试，就滑动重找
                console.log("未找到商店，尝试滑动重新寻找");
                showTip("未找到商店，尝试滑动重新寻找");
                sleep(1000);
                huadong();
                sleep(500);
            }
        }
    } catch (error) {
        log(error);
    }
    console.log("多次尝试后仍未找到商店");
    showTip("多次尝试后仍未找到商店");
    return false; // 表示未能成功打开商店
};



/**
*从头开始滑动找耕地并点击
*/
function findland_click() {

    huadong();
    sleep(500)

    let findland_click_pos = findland()
    if (findland_click_pos) {
        return findland_click_pos
    } else {
        checkmenu()
    }
}

/**
 * 
 * @param {*} group [0,harvestTime,[x,y],[x,y]]
 * @param {*} L 左移 {x: number, y: number}
 * @param {*} R 右移 {x: number, y: number}
 * @param {*} S 换行 {x: number, y: number}
 * @param {*} rows 行数,执行次数
 * @returns {Array} 包含所有点的数组，每个点都是[x, y]格式
 */
function getHarvestGroup(group, L, R, S, rows) {
    if (!group || group.length < 3) {
        log("getHarvestGroup参数错误,group不能为空且长度必须大于等于3")
        return false
    }
    const safe = (x, y) => [
        Math.max(0, Math.min(x, 1280 - 1)),
        Math.max(0, Math.min(y, 720 - 1))
    ];

    let originalGroup = group
    let lastIndex = originalGroup.length - 1
    let startX = originalGroup[lastIndex][0]
    let startY = originalGroup[lastIndex][1]
    for (let i = 0; i < rows; i++) {
        // 添加当前行的三个点（左移、换行、右移）
        originalGroup.push(
            safe(startX + L.x, startY + L.y),
            safe(startX + L.x + S.x, startY + L.y + S.y),
            safe(startX + L.x + S.x + R.x, startY + L.y + S.y + R.y)
        );

        startX = safe(startX + L.x + S.x + R.x, startY + L.y + S.y + R.y)[0];
        startY = safe(startX + L.x + S.x + R.x, startY + L.y + S.y + R.y)[1];
    }
    return originalGroup
}

/**
 * 收割作物
 * @param {Object} center - 收割中心点坐标 {x: number, y: number}
 * @param {number} [rows=3] - 收割行数
 */
function harvest(center) {
    // 参数检查
    if (!center || !center.x || !center.y) {
        return false;
    }
    log("开始收割，坐标: " + center.x + "," + center.y);
    //重复次数
    let rows = config.harvestRepeat || 3

    let center_land = findland(false);
    if (!center_land || !center_land.x || !center_land.y) {
        return false;
    }
    // 定义偏移量
    let harvestX = config.harvestX || 8
    let harvestY = config.harvestY || 3.5
    // 左移
    const L = {
        x: (harvestX + 2) * -36,
        y: (harvestX + 2) * -18
    };
    // 右移
    const R = {
        x: -L.x,
        y: -L.y
    };
    // 换行
    const S = {
        x: (harvestY) * 36,
        y: (harvestY) * -18
    };

    let pos1 = [config.firstland.x || 20, config.firstland.y || 0]
    let pos2X = config.distanceX || 0
    let pos2Y = config.distanceY || 75

    // 初始土地坐标计算
    let pos_land = {
        x: center_land.x + pos1[0],
        y: center_land.y + pos1[1]
    }
    const safe = (x, y) => [
        Math.max(0, Math.min(x, 1280 - 1)),
        Math.max(0, Math.min(y, 720 - 1))
    ];

    let harvestTime = config.harvestTime * 1000;


    // 计算当前行的起始位置
    let startX = pos_land.x;
    let startY = pos_land.y;

    let firstGroup, secondGroup

    let harvestMode = configs.get("harvestMode", 0)
    if (harvestMode === 0) {
        if (configs.get("syncHarvest")) {
            // 第一组手势路径点
            firstGroup = [0, harvestTime, safe(center.x, center.y), safe(pos_land.x + pos2X / 2, pos_land.y + pos2Y / 2), safe(pos_land.x, pos_land.y)];

            // 第二组手势路径点（Y偏移）
            secondGroup = [0, harvestTime, safe(center.x, center.y), safe(pos_land.x + pos2X / 2, pos_land.y + pos2Y / 2), safe(pos_land.x + pos2X, pos_land.y + pos2Y)];

        } else {
            // 第一组手势路径点
            firstGroup = [0, harvestTime, safe(center.x, center.y), safe(pos_land.x, pos_land.y)];

            // 第二组手势路径点（Y偏移）
            secondGroup = [0, harvestTime, safe(center.x, center.y), safe(pos_land.x + pos2X, pos_land.y + pos2Y)];

        }

        for (let i = 0; i < rows; i++) {

            // 添加当前行的三个点（左移、换行、右移）
            firstGroup.push(
                safe(startX + L.x, startY + L.y),
                safe(startX + L.x + S.x, startY + L.y + S.y),
                safe(startX + L.x + S.x + R.x, startY + L.y + S.y + R.y)
            );


            // 添加当前行的三个点（左移、换行、右移）带Y偏移
            secondGroup.push(
                safe(startX + L.x + pos2X, startY + L.y + pos2Y),
                safe(startX + L.x + S.x + pos2X, startY + L.y + S.y + pos2Y),
                safe(startX + L.x + S.x + R.x + pos2X, startY + L.y + S.y + R.y + pos2Y)
            );
            startX = safe(startX + L.x + S.x + R.x, startY + L.y + S.y + R.y)[0];
            startY = safe(startX + L.x + S.x + R.x, startY + L.y + S.y + R.y)[1];
        }
    } else if (harvestMode === 1) {
        let group1 = [0, harvestTime, safe(center.x, center.y), safe(center.x - pos2X / 2, center.y - pos2Y / 2), safe(pos_land.x - pos2X / 2, pos_land.y - pos2Y / 2)];
        let group2 = [0, harvestTime, safe(center.x, center.y), safe(center.x + pos2X / 2, center.y + pos2Y / 2), safe(pos_land.x + pos2X / 2, pos_land.y + pos2Y / 2)];
        firstGroup = getHarvestGroup(group1, L, R, S, rows)
        secondGroup = getHarvestGroup(group2, L, R, S, rows)
    }

    // 执行手势
    // log(L, R, S)
    // log(firstGroup, secondGroup)
    // log(config.harvestRepeat, config.harvestX, config.harvestY)
    try {
        gestures(firstGroup, secondGroup);
    } catch (error) {
        log("收割手势出错" + error)
    }
}

/**
 * 在屏幕上查找图片
 * @param {string|images.Image} imagepath 图片路径或图片对象
 * @param {number} xiangsidu 相似度阈值，0-1之间
 * @param {number} max_number 最大匹配数量
 * @param {images.Image} [screenImage] 可选，自定义传入的屏幕截图，如果不传入则自动截图
 * @returns {Array} 匹配到的坐标点数组
 */
function findimages(imagepath, xiangsidu, max_number, screenImage) {
    let sc = null;
    let picture = null;

    try {
        // 如果没有传入屏幕截图，则使用默认截图功能
        if (screenImage) {
            sc = screenImage;
        } else {
            sc = captureScreen();
        }

        if (!sc) {
            console.log("截图失败");
            return [];
        }

        // 判断传入的是路径还是图片对象
        if (typeof imagepath === "string") {
            // 如果是字符串，当作文件路径处理
            picture = images.read(imagepath);
            if (!picture) {
                if (!screenImage) sc.recycle(); // 只有不是传入的截图才回收
                console.log("图片读取出错，请检查路径,当前传入路径:", imagepath);
                return [];
            }
        } else {
            // 如果是图片对象，直接使用
            picture = imagepath;
            if (!picture) {
                if (!screenImage) sc.recycle(); // 只有不是传入的截图才回收
                console.log("图片对象无效");
                return [];
            }
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

        return results1;
    } catch (error) {
        log(error);
        return [];
    } finally {
        // 确保资源得到释放
        try {
            // 如果是通过路径读取的图片，才需要回收
            if (typeof imagepath === "string" && picture) {
                picture.recycle();
            }

            // 如果不是传入的截图，才需要回收
            if (!screenImage && sc) {
                sc.recycle();
            }
        } catch (recycleError) {
            log("资源回收出错: " + recycleError);
        }
    }

}

function harvest_wheat(sickle) {


    let center_sickle = sickle || click_waitFor(null, null, sicklePoints, 10, 16)
    if (center_sickle) {
        console.log("找到镰刀,准备收割，坐标: " +
            center_sickle.x + "," + center_sickle.y);
        showTip("找到镰刀，准备收割");
        harvest(center_sickle);
    } else {
        console.log("未找到镰刀");
        showTip("未找到镰刀");
    };

    find_close();

}

//收金币
/**
 * 如果有金币可以收，收完金币自动等待一秒
 * 无返回值
 */
function coin() {
    console.log("收金币");
    // showTip("收金币");
    let allcenters = [];
    let sc = captureScreen();
    let region = [158, 160, 1117 - 158, 542 - 160]
    let centers1 = findimages(files.join(config.photoPath, "shopsold1.png"), 0.8, 10, sc);
    //汤姆
    let centers2 = findMC(["#cae588", [48, -6, "#875324"], [53, 32, "#ffe875"],
        [8, 51, "#e15526"], [3, 71, "#97b058"],
        [74, 76, "#94b155"], [48, 76, "#762512"]], sc, region)
    //格雷格
    let centers3 = findMC(["#6ac7e9", [52, 19, "#f0b7a1"], [71, 168, "#ffea32"],
        [31, 9, "#ffffff"], [-2, 66, "#77282f"], [49, 59, "#e3722b"],
        [79, 8, "#6bcae7"]], sc, region)
    //抱礼物的格雷格
    let centers4 = findMC(["#6bc9e9", [49, 12, "#ebb199"], [51, 36, "#e0823c"],
        [28, 74, "#1265b5"], [6, 50, "#823439"], [69, 167, "#ffeb37"],
        [29, 11, "#ffffff"]], sc, region)

    // 合并所有点并过滤距离过近的点
    let allPoints = centers1.concat(centers2, centers3, centers4);
    let filteredPoints = [];

    try {
        for (let i = 0; i < allPoints.length; i++) {
            if (!allPoints[i]) continue;
            let shouldKeep = true;
            // 检查当前点是否与已保留的点距离过近
            for (let j = 0; j < filteredPoints.length; j++) {
                let dx = Math.abs(allPoints[i].x - filteredPoints[j].x);
                let dy = Math.abs(allPoints[i].y - filteredPoints[j].y);
                // 如果x和y坐标差值都小于20，则排除当前点
                if (dx < 20 && dy < 20) {
                    shouldKeep = false;
                    break;
                }
            }
            // 如果没有距离过近的点，则保留当前点
            if (shouldKeep) {
                filteredPoints.push(allPoints[i]);
            }
        }

        allcenters = allcenters.concat(filteredPoints);
        allcenters.sort((a, b) => a.x - b.x);
        console.log("有" + allcenters.length + "个金币可以收");
        // console.log(allcenters)
        if (allcenters.length > 0) {
            showTip("有" + allcenters.length + "个金币可以收")
        }

        if (configs.get("coinCollectionMethod") == "一键收取") {
            // 使用gestures一次性点击所有金币位置
            if (allcenters.length > 0) {
                let gesturePoints = [];
                allcenters.forEach(target => {
                    let pos = [48, 60];
                    gesturePoints.push([0, 100, [target.x + pos[0] + ran(), target.y + pos[1] + ran()]]);
                });

                gestures.apply(null, gesturePoints);
                sleep(1000);
            }
        } else {
            // 逐个点击金币位置
            allcenters.forEach(target => {
                let pos = [48, 60];
                click(target.x + pos[0] + ran(), target.y + pos[1] + ran());
            });
            if (allcenters.length > 0) sleep(1000)
        }
    } catch (error) {
        log(error);
    }
}


//商店货架寻找物品，发布广告
function find_ad() {
    let shop_coin = findMC(["#fffabb", [83, -17, "#fff27d"], [80, -3, "#ffe718"], [-73, 22, "#f7cd88"]],
        null, null, 16);
    try {
        if (shop_coin) {
            //如果找到货架上的金币
            let [x1, y1] = [-58, -23];
            click(shop_coin.x + x1 + ran(), shop_coin.y + y1 + ran()); //点击金币
            sleep(100);
            let ad = matchColor([{ x: 765, y: 423, color: "#fbba15" }, { x: 496, y: 499, color: "#cbcbcb" }]);
            if (ad) {
                console.log("可以发布广告");
                click(800 + ran(), 330 + ran());
                // sleep(300);
                click(640 + ran(), 500 + ran());
                return true;
            }
        } else {
            console.log("发布广告时未找到可上架物品");
            showTip("发布广告时未找到可上架物品");
            return false;
        }
    } catch (error) {
        log(error)
    }
}

/**
 * 判断是否在商店主界面
 * @returns {boolean} 是否在商店主界面
 */
function inShop() {
    if (matchColor([{ x: 1161, y: 524, color: "#cb642c" }, { x: 1063, y: 618, color: "#eeae52" }, { x: 1032, y: 606, color: "#dab299" }], null, 16)) {
        return true;
    } else {
        return false;
    }
}

/**
 * 判断是否在商店售卖界面
 * @returns {boolean} 是否在商店售卖界面
 */
function inShop_sell() {
    if (matchColor([{ x: 1110, y: 378, color: "#fff9db" }, { x: 342, y: 58, color: "#deb476" }, { x: 1163, y: 49, color: "#fac73f" }])) {
        return true;
    } else {
        return false;
    }
}



//商店售卖
function shop() {
    try {
        console.log("当前操作:商店");
        showTip("商店售卖");
        sleep(300);
        coin();
        sleep(500);

        let wheat_sell_minNum = config.ReservedQuantity;//售卖最低保存数量

        // 检查是否还在商店界面
        if (!inShop()) {
            console.log("未检测到商店界面，可能已关闭");
            return;
        }

        if (configs.get("isCangkuSold", false)) {
            log("当前操作:商店售卖")
            let sellPlan = shopStatistic();
            if (sellPlan) {
                log("商店售卖计划:" + JSON.stringify(sellPlan))
                shop_sell(sellPlan, allItemColor)
            }
        }


        while (true) {
            let kongxian = find_kongxian();
            if (!kongxian) {    //没有空闲货架
                console.log("未找到空闲货架,商店售卖结束");
                showTip("未找到空闲货架,商店售卖结束");
                break;
            }

            //判断是否在粮仓界面
            if (!matchColor([{ x: 247, y: 211, color: "#ffd157" }, { x: 251, y: 340, color: "#ffb906" }])) {
                click(200 + ran(), 200 + ran());//点击售卖粮仓按钮
                sleep(100);
                console.log("点击粮仓按钮")
            }

            let wheat_sell = findMC(crop_sell, null, [261, 122, 707 - 261, 688 - 122], 16);

            if (!wheat_sell) {   //没找到售卖货架上的作物
                sleep(100);
                wheat_sell = findMC(crop_sell, null, [261, 122, 707 - 261, 688 - 122], 16);
                if (!wheat_sell) {
                    console.log("未识别到" + config.selectedCrop.text);
                    showTip("未识别到" + config.selectedCrop.text);
                    close();
                    break;
                }
            }

            // 识别数字
            let region = [wheat_sell.x, wheat_sell.y, 130, 80]
            sleep(100);//上架有残影，有时识别不到
            let wheat_num = findFont(null, region, "#FFFFFF", 8, Font.FontLibrary_ShopNum, 0.8);
            if (wheat_num == "") {
                sleep(500)
                wheat_num = findFont(null, region, "#FFFFFF", 8, Font.FontLibrary_ShopNum, 0.8);
            }

            let sellNum = Number(wheat_num) - Number(wheat_sell_minNum)
            if (sellNum <= 0) {
                console.log(config.selectedCrop.text + "数量" + wheat_num + "，不足" + wheat_sell_minNum + "，结束售卖");
                showTip(config.selectedCrop.text + "数量" + wheat_num + "，不足" + wheat_sell_minNum + "，结束售卖");
                log(config.selectedCrop.text + "数量不足，退出售卖");
                if (inShop_sell()) {
                    log("识别到售卖界面，点击叉叉")
                    close();
                }
                break;
            }

            console.log(config.selectedCrop.text + "数量" + wheat_num + "≥" + wheat_sell_minNum + "，可售卖" + sellNum);
            showTip(config.selectedCrop.text + "数量" + wheat_num + "≥" + wheat_sell_minNum + "，可售卖" + sellNum);
            if (inShop_sell()) {
                log("识别到售卖界面，点击叉叉")
                close();
            }
            shop_sell([{ title: config.selectedCrop.text, num: sellNum }], { [config.selectedCrop.text]: crop_sell }, "粮仓", config.shopPrice.code)
            break;

        }

        console.log("发布广告");
        showTip("发布广告");
        sleep(100);
        if (inShop_sell()) {
            close();//点击叉号
            log("发布广告(在售卖界面)：点击叉号")
            sleep(100)
        }
        coin();

        let shop_coin = findMC(["#fffabb", [83, -17, "#fff27d"], [80, -3, "#ffe718"], [-73, 22, "#f7cd88"]],
            null, null, 16);
        if (shop_coin) {
            //如果找到货架上的金币

            click(shop_coin.x + ran(), shop_coin.y + ran()); //点击可上架物品
            log("发布广告：点击" + config.selectedCrop.text)
            sleep(100);

            let ad = matchColor([{ x: 750, y: 420, color: "#fff9db" }]);
            if (!ad) {
                console.log("可以发布广告");
                click(800 + ran(), 330 + ran());
                // sleep(100);
                click(640 + ran(), 500 + ran());
                // sleep(200);
                close();
            } else {
                console.log("广告正在冷却或已发布广告");
                showTip("广告正在冷却或已发布广告");
                // sleep(200);
                close();
                sleep(100);
            }
        } else {  //如果没有找到货架上的物品
            coin();

            let is_find_ad = find_ad();
            log("发布广告：没找到货架上的物品");
            if (!is_find_ad) {
                const [x3, y3] = [288, 390];
                const [x4, y4] = [1080, 390];
                swipe(x3 + ran(), y3 + ran(), x4 + ran(), y4 + ran(), 1000);
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

    } catch (e) {
        console.error("shop函数出错:", e);
        showTip("商店操作出错，已跳过");
    } finally {
        // 确保关闭所有可能的弹窗
        while (find_close()) {
            sleep(200);
        }
    }
}

/**
 * 查找空闲货架并点击
 * @param {number} maxAttempts - 最大尝试次数
 * @returns {boolean} - 是否成功找到空闲货架
 */
function find_kongxian(maxAttempts = 5) {
    let shopEnd = false;
    let currentAttempts = 0;
    let findCoin = false;
    showTip("");
    // log("当前尝试次数: " + currentAttempts);

    while (true) {
        sleep(100);
        var kongxian = findMC(["#f1e044", [15, -2, "#7b593d"], [-8, 57, "#e4ad3d"], [-10, 67, "#f7ce8d"]], null, [160, 130, 1100 - 160, 600 - 130], 10);

        if (kongxian) break;

        if (!findCoin) {
            coin();
            findCoin = true;
            continue;
        }

        console.log("未找到空闲货架");
        showTip("未找到空闲货架");

        if (shopEnd || currentAttempts >= maxAttempts) { //如果右滑到顶了，且尝试次数超过最大次数，返回false
            log("右滑到顶了");
            showTip("右滑到顶了");
            return false;
        }

        currentAttempts++;

        const [x1, y1] = [960, 390];
        const [x2, y2] = [288, 390];
        swipe(x1 + ran(), y1 + ran(), x2 + ran(), y2 + ran(), 1000);
        console.log("商店右滑")
        sleep(300);
        coin();
        shopEnd = matchColor([{ x: 990, y: 292, color: "#cccccc" }]);
        if (shopEnd) {
            log("右滑到顶了");
            showTip("右滑到顶了");
            continue;
        }
    }

    //有空闲货架点击上架
    console.log("找到空闲货架");
    showTip("找到空闲货架");
    click(kongxian.x + ran(), kongxian.y + ran()); //点击空闲货架
    // console.log("点击空闲货架")
    sleep(200);
    return true;
}

function find_kongxian_until() {
    do {
        var kongxian = find_kongxian();
        if (!kongxian) {
            const [x1, y1] = [288, 390];
            const [x2, y2] = [960, 390];
            console.log("商店左滑")
            for (let i = 0; i < 3; i++) {
                swipe(x1 + ran(), y1 + ran(), x2 + ran(), y2 + ran(), 150);
                sleep(300)
            }
        }
    } while (!kongxian);
}


/**
 * 售卖统计
 * @param {*} sc 屏幕截图
 * @returns [ { title: '炸药', num: 7 },]
 */
function shopStatistic(sc) {
    try {
        let kongxian = find_kongxian();
        if (!kongxian) {    //没有空闲货架
            console.log("未找到空闲货架,商店售卖结束");
            showTip("未找到空闲货架,商店售卖结束");
            return false;
        }
        //判断是否在货仓界面
        if (matchColor([{ x: 247, y: 211, color: "#ffd157" }, { x: 251, y: 340, color: "#ffb906" }])) {
            click(200 + ran(), 330 + ran());//点击售卖货仓按钮
            sleep(100);
            console.log("点击货仓按钮")
        }

        sc = sc || captureScreen();
        let capacity_result = findFont(sc, [659, 56, 854 - 659, 100 - 56], "#FFFFFF", 8, Font.FontLibrary_ShopCapacity, 0.9);
        log(capacity_result);

        // 提取 '/' 两边的数字并计算差值
        if (typeof capacity_result === 'string' && capacity_result.includes('/')) {
            // 使用正则表达式提取数字
            var match = capacity_result.match(/(\d+)\/(\d+)/);
            if (match && match.length === 3) {
                var leftNumber = parseInt(match[1], 10);
                var rightNumber = parseInt(match[2], 10);
                var difference = rightNumber - leftNumber;
                var CangkuSold_targetNum = configs.get("CangkuSold_targetNum", 25)
                log('当前容量: ' + leftNumber);
                log('仓库容量: ' + rightNumber);
                log('剩余容量: ' + difference);

            }
        }
        if (difference >= configs.get("CangkuSold_triggerNum", 10)) {
            log("不需要仓库售卖", capacity_result)
            showTip("不需要仓库售卖", capacity_result)
            return false;
        } else if (difference <= -20) {
            log("仓库容量统计出错，不进行售卖")
            showTip("仓库容量统计出错，不进行售卖")
            return false;
        }
        else {
            var sellNum = (CangkuSold_targetNum - difference) > 0 ? (CangkuSold_targetNum - difference) : 0
            log("需要售卖数量：" + sellNum)
            showTip("需要售卖数量：" + sellNum)
        }

        // 初始化检测结果
        const shopResult = {};
        let currentPage = 0;
        let allItemsDetected = false;

        // 初始化所有物品状态为未检测
        Object.keys(cangkuItemColor).forEach(itemName => {
            shopResult[itemName] = {
                counts: 0,
                position: [],
                detected: false
            };
        });

        // 开始检测
        let maxPages = 3;
        while (currentPage < maxPages && !allItemsDetected) {
            console.log(`开始第 ${currentPage + 1} 页检测`);
            showTip(`开始第 ${currentPage + 1} 页检测`);

            // 截取屏幕
            let sc = captureScreen();
            if (!sc) {
                console.error("截图失败");
                break;
            }

            let sc1 = sc

            // 检测所有物品
            Object.keys(cangkuItemColor).forEach(itemName => {
                // 如果已经检测到该物品，跳过
                if (shopResult[itemName].detected) {
                    return
                }

                let itemColor = cangkuItemColor[itemName];
                let position = findMC(itemColor, sc, [285, 123, 686 - 285, 688 - 123]);

                if (position) {
                    // 找到物品
                    let itemNum = 0;
                    let numRegion = [position.x, position.y, 130, 80];
                    itemNum = findFont(sc1, numRegion, "#FFFFFF", 8, Font.FontLibrary_ShopNum, 0.8);
                    // 如果第一次检测为空，再检测一遍
                    if (!itemNum || itemNum.trim() === "") {
                        console.log(`第一次检测${itemName}为空，重新检测`);
                        showTip(`第一次检测${itemName}为空，重新检测`);
                        sleep(100);
                        itemNum = findFont(null, numRegion, "#FFFFFF", 8, Font.FontLibrary_ShopNum, 0.8);
                    }

                    shopResult[itemName] = {
                        counts: itemNum ? itemNum : 0,
                        position: position,
                        detected: true
                    };
                    console.log(`${itemName} : ${itemNum}`);
                    showTip(`${itemName} : ${itemNum}`);

                }
            });

            // 检查是否所有物品都已找到
            allItemsDetected = Object.values(shopResult).every(item => item.detected);
            if (allItemsDetected) {
                console.log("所有物品都已检测到");
                showTip("所有物品都已检测到");
                break;
            }

            // 如果不是最后一页，则向下翻页
            if (currentPage < maxPages - 1) {
                console.log("向下翻页...");
                showTip("向下翻页...");
                swipe(480, 660, 480, 145, 1000)
                sleep(30)
                click(480, 132)
                currentPage++;
            } else {
                console.log("已达到最大翻页次数");
                showTip("已达到最大翻页次数");
                break;
            }
        }

        // 处理结果数据
        const processedResult = {};

        Object.keys(shopResult).forEach(itemName => {
            const count = shopResult[itemName].counts;

            if (!count || count.trim() === "") {
                // 如果数量为空，则设置为0
                processedResult[itemName] = 0;
            } else {
                // 如果数量是纯数字，则直接转换为整数
                processedResult[itemName] = parseInt(count);
            }
        });

    } catch (error) {
        log("仓库统计出错" + error);
    } finally {
        if (inShop_sell()) {
            close()//点击叉号
            log("商店统计(在售卖界面)：点击叉号")
        }
    }

    var sellPlan = distributeSellQuantity(processedResult, sellNum);
    return sellPlan;
}

/**
 * 根据优先级分配物品售卖数量
 * @param {Object} itemQuantities - 每个物品的当前数量，格式: {物品名称: 数量}
 * @param {number} totalSellQuantity - 要售卖的总数量
 * @returns {Array} - 返回售卖计划，格式: [{title: 物品名称, num: 售卖数量}]
 */
function distributeSellQuantity(itemQuantities, totalSellQuantity) {
    // 确保输入有效
    if (!itemQuantities || typeof totalSellQuantity !== 'number' || totalSellQuantity <= 0) {
        return [];
    }
    let CangkuSoldList = configs.get("CangkuSoldList")

    // 按优先级排序物品（priority数字越低优先级越高）
    // 创建数组副本以避免修改原数组
    var sortedItems = [];
    for (var i = 0; i < CangkuSoldList.length; i++) {
        if (CangkuSoldList[i].done === true) {
            sortedItems.push(CangkuSoldList[i]);
        }
    }

    // 按优先级排序物品（priority数字越低优先级越高）
    sortedItems.sort(function (a, b) {
        return a.priority - b.priority;
    });

    // 按优先级分组
    var priorityGroups = {};
    for (var i = 0; i < sortedItems.length; i++) {
        var item = sortedItems[i];
        var priority = item.priority;
        if (!priorityGroups[priority]) {
            priorityGroups[priority] = [];
        }
        priorityGroups[priority].push(item);
    }

    // 最终售卖计划
    var sellPlan = [];
    var remainingSellQuantity = totalSellQuantity;

    // 获取优先级键并排序
    var priorityKeys = [];
    for (var key in priorityGroups) {
        if (priorityGroups.hasOwnProperty(key)) {
            priorityKeys.push(key);
        }
    }
    priorityKeys.sort(function (a, b) {
        return parseInt(a) - parseInt(b);
    });

    // 按优先级顺序处理每个组
    for (var i = 0; i < priorityKeys.length; i++) {
        var priority = priorityKeys[i];
        var itemsInGroup = priorityGroups[priority];

        // 计算该组中所有物品的总数量
        var groupTotalQuantity = 0;
        for (var j = 0; j < itemsInGroup.length; j++) {
            var item = itemsInGroup[j];
            var quantity = itemQuantities[item.title] || 0;
            groupTotalQuantity += quantity;
        }

        // 如果该组总数量小于剩余待售数量，则全部卖出
        if (groupTotalQuantity <= remainingSellQuantity) {
            for (var j = 0; j < itemsInGroup.length; j++) {
                var item = itemsInGroup[j];
                var quantity = itemQuantities[item.title] || 0;
                if (quantity > 0) {
                    sellPlan.push({ title: item.title, num: quantity });
                    remainingSellQuantity -= quantity;
                }
            }
        } else {
            // 该组总数量大于剩余待售数量，需要按比例分配
            var tempGroupTotal = groupTotalQuantity;
            var tempRemaining = remainingSellQuantity;

            for (var j = 0; j < itemsInGroup.length; j++) {
                var item = itemsInGroup[j];
                var itemQuantity = itemQuantities[item.title] || 0;
                if (itemQuantity > 0) {
                    // 按比例分配剩余待售数量
                    var sellQuantity = Math.floor((itemQuantity / tempGroupTotal) * tempRemaining);
                    sellPlan.push({ title: item.title, num: sellQuantity });
                    tempRemaining -= sellQuantity;
                    tempGroupTotal -= itemQuantity;
                }
            }

            // 处理可能的余数（确保精确分配）
            remainingSellQuantity = tempRemaining;
            if (remainingSellQuantity > 0) {
                for (var j = 0; j < sellPlan.length && remainingSellQuantity > 0; j++) {
                    var planItem = sellPlan[j];
                    var availableQuantity = itemQuantities[planItem.title] || 0;
                    if (planItem.num < availableQuantity) {
                        planItem.num += 1;
                        remainingSellQuantity -= 1;
                    }
                }
            }
        }

        // 如果已满足总售卖数量，结束循环
        if (remainingSellQuantity <= 0) {
            break;
        }
    }

    return sellPlan;
}

/**
 * 售卖物品,函数内自带coin()
 * @param {*} sellPlan 售卖计划,格式[{title:"物品名称",num:数量}]
 * @param {*} itemColor 物品颜色,格式{物品名称:颜色}
 * @param {*} pos 物品类型，粮仓即作物售卖，默认货仓
 * @param {*} price 售卖价格,0为最低价格,2为最高价格
 * @returns 
 */
function shop_sell(sellPlan, itemColor, pos = "货仓", price = 2) {
    sleep(100);
    if (inShop_sell()) {
        close();//点击叉号
        log("商店售卖(在售卖界面)：点击叉号")
        sleep(100)
    }
    coin()
    for (let item of sellPlan) {    //遍历售卖计划中的每个物品

        while (true) {
            if (item.num <= 0) {    //如果数量为0，跳出循环，继续下一个物品
                break;
            }
            let sellNum = item.num > 10 ? 10 : item.num;

            if (configs.get("selectedFunction").text == "物品售卖" && configs.get("waitShelf" || false)) {
                find_kongxian_until()
            } else {
                if (!find_kongxian()) {    //没有空闲货架
                    console.log("未找到空闲货架,商店售卖结束");
                    showTip("未找到空闲货架,商店售卖结束");
                    return false;
                }
            }

            //判断是否在货仓/粮仓界面
            sleep(100)
            if (matchColor([{ x: 247, y: 211, color: "#ffd157" }, { x: 251, y: 340, color: "#ffb906" }])) {
                if (pos == "货仓") {
                    click(200 + ran(), 330 + ran());//点击售卖货仓按钮
                    sleep(100);
                    console.log("点击货仓按钮")
                }
            } else {
                if (pos == "粮仓") {
                    click(200 + ran(), 200 + ran());//点击售卖粮仓按钮
                    sleep(100);
                    console.log("点击粮仓按钮")
                }
            }

            //如果打开搜索按钮，关闭搜索栏
            if (matchColor([{ x: 262, y: 255, color: "#ebc784" }, { x: 284, y: 238, color: "#ffffca" },
            { x: 701, y: 238, color: "#ffffca" }, { x: 701, y: 255, color: "#eac784" },
            { x: 701, y: 280, color: "#e2d8bf" }, { x: 699, y: 292, color: "#fff9db" }])) {
                click(260 + ran(), 110 + ran())
                sleep(150);
            }

            //如果有物品颜色
            if (itemColor[item.title]) {
                let item_sell = findMC(itemColor[item.title], null, [261, 122, 707 - 261, 688 - 122], 16);

                if (!item_sell) {   //没找到售卖货架上的作物

                    clickShopSearchButton(item.title);

                    item_sell = findMC(itemColor[item.title], null, [261, 122, 707 - 261, 688 - 122], 16);
                    if (item_sell) {
                        log("找到" + item.title)
                    }

                    if (!item_sell) {
                        console.log("未找到" + item.title + "，尝试下一个");
                        showTip("未找到" + item.title + "，尝试下一个");
                        click(1150 + ran(), 50 + ran())//点击叉号
                        break;
                    }
                }

                //确定点击范围
                let range1 = [10, 10]
                click(item_sell.x + range1[0] + ran(), item_sell.y + range1[1] + ran()); //点击物品
            } else {//没有物品颜色

                clickShopSearchButton(item.title);

                click(380 + ran(), 350 + ran());
            }

            // 识别售卖数字
            sleep(100);
            let item_num

            for (let i = 0; i < 5; i++) {
                if (matchColor([{ x: 1103, y: 214, color: "#b6b6b6" }, { x: 799, y: 216, color: "#f4bd00" }])) {
                    item_num = 10
                } else if (matchColor([{ x: 799, y: 214, color: "#bababa" }, { x: 1101, y: 212, color: "#f8b900" }]) ||
                    matchColor([{ x: 801, y: 215, color: "#bababa" }, { x: 1101, y: 211, color: "#b7b7b7" }])) {
                    item_num = 1
                } else {
                    let region2 = [829, 168, 941 - 829, 250 - 168]
                    item_num = findFont(null, region2, "#FFFFFF", 8, Font.FontLibrary_ShopSoldNum, 0.9);
                    log("识别售卖个数" + item_num)
                    if (item_num == "" || item_num == 0) {
                        sleep(100);
                        continue;
                    }
                    break;
                }
            }

            if (item_num == "" || item_num == 0) {
                log("未识别到售卖数字,售卖下一个物品")
                showTip("未识别到售卖数字,售卖下一个物品")
                break;
            }

            //确定售卖个数
            let sellNum_difference = Number(sellNum) - Number(item_num);
            log("售卖:", item.title, ",售卖差值：", sellNum_difference, ",本次售卖个数：", sellNum, ",识别个数：", item_num)
            showTip("售卖:" + item.title + ",个数:" + sellNum)
            if (sellNum_difference >= 0) {
                for (let i = 0; i < sellNum_difference; i++) {
                    click(1085 + ran(), 190 + ran());
                }
            }

            if (sellNum_difference < 0) {
                for (let i = 0; i < -sellNum_difference; i++) {
                    click(800 + ran(), 190 + ran());
                }
            }

            console.log("修改售价");
            if (price == 0) {
                click(860 + ran(), 360 + ran());//修改售价(最低)
            } else if (price == 2) {
                click(1020 + ran(), 370 + ran());//修改售价(最高)
            }

            //上架
            click(940 + ran(), 660 + ran());
            console.log("上架");
            let itemIndex = sellPlan.findIndex(i => i.title === item.title);
            if (itemIndex !== -1) {
                sellPlan[itemIndex].num -= sellNum;
            }
            sleep(100);
        }
    }

}

/**
 * 验证售卖计划是否有效
 * @param {*} sellPlan_original 售卖计划,格式[{"item": "螺栓","sellNum": 10,"done": false},]
 * @returns 有效售卖计划
 */
function sellPlanValidate(sellPlan_original) {
    if (!sellPlan_original || sellPlan_original.length === 0) {
        console.log("售卖计划为空");
        showTip("售卖计划为空");
        return false;
    }
    try {
        coin();
        let kongxian = find_kongxian();
        if (!kongxian) {    //没有空闲货架
            console.log("未找到空闲货架,商店售卖结束");
            showTip("未找到空闲货架,商店售卖结束");
            return false;
        }
        //判断是否在货仓界面
        if (matchColor([{ x: 247, y: 211, color: "#ffd157" }, { x: 251, y: 340, color: "#ffb906" }])) {
            click(200 + ran(), 330 + ran());//点击售卖货仓按钮
            sleep(100);
            console.log("点击货仓按钮")
        }

        // 初始化检测结果
        const shopResult = {};
        const sellPlan = sellPlan_original.filter(itemName => itemName.sellNum !== 0 && itemName.done);


        // 初始化所有物品状态为未检测
        sellPlan.forEach(itemName => {
            shopResult[itemName.item] = {
                counts: 0,
                position: [],
                detected: false
            };
        });

        // 开始检测

        sellPlan.forEach(itemName => {

            log(itemName.item)

            clickShopSearchButton(itemName.item);

            // 搜索物品后
            let detected = true
            let itemNum = 0;
            let numRegion = [360, 330, 130, 80];

            let itemPos = null;
            //搜索后，如果颜色库有该物品
            if (allItemColor[itemName.item]) {
                //如果搜索后第二格有物品（弃）
                // !matchColor([{ x: 559, y: 318, color: "#fff9db" }, { x: 598, y: 349, color: "#fff9db" }, { x: 634, y: 320, color: "#fff9db" }, { x: 631, y: 378, color: "#fff9db" }, { x: 561, y: 383, color: "#fff9db" }])
                itemPos = findMC(allItemColor[itemName.item], null, [261, 122, 707 - 261, 688 - 122], 16)

                if (itemPos) {
                    numRegion = [itemPos.x, itemPos.y, 130, 80];
                } else {
                    log("搜索后未找到该物品" + itemName.item)
                    detected = false;
                }
            }

            if (detected) {
                itemNum = findFont(null, numRegion, "#FFFFFF", 8, Font.FontLibrary_ShopNum, 0.8);
                // 如果第一次检测为空，再检测一遍
                if (!itemNum || itemNum.trim() === "") {
                    console.log(`第一次检测${itemName.item}为空，重新检测`);
                    showTip(`第一次检测${itemName.item}为空，重新检测`);
                    sleep(100);
                    itemNum = findFont(null, numRegion, "#FFFFFF", 8, Font.FontLibrary_ShopNum, 0.8);
                }
            }


            shopResult[itemName.item] = {
                counts: itemNum ? itemNum : 0,
                detected: true
            };
            console.log(`${itemName.item} : ${itemNum}`);
            showTip(`${itemName.item} : ${itemNum}`);

        });


        // 处理结果数据
        var processedResult = {};

        Object.keys(shopResult).forEach(itemName => {
            const count = shopResult[itemName].counts || 0;

            // 如果数量是纯数字，则直接转换为整数
            // log(parseInt(count), sellPlan.find(item => item.item === itemName).sellNum)
            // log(parseInt(Math.min(parseInt(count), sellPlan.find(item => item.item === itemName).sellNum)))
            let sellPlanNum = sellPlan.find(item => item.item === itemName).sellNum
            processedResult[itemName] = sellPlanNum >= 0 ? parseInt(Math.min(parseInt(count), sellPlanNum)) : parseInt(count);
        });

    } catch (error) {
        log("仓库统计出错" + error);
    } finally {
        if (inShop_sell()) {
            close();//点击叉号
            log("商店统计(在售卖界面)：点击叉号")
        }
    }

    let result1 = Object.entries(processedResult).map(([key, value]) => {
        return { title: key, num: value };
    });
    return result1

}

function clickShopSearchButton(item) {
    for (let i = 0; i < 3; i++) {
        if (!matchColor([{ x: 262, y: 255, color: "#ebc784" }, { x: 284, y: 238, color: "#ffffca" },
        { x: 701, y: 238, color: "#ffffca" }, { x: 701, y: 255, color: "#eac784" },
        { x: 701, y: 280, color: "#e2d8bf" }, { x: 699, y: 292, color: "#fff9db" }])) {
            click_waitFor([260 + ran(), 110 + ran()],
                [{ x: 262, y: 255, color: "#ebc784" }, { x: 284, y: 238, color: "#ffffca" },
                { x: 701, y: 238, color: "#ffffca" }, { x: 701, y: 255, color: "#eac784" },
                { x: 701, y: 280, color: "#e2d8bf" }, { x: 699, y: 292, color: "#fff9db" }], null, 10)
            sleep(100);
        }
        click(500 + ran(), 200 + ran());
        sleep(100);
        setText_inGame(item);
        log("输入" + item)
        sleep(150);

        if (images.findColorInRegion(captureScreen(), "#78433a", 288, 158, 707 - 288, 238 - 158)) return true;
    }
    return false;
}

/**
 * @returns 如果找到并处理了关闭按钮或返回主界面，返回 `true`；否则返回 `false`
 * 寻找是否有关闭按钮或者在其他页面
 */
function find_close(screenshot1, action = null) {
    try {
        let sc = screenshot1 || captureScreen();

        //识别叉叉
        let close_button = findMC(["#ef444f", [-7, -1, "#ef444d"], [26, 2, "#faca3f"],
            [-24, 4, "#f9ca3f"], [-12, 13, "#e7363e"], [2, 37, "#f3c241"],
            [15, 16, "#e5373f"], [1, 16, "#9d1719"]], sc);//小×
        if (!close_button) {
            close_button = findMC(["#ed404b", [-13, -15, "#f54e5a"], [15, -14, "#ee444e"],
                [13, 11, "#e43840"], [-17, 10, "#e6363e"], [26, 0, "#f9cd42"],
                [-2, -23, "#f7df5c"], [-29, 1, "#f9cd42"], [-1, 29, "#f6cc44"]], sc);//大×
        }

        if (close_button) {
            click(close_button.x + ran(), close_button.y + ran());
            console.log("点击叉叉,find_close");
            showTip("点击叉叉");
            return true;
        }

        //进入小镇，鱼塘，其他农场
        if (!action || !action.includes("except_homeBtn")) {
            let homeBtn = findMC(["#62d365", [-5, -12, "#c787db"], [1, 11, "#55cf58"]],
                screenshot = sc, [0, 600, 240, 110]);
            if (homeBtn) {
                click(homeBtn.x - 30 + ran(), homeBtn.y + ran());
                console.log("当前在其他界面，回到主界面");
                showTip("当前在其他界面，回到主界面");
                sleep(1000);
                checkmenu();
                return true;
            }
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
            // 添加新线程实现控件点击，点击不再询问
            threads.start(function () {
                let count = 0;
                while (count < 10) {
                    click("不再询问")
                    console.log("线程执行中，第" + (count + 1) + "次尝试点击控件");
                    sleep(1000);
                    count++;
                }
                console.log("线程执行完毕，已达到最大循环次数");
            });

            find_close();
            return "levelup";
        }

        //点开好友栏
        let friendMenu = matchColor([{ x: 256, y: 542, color: "#ffcb42" },
        { x: 214, y: 591, color: "#c48f4c" }, { x: 265, y: 647, color: "#c48f4c" },
        { x: 302, y: 630, color: "#c48f4c" }, { x: 210, y: 672, color: "#ffbf1d" },
        { x: 262, y: 615, color: "#ca922b" }, { x: 430, y: 540, color: "#fff9db" }], sc)
        if (friendMenu) {
            showTip("关闭好友栏");
            log("关闭好友栏")
            let friendButton = findMC(["#f0e0d6", [-2, -28, "#fbf5f4"],
                [-20, -10, "#a24801"], [7, 30, "#f3bf41"]], sc);
            if (friendButton) {
                log("点击好友按钮")
                click(friendButton.x + ran(), friendButton.y + ran());
                sleep(200);
            }
            else {
                //老板界面
                friendButton = findMC(["#fdf8f4", [5, 32, "#f2ded3"],
                    [-17, 18, "#a44900"], [11, 54, "#f7c342"],
                    [37, 26, "#a54b00"]], sc);
                if (friendButton) {
                    log("点击好友按钮")
                    click(friendButton.x + ran(), friendButton.y + ran());
                    sleep(200);
                }
            }
            return true;
        }

        //改善游戏体验界面
        let improve = matchColor([{ x: 102, y: 194, color: "#8fda38" },
        { x: 141, y: 192, color: "#8fda38" }, { x: 162, y: 183, color: "#fae12c" },
        { x: 316, y: 200, color: "#fff9db" }, { x: 797, y: 572, color: "#f5ba38" }],
            screenshot = sc);
        if (improve) {
            log("改善游戏体验界面");
            showTip("改善游戏体验界面");
            click(930 + ran(), 570 + ran());
            return true;
        }

        //进入设计节界面
        let design_1 = matchColor([{ x: 1223, y: 548, color: "#383d40" },
        { x: 1231, y: 570, color: "#392910" }, { x: 1237, y: 586, color: "#3d2e00" },
        { x: 1229, y: 599, color: "#40403d" }, { x: 1205, y: 666, color: "#3f2e00" },
        { x: 1221, y: 685, color: "#403f3a" }],
            screenshot = sc);
        let design_2 = matchColor([{ x: 1231, y: 546, color: "#ddf3fe" },
        { x: 1223, y: 572, color: "#e8a83e" }, { x: 1228, y: 599, color: "#fffff3" },
        { x: 1207, y: 665, color: "#fabc00" }, { x: 1221, y: 681, color: "#fffbec" }],
            sccreenshot = sc);
        if (design_1 || design_2) {
            log("进入设计节界面");
            if (matchColor([{ x: 721, y: 530, color: "#f6c445" }, { x: 1028, y: 530, color: "#f6be3e" }])) {
                click(860 + ran(), 530 + ran());
                sleep(1000);
                click(860 + ran(), 530 + ran());
                sleep(1000);
                click(860 + ran(), 530 + ran());
                sleep(1000);
                click(1080 + ran(), 90 + ran());
                sleep(1000);

            }
            closeWindow();
            sleep(100);
            click(60, 490 + ran());
            sleep(100)
            createWindow(config.showText);
            sleep(100);
            showTip("进入设计节界面");
            return true;
        }

        //进入加载界面
        if (!action || !action.includes("except_jiazai")) {
            let jiazai = matchColor([{ x: 438, y: 565, color: "#fcffa2" },
            { x: 409, y: 550, color: "#85cbec" }, { x: 418, y: 585, color: "#c4e3e8" },
            { x: 867, y: 546, color: "#7ec8ed" }, { x: 861, y: 587, color: "#c7e3e8" }], sc);
            if (jiazai) {
                checkmenu();
                return true;
            }
        }

        //断开连接
        let disconnect = matchColor([{ x: 347, y: 55, color: "#deb477" }, { x: 629, y: 252, color: "#ef9b7f" },
        { x: 919, y: 234, color: "#fff9db" }, { x: 638, y: 627, color: "#fbdc7c" },
        { x: 622, y: 242, color: "#322a27" }, { x: 699, y: 157, color: "#ddf6ff" }],
            screenshot = sc);
        if (disconnect) {
            //检测是否是顶号
            if (matchColor([{ x: 526, y: 644, color: "#ffffff" }, { x: 661, y: 670, color: "#f5c746" }, { x: 645, y: 653, color: "#f5d558" }])) {
                let pauseTime = configs.get("pauseTime");
                log(`顶号,暂停${pauseTime}分钟`)
                showTip(`顶号,暂停${pauseTime}分钟`)
                timer("pauseTime", pauseTime * 60)
                while (true) {
                    // 获取计时器状态
                    let timerState = getTimerState("pauseTime");

                    if (!timerState) {
                        // 如果计时器不存在，直接跳出循环
                        break;
                    }

                    // 显示计时器的状态
                    let minutes = Math.floor(timerState / 60);
                    let seconds = timerState % 60;
                    let timeText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
                    showTip(`顶号,暂停${pauseTime}分钟,剩余${timeText}`);

                    sleep(1000);
                }
            }
            //检测是否是服务器下线
            else if (matchColor([{ x: 537, y: 670, color: "#ffffff" }, { x: 769, y: 653, color: "#ffffff" }, { x: 769, y: 644, color: "#f6d45e" }])) {
                log("服务器下线,暂停15分钟")
                showTip("服务器下线,暂停15分钟")
                timer("pauseTime", 15 * 60)
                while (true) {
                    // 获取计时器状态
                    let timerState = getTimerState("pauseTime");

                    if (!timerState) {
                        // 如果计时器不存在，直接跳出循环
                        break;
                    }

                    // 显示计时器的状态
                    let minutes = Math.floor(timerState / 60);
                    let seconds = timerState % 60;
                    let timeText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
                    showTip(`服务器下线,暂停15分钟,剩余${timeText}`);

                    sleep(1000);
                }
            }
            //掉线
            else {
                console.log("断开连接，重试");
                showTip("断开连接，重试");
            }

            click(640 + ran(), 660 + ran())
            sleep(1000);
            checkmenu();
            return true;
        }

        //切换账号页面
        if (!action || !action.includes("except_switchAccount")) {
            let switchAccount = matchColor([{ x: 100, y: 692, color: "#48a1d1" },
            { x: 100, y: 300, color: "#194a96" },
            { x: 56, y: 63, color: "#ffffff" },
            { x: 445, y: 358, color: "#ffffff" }],
                screenshot = sc);
            if (switchAccount) {
                console.log("切换账号界面，返回主菜单");
                showTip("切换账号界面，返回主菜单");
                click(56 + ran(), 63 + ran());
                sleep(800);
                click(1150 + ran(), 70 + ran());
                return true;
            }
        }

        //进入Supercell ID界面
        let supercellID = matchColor([{ x: 80, y: 63, color: "#f2f2f2" },
        { x: 327, y: 64, color: "#f2f2f2" }, { x: 345, y: 61, color: "#666666" },
        { x: 53, y: 67, color: "#666666" }]
            , sc)
        if (supercellID) {
            log("进入Supercell ID界面");
            showTip("进入Supercell ID界面");
            click(60 + ran(), 60 + ran());
            sleep(300)
            return true;
        }

        //进入购买界面
        let buy_button1 = findMC(["#78bde4", [-9, 34, "#efdb8c"],
            [-24, 58, "#3477b8"], [-25, 68, "#fffff7"],
            [-23, 86, "#f5bd3b"]],
            screenshot = sc, [580, 570, 730 - 580, 700 - 570]);
        let buy_button2 = findMC(["#3476b7", [18, -29, "#efd88a"],
            [3, 24, "#f6e8cf"], [39, 8, "#2764aa"],
            [-15, -15, "#fdc53e"]],
            screenshot = sc, [580, 570, 730 - 580, 700 - 570]);
        if (buy_button1 || buy_button2) {
            console.log("进入购买界面，返回主菜单");
            showTip("进入购买界面，返回主菜单");
            click(650 + ran(), 620 + ran());
            return true;
        }

        //识别稻草人，左边肩膀，乌鸦身子，脚
        let daocaoren = matchColor([{ x: 155, y: 358, color: "#515572" },
        { x: 187, y: 402, color: "#b2ace0" }, { x: 451, y: 450, color: "#c3bde7" },
        { x: 123, y: 384, color: "#dab400" }],
            screenshot = sc);
        if (daocaoren) {
            log("识别到稻草人");
            showTip("识别到稻草人");
            click(1055 + ran(), 550 + ran());
            jiaocheng();
            return true;
        }

        let duihua = matchColor([{ x: 536, y: 125, color: "#f4eada" },
        { x: 1151, y: 149, color: "#f4ebde" }, { x: 517, y: 506, color: "#f3e7c7" },
        { x: 1166, y: 502, color: "#f3e8c8" }], screenshot = sc);
        if (duihua) {
            log("识别到对话");
            showTip("识别到对话");
            click(850 + ran(), 400 + ran());
            return true;
        }

        let tiaoguo = matchColor([{ x: 1044, y: 624, color: "#f6cd4f" }, { x: 994, y: 608, color: "#ffffff" }, { x: 1002, y: 624, color: "#ffffff" },
        { x: 994, y: 638, color: "#ffffff" }, { x: 984, y: 626, color: "#f7b430" }, { x: 1218, y: 626, color: "#f6b22c" }],
            screenshot = sc);
        if (tiaoguo) {
            log("加载界面:跳过");
            showTip("加载界面:跳过");
            click(1100 + ran(), 630 + ran());
            return true;
        }

        return false;
    } catch (e) {
        console.error("find_close函数出错:", e);
        return false;
    }
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
    try {
        sleep(1000);
        let tryNum = 0;
        while (true) {
            for (let i = 0; i < 5; i++) {
                let sc = captureScreen();
                //识别稻草人
                let daocaoren = matchColor([{ x: 155, y: 358, color: "#515572" },
                { x: 187, y: 402, color: "#b2ace0" }, { x: 451, y: 450, color: "#c3bde7" },
                { x: 123, y: 384, color: "#dab400" }], sc);
                //识别到绿色按钮
                let greenButton = matchColor([{ x: 1075, y: 571, color: "#70bb55" },
                { x: 1096, y: 599, color: "#6ab952" }, { x: 1123, y: 559, color: "#73be52" },
                { x: 1097, y: 541, color: "#f7e160" }, { x: 1149, y: 597, color: "#f7c439" },
                { x: 1065, y: 624, color: "#f7c13c" }], sc);
                let duihua = matchColor([{ x: 530, y: 128, color: "#f4eada" },
                { x: 1154, y: 126, color: "#f4ebdf" }, { x: 521, y: 488, color: "#f2e7c8" },
                { x: 1147, y: 502, color: "#f3e7c8" }])
                if (daocaoren) {
                    log("识别到稻草人，点击");
                    showTip("识别到稻草人，点击");
                    click(1055 + ran(), 600 + ran());
                    i = 0; //重置i
                } else if (duihua) {
                    log("识别到对话，点击");
                    showTip("识别到对话，点击");
                    click(1055 + ran(), 600 + ran())
                    i = 0; //重置i
                } else if (greenButton) {
                    log("点击绿色按钮");
                    showTip("点击绿色按钮");
                    click(1100 + ran(), 600 + ran());
                    i = 0; //重置i
                } else {
                    log(`第${i}次未识别到教程界面`);
                    showTip(`第${i}次未识别到教程界面`)
                }
                find_close(sc);
                sleep(1000);

            }
            //识别主界面
            sleep(1000);
            let sc = captureScreen();
            //新版界面
            let allMatch = findMC(["#f0e0d6", [-2, -28, "#fbf5f4"],
                [-20, -10, "#a24801"], [7, 30, "#f3bf41"]], sc, [1140, 570, 120, 130]);

            //老板界面
            let allMatch2 = findMC(["#fdf8f4", [5, 32, "#f2ded3"],
                [-17, 18, "#a44900"], [11, 54, "#f7c342"],
                [37, 26, "#a54b00"]], sc, [1140, 570, 120, 130]);

            if (allMatch || allMatch2) {
                log(`教程：已进入主界面`);
                showTip(`教程：已进入主界面`);
                break;
            } else {
                log(`教程：未进入主界面`);
                showTip(`教程：未进入主界面`);
                tryNum++;
            }
            if (tryNum > 3) {
                log(`教程：超过最大尝试次数，重进游戏`);
                showTip(`教程：超过最大尝试次数，重进游戏`);
                restartgame();
                checkmenu();
            }
            sleep(1000);
        }
    } catch (e) {
        console.error("jiaocheng函数出错:", e);
        showTip("教程处理出错，已跳过");
    } finally {
        // 确保关闭所有可能的弹窗
        sleep(200);
        find_close();
    }
}

function switch_account(Account) {
    try {
        let num = 0;
        while (true) {
            console.log("切换账号" + Account);
            showTip("切换账号" + Account);
            sleep(100)

            find_close(null, "except_homeBtn");
            sleep(100);

            //点击换号1
            let huanhao1;
            let huanhao2_detection; // 用于检测换号2
            if (configs.get("switchAccountX1", 0) != 0 || configs.get("switchAccountY1", 0) != 0) {
                // 如果配置了坐标，则直接点击
                sleep(300);
                click(configs.get("switchAccountX1", 0) + ran(), configs.get("switchAccountY1", 0) + ran());
                log("点击切换账号1按钮(配置坐标)" + configs.get("switchAccountX1", 0) + "," + configs.get("switchAccountY1", 0));
            } else {
                // 如果没有配置坐标，则进行识别，最多尝试10次
                for (let i = 0; i < 10; i++) {
                    let sc = captureScreen();
                    //新版界面
                    huanhao1 = findMC(["#ffffff", [-22, 9, "#fbb700"],
                        [2, 30, "#f3bb00"], [2, -6, "#e1a282"], [-7, 20, "#e0a383"]]
                        , sc, [0, 0, 200, 250]);

                    // 同时检测换号2按钮
                    huanhao2_detection = findMC(["#fefdfc", [4, 17, "#f6bd3c"], [-11, 18, "#fffefe"],
                        [-33, 18, "#fefdfc"], [-14, -3, "#f7c247"], [-26, -1, "#f7bc3f"],
                        [-38, -15, "#fefdfc"]], sc, [0, 0, 430, 600]);

                    let shoujianxiang = findMC(["#d0ae84", [2, 6, "#edecea"],
                        [1, 14, "#cf9f73"], [3, 24, "#e5b200"], [9, 39, "#efeee5"],
                        [4, -16, "#efefef"], [-17, -3, "#d4ae86"], [-9, -2, "#d0b28b"]]
                        , sc, [0, 0, 200, 340]);

                    // 如果检测到换号2，直接点击换号2
                    if (huanhao2_detection) {
                        click(huanhao2_detection.x + ran(), huanhao2_detection.y + ran());
                        log("检测到换号2按钮,直接点击换号2按钮(识别换号按钮)" + huanhao2_detection.x + "," + huanhao2_detection.y);
                        break;
                    } else if (huanhao1) {
                        click(huanhao1.x + ran(), huanhao1.y + ran());
                        log("点击切换账号1按钮(识别换号按钮)" + huanhao1.x + "," + huanhao1.y);
                        break;
                    } else if (shoujianxiang) {
                        click(shoujianxiang.x + ran(), shoujianxiang.y - 80 + ran());
                        log("点击切换账号1按钮(识别收件箱按钮)" + shoujianxiang.x + "," + shoujianxiang.y);
                        break;
                    }

                    // 如果没找到，等待300ms后继续
                    sleep(300);
                }

                // 如果10次都没找到
                if (!huanhao1 && !huanhao2_detection) {
                    if (num < 3) {
                        num++;
                        console.log(`未识别到切换账号1按钮，重试第${num}次`);
                        find_close(null, "except_homeBtn");
                        sleep(200);
                        find_close(null, "except_homeBtn");
                        continue;
                    } else {
                        console.log("超过最大尝试次数，重进游戏");
                        restartgame();
                        checkmenu();
                        return num; // 重启游戏后返回
                    }
                }
            }
            sleep(300);

            //点击换号2
            let huanhao2;
            let huanhao2Clicked = false; // 标记是否已经点击过换号2
            // 如果已经点击过换号2（在检测换号1时），则跳过此处的检测
            if (huanhao2_detection) {
                huanhao2Clicked = true; // 标记已点击
                log("已在检测换号1时点击换号2，跳过此处检测");
            } else {
                if (configs.get("switchAccountX2", 0) != 0 || configs.get("switchAccountY2", 0) != 0) {
                    // 如果配置了坐标，则直接点击
                    sleep(300);
                    huanhao2 = { x: configs.get("switchAccountX2", 0), y: configs.get("switchAccountY2", 0) };
                    click(huanhao2.x + ran(), huanhao2.y + ran());
                    log("点击切换账号2按钮(配置坐标)" + huanhao2.x + "," + huanhao2.y);
                    huanhao2Clicked = true; // 标记已点击
                } else {
                    // 如果没有配置坐标，则进行识别，最多尝试10次
                    for (let i = 0; i < 10; i++) {
                        huanhao2 = findMC(["#fefdfc", [4, 17, "#f6bd3c"], [-11, 18, "#fffefe"],
                            [-33, 18, "#fefdfc"], [-14, -3, "#f7c247"], [-26, -1, "#f7bc3f"],
                            [-38, -15, "#fefdfc"]], null, [0, 0, 430, 600]);

                        if (huanhao2) {
                            click(huanhao2.x + ran(), huanhao2.y + ran());
                            log("点击切换账号2按钮(识别换号按钮)" + huanhao2.x + "," + huanhao2.y);
                            huanhao2Clicked = true; // 标记已点击
                            break;
                        }

                        // 如果没找到，等待300ms后继续
                        sleep(300);
                    }

                    // 如果10次都没找到
                    if (!huanhao2) {
                        if (num < 3) {
                            num++;
                            console.log(`未识别到切换账号2按钮，重试第${num}次`);
                            sleep(3000);
                            find_close(null, "except_homeBtn");
                            sleep(200);
                            find_close(null, "except_homeBtn");
                            continue;
                        } else {
                            console.log("超过最大尝试次数，重进游戏");
                            restartgame();
                            checkmenu();
                            return num; // 重启游戏后返回
                        }
                    }
                }
            }

            //点击换号3
            let huanhao3;
            if (configs.get("switchAccountX3", 0) != 0 || configs.get("switchAccountY3", 0) != 0) {
                // 如果配置了坐标，则直接点击
                sleep(300);
                huanhao3 = { x: configs.get("switchAccountX3", 0), y: configs.get("switchAccountY3", 0) };
                click(huanhao3.x + ran(), huanhao3.y + ran());
                log("点击切换账号3按钮(配置坐标)" + huanhao3.x + "," + huanhao3.y);
            } else {
                // 如果没有配置坐标，则进行识别，最多尝试10次
                for (let i = 0; i < 10; i++) {
                    huanhao3 = findMC(["#3c77da", [-18, 1, "#ffffff"],
                        [19, 4, "#ffffff"], [406, -112, "#ee434e"], [372, -109, "#f9cb40"]]);

                    if (huanhao3) {
                        click(huanhao3.x + ran(), huanhao3.y + ran());
                        log("点击切换账号3按钮(识别换号按钮)" + huanhao3.x + "," + huanhao3.y);
                        break;
                    }

                    // 如果没找到，等待300ms后继续
                    sleep(300);
                }

                // 如果10次都没找到
                if (!huanhao3) {
                    if (num < 3) {
                        num++;
                        console.log(`未识别到切换账号3按钮，重试第${num}次`);
                        sleep(3000);
                        find_close(null, "except_homeBtn");
                        sleep(200);
                        find_close(null, "except_homeBtn");
                        continue;
                    } else {
                        console.log("超过最大尝试次数，重进游戏");
                        restartgame();
                        checkmenu();
                        return num; // 重启游戏后返回
                    }
                }
            }
            let findAccountMenuNum = 0;    //寻找账号菜单次数
            // 检测supercell ID界面
            for (let i = 0; i < 20; i++) {
                findAccountMenuNum++;
                //识别supercell ID
                if (findMC(["#103a8b", [-160, 42, "#ffffff"],
                    [-120, 40, "#1c509b"], [13, 50, "#ffffff"],
                    [19, 43, "#14408f"], [13, 42, "#ffffff"],
                    [100, 46, "#ffffff"], [118, 36, "#0e3682"],
                    [149, 51, "#0e3581"], [164, 74, "#ffffff"]], null, [0, 250, 600, 250])) {
                    break;
                }
                sleep(500);
            }

            // 如果20次都没找到
            if (findAccountMenuNum >= 20) {
                if (num < 3) {
                    num++
                    console.log(`未识别到切换账号界面，重试第${num}次`)
                    showTip(`未识别到切换账号界面，重试第${num}次`)
                    sleep(3000);
                    find_close(null, ["except_switchAccount"]);
                    sleep(200);
                    find_close(null, ["except_switchAccount"]);
                    continue;
                } else if (num >= 3) {
                    console.log("重试次数过多，重进游戏");
                    showTip("重试次数过多，重进游戏");
                    restartgame();
                    checkmenu();
                    return num; // 重启游戏后返回
                }
            }
            break;
        }

        const MAX_SCROLL_DOWN = 15; // 最多下滑15次
        const Max_findAccountNum = 2; // 最多查找2次

        let found = false; // 是否找到目标
        let scrollDownCount = 0; // 当前下滑次数
        let findAccountNum = 0; // 当前上滑次数
        let isEnd = false;
        let AccountIma = null;
        let AccountText = null;
        let findAccountMethod = configs.get("findAccountMethod", "ocr")
        if (findAccountMethod == "image") {
            AccountIma = files.join(config.accountImgPath, Account + ".png");
            log("账号图片路径：" + AccountIma);
        } else if (findAccountMethod == "ocr") {
            AccountText = Account;
        }
        while (!found) {
            sleep(500);
            let is_find_Account = null;
            if (findAccountMethod == "image") {
                is_find_Account = findimage(AccountIma, 0.9);
            };
            if (findAccountMethod == "ocr") {
                is_find_Account = findText(AccountText, null, [640, 0, 1100 - 640, 720]);
            }

            if (is_find_Account) { //如果找到账号名称，则点击
                log(`找到账号${Account}`);
                showTip(`找到账号${Account}`);
                click(is_find_Account.x + ran(), is_find_Account.y + ran());
                sleep(500);
                found = true;
                break;
            }
            if (scrollDownCount < MAX_SCROLL_DOWN && !isEnd) {
                const [x1, y1] = [960, 600];
                const [x2, y2] = [960, 150];//原960,60
                swipe(x1 + ran(), y1 + ran(), x2 + ran(), y2 + ran(), [500]); // 下滑
                scrollDownCount++;
                log(`未找到账号，第 ${scrollDownCount} 次下滑...`);
                showTip(`未找到账号，第 ${scrollDownCount} 次下滑...`);
                sleep(1500);
                if (findMC(["#000000", [-16, -8, "#ffffff"], [1, -40, "#2d85f3"], [-55, -6, "#ffffff"]])) {
                    log("滑到底了");
                    showTip("滑到底了");
                    isEnd = true;
                }
                continue;
            }
            else if (findAccountNum > (Max_findAccountNum - 1)) {
                log("未找到目标账号，重启游戏");
                showTip("未找到目标账号，重启游戏");
                restartgame();
                checkmenu();
                return num; // 重启游戏后返回
            }
            // 1270,0
            else if (scrollDownCount >= MAX_SCROLL_DOWN || isEnd) {
                log(`未找到账号，上滑回顶部...`);
                showTip("未找到账号，上滑回顶部");
                const [x3, y3] = [960, 60];
                const [x4, y4] = [960, 600];
                let scrollup = 0; //上滑次数
                while (!findMC(["#000000", [-221, -1, "#f2f2f2"], [-384, -1, "#041e54"], [315, 5, "#2d85f3"]], null, [0, 0, 1270, 150]) && scrollup < 10) {
                    swipe(x3 + ran(), y3 + ran(), x4 + ran(), y4 + ran(), [500]); // 上划
                    sleep(200);
                    scrollup++;
                }
                scrollDownCount = 0;
                findAccountNum++;
                isEnd = false;
            } else {

            }

        }

        sleep(2000);
        checkmenu();
        return num;
    } catch (e) {
        console.error("switch_account函数出错:", e);
        showTip("切换账号出错，已跳过");
        return 0;
    } finally {
        // 确保关闭所有可能的弹窗
        sleep(200);
        find_close(null, "except_homeBtn");
    }
}

/**
 * 
 */
function shengcang() {
    console.log("当前操作:升仓");
    showTip("当前操作:升仓");

    try {
        //升粮仓
        if (config.shengcang_l) {
            sleep(100);
            let isFindShop = findshop(true);
            if (isFindShop) {  //判断是否找到商店
                huadong_adjust([60, 50], [330, 310]);
                sleep(100);
                isFindShop = findshop(true);
                console.log("点击粮仓");
                showTip("点击粮仓");
                click(isFindShop.x + config.liangcangOffset.x + ran(), isFindShop.y + config.liangcangOffset.y + ran()); //点击粮仓
                sleep(500);
                if (click_waitFor(null, null, ["#ffffff", [156, -24, "#dfb57a"], [910, -20, "#ec404b"]], null, 0.8, 200)) {  //判断是否进入粮仓 左侧搜索按钮,棕色边框,右上叉号
                    click(700 + ran(), 610 + ran());
                    sleep(500);
                    if (matchColor([{ x: 904, y: 407, color: "#69b750" }])) {  //判断是否可以升级
                        click(910 + ran(), 404 + ran());//点击升级
                        sleep(500);
                        find_close();
                        sleep(500);
                        find_close();
                    } else {    //建材不够升级
                        console.log("建材不够升级");
                        showTip("建材不够升级");
                        sleep(500);
                        find_close();
                        sleep(500);
                        find_close();
                    }
                } else {  //未进入粮仓
                    console.log("未进入粮仓");
                    showTip("未进入粮仓");
                    find_close()
                }
            } else {  //未找到商店
                console.log("未找到商店");
                showTip("未找到商店");
                find_close();
            }
        }

        //升货仓
        if (config.shengcang_h) {
            sleep(100);
            let isFindShop = findshop(true);
            if (isFindShop) {  //判断是否找到商店
                console.log("点击货仓");
                showTip("点击货仓");
                click(isFindShop.x + config.huocangOffset.x + ran(), isFindShop.y + config.huocangOffset.y + ran()); //点击货仓
                sleep(500);
                if (click_waitFor(null, null, ["#ffffff", [156, -24, "#dfb57a"], [910, -20, "#ec404b"]], null, 0.8, 200)) {  //判断是否进入货仓 左侧搜索按钮,棕色边框,右上叉号
                    click(700 + ran(), 625 + ran());
                    sleep(500);
                    if (matchColor([{ x: 904, y: 407, color: "#69b850" }])) {  //判断是否可以升级
                        click(910 + ran(), 404 + ran());//点击升级
                        sleep(500);
                        find_close();
                        sleep(500);
                        find_close();
                    } else {    //建材不够升级
                        console.log("建材不够升级");
                        showTip("建材不够升级");
                        sleep(500);
                        find_close();
                        sleep(500);
                        find_close();
                    }
                } else {  //未进入粮仓
                    console.log("未进入货仓");
                    showTip("未进入货仓");
                    find_close()
                }
            } else {  //未找到商店
                console.log("未找到商店");
                showTip("未找到商店");
                find_close();
            }
        }

    } catch (e) {
        console.error("shengcang函数出错:", e);
        showTip("升仓操作出错，已跳过");
    } finally {
        // 确保关闭所有可能的弹窗
        sleep(200);
        find_close();
    }
}

/**
 * 启动一个新的计时器
 * @param {string} timer_Name - 计时器的唯一标识名称（用于区分不同计时器）
 * @param {number} [seconds=120] - 计时时长（单位：秒，默认120秒）
 */
function timer(timer_Name, seconds = 120) {
    try {

        // 计算结束时间（当前时间 + 需要计时的时间）
        let currentTime = new Date().getTime();
        let startTime = currentTime;
        let duration = seconds;
        let endTime = currentTime + seconds * 1000;

        // 保存计时器信息到存储中
        timeStorage.put(timer_Name, {
            startTime: startTime,
            duration: duration,
            endTime: endTime
        });
        log(`已启动计时器: ${timer_Name}，倒计时 ${seconds} 秒`);

    } catch (e) {
        console.error("timer函数出错:", e);
        showTip("计时器操作出错，已跳过");
    }
}

// 获取特定计时器的状态
/**
 * 获取特定计时器的状态
 * @param {string} timer_Name - 计时器的唯一标识名称（用于区分不同计时器）
 * @returns {number|null} - 剩余时间（单位：秒）,计时结束返回0，如果计时器不存在则返回null
 */
function getTimerState(timer_Name) {
    try {

        // 从存储中获取计时器信息
        const timerInfo = timeStorage.get(timer_Name);
        if (!timerInfo) {
            return null;
        }

        // 获取当前时间
        const currentTime = new Date().getTime();

        // 计算剩余时间
        const remainingTime = Math.max(0, Math.ceil((timerInfo.endTime - currentTime) / 1000));

        return remainingTime;
    } catch (e) {
        console.error("getTimerState函数出错:", e);
        showTip("获取计时器状态出错，已跳过");
        return null;
    }
}

// 停止计时器
function stopTimer(timer_Name) {
    try {

        // 从存储中删除计时器信息
        if (timeStorage.contains(timer_Name)) {
            timeStorage.remove(timer_Name);
            log(`已停止计时器: ${timer_Name}`);
        } else {
            log(`未找到计时器: ${timer_Name}`);
        }
    } catch (e) {
        console.error("stopTimer函数出错:", e);
        showTip("停止计时器出错，已跳过");
    }
}

/**
 * 从字符串中提取时间信息
 * @param {string} timeStr - 包含时间信息的字符串（例如："2小时30分15秒"）
 * @returns {object} - 包含小时、分钟、秒的对象（例如：{ hours: 2, minutes: 30, seconds: 15 }）
 */
function extractTime(timeStr) {
    let matches = timeStr.match(/(?:(\d+)小时)?(?:(\d+)分)?(?:(\d+)秒)?/);
    return {
        hours: matches[1] ? parseInt(matches[1]) : 0,
        minutes: matches[2] ? parseInt(matches[2]) : 0,
        seconds: matches[3] ? parseInt(matches[3]) : 0
    };
}


/**
 * 种植作物,不带手势
 */
function plantCrop() {
    try {
        //种植
        console.log("准备种" + config.selectedCrop.text);
        showTip(`准备种${config.selectedCrop.text}`);
        sleep(500)
        let center_wheat = findMC(crop_plant);
        if (center_wheat) {
            console.log("找到" + config.selectedCrop.text + "，坐标: " +
                center_wheat.x + "," + center_wheat.y);
        } else {
            console.log("未找到" + config.selectedCrop.text);
            showTip("未找到" + config.selectedCrop.text);
            let next_button = findMC(allItemColor["nextButton"]);

            if (next_button) {
                let maxTries = 10;
                let tries = 0;
                while (tries < maxTries && next_button) {
                    next_button = findMC(allItemColor["nextButton"]);
                    click(next_button.x + ran(), next_button.y + ran());
                    sleep(1000);
                    center_wheat = findMC(crop_plant);
                    if (center_wheat) {
                        break;
                    }
                }
                if (tries >= maxTries) {
                    log("种植时未能找到作物，退出操作");
                    return false;
                }
                if (!next_button) {
                    log("未找到下一个按钮，检查界面");
                    let close = find_close();
                    if (close == "levelup") {
                        sleep(500);
                        plantCrop();
                    }
                } else {
                    let close = find_close();
                    if (close == "levelup") {
                        log("因为升级，重新种植");
                        plantCrop();
                    }
                }
            }
        }
    } catch (e) {
        console.error("plantCrop函数出错:", e);
        showTip("种植作物出错，已跳过");
    } finally {
        // 确保关闭所有可能的弹窗
        sleep(200);
        find_close();
    }
}


/**
 * 种植作物,带手势
 */
function plant_crop() {
    //种植
    console.log("准备种" + config.selectedCrop.text);
    showTip(`准备种${config.selectedCrop.text}`);
    sleep(100)
    let center_wheat = click_waitFor(null, null, crop_plant, 10, 12);
    if (center_wheat) {
        console.log("找到" + config.selectedCrop.text + "，坐标: " +
            center_wheat.x + "," + center_wheat.y);
    } else {
        console.log("未找到" + config.selectedCrop.text);
        showTip("未找到" + config.selectedCrop.text);
        let next_button = findMC(allItemColor["nextButton"]);

        if (next_button) {
            let maxTries = 10;
            let tries = 0;
            while (tries < maxTries && next_button) {
                next_button = findMC(allItemColor["nextButton"]);
                if (next_button) {
                    click(next_button.x + ran(), next_button.y + ran());
                    log("点击下一页按钮");
                    showTip("点击下一页按钮");
                    sleep(200);
                    tries++;
                } else {
                    log("未找到下一个按钮，检查界面");
                    let close = find_close();
                    if (close == "levelup") {
                        log("因为升级，重新种植");
                        plantCrop();
                    }
                }

                center_wheat = click_waitFor(null, null, crop_plant, 5);
                if (center_wheat) {
                    break;
                }

                if (tries >= maxTries) {
                    log("种植时未能找到作物，退出操作");
                    return false;
                }
            }

        } else {
            let close = find_close();
            if (close == "levelup") {
                log("因为升级，重新种植");
                plantCrop();
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
}

/**
 * 收割作物
 * @param {*} center_sickle 镰刀坐标
 * @returns 如果成功收割返回true，第一块耕地已种植返回剩余时间（秒）
 */
function harvest_crop(center_sickle) {
    //收作物
    find_close();
    sleep(200);
    let is_findland = findland();
    if (!is_findland) {
        findland_click();
    }
    sleep(200);
    if (findMC(["#fefdfc", [19, -4, "#fefdfb"], [30, 10, "#dab790"],
        [44, 20, "#fac300"], [18, 57, "#f4be00"], [-12, 43, "#f7bd00"],
        [4, 40, "#f9f6f3"], [9, 16, "#fcfbf9"], [-21, 33, "#faba00"]])) {//加速按钮
        log("第一块耕地已种植");
        showTip("第一块耕地已种植");
        //识别剩余时间
        let remainingTime = findFont_remainingTime()
        let remainingTimeSecond = null;

        if (remainingTime) {
            log(remainingTime)
            showTip(remainingTime)
            let time = extractTime(remainingTime);
            remainingTimeSecond = time.hours * 60 * 60 + time.minutes * 60 + time.seconds
        }
        return remainingTimeSecond;
    }
    console.log("收割" + config.selectedCrop.text);
    showTip(`收割${config.selectedCrop.text}`);
    harvest_wheat(center_sickle);
    return true;
}

//循环操作
function operation(Account) {
    let accountName = Account ? Account.title : "账号";
    sleep(200);

    //收作物
    let is_harvest = harvest_crop();

    if (is_harvest === true) {//找耕地
        sleep(1500);
        if (find_close()) {
            sleep(200);
            find_close();
            sleep(200);
        }

        let center_land = findland();
        console.log("寻找耕地");
        //找不到重新找耕地
        if (!center_land) {
            console.log("未找到，重新寻找耕地");
            if (find_close()) {
                sleep(200);
                find_close();
                sleep(200);
            }
            findland_click();
        }

        //种植作物
        plant_crop();

        sleep(500);
        //缩放
        gestures([0, 200, [420 + ran(), 133 + ran()], [860 + ran(), 133 + ran()]],
            [0, 200, [1000 + ran(), 133 + ran()], [860 + ran(), 133 + ran()]
            ]);
        sleep(500);

        //检测土地是否种植上
        log("检测种植情况")
        if (findland()) {
            sleep(500);
            let center_sickle = findMC(sicklePoints, null, null, 16);
            let center_wheat = findMC(crop_plant);
            if (center_sickle) {
                console.log("找到镰刀，重新收割,坐标: " +
                    center_sickle.x + "," + center_sickle.y);
                //收作物
                harvest_crop(center_sickle);
                //找耕地
                sleep(1500);
                if (find_close()) {
                    sleep(200);
                    find_close();
                    sleep(200);
                }
                let center_land = findland();
                console.log("寻找耕地");
                //找不到重新找耕地
                if (!center_land) {
                    console.log("未找到，重新寻找耕地");
                    if (find_close()) {
                        sleep(200);
                        find_close();
                        sleep(200);
                    }
                    findland_click();
                }

                //种植作物
                plant_crop();
            };
            if (center_wheat) {
                log("找到" + config.selectedCrop.text + "重新种植");
                //种植作物
                plant_crop();
            }
        } else {
            log("重新检测时，未找到耕地");
        }
    }


    //设定计时器
    let fixed_time = config.matureTime * 60 - config.harvestTime      //成熟时间-收割时间
    let cropTime = typeof is_harvest === "number" && (is_harvest < fixed_time) ? is_harvest : fixed_time;
    let timerName = accountName ? accountName + "计时器" : config.selectedCrop.text;
    timer(timerName, cropTime);

    //打开路边小店
    sleep(500);
    //缩放
    gestures([0, 200, [420 + ran(), 133 + ran()], [860 + ran(), 133 + ran()]],
        [0, 200, [1000 + ran(), 133 + ran()], [860 + ran(), 133 + ran()]
        ]);

    sleep(500);
    openshop();

    //开始售卖
    console.log("============开始售卖系列操作===============")
    shop();
    // log(Account,config.tomFind,config.pond)

    let accountList_config
    let account_config

    if (config.switchAccount) {
        accountList_config = configs.get("account_config", null);
        account_config = accountList_config.find(item => item.title === accountName)
    } else {
        account_config = Account
    }

    try {
        if (config.tomFind.enabled && account_config.tomFind.enabled) {
            tomOperation(account_config);
        }
    } catch (error) {
        toastLog(error)
    }

    try {
        if (config.honeycomb.enabled && account_config.honeycomb.enabled) {
            honeycomb_operation(account_config);
        }
    } catch (error) {
        toastLog(error)
    }

    try {
        if (config.pond.enabled && account_config.pond.enabled) {
            pond_operation(account_config);
        }
    } catch (error) {
        toastLog(error)
    }

}



/**
 * 仓库统计
 * 偏移
 * @param {number} maxPages 最大翻页次数
 * @returns {Object} 统计结果，包含每种物品的数量和检测到的位置
 */
function cangkuStatistics(maxPages = 2) {
    try {
        log("===============仓库统计===================");
        showTip("仓库统计");
        // 初始化检测结果
        const result = {};
        let currentPage = 0;
        let allItemsDetected = false;
        let lcCapacity = "0/0";
        let hcCapacity = "0/0";
        sleep(500);
        find_close();
        let isFindShop = findshop(true);
        if (isFindShop) {  //判断是否找到商店
            huadong_adjust([60, 50], [330, 310]);
            sleep(100);
            isFindShop = findshop(true);
            console.log("点击粮仓");
            showTip("点击粮仓");
            click(isFindShop.x + config.liangcangOffset.x + ran(), isFindShop.y + config.liangcangOffset.y + ran()); //点击粮仓
            sleep(500);

            if (click_waitFor(null, null, ["#ffffff", [156, -24, "#dfb57a"], [910, -20, "#ec404b"]], null, 0.8, 200)) {  //判断是否进入粮仓  左侧搜索按钮,棕色边框,右上叉号
                lcCapacity = findFont(captureScreen(), [643, 86, 883 - 643, 148 - 86], "#FFFFFF", 8, Font.FontLibrary_CKCapacityNum, 0.8).toString();
                if (!lcCapacity) {
                    sleep(500);
                    lcCapacity = findFont(captureScreen(), [643, 86, 883 - 643, 148 - 86], "#FFFFFF", 8, Font.FontLibrary_CKCapacityNum, 0.8).toString();
                }
                log("粮仓容量：" + lcCapacity);
                showTip("粮仓容量：" + lcCapacity);
                find_close()
            } else {  //未进入粮仓
                console.log("未进入粮仓");
                showTip("未进入粮仓");
                find_close()
            }
        } else {  //未找到商店
            console.log("未找到商店");
            showTip("未找到商店");
            find_close();
        }

        sleep(500);
        isFindShop = findshop(true);
        //判断是否找到商店
        if (!isFindShop) {  //未找到商店
            console.log("未找到商店");
            showTip("未找到商店");
            find_close();
            return null
        }

        console.log("点击货仓");
        showTip("点击货仓");
        click(isFindShop.x + config.huocangOffset.x + ran(), isFindShop.y + config.huocangOffset.y + ran()); //点击货仓
        sleep(500);

        //判断是否进入货仓
        if (!click_waitFor(null, null, ["#ffffff", [156, -24, "#dfb57a"], [910, -20, "#ec404b"]], null, 0.8, 200)) {  //未进入货仓
            console.log("未进入货仓");
            showTip("未进入货仓");
            find_close();
            return null
        }

        hcCapacity = findFont(captureScreen(), [643, 86, 883 - 643, 148 - 86], "#FFFFFF", 8, Font.FontLibrary_CKCapacityNum, 0.8).toString();
        if (!hcCapacity) {
            sleep(500);
            hcCapacity = findFont(captureScreen(), [643, 86, 883 - 643, 148 - 86], "#FFFFFF", 8, Font.FontLibrary_CKCapacityNum, 0.8).toString();
        }
        log("货仓容量：" + hcCapacity);
        showTip("货仓容量：" + hcCapacity);
        // 获取配置文件中的统计设置
        let configItems = configs.get("cangkuStatistics_settings");

        // 创建只包含配置中指定物品的新数组
        let targetItems = {};
        if (Array.isArray(configItems)) {
            configItems.forEach(itemName => {
                if (cangkuStatisticsItemColor[itemName]) {
                    targetItems[itemName] = cangkuStatisticsItemColor[itemName];
                }
            });
        } else {
            // 如果配置无效，则使用默认的cangkuStatisticsItemColor
            targetItems = cangkuStatisticsItemColor;
        }

        // 初始化所有配置物品状态为未检测
        Object.keys(targetItems).forEach(itemName => {
            result[itemName] = {
                counts: 0,
                position: [],
                detected: false
            };
        });

        // 开始检测
        while (currentPage < maxPages && !allItemsDetected) {
            console.log(`开始第 ${currentPage + 1} 页检测`);
            showTip(`开始第 ${currentPage + 1} 页检测`);

            // 截取屏幕
            let sc = captureScreen();
            if (!sc) {
                console.error("截图失败");
                break;
            }

            let sc1 = sc

            // 检测所有物品
            Object.keys(targetItems).forEach(itemName => {
                // 如果已经检测到该物品，跳过
                if (result[itemName].detected) {
                    return
                }

                let itemColor = targetItems[itemName];
                let position = findMC(itemColor, sc, [201, 124, 1093 - 201, 563 - 124]);

                if (position) {
                    // 找到物品
                    let itemNum = 0;
                    let numRegion = [position.x, position.y, 130, 80];
                    itemNum = findFont(sc1, numRegion, "#FFFFFF", 8, Font.FontLibrary_CKNum, 0.8);
                    // 如果第一次检测为空，再检测一遍
                    if (!itemNum || itemNum.trim() === "") {
                        console.log(`第一次检测${itemName}为空，重新检测`);
                        showTip(`第一次检测${itemName}为空，重新检测`);
                        sleep(100);
                        itemNum = findFont(null, numRegion, "#FFFFFF", 8, Font.FontLibrary_CKNum, 0.8);
                    }

                    result[itemName] = {
                        counts: itemNum ? itemNum : 0,
                        position: position,
                        detected: true
                    };
                    console.log(`${itemName} : ${itemNum}`);
                    showTip(`${itemName} : ${itemNum}`);
                    // sleep(100);
                }
            });

            // 检查是否所有物品都已找到
            allItemsDetected = Object.values(result).every(item => item.detected);
            if (allItemsDetected) {
                console.log("所有物品都已检测到");
                showTip("所有物品都已检测到");
                break;
            }

            // 如果不是最后一页，则向下翻页
            if (currentPage < maxPages - 1) {
                console.log("向下翻页...");
                showTip("向下翻页...");
                swipe(640, 540, 640, 150, 1000)
                sleep(30)
                click(640, 400)
                // sleep(1000);
                currentPage++;
            } else {
                console.log("已达到最大翻页次数");
                showTip("已达到最大翻页次数");
                break;
            }

            // 回收截图
            sc1.recycle();
        }

        // 处理结果数据
        const processedResult = {};

        // 处理数量值
        if (lcCapacity) processedResult["粮仓容量"] = lcCapacity ? lcCapacity : "0/0";
        if (hcCapacity) processedResult["货仓容量"] = hcCapacity ? hcCapacity : "0/0";

        Object.keys(result).forEach(itemName => {
            const count = result[itemName].counts;

            if (!count || count.trim() === "") {
                // 如果数量为空，则设置为0
                processedResult[itemName] = 0;
            } else {
                // 如果数量是纯数字，则直接转换为整数
                processedResult[itemName] = parseInt(count);
            }
        });
        find_close();

    } catch (error) {
        log("仓库统计出错" + error);
    } finally {
        sleep(100);
        find_close();
    }

    // 返回处理后的结果
    return processedResult;
};

/**
 * 
 * @param {*} accountName 账号名称
 * @param {*} data 统计数据
 * @param {*} rawTable 表头
 * @returns 加上添加的这一列的表格
 */
function creatContentData(accountName, data, rawTable) {
    try {

        // 初始化表格（只有表头和分隔线）
        let rawContentData = null;
        if (!rawTable) {
            rawContentData = "|         |\n|:--------:|\n";

            // 物品列表（确保顺序一致）
            const itemNames = ["粮仓容量", "货仓容量", "盒钉", "螺钉", "镶板", "螺栓", "木板", "胶带", "土地契约", "木槌", "标桩", "斧头", "木锯", "炸药", "炸药桶", "铁铲", "十字镐"];

            // 初始化所有物品行
            for (let item of itemNames) {
                rawContentData += `| ${item}      |\n`;
            }
        } else rawContentData = rawTable;

        if (!data) return rawContentData;

        // 分割现有表格的每一行
        let lines = rawContentData.split("\n");

        // 更新表头行（添加新账号列）
        lines[0] += `   ${accountName}   |`;

        // 更新分隔线行（添加对齐标记）
        lines[1] += ":----:|";

        try {
            // 更新数据行（添加物品数量）
            for (let i = 2; i < lines.length; i++) {
                if (lines[i].trim() === "") continue; // 跳过空行
                let itemName = lines[i].match(/\| (.+?)\s+\|/)[1].trim();
                let itemCount = data[itemName] || 0;
                lines[i] += `   ${itemCount}   |`;
            }
            // 重新组合表格
            rawContentData = lines.join("\n");
        } catch (error) {
            log(error);
        }
        return rawContentData;
    } catch (error) {
        log(error);
    }
};


/**
 * 为表格的每一行计算并添加行总计列
 * @param {string} rawContentData 表格数据，以换行符分隔行，以|分隔列
 * @returns {string} 添加了总计列的表格数据
 */
function rawContentData2(rawContentData) {
    try {
        // 按行分割数据
        let lines = rawContentData.split("\n");

        // 更新表头，添加"总计"列
        lines[0] += ` 总计 |`;

        // 更新分隔线行，添加对齐标记
        lines[1] += `:---:|`;

        // 从第三行开始处理数据行（跳过表头和分隔线）
        for (let i = 2; i < lines.length; i++) {
            // 跳过空行
            if (!lines[i].trim()) continue;

            // 以|分隔每列
            let columns = lines[i].split("|");

            // 初始化行总计
            let rowTotal = 0;

            // 遍历每一列（除了最后一列可能是空字符串）
            for (let j = 0; j < columns.length - 1; j++) {
                // 去除空格
                let value = columns[j].trim();

                // 尝试将值转换为整数
                let numValue = parseInt(value);

                // 如果是有效整数，则累加到行总计
                if (!isNaN(numValue)) {
                    rowTotal += numValue;
                }
                // 如果不是数字，跳过
            }

            // 在行末添加总计
            lines[i] += ` ${rowTotal} |`;
        }
        // 重新组合表格
        lines = "### 卡通农场小助手仓库统计\n*数据仅供参考*\n\n" + lines.join("\n");
        return lines
    } catch (error) {
        log(error);
    }
}

function convertToTable(data) {
    // 获取所有的项目名称（除了"账号"字段）
    const allKeys = new Set();
    data.forEach(item => {
        Object.keys(item).forEach(key => {
            if (key !== "账号") {
                allKeys.add(key);
            }
        });
    });
    const keysArray = Array.from(allKeys);

    // 构建表头
    let table = "|         |";
    data.forEach(item => {
        table += `   ${item["账号"]}   |`;
    });
    table += " 总计 |\n";

    // 添加分隔行
    table += "|:--------:|";
    data.forEach(() => {
        table += ":----:|";
    });
    table += ":---:|\n";

    // 为每个项目生成一行数据
    keysArray.forEach(key => {
        table += `| ${key}      |`;

        let total = 0;
        let hasNonNumeric = false;

        data.forEach(item => {
            const value = item[key];

            // 检查是否是容量格式（如 "1200/1500"）
            if (typeof value === 'string' && value.includes('/')) {
                table += `   ${value}   |`;
                hasNonNumeric = true;
            } else {
                // 对于数字，添加到总计中
                const numValue = parseInt(value) || 0;
                total += numValue;
                table += `   ${value}   |`;
            }
        });

        // 如果是数字类型的项目，显示总计；如果是容量格式，则计算前后数字的总和
        if (hasNonNumeric) {
            // 处理容量格式，如 "1200/1500"，计算为 "总当前/总最大"
            let totalCurrent = 0;
            let totalMax = 0;

            data.forEach(item => {
                const value = item[key];
                if (typeof value === 'string' && value.includes('/')) {
                    const parts = value.split('/');
                    const current = parseInt(parts[0]) || 0;
                    const max = parseInt(parts[1]) || 0;
                    totalCurrent += current;
                    totalMax += max;
                }
            });

            table += ` ${totalCurrent}/${totalMax} |\n`;
        } else {
            table += ` ${total} |\n`;
        }
    });

    // 在表格前面添加标题和说明
    return "### 卡通农场小助手仓库统计\n*数据仅供参考*\n\n" + table;
}

function setText_inGame(text) {
    if (currentPackage() == "org.autojs.autoxjs.v7") {
        log("当前在autoxjs,禁用setText")
        return false;
    }
    setText(text);
    return true;
}

function pushTo(contentData) {
    let title = "卡通农场小助手仓库统计"; //推送标题
    let response = null;
    log(configs.get("serverPlatform").text, title, contentData)
    try {
        //pushplus推送加
        if (configs.get("serverPlatform").code == 0) {
            let url = "http://www.pushplus.plus/send"
            response = http.post(url, {
                token: configs.get("token", ""),
                title: title,
                content: contentData,
                template: "markdown"
            });
        }
        // server酱推送
        else if (configs.get("serverPlatform").code == 1) {
            let url = "https://sctapi.ftqq.com/" + configs.get("token", "") + ".send"
            response = http.post(url, {
                title: title,
                desp: contentData,
            });
        }
        // wxpusher推送
        else if (configs.get("serverPlatform").code == 2) {
            let url = "https://wxpusher.zjiecode.com/api/send/message/simple-push"
            response = http.postJson(url, {
                "content": contentData,
                "summary": title,
                "contentType": 3,
                "spt": configs.get("token", ""),
            });
        }
        else if (configs.get("serverPlatform").code == 3) {

        }
    } catch (error) {
        log(error);
    }
}

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
 * 点击指定点,等待匹配的颜色，最多重试max次
 * @param {Array} point 点击的点坐标，[x, y]
 * @param {Array} matchColorPoints matchColor数组
 * @param {Array} MCPoints findMC数组
 * @param {number} max 最大重试次数，默认10次
 * @returns {boolean} 未识别到：返回false。识别到：传入MC返回坐标，传入matchColor返回true
 */
function click_waitFor(point, matchColorPoints, MCPoints, max = 10, xiangsidu, sleepTime = 200) {
    max = max || 10;
    xiangsidu = xiangsidu || null
    if (point) click(point[0], point[1])
    if (matchColorPoints) {
        for (let i = 0; i < max; i++) {
            if (matchColor(matchColorPoints, null, xiangsidu)) return true
            sleep(sleepTime);
        }
    } else if (MCPoints) {
        for (let i = 0; i < max; i++) {
            let pos = findMC(MCPoints, null, null, xiangsidu)
            if (pos) return pos
            sleep(sleepTime);
        }
    }
    return false;
}

/**
 * 等待匹配的颜色或MC，最多重试max次,匹配到后点击
 * @param {Array} point 点击的点坐标，[x, y]
 * @param {Array} matchColorPoints matchColor数组
 * @param {Array} MCPoints findMC数组
 * @param {number} max 最大重试次数，默认10次
 * @param {number} xiangsidu 匹配相似度，默认null
 * @param {number} sleepTime 每次重试间隔时间，默认200毫秒
 * @returns {boolean} 未识别到：返回false。识别到：传入MC返回坐标，传入matchColor返回true
 */
function waitFor_click(point, matchColorPoints, MCPoints, max = 10, xiangsidu, sleepTime = 200) {
    max = max || 10;
    xiangsidu = xiangsidu || null
    let find = false;
    if (matchColorPoints) {
        for (let i = 0; i < max; i++) {
            if (matchColor(matchColorPoints, null, xiangsidu)) {
                find = true;
                break;
            }
            sleep(sleepTime);
        }
    } else if (MCPoints) {
        for (let i = 0; i < max; i++) {
            let pos = findMC(MCPoints, null, null, xiangsidu)
            if (pos) {
                if (!point) click(pos.x, pos.y)
                find = true;
                break;
            }
            sleep(sleepTime);
        }
    }
    if (find && point) {
        click(point[0], point[1])
        return true;
    };
    return false;
}

// 模块导出
module.exports = {
    // 工具函数
    ran: ran,
    autoSc: autoSc,
    findimage: findimage,
    findimages: findimages,
    restartgame: restartgame,
    findText: findText,
    matchColor: matchColor,
    findMC: findMC,
    findNum_findMC: findNum_findMC,
    huadong: huadong,
    huadong_zuoshang: huadong_zuoshang,
    huadong_adjust: huadong_adjust,
    createWindow: createWindow,
    closeWindow: closeWindow,
    showTip: showTip,
    showDetails: showDetails,
    getDetails: getDetails,
    copy_shell: copy_shell,
    click_waitFor: click_waitFor,
    waitFor_click: waitFor_click,
    findFont: findFont,
    openFriendMenu: openFriendMenu,
    openFriend: openFriend,
    setText_inGame: setText_inGame,
    find_baozhi: find_baozhi,
    find_youxiang: find_youxiang,
    find_honeyTree: find_honeyTree,
    machine_produce: machine_produce,

    //鱼塘相关
    pond_operation: pond_operation,
    find_yuchuan: find_yuchuan,
    huadong_pond: huadong_pond,
    find_fishPond: find_fishPond,
    click_netMaker: click_netMaker,
    netMaker_produce: netMaker_produce,
    collect_lobster: collect_lobster,
    collect_duckSalon: collect_duckSalon,
    put_net: put_net,

    //蜂蜜相关
    honeycomb_operation: honeycomb_operation,
    find_honeyTree: find_honeyTree,

    // 游戏界面检查
    checkmenu: checkmenu,
    close: close,

    // 耕地相关
    findland: findland,
    findshop: findshop,
    openshop: openshop,
    findland_click: findland_click,
    harvest: harvest,
    harvest_wheat: harvest_wheat,
    getHarvestGroup: getHarvestGroup,

    // 商店相关
    coin: coin,
    find_kongxian: find_kongxian,
    find_kongxian_until: find_kongxian_until,
    find_ad: find_ad,
    shop: shop,
    shopStatistic: shopStatistic,
    distributeSellQuantity: distributeSellQuantity,
    shop_sell: shop_sell,
    sellPlanValidate: sellPlanValidate,
    clickShopSearchButton: clickShopSearchButton,
    inShop: inShop,
    inShop_sell: inShop_sell,

    // 关闭和界面处理
    find_close: find_close,
    jiaocheng: jiaocheng,

    // 账号切换
    switch_account: switch_account,

    // 加好友
    openFriendMenu: openFriendMenu,
    addFriends: addFriends,
    clearFans: clearFans,

    // 仓库相关
    shengcang: shengcang,
    cangkuStatistics: cangkuStatistics,

    //推送相关
    creatContentData: creatContentData,
    rawContentData2: rawContentData2,
    convertToTable: convertToTable,
    pushTo: pushTo,

    // 计时器
    timer: timer,
    getTimerState: getTimerState,
    stopTimer: stopTimer,

    // 种植相关
    plantCrop: plantCrop,
    operation: operation,

    // 种树相关
    //汤姆相关
    tomOperation: tomOperation,
    clickTom: clickTom,
    findTom: findTom,
    tomToFind: tomToFind,
    tomMenu: tomMenu,



    // 全局变量
    config: config,
    crop: crop,
    crop_plant: crop_plant,
    crop_sell: crop_sell,
    appExternalDir: appExternalDir,

    //颜色
    cropItemColor: cropItemColor,
    cangkuItemColor: cangkuItemColor,
    otherItemColor: otherItemColor,
    allItemColor: allItemColor,
};


