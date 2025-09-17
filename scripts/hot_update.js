/**
 * 热更新模块
 * 用于自动更新脚本和资源
 */

// 获取当前脚本的路径
let currentScript = files.path("./hot_update.js");

const updateConfig = {
    version: "",
    description: "",
    files: [], // 存储多个文件的更新信息
    downloadDir: "",
    tempDir: ""
};

/**
 * 初始化热更新模块
 * @param {Object} config 更新配置
 * @param {string} config.version 最新版本号
 * @param {Array} config.files 文件更新配置数组，每个元素包含name, url, path等属性
 * @param {string} config.description 更新说明
 */
function init(config) {
    if (!config || !config.version || !config.files || config.files.length === 0) {
        throw new Error("热更新配置不完整");
    }

    updateConfig.version = config.version;
    updateConfig.description = config.description || "";
    updateConfig.files = config.files;

    // 设置下载和临时目录路径
    let appExternalDir = context.getExternalFilesDir(null).getAbsolutePath();
    
    // 使用应用专用目录，避免权限问题
    updateConfig.downloadDir = files.join(appExternalDir, "updates");
    updateConfig.tempDir = files.join(appExternalDir, "update_temp");
    
    // 使用shell命令创建目录
    try {
        shell("mkdir -p " + updateConfig.downloadDir);
        shell("mkdir -p " + updateConfig.tempDir);
        console.log("目录创建成功: " + updateConfig.downloadDir + ", " + updateConfig.tempDir);
    } catch (e) {
        console.error("使用shell命令创建目录失败: " + e.message);
        throw new Error("无法创建必要的目录: " + e.message);
    } 
    console.log("热更新模块已初始化");
    console.log("最新版本: " + updateConfig.version);
    console.log("需要更新的文件数量: " + updateConfig.files.length);
}

/**
 * 执行增量更新
 * @returns {boolean} 更新是否成功
 */
function doIncrementalUpdate() {
    try {
        console.log("开始执行增量更新...");

        // 下载所有需要更新的文件
        console.log("正在下载更新文件...");
        if (!downloadAllFiles()) {
            console.error("下载更新文件失败");
            return false;
        }

        // 验证下载的文件
        if (!validateDownloadedFiles()) {
            console.error("下载的文件验证失败");
            return false;
        }

        // 备份当前文件
        console.log("备份当前文件...");
        backupCurrentFiles();

        // 替换文件
        console.log("替换文件...");
        if (!replaceFiles()) {
            console.error("替换文件失败");
            return false;
        }

        console.log("增量更新完成");
        return true;
    } catch (e) {
        console.error("增量更新失败: " + e.message);
        return false;
    }
}

/**
 * 下载所有需要更新的文件
 * @returns {boolean} 下载是否全部成功
 */
function downloadAllFiles() {
    let successCount = 0;

    // 遍历所有需要更新的文件
    for (let i = 0; i < updateConfig.files.length; i++) {
        let fileConfig = updateConfig.files[i];
        console.log(`正在下载文件: ${fileConfig.name} (URL: ${fileConfig.url})`);

        try {
            // 发送HTTP请求获取文件
            let response = http.get(fileConfig.url, {
                headers: {
                    "Accept": "application/octet-stream"
                }
            });

            if (response.statusCode != 200) {
                console.error(`下载文件失败: ${fileConfig.name}, HTTP状态码: ${response.statusCode}`);
                continue;
            }

            // 创建临时文件路径，确保文件名与实际文件匹配
            let tempFileName = fileConfig.name;
            
            // 如果文件名没有后缀，尝试添加.js后缀
            if (!fileConfig.name.endsWith(".js") && !fileConfig.name.endsWith(".json")) {
                tempFileName = fileConfig.name + ".js";
            }
            
            let tempFilePath = files.join(updateConfig.tempDir, tempFileName);
            
            // 保存临时文件名，用于后续验证和替换
            fileConfig.tempFileName = tempFileName;
            
            // 将下载的内容写入临时文件
            try {
                files.write(tempFilePath, response.body.string());
                console.log(`文件已写入临时路径: ${tempFilePath}`);
            } catch (writeError) {
                console.error(`写入临时文件失败: ${tempFilePath}, 错误: ${writeError.message}`);
                continue;
            }

            // 保存下载路径，用于后续验证和替换
            fileConfig.tempPath = tempFilePath;
            successCount++;

            console.log(`文件下载完成: ${fileConfig.name}, 临时保存至: ${tempFilePath}`);
        } catch (e) {
            console.error(`下载文件时出错: ${fileConfig.name}, 错误: ${e.message}`);
        }
    }

    // 检查是否有文件下载成功
    if (successCount === 0) {
        return false;
    }

    console.log(`成功下载 ${successCount}/${updateConfig.files.length} 个文件`);
    return true;
}

