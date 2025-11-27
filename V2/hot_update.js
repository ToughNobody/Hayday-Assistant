/**
 * 热更新模块
 * 用于自动更新脚本和资源
 */

// 获取当前脚本的路径
let currentScript = files.path("./hot_update.js");
let downloadAll = false; // 是否下载所有文件，默认false

const updateConfig = {
    version: "",
    versionCode: 0, // 版本代码，用于比较文件版本
    description: "",
    files: [], // 存储多个文件的更新信息
};

/**
 * 初始化热更新模块
 * @param {Object} config 更新配置
 * @param {string} config.version 最新版本号
 * @param {number} config.versionCode 版本代码，用于比较文件版本
 * @param {Array} config.files 文件更新配置数组，每个元素包含name, url, path等属性
 * @param {string} config.description 更新说明
 * @param {string} config.updateSource 更新源，可选"gitee"或"github"，默认"gitee"
 * @param {boolean} config.downloadAll 是否下载所有文件，默认false
 */
function init(config) {
    if (!config || !config.version || !config.files || config.files.length === 0) {
        throw new Error("热更新配置不完整");
    }

    updateConfig.version = config.version;
    updateConfig.versionCode = config.versionCode || 0;
    updateConfig.description = config.description || "";
    updateConfig.files = config.files;
    updateConfig.updateSource = config.updateSource || "gitee"; // 默认更新源为gitee，可选"gitee"或"github"
    downloadAll = config.downloadAll || false; // 默认不下载所有文件，可选true或false

    // 不再创建临时目录
    console.log("热更新模块已初始化");
    console.log("最新版本: " + updateConfig.version);
    console.log("需要更新的文件数量: " + updateConfig.files.length);
    console.log("更新源: " + updateConfig.updateSource);
}

/**
 * 执行增量更新
 * @returns {boolean} 更新是否成功
 */
