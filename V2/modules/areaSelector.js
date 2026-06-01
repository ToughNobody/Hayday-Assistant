// 区域框选功能 - 四个可拖动的悬浮窗顶点

// 悬浮窗尺寸配置
const POINT_SIZE = 15;  // 顶点悬浮窗的宽高
const POINT_HALF = POINT_SIZE / 2;  // 半尺寸，用于计算位置偏移

// 平行四边形斜率约束
const SLOPE_LEFT_RIGHT = 0.5;    // 左边(点1-点4)和右边(点2-点3)的斜率
const SLOPE_TOP_BOTTOM = -0.5;   // 上边(点1-点2)和下边(点3-点4)的斜率

// 获取边的斜率（边索引从0到3，连接点i和点(i+1)%4）
function getEdgeSlope(edgeIndex) {
    return (edgeIndex % 2 === 0) ? SLOPE_TOP_BOTTOM : SLOPE_LEFT_RIGHT;
}

// 计算两条线的交点
// 线1: 通过(x1,y1)斜率为m1; 线2: 通过(x2,y2)斜率为m2
function computeIntersection(x1, y1, m1, x2, y2, m2) {
    if (Math.abs(m1 - m2) < 0.0001) return null;
    let x = (m1 * x1 - y1 - m2 * x2 + y2) / (m1 - m2);
    let y = m1 * (x - x1) + y1;
    return { x, y };
}

// 当拖动顶点index到(newX, newY)时，根据平行四边形约束更新所有顶点
// 返回true表示更新成功，false表示约束不满足
function updateParallelogramOnDrag(draggedIndex, newX, newY) {
    let oppIndex = (draggedIndex + 2) % 4;
    let adj1Index = (draggedIndex + 1) % 4;
    let adj2Index = (draggedIndex + 3) % 4;

    let oppX = points[oppIndex].x;
    let oppY = points[oppIndex].y;

    // 先将所有新位置计算到临时数组中
    let newPoints = [
        { x: points[0].x, y: points[0].y },
        { x: points[1].x, y: points[1].y },
        { x: points[2].x, y: points[2].y },
        { x: points[3].x, y: points[3].y }
    ];

    newPoints[draggedIndex].x = newX;
    newPoints[draggedIndex].y = newY;

    // adj1: 边(draggedIndex→adj1)斜率m_drag 与 边(adj1→opp)斜率m_adj1 的交点
    let m_drag = getEdgeSlope(draggedIndex);
    let m_adj1 = getEdgeSlope(adj1Index);
    let adj1 = computeIntersection(newX, newY, m_drag, oppX, oppY, m_adj1);

    // adj2: 边(adj2→draggedIndex)斜率m_adj2 与 边(opp→adj2)斜率m_opp 的交点
    let m_adj2 = getEdgeSlope(adj2Index);
    let m_opp = getEdgeSlope(oppIndex);
    let adj2 = computeIntersection(newX, newY, m_adj2, oppX, oppY, m_opp);

    if (!adj1 || !adj2) return false;

    newPoints[adj1Index] = adj1;
    newPoints[adj2Index] = adj2;

    // 检查所有相邻顶点的水平距离是否不小于40
    for (let i = 0; i < 4; i++) {
        let j = (i + 1) % 4;
        if (Math.abs(newPoints[j].x - newPoints[i].x) < 40) {
            return false;
        }
    }

    // 检查边的方向是否保持（防止平行四边形反向折叠）
    if (newPoints[1].x <= newPoints[0].x) return false;  // 边0: P1在P0右侧
    if (newPoints[2].x <= newPoints[1].x) return false;  // 边1: P2在P1右侧
    if (newPoints[3].x >= newPoints[2].x) return false;  // 边2: P3在P2左侧

    // 约束满足，更新实际顶点坐标
    for (let i = 0; i < 4; i++) {
        points[i].x = newPoints[i].x;
        points[i].y = newPoints[i].y;
    }
    return true;
}

