// 导入module模块
let module;
try {
    module = require("./module.js");
    if (!module) {
        throw new Error("模块导入结果为空");
    }
    console.log("模块导入成功");
} catch (error) {
    console.error("模块导入失败:", error);
    // 尝试重新导入
    try {
        // 清除缓存后重试
        delete require.cache[require.resolve("./module.js")];
        module = require("./module.js");
        if (!module) {
            throw new Error("重新导入模块结果为空");
        }
        console.log("模块重新导入成功");
    } catch (retryError) {
        console.error("重新导入模块失败:", retryError);
        // 可以在这里添加更多错误处理或退出程序
        toast("模块导入失败，请检查module.js文件");
        exit();
    }
}

let randomOffset = 5; // 随机偏移量
function ran() {
    return Math.random() * (2 * randomOffset) - randomOffset;
}




let config = module.config;

const color_lib = require("./color_lib.js");
const shopItemColor = color_lib.shopItemColor;
const shopSellItemColor = color_lib.shopSellItemColor;
const allItemColor = color_lib.allItemColor;

照片文件夹 = config.coin_picDirPath

let storageType = config.storageUpgradeMethod === "粮仓" ? "lc" : "hc";

/**
 * 仓库升级统计
 * @param {string} type - 仓库类型，"lc"或"hc"
 * @returns {Array} - 包含仓库容量和货仓信息的对象数组,example: [ '100/200', '3/7', '7/7', '5/7' ]
 */
function storageUpgradeStatistics(type) {
    log("============仓库升级统计============");
    let result
    sleep(500);
    module.find_close()
    let isFindShop = module.findshop(true);
    if (!isFindShop) {
        log("未找到商店");
        return;
    }
    module.huadong_adjust([60, 50], [330, 310]);
    sleep(300);
    isFindShop = module.findshop(true);

    if (type == "lc") {
        console.log("点击粮仓");
        module.showTip("点击粮仓");
        module.click_cangku("lc", isFindShop);
        sleep(500);

        if (module.click_waitFor(null, null, allItemColor["粮仓界面"], null, 0.8, 200)) {  //判断是否进入粮仓  左侧搜索按钮,棕色边框,右上叉号
            log("成功进入粮仓");
            module.showTip("成功进入粮仓");
            sleep(200);
            click(700 + ran(), 610 + ran());
            sleep(100);
            // 识别仓库容量和货仓信息
            module.showTip("识别中...");
            result = module.recognize_ckInfo()
            log(result)
        }
        else {
            log("进入粮仓失败");
            module.showTip("进入粮仓失败");
        }

    }
    else if (type == "hc") {
        console.log("点击货仓");
        module.showTip("点击货仓");
        module.click_cangku("hc", isFindShop);
        sleep(500);

        if (module.click_waitFor(null, null, allItemColor["货仓界面"], null, 0.8, 200)) {  //判断是否进入货仓  左侧搜索按钮,棕色边框,右上叉号
            log("成功进入货仓");
            module.showTip("成功进入货仓");
            sleep(200);
            click(700 + ran(), 610 + ran());
            sleep(100);
            // 识别仓库容量和货仓信息
            module.showTip("识别中...");
            result = module.recognize_ckInfo()
            log(result)
        }
        else {
            log("进入货仓失败");
            module.showTip("进入货仓失败");
        }
    }

    return result

}

/**
 * 转换仓库升级统计数据为分配格式
 * @param {Array} rawData - 包含仓库容量和货仓信息的对象数组 [ { '数据': [ '100/200', '3/7', '8/7', '5/7' ], '账号': '测试' },
  { '数据': [ '160/200', '5/7', '1/9', '8/7' ], '账号': '23123' } ]
 * @returns {Array} - 包含仓库升级统计数据的对象数组 [ { name: '测试',
    storage: 200,
    remainingCapacity: 100,
    need: { A: 4, B: 0, C: 2 },
    surplus: { A: 0, B: 1, C: 0 } },
  { name: '23123',
    storage: 200,
    remainingCapacity: 40,
    need: { A: 2, B: 8, C: 0 },
    surplus: { A: 0, B: 0, C: 1 } } ]
 */
