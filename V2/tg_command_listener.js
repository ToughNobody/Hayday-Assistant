

let configs = storages.create("config");


const telegramChatId = configs.get("telegramChatId", "");
const botToken = configs.get("telegramBotToken", "");
const apiBase = "https://api.telegram.org/bot" + botToken;
const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;


/**
 * @param {string} text - 要发送的文本
 * @returns {boolean} - 是否成功发送
 */
function sendTelegramText(text) {
    if (!telegramChatId) return false;
    try {
        let response = http.post(apiBase + "/sendMessage", {
            "chat_id": String(telegramChatId),
            "text": String(text || "")
        });
        return !!(response && response.statusCode == 200);
    } catch (e) {
        log("Telegram发送失败: " + e);
        return false;
    }
}

/**
 * @param {string} text - 原始指令文本
 * @returns {string} - 规范后的指令文本
 */
function normalizeCommand(text) {
    text = String(text || "").trim();
    if (!text) return "";
    let first = text.split(/\s+/)[0];
    first = first.replace(/@.+$/, "");
    return first.toLowerCase();
}



/**
 * @returns {boolean} - 是否正在运行主引擎
 */
function isEngineRunning(engineName) {
    try {
        let arr = engines.all();
        for (let i = 0; i < arr.length; i++) {
            let source = arr[i].getSource();
            let sourcePath = source ? String(source.toString()) : "";
            if (sourcePath.indexOf(engineName + ".js") > -1) return true;
        }
    } catch (e) { log(e); }
    return false;
}

function startEngine(engineName) {
    if (isEngineRunning(engineName)) return;
    try {
        let newEngine = engines.execScriptFile("./" + engineName + ".js");
        log("启动" + engineName + "引擎，ID: " + newEngine.id);
    } catch (e) {
        log("启动" + engineName + "引擎失败: " + e);
        sendTelegramText("启动" + engineName + "引擎失败: " + e);
    }
}

function stopEngine(engineName) {
    if (!isEngineRunning(engineName)) return;
    
    let maxAttempts = 10; // 防止无限循环
    let attempts = 0;
    
    while (isEngineRunning(engineName) && attempts < maxAttempts) {
        attempts++;
        let engineArray = engines.all();
        let stopped = false;

        // 直接停止目标引擎
        for (let i = 0; i < engineArray.length; i++) {
            let engine = engineArray[i];
            let source = engine.getSource();
            let sourcePath = source ? String(source.toString()) : "";
            if (sourcePath.indexOf(engineName + ".js") > -1) {
                try {
                    engine.forceStop();
                    log(`关闭${engineName}引擎，ID: ${engine.id}，出现红字报错属于正常现象`);
                    stopped = true;
                } catch (e) {
                    log(`停止${engineName}引擎失败(ID: ${engine.id}): ${e}`);
                }
            }
        }

        // 如果没有引擎被停止，跳出循环防止无限循环
        if (!stopped) {
            log(`无法停止${engineName}引擎，跳出循环`);
            break;
        }

        // 短暂等待以确保引擎完全停止
        sleep(100);
    }
}

/**
 * @returns {string} - 状态消息文本
 */
function buildStatusMessage() {
    let config = configs.get("config", {}) || {};
    let doneCount = 0;
    try {
        if (config.accountList && config.accountList.length) {
            doneCount = config.accountList.filter(item => item && item.done).length;
        }
    } catch (e) { }
    let lines = [];
    lines.push("卡通农场小助手 Telegram 指令监听在线");
    lines.push("主界面: " + (isEngineRunning("main") ? "运行中" : "未打开"));
    lines.push("启用账号: " + doneCount);
    return lines.join("\n");
}

/**
 * @returns {string} - 帮助消息文本
 */
function buildHelpMessage() {
    return [
        "Telegram 指令说明",
        "/help  查看帮助",
        "/ping  测试是否在线",
        "/start_main  启动主界面 /stop_main  关闭主界面",
        "/start_shuadi  启动刷地 /stop_shuadi  关闭刷地",
        "/start_cangkuStatistics  启动仓库统计 /stop_cangkuStatistics  关闭仓库统计",
        "/stats  立即执行一次仓库统计",
        "/status 查看监听与统计状态",
        "/screenshot 屏幕截图并发送到Telegram",
        "提示: 一台模拟器建议使用一个独立 bot，避免多个实例抢同一条命令。"
    ].join("\n");
}

