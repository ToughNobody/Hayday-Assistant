/**
 * 脚本引擎监控器
 * 持续监控指定脚本引擎的运行状态，并在引擎停止运行时弹出提示
 */


let configs = storages.create("config"); // 创建配置存储对象

configs.put("engine_monitoring", true)

// 用于标识监控是否应该继续
let monitoring = true;

let deviceName = device.brand + " " + device.model
let content = "设备: " + deviceName + "\n\n卡通农场小助手脚本引擎已停止,请注意查看。\n\n具体问题请查看日志。"


function pushTo(contentData) {
    let title = "卡通农场小助手脚本已终止"; //推送标题
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
 * 检查指定脚本引擎是否正在运行
 * @param {string} engineId - 脚本引擎ID
 * @returns {object|null} 返回引擎信息对象或null
 */
function isScriptRunning(engineId) {
    try {
        let allEngines = engines.all();

        for (let i = 0; i < allEngines.length; i++) {
            let engine = allEngines[i];
            let source = engine.getSource();
            let sourcePath = source.toString();
            let id = engine.id

            // 检查脚本路径是否包含指定的脚本名称
            if (id == engineId) {
                return {
                    engine: engine,
                    source: sourcePath,
                    isAlive: true
                };
            }
        }

        // 未找到运行中的指定脚本
        return null;
    } catch (error) {
        log(`检查脚本运行状态时出错: ${error.message}`);
        return null;
    }
}

/**
 * 监控指定脚本引擎的运行状态
 * @param {string} engineId - 脚本引擎ID
 * @param {number} interval - 检查间隔（毫秒），默认5000ms
 */
function monitorScriptEngine(engineId, interval = 30 * 1000) {
    log("引擎监控已启动")
    log(`开始监控ID: ${engineId} 引擎的运行状态，检查间隔: ${interval}ms`);


    // 创建一个线程来持续监控
    let monitorThread = threads.start(function () {
        while (monitoring) {

            try {
                // 等待指定时间后检查
                sleep(interval);

                let engineInfo = isScriptRunning(engineId);

                if (engineInfo) {
                    // 引擎正在运行
                    log(`[${new Date().toLocaleTimeString()}] ${engineId} 引擎正在运行中...`);
                } else {
                    // 引擎未运行，发出警告
                    log(`[${new Date().toLocaleTimeString()}] ${engineId} 引擎已停止运行!`);
                    pushTo(content)
                    break;
                }

            } catch (error) {
                log(`监控过程中出错: ${error.message}`);
                break;
            }
        }

        log("引擎监控已停止");
    });

    return monitorThread;
}

monitorScriptEngine(configs.get("currentEngineId"))


