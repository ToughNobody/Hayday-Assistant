"ui";

const icon = require("./icon_Base64.js");

// 创建存储对象
let token_storage = storages.create("token_storage");
let statistics = storages.create("statistics");

// 初始化创新号账号列表
let AddFriendsList = [];


// 全局状态变量，用于跟踪各种选择状态，避免依赖颜色判断
let currentAccountMethod = "email"; // 当前账号方式: "email" 或 "save"
let currentFindAccountMethod = "ocr"; // 当前账号识别方式: "image" 或 "ocr"
let currentLandFindMethod = "商店"; // 当前寻找土地方法: "商店" 或 "面包房"

let engine0 = engines.myEngine();
const engineIds = {
    main: engine0.id,
    shuadi: null,
    zhongshu: null,
    createNewAccount: null
};


// 配置文件路径
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
// 确保配置文件存在
if (!files.exists(configPath)) {
    files.create(configPath);  // 创建配置文件
}

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
var color;

// 初始化颜色函数
function initColor() {
    // 尝试从配置文件加载颜色设置
    const config = loadConfig();
    if (config && config.themeColor && config.themeColor.code >= 0) {
        // 如果配置中有颜色设置，使用配置中的颜色
        color = colorLibrary[config.themeColor.code];
    } else {
        // 否则随机选择一个颜色
        color = colorLibrary[Math.floor(Math.random() * colorLibrary.length)];
    }
}

// 初始化颜色
initColor();


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
        // 尝试执行需要root权限的命令
        let result = shell("su -c id", true);
        if (result.code === 0) {
            return true;
        } else {
            return false;
        }
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
                                        <text text="选择功能：" textSize="14" w="100" marginRight="8" />
                                        <spinner id="functionSelect" entries="刷地|种树|创新号"
                                            w="*" textSize="14" h="48" bg="#FFFFFF" />
                                    </horizontal>

                                    {/* 作物选择 - 仅在刷地时显示 */}
                                    <horizontal id="cropSelectContainer" gravity="center_vertical">
                                        <text text="种植作物：" textSize="14" w="100" marginRight="8" />
                                        <spinner id="cropSelect" entries="小麦|玉米|胡萝卜|大豆"
                                            w="*" textSize="14" h="48" bg="#FFFFFF" />
                                    </horizontal>

                                    {/* 商店售价 - 仅在刷地时显示*/}
                                    <horizontal id="shopPriceContainer" gravity="center_vertical">
                                        <text text="商店售价：" textSize="14" w="100" marginRight="8" />
                                        <spinner id="shopPrice" entries="最低|平价|最高" w="*" textSize="14" h="48" bg="#FFFFFF" />
                                    </horizontal>

                                    {/* 树木选择 - 仅在种树时显示 */}
                                    <horizontal id="treeSelectContainer" gravity="center_vertical">
                                        <text text="种植树木：" textSize="14" w="100" marginRight="8" />
                                        <spinner id="treeSelect" entries="苹果树|树莓丛|樱桃树|黑莓丛|蓝莓丛|可可树|咖啡丛|橄榄树|柠檬树|香橙树|水蜜桃树|香蕉树|西梅树|芒果树|椰子树|番石榴树|石榴树"
                                            w="*" textSize="14" h="48" bg="#FFFFFF" />
                                    </horizontal>

                                    {/* 是否滑动 - 仅在种树时显示 */}
                                    <horizontal id="treeShouldSwipe" gravity="center_vertical">
                                        <text text="是否自动滑动：" textSize="14" w="100" marginRight="8" />
                                        <Switch id="treeShouldSwipeSwitch" w="*" h="48"
                                            gravity="left|center" />
                                    </horizontal>

                                    <card id="addFriendsCard" w="*" h="auto" marginBottom="12" cardCornerRadius="8" cardElevation="2">
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
                                                        <view h="*" w="10" bg="#f27272" />
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
                                <space w="16" />
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
                                        <switch id="accountSwitch" w="*" h="48"
                                            gravity="left|center" />
                                    </horizontal>
                                    <horizontal gravity="center_vertical" >
                                        <text text="识别方式：" textSize="14" w="100" marginRight="8" />
                                    </horizontal>
                                    <horizontal gravity="center_vertical" marginTop="8">
                                        <button id="findAccountImage" text="图片识别" w="120" h="40" textSize="14" bg="#4CAF50" textColor="#FFFFFF" marginRight="8" />
                                        <button id="findAccountText" text="文字识别" w="120" h="40" textSize="14" bg="#E0E0E0" textColor="#000000" />
                                    </horizontal>

                                    {/* 账号方式选择 */}
                                    <horizontal gravity="center_vertical" marginTop="8">
                                        <text text="切换账号方式：" textSize="14" w="100" marginRight="8" />
                                        <button id="accountMethodEmail" text="邮箱" w="100" h="40" textSize="14" bg="#4CAF50" textColor="#FFFFFF" marginRight="8" />
                                        <button id="accountMethodSave" text="存档" w="100" h="40" textSize="14" bg="#E0E0E0" textColor="#000000" />
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
                                                <view h="*" w="10" bg="#f27272" />
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
                                                <view h="*" w="10" bg="#4CAF50" />
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

                            {/* 寻找土地方法卡片 - 使用按钮模拟单选 */}
                            <card w="*" h="auto" marginBottom="12" cardCornerRadius="8" cardElevation="2">
                                <vertical padding="16">
                                    <text text="寻找土地方法" textSize="16" textStyle="bold" marginBottom="16" />
                                    <horizontal gravity="center_vertical">
                                        <button id="methodShop" text="商店" w="120" h="40" textSize="14" bg="#4CAF50" textColor="#FFFFFF" marginRight="16" />
                                        <button id="methodBakery" text="面包房" w="120" h="40" textSize="14" bg="#E0E0E0" textColor="#000000" />
                                    </horizontal>
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
                                        <input id="tokenInput" password="true" hint="切勿泄漏token" w="*" textSize="14" h="auto" bg="#FFFFFF" padding="8" marginRight="8" gravity="center_vertical" />
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
                                        <text id="screenResolution" text="{{device.width}}×{{device.height}}"
                                            textSize="14" w="*" />
                                    </horizontal>

                                    {/* 屏幕密度 */}
                                    <horizontal gravity="center_vertical" marginBottom="8">
                                        <text text="DPI：" textSize="14" w="100" marginRight="8" />
                                        <text id="screenDensity" text="{{device.density}}"
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
                                        <text id="deviceModel" text="{{device.brand}} {{device.model}}"
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
                        </vertical>
                    </scroll>
                </frame>
            </viewpager>
        </vertical>
        <vertical layout_gravity="left" bg="#ffffff" w="280">
            <img w="280" h="200" scaleType="fitXY" src="./res/images/sidebar.png" />
            <list id="menu">
                <horizontal bg="?selectableItemBackground" w="*">
                    <img w="50" h="50" padding="16" src="{{this.icon}}" tint="{{color}}" />
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