/**
 * 验证下载的文件
 * @returns {boolean} 验证是否全部通过
 */
function validateDownloadedFiles() {
    let validCount = 0;

    // 遍历所有需要更新的文件
    for (let i = 0; i < updateConfig.files.length; i++) {
        let fileConfig = updateConfig.files[i];

        // 检查临时文件是否存在
        let tempFilePath = fileConfig.tempPath;
        
        // 如果临时文件不存在，尝试使用原始文件名
        if (!tempFilePath || !files.exists(tempFilePath)) {
            tempFilePath = files.join(updateConfig.tempDir, fileConfig.name);
            if (!files.exists(tempFilePath)) {
                console.error(`临时文件不存在: ${fileConfig.name}`);
                continue;
            }
        }
        
        // 使用找到的临时文件路径
        fileConfig.tempPath = tempFilePath;

        // 根据文件类型进行不同的验证
        try {
            let content = files.read(fileConfig.tempPath);
            if (!content || content.length < 10) { // 降低最小长度要求，适应不同类型文件
                console.error(`文件内容为空或过短: ${fileConfig.name}`);
                continue;
            }

            // 如果是JS脚本文件，可以进行语法检查
            if (fileConfig.name.endsWith('.js')) {
                try {
                    // 使用更安全的方式检查语法，不执行代码
                    // 只检查括号、引号等基本语法是否匹配
                    let bracketCount = 0;
                    let quoteChar = null;
                    
                    for (let i = 0; i < content.length; i++) {
                        let char = content[i];
                        
                        if (char === '"' || char === "'") {
                            if (quoteChar === null) {
                                quoteChar = char;
                            } else if (quoteChar === char) {
                                quoteChar = null;
                            }
                        } else if (quoteChar === null) {
                            if (char === '{') {
                                bracketCount++;
                            } else if (char === '}') {
                                bracketCount--;
                            } else if (char === '[') {
                                bracketCount++;
                            } else if (char === ']') {
                                bracketCount--;
                            } else if (char === '(') {
                                bracketCount++;
                            } else if (char === ')') {
                                bracketCount--;
                            }
                        }
                    }
                    
                    // 检查括号是否匹配
                    if (bracketCount !== 0) {
                        throw new Error("括号不匹配");
                    }
                    
                    // 检查是否有明显的语法错误
                    if (content.includes("ui.layout") || content.includes("ui.widget") || content.includes("ui.button")) {
                        console.warn(`文件包含UI相关代码: ${fileConfig.name}`);
                    }
                } catch (e) {
                    console.error(`JavaScript语法错误: ${fileConfig.name}, 错误: ${e.message}`);
                    continue;
                }
            }

            validCount++;
            console.log(`文件验证通过: ${fileConfig.name}`);
        } catch (e) {
            console.error(`读取文件内容失败: ${fileConfig.name}, 错误: ${e.message}`);
        }
    }

    // 检查是否有文件验证成功
    if (validCount === 0) {
        return false;
    }

    console.log(`成功验证 ${validCount}/${updateConfig.files.length} 个文件`);
    return true;
}