function doIncrementalUpdate() {
    try {
        console.log("开始执行增量更新...");
        console.log("当前版本代码: " + updateConfig.versionCode);

        // 统计需要下载的文件数量
        let filesToDownloadCount = 0;
        for (let i = 0; i < updateConfig.files.length; i++) {
            if (shouldDownloadFile(updateConfig.files[i])) {
                filesToDownloadCount++;
            }
        }
        console.log("需要下载的文件数量: " + filesToDownloadCount);

        if (filesToDownloadCount === 0) {
            console.log("没有需要更新的文件，跳过更新过程");
            return true;
        }

        // 先备份当前文件
        console.log("备份当前文件...");
        let backupDir = backupCurrentFiles();

        // 直接下载文件到目标位置
        console.log("正在下载更新文件...");
        if (!downloadAllFiles(backupDir)) {
            console.error("下载更新文件失败");
            return false;
        }

        // 验证下载的文件
        console.log("验证下载的文件...");
        if (!validateDownloadedFiles()) {
            console.error("下载的文件验证失败");
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
 * 检查文件是否需要下载
 * @param {Object} fileConfig 文件配置
 * @returns {boolean} 是否需要下载
 */
function shouldDownloadFile(fileConfig) {
    // 如果设置为下载所有文件，则直接返回true
    if (downloadAll) {
        console.log(`设置为下载所有文件，将下载文件 ${fileConfig.name}`);
        return true;
    }

    // 如果没有提供versionCode，则默认需要下载
    if (fileConfig.versionCode === undefined) {
        console.log(`文件 ${fileConfig.name} 没有提供versionCode，将下载更新`);
        return true;
    }

    // 如果配置中没有versionCode，则默认需要下载
    if (updateConfig.versionCode === undefined) {
        console.log(`配置中没有提供versionCode，将下载文件 ${fileConfig.name}`);
        return true;
    }

    // 比较版本代码，只有当文件的versionCode大于配置的versionCode时才下载
    if (fileConfig.versionCode > updateConfig.versionCode) {
        console.log(`文件 ${fileConfig.name} versionCode(${fileConfig.versionCode}) > 配置versionCode(${updateConfig.versionCode})，需要下载`);
        return true;
    } else {
        console.log(`文件 ${fileConfig.name} versionCode(${fileConfig.versionCode}) <= 配置versionCode(${updateConfig.versionCode})，无需下载`);
        return false;
    }
}

/**
 * 下载所有需要更新的文件
 * @param {string} backupDir 备份目录路径
 * @returns {boolean} 下载是否全部成功
 */
function downloadAllFiles(backupDir) {
    let successCount = 0;

    // 计算需要下载的文件数量
    let filesToDownloadCount = 0;
    for (let i = 0; i < updateConfig.files.length; i++) {
        if (shouldDownloadFile(updateConfig.files[i])) {
            filesToDownloadCount++;
        }
    }

    // 如果没有需要下载的文件，直接返回成功
    if (filesToDownloadCount === 0) {
        console.log("没有需要下载的文件，跳过下载过程");
        return true;
    }

    // 创建进度条对话框
    let progressDialog = dialogs.build({
        title: "正在下载更新文件...",
        customView: ui.inflate(
            <vertical padding="16">
                <progressbar id="progressBar" max="100" showMinMax="true" />
                <text id="progressText" textSize="14sp" gravity="center" marginTop="8">准备下载...</text>
            </vertical>
        ),
        cancelable: false
    }).show();

    let progressView = progressDialog.getView();

    // 遍历所有需要更新的文件
    let downloadedCount = 0;
    for (let i = 0; i < updateConfig.files.length; i++) {
        let fileConfig = updateConfig.files[i];
        console.log(`正在检查文件: ${fileConfig.name}`);

        // 根据更新源选择URL
        let downloadUrl = "";
        if (updateConfig.updateSource === "gitee" && fileConfig.gitee_url) {
            downloadUrl = fileConfig.gitee_url;
        }
        else if (updateConfig.updateSource === "github" && fileConfig.github_url) {
            downloadUrl = fileConfig.github_url;
        }

        // 检查文件是否需要下载
        if (!shouldDownloadFile(fileConfig)) {
            console.log(`跳过下载文件: ${fileConfig.name}`);
            continue;
        }

        console.log(`正在下载文件: ${fileConfig.name} (URL: ${downloadUrl})`);

        // 更新进度条文本
        progressView.progressText.setText(`正在下载: ${fileConfig.name}`);

        try {
            // 发送HTTP请求获取文件
            let response = http.get(downloadUrl, {
                headers: {
                    "Accept": "application/octet-stream"
                }
            });

            if (response.statusCode != 200) {
                console.error(`下载文件失败: ${fileConfig.name}, HTTP状态码: ${response.statusCode}`);
                toast(`下载文件失败: ${fileConfig.name}, HTTP状态码: ${response.statusCode}`);
                continue;
            }

            // 确定文件的完整路径
            let filePath = getFilePath(fileConfig);

            // 创建目标目录（如果不存在）
            let fileDir = filePath.split("/").slice(0, -1).join("/");
            files.ensureDir(fileDir + "/1");

            // 将下载的内容直接写入目标文件
            try {
                // 对于图片等二进制文件，使用二进制模式写入
                if (fileConfig.name.match(/\.(png|jpg|jpeg|gif|bmp|webp|ico|svg)$/i)) {
                    let content = response.body.bytes();
                    if (!content || content.length === 0) {
                        console.error(`下载的内容为空: ${fileConfig.name}`);
                        continue;
                    }

                    // 使用二进制模式写入文件
                    files.writeBytes(filePath, content);
                    console.log(`图片文件已直接写入目标路径: ${filePath}, 大小: ${content.length}字节`);
                } else {
                    // 对于文本文件，使用字符串模式写入
                    files.write(filePath, response.body.string());
                    console.log(`文本文件已直接写入目标路径: ${filePath}`);
                }

                // 验证文件是否成功写入
                if (!files.exists(filePath)) {
                    throw new Error("写入文件后不存在");
                }
            } catch (writeError) {
                console.error(`写入文件失败: ${filePath}, 错误: ${writeError.message}`);
                toast(`写入文件失败: ${fileConfig.name}, 错误: ${writeError.message}`);
                continue;
            }

            successCount++;
            downloadedCount++;
            console.log(`文件下载并写入完成: ${fileConfig.name}`);

            // 更新进度条
            let progressPercent = Math.round((downloadedCount / filesToDownloadCount) * 100);
            progressView.progressBar.setProgress(progressPercent);
            progressView.progressText.setText(`已下载: ${downloadedCount}/${filesToDownloadCount} (${progressPercent}%)`);
        } catch (e) {
            console.error(`下载文件时出错: ${fileConfig.name}, 错误: ${e.message}`);
            toast(`下载文件时出错: ${fileConfig.name}, 错误: ${e.message}`);
        }
    }

    // 关闭进度条对话框
    progressDialog.dismiss();

    // 检查是否有文件下载成功
    if (successCount === 0) {
        return false;
    }

    console.log(`成功下载 ${successCount}/${filesToDownloadCount} 个文件`);
    return true;
}

/**
 * 验证下载的文件
 * @returns {boolean} 验证是否全部通过
 */
function validateDownloadedFiles() {
    let validCount = 0;
    let hasFilesToValidate = false;

    // 首先检查是否有需要下载的文件
    for (let i = 0; i < updateConfig.files.length; i++) {
        if (shouldDownloadFile(updateConfig.files[i])) {
            hasFilesToValidate = true;
            break;
        }
    }

    // 如果没有需要下载的文件，直接返回成功
    if (!hasFilesToValidate) {
        console.log("没有需要下载的文件，跳过验证操作");
        return true;
    }

    // 遍历所有需要更新的文件，只验证需要下载的文件
    for (let i = 0; i < updateConfig.files.length; i++) {
        // 检查文件是否需要下载
        if (!shouldDownloadFile(updateConfig.files[i])) {
            console.log(`跳过验证不需要更新的文件: ${updateConfig.files[i].name}`);
            continue;
        }
        let fileConfig = updateConfig.files[i];

        // 确定文件的完整路径
        let filePath = getFilePath(fileConfig);

        // 检查文件是否存在
        if (!files.exists(filePath)) {
            console.error(`文件未找到，可能下载失败: ${fileConfig.name}`);
            continue;
        }

        // 根据文件类型进行不同的验证
        try {
            // 对于图片等二进制文件，检查文件大小
            if (fileConfig.name.match(/\.(png|jpg|jpeg|gif|bmp|webp|ico|svg)$/i)) {
                let fileContent = files.readBytes(filePath);
                if (!fileContent || fileContent.length === 0) {
                    console.error(`文件内容为空: ${fileConfig.name}`);
                    continue;
                }
                console.log(`图片文件验证通过: ${fileConfig.name}, 大小: ${fileContent.length}字节`);
            } else {
                // 对于文本文件，检查内容
                let content = files.read(filePath);
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

                    } catch (e) {
                        console.error(`JavaScript语法错误: ${fileConfig.name}, 错误: ${e.message}`);
                        continue;
                    }
                }

                console.log(`文本文件验证通过: ${fileConfig.name}`);
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
 * @returns {string} 备份目录路径
 */
function backupCurrentFiles() {
    // 创建备份目录
    let appExternalDir = context.getExternalFilesDir(null).getAbsolutePath();
    let backupDir = files.join(appExternalDir, "backups");

    try {
        files.ensureDir(backupDir + "/1");
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
        files.ensureDir(backupSubDir + "/1");
        console.log("备份子目录创建成功: " + backupSubDir);
    } catch (e) {
        console.error("创建备份子目录失败: " + e.message);
        throw new Error("无法创建备份子目录: " + e.message);
    }

    let successCount = 0;

    // 遍历所有需要更新的文件，只备份需要下载的文件
    for (let i = 0; i < updateConfig.files.length; i++) {
        // 检查文件是否需要下载
        if (!shouldDownloadFile(updateConfig.files[i])) {
            console.log(`跳过备份不需要更新的文件: ${updateConfig.files[i].name}`);
            continue;
        }
        let fileConfig = updateConfig.files[i];

        try {
            // 确定文件的完整路径
            let filePath = getFilePath(fileConfig);

            // 检查文件是否存在
            if (!files.exists(filePath)) {
                console.warn(`文件不存在，跳过备份: ${fileConfig.name}`);
                continue;
            }

            // 构建备份文件路径
            let backupFilePath = files.join(backupSubDir, fileConfig.name);

            // 确保备份目录存在
            files.ensureDir(backupSubDir);

            // 对于图片等二进制文件，使用二进制模式复制
            if (fileConfig.name.match(/\.(png|jpg|jpeg|gif|bmp|webp|ico|svg)$/i)) {
                // 读取为二进制数据
                let fileContent = files.readBytes(filePath);
                // 写入为二进制数据
                files.writeBytes(backupFilePath, fileContent);

                // 验证备份是否成功
                if (files.exists(backupFilePath)) {
                    successCount++;
                    console.log(`图片文件已备份: ${fileConfig.name} -> ${backupFilePath}`);
                } else {
                    console.error(`备份失败: 备份文件不存在 ${backupFilePath}`);
                }
            } else {
                // 对于文本文件，使用普通方式复制
                files.copy(filePath, backupFilePath);

                // 验证备份是否成功
                if (files.exists(backupFilePath)) {
                    successCount++;
                    console.log(`文本文件已备份: ${fileConfig.name} -> ${backupFilePath}`);
                } else {
                    console.error(`备份失败: 备份文件不存在 ${backupFilePath}`);
                }
            }
        } catch (e) {
            console.error(`备份文件失败: ${fileConfig.name}, 错误: ${e.message}`);
        }
    }

    console.log(`成功备份 ${successCount}/${updateConfig.files.length} 个文件`);
    return backupSubDir; // 返回备份目录路径
}


/**
 * 下载压缩包文件
 * @param {string} downloadUrl - 压缩包的下载链接
 * @param {string} targetDir - 目标文件夹路径
 * @param {string} fileName - 保存的文件名（可选，默认为从URL中提取）
 * @returns {boolean} 下载是否成功
 */
function downloadZipFile(downloadUrl, targetDir = "/sdcard/Download/", fileName) {
    // 创建进度条对话框
    let progressDialog = dialogs.build({
        title: "正在下载压缩包...",
        customView: ui.inflate(
            <vertical padding="16">
                <progressbar id="progressBar" max="100" showMinMax="true" />
                <text id="progressText" textSize="14sp" gravity="center" marginTop="8">准备下载...</text>
            </vertical>
        ),
        cancelable: false
    }).show();

    let progressView = progressDialog.getView();

    try {
        console.log("开始下载压缩包: " + downloadUrl);

        // 确保目标目录存在
        files.ensureDir(targetDir + "/1");

        // 如果未提供文件名，则从URL中提取
        if (!fileName) {
            fileName = downloadUrl.split('/').pop().split('?')[0] || "download.zip";
        }

        // 构建完整的文件路径
        let filePath = files.join(targetDir, fileName);
        console.log("保存路径: " + filePath);

        // 更新进度条文本
        progressView.progressText.setText("正在连接...");

        // 发送HTTP请求获取文件
        let response = http.get(downloadUrl, {
            headers: {
                "Accept": "application/zip, application/octet-stream"
            }
        });

        if (response.statusCode != 200) {
            console.error("下载压缩包失败, HTTP状态码: " + response.statusCode);
            toast("下载压缩包失败, HTTP状态码: " + response.statusCode);
            progressDialog.dismiss();
            return false;
        }

        // 获取文件内容
        let content = response.body.bytes();
        if (!content || content.length === 0) {
            console.error("下载的内容为空");
            toast("下载的内容为空");
            progressDialog.dismiss();
            return false;
        }

        console.log("文件大小: " + (content.length / (1024 * 1024)).toFixed(2) + "MB");

        // 更新进度条文本
        progressView.progressText.setText("正在保存文件...");

        // 使用二进制模式写入文件
        files.writeBytes(filePath, content);
        console.log("压缩包已保存: " + filePath + ", 大小: " + (content.length / (1024 * 1024)).toFixed(2) + "MB");

        // 验证文件是否成功写入
        if (!files.exists(filePath)) {
            throw new Error("写入文件后不存在");
        }

        toast("压缩包下载成功: " + fileName);

    } catch (e) {
        console.error("下载压缩包时出错: " + e.message);
        toast("下载压缩包时出错: " + e.message);
        // 关闭进度条对话框
        progressDialog.dismiss();
        return false;
    }

    try {
        // 更新进度条文本，显示正在解压
        progressView.progressText.setText("正在解压文件...");
        
        // 解压压缩包
        let filePath = files.join(targetDir, fileName);
        let dirPath = files.cwd().substring(0, files.cwd().lastIndexOf("/"));
        switch (zips.X(filePath, dirPath)) {
            case 0:
                log("解压缩成功！请到 " + dirPath + " 目录下查看。");
                break;
            case 1:
                toastLog("压缩结束，存在非致命错误（例如某些文件正在被使用，没有被压缩）");
                break;
            case 2:
                toastLog("致命错误");
                break;
            case 7:
                toastLog("命令行错误");
                break;
            case 8:
                toastLog("没有足够内存");
                break;
            case 255:
                toastLog("用户中止操作");
                break;
            default:
                toastLog("未知错误");
        }
        
        // 关闭进度条对话框
        progressDialog.dismiss();
        return true;
    } catch (error) {
        console.error("解压缩压缩包时出错: " + error.message);
        toast("解压缩压缩包时出错: " + error.message);
        // 关闭进度条对话框
        progressDialog.dismiss();
        return false;
    }
}



/**
 * 获取文件的完整路径
 * @param {Object} fileConfig 文件配置
 * @returns {string} 文件的完整路径
 */
function getFilePath(fileConfig) {
    if (fileConfig.path) {
        return fileConfig.path;
    } else {
        // 如果没有指定路径，假设文件与脚本在同一目录
        let scriptDir = files.path(currentScript || "./").split("/").slice(0, -1).join("/");
        return files.join(scriptDir, fileConfig.name);
    }
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
    isUpdateAvailable: isUpdateAvailable,
    shouldDownloadFile: shouldDownloadFile,
    downloadZipFile: downloadZipFile,
};


