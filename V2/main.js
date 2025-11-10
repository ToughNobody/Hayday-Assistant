"ui";

const icon = require("./img_Base64.js");

// 创建存储对象
let token_storage = storages.create("token_storage");
let statistics = storages.create("statistics");
let configs = storages.create("config"); // 创建配置存储对象
let config


// 初始化账号列表
let AccountList = [];
let SaveAccountList = [];
let AddFriendsList = [];


// 全局状态变量，用于跟踪各种选择状态，避免依赖颜色判断
let currentAccountMethod = "email"; // 当前账号方式: "email" 或 "save"
let currentFindAccountMethod = "ocr"; // 当前账号识别方式: "image" 或 "ocr"
let currentLandFindMethod = "商店"; // 当前寻找土地方法: "商店" 或 "面包房"


const currentPath = files.cwd();
// 获取应用专属外部目录的完整路径
let appExternalDir = context.getExternalFilesDir(null).getAbsolutePath();
const configDir = files.join(appExternalDir, "configs");
const configPath = files.join(configDir, "config.json");
const logDir = files.join(appExternalDir, "logs");
const scPath = "/storage/emulated/0/$MuMu12Shared/Screenshots"
// 确保目录存在
files.ensureDir(configDir + "/1");  // 创建配置目录
files.ensureDir(logDir + "/1");  // 创建日志目录
files.ensureDir(scPath + "/1");  // 创建截图目录

// 格式化日期为易读格式：YYYY-MM-DD_HH-mm-ss
let now = new Date();
let formatDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
let logPath = files.join(logDir, `${formatDate}.txt`);



// 确保日志目录存在
files.ensureDir(logDir + "/1");

console.setGlobalLogConfig({
    file: logPath, // 日志路径
    maxFileSize: 1024 * 1024 * 10,          // 10MB 后分割
    maxBackupSize: 10,                 // 最多保留 10 个备份
    rootLevel: "all",                  // 记录所有级别日志
    filePattern: "%d [%p] %m%n",      // 格式：时间 + 日志级别 + 消息
    writeSyncInterval: 500             // 每500ms同步写入一次
});

// 颜色库
const colorLibrary = [
    "#009688",
    "#FF9800",
    "#4CAF50",
    "#2196F3",
    "#DB7093",
    "#F44336",
    "#00BCD4",
    "#FFEB3B",
    "#795548",
    "#607D8B"
];

// 随机选择一个颜色
let color = "#009688"

// 初始化颜色函数
function initColor() {
    // 尝试从存储对象加载颜色设置

    if (config && config.themeColor && config.themeColor.code >= 0) {
        // 如果配置中有颜色设置，使用配置中的颜色
        color = colorLibrary[config.themeColor.code];
    } else {
        // 否则随机选择一个颜色
        color = colorLibrary[Math.floor(Math.random() * colorLibrary.length)];
    }
}




// 从project.json中读取版本号
function getAppVersion() {
    try {
        let projectPath = files.cwd() + "/project.json";
        if (files.exists(projectPath)) {
            let projectContent = files.read(projectPath);
            let projectJson = JSON.parse(projectContent);
            return projectJson.versionName || "未知版本";
        }
        return "未知版本";
    } catch (e) {
        console.error("读取版本号失败: " + e);
        return "未知版本";
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
            toastLog("文件导出失败,详情见日志");
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
            toastLog("文件导入失败,详情见日志");
            return false;
        }
    } else {
        console.log("参数错误：direction 参数必须是 'export' 或 'import'");
        return false;
    }
}