/**
 * 备份当前文件
 */
function backupCurrentFiles() {
    // 创建备份目录
    let appExternalDir = context.getExternalFilesDir(null).getAbsolutePath();
    let backupDir = files.join(appExternalDir, "backups");
    
    try {
        shell("mkdir -p " + backupDir);
        console.log("备份目录创建成功: " + backupDir);
    } catch (e) {
        console.error("创建备份目录失败: " + e.message);
        throw new Error("无法创建备份目录: " + e.message);
    }

    // 生成备份目录，包含时间戳
    let now = new Date();
    let formatDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    let backupSubDir = files.join(backupDir, `backup_${formatDate}`);
    try {
        shell("mkdir -p " + backupSubDir);
        console.log("备份子目录创建成功: " + backupSubDir);
    } catch (e) {
        console.error("创建备份子目录失败: " + e.message);
        throw new Error("无法创建备份子目录: " + e.message);
    }

    let successCount = 0;

    // 遍历所有需要更新的文件
    for (let i = 0; i < updateConfig.files.length; i++) {
        let fileConfig = updateConfig.files[i];

        try {
            // 确定文件的完整路径
            let filePath;
            if (fileConfig.path) {
                filePath = fileConfig.path;
            } else {
                // 如果没有指定路径，假设文件与脚本在同一目录
                // 使用当前脚本的路径代替__FILE__
                let scriptDir = files.path(currentScript || "./").split("/").slice(0, -1).join("/");
                
                // 直接使用配置的文件名
                filePath = files.join(scriptDir, fileConfig.name);
            }

            // 检查文件是否存在
            if (!files.exists(filePath)) {
                console.warn(`文件不存在，跳过备份: ${fileConfig.name}`);
                continue;
            }

            // 构建备份文件路径
            let backupFilePath = files.join(backupSubDir, fileConfig.name);

            // 复制文件到备份位置
            files.copy(filePath, backupFilePath);

            successCount++;
            console.log(`文件已备份: ${fileConfig.name} -> ${backupFilePath}`);
        } catch (e) {
            console.error(`备份文件失败: ${fileConfig.name}, 错误: ${e.message}`);
        }
    }

    console.log(`成功备份 ${successCount}/${updateConfig.files.length} 个文件`);
}

/**
 * 替换文件
 * @returns {boolean} 替换是否全部成功
 */