// 设备尺寸
const device_width = 1280;
const device_height = 720;

// 四个悬浮窗对象
let pointWindows = [];
let canvasWindow;
let exitWindow;
let countWindow;

// 网格中心点坐标存储
let gridCenters = [];


// 四个点的初始位置（平行四边形，符合斜率约束）
let points = [
    { x: 300, y: 300 },   // 点1 (index 0) 左上
    { x: 700, y: 100 },   // 点2 (index 1) 右上
    { x: 900, y: 200 },   // 点3 (index 2) 右下
    { x: 500, y: 400 }    // 点4 (index 3) 左下
];

// 创建画布窗口（用于绘制四边形）
canvasWindow = floaty.rawWindow(
    <frame>
        <canvas id="canvas" w="*" h="*" />
    </frame>
);

canvasWindow.setTouchable(true);
canvasWindow.setSize(-1, -1);
canvasWindow.setPosition(0, 0);

// 绘制函数
canvasWindow.canvas.on("draw", function (canvas) {
    let w = canvas.getWidth();
    let h = canvas.getHeight();

    // 清空画布
    canvas.drawColor(0XFFFFFF, android.graphics.PorterDuff.Mode.CLEAR);

    // 创建画笔
    let paint = new Paint();

    // 绘制半透明背景
    paint.setARGB(30, 0, 0, 0);
    paint.setStyle(Paint.Style.STROKE);
    canvas.drawRect(0, 0, w, h, paint);

    // 绘制四边形内部半透明填充（用于点击检测）
    paint.setARGB(30, 255, 0, 0);
    paint.setStyle(Paint.Style.FILL);

    let path = new android.graphics.Path();
    path.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        path.lineTo(points[i].x, points[i].y);
    }
    path.close();
    canvas.drawPath(path, paint);

    // 绘制四边形连线
    paint.setARGB(100, 255, 0, 0);
    paint.setStyle(Paint.Style.STROKE);
    paint.setStrokeWidth(6);
    canvas.drawPath(path, paint);

    // 绘制内部网格
    drawGrid(canvas);

    // 绘制四个直角框
    drawCornerBrackets(canvas);
});

