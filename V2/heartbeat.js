/**
 * Hayday-Assistant - Auto.js 心跳客户端模块
 * 定时向云函数上报在线状态
 */

// ==================== 配置区 ====================

// 云函数地址
const SCF_BASE_URL = "https://1421669870-5okh06mwvp.ap-guangzhou.tencentscf.com";

// 心跳间隔（毫秒），默认 2 分钟
const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000;

// ==================== 设备 ID 管理 ====================

/**
 * 获取或生成设备唯一 ID
 * 优先使用本地存储的 ID，重启后保持一致
 */
function getDeviceId() {
    const STORAGE_KEY = "hayday_assistant_device_id";

    // 尝试读取已保存的 deviceId
    let deviceId = storages.create("hayday-assistant").get(STORAGE_KEY);

    if (!deviceId) {
        // 生成新的随机 UUID v4
        deviceId = generateUUID();
        storages.create("hayday-assistant").put(STORAGE_KEY, deviceId);
        log("生成新设备 ID: " + deviceId);
    }

    return deviceId;
}

/**
 * 生成符合 UUID v4 规范的随机字符串
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0;
        var v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ==================== 网络请求 ====================

/**
 * 发送心跳到云函数
 * @returns {boolean} 是否成功
 */
function reportOnline() {
    const deviceId = getDeviceId();
    // deviceId 作为 URL 参数传递
    const url = SCF_BASE_URL + "/reportOnline?deviceId=" + encodeURIComponent(deviceId);

    try {
        const response = http.get(url);

        if (response.statusCode === 200) {
            const body = response.body.json();
            if (body.success) {
                log("心跳上报成功，当前时间戳: " + body.timestamp);
                return true;
            }
        }

        log("心跳上报失败，状态码: " + response.statusCode);
        log("响应内容: " + response.body.string());
        return false;

    } catch (e) {
        log("心跳上报异常: " + e);
        return false;
    }
}

// ==================== 主程序 ====================

/**
 * 启动心跳服务
 */
function startHeartbeat() {
    log("========== Hayday-Assistant 心跳服务启动 ==========");
    log("设备 ID: " + getDeviceId());
    // log("云函数地址: " + SCF_BASE_URL);
    // log("心跳间隔: " + (HEARTBEAT_INTERVAL_MS / 1000) + " 秒");
    log("================================================");

    // 立即发送一次心跳（脚本启动时）
    reportOnline();

    // 定时心跳循环
    let successCount = 0;
    let failCount = 0;

    threads.start(function () {
        while (true) {
            sleep(HEARTBEAT_INTERVAL_MS);

            const ok = reportOnline();
            if (ok) {
                successCount++;
            } else {
                failCount++;
            }

            log("统计 - 成功: " + successCount + " 次，失败: " + failCount + " 次");
        }
    });
}

/**
 * 手动测试心跳（可在控制台调用）
 */
function testHeartbeat() {
    log("========== 手动心跳测试 ==========");
    const result = reportOnline();
    log("测试结果: " + (result ? "成功" : "失败"));
    return result;
}

/**
 * 查询当前在线人数（需云函数已部署）
 */
function testGetOnlineCount() {
    const url = SCF_BASE_URL + "/getOnlineCount";
    try {
        const response = http.get(url);
        const body = response.body.json();
        log("当前在线人数: " + JSON.stringify(body));
        return body.online;
    } catch (e) {
        log("查询在线人数失败: " + e);
        return null;
    }
}

// ==================== 模块导出 ====================

module.exports = {
    startHeartbeat: startHeartbeat,
    testHeartbeat: testHeartbeat,
    testGetOnlineCount: testGetOnlineCount,
    reportOnline: reportOnline,
    getDeviceId: getDeviceId
};