function convertToAllocationFormat(rawData, storageType) {
    return rawData.map(accountData => {
        // 处理仓库容量
        let capacityParts = accountData["数据"][0].split('/');
        let total = parseInt(capacityParts[1]);
        let have = parseInt(capacityParts[0]);
        let remainingCapacity = total - have;

        // 处理三种物品
        let items = storageType === "lc" ? ['盒钉', '螺钉', '镶板'] : ['螺栓', '木板', '胶带'];
        let need = {};
        let surplus = {};

        for (let i = 0; i < items.length; i++) {
            let itemParts = accountData["数据"][i + 1].split('/');
            let current = parseInt(itemParts[0]);
            let max = parseInt(itemParts[1]);
            let diff = max - current;

            if (diff > 0) {
                need[items[i]] = diff;
                surplus[items[i]] = 0;
            } else {
                need[items[i]] = 0;
                surplus[items[i]] = -diff;
            }
        }

        return {
            name: accountData["账号"],
            storage: total,
            remainingCapacity: remainingCapacity,
            need: need,
            surplus: surplus
        };
    });
}


/**
 * 材料分配函数
 * 传入格式示例:
 * [{
    name: "账号1",
    storage: 100,
    remainingCapacity: 100,
    need: { A: 30, B: 0, C: 10 },
    surplus: { A: 0, B: 50, C: 0 }
  },];
 * @param {Array} accounts - 账号数组，每个账号包含name、storage、remainingCapacity、need、surplus
 * @returns {Object} 分配结果，包含账号分配结果和整体统计信息
 * 
 * {
  "账号分配结果": [
    {
      "账号名称": "账号D",
      "仓库容量": 10,
      "是否可升级": true,
      "获得材料总量": 0,
      "接收详情": [],
      "给出详情": [
        {
          "给账号": "账号C",
          "给出材料": "C",
          "数量": 30
        }
      ]
    },
    ],
    总体统计信息: {
        总交易次数: 0,
        总交易金额: 0,
        总交易材料数量: 0
    }
}
 * 
 * 转移逻辑：
 * 1. 复制原始数据，添加剩余容量字段
 * 2. 排序账号：按仓库容量从小到大，仓库相同则按缺量总和从小到大
 * 3. 计算所有账号的材料总余量
 * 4. 第一轮处理：先处理容量足够的账号
 *    a. 按材料顺序获取
 *    b. 优先从剩余容量最小的账号获取材料
 *    c. 转移材料，更新剩余容量
 * 5. 第二轮处理：处理之前因为容量不够被标记的账号
 *    a. 检查是否可以通过给出多余材料来腾出空间
 *    b. 先给出多余的材料，腾出足够的空间
 *    c. 然后尝试获取所需材料进行升级
 * 6. 生成分配结果和统计信息
 */