//创建选项菜单(右上角)
ui.emitter.on("create_options_menu", menu => {
    menu.add("开始");
    menu.add("关于");
    menu.add("日志");
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
    }
    e.consumed = true;
});

// 显示关于对话框函数
function showAboutDialog() {
    dialogs.build({
        title: "关于",
        content: "脚本名称：卡通农场小助手\n" +
            "版本：" + getAppVersion() + "\n" +
            "作者：ToughNobody\n\n" +
            "希望对你有帮助！",
        positive: "确定",
        neutral: "检查更新"
    }).on("neutral", () => {
        checkForUpdates();
    }).show();
}

function checkForUpdatesOnce() {
    log("============= 执行自动更新检查 =============");
    threads.start(() => {
        try {
            // 读取project.json文件获取版本信息
            let projectConfig = files.read('./project.json');
            let projectData = JSON.parse(projectConfig);
            log("当前版本: " + projectData.versionName);
            log("当前版本代码: " + projectData.versionCode);

            // 发送HTTP请求获取最新版本号
            let apiUrl = "https://gitee.com/ToughNobody/Hayday-Assistant/raw/main/version.json";
            log("请求API地址: " + apiUrl);

            let response = http.get(apiUrl, {
                headers: {
                    "Accept": "application/vnd.github.v3+json"
                }
            });

            log("HTTP响应状态码: " + response.statusCode);

            if (response.statusCode == 200) {
                let result = response.body.json();

                // 检查result对象和version字段是否存在
                if (!result || !result.version) {
                    log("错误: 无法获取版本信息，result对象或version为空");
                    return;
                }

                let latestVersion = result.version;
                log("最新版本: " + latestVersion);

                // 比较版本号
                let compareResult = compareVersions(projectData.versionName, latestVersion);
                log("版本比较结果: " + compareResult + " (0=相同, <0=旧版本, >0=新版本)");

                // 只有在当前版本低于最新版本时才显示通知
                if (compareResult < 0) {
                    ui.run(() => {
                        log("发现新版本，显示更新通知");

                        dialogs.build({
                            title: "发现新版本",
                            content: "当前版本: " + projectData.versionName + "\n" +
                                "最新版本: " + latestVersion + "\n\n" +
                                "更新内容: " + (result.description || "无更新说明").substring(0, 200) + "...\n\n" +
                                "是否更新？",
                            positive: "立即更新",
                            negative: "稍后再说"
                        }).on("positive", () => {
                            // 调用热更新模块
                            threads.start(() => {
                                try {
                                    // 加载热更新模块
                                    let hotUpdate = require("./hot_update.js");

                                    // 初始化热更新
                                    hotUpdate.init({
                                        version: result.version,
                                        versionCode: projectData.versionCode,
                                        files: result.files,
                                        description: result.description
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
                        }).show();
                    });
                } else {
                    log("当前版本已是最新或更高，不显示通知");
                }
            } else {
                log("自动更新检查失败: HTTP状态码 " + response.statusCode);
            }
        } catch (e) {
            log("自动更新检查失败: " + e.message);
        }
    });
}

// 检查更新函数
function checkForUpdates() {
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
            let apiUrl = "https://gitee.com/ToughNobody/Hayday-Assistant/raw/main/version.json";
            log("请求API地址: " + apiUrl);
            let response = http.get(apiUrl, {
                headers: {
                    "Accept": "application/vnd.github.v3+json"
                }
            });
            log("HTTP响应状态码: " + response.statusCode);
            log("HTTP响应内容: " + response.body.string());

            if (response.statusCode == 200) {
                let result = response.body.json();

                // 检查result对象和version字段是否存在
                if (!result || !result.version) {
                    log("错误: 无法获取版本信息，result对象或version为空");
                    ui.run(() => {
                        toast("检查更新失败: 无法获取版本信息");
                    });
                    return;
                }

                let latestVersion = result.version;
                log("最新版本: " + latestVersion);

                ui.run(() => {
                    log("关闭更新检查对话框");

                    // 比较版本号
                    let compareResult = compareVersions(projectData.versionName, latestVersion);
                    log("版本比较结果: " + compareResult + " (0=相同, <0=旧版本, >0=新版本)");

                    if (compareResult < 0) {
                        // 有新版本
                        dialogs.build({
                            title: "发现新版本",
                            content: "当前版本: " + projectData.versionName + "\n" +
                                "最新版本: " + latestVersion + "\n\n" +
                                "更新内容: " + (result.description || "无更新说明").substring(0, 200) + "...\n\n" +
                                "是否更新？",
                            positive: "立即更新",
                            negative: "稍后再说"
                        }).on("positive", () => {
                            // 调用热更新模块
                            threads.start(() => {
                                try {
                                    // 加载热更新模块
                                    let hotUpdate = require("./hot_update.js");

                                    // 初始化热更新
                                    hotUpdate.init({
                                        version: result.version,
                                        versionCode: projectData.versionCode,
                                        files: result.files,
                                        description: result.description
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
                        }).show();
                    } else if (compareResult > 0) {
                        // 当前版本更新（开发中）
                        toastLog("你的版本超过了全球100%的用户！作者得在你这更新版本" + projectData.versionName + " > " + latestVersion, "long");
                    } else {
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
//监听主题颜色
ui.themeColor.on("item_selected", (item) => {
    // 只有在randomColor关闭时才使用选择的颜色
    if (!ui.randomColor.isChecked()) {
        color = item.color;
        ui.statusBarColor(color)
        ui.appbar.setBackgroundColor(android.graphics.Color.parseColor(color));
        // 更新按钮的选中状态颜色
        updateButtonColors();
    }
});

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
    // 直接从配置中获取当前选中的土地方法
    const config = loadConfig();
    setLandMethod(config.landFindMethod);
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
                                <img src="./res/images/qrcode_wechat_reward.jpg" w="260" h="260" scaleType="fitXY" />
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
                content: "感谢开源社区的支持！❤️\n本脚本悬浮窗功能参考了https://zhima.blog.csdn.net/"
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

// 初始化账号列表
let AccountList = [];
let SaveAccountList = [];

// 从配置加载账号列表
function loadAccountListFromConfig() {
    const config = loadConfig();
    if (config && config.accountList && Array.isArray(config.accountList)) {
        AccountList = config.accountList;
    } else {
        AccountList = [];
    }
    return AccountList;
}

// 从文件加载存档账号列表
function loadSaveAccountListFromConfig() {
    const saveAccountDir = appExternalDir + "/卡通农场小助手存档";

    // 检查目录是否存在，如果不存在则创建
    files.ensureDir(saveAccountDir + "/1");

    // 从配置加载存档账号列表
    const config = loadConfig();
    let configSaveAccountList = [];
    if (config && config.saveAccountList && Array.isArray(config.saveAccountList)) {
        configSaveAccountList = config.saveAccountList;
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

// 从配置加载addFriends列表
function loadAddFriendsListFromConfig() {
    const config = loadConfig();
    if (config && config.addFriendsList && Array.isArray(config.addFriendsList)) {
        AddFriendsList = config.addFriendsList;
    } else {
        AddFriendsList = [];
    }
    return AddFriendsList;
}

// 保存账号列表到配置
function saveAccountListToConfig() {
    const config = loadConfig();
    config.accountList = AccountList;
    return saveConfig(config);
}

// 保存存档账号列表到配置
function saveSaveAccountListToConfig() {
    const config = loadConfig();
    config.saveAccountList = SaveAccountList;
    return saveConfig(config);
}

// 保存addFriends列表到配置
function saveAddFriendsListToConfig() {
    const config = loadConfig();
    config.addFriendsList = AddFriendsList;
    return saveConfig(config);
}

// 初始化账号列表UI
function initAccountListUI() {
    loadAccountListFromConfig();
    loadSaveAccountListFromConfig();
    ui['AccountList'].setDataSource(AccountList);
    ui['SaveAccountList'].setDataSource(SaveAccountList);
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

    // 自动保存配置
    autoSaveConfig();
}

// 初始化addFriends列表UI
function initAddFriendsListUI() {
    loadAddFriendsListFromConfig();
    ui['addFriendsList'].setDataSource(AddFriendsList);
}

// 点击复选框勾选
ui['AccountList'].on('item_bind', function (itemView, itemHolder) {
    // 绑定勾选框事件
    itemView.done.on('check', function (checked) {
        let item = itemHolder.item;
        item.done = checked;
        itemView.title.invalidate();

        // 保存到配置文件
        saveAccountListToConfig();
    });
});

// 存档账号列表复选框勾选
ui['SaveAccountList'].on('item_bind', function (itemView, itemHolder) {
    // 绑定勾选框事件
    itemView.saveDone.on('check', function (checked) {
        let item = itemHolder.item;
        item.done = checked;
        itemView.saveTitle.invalidate();

        // 保存到配置文件
        saveSaveAccountListToConfig();
    });
});

// 存档账号列表加载按钮点击事件
ui['SaveAccountList'].on('item_bind', function (itemView, itemHolder) {
    // 绑定加载按钮点击事件
    itemView.loadSaveAccount.on('click', function () {
        let item = itemHolder.item;
        // 这里可以添加实际的加载逻辑
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
    });
});

// addFriends列表的复选框勾选事件
ui['addFriendsList'].on('item_bind', function (itemView, itemHolder) {
    // 绑定勾选框事件
    itemView.addFriendsdone.on('check', function (checked) {
        let item = itemHolder.item;
        item.addFriendsdone = checked;
        itemView.addFriendstitle.invalidate();

        // 保存到配置文件
        saveAddFriendsListToConfig();
    });
});

// 点击列表项修改内容
ui['AccountList'].on('item_click', function (item, i, itemView) {
    dialogs.rawInput('修改账号', item.title)
        .then((newTitle) => {
            if (newTitle && newTitle.trim() !== '') {
                item.title = newTitle.trim();
                ui['AccountList'].adapter.notifyDataSetChanged();

                // 保存到配置文件
                saveAccountListToConfig();

                // 自动保存配置
                autoSaveConfig();
            }
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

                // 保存到配置文件
                saveSaveAccountListToConfig();

                // 自动保存配置
                autoSaveConfig();
            }
        });
});

// 点击addFriends列表项修改内容
ui['addFriendsList'].on('item_click', function (item, i, itemView) {
    dialogs.rawInput('修改账号标签', item.addFriendstitle)
        .then((newTitle) => {
            if (newTitle && newTitle.trim() !== '') {
                item.addFriendstitle = newTitle.trim();
                ui['addFriendsList'].adapter.notifyDataSetChanged();

                // 保存到配置文件
                saveAddFriendsListToConfig();

                // 自动保存配置
                autoSaveConfig();
            }
        });
});

// 长按删除addFriends标签
ui['addFriendsList'].on('item_long_click', function (e, item, i) {
    confirm(`确定要删除 "${item.addFriendstitle}" 吗?`)
        .then(ok => {
            if (ok) {
                // 先从数据中删除
                AddFriendsList.splice(i, 1);

                // 保存到配置文件
                saveAddFriendsListToConfig();

                // 自动保存配置
                autoSaveConfig();
            }
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

                // 保存到配置文件
                saveAccountListToConfig();

                // 自动保存配置
                autoSaveConfig();
            }
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

                // 保存到配置文件
                saveSaveAccountListToConfig();

                // 自动保存配置
                autoSaveConfig();
            }
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

                // 保存到配置文件
                saveAddFriendsListToConfig();

                // 自动保存配置
                autoSaveConfig();
            }
        });
});

// 添加新账号
ui['addAccount'].on('click', () => {
    const config = getConfig();
    const method = config.accountMethod || 'email';
    const listName = method === 'email' ? 'AccountList' : 'SaveAccountList';
    const dataList = method === 'email' ? AccountList : SaveAccountList;
    const saveFunction = method === 'email' ? saveAccountListToConfig : saveSaveAccountListToConfig;
    const dialogTitle = method === 'email' ? '请输入新的账号名称' : '请输入新的存档账号名称';

    dialogs.rawInput(dialogTitle)
        .then((title) => {
            if (title && title.trim() !== '') {
                dataList.push({
                    title: title.trim(),
                    done: true
                });
                ui[listName].adapter.notifyDataSetChanged();

                // 保存到配置文件
                saveFunction();

                //保存存档
                if (method === "save") copy_shell(title.trim());

                // 自动保存配置
                autoSaveConfig();
            }
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



// ==================== 配置文件处理 ====================

/**
 * 获取当前配置
 */
function getConfig() {
    // 从AccountList生成accountNames数组，确保一致性
    const accountNamesFromList = AccountList.map(item => item.title);

    // 使用全局状态变量获取当前配置，不依赖颜色判断
    return {
        selectedFunction: {
            text: ui.functionSelect.getSelectedItem(),
            code: ["刷地", "种树", "创新号"].indexOf(ui.functionSelect.getSelectedItem())
        },

        selectedCrop: {
            text: ui.cropSelect.getSelectedItem(),
            code: ["小麦", "玉米", "胡萝卜", "大豆"].indexOf(ui.cropSelect.getSelectedItem())
        },
        selectedTree: {
            text: ui.treeSelect.getSelectedItem(),
            code: ["苹果树", "树莓丛", "樱桃树", "黑莓丛", "蓝莓丛", "可可树", "咖啡丛", "橄榄树", "柠檬树", "香橙树", "水蜜桃树", "香蕉树", "西梅树", "芒果树", "椰子树", "番石榴树", "石榴树"].indexOf(ui.treeSelect.getSelectedItem())
        },
        switchAccount: ui.accountSwitch.isChecked(),
        findAccountMethod: currentFindAccountMethod, // 使用全局变量
        accountMethod: currentAccountMethod, // 使用全局变量
        accountList: AccountList, // 添加账号列表到配置
        saveAccountList: SaveAccountList, // 添加存档账号列表到配置
        addFriendsList: AddFriendsList, // 添加创新号账号列表到配置
        shopPrice: {
            text: ui.shopPrice.getSelectedItem(),
            code: ["最低", "平价", "最高"].indexOf(ui.shopPrice.getSelectedItem())
        },
        landFindMethod: currentLandFindMethod, // 使用全局变量
        landOffset: {
            x: parseInt(ui.landOffsetX.text()) ?? defaultConfig.landOffset.x,
            y: parseInt(ui.landOffsetY.text()) ?? defaultConfig.landOffset.y
        },
        shopOffset: {
            x: parseInt(ui.shopOffsetX.text()) ?? defaultConfig.shopOffset.x,
            y: parseInt(ui.shopOffsetY.text()) ?? defaultConfig.shopOffset.y
        },

        firstland: {
            x: parseInt(ui.firstlandX.text()) ?? defaultConfig.firstland.x,
            y: parseInt(ui.firstlandY.text()) ?? defaultConfig.firstland.y,
        },
        distance: parseInt(ui.distance.text()) ?? defaultConfig.distance,
        harvestTime: parseInt(ui.harvestTime.text()) ?? defaultConfig.harvestTime,
        harvestX: parseFloat(ui.harvestX.text()) ?? defaultConfig.harvestX,
        harvestY: parseFloat(ui.harvestY.text()) ?? defaultConfig.harvestY,
        harvestRepeat: parseInt(ui.harvestRepeat.text()) ?? defaultConfig.harvestRepeat,
        showText: {
            x: parseFloat(ui.showTextX.text()) ?? defaultConfig.showText.x,
            y: parseFloat(ui.showTextY.text()) ?? defaultConfig.showText.y
        },
        photoPath: ui.photoPath.text().toString(),
        deviceScreenSize: ui.screenResolution.text().toString(),

        randomColor: ui.randomColor.isChecked(),
        themeColor: {
            text: ui.themeColor.getSelectedItem(),
            code: ["碧玉青", "落日橙", "翠竹绿", "晴空蓝", "胭脂粉", "朱砂红", "湖水蓝", "柠檬黄", "咖啡棕", "烟雨灰"].indexOf(ui.themeColor.getSelectedItem())
        },
        isShengcang: ui.isShengcang.isChecked(),
        shengcangTime: parseFloat(ui.shengcangTime.text()) ?? defaultConfig.shengcangTime,
        isCangkuStatistics: ui.isCangkuStatistics.isChecked(),
        cangkuStatisticsTime: parseFloat(ui.cangkuStatisticsTime.text()) ?? defaultConfig.cangkuStatisticsTime,
        cangkuStatisticsPage: parseInt(ui.cangkuStatisticsPage.text()) ?? defaultConfig.cangkuStatisticsPage,
        treeShouldSwipe: ui.treeShouldSwipeSwitch.isChecked(),
        liangcangOffset: {
            x: parseInt(ui.liangcangOffsetX.text()) ?? defaultConfig.liangcangOffset.x,
            y: parseInt(ui.liangcangOffsetY.text()) ?? defaultConfig.liangcangOffset.y
        },
        huocangOffset: {
            x: parseInt(ui.huocangOffsetX.text()) ?? defaultConfig.huocangOffset.x,
            y: parseInt(ui.huocangOffsetY.text()) ?? defaultConfig.huocangOffset.y
        },
        token: token_storage.get("token", ui.tokenInput.text().toString()),
        serverPlatform: {
            text: ui.serverPlatform.getSelectedItem(),
            code: ["Pushplus推送加", "Server酱", "WxPusher"].indexOf(ui.serverPlatform.getSelectedItem())
        },
    };
}

/**
 * 保存配置到文件
 */
function saveConfig(config) {
    try {
        // 创建配置目录（如果不存在）
        if (!files.exists(configPath)) {
            files.createWithDirs(configPath);
        }

        // 格式化并保存配置
        files.write(configPath, JSON.stringify(config, null, 2));
        // console.log("配置保存成功");
        return true;
    } catch (e) {
        console.error("保存配置失败:", e);
        toast("保存配置失败: " + e.message, "long");
        return false;
    }
}

/**
 * 从文件加载配置
 */
function loadConfig() {
    try {
        if (files.exists(configPath)) {
            const config = JSON.parse(files.read(configPath));
            return validateConfig(config);
        }
    } catch (e) {
        console.error("加载配置失败:", e);
        // toast("配置文件损坏，使用默认配置", "long");
    }
    return getDefaultConfig();
}

/**
 * 验证配置有效性
 */
function validateConfig(config) {
    const defaultConfig = getDefaultConfig();
    // 验证偏移值

    config.landOffset.x = config.landOffset.x != null ? Number(config.landOffset.x) : defaultConfig.landOffset.x;
    config.landOffset.y = config.landOffset.y != null ? Number(config.landOffset.y) : defaultConfig.landOffset.y;
    config.shopOffset.x = config.shopOffset.x != null ? Number(config.shopOffset.x) : defaultConfig.shopOffset.x;
    config.shopOffset.y = config.shopOffset.y != null ? Number(config.shopOffset.y) : defaultConfig.shopOffset.y;

    config.firstland.x = config.firstland.x != null ? Number(config.firstland.x) : defaultConfig.firstland.x;
    config.firstland.y = config.firstland.y != null ? Number(config.firstland.y) : defaultConfig.firstland.y;
    config.distance = config.distance != null ? Number(config.distance) : defaultConfig.distance;

    // 验证harvestTime
    if (config.harvestTime == null || isNaN(config.harvestTime) || config.harvestTime < 0) {
        config.harvestTime = defaultConfig.harvestTime;
    }

    // 验证harvestX
    if (config.harvestX == null || isNaN(config.harvestX)) {
        config.harvestX = defaultConfig.harvestX;
    }

    // 验证harvestY
    if (config.harvestY == null || isNaN(config.harvestY)) {
        config.harvestY = defaultConfig.harvestY;
    }

    // 验证harvestRepeat
    if (config.harvestRepeat == null || isNaN(config.harvestRepeat) || config.harvestRepeat < 0) {
        config.harvestRepeat = defaultConfig.harvestRepeat;
    }

    //验证悬浮窗坐标
    if (!config.showText) config.showText = defaultConfig.showText;
    config.showText.x = config.showText.x != null ? Number(config.showText.x) : defaultConfig.showText.x;
    config.showText.y = config.showText.y != null ? Number(config.showText.y) : defaultConfig.showText.y;

    // 验证树木选择
    if (!config.selectedTree) config.selectedTree = defaultConfig.selectedTree;
    const treeOptions = ["苹果树", "树莓丛", "樱桃树", "黑莓丛", "蓝莓丛", "可可树", "咖啡丛", "橄榄树", "柠檬树", "香橙树", "水蜜桃树", "香蕉树", "西梅树", "芒果树", "椰子树", "番石榴树", "石榴树"];
    if (config.selectedTree.code < 0 || config.selectedTree.code >= treeOptions.length) {
        config.selectedTree.code = defaultConfig.selectedTree.code;
    }
    config.selectedTree.text = treeOptions[config.selectedTree.code];

    // 验证主题颜色
    if (!config.themeColor) config.themeColor = defaultConfig.themeColor;
    if (config.themeColor.code < 0 || config.themeColor.code >= colorLibrary.length) {
        config.themeColor.code = defaultConfig.themeColor.code;
    }
    config.themeColor.text = ["碧玉青", "落日橙", "翠竹绿", "晴空蓝", "胭脂粉", "朱砂红", "湖水蓝", "柠檬黄", "咖啡棕", "烟雨灰"][config.themeColor.code];

    // 验证cangkuTime
    if (config.shengcangTime == null || isNaN(config.shengcangTime) || config.shengcangTime < 0) {
        config.shengcangTime = defaultConfig.shengcangTime;
    }

    // 验证isShengcang
    if (config.isShengcang == null || typeof config.isShengcang !== "boolean") {
        config.isShengcang = defaultConfig.isShengcang;
    }

    // 验证isCangkuStatistics
    if (config.isCangkuStatistics == null || typeof config.isCangkuStatistics !== "boolean") {
        config.isCangkuStatistics = defaultConfig.isCangkuStatistics;
    }

    // 验证cangkuStatisticsTime
    if (config.cangkuStatisticsTime == null || isNaN(config.cangkuStatisticsTime) || config.cangkuStatisticsTime < 0) {
        config.cangkuStatisticsTime = defaultConfig.cangkuStatisticsTime;
    }

    // 验证cangkuStatisticsPage
    if (config.cangkuStatisticsPage == null || isNaN(config.cangkuStatisticsPage) || config.cangkuStatisticsPage <= 0) {
        config.cangkuStatisticsPage = defaultConfig.cangkuStatisticsPage;
    }

    // 验证treeShouldSwipe
    if (config.treeShouldSwipe == null || typeof config.treeShouldSwipe !== "boolean") {
        config.treeShouldSwipe = defaultConfig.treeShouldSwipe;
    }

    // 验证粮仓坐标偏移
    if (!config.liangcangOffset) config.liangcangOffset = defaultConfig.liangcangOffset;
    config.liangcangOffset.x = config.liangcangOffset.x != null ? Number(config.liangcangOffset.x) : defaultConfig.liangcangOffset.x;
    config.liangcangOffset.y = config.liangcangOffset.y != null ? Number(config.liangcangOffset.y) : defaultConfig.liangcangOffset.y;

    // 验证货仓坐标偏移
    if (!config.huocangOffset) config.huocangOffset = defaultConfig.huocangOffset;
    config.huocangOffset.x = config.huocangOffset.x != null ? Number(config.huocangOffset.x) : defaultConfig.huocangOffset.x;
    config.huocangOffset.y = config.huocangOffset.y != null ? Number(config.huocangOffset.y) : defaultConfig.huocangOffset.y;

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
    // 验证token
    if (config.token == null) config.token = defaultConfig.token;

    // 验证推送方式
    if (!config.serverPlatform) config.serverPlatform = defaultConfig.serverPlatform;

    config.serverPlatform.text = ["Pushplus推送加", "Server酱", "WxPusher"][config.serverPlatform.code];

    // 其他验证...
    if (config.photoPath.length == 0) config.photoPath = "./res/pictures.1280_720"
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
        selectedTree: {
            text: "苹果树",
            code: 0
        },
        switchAccount: false,
        findAccountMethod: "ocr", // 账号识别方式，默认为文字识别
        accountList: [], // 新增账号列表配置
        addFriendsList: [], // 新增创新号账号列表配置
        shopPrice: {
            text: "最低",
            code: 0
        },
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

    // 自动保存配置
    autoSaveConfig();
}

function loadConfigToUI() {
    const config = loadConfig();

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

    // 设置树木选择
    ui.treeSelect.setSelection(config.selectedTree.code);

    // 根据选择的功能设置初始显示状态
    const selectedFunction = config.selectedFunction.text;
    if (selectedFunction === "刷地") {
        // 显示作物选择，隐藏树木选择
        ui.cropSelectContainer.setVisibility(0); // 0表示可见
        ui.shopPriceContainer.setVisibility(0); // 0表示可见
        ui.treeSelectContainer.setVisibility(8); // 8表示不可见
        ui.treeShouldSwipe.setVisibility(8); // 8表示不可见
        ui.addFriendsCard.setVisibility(8); // 8表示不可见
    } else if (selectedFunction === "种树") {
        // 隐藏作物选择，显示树木选择
        ui.cropSelectContainer.setVisibility(8); // 8表示不可见
        ui.shopPriceContainer.setVisibility(8); // 8表示不可见
        ui.treeSelectContainer.setVisibility(0); // 0表示可见
        ui.treeShouldSwipe.setVisibility(0); // 0表示可见
        ui.addFriendsCard.setVisibility(8); // 8表示不可见
    } else if (selectedFunction === "创新号") {
        // 创新号
        ui.cropSelectContainer.setVisibility(8); // 8表示不可见
        ui.shopPriceContainer.setVisibility(8); // 8表示不可见
        ui.treeSelectContainer.setVisibility(8); // 8表示不可见
        ui.treeShouldSwipe.setVisibility(8); // 8表示不可见
        ui.addFriendsCard.setVisibility(0); // 0表示可见
    }





    // 设置账号相关
    ui.accountSwitch.setChecked(config.switchAccount);

    // 设置商店售价
    ui.shopPrice.setSelection(config.shopPrice.code);

    // 设置寻找土地方法
    setLandMethod(config.landFindMethod);

    // 设置坐标偏移
    ui.landOffsetX.setText(String(config.landOffset.x));
    ui.landOffsetY.setText(String(config.landOffset.y));
    ui.shopOffsetX.setText(String(config.shopOffset.x));
    ui.shopOffsetY.setText(String(config.shopOffset.y));

    // 为坐标偏移输入框添加变化监听
    ui.landOffsetX.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            autoSaveConfig();
        },
        afterTextChanged: function (s) { }
    }));

    ui.landOffsetY.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            autoSaveConfig();
        },
        afterTextChanged: function (s) { }
    }));

    ui.shopOffsetX.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            autoSaveConfig();
        },
        afterTextChanged: function (s) { }
    }));

    ui.shopOffsetY.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            autoSaveConfig();
        },
        afterTextChanged: function (s) { }
    }));

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

    // 为收割偏移输入框添加变化监听


    // 为初始土地偏移输入框添加变化监听
    ui.firstlandX.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            autoSaveConfig();
        },
        afterTextChanged: function (s) { }
    }));

    ui.firstlandY.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            autoSaveConfig();
        },
        afterTextChanged: function (s) { }
    }));

    // 为收割两指间距输入框添加变化监听
    ui.distance.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            autoSaveConfig();
        },
        afterTextChanged: function (s) { }
    }));

    // 为收割操作时用时输入框添加变化监听
    ui.harvestTime.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            autoSaveConfig();
        },
        afterTextChanged: function (s) { }
    }));

    // 为收割横向偏移输入框添加变化监听
    ui.harvestX.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            autoSaveConfig();
        },
        afterTextChanged: function (s) { }
    }));

    // 为收割纵向偏移输入框添加变化监听
    ui.harvestY.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            autoSaveConfig();
        },
        afterTextChanged: function (s) { }
    }));

    // 为收割重复次数输入框添加变化监听
    ui.harvestRepeat.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            autoSaveConfig();
        },
        afterTextChanged: function (s) { }
    }));

    // 为悬浮窗坐标输入框添加变化监听
    ui.showTextX.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            autoSaveConfig();
        },
        afterTextChanged: function (s) { }
    }));

    ui.showTextY.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            autoSaveConfig();
        },
        afterTextChanged: function (s) { }
    }));

    // 为照片路径输入框添加变化监听
    ui.photoPath.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            autoSaveConfig();
        },
        afterTextChanged: function (s) { }
    }));

    // 设置粮仓坐标偏移
    ui.liangcangOffsetX.setText(String(config.liangcangOffset.x));
    ui.liangcangOffsetY.setText(String(config.liangcangOffset.y));

    // 为粮仓坐标偏移输入框添加变化监听
    ui.liangcangOffsetX.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            autoSaveConfig();
        },
        afterTextChanged: function (s) { }
    }));

    ui.liangcangOffsetY.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            autoSaveConfig();
        },
        afterTextChanged: function (s) { }
    }));

    // 设置货仓坐标偏移
    ui.huocangOffsetX.setText(String(config.huocangOffset.x));
    ui.huocangOffsetY.setText(String(config.huocangOffset.y));

    // 为货仓坐标偏移输入框添加变化监听
    ui.huocangOffsetX.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            autoSaveConfig();
        },
        afterTextChanged: function (s) { }
    }));

    ui.huocangOffsetY.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            autoSaveConfig();
        },
        afterTextChanged: function (s) { }
    }));

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

    // 为cangkuTime输入框添加变化监听
    ui.shengcangTime.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            autoSaveConfig();
        },
        afterTextChanged: function (s) { }
    }));

    // 设置是否自动升仓
    ui.isShengcang.setChecked(config.isShengcang);

    // 为自动升仓开关添加变化监听
    ui.isShengcang.on("check", (checked) => {
        autoSaveConfig();
    });

    // 设置仓库统计开关
    ui.isCangkuStatistics.setChecked(config.isCangkuStatistics);

    // 为仓库统计开关添加变化监听
    ui.isCangkuStatistics.on("check", (checked) => {
        autoSaveConfig();
    });

    // 设置仓库统计间隔时间
    ui.cangkuStatisticsTime.setText(String(config.cangkuStatisticsTime));

    // 为仓库统计间隔时间输入框添加变化监听
    ui.cangkuStatisticsTime.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            autoSaveConfig();
        },
        afterTextChanged: function (s) { }
    }));

    // 设置仓库统计页数
    ui.cangkuStatisticsPage.setText(String(config.cangkuStatisticsPage));

    // 为仓库统计页数输入框添加变化监听
    ui.cangkuStatisticsPage.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            autoSaveConfig();
        },
        afterTextChanged: function (s) { }
    }));

    // 设置是否自动滑动
    ui.treeShouldSwipeSwitch.setChecked(config.treeShouldSwipe);

    // 为是否自动滑动开关添加变化监听
    ui.treeShouldSwipeSwitch.on("check", (checked) => {
        autoSaveConfig();
    });

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

    // 更新权限状态
    updateSwitchStatus();
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

    // 自动保存配置
    autoSaveConfig();
}

