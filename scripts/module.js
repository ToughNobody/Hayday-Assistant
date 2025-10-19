


//全局
const timerMap = new Map();

let appExternalDir = context.getExternalFilesDir(null).getAbsolutePath();
const configDir = files.join(appExternalDir, "configs");
const configPath = files.join(configDir, "config.json");

let content = files.read(configPath);
let config = JSON.parse(content);

let token_storage = storages.create("token_storage");
let timeStorage = storages.create("times");
let statistics = storages.create("statistics");

const cropItemColor = {
    "小麦": {
        crop: ["#ffef14", [9, -32, "#d59b08"], [-8, 20, "#b56000"], [-32, 28, "#f3c107"], [29, 30, "#ffdf7c"]],
        crop_sail: ["#fff00a", [-4, -2, "#ffffff"], [-20, 28, "#ffde05"], [6, -34, "#fed704"], [-20, 2, "#feef08"]]
    },
    "玉米": {
        crop: ["#f8e605", [49, 31, "#ffdf7c"], [-31, 35, "#8f9504"], [33, -30, "#f8ef02"], [-17, -9, "#a5a905"]],
        crop_sail: ["#faf350", [7, 23, "#8c9104"], [-24, 1, "#a8ad05"], [-34, 38, "#888d04"], [28, -24, "#fbf115"]]
    },
    "胡萝卜": {
        crop: ["#ffd100", [24, 21, "#ffdf7c"], [33, -29, "#48951b"], [-31, 29, "#ff9700"], [-7, -7, "#ffe000"]],
        crop_sail: ["#ffba00", [26, -25, "#509b1f"], [-4, 10, "#ff8a00"], [-30, 24, "#ffb300"], [36, -45, "#7bc333"]]
    },
    "大豆": {
        crop: ["#eff083", [13, 32, "#ffdf7c"], [-33, 39, "#dde249"], [-32, -5, "#f1f278"], [19, -31, "#b1ba13"]],
        crop_sail: ["#dde163", [-29, 26, "#909a0f"], [23, 9, "#eeef72"], [-13, -3, "#ced24e"], [-29, 54, "#dde148"]]
    }
};

//都取右下角为基准点
const cangkuItemColor = {
    "盒钉": ["#fffadc", [-100, -99, "#927059"], [-68, -90, "#8c9194"], [-64, -77, "#e7e6d6"], [-57, -78, "#a48066"], [-93, -40, "#efe0c9"], [-101, -29, "#ce1e0a"]],
    "螺钉": ["#fffadc", [-56, -78, "#596062"], [-73, -89, "#f3f1f3"], [-47, -59, "#c3c9cc"], [-126, -8, "#cbccd3"], [-108, -49, "#fffadc"]],
    "镶板": ["#fffadc", [-55, -70, "#8f5629"], [-103, -73, "#cecbce"], [-143, -33, "#cc8850"], [-115, -13, "#be763a"], [-85, -24, "#4a3021"], [-97, -3, "#faf5d8"]],
    "螺栓": ["#fffadc", [-79, -93, "#ebecea"], [-79, -96, "#fffedc"], [-47, -74, "#7b8d8c"], [-51, -76, "#f1f1f1"], [-70, -75, "#949e9c"], [-70, -81, "#f4f4f4"], [-120, -13, "#6f7578"], [-121, -21, "#7b868c"], [-127, -21, "#fffadc"]],
    "木板": ["#fffadc", [-44, -72, "#794421"], [-66, -67, "#8a5027"], [-117, -28, "#714018"], [-130, -34, "#c67939"], [-135, -25, "#854619"]],
    "胶带": ["#fffadc", [-58, -56, "#d9e0e1"], [-86, -90, "#e5ecec"], [-98, -64, "#614830"], [-112, -38, "#6a4c38"], [-95, -4, "#9caaad"], [-125, -53, "#a0a9ab"]],
    "土地契约": ["#fffadc", [-55, -85, "#7a89bd"], [-62, -75, "#f7f7e9"], [-68, -39, "#eae41c"], [-106, -58, "#6f716f"], [-119, -63, "#f7f7ec"], [-127, -69, "#8492bd"]],
    "木槌": ["#fffadc", [-54, -67, "#f4eabd"], [-74, -82, "#debf3a"], [-95, -88, "#e6d651"], [-88, -60, "#d0992b"], [-110, 1, "#dab639"], [-116, -19, "#fffadc"], [-78, -40, "#fffadc"]],
    "标桩": ["#fffadc", [-63, -89, "#e5ca80"], [-82, -71, "#cd1f23"], [-86, -25, "#dc2a27"], [-108, -14, "#c77a33"], [-112, -7, "#e1b964"]],
    "斧头": ["#fffadc", [-59, -45, "#ffffff"], [-64, -45, "#faf5d8"], [-36, -75, "#ffffff"], [-32, -79, "#fffbdc"], [-43, -78, "#e7e3e7"], [-77, -70, "#d3d5e3"], [-79, -68, "#755723"], [-81, -67, "#8f7437"], [-127, -11, "#b5a252"], [-132, -11, "#fffadc"], [-110, -33, "#b69f52"], [-92, -52, "#ab8e43"]],
    "木锯": ["#fffadc", [-44, -79, "#bb5d04"], [-58, -80, "#bd5d00"], [-73, -71, "#ececef"], [-91, -55, "#f4f2f4"], [-128, -3, "#ad5500"]],
    "炸药": ["#fffadc", [-37, -79, "#e02615"], [-47, -87, "#ff945f"], [-52, -92, "#f75837"], [-93, -31, "#ffc270"], [-103, -29, "#423818"], [-113, -11, "#fffadc"]],
    "炸药桶": ["#fffadc", [-48, -79, "#f75836"], [-49, -78, "#f7603c"], [-76, -83, "#3e310f"], [-105, -70, "#efc329"], [-104, -53, "#ececed"], [-111, -23, "#b3761f"]],
    "铁铲": ["#fffadc", [-55, -95, "#eb953d"], [-69, -70, "#e78b39"], [-82, -44, "#de6d29"], [-94, -42, "#fffadc"], [-103, -33, "#adb2b5"], [-107, 1, "#b1b6b9"], [-87, -30, "#abb1b3"]],
    "十字镐": ["#fffadc", [-38, -68, "#8c9694"], [-83, -88, "#d6d7d6"], [-71, -101, "#987936"], [-113, -78, "#e7e7e7"], [-104, -1, "#a0853e"], [-93, -35, "#8f6d32"]],
};

//取中间为基准点
// const cangkuItemColor = {
//     "盒钉": ["#d12410", [-16, -31, "#8d6e53"], [14, -24, "#8c9294"], [-12, 26, "#efe0c9"], [-19, 36, "#ce2410"], [25, -10, "#a27f65"]],
//     "螺钉": ["#c0c6c0", [35, -1, "#b5bbbe"], [10, -34, "#f6f7f6"], [13, -14, "#d4d7d6"], [-10, -16, "#fffadc"], [-50, 56, "#b2baba"], [-57, 51, "#fef9db"], [25, -21, "#596062"]],
//     "镶板": ["#935929", [-34, -3, "#fffadc"], [-17, -11, "#d2d2d2"], [31, -6, "#8c5529"], [-31, 48, "#c67f44"], [-58, 29, "#cc8850"]],
//     "螺栓": ["#edeeee", [1, -35, "#e8e8e8"], [28, -22, "#f2f2f2"], [35, -14, "#7b8a8c"], [-19, 53, "#636c71"], [-37, 36, "#738284"], [-40, 6, "#fffadc"]],
//     "木板": ["#ae6a30", [32, 0, "#ab6529"], [32, -17, "#7e4621"], [46, -17, "#7a4421"], [-4, 24, "#c67939"], [-36, 20, "#c67a37"], [-41, 32, "#844518"], [-50, 42, "#faf5d8"], [-27, 1, "#fffadc"]],
//     "胶带": ["#aebbbd", [-17, 0, "#53392a"], [-39, 0, "#a5b2b5"], [-4, -34, "#e5eceb"], [-41, 42, "#566166"], [-10, 53, "#9fa9ad"], [-13, -13, "#533a2a"]],
//     "土地契约": ["#f7f7ef", [30, -27, "#7a89bd"], [-41, -11, "#8492bd"], [-33, -5, "#f7f7ec"], [-27, 57, "#6b79b5"], [-21, 43, "#f7f5e7"], [-49, 42, "#fffadc"], [13, 59, "#fffadc"]],
//     "木槌": ["#d5a030", [35, -21, "#f3e7b4"], [29, 3, "#e6c76b"], [-3, -37, "#ddc643"], [-10, -25, "#cb8f26"], [-23, 59, "#deba39"], [15, 31, "#fffadc"]],
//     "标桩": ["#d42320", [7, -24, "#d0963b"], [-31, 52, "#e1b964"], [-28, 46, "#c77932"], [15, 33, "#e33736"], [-23, -7, "#fffadc"], [-17, 27, "#ca7b31"]],
//     "斧头": ["#ad954a", [22, -28, "#edeaef"], [50, -10, "#ffffff"], [-37, 52, "#ad964a"], [-14, 16, "#b5a252"], [-13, -1, "#fffadc"], [16, 8, "#fffadc"]],
//     "木锯": ["#f1f0f2", [-42, 56, "#b85900"], [-36, 38, "#a54d00"], [-29, 28, "#e4e3e8"], [18, -20, "#e8e8f0"], [28, -23, "#bd5d00"], [42, -21, "#b85a02"], [-22, -7, "#fffadc"]],
//     "炸药": ["#ffa567", [28, -8, "#d20e06"], [21, -20, "#ff9159"], [14, -28, "#f75d39"], [-28, 36, "#ffc16e"], [-37, 37, "#423818"]],
//     "炸药桶": ["#f7e0cf", [-15, 0, "#d81008"], [-44, -13, "#f4d232"], [-53, 34, "#ad6918"], [15, -23, "#f75837"], [-33, -2, "#fffadc"]],
//     "铁铲": ["#e37e36", [20, 0, "#fffadc"], [-9, 0, "#fffadc"], [22, -41, "#e78837"], [-23, 26, "#9ba3a3"], [-32, 57, "#b4b6bc"], [-19, 12, "#fffadc"], [4, -8, "#e68b38"]],
//     "十字镐": ["#8f7134", [-23, 67, "#754c23"], [-27, -23, "#e7e7e7"], [45, -14, "#9ba1a3"], [13, -45, "#a2883d"], [3, -23, "#dee3e7"], [-13, -5, "#fffadc"]],
// };

