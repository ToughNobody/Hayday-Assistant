"ui";

const icon = require("./img_Base64.js");

// 创建存储对象
let token_storage = storages.create("token_storage");
let statistics = storages.create("statistics");
let configs = storages.create("config"); // 创建配置存储对象
let config

// 首次加载标志位，用于忽略首次加载时的选择事件
let isFirstLoad_cropSelect = true;

// 初始化账号列表
let AccountList = [];
let SaveAccountList = [];
let AddFriendsList = [];
let CangkuSoldList = [
    { title: "炸药", done: false, priority: 0, id: 1 },
    { title: "炸药桶", done: false, priority: 0, id: 2 },
    { title: "铁铲", done: false, priority: 0, id: 3 },
    { title: "十字镐", done: false, priority: 0, id: 4 },
    { title: "斧头", done: false, priority: 0, id: 5 },
    { title: "木锯", done: false, priority: 0, id: 6 },
    { title: "土地契约", done: false, priority: 0, id: 7 },
    { title: "木槌", done: false, priority: 0, id: 8 },
    { title: "标桩", done: false, priority: 0, id: 9 },
    { title: "盒钉", done: false, priority: 0, id: 10 },
    { title: "螺钉", done: false, priority: 0, id: 11 },
    { title: "镶板", done: false, priority: 0, id: 12 },
    { title: "螺栓", done: false, priority: 0, id: 13 },
    { title: "木板", done: false, priority: 0, id: 14 },
    { title: "胶带", done: false, priority: 0, id: 15 }
];

// 初始化账户列表数据
var savedData = configs.get("sell_accountList");
// 确保savedData是一个有效的数组
if (!Array.isArray(savedData)) {
    savedData = [];
}

var sell_accountList = [];

// 如果有保存的数据，则从中提取账户列表信息
if (savedData.length > 0) {
    // 从保存的数据格式转换为当前使用的格式
    for (var i = 0; i < savedData.length; i++) {
        // 确保每个保存的数据项都是有效的对象
        if (savedData[i] && typeof savedData[i] === 'object') {
            sell_accountList.push({
                title: savedData[i].account || '未知账户',
                addFriend: savedData[i].addFriend || '',
                done: savedData[i].done !== undefined ? savedData[i].done : false,
                price: savedData[i].price || 0
            });
        }
    }
} else {
    // 如果没有保存的数据，使用默认值
    sell_accountList = [];
}

// 添加"当前"账户作为第一个账户（如果还没有的话）
if (sell_accountList.length === 0 || sell_accountList[0].title !== '当前') {
    sell_accountList.unshift({ title: '当前', addFriend: '', done: false, price: 0 });
}

// 创建所有账户对应的仓库售卖列表数据源
var allCangkuSoldLists = {};