function stopOtherEngines(includeMain = false) {
    let allEngines = engines.all();
    log("开始停止" + (includeMain ? "所有" : "其他") + "引擎，当前活动引擎列表：" + allEngines.map(e => e.id).join(", "));

    // 遍历所有引擎ID
    let stoppedAny = false;
    for (let key in engineIds) {
        let engineId = engineIds[key];
        if (engineId && (includeMain || key !== 'main')) {  // 根据includeMain决定是否跳过主引擎
            let engine = allEngines.find(e => e.id === engineId);
            try {
                engine.forceStop();
                // toastLog(`已停止${key}引擎(ID: ${engineId})`);
                engineIds[key] = null;  // 清除已停止的引擎ID
                stoppedAny = true;
            } catch (e) {
                log(`停止${key}引擎失败: ${e}`);
            }
        }
    }

    if (!stoppedAny) {
        // toast("没有需要停止的引擎");
    }

    // 如果包含主引擎且成功停止了所有引擎，可以退出程序
    if (includeMain) {
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
    "配置文件位置：",
    configPath,
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
// 自动保存配置函数（无提示）
function autoSaveConfig() {
    // console.log("开始自动保存配置");
    const config = getConfig();
    // console.log("获取配置:", JSON.stringify(config.selectedTree));
    if (saveConfig(config)) {
        // console.log("配置自动保存成功");
    } else {
        console.error("配置自动保存失败");
    }
}

// 保存按钮点击事件（保留手动保存功能）
ui.btnSave.click(() => {
    const config = getConfig();
    if (saveConfig(config)) {
        toastLog("配置保存成功");
    }
});

// 加载配置按钮点击事件
ui.btnLoadConfig.click(() => {
    loadConfigToUI();
    toast("配置已加载");
});

ui.btnStop.click(() => {
    stopOtherEngines();
});

// 输出当前配置日志
function logCurrentConfig(config, shouldOpenFloatWindow) {
    console.log("=============== 当前配置 ===============");
    console.log("应用版本: " + getAppVersion());
    console.log("设备分辨率：" + config.deviceScreenSize);
    console.log("选择功能: " + config.selectedFunction.text);
    console.log("种植作物: " + config.selectedCrop.text);
    console.log("种植树木: " + config.selectedTree.text);
    console.log("商店价格: " + config.shopPrice.text);
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
    console.log("浮动按钮: " + (shouldOpenFloatWindow ? "是" : "否"));
    // console.log("主题颜色: " + config.themeColor.text);config
    // console.log("随机颜色: " + (config.randomColor ? "是" : "否"));
    console.log("============================");
}

function startButton() {
    const config = getConfig();
    saveConfig(config);
    storages.remove("times");
    statistics.remove("rowContentData");

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

    // 记录用户是否打开浮动按钮
    const shouldOpenFloatWindow = ui.win_switch.checked;

    // 检查用户是否打开了浮动按钮开关
    if (shouldOpenFloatWindow) {
        // 关闭浮动按钮
        float_win.close();
        log("已关闭浮动按钮");
    }

    // 输出当前配置
    logCurrentConfig(config, shouldOpenFloatWindow);

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
                    engineIds.shuadi = newEngine.id;  // 保存新引擎ID
                    log("启动刷地引擎，ID: " + newEngine.id);

                    // 如果用户打开了浮动按钮开关，则在启动应用后打开浮动按钮
                    if (shouldOpenFloatWindow) {
                        // 启动应用后打开浮动按钮
                        sleep(1000);
                        float_win.open();
                        log("已启动浮动按钮");
                    }
                })
            }
            else if (config.accountMethod == "save") {
                threads.start(() => {
                    if (!checkRoot()) {
                        toastLog("请先获取Root权限");
                        return;
                    }
                    let switchSaveAccount = require("./switchSaveAccount.js");
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
                engineIds.createNewAccount = newEngine.id;  // 保存新引擎ID
                log("启动建号引擎，ID: " + newEngine.id);

                // 如果用户打开了浮动按钮开关，则在启动应用后打开浮动按钮
                if (shouldOpenFloatWindow) {
                    // 启动应用后打开浮动按钮
                    sleep(1000);
                    float_win.open();
                    log("已启动浮动按钮");
                }
            });
            break;

        default:
            toast("未知功能", "long");
    }
}