ui.layout(
    <drawer id="drawer">
        <vertical>
            {/*页头*/}
            <appbar id="appbar" bg="{{color}}">
                <toolbar id="toolbar" title="卡通农场小助手" />
                <tabs id="tabs" />
            </appbar>
            <viewpager id="viewpager">
                {/* 首页 */}
                <frame>
                    <scroll>
                        <vertical w="*" h="*" padding="16">

                            <card w="*" h="auto" marginBottom="12" cardCornerRadius="8" cardElevation="2">
                                <vertical padding="16">
                                    <text text="权限设置" textSize="16" textStyle="bold" marginBottom="8" />
                                    <horizontal gravity="center_vertical" marginBottom="12">
                                        {/*无障碍服务开关*/}
                                        <text text="无障碍服务" textSize="14" w="100" marginRight="8" />
                                        <Switch id="autoService" w="*" />
                                    </horizontal>
                                    <horizontal gravity="center_vertical" marginBottom="12">
                                        {/*截图权限获取开关*/}
                                        <text text="截图权限" textSize="14" w="100" marginRight="8" />
                                        <Switch id="requestScBtn" w="*" />
                                    </horizontal>
                                    <horizontal gravity="center_vertical" marginBottom="12">
                                        {/*浮动按钮开关*/}
                                        <text text="浮动按钮" textSize="14" w="100" marginRight="8" />
                                        <Switch id="win_switch" w="*" />
                                    </horizontal>
                                </vertical>
                            </card>
                            {/* 功能选择卡片 */}
                            <card w="*" h="auto" marginBottom="12" cardCornerRadius="8" cardElevation="2">
                                <vertical padding="16">
                                    <text text="功能设置" textSize="16" textStyle="bold" />

                                    {/* 主功能选择 */}
                                    <horizontal gravity="center_vertical">
                                        <text text="选择功能：" textSize="14" w="80" marginRight="8" />
                                        <spinner id="functionSelect" entries="刷地|种树|创新号"
                                            w="50" textSize="14" h="48" bg="#FFFFFF" />
                                    </horizontal>

                                    {/* 作物选择 - 仅在刷地时显示 */}
                                    <horizontal id="cropSelectContainer" gravity="center_vertical" visibility="visible">
                                        <text text="种植作物：" textSize="14" w="80" marginRight="8" />
                                        <spinner id="cropSelect" entries="小麦|玉米|胡萝卜|大豆|甘蔗"
                                            w="50" textSize="14" h="48" bg="#FFFFFF" />
                                        <text text="成熟时间:" textSize="14" w="80" marginLeft="20" />
                                        <input id="matureTime" inputType="number" marginRight="8" hint="2" w="50" h="48" textSize="14" bg="#FFFFFF" maxLength="3" />
                                    </horizontal>

                                    {/* 商店售价 - 仅在刷地时显示*/}
                                    <horizontal id="shopPriceContainer" gravity="center_vertical" visibility="visible">
                                        <text text="商店售价：" textSize="14" w="80" marginRight="8" />
                                        <spinner id="shopPrice" entries="最低|平价|最高" w="50" textSize="14" h="48" bg="#FFFFFF" />
                                        <text text="保留数量:" textSize="14" w="80" marginLeft="20" />
                                        <input id="ReservedQuantity" inputType="number" marginRight="8" hint="20" w="50" h="48" textSize="14" bg="#FFFFFF" maxLength="3" />
                                    </horizontal>

                                    {/* 汤姆 - 仅在刷地时显示*/}
                                    <horizontal id="tomSwitchContainer" gravity="center_vertical" visibility="visible">
                                        <text text="汤姆：" textSize="14" w="80" marginRight="8" />
                                        <Switch id="tomSwitch" w="*" h="48" gravity="left|center" />
                                    </horizontal>

                                    {/* 物品类型和名称 - 仅在汤姆开关开启时显示 */}
                                    <horizontal id="tomItemContainer" gravity="center_vertical" visibility="gone">
                                        <text text="物品类型：" textSize="14" w="80" marginRight="8" />
                                        <spinner id="Tom_itemType" entries="货仓|粮仓" w="120" textSize="14" h="48" bg="#FFFFFF" marginRight="8" />
                                        <input id="Tom_itemName" hint="物品名称" w="*" h="48" textSize="14" bg="#FFFFFF" />
                                    </horizontal>

                                    {/* 树木选择 - 仅在种树时显示 */}
                                    <horizontal id="treeSelectContainer" gravity="center_vertical" visibility="gone">
                                        <text text="种植树木：" textSize="14" w="80" marginRight="8" />
                                        <spinner id="treeSelect" entries="苹果树|树莓丛|樱桃树|黑莓丛|蓝莓丛|可可树|咖啡丛|橄榄树|柠檬树|香橙树|水蜜桃树|香蕉树|西梅树|芒果树|椰子树|番石榴树|石榴树"
                                            w="*" textSize="14" h="48" bg="#FFFFFF" />
                                    </horizontal>

                                    {/* 是否滑动 - 仅在种树时显示 */}
                                    <horizontal id="treeShouldSwipe" gravity="center_vertical" visibility="gone">
                                        <text text="是否自动滑动：" textSize="14" w="80" marginRight="8" />
                                        <Switch id="treeShouldSwipeSwitch" w="*" h="48"
                                            gravity="left|center" />
                                    </horizontal>

                                    <card id="addFriendsCard" w="*" h="auto" marginBottom="12" cardCornerRadius="8" cardElevation="2" visibility="gone">
                                        <vertical padding="16">
                                            {/* 账号标签列表显示 */}
                                            <vertical id="addFriendsListDisplay" marginTop="8">
                                                <text text="账号标签：" textSize="14" textStyle="bold" />
                                            </vertical>
                                            {/* 账号标签输入框 */}
                                            <list id="addFriendsList" h="auto">
                                                <card w="*" h="40" margin="0 5" cardCornerRadius="5dp"
                                                    cardElevation="1dp" foreground="?selectableItemBackground">
                                                    <horizontal gravity="center_vertical">
                                                        <frame h="*" w="10" bg="#f27272" />
                                                        <vertical padding="10 8" h="auto" w="0" layout_weight="1">
                                                            <text id="addFriendstitle" text="{{this.addFriendstitle}}" textColor="#333333" textSize="16sp" maxLines="1" />
                                                        </vertical>
                                                        <checkbox id="addFriendsdone" marginLeft="4" marginRight="50" checked="{{this.addFriendsdone}}" />
                                                    </horizontal>
                                                </card>
                                            </list>
                                        </vertical>
                                        <fab id="addFriend" w="50" h="50" src="@drawable/ic_add_black_48dp" scaleType="fitCenter"
                                            margin="8" layout_gravity="bottom|right" tint="black" backgroundTint="#7fffd4" />
                                    </card>

                                </vertical>
                            </card>

                            {/* 操作按钮区 */}
                            <horizontal gravity="center" marginTop="8">
                                <button id="btnInstructions" text="使用须知" w="100" h="48" textSize="14" style="Widget.AppCompat.Button.Colored" marginRight="16" />
                                <button id="btnLoadConfig" text="加载配置" w="100" h="48" textSize="14" style="Widget.AppCompat.Button.Colored" marginRight="16" />
                                <button id="btnSave" text="保存配置" w="100" h="48" textSize="14" style="Widget.AppCompat.Button.Colored" />
                            </horizontal>

                            <horizontal gravity="center" marginTop="16">
                                <button id="btnStop" text="停止" w="100" h="48" textSize="16" color="#FFFFFF" backgroundTint="#FF9AA2" />
                                <frame w="16" />
                                <button id="btnStart" text="开始" w="216" h="48" textSize="16" color="#FFFFFF" backgroundTint="#4ECDC4" />
                            </horizontal>
                        </vertical>
                    </scroll>
                </frame>
                {/* 账号信息 */}
                <frame>
                    <scroll>
                        <vertical w="*" h="*" padding="16">
                            {/* 账号设置卡片 */}
                            <card w="*" h="auto" marginBottom="12" cardCornerRadius="8" cardElevation="2">
                                <vertical padding="16">
                                    <text text="账号设置" textSize="16" textStyle="bold" />
                                    <horizontal gravity="center_vertical">
                                        <text text="切换账号：" textSize="14" w="100" marginRight="8" />
                                        <Switch id="accountSwitch" w="*" h="48"
                                            gravity="left|center" />
                                    </horizontal>
                                    {/* 识别方式选择 */}
                                    <horizontal gravity="center_vertical" marginTop="8">
                                        <text text="识别方式：" textSize="14" w="100" marginRight="8" />
                                        <button id="findAccountImage" text="图片识别" w="80" h="35" textSize="12" bg="#4CAF50" textColor="#FFFFFF" marginRight="8" gravity="center" />
                                        <button id="findAccountText" text="文字识别" w="80" h="35" textSize="12" bg="#E0E0E0" textColor="#000000" gravity="center" />
                                    </horizontal>

                                    {/* 账号方式选择 */}
                                    <horizontal gravity="center_vertical" marginTop="8">
                                        <text text="切换账号方式：" textSize="14" w="100" marginRight="8" />
                                        <button id="accountMethodEmail" text="邮箱" w="80" h="35" textSize="12" bg="#4CAF50" textColor="#FFFFFF" marginRight="8" gravity="center" />
                                        <button id="accountMethodSave" text="存档" w="80" h="35" textSize="12" bg="#E0E0E0" textColor="#000000" gravity="center" />
                                    </horizontal>

                                    {/* 账号列表显示 */}
                                    <vertical id="accountListDisplay" marginTop="8">
                                        <text text="账号列表：" textSize="14" textStyle="bold" />
                                    </vertical>
                                    {/* 邮箱账号输入框 */}
                                    <list id="AccountList" h="auto">
                                        <card w="*" h="40" margin="0 5" cardCornerRadius="5dp"
                                            cardElevation="1dp" foreground="?selectableItemBackground">
                                            <horizontal gravity="center_vertical">
                                                <frame h="*" w="10" bg="#f27272" />
                                                <vertical padding="10 8" h="auto" w="0" layout_weight="1">
                                                    <text id="title" text="{{this.title}}" textColor="#333333" textSize="16sp" maxLines="1" />
                                                </vertical>
                                                <checkbox id="done" marginLeft="4" marginRight="40" checked="{{this.done}}" />
                                            </horizontal>
                                        </card>
                                    </list>
                                    {/* 存档账号输入框 */}
                                    <list id="SaveAccountList" h="auto" visibility="gone">
                                        <card w="*" h="40" margin="0 5" cardCornerRadius="5dp"
                                            cardElevation="1dp" foreground="?selectableItemBackground">
                                            <horizontal gravity="center_vertical">
                                                <frame h="*" w="10" bg="#4CAF50" />
                                                <vertical padding="10 8" h="auto" w="0" layout_weight="1">
                                                    <text id="saveTitle" text="{{this.title}}" textColor="#333333" textSize="16sp" maxLines="1" />
                                                </vertical>
                                                <button id="loadSaveAccount" text="加载" w="40" h="25" textSize="10" bg="#2196F3" textColor="#FFFFFF" marginRight="10" gravity="center" padding="0" />
                                                <checkbox id="saveDone" marginLeft="4" marginRight="40" checked="{{this.done}}" />
                                            </horizontal>
                                        </card>
                                    </list>
                                </vertical>
                            </card>
                        </vertical>
                    </scroll>
                    <fab id="addAccount" w="auto" h="auto" src="@drawable/ic_add_black_48dp"
                        margin="8" layout_gravity="bottom|right" tint="black" backgroundTint="#7fffd4" />
                </frame>
                {/* 参数配置 */}
                <frame>
                    <scroll>
                        <vertical w="*" h="*" padding="16">

                            {/* 基础设置卡片 - 使用按钮模拟单选 */}
                            <card w="*" h="auto" marginBottom="12" cardCornerRadius="8" cardElevation="2">
                                <vertical padding="16">
                                    <text text="基础设置" textSize="16" textStyle="bold" marginBottom="16" />
                                    <text text="寻找土地方法" textSize="14" w="120" marginRight="8" />
                                    <horizontal gravity="center_vertical">
                                        <button id="methodShop" text="商店" w="80" h="35" textSize="12" bg="#4CAF50" textColor="#FFFFFF" marginRight="16" gravity="center" />
                                        <button id="methodBakery" text="面包房" w="80" h="35" textSize="12" bg="#E0E0E0" textColor="#000000" gravity="center" />
                                    </horizontal>

                                    <text text="截图权限点击坐标" textSize="14" w="120" marginRight="8" marginTop="16" />
                                    <vertical>
                                        <horizontal gravity="center_vertical" marginBottom="8">
                                            <text text="坐标1 - x:" textSize="14" marginRight="4" />
                                            <input id="screenshotX1" hint="X坐标" w="60" h="40" textSize="14" bg="#FFFFFF" inputType="number" marginRight="8" />
                                            <text text="y:" textSize="14" marginRight="4" />
                                            <input id="screenshotY1" hint="Y坐标" w="60" h="40" textSize="14" bg="#FFFFFF" inputType="number" />
                                        </horizontal>
                                        <horizontal gravity="center_vertical" marginBottom="8">
                                            <text text="坐标2 - x:" textSize="14" marginRight="4" />
                                            <input id="screenshotX2" hint="X坐标" w="60" h="40" textSize="14" bg="#FFFFFF" inputType="number" marginRight="8" />
                                            <text text="y:" textSize="14" marginRight="4" />
                                            <input id="screenshotY2" hint="Y坐标" w="60" h="40" textSize="14" bg="#FFFFFF" inputType="number" />
                                        </horizontal>
                                        <horizontal gravity="center_vertical">
                                            <text text="坐标3 - x:" textSize="14" marginRight="4" />
                                            <input id="screenshotX3" hint="X坐标" w="60" h="40" textSize="14" bg="#FFFFFF" inputType="number" marginRight="8" />
                                            <text text="y:" textSize="14" marginRight="4" />
                                            <input id="screenshotY3" hint="Y坐标" w="60" h="40" textSize="14" bg="#FFFFFF" inputType="number" />
                                        </horizontal>
                                    </vertical>
                                </vertical>
                            </card>



                            {/* 仓库升仓时间卡片 */}
                            <card w="*" h="auto" marginBottom="12" cardCornerRadius="8" cardElevation="2">
                                <vertical padding="16">
                                    <text text="仓库设置" textSize="16" textStyle="bold" />
                                    {/* 仓库升仓 */}
                                    <horizontal gravity="center_vertical">
                                        <text text="自动升仓" textSize="14" w="120" marginRight="8" />
                                        <Switch id="isShengcang" w="*" h="48" gravity="left|center" />
                                    </horizontal>
                                    <horizontal gravity="center_vertical">
                                        <text text="升仓间隔时间" textSize="14" w="120" marginRight="8" />
                                        <input id="shengcangTime" hint="60" w="120" h="40" textSize="14" bg="#FFFFFF" inputType="number" marginRight="8" />
                                        <text text="分钟" textSize="14" w="120" marginRight="8" />
                                    </horizontal>
                                    <horizontal gravity="center_vertical">
                                        <text text="仓库统计" textSize="14" w="120" marginRight="8" />
                                        <Switch id="isCangkuStatistics" w="*" h="48" gravity="left|center" />
                                    </horizontal>
                                    <horizontal gravity="center_vertical">
                                        <text text="仓库统计间隔时间" textSize="14" w="120" marginRight="8" />
                                        <input id="cangkuStatisticsTime" hint="300" w="120" h="40" textSize="14" bg="#FFFFFF" inputType="number" marginRight="8" />
                                        <text text="分钟" textSize="14" w="120" marginRight="8" />
                                    </horizontal>
                                    <horizontal gravity="center_vertical">
                                        <text text="仓库统计页数" textSize="14" w="120" marginRight="8" />
                                        <input id="cangkuStatisticsPage" hint="2" w="120" h="40" textSize="14" bg="#FFFFFF" inputType="number" marginRight="8" />
                                        <text text="页" textSize="14" w="120" marginRight="8" />
                                    </horizontal>
                                    <horizontal gravity="center_vertical">
                                        <text text="推送方式" textSize="14" w="100" marginRight="8" />
                                        <spinner id="serverPlatform" entries="Pushplus推送加|Server酱|WxPusher"
                                            w="*" textSize="14" h="48" bg="#FFFFFF" />
                                    </horizontal>
                                    <horizontal gravity="center_vertical" padding="8">
                                        <text text="token" textSize="14" w="60" marginRight="12" textColor="#333333" />
                                        <img id="eyeIcon" w="20dp" h="20dp" src="data:image/png;base64,{{icon.visibility_off}}" />
                                        <input id="tokenInput" password="true" hint="切勿泄漏token" w="*" textSize="14" h="auto" bg="#FFFFFF" padding="8" marginRight="8" gravity="center_vertical" visibility="visible" />
                                        <input id="tokenInputPlain" password="false" hint="切勿泄漏token" w="*" textSize="14" h="auto" bg="#FFFFFF" padding="8" gravity="center_vertical" visibility="gone" />
                                    </horizontal>
                                </vertical>
                            </card>

                            {/* 坐标偏移卡片 */}
                            <card w="*" h="auto" marginBottom="12" cardCornerRadius="8" cardElevation="2">
                                <vertical padding="16">
                                    <text text="坐标偏移设置" textSize="16" textStyle="bold" />

                                    {/* 土地坐标偏移 */}
                                    <horizontal gravity="center_vertical">
                                        <text text="土地坐标偏移：" textSize="14" w="120" marginRight="8" />
                                        <input id="landOffsetX" hint="X:60" w="60" textSize="14" h="40" bg="#FFFFFF" inputType="numberSigned|numberDecimal" marginRight="8" />
                                        <input id="landOffsetY" hint="Y:-30" w="60" textSize="14" h="40" bg="#FFFFFF" inputType="numberSigned|numberDecimal" />
                                    </horizontal>

                                    {/* 商店坐标偏移 */}
                                    <horizontal gravity="center_vertical">
                                        <text text="商店坐标偏移：" textSize="14" w="120" marginRight="8" />
                                        <input id="shopOffsetX" hint="X:-60" w="60" textSize="14" h="40" bg="#FFFFFF" inputType="numberSigned|numberDecimal" marginRight="8" />
                                        <input id="shopOffsetY" hint="Y:-50" w="60" textSize="14" h="40" bg="#FFFFFF" inputType="numberSigned|numberDecimal" />
                                    </horizontal>
                                    {/* 收割坐标偏移 */}
                                    <horizontal gravity="center_vertical">
                                        <text text="收割横向偏移：" textSize="14" w="120" marginRight="8" />
                                        <input id="harvestX" hint="8" w="60" textSize="14" h="40" bg="#FFFFFF" inputType="numberDecimal" marginRight="8" />
                                        <text text="格" textSize="14" w="120" marginRight="8" />
                                    </horizontal>
                                    <horizontal gravity="center_vertical">
                                        <text text="收割纵向偏移：" textSize="14" w="120" marginRight="8" />
                                        <input id="harvestY" hint="1.5" w="60" textSize="14" h="40" bg="#FFFFFF" inputType="numberDecimal" marginRight="8" />
                                        <text text="格" textSize="14" w="120" marginRight="8" />
                                    </horizontal>
                                    <horizontal gravity="center_vertical">
                                        <text text="收割重复次数：" textSize="14" w="120" marginRight="8" />
                                        <input id="harvestRepeat" hint="3" w="60" textSize="14" h="40" bg="#FFFFFF" inputType="number" marginRight="8" />
                                        <text text="次" textSize="14" w="120" marginRight="8" />
                                    </horizontal>
                                    <horizontal gravity="center_vertical">
                                        <text text="收割操作用时：" textSize="14" w="120" marginRight="8" />
                                        <input id="harvestTime" hint="5" w="60" textSize="14" h="40" bg="#FFFFFF" inputType="number" marginRight="8" />
                                        <text text="秒" textSize="14" w="120" marginRight="8" />
                                    </horizontal>
                                    {/* 初始土地偏移 */}
                                    <horizontal gravity="center_vertical">
                                        <text text="初始土地偏移：" textSize="14" w="120" marginRight="8" />
                                        <input id="firstlandX" hint="X:20" w="60" textSize="14" h="40" bg="#FFFFFF" inputType="numberSigned|numberDecimal" marginRight="8" />
                                        <input id="firstlandY" hint="Y:40" w="60" textSize="14" h="40" bg="#FFFFFF" inputType="numberSigned|numberDecimal" />
                                    </horizontal>
                                    <horizontal gravity="center_vertical">
                                        <text text="收割两指间距：" textSize="14" w="120" marginRight="8" />
                                        <input id="distance" hint="75" w="60" textSize="14" h="40" bg="#FFFFFF" inputType="numberSigned|numberDecimal" marginRight="8" />

                                    </horizontal>
                                    {/* 仓库坐标偏移 */}
                                    <horizontal gravity="center_vertical">
                                        <text text="粮仓坐标偏移：" textSize="14" w="120" marginRight="8" />
                                        <input id="liangcangOffsetX" hint="X:240" w="60" textSize="14" h="40" bg="#FFFFFF" inputType="numberSigned|numberDecimal" marginRight="8" />
                                        <input id="liangcangOffsetY" hint="Y:0" w="60" textSize="14" h="40" bg="#FFFFFF" inputType="numberSigned|numberDecimal" />
                                    </horizontal>
                                    <horizontal gravity="center_vertical">
                                        <text text="货仓坐标偏移：" textSize="14" w="120" marginRight="8" />
                                        <input id="huocangOffsetX" hint="X:340" w="60" textSize="14" h="40" bg="#FFFFFF" inputType="numberSigned|numberDecimal" marginRight="8" />
                                        <input id="huocangOffsetY" hint="Y:-45" w="60" textSize="14" h="40" bg="#FFFFFF" inputType="numberSigned|numberDecimal" />
                                    </horizontal>
                                    <horizontal gravity="center_vertical">
                                        <text text="悬浮窗坐标：" textSize="14" w="120" marginRight="8" />
                                        <input id="showTextX" hint="X:0(百分比)" w="60" textSize="14" h="40" bg="#FFFFFF" inputType="numberDecimal|numberSigned" marginRight="8" />
                                        <input id="showTextY" hint="Y:0.65(百分比)" w="60" textSize="14" h="40" bg="#FFFFFF" inputType="numberDecimal|numberSigned" />
                                    </horizontal>
                                </vertical>
                            </card>

                            {/* 照片路径卡片 */}
                            <card w="*" h="auto" marginBottom="16" cardCornerRadius="8" cardElevation="2">
                                <vertical padding="16">
                                    <text text="路径设置" textSize="16" textStyle="bold" marginBottom="8" />
                                    <horizontal gravity="center_vertical">
                                        <text text="照片文件夹路径：" textSize="14" w="100" marginRight="8" />
                                        <input id="photoPath" text="./res/pictures.1280_720" w="*" textSize="14" h="48" bg="#FFFFFF" />
                                    </horizontal>
                                </vertical>
                            </card>
                        </vertical>
                    </scroll>
                </frame>
                {/* 更多 */}
                <frame>
                    <scroll>
                        <vertical w="*" h="*" padding="16">

                            {/* 硬件信息卡片 */}
                            <card w="*" h="auto" marginBottom="16" cardCornerRadius="8" cardElevation="2">
                                <vertical padding="16">
                                    <text text="主题颜色" textSize="16" textStyle="bold" marginBottom="8" />

                                    {/* 主题颜色 */}
                                    <horizontal gravity="center_vertical" marginBottom="8">
                                        <text text="随机颜色：" textSize="14" w="100" marginRight="8" />
                                        <Switch id="randomColor" checked="{{false}}" w="*" />
                                    </horizontal>
                                    <horizontal gravity="center_vertical" marginBottom="8">
                                        <text text="固定颜色：" textSize="14" w="100" marginRight="8" />
                                        <spinner id="themeColor" entries="碧玉青|落日橙|翠竹绿|晴空蓝|胭脂粉|朱砂红|湖水蓝|柠檬黄|咖啡棕|烟雨灰"
                                            w="*" textSize="14" textColor="{{color}}" h="48" bg="#FFFFFF" />
                                    </horizontal>


                                </vertical>
                            </card>

                            {/* 设备信息卡片 */}
                            <card w="*" h="auto" marginBottom="16" cardCornerRadius="8" cardElevation="2">
                                <vertical padding="16">
                                    <text text="设备信息" textSize="16" textStyle="bold" marginBottom="8" />

                                    {/* 屏幕分辨率 */}
                                    <horizontal gravity="center_vertical" marginBottom="8">
                                        <text text="分辨率：" textSize="14" w="100" marginRight="8" />
                                        <text id="screenResolution" text=""
                                            textSize="14" w="*" />
                                    </horizontal>

                                    {/* 屏幕密度 */}
                                    <horizontal gravity="center_vertical" marginBottom="8">
                                        <text text="DPI：" textSize="14" w="100" marginRight="8" />
                                        <text id="screenDensity" text="{{context.getResources().getDisplayMetrics().densityDpi}}"
                                            textSize="14" w="*" />
                                    </horizontal>

                                    {/* Root权限 */}
                                    <horizontal gravity="center_vertical" marginBottom="8">
                                        <text text="Root权限：" textSize="14" w="100" marginRight="8" />
                                        <text id="rootStatus" text="{{checkRoot() ? '已获取' : '未获取'}}"
                                            textSize="14" w="*" textColor="{{checkRoot() ? '#4CAF50' : '#F44336'}}" />
                                    </horizontal>

                                    {/* 品牌型号 */}
                                    <horizontal gravity="center_vertical" marginBottom="8">
                                        <text text="设备型号：" textSize="14" w="100" marginRight="8" />
                                        <text id="deviceModel" text=""
                                            textSize="14" w="*" />
                                    </horizontal>

                                    {/* Android版本 */}
                                    <horizontal gravity="center_vertical" marginBottom="8">
                                        <text text="系统版本：" textSize="14" w="100" marginRight="8" />
                                        <text id="androidVersion" text="Android {{device.release}}"
                                            textSize="14" w="*" />
                                    </horizontal>

                                </vertical>
                            </card>

                            {/* 分辨率设置卡片 */}
                            <card w="*" h="auto" marginBottom="16" cardCornerRadius="8" cardElevation="2">
                                <vertical padding="16">
                                    <text text="分辨率设置" textSize="16" textStyle="bold" marginBottom="8" />
                                    <horizontal gravity="center_vertical" marginBottom="8" padding="8">
                                        <button id="restoreResolutionBtn" text="恢复分辨率" textSize="13" w="100" marginRight="16" bg="#C8E6C9" textColor="#388E3C" style="Widget.AppCompat.Button.Colored" />
                                        <button id="modifyResolutionBtn" text="修改分辨率" textSize="13" w="100" marginRight="8" bg="#BBDEFB" textColor="#1976D2" style="Widget.AppCompat.Button.Colored" />
                                    </horizontal>
                                </vertical>
                            </card>
                        </vertical>
                    </scroll>
                </frame>
            </viewpager>
        </vertical>
        <vertical layout_gravity="left" bg="#ffffff" w="280">
            <img w="280" h="200" scaleType="fitXY" src="file://{{currentPath}}/res/images/sidebar.png" />
            <list id="menu">
                <horizontal bg="?selectableItemBackground" w="*">
                    <img id="menuIcon" w="50" h="50" padding="16" src="{{this.icon}}" tint="{{color}}" />
                    <text textColor="black" textSize="15sp" text="{{this.title}}" layout_gravity="center" />
                </horizontal>
            </list>
        </vertical>
    </drawer>
);

//设置滑动页面的标题
ui.viewpager.setTitles(["首页", "账号信息", "参数配置", "更多"]);
//让滑动页面和标签栏联动
ui.tabs.setupWithViewPager(ui.viewpager);

// 手动设置屏幕分辨率
ui.screenResolution.setText(device.width + "×" + device.height);

// 手动设置设备型号
ui.deviceModel.setText(device.brand + " " + device.model);


//创建选项菜单(右上角)
ui.emitter.on("create_options_menu", menu => {
    menu.add("开始");
    menu.add("关于");
    menu.add("日志");
    menu.add("调试");
});
//监听选项菜单点击
ui.emitter.on("options_item_selected", (e, item) => {
    switch (item.getTitle()) {
        case "开始":
            startButton()
            break;
        case "关于":
            showAboutDialog();
            break;
        case "日志":
            showLogDialog();
            break;
        case "调试":
            log("当前配置:", loadConfig());
            // log(typeof config.harvestX)
            break;
    }
    e.consumed = true;
});

