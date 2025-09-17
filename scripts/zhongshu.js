


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

//点击购买按钮，如果点开了购买界面返回true，没找到返回false
function buy_button() {
    let buy_button = matchColor([{ x: 42, y: 177, color: "#ffffff" }, { x: 76, y: 575, color: "#7abee4" }, { x: 110, y: 641, color: "#f9bd32" }, { x: 50, y: 611, color: "#f0da8b" }])
    if (buy_button) {
        click(51 + ran(), 600 + ran())
        console.log("点击购买按钮")
        showTip("点击购买按钮")
        return true;
    } else if (matchColor([{ x: 679, y: 578, color: "#7bbfe4" }, { x: 648, y: 612, color: "#f0d98a" }, { x: 682, y: 683, color: "#f4bd3f" }])) {
        return true;
    } else {
        return false;
    }
}

function findland() {
    let land = findMC([])
}


function main() {

}