function winStartButton() {
    const config = getConfig();
    saveConfig(config);
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

    // 记录用户是否打开浮动按钮
    const shouldOpenFloatWindow = ui.win_switch.checked;

    // 检查用户是否打开了浮动按钮开关
    if (shouldOpenFloatWindow) {
        // 关闭浮动按钮
        float_win.close();
        log("已关闭浮动按钮");
    }

    // 输出当前配置
    logCurrentConfig(config, shouldOpenFloatWindow);

    switch (config.selectedFunction.code) {
        case 0: // 刷地
            stopOtherEngines(); // 先清理所有任务
            threads.start(() => {
                launch("com.supercell.hayday");
                sleep(1000);
                let newEngine = engines.execScriptFile("./shuadi.js");
                engineIds.shuadi = newEngine.id;  // 保存新引擎ID
                log("启动刷地引擎，ID: " + newEngine.id);

                // 如果用户打开了浮动按钮开关，则在启动应用后打开浮动按钮
                if (shouldOpenFloatWindow) {
                    // 启动应用后打开浮动按钮
                    sleep(1000);
                    float_win.open();
                    log("已启动浮动按钮");
                }
            });
            break;

        case 1: // 种树
            stopOtherEngines();
            setTimeout(() => { }, 1000);
            threads.start(() => {
                let newEngine = engines.execScriptFile("./zhongshu.js");
                engineIds.zhongshu = newEngine.id;  // 保存新引擎ID
                log("启动种树引擎，ID: " + newEngine.id);
            });
            float_win.close();
            break;

        case 2: // 创新号
            stopOtherEngines();
            threads.start(() => {
                launch("com.supercell.hayday");
                sleep(1000);
                let newEngine = engines.execScriptFile("./createNewAccount.js");
                engineIds.createNewAccount = newEngine.id;  // 保存新引擎ID
                log("启动建号引擎，ID: " + newEngine.id);

                // 如果用户打开了浮动按钮开关，则在启动应用后打开浮动按钮
                if (shouldOpenFloatWindow) {
                    // 启动应用后打开浮动按钮
                    sleep(1000);
                    float_win.open();
                    log("已启动浮动按钮");
                }
            });
            break;

        default:
            toast("未知功能", "long");
    }
}