function downloadZip_dialogs() {
    // 弹出选择下载源的选项弹窗
    let updateSource = "gitee"; // 默认更新源
    dialogs.build({
        title: "选择下载源",
        customView: ui.inflate(
            <vertical padding="16">
                <text textSize="14sp" textColor="#333333">请选择下载源：</text>
                <radio id="giteeRadio" text="Gitee (国内源)" checked="true" group="updateSourceGroup" marginTop="16" />
                <radio id="githubRadio" text="GitHub (国外源)" group="updateSourceGroup" marginTop="8" />
            </vertical>
        ),
        positive: "开始下载",
        negative: "取消"
    }).on("show", (dialog) => {
        // 单选框选择事件
        dialog.getView().githubRadio.on("check", (checked) => {
            if (checked) {
                updateSource = "github";
                dialog.getView().giteeRadio.setChecked(false);
            }
        });

        dialog.getView().giteeRadio.on("check", (checked) => {
            if (checked) {
                updateSource = "gitee";
                dialog.getView().githubRadio.setChecked(false);
            }
        });
    }).on("positive", () => {
        // 执行全量更新
        threads.start(() => {
            try {
                // 发送HTTP请求获取最新版本信息
                let apiUrl = "https://gitee.com/ToughNobody/Hayday-Assistant/raw/main/versionV2.json";
                log("请求API地址: " + apiUrl);
                let response = http.get(apiUrl, {
                    headers: {
                        "Accept": "application/json"
                    }
                });
                log("HTTP响应状态码: " + response.statusCode);

                let result = response.body.json();

                // 检查result对象和version字段是否存在
                if (!result || !result.version) {
                    log("错误: 无法获取版本信息，result对象或version为空");
                    if (!silence) { toast("检查更新失败: 无法获取版本信息") }
                    return;
                }

                // 加载热更新模块
                let hotUpdate = require("./hot_update.js");

                if (updateSource == "gitee") {
                    downloadUrl = result.zip_url_gitee;
                } else if (updateSource == "github") {
                    downloadUrl = result.zip_url_github;
                }

                // 从JSON中获取zip_name字段
                let fileName = result.zip_name;

                // 下载压缩包
                let success = hotUpdate.downloadZipFile(downloadUrl, "/sdcard/Download/", fileName);

                if (success) {
                    toastLog("更新成功，即将重启应用...");
                    engines.stopAll();
                    events.on("exit", function () {
                        engines.execScriptFile(files.cwd().substring(0, files.cwd().lastIndexOf("/")) + "/" + fileName.replace(".zip", "") + "/main.js");
                    });
                } else {
                    toastLog("更新失败，请重试");
                }
            } catch (e) {
                toastLog("热更新失败: " + e.message);
            }
        });
    }).show();
}

// 显示关于对话框函数
function showAboutDialog() {
    dialogs.build({
        title: "关于",
        content: "脚本名称：卡通农场小助手\n" +
            "版本：" + getAppVersion() + "\n" +
            "作者：ToughNobody\n\n" +
            "希望对你有帮助！",
        positive: "确定",
        negative: "下载压缩包",
        neutral: "检查更新"
    }).on("neutral", () => {
        checkForUpdates();
    }).on("negative", () => {
        downloadZip_dialogs();
    }).show();
}

// 检查更新函数
function checkForUpdates(silence = false) {
    log("============= 开始检查更新 =============");
    // toast("正在检查更新...");
    threads.start(() => {
        try {
            // 读取project.json文件获取版本信息
            let projectConfig = files.read('./project.json');
            let projectData = JSON.parse(projectConfig);
            log("当前版本: " + projectData.versionName);
            log("当前版本代码: " + projectData.versionCode);
            // toast("当前版本: " + currentVersion);

            // 发送HTTP请求获取最新版本号
            let apiUrl = "https://gitee.com/ToughNobody/Hayday-Assistant/raw/main/versionV2.json";
            log("请求API地址: " + apiUrl);
            let response = http.get(apiUrl, {
                headers: {
                    "Accept": "application/json"
                }
            });
            log("HTTP响应状态码: " + response.statusCode);
            let responseBodyString = "";
            if (!silence) {
                responseBodyString = response.body.string();
                log("HTTP响应内容: " + responseBodyString);
            }

            if (response.statusCode == 200) {
                let result;
                if (!silence) {
                    // 如果已经读取了响应体字符串，则解析该字符串
                    result = JSON.parse(responseBodyString);
                } else {
                    // 否则直接从响应体获取JSON
                    result = response.body.json();
                }

                // 检查result对象和version字段是否存在
                if (!result || !result.version) {
                    log("错误: 无法获取版本信息，result对象或version为空");
                    if (!silence) { toast("检查更新失败: 无法获取版本信息") }
                    return;
                }

                let latestVersion = result.version;
                log("最新版本: " + latestVersion);

                // 比较版本号
                let compareResult = compareVersions(projectData.versionName, latestVersion);
                log("版本比较结果: " + compareResult + " (0=相同, <0=旧版本, >0=新版本)");

                ui.run(() => {
                    if (compareResult < 0) {
                        // 有新版本
                        let updateSource = "gitee"; // 默认更新源
                        dialogs.build({
                            title: "发现新版本",
                            customView: ui.inflate(
                                <vertical padding="16">
                                    <text id="versionInfo" textSize="14sp" textColor="#333333" marginTop="8" />
                                    <text id="updateContent" textSize="14sp" textColor="#333333" marginTop="16" />
                                    <text id="giteeResult" textSize="12sp" textColor="#666666" marginTop="8" text="Gitee: 未检测" />
                                    <text id="githubResult" textSize="12sp" textColor="#666666" marginTop="4" text="Github: 未检测" />
                                    <button id="connectivityBtn" text="检测连通性" textSize="12sp" w="auto" h="auto" marginTop="16" />
                                    <text textSize="14sp" textColor="#333333" marginTop="16">选择更新源：</text>
                                    <radio id="giteeRadio" text="Gitee (国内源)" checked="true" group="updateSourceGroup" />
                                    <radio id="githubRadio" text="GitHub (国外源)" group="updateSourceGroup" />
                                </vertical>
                            ),
                            positive: "立即更新",
                            negative: "下载压缩包",
                            neutral: "稍后再说"
                        }).on("show", (dialog) => {
                            // 设置版本信息
                            let versionInfo = "当前版本: " + projectData.versionName + "\n" +
                                "最新版本: " + latestVersion;
                            dialog.getView().versionInfo.setText(versionInfo);

                            // 设置更新内容
                            let updateContent = "更新内容: " + (result.description || "无更新说明");
                            dialog.getView().updateContent.setText(updateContent);

                            // 单选框选择事件
                            dialog.getView().githubRadio.on("check", (checked) => {
                                if (checked) {
                                    updateSource = "github";
                                    dialog.getView().giteeRadio.setChecked(false);
                                }
                            });

                            dialog.getView().giteeRadio.on("check", (checked) => {
                                if (checked) {
                                    updateSource = "gitee";
                                    dialog.getView().githubRadio.setChecked(false);
                                }
                            });

                            // 检测连通性按钮点击事件
                            dialog.getView().connectivityBtn.on("click", () => {
                                // 清除之前的线程，避免重复检测
                                if (typeof giteeThread !== 'undefined' && giteeThread.isAlive()) {
                                    giteeThread.interrupt();
                                }
                                if (typeof githubThread !== 'undefined' && githubThread.isAlive()) {
                                    githubThread.interrupt();
                                }

                                // 点击后立即显示检测中状态
                                dialog.getView().giteeResult.setText("Gitee: 检测中");
                                dialog.getView().giteeResult.setTextColor(colors.parseColor("#666666"));
                                dialog.getView().githubResult.setText("Github: 检测中");
                                dialog.getView().githubResult.setTextColor(colors.parseColor("#666666"));

                                // 检测Gitee连通性
                                let giteeThread = threads.start(function () {
                                    let startTime = new Date().getTime();
                                    let isTimeout = false;

                                    // 设置10秒超时
                                    let timeoutThread = threads.start(function () {
                                        sleep(10000);
                                        if (!isTimeout) {
                                            isTimeout = true;
                                            ui.run(() => {
                                                dialog.getView().giteeResult.setText("Gitee检测超时");
                                                dialog.getView().giteeResult.setTextColor(colors.parseColor("#FF0000")); // 红色
                                            });
                                        }
                                    });

                                    try {
                                        let response = http.get("https://gitee.com/ToughNobody/Hayday-Assistant/raw/main/versionV2.json");
                                        if (isTimeout) return; // 如果已经超时，直接返回

                                        let endTime = new Date().getTime();
                                        let duration = endTime - startTime;
                                        isTimeout = true; // 标记已完成，防止超时线程继续执行
                                        timeoutThread.interrupt(); // 中断超时线程

                                        ui.run(() => {
                                            if (response.statusCode == 200) {
                                                let text = "Gitee连接成功，耗时: " + duration + "ms";
                                                dialog.getView().giteeResult.setText(text);
                                                // 根据耗时设置颜色：超过1000ms为橙色，否则绿色
                                                if (duration > 1000) {
                                                    dialog.getView().giteeResult.setTextColor(colors.parseColor("#FFA500")); // 橙色
                                                } else {
                                                    dialog.getView().giteeResult.setTextColor(colors.parseColor("#008000")); // 绿色
                                                }
                                            } else {
                                                dialog.getView().giteeResult.setText("Gitee连接失败，状态码: " + response.statusCode + "，耗时: " + duration + "ms");
                                                dialog.getView().giteeResult.setTextColor(colors.parseColor("#FF0000")); // 红色
                                            }
                                        });
                                    } catch (e) {
                                        if (isTimeout) return; // 如果已经超时，直接返回

                                        let endTime = new Date().getTime();
                                        let duration = endTime - startTime;
                                        isTimeout = true; // 标记已完成，防止超时线程继续执行
                                        timeoutThread.interrupt(); // 中断超时线程

                                        ui.run(() => {
                                            dialog.getView().giteeResult.setText("Gitee连接出错: " + e.message + "，耗时: " + duration + "ms");
                                            dialog.getView().giteeResult.setTextColor(colors.parseColor("#FF0000")); // 红色
                                        });
                                    }
                                });

                                // 检测Github连通性
                                let githubThread = threads.start(function () {
                                    let startTime = new Date().getTime();
                                    let isTimeout = false;

                                    // 设置10秒超时
                                    let timeoutThread = threads.start(function () {
                                        sleep(10000);
                                        if (!isTimeout) {
                                            isTimeout = true;
                                            ui.run(() => {
                                                dialog.getView().githubResult.setText("Github检测超时");
                                                dialog.getView().githubResult.setTextColor(colors.parseColor("#FF0000")); // 红色
                                            });
                                        }
                                    });

                                    try {
                                        let response = http.get("https://github.com/ToughNobody/Hayday-Assistant/raw/refs/heads/main/versionV2.json");
                                        if (isTimeout) return; // 如果已经超时，直接返回

                                        let endTime = new Date().getTime();
                                        let duration = endTime - startTime;
                                        isTimeout = true; // 标记已完成，防止超时线程继续执行
                                        timeoutThread.interrupt(); // 中断超时线程

                                        ui.run(() => {
                                            if (response.statusCode == 200) {
                                                let text = "Github连接成功，耗时: " + duration + "ms";
                                                dialog.getView().githubResult.setText(text);
                                                // 根据耗时设置颜色：超过1000ms为橙色，否则绿色
                                                if (duration > 1000) {
                                                    dialog.getView().githubResult.setTextColor(colors.parseColor("#FFA500")); // 橙色
                                                } else {
                                                    dialog.getView().githubResult.setTextColor(colors.parseColor("#008000")); // 绿色
                                                }
                                            } else {
                                                dialog.getView().githubResult.setText("Github连接失败，状态码: " + response.statusCode + "，耗时: " + duration + "ms");
                                                dialog.getView().githubResult.setTextColor(colors.parseColor("#FF0000")); // 红色
                                            }
                                        });
                                    } catch (e) {
                                        if (isTimeout) return; // 如果已经超时，直接返回

                                        let endTime = new Date().getTime();
                                        let duration = endTime - startTime;
                                        isTimeout = true; // 标记已完成，防止超时线程继续执行
                                        timeoutThread.interrupt(); // 中断超时线程

                                        ui.run(() => {
                                            dialog.getView().githubResult.setText("Github连接出错: " + e.message + "，耗时: " + duration + "ms");
                                            dialog.getView().githubResult.setTextColor(colors.parseColor("#FF0000")); // 红色
                                        });
                                    }
                                });
                            });
                        }).on("positive", () => {
                            // 调用热更新模块 - 立即更新（增量更新）
                            threads.start(() => {
                                try {
                                    // 加载热更新模块
                                    let hotUpdate = require("./hot_update.js");

                                    // 初始化热更新
                                    hotUpdate.init({
                                        version: result.version,
                                        versionCode: projectData.versionCode,
                                        files: result.files,
                                        description: result.description,
                                        updateSource: updateSource // 根据选择的源更新
                                    });

                                    // 执行增量更新
                                    let success = hotUpdate.doIncrementalUpdate();

                                    if (success) {
                                        toastLog("更新成功，即将重启应用...");
                                        engines.stopAll();
                                        events.on("exit", function () {
                                            engines.execScriptFile(engines.myEngine().cwd() + "/main.js");
                                        });
                                    } else {
                                        toastLog("更新失败，请重试");
                                    }
                                } catch (e) {
                                    toastLog("热更新失败: " + e.message);
                                }
                            });
                        }).on("negative", () => {
                            downloadZip_dialogs();
                        }).on("neutral", () => {
                            // 稍后再说，不执行任何操作，直接关闭对话框
                        }).show();
                    } else if (!silence && compareResult > 0) {
                        // 当前版本更新（开发中）
                        toastLog("你的版本超过了全球100%的用户！作者得在你这更新版本" + projectData.versionName + " > " + latestVersion, "long");
                    } else if (!silence && compareResult == 0) {
                        // 没有新版本
                        toastLog("当前已是最新版本: " + projectData.versionName);
                    }
                });

            } else {
                toastLog("检查更新失败: HTTP状态码 " + response.statusCode);
            }
        } catch (e) {
            toastLog("检查更新失败: " + e.message);
        }
    });
}

// 版本号比较函数
function compareVersions(version1, version2) {
    // 将版本号拆分为数组
    let v1Parts = version1.split(".").map(Number);
    let v2Parts = version2.split(".").map(Number);

    // 比较每个部分
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
        let v1Part = v1Parts[i] || 0;
        let v2Part = v2Parts[i] || 0;

        if (v1Part > v2Part) return 1;
        if (v1Part < v2Part) return -1;
    }

    return 0; // 版本号相同
}

activity.setSupportActionBar(ui.toolbar);


// 监听randomColor开关
ui.randomColor.on("check", (checked) => {
    if (checked) {
        // 如果打开随机颜色，则随机选择一个颜色
        color = colorLibrary[Math.floor(Math.random() * colorLibrary.length)];
        ui.statusBarColor(color);
        ui.appbar.setBackgroundColor(android.graphics.Color.parseColor(color));
        // 更新按钮的选中状态颜色
        updateButtonColors();
    } else {
        // 如果关闭随机颜色，则使用当前选择的颜色
        // 使用getSelectedItem方法获取当前选择的文本
        const selectedItem = ui.themeColor.getSelectedItem();
        const colorNames = ["碧玉青", "落日橙", "翠竹绿", "晴空蓝", "胭脂粉", "朱砂红", "湖水蓝", "柠檬黄", "咖啡棕", "烟雨灰"];
        const selectedIndex = colorNames.indexOf(selectedItem);
        if (selectedIndex >= 0) {
            color = colorLibrary[selectedIndex];
            ui.statusBarColor(color);
            ui.appbar.setBackgroundColor(android.graphics.Color.parseColor(color));
            // 更新按钮的选中状态颜色
            updateButtonColors();
        }
    }
});

// 更新按钮颜色函数
function updateButtonColors() {
    setAccountMethod(config.accountMethod);
    setFindAccountMethod(config.findAccountMethod);
    setLandMethod(config.landFindMethod);
    // 更新菜单图标颜色
    ui.menu.adapter.notifyDataSetChanged();
}
//
ui.statusBarColor(color)

//让工具栏左上角可以打开侧拉菜单
ui.toolbar.setupWithDrawer(ui.drawer);

ui.menu.setDataSource([{
    title: "赏",
    icon: "@drawable/ic_thumb_up_black_48dp"
},
{
    title: "群",
    icon: "@drawable/ic_group_black_48dp"
},
{
    title: "谢",
    icon: "@drawable/ic_favorite_black_48dp"
},
{
    title: "退出",
    icon: "@drawable/ic_exit_to_app_black_48dp"
}
]);

// 绑定菜单项，用于更新图标颜色
ui.menu.on('item_bind', function (itemView, itemHolder) {
    // 更新菜单图标颜色
    itemView.menuIcon.attr("tint", color);
});

ui.menu.on("item_click", item => {
    switch (item.title) {
        case "赏":
            dialogs.build({
                title: "🌟投喂作者🌟 ",
                content: "真的吗真的吗真的吗\n" +
                    "(ฅ´ω`ฅ)",
                positive: "真的😍",
                neutral: "逗你玩😝",
            }).on("positive", () => {
                toast("您的支持是我最大的动力！❤️")
                // 创建悬浮窗显示二维码
                let floatWindow = floaty.window(
                    <vertical padding="10">
                        <card w="*" h="*" cardCornerRadius="32" cardElevation="2" gravity="center">
                            <vertical padding="8" bg="#afe2a7">
                                <text text="感谢您的支持！" textSize="18" textStyle="bold" textColor="#333333" gravity="center" marginBottom="12" />
                                <img src="file://{{currentPath}}/res/images/qrcode_wechat_reward.jpg" w="260" h="260" scaleType="fitXY" />
                                <horizontal gravity="center" marginTop="12">
                                    <button id="closeBtn" text="关闭" style="Widget.AppCompat.Button.Colored" textColor="#000000" w="120" marginRight="10" />
                                    <button id="loveBtn" text="爱发电链接🔗" style="Widget.AppCompat.Button.Colored" textColor="#000000" w="120" marginRight="10" />
                                </horizontal>
                            </vertical>
                        </card>
                    </vertical>
                );

                // 设置悬浮窗位置，更靠左上方
                floatWindow.setPosition(device.width / 10, device.height / 5);

                // 爱发电按钮点击事件
                floatWindow.loveBtn.on("click", () => {
                    app.openUrl("https://afdian.com/a/ToughNobody");
                    floatWindow.close();
                });

                // 关闭按钮点击事件
                floatWindow.closeBtn.on("click", () => {
                    floatWindow.close();
                });


            }).on("neutral", () => {
                toast("我哭死！😭");
            }).show();
            break;
        case "群":
            dialogs.build({
                title: "👥 加入交流群 👥",
                content: "想要加入我们的QQ交流群吗？\n这里有更多资源和帮助！\n群号:933276299",
                positive: "立即加入 🚀",
                negative: "复制群号",
                neutral: "再想想"
            }).on("positive", () => {
                app.openUrl("https://qm.qq.com/q/yfhVwFL3Zm");
            }).on("negative", () => {
                setClip("933276299");
            }).on("neutral", () => {
                // toast("没关系，随时欢迎加入！😊");
            }).show();
            break;
        case "谢":
            dialogs.build({
                title: "致谢🙏",
                content: ""
                    + "\n",
                positive: "确定",
                negative: "",
                neutral: ""
            }).on("positive", () => {

            }).on("negative", () => {

            }).on("neutral", () => {

            }).show();
            break;
        case "退出":
            stopOtherEngines(true);
            break;

    }
})

// 显示日志对话框函数
function showLogDialog() {
    // 获取所有日志文件
    let logFiles = [];
    try {
        logFiles = files.listDir(logDir, function (name) {
            return name.endsWith(".txt") && files.isFile(files.join(logDir, name));
        });
    } catch (e) {
        toastLog("获取日志文件失败: " + e);
        return;
    }
    let displayItems = logFiles.map(file => "📄 " + file);

    // 创建单选列表对话框
    let selectedIndex = -1; // 当前选中的文件索引
    let dialog = dialogs.build({
        title: "应用日志 (" + logFiles.length + "个文件)",
        items: displayItems,
        itemsSelectMode: "select", // 使用单选模式
        positive: "打开文件",      // 按钮1：打开选中的日志文件
        negative: "退出",         // 按钮2：退出对话框
        neutral: "清空日志",      // 按钮3：清空日志文件夹
        cancelable: true,         // 允许点击外部关闭
        autoDismiss: false        // 关键：点击项目不自动关闭对话框
    }).on("positive", () => {
        // 打开选中的日志文件
        if (selectedIndex === -1) {
            toast("请先选择一个日志文件");
            return;
        }
        try {
            const filePath = files.join(logDir, logFiles[selectedIndex]);
            app.viewFile(filePath); // 打开文件
        } catch (e) {
            toastLog("打开文件失败: " + e);
        }
    }).on("item_select", (index) => {
        // 记录用户选择的文件索引
        selectedIndex = index;
    }).on("neutral", () => {
        // 清空日志文件夹
        dialogs.confirm("确定要清空日志文件夹吗？", "这将删除所有日志文件", (confirmed) => {
            if (confirmed) {
                try {
                    // 删除所有日志文件
                    logFiles.forEach(file => {
                        files.remove(files.join(logDir, file));
                    });

                    // 更新对话框状态
                    dialog.setItems([]); // 清空列表
                    dialog.setTitle("应用日志 (0个文件)");
                    toast("日志文件夹已清空");

                    // 重置选择状态
                    selectedIndex = -1;
                    logFiles = [];
                } catch (e) {
                    toastLog("清空失败: " + e);
                }
            }
        });
    }).on("negative", () => {
        // 添加退出按钮的处理
        dialog.dismiss();
    }).show();
}

//修改分辨率
ui.restoreResolutionBtn.on("click", () => {
    //检查shizuku是否可用
    if (!shizuku.isAlive()) {
        toast("Shizuku未启动，请先启动Shizuku");
        return;
    }
    shizuku("wm size reset")
    shizuku("wm density reset")
})

ui.modifyResolutionBtn.on("click", () => {
    //检查shizuku是否可用
    if (!shizuku.isAlive()) {
        toast("Shizuku未启动，请先启动Shizuku");
        return;
    }
    let modifyResolutionBtn_customView = <vertical padding="20dp">
        <text textSize="16sp" margin="1dp">修改后部分设备需重启</text>
        <horizontal margin="6dp">
            <text textSize="16sp" margin="1dp">宽度：</text>
            <input id="modifyResolutionBtn_width" inputType="number" text="720" margin="1dp" maxLength="4" />
            <text textSize="16sp" margin="1dp">高度：</text>
            <input id="modifyResolutionBtn_height" inputType="number" text="1280" margin="1dp" maxLength="4" />
        </horizontal>
        <horizontal margin="6dp">
            <text textSize="16sp" margin="1dp">DPI：</text>
            <input id="modifyResolutionBtn_density" inputType="number" text="320" margin="1dp" maxLength="4" />
        </horizontal>
    </vertical>;

    // 使用dialogs模块创建包含自定义视图的对话框
    let dialog = dialogs.build({
        title: "修改分辨率",
        customView: modifyResolutionBtn_customView,
        positive: "确定",
        negative: "取消"
    });

    // 显示对话框并处理用户输入
    dialog.on("positive", () => {
        // 获取输入框的值
        let input1 = dialog.getView().modifyResolutionBtn_width.text();
        let input2 = dialog.getView().modifyResolutionBtn_height.text();
        let input3 = dialog.getView().modifyResolutionBtn_density.text();

        shizuku("wm size " + input1 + "x" + input2)
        shizuku("wm density " + input3)
    });

    dialog.show();
})



// 从文件加载存档账号列表
function loadSaveAccountListFromConfig(config_save) {
    const saveAccountDir = appExternalDir + "/卡通农场小助手存档";

    // 检查目录是否存在，如果不存在则创建
    files.ensureDir(saveAccountDir + "/1");

    // 从配置加载存档账号列表

    let configSaveAccountList = [];
    if (config_save && Array.isArray(config_save)) {
        configSaveAccountList = config_save;
    }

    // 列出目录下的所有文件夹
    const folderNames = files.listDir(saveAccountDir, function (name) {
        // 只选择文件夹，排除文件
        return files.isDir(files.join(saveAccountDir, name));
    });

    // 创建一个映射，用于快速查找文件夹名称
    const folderNameMap = {};
    folderNames.forEach(name => {
        folderNameMap[name] = true;
    });

    // 首先按照配置中的顺序添加存在的文件夹
    const orderedSaveAccountList = [];
    configSaveAccountList.forEach(account => {
        if (folderNameMap[account.title]) {
            orderedSaveAccountList.push({
                title: account.title,
                done: account.done !== undefined ? account.done : true
            });
            // 从映射中移除已处理的文件夹
            delete folderNameMap[account.title];
        }
    });

    // 将剩余的文件夹（配置中没有的）添加到列表末尾
    Object.keys(folderNameMap).forEach(name => {
        orderedSaveAccountList.push({
            title: name,
            done: true
        });
    });

    SaveAccountList = orderedSaveAccountList;
    return SaveAccountList;
}


// 设置账号方式
function setAccountMethod(method) {
    // 更新全局状态变量
    currentAccountMethod = method;

    if (method === "email") {
        ui.accountMethodEmail.attr("bg", color);
        ui.accountMethodEmail.attr("textColor", "#FFFFFF");
        ui.accountMethodSave.attr("bg", "#E0E0E0");
        ui.accountMethodSave.attr("textColor", "#000000");
        ui['AccountList'].attr("visibility", "visible");
        ui['SaveAccountList'].attr("visibility", "gone");
    } else {
        ui.accountMethodEmail.attr("bg", "#E0E0E0");
        ui.accountMethodEmail.attr("textColor", "#000000");
        ui.accountMethodSave.attr("bg", color);
        ui.accountMethodSave.attr("textColor", "#FFFFFF");
        ui['AccountList'].attr("visibility", "gone");
        ui['SaveAccountList'].attr("visibility", "visible");
    }

    // 强制刷新UI
    ui.accountMethodEmail.attr("bg", ui.accountMethodEmail.attr("bg"));
    ui.accountMethodSave.attr("bg", ui.accountMethodSave.attr("bg"));

    // 保存选择的账号方式到配置
    configs.put("accountMethod", method);
}

// 点击复选框勾选
ui['AccountList'].on('item_bind', function (itemView, itemHolder) {
    // 绑定勾选框事件
    itemView.done.on('check', function (checked) {
        let item = itemHolder.item;
        item.done = checked;
        itemView.title.invalidate();

        // 保存到存储对象
        AccountList = ui['AccountList'].getDataSource();
        configs.put("accountList", AccountList);
    });
});

// 存档账号列表复选框勾选
ui['SaveAccountList'].on('item_bind', function (itemView, itemHolder) {
    // 绑定勾选框事件
    itemView.saveDone.on('check', function (checked) {
        let item = itemHolder.item;
        item.done = checked;
        itemView.saveTitle.invalidate();

        // 保存到存储对象
        SaveAccountList = ui['SaveAccountList'].getDataSource();
        configs.put("saveAccountList", SaveAccountList);
    });
});

// 存档账号列表加载按钮点击事件
ui['SaveAccountList'].on('item_bind', function (itemView, itemHolder) {
    // 绑定加载按钮点击事件
    itemView.loadSaveAccount.on('click', function () {
        threads.start(() => {
            let item = itemHolder.item;

            let packageName = "com.supercell.hayday";

            try {
                let result = shell("am force-stop " + packageName, true);
                if (result.code === 0) {
                    console.log("使用am force-stop命令成功停止应用");
                    toast("正在加载存档: " + item.title);
                } else {
                    console.log("am force-stop命令执行失败: " + result.error);
                    toast("am force-stop命令执行失败: ")
                }
            } catch (e) {
                console.log("使用am force-stop命令时出错: " + e);
                toast("使用am force-stop命令时出错: " + e);
            }

            copy_shell(item.title, "import");
            setTimeout(() => {
                launch("com.supercell.hayday");
            }, 1000);
        })
    });
});

// addFriends列表的复选框勾选事件
ui['addFriendsList'].on('item_bind', function (itemView, itemHolder) {
    // 绑定勾选框事件
    itemView.addFriendsdone.on('check', function (checked) {
        let item = itemHolder.item;
        item.addFriendsdone = checked;
        itemView.addFriendstitle.invalidate();

        // 保存到存储对象
        AddFriendsList = ui['addFriendsList'].getDataSource();
        configs.put("addFriendsList", AddFriendsList);
    });
});

// 点击列表项修改内容
ui['AccountList'].on('item_click', function (item, i, itemView) {
    dialogs.rawInput('修改账号', item.title)
        .then((newTitle) => {
            if (newTitle && newTitle.trim() !== '') {
                item.title = newTitle.trim();
                ui['AccountList'].adapter.notifyDataSetChanged();

                // 保存到存储对象
                AccountList = ui['AccountList'].getDataSource();
                configs.put("accountList", AccountList);

                // 保存修改后的账号到配置
                configs.put("accountList", AccountList);
            }
        })
        .catch((error) => {
            // 处理用户取消输入或其他错误情况
            console.log("用户取消输入或发生错误:", error);
        });
});

// 点击存档账号列表项修改内容
ui['SaveAccountList'].on('item_click', function (item, i, itemView) {
    let oldTitle = item.title; // 保存旧标题
    dialogs.rawInput('修改存档账号', oldTitle)
        .then((newTitle) => {
            if (newTitle && newTitle.trim() !== '') {
                item.title = newTitle.trim();
                ui['SaveAccountList'].adapter.notifyDataSetChanged();

                //更改存档账号的文件名
                let oldSaveDir = files.join(appExternalDir + "/卡通农场小助手存档", oldTitle);
                files.rename(oldSaveDir, newTitle.trim());

                // 保存到存储对象
                SaveAccountList = ui['SaveAccountList'].getDataSource();
                configs.put("saveAccountList", SaveAccountList);

            }
        })
        .catch((error) => {
            // 处理用户取消输入或其他错误情况
            console.log("用户取消输入或发生错误:", error);
        });
});

// 点击addFriends列表项修改内容
ui['addFriendsList'].on('item_click', function (item, i, itemView) {
    dialogs.rawInput('修改账号标签', item.addFriendstitle)
        .then((newTitle) => {
            if (newTitle && newTitle.trim() !== '') {
                item.addFriendstitle = newTitle.trim();
                ui['addFriendsList'].adapter.notifyDataSetChanged();

                // 保存到存储对象
                AddFriendsList = ui['addFriendsList'].getDataSource();
                configs.put("addFriendsList", AddFriendsList);

            }
        })
        .catch((error) => {
            // 处理用户取消输入或其他错误情况
            console.log("用户取消输入或发生错误:", error);
        });
});

// 长按删除addFriends标签
ui['addFriendsList'].on('item_long_click', function (e, item, i) {
    confirm(`确定要删除 "${item.addFriendstitle}" 吗?`)
        .then(ok => {
            if (ok) {
                // 先从数据中删除
                AddFriendsList.splice(i, 1);

                // 保存到存储对象
                AddFriendsList = ui['addFriendsList'].getDataSource();
                configs.put("addFriendsList", AddFriendsList);

            }
        })
        .catch((error) => {
            // 处理用户取消操作或其他错误情况
            console.log("用户取消操作或发生错误:", error);
        });
    e.consumed = true;
});

// 长按删除
ui['AccountList'].on('item_long_click', function (e, item, i) {
    confirm(`确定要删除 "${item.title}" 吗?`)
        .then(ok => {
            if (ok) {
                // 先从数据中删除
                AccountList.splice(i, 1);

                // 保存到存储对象
                AccountList = ui['AccountList'].getDataSource();
                configs.put("accountList", AccountList);

            }
        })
        .catch((error) => {
            // 处理用户取消操作或其他错误情况
            console.log("用户取消操作或发生错误:", error);
        });
    e.consumed = true;
});

// 长按删除存档账号
ui['SaveAccountList'].on('item_long_click', function (e, item, i) {
    confirm(`确定要删除 "${item.title}" 吗?`)
        .then(ok => {
            if (ok) {
                // 先从数据中删除
                SaveAccountList.splice(i, 1);

                // 删除存档文件
                let saveDir = files.join(appExternalDir + "/卡通农场小助手存档", item.title);
                files.removeDir(saveDir);

                // 保存到存储对象
                SaveAccountList = ui['SaveAccountList'].getDataSource();
                configs.put("saveAccountList", SaveAccountList);

            }
        })
        .catch((error) => {
            // 处理用户取消操作或其他错误情况
            console.log("用户取消操作或发生错误:", error);
        });
    e.consumed = true;
});