const numColor = {
    "0": ["#ffffff", [-2, -8, "#ffffff"], [-6, -12, "#ffffff"], [-10, -15, "#ffffff"], [-15, -10, "#ffffff"], [-17, -5, "#ffffff"], [-18, 1, "#ffffff"], [-17, 17, "#ffffff"], [-15, 23, "#ffffff"], [-11, 26, "#fcfcf9"], [-10, 15, "#000000"], [-9, 16, "#000000"], [-9, -5, "#000000"], [-11, -2, "#060606"], [-11, 0, "#040404"], [-11, 2, "#040404"], [-8, 5, "#020202"], [-8, 7, "#020202"], [-2, 24, "#000000"], [-1, 22, "#000000"]],
    "1": ["#ffffff", [0, 13, "#ffffff"], [0, 27, "#ffffff"], [0, 39, "#ffffff"], [0, 43, "#000000"], [-5, 43, "#000000"], [-5, 39, "#ffffff"], [-5, 24, "#ffffff"], [-5, 11, "#ffffff"], [-5, 5, "#ffffff"], [-9, 4, "#ffffff"], [-9, 3, "#ffffff"], [-6, 0, "#ffffff"], [-2, 0, "#ffffff"], [-10, 8, "#000000"], [-3, 4, "#ffffff"], [-3, 20, "#ffffff"], [-3, 37, "#ffffff"], [-3, 39, "#ffffff"]],
    "2": ["#ffffff", [0, 6, "#ffffff"], [-2, 30, "#ffffff"], [-2, 32, "#ffffff"], [-2, 37, "#000000"], [-15, 33, "#ffffff"], [-16, 38, "#000000"], [-12, 28, "#ffffff"], [-9, 20, "#ffffff"], [-5, 15, "#ffffff"], [-3, 9, "#ffffff"], [-3, 3, "#ffffff"], [-7, -3, "#ffffff"], [-11, -2, "#ffffff"], [-13, 1, "#ffffff"], [-15, 5, "#000000"], [-9, 5, "#000000"]],
    "3": ["#ffffff", [-14, -3, "#ffffff"], [-17, 0, "#000000"], [-7, -5, "#ffffff"], [-3, -2, "#ffffff"], [-3, 4, "#ffffff"], [-6, 9, "#ffffff"], [-8, 12, "#ffffff"], [-3, 16, "#ffffff"], [-1, 22, "#ffffff"], [-5, 28, "#ffffff"], [-10, 30, "#ffffff"], [-15, 29, "#ffffff"], [-14, 36, "#000000"], [-6, 36, "#000000"], [-10, 18, "#000000"], [-10, 2, "#000000"]],
    "4": ["#ffffff", [0, 4, "#ffffff"], [-2, 15, "#ffffff"], [-1, 15, "#21211f"], [-8, 15, "#fffefd"], [-9, 15, "#000000"], [-10, 8, "#000000"], [-10, 5, "#ffffff"], [-8, 8, "#ffffff"], [-9, 0, "#fffefd"], [-9, -2, "#171716"], [-8, -3, "#ffffff"], [-12, -3, "#ffffff"], [-5, -13, "#ffffff"], [-5, -17, "#000000"], [-8, -18, "#ffffff"], [-11, -22, "#ffffff"], [-19, 1, "#ffffff"], [-15, -11, "#ffffff"], [-20, 7, "#000000"]],
    "5": ["#ffffff", [0, 6, "#000000"], [-4, 6, "#000000"], [-9, 0, "#ffffff"], [-12, 0, "#ffffff"], [-11, 11, "#ffffff"], [-9, 17, "#ffffff"], [-3, 21, "#ffffff"], [-1, 27, "#ffffff"], [-4, 32, "#ffffff"], [-7, 35, "#ffffff"], [-12, 36, "#ffffff"], [-14, 33, "#ffffff"], [-14, 42, "#000000"], [-9, 43, "#000000"], [-2, 40, "#000000"], [-12, 23, "#000000"], [-1, 7, "#000000"], [-3, 7, "#000000"]],
    "6": ["#f3f2ed", [1, 0, "#040404"], [0, 9, "#000000"], [-4, 11, "#000000"], [-7, 10, "#ffffff"], [-9, 5, "#ffffff"], [1, 10, "#000000"], [-15, 20, "#ffffff"], [-15, 26, "#ffffff"], [-14, 32, "#ffffff"], [-17, 26, "#000000"], [-8, 28, "#fdfcfa"], [-7, 28, "#0a0a09"], [-2, 27, "#020202"], [-1, 27, "#f5f4ef"], [0, 27, "#ffffff"], [-1, 39, "#ffffff"], [-10, 38, "#ffffff"], [5, 29, "#ffffff"], [7, 27, "#060606"]],
    "7": ["#ffffff", [0, 9, "#ffffff"], [-3, 18, "#ffffff"], [-6, 26, "#ffffff"], [-8, 33, "#ffffff"], [-10, 38, "#ffffff"], [-13, 36, "#ffffff"], [-11, 27, "#ffffff"], [-9, 21, "#ffffff"], [-7, 16, "#ffffff"], [-6, 15, "#ffffff"], [-4, 8, "#ffffff"], [-7, 4, "#ffffff"], [-11, 4, "#ffffff"], [-15, 4, "#ffffff"], [-15, 0, "#ffffff"], [-2, 0, "#ffffff"], [-12, 8, "#000000"]],
    "8": ["#f6f5f1", [1, 0, "#040404"], [1, 7, "#040404"], [0, 7, "#f5f4ef"], [0, 10, "#171716"], [0, 13, "#0c0c0b"], [-2, 12, "#ffffff"], [-9, 18, "#060606"], [-8, 18, "#f4f3ee"], [-13, 18, "#1a1a18"], [-14, 18, "#fdfdfb"], [-14, 3, "#fbfbf8"], [-13, 3, "#040404"], [-9, 3, "#000000"], [-7, 3, "#ffffff"], [-10, 0, "#000000"], [-10, -2, "#fafaf6"], [-11, 17, "#121211"], [-12, 16, "#f6f5f0"], [-11, 13, "#ffffff"]],
    "9": ["#f4f3ee", [1, 0, "#040404"], [1, 8, "#020202"], [0, 8, "#ebeae4"], [0, 14, "#020202"], [-4, 21, "#fffefd"], [-4, 24, "#020202"], [-14, -2, "#191917"], [-15, -2, "#fffffe"], [-9, -2, "#000000"], [-8, -2, "#fcfbf8"], [-16, 23, "#f5f4ef"], [-17, 23, "#000000"], [-17, 28, "#000000"], [-16, 28, "#fdfcfa"], [-22, 3, "#fefdfb"], [-23, 3, "#000000"], [-18, -9, "#fefefd"], [-9, 26, "#ffffff"], [-5, 26, "#000000"]]
}

const ckNumColor = {
    "0": ["#fdfcfa", [1, -1, "#020201"], [0, 11, "#ffffff"], [0, 15, "#fcf9f5"], [1, 15, "#060504"], [-1, 24, "#040303"], [-3, 24, "#ffffff"], [-4, 29, "#090807"], [-7, 29, "#ffffff"], [-8, 32, "#0e0c0a"], [-11, 30, "#ffffff"], [-16, 28, "#ffffff"], [-18, 23, "#ffffff"], [-20, 9, "#ffffff"], [-10, -1, "#000000"], [-10, 3, "#231c12"], [-10, 7, "#a57f51"], [-10, 10, "#d4a369"], [-10, 13, "#bd915c"], [-10, 21, "#000000"]],
    "1": ["#ede6dc", [1, 0, "#110f0d"], [0, 16, "#d7cdbf"], [0, 36, "#a99e8f"], [-1, 42, "#fffefe"], [0, 43, "#1c1916"], [0, 44, "#000000"], [-7, 42, "#fdfcf9"], [-7, 44, "#1c1916"], [-7, 29, "#fdfcfa"], [-7, 17, "#fefdfb"], [-7, 8, "#fefdfc"], [-7, 7, "#fffefe"], [-10, 6, "#fffefd"], [-10, 10, "#000000"], [-13, 7, "#000000"], [-10, 2, "#fffefd"], [-10, -1, "#000000"], [-8, 0, "#fbf8f4"], [-8, -2, "#010100"]],
    "2": ["#fefdfc", [1, -1, "#070706"], [0, 9, "#f6f2eb"], [1, 9, "#0d0c0a"], [-2, 34, "#ffffff"], [-2, 29, "#ffffff"], [-2, 27, "#070706"], [-10, 27, "#fdfcf9"], [-8, 27, "#403b34"], [-17, 35, "#fffefe"], [-19, 35, "#000000"], [-16, 24, "#fefefd"], [-18, 24, "#000000"], [-11, 16, "#fffffe"], [-7, 5, "#faf6f1"], [-8, 5, "#020201"], [-18, -1, "#fefefd"], [-18, 2, "#000000"], [-9, 2, "#000000"], [-7, 1, "#faf6f1"]],
    "3": ["#f8f3ed", [1, 0, "#161411"], [-1, 14, "#000000"], [-4, 14, "#fffffe"], [-3, 14, "#a89e8e"], [1, 28, "#f6f2ea"], [2, 28, "#0d0c0a"], [-4, 35, "#ffffff"], [-18, 35, "#fdfbf9"], [-19, 33, "#000000"], [-15, 30, "#d9cfc1"], [-15, 29, "#020201"], [-11, 22, "#000000"], [-11, 19, "#ffffff"], [-12, 13, "#f9f6f0"], [-12, 11, "#000000"], [-11, 3, "#020201"], [-11, 1, "#fefdfc"], [-18, -1, "#fffefd"], [-18, 2, "#1b1816"]],
    "4": ["#f2ece3", [1, 0, "#9b9182"], [1, -1, "#0f0e0c"], [0, 8, "#000000"], [0, 6, "#f0e9e0"], [-1, 17, "#0f0d0b"], [-2, 17, "#e7ded2"], [-9, 17, "#efe8de"], [-10, 17, "#010100"], [-10, 6, "#ffffff"], [-11, 9, "#000000"], [-20, 5, "#fefcfb"], [-20, 8, "#020201"], [-12, -3, "#fdfbf8"], [-11, -3, "#312e28"], [-10, -3, "#020201"], [-9, -3, "#fbf7f2"], [-10, -9, "#f6f1e9"], [-10, -6, "#24211c"], [-12, -23, "#fffffe"]],
    "5": ["#fcfaf7", [1, 0, "#141310"], [0, 4, "#fbf8f4"], [0, 7, "#161411"], [-8, 9, "#141210"], [-9, 9, "#ffffff"], [-8, 16, "#fbf8f3"], [-8, 14, "#141210"], [2, 26, "#f3ede3"], [3, 26, "#110f0d"], [-2, 39, "#ffffff"], [-2, 42, "#020201"], [-11, 42, "#ffffff"], [-18, 40, "#e3dbce"], [-19, 40, "#030201"], [-12, 23, "#fffefe"], [-13, 25, "#0f0e0c"], [-16, 0, "#fcfaf6"], [-18, 0, "#030302"], [-16, 12, "#fefdfb"]],
    "6": ["#ffffff", [-1, 6, "#ffffff"], [-3, 10, "#ffffff"], [-6, 13, "#ffffff"], [-12, 13, "#ffffff"], [-17, 10, "#ffffff"], [-20, 7, "#ffffff"], [-21, 2, "#ffffff"], [-21, -4, "#ffffff"], [-20, -10, "#ffffff"], [-18, -17, "#ffffff"], [-13, -22, "#ffffff"], [-9, -26, "#ffffff"], [-5, -18, "#000000"], [-9, -15, "#000000"], [-15, -6, "#ffffff"], [-10, -7, "#ffffff"], [-11, 1, "#000000"]],
    "7": ["#efe8df", [1, 0, "#110f0d"], [-5, 18, "#1d1a17"], [-6, 18, "#f6f0e8"], [-9, 31, "#110f0d"], [-10, 30, "#fdfbf8"], [-15, 39, "#000000"], [-15, 36, "#ffffff"], [-18, 34, "#fefdfc"], [-19, 31, "#000000"], [-15, 23, "#faf6f0"], [-16, 22, "#000000"], [-13, 17, "#f8f3ec"], [-14, 16, "#000000"], [-8, 3, "#f8f3ed"], [-10, 3, "#080706"], [-20, 1, "#fefdfb"], [-20, 3, "#0f0d0b"], [-20, -5, "#f9f5f0"], [-21, -7, "#110e09"]],
    "8": ["#fbf9f5", [1, 0, "#12110e"], [0, 11, "#060504"], [-1, 11, "#71685c"], [-2, 11, "#ffffff"], [0, 20, "#f6f1e9"], [1, 20, "#110f0d"], [-8, 20, "#fefcfa"], [-10, 20, "#000000"], [-14, 18, "#1d1a17"], [-15, 17, "#fffefd"], [-12, 11, "#ffffff"], [-12, 15, "#ffffff"], [-12, 17, "#13110e"], [-11, -1, "#060504"], [-8, -1, "#fefdfb"], [-15, 0, "#ffffff"], [-22, 11, "#fefdfc"], [-24, 12, "#000000"], [-23, 20, "#fffefe"]],
    "9": ["#fbf8f4", [1, 0, "#090807"], [-1, 11, "#fdfcf9"], [0, 11, "#171613"], [-4, 20, "#fbf7f3"], [-4, 22, "#221f1a"], [-17, 28, "#fefefd"], [-18, 30, "#040303"], [-16, 22, "#fcfaf6"], [-15, 19, "#000000"], [-14, 13, "#000000"], [-14, 11, "#fbf8f4"], [-10, 12, "#000000"], [-9, 12, "#f9f4ee"], [-23, -3, "#fffefe"], [-25, -3, "#010100"], [-16, -5, "#fefdfc"], [-14, -5, "#020201"], [-11, -5, "#000000"], [-8, -5, "#fffffe"]],
    "/": ["#faf6f1", [1, -1, "#13110e"], [-6, -3, "#f5efe8"], [-8, -3, "#000000"], [-9, 3, "#f7f3ed"], [-10, 3, "#24201c"], [-14, 14, "#f7f2eb"], [-16, 14, "#020101"], [-21, 30, "#fcfaf6"], [-23, 30, "#010100"], [-25, 39, "#fdfaf8"], [-27, 39, "#000000"], [-27, 44, "#fefdfc"], [-27, 47, "#000000"], [-22, 46, "#ffffff"], [-19, 46, "#010100"], [-14, 30, "#ffffff"], [-11, 30, "#000000"], [-4, 9, "#fefdfc"], [-2, 9, "#040303"]]
}

let crop;
let crop_sail;

//作物名称映射
const cropNames = ["小麦", "玉米", "胡萝卜", "大豆"];

//根据选择的作物获取颜色
const selectedCropName = cropNames[config.selectedCrop.code];
if (selectedCropName && cropItemColor[selectedCropName]) {
    crop = cropItemColor[selectedCropName].crop;
    crop_sail = cropItemColor[selectedCropName].crop_sail;
} else {
    // 默认值，以防找不到对应的作物
    // crop = ["#ffef14", [9, -32, "#d59b08"], [-8, 20, "#b56000"], [-32, 28, "#f3c107"], [29, 30, "#ffdf7c"]];
    // crop_sail = ["#fff00a", [-4, -2, "#ffffff"], [-20, 28, "#ffde05"], [6, -34, "#fed704"], [-20, 2, "#feef08"]];
}

let randomOffset = 5; // 随机偏移量
function ran() {
    return Math.random() * (2 * randomOffset) - randomOffset;
}

//自动获取截图权限
function autorequestSC() {
    // 先尝试点击 "总是"、"整个"、"全部" 等按钮（最多 20 次）
    //使用mumu模拟器不需要了
    // for (let i = 0; i < 20; i++) {
    //     if (click("总是") || click("整个") || click("全部")) {
    //         break;
    //     }
    //     sleep(100);
    // }

    // 再尝试点击 "允许"、"确定"、"同意"、"开始" 等按钮（最多 30 秒）
    const MAX_RETRIES = 50; // 最多尝试 50 次（10秒）
    for (let i = 0; i < MAX_RETRIES; i++) {
        if (click("开始") || click("确定") || click("同意") || click("允许")) {
            log("已点击截图确认按钮");
            return; // 成功点击后直接退出函数
        }
        sleep(200);
    }
}