function allocateMaterials(accounts) {
    // 复制原始数据，添加剩余容量字段
    var accountsCopy = [];

    // 收集所有材料类型
    var materialTypes = new Set();

    for (var i = 0; i < accounts.length; i++) {
        var account = accounts[i];

        // 收集材料类型
        if (account.need) {
            for (var material in account.need) {
                materialTypes.add(material);
            }
        }
        if (account.surplus) {
            for (var material in account.surplus) {
                materialTypes.add(material);
            }
        }

        accountsCopy.push({
            name: account.name,
            storage: account.storage,
            remainingCapacity: account.remainingCapacity !== undefined ? account.remainingCapacity : (account.storage || 0),
            need: account.need || {},
            surplus: account.surplus || {}
        });
    }

    // 将材料类型转换为数组
    var materials = Array.from(materialTypes);

    // 计算缺量总和
    function calculateNeedSum(need) {
        var sum = 0;
        for (var material in need) {
            sum += need[material] || 0;
        }
        return sum;
    }

    // 保存原始顺序索引
    for (var i = 0; i < accountsCopy.length; i++) {
        accountsCopy[i].originalIndex = i;
    }

    // 排序账号：按仓库容量从小到大，仓库相同则按缺量总和从小到大
    accountsCopy.sort(function (a, b) {
        if (a.storage !== b.storage) {
            return a.storage - b.storage;
        }
        return calculateNeedSum(a.need) - calculateNeedSum(b.need);
    });

    // 计算所有账号的材料总余量（在循环外计算）
    var totalSurplusAll = {};
    for (var t = 0; t < materials.length; t++) {
        var material = materials[t];
        totalSurplusAll[material] = 0;
        for (var a = 0; a < accountsCopy.length; a++) {
            totalSurplusAll[material] += accountsCopy[a].surplus[material] || 0;
        }
    }

    // 初始化所有账号的结果对象
    var resultMap = {};
    for (var r = 0; r < accountsCopy.length; r++) {
        resultMap[accountsCopy[r].name] = {
            账号名称: accountsCopy[r].name,
            仓库容量: accountsCopy[r].storage,
            是否可升级: false,
            获得材料总量: 0,
            接收详情: [],
            给出详情: []
        };
    }

    // 复制一份用于处理
    var processingAccounts = [];
    var remainingCapacityCopy = [];
    for (var n = 0; n < accountsCopy.length; n++) {
        var account = accountsCopy[n];
        var processingAccount = {
            name: account.name
        };
        for (var m = 0; m < materials.length; m++) {
            var material = materials[m];
            processingAccount[material] = account.surplus[material] || 0;
        }
        processingAccounts.push(processingAccount);
        remainingCapacityCopy.push(account.remainingCapacity);
    }

    var totalTransactions = 0;
    var pendingAccounts = [];

    // 第一轮处理，先处理容量足够的账号
    for (var k = 0; k < accountsCopy.length; k++) {
        var currentAccount = accountsCopy[k];
        var currentResult = resultMap[currentAccount.name];

        var needSum = calculateNeedSum(currentAccount.need);

        // 检查是否可以升级
        if (needSum > 80) {
            pendingAccounts.push({
                index: k,
                reason: 'needSum'
            });
            continue;
        }

        // 检查剩余容量是否足够
        if (needSum > remainingCapacityCopy[k]) {
            pendingAccounts.push({
                index: k,
                reason: 'capacity'
            });
            continue;
        }

        var receivedTotal = 0;

        // 复制当前账号的need，用于计算
        var currentNeed = {};
        for (var material in currentAccount.need) {
            currentNeed[material] = currentAccount.need[material] || 0;
        }

        // 复制处理账号数据
        var tempProcessing = [];
        for (var tp = 0; tp < processingAccounts.length; tp++) {
            var tempAccount = {};
            for (var m = 0; m < materials.length; m++) {
                var material = materials[m];
                tempAccount[material] = processingAccounts[tp][material] || 0;
            }
            tempAccount.name = processingAccounts[tp].name;
            tempProcessing.push(tempAccount);
        }

        var tempRemaining = [];
        for (var tr = 0; tr < remainingCapacityCopy.length; tr++) {
            tempRemaining.push(remainingCapacityCopy[tr]);
        }

        var tempReceiveDetails = [];

        // 按材料顺序获取材料
        for (var mIdx = 0; mIdx < materials.length; mIdx++) {
            var material = materials[mIdx];
            var needed = currentNeed[material] || 0;

            if (needed <= 0) continue;

            // 使用预计算的总余量减去当前账号的余量，得到其他账号的总余量
            var totalSurplus = totalSurplusAll[material] - (currentAccount.surplus[material] || 0);

            // 如果总余量不够，跳过该材料
            if (totalSurplus < needed) {
                continue;
            }

            // 如果总余量足够，选择剩余容量最小的账号来获取
            while (currentNeed[material] > 0) {
                var bestDonorIdx = -1;
                var minRemaining = Infinity;

                // 找剩余容量最小的账号
                for (var donorIdx = 0; donorIdx < tempProcessing.length; donorIdx++) {
                    if (donorIdx === k) continue;

                    var available = tempProcessing[donorIdx][material] || 0;
                    if (available <= 0) continue;

                    var remaining = tempRemaining[donorIdx];
                    if (remaining < minRemaining) {
                        minRemaining = remaining;
                        bestDonorIdx = donorIdx;
                    }
                }

                if (bestDonorIdx === -1) break;

                var donor = tempProcessing[bestDonorIdx];
                var available = donor[material] || 0;
                var transferAmount = Math.min(needed, available, 80 - receivedTotal, tempRemaining[k]);

                if (transferAmount <= 0) break;

                // 转移材料
                currentNeed[material] -= transferAmount;
                donor[material] -= transferAmount;
                receivedTotal += transferAmount;
                tempRemaining[k] -= transferAmount;
                tempRemaining[bestDonorIdx] += transferAmount;

                // 记录临时接收详情
                tempReceiveDetails.push({
                    from: donor.name,
                    material: material,
                    amount: transferAmount
                });

                // 更新需要的数量
                needed = currentNeed[material];
            }
        }

        // 检查是否满足所有需求
        var allMet = true;
        for (var material in currentNeed) {
            if (currentNeed[material] > 0) {
                allMet = false;
                break;
            }
        }

        if (allMet) {
            // 更新实际数据
            for (var up = 0; up < tempProcessing.length; up++) {
                for (var m = 0; m < materials.length; m++) {
                    var material = materials[m];
                    processingAccounts[up][material] = tempProcessing[up][material] || 0;
                }
            }
            for (var ur = 0; ur < tempRemaining.length; ur++) {
                remainingCapacityCopy[ur] = tempRemaining[ur];
            }

            // 更新结果
            currentResult.是否可升级 = true;
            currentResult.获得材料总量 = receivedTotal;

            for (var trd = 0; trd < tempReceiveDetails.length; trd++) {
                var detail = tempReceiveDetails[trd];

                currentResult.接收详情.push({
                    从账号: detail.from,
                    接收材料: detail.material,
                    数量: detail.amount
                });

                var donorResult = resultMap[detail.from];
                donorResult.给出详情.push({
                    给账号: currentAccount.name,
                    给出材料: detail.material,
                    数量: detail.amount
                });

                totalTransactions++;
                totalSurplusAll[detail.material] -= detail.amount;
            }
        }
    }

    // 第二轮处理，处理之前因为容量不够被标记的账号
    for (var p = 0; p < pendingAccounts.length; p++) {
        var pending = pendingAccounts[p];
        var k = pending.index;
        var currentAccount = accountsCopy[k];
        var currentResult = resultMap[currentAccount.name];

        if (currentResult.是否可升级) continue;

        var needSum = calculateNeedSum(currentAccount.need);

        if (needSum > 80) continue;

        // 检查是否可以通过给出多余材料来腾出空间
        var surplusSum = 0;
        for (var material in currentAccount.surplus) {
            surplusSum += currentAccount.surplus[material] || 0;
        }
        var requiredCapacity = needSum;
        var availableCapacity = remainingCapacityCopy[k] + surplusSum;

        if (requiredCapacity > availableCapacity) continue;

        var receivedTotal = 0;

        // 复制当前账号的need，用于计算
        var currentNeed = {};
        for (var material in currentAccount.need) {
            currentNeed[material] = currentAccount.need[material] || 0;
        }

        // 复制处理账号数据
        var tempProcessing = [];
        for (var tp = 0; tp < processingAccounts.length; tp++) {
            var tempAccount = {};
            for (var m = 0; m < materials.length; m++) {
                var material = materials[m];
                tempAccount[material] = processingAccounts[tp][material] || 0;
            }
            tempAccount.name = processingAccounts[tp].name;
            tempProcessing.push(tempAccount);
        }

        var tempRemaining = [];
        for (var tr = 0; tr < remainingCapacityCopy.length; tr++) {
            tempRemaining.push(remainingCapacityCopy[tr]);
        }

        var tempReceiveDetails = [];
        var tempGiveDetails = [];

        // 先给出多余的材料来腾出空间
        for (var mIdx = 0; mIdx < materials.length; mIdx++) {
            var material = materials[mIdx];
            var surplus = currentAccount.surplus[material] || 0;

            if (surplus <= 0) continue;

            // 计算需要腾出的空间
            var neededSpace = needSum - tempRemaining[k];
            if (neededSpace <= 0) break;

            // 可以给出的数量
            var giveAmount = Math.min(surplus, neededSpace);
            if (giveAmount <= 0) continue;

            // 找到需要该材料的账号
            var bestReceiverIdx = -1;
            var maxNeed = 0;

            for (var receiverIdx = 0; receiverIdx < tempProcessing.length; receiverIdx++) {
                if (receiverIdx === k) continue;

                var receiverNeed = accountsCopy[receiverIdx].need[material] || 0;
                if (receiverNeed > maxNeed) {
                    maxNeed = receiverNeed;
                    bestReceiverIdx = receiverIdx;
                }
            }

            if (bestReceiverIdx === -1) continue;

            var receiver = tempProcessing[bestReceiverIdx];
            var receiveNeed = accountsCopy[bestReceiverIdx].need[material] || 0;
            var receiveAmount = Math.min(giveAmount, receiveNeed, tempRemaining[bestReceiverIdx]);

            if (receiveAmount <= 0) continue;

            // 转移材料
            tempProcessing[k][material] -= receiveAmount;
            receiver[material] += receiveAmount;
            tempRemaining[k] += receiveAmount;
            tempRemaining[bestReceiverIdx] -= receiveAmount;

            // 记录临时给出详情
            tempGiveDetails.push({
                to: receiver.name,
                material: material,
                amount: receiveAmount
            });
        }

        // 现在尝试获取需要的材料
        for (var mIdx = 0; mIdx < materials.length; mIdx++) {
            var material = materials[mIdx];
            var needed = currentNeed[material] || 0;

            if (needed <= 0) continue;

            // 使用预计算的总余量减去当前账号的余量，得到其他账号的总余量
            var totalSurplus = totalSurplusAll[material] - (currentAccount.surplus[material] || 0);

            // 如果总余量不够，跳过该材料
            if (totalSurplus < needed) {
                continue;
            }

            // 如果总余量足够，选择剩余容量最小的账号来获取
            while (currentNeed[material] > 0) {
                var bestDonorIdx = -1;
                var minRemaining = Infinity;

                // 找剩余容量最小的账号
                for (var donorIdx = 0; donorIdx < tempProcessing.length; donorIdx++) {
                    if (donorIdx === k) continue;

                    var available = tempProcessing[donorIdx][material] || 0;
                    if (available <= 0) continue;

                    var remaining = tempRemaining[donorIdx];
                    if (remaining < minRemaining) {
                        minRemaining = remaining;
                        bestDonorIdx = donorIdx;
                    }
                }

                if (bestDonorIdx === -1) break;

                var donor = tempProcessing[bestDonorIdx];
                var available = donor[material] || 0;
                var transferAmount = Math.min(needed, available, 80 - receivedTotal, tempRemaining[k]);

                if (transferAmount <= 0) break;

                // 转移材料
                currentNeed[material] -= transferAmount;
                donor[material] -= transferAmount;
                receivedTotal += transferAmount;
                tempRemaining[k] -= transferAmount;
                tempRemaining[bestDonorIdx] += transferAmount;

                // 记录临时接收详情
                tempReceiveDetails.push({
                    from: donor.name,
                    material: material,
                    amount: transferAmount
                });

                // 更新需要的数量
                needed = currentNeed[material];
            }
        }

        // 检查是否满足所有需求
        var allMet = true;
        for (var material in currentNeed) {
            if (currentNeed[material] > 0) {
                allMet = false;
                break;
            }
        }

        if (allMet) {
            // 更新实际数据
            for (var up = 0; up < tempProcessing.length; up++) {
                for (var m = 0; m < materials.length; m++) {
                    var material = materials[m];
                    processingAccounts[up][material] = tempProcessing[up][material] || 0;
                }
            }
            for (var ur = 0; ur < tempRemaining.length; ur++) {
                remainingCapacityCopy[ur] = tempRemaining[ur];
            }

            // 更新结果
            currentResult.是否可升级 = true;
            currentResult.获得材料总量 = receivedTotal;

            for (var trd = 0; trd < tempReceiveDetails.length; trd++) {
                var detail = tempReceiveDetails[trd];

                currentResult.接收详情.push({
                    从账号: detail.from,
                    接收材料: detail.material,
                    数量: detail.amount
                });

                var donorResult = resultMap[detail.from];
                donorResult.给出详情.push({
                    给账号: currentAccount.name,
                    给出材料: detail.material,
                    数量: detail.amount
                });

                totalTransactions++;
                totalSurplusAll[detail.material] -= detail.amount;
            }

            for (var gtrd = 0; gtrd < tempGiveDetails.length; gtrd++) {
                var detail = tempGiveDetails[gtrd];

                currentResult.给出详情.push({
                    给账号: detail.to,
                    给出材料: detail.material,
                    数量: detail.amount
                });

                var receiverResult = resultMap[detail.to];
                receiverResult.接收详情.push({
                    从账号: currentAccount.name,
                    接收材料: detail.material,
                    数量: detail.amount
                });

                totalTransactions++;
                totalSurplusAll[detail.material] += detail.amount;
            }
        }
    }

    // 创建按交易顺序的结果数组（允许重复账号）
    var result = [];
    var upgradeCount = 0;

    // 第一轮处理结果
    for (var k = 0; k < accountsCopy.length; k++) {
        var accountName = accountsCopy[k].name;
        var accountResult = resultMap[accountName];
        if (accountResult.是否可升级 && accountResult.获得材料总量 > 0) {
            result.push(JSON.parse(JSON.stringify(accountResult)));
            upgradeCount++;
        }
    }

    // 第二轮处理结果
    for (var p = 0; p < pendingAccounts.length; p++) {
        var pending = pendingAccounts[p];
        var k = pending.index;
        var accountName = accountsCopy[k].name;
        var accountResult = resultMap[accountName];
        if (accountResult.是否可升级 && accountResult.获得材料总量 > 0) {
            result.push(JSON.parse(JSON.stringify(accountResult)));
        }
    }

    // 合并相同账号相同材料的接收详情
    function mergeReceiveDetails(result) {
        var mergedResult = [];
        var accountMap = {};

        for (var i = 0; i < result.length; i++) {
            var account = result[i];
            var key = account.账号名称;

            if (!accountMap[key]) {
                accountMap[key] = JSON.parse(JSON.stringify(account));
                accountMap[key].接收详情 = [];
                accountMap[key].给出详情 = [];
            }

            // 合并接收详情
            for (var j = 0; j < account.接收详情.length; j++) {
                var detail = account.接收详情[j];
                var found = false;

                for (var k = 0; k < accountMap[key].接收详情.length; k++) {
                    var mergedDetail = accountMap[key].接收详情[k];
                    if (mergedDetail.从账号 === detail.从账号 && mergedDetail.接收材料 === detail.接收材料) {
                        mergedDetail.数量 += detail.数量;
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    accountMap[key].接收详情.push(JSON.parse(JSON.stringify(detail)));
                }
            }

            // 合并给出详情
            for (var j = 0; j < account.给出详情.length; j++) {
                var detail = account.给出详情[j];
                var found = false;

                for (var k = 0; k < accountMap[key].给出详情.length; k++) {
                    var mergedDetail = accountMap[key].给出详情[k];
                    if (mergedDetail.给账号 === detail.给账号 && mergedDetail.给出材料 === detail.给出材料) {
                        mergedDetail.数量 += detail.数量;
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    accountMap[key].给出详情.push(JSON.parse(JSON.stringify(detail)));
                }
            }

            // 更新获得材料总量
            accountMap[key].获得材料总量 = accountMap[key].接收详情.reduce(function (sum, detail) {
                return sum + detail.数量;
            }, 0);
        }

        // 转换为数组
        for (var key in accountMap) {
            mergedResult.push(accountMap[key]);
        }

        return mergedResult;
    }

    // 合并结果
    var mergedResult = mergeReceiveDetails(result);

    var stats = {
        总账号数: accounts.length,
        可升级账号数: upgradeCount,
        总交易次数: totalTransactions
    };

    return {
        账号分配结果: mergedResult,
        整体统计信息: stats
    };
}


function friendButton() {
    while (true) {//点开好友栏
        let friendMenu = module.matchColor([{ x: 256, y: 542, color: "#ffcb42" },
        { x: 214, y: 591, color: "#c48f4c" }, { x: 265, y: 647, color: "#c48f4c" },
        { x: 302, y: 630, color: "#c48f4c" }, { x: 210, y: 672, color: "#ffbf1d" },
        { x: 262, y: 615, color: "#ca922b" }, { x: 430, y: 540, color: "#fff9db" }])

        let sc = captureScreen();
        //新版界面
        let allMatch = module.findMC(["#f0e0d6", [-2, -28, "#fbf5f4"],
            [-20, -10, "#a24801"], [7, 30, "#f3bf41"]], sc, [1140, 570, 120, 130]);

        //老板界面
        let allMatch2 = module.findMC(["#fdf8f4", [5, 32, "#f2ded3"],
            [-17, 18, "#a44900"], [11, 54, "#f7c342"],
            [37, 26, "#a54b00"]], sc, [1140, 570, 120, 130]);

        if (allMatch || allMatch2) {
            log("进入界面")
            module.showTip("进入界面")
            return true;
        }

        if (friendMenu) {
            module.showTip("关闭好友栏");
            log("关闭好友栏")
            let friendButton = module.findMC(["#f0e0d6", [-2, -28, "#fbf5f4"],
                [-20, -10, "#a24801"], [7, 30, "#f3bf41"]]);
            if (friendButton) {
                log("点击好友按钮")
                click(friendButton.x + module.ran(), friendButton.y + module.ran());
                sleep(200);
            }
            else {
                //老板界面
                friendButton = module.findMC(["#fdf8f4", [5, 32, "#f2ded3"],
                    [-17, 18, "#a44900"], [11, 54, "#f7c342"],
                    [37, 26, "#a54b00"]]);
                if (friendButton) {
                    log("点击好友按钮")
                    click(friendButton.x + module.ran(), friendButton.y + module.ran());
                    sleep(200);
                }
            }
            return true;
        }
        sleep(1000)
        module.close();
    }

}

function findFriend(Account, isclick = true) {
    const MAX_SCROLL_DOWN = 5; // 最多下滑5次

    let found = false; // 是否找到目标
    let scrollDownCount = 0; // 当前下滑次数
    let isEnd = false;
    let AccountIma = null;

    AccountIma = files.join(照片文件夹, Account + ".png");
    log("账号图片路径：" + AccountIma);
    module.showTip("");
    while (!found) {
        sleep(500);

        let addFriendMenu = module.matchColor([{ x: 146, y: 84, color: "#f4da4e" },
        { x: 132, y: 106, color: "#fefdfc" }, { x: 346, y: 45, color: "#dfb479" },
        { x: 1109, y: 76, color: "#f34853" }])
        if (!addFriendMenu) {
            module.openFriendMenu();
            sleep(500)
            click(550, 150)
            sleep(1000)
        }

        let is_find_Account = null;

        is_find_Account = module.findimage(AccountIma, 0.9);


        if (is_find_Account && isclick) { //如果找到账号名称，则点击
            log(`找到账号${Account}`);
            // module.showTip(`找到账号${Account}`);
            sleep(500);
            click(is_find_Account.x + module.ran(), is_find_Account.y + module.ran());
            sleep(300);
            click(is_find_Account.x + module.ran(), is_find_Account.y + module.ran());
            sleep(300)
            click(is_find_Account.x + module.ran(), is_find_Account.y + module.ran());
            sleep(500);
            found = true;
            break;
        }


        //检测是否在好友簿界面
        if (!module.matchColor([{ x: 544, y: 130, color: "#fff9db" }, { x: 425, y: 55, color: "#deb476" }])) {
            module.openFriendMenu();
            sleep(500)
            click(550, 150)
            sleep(1000)
        }

        if (scrollDownCount < MAX_SCROLL_DOWN) {
            swipe(600, 630, 600, 350, 1000); // 下滑
            scrollDownCount++;
            log(`未找到账号，第 ${scrollDownCount} 次下滑...`);
            // module.showTip(`未找到账号，第 ${scrollDownCount} 次下滑...`);
            sleep(1500);

            continue;
        }

        else if (scrollDownCount >= MAX_SCROLL_DOWN) {
            log(`未找到账号，上滑回顶部...`);
            // module.showTip("未找到账号，上滑回顶部");
            swipe(600, 350, 600, 630, 300);
            sleep(500)
            swipe(600, 350, 600, 630, 300);
            sleep(500)
            scrollDownCount = 0;
        }
    }
    return true;
}


function findCommunityFriendMenu() {
    for (var i = 0; i < 2; i++) {
        module.huadong_adjust([60, 50], [640, 450]);
        sleep(500)
        let shopPos = module.findshop();
        click(shopPos.x - 420, shopPos.y - 20)
        sleep(700)
        if (module.matchColor(allItemColor["社区界面"])) {
            click(540 + ran(), 130 + ran())
            sleep(800);
            if (module.matchColor(allItemColor["社区好友界面"])) {
                return true;
            }
        } else {
            module.close();
        }
    }
    return false;

}

function findCommunityFriend(Account, isclick = true) {
    const MAX_SCROLL_DOWN = 10; // 最多下滑10次

    let found = false; // 是否找到目标
    let scrollDownCount = 0; // 当前下滑次数
    let isEnd = false;
    let AccountIma = null;

    AccountIma = files.join(照片文件夹, Account + ".png");
    log("账号图片路径：" + AccountIma);
    module.showTip("");
    while (!found) {
        sleep(500);

        let is_find_Account = null;

        is_find_Account = module.findimage(AccountIma, 0.9);


        if (is_find_Account && isclick) { //如果找到账号名称，则点击
            log(`找到账号${Account}`);
            // module.showTip(`找到账号${Account}`);
            sleep(500);
            click(is_find_Account.x + module.ran(), is_find_Account.y + module.ran());
            sleep(600);
            let button = module.findMC(["#f5ce52", [30, 1, "#ffffff"], [108, 3, "#f5cd51"],
                [76, 3, "#fefdf8"], [-56, -17, "#f9c859"]])
            if (button) {
                click(button.x, button.y);
            }
            found = true;
            break;
        }


        //检测是否在社区好友界面
        if (!module.matchColor(allItemColor["社区好友界面"])) {
            log("未找到社区好友界面");
            findCommunityFriendMenu();
        }

        if (scrollDownCount < MAX_SCROLL_DOWN) {
            swipe(600, 630, 600, 350, 1000); // 下滑
            scrollDownCount++;
            log(`未找到账号，第 ${scrollDownCount} 次下滑...`);
            // sleep(1500);

            continue;
        }

        else if (scrollDownCount >= MAX_SCROLL_DOWN) {
            log(`未找到账号，上滑回顶部...`);
            swipe(600, 350, 600, 630, 300);
            sleep(500)
            swipe(600, 350, 600, 630, 300);
            sleep(500)
            scrollDownCount = 0;
        }
    }
    return true;
}

function upgradeOperation(data) {
    let 主号 = data.账号名称;
    let 供给号数组 = data.接收详情.map(item => item.从账号);

    // 从供给号卖出物品
    for (let 接收 of data.接收详情) {
        let 供给号 = 接收.从账号;
        let sellPlan = [{ title: 接收.接收材料, num: 接收.数量}];
        log("切换账号: " + 供给号);
        module.switch_account(供给号);
        sleep(500);
        module.huadong();
        sleep(1200);
        while (!module.openshop()) {
            module.huadong();
        }
        if (sellPlan) {
            log("商店售卖计划:" + JSON.stringify(sellPlan))
            module.shop_sell(sellPlan, shopSellItemColor, null, 0)
        }
        sleep(300);
        module.find_close();
    }

    // 从接收号买入物品
    log("切换账号: " + 主号);
    module.switch_account(主号);
    sleep(300);
    module.find_close();
    sleep(300)
    module.huadong();

    for (let 供给 of 供给号数组) {

        if (config.friendInterface === "社区") {
            findCommunityFriendMenu();
            sleep(500)
            click(550, 150)
            sleep(1000)
            if (!findCommunityFriend(供给)) continue;
        } else {
            module.openFriendMenu();
            sleep(500);
            if (!findFriend(供给)) continue;
        }


        sleep(500)
        while (!friendButton()) { module.close() }

        module.huadong()
        sleep(1500)
        while (!module.openshop()) {
            module.huadong();
         }

        sleep(1000)
        gestures([0, 100, [250, 270]], [0, 100, [430, 270]], [0, 100, [620, 270]], [0, 100, [800, 270]], [0, 100, [990, 270]],
            [0, 100, [250, 470]], [0, 100, [430, 470]], [0, 100, [620, 470]], [0, 100, [800, 470]], [0, 100, [990, 470]]
        )
        //商店右滑
        sleep(1000)
        const [x1, y1] = [960, 390];
        const [x2, y2] = [288, 390];
        swipe(x1 + module.ran(), y1 + module.ran(), x2 + module.ran(), y2 + module.ran(), 1000);
        console.log("商店右滑")
        sleep(500)
        gestures([0, 100, [250, 270]], [0, 100, [430, 270]], [0, 100, [620, 270]], [0, 100, [800, 270]], [0, 100, [990, 270]],
            [0, 100, [250, 470]], [0, 100, [430, 470]], [0, 100, [620, 470]], [0, 100, [800, 470]], [0, 100, [990, 470]]
        )
        sleep(500)
        //点击叉号
        module.find_close(null,["except_homeBtn"]);
        sleep(500)
        //点击Home
        module.find_close();
        sleep(1000)
        module.checkmenu();
        sleep(1000)

    }

    //查看是否可以升级
    let shengcang_h = config.storageUpgradeMethod === "粮仓" ? false : true;
    let shengcang_l = config.storageUpgradeMethod === "粮仓" ? true : false;
    module.shengcang(shengcang_h, shengcang_l)

}


function main() {
    try {
        module.createWindow(config.showText);
    } catch (error) {
        console.error("创建窗口失败:", error);
    }

    //主界面判断
    sleep(100);
    module.checkmenu();
    sleep(500);

    //新建账号列表
    const doneAccountsList = config.accountList.filter(account => account.done === true);


    //设定初始仓库数据
    let storageUpgradeStatisticsData = [];

    doneAccountsList.forEach(account => {

        module.switch_account(account.title);
        log("============当前账号: " + account.title + "============");
        module.huadong();
        sleep(500);
        let isFindShop = module.findshop()
        if (!isFindShop) {
            if (module.find_close()) sleep(500)
            module.huadong()
        }
        module.findland(false)

        //执行仓库统计
        let rawData = {}
        let storageType = config.storageUpgradeMethod === "粮仓" ? "lc" : "hc";
        rawData["数据"] = storageUpgradeStatistics(storageType);
        if (!rawData["数据"]) {
            log("账号" + account.title + "仓库统计数据为空");
            return;
        }
        rawData["账号"] = account.title
        //将仓库统计结果添加到统计数据
        storageUpgradeStatisticsData.push(rawData);
    });

    //输出原始数据
    log(storageUpgradeStatisticsData);

    //转换函数
    let allocationData = convertToAllocationFormat(storageUpgradeStatisticsData, storageType);
    log(JSON.stringify(allocationData));

    //传入数据
    let allocationResult = allocateMaterials(allocationData);
    log(JSON.stringify(allocationResult));

    for (let account of allocationResult["账号分配结果"]) {
        upgradeOperation(account);
    }

    log("升仓完成");
    module.showTip("升仓完成");

}


main();