// 添加新addFriends标签
ui['addFriend'].on('click', () => {
    dialogs.rawInput('请输入新的账号标签')
        .then((title) => {
            if (title && title.trim() !== '') {
                AddFriendsList.push({
                    addFriendstitle: title.trim(),
                    addFriendsdone: true
                });
                ui['addFriendsList'].adapter.notifyDataSetChanged();

                // 保存到存储对象
                AddFriendsList = ui['addFriendsList'].getDataSource();
                configs.put("addFriendsList", AddFriendsList);

            }
        })
        .catch((error) => {
            // 处理用户取消输入或其他错误情况
            console.log("用户取消输入或发生错误:", error);
        });
});

// 添加新账号
ui['addAccount'].on('click', () => {
    const config = getConfig();
    const method = config.accountMethod || 'email';
    const listName = method === 'email' ? 'AccountList' : 'SaveAccountList';
    let dataList = method === 'email' ? AccountList : SaveAccountList;
    const dialogTitle = method === 'email' ? '请输入新的账号名称' : '请输入新的存档账号名称';

    dialogs.rawInput(dialogTitle)
        .then((title) => {
            if (title && title.trim() !== '') {
                dataList.push({
                    title: title.trim(),
                    done: true
                });
                ui[listName].adapter.notifyDataSetChanged();

                // 保存到存储对象
                dataList = ui[listName].getDataSource();
                configs.put(listName, dataList);

                //保存存档
                if (method === "save") {
                    threads.start(() => {
                        copy_shell(title.trim());
                    })
                }

            }
        })
        .catch((error) => {
            // 处理用户取消输入或其他错误情况
            console.log("用户取消输入或发生错误:", error);
        });
});

// 开启无障碍服务监听
ui.autoService.on("check", function (checked) {
    if (checked && auto.service == null) {
        // 跳转到无障碍设置界面
        app.startActivity({
            action: "android.settings.ACCESSIBILITY_SETTINGS"
        });
    }
    if (!checked && auto.service != null) {
        // 关闭无障碍服务
        auto.service.disableSelf();
    }
});

//截图权限获取开关监听
ui.requestScBtn.on("check", function (checked) {
    if (checked) {
        threads.start(() => {
            // 调用autoSc函数获取截图权限
            autoSc();

        })
    }
    if (!checked) {
        // 关闭截图权限
        images.stopScreenCapturer();
    }
});

//导入浮动按钮模块
const float_win = require('./floatyBtn.js');
//浮动按钮状态监听
ui.win_switch.on("check", function (checked) {
    if (checked) {
        // 开启悬浮窗
        float_win.open();
    } else {
        // 关闭悬浮窗
        float_win.close();
    }
});



//

events.broadcast.on("win_showLogDialog", showLogDialog);
events.broadcast.on("win_startButton", winStartButton);
events.broadcast.on("win_stopOtherEngines", stopOtherEngines);
events.broadcast.on("win_stopAll", () => stopOtherEngines(true));
// 监听浮动按钮状态变化
events.broadcast.on("win_switch_state", (state) => {
    ui.win_switch.setChecked(state);
});
// events.broadcast.on("win_startButton",startButton);

// 监听界面恢复事件，更新开关状态
ui.emitter.on("resume", function () {
    ui.autoService.checked = (auto.service != null);
    ui.win_switch.checked = float_win.isCreated();
});



//



// ==================== 存储对象处理 ====================

/**
 * 获取当前配置
 */
function getConfig() {
    // 从存储对象的不同键中获取配置项并组合成完整的配置对象
    const storedConfig = {
        selectedFunction: configs.get("selectedFunction"),
        selectedCrop: configs.get("selectedCrop"),
        selectedTree: configs.get("selectedTree"),
        switchAccount: configs.get("switchAccount"),
        findAccountMethod: configs.get("findAccountMethod"),
        accountMethod: configs.get("accountMethod"),
        accountList: configs.get("accountList"),
        saveAccountList: configs.get("saveAccountList"),
        addFriendsList: configs.get("addFriendsList"),
        shopPrice: configs.get("shopPrice"),
        ReservedQuantity: configs.get("ReservedQuantity"),
        landFindMethod: configs.get("landFindMethod"),
        landOffset: {
            x: configs.get("landOffsetX"),
            y: configs.get("landOffsetY")
        },
        shopOffset: {
            x: configs.get("shopOffsetX"),
            y: configs.get("shopOffsetY")
        },
        firstland: {
            x: configs.get("firstlandX"),
            y: configs.get("firstlandY")
        },
        distance: configs.get("distance"),
        matureTime: configs.get("matureTime"),
        harvestTime: configs.get("harvestTime"),
        harvestX: configs.get("harvestX"),
        harvestY: configs.get("harvestY"),
        harvestRepeat: configs.get("harvestRepeat"),
        showText: {
            x: configs.get("showTextX"),
            y: configs.get("showTextY")
        },
        photoPath: configs.get("photoPath"),
        randomColor: configs.get("randomColor"),
        themeColor: configs.get("themeColor"),
        isShengcang: configs.get("isShengcang"),
        shengcangTime: configs.get("shengcangTime"),
        isCangkuStatistics: configs.get("isCangkuStatistics"),
        cangkuStatisticsTime: configs.get("cangkuStatisticsTime"),
        cangkuStatisticsPage: configs.get("cangkuStatisticsPage"),
        treeShouldSwipe: configs.get("treeShouldSwipe"),
        liangcangOffset: {
            x: configs.get("liangcangOffsetX"),
            y: configs.get("liangcangOffsetY")
        },
        huocangOffset: {
            x: configs.get("huocangOffsetX"),
            y: configs.get("huocangOffsetY")
        },
        token: token_storage.get("token"),
        serverPlatform: configs.get("serverPlatform"),
        tomFind: {
            enabled: configs.get("Tom_enabled"),
            type: configs.get("Tom_itemType"),
            code: configs.get("Tom_code"),
            text: configs.get("Tom_itemName")
        },
        screenshotCoords: {
            coord1: {
                x: configs.get("screenshotX1"),
                y: configs.get("screenshotY1")
            },
            coord2: {
                x: configs.get("screenshotX2"),
                y: configs.get("screenshotY2")
            },
            coord3: {
                x: configs.get("screenshotX3"),
                y: configs.get("screenshotY3")
            },
        }
    };
    return storedConfig;
}

/**
 * 保存配置到存储
 */
function saveConfig(con) {
    try {
        // 将配置项分散存储到不同的键中
        configs.put("selectedFunction", con.selectedFunction);
        configs.put("selectedCrop", con.selectedCrop);
        configs.put("selectedTree", con.selectedTree);
        configs.put("switchAccount", con.switchAccount);
        configs.put("findAccountMethod", con.findAccountMethod);
        configs.put("accountMethod", con.accountMethod);
        configs.put("accountList", con.accountList);
        configs.put("saveAccountList", con.saveAccountList);
        configs.put("addFriendsList", con.addFriendsList);
        configs.put("shopPrice", con.shopPrice);
        configs.put("ReservedQuantity", con.ReservedQuantity);
        configs.put("landFindMethod", con.landFindMethod);

        // 存储偏移量配置
        configs.put("landOffsetX", con.landOffset.x);
        configs.put("landOffsetY", con.landOffset.y);
        configs.put("shopOffsetX", con.shopOffset.x);
        configs.put("shopOffsetY", con.shopOffset.y);
        configs.put("firstlandX", con.firstland.x);
        configs.put("firstlandY", con.firstland.y);

        configs.put("distance", con.distance);
        configs.put("matureTime", con.matureTime);
        configs.put("harvestTime", con.harvestTime);
        configs.put("harvestX", con.harvestX);
        configs.put("harvestY", con.harvestY);
        configs.put("harvestRepeat", con.harvestRepeat);

        // 存储悬浮窗坐标
        configs.put("showTextX", con.showText.x);
        configs.put("showTextY", con.showText.y);

        configs.put("photoPath", con.photoPath);
        configs.put("randomColor", con.randomColor);
        configs.put("themeColor", con.themeColor);
        configs.put("isShengcang", con.isShengcang);
        configs.put("shengcangTime", con.shengcangTime);
        configs.put("isCangkuStatistics", con.isCangkuStatistics);
        configs.put("cangkuStatisticsTime", con.cangkuStatisticsTime);
        configs.put("cangkuStatisticsPage", con.cangkuStatisticsPage);
        configs.put("treeShouldSwipe", con.treeShouldSwipe);

        // 存储粮仓和货仓偏移量
        configs.put("liangcangOffsetX", con.liangcangOffset.x);
        configs.put("liangcangOffsetY", con.liangcangOffset.y);
        configs.put("huocangOffsetX", con.huocangOffset.x);
        configs.put("huocangOffsetY", con.huocangOffset.y);

        configs.put("token", con.token);
        configs.put("serverPlatform", con.serverPlatform);

        // 存储汤姆查找配置
        configs.put("Tom_enabled", con.tomFind.enabled);
        configs.put("Tom_itemType", con.tomFind.type);
        configs.put("Tom_code", con.tomFind.code);
        configs.put("Tom_itemName", con.tomFind.text);

        // 存储截图坐标
        configs.put("screenshotX1", con.screenshotCoords.coord1.x);
        configs.put("screenshotY1", con.screenshotCoords.coord1.y);
        configs.put("screenshotX2", con.screenshotCoords.coord2.x);
        configs.put("screenshotY2", con.screenshotCoords.coord2.y);
        configs.put("screenshotX3", con.screenshotCoords.coord3.x);
        configs.put("screenshotY3", con.screenshotCoords.coord3.y);

        // console.log("配置保存成功");
        return true;
    } catch (e) {
        console.error("保存配置失败:", e);
        toast("保存配置失败: " + e.message, "long");
        return false;
    }
}


/**
 * 从存储对象加载配置
 */
function loadConfig(loadConfigFromFile = false) {
    try {
        let con_load
        // 检查是否从配置文件加载
        if (loadConfigFromFile) {
            log("==================================")
            log("从配置文件加载配置")
            log("==================================")
            con_load = JSON.parse(files.read(configPath));

        } else {
            log("==================================")
            log("从存储对象加载配置")
            log("==================================")
            con_load = getConfig();

        }

        config = validateConfig(con_load)
        return config;
    } catch (e) {
        console.error("加载配置失败:", e);
        // toast("配置加载失败，使用默认配置", "long");
    }
    log("使用默认配置")
    return getDefaultConfig();
}

/**
 * 验证配置有效性
 */