function autoSc() {// 启动自动点击权限请求
    let autorequestScreenCapture = threads.start(autorequestSC);

    //获取截图权限
    if (!requestScreenCapture()) {
        toast("请求截图失败");
        // 确保线程被正确终止
        if (autorequestScreenCapture && autorequestScreenCapture.isAlive()) {
            autorequestScreenCapture.interrupt();
            autorequestScreenCapture.join(); // 等待线程完全结束
        }
        exit();
    } else {
        // toastLog("已获得截图权限");
    }

    // 确保线程被正确终止
    if (autorequestScreenCapture && autorequestScreenCapture.isAlive()) {
        try {
            autorequestScreenCapture.interrupt();
            autorequestScreenCapture.join(1000); // 等待最多1秒

            // 如果线程仍然存活，强制终止
            if (autorequestScreenCapture.isAlive()) {
                console.warn("线程未能正常终止，尝试强制结束");
            }
        } catch (e) {
            console.error("终止线程失败:", e);
        }
    }

    // 清理线程引用
    autorequestScreenCapture = null;
}

/**
 * 在屏幕中查找模板图片的中心坐标
 * @param {string} imagepath - 模板图片路径（支持相对路径或绝对路径）
 * @param {number} xiangsidu - 匹配相似度阈值（0~1，值越大匹配越严格）
 * @returns { {x: number, y: number} | null } - 返回匹配区域中心坐标，未找到时返回 null
 * @throws {Error} 当截图失败或图片处理异常时抛出错误
 * @example
 * // 查找图片中心点
 * const center = findimage("./icons/button.png", 0.8);
 * if (center) {
 *   click(center.x, center.y); // 点击找到的中心位置
 * }
 */
