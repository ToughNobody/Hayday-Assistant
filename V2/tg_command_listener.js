

let configs = storages.create("config");


const telegramChatId = configs.get("telegramChatId", "");
const botToken = "8401328962:AAEUF6FBXxf_CL4dTy0MroVTvlxRtEkxM5s"; // Bot Token
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


function isStatsRunning() {
    try {
        let arr = engines.all();
        for (let i = 0; i < arr.length; i++) {
            let source = arr[i].getSource();
            let sourcePath = source ? String(source.toString()) : "";
            if (sourcePath.indexOf("cangkuStatistics.js") > -1) return true;
        }
    } catch (e) { log(e); }
    return false;
}


/**
 * @returns {boolean} - 是否正在运行主引擎
 */
function isMainRunning() {
    try {
        let arr = engines.all();
        for (let i = 0; i < arr.length; i++) {
            let source = arr[i].getSource();
            let sourcePath = source ? String(source.toString()) : "";
            if (sourcePath.indexOf("/main.js") > -1) return true;
        }
    } catch (e) { }
    return false;
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
    lines.push("主界面: " + (isMainRunning() ? "运行中" : "未打开"));
    lines.push("启用账号: " + doneCount);
    return lines.join("\n");
}

/**
 * @returns {string} - 帮助消息文本
 */
function buildHelpMessage() {
    return [
        "Telegram 指令说明",
        "/stats  立即执行一次仓库统计",
        "/status 查看监听与统计状态",
        "/ping  测试是否在线",
        "/help  查看帮助",
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
    if (command == "/status") {
        sendTelegramText(buildStatusMessage());
        return;
    }
    if (command == "/stats") {
        if (isStatsRunning()) {
            sendTelegramText("仓库统计正在运行中，请稍后再试。");
            return;
        }
        sendTelegramText("已收到 /stats，开始执行仓库统计。统计完成后会推送至 Telegram。");
        try {
            launch("com.supercell.hayday");
            sleep(100);
            let newEngine = engines.execScriptFile("./cangkuStatistics.js");
            log("启动仓库统计引擎，ID: " + newEngine.id);
        } catch (e) {
            log("启动仓库统计失败: " + e);
            sendTelegramText("启动仓库统计失败: " + e);
        }
        return;
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
    sendTelegramText("Telegram 指令监听已启动。发送 /help 查看命令。\n当前只建议一台模拟器绑定一个 bot。");
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
    sendTelegramText("Telegram 指令监听异常退出: " + e);
}