// 确保初始化过程更加健壮
try {
    if (savedData.length > 0) {
        // 从保存的数据中恢复每个账户的售卖计划
        for (var i = 0; i < savedData.length; i++) {
            var accountIndex = i + 1; // 账户索引（从1开始，因为"当前"账户是第0个）
            // 确保保存的数据项是有效的对象
            if (savedData[i] && typeof savedData[i] === 'object') {
                var sellPlan = Array.isArray(savedData[i].sellPlan) ? savedData[i].sellPlan : [];

                // 初始化默认的仓库售卖列表
                var defaultItemList = createDefaultItemList();

                // 创建一个新的列表，用于存储合并后的项目
                var mergedItemList = JSON.parse(JSON.stringify(defaultItemList)); // 深拷贝默认列表

                // 查找并添加保存数据中存在但默认列表中没有的项目
                for (var j = 0; j < sellPlan.length; j++) {
                    var planItem = sellPlan[j];
                    // 确保计划项是有效的对象
                    if (planItem && typeof planItem === 'object') {
                        // 检查该项目是否存在于默认列表中
                        var itemExists = false;
                        for (var k = 0; k < mergedItemList.length; k++) {
                            if (mergedItemList[k].title === planItem.item) {
                                itemExists = true;
                                break;
                            }
                        }

                        // 如果项目不存在于默认列表中，添加它
                        if (!itemExists) {
                            mergedItemList.push({
                                title: planItem.item,
                                sellNum: planItem.sellNum !== undefined ? planItem.sellNum : 0,
                                done: planItem.done !== undefined ? planItem.done : false
                            });
                        }
                    }
                }

                allCangkuSoldLists["sell_CangkuSoldList" + accountIndex] = mergedItemList;

                // 应用保存的售卖计划到数据源
                for (var j = 0; j < sellPlan.length; j++) {
                    var planItem = sellPlan[j];
                    // 确保计划项是有效的对象
                    if (planItem && typeof planItem === 'object') {
                        // 在合并后的列表中查找匹配的项目并更新其值
                        for (var k = 0; k < allCangkuSoldLists["sell_CangkuSoldList" + accountIndex].length; k++) {
                            if (allCangkuSoldLists["sell_CangkuSoldList" + accountIndex][k].title === planItem.item) {
                                allCangkuSoldLists["sell_CangkuSoldList" + accountIndex][k].sellNum = planItem.sellNum !== undefined ? planItem.sellNum : 0;
                                allCangkuSoldLists["sell_CangkuSoldList" + accountIndex][k].done = planItem.done !== undefined ? planItem.done : false;
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    // 如果没有保存的数据或保存的数据不完整，初始化默认的仓库售卖列表
    for (var i = 1; i <= sell_accountList.length; i++) {
        // 只有当该索引尚未初始化时才初始化
        if (!allCangkuSoldLists["sell_CangkuSoldList" + i]) {
            allCangkuSoldLists["sell_CangkuSoldList" + i] = createDefaultItemList();
        }
    }
} catch (e) {
    // 如果初始化过程中出现任何错误，确保有一个默认的空对象
    allCangkuSoldLists = {};
    for (var i = 1; i <= sell_accountList.length; i++) {
        allCangkuSoldLists["sell_CangkuSoldList" + i] = createDefaultItemList();
    }
}



const currentPath = files.cwd();
// 获取应用专属外部目录的完整路径
let appExternalDir = context.getExternalFilesDir(null).getAbsolutePath();
const configDir = files.join(appExternalDir, "configs");
const configPath = files.join(configDir, "config.json");
const logDir = files.join(appExternalDir, "logs");
const accountImgDir = files.join(appExternalDir, "accountImgs");
const scPath = "/storage/emulated/0/$MuMu12Shared/Screenshots"
// 确保目录存在
files.ensureDir(configDir + "/1");  // 创建配置目录
files.ensureDir(logDir + "/1");  // 创建日志目录
files.ensureDir(scPath + "/1");  // 创建截图目录
files.ensureDir(accountImgDir + "/1");  // 创建账号照片目录



// 根据优先级获取颜色
function getPriorityColor(priority) {
    var colors = [
        "#FF0000", // 0 - 红色 
        "#FF6600", // 1 - 橙色 
        "#FFAA00", // 2 - 橙黄色 
        "#FFFF00", // 3 - 黄色 
        "#AAFF00", // 4 - 黄绿色 
        "#55FF00", // 5 - 青绿色 
        "#00FF00", // 6 - 绿色 
        "#00FF88", // 7 - 蓝绿色 
        "#00FFFF", // 8 - 青色 
        "#0088FF", // 9 - 蓝色 
        "#0000FF"  // 10 - 深蓝色
    ];

    // 确保priority在有效范围内
    priority = Math.max(0, Math.min(10, priority));
    return colors[priority];
}

// 显示仓库售卖设置对话框
function showCangkuSoldDialog() {

    // 设置列表数据
    CangkuSoldList = configs.get("CangkuSoldList", CangkuSoldList)
    isCangkuSold = configs.get("isCangkuSold", false)

    // 创建自定义对话框布局
    var customView = ui.inflate(
        <vertical>
            <horizontal paddingLeft="10dp" paddingTop="10dp" >
                <text textSize="18sp" textColor="#333333" text="仓库售卖" />
                <img id="helpIcon_CangkuSold" src="@drawable/ic_help_outline_black_48dp" w="18" h="18" tint="#007AFF" marginLeft="10dp" />
                <Switch id="CangkuSoldSwitch" paddingLeft="160dp" checked="{{isCangkuSold}}" />
            </horizontal>
            <horizontal>
                <text textSize="15sp" textColor="#333333" text="排序" marginLeft="10dp" />
                <button id="sortAscButton" text="升序" w="auto" h="auto" style="Widget.AppCompat.Button.Borderless" />
                <button id="sortDescButton" text="降序" w="auto" h="auto" style="Widget.AppCompat.Button.Borderless" />
                <button id="sortDefaultButton" text="默认" w="auto" h="auto" style="Widget.AppCompat.Button.Borderless" />
            </horizontal>
            <horizontal >
                <text textSize="15" textColor="#333333" text="物品" marginLeft="30dp" textStyle="bold" />
                <text textSize="15" textColor="#333333" text="优先级" marginLeft="90dp" textStyle="bold" />
                <text textSize="15" textColor="#333333" text="选中" marginLeft="60dp" textStyle="bold" />
            </horizontal>
            <list id="CangkuSoldList" h="*">
                <card w="*" h="60" margin="0 5"
                    cardElevation="1dp" foreground="?selectableItemBackground">
                    <horizontal gravity="center_vertical">
                        <frame id="colorBar" h="*" w="10" bg="{{getPriorityColor(this.priority)}}" />
                        <vertical padding="10 8" h="auto" w="0" layout_weight="1">
                            <text id="title" text="{{this.title}}" textColor="#333333" textSize="16sp" maxLines="1" />
                        </vertical>
                        <horizontal gravity="center_vertical">
                            <button id="decrease" text="-" w="40dp" h="40dp" textSize="20sp" gravity="center" style="Widget.AppCompat.Button.Borderless" />
                            <text id="priority" text="{{this.priority}}" w="40dp" h="40dp" gravity="center" textSize="16sp" textColor="#333333" />
                            <button id="increase" text="+" w="40dp" h="40dp" textSize="20sp" gravity="center" style="Widget.AppCompat.Button.Borderless" />
                        </horizontal>
                        <checkbox id="done" marginLeft="10" marginRight="10" checked="{{this.done}}" />
                    </horizontal>
                </card>
            </list>
        </vertical>
    );


    customView.CangkuSoldList.setDataSource(CangkuSoldList);

    // 创建对话框
    var dialog = dialogs.build({
        customView: customView,
        positive: "确定",
        neutral: "取消",
        wrapInScrollView: false,
        cancelable: true
    });

    // 为列表项添加点击事件
    customView.CangkuSoldList.on("item_bind", function (itemView, itemHolder) {
        // 减号按钮点击事件
        itemView.decrease.on("click", function () {
            var item = itemHolder.item;
            if (item.priority > 0) {
                item.priority--;
                itemView.priority.setText(item.priority.toString());
                // 更新颜色
                itemView.colorBar.attr("bg", getPriorityColor(item.priority));
            }
        });

        // 加号按钮点击事件
        itemView.increase.on("click", function () {
            var item = itemHolder.item;
            if (item.priority < 10) {
                item.priority++;
                itemView.priority.setText(item.priority.toString());
                // 更新颜色
                itemView.colorBar.attr("bg", getPriorityColor(item.priority));
            }
        });

        // 复选框点击事件
        itemView.done.on("check", function (checked) {
            var item = itemHolder.item;
            item.done = checked;
        });
    });

    // 为按钮添加点击事件
    dialog.on("positive", function () {
        isCangkuSold = customView.CangkuSoldSwitch.isChecked();
        CangkuSoldList = customView.CangkuSoldList.getDataSource();
        configs.put("CangkuSoldList", CangkuSoldList);
        configs.put("isCangkuSold", isCangkuSold);
        toast("保存成功")
        dialog.dismiss();
    });


    dialog.on("neutral", function () {
        dialog.dismiss();
    });

    // 为问号图标添加点击事件
    customView.helpIcon_CangkuSold.on("click", function () {
        dialogs.build({
            title: "仓库售卖帮助",
            content: "在这里您可以设置仓库自动售卖功能：\n\n" +
                "1. 触发阈值：\n" +
                "   - 第一个空表示当仓库容量剩余多少时开始执行售卖\n" +
                "   - 第二个空表示每次售卖时将仓库剩余容量控制在多少\n" +
                "   - 例：触发阈值为10~25,仓库容量为490/500,则开始执行售卖,售卖至475/500\n\n" +
                "2. 设置物品优先级（0-10）\n" +
                "   - 点击'+'增加优先级\n" +
                "   - 点击'-'减少优先级\n" +
                "   - 优先级越小越先售卖\n\n" +
                "3. 控制物品是否参与售卖\n" +
                "   - 勾选复选框表示参与售卖\n" +
                "   - 取消勾选表示不参与售卖\n\n" +
                "4. 售卖逻辑：\n" +
                "   - ",
            positive: "确定"
        }).show();
    });

    // 为排序按钮添加点击事件
    customView.sortAscButton.on("click", function () {
        // 对列表进行排序，按priority从小到大
        CangkuSoldList.sort((a, b) => a.priority - b.priority);
        customView.CangkuSoldList.setDataSource(CangkuSoldList);
    });

    customView.sortDescButton.on("click", function () {
        // 对列表进行排序，按priority从大到小
        CangkuSoldList.sort((a, b) => b.priority - a.priority);
        customView.CangkuSoldList.setDataSource(CangkuSoldList);
    });

    customView.sortDefaultButton.on("click", function () {
        // 对列表进行排序，按默认顺序
        CangkuSoldList.sort((a, b) => a.id - b.id);
        customView.CangkuSoldList.setDataSource(CangkuSoldList);
    });

    // 显示对话框
    dialog.show();
}

// 显示截图设置对话框
function showScreenshotDialog() {

    // 设置列表数据
    screenshotX1 = configs.get("screenshotX1", 0)
    screenshotY1 = configs.get("screenshotY1", 0)
    screenshotX2 = configs.get("screenshotX2", 0)
    screenshotY2 = configs.get("screenshotY2", 0)
    screenshotX3 = configs.get("screenshotX3", 0)
    screenshotY3 = configs.get("screenshotY3", 0)

    // 创建自定义对话框布局
    var customView = ui.inflate(
        <vertical gravity="center" paddingTop="16">
            <horizontal gravity="center" marginBottom="8">
                <text text="坐标1 - x:" textSize="14" marginRight="4" />
                <input id="screenshotX1" hint="X坐标" w="60" h="40" textSize="14" bg="#FFFFFF" inputType="number" marginRight="8" />
                <text text="y:" textSize="14" marginRight="4" />
                <input id="screenshotY1" hint="Y坐标" w="60" h="40" textSize="14" bg="#FFFFFF" inputType="number" />
            </horizontal>
            <horizontal gravity="center" marginBottom="8">
                <text text="坐标2 - x:" textSize="14" marginRight="4" />
                <input id="screenshotX2" hint="X坐标" w="60" h="40" textSize="14" bg="#FFFFFF" inputType="number" marginRight="8" />
                <text text="y:" textSize="14" marginRight="4" />
                <input id="screenshotY2" hint="Y坐标" w="60" h="40" textSize="14" bg="#FFFFFF" inputType="number" />
            </horizontal>
            <horizontal gravity="center">
                <text text="坐标3 - x:" textSize="14" marginRight="4" />
                <input id="screenshotX3" hint="X坐标" w="60" h="40" textSize="14" bg="#FFFFFF" inputType="number" marginRight="8" />
                <text text="y:" textSize="14" marginRight="4" />
                <input id="screenshotY3" hint="Y坐标" w="60" h="40" textSize="14" bg="#FFFFFF" inputType="number" />
            </horizontal>
        </vertical>
    );

    customView.screenshotX1.setText(String(screenshotX1));
    customView.screenshotY1.setText(String(screenshotY1));
    customView.screenshotX2.setText(String(screenshotX2));
    customView.screenshotY2.setText(String(screenshotY2));
    customView.screenshotX3.setText(String(screenshotX3));
    customView.screenshotY3.setText(String(screenshotY3));

    // 创建对话框
    var dialog = dialogs.build({
        customView: customView,
        positive: "确定",
        neutral: "取消",
        wrapInScrollView: false,
        cancelable: true
    });

    // 为按钮添加点击事件
    dialog.on("positive", function () {
        screenshotX1 = parseInt(customView.screenshotX1.getText()) || 0;
        screenshotY1 = parseInt(customView.screenshotY1.getText()) || 0;
        screenshotX2 = parseInt(customView.screenshotX2.getText()) || 0;
        screenshotY2 = parseInt(customView.screenshotY2.getText()) || 0;
        screenshotX3 = parseInt(customView.screenshotX3.getText()) || 0;
        screenshotY3 = parseInt(customView.screenshotY3.getText()) || 0;
        configs.put("screenshotX1", screenshotX1);
        configs.put("screenshotY1", screenshotY1);
        configs.put("screenshotX2", screenshotX2);
        configs.put("screenshotY2", screenshotY2);
        configs.put("screenshotX3", screenshotX3);
        configs.put("screenshotY3", screenshotY3);
        toast("保存成功")
        dialog.dismiss();
    });


    dialog.on("neutral", function () {
        dialog.dismiss();
    });

    // 显示对话框
    dialog.show();
}

function showSwitchAccountDialog() {

    // 设置列表数据
    switchAccountX1 = configs.get("switchAccountX1", 0)
    switchAccountY1 = configs.get("switchAccountY1", 0)
    switchAccountX2 = configs.get("switchAccountX2", 0)
    switchAccountY2 = configs.get("switchAccountY2", 0)
    switchAccountX3 = configs.get("switchAccountX3", 0)
    switchAccountY3 = configs.get("switchAccountY3", 0)

    // 创建自定义对话框布局
    var customView = ui.inflate(
        <vertical gravity="center" paddingTop="16">
            <horizontal gravity="center" marginBottom="8">
                <text text="坐标1 - x:" textSize="14" marginRight="4" />
                <input id="switchAccountX1" hint="X坐标" w="60" h="40" textSize="14" bg="#FFFFFF" inputType="number" marginRight="8" />
                <text text="y:" textSize="14" marginRight="4" />
                <input id="switchAccountY1" hint="Y坐标" w="60" h="40" textSize="14" bg="#FFFFFF" inputType="number" />
            </horizontal>
            <horizontal gravity="center" marginBottom="8">
                <text text="坐标2 - x:" textSize="14" marginRight="4" />
                <input id="switchAccountX2" hint="X坐标" w="60" h="40" textSize="14" bg="#FFFFFF" inputType="number" marginRight="8" />
                <text text="y:" textSize="14" marginRight="4" />
                <input id="switchAccountY2" hint="Y坐标" w="60" h="40" textSize="14" bg="#FFFFFF" inputType="number" />
            </horizontal>
            <horizontal gravity="center">
                <text text="坐标3 - x:" textSize="14" marginRight="4" />
                <input id="switchAccountX3" hint="X坐标" w="60" h="40" textSize="14" bg="#FFFFFF" inputType="number" marginRight="8" />
                <text text="y:" textSize="14" marginRight="4" />
                <input id="switchAccountY3" hint="Y坐标" w="60" h="40" textSize="14" bg="#FFFFFF" inputType="number" />
            </horizontal>
        </vertical>
    );

    customView.switchAccountX1.setText(String(switchAccountX1));
    customView.switchAccountY1.setText(String(switchAccountY1));
    customView.switchAccountX2.setText(String(switchAccountX2));
    customView.switchAccountY2.setText(String(switchAccountY2));
    customView.switchAccountX3.setText(String(switchAccountX3));
    customView.switchAccountY3.setText(String(switchAccountY3));

    // 创建对话框
    var dialog = dialogs.build({
        customView: customView,
        positive: "确定",
        neutral: "取消",
        wrapInScrollView: false,
        cancelable: true
    });

    // 为按钮添加点击事件
    dialog.on("positive", function () {
        switchAccountX1 = parseInt(customView.switchAccountX1.getText()) || 0;
        switchAccountY1 = parseInt(customView.switchAccountY1.getText()) || 0;
        switchAccountX2 = parseInt(customView.switchAccountX2.getText()) || 0;
        switchAccountY2 = parseInt(customView.switchAccountY2.getText()) || 0;
        switchAccountX3 = parseInt(customView.switchAccountX3.getText()) || 0;
        switchAccountY3 = parseInt(customView.switchAccountY3.getText()) || 0;
        configs.put("switchAccountX1", switchAccountX1);
        configs.put("switchAccountY1", switchAccountY1);
        configs.put("switchAccountX2", switchAccountX2);
        configs.put("switchAccountY2", switchAccountY2);
        configs.put("switchAccountX3", switchAccountX3);
        configs.put("switchAccountY3", switchAccountY3);
        toast("保存成功")
        dialog.dismiss();
    });


    dialog.on("neutral", function () {
        dialog.dismiss();
    });

    // 显示对话框
    dialog.show();
}

// 格式化日期为易读格式：YYYY-MM-DD_HH-mm-ss
let now = new Date();
let formatDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
let logPath = files.join(logDir, `${formatDate}.txt`);



// 确保日志目录存在
files.ensureDir(logDir + "/1");

// 监听控制台的所有输出
console.emitter.on("println", (log, level, levelString) => {
    // 获取当前时间戳（只包含小时、分钟、秒钟）
    let now = new Date();
    let timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    // 写入日志文件
    files.append(logPath, `[${timestamp}] ${log}\n`);
});

// 颜色库
const colorLibrary = [
    { name: "碧玉青", code: "#009688" },
    { name: "落日橙", code: "#FF9800" },
    { name: "翠竹绿", code: "#4CAF50" },
    { name: "晴空蓝", code: "#2196F3" },
    { name: "胭脂粉", code: "#DB7093" },
    { name: "朱砂红", code: "#F44336" },
    { name: "湖水蓝", code: "#00BCD4" },
    { name: "紫罗兰", code: "#9C27B0" },
    { name: "咖啡棕", code: "#795548" },
    { name: "烟雨灰", code: "#607D8B" }
];

// 随机选择一个颜色
let color = "#009688"

// 颜色名称数组，用于UI显示
const colorNames = ["随机颜色"].concat(colorLibrary.map(item => item.name));

// 初始化颜色函数
/**
 * 只选择本次启动的颜色，改变color。不应用UI
 */
function initColor() {
    // 尝试从存储对象加载颜色设置

    if (config && config.themeColor && config.themeColor.code >= 0) {
        // 如果配置中有颜色设置，使用配置中的颜色
        const item = colorNames[config.themeColor.code];

        if (item === "随机颜色") {
            // 如果配置中选择了随机颜色，则随机选择一个颜色
            color = colorLibrary[Math.floor(Math.random() * colorLibrary.length)].code;
        } else {
            // 使用配置中的颜色
            const selectedIndex = config.themeColor.code - 1; // 减1是因为"随机颜色"占了第一个位置
            if (selectedIndex >= 0) {
                color = colorLibrary[selectedIndex].code;
            } else {
                // 默认随机选择一个颜色
                color = colorLibrary[Math.floor(Math.random() * colorLibrary.length)].code;
            }
        }
    } else {
        // 否则随机选择一个颜色
        color = colorLibrary[Math.floor(Math.random() * colorLibrary.length)].code;
    }
}




// 从project.json中读取版本号
function getAppVersion() {
    try {
        let projectPath = files.cwd() + "/project.json";
        log("projectPath: " + projectPath)
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

// 动态生成内容块的函数
function generateContentBlocks(accountList) {

    for (var i = 0; i < accountList.length; i++) {
        var account = accountList[i];
        var visibility = i === 0 ? "" : " visibility=\"gone\"";

        let contentBlocks = `
<vertical id="sell_contentBlock${i + 1}"  bg="#FFFFFF" padding="10dp"${visibility}>
    <horizontal w="*">
        <text id="sell_pageTitle${i + 1}" layout_gravity="left|center_vertical" w="70" textSize="18" textColor="#333333" text="${account.title}" />
        <button id="sell_applyAllButton${i + 1}" text="应用到全部" w="100" textSize="14" layout_gravity="right|center_vertical" style="Widget.AppCompat.Button.Borderless" />
        <button id="sell_addItemButton${i + 1}" text="添加项目" w="80" textSize="14" layout_gravity="right|center_vertical" style="Widget.AppCompat.Button.Borderless" />
    </horizontal>
    <horizontal w="*">
        <text layout_gravity="left|center_vertical" w="50" textSize="14" textColor="#333333" text="加好友:" />
        <input id="sell_addFriendInput${i + 1}" layout_gravity="center_vertical" text="${account.addFriend || ""}" textSize="14" w="110" h="auto" />
        <spinner id="sell_price${i + 1}" layout_gravity="right|center_vertical" w="auto"  entries="最低|平价|最高" bg="#FFFFFF"/>
    </horizontal>
    <list id="sell_CangkuSoldList${i + 1}"  h="*">
        <card  w="*" h="60" margin="0 5" cardElevation="1dp" foreground="?selectableItemBackground">
            <horizontal gravity="center_vertical">
                <frame id="sell_colorBar"  w="10" h="*" bg="#ff0000" />
                <vertical padding="10 8" h="auto" w="0" layout_weight="1">
                    <text id="sell_title" text="{{this.title}}" textColor="#333333" textSize="16sp" maxLines="1" />
                </vertical>
                <button id="sell_sellAllButton" text="全部" textSize="14" w="60" layout_gravity="right|center_vertical" style="Widget.AppCompat.Button.Borderless" />
                <input id="sell_input" text="{{this.sellNum || 0}}" layout_gravity="center_vertical" w="40" h="auto" inputType="numberSigned|number" />
                <checkbox id="sell_done" marginLeft="10" marginRight="10" checked="{{this.done}}" />
            </horizontal>
        </card>
    </list>
</vertical>`;
        ui.sell_Container.addView(ui.inflate(contentBlocks));
        // log(contentBlocks)
    }

}

// 创建默认商品列表的函数
function createDefaultItemList() {
    return [
        { title: "炸药", sellNum: 0, done: false },
        { title: "炸药桶", sellNum: 0, done: false },
        { title: "铁铲", sellNum: 0, done: false },
        { title: "十字镐", sellNum: 0, done: false },
        { title: "斧头", sellNum: 0, done: false },
        { title: "木锯", sellNum: 0, done: false },
        { title: "土地契约", sellNum: 0, done: false },
        { title: "木槌", sellNum: 0, done: false },
        { title: "标桩", sellNum: 0, done: false },
        { title: "盒钉", sellNum: 0, done: false },
        { title: "螺钉", sellNum: 0, done: false },
        { title: "镶板", sellNum: 0, done: false },
        { title: "螺栓", sellNum: 0, done: false },
        { title: "木板", sellNum: 0, done: false },
        { title: "胶带", sellNum: 0, done: false }
    ];
}

// 定义"应用到全部"按钮点击事件处理函数
function applySellPlanToAllAccounts(index) {
    // 获取当前账户的售卖列表数据源
    var currentDataSource = allCangkuSoldLists["sell_CangkuSoldList" + index];

    if (currentDataSource && Array.isArray(currentDataSource)) {
        // 将当前账户的售卖计划应用到其他所有账户
        for (var j = 1; j <= sell_accountList.length; j++) {
            // 跳过当前账户自身
            if (j !== index) {
                var targetDataSource = allCangkuSoldLists["sell_CangkuSoldList" + j];

                if (targetDataSource && Array.isArray(targetDataSource)) {
                    // 应用售卖计划到目标账户
                    for (var k = 0; k < currentDataSource.length && k < targetDataSource.length; k++) {
                        targetDataSource[k].sellNum = currentDataSource[k].sellNum;
                        targetDataSource[k].done = currentDataSource[k].done;
                    }

                    // 更新目标账户的UI
                    if (ui["sell_CangkuSoldList" + j]) {
                        ui["sell_CangkuSoldList" + j].setDataSource(targetDataSource);
                    }
                }
            }
        }

        toastLog("已将当前账户的售卖计划应用到其他所有账户");
    } else {
        toast("当前账户数据无效");
    }
}

// 定义辅助函数，用于查找所有列表中具有相同标题的项目
function findAllMatchingItems(title) {
    var matchingItems = [];

    // 遍历所有账户的售卖列表数据源
    for (var i = 1; i <= sell_accountList.length; i++) {
        // 获取当前账户的售卖列表数据源
        var dataSource = allCangkuSoldLists["sell_CangkuSoldList" + i];

        if (dataSource && Array.isArray(dataSource)) {
            // 查找匹配的项目
            for (var j = 0; j < dataSource.length; j++) {
                if (dataSource[j].title === title) {
                    matchingItems.push({
                        listIndex: i,
                        itemIndex: j,
                        item: dataSource[j],
                        dataSource: dataSource
                    });
                }
            }
        }
    }

    return matchingItems;
}

// 定义"添加项目"按钮点击事件处理函数
function addNewItemToAllAccounts() {
    // 弹出对话框让用户输入项目名称
    dialogs.prompt("添加项目", "").then(function (title) {
        if (title) {
            // 遍历所有账户的售卖列表数据源
            for (var i = 1; i <= sell_accountList.length; i++) {
                // 获取当前账户的售卖列表数据源
                var dataSource = allCangkuSoldLists["sell_CangkuSoldList" + i];

                if (dataSource && Array.isArray(dataSource)) {
                    // 创建新项目对象
                    var newItem = {
                        title: title,
                        sellNum: 0,
                        done: false
                    };

                    // 将新项目添加到数据源
                    dataSource.push(newItem);

                    // 更新UI
                    if (ui["sell_CangkuSoldList" + i]) {
                        ui["sell_CangkuSoldList" + i].setDataSource(dataSource);
                    }
                }
            }

            log("已为所有账户添加项目: " + title);
        }
    });
}

// 定义导入账户列表的函数
function importAccountList() {
    // 从配置中获取accountList数据
    var importedAccountList = configs.get("accountList");

    if (importedAccountList && Array.isArray(importedAccountList) && importedAccountList.length > 0) {
        // 清空现有的sell_accountList（除了第一个"当前"项）
        sell_accountList.splice(1);

        // 将导入的数据添加到sell_accountList中
        for (var i = 0; i < importedAccountList.length; i++) {
            sell_accountList.push({
                title: importedAccountList[i].title,
                done: false,
                price: 0  // 添加默认价格属性
            });
        }

        // 更新UI数据源
        ui.sell_accountList.setDataSource(sell_accountList);

        // 清除容器中的现有内容
        ui.sell_Container.removeAllViews();

        // 重新生成内容块
        generateContentBlocks(sell_accountList);

        // 重新创建所有账户对应的仓库售卖列表数据源
        // 创建新的对象而不是直接赋值空对象，避免引用问题
        var newCangkuSoldLists = {};
        // 保留已有的售卖计划数据，如果不存在则使用默认值
        for (var i = 1; i <= sell_accountList.length; i++) {
            // 检查是否已存在该账户的售卖列表数据
            if (allCangkuSoldLists && allCangkuSoldLists["sell_CangkuSoldList" + i]) {
                // 保留已有的数据
                newCangkuSoldLists["sell_CangkuSoldList" + i] = allCangkuSoldLists["sell_CangkuSoldList" + i];
            } else {
                // 使用默认值
                newCangkuSoldLists["sell_CangkuSoldList" + i] = createDefaultItemList();
            }
        }
        // 安全地替换allCangkuSoldLists对象
        allCangkuSoldLists = newCangkuSoldLists;

        // 为每个账户的内容块重新设置数据源和事件处理
        for (var i = 1; i <= sell_accountList.length; i++) {
            // 使用闭包确保正确的索引值
            (function (index) {
                // 确保数据源是一个有效的数组对象
                var dataSource = allCangkuSoldLists["sell_CangkuSoldList" + index];
                if (dataSource && Array.isArray(dataSource)) {
                    // 设置数据源
                    if (ui["sell_CangkuSoldList" + index]) {
                        ui["sell_CangkuSoldList" + index].setDataSource(dataSource);
                    }
                } else {
                    // 如果数据源无效，提供一个默认的空数组
                    var defaultDataSource = createDefaultItemList();
                    allCangkuSoldLists["sell_CangkuSoldList" + index] = defaultDataSource;
                    if (ui["sell_CangkuSoldList" + index]) {
                        ui["sell_CangkuSoldList" + index].setDataSource(defaultDataSource);
                    }
                }

                // 重新绑定事件处理
                if (ui["sell_CangkuSoldList" + index]) {
                    ui["sell_CangkuSoldList" + index].on("item_bind", (function (listIndex) {
                        return function (itemView, itemHolder) {
                            // 绑定输入框文本变化事件
                            itemView.sell_input.addTextChangedListener(new android.text.TextWatcher({
                                afterTextChanged: function (s) {
                                    var item = itemHolder.item;
                                    item.sellNum = parseInt(s.toString()) || 0;
                                },
                                beforeTextChanged: function (s, start, count, after) { },
                                onTextChanged: function (s, start, before, count) { }
                            }));

                            itemView.sell_sellAllButton.on("click", function () {
                                // 全部售卖
                                itemView.sell_input.setText("-1");
                                // 更新数据源
                                var item = itemHolder.item;
                                item.sellNum = -1;
                            });

                            // 绑定复选框点击事件
                            itemView.sell_done.on("check", function (checked) {
                                var item = itemHolder.item;
                                item.done = checked;
                            });

                            // 绑定项目点击事件，用于修改项目名称
                            itemView.setOnClickListener(new android.view.View.OnClickListener({
                                onClick: function (view) {
                                    var item = itemHolder.item;
                                    // 弹出输入框让用户修改项目名称
                                    dialogs.prompt("修改项目名称", item.title, function (newTitle) {
                                        if (newTitle && newTitle != item.title) {
                                            // 查找所有具有相同标题的项目
                                            var matchingItems = findAllMatchingItems(item.title);

                                            // 更新所有匹配项目的标题
                                            for (var i = 0; i < matchingItems.length; i++) {
                                                var match = matchingItems[i];
                                                match.item.title = newTitle;

                                                // 更新对应列表的UI
                                                if (ui["sell_CangkuSoldList" + match.listIndex]) {
                                                    ui["sell_CangkuSoldList" + match.listIndex].setDataSource(match.dataSource);
                                                }
                                            }

                                            log("已同步修改所有账户中的项目名称: " + newTitle);
                                        }
                                    });
                                }
                            }));

                            // 绑定项目长按事件，用于删除项目
                            itemView.setOnLongClickListener(new android.view.View.OnLongClickListener({
                                onLongClick: function (view) {
                                    var item = itemHolder.item;
                                    // 弹出确认对话框
                                    dialogs.confirm("删除项目", "确定要删除项目 \"" + item.title + "\" 吗？这将从所有账户中删除该项目。", function (confirmation) {
                                        if (confirmation) {
                                            // 查找所有具有相同标题的项目
                                            var matchingItems = findAllMatchingItems(item.title);

                                            // 从所有数据源中移除该项目
                                            for (var i = 0; i < matchingItems.length; i++) {
                                                var match = matchingItems[i];
                                                match.dataSource.splice(match.itemIndex, 1);

                                                // 更新对应列表的UI
                                                if (ui["sell_CangkuSoldList" + match.listIndex]) {
                                                    ui["sell_CangkuSoldList" + match.listIndex].setDataSource(match.dataSource);
                                                }
                                            }

                                            log("已从所有账户中删除项目: " + item.title);
                                        }
                                    });
                                    return true; // 表示消费了这个长按事件
                                }
                            }));
                        };
                    })(index));
                }
            })(i);
        }

        // 重新绑定账户列表项的点击事件
        ui.sell_accountList.on("item_click", function (item, i, itemView, listView) {
            // 隐藏所有内容块
            for (var j = 1; j <= sell_accountList.length; j++) {
                var contentBlock = ui.findView("sell_contentBlock" + j);
                if (contentBlock) {
                    contentBlock.setVisibility(android.view.View.GONE);
                }
            }

            // 显示当前选中的内容块
            var currentContentBlock = ui.findView("sell_contentBlock" + (i + 1));
            if (currentContentBlock) {
                currentContentBlock.setVisibility(android.view.View.VISIBLE);
            }

            // 更新标题文本为当前选中账户的标题
            var pageTitle = ui.findView("sell_pageTitle" + (i + 1));
            if (pageTitle) {
                pageTitle.setText(item.title);
            }
        });

        // 为每个账户的内容块重新添加"应用到全部"按钮的点击事件
        for (var i = 1; i <= sell_accountList.length; i++) {
            // 使用闭包确保正确的索引值
            (function (index) {
                var applyAllButton = ui.findView("sell_applyAllButton" + index);
                if (applyAllButton) {
                    applyAllButton.on("click", function () {
                        applySellPlanToAllAccounts(index);
                    }
                    );
                }

                // 为每个账户的内容块重新添加"添加项目"按钮的点击事件（添加到所有账户）
                var addItemButton = ui.findView("sell_addItemButton" + index);
                if (addItemButton) {
                    addItemButton.on("click", function () {
                        addNewItemToAllAccounts();
                    });
                }
                // 设置当前账户的售卖价格
                var price = sell_accountList[index - 1].price;
                if (price !== undefined && price !== null) {
                    ui.findView("sell_price" + index).setSelection(price);
                } else {
                    // 如果价格未定义，则设置为默认值0
                    ui.findView("sell_price" + index).setSelection(0);
                }
            })(i);
        }

        // 默认显示第一个账户的内容块
        if (sell_accountList.length > 0) {
            // 隐藏所有内容块
            for (var j = 1; j <= sell_accountList.length; j++) {
                var contentBlock = ui.findView("sell_contentBlock" + j);
                if (contentBlock) {
                    contentBlock.setVisibility(android.view.View.GONE);
                }
            }

            // 显示第一个账户的内容块
            var firstContentBlock = ui.findView("sell_contentBlock1");
            if (firstContentBlock) {
                firstContentBlock.setVisibility(android.view.View.VISIBLE);
            }
        }

        toast("已成功导入账号列表");
    } else {
        toast("配置中没有找到账户列表数据");
    }
}

// 根据不同类型设置物品售卖数量和状态的通用函数
function setItemsForAllAccounts(itemTypes, sellNum, done) {
    // 定义物品类型映射
    const itemTypeMap = {
        "锯斧": ["斧头", "木锯"],
        "炸矿": ["炸药", "炸药桶", "铁铲", "十字镐"],
        "货仓": ["螺栓", "木板", "胶带"],
        "粮仓": ["盒钉", "螺钉", "镶板"],
        "扩地": ["土地契约", "木槌", "标桩"],
        "螺栓": ["螺栓"],
        "木板": ["木板"],
        "胶带": ["胶带"],
        "盒钉": ["盒钉"],
        "螺钉": ["螺钉"],
        "镶板": ["镶板"],
        "土地契约": ["土地契约"],
        "木槌": ["木槌"],
        "标桩": ["标桩"],
        // 粮仓类与货仓类使用相同物品，只是在不同界面操作
    };

    // 获取要处理的物品列表
    let targetItems = [];
    if (typeof itemTypes === "string") {
        // 如果是字符串类型，从映射中获取物品列表
        targetItems = itemTypeMap[itemTypes] || [];
    } else if (Array.isArray(itemTypes)) {
        // 如果是数组类型，直接使用
        targetItems = itemTypes;
    }

    // 如果没有指定物品列表，直接返回
    if (targetItems.length === 0) {
        return;
    }

    // 遍历所有账户
    for (var i = 1; i <= sell_accountList.length; i++) {
        var accountItemList = allCangkuSoldLists["sell_CangkuSoldList" + i];
        if (accountItemList && Array.isArray(accountItemList)) {
            // 遍历目标物品
            for (var j = 0; j < targetItems.length; j++) {
                var targetItem = targetItems[j];
                // 在当前账户的物品列表中查找目标物品
                for (var k = 0; k < accountItemList.length; k++) {
                    if (accountItemList[k].title === targetItem) {
                        // 设置售卖数量和状态
                        accountItemList[k].sellNum = sellNum;
                        accountItemList[k].done = done;
                        break;
                    }
                }
            }

            // 更新UI
            if (ui["sell_CangkuSoldList" + i]) {
                ui["sell_CangkuSoldList" + i].setDataSource(accountItemList);
            }
        }
    }
}

ui.layout(
    <frame>
        <drawer id="drawer">
            <vertical>
                {/*页头*/}
                <appbar id="appbar" bg="{{color}}" >
                    <toolbar id="toolbar" title="卡通农场小助手" layout_height="50">
                        <img id="log_icon" src="@drawable/ic_assignment_black_48dp" w="22" h="22" tint="white" gravity="center" layout_gravity="right" marginRight="16" />
                    </toolbar>
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
                                            <spinner id="functionSelect" entries="刷地|种树|创新号|仅汤姆|物品售卖"
                                                w="auto" textSize="14" h="48" bg="#FFFFFF" />
                                            <img id="helpIcon_functionSelect" src="@drawable/ic_help_outline_black_48dp" w="18" h="18" tint="#007AFF" marginRight="8" />
                                        </horizontal>

                                        {/* 作物选择 - 仅在刷地时显示 */}
                                        <vertical id="cropSelectContainer" gravity="center_vertical" visibility="visible">
                                            <horizontal gravity="center_vertical">
                                                <text text="种植作物：" textSize="14" w="80" marginRight="8" />
                                                <spinner id="cropSelect" entries="小麦|玉米|胡萝卜|大豆|甘蔗"
                                                    w="auto" textSize="14" h="48" bg="#FFFFFF" />
                                                <text text="成熟时间:" textSize="14" w="80" marginLeft="14" />
                                                <input id="matureTime" inputType="number" marginRight="8" hint="2" w="50" h="48" textSize="14" bg="#FFFFFF" maxLength="3" />
                                            </horizontal>

                                            {/* 商店售价 - 仅在刷地时显示*/}
                                            <horizontal gravity="center_vertical" >
                                                <text text="商店售价：" textSize="14" w="80" marginRight="8" />
                                                <spinner id="shopPrice" entries="最低|平价|最高" w="50" textSize="14" h="48" bg="#FFFFFF" />
                                                <text text="保留数量:" textSize="14" w="80" marginLeft="20" />
                                                <input id="ReservedQuantity" inputType="number" marginRight="8" hint="20" w="50" h="48" textSize="14" bg="#FFFFFF" maxLength="3" />
                                            </horizontal>

                                            {/* 仓库售卖 - 仅在刷地时显示*/}
                                            <horizontal gravity="center_vertical">
                                                <text text="仓库售卖：" textSize="14" w="80" marginRight="8" />
                                                <button id="cangkuSoldBtn" text="设置" textColor="#3fdacd" textSize="14" w="50" h="48" bg="#FFFFFF" style="Widget.AppCompat.Button.Borderless.Colored" />
                                                <text text="触发阈值:" textSize="14" w="80" marginRight="3" paddingLeft="20" />
                                                <input id="CangkuSold_triggerNum" type="number" w="auto" h="48" text="10" marginLeft="5" marginRight="5" textSize="14" bg="#FFFFFF" maxLength="3" />
                                                <text text="~" textSize="14" w="auto" />
                                                <input id="CangkuSold_targetNum" type="number" w="auto" h="48" text="25" marginLeft="5" textSize="14" bg="#FFFFFF" maxLength="3" />
                                            </horizontal>

                                            {/* 汤姆 - 仅在刷地时显示*/}
                                            <horizontal id="tomSwitchContainer" gravity="center_vertical">
                                                <text text="开启汤姆：" textSize="14" w="80" marginRight="8" />
                                                <Switch id="tomSwitch" w="*" h="48" gravity="left|center" />
                                            </horizontal>
                                        </vertical>

                                        {/* 物品类型和名称 - 仅在汤姆开关开启时显示 */}
                                        <horizontal id="tomItemContainer" gravity="center_vertical" visibility="gone">
                                            <text text="物品类型：" textSize="14" w="80" marginRight="8" />
                                            <spinner id="Tom_itemType" entries="货仓|粮仓" w="120" textSize="14" h="48" bg="#FFFFFF" marginRight="8" />
                                            <input id="Tom_itemName" hint="物品名称" w="*" h="48" textSize="14" bg="#FFFFFF" />
                                        </horizontal>

                                        {/* 树木选择 - 仅在种树时显示 */}
                                        <vertical id="treeSelectContainer" gravity="center_vertical" visibility="gone">
                                            <horizontal gravity="center_vertical">
                                                <text text="种植树木：" textSize="14" w="80" marginRight="8" />
                                                <spinner id="treeSelect" entries="苹果树|树莓丛|樱桃树|黑莓丛|蓝莓丛|可可树|咖啡丛|橄榄树|柠檬树|香橙树|水蜜桃树|香蕉树|西梅树|芒果树|椰子树|番石榴树|石榴树"
                                                    w="auto" textSize="14" h="48" bg="#FFFFFF" />
                                            </horizontal>

                                            {/* 是否滑动 - 仅在种树时显示 */}
                                            <horizontal gravity="center_vertical">
                                                <text text="是否自动滑动：" textSize="14" w="80" marginRight="8" />
                                                <Switch id="treeShouldSwipeSwitch" w="*" h="48"
                                                    gravity="left|center" />
                                            </horizontal>
                                        </vertical>

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

                                        {/* 物品售卖 - 仅在物品售卖时显示*/}
                                        <vertical id="sell_itemSoldContainer" gravity="center_vertical" visibility="gone">
                                            <horizontal gravity="center_vertical">
                                                <text text="物品售卖：" textSize="14" w="80" marginRight="8" />
                                                <button id="sell_itemSoldBtn" text="设置" textColor="#3fdacd" textSize="14" w="50" h="48" bg="#FFFFFF" style="Widget.AppCompat.Button.Borderless.Colored" />
                                                <text text="清除粉丝：" textSize="14" w="80" marginLeft="20" />
                                                <checkbox id="clearFans" checked="${configs.get('clearFans') || false}" />
                                            </horizontal>
                                            <horizontal gravity="center_vertical">
                                                <text text="等待货架：" textSize="14" w="80" marginRight="8" />
                                                <checkbox id="waitShelf" checked="${configs.get('waitShelf') || false}" />
                                            </horizontal>
                                        </vertical>

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
                                            <Switch id="accountSwitch" w="*" h="48" />
                                        </horizontal>

                                        {/* 识别方式选择 */}
                                        <horizontal gravity="center_vertical" marginTop="8">
                                            <text text="识别方式：" textSize="14" w="100" marginRight="8" />
                                            <radiogroup id="findAccountMethod" orientation="horizontal">
                                                <radio id="findAccountMethod_image" checked="false" text="图片识别" />
                                                <frame w="3" />
                                                <radio id="findAccountMethod_text" checked="false" text="文字识别" />
                                            </radiogroup>
                                        </horizontal>

                                        {/* 账号方式选择 */}
                                        <horizontal gravity="center_vertical" marginTop="8">
                                            <text text="切换账号方式：" textSize="14" w="100" marginRight="8" />
                                            <radiogroup id="accountMethod" orientation="horizontal">
                                                <radio id="accountMethod_email" checked="false" text="邮箱" />
                                                <frame w="30" />
                                                <radio id="accountMethod_save" checked="false" text="存档" />
                                            </radiogroup>
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
                                        <text text="基础设置" textSize="16" textStyle="bold" />

                                        <horizontal gravity="center_vertical">
                                            <text text="顶号延迟" textSize="14" w="120" marginRight="8" />
                                            <input id="pauseTime" hint="5" w="120" h="40" textSize="14" bg="#FFFFFF" inputType="number" marginRight="8" />
                                            <text text="分钟" textSize="14" w="120" marginRight="8" />
                                        </horizontal>

                                        <horizontal gravity="center_vertical">
                                            <text text="寻找土地方法" textSize="14" w="120" marginRight="8" />
                                            <radiogroup id="landFindMethod" orientation="horizontal">
                                                <radio id="landFindMethod_shop" checked="false" text="商店" />
                                                <frame w="30" />
                                                <radio id="landFindMethod_bread" checked="false" text="面包房" />
                                            </radiogroup>
                                        </horizontal>

                                        <horizontal paddingTop="8">
                                            <text text="坐标点击" textSize="14" w="auto" marginRight="8" />
                                            <img id="helpIcon_coordClick" src="@drawable/ic_help_outline_black_48dp" w="18" h="18" tint="#007AFF" marginRight="8" />
                                        </horizontal>
                                        <horizontal paddingTop="8">
                                            <text text="截图权限坐标" textSize="14" marginRight="4" w="100" />
                                            <text id="screenshotBtn" text="设置" textSize="14" textColor="#2196F3" marginRight="4" paddingLeft="150" />
                                        </horizontal>
                                        <horizontal paddingTop="8">
                                            <text text="换号坐标" textSize="14" marginRight="4" w="100" />
                                            <text id="switchAccountBtn" text="设置" textSize="14" textColor="#2196F3" marginRight="4" paddingLeft="150" />
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
                                            <checkbox id="shengcang_h" checked="false" text="货仓" />
                                            <frame w="30" />
                                            <checkbox id="shengcang_l" checked="false" text="粮仓" />
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
                                            <img id="eyeIcon" w="20dp" h="20dp" src="@drawable/ic_visibility_off_black_48dp" />
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
                                            <text text="脚本照片文件夹路径：" textSize="14" w="100" marginRight="8" />
                                            <input id="photoPath" text="./res/pictures.1280_720" w="*" textSize="14" h="48" bg="#FFFFFF" />
                                        </horizontal>
                                        <horizontal gravity="center_vertical">
                                            <text text="账号照片文件夹路径：" textSize="14" w="100" marginRight="8" />
                                            <input id="accountImgPath" text="{{accountImgDir}}" w="*" textSize="14" h="auto" bg="#FFFFFF" />
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

                                {/* 主题颜色卡片 */}
                                <card w="*" h="auto" marginBottom="16" cardCornerRadius="8" cardElevation="2">
                                    <vertical padding="16">
                                        <text text="主题颜色" textSize="16" textStyle="bold" marginBottom="8" />

                                        {/* 主题颜色 */}
                                        <horizontal gravity="center_vertical" marginBottom="8">
                                            <text text="主题颜色：" textSize="14" w="100" marginRight="8" />
                                            <spinner id="themeColor" entries="随机颜色|碧玉青|落日橙|翠竹绿|晴空蓝|胭脂粉|朱砂红|湖水蓝|紫罗兰|咖啡棕|烟雨灰"
                                                w="*" textSize="14" textColor="{{color}}" h="48" bg="#FFFFFF" />
                                        </horizontal>

                                    </vertical>
                                </card>

                                {/* 运行设置卡片 */}
                                <card w="*" h="auto" marginBottom="16" cardCornerRadius="8" cardElevation="2">
                                    <vertical padding="16">
                                        <text text="运行设置" textSize="16" textStyle="bold" marginBottom="8" />

                                        {/* 使用shell命令重启游戏 */}
                                        <horizontal gravity="center_vertical" marginBottom="8">
                                            <text text="使用shell命令重启游戏:" textSize="14" w="auto" marginRight="8" />
                                            <img id="helpIcon_restartWithShell" src="@drawable/ic_help_outline_black_48dp" w="18" h="18" tint="#007AFF" marginLeft="10" />
                                            <Switch id="restartWithShell" checked="false" w="*" h="48" />
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
            </vertical >
            <vertical layout_gravity="left" bg="#ffffff" w="280">
                <img w="280" h="200" scaleType="fitXY" src="file://{{currentPath}}/res/images/sidebar.png" />
                <list id="menu">
                    <horizontal bg="?selectableItemBackground" w="*">
                        <img id="menuIcon" w="50" h="50" padding="16" src="{{this.icon}}" tint="{{color}}" />
                        <text textColor="black" textSize="15sp" text="{{this.title}}" layout_gravity="center" />
                    </horizontal>
                </list>
            </vertical>
        </drawer >


        <frame id="sell_frame" visibility="gone">
            <vertical>
                <appbar id="sell_appbar" bg="{{color}}">
                    <toolbar id="sell_toolbar" >
                        <img id="sell_exitButton" src="@drawable/ic_arrow_back_black_48dp" w="30" h="30" tint="#FFFFFF" />
                        <text text="仓库售卖" textSize="20sp" textColor="#FFFFFF" gravity="center" paddingLeft="20" />
                        <img id="helpIcon_sell" layout_gravity="center_vertical" src="@drawable/ic_help_outline_black_48dp" w="20" h="20" tint="#007AFF" marginLeft="30dp" />
                        <img id="saveIcon_sell" layout_gravity="right|center_vertical" src="@drawable/ic_save_black_48dp" w="28" h="28" tint="#FFFFFF" marginRight="15dp" />
                        <img id="settingIcon_sell" layout_gravity="right|center_vertical" src="@drawable/ic_settings_black_48dp" w="28" h="28" tint="#FFFFFF" marginRight="15dp" />
                    </toolbar>
                </appbar>
                <horizontal>

                    <vertical id="sell_drawerArea" w="100" h="*" bg="#EEEEEE" padding="10dp">
                        <list id="sell_accountList" h="500">
                            <horizontal w="*" h="50" padding="10dp" bg="#FFFFFF" marginBottom="5dp">
                                <text text="{{this.title}}" textSize="16sp" w="30" layout_weight="1" maxLines="1" />
                                <checkbox id="sell_accountList_done" checked="{{this.done}}" />
                            </horizontal>
                        </list>
                        <button id="sell_improtAccountListButton" text="导入" w="auto" h="45" />
                    </vertical>
                    <vertical w="*" h="*">
                        <linear id="sell_Container" orientation="vertical" />
                    </vertical>
                </horizontal>
            </vertical>
        </frame>
    </frame>
);

//设置滑动页面的标题
ui.viewpager.setTitles(["首页", "账号信息", "参数配置", "更多"]);
//让滑动页面和标签栏联动
ui.tabs.setupWithViewPager(ui.viewpager);

// 手动设置屏幕分辨率
ui.screenResolution.setText(device.width + "×" + device.height);

// 手动设置设备型号
ui.deviceModel.setText(device.brand + " " + device.model);

ui.log_icon.on("click", () => {
    app.startActivity("console")
});


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

// 处理返回键事件
ui.emitter.on("back_pressed", () => {
    // 如果在新界面，返回主界面
    if (ui.sell_frame.getVisibility() === 0) {
        ui.sell_frame.setVisibility(8); // 8 = GONE
        ui.drawer.setVisibility(0); // 0 = VISIBLE
        return true; // 消耗返回键事件，不退出脚本
    }
    // 在主界面时，返回键退出脚本
    return false;
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
    log("======== 开始检查更新 ========");
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
                log("版本比较结果: " + compareResult);

                ui.run(() => {
                    if (compareResult < 0) {
                        // 有新版本
                        let updateSource = "gitee"; // 默认更新源
                        dialogs.build({
                            title: "发现新版本",
                            customView: ui.inflate(
                                <vertical padding="16">
                                    <text id="versionInfo" textSize="14sp" textColor="#333333" marginTop="8" />
                                    <text textSize="14sp" textColor="#ef9a9a" marginTop="8" text="强烈建议使用“下载压缩包”方式更新!!!" />
                                    <text id="updateContent" textSize="14sp" textColor="#333333" marginTop="16" />
                                    <text id="giteeResult" textSize="12sp" textColor="#666666" marginTop="8" text="Gitee: 未检测" />
                                    <text id="githubResult" textSize="12sp" textColor="#666666" marginTop="4" text="Github: 未检测" />
                                    <button id="connectivityBtn" text="检测连通性" textSize="12sp" w="auto" h="auto" marginTop="16" />
                                    <text textSize="14sp" textColor="#333333" marginTop="16">选择更新源：</text>
                                    <radio id="giteeRadio" text="Gitee (国内源)" checked="true" group="updateSourceGroup" />
                                    <radio id="githubRadio" text="GitHub (国外源)" group="updateSourceGroup" />
                                </vertical>
                            ),
                            positive: "下载压缩包",
                            negative: "立即更新",
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
                        }).on("negative", () => {
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
                        }).on("positive", () => {
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




// 更新按钮颜色函数
function updateButtonColors() {
    // 更新菜单图标颜色
    ui.menu.adapter.notifyDataSetChanged();
    // 更新主题颜色文本颜色
    ui.themeColor.setTextColor(android.graphics.Color.parseColor(color));
    // 更新状态栏颜色
    ui.statusBarColor(color);
    // 更新应用栏背景颜色
    ui.appbar.setBackgroundColor(android.graphics.Color.parseColor(color));
    ui.sell_appbar.setBackgroundColor(android.graphics.Color.parseColor(color));
}
//


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
        pauseTime: configs.get("pauseTime"),
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
        accountImgPath: configs.get("accountImgPath"),
        themeColor: configs.get("themeColor"),
        shengcang_h: configs.get("shengcang_h"),
        shengcang_l: configs.get("shengcang_l"),
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
        CangkuSoldList: configs.get("CangkuSoldList", CangkuSoldList),
        isCangkuSold: configs.get("isCangkuSold", false),
        CangkuSold_triggerNum: configs.get("CangkuSold_triggerNum", 10),
        CangkuSold_targetNum: configs.get("CangkuSold_targetNum", 25),
        restartWithShell: configs.get("restartWithShell", false),
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
        },
        switchAccountCoords: {
            coord1: {
                x: configs.get("switchAccountX1"),
                y: configs.get("switchAccountY1")
            },
            coord2: {
                x: configs.get("switchAccountX2"),
                y: configs.get("switchAccountY2")
            },
            coord3: {
                x: configs.get("switchAccountX3"),
                y: configs.get("switchAccountY3")
            },
        },
        clearFans: configs.get("clearFans"),
        sell_accountList: configs.get("sell_accountList"),
        waitShelf: configs.get("waitShelf"),
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
        configs.put("pauseTime", con.pauseTime);
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
        configs.put("themeColor", con.themeColor);
        configs.put("shengcang_h", con.shengcang_h);
        configs.put("shengcang_l", con.shengcang_l);
        configs.put("shengcangTime", con.shengcangTime);
        configs.put("isCangkuStatistics", con.isCangkuStatistics);
        configs.put("cangkuStatisticsTime", con.cangkuStatisticsTime);
        configs.put("cangkuStatisticsPage", con.cangkuStatisticsPage);
        configs.put("treeShouldSwipe", con.treeShouldSwipe);
        configs.put("clearFans", con.clearFans);
        configs.put("waitShelf", con.waitShelf);

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

        // 存储切换账号坐标
        configs.put("switchAccountX1", con.switchAccountCoords.coord1.x);
        configs.put("switchAccountY1", con.switchAccountCoords.coord1.y);
        configs.put("switchAccountX2", con.switchAccountCoords.coord2.x);
        configs.put("switchAccountY2", con.switchAccountCoords.coord2.y);
        configs.put("switchAccountX3", con.switchAccountCoords.coord3.x);
        configs.put("switchAccountY3", con.switchAccountCoords.coord3.y);


        configs.put("CangkuSold_triggerNum", con.CangkuSold_triggerNum);
        configs.put("CangkuSold_targetNum", con.CangkuSold_targetNum);

        configs.put("sell_accountList", con.sell_accountList || []);

        // 存储其他配置项
        configs.put("restartWithShell", con.restartWithShell);

        // console.log("配置保存成功");
        return true;
    } catch (e) {
        console.error("保存配置失败:", e);
        toast("保存配置失败: " + e.message, "long");
        return false;
    }
}


/**
 * 从配置文件、存储对象加载配置
 * @param {boolean} loadConfigFromFile - 是否从配置文件加载，默认从存储对象加载
 * @returns {object} 加载的配置对象
 */
function loadConfig(loadConfigFromFile = false) {
    try {
        let con_load
        // 检查是否从配置文件加载
        if (loadConfigFromFile) {
            log("从配置文件加载配置")
            con_load = JSON.parse(files.read(configPath));

        } else {
            log("从存储对象加载配置")
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
 * @param {object} config - 待验证的配置对象
 * @returns {object} 验证后的配置对象
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

    //验证账号识别方式
    if (!config.findAccountMethod || (config.findAccountMethod !== "image" && config.findAccountMethod !== "ocr")) {
        config.findAccountMethod = defaultConfig.findAccountMethod;
    }

    //验证切换账号方式
    if (!config.accountMethod || (config.accountMethod !== "ocr" && config.accountMethod !== "save")) {
        config.accountMethod = defaultConfig.accountMethod;
    }

    // 验证查找土地方式
    if (config.landFindMethod != "商店" && config.landFindMethod != "面包房") config.landFindMethod = defaultConfig.landFindMethod;

    // 验证功能选择
    if (!config.selectedFunction) config.selectedFunction = defaultConfig.selectedFunction;
    const functionOptions = ["刷地", "种树", "创新号", "仅汤姆", "物品售卖"];
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

    // 验证主题颜色
    if (!config.themeColor) config.themeColor = {
        code: defaultConfig.themeColor.code,
        text: defaultConfig.themeColor.text
    };

    if (config.themeColor.code < 0) {
        config.themeColor.code = defaultConfig.themeColor.code;
    }
    // 处理主题颜色文本显示，当code为0时表示随机颜色
    if (config.themeColor.code === 0) {
        config.themeColor.text = "随机颜色";
    } else {
        config.themeColor.text = colorLibrary[config.themeColor.code - 1].name;
    }

    // 验证pauseTime
    if (config.pauseTime == undefined || isNaN(config.pauseTime) || config.pauseTime < 0) {
        config.pauseTime = defaultConfig.pauseTime;
    } else config.pauseTime = Number(config.pauseTime);

    // 验证cangkuTime
    if (config.shengcangTime == undefined || isNaN(config.shengcangTime) || config.shengcangTime < 0) {
        config.shengcangTime = defaultConfig.shengcangTime;
    } else config.shengcangTime = Number(config.shengcangTime);

    // 验证shengcang_h
    if (config.shengcang_h == undefined || typeof config.shengcang_h !== "boolean") {
        config.shengcang_h = defaultConfig.shengcang_h;
    }

    // 验证shengcang_l
    if (config.shengcang_l == undefined || typeof config.shengcang_l !== "boolean") {
        config.shengcang_l = defaultConfig.shengcang_l;
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

    //验证售卖列表
    if (!Array.isArray(config.sell_accountList)) config.sell_accountList = [];

    // 验证清除粉丝
    if (config.clearFans == undefined || typeof config.clearFans !== "boolean") {
        config.clearFans = defaultConfig.clearFans;
    }

    // 验证等待货架
    if (config.waitShelf == undefined || typeof config.waitShelf !== "boolean") {
        config.waitShelf = defaultConfig.waitShelf;
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

    // 验证是否已出售商品列表
    if (!Array.isArray(config.CangkuSoldList)) config.CangkuSoldList = CangkuSoldList;

    // 验证是否出售商品
    if (typeof config.isCangkuSold !== "boolean") {
        config.isCangkuSold = defaultConfig.isCangkuSold;
    }
    // 验证触发阈值
    if (config.CangkuSold_triggerNum == undefined || isNaN(config.CangkuSold_triggerNum) || config.CangkuSold_triggerNum < 0) {
        config.CangkuSold_triggerNum = defaultConfig.CangkuSold_triggerNum;
    } else config.CangkuSold_triggerNum = Number(config.CangkuSold_triggerNum);
    // 验证目标阈值
    if (config.CangkuSold_targetNum == undefined || isNaN(config.CangkuSold_targetNum) || config.CangkuSold_targetNum < 0) {
        config.CangkuSold_targetNum = defaultConfig.CangkuSold_targetNum;
    } else config.CangkuSold_targetNum = Number(config.CangkuSold_targetNum);

    // 验证token
    if (config.token == undefined || config.token === undefined) config.token = defaultConfig.token;

    // 验证推送方式
    if (!config.serverPlatform) config.serverPlatform = defaultConfig.serverPlatform;

    config.serverPlatform.text = ["Pushplus推送加", "Server酱", "WxPusher"][config.serverPlatform.code];

    // 验证是否使用shell命令重启游戏
    if (typeof config.restartWithShell !== "boolean") {
        config.restartWithShell = defaultConfig.restartWithShell;
    }

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
                config.screenshotCoords.coord1.x = 0;
            } else {
                // 如果有值则转换为数字
                config.screenshotCoords.coord1.x = !isNaN(Number(config.screenshotCoords.coord1.x)) ? Number(config.screenshotCoords.coord1.x) : defaultConfig.screenshotCoords.coord1.x;
            }

            if (config.screenshotCoords.coord1.y === "" || config.screenshotCoords.coord1.y === null) {
                config.screenshotCoords.coord1.y = 0;
            } else {
                config.screenshotCoords.coord1.y = !isNaN(Number(config.screenshotCoords.coord1.y)) ? Number(config.screenshotCoords.coord1.y) : defaultConfig.screenshotCoords.coord1.y;
            }
        }

        // 验证坐标2
        if (!config.screenshotCoords.coord2) {
            config.screenshotCoords.coord2 = defaultConfig.screenshotCoords.coord2;
        } else {
            if (config.screenshotCoords.coord2.x === "" || config.screenshotCoords.coord2.x === null) {
                config.screenshotCoords.coord2.x = 0;
            } else {
                config.screenshotCoords.coord2.x = !isNaN(Number(config.screenshotCoords.coord2.x)) ? Number(config.screenshotCoords.coord2.x) : defaultConfig.screenshotCoords.coord2.x;
            }

            if (config.screenshotCoords.coord2.y === "" || config.screenshotCoords.coord2.y === null) {
                config.screenshotCoords.coord2.y = 0;
            } else {
                config.screenshotCoords.coord2.y = !isNaN(Number(config.screenshotCoords.coord2.y)) ? Number(config.screenshotCoords.coord2.y) : defaultConfig.screenshotCoords.coord2.y;
            }
        }

        // 验证坐标3
        if (!config.screenshotCoords.coord3) {
            config.screenshotCoords.coord3 = defaultConfig.screenshotCoords.coord3;
        } else {
            if (config.screenshotCoords.coord3.x === "" || config.screenshotCoords.coord3.x === null) {
                config.screenshotCoords.coord3.x = 0;
            } else {
                config.screenshotCoords.coord3.x = !isNaN(Number(config.screenshotCoords.coord3.x)) ? Number(config.screenshotCoords.coord3.x) : defaultConfig.screenshotCoords.coord3.x;
            }

            if (config.screenshotCoords.coord3.y === "" || config.screenshotCoords.coord3.y === null) {
                config.screenshotCoords.coord3.y = 0;
            } else {
                config.screenshotCoords.coord3.y = !isNaN(Number(config.screenshotCoords.coord3.y)) ? Number(config.screenshotCoords.coord3.y) : defaultConfig.screenshotCoords.coord3.y;
            }
        }

        // 验证切换账号坐标配置
        if (!config.switchAccountCoords) {
            config.switchAccountCoords = defaultConfig.switchAccountCoords;
        } else {
            // 验证坐标1
            if (!config.switchAccountCoords.coord1) {
                config.switchAccountCoords.coord1 = defaultConfig.switchAccountCoords.coord1;
            } else {
                if (config.switchAccountCoords.coord1.x === "" || config.switchAccountCoords.coord1.x === null) {
                    config.switchAccountCoords.coord1.x = 0;
                } else {
                    config.switchAccountCoords.coord1.x = !isNaN(Number(config.switchAccountCoords.coord1.x)) ? Number(config.switchAccountCoords.coord1.x) : defaultConfig.switchAccountCoords.coord1.x;
                }

                if (config.switchAccountCoords.coord1.y === "" || config.switchAccountCoords.coord1.y === null) {
                    config.switchAccountCoords.coord1.y = 0;
                } else {
                    config.switchAccountCoords.coord1.y = !isNaN(Number(config.switchAccountCoords.coord1.y)) ? Number(config.switchAccountCoords.coord1.y) : defaultConfig.switchAccountCoords.coord1.y;
                }
            }

            // 验证坐标2
            if (!config.switchAccountCoords.coord2) {
                config.switchAccountCoords.coord2 = defaultConfig.switchAccountCoords.coord2;
            } else {
                if (config.switchAccountCoords.coord2.x === "" || config.switchAccountCoords.coord2.x === null) {
                    config.switchAccountCoords.coord2.x = 0;
                } else {
                    config.switchAccountCoords.coord2.x = !isNaN(Number(config.switchAccountCoords.coord2.x)) ? Number(config.switchAccountCoords.coord2.x) : defaultConfig.switchAccountCoords.coord2.x;
                }

                if (config.switchAccountCoords.coord2.y === "" || config.switchAccountCoords.coord2.y === null) {
                    config.switchAccountCoords.coord2.y = 0;
                } else {
                    config.switchAccountCoords.coord2.y = !isNaN(Number(config.switchAccountCoords.coord2.y)) ? Number(config.switchAccountCoords.coord2.y) : defaultConfig.switchAccountCoords.coord2.y;
                }
            }

            // 验证坐标3
            if (!config.switchAccountCoords.coord3) {
                config.switchAccountCoords.coord3 = defaultConfig.switchAccountCoords.coord3;
            } else {
                if (config.switchAccountCoords.coord3.x === "" || config.switchAccountCoords.coord3.x === null) {
                    config.switchAccountCoords.coord3.x = 0;
                } else {
                    config.switchAccountCoords.coord3.x = !isNaN(Number(config.switchAccountCoords.coord3.x)) ? Number(config.switchAccountCoords.coord3.x) : defaultConfig.switchAccountCoords.coord3.x;
                }

                if (config.switchAccountCoords.coord3.y === "" || config.switchAccountCoords.coord3.y === null) {
                    config.switchAccountCoords.coord3.y = 0;
                } else {
                    config.switchAccountCoords.coord3.y = !isNaN(Number(config.switchAccountCoords.coord3.y)) ? Number(config.switchAccountCoords.coord3.y) : defaultConfig.switchAccountCoords.coord3.y;
                }
            }
        }


    }

    // 其他验证...
    if (!config.photoPath || (config.photoPath && config.photoPath.length == 0)) config.photoPath = "./res/pictures.1280_720"
    if (!config.accountImgPath || (config.accountImgPath && config.accountImgPath.length == 0)) config.accountImgPath = accountImgDir

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
        accountMethod: "email", // 账号切换方式，默认使用邮箱切换
        findAccountMethod: "ocr", // 账号识别方式，默认为文字识别
        accountList: [], // 新增账号列表配置
        saveAccountList: [], // 新增保存账号列表配置
        addFriendsList: [], // 新增创新号账号列表配置
        shopPrice: {
            text: "最低",
            code: 0
        },
        ReservedQuantity: 20, // 默认保留数量为20
        pauseTime: 5, // 默认顶号延迟为5分钟
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
        accountImgPath: accountImgDir,
        themeColor: {
            text: "随机颜色",
            code: 0
        },
        shengcang_h: false,
        shengcang_l: false,
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
        CangkuSoldList: CangkuSoldList,
        isCangkuSold: false,
        CangkuSold_triggerNum: 10,
        CangkuSold_targetNum: 25,
        // 是否使用shell命令重启游戏
        restartWithShell: false,
        // 截图坐标配置
        screenshotCoords: {
            coord1: {
                x: 0,
                y: 0
            },
            coord2: {
                x: 0,
                y: 0
            },
            coord3: {
                x: 0,
                y: 0
            }
        },
        switchAccountCoords: {
            coord1: {
                x: 0,
                y: 0
            },
            coord2: {
                x: 0,
                y: 0
            },
            coord3: {
                x: 0,
                y: 0
            }
        },
        clearFans: false,
        waitShelf: false,
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

    ui.sell_accountList.setDataSource(sell_accountList);
    generateContentBlocks(sell_accountList)

    // 设置顶号延迟
    ui.pauseTime.setText(String(config.pauseTime));

    // 设置功能选择
    ui.functionSelect.setSelection(config.selectedFunction.code);

    // 设置作物选择
    ui.cropSelect.setSelection(config.selectedCrop.code);

    // 设置成熟时间
    ui.matureTime.setText(String(config.matureTime));

    // 设置树木选择
    ui.treeSelect.setSelection(config.selectedTree.code);


    // 设置账号相关
    ui.accountSwitch.setChecked(config.switchAccount);

    // 设置商店售价
    ui.shopPrice.setSelection(config.shopPrice.code);

    //设置主题颜色
    ui.themeColor.setSelection(config.themeColor.code);

    // 设置保留数量
    ui.ReservedQuantity.setText(String(config.ReservedQuantity));

    // 设置触发阈值
    ui.CangkuSold_triggerNum.setText(String(config.CangkuSold_triggerNum));
    // 设置目标阈值
    ui.CangkuSold_targetNum.setText(String(config.CangkuSold_targetNum));

    // 设置寻找土地方法
    if (config.landFindMethod == "商店") {
        ui.landFindMethod_shop.setChecked(true);
    } else {
        ui.landFindMethod_bread.setChecked(true);
    }

    // 设置账号识别方式
    if (config.findAccountMethod == "image") {
        ui.findAccountMethod_image.setChecked(true);
    } else {
        ui.findAccountMethod_text.setChecked(true);
    }

    // 设置切换账号方式
    if (config.accountMethod == "email") {
        ui.accountMethod_email.setChecked(true);
    } else {
        ui.accountMethod_save.setChecked(true);
    }

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

    // 设置账号照片路径
    ui.accountImgPath.setText(config.accountImgPath);

    // 设置粮仓坐标偏移
    ui.liangcangOffsetX.setText(String(config.liangcangOffset.x));
    ui.liangcangOffsetY.setText(String(config.liangcangOffset.y));

    // 设置货仓坐标偏移
    ui.huocangOffsetX.setText(String(config.huocangOffset.x));
    ui.huocangOffsetY.setText(String(config.huocangOffset.y));

    // 设置token
    const savedToken = token_storage.get("token", "");
    ui.tokenInput.setText(savedToken);
    ui.tokenInputPlain.setText(savedToken);

    // 设置推送方式
    ui.serverPlatform.setSelection(config.serverPlatform.code);

    // 设置cangkuTime
    ui.shengcangTime.setText(String(config.shengcangTime));

    // 设置是否自动升仓
    ui.shengcang_h.setChecked(config.shengcang_h);
    ui.shengcang_l.setChecked(config.shengcang_l);

    // 设置仓库统计开关
    ui.isCangkuStatistics.setChecked(config.isCangkuStatistics);

    // 设置仓库统计间隔时间
    ui.cangkuStatisticsTime.setText(String(config.cangkuStatisticsTime));

    // 设置仓库统计页数
    ui.cangkuStatisticsPage.setText(String(config.cangkuStatisticsPage));

    // 设置是否自动滑动
    ui.treeShouldSwipeSwitch.setChecked(config.treeShouldSwipe);

    ui.clearFans.setChecked(config.clearFans);

    ui.waitShelf.setChecked(config.waitShelf);

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

    // 设置是否使用shell命令重启游戏
    ui.restartWithShell.setChecked(config.restartWithShell);

    // 更新权限状态
    updateSwitchStatus();

}

function stopOtherEngines(stopAll = false) {
    log("开始停止" + (stopAll ? "所有" : "其他") + "引擎");

    while (engines.all().length > 1) {
        let engineArray = engines.all();
        let engine0 = engines.myEngine();
        // 遍历引擎数组
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
            } catch (e) {
                log(`停止引擎失败(ID: ${engine.id}): ${e}`);
            }
        }
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
    console.log("========== 当前配置 ==========");
    console.log("应用版本: " + getAppVersion());
    console.log("设备分辨率：" + config.deviceScreenSize);
    console.log("选择功能: " + config.selectedFunction.text);
    console.log("种植作物: " + config.selectedCrop.text);
    console.log("成熟时间: " + config.matureTime.text);
    console.log("种植树木: " + config.selectedTree.text);
    console.log("商店价格: " + config.shopPrice.text);
    console.log("保留数量：" + config.ReservedQuantity);
    console.log("仓库售卖: " + (config.isCangkuSold ? "是" : "否"));
    console.log("触发阈值：" + config.CangkuSold_triggerNum);
    console.log("目标阈值：" + config.CangkuSold_targetNum);
    console.log("地块查找方法: " + config.landFindMethod);
    console.log("切换账号: " + (config.switchAccount ? "是" : "否"));
    console.log("切换账号方式: " + config.accountMethod);
    console.log("顶号延迟: " + config.pauseTime + "分钟");
    console.log("账号识别方式: " + config.findAccountMethod);
    console.log("土地偏移: (" + config.landOffset.x + ", " + config.landOffset.y + ")");
    console.log("商店偏移: (" + config.shopOffset.x + ", " + config.shopOffset.y + ")");
    console.log("收割横向偏移: " + config.harvestX + "格");
    console.log("收割纵向偏移: " + config.harvestY + "格");
    console.log("收割重复次数: " + config.harvestRepeat + "次");
    console.log("收割操作用时: " + config.harvestTime + "秒");
    console.log("粮仓偏移: (" + config.liangcangOffset.x + ", " + config.liangcangOffset.y + "), 货仓偏移 (" + config.huocangOffset.x + ", " + config.huocangOffset.y + ")");
    console.log("是否升仓: " + "货仓" + (config.shengcang_h ? "是" : "否") + ",粮仓" + (config.shengcang_l ? "是" : "否") + ", 升仓间隔时间: " + config.shengcangTime + "分钟");
    console.log("是否仓库统计: " + (config.isCangkuStatistics ? "是" : "否") + ", 仓库统计间隔时间: " + config.cangkuStatisticsTime + "分钟");
    console.log("推送方式: " + config.serverPlatform.text);
    console.log("token: " + "骗你的,不会把token输出到日志,切勿泄漏个人token!!!");
    console.log("是否使用shell命令重启游戏: " + (config.restartWithShell ? "是" : "否"));
    console.log("浮动按钮: " + (ui.win_switch.checked ? "是" : "否"));
    // console.log("主题颜色: " + config.themeColor.text);config
    console.log("====================");
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
                    sleep(100);
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

                    sleep(100);
                    let newEngine = engines.execScriptFile("./shuadi.js");
                    log("启动刷地引擎，ID: " + newEngine.id);

                })
            }
            break;

        case 1: // 种树
            stopOtherEngines();

            launch("com.supercell.hayday");
            setTimeout(() => { }, 100);
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
                sleep(100);
                let newEngine = engines.execScriptFile("./createNewAccount.js");
                log("启动建号引擎，ID: " + newEngine.id);

            });
            break;

        case 3: // 仅汤姆
            stopOtherEngines();
            threads.start(() => {
                launch("com.supercell.hayday");
                sleep(100);
                let newEngine = engines.execScriptFile("./tom.js");
                log("启动汤姆引擎，ID: " + newEngine.id);

            });
            break;

        case 4: // 物品售卖
            stopOtherEngines();
            threads.start(() => {
                launch("com.supercell.hayday");
                sleep(100);
                let newEngine = engines.execScriptFile("./sell.js");
                log("启动物品售卖引擎，ID: " + newEngine.id);

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
                sleep(100);
                let newEngine = engines.execScriptFile("./shuadi.js");
                log("启动刷地引擎，ID: " + newEngine.id);

            });
            break;

        case 1: // 种树
            stopOtherEngines();
            setTimeout(() => { }, 100);
            threads.start(() => {
                let newEngine = engines.execScriptFile("./zhongshu.js");
                log("启动种树引擎，ID: " + newEngine.id);
            });
            break;

        case 2: // 创新号
            stopOtherEngines();
            threads.start(() => {
                launch("com.supercell.hayday");
                sleep(100);
                let newEngine = engines.execScriptFile("./createNewAccount.js");
                log("启动建号引擎，ID: " + newEngine.id);

            });

        case 3: // 仅汤姆
            stopOtherEngines();
            threads.start(() => {
                launch("com.supercell.hayday");
                sleep(100);
                let newEngine = engines.execScriptFile("./tom.js");
                log("启动汤姆引擎，ID: " + newEngine.id);

            });
            break;

        case 4: // 物品售卖
            stopOtherEngines();
            threads.start(() => {
                launch("com.supercell.hayday");
                sleep(100);
                let newEngine = engines.execScriptFile("./sell.js");
                log("启动物品售卖引擎，ID: " + newEngine.id);

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

    // 绑定土地方法单选框事件
    ui.landFindMethod.setOnCheckedChangeListener(function (radioGroup, isCheckedId) {
        // 获取被选中的单选框
        let selectedRadioButton = radioGroup.findViewById(isCheckedId);
        // 获取被选中的单选框的文字内容
        let selectedText = selectedRadioButton.getText();
        configs.put("landFindMethod", selectedText);
    });

    // 绑定账号识别方式单选框事件
    ui.findAccountMethod.setOnCheckedChangeListener(function (radioGroup, isCheckedId) {
        // 获取被选中的单选框
        let selectedRadioButton = radioGroup.findViewById(isCheckedId);
        // 获取被选中的单选框的文字内容
        let selectedIndex = radioGroup.indexOfChild(selectedRadioButton);
        if (selectedIndex == 0) {
            configs.put("findAccountMethod", "image");
        } else {
            configs.put("findAccountMethod", "ocr");
        }
    });

    // 绑定切换账号方式单选框事件
    ui.accountMethod.setOnCheckedChangeListener(function (radioGroup, isCheckedId) {
        // 获取被选中的单选框
        let selectedRadioButton = radioGroup.findViewById(isCheckedId);
        // 获取被选中的单选框的文字内容
        let selectedIndex = radioGroup.indexOfChild(selectedRadioButton);
        if (selectedIndex == 0) {
            configs.put("accountMethod", "email");
            ui['AccountList'].attr("visibility", "visible");
            ui['SaveAccountList'].attr("visibility", "gone");
        } else {
            configs.put("accountMethod", "save");
            ui['AccountList'].attr("visibility", "gone");
            ui['SaveAccountList'].attr("visibility", "visible");
        }
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


                ui.treeSelectContainer.attr("visibility", "gone");

                ui.addFriendsCard.attr("visibility", "gone");
                // 控制汤姆相关控件
                if (ui.tomSwitch.isChecked()) {
                    ui.tomItemContainer.attr("visibility", "visible");
                } else {
                    ui.tomItemContainer.attr("visibility", "gone");
                }
                ui.sell_itemSoldContainer.attr("visibility", "gone");
            } else if (selectedFunction === "种树") {
                // 隐藏作物选择和汤姆开关，显示树木选择
                ui.cropSelectContainer.attr("visibility", "gone");

                ui.treeSelectContainer.attr("visibility", "visible");

                ui.addFriendsCard.attr("visibility", "gone");
                // 隐藏汤姆相关控件
                ui.tomItemContainer.attr("visibility", "gone");
                ui.sell_itemSoldContainer.attr("visibility", "gone");
            } else if (selectedFunction === "创新号") {
                // 创新号
                ui.cropSelectContainer.attr("visibility", "gone");

                ui.treeSelectContainer.attr("visibility", "gone");

                ui.addFriendsCard.attr("visibility", "visible");
                // 隐藏汤姆相关控件
                ui.tomItemContainer.attr("visibility", "gone");
                ui.sell_itemSoldContainer.attr("visibility", "gone");
            } else if (selectedFunction === "仅汤姆") {
                // 仅汤姆
                ui.cropSelectContainer.attr("visibility", "gone");

                ui.treeSelectContainer.attr("visibility", "gone");

                ui.addFriendsCard.attr("visibility", "gone");
                // 隐藏汤姆相关控件
                ui.tomItemContainer.attr("visibility", "visible");
                ui.sell_itemSoldContainer.attr("visibility", "gone");
            } else if (selectedFunction === "物品售卖") {
                // 物品售卖
                ui.cropSelectContainer.attr("visibility", "gone");

                ui.treeSelectContainer.attr("visibility", "gone");

                ui.addFriendsCard.attr("visibility", "gone");
                // 隐藏汤姆相关控件
                ui.tomItemContainer.attr("visibility", "gone");
                ui.sell_itemSoldContainer.attr("visibility", "visible");
            }



            // 保存选择的功能到配置
            configs.put("selectedFunction", { text: selectedFunction, code: position });
        }
    }))

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

    // 账号开关状态变化监听
    ui.accountSwitch.on("check", (checked) => {
        // 保存修改后的开关状态到配置
        configs.put("switchAccount", checked);
    });

    // 是否升仓开关状态变化监听
    ui.shengcang_h.on("check", (checked) => {
        // 保存修改后的开关状态到配置
        configs.put("shengcang_h", checked);
    });
    ui.shengcang_l.on("check", (checked) => {
        // 保存修改后的开关状态到配置
        configs.put("shengcang_l", checked);
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

    // 清除粉丝开关状态变化监听
    ui.clearFans.on("check", (checked) => {
        // 保存修改后的开关状态到配置
        configs.put("clearFans", checked);
    });

    // 等待货架开关状态变化监听
    ui.waitShelf.on("check", (checked) => {
        // 保存修改后的开关状态到配置
        configs.put("waitShelf", checked);
    });

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

    // 为作物选择添加事件监听器
    ui.cropSelect.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener({
        onItemSelected: function (parent, view, position, id) {
            // 忽略首次加载时的选择事件
            if (isFirstLoad_cropSelect) {
                isFirstLoad_cropSelect = false;
                return; // 直接返回，不执行后续逻辑
            }

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

    // 为树木选择添加事件监听器
    ui.treeSelect.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener({
        onItemSelected: function (parent, view, position, id) {
            const item = parent.getItemAtPosition(position).toString();
            // 保存选择的树木到配置
            configs.put("selectedTree", { text: item, code: position });
        },
        onNothingSelected: function (parent) { }
    }));

    // 为商店售价添加事件监听器
    ui.shopPrice.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener({
        onItemSelected: function (parent, view, position, id) {
            const item = parent.getItemAtPosition(position).toString();
            // 保存选择的商店售价到配置
            configs.put("shopPrice", { text: item, code: position });
        },
        onNothingSelected: function (parent) { }
    }));

    // 为主题颜色添加事件监听器
    ui.themeColor.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener({
        onItemSelected: function (parent, view, position, id) {
            const item = parent.getItemAtPosition(position).toString();

            // 更新颜色
            if (item === "随机颜色") {
                // 如果选择随机颜色，则随机选择一个颜色
                color = colorLibrary[Math.floor(Math.random() * colorLibrary.length)].code;
            } else {
                const selectedIndex = colorNames.indexOf(item) - 1; // 减1是因为"随机颜色"占了第一个位置
                if (selectedIndex >= 0) {
                    color = colorLibrary[selectedIndex].code;
                }
            }

            // 更新商店按钮颜色（如果当前选中的是商店方法）

            updateButtonColors();

            // 保存选择的主题颜色到配置
            configs.put("themeColor", { text: item, code: position });
        },
        onNothingSelected: function (parent) { }
    }));

    // 为顶号延迟添加事件监听器
    ui.pauseTime.addTextChangedListener(new android.text.TextWatcher({
        onTextChanged: function (s, start, before, count) {
            // 保存输入的pauseTime到配置
            configs.put("pauseTime", Number(s));
        }
    }));

    ui.cangkuSoldBtn.on("click", () => {
        showCangkuSoldDialog();
    })

    ui.sell_itemSoldBtn.on("click", () => {
        // 隐藏主界面，显示物品售卖界面
        ui.sell_frame.setVisibility(0); // 0 = VISIBLE
        ui.drawer.setVisibility(8); // 8 = GONE
    })

    // 返回主界面按钮点击事件
    ui.sell_exitButton.click(() => {
        // 隐藏物品售卖界面，显示主界面
        ui.sell_frame.setVisibility(8); // 8 = GONE
        ui.drawer.setVisibility(0); // 0 = VISIBLE
    });

    ui.helpIcon_coordClick.on("click", function () {
        dialogs.build({
            title: "坐标点击帮助",
            content: "\n1. 如何查询屏幕坐标\n " + "（不同设备可能不同，都大差不差）" + "\n\n" +
                "进入设置=>关于手机=>连续点击版本号7次,进入开发者模式" + "\n\n" +
                "进入系统和更新=>开发人员选项=>指针位置" + "\n\n" +
                "2. 当X坐标和Y坐标都为0时不点击,如不使用此功能请将其设置为0",
            positive: "确定"
        }).show();
    });

    ui.helpIcon_restartWithShell.on("click", function () {
        dialogs.build({
            title: "重启游戏帮助",
            content: "需root权限,如设备root,推荐开启\n\n" +
                "开启后则会使用shell命令关闭游戏,不会跳转到应用设置页\n" +
                "跳转到应用设置页可能会出Bug",
            positive: "确定"
        }).show();
    })

    ui.helpIcon_functionSelect.on("click", function () {
        dialogs.build({
            title: "功能选择帮助",
            content: "选择功能右边的下拉菜单是能点的\n\n" +
                "默认是刷地功能,点击刷地可选择其他功能\n\n" +
                "刷地功能:\n" +
                "- 应该不用解释\n\n" +
                "种树功能:\n" +
                "- 先启用浮动按钮,进入游戏后,在浮动按钮点击开始即可运行\n" +
                "- 自动滑动当检测此页面”没有“可种植地块后,自动滑动屏幕,关闭可自行滑动调整\n\n" +
                "创新号功能:\n" +
                "-先新建一个号,确保进入游戏后是在最初的教程界面,点击开始,自动运行到5级\n" +
                "-添加好友,新手教程结束后,根据输入的农场标签,自动添加农场好友\n\n" +
                "仅汤姆:\n" +
                "-先在上方账号信息一栏中选择是否切换账号并且勾选需要刷取的账号\n" +
                "-在等待期间会回到主界面,并不是脚本掉了\n" +
                "当剩余时间小于60秒时,启动游戏\n\n" +
                "物品售卖:\n" +
                "-清除粉丝:进入游戏主页时,先清除粉丝再进行售卖\n" +
                "-等待货架:当售卖时没有剩余空闲货架,且还没有全部售卖完成,会反复检查货架,等待卖出,再进行上架\n" +
                "\n" +
                "\n" +
                "\n" +
                "\n" +
                "\n" +
                "\n" +
                "\n" +
                "\n" +
                "\n",
            positive: "确定"
        }).show();
    })

    ui.screenshotBtn.on("click", () => {
        showScreenshotDialog();
    })

    ui.switchAccountBtn.on("click", () => {
        showSwitchAccountDialog();
    })

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

    // 为账号照片路径输入框添加变化监听
    ui.accountImgPath.addTextChangedListener(new android.text.TextWatcher({
        beforeTextChanged: function (s, start, count, after) { },
        onTextChanged: function (s, start, before, count) {
            // 保存输入的accountImgPath到配置
            configs.put("accountImgPath", s.toString());
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
            ui.eyeIcon.attr("src", "@drawable/ic_visibility_black_48dp");
        } else {
            // 如果是显示模式，则切换为密码模式
            ui.tokenInput.setText(token_storage.get("token", ""));
            ui.tokenInputPlain.attr("visibility", "gone"); // 隐藏普通输入框
            ui.tokenInput.attr("visibility", "visible"); // 显示密码输入框
            ui.eyeIcon.attr("src", "@drawable/ic_visibility_off_black_48dp");
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

    ui.matureTime.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的成熟时间到配置
            configs.put("matureTime", Number(s));
        }
    }));

    // 保留数量监听
    ui.ReservedQuantity.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的保留数量到配置
            configs.put("ReservedQuantity", Number(s));
        }
    }));

    // 触发阈值监听
    ui.CangkuSold_triggerNum.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的触发阈值到配置
            configs.put("CangkuSold_triggerNum", Number(s));
        }
    }));

    // 目标阈值监听
    ui.CangkuSold_targetNum.addTextChangedListener(new android.text.TextWatcher({
        afterTextChanged: function (s) {
            // 保存修改后的目标阈值到配置
            configs.put("CangkuSold_targetNum", Number(s));
            log("目标阈值: " + Number(s));
        }
    }));

    // 是否使用shell命令重启游戏监听
    ui.restartWithShell.on("check", (checked) => {
        // 保存修改后的开关状态到配置
        configs.put("restartWithShell", checked);
    });

    // 为账户列表项添加绑定事件，处理复选框点击
    ui.sell_accountList.on("item_bind", function (itemView, itemHolder) {
        // 绑定账户列表中复选框的点击事件
        itemView.sell_accountList_done.on("check", function (checked) {
            var item = itemHolder.item;
            item.done = checked;
        });
    });

    // 为账户列表项添加点击事件
    ui.sell_accountList.on("item_click", function (item, i, itemView, listView) {
        // 隐藏所有内容块
        for (var j = 1; j <= sell_accountList.length; j++) {
            var contentBlock = ui.findView("sell_contentBlock" + j);
            if (contentBlock) {
                contentBlock.setVisibility(android.view.View.GONE);
            }
        }

        // 显示当前选中的内容块
        var currentContentBlock = ui.findView("sell_contentBlock" + (i + 1));
        if (currentContentBlock) {
            currentContentBlock.setVisibility(android.view.View.VISIBLE);
        }

        // 更新标题文本为当前选中账户的标题
        var pageTitle = ui.findView("sell_pageTitle" + (i + 1));
        if (pageTitle) {
            pageTitle.setText(item.title);
        }
    });

    // 为每个账户的内容块添加"应用到全部"按钮的点击事件
    for (var i = 1; i <= sell_accountList.length; i++) {
        // 使用闭包确保正确的索引值
        (function (index) {
            var applyAllButton = ui.findView("sell_applyAllButton" + index);
            if (applyAllButton) {
                applyAllButton.on("click", function () {
                    applySellPlanToAllAccounts(index);
                });
            }

            // 为每个账户的内容块添加"添加项目"按钮的点击事件（添加到所有账户）
            var addItemButton = ui.findView("sell_addItemButton" + index);
            if (addItemButton) {
                addItemButton.on("click", function () {
                    addNewItemToAllAccounts();
                });
            }

            // 为每个账户的内容块添加"添加好友"按钮的点击事件（添加到所有账户）
            // log(sell_accountList[index - 1])
            // 设置当前账户的售卖价格
            var price = sell_accountList[index - 1].price;
            if (price !== undefined && price !== null) {
                ui.findView("sell_price" + index).setSelection(price);
            } else {
                // 如果价格未定义，则设置为默认值0
                ui.findView("sell_price" + index).setSelection(0);
            }

        })(i);
    }

    // 为每个账户的内容块设置数据源和事件处理
    for (var i = 1; i <= sell_accountList.length; i++) {
        // 确保数据源是一个有效的数组对象
        var dataSource = allCangkuSoldLists["sell_CangkuSoldList" + i];
        if (dataSource && Array.isArray(dataSource) && ui["sell_CangkuSoldList" + i]) {
            // 设置数据源
            ui["sell_CangkuSoldList" + i].setDataSource(dataSource);
        } else {
            // 如果数据源无效，提供一个默认的空数组
            var defaultDataSource = createDefaultItemList();
            allCangkuSoldLists["sell_CangkuSoldList" + i] = defaultDataSource;
            if (ui["sell_CangkuSoldList" + i]) {
                ui["sell_CangkuSoldList" + i].setDataSource(defaultDataSource);
            }
        }

        // 使用闭包确保正确的索引值
        (function (index) {
            ui["sell_CangkuSoldList" + index].on("item_bind", function (itemView, itemHolder) {
                // 绑定输入框文本变化事件
                itemView.sell_input.addTextChangedListener(new android.text.TextWatcher({
                    afterTextChanged: function (s) {
                        var item = itemHolder.item;
                        item.sellNum = parseInt(s.toString()) || 0;
                    },
                    beforeTextChanged: function (s, start, count, after) { },
                    onTextChanged: function (s, start, before, count) { }
                }));

                itemView.sell_sellAllButton.on("click", function () {
                    // 全部售卖
                    itemView.sell_input.setText("-1");
                    // 更新数据源
                    var item = itemHolder.item;
                    item.sellNum = -1;
                });

                // 绑定复选框点击事件
                itemView.sell_done.on("check", function (checked) {
                    var item = itemHolder.item;
                    item.done = checked;
                });

                // 绑定项目点击事件，用于修改项目名称
                itemView.setOnClickListener(new android.view.View.OnClickListener({
                    onClick: function (view) {
                        var item = itemHolder.item;
                        // 弹出输入框让用户修改项目名称
                        dialogs.prompt("修改项目名称", item.title, function (newTitle) {
                            if (newTitle && newTitle != item.title) {
                                // 查找所有具有相同标题的项目
                                var matchingItems = findAllMatchingItems(item.title);

                                // 更新所有匹配项目的标题
                                for (var i = 0; i < matchingItems.length; i++) {
                                    var match = matchingItems[i];
                                    match.item.title = newTitle;

                                    // 更新对应列表的UI
                                    if (ui["sell_CangkuSoldList" + match.listIndex]) {
                                        ui["sell_CangkuSoldList" + match.listIndex].setDataSource(match.dataSource);
                                    }
                                }

                                log("已同步修改所有账户中的项目名称: " + newTitle);
                            }
                        });
                    }
                }));

                // 绑定项目长按事件，用于删除项目
                itemView.setOnLongClickListener(new android.view.View.OnLongClickListener({
                    onLongClick: function (view) {
                        var item = itemHolder.item;
                        // 弹出确认对话框
                        dialogs.confirm("删除项目", "确定要删除项目 \"" + item.title + "\" 吗？这将从所有账户中删除该项目。", function (confirmation) {
                            if (confirmation) {
                                // 查找所有具有相同标题的项目
                                var matchingItems = findAllMatchingItems(item.title);

                                // 从所有数据源中移除该项目
                                for (var i = 0; i < matchingItems.length; i++) {
                                    var match = matchingItems[i];
                                    match.dataSource.splice(match.itemIndex, 1);

                                    // 更新对应列表的UI
                                    if (ui["sell_CangkuSoldList" + match.listIndex]) {
                                        ui["sell_CangkuSoldList" + match.listIndex].setDataSource(match.dataSource);
                                    }
                                }

                                log("已从所有账户中删除项目: " + item.title);
                            }
                        });
                        return true; // 表示消费了这个长按事件
                    }
                }));
            });
        })(i);

    }

    // 为导入按钮添加点击事件
    ui.sell_improtAccountListButton.on("click", function () {
        importAccountList();
    });

    // 为帮助图标添加点击事件
    ui.helpIcon_sell.on("click", function () {
        dialogs.build({
            title: "仓库售卖帮助",
            content: "在这里您可以设置仓库自动售卖功能：\n\n" +
                "初次使用时点击导入按钮,即可导入邮箱账号。存档账号暂不支持(以后看心情,大概率不会做)\n\n" +
                "左侧一列选择账号,选择'当前'即不切换账号,执行现在登录的账号\n\n" +
                "应用到全部: 将本账号的售卖配置同步到其他所有账号\n\n" +
                "全部: 点击后售卖数量为-1,即为售卖全部该物品\n\n" +
                "添加项目: 在右侧售卖物品一栏添加售卖的物品\n\n" +
                "单击项目修改名称,长按项目删除,点击全部按钮即售卖全部\n\n" +
                "加好友: 输入农场标签,即可自动添加好友\n\n" +
                "商店售价: 点击即可选择售卖的价格(最低|平价|最高)\n\n" +
                "保存按钮在右上角\n\n" +
                "修改后一定要保存!\n" + "修改后一定要保存!\n" + "修改后一定要保存!\n"

            ,
            positive: "确定"
        }).show();
    });

    // 为保存图标添加点击事件
    ui.saveIcon_sell.on("click", function () {
        // 收集所有账户的信息
        var allAccountInfo = [];

        // 遍历所有账户
        for (var i = 0; i < sell_accountList.length; i++) {
            var accountIndex = i + 1;
            var accountTitle = sell_accountList[i].title;
            var accountDone = sell_accountList[i].done;
            var accountAddFriend = ui.findView("sell_addFriendInput" + accountIndex).getText().toString().trim() || "";
            var accountPrice = ui.findView("sell_price" + accountIndex).getSelectedItemPosition();

            // 获取当前账户的售卖列表数据源
            var sellListDataSource = allCangkuSoldLists["sell_CangkuSoldList" + accountIndex];

            // 构建当前账户的售卖计划
            var sellPlan = [];
            if (sellListDataSource) {
                for (var j = 0; j < sellListDataSource.length; j++) {
                    var item = sellListDataSource[j];
                    sellPlan.push({
                        item: item.title,
                        sellNum: item.sellNum !== undefined ? item.sellNum : 0,
                        done: item.done
                    });
                }
            }

            // 添加到总信息中
            allAccountInfo.push({
                account: accountTitle,
                addFriend: accountAddFriend,
                done: accountDone,
                sellPlan: sellPlan,
                price: accountPrice
            });
        }


        let data = allAccountInfo;
        let output = []; // 用于存储所有输出内容

        // 遍历所有账户
        for (let account of data) {
            if (!account.done) continue;

            output.push("账户: " + account.account);
            output.push("售卖计划:");

            // 遍历销售计划
            for (let plan of account.sellPlan) {
                if (!plan.done) continue;
                if (plan.sellNum !== 0) { // 只显示非零数量的项目
                    sellNum = plan.sellNum == -1 ? "全部" : plan.sellNum;
                    output.push(`${plan.item}: ${sellNum}`);
                }
            }
            price = ["最低", "平价", "最高"];
            output.push("价格: " + price[account.price]);
            if (account.addFriend !== "") {
                output.push("添加好友: " + account.addFriend);
            }
            output.push("--------------------");
            if (account.account == "当前" && account.done == true) {
                break;
            }
        }

        var sell_dialog = dialogs.build({
            title: "确认售卖计划",
            content: output.join('\n'),
            positive: "对的对的👌",
            neutral: "不对不对🤔",
            cancelable: true
        });
        sell_dialog.on("positive", function () {
            configs.put("sell_accountList", allAccountInfo);
            toast("已保存");
        });
        sell_dialog.show();


        // 输出格式化的信息到日志
        // log(JSON.stringify(allAccountInfo, null, 2));

    });

    // 为设置图标添加点击事件
    ui.settingIcon_sell.on("click", function () {
        // 弹出选项对话框
        dialogs.select("设置", ["售卖全部", "售卖全部    锯斧", "售卖全部    炸矿", "售卖全部    货仓", "售卖全部    粮仓", "售卖全部    扩地", "售卖平均    货仓", "售卖平均    粮仓", "售卖平均    扩地", "导入", "勾选全部账号", "清空选择", "恢复默认"])
            .then(function (selectedIndex) {//0   1                 2                   3               4                5                   6               7                   8         9         10          11          12
                if (selectedIndex >= 0) {
                    // 可以在这里添加更多处理逻辑
                    switch (selectedIndex) {
                        case 0:
                            // 售卖全部：将所有账号列表的所有物品售卖数量设置为-1并勾选
                            for (var i = 1; i <= sell_accountList.length; i++) {
                                var accountItemList = allCangkuSoldLists["sell_CangkuSoldList" + i];
                                if (accountItemList && Array.isArray(accountItemList)) {
                                    // 遍历当前账户的所有物品，恢复到默认状态
                                    for (var j = 0; j < accountItemList.length; j++) {
                                        accountItemList[j].sellNum = -1;
                                        accountItemList[j].done = true;
                                    }

                                    // 更新UI
                                    if (ui["sell_CangkuSoldList" + i]) {
                                        ui["sell_CangkuSoldList" + i].setDataSource(accountItemList);
                                    }
                                }
                            }
                            // 勾选全部账号：将所有账号都设置为选中状态
                            for (var i = 0; i < sell_accountList.length; i++) {
                                sell_accountList[i].done = true;
                            }
                            ui.sell_accountList.setDataSource(sell_accountList);
                            toastLog("已设置");
                            break;
                        case 1:
                            // 售卖全部锯斧：将所有账号列表的斧头和木锯售卖数量设置为-1并勾选
                            setItemsForAllAccounts("锯斧", -1, true);
                            toastLog("已设置");
                            break;
                        case 2:
                            // 售卖全部炸矿：将所有账号列表的炸药、炸药桶、铁铲、十字镐售卖数量设置为-1并勾选
                            setItemsForAllAccounts("炸矿", -1, true);
                            toastLog("已设置");
                            break;
                        case 3:
                            // 售卖全部货仓：将所有账号列表的货仓相关物品售卖数量设置为-1并勾选
                            setItemsForAllAccounts("货仓", -1, true);
                            toastLog("已设置");
                            break;
                        case 4:
                            // 售卖全部粮仓：将所有账号列表的粮仓相关物品售卖数量设置为-1并勾选
                            setItemsForAllAccounts("粮仓", -1, true);
                            toastLog("已设置");
                            break;
                        case 5:
                            // 售卖全部扩地：将所有账号列表的扩地相关物品售卖数量设置为-1并勾选
                            setItemsForAllAccounts("扩地", -1, true);
                            toastLog("已设置");
                            break;
                        case 6:
                            // 售卖平均货仓：将所有账号列表的货仓相关物品售卖数量设置为29并勾选
                            setItemsForAllAccounts("螺栓", 29, true);
                            setItemsForAllAccounts("木板", 30, true);
                            setItemsForAllAccounts("胶带", 30, true);
                            toastLog("已设置");
                            break;
                        case 7:
                            // 售卖平均粮仓：将所有账号列表的粮仓相关物品售卖数量设置为30并勾选
                            setItemsForAllAccounts("盒钉", 29, true);
                            setItemsForAllAccounts("螺钉", 30, true);
                            setItemsForAllAccounts("镶板", 30, true);
                            toastLog("已设置");
                            break;
                        case 8:
                            // 售卖平均扩地：将所有账号列表的扩地相关物品售卖数量设置为30并勾选
                            setItemsForAllAccounts("土地契约", 29, true);
                            setItemsForAllAccounts("木槌", 30, true);
                            setItemsForAllAccounts("标桩", 30, true);
                            toastLog("已设置");
                            break;
                        case 9:
                            importAccountList()
                            toastLog("导入");
                            break;
                        case 10:
                            // 勾选全部账号：将所有账号都设置为选中状态
                            for (var i = 0; i < sell_accountList.length; i++) {
                                sell_accountList[i].done = true;
                            }
                            ui.sell_accountList.setDataSource(sell_accountList);
                            toastLog("已勾选所有账号");
                            break;
                        case 11:
                            // 清空选择：将所有账号列表的所有物品的勾选状态取消
                            for (var i = 1; i <= sell_accountList.length; i++) {
                                var accountItemList = allCangkuSoldLists["sell_CangkuSoldList" + i];
                                if (accountItemList && Array.isArray(accountItemList)) {
                                    // 遍历当前账户的所有物品，取消勾选状态
                                    for (var j = 0; j < accountItemList.length; j++) {
                                        accountItemList[j].done = false;
                                    }

                                    // 更新UI
                                    if (ui["sell_CangkuSoldList" + i]) {
                                        ui["sell_CangkuSoldList" + i].setDataSource(accountItemList);
                                    }
                                }
                            }
                            // 取消勾选全部账号：将所有账号都设置为未选中状态
                            for (var i = 0; i < sell_accountList.length; i++) {
                                sell_accountList[i].done = false;
                            }
                            ui.sell_accountList.setDataSource(sell_accountList);
                            toastLog("已清空所有账号的物品选择");
                            break;
                        case 12:
                            // 全部删除：将所有账号列表的所有物品恢复到默认状态（售卖数量为0，未勾选）
                            for (var i = 1; i <= sell_accountList.length; i++) {
                                var accountItemList = allCangkuSoldLists["sell_CangkuSoldList" + i];
                                if (accountItemList && Array.isArray(accountItemList)) {
                                    // 遍历当前账户的所有物品，恢复到默认状态
                                    for (var j = 0; j < accountItemList.length; j++) {
                                        accountItemList[j].sellNum = 0;
                                        accountItemList[j].done = false;
                                    }

                                    // 更新UI
                                    if (ui["sell_CangkuSoldList" + i]) {
                                        ui["sell_CangkuSoldList" + i].setDataSource(accountItemList);
                                    }
                                }
                            }
                            // 取消勾选全部账号：将所有账号都设置为未选中状态
                            for (var i = 0; i < sell_accountList.length; i++) {
                                sell_accountList[i].done = false;
                            }
                            ui.sell_accountList.setDataSource(sell_accountList);
                            toastLog("已将所有账号的物品恢复到默认状态");
                            break;
                    }
                } else {

                }
            });
    });

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