function validateConfig(config) {
    const defaultConfig = getDefaultConfig();
    // 验证偏移值

    config.landOffset.x = config.landOffset.x != undefined ? Number(config.landOffset.x) : defaultConfig.landOffset.x;
    config.landOffset.y = config.landOffset.y != undefined ? Number(config.landOffset.y) : defaultConfig.landOffset.y;
    config.shopOffset.x = config.shopOffset.x != undefined ? Number(config.shopOffset.x) : defaultConfig.shopOffset.x;
    config.shopOffset.y = config.shopOffset.y != undefined ? Number(config.shopOffset.y) : defaultConfig.shopOffset.y;

    config.firstland.x = config.firstland.x != undefined ? Number(config.firstland.x) : defaultConfig.firstland.x;
    config.firstland.y = config.firstland.y != undefined ? Number(config.firstland.y) : defaultConfig.firstland.y;
    config.distance = config.distance != undefined ? Number(config.distance) : defaultConfig.distance;

    // 验证matureTime
    if (config.matureTime == undefined || isNaN(config.matureTime) || config.matureTime < 0) {
        config.matureTime = defaultConfig.matureTime;
    } else config.matureTime = Number(config.matureTime);

    // 验证harvestTime
    if (config.harvestTime == undefined || isNaN(config.harvestTime) || config.harvestTime < 0) {
        config.harvestTime = defaultConfig.harvestTime;
    } else config.harvestTime = Number(config.harvestTime);

    // 验证harvestX
    if (config.harvestX == undefined || isNaN(config.harvestX)) {
        config.harvestX = defaultConfig.harvestX;
    } else config.harvestX = Number(config.harvestX);

    // 验证harvestY
    if (config.harvestY == undefined || isNaN(config.harvestY)) {
        config.harvestY = defaultConfig.harvestY;
    } else config.harvestY = Number(config.harvestY);

    // 验证harvestRepeat
    if (config.harvestRepeat == undefined || isNaN(config.harvestRepeat) || config.harvestRepeat < 0) {
        config.harvestRepeat = defaultConfig.harvestRepeat;
    } else config.harvestRepeat = Number(config.harvestRepeat);

    // 验证ReservedQuantity
    if (config.ReservedQuantity == undefined || isNaN(config.ReservedQuantity) || config.ReservedQuantity < 0) {
        config.ReservedQuantity = defaultConfig.ReservedQuantity;
    } else config.ReservedQuantity = Number(config.ReservedQuantity);

    //验证悬浮窗坐标
    if (!config.showText) config.showText = defaultConfig.showText;
    config.showText.x = config.showText.x != undefined ? Number(config.showText.x) : defaultConfig.showText.x;
    config.showText.y = config.showText.y != undefined ? Number(config.showText.y) : defaultConfig.showText.y;

    // 验证功能选择
    if (!config.selectedFunction) config.selectedFunction = defaultConfig.selectedFunction;
    const functionOptions = ["刷地", "种树", "创新号"];
    if (config.selectedFunction.code < 0 || config.selectedFunction.code >= functionOptions.length) {
        config.selectedFunction.code = defaultConfig.selectedFunction.code;
    }
    config.selectedFunction.text = functionOptions[config.selectedFunction.code];

    // 验证作物选择
    if (!config.selectedCrop) config.selectedCrop = defaultConfig.selectedCrop;
    const cropOptions = ["小麦", "玉米", "胡萝卜", "大豆", "甘蔗"];
    if (config.selectedCrop.code < 0 || config.selectedCrop.code >= cropOptions.length) {
        config.selectedCrop.code = defaultConfig.selectedCrop.code;
    }
    config.selectedCrop.text = cropOptions[config.selectedCrop.code];

    // 验证树木选择
    if (!config.selectedTree) config.selectedTree = defaultConfig.selectedTree;
    const treeOptions = ["苹果树", "树莓丛", "樱桃树", "黑莓丛", "蓝莓丛", "可可树", "咖啡丛", "橄榄树", "柠檬树", "香橙树", "水蜜桃树", "香蕉树", "西梅树", "芒果树", "椰子树", "番石榴树", "石榴树"];
    if (config.selectedTree.code < 0 || config.selectedTree.code >= treeOptions.length) {
        config.selectedTree.code = defaultConfig.selectedTree.code;
    }
    config.selectedTree.text = treeOptions[config.selectedTree.code];

    //验证随机颜色开关
    if (config.randomColor == undefined || typeof config.randomColor !== "boolean") {
        config.randomColor = defaultConfig.randomColor;
    }
    // 验证主题颜色
    if (!config.themeColor) config.themeColor = {
        code: defaultConfig.themeColor.code,
        text: defaultConfig.themeColor.text
    };

    if (config.themeColor.code < 0 || config.themeColor.code >= colorLibrary.length) {
        config.themeColor.code = defaultConfig.themeColor.code;
    }
    config.themeColor.text = ["碧玉青", "落日橙", "翠竹绿", "晴空蓝", "胭脂粉", "朱砂红", "湖水蓝", "柠檬黄", "咖啡棕", "烟雨灰"][config.themeColor.code];

    // 验证cangkuTime
    if (config.shengcangTime == undefined || isNaN(config.shengcangTime) || config.shengcangTime < 0) {
        config.shengcangTime = defaultConfig.shengcangTime;
    } else config.shengcangTime = Number(config.shengcangTime);

    // 验证isShengcang
    if (config.isShengcang == undefined || typeof config.isShengcang !== "boolean") {
        config.isShengcang = defaultConfig.isShengcang;
    } 

    // 验证isCangkuStatistics
    if (config.isCangkuStatistics == undefined || typeof config.isCangkuStatistics !== "boolean") {
        config.isCangkuStatistics = defaultConfig.isCangkuStatistics;
    } 

    // 验证cangkuStatisticsTime
    if (config.cangkuStatisticsTime == undefined || isNaN(config.cangkuStatisticsTime) || config.cangkuStatisticsTime < 0) {
        config.cangkuStatisticsTime = defaultConfig.cangkuStatisticsTime;
    } else config.cangkuStatisticsTime = Number(config.cangkuStatisticsTime);

    // 验证cangkuStatisticsPage
    if (config.cangkuStatisticsPage == undefined || isNaN(config.cangkuStatisticsPage) || config.cangkuStatisticsPage <= 0) {
        config.cangkuStatisticsPage = defaultConfig.cangkuStatisticsPage;
    } else config.cangkuStatisticsPage = Number(config.cangkuStatisticsPage);

    // 验证treeShouldSwipe
    if (config.treeShouldSwipe == undefined || typeof config.treeShouldSwipe !== "boolean") {
        config.treeShouldSwipe = defaultConfig.treeShouldSwipe;
    }

    // 验证粮仓坐标偏移
    if (!config.liangcangOffset) config.liangcangOffset = defaultConfig.liangcangOffset;
    config.liangcangOffset.x = config.liangcangOffset.x != undefined ? Number(config.liangcangOffset.x) : defaultConfig.liangcangOffset.x;
    config.liangcangOffset.y = config.liangcangOffset.y != undefined ? Number(config.liangcangOffset.y) : defaultConfig.liangcangOffset.y;

    // 验证货仓坐标偏移
    if (!config.huocangOffset) config.huocangOffset = defaultConfig.huocangOffset;
    config.huocangOffset.x = config.huocangOffset.x != undefined ? Number(config.huocangOffset.x) : defaultConfig.huocangOffset.x;
    config.huocangOffset.y = config.huocangOffset.y != undefined ? Number(config.huocangOffset.y) : defaultConfig.huocangOffset.y;

    // 验证账号识别方式
    if (!config.findAccountMethod || (config.findAccountMethod !== "image" && config.findAccountMethod !== "ocr")) {
        config.findAccountMethod = "ocr"; // 默认为文字识别
    }

    // 验证账号列表
    if (!Array.isArray(config.accountList)) config.accountList = [];

    // 验证存档账号列表
    if (!Array.isArray(config.saveAccountList)) config.saveAccountList = [];

    // 验证创新号账号列表
    if (!Array.isArray(config.addFriendsList)) config.addFriendsList = [];

    // 验证账号方式
    if (!config.accountMethod || (config.accountMethod !== "email" && config.accountMethod !== "save")) {
        config.accountMethod = "email"; // 默认为邮箱账号方式
    }

    // 验证是否切换账号
    if (typeof config.switchAccount !== "boolean") {
        config.switchAccount = defaultConfig.switchAccount;
    }

    // 验证商店价格选项
    if (!config.shopPrice) config.shopPrice = defaultConfig.shopPrice;
    const shopPriceOptions = ["最低", "平价", "最高"];
    if (config.shopPrice.code < 0 || config.shopPrice.code >= shopPriceOptions.length) {
        config.shopPrice.code = defaultConfig.shopPrice.code;
    }
    config.shopPrice.text = shopPriceOptions[config.shopPrice.code];

    // 验证地块查找方式
    if (!config.landFindMethod || (config.landFindMethod !== "商店" && config.landFindMethod !== "面包房")) {
        config.landFindMethod = defaultConfig.landFindMethod;
    }

    // 验证汤姆查找配置
    if (!config.tomFind) config.tomFind = defaultConfig.tomFind;
    if (typeof config.tomFind.enabled !== "boolean") {
        config.tomFind.enabled = defaultConfig.tomFind.enabled;
    }
    const tomFindTypeOptions = ["货仓", "粮仓"];
    if (config.tomFind.code === undefined || config.tomFind.code < 0 || config.tomFind.code >= tomFindTypeOptions.length) {
        config.tomFind.code = defaultConfig.tomFind.code;
    }
    config.tomFind.type = tomFindTypeOptions[config.tomFind.code];
    if (typeof config.tomFind.text !== "string") {
        config.tomFind.text = defaultConfig.tomFind.text;
    }

    // 验证token
    if (config.token == undefined || config.token === undefined) config.token = defaultConfig.token;

    // 验证推送方式
    if (!config.serverPlatform) config.serverPlatform = defaultConfig.serverPlatform;

    config.serverPlatform.text = ["Pushplus推送加", "Server酱", "WxPusher"][config.serverPlatform.code];

    // 验证截图坐标配置
    if (!config.screenshotCoords) {
        config.screenshotCoords = defaultConfig.screenshotCoords;
    } else {
        // 验证坐标1
        if (!config.screenshotCoords.coord1) {
            config.screenshotCoords.coord1 = defaultConfig.screenshotCoords.coord1;
        } else {
            // 如果值为空字符串或null，保持为空字符串
            if (config.screenshotCoords.coord1.x === "" || config.screenshotCoords.coord1.x === null) {
                config.screenshotCoords.coord1.x = "";
            } else {
                // 如果有值则转换为数字
                config.screenshotCoords.coord1.x = !isNaN(Number(config.screenshotCoords.coord1.x)) ? Number(config.screenshotCoords.coord1.x) : defaultConfig.screenshotCoords.coord1.x;
            }

            if (config.screenshotCoords.coord1.y === "" || config.screenshotCoords.coord1.y === null) {
                config.screenshotCoords.coord1.y = "";
            } else {
                config.screenshotCoords.coord1.y = !isNaN(Number(config.screenshotCoords.coord1.y)) ? Number(config.screenshotCoords.coord1.y) : defaultConfig.screenshotCoords.coord1.y;
            }
        }

        // 验证坐标2
        if (!config.screenshotCoords.coord2) {
            config.screenshotCoords.coord2 = defaultConfig.screenshotCoords.coord2;
        } else {
            if (config.screenshotCoords.coord2.x === "" || config.screenshotCoords.coord2.x === null) {
                config.screenshotCoords.coord2.x = "";
            } else {
                config.screenshotCoords.coord2.x = !isNaN(Number(config.screenshotCoords.coord2.x)) ? Number(config.screenshotCoords.coord2.x) : defaultConfig.screenshotCoords.coord2.x;
            }

            if (config.screenshotCoords.coord2.y === "" || config.screenshotCoords.coord2.y === null) {
                config.screenshotCoords.coord2.y = "";
            } else {
                config.screenshotCoords.coord2.y = !isNaN(Number(config.screenshotCoords.coord2.y)) ? Number(config.screenshotCoords.coord2.y) : defaultConfig.screenshotCoords.coord2.y;
            }
        }

        // 验证坐标3
        if (!config.screenshotCoords.coord3) {
            config.screenshotCoords.coord3 = defaultConfig.screenshotCoords.coord3;
        } else {
            if (config.screenshotCoords.coord3.x === "" || config.screenshotCoords.coord3.x === null) {
                config.screenshotCoords.coord3.x = "";
            } else {
                config.screenshotCoords.coord3.x = !isNaN(Number(config.screenshotCoords.coord3.x)) ? Number(config.screenshotCoords.coord3.x) : defaultConfig.screenshotCoords.coord3.x;
            }

            if (config.screenshotCoords.coord3.y === "" || config.screenshotCoords.coord3.y === null) {
                config.screenshotCoords.coord3.y = "";
            } else {
                config.screenshotCoords.coord3.y = !isNaN(Number(config.screenshotCoords.coord3.y)) ? Number(config.screenshotCoords.coord3.y) : defaultConfig.screenshotCoords.coord3.y;
            }
        }
    }

    // 其他验证...
    if (!config.photoPath || (config.photoPath && config.photoPath.length == 0)) config.photoPath = "./res/pictures.1280_720"

    return config;
}

/**
 * 获取默认配置
 */
function getDefaultConfig() {
    return {
        selectedFunction: {
            text: "刷地",
            code: 0
        },
        selectedCrop: {
            text: "小麦",
            code: 0
        },
        matureTime: "2", // 添加成熟时间默认值
        selectedTree: {
            text: "苹果树",
            code: 0
        },
        switchAccount: false,
        findAccountMethod: "ocr", // 账号识别方式，默认为文字识别
        accountList: [], // 新增账号列表配置
        saveAccountList: [], // 新增保存账号列表配置
        addFriendsList: [], // 新增创新号账号列表配置
        shopPrice: {
            text: "最低",
            code: 0
        },
        ReservedQuantity: 20, // 默认保留数量为20
        landFindMethod: "商店",
        landOffset: {
            x: 60,
            y: -30
        },
        shopOffset: {
            x: -60,
            y: -50
        },

        firstland: {
            x: 20,
            y: 40
        },
        distance: 75,
        harvestTime: 5,
        harvestX: 8,
        harvestY: 1.5,
        harvestRepeat: 3,
        showText: {
            x: 0,
            y: 0.65
        },
        photoPath: "./res/pictures.1280_720",
        randomColor: false,
        themeColor: {
            text: "碧玉青",
            code: 0
        },
        isShengcang: false,
        shengcangTime: 60,
        isCangkuStatistics: false,
        cangkuStatisticsTime: 300,
        cangkuStatisticsPage: 2,
        treeShouldSwipe: true,
        liangcangOffset: {
            x: 240,
            y: 0
        },
        huocangOffset: {
            x: 340,
            y: -45
        },
        token: "",
        serverPlatform: {
            text: "Pushplus推送加",
            code: 0
        },
        // 汤姆相关配置
        tomFind: {
            enabled: false,
            type: "货仓",
            code: 0,
            text: ""
        },
        // 截图坐标配置
        screenshotCoords: {
            coord1: {
                x: "",
                y: ""
            },
            coord2: {
                x: "",
                y: ""
            },
            coord3: {
                x: "",
                y: ""
            }
        }
    };
}


// ==================== 功能函数 ====================

// 解析账号名称
function parseAccountNames(text) {
    if (!text) return [];
    return text.split(",")
        .map(name => name.trim())
        .filter(name => name.length > 0);
}

/**
 * 加载配置到界面
 */
// 设置账号识别方式按钮状态
function setFindAccountMethod(method) {
    // 更新全局状态变量
    currentFindAccountMethod = method;

    if (method === "image") {
        ui.findAccountImage.attr("bg", color);
        ui.findAccountImage.attr("textColor", "#FFFFFF");
        ui.findAccountText.attr("bg", "#E0E0E0");
        ui.findAccountText.attr("textColor", "#000000");
    } else {
        ui.findAccountImage.attr("bg", "#E0E0E0");
        ui.findAccountImage.attr("textColor", "#000000");
        ui.findAccountText.attr("bg", color);
        ui.findAccountText.attr("textColor", "#FFFFFF");
    }

    // 强制刷新UI
    ui.findAccountImage.attr("bg", ui.findAccountImage.attr("bg"));
    ui.findAccountText.attr("bg", ui.findAccountText.attr("bg"));

    // 保存选择的账号识别方式到配置
    configs.put("findAccountMethod", method);
}