ui.btnStart.click(startButton);

//监听引擎变化
events.broadcast.on("engine1", function (e) {
    engine1 = e
})
events.broadcast.on("engine2", function (e) {
    engine2 = e
})
events.broadcast.on("engine3", function (e) {
    engine3 = e
})

//监听引擎重启事件
events.broadcast.on("engine_r", function (type) {
    log("监听到引擎重启事件: " + type);

    if (type == "刷地引擎") {
        stopOtherEngines();
        log("重启刷地引擎");
        let newEngine = engines.execScriptFile("./shuadi.js");
        engineIds.shuadi = newEngine.id;
        log("新刷地引擎ID: " + newEngine.id);

    }

    else if (type == "刷地引擎_存档") {
        stopOtherEngines();
        log("发送重启事件");
        events.broadcast.emit("switchSaveAccount", timeStorage.get("nextAccountToChange"));

    }

    else if (type == "种树引擎") {
        stopOtherEngines();
        let newEngine = engines.execScriptFile("./zhongshu.js");
        engineIds.zhongshu = newEngine.id;
        log("新种树引擎ID: " + newEngine.id);

    }
});

/**
 * 初始化界面
 */
function initUI() {
    // 检查更新
    checkForUpdatesOnce();

    // 先初始化账号列表UI，确保账号列表在配置加载前已准备好
    initAccountListUI();

    // 初始化addFriends列表UI
    initAddFriendsListUI();
    // 尝试加载配置（如果配置文件存在）

    if (files.exists(configPath)) {
        try {
            loadConfigToUI();
        } catch (e) {
            console.error("加载配置失败:", e);
            toast("加载配置失败: " + e.message, "long");
        }
    }

    // 初始化权限开关状态
    updateSwitchStatus();

    // 绑定土地方法按钮事件
    ui.methodShop.click(() => {
        setLandMethod("商店");
        autoSaveConfig();
    });
    ui.methodBakery.click(() => {
        setLandMethod("面包房");
        autoSaveConfig();
    });

    ui.functionSelect.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener({
        onItemSelected: function (parent, view, position, id) {
            const item = parent.getItemAtPosition(position).toString();
            // console.log("功能选择发生变化: " + item);

            // 获取当前选择的功能
            const selectedFunction = item;

            // 根据选择的功能显示/隐藏相应的选项
            if (selectedFunction === "刷地") {
                // 显示作物选择，隐藏树木选择
                ui.cropSelectContainer.setVisibility(0); // 0表示可见
                ui.shopPriceContainer.setVisibility(0); // 0表示可见
                ui.treeSelectContainer.setVisibility(8); // addFriendsCard不可见
                ui.treeShouldSwipe.setVisibility(8); // 8表示不可见
                ui.addFriendsCard.setVisibility(8); // 8表示不可见
            } else if (selectedFunction === "种树") {
                // 隐藏作物选择，显示树木选择
                ui.cropSelectContainer.setVisibility(8); // 8表示不可见
                ui.shopPriceContainer.setVisibility(8); // 8表示不可见
                ui.treeSelectContainer.setVisibility(0); // 0表示可见
                ui.treeShouldSwipe.setVisibility(0); // 0表示可见
                ui.addFriendsCard.setVisibility(8); // 8表示不可见
            } else if (selectedFunction === "创新号") {
                // 创新号
                ui.cropSelectContainer.setVisibility(8); // 8表示不可见
                ui.shopPriceContainer.setVisibility(8); // 8表示不可见
                ui.treeSelectContainer.setVisibility(8); // 8表示不可见
                ui.treeShouldSwipe.setVisibility(8); // 8表示不可见
                ui.addFriendsCard.setVisibility(0); // 0表示可见
            }

            autoSaveConfig();
        }
    }))

    ui.cropSelect.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener({
        onItemSelected: function (parent, view, position, id) {
            const item = parent.getItemAtPosition(position).toString();
            // console.log("作物选择发生变化: " + item);
            autoSaveConfig();
        },
        onNothingSelected: function (parent) { }
    }));

    ui.treeSelect.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener({
        onItemSelected: function (parent, view, position, id) {
            const item = parent.getItemAtPosition(position).toString();
            // console.log("树木选择发生变化: " + item);
            autoSaveConfig();
        },
        onNothingSelected: function (parent) { }
    }));

    ui.shopPrice.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener({
        onItemSelected: function (parent, view, position, id) {
            const item = parent.getItemAtPosition(position).toString();
            // console.log("商店售价选择发生变化: " + item);
            autoSaveConfig();
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
                const config = loadConfig();
                if (config.landFindMethod === "商店") {
                    ui.methodShop.attr("bg", color);
                    ui.methodShop.attr("textColor", "#FFFFFF");
                }

                // 更新spinner文字颜色
                ui.themeColor.setTextColor(android.graphics.Color.parseColor(color));
            }

            autoSaveConfig();
            loadConfigToUI();
        },
        onNothingSelected: function (parent) { }
    }));

    ui.randomColor.on("check", (checked) => {
        console.log("随机颜色开关状态变化:", checked);

        if (checked) {
            // 如果打开随机颜色，则随机选择一个颜色
            color = colorLibrary[Math.floor(Math.random() * colorLibrary.length)];
            ui.statusBarColor(color);
            ui.appbar.setBackgroundColor(android.graphics.Color.parseColor(color));

            // 更新商店按钮颜色（如果当前选中的是商店方法）
            const config = loadConfig();
            if (config.landFindMethod === "商店") {
                ui.methodShop.attr("bg", color);
                ui.methodShop.attr("textColor", "#FFFFFF");
            }

            // 更新spinner文字颜色
            ui.themeColor.setTextColor(android.graphics.Color.parseColor(color));
        }

        autoSaveConfig();
    });

    ui.accountSwitch.on("check", (checked) => {
        console.log("账号开关状态变化:", checked);
        autoSaveConfig();
    });

    // 绑定账号识别方式按钮事件
    ui.findAccountImage.click(() => {
        setFindAccountMethod("image");
        autoSaveConfig();
    });
    ui.findAccountText.click(() => {
        setFindAccountMethod("ocr");
        autoSaveConfig();
    });

    // 绑定账号方式切换按钮事件
    ui.accountMethodEmail.click(() => {
        setAccountMethod("email");
        autoSaveConfig();
    });
    ui.accountMethodSave.click(() => {
        setAccountMethod("save");
        autoSaveConfig();
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

    // 为eyeIcon添加点击事件
    ui.eyeIcon.click(() => {
        // 获取当前token的值
        const currentToken = ui.tokenInput.getText();

        // 检查当前输入框是否是密码模式
        const isPassword = ui.tokenInput.attr("password") === "true";

        if (isPassword) {
            // 如果是密码模式，则切换为显示模式
            ui.tokenInput.attr("password", "false");
            ui.tokenInputPlain.setText(token_storage.get("token", ""));
            ui.tokenInputPlain.setVisibility(0); // 显示普通输入框
            ui.tokenInput.setVisibility(8); // 隐藏密码输入框
            ui.eyeIcon.attr("src", "data:image/png;base64," + icon.visibility);
            // toast("Token已显示");
        } else {
            // 如果是显示模式，则切换为密码模式
            ui.tokenInput.attr("password", "true");
            ui.tokenInput.setText(token_storage.get("token", ""));
            ui.tokenInputPlain.setVisibility(8); // 隐藏普通输入框
            ui.tokenInput.setVisibility(0); // 显示密码输入框
            ui.eyeIcon.attr("src", "data:image/png;base64," + icon.visibility_off);
            // toast("Token已隐藏");
        }
    });




    // 为推送方式选择器添加监听
    ui.serverPlatform.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener({
        onItemSelected: function (parent, view, position, id) {
            const item = parent.getItemAtPosition(position).toString();
            console.log("推送方式选择发生变化: " + item);
            autoSaveConfig();
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