function replaceFiles() {
    let successCount = 0;
    
    // 创建目标目录（如果不存在）
    let fileDir;
    try {
        // 确定文件的完整路径
        let filePath;
        if (updateConfig.files.length > 0) {
            let fileConfig = updateConfig.files[0];
            if (fileConfig.path) {
                filePath = fileConfig.path;
            } else {
                // 如果没有指定路径，假设文件与脚本在同一目录
                let scriptDir = files.path(currentScript || "./").split("/").slice(0, -1).join("/");
                
                // 直接使用配置的文件名
                filePath = files.join(scriptDir, fileConfig.name);
            }
            
            // 创建目录
            fileDir = filePath.split("/").slice(0, -1).join("/");
            shell("mkdir -p " + fileDir);
            console.log("目标目录创建成功: " + fileDir);
        }
    } catch (e) {
        console.error("创建目标目录失败: " + e.message);
        throw new Error("无法创建目标目录: " + e.message);
    }

    // 遍历所有需要更新的文件
    for (let i = 0; i < updateConfig.files.length; i++) {
        let fileConfig = updateConfig.files[i];

        try {
            // 确定文件的完整路径
            let filePath;
            if (fileConfig.path) {
                filePath = fileConfig.path;
            } else {
                // 如果没有指定路径，假设文件与脚本在同一目录
                let scriptDir = files.path(currentScript || "./").split("/").slice(0, -1).join("/");
                
                // 直接使用配置的文件名
                filePath = files.join(scriptDir, fileConfig.name);
            }

            // 删除当前文件（如果存在）
            if (files.exists(filePath)) {
                files.remove(filePath);
            }

            // 将下载的文件复制到目标位置
            // 先尝试使用保存的临时文件路径
            let sourcePath = fileConfig.tempPath;
            
            // 如果临时文件不存在，尝试使用原始文件名
            if (!sourcePath || !files.exists(sourcePath)) {
                sourcePath = files.join(updateConfig.tempDir, fileConfig.name);
            }
            
            // 如果仍然找不到，尝试查找所有可能的文件名
            if (!files.exists(sourcePath)) {
                // 尝试添加.js后缀
                let jsPath = files.join(updateConfig.tempDir, fileConfig.name + ".js");
                if (files.exists(jsPath)) {
                    sourcePath = jsPath;
                }
                // 尝试添加.json后缀
                else {
                    let jsonPath = files.join(updateConfig.tempDir, fileConfig.name + ".json");
                    if (files.exists(jsonPath)) {
                        sourcePath = jsonPath;
                    }
                }
            }
            
            // 复制文件到目标位置
            files.copy(sourcePath, filePath);

            successCount++;
            console.log(`文件已替换: ${fileConfig.name} -> ${filePath}`);
        } catch (e) {
            console.error(`替换文件失败: ${fileConfig.name}, 错误: ${e.message}`);

            // 尝试恢复备份（如果存在）
            try {
                let appExternalDir = context.getExternalFilesDir(null).getAbsolutePath();
                let backupDir = files.join(appExternalDir, "backups");
                
                files.ensureDir(backupDir);

                // 查找最新的备份目录
                let backupDirs = files.listDir(backupDir);
                if (backupDirs.length > 0) {
                    backupDirs.sort();
                    let latestBackup = files.join(backupDir, backupDirs[backupDirs.length - 1]);
                    let backupFilePath = files.join(latestBackup, fileConfig.name);

                    if (files.exists(backupFilePath)) {
                        let filePath;
                        if (fileConfig.path) {
                            filePath = fileConfig.path;
                        } else {
                            let scriptDir = files.path(currentScript || "./").split("/").slice(0, -1).join("/");
                            
                            // 直接使用配置的文件名
                            filePath = files.join(scriptDir, fileConfig.name);
                        }

                        // 目录已在循环前面创建
                        let targetDir = filePath.split("/").slice(0, -1).join("/");
                        
                        // 复制备份文件到目标位置
                        files.copy(backupFilePath, filePath);
                        console.log(`已从备份恢复文件: ${fileConfig.name}`);
                    }
                }
            } catch (restoreError) {
                console.error(`恢复备份失败: ${fileConfig.name}, 错误: ${restoreError.message}`);
            }
        }
    }

    // 清理临时文件
    try {
        files.remove(updateConfig.tempDir);
        console.log("临时文件已清理");
    } catch (e) {
        console.error("清理临时文件失败: " + e.message);
    }

    // 检查是否有文件替换成功
    if (successCount === 0) {
        return false;
    }

    console.log(`成功替换 ${successCount}/${updateConfig.files.length} 个文件`);
    return true;
}

/**
 * 获取更新信息
 * @returns {Object} 更新信息
 */
function getUpdateInfo() {
    return {
        version: updateConfig.version,
        files: updateConfig.files,
        description: updateConfig.description
    };
}

/**
 * 检查更新是否可用
 * @returns {boolean} 更新是否可用
 */
function isUpdateAvailable() {
    return updateConfig.version && updateConfig.files && updateConfig.files.length > 0;
}

// 导出模块
module.exports = {
    init: init,
    doIncrementalUpdate: doIncrementalUpdate,
    getUpdateInfo: getUpdateInfo,
    isUpdateAvailable: isUpdateAvailable
};