function loadConfigToUI(loadConfigFromFile = false) {
    const config = loadConfig(loadConfigFromFile);
    saveConfig(config);
    // 初始化颜色
    initColor();

    AccountList = config.accountList
    ui['AccountList'].setDataSource(AccountList);
    SaveAccountList = loadSaveAccountListFromConfig(config.saveAccountList);
    ui['SaveAccountList'].setDataSource(SaveAccountList);
    AddFriendsList = config.addFriendsList
    ui['addFriendsList'].setDataSource(AddFriendsList);


    // 初始化全局状态变量
    currentAccountMethod = config.accountMethod || "email";
    currentFindAccountMethod = config.findAccountMethod || "ocr";
    currentLandFindMethod = config.landFindMethod || "商店";

    // 设置账号识别方式
    setFindAccountMethod(config.findAccountMethod);

    // 设置账号方式
    setAccountMethod(config.accountMethod || 'email');

    // 设置功能选择
    ui.functionSelect.setSelection(config.selectedFunction.code);

    // 设置作物选择
    ui.cropSelect.setSelection(config.selectedCrop.code);

    // 设置成熟时间
    ui.matureTime.setText(String(config.matureTime));

    // 设置树木选择
    ui.treeSelect.setSelection(config.selectedTree.code);

    // 根据选择的功能设置初始显示状态
    const selectedFunction = config.selectedFunction.text;
    if (selectedFunction === "刷地") {
        // 显示作物选择，隐藏树木选择
        ui.cropSelectContainer.attr("visibility", "visible");
        ui.shopPriceContainer.attr("visibility", "visible");
        ui.treeSelectContainer.attr("visibility", "gone");
        ui.treeShouldSwipe.attr("visibility", "gone");
        ui.addFriendsCard.attr("visibility", "gone");
    } else if (selectedFunction === "种树") {
        // 隐藏作物选择，显示树木选择
        ui.cropSelectContainer.attr("visibility", "gone");
        ui.shopPriceContainer.attr("visibility", "gone");
        ui.treeSelectContainer.attr("visibility", "visible");
        ui.treeShouldSwipe.attr("visibility", "visible");
        ui.addFriendsCard.attr("visibility", "gone");
    } else if (selectedFunction === "创新号") {
        // 创新号
        ui.cropSelectContainer.attr("visibility", "gone");
        ui.shopPriceContainer.attr("visibility", "gone");
        ui.treeSelectContainer.attr("visibility", "gone");
        ui.treeShouldSwipe.attr("visibility", "gone");
        ui.addFriendsCard.attr("visibility", "visible");
    }





    // 设置账号相关
    ui.accountSwitch.setChecked(config.switchAccount);

    // 设置商店售价
    ui.shopPrice.setSelection(config.shopPrice.code);

    // 设置保留数量
    ui.ReservedQuantity.setText(String(config.ReservedQuantity));

    // 设置寻找土地方法
    setLandMethod(config.landFindMethod);

    // 设置坐标偏移
    ui.landOffsetX.setText(String(config.landOffset.x));
    ui.landOffsetY.setText(String(config.landOffset.y));
    ui.shopOffsetX.setText(String(config.shopOffset.x));
    ui.shopOffsetY.setText(String(config.shopOffset.y));



    // 设置收割偏移

    ui.firstlandX.setText(String(config.firstland.x));
    ui.firstlandY.setText(String(config.firstland.y));
    ui.distance.setText(String(config.distance));
    ui.harvestTime.setText(String(config.harvestTime));
    ui.harvestX.setText(String(config.harvestX));
    ui.harvestY.setText(String(config.harvestY));
    ui.harvestRepeat.setText(String(config.harvestRepeat));

    //设置悬浮窗坐标
    ui.showTextX.setText(String(config.showText.x));
    ui.showTextY.setText(String(config.showText.y));
    // 设置照片路径
    ui.photoPath.setText(config.photoPath);



    // 设置粮仓坐标偏移
    ui.liangcangOffsetX.setText(String(config.liangcangOffset.x));
    ui.liangcangOffsetY.setText(String(config.liangcangOffset.y));



    // 设置货仓坐标偏移
    ui.huocangOffsetX.setText(String(config.huocangOffset.x));
    ui.huocangOffsetY.setText(String(config.huocangOffset.y));

    // 加载截图坐标配置
    if (config.screenshotCoords) {
        // 加载坐标1
        if (config.screenshotCoords.coord1) {
            // 如果值为空字符串则设置为空，否则转换为字符串
            ui.screenshotX1.setText(config.screenshotCoords.coord1.x === "" ? "" : String(config.screenshotCoords.coord1.x));
            ui.screenshotY1.setText(config.screenshotCoords.coord1.y === "" ? "" : String(config.screenshotCoords.coord1.y));
        }

        // 加载坐标2
        if (config.screenshotCoords.coord2) {
            ui.screenshotX2.setText(config.screenshotCoords.coord2.x === "" ? "" : String(config.screenshotCoords.coord2.x));
            ui.screenshotY2.setText(config.screenshotCoords.coord2.y === "" ? "" : String(config.screenshotCoords.coord2.y));
        }

        // 加载坐标3
        if (config.screenshotCoords.coord3) {
            ui.screenshotX3.setText(config.screenshotCoords.coord3.x === "" ? "" : String(config.screenshotCoords.coord3.x));
            ui.screenshotY3.setText(config.screenshotCoords.coord3.y === "" ? "" : String(config.screenshotCoords.coord3.y));
        }
    }

    // 设置token
    const savedToken = token_storage.get("token", "");
    ui.tokenInput.setText(savedToken);
    ui.tokenInputPlain.setText(savedToken);

    // 设置推送方式
    ui.serverPlatform.setSelection(config.serverPlatform.code);

    // 设置随机颜色开关
    ui.randomColor.setChecked(config.randomColor);

    // 设置cangkuTime
    ui.shengcangTime.setText(String(config.shengcangTime));

    // 设置是否自动升仓
    ui.isShengcang.setChecked(config.isShengcang);



    // 设置仓库统计开关
    ui.isCangkuStatistics.setChecked(config.isCangkuStatistics);



    // 设置仓库统计间隔时间
    ui.cangkuStatisticsTime.setText(String(config.cangkuStatisticsTime));

    // 设置仓库统计页数
    ui.cangkuStatisticsPage.setText(String(config.cangkuStatisticsPage));

    // 设置是否自动滑动
    ui.treeShouldSwipeSwitch.setChecked(config.treeShouldSwipe);



    // 设置主题颜色
    if (config.themeColor.code >= 0) {
        ui.themeColor.setSelection(config.themeColor.code);

        // 如果randomColor为false，则使用配置中的颜色
        if (!config.randomColor) {
            color = colorLibrary[config.themeColor.code];
            ui.statusBarColor(color);
            ui.appbar.setBackgroundColor(android.graphics.Color.parseColor(color));
        }
    }

    // 加载汤姆相关配置
    if (config.tomFind.enabled !== undefined) {
        ui.tomSwitch.setChecked(config.tomFind.enabled);
        // 根据开关状态控制tomItemContainer的可见性
        ui.tomItemContainer.attr("visibility", config.tomFind.enabled ? "visible" : "gone");
    }

    if (config.tomFind.type !== undefined) {
        const typeIndex = ["货仓", "粮仓"].indexOf(config.tomFind.type);
        if (typeIndex >= 0) {
            ui.Tom_itemType.setSelection(typeIndex);
        }
    }

    if (config.tomFind.text !== undefined) {
        ui.Tom_itemName.setText(config.tomFind.text);
    }

    // 更新权限状态
    updateSwitchStatus();

    // 重新绑定监听器以确保它们正常工作
    // 汤姆开关状态变化监听
    ui.tomSwitch.on("check", (checked) => {
        // console.log("汤姆开关状态变化:", checked);
        // 根据开关状态控制物品类型和名称输入框的显示
        if (checked) {
            ui.tomItemContainer.attr("visibility", "visible");
        } else {
            ui.tomItemContainer.attr("visibility", "gone");
        }
        // 保存修改后的开关状态到配置
        configs.put("Tom_enabled", checked);
    });

    // 随机颜色开关状态变化监听
    ui.randomColor.on("check", (checked) => {
        // console.log("随机颜色开关状态变化:", checked);

        if (checked) {
            // 如果打开随机颜色，则随机选择一个颜色
            color = colorLibrary[Math.floor(Math.random() * colorLibrary.length)];
            ui.statusBarColor(color);
            ui.appbar.setBackgroundColor(android.graphics.Color.parseColor(color));

            // 更新商店按钮颜色（如果当前选中的是商店方法）
            if (config.landFindMethod === "商店") {
                ui.methodShop.attr("bg", color);
                ui.methodShop.attr("textColor", "#FFFFFF");
            }

            // 更新spinner文字颜色
            ui.themeColor.setTextColor(android.graphics.Color.parseColor(color));
        }

        // 保存修改后的开关状态到配置
        configs.put("randomColor", checked);
    });

    // 账号开关状态变化监听
    ui.accountSwitch.on("check", (checked) => {
        // console.log("账号开关状态变化:", checked);
        // 保存修改后的开关状态到配置
        configs.put("switchAccount", checked);
    });

    // 是否升仓开关状态变化监听
    ui.isShengcang.on("check", (checked) => {
        // 保存修改后的开关状态到配置
        configs.put("isShengcang", checked);
    });

    // 仓库统计开关状态变化监听
    ui.isCangkuStatistics.on("check", (checked) => {
        // 保存修改后的开关状态到配置
        configs.put("isCangkuStatistics", checked);
    });

    // 是否自动滑动开关状态变化监听
    ui.treeShouldSwipeSwitch.on("check", (checked) => {
        // 保存修改后的开关状态到配置
        configs.put("treeShouldSwipe", checked);
    });

    // 添加输入框的文本变化监听器
    // Token输入框
    ui.tokenInput.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的Token到配置
            // configs.put("token", s.toString());
        }
    }));

    ui.tokenInputPlain.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的明文Token到配置
            // configs.put("token", s.toString());
        }
    }));

    // 汤姆查找相关
    ui.Tom_itemName.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的物品名称到配置
            configs.put("Tom_itemName", s.toString());
        }
    }));

    // 坐标偏移相关
    ui.landOffsetX.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的X偏移量到配置
            configs.put("landOffsetX", Number(s));
        }
    }));

    ui.landOffsetY.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的Y偏移量到配置
            configs.put("landOffsetY", Number(s));
        }
    }));

    ui.shopOffsetX.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的商店X偏移量到配置
            configs.put("shopOffsetX", Number(s));
        }
    }));

    ui.shopOffsetY.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的商店Y偏移量到配置
            configs.put("shopOffsetY", Number(s));
        }
    }));

    // 收割相关
    ui.firstlandX.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的第一个坐标X到配置
            configs.put("firstlandX", Number(s));
        }
    }));

    ui.firstlandY.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的第一个坐标Y到配置
            configs.put("firstlandY", Number(s));
        }
    }));

    ui.distance.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的距离到配置
            configs.put("distance", Number(s));
        }
    }));

    ui.matureTime.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的成熟时间到配置
            configs.put("matureTime", Number(s));
        }
    }));

    ui.harvestTime.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的收割时间到配置
            configs.put("harvestTime", Number(s));
        }
    }));

    ui.harvestX.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的收割坐标X到配置
            configs.put("harvestX", Number(s));
        }
    }));

    ui.harvestY.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的收割坐标Y到配置
            configs.put("harvestY", Number(s));
        }
    }));

    ui.harvestRepeat.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的收割重复次数到配置
            configs.put("harvestRepeat", Number(s));
        }
    }));

    // 保留数量
    ui.ReservedQuantity.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的保留数量到配置
            configs.put("ReservedQuantity", Number(s));
        }
    }));

    // 悬浮窗坐标
    ui.showTextX.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的悬浮窗坐标X到配置
            configs.put("showTextX", Number(s));
        }
    }));

    ui.showTextY.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的悬浮窗坐标Y到配置
            configs.put("showTextY", Number(s));
        }
    }));

    // 照片路径
    ui.photoPath.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的照片路径到配置
            configs.put("photoPath", s.toString());
        }
    }));

    // 粮仓坐标偏移
    ui.liangcangOffsetX.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的粮仓坐标偏移X到配置
            configs.put("liangcangOffsetX", Number(s));
        }
    }));

    ui.liangcangOffsetY.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的粮仓坐标偏移Y到配置
            configs.put("liangcangOffsetY", Number(s));
        }
    }));

    // 货仓坐标偏移
    ui.huocangOffsetX.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的货仓坐标偏移X到配置
            configs.put("huocangOffsetX", Number(s));
        }
    }));

    ui.huocangOffsetY.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的货仓坐标偏移Y到配置
            configs.put("huocangOffsetY", Number(s));
        }
    }));

    // 截图坐标
    ui.screenshotX1.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的截图坐标X1到配置
            configs.put("screenshotX1", Number(s));
        }
    }));

    ui.screenshotY1.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的截图坐标Y1到配置
            configs.put("screenshotY1", Number(s));
        }
    }));

    ui.screenshotX2.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的截图坐标X2到配置
            configs.put("screenshotX2", Number(s));
        }
    }));

    ui.screenshotY2.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的截图坐标Y2到配置
            configs.put("screenshotY2", Number(s));
        }
    }));

    ui.screenshotX3.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的截图坐标X3到配置
            configs.put("screenshotX3", Number(s));
        }
    }));

    ui.screenshotY3.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的截图坐标Y3到配置
            configs.put("screenshotY3", Number(s));
        }
    }));

    // 升仓时间
    ui.shengcangTime.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的升仓时间到配置
            configs.put("shengcangTime", Number(s));
        }
    }));

    // 仓库统计时间
    ui.cangkuStatisticsTime.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的仓库统计时间到配置
            configs.put("cangkuStatisticsTime", Number(s));
        }
    }));

    ui.cangkuStatisticsPage.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的仓库统计页码到配置
            configs.put("cangkuStatisticsPage", Number(s));
        }
    }));
}

// 设置寻找土地方法按钮状态
function setLandMethod(method) {
    // 更新全局状态变量
    currentLandFindMethod = method;

    if (method === "商店") {
        ui.methodShop.attr("bg", color);
        ui.methodShop.attr("textColor", "#FFFFFF");
        ui.methodBakery.attr("bg", "#E0E0E0");
        ui.methodBakery.attr("textColor", "#000000");
    } else {
        ui.methodShop.attr("bg", "#E0E0E0");
        ui.methodShop.attr("textColor", "#000000");
        ui.methodBakery.attr("bg", color);
        ui.methodBakery.attr("textColor", "#FFFFFF");
    }

    // 强制刷新UI
    ui.methodShop.attr("bg", ui.methodShop.attr("bg"));
    ui.methodBakery.attr("bg", ui.methodBakery.attr("bg"));

}

function stopOtherEngines(stopAll = false) {
    log("开始停止" + (stopAll ? "所有" : "其他") + "引擎");
    let engineArray = engines.all();
    let engine0 = engines.myEngine();
    // 遍历引擎数组
    let stoppedAny = false;
    for (let i = 0; i < engineArray.length; i++) {
        let engine = engineArray[i];
        // 如果当前引擎是主引擎，则跳过
        if (!stopAll && engine === engine0) {
            continue;
        }

        try {
            engine.forceStop();
            // 从引擎数组中移除已停止的引擎
            engineArray.splice(i, 1);
            log(`已停止引擎(ID: ${engine.id})`);
            stoppedAny = true;
        } catch (e) {
            log(`停止引擎失败(ID: ${engine.id}): ${e}`);
        }
    }

    if (!stoppedAny) {
        // toast("没有需要停止的引擎");
    }

    // 如果包含主引擎且成功停止了所有引擎，可以退出程序
    if (stopAll) {
        log("所有引擎已停止，退出程序");
        engines.myEngine().forceStop();
    }
}



// 使用须知内容
const instructions = [
    "使用说明：",
    "",
    "在线文档",
    "• 腾讯文档: https://docs.qq.com/doc/DWEtDUXB0U0dISGxo",
    "",
    "配置存储位置：",
    "日志文件位置：",
    logDir,
    ""

].join("\n");

// ==================== 事件绑定 ====================

// 使用须知按钮点击事件
ui.btnInstructions.click(() => {
    dialogs.build({
        title: "使用说明",
        content: instructions,
        contentTextSize: 14,
        positive: "关闭",
        neutral: "复制文档链接",
        negative: "打开文档"
    }).on("neutral", () => {
        setClip("https://docs.qq.com/doc/DWEtDUXB0U0dISGxo");
        toast("文档链接已复制");
    }).on("negative", () => {
        app.openUrl("https://docs.qq.com/doc/DWEtDUXB0U0dISGxo");
    }).show();
});


// 保存按钮点击事件
ui.btnSave.click(() => {
    const config = validateConfig(getConfig());
    // 将配置保存到文件
    try {
        // 确保配置目录存在
        files.ensureDir(configPath);
        // 将配置写入文件
        files.write(configPath, JSON.stringify(config, null, 2));

        // 同时将配置保存到存储
        if (saveConfig(config)) {
            toastLog("配置保存成功");
        } else {
            toastLog("配置保存到存储失败");
        }
    } catch (e) {
        console.error("保存配置文件失败:", e);
        toastLog("配置保存失败: " + e.message);
    }

});

// 加载配置按钮点击事件
ui.btnLoadConfig.click(() => {
    loadConfigToUI(loadConfigFromFile = true);
    toast("配置已加载");
});

ui.btnStop.click(() => {
    stopOtherEngines();
});

// 输出当前配置日志
function logCurrentConfig(config) {
    console.log("=============== 当前配置 ===============");
    console.log("应用版本: " + getAppVersion());
    console.log("设备分辨率：" + config.deviceScreenSize);
    console.log("选择功能: " + config.selectedFunction.text);
    console.log("种植作物: " + config.selectedCrop.text);
    console.log("成熟时间: " + config.matureTime.text);
    console.log("种植树木: " + config.selectedTree.text);
    console.log("商店价格: " + config.shopPrice.text);
    console.log("剩余数量：" + config.ReservedQuantity);
    console.log("地块查找方法: " + config.landFindMethod);
    console.log("切换账号: " + (config.switchAccount ? "是" : "否"));
    console.log("账号识别方式: " + config.findAccountMethod);
    // console.log("账号数量: " + config.accountNames.length);
    console.log("土地偏移: (" + config.landOffset.x + ", " + config.landOffset.y + ")");
    console.log("商店偏移: (" + config.shopOffset.x + ", " + config.shopOffset.y + ")");
    console.log("收割横向偏移: " + config.harvestX + "格");
    console.log("收割纵向偏移: " + config.harvestY + "格");
    console.log("收割重复次数: " + config.harvestRepeat + "次");
    console.log("收割操作用时: " + config.harvestTime + "秒");
    console.log("粮仓偏移: (" + config.liangcangOffset.x + ", " + config.liangcangOffset.y + "), 货仓偏移 (" + config.huocangOffset.x + ", " + config.huocangOffset.y + ")");
    console.log("是否升仓: " + (config.isShengcang ? "是" : "否") + ", 升仓间隔时间: " + config.shengcangTime + "分钟");
    console.log("是否仓库统计: " + (config.isCangkuStatistics ? "是" : "否") + ", 仓库统计间隔时间: " + config.cangkuStatisticsTime + "分钟");
    console.log("推送方式: " + config.serverPlatform.text);
    console.log("token: " + "骗你的,不会把token输出到日志,切勿泄漏个人token!!!");
    console.log("浮动按钮: " + (ui.win_switch.checked ? "是" : "否"));
    // console.log("主题颜色: " + config.themeColor.text);config
    // console.log("随机颜色: " + (config.randomColor ? "是" : "否"));
    console.log("============================");
}