function findimage(imagepath, xiangsidu, sc = null, region = null) {
    let screen = sc || captureScreen();
    let picture = null;
    try {
        picture = images.read(imagepath);
        if (!picture) throw new Error("模板图片读取失败");

        // 如果指定了区域参数，则只在区域内搜索
        if (region) {
            let result = images.findImage(screen, picture, {
                threshold: xiangsidu,
                region: region
            });
            return result ? {
                x: result.x + (picture.width / 2),
                y: result.y + (picture.height / 2)
            } : null;
        }

        // 默认全屏搜索
        let result = images.findImage(screen, picture, { threshold: xiangsidu });
        return result ? {
            x: result.x + (picture.width / 2),
            y: result.y + (picture.height / 2)
        } : null;
    } catch (e) {
        console.error("图像识别失败:", e);
        return null;
    } finally {
        // 确保资源回收
        if (!sc && screen) screen.recycle(); // 只有自己创建的截图才回收
        if (picture) picture.recycle();
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

function restartgame() {
    try {
        if (config.accountMethod == "email") {
            if (checkRoot()) {
                let packageName = "com.supercell.hayday";

                try {
                    let result = shell("am force-stop " + packageName, true);
                    if (result.code === 0) {
                        console.log("使用am force-stop命令成功停止应用");
                        // toast("卡通农场已停止");
                    } else {
                        console.log("am force-stop命令执行失败: " + result.error);
                    }
                } catch (e) {
                    console.log("使用am force-stop命令时出错: " + e);
                }
            } else {
                home();
                sleep(500);
                launchSettings("com.supercell.hayday");
                // 循环尝试点击"停止"按钮，直到成功
                for (let i = 0; i < 5; i++) {
                    if (click("停止")) {
                        break; // 点击成功后退出循环               
                    }
                    sleep(1000);
                }
                sleep(1000);
                for (let i = 0; i < 3; i++) {
                    if (click("确定") || click("停止")) {
                        toastLog("已停止应用");
                        break;// 点击成功后退出循环
                    }
                    sleep(1000);
                }
            }
            sleep(1000);
            launch("com.supercell.hayday");
        } else {
            events.broadcast.emit("engine_r", "刷地引擎_存档");
        }
    } catch (error) {
        log(error);
    }

    // 确保旧引擎资源已清理后再触发重启
    try {
        // 检查是否有旧引擎存在
        if (typeof engineIds !== "undefined" && engineIds.shuadi) {
            console.log("等待旧引擎资源清理...");
            sleep(500); // 给旧引擎一些时间清理资源
        }

        // 触发引擎重启事件
        events.broadcast.emit("engine_r", "刷地引擎");
        console.log("已发送引擎重启事件");
    } catch (e) {
        console.error("触发引擎重启事件失败:", e);
    }

}

//悬浮窗

function createWindow(position) {
    try {
        // 创建悬浮窗
        window = floaty.rawWindow(
            <frame gravity="right|bottom" bg="#00000000" margin="0">
                <card
                    w="*"
                    h="auto"
                    cardCornerRadius="26"
                    cardElevation="4dp"
                    cardBackgroundColor="#60000000"
                    foreground="?selectableItemBackground"
                    layout_gravity="center"
                >
                    <vertical w="auto" h="auto" padding="0 0">
                        <text
                            id="text"
                            singleLine="false"
                            minWidth="100"
                            w="auto"
                            maxWidth="500"
                            textSize="12"
                            textColor="#FFFFFF"
                            padding="10 6"
                            text=""
                            gravity="center"
                        />
                    </vertical>
                </card>
            </frame>
        );
        // 确保window和window.text对象存在
        if (!window || !window.text) {
            throw new Error("悬浮窗创建失败");
        }

        // 预先计算位置
        let targetX, targetY;
        if (position) {
            // 使用传入的坐标
            targetX = device.width * position.x;
            targetY = device.height * position.y;
        } else {
            // 使用默认配置
            targetX = device.width * config.showText.x;
            targetY = device.height * config.showText.x;
        }
        // 设置位置和不可触摸，退出时关闭
        window.setPosition(targetX, targetY);
        window.setTouchable(false);

        // 保存引用以便后续使用
        ui["tip_window"] = window;

    } catch (e) {
        console.error("createTipWindow函数执行失败:", e);
    }
}

function showTip(text) {

    try {
        if (ui["tip_window"]) {
            ui.run(function () {
                window.text.setText(text);
            })
        }
    } catch (error) {
        log(error);
    }
}

function showDetails(text, position, duration) {
    try {
        // 创建悬浮窗
        window_details = floaty.rawWindow(
            <frame gravity="right|bottom" bg="#00000000" margin="0">
                <card
                    w="*"
                    h="auto"
                    cardCornerRadius="26"
                    cardElevation="4dp"
                    cardBackgroundColor="#60000000"
                    foreground="?selectableItemBackground"
                    layout_gravity="center"
                >
                    <vertical w="auto" h="auto" padding="0 0">
                        <text
                            id="text"
                            singleLine="false"
                            minWidth="100"
                            w="auto"
                            maxWidth="500"
                            textSize="12"
                            textColor="#FFFFFF"
                            padding="10 6"
                            text=""
                            gravity="center"
                        />
                    </vertical>
                </card>
            </frame>
        );
        // 确保window_details和window_details.text对象存在
        if (!window_details || !window_details.text) {
            throw new Error("悬浮窗创建失败");
        }

        // 预先计算位置
        let targetX, targetY;
        if (position) {
            // 使用传入的坐标
            targetX = device.width * position.x;
            targetY = device.height * position.y;
        } else {
            // 使用默认配置
            targetX = device.width * config.showText.x;
            targetY = device.height * config.showText.x;
        }
        // 设置位置和不可触摸，退出时关闭
        window_details.setPosition(targetX, targetY);
        window_details.setTouchable(false);

    } catch (e) {
        console.error("createTipWindow函数执行失败:", e);
    }

    ui.run(function () {
        window_details.text.setText(text);
    })

    ui.run(() => {
        if (duration > 0) {
            setTimeout(() => {
                try {
                    if (window_details) window_details.close();
                } catch (e) {
                    console.error("关闭悬浮窗失败:", e);
                }
            }, duration);
        }
    })


}

function getDetails() {
    let details = "";
    try {
        if (config.isShengcang && config.shengcangTime >= 0) {
            let shengcangTimeState = getTimerState("shengcangTime");
            if (shengcangTimeState) {
                let minutes = Math.floor(shengcangTimeState / 60);
                let seconds = shengcangTimeState % 60;
                let timeText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
                details += `升仓剩余时间: ${timeText}\n`;
            }
        }

        if (config.isCangkuStatistics && config.cangkuStatisticsTime >= 0) {
            let cangkuStatisticsTimeState = getTimerState("cangkuStatisticsTime");
            if (cangkuStatisticsTimeState) {
                let minutes = Math.floor(cangkuStatisticsTimeState / 60);
                let seconds = cangkuStatisticsTimeState % 60;
                let timeText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
                details += `仓库统计剩余时间: ${timeText}\n`;
            }
        }
    } catch (error) {
        log(error);
    }

    return details;
}


//文字识别，返回坐标中心位置
/**
 * 在指定区域识别屏幕文字并返回匹配文字的坐标
 * @param {string} text - 要查找的目标文字
 * @param {number} [x=null] - 识别区域左上角x坐标（null表示全屏）
 * @param {number} [y=null] - 识别区域左上角y坐标
 * @param {number} [w=null] - 识别区域宽度
 * @param {number} [h=null] - 识别区域高度
 * @returns {Array|null} 返回匹配文字的[x,y]坐标，未找到返回null
 */
function findtext(text, x = null, y = null, w = null, h = null) {
    try {
        ocr.mode = 'paddle'; /* 切换到 Paddle 工作模式. */
        let region = [x, y, w, h];
        sleep(500);
        let sc = captureScreen();
        let results = ocr.detect(sc, region);
        // log(results);

        let targetText = text;

        for (let i = 0; i < results.length; i++) {
            let result = results[i];
            let recognizedText = result.label;
            // let confidence = result.confidence;
            let bounds = result.bounds;

            if (recognizedText && recognizedText.includes(targetText)) {
                log("找到目标文字: " + recognizedText);

                // 计算中心点坐标
                let centerX = bounds.left + (bounds.right - bounds.left) / 2;
                let centerY = bounds.top + (bounds.bottom - bounds.top) / 2;
                // log("点击坐标: (" + centerX + ", " + centerY + ")");
                // click(centerX, centerY);
                sc.recycle();
                return {
                    x: centerX,
                    y: centerY
                };
            }
        }
    } catch (error) {
        log(error);
    }
    return null;
}



function matchColor(checkPoints = [], screenshot, xiangsidu = 16) {
    // 参数验证
    if (!Array.isArray(checkPoints) || checkPoints.length === 0) {
        console.warn("checkPoints必须是非空数组");
        return false;
    }

    let sc = screenshot || captureScreen();
    let screenWidth = sc.width;
    let screenHeight = sc.height;
    let allMatch = true;

    try {
        for (let point of checkPoints) {
            // 坐标验证
            if (point.x >= screenWidth || point.y >= screenHeight) {
                console.warn(`坐标(${point.x},${point.y})超出屏幕范围(${screenWidth}x${screenHeight})`);
                allMatch = false;
                break;
            }

            // 颜色检测
            if (!images.detectsColor(sc, point.color, point.x, point.y, xiangsidu)) {
                allMatch = false;
                break;
            }
        }
    } catch (e) {
        console.error("颜色检测出错:", e);
        allMatch = false;
    } finally {
        // 只有自己创建的截图才回收
        if (!screenshot) {
            sc.recycle();
        }
    }

    return allMatch;
}


/**
 * @param {Array} checkPoints 格式为 ["基准颜色", [dx1, dy1, "颜色1"], [dx2, dy2, "颜色2"], ...]
 * @param {ImageWrapper} [screenshot] 可选截图对象
 * @param {Array} [region] 可选找色区域[x,y,width,height]
 * @param {number} [threshold=16] 相似度阈值，默认16
 * @returns {{x:number,y:number}|null} 返回坐标对象或null
 */
function findMC(checkPoints, screenshot, region, threshold = 16) {
    // 参数验证
    if (!Array.isArray(checkPoints) || checkPoints.length < 2) {
        throw new Error("参数错误：checkPoints必须为数组且至少包含基准颜色和一个相对点");
    }

    // 分离基准色和相对点
    const firstColor = checkPoints[0];
    const colors = checkPoints.slice(1);

    // 处理截图
    let img = null;
    let shouldRecycle = false;

    if (screenshot && typeof screenshot.getWidth === 'function') {
        img = screenshot;
    } else {
        img = images.captureScreen();
        shouldRecycle = true;
    }

    // 构建findOptions对象
    const findOptions = {
        threshold: Math.max(0, Math.min(255, threshold))
    };

    // 处理region参数
    if (region && Array.isArray(region) && region.length === 4) {
        findOptions.region = region;
    }

    try {
        const result = images.findMultiColors(img, firstColor, colors, findOptions);
        return result ? { x: result.x, y: result.y } : null;
    } catch (e) {
        console.error("执行多点找色失败:", e.message);
        console.error("错误堆栈:", e.stack);
        return null;
    } finally {
        // 安全回收截图
        if (shouldRecycle && img && typeof img.recycle === 'function') {
            img.recycle();
        }
    }
}

function findNum(sc, region, xiangsidu = 32, mode = 1) {
    // 参数验证
    if (!sc || typeof sc.getWidth !== "function") {
        console.warn("findNum: 无效的截图参数");
        return [];
    }

    if (mode == 1) {
        itemColor = numColor;
    } else if (mode == 2) {
        itemColor = ckNumColor;
    }

    // 查找所有匹配的坐标
    let matches1 = [];

    // 使用try-finally确保截图资源被回收
    try {
        // 确定搜索区域
        region = region ? region : [0, 0, sc.getWidth(), sc.getHeight()];
        xiangsidu = xiangsidu ? xiangsidu : 32;

        // console.log("findNum函数开始执行，搜索区域:", region, "相似度:", xiangsidu);

        // 首先遍历所有可能的数字/符号，查找最左侧的数字
        Object.keys(itemColor).forEach((key) => {
            let color = itemColor[key];
            // console.log("正在查找数字/符号:", key);
            let result = findMC(color, sc, region, xiangsidu);
            if (result) {
                // console.log(`找到数字/符号: ${key} 坐标: (${result.x}, ${result.y})`);
                matches1.push({
                    key: key,
                    x: result.x,
                    y: result.y
                });
            }
        });

        // 如果没有找到任何匹配，返回空数组
        if (matches1.length === 0) {
            // console.log("未找到任何匹配，返回空数组");
            return [];
        }

        // 按X坐标从小到大排序，找到最左侧的数字
        matches1.sort((a, b) => a.x - b.x);
        let firstDigit = matches1[0];

        // 用于存储最终结果的数组
        let finalResults = [firstDigit];

        // 设置初始搜索区域为第一个数字的右侧到区域最右侧
        let startX = firstDigit.x + 1;
        let regionWidth = region[2] - (startX - region[0]);
        // console.log(`第一个数字的X坐标: ${firstDigit.x}，新搜索区域起点X: ${startX}，剩余宽度: ${regionWidth}`);

        // 如果剩余区域宽度小于30，直接返回第一个数字
        if (regionWidth < 30) {
            // console.log("剩余区域宽度小于30，直接返回第一个数字");
            return [firstDigit.key];
        }

        // 设置新的搜索区域
        let currentRegion = [
            startX,
            region[1],
            regionWidth,
            region[3]
        ];
        // console.log("设置新的搜索区域:", currentRegion);

        // 循环查找直到没有更多匹配或区域宽度小于30
        let iterationCount = 0;
        let lastFoundX = firstDigit.x; // 记录上次找到的X坐标，用于防止死循环

        while (true) {
            iterationCount++;
            // console.log(`开始第${iterationCount}次循环，当前搜索区域:`, currentRegion);

            let foundInThisIteration = false;
            let currentMatches = [];

            // 在当前区域内查找所有匹配
            Object.keys(itemColor).forEach((key) => {
                let color = itemColor[key];
                let result = findMC(color, sc, currentRegion, xiangsidu);
                if (result) {
                    currentMatches.push({
                        key: key,
                        x: result.x,
                        y: result.y
                    });
                    foundInThisIteration = true;
                }
            });

            // 如果当前区域没有找到匹配，结束循环
            if (!foundInThisIteration) {
                // console.log(`第${iterationCount}次循环未找到匹配，结束循环`);
                break;
            }

            // console.log(`第${iterationCount}次循环找到${currentMatches.length}个匹配`);

            // 找到X坐标最小的匹配
            currentMatches.sort((a, b) => a.x - b.x);
            let leftmostMatch = currentMatches[0];
            // console.log(`第${iterationCount}次循环找到最左侧的数字: ${leftmostMatch.key} 坐标: (${leftmostMatch.x}, ${leftmostMatch.y})`);

            // 检查是否与上次找到的数字位置相同，或者坐标超出当前搜索区域
            if (leftmostMatch.x === lastFoundX ||
                leftmostMatch.x - lastFoundX <= 5 ||
                leftmostMatch.x < currentRegion[0] ||
                leftmostMatch.x >= currentRegion[0] + currentRegion[2]) {
                // console.log(`检测到问题坐标 (${leftmostMatch.x})，将搜索区域向右移动1像素`);

                // 检查搜索区域宽度是否已经小于等于0
                if (currentRegion[2] <= 0) {
                    // console.log("搜索区域宽度已经小于等于0，结束循环");
                    break;
                }

                // 将搜索区域向右移动1像素
                currentRegion[0] += 1;
                currentRegion[2] -= 1;
                // console.log(`调整后的搜索区域:`, currentRegion);

                // 更新上次找到的X坐标
                lastFoundX = leftmostMatch.x;
                continue; // 跳过本次循环，重新查找
            }

            // 更新上次找到的X坐标
            lastFoundX = leftmostMatch.x;

            // 添加到最终结果
            finalResults.push(leftmostMatch);

            // 更新搜索区域，排除已找到的部分
            let foundX = leftmostMatch.x;
            regionWidth = currentRegion[2] - (foundX + 1 - currentRegion[0]);
            // console.log(`找到数字的X坐标: ${foundX}，新剩余宽度: ${regionWidth}`);

            // 如果剩余区域宽度小于30，结束循环
            if (regionWidth < 30) {
                // console.log("剩余区域宽度小于30，结束循环");
                break;
            }

            // 更新搜索区域为已找到位置的右侧
            currentRegion = [
                foundX + 1,
                currentRegion[1],
                regionWidth,
                currentRegion[3]
            ];
            // console.log("更新后的搜索区域:", currentRegion);
        }

        // 按X坐标对最终结果进行排序
        finalResults.sort((a, b) => a.x - b.x);
        // console.log("最终识别结果:", finalResults.map(item => item.key).join(''));

        // 返回识别到的数字/符号的键值
        return finalResults.map(item => item.key).join('');
    } finally {
        // 如果是内部创建的截图，确保回收
        if (sc && typeof sc.recycle === "function") {
            try {
                sc.recycle();
            } catch (e) {
                console.error("回收截图资源失败:", e);
            }
        }
    }
}

//checkmenu 检查主菜单

/**
 * 持续检测是否成功进入主界面（通过菜单图标匹配）
 * @returns {boolean|null} - 检测到菜单返回 `true`，超过重试次数返回 `null`，图片加载失败时也返回 `null`
 * @throws {Error} 当截图或图片处理失败时抛出异常
 * @example
 * // 等待主界面出现（最长30秒）
 * if (checkmenu()) {
 *   console.log("已进入主界面，开始后续操作");
 * } else {
 *   console.log("进入主界面超时");
 * }
 */
function checkmenu() {
    const MAX_RETRY = 30; // 最大尝试次数（30秒）
    const RETRY_INTERVAL = 1000; // 每次检测间隔（毫秒）

    for (let i = 0; i < MAX_RETRY; i++) {
        let sc = null;

        try {
            // 获取截图
            sc = captureScreen();

            //新版界面
            let allMatch = findMC(["#f0e0d6", [-2, -28, "#fbf5f4"],
                [-20, -10, "#a24801"], [7, 30, "#f3bf41"]], sc, [1140, 570, 120, 130]);

            //老板界面
            let allMatch2 = findMC(["#fdf8f4", [5, 32, "#f2ded3"],
                [-17, 18, "#a44900"], [11, 54, "#f7c342"],
                [37, 26, "#a54b00"]], sc, [1140, 570, 120, 130]);

            if (allMatch || allMatch2) {
                log(`第 ${i + 1} 次检测: 已进入主界面`);
                showTip(`第 ${i + 1} 次检测: 已进入主界面`);
                return true;
            }
        } catch (e) {
            console.error("检测过程中出错:", e);
        } finally {
            // 确保截图资源被回收
            if (sc && typeof sc.recycle === "function") {
                try {
                    sc.recycle();
                } catch (e) {
                    console.error("回收截图资源失败:", e);
                }
                sc = null;
            }
        }

        //未找到则等待
        sleep(RETRY_INTERVAL);
        log(`第 ${i + 1} 次检测: 未找到菜单，继续等待...`);
        showTip(`第 ${i + 1} 次检测: 未找到菜单，继续等待...`);

        // 再次获取截图并处理
        sc = captureScreen();
        find_close(sc);

        // 确保截图资源被回收
        if (sc && typeof sc.recycle === "function") {
            try {
                sc.recycle();
            } catch (e) {
                console.error("回收截图资源失败:", e);
            }
            sc = null;
        }
    }

    // 超过最大重试次数
    log(`超过最大重试次数 ${MAX_RETRY} 次，未检测到主界面`);
    showTip(`超过最大重试次数 ${MAX_RETRY} 次，未检测到主界面`);
    home();
    // 尝试重启游戏
    log("尝试重启");
    restartgame();

}





//点击叉号
function close() {
    try {
        let close_button = findimage(files.join(config.photoPath, "close.png"), 0.5);
        if (close_button) {
            click(close_button.x + ran(), close_button.y + ran())
            console.log("点击叉叉")
            showTip("点击叉叉")
        } else {
            // click(2110, 125)
            // console.log("未识别到叉，点击默认坐标")

        }
    } catch (error) {
        log("close函数出错")
    }
}


//滑动
function huadong() {
    try {
        showTip("滑动寻找")
        //缩放
        gestures([0, 200, [420 + ran(), 133 + ran()], [860 + ran(), 133 + ran()]],
            [0, 200, [1000 + ran(), 133 + ran()], [860 + ran(), 133 + ran()]
            ]);
        sleep(200);
        //缩放
        gestures([0, 200, [420 + ran(), 250 + ran()], [860 + ran(), 250 + ran()]],
            [0, 200, [1000 + ran(), 250 + ran()], [860 + ran(), 250 + ran()]
            ]);
        sleep(100);
        //左滑
        swipe(300 + ran(), 125 + ran(), 980 + ran(), 720, 200);
        sleep(100)
        //左滑
        swipe(300 + ran(), 125 + ran(), 980 + ran(), 720, 200);
        sleep(100)
        //下滑
        gesture(1000, [650 + ran(), 580 + ran()],
            [630 + ran(), 270 + ran()],
        );
    } catch (error) {
        log(error)
    }
}

//找耕地，并点击
/**
 * 查找并点击商店附近的耕地位置
 * @param {boolean} isclick - 是否执行点击操作，默认为true
 * @returns {object|null} 返回耕地中心坐标对象{x,y}，若未找到商店则返回null
 * @description 该函数首先查找商店位置，然后根据商店位置计算相邻耕地坐标
 *              主要用于定位耕地位置
 */
function findland(isclick = true) {

    let pos_shop = findshop()

    if (pos_shop) {
        console.log("找到商店，点击耕地")
        // showTip("点击耕地");

        let center_land = {
            x: pos_shop.x + config.landOffset.x,
            y: pos_shop.y + config.landOffset.y,
        };
        if (isclick) {
            try {
                click(center_land.x, center_land.y); //100,-30
            } catch (error) {
                log(error);
            }
        }

        return center_land

    } else {
        return null;
    }
}
//找商店，只寻找

/**
 * 
 * @returns {object|boolean} 返回商店中心坐标对象{x,y}，若未找到商店则返回false
 * @description 该函数根据配置的查找方式（商店或面包房）定位对应位置
 *              主要用于辅助定位耕地位置
 */
function findshop() {
    console.log("找" + config.landFindMethod);
    let center;
    try {
        if (config.landFindMethod == "商店") {
            center = findimage(files.join(config.photoPath, "shop.png"), 0.6);
            if (!center) {
                center = findimage(files.join(config.photoPath, "shop1.png"), 0.6);
            }
            if (center) {
                //找到商店
                console.log("找到" + config.landFindMethod + "，坐标: " + center.x + "," + center.y,);
                return center;
            } else {
                console.log("未找到" + config.landFindMethod);
                //未找到商店;
                return false;
            }
        } else {
            center = findimage(files.join(config.photoPath, "bakery.png"), 0.6);
            if (!center) {
                center = findimage(files.join(config.photoPath, "bakery1.png"), 0.6);
            };
        };
    } catch (error) {
        log(error);
    }
    if (center) {
        console.log("找到" + config.landFindMethod + "，坐标: " + center.x + "," + center.y,);
        // 找到面包房
        return center;
    } else {
        console.log("未找到" + config.landFindMethod);
        // 未找到面包房
        return false;
    }
}
//打开路边小店
function openshop() {
    let maxAttempts = 2; // 最大尝试次数
    try {
        for (let i = 0; i < maxAttempts; i++) {
            let findshop_1 = findshop();
            if (findshop_1) {
                console.log("打开路边小店");
                showTip("打开路边小店");
                sleep(300);
                click(findshop_1.x + config.shopOffset.x + ran(), findshop_1.y + config.shopOffset.y + ran());
                return true; // 成功找到并点击
            }

            if (i < maxAttempts - 1) { // 如果不是最后一次尝试，就滑动重找
                console.log("未找到商店，尝试滑动重新寻找");
                showTip("未找到商店，尝试滑动重新寻找");
                sleep(1000);
                huadong();
                sleep(1100);
            }
        }
    } catch (error) {
        log(error);
    }
    console.log("多次尝试后仍未找到商店");
    showTip("多次尝试后仍未找到商店");
    return false; // 表示未能成功打开商店
};
//     try {
//         click(findshop_1.x + config.shopOffset.x, findshop_1.y + config.shopOffset.y)
//     } catch (e) {
//         console.log(e.message)
//     }


/**
*从头开始滑动找耕地并点击
*/
function findland_click() {

    huadong();
    sleep(1100)

    let findland_click_pos = findland()
    if (findland_click_pos) {
        return findland_click_pos
    } else {
        checkmenu()
    }
}

/**
 * 收割作物
 * @param {Object} center - 收割中心点坐标 {x: number, y: number}
 * @param {number} [rows=6] - 收割行数
 */
function harvest(center) {
    // 参数检查
    if (!center) {
        console.log("错误：center坐标无效");
        return;
    }

    //重复次数
    let rows = config.harvestRepeat;

    let center_land = findland(false);
    // 定义偏移量
    // 左移
    const L = {
        x: (config.harvestX + 2) * -36,
        y: (config.harvestX + 2) * -18
    };
    // 右移
    const R = {
        x: -L.x,
        y: -L.y
    };
    // 换行
    const S = {
        x: (config.harvestY + 2) * 36,
        y: (config.harvestY + 2) * -18
    };

    let pos1 = [config.firstland.x, config.firstland.y]
    let pos2 = config.distance
    // 安全坐标计算
    let pos_land = {
        x: center_land.x + pos1[0],
        y: center_land.y + pos1[1]
    }
    const safe = (x, y) => [
        Math.max(0, Math.min(x, device.width - 1)),
        Math.max(0, Math.min(y, device.height - 1))
    ];

    let harvestTime = config.harvestTime * 1000;

    // 构建第一组手势路径
    let firstGroup = [0, harvestTime, safe(center.x, center.y), safe(pos_land.x, pos_land.y)];

    // 构建第二组手势路径（Y偏移）
    let secondGroup = [0, harvestTime, safe(center.x, center.y), safe(pos_land.x, pos_land.y + pos2)];



    // 生成手势路径点
    try {
        for (let row = 1; row <= rows; row++) {

            // 第一组手势路径点
            firstGroup.push(
                safe(pos_land.x + row * L.x + (row - 1) * S.x + (row - 1) * R.x, pos_land.y + row * L.y + (row - 1) * R.y + (row - 1) * S.y),
                safe(pos_land.x + row * L.x + row * S.x + (row - 1) * R.x, pos_land.y + row * L.y + (row - 1) * R.y + row * S.y),
                safe(pos_land.x + row * L.x + row * S.x + row * R.x, pos_land.y + row * L.y + row * R.y + row * S.y)
            );

            // 第二组手势路径点（Y偏移）
            secondGroup.push(
                safe(pos_land.x + row * L.x + (row - 1) * S.x + (row - 1) * R.x, pos_land.y + row * L.y + (row - 1) * R.y + (row - 1) * S.y + pos2),
                safe(pos_land.x + row * L.x + row * S.x + (row - 1) * R.x, pos_land.y + row * L.y + (row - 1) * R.y + row * S.y + pos2),
                safe(pos_land.x + row * L.x + row * S.x + row * R.x, pos_land.y + row * L.y + row * R.y + row * S.y + pos2)
            );
        }
    } catch (error) {
        log(error);
    }

    // 执行手势
    // log(firstGroup, secondGroup)
    // log(config.harvestRepeat, config.harvestX, config.harvestY)
    gestures(firstGroup, secondGroup);
}

/**
 * 在屏幕上查找图片
 * @param {string|images.Image} imagepath 图片路径或图片对象
 * @param {number} xiangsidu 相似度阈值，0-1之间
 * @param {number} max_number 最大匹配数量
 * @param {images.Image} [screenImage] 可选，自定义传入的屏幕截图，如果不传入则自动截图
 * @returns {Array} 匹配到的坐标点数组
 */
function findimages(imagepath, xiangsidu, max_number, screenImage) {
    try {
        // 如果没有传入屏幕截图，则使用默认截图功能
        let sc;
        if (screenImage) {
            sc = screenImage;
            // console.log("使用传入的屏幕截图");
        } else {
            sc = captureScreen();
            // console.log("使用自动截图");
        }

        if (!sc) {
            console.log("截图失败");
            return [];
        }

        // 判断传入的是路径还是图片对象
        let picture;
        if (typeof imagepath === "string") {
            // 如果是字符串，当作文件路径处理
            picture = images.read(imagepath);
            if (!picture) {
                if (!screenImage) sc.recycle(); // 只有不是传入的截图才回收
                console.log("图片读取出错，请检查路径");
                return [];
            }
        } else {
            // 如果是图片对象，直接使用
            picture = imagepath;
            if (!picture) {
                if (!screenImage) sc.recycle(); // 只有不是传入的截图才回收
                console.log("图片对象无效");
                return [];
            }
        }

        let results = images.matchTemplate(sc, picture, {
            max: max_number,
            threshold: xiangsidu
        }).matches || [];
        const results1 = [];

        if (results.length > 0) {
            // 提取所有坐标
            results.forEach((match, index) => {
                let {
                    x,
                    y
                } = match.point;
                console.log(`目标${index + 1}: (${x}, ${y})`);
                //click(x, y);
                results1.push({
                    x,
                    y
                })
            });
        } else {
            console.log("多图识别调用：未找到目标");
        }

        // 如果是通过路径读取的图片，才需要回收
        if (typeof imagepath === "string") {
            picture.recycle();
        }

        // 如果不是传入的截图，才需要回收
        if (!screenImage) {
            sc.recycle();
        }
    } catch (error) {
        log(error);
    }

    return results1;

}

function harvest_wheat() {

    sleep(1000)
    let center_sickle = findMC(["#c6b65d", [-9, 9, "#b5984d"], [39, -1, "#ffdf7c"], [10, -62, "#f3f2f6"], [55, -72, "#e5e5e6"]]);
    if (center_sickle) {
        console.log("找到镰刀,准备收割，坐标: " +
            center_sickle.x + "," + center_sickle.y);
        showTip("找到镰刀，准备收割");
    } else {
        console.log("未找到镰刀");
        showTip("未找到镰刀");
    };
    sleep(500);
    try {
        harvest(center_sickle);
    } catch (e) {
        console.error("收割harvest出错:", e);
    }
    sleep(300);
    let sc = captureScreen();
    find_close(sc);
    sc.recycle();
}

//收金币
function coin() {
    console.log("收金币");
    // showTip("收金币");
    let allcenters = [];
    let sc = captureScreen();
    let centers1 = findimages(files.join(config.photoPath, "shopsold1.png"), 0.8, 10, sc);
    let centers2 = findimages(files.join(config.photoPath, "shopsold2.png"), 0.8, 10, sc);
    let centers3 = findimages(files.join(config.photoPath, "shopSold3.png"), 0.8, 10, sc);

    // 合并所有点并过滤距离过近的点
    let allPoints = centers1.concat(centers2, centers3);
    let filteredPoints = [];

    try {
        for (let i = 0; i < allPoints.length; i++) {
            let shouldKeep = true;
            // 检查当前点是否与已保留的点距离过近
            for (let j = 0; j < filteredPoints.length; j++) {
                let dx = Math.abs(allPoints[i].x - filteredPoints[j].x);
                let dy = Math.abs(allPoints[i].y - filteredPoints[j].y);
                // 如果x和y坐标差值都小于20，则排除当前点
                if (dx < 20 && dy < 20) {
                    shouldKeep = false;
                    break;
                }
            }
            // 如果没有距离过近的点，则保留当前点
            if (shouldKeep) {
                filteredPoints.push(allPoints[i]);
            }
        }

        allcenters = allcenters.concat(filteredPoints);
        allcenters.sort((a, b) => a.x - b.x);
        console.log("有" + allcenters.length + "个金币可以收");
        // console.log(allcenters)
        if (allcenters.length > 0) {
            showTip("有" + allcenters.length + "个金币可以收")
        }
        allcenters.forEach(target => {
            let pos = [48, 60];
            click(target.x + pos[0] + ran(), target.y + pos[1] + ran());
            // sleep(10);
        });
    } catch (error) {
        log(error);
    }
}


//商店货架寻找小麦，发布广告
function find_ad() {
    let shop_coin = findMC(["#fffabb", [83, -17, "#fff27d"], [80, -3, "#ffe718"], [-73, 22, "#f7cd88"]],
        null, null, 16);
    try {
        if (shop_coin) {
            //如果找到货架上的金币
            let [x1, y1] = [-58, -23];
            click(shop_coin.x + x1 + ran(), shop_coin.y + y1 + ran()); //点击金币
            sleep(300);
            let ad = matchColor([{ x: 765, y: 423, color: "#fbba15" }, { x: 496, y: 499, color: "#cbcbcb" }]);
            if (ad) {
                console.log("可以发布广告");
                click(800 + ran(), 330 + ran());
                sleep(300);
                click(640 + ran(), 500 + ran());
                return true;
            }
        } else {
            console.log("发布广告时未找到可上架物品");
            showTip("发布广告时未找到可上架物品");
            return false;
        }
    } catch (error) {
        log(error)
    }
}



//商店售卖
function shop() {
    try {
        console.log("当前操作:商店");
        showTip("商店售卖");
        sleep(300);
        coin();
        sleep(1000);
        let shopEnd = false;
        let shopisswipe = false;
        let maxAttempts = 5; // 最大尝试次数
        let attempts = 0; // 当前尝试次数

        // 检查是否还在商店界面
        if (!matchColor([{ x: 120, y: 70, color: "#fc5134" }, { x: 177, y: 76, color: "#fefefd" }, { x: 263, y: 72, color: "#fd5335" }])) {
            console.log("未检测到商店界面，可能已关闭");
            return;
        }

        while (!shopEnd && attempts < maxAttempts) {
            // 每次循环开始时检查是否还在商店界面
            // if (!matchColor([{ x: 120, y: 70, color: "#fc5134" }, { x: 177, y: 76, color: "#fefefd" }, { x: 263, y: 72, color: "#fd5335" }])) {
            //     console.log("商店界面已关闭，退出循环");
            //     return;
            // }
            if (shopisswipe) {
                shopEnd = matchColor([{ x: 990, y: 292, color: "#cccccc" }]);
                if (shopEnd) {
                    log("右滑到顶了");
                    showTip("右滑到顶了");
                }
            }
            sleep(500);
            //找空闲货架
            let kongxian = findMC(["#f1e044", [15, -2, "#7b593d"], [-8, 57, "#e4ad3d"], [-10, 67, "#f7ce8d"]], null, [160, 130, 1100 - 160, 600 - 130], 20);

            if (kongxian) { //有空闲货架点击上架
                console.log("找到空闲货架");
                showTip("找到空闲货架");
                click(kongxian.x + ran(), kongxian.y + ran()); //点击空闲货架
                console.log("点击空闲货架")
                sleep(100);
                click(200 + ran(), 200 + ran());//点击售卖粮仓按钮

                console.log("点击粮仓按钮")
                sleep(100);

                let wheat_sail = findMC(crop_sail, null, [270, 120, 650 - 270, 680 - 120], 16);

                // let wheat = images.findImage(
                //     captureScreen(), wheat_sail, {
                //         threshold: 0.3,
                //         region: [700, 200, 700, 900]
                //     });
                if (wheat_sail) {   //找到售卖货架上的作物

                    click(wheat_sail.x + ran(), wheat_sail.y + ran()); //点击小麦
                    console.log("点击" + config.selectedCrop.text);
                    // showTip("点击"+config.selectedCrop.text);

                    //识别数量(1650,270),(1760,410)
                    sleep(300);
                    // let num10 = findimage(files.join(config.photoPath, "10.png"), 0.6); //识别小麦数量
                    let num10 = matchColor([{ x: 847, y: 195, color: "#000000" },
                    { x: 860, y: 189, color: "#10100f" },
                    { x: 856, y: 231, color: "#000000" },
                    { x: 909, y: 230, color: "#000000" },
                    { x: 875, y: 208, color: "#faf4d7" },
                    { x: 861, y: 209, color: "#5e5c51" }
                    ])
                    if (num10) {
                        console.log(config.selectedCrop.text + "数量≥20");
                        console.log("修改售价");
                        if (config.shopPrice.code == 0) {
                            click(860 + ran(), 360 + ran());//修改售价(最低)

                        } else if (config.shopPrice.code == 2) {
                            click(1020 + ran(), 370 + ran());//修改售价(最高)
                        }
                        sleep(100);
                        click(940 + ran(), 660 + ran());
                        //上架
                        console.log("上架");
                        sleep(100);
                        kongxian = findMC(["#f1e044", [15, -2, "#7b593d"], [-8, 57, "#e4ad3d"], [-10, 67, "#f7ce8d"]], null, [160, 130, 1100 - 160, 600 - 130]);
                    } else {
                        console.log(config.selectedCrop.text + "数量不足20,结束售卖");
                        showTip(config.selectedCrop.text + "数量不足20,结束售卖");
                        close();
                        log(config.selectedCrop.text + "数量不足，退出售卖");
                        break;
                    }
                } else {   //没找到售卖货架上的作物
                    console.log("未识别到" + config.selectedCrop.text);
                    showTip("未识别到" + config.selectedCrop.text);
                    // toast("未识别到小麦")
                    close();
                    break;
                }
            } else {    //没有空闲货架
                console.log("未找到空闲货架");
                showTip("未找到空闲货架");
                attempts++;
                sleep(200)
                const [x1, y1] = [960, 390];
                const [x2, y2] = [288, 390];
                swipe(x1 + ran(), y1 + ran(), x2 + ran(), y2 + ran(), 600);
                console.log("商店右滑")
                sleep(400);
                coin();
                shopisswipe = true;
            }

        }
        console.log("发布广告");
        showTip("发布广告");
        sleep(300);
        coin();
        sleep(500);
        let shop_coin = findMC(["#fffabb", [83, -17, "#fff27d"], [80, -3, "#ffe718"], [-73, 22, "#f7cd88"]],
            null, null, 16);
        if (shop_coin) {
            //如果找到货架上的金币

            click(shop_coin.x + ran(), shop_coin.y + ran()); //点击可上架物品
            log("发布广告：点击" + config.selectedCrop.text)
            sleep(300);

            let ad = matchColor([{ x: 750, y: 420, color: "#fff9db" }]);
            if (!ad) {
                console.log("可以发布广告");
                click(800 + ran(), 330 + ran());
                sleep(100);
                click(640 + ran(), 500 + ran());
                sleep(200);
                close();
            } else {
                console.log("广告正在冷却或已发布广告");
                showTip("广告正在冷却或已发布广告");
                sleep(200);
                close();
                sleep(100);
            }
        } else {  //如果没有找到货架上的物品
            coin();
            sleep(500);
            let is_find_ad = find_ad();
            log("发布广告：没找到货架上的物品");
            if (!is_find_ad) {
                const [x3, y3] = [288, 390];
                const [x4, y4] = [1080, 390];
                swipe(x3 + ran(), y3 + ran(), x4 + ran(), y4 + ran(), 600);
                sleep(400);
                is_find_ad = find_ad();
                if (!is_find_ad) {
                    console.log("未能发布广告")
                    sleep(200)
                    close();
                    sleep(100);
                }
                sleep(200);
                close();
            } else {
                sleep(200);
                close();
            }
        }
        sleep(200);
        find_close();
        sleep(300);
        find_close();
    } catch (e) {
        console.error("shop函数出错:", e);
        showTip("商店操作出错，已跳过");
    } finally {
        // 确保关闭所有可能的弹窗
        sleep(200);
        find_close();
        sleep(300);
        find_close();
    }
}

/**
 * @returns 如果找到并处理了关闭按钮或返回主界面，返回 `true`；否则返回 `false`
 * 寻找是否有关闭按钮或者在其他页面
 */
function find_close(screenshot1, action = null) {
    try {
        let sc = screenshot1 || captureScreen();

        //识别叉叉
        let close_button = findimage(files.join(config.photoPath, "close.png"), 0.8, sc);//大×
        if (!close_button) {
            close_button = findimage(files.join(config.photoPath, "close1.png"), 0.8, sc);//小×
        }
        if (!close_button) {
            close_button = findimage(files.join(config.photoPath, "close2.png"), 0.8, sc);//中×
        }
        if (close_button) {
            click(close_button.x + ran(), close_button.y + ran());
            console.log("点击叉叉");
            showTip("点击叉叉");
            return true;
        }

        //进入小镇，鱼塘，其他农场
        let homebtn1 = findMC(["#62d365", [-5, -12, "#c787db"], [1, 11, "#55cf58"]],
            screenshot = sc, [0, 600, 240, 110]);
        if (homebtn1) {
            click(homebtn1.x - 30 + ran(), homebtn1.y + ran());
            console.log("当前在其他界面，回到主界面");
            showTip("当前在其他界面，回到主界面");
            checkmenu();
            return true;
        }

        //升级
        let levelup = matchColor([{ x: 292, y: 98, color: "#ffffff" },
        { x: 520, y: 93, color: "#88e435" },
        { x: 754, y: 89, color: "#89e534" },
        { x: 861, y: 654, color: "#f6bc3a" },
        { x: 1076, y: 627, color: "#00b7ff" }],
            screenshot = sc);
        if (levelup) {
            log("升级了！")
            showTip("升级了！")
            click(637 + ran(), 642 + ran());
            sleep(2000);
            // 添加新线程实现控件点击，点击不再询问
            threads.start(function () {
                let count = 0;
                while (count < 10) {
                    click("不再询问")
                    console.log("线程执行中，第" + (count + 1) + "次尝试点击控件");
                    sleep(1000);
                    count++;
                }
                console.log("线程执行完毕，已达到最大循环次数");
            });

            find_close();
            return "levelup";
        }

        //改善游戏体验界面
        let improve = matchColor([{ x: 102, y: 194, color: "#8fda38" },
        { x: 141, y: 192, color: "#8fda38" }, { x: 162, y: 183, color: "#fae12c" },
        { x: 316, y: 200, color: "#fff9db" }, { x: 797, y: 572, color: "#f5ba38" }],
            screenshot = sc);
        if (improve) {
            log("改善游戏体验界面");
            showTip("改善游戏体验界面");
            click(930 + ran(), 570 + ran());
        }

        //进入设计节界面
        let design_1 = matchColor([{ x: 1223, y: 548, color: "#383d40" },
        { x: 1231, y: 570, color: "#392910" }, { x: 1237, y: 586, color: "#3d2e00" },
        { x: 1229, y: 599, color: "#40403d" }, { x: 1205, y: 666, color: "#3f2e00" },
        { x: 1221, y: 685, color: "#403f3a" }],
            screenshot = sc);
        let design_2 = matchColor([{ x: 1231, y: 546, color: "#ddf3fe" },
        { x: 1223, y: 572, color: "#e8a83e" }, { x: 1228, y: 599, color: "#fffff3" },
        { x: 1207, y: 665, color: "#fabc00" }, { x: 1221, y: 681, color: "#fffbec" }],
            sccreenshot = sc);
        if (design_1 || design_2) {
            log("进入设计节界面");
            showTip("进入设计节界面");
            if (matchColor([{ x: 721, y: 530, color: "#f6c445" }, { x: 1028, y: 530, color: "#f6be3e" }])) {
                click(860 + ran(), 530 + ran());
                sleep(1000);
                click(860 + ran(), 530 + ran());
                sleep(1000);
                click(860 + ran(), 530 + ran());
                sleep(1000);
                click(1080 + ran(), 90 + ran());
                sleep(1000);

            }
            click(60, 490 + ran());
        }

        //断开连接
        let disconnect = matchColor([{ x: 279, y: 222, color: "#fff9db" },
        { x: 435, y: 62, color: "#deb476" },
        { x: 630, y: 202, color: "#ffe9d6" },
        { x: 647, y: 632, color: "#fada75" }],
            screenshot = sc);
        if (disconnect) {
            console.log("断开连接，重试");
            showTip("断开连接，重试");
            click(640 + ran(), 660 + ran())
            sleep(1000);
            checkmenu();
            return true;
        }

        //切换账号页面
        if (!action || !action.includes("except_switchAccount")) {
            let switchAccount = matchColor([{ x: 100, y: 692, color: "#48a1d1" },
            { x: 100, y: 300, color: "#194a96" },
            { x: 56, y: 63, color: "#ffffff" },
            { x: 445, y: 358, color: "#ffffff" }],
                screenshot = sc);
            if (switchAccount) {
                console.log("切换账号界面，返回主菜单");
                showTip("切换账号界面，返回主菜单");
                click(56 + ran(), 63 + ran());
                sleep(800);
                click(1150 + ran(), 70 + ran());
                return true;
            }
        }

        //进入购买界面
        let buy_button = matchColor([{ x: 679, y: 578, color: "#7bbfe4" },
        { x: 648, y: 612, color: "#f0d98a" },
        { x: 682, y: 683, color: "#f4bd3f" }],
            screenshot = sc)
        if (buy_button) {
            console.log("进入购买界面，返回主菜单");
            showTip("进入购买界面，返回主菜单");
            click(650 + ran(), 620 + ran());
            return true;
        }

        //识别稻草人，左边肩膀，乌鸦身子，脚
        let daocaoren = matchColor([{ x: 86, y: 406, color: "#bbb2e7" },
        { x: 166, y: 372, color: "#282b38" },
        { x: 162, y: 394, color: "#ce9b00" }],
            screenshot = sc);
        if (daocaoren) {
            log("识别到稻草人");
            showTip("识别到稻草人");
            click(1055 + ran(), 600 + ran());
            jiaocheng();
            return true;
        }

        let tiaoguo = matchColor([{ x: 1044, y: 624, color: "#f6cd4f" }, { x: 994, y: 608, color: "#ffffff" }, { x: 1002, y: 624, color: "#ffffff" },
        { x: 994, y: 638, color: "#ffffff" }, { x: 984, y: 626, color: "#f7b430" }, { x: 1218, y: 626, color: "#f6b22c" }],
            screenshot = sc);
        if (tiaoguo) {
            log("加载界面:跳过");
            showTip("加载界面:跳过");
            click(1100 + ran(), 630 + ran());
            return true;
        }

        return false;
    } catch (e) {
        console.error("find_close函数出错:", e);
        return false;
    }
}

/*需要点击的教程
11级农场勋章
14级汤姆有动画
20级礼券
*/
/**
 * 
 * @param {*} 
 */
function jiaocheng() {
    try {
        sleep(1000);
        let tryNum = 0;
        while (true) {
            for (let i = 0; i < 5; i++) {
                let sc = captureScreen();
                //识别稻草人
                let daocaoren = matchColor([{ x: 86, y: 406, color: "#bbb2e7" },
                { x: 166, y: 372, color: "#282b38" },
                { x: 162, y: 394, color: "#ce9b00" }], sc);
                //识别到绿色按钮
                let greenButton = matchColor([{ x: 1075, y: 571, color: "#70bb55" },
                { x: 1096, y: 599, color: "#6ab952" }, { x: 1123, y: 559, color: "#73be52" },
                { x: 1097, y: 541, color: "#f7e160" }, { x: 1149, y: 597, color: "#f7c439" },
                { x: 1065, y: 624, color: "#f7c13c" }], sc);
                if (daocaoren) {
                    log("识别到稻草人，点击");
                    showTip("识别到稻草人，点击");
                    click(1055 + ran(), 600 + ran());
                    i = 0; //重置i
                } else if (greenButton) {
                    log("点击绿色按钮");
                    showTip("点击绿色按钮");
                    click(1100 + ran(), 600 + ran());
                    i = 0; //重置i
                } else {
                    log(`第${i}次未识别到教程界面`);
                    showTip(`第${i}次未识别到教程界面`)
                }
                find_close(sc);
                sleep(1000);

            }
            //识别主界面
            sleep(1000);
            let sc = captureScreen();
            //新版界面
            let allMatch = matchColor([{ x: 47, y: 177, color: "#ffffff" },
            { x: 70, y: 662, color: "#2664aa" },
            { x: 1213, y: 661, color: "#f2ded3" }], sc);

            //老板界面
            let allMatch2 = matchColor([{ x: 39, y: 177, color: "#ffffff" },
            { x: 68, y: 654, color: "#2662a9" },
            { x: 1208, y: 659, color: "#f0e0d6" }], sc);

            if (allMatch || allMatch2) {
                log(`教程：已进入主界面`);
                showTip(`教程：已进入主界面`);
                break;
            } else {
                log(`教程：未进入主界面`);
                showTip(`教程：未进入主界面`);
                tryNum++;
            }
            if (tryNum > 3) {
                log(`教程：超过最大尝试次数，重进游戏`);
                showTip(`教程：超过最大尝试次数，重进游戏`);
                restartgame();
            }
            sleep(1000);
        }
    } catch (e) {
        console.error("jiaocheng函数出错:", e);
        showTip("教程处理出错，已跳过");
    } finally {
        // 确保关闭所有可能的弹窗
        sleep(200);
        find_close();
    }
}

function switch_account(Account) {
    try {
        let num = 0;
        while (true) {
            console.log("切换账号" + Account);
            showTip("切换账号" + Account);
            sleep(700)

            find_close();
            sleep(300);

            let sc = captureScreen();
            //新版界面
            let huanhao1 = findMC(["#ffffff", [-19, -9, "#ffffff"],
                [23, 6, "#fcbd00"], [3, 26, "#f4c000"], [-16, 16, "#fffbf7"]]
                , sc, [0, 0, 200, 250])

            if (huanhao1) {
                click(huanhao1.x + ran(), huanhao1.y + ran());
            }
            sleep(700);
            let huanhao2 = findMC(["#fefdfc", [4, 17, "#f6bd3c"], [-11, 18, "#fffefe"],
                [-33, 18, "#fefdfc"], [-14, -3, "#f7c247"], [-26, -1, "#f7bc3f"],
                [-38, -15, "#fefdfc"]], null, [0, 0, 430, 600]);

            if (!huanhao2) {
                if (num < 3) {
                    num++
                    console.log(`未识别到切换账号2按钮，重试第${num}次`)
                    sleep(3000);
                    find_close();
                    sleep(200);
                    find_close();
                    continue;
                } else {
                    console.log("超过最大尝试次数，重进游戏")
                    restartgame();
                    return num; // 重启游戏后返回
                }
            }
            click(225 + ran(), 404 + ran());
            sleep(800);
            let huanhao3 = findMC(["#ee434e", [-43, 4, "#fbc239"], [-404, 116, "#3c77da"],
                [-422, 114, "#ffffff"], [-386, 116, "#ffffff"], [-249, 114, "#4079dc"]]);

            if (!huanhao3) {
                if (num < 3) {
                    num++
                    console.log(`未识别到切换账号按钮，重试第${num}次`)
                    sleep(3000);
                    find_close();
                    sleep(200);
                    find_close();
                    // 继续循环而不是递归调用
                    continue;
                } else {
                    console.log("超过最大尝试次数，重进游戏")
                    restartgame();
                    return num; // 重启游戏后返回
                }
            }
            click(750 + ran(), 175 + ran());
            let findAccountMenuNum = 0;    //寻找账号菜单次数
            while (true) {
                findAccountMenuNum++;
                if (findAccountMenuNum > 8 && num < 3) {
                    num++
                    console.log(`未识别到切换账号界面，重试第${num}次`)
                    showTip(`未识别到切换账号界面，重试第${num}次`)
                    sleep(3000);
                    find_close(null, ["except_switchAccount"]);
                    sleep(200);
                    find_close(null, ["except_switchAccount"]);
                    continue;
                } else if (findAccountMenuNum > 8 && num >= 3) {
                    console.log("重试次数过多，重进游戏");
                    showTip("重试次数过多，重进游戏");
                    restartgame();
                    return num; // 重启游戏后返回
                }
                if (matchColor([{ x: 100, y: 692, color: "#48a1d1" },
                { x: 100, y: 300, color: "#194a96" },
                { x: 56, y: 63, color: "#ffffff" },
                { x: 445, y: 358, color: "#ffffff" }])) {
                    break;
                }
                sleep(1000);
            }

            const MAX_SCROLL_DOWN = 15; // 最多下滑3次
            const MAX_SCROLL_UP = 2; // 最多上滑2次

            let found = false; // 是否找到目标
            let scrollDownCount = 0; // 当前下滑次数
            let scrollUpCount = 0; // 当前上滑次数
            let isEnd = false;
            let AccountIma = null;
            let AccountText = null;
            if (config.findAccountMethod == "image") {
                AccountIma = files.join(config.photoPath, Account + ".png");
            } else if (config.findAccountMethod == "ocr") {
                AccountText = Account;
            }
            while (!found) {
                sleep(500);
                let is_find_Account = null;
                if (config.findAccountMethod == "image") {
                    is_find_Account = findimage(AccountIma, 0.9);
                };
                if (config.findAccountMethod == "ocr") {
                    is_find_Account = findtext(AccountText, 640, 0);
                }

                if (is_find_Account) { //如果找到账号名称，则点击
                    log(`找到账号${Account}`);
                    showTip(`找到账号${Account}`);
                    sleep(500);
                    click(is_find_Account.x + ran(), is_find_Account.y + ran());
                    sleep(500);
                    found = true;
                    break;
                }
                if (scrollDownCount < MAX_SCROLL_DOWN && !isEnd) {
                    const [x1, y1] = [960, 600];
                    const [x2, y2] = [960, 300];//原960,60
                    swipe(x1 + ran(), y1 + ran(), x2 + ran(), y2 + ran(), [500]); // 下滑
                    scrollDownCount++;
                    log(`未找到账号，第 ${scrollDownCount} 次下滑...`);
                    showTip(`未找到账号，第 ${scrollDownCount} 次下滑...`);
                    sleep(1500);
                    if (findMC(["#000000", [-16, -8, "#ffffff"], [1, -40, "#2d85f3"], [-55, -6, "#ffffff"]])) {
                        log("滑到底了");
                        showTip("滑到底了");
                        isEnd = true;
                    }
                    continue;
                }
                else if (scrollUpCount > MAX_SCROLL_UP) {
                    log("未找到目标账号，重启游戏");
                    show("未找到目标账号，重启游戏");
                    restartgame();
                    return num; // 重启游戏后返回
                }
                // 1270,0
                else if (scrollDownCount >= MAX_SCROLL_DOWN || isEnd) {
                    log(`未找到账号，上滑回顶部...`);
                    showTip("未找到账号，上滑回顶部");
                    const [x3, y3] = [960, 60];
                    const [x4, y4] = [960, 600];
                    let scrollup = 0; //上滑次数
                    while (!findMC(["#000000", [-221, -1, "#f2f2f2"], [-384, -1, "#041e54"], [315, 5, "#2d85f3"]], null, [0, 0, 1270, 150]) || scrollup < 10) {
                        swipe(x3 + ran(), y3 + ran(), x4 + ran(), y4 + ran(), [500]); // 上划
                        sleep(200);
                        scrollup++;
                    }
                    scrollDownCount = 0;
                    scrollUpCount++;
                    isEnd = false;
                } else {

                }
            }
            break; // 找到账号并成功切换后退出外层循环


        }

        sleep(2000);
        checkmenu();
        return num;
    } catch (e) {
        console.error("switch_account函数出错:", e);
        showTip("切换账号出错，已跳过");
        return 0;
    } finally {
        // 确保关闭所有可能的弹窗
        sleep(200);
        find_close();
    }
}

/**
 * 
 */
function shengcang() {
    console.log("当前操作:升仓");
    showTip("升级仓库");
    //升粮仓
    sleep(500);
    try {
        let isFindShop = findshop();
        if (isFindShop) {  //判断是否找到商店
            console.log("点击粮仓");
            showTip("点击粮仓");
            click(isFindShop.x + config.liangcangOffset.x + ran(), isFindShop.y + config.liangcangOffset.y + ran()); //点击粮仓
            sleep(500);
            if (matchColor([{ x: 1140, y: 66, color: "#ee434e" }])) {  //判断是否进入粮仓
                click(700 + ran(), 625 + ran());
                sleep(500);
                if (matchColor([{ x: 932, y: 414, color: "#69b850" }])) {  //判断是否可以升级
                    click(932 + ran(), 408 + ran());//点击升级
                    sleep(500);
                    find_close();
                    sleep(500);
                    find_close();
                } else {    //建材不够升级
                    console.log("建材不够升级");
                    showTip("建材不够升级");
                    sleep(500);
                    find_close();
                    sleep(500);
                    find_close();
                }
            } else {  //未进入粮仓
                console.log("未进入粮仓");
                showTip("未进入粮仓");
                find_close()
            }
        } else {  //未找到商店
            console.log("未找到商店");
            showTip("未找到商店");
            find_close();
        }

        //升货仓
        sleep(500);
        isFindShop = findshop();
        if (isFindShop) {  //判断是否找到商店
            console.log("点击货仓");
            showTip("点击货仓");
            click(isFindShop.x + config.huocangOffset.x + ran(), isFindShop.y + config.huocangOffset.y + ran()); //点击货仓
            sleep(500);
            if (matchColor([{ x: 1140, y: 66, color: "#ee434e" }])) {  //判断是否进入货仓
                click(700 + ran(), 625 + ran());
                sleep(500);
                if (matchColor([{ x: 932, y: 414, color: "#69b850" }])) {  //判断是否可以升级
                    click(932 + ran(), 408 + ran());//点击升级
                    sleep(500);
                    find_close();
                    sleep(500);
                    find_close();
                } else {    //建材不够升级
                    console.log("建材不够升级");
                    showTip("建材不够升级");
                    sleep(500);
                    find_close();
                    sleep(500);
                    find_close();
                }
            } else {  //未进入粮仓
                console.log("未进入货仓");
                showTip("未进入货仓");
                find_close()
            }
        } else {  //未找到商店
            console.log("未找到商店");
            showTip("未找到商店");
            find_close();
        }

    } catch (e) {
        console.error("shengcang函数出错:", e);
        showTip("升仓操作出错，已跳过");
    } finally {
        // 确保关闭所有可能的弹窗
        sleep(200);
        find_close();
    }
}

/**
 * 启动一个新的计时器
 * @param {string} timer_Name - 计时器的唯一标识名称（用于区分不同计时器）
 * @param {number} [seconds=120] - 计时时长（单位：秒，默认120秒）
 */
function timer(timer_Name, seconds = 120) {
    try {

        // 计算结束时间（当前时间 + 需要计时的时间）
        let currentTime = new Date().getTime();
        let startTime = currentTime;
        let duration = seconds;
        let endTime = currentTime + seconds * 1000;

        // 保存计时器信息到存储中
        timeStorage.put(timer_Name, {
            startTime: startTime,
            duration: duration,
            endTime: endTime
        });
    } catch (e) {
        console.error("timer函数出错:", e);
        showTip("计时器操作出错，已跳过");
    }
}

// 获取特定计时器的状态
function getTimerState(timer_Name) {
    try {

        // 从存储中获取计时器信息
        const timerInfo = timeStorage.get(timer_Name);
        if (!timerInfo) {
            return null;
        }

        // 获取当前时间
        const currentTime = new Date().getTime();

        // 计算剩余时间
        const remainingTime = Math.max(0, Math.ceil((timerInfo.endTime - currentTime) / 1000));

        return remainingTime;
    } catch (e) {
        console.error("getTimerState函数出错:", e);
        showTip("获取计时器状态出错，已跳过");
        return null;
    }
}

// 停止计时器
function stopTimer(timer_Name) {
    try {

        // 从存储中删除计时器信息
        if (timeStorage.contains(timer_Name)) {
            timeStorage.remove(timer_Name);
            log(`已停止计时器: ${timer_Name}`);
        } else {
            log(`未找到计时器: ${timer_Name}`);
        }
    } catch (e) {
        console.error("stopTimer函数出错:", e);
        showTip("停止计时器出错，已跳过");
    }
}


function plantCrop() {
    try {
        //种小麦
        console.log("准备种" + config.selectedCrop.text);
        showTip(`准备种${config.selectedCrop.text}`);
        sleep(500)
        let center_wheat = findMC(crop);
        if (center_wheat) {
            console.log("找到" + config.selectedCrop.text + "，坐标: " +
                center_wheat.x + "," + center_wheat.y);
        } else {
            console.log("未找到" + config.selectedCrop.text);
            showTip("未找到" + config.selectedCrop.text);
            let next_button = findMC(["#ffffff", [17, -1, "#ffffff"], [31, 0, "#fdbe00"], [10, 12, "#ffffff"],
                [-13, 12, "#ffffff"], [-11, -15, "#ffffff"], [-3, -17, "#f5dd38"], [-2, 23, "#f5c200"],
                [31, 4, "#fdbb00"], [32, 30, "#fffcf0"], [-18, 1, "#fac400"], [-25, 3, "#fcbb00"]]);

            if (next_button) {
                let maxTries = 10;
                let tries = 0;
                while (tries < maxTries && next_button) {
                    next_button = findMC(["#ffffff", [17, -1, "#ffffff"], [31, 0, "#fdbe00"], [10, 12, "#ffffff"],
                        [-13, 12, "#ffffff"], [-11, -15, "#ffffff"], [-3, -17, "#f5dd38"], [-2, 23, "#f5c200"],
                        [31, 4, "#fdbb00"], [32, 30, "#fffcf0"], [-18, 1, "#fac400"], [-25, 3, "#fcbb00"]]);
                    click(next_button.x + ran(), next_button.y + ran());
                    sleep(1000);
                    center_wheat = findMC(crop);
                    if (center_wheat) {
                        break;
                    }
                }
                if (tries >= maxTries) {
                    log("种植时未能找到作物，退出操作");
                    return false;
                }
                if (!next_button) {
                    log("未找到下一个按钮，检查界面");
                    let close = find_close();
                    if (close == "levelup") {
                        sleep(500);
                        plantCrop();
                    }
                } else {
                    let close = find_close();
                    if (close == "levelup") {
                        log("因为升级，重新种植");
                        plantCrop();
                    }
                }
            }
        }
    } catch (e) {
        console.error("plantCrop函数出错:", e);
        showTip("种植作物出错，已跳过");
    } finally {
        // 确保关闭所有可能的弹窗
        sleep(200);
        find_close();
    }
}

//循环操作
function operation(Account) {
    //收小麦
    let sc1 = captureScreen();
    find_close(sc1);
    sleep(200);
    let is_findland = findland();
    if (!is_findland) {
        findland_click();
    }
    console.log("收割" + config.selectedCrop.text);
    showTip(`收割${config.selectedCrop.text}`);
    harvest_wheat();

    //找耕地
    sleep(1500);
    if (find_close()) {
        sleep(500);
        find_close();
        sleep(500);
    }

    center_land = findland();
    console.log("寻找耕地");
    //找不到重新找耕地
    if (!center_land) {
        console.log("未找到，重新寻找耕地");
        if (find_close()) {
            sleep(500);
            find_close();
            sleep(500);
        }
        findland_click();
    }


    //种小麦
    console.log("准备种" + config.selectedCrop.text);
    showTip(`准备种${config.selectedCrop.text}`);
    sleep(500)
    let center_wheat = findMC(crop);
    if (center_wheat) {
        console.log("找到" + config.selectedCrop.text + "，坐标: " +
            center_wheat.x + "," + center_wheat.y);
    } else {
        console.log("未找到" + config.selectedCrop.text);
        showTip("未找到" + config.selectedCrop.text);
        let next_button = findMC(["#ffffff",
            [-30, 12, "#ffffff"], [-17, 28, "#f5bd00"],
            [-242, 28, "#f5bd00"], [-257, 0, "#ffffff"]]);

        if (next_button) {
            let maxTries = 10;
            let tries = 0;
            while (tries < maxTries && next_button) {
                next_button = findMC(["#ffffff",
                    [-30, 12, "#ffffff"], [-17, 28, "#f5bd00"],
                    [-242, 28, "#f5bd00"], [-257, 0, "#ffffff"]]);
                if (next_button) {
                    click(next_button.x + ran(), next_button.y + ran());
                    log("点击下一页按钮");
                    showTip("点击下一页按钮");
                }

                sleep(1000);
                center_wheat = findMC(crop);
                if (center_wheat) {
                    break;
                }
            }
            if (tries >= maxTries) {
                log("种植时未能找到作物，退出操作");
                return false;
            }
            if (!next_button) {
                log("未找到下一个按钮，检查界面");
                let close = find_close();
                if (close == "levelup") {
                    log("因为升级，重新种植");
                    plantCrop();
                }
            }
        } else {
            let close = find_close();
            if (close == "levelup") {
                log("因为升级，重新种植");
                plantCrop();
            }
        }
    }
    // sleep(500);
    console.log("种" + config.selectedCrop.text);
    showTip(`种${config.selectedCrop.text}`);
    try {
        harvest(center_wheat);
    } catch (e) {
        console.error("种植harvest出错:", e);
    }
    //设定计时器
    let timerName = config.switchAccount ? Account + "计时器" : config.selectedCrop.text;
    if (config.selectedCrop.code == 0) timer(timerName, 115);
    else if (config.selectedCrop.code == 1) timer(timerName, 295);
    else if (config.selectedCrop.code == 2) timer(timerName, 595);
    else if (config.selectedCrop.code == 3) timer(timerName, 1195);

    //打开路边小店
    sleep(500);
    //缩放
    gestures([0, 200, [420 + ran(), 133 + ran()], [860 + ran(), 133 + ran()]],
        [0, 200, [1000 + ran(), 133 + ran()], [860 + ran(), 133 + ran()]
        ]);

    sleep(500);
    openshop();

    //开始售卖
    console.log("============开始售卖系列操作===============")
    shop();
}



/**
 * 仓库统计
 * 偏移130,70
 * @param {number} maxPages 最大翻页次数
 * @returns {Object} 统计结果，包含每种物品的数量和检测到的位置
 */
function cangkuStatistics(maxPages = 2) {
    try {
        log("===============仓库统计===================");
        showTip("仓库统计");
        // 初始化检测结果
        const result = {};
        let currentPage = 0;
        let allItemsDetected = false;
        let lcCapacity = null;
        let hcCapacity = null;
        sleep(500);
        let isFindShop = findshop();
        if (isFindShop) {  //判断是否找到商店
            console.log("点击粮仓");
            showTip("点击粮仓");
            click(isFindShop.x + config.liangcangOffset.x + ran(), isFindShop.y + config.liangcangOffset.y + ran()); //点击粮仓
            sleep(500);
            if (matchColor([{ x: 1140, y: 66, color: "#ee434e" }])) {  //判断是否进入粮仓
                lcCapacity = findNum(captureScreen(), [657, 58, 900 - 657, 117 - 58], 32, 2).toString();
                if (!lcCapacity) {
                    sleep(500);
                    lcCapacity = findNum(captureScreen(), [657, 58, 900 - 657, 117 - 58], 32, 2).toString()
                }
                log("粮仓容量：" + lcCapacity);
                showTip("粮仓容量：" + lcCapacity);
                find_close()
            } else {  //未进入粮仓
                console.log("未进入粮仓");
                showTip("未进入粮仓");
                find_close()
            }
        } else {  //未找到商店
            console.log("未找到商店");
            showTip("未找到商店");
            find_close();
        }

        sleep(500);
        isFindShop = findshop();
        if (isFindShop) {  //判断是否找到商店
            console.log("点击货仓");
            showTip("点击货仓");
            click(isFindShop.x + config.huocangOffset.x + ran(), isFindShop.y + config.huocangOffset.y + ran()); //点击货仓
            sleep(500);
            if (matchColor([{ x: 1140, y: 66, color: "#ee434e" }])) {  //判断是否进入货仓
                hcCapacity = findNum(captureScreen(), [657, 58, 900 - 657, 117 - 58], 32, 2).toString();
                if (!hcCapacity) {
                    sleep(500);
                    hcCapacity = findNum(captureScreen(), [657, 58, 900 - 657, 117 - 58], 32, 2).toString();
                }
                log("货仓容量：" + hcCapacity);
                showTip("货仓容量：" + hcCapacity);
                // 初始化所有物品状态为未检测
                Object.keys(cangkuItemColor).forEach(itemName => {
                    result[itemName] = {
                        counts: 0,
                        position: [],
                        detected: false
                    };
                });

                // 开始检测
                while (currentPage < maxPages && !allItemsDetected) {
                    console.log(`开始第 ${currentPage + 1} 页检测`);
                    showTip(`开始第 ${currentPage + 1} 页检测`);

                    // 截取屏幕
                    let sc = captureScreen();
                    if (!sc) {
                        console.error("截图失败");
                        break;
                    }
                    // let sc1 = images.threshold(images.grayscale(sc), 254, 255);
                    let sc1 = sc
                    // let sc1 = images.inRange(sc,"#ffffff", "#ffffff" )
                    // let sc1 =images.grayscale(sc)
                    // let sc1 = images.medianBlur(images.inRange(sc,"#ffffff", "#ffffff" ), 1)
                    // let sc1 = images.medianBlur(sc, 3)
                    images.save(sc1, `/sdcard/${currentPage + 1}.png`);
                    // 检测所有物品
                    Object.keys(cangkuItemColor).forEach(itemName => {
                        // 如果已经检测到该物品，跳过
                        if (result[itemName].detected) {
                            return
                        }
                        // sleep(10);
                        const itemColor = cangkuItemColor[itemName];
                        const position = findMC(itemColor, sc, [146, 93, 1139 - 146, 576 - 93]);

                        if (position) {
                            // 找到物品
                            //
                            let itemNum = 0;
                            const numRegion = [position.x - 80, position.y - 60, 90, 75];
                            itemNum = findNum(sc1, numRegion).toString();
                            // 如果第一次检测为空，再检测一遍
                            if (!itemNum || itemNum.trim() === "") {
                                console.log(`第一次检测${itemName}为空，重新检测`);
                                showTip(`第一次检测${itemName}为空，重新检测`);
                                sleep(100);
                                itemNum = findNum(sc1, numRegion).toString();
                            }

                            result[itemName] = {
                                counts: itemNum ? itemNum : 0,
                                position: position,
                                detected: true
                            };
                            console.log(`${itemName} : ${itemNum}`);
                            showTip(`${itemName} : ${itemNum}`);
                            // sleep(100);
                        }
                    });

                    // 检查是否所有物品都已找到
                    allItemsDetected = Object.values(result).every(item => item.detected);
                    if (allItemsDetected) {
                        console.log("所有物品都已检测到");
                        showTip("所有物品都已检测到");
                        break;
                    }

                    // 如果不是最后一页，则向下翻页
                    if (currentPage < maxPages - 1) {
                        console.log("向下翻页...");
                        showTip("向下翻页...");
                        swipe(640, 540, 640, 150, 1000)
                        sleep(30)
                        click(640, 400)
                        // sleep(1000);
                        currentPage++;
                    } else {
                        console.log("已达到最大翻页次数");
                        showTip("已达到最大翻页次数");
                        break;
                    }

                    // 回收截图
                    sc.recycle();
                }

                // 处理结果数据
                const processedResult = {};

                Object.keys(result).forEach(itemName => {
                    const count = result[itemName].counts;

                    // 处理数量值
                    if (lcCapacity) processedResult["粮仓容量"] = lcCapacity ? lcCapacity : "未识别";
                    if (hcCapacity) processedResult["货仓容量"] = hcCapacity ? hcCapacity : "未识别";

                    if (!count || count.trim() === "") {
                        // 如果数量为空，则设置为null
                        processedResult[itemName] = null;
                    } else {
                        // 如果数量是纯数字，则直接转换为整数
                        processedResult[itemName] = parseInt(count);
                    }
                });
                find_close();
            } else {  //未进入粮仓
                console.log("未进入货仓");
                showTip("未进入货仓");
                find_close();
            }
        } else {  //未找到商店
            console.log("未找到商店");
            showTip("未找到商店");
            find_close();
        }
    } catch (error) {
        log("仓库统计出错" + error);
    } finally {
        find_close();
    }

    // 返回处理后的结果
    return processedResult;
};

/**
 * 
 * @param {*} accountName 账号名称
 * @param {*} data 统计数据
 * @param {*} rowTable 表头
 * @returns 加上添加的这一列的表格
 */
function creatContentData(accountName, data, rowTable) {
    try {
        // 初始化表格（只有表头和分隔线）
        let rowContentData = null;
        if (!rowTable) {
            rowContentData = "|         |\n|:--------:|\n";

            // 物品列表（确保顺序一致）
            const itemNames = ["粮仓容量", "货仓容量", "盒钉", "螺钉", "镶板", "螺栓", "木板", "胶带", "土地契约", "木槌", "标桩", "斧头", "木锯", "炸药", "炸药桶", "铁铲", "十字镐"];

            // 初始化所有物品行
            for (let item of itemNames) {
                rowContentData += `| ${item}      |\n`;
            }
        } else rowContentData = rowTable;

        // 分割现有表格的每一行
        let lines = rowContentData.split("\n");

        // 更新表头行（添加新账号列）
        lines[0] += `   ${accountName}   |`;

        // 更新分隔线行（添加对齐标记）
        lines[1] += ":----:|";

        try {
            // 更新数据行（添加物品数量）
            for (let i = 2; i < lines.length; i++) {
                if (lines[i].trim() === "") continue; // 跳过空行
                let itemName = lines[i].match(/\| (.+?)\s+\|/)[1].trim();
                let itemCount = data[itemName] || 0;
                lines[i] += `   ${itemCount}   |`;
            }
            // 重新组合表格
            rowContentData = lines.join("\n");
        } catch (error) {
            log(error);
        }
        return rowContentData;
    } catch (error) {
        log(error);
    }
};


/**
 * 为表格的每一行计算并添加行总计列
 * @param {string} rowContentData 表格数据，以换行符分隔行，以|分隔列
 * @returns {string} 添加了总计列的表格数据
 */
function rowContentData2(rowContentData) {
    try {
        // 按行分割数据
        let lines = rowContentData.split("\n");

        // 更新表头，添加"总计"列
        lines[0] += ` 总计 |`;

        // 更新分隔线行，添加对齐标记
        lines[1] += `:---:|`;

        // 从第三行开始处理数据行（跳过表头和分隔线）
        for (let i = 2; i < lines.length; i++) {
            // 跳过空行
            if (!lines[i].trim()) continue;

            // 以|分隔每列
            let columns = lines[i].split("|");

            // 初始化行总计
            let rowTotal = 0;

            // 遍历每一列（除了最后一列可能是空字符串）
            for (let j = 0; j < columns.length - 1; j++) {
                // 去除空格
                let value = columns[j].trim();

                // 尝试将值转换为整数
                let numValue = parseInt(value);

                // 如果是有效整数，则累加到行总计
                if (!isNaN(numValue)) {
                    rowTotal += numValue;
                }
                // 如果不是数字，跳过
            }

            // 在行末添加总计
            lines[i] += ` ${rowTotal} |`;
        }
        // 重新组合表格
        lines = "### 卡通农场小助手仓库统计\n*数据仅供参考*\n\n" + lines.join("\n");
        return lines
    } catch (error) {
        log(error);
    }
}



function pushTo(contentData) {
    let title = "卡通农场小助手仓库统计"; //推送标题
    let response = null;
    log(config.serverPlatform.text, title, contentData)
    try {
        //pushplus推送加
        if (config.serverPlatform.code == 0) {
            let url = "http://www.pushplus.plus/send"
            response = http.post(url, {
                token: token_storage.get("token", ""),
                title: title,
                content: contentData,
                template: "markdown"
            });
        }
        // server酱推送
        else if (config.serverPlatform.code == 1) {
            let url = "https://sctapi.ftqq.com/" + token_storage.get("token", "") + ".send"
            response = http.post(url, {
                title: title,
                desp: contentData,
            });
        }
        // wxpusher推送
        else if (config.serverPlatform.code == 2) {
            let url = "https://wxpusher.zjiecode.com/api/send/message/simple-push"
            response = http.postJson(url, {
                "content": contentData,
                "summary": title,
                "contentType": 3,
                "spt": token_storage.get("token", ""),
            });
        }
        else if (config.serverPlatform.code == 3) {

        }
    } catch (error) {
        log(error);
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
            console.log("部分文件导出失败");
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
            console.log("部分文件导入失败");
            return false;
        }
    } else {
        console.log("参数错误：direction 参数必须是 'export' 或 'import'");
        return false;
    }
}

// 模块导出
module.exports = {
    // 工具函数
    ran: ran,
    autoSc: autoSc,
    findimage: findimage,
    findimages: findimages,
    restartgame: restartgame,
    findtext: findtext,
    matchColor: matchColor,
    findMC: findMC,
    findNum: findNum,
    huadong: huadong,
    createWindow: createWindow,
    showTip: showTip,
    showDetails: showDetails,
    getDetails: getDetails,
    copy_shell: copy_shell,

    // 游戏界面检查
    checkmenu: checkmenu,
    close: close,

    // 耕地相关
    findland: findland,
    findshop: findshop,
    openshop: openshop,
    findland_click: findland_click,
    harvest: harvest,
    harvest_wheat: harvest_wheat,

    // 商店相关
    coin: coin,
    find_ad: find_ad,
    shop: shop,

    // 关闭和界面处理
    find_close: find_close,
    jiaocheng: jiaocheng,

    // 账号切换
    switch_account: switch_account,

    // 仓库相关
    shengcang: shengcang,
    cangkuStatistics: cangkuStatistics,

    //推送相关
    creatContentData: creatContentData,
    rowContentData2: rowContentData2,
    pushTo: pushTo,

    // 计时器
    timer: timer,
    getTimerState: getTimerState,
    stopTimer: stopTimer,

    // 种植相关
    plantCrop: plantCrop,
    operation: operation,

    // 种树相关


    // 全局变量
    config: config,
    crop: crop,
    crop_sail: crop_sail,
    appExternalDir: appExternalDir,
    configDir: configDir,
    configPath: configPath
};


