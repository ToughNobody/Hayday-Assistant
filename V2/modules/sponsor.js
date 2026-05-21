"use strict";

/**
 * Hayday-Assistant - 求打赏😭模块
 * 记录信息，包括首次运行时间、运行次数。
 * 根据信息弹出打赏弹窗
 */

const user_stats = storages.create("hayday-assistant");

let selfPath = engines.myEngine().getSource().toString();
const currentPath = selfPath.substring(0, selfPath.lastIndexOf("/"));

/**
 * 记录首次运行时间、运行次数。
 */
function recordInfo() {
    if (!user_stats.contains("first_run_date")) {
        const today = new Date();
        const dateStr = today.getFullYear() + "-" + 
                       String(today.getMonth() + 1).padStart(2, '0') + "-" + 
                       String(today.getDate()).padStart(2, '0');
        user_stats.put("first_run_date", dateStr);
    }

    // 记录运行次数
    if (!user_stats.contains("run_times")) {
        user_stats.put("run_times", 1);
    } else {
        user_stats.put("run_times", Number(user_stats.get("run_times")) + 1);
    }
}

const COUNT_TEXTS = [
    "感谢你已经使用本脚本 {count} 次 🙏",
    "第 {count} 次启动达成 🎯",
    "这已经是第 {count} 次为你服务啦 ",
    "累计使用 {count} 次，感谢支持 ❤️",
    "脚本已被你召唤 {count} 次了",
    "不知不觉用了 {count} 次呢",
    "第 {count} 次，脚本表示很感动",
    "{count} 次稳定运行，离不开你的支持"
];

const MONTH_TEXTS = [
    "{month} 个月，脚本还没罢工",
    "第 {month} 个月，感谢陪伴 ❤️",
    "{month} 个月默默守护完成 ",
    "脚本陪你走过 {month} 个月啦 ",
    "不知不觉已陪你 {month} 个月",
    "第 {month} 个月，感情越来越深"
];

const SPONSOR_TEXTS = [
    "要不……请我喝瓶可乐？🥤",
    "你的赞助，是我继续维护的理由 💖",
    "开源不易，感谢每一份支持 🙏",
    "如果它真的帮到你，欢迎回馈一点点 ❤️",
    "你的鼓励，胜过千言万语 🌟",
    "喜欢的话，不妨支持一下作者呀"
];

/**
 * 随机选择数组中的一个元素
 */
function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 替换文本中的占位符
 */
function formatText(text, replacements) {
    let result = text;
    for (const key in replacements) {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), replacements[key]);
    }
    return result;
}

/**
 * 显示打赏弹窗
 */
function showSponsorDialog(contentText, sponsorText) {
    dialogs.build({
        title: "🌟投喂作者🌟",
        content: contentText + "\n\n" + sponsorText + "\n(ฅ´ω`ฅ)",
        positive: "真的😍",
        neutral: "逗你玩😝",
        cancelable: false,
    }).on("positive", () => {
        toast("您的支持是我最大的动力！❤️");
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

        floatWindow.setPosition(device.width / 10, device.height / 5);

        floatWindow.loveBtn.on("click", () => {
            app.openUrl("https://afdian.com/a/ToughNobody");
            floatWindow.close();
        });

        floatWindow.closeBtn.on("click", () => {
            floatWindow.close();
        });

    }).on("neutral", () => {
        toast("我哭死！😭");
    }).show();
}

/**
 * 检查是否需要弹出打赏弹窗。
 */
function checkSponsor() {
    const runTimes = Number(user_stats.get("run_times"));
    const firstRunDateStr = user_stats.get("first_run_date");

    // 检查运行次数是否达到50或整百
    if (runTimes == 50 || runTimes % 100 === 0) {
        const countText = formatText(randomChoice(COUNT_TEXTS), { count: runTimes });
        const sponsorText = randomChoice(SPONSOR_TEXTS);
        showSponsorDialog(countText, sponsorText);
    }

    if (firstRunDateStr) {
        const firstRunDate = new Date(firstRunDateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        firstRunDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((today - firstRunDate) / (1000 * 60 * 60 * 24));
        
        const lastMonthlyTrigger = user_stats.get("last_monthly_trigger");
        const todayStr = today.toDateString();
        
        if (daysDiff > 0 && daysDiff % 30 === 0 && lastMonthlyTrigger !== todayStr) {
            const months = Math.floor(daysDiff / 30);
            const monthText = formatText(randomChoice(MONTH_TEXTS), { month: months });
            const sponsorText = randomChoice(SPONSOR_TEXTS);
            showSponsorDialog(monthText, sponsorText);
            user_stats.put("last_monthly_trigger", todayStr);
        }
    }
}

module.exports = {
    recordInfo,
    checkSponsor
};