//自动获取截图权限
function autoSc() {

    isclick = false;
    // 如果配置了截图坐标，则依次点击填入的坐标
    if ((config.screenshotCoords.coord1.x !== "" && config.screenshotCoords.coord1.y !== "") ||
        (config.screenshotCoords.coord2.x !== "" && config.screenshotCoords.coord2.y !== "") ||
        (config.screenshotCoords.coord3.x !== "" && config.screenshotCoords.coord3.y !== "")) {
        sleep(1000);
        isclick = true;
    }
    // 点击coord1坐标
    if (config.screenshotCoords.coord1.x !== "" &&
        config.screenshotCoords.coord1.y !== "") {
        click(parseInt(config.screenshotCoords.coord1.x), parseInt(config.screenshotCoords.coord1.y));
        sleep(500); // 等待500毫秒
    }

    // 点击coord2坐标
    if (config.screenshotCoords.coord2.x !== "" &&
        config.screenshotCoords.coord2.y !== "") {
        click(parseInt(config.screenshotCoords.coord2.x), parseInt(config.screenshotCoords.coord2.y));
        sleep(500); // 等待500毫秒
    }

    // 点击coord3坐标
    if (config.screenshotCoords.coord3.x !== "" &&
        config.screenshotCoords.coord3.y !== "") {
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
}

function startButton() {
    const config = validateConfig(getConfig());
    configs.put("config", config);
    storages.remove("times");
    statistics.remove("rowContentData");
    log("点击开始按钮")
    if (device.width != 720 || device.height != 1280) {
        toastLog("当前分辨率不正确，请使用720*1280分辨率")
    }

    if (!auto.service) {
        toast("请先开启无障碍服务");
        app.startActivity({
            action: "android.settings.ACCESSIBILITY_SETTINGS"
        });
        return;
    }

    // 输出当前配置
    logCurrentConfig(config);

    switch (config.selectedFunction.code) {
        case 0: // 刷地
            stopOtherEngines(); // 先清理所有任务
            log(config.accountMethod);
            if (config.accountMethod == "email") {
                threads.start(() => {
                    log("开始启动刷地引擎");
                    launch("com.supercell.hayday");
                    sleep(1000);
                    let newEngine = engines.execScriptFile("./shuadi.js");
                    log("启动刷地引擎，ID: " + newEngine.id);

                })
            }
            else if (config.accountMethod == "save") {
                threads.start(() => {
                    if (!checkRoot()) {
                        toastLog("请先获取Root权限");
                        return;
                    }

                    log("开始启动刷地引擎");

                    sleep(1000);
                    let newEngine = engines.execScriptFile("./shuadi.js");
                    log("启动刷地引擎，ID: " + newEngine.id);

                })
            }
            break;

        case 1: // 种树
            stopOtherEngines();

            launch("com.supercell.hayday");
            setTimeout(() => { }, 1000);
            if (!ui.win_switch.checked) {
                float_win.open();
                log("启动浮动按钮");
            } else log("已启动浮动按钮");

            // toast("功能开发中");
            break;

        case 2: // 创新号
            stopOtherEngines();
            threads.start(() => {
                launch("com.supercell.hayday");
                sleep(1000);
                let newEngine = engines.execScriptFile("./createNewAccount.js");
                log("启动建号引擎，ID: " + newEngine.id);

            });
            break;

        default:
            toast("未知功能", "long");
    }
}

function winStartButton() {
    const config = validateConfig(getConfig());
    configs.put("config", config);
    storages.remove("times");
    storages.remove("rowContentData");

    if (device.width != 720 || device.height != 1280) {
        toastLog("当前分辨率不正确，请使用720*1280分辨率,1")
    }

    if (!auto.service) {
        toast("请先开启无障碍服务");
        app.startActivity({
            action: "android.settings.ACCESSIBILITY_SETTINGS"
        });
        return;
    }

    // 输出当前配置
    logCurrentConfig(config);

    switch (config.selectedFunction.code) {
        case 0: // 刷地
            stopOtherEngines(); // 先清理所有任务
            threads.start(() => {
                launch("com.supercell.hayday");
                sleep(1000);
                let newEngine = engines.execScriptFile("./shuadi.js");
                log("启动刷地引擎，ID: " + newEngine.id);

            });
            break;

        case 1: // 种树
            stopOtherEngines();
            setTimeout(() => { }, 1000);
            threads.start(() => {
                let newEngine = engines.execScriptFile("./zhongshu.js");
                log("启动种树引擎，ID: " + newEngine.id);
            });
            break;

        case 2: // 创新号
            stopOtherEngines();
            threads.start(() => {
                launch("com.supercell.hayday");
                sleep(1000);
                let newEngine = engines.execScriptFile("./createNewAccount.js");
                log("启动建号引擎，ID: " + newEngine.id);

            });
            break;

        default:
            toast("未知功能", "long");
    }
}

ui.btnStart.click(startButton);


//监听引擎重启事件
// events.broadcast.on("engine_r", function (type) {
//     log("监听到引擎重启事件: " + type);

//     if (type == "刷地引擎") {
//         stopOtherEngines();
//         log("重启刷地引擎");
//         let newEngine = engines.execScriptFile("./shuadi.js");
//         log("新刷地引擎ID: " + newEngine.id);

//     }

//     else if (type == "刷地引擎_存档") {
//         stopOtherEngines();
//         log("发送重启事件");
//         events.broadcast.emit("switchSaveAccount", timeStorage.get("nextAccountToChange"));

//     }

//     else if (type == "种树引擎") {
//         stopOtherEngines();
//         let newEngine = engines.execScriptFile("./zhongshu.js");
//         log("新种树引擎ID: " + newEngine.id);

//     }
// });

/**
 * 初始化界面
 */
function initUI() {
    // 检查更新
    checkForUpdates(true);

    // 尝试加载配置（从存储对象）
    // 使用存储对象加载配置
    try {
        loadConfigToUI();
    } catch (e) {
        console.error("加载配置失败:", e);
        toast("加载配置失败: " + e.message, "long");
    }

    // 初始化权限开关状态
    updateSwitchStatus();

    // 绑定土地方法按钮事件
    ui.methodShop.click(() => {
        setLandMethod("商店");
        configs.put("landFindMethod", "商店");
    });
    ui.methodBakery.click(() => {
        setLandMethod("面包房");
        configs.put("landFindMethod", "面包房");
    });

    ui.functionSelect.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener({
        onItemSelected: function (parent, view, position, id) {
            const item = parent.getItemAtPosition(position).toString();
            // console.log("功能选择发生变化: " + item);

            // 获取当前选择的功能
            const selectedFunction = item;

            // 根据选择的功能显示/隐藏相应的选项
            if (selectedFunction === "刷地") {
                // 显示作物选择和汤姆开关，隐藏树木选择
                ui.cropSelectContainer.attr("visibility", "visible");
                ui.shopPriceContainer.attr("visibility", "visible");
                ui.tomSwitchContainer.attr("visibility", "visible");
                ui.treeSelectContainer.attr("visibility", "gone");
                ui.treeShouldSwipe.attr("visibility", "gone");
                ui.addFriendsCard.attr("visibility", "gone");
                // 控制汤姆相关控件
                if (ui.tomSwitch.isChecked()) {
                    ui.tomItemContainer.attr("visibility", "visible");
                } else {
                    ui.tomItemContainer.attr("visibility", "gone");
                }
            } else if (selectedFunction === "种树") {
                // 隐藏作物选择和汤姆开关，显示树木选择
                ui.cropSelectContainer.attr("visibility", "gone");
                ui.shopPriceContainer.attr("visibility", "gone");
                ui.tomSwitchContainer.attr("visibility", "gone");
                ui.treeSelectContainer.attr("visibility", "visible");
                ui.treeShouldSwipe.attr("visibility", "visible");
                ui.addFriendsCard.attr("visibility", "gone");
                // 隐藏汤姆相关控件
                ui.tomItemContainer.attr("visibility", "gone");
            } else if (selectedFunction === "创新号") {
                // 创新号
                ui.cropSelectContainer.attr("visibility", "gone");
                ui.shopPriceContainer.attr("visibility", "gone");
                ui.tomSwitchContainer.attr("visibility", "gone");
                ui.treeSelectContainer.attr("visibility", "gone");
                ui.treeShouldSwipe.attr("visibility", "gone");
                ui.addFriendsCard.attr("visibility", "visible");
                // 隐藏汤姆相关控件
                ui.tomItemContainer.attr("visibility", "gone");
            }

            // 保存选择的功能到配置
            configs.put("selectedFunction", { text: selectedFunction, code: position });
        }
    }))

    // 为itemType添加事件监听器
    ui.Tom_itemType.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener({
        onItemSelected: function (parent, view, position, id) {
            const item = parent.getItemAtPosition(position).toString();
            // console.log("物品类型选择发生变化: " + item);
            // 保存选择的物品类型到配置
            configs.put("Tom_itemType", item);
            configs.put("Tom_code", position);
        },
        onNothingSelected: function (parent) { }
    }));

    ui.cropSelect.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener({
        onItemSelected: function (parent, view, position, id) {
            const item = parent.getItemAtPosition(position).toString();

            // 根据作物选择自动设置成熟时间
            const matureTimes = {
                "小麦": 2,
                "玉米": 5,
                "胡萝卜": 10,
                "大豆": 20,
                "甘蔗": 30
            };

            if (matureTimes[item] !== undefined) {
                ui.matureTime.setText(String(matureTimes[item]));
            }

            // 保存选择的作物到配置
            configs.put("selectedCrop", { text: item, code: position });
        },
        onNothingSelected: function (parent) { }
    }));

    ui.treeSelect.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener({
        onItemSelected: function (parent, view, position, id) {
            const item = parent.getItemAtPosition(position).toString();
            // console.log("树木选择发生变化: " + item);
            // 保存选择的树木到配置
            configs.put("selectedTree", { text: item, code: position });
        },
        onNothingSelected: function (parent) { }
    }));

    ui.shopPrice.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener({
        onItemSelected: function (parent, view, position, id) {
            const item = parent.getItemAtPosition(position).toString();
            // console.log("商店售价选择发生变化: " + item);
            // 保存选择的商店售价到配置
            configs.put("shopPrice", { text: item, code: position });
        },
        onNothingSelected: function (parent) { }
    }));

    ui.themeColor.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener({
        onItemSelected: function (parent, view, position, id) {
            const item = parent.getItemAtPosition(position).toString();
            // console.log("主题颜色选择发生变化: " + item);

            // 更新颜色
            const colorNames = ["碧玉青", "落日橙", "翠竹绿", "晴空蓝", "胭脂粉", "朱砂红", "湖水蓝", "柠檬黄", "咖啡棕", "烟雨灰"];
            const selectedIndex = colorNames.indexOf(item);
            if (selectedIndex >= 0) {
                color = colorLibrary[selectedIndex];

                // 更新UI颜色
                ui.statusBarColor(color);
                ui.appbar.setBackgroundColor(android.graphics.Color.parseColor(color));

                // 更新商店按钮颜色（如果当前选中的是商店方法）

                updateButtonColors();

                // 更新spinner文字颜色
                ui.themeColor.setTextColor(android.graphics.Color.parseColor(color));
            }

            // 保存选择的主题颜色到配置
            configs.put("themeColor", { text: item, code: position });
        },
        onNothingSelected: function (parent) { }
    }));

    // 绑定账号识别方式按钮事件
    ui.findAccountImage.click(() => {
        setFindAccountMethod("image");
        // 保存选择的账号识别方式到配置
        configs.put("findAccountMethod", "image");
    });
    ui.findAccountText.click(() => {
        setFindAccountMethod("ocr");
        // 保存选择的账号识别方式到配置
        configs.put("findAccountMethod", "ocr");
    });

    // 绑定账号方式切换按钮事件
    ui.accountMethodEmail.click(() => {
        setAccountMethod("email");
        // 保存选择的账号方式到配置
        configs.put("accountMethod", "email");
    });
    ui.accountMethodSave.click(() => {
        setAccountMethod("save");
        // 保存选择的账号方式到配置
        configs.put("accountMethod", "save");
    });

    // 为token输入框添加变化监听
    ui.tokenInput.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            token_storage.put("token", s.toString());
        },
        afterTextChanged: function (s) { }
    }));

    // 为普通token输入框添加变化监听
    ui.tokenInputPlain.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            token_storage.put("token", s.toString());
        },
        afterTextChanged: function (s) { }
    }));

    // 为itemName输入框添加变化监听
    ui.Tom_itemName.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的itemName到配置
            configs.put("Tom_itemName", s.toString());
        },
        afterTextChanged: function (s) { }
    }));

    // 为坐标偏移输入框添加变化监听
    ui.landOffsetX.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的landOffsetX到配置
            configs.put("landOffsetX", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    ui.landOffsetY.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的landOffsetY到配置
            configs.put("landOffsetY", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    ui.shopOffsetX.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的shopOffsetX到配置
            configs.put("shopOffsetX", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    ui.shopOffsetY.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的shopOffsetY到配置
            configs.put("shopOffsetY", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    // 为初始土地偏移输入框添加变化监听
    ui.firstlandX.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的firstlandX到配置
            configs.put("firstlandX", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    ui.firstlandY.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的firstlandY到配置
            configs.put("firstlandY", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    // 为收割两指间距输入框添加变化监听
    ui.distance.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的distance到配置
            configs.put("distance", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    // 为收割操作时用时输入框添加变化监听
    ui.harvestTime.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的harvestTime到配置
            configs.put("harvestTime", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    // 为收割横向偏移输入框添加变化监听
    ui.harvestX.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的harvestX到配置
            configs.put("harvestX", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    // 为收割纵向偏移输入框添加变化监听
    ui.harvestY.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的harvestY到配置
            configs.put("harvestY", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    // 为收割重复次数输入框添加变化监听
    ui.harvestRepeat.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的harvestRepeat到配置
            configs.put("harvestRepeat", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    // 为悬浮窗坐标输入框添加变化监听
    ui.showTextX.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的showTextX到配置
            configs.put("showTextX", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    ui.showTextY.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的showTextY到配置
            configs.put("showTextY", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    // 为照片路径输入框添加变化监听
    ui.photoPath.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的photoPath到配置
            configs.put("photoPath", s.toString());
        },
        afterTextChanged: function (s) { }
    }));

    // 为粮仓坐标偏移输入框添加变化监听
    ui.liangcangOffsetX.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的liangcangOffsetX到配置
            configs.put("liangcangOffsetX", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    ui.liangcangOffsetY.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的liangcangOffsetY到配置
            configs.put("liangcangOffsetY", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    // 为货仓坐标偏移输入框添加变化监听
    ui.huocangOffsetX.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的huocangOffsetX到配置
            configs.put("huocangOffsetX", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    ui.huocangOffsetY.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的huocangOffsetY到配置
            configs.put("huocangOffsetY", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    ui.huocangOffsetY.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的huocangOffsetY到配置
            configs.put("huocangOffsetY", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    // 为截图坐标输入框添加变化监听
    ui.screenshotX1.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的screenshotX1到配置
            configs.put("screenshotX1", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    ui.screenshotY1.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的screenshotY1到配置
            configs.put("screenshotY1", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    ui.screenshotX2.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的screenshotX2到配置
            configs.put("screenshotX2", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    ui.screenshotY2.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的screenshotY2到配置
            configs.put("screenshotY2", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    ui.screenshotX3.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的screenshotX3到配置
            configs.put("screenshotX3", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    ui.screenshotY3.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的screenshotY3到配置
            configs.put("screenshotY3", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    // 为cangkuTime输入框添加变化监听
    ui.shengcangTime.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的shengcangTime到配置
            configs.put("shengcangTime", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    // 为仓库统计间隔时间输入框添加变化监听
    ui.cangkuStatisticsTime.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的cangkuStatisticsTime到配置
            configs.put("cangkuStatisticsTime", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    // 为仓库统计页数输入框添加变化监听
    ui.cangkuStatisticsPage.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的cangkuStatisticsPage到配置
            configs.put("cangkuStatisticsPage", Number(s));
        },
        afterTextChanged: function (s) { }
    }));

    // 为eyeIcon添加点击事件
    ui.eyeIcon.click(() => {
        // 获取当前token的值
        const currentToken = ui.tokenInput.getText();
        // 检查当前输入框是否是密码模式
        const isPassword = ui.tokenInput.attr("visibility") === "visible";

        if (isPassword) {
            // 如果是密码模式，则切换为显示模式
            ui.tokenInputPlain.setText(token_storage.get("token", ""));
            ui.tokenInputPlain.attr("visibility", "visible"); // 显示普通输入框
            ui.tokenInput.attr("visibility", "gone"); // 隐藏密码输入框
            ui.eyeIcon.attr("src", "data:image/png;base64," + icon.visibility);
        } else {
            // 如果是显示模式，则切换为密码模式
            ui.tokenInput.setText(token_storage.get("token", ""));
            ui.tokenInputPlain.attr("visibility", "gone"); // 隐藏普通输入框
            ui.tokenInput.attr("visibility", "visible"); // 显示密码输入框
            ui.eyeIcon.attr("src", "data:image/png;base64," + icon.visibility_off);
        }
    });




    // 为推送方式选择器添加监听
    ui.serverPlatform.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener({
        onItemSelected: function (parent, view, position, id) {
            const item = parent.getItemAtPosition(position).toString();
            // console.log("推送方式选择发生变化: " + item);
            // 保存选择的推送方式到配置
            configs.put("serverPlatform", { "text": item, "code": position });
        },
        onNothingSelected: function (parent) { }
    }));

}

/**
 * 更新权限开关状态
 */
function updateSwitchStatus() {
    // 无障碍服务状态
    ui.autoService.checked = (auto.service != null);
    //浮动按钮状态
    ui.win_switch.checked = float_win.isCreated();


}
// 初始化界面
initUI();


