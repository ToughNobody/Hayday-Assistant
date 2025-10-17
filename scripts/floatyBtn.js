
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

// 悬浮窗变量
var win;
var logo_buys = false; // 开启和关闭时占用状态 防止多次点击触发
var logo_fx = true; // 悬浮按钮所在的方向 真左 假右
var logo_switch = false; // 子悬浮窗是否展开
var window_created = false; // 悬浮窗是否已创建

// 引入动画相关的类
importClass(android.animation.ObjectAnimator);
importClass(android.animation.AnimatorSet);

function suspendedWindow() {
    // 创建悬浮窗
    win = floaty.rawWindow(
        <frame w="*" h="*">
            <card id="circle_window" w="40" h="40" cardCornerRadius="20dp" cardBackgroundColor="#ffffff" alpha="0.4"
                margin="0 83 0 0" gravity="right" layout_gravity="left">
                <horizontal gravity="center" w="40" h="40">
                    <img id="floaty_icon" src="./res/images/icon_float.png" w="32" h="32" alpha="0.4" circle="true" gravity="center" layout_gravity="center" />
                </horizontal>
            </card>
            <frame id="id_logo" w="150" h="210">
                <frame id="id_0" w="44" h="44" margin="33 0 0 0" alpha="1">
                    <img w="44" h="44" src="#009687" circle="true" />
                    <img w="28" h="28" src="@drawable/ic_arrow_back_black_48dp" tint="#ffffff" gravity="center" layout_gravity="center" />
                    <img id="id_0_click" w="*" h="*" src="#ffffff" circle="true" alpha="0" />
                </frame>
                <frame id="id_1" w="44" h="44" margin="86 28 0 0" alpha="1">
                    <img w="44" h="44" src="#ee534f" circle="true" />
                    <img w="28" h="28" src="data:image/png;base64,{{icon.content_cut}}" tint="#ffffff" gravity="center" layout_gravity="center" />
                    <img id="id_1_click" w="*" h="*" src="#ffffff" circle="true" alpha="0" />
                </frame>
                <frame id="id_2" w="44" h="44" margin="0 83 0 0" alpha="1" gravity="right" layout_gravity="right">
                    <img w="44" h="44" src="#40a5f3" circle="true" />
                    <img w="28" h="28" src="@drawable/ic_play_arrow_black_48dp" tint="#ffffff" margin="8" />
                    <img id="id_2_click" w="*" h="*" src="#ffffff" circle="true" alpha="0" />
                </frame>
                <frame id="id_3" w="44" h="44" margin="86 0 0 28" alpha="1" gravity="bottom" layout_gravity="bottom">
                    <img w="44" h="44" src="#fbd834" circle="true" />
                    <img w="28" h="28" src="@drawable/ic_clear_black_48dp" tint="#ffffff" margin="8" />
                    <img id="id_3_click" w="*" h="*" src="#ffffff" circle="true" alpha="0" />
                </frame>
                <frame id="id_4" w="44" h="44" margin="33 0 0 0" alpha="1" gravity="bottom" layout_gravity="bottom">
                    <img w="44" h="44" src="#bfc1c0" circle="true" />
                    <img w="28" h="28" src="@drawable/ic_exit_to_app_black_48dp" tint="#ffffff" margin="8" />
                    <img id="id_4_click" w="*" h="*" src="#ffffff" circle="true" alpha="0" />
                </frame>
            </frame>
        </frame>
    );

    // 设置初始位置在左侧
    win.setPosition(-20, device.height / 3);
    setInterval(() => { }, 1000);

    // 初始隐藏子悬浮窗
    if (win && win.id_logo) {
        win.id_logo.visibility = 8;
    }

    var x = 0, y = 0;
    var windowX, windowY;
    var yd = false; // 是否处于移动状态
    // console.log("w=" + device.width);
    // console.log("h=" + device.height);

    // 更新子悬浮窗位置和方向
    function updateSubWindowPosition() {
        if (logo_fx) {
            // 主悬浮窗在左侧，子悬浮窗向右展开
            win.id_logo.attr({
                'layout_gravity': 'left',
                'marginLeft': '20',
                'marginRight': '0'
            });
        } else {
            // 主悬浮窗在右侧，子悬浮窗向左展开
            win.id_logo.attr({
                'layout_gravity': 'right',
                'marginLeft': '0',
                'marginRight': '20'
            });
        }
    }

    function runAnimationSteps(stepList) {
        if (stepList.length === 0) {
            logo_buys = false;
            return;
        }
        const currentStep = stepList.shift();
        if (currentStep.action === 'position') {
            win.setPosition(currentStep.x, currentStep.y);
        } else if (currentStep.action === 'visibility') {
            win.id_logo.visibility = currentStep.value;
        } else if (currentStep.action === 'alpha') {
            win.floaty_icon.attr("alpha", currentStep.value);
        }
        if (stepList.length > 0) {
            setTimeout(() => runAnimationSteps(stepList), currentStep.delay || 0);
        } else {
            logo_buys = false;
        }
    }
    
    // 吸附动画函数 - 只在移动后调用
    function animateWindowToSide(currentX, currentY, toLeft) {
        logo_buys = true; // 设置为运行中，防止重复触发
        
        try {
            // 确定目标位置
            let targetX = toLeft ? -20 : device.width - 60;
            // 计算超调位置（用于弹跳效果）
            let overshootX = toLeft ? -35 : device.width - 45;
            let smallBounceX = toLeft ? -15 : device.width - 65;
            
            // 更新方向标志
            logo_fx = toLeft;

            // 更新子悬浮窗方向
            updateSubWindowPosition();
            
            // 关闭子悬浮窗
            win.id_logo.visibility = 8;
            
            let steps = [
                { action: 'position', x: overshootX, y: currentY, delay: 30 },
                { action: 'position', x: targetX, y: currentY, delay: 30 },
                { action: 'position', x: smallBounceX, y: currentY, delay: 20 },
                { action: 'position', x: targetX, y: currentY },
                { action: 'alpha', value: '0.4' }
            ];
            
            // 启动非阻塞动画
            runAnimationSteps(steps);
        } catch (e) {
            console.error("吸附动画错误：" + e.message);
            logo_buys = false; // 出错时释放占用状态
        }
    }

    // 按钮点击事件处理
    function setupButtonListeners() {
        // 返回按钮 (id_0)
        win.id_0_click.setOnTouchListener(function (view, event) {
            if (event.getAction() == event.ACTION_UP) {
                toastLog("退出悬浮窗");
                //关闭悬浮窗
                module.exports.close();
                return true;
            }
            return true;
        });

        // 截图按钮 (id_1)
        win.id_1_click.setOnTouchListener(function (view, event) {
            if (event.getAction() == event.ACTION_UP) {
                // 关闭子菜单
                toggleSubWindowVisibility();
                // 在新线程中执行截图操作，避免UI线程阻塞和requestScreenCapture()错误
                threads.start(function() {
                    try {
                        // 获取截图权限
                        autoSc();
                        
                        // 获取应用目录
                        const scPath = "/storage/emulated/0/$MuMu12Shared/Screenshots"
                        files.ensureDir(scPath + "/1");
                        
                        // 生成带时间戳的文件名
                        var timestamp = new Date().getTime();
                        var fileName = "screenshot_" + timestamp + ".png";
                        var filePath = files.join(scPath, fileName);
                        
                        // 截图并保存
                        sleep(800);
                        var screenshot = captureScreen();
                        screenshot.saveTo(filePath);
                        
                        // 在UI线程中显示toast
                        ui.run(function() {
                            toastLog("截图已保存到: " + filePath);
                        });
                    } catch (e) {
                        // 在UI线程中显示错误信息
                        ui.run(function() {
                            toastLog("截图失败: " + e.message);
                        });
                        console.error("截图错误:", e);
                    }
                });
                return true;
            }
            return true;
        });

        // 开始按钮 (id_2)
        win.id_2_click.setOnTouchListener(function (view, event) {
            if (event.getAction() == event.ACTION_UP) {
                // 关闭子菜单
                toggleSubWindowVisibility();
                toast("开始运行");
                events.broadcast.emit("win_startButton");
                return true;
            }
            return true;
        });

        // 清除按钮 (id_3)
        win.id_3_click.setOnTouchListener(function (view, event) {
            if (event.getAction() == event.ACTION_UP) {
                // 关闭子菜单
                toggleSubWindowVisibility();
                events.broadcast.emit("win_stopOtherEngines");
                return true;
            }
            return true;
        });

        // 退出按钮 (id_4)
        win.id_4_click.setOnTouchListener(function (view, event) {
            if (event.getAction() == event.ACTION_UP) {
                // 关闭子菜单
                toggleSubWindowVisibility();
                toast("关闭脚本...");
                events.broadcast.emit("win_stopAll");
                exit();
            }
            return true;
        });
    }

    // 初始化按钮监听器
    setupButtonListeners();

    // 子悬浮窗触摸事件，防止空白区域拦截点击
    win.id_logo.setOnTouchListener(function (view, event) {
        // 只有在子悬浮窗可见时才处理
        if (win.id_logo.visibility == 0) {
            // 如果点击的是子悬浮窗的空白区域（非按钮区域），将点击传递给主悬浮窗
            // 这样点击半圆凹槽区域会触发主悬浮窗的关闭逻辑
            if (event.getAction() == event.ACTION_UP) {
                // 模拟点击主悬浮窗以关闭子悬浮窗
                toggleSubWindowVisibility();
                return true;
            }
        }
        return true;
    });
    
    // 初始化透明度为0.4
    win.floaty_icon.attr("alpha", "0.4");
    // 同步设置背景卡片初始透明度
    if (win.circle_window) win.circle_window.attr("alpha", "0.4");

    // 子悬浮窗动画函数
    function animateSubWindows(show) {
        var logo_ms = 200; // 动画播放时间
        
        // 创建动画数组
        var animators = [];
        var buttonIds = ['id_0', 'id_1', 'id_2', 'id_3', 'id_4'];
        
        // 为每个按钮创建动画，根据方向设置不同的参数
        for (var i = 0; i < buttonIds.length; i++) {
            var button = win[buttonIds[i]];
            
            // 根据悬浮窗方向确定X轴动画参数
            var startX, endX;
            if (logo_fx) {
                // 左侧悬浮窗 - 按钮向右展开
                startX = -50;
                endX = 0;
            } else {
                // 右侧悬浮窗 - 按钮向左展开
                startX = 50;
                endX = 0;
                

                // 直接调整按钮的位置属性
                button.attr({
                    'layout_gravity': 'right'
                });
            }
            
            // Y轴动画参数保持一致
            var startY = -50;
            var endY = 0;
            
            // 根据显示/隐藏确定动画的起始和结束值
            if (!show) {
                // 关闭动画，交换起始和结束值
                var tempX = startX;
                var tempY = startY;
                startX = endX;
                startY = endY;
                endX = tempX;
                endY = tempY;
            }
            
            // 平移动画
            var animX = ObjectAnimator.ofFloat(button, "translationX", startX, endX);
            var animY = ObjectAnimator.ofFloat(button, "translationY", startY, endY);
            
            // 缩放动画
            var animScaleX = ObjectAnimator.ofFloat(button, "scaleX", show ? 0 : 1, show ? 1 : 0);
            var animScaleY = ObjectAnimator.ofFloat(button, "scaleY", show ? 0 : 1, show ? 1 : 0);
            
            // 透明度动画
            var animAlpha = ObjectAnimator.ofFloat(button, "alpha", show ? 0 : 1, show ? 1 : 0);
            
            // 添加到动画数组
            animators.push(animX, animY, animScaleX, animScaleY, animAlpha);
        }
        
        // 创建并启动动画集
        var animatorSet = new AnimatorSet();
        animatorSet.playTogether(animators);
        animatorSet.setDuration(logo_ms);
        
        // 启动动画
        animatorSet.start();
        
        // 设置动画占用状态
        logo_buys = true;
        setTimeout(function() {
            logo_buys = false;
        }, logo_ms + 50);
    }
    
    // 切换子悬浮窗可见性的辅助函数
    function toggleSubWindowVisibility() {
        if (logo_buys) return; // 如果有动画正在运行，不响应新的操作
        logo_buys = true; // 标记为运行中
        
        let currentX = win.getX();
        let currentY = win.getY();
        
        if (win.id_logo.visibility == 0) {
            // 关闭子悬浮窗
            animateSubWindows(false);
            
            // 关闭后隐藏并恢复透明度
            setTimeout(function() {
                win.id_logo.visibility = 8;
                // 关闭时恢复透明度为0.4
                win.floaty_icon.attr("alpha", "0.4");
                // 同步更新背景卡片透明度
                if (win.circle_window) win.circle_window.attr("alpha", "0.4");
                
                // 如果是右侧展开，恢复窗口到正确的吸附位置
                if (!logo_fx && currentX !== (device.width - 60)) {
                    let restoredX = logo_fx ? currentX : currentX + 240; // 恢复偏移量，与展开时保持一致
                    win.setPosition(restoredX, currentY);
                }
                
                logo_switch = false; // 更新子悬浮窗展开状态
                logo_buys = false;
            }, 200);
        } else {
            // 更新子悬浮窗位置
            updateSubWindowPosition();
            
            // 根据方向调整子悬浮窗的显示位置
            if (!logo_fx) {
                // 如果在右侧，需要调整子悬浮窗的位置，确保按钮不超出屏幕
                // 偏移量改为240，确保按钮完全可见
                let adjustedX = currentX - 240;
                win.setPosition(adjustedX, currentY);
            } else {
                // 左侧保持原位置
                win.setPosition(currentX, currentY);
            }
            
            // 先让子悬浮窗可见
            win.id_logo.visibility = 0;
            // 展开时透明度为0.9
            win.floaty_icon.attr("alpha", "0.9");
            // 同步更新背景卡片透明度
            if (win.circle_window) win.circle_window.attr("alpha", "0.9");
            
            // 启动展开动画
            animateSubWindows(true);
            logo_switch = true; // 更新子悬浮窗展开状态
        }
    }

    // 触摸事件监听器
    win.floaty_icon.setOnTouchListener(function (view, event) {
        if (logo_buys || !event || typeof event.getAction !== "function") {
            return true;
        }

        switch (event.getAction()) {
            case event.ACTION_DOWN:
                // 记录按下时的位置
                x = event.getRawX();
                y = event.getRawY();
                windowX = win.getX();
                windowY = win.getY();
                // 按下时立即设置卡片和图标的透明度为0.9
                  if (win.circle_window) win.circle_window.attr("alpha", "0.9");
                  win.floaty_icon.attr("alpha", "0.9");
                return true;

            case event.ACTION_MOVE:
                // 移动检测阈值降低到10像素，避免轻微移动被误判为点击
                if (!yd) {
                    if (Math.abs(event.getRawY() - y) > 10 || Math.abs(event.getRawX() - x) > 10) {
                        // 拖动时透明度保持0.9
                        yd = true;
                        // 如果子悬浮窗是打开的，在移动时关闭它
                        if (win.id_logo.visibility == 0) {
                            win.id_logo.visibility = 8;
                        }
                    }
                    // 重要：在未确定为移动状态时，不执行任何位置相关操作
                    return true;
                }

                // 已确定为移动状态，执行位置更新
                let movexx = windowX + (event.getRawX() - x);
                let moveyy = windowY + (event.getRawY() - y);

                // 限制Y轴移动范围
                if (moveyy < 0) moveyy = 0;
                if (moveyy > device.height - 40) moveyy = device.height - 40;

                // 移动主窗口
                win.setPosition(movexx, moveyy);
                return true;

            case event.ACTION_UP:
                // 如果是移动状态，处理吸附
                if (yd) {
                    let currentX = win.getX();
                    let currentY = win.getY();

                    if (currentX < device.width / 2) {
                        // 吸附到左侧
                        animateWindowToSide(currentX, currentY, true);
                    } else {
                        // 吸附到右侧
                        animateWindowToSide(currentX, currentY, false);
                    }
                    yd = false;
                    // 移动结束后重置卡片和图标的透明度为0.4
                      if (win.circle_window) win.circle_window.attr("alpha", "0.4");
                      win.floaty_icon.attr("alpha", "0.4");
                    return true;
                }

                // 纯点击事件处理
                // 展开时保持透明度为0.9
                toggleSubWindowVisibility();

                return true;
        }
        return true;
    });

    // 启用按键监听
    events.observeKey();
    events.on("key", function (code, event) {
        engines.myEngine().forceStop();
        threads.shutDownAll();
    });
    
    // 标记窗口已创建
    window_created = true;
}