function handleCommand(text) {
    let command = normalizeCommand(text);
    if (!command) return;
    if (command == "/ping") {
        sendTelegramText("pong\nTelegram 指令监听在线");
        return;
    }
    if (command == "/help" || command == "/start") {
        sendTelegramText(buildHelpMessage());
        return;
    }
    if (command == "/screenshot") {
        try {

            // 保存截图到临时文件
            let tempPath = files.join(files.cwd(), "temp_screenshot.png");
            images.save(captureScreen(), tempPath);

            // 上传截图到Telegram
            let url = apiBase + "/sendPhoto";
            let response = http.postMultipart(url, {
                "chat_id": String(telegramChatId),
                "photo": files.open(tempPath)
            });

            // 删除临时文件
            files.remove(tempPath);

            if (response && response.statusCode == 200) {
                log("屏幕截图已成功发送到Telegram。");
            } else {
                log("屏幕截图发送失败。");
            }
        } catch (e) {
            log("屏幕截图失败: " + e);
            sendTelegramText("屏幕截图失败: " + e);
        }
        return;
    }
    if (command == "/status") {
        sendTelegramText(buildStatusMessage());
        return;
    }
    // 引擎管理命令处理
    //处理命令需小写
    const engineCommands = {
        "start_cangkustatistics": {
            engineName: "cangkuStatistics",
            runningMsg: "仓库统计正在运行中，请稍后再试。",
            startMsg: "已收到 /start_cangkuStatistics，开始启动仓库统计。统计完成后会推送至 Telegram。",
            startFailedMsg: "启动cangkuStatistics引擎失败: "
        },
        "stop_cangkustatistics": {
            engineName: "cangkuStatistics",
            notRunningMsg: "仓库统计未运行...",
            stopMsg: "已收到 /stop_cangkuStatistics，开始关闭仓库统计。",
            stopFailedMsg: "关闭cangkuStatistics引擎失败: "
        },
        "start_main": {
            engineName: "main",
            runningMsg: "主界面运行中...",
            startMsg: "已收到 /start_main，开始启动主界面。",
            startFailedMsg: "启动主界面失败: "
        },
        "stop_main": {
            engineName: "main",
            notRunningMsg: "主界面未运行...",
            stopMsg: "已收到 /stop_main，开始关闭主界面。",
            stopFailedMsg: "关闭主界面失败: "
        },
        "start_shuadi": {
            engineName: "shuadi",
            runningMsg: "刷地正在运行中，请稍后再试。",
            startMsg: "已收到 /start_shuadi，开始启动刷地。",
            startFailedMsg: "启动刷地引擎失败: "
        },
        "stop_shuadi": {
            engineName: "shuadi",
            notRunningMsg: "刷地未运行...",
            stopMsg: "已收到 /stop_shuadi，开始关闭刷地。",
            stopFailedMsg: "关闭刷地引擎失败: "
        },
    };

    // 处理启动命令
    if (command.startsWith("/start_")) {
        let cmdKey = command.slice(1);
        log(cmdKey);
        let cmdConfig = engineCommands[cmdKey];
        log(cmdConfig);
        if (cmdConfig) {
            if (isEngineRunning(cmdConfig.engineName)) {
                sendTelegramText(cmdConfig.runningMsg);
                return;
            }
            sendTelegramText(cmdConfig.startMsg);
            try {
                // 如果启动的是main引擎，则不自动启动卡通农场
                if (cmdConfig.engineName !== "main") {
                    launch("com.supercell.hayday");
                    sleep(100);
                }
                startEngine(cmdConfig.engineName);
            } catch (e) {
                log(cmdConfig.startFailedMsg + e);
                sendTelegramText(cmdConfig.startFailedMsg + e);
            }
            return;
        }
    }

    // 处理停止命令
    if (command.startsWith("/stop_")) {
        let cmdKey = command.slice(1);
        let cmdConfig = engineCommands[cmdKey];
        if (cmdConfig) {
            if (!isEngineRunning(cmdConfig.engineName)) {
                sendTelegramText(cmdConfig.notRunningMsg);
                return;
            }
            sendTelegramText(cmdConfig.stopMsg);
            try {
                stopEngine(cmdConfig.engineName);
            } catch (e) {
                log(cmdConfig.stopFailedMsg + e);
                sendTelegramText(cmdConfig.stopFailedMsg + e);
            }
            return;
        }
    }
}


function getOffsetKey() {
    return "offset_" + String(botToken || "default").replace(/[^a-zA-Z0-9_]/g, "_");
}


function initOffset() {
    if (!telegramChatId) {
        toast("Telegram chat_id 未配置");
        exit();
    }
    let key = getOffsetKey();
    let currentOffset = Number(configs.get(key, 0) || 0);
    if (currentOffset > 0) return currentOffset;
    try {
        let response = http.get(apiBase + "/getUpdates?timeout=1");
        if (response && response.statusCode == 200) {
            let data = response.body.json();
            let result = data && data.result ? data.result : [];
            let latest = 0;
            for (let i = 0; i < result.length; i++) {
                if (Number(result[i].update_id || 0) > latest) latest = Number(result[i].update_id || 0);
            }
            currentOffset = latest ? latest + 1 : 0;
            configs.put(key, currentOffset);
        }
    } catch (e) {
        log("初始化offset失败: " + e);
    }
    return currentOffset;
}

function pollLoop() {
    let key = getOffsetKey();
    let offset = initOffset();
    sendTelegramText("Telegram 指令监听已启动。发送 /help 查看命令。");
    while (true) {
        try {
            let url = apiBase + "/getUpdates?timeout=20";
            if (offset > 0) url += "&offset=" + offset;
            let response = http.get(url);
            if (response && response.statusCode == 200) {
                let data = response.body.json();
                let result = data && data.result ? data.result : [];
                for (let i = 0; i < result.length; i++) {
                    let update = result[i] || {};
                    offset = Number(update.update_id || 0) + 1;
                    configs.put(key, offset);
                    let message = update.message || update.edited_message || {};
                    let chat = message.chat || {};
                    let chatId = String(chat.id || "");
                    if (chatId !== String(telegramChatId)) continue;
                    let text = String(message.text || "").trim();
                    if (!text) continue;
                    log("收到Telegram命令: " + text);
                    handleCommand(text);
                }
            } else {
                sleep(3000);
            }
        } catch (e) {
            log("Telegram轮询异常: " + e);
            sleep(5000);
        }
        sleep(1000);
    }
}

try {
    log("Telegram指令监听启动");
    pollLoop();
} catch (e) {
    log("Telegram指令监听退出: " + e);
    sendTelegramText("Telegram 指令监听异常退出(如在停止监听引擎,则为正常现象): " + e);
}