// 计算所有小平行四边形的中心点坐标
function computeGridCenters() {
    gridCenters = [];
    let p0 = points[0], p1 = points[1], p2 = points[2], p3 = points[3];

    let ncols = Math.floor((p1.x - p0.x) / 35);
    let nrows = Math.floor((p3.y - p0.y) / 17.5);

    let baseX = 0.5 * (p0.x + p3.x) + (p3.y - p0.y);

    // 外循环：按列从前到后（左→右）
    for (let col = 0; col < ncols; col++) {
        // 内循环：每列行从前到后（顶→底）
        for (let row = nrows - 1; row >= 0; row--) {
            let cx = baseX + 35 * (col - row);
            let cy = 0.5 * cx - 0.5 * p0.x + p0.y - (col + 0.5) * 35;
            gridCenters.push({
                col: nrows - row,
                row: ncols - col,
                x: Math.round(cx * 10) / 10,
                y: Math.round(cy * 10) / 10
            });
        }
    }
    gridCenters.sort((a, b) => a.col - b.col || a.row - b.row);
}
//660,480 630,500 700,500
// 在平行四边形内部绘制网格（小平行四边形划分）
function drawGrid(canvas) {
    let p0 = points[0], p1 = points[1], p2 = points[2], p3 = points[3];

    // 收集所有垂直边界线的 x 坐标（含左右边）
    let vLines = [p0.x];
    let x = p0.x + 35;
    while (x < p1.x) {
        vLines.push(x);
        x += 35;
    }
    vLines.push(p1.x);

    // 收集所有水平边界线在左边上的 y 坐标（含上下边）
    let hLines = [p3.y];
    let y = p3.y - 17.5;
    while (y > p0.y) {
        hLines.push(y);
        y -= 17.5;
    }
    hLines.push(p0.y);

    let ncols = vLines.length - 1;
    let nrows = hLines.length - 1;

    // 完整单元格数量（全 35 宽 × 17.5 高）
    let nFullCols = Math.floor((p1.x - p0.x) / 35);
    let nFullRows = Math.floor((p3.y - p0.y) / 17.5);

    let greenPaint = new Paint();
    greenPaint.setStyle(Paint.Style.STROKE);
    greenPaint.setStrokeWidth(1.5);
    greenPaint.setARGB(255, 76, 200, 80);

    let redPaint = new Paint();
    redPaint.setStyle(Paint.Style.STROKE);
    redPaint.setStrokeWidth(1);
    redPaint.setARGB(200, 255, 0, 0);

    for (let col = 0; col < ncols; col++) {
        for (let row = 0; row < nrows; row++) {
            let xLeft = vLines[col];
            let xRight = vLines[col + 1];
            let yBottom = hLines[row];
            let yTop = hLines[row + 1];

            // 计算小平行四边形四个角
            let bl = computeIntersection(xLeft, p0.y - 0.5 * (xLeft - p0.x), 0.5,
                p3.x + 2 * (yBottom - p3.y), yBottom, -0.5);
            let br = computeIntersection(xRight, p0.y - 0.5 * (xRight - p0.x), 0.5,
                p3.x + 2 * (yBottom - p3.y), yBottom, -0.5);
            let tl = computeIntersection(xLeft, p0.y - 0.5 * (xLeft - p0.x), 0.5,
                p3.x + 2 * (yTop - p3.y), yTop, -0.5);
            let tr = computeIntersection(xRight, p0.y - 0.5 * (xRight - p0.x), 0.5,
                p3.x + 2 * (yTop - p3.y), yTop, -0.5);

            // 判定是否完整（全宽 × 全高）
            let isComplete = (col < nFullCols && row < nFullRows);
            let paint = isComplete ? greenPaint : redPaint;

            let path = new android.graphics.Path();
            path.moveTo(bl.x, bl.y);
            path.lineTo(br.x, br.y);
            path.lineTo(tr.x, tr.y);
            path.lineTo(tl.x, tl.y);
            path.close();
            canvas.drawPath(path, paint);
        }
    }
}

// 绘制四个直角（框选范围标记）
function drawCornerBrackets(canvas) {
    const CORNER_LEN = 30;
    const corners = [
        { x: 340, y: 120, dirX: 1, dirY: 1 },    // 左上：向右、向下
        { x: 900, y: 120, dirX: -1, dirY: 1 },    // 右上：向左、向下
        { x: 340, y: 600, dirX: 1, dirY: -1 },    // 左下：向右、向上
        { x: 900, y: 600, dirX: -1, dirY: -1 }    // 右下：向左、向上
    ];

    let paint = new Paint();
    paint.setStyle(Paint.Style.STROKE);
    paint.setStrokeWidth(4);
    paint.setARGB(200, 255, 255, 0);

    for (let c of corners) {
        // 水平线
        canvas.drawLine(c.x, c.y, c.x + c.dirX * CORNER_LEN, c.y, paint);
        // 垂直线
        canvas.drawLine(c.x, c.y, c.x, c.y + c.dirY * CORNER_LEN, paint);
    }
}