// suspendedWindow();

// 模块导出
module.exports = {
    open: function () {
        if (!this.isCreated() && !logo_buys) {
            this._main();
            // 使用非阻塞方式等待初始化完成
            let self = this;
            let checkInitialized = () => {
                if (!win) {
                    setTimeout(checkInitialized, 50);
                    return;
                }
                // 初始化完成后通知main.js更新开关状态
                log("悬浮窗初始化完成，准备就绪");
                events.broadcast.emit("win_switch_state", true);
            };
            setTimeout(checkInitialized, 50);
        }
    },
    
    toggle: function() {
        if (!this.isCreated() || logo_buys) return;
        
        if (logo_switch) {
            // 如果当前是展开状态，则关闭
            logo_switch = false;
            win.floaty_icon.attr("alpha", "0.4");
            toggleSubWindowVisibility();
        } else {
            // 如果当前是关闭状态，则展开
            logo_switch = true;
            win.floaty_icon.attr("alpha", "0.9");
            toggleSubWindowVisibility();
        }
    },

    close: function () {
        if (this.isCreated()) {
            // 如果按钮处于展开状态，先关闭展开的子菜单
            if (logo_switch) {
                logo_switch = false;
                win.floaty_icon.attr("alpha", "0.4");
                // 等待动画完成后再关闭窗口
                let self = this;
                setTimeout(function() {
                    self._closeAllWindows();
                }, 200 + 100);
            } else {
                // 如果按钮已经处于关闭状态，直接关闭所有窗口
                this._closeAllWindows();
            }
        }
    },
    
    // 内部方法：关闭所有窗口并重置状态
    _closeAllWindows: function() {
        if (win) win.close();
        win = null;
        window_created = false;
        logo_switch = false;
        logo_buys = false;
        // 移除未定义的time_0变量
        events.broadcast.emit("win_switch_state", false);
    },

    isCreated: function () {
        return window_created;
    },
    
    isExpanded: function () {
        return logo_switch;
    },
    
    _main: function () {
        window_created = true;
        logo_switch = false; // 初始状态为关闭
        suspendedWindow();
    }
};