// 判断点是否在四边形内部
function isPointInQuadrilateral(px, py) {
    let path = new android.graphics.Path();
    path.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        path.lineTo(points[i].x, points[i].y);
    }
    path.close();

    let rectF = new android.graphics.RectF();
    path.computeBounds(rectF, true);

    if (px < rectF.left || px > rectF.right || py < rectF.top || py > rectF.bottom) {
        return false;
    }

    // 使用射线法判断点是否在多边形内
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        let xi = points[i].x, yi = points[i].y;
        let xj = points[j].x, yj = points[j].y;

        if (((yi > py) !== (yj > py)) &&
            (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    return inside;
}

// 画布触摸事件（拖动整个四边形）
let dragStartX, dragStartY;
let isDraggingQuad = false;

// 检查点击是否在退出按钮区域
function isClickOnExitBtn(x, y) {
    let exitX = exitWindow.getX();
    let exitY = exitWindow.getY();
    let exitWidth = 60;
    let exitHeight = 60;
    return x >= exitX && x <= exitX + exitWidth && y >= exitY && y <= exitY + exitHeight;
}

canvasWindow.canvas.setOnTouchListener(function (view, event) {
    switch (event.getAction()) {
        case event.ACTION_DOWN:
            let x = event.getRawX();
            let y = event.getRawY();

            // 如果点击在退出按钮区域，不处理，让事件传递给按钮
            if (isClickOnExitBtn(x, y)) {
                return false;
            }

            if (isPointInQuadrilateral(x, y)) {
                dragStartX = x;
                dragStartY = y;
                isDraggingQuad = true;
            }
            return true;

        case event.ACTION_MOVE:
            if (isDraggingQuad) {
                let dx = event.getRawX() - dragStartX;
                let dy = event.getRawY() - dragStartY;

                // 移动所有点（整体平移保持平行四边形形状）
                for (let i = 0; i < points.length; i++) {
                    points[i].x += dx;
                    points[i].y += dy;
                    pointWindows[i].setPosition(points[i].x - POINT_HALF, points[i].y - POINT_HALF);
                }

                dragStartX = event.getRawX();
                dragStartY = event.getRawY();

                canvasWindow.canvas.updateCanvas();
                updateGridCountDisplay();
            }
            return true;

        case event.ACTION_UP:
            isDraggingQuad = false;
            return true;
    }
    return true;
});

// 创建四个悬浮窗
for (let i = 0; i < 4; i++) {
    let pointWin = floaty.rawWindow(
        <frame w="{{POINT_SIZE}}" h="{{POINT_SIZE}}">
            <img id="point" w="{{POINT_SIZE}}" h="{{POINT_SIZE}}" src="#ff0000" circle="true" layout_gravity="center" alpha="0.8" />
        </frame>
    );

    // 设置初始位置
    pointWin.setPosition(points[i].x - POINT_HALF, points[i].y - POINT_HALF);

    // 触摸事件监听器（参考 floatyBtn.js 的拖动逻辑）
    let x = 0, y = 0;
    let windowX, windowY;
    let isMoved = false;
    let pointIndex = i;

    // 在内部控件上设置触摸监听器
    pointWin.point.setOnTouchListener(function (view, event) {
        switch (event.getAction()) {
            case event.ACTION_DOWN:
                // 记录按下时的位置
                x = event.getRawX();
                y = event.getRawY();
                windowX = pointWin.getX();
                windowY = pointWin.getY();
                isMoved = false;
                return true;

            case event.ACTION_MOVE:
                // 移动检测阈值
                if (!isMoved) {
                    if (Math.abs(event.getRawY() - y) > 10 || Math.abs(event.getRawX() - x) > 10) {
                        isMoved = true;
                    } else {
                        return true;
                    }
                }

                // 计算新位置
                let movex = windowX + (event.getRawX() - x);
                let movey = windowY + (event.getRawY() - y);

                // 限制移动范围
                if (movey < 0) movey = 0;
                if (movey > device_height - POINT_SIZE) movey = device_height - POINT_SIZE;
                if (movex < 0) movex = 0;
                if (movex > device_width - POINT_SIZE) movex = device_width - POINT_SIZE;

                // 根据平行四边形约束更新所有顶点（含水平距离检查）
                let draggedCenterX = movex + POINT_HALF;
                let draggedCenterY = movey + POINT_HALF;
                let success = updateParallelogramOnDrag(pointIndex, draggedCenterX, draggedCenterY);

                if (success) {
                    // 约束满足，移动当前窗口并更新所有顶点悬浮窗位置
                    pointWin.setPosition(movex, movey);
                    for (let k = 0; k < 4; k++) {
                        pointWindows[k].setPosition(points[k].x - POINT_HALF, points[k].y - POINT_HALF);
                    }
                } else {
                    // 约束不满足时，保持窗口不动，重置触摸参考点防止下次跳变
                    x = event.getRawX();
                    y = event.getRawY();
                    windowX = pointWin.getX();
                    windowY = pointWin.getY();
                }

                // 触发画布重绘
                canvasWindow.canvas.updateCanvas();
                updateGridCountDisplay();
                return true;

            case event.ACTION_UP:
                if (!isMoved) {
                    // 点击事件（可以添加其他功能）
                    toast("顶点 " + (pointIndex + 1));
                }
                return true;
        }
        return true;
    });

    // 触发画布重绘
    canvasWindow.canvas.updateCanvas();

    pointWindows.push(pointWin);
}


// 创建退出按钮悬浮窗（使用button控件，设置在最顶层）
exitWindow = floaty.rawWindow(
    <frame w="40" h="40" bg="#ff4444" gravity="right|top">
        <button id="exitBtn" text="退出" textSize="14" textColor="#ffffff" bg="#00000000" w="*" h="*" />
    </frame>
);

exitWindow.setPosition(device_width - 80, 20);

// 退出按钮点击事件（使用click方法，参考floaty_demo.js）
exitWindow.exitBtn.click(function () {
    // 销毁所有悬浮窗
    for (let win of pointWindows) {
        win.close();
    }
    canvasWindow.close();
    exitWindow.close();
    countWindow.close();
    // 退出脚本
    exit();
});

// 创建确定按钮悬浮窗（绿色，在退出按钮下方）
let confirmWindow = floaty.rawWindow(
    <frame w="40" h="40" bg="#4CAF50" gravity="right|top">
        <button id="confirmBtn" text="确定" textSize="14" textColor="#ffffff" bg="#00000000" w="*" h="*" />
    </frame>
);
confirmWindow.setPosition(device_width - 80, 100);

// 确定按钮点击事件
confirmWindow.confirmBtn.click(function () {
    computeGridCenters();

    // 在日志中输出所有中心点坐标
    console.log("===== 小平行四边形中心点坐标（按列从上到下）=====");
    console.log("总数量: " + gridCenters.length + " 个");
    console.log(gridCenters);
    console.log("==========================================");

    storages.create("plantTreeInfo").put("treePos", gridCenters);

    // 显示 log 提示
    log("已获取 " + gridCenters.length + " 个中心点坐标");
    let selfPath = engines.myEngine().getSource().toString();
    const currentPath = selfPath.substring(0, selfPath.lastIndexOf("/"));
    engines.execScriptFile(currentPath.substring(0, currentPath.lastIndexOf("/")) + "/zhongshuV2.js")
    for (let win of pointWindows) {
        win.close();
    }
    canvasWindow.close();
    exitWindow.close();
    countWindow.close();
    exit();

});

// 获取当前网格的小平行四边形个数
function getGridCount() {
    let p0 = points[0], p1 = points[1], p3 = points[3];
    let ncols = Math.floor((p1.x - p0.x) / 35);
    let nrows = Math.floor((p3.y - p0.y) / 17.5);
    return ncols * nrows;
}

// 更新网格计数显示
function updateGridCountDisplay() {
    let count = getGridCount();
    countWindow.countText.setText("数量: " + count + "个");
}

// 创建网格计数显示悬浮窗（退出按钮左侧）
countWindow = floaty.rawWindow(
    <frame w="auto" h="40" bg="#88000000">
        <text id="countText" textSize="14" textColor="#ffffff" gravity="center" w="*" h="*" />
    </frame>
);
countWindow.setPosition(device_width - 230, 20);

// 初始显示计数
updateGridCountDisplay();

// 保持脚本运行
setInterval(() => { }, 1000);
