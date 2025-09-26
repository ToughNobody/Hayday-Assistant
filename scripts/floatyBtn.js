//悬浮窗logo
importClass(java.lang.Runnable);
importClass(android.animation.ObjectAnimator)
importClass(android.animation.PropertyValuesHolder)
importClass(android.animation.ValueAnimator)
importClass(android.animation.AnimatorSet)
importClass(android.view.animation.AccelerateInterpolator)
importClass(android.view.animation.TranslateAnimation)
importClass(android.animation.ObjectAnimator)
importClass(android.animation.TimeInterpolator)
importClass(android.os.Bundle)
importClass(android.view.View)
importClass(android.view.Window)

importClass(android.view.animation.AccelerateDecelerateInterpolator)
importClass(android.view.animation.AccelerateInterpolator)
importClass(android.view.animation.AnticipateInterpolator)
importClass(android.view.animation.AnticipateOvershootInterpolator)
importClass(android.view.animation.BounceInterpolator)
importClass(android.view.animation.CycleInterpolator)
importClass(android.view.animation.DecelerateInterpolator)
importClass(android.view.animation.LinearInterpolator)
importClass(android.view.animation.OvershootInterpolator)
importClass(android.view.animation.PathInterpolator)
importClass(android.widget.Button)
importClass(android.widget.ImageView)
importClass(android.widget.TextView)

// 全局变量
var logo_switch = false; // 悬浮窗是否展开
var window_created = false; // 悬浮窗是否已创建
var logo_buys = false; // 开启和关闭时占用状态 防止多次点击触发
var logo_fx = true; // 悬浮按钮所在的方向 真左 假右
var time_0, time_1, time_3; // 定时器 点击退出悬浮窗时定时器关闭
//可修改参数
var logo_ms = 200; // 动画播放时间
var DHK_ms = 200; // 对话框动画播放时间
var tint_color = "#00000"; // 对话框图片颜色

var win, win_1, win_2;
var img_dp = {};
var logo_right = 0;

// 将动画函数提升到模块作用域
var 动画;

module.exports = {
    open: function () {
        toast("浮动按钮目前有bug,种树才可以用");
        if (!this.isCreated() && !logo_buys) {
            this._main();
            // 使用非阻塞方式等待初始化完成
            let self = this;
            let checkInitialized = () => {
                if (!win || !win_1 || !win_2 || XY.length === 0) {
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
            win_1.logo.attr("alpha", "0.4");
            动画();
        } else {
            // 如果当前是关闭状态，则展开
            logo_switch = true;
            win_1.logo.attr("alpha", "0.9");
            动画();
        }
    },

    close: function () {
        if (this.isCreated()) {
            // 如果按钮处于展开状态，先关闭展开的子菜单
            if (logo_switch) {
                logo_switch = false;
                win_1.logo.attr("alpha", "0.4");
                // 等待动画完成后再关闭窗口
                let self = this;
                setTimeout(function() {
                    self._closeAllWindows();
                }, logo_ms + 100);
            } else {
                // 如果按钮已经处于关闭状态，直接关闭所有窗口
                this._closeAllWindows();
            }
        }
    },
    
    // 内部方法：关闭所有窗口并重置状态
    _closeAllWindows: function() {
        if (win) win.close();
        if (win_1) win_1.close();
        if (win_2) win_2.close();
        win = null;
        win_1 = null;
        win_2 = null;
        window_created = false;
        logo_switch = false;
        logo_buys = false;
        events.broadcast.emit("定时器关闭", time_0);
        // 通知main.js更新浮动按钮开关状态
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
        
        /**
         * 需要三个悬浮窗一起协作达到Auto.js悬浮窗效果
         * win  子菜单悬浮窗 处理子菜单选项点击事件
         * win_1  主悬浮按钮 
         * win_2  悬浮按钮动画替身,只有在手指移动主按钮的时候才会被触发 
         * 触发时,替身Y值会跟主按钮Y值绑定一起,手指弹起时代替主按钮显示跳动的小球动画
         */
        win = floaty.rawWindow(
            <frame >
                <frame id="id_logo" w="150" h="210" alpha="0"  >
                    <frame id="id_0" w="44" h="44" margin="33 0 0 0" alpha="1">
                        <img w="44" h="44" src="#009687" circle="true" />
                        <img w="28" h="28" src="@drawable/ic_arrow_back_black_48dp" tint="#ffffff" gravity="center" layout_gravity="center" />
                        <img id="id_0_click" w="*" h="*" src="#ffffff" circle="true" alpha="0" />
                    </frame>
                    <frame id="id_1" w="44" h="44" margin="86 28 0 0" alpha="1">
                        <img w="44" h="44" src="#ee534f" circle="true" />
                        <img w="28" h="28" src="@drawable/ic_assignment_black_48dp" tint="#ffffff" gravity="center" layout_gravity="center" />
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
                <frame id="logo" w="44" h="44" marginTop="83" alpha="1" />
                <frame id="logo_1" w="44" h="44" margin="0 83 22 0" alpha="1" layout_gravity="right" />
            </frame>
        )
        win.setTouchable(false);//设置子菜单不接收触摸消息
        // 初始位置设置为屏幕外
        win.setPosition(-1000, -1000);

        win_1 = floaty.rawWindow(
            <frame id="logo" w="44" h="44" alpha="0.4" >
                <img w="44" h="44" src="#ffffff" circle="true" alpha="0.8" />
                <img id="img_logo" w="32" h="32" src="./res/images/icon_float.png" circle="true" gravity="center" layout_gravity="center" />
                <img id="logo_click" w="*" h="*" src="#ffffff" alpha="0" />
            </frame>
        )
        win_1.setPosition(-30, device.height / 2)//悬浮按钮定位
        win_1.setTouchable(false); // 初始化完成前不可触摸

        win_2 = floaty.rawWindow(
            <frame id="logo" w="{{device.width}}px" h="44" alpha="0" >
                <img w="44" h="44" src="#ffffff" circle="true" alpha="0.8" />
                <img id="img_logo" w="32" h="32" src="./res/images/icon_float.png" circle="true" margin="6 6" />
            </frame>
        )
        win_2.setTouchable(false);//设置弹性替身不接收触摸消息

        /**
         * 脚本广播事件
         */
        XY = [], XY1 = [], TT = [], TT1 = [], img_dp = {}, dpZ = 0, logo_right = 0, dpB = 0, dp_H = 0
        events.broadcast.on("定时器关闭", function (X) { clearInterval(X) })
        events.broadcast.on("悬浮开关", function (X) {
            // 移除 ui.run() 包装
            // 检查win对象是否存在
            if (!win) {
                log("警告: win对象不存在，可能是悬浮窗已关闭");
                return;
            }
            
            switch (X) {
                case true:
                    win.id_logo.setVisibility(0);
                    win.setTouchable(true);
                    // log("更新状态")
                    logo_switch = true;  // 直接更新
                    break;
                case false:
                    win.id_logo.setVisibility(4);
                    win.setTouchable(false);
                    logo_switch = false; // 直接更新
            }
        });

        events.broadcast.on("悬浮显示", function (X1) {
            // 检查窗口对象是否存在
            if (!win_1 || !win_2) {
                log("警告: 窗口对象不存在，可能是悬浮窗已关闭");
                return;
            }
            
            ui.run(function () {
                win_2.logo.attr("alpha", "0");
                win_1.logo.attr("alpha", "0.4");
            })
        });

        /**
         * 等待悬浮窗初始化
         */
        terid = setInterval(() => {
            if (TT.length == 0 && win.logo.getY() > 0) {
                ui.run(function () {
                    TT = [win.logo.getX(), win.logo.getY()], TT1 = [win.logo_1.getLeft(), win.logo_1.getTop()], anX = [], anY = []// 获取logo 绝对坐标
                    XY = [
                        [win.id_0, TT[0] - win.id_0.getX(), TT[1] - win.id_0.getY()],//  获取子菜单 视图和子菜单与logo绝对坐标差值
                        [win.id_1, TT[0] - win.id_1.getX(), TT[1] - win.id_1.getY()],
                        [win.id_2, TT[0] - win.id_2.getX(), 0],
                        [win.id_3, TT[0] - win.id_3.getX(), TT[1] - win.id_3.getY()],
                        [win.id_4, TT[0] - win.id_4.getX(), TT[1] - win.id_4.getY()]]
                    // log("上下Y值差值:" + XY[0][2] + "DP值:" + (XY[0][2] / 83))
                    dpZ = XY[0][2] / 83
                    dpB = dpZ * 22
                    XY1 = [
                        [parseInt(dpZ * 41), TT1[0] - win.id_0.getLeft(), TT1[1] - win.id_0.getTop()],
                        [parseInt(dpZ * -65), TT1[0] - win.id_1.getLeft(), TT1[1] - win.id_1.getTop()],
                        [parseInt(dpZ * -106), TT1[0] - win.id_2.getLeft(), TT1[1] - win.id_2.getTop()],
                        [parseInt(dpZ * -65), TT1[0] - win.id_3.getLeft(), TT1[1] - win.id_3.getTop()],
                        [parseInt(dpZ * 41), TT1[0] - win.id_4.getLeft(), TT1[1] - win.id_4.getTop()]]
                    img_dp.h_b = XY[0][2]//两个悬浮窗Y差值
                    img_dp.w = parseInt(dpZ * 9)//计算logo左边隐藏时 X值
                    img_dp.ww = parseInt(dpZ * (44 - 9))//计算logo右边隐藏时 X值
                    logo_right = win.id_2.getX() - parseInt(dpZ * 22)
                    
                    // 设置win位置与win_1相同
                    win.setPosition(win_1.getX(), win_1.getY());
                    
                    win.id_logo.setVisibility(4) // 初始状态为关闭
                    win.id_logo.attr("alpha", "1")
                    events.broadcast.emit("定时器关闭", terid)
                    
                    // 初始化完成后允许触摸
                    win_1.setTouchable(true);
                    
                    log("悬浮窗初始化完成，准备就绪");
                })
            }
        }, 100)

        time_0 = setInterval(() => {
            //log("11")
        }, 1000)

        /**
         * 子菜单点击事件
         */
        function img_down() {
            // 检查窗口对象是否存在
            if (!win_1) {
                console.error("win_1对象不存在，可能是悬浮窗已关闭");
                return;
            }
            
            win_1.logo.attr("alpha", "0.4")
            logo_switch = false
            动画()
        }
        win.id_0_click.on("click", () => {
            // 关闭整个悬浮窗
            module.exports.close();
        })

        win.id_1_click.on("click", () => {
            // toastLog("日志")
            events.broadcast.emit("win_showLogDialog");
            img_down()
        })

        win.id_2_click.on("click", () => {
            // toastLog("启动脚本")
            events.broadcast.emit("win_startButton");
            img_down()
        })  

        win.id_3_click.on("click", () => {
            // toastLog("结束脚本")
            events.broadcast.emit("win_stopOtherEngines");
            img_down()
        })

        win.id_4_click.on("click", () => {
            events.broadcast.emit("win_stopAll");
            img_down();
        })



        /**
         * 补间动画
         */
        // 将动画函数赋值给模块作用域的变量
        动画 = function() {
            // 检查窗口对象是否存在
            if (!win || !win_1 || !win_2) {
                console.error("窗口对象不存在，可能是悬浮窗已关闭");
                return;
            }
            
            // 检查XY数组是否已初始化
            if (XY.length === 0) {
                console.error("XY数组未初始化，无法执行动画");
                return;
            }
            
            var anX = [], anY = [], slX = [], slY = []
            if (logo_switch) {
                if (logo_fx) {
                    for (let i = 0; i < XY.length; i++) {
                        // 确保视图对象有效
                        if (!XY[i][0]) {
                            console.error("视图对象无效: XY[" + i + "][0]");
                            continue;
                        }
                        anX[i] = ObjectAnimator.ofFloat(XY[i][0], "translationX", XY[i][1], 0);
                        anY[i] = ObjectAnimator.ofFloat(XY[i][0], "translationY", XY[i][2], 0);
                        slX[i] = ObjectAnimator.ofFloat(XY[i][0], "scaleX", 0, 1)
                        slY[i] = ObjectAnimator.ofFloat(XY[i][0], "scaleY", 0, 1)
                    }
                } else {
                    for (let i = 0; i < XY.length; i++) {
                        if (!XY[i][0]) {
                            console.error("视图对象无效: XY[" + i + "][0]");
                            continue;
                        }
                        anX[i] = ObjectAnimator.ofFloat(XY[i][0], "translationX", XY1[i][1], XY1[i][0]);
                        anY[i] = ObjectAnimator.ofFloat(XY[i][0], "translationY", XY1[i][2], 0);
                        slX[i] = ObjectAnimator.ofFloat(XY[i][0], "scaleX", 0, 1)
                        slY[i] = ObjectAnimator.ofFloat(XY[i][0], "scaleY", 0, 1)
                    }
                }
            } else {
                if (logo_fx) {
                    for (let i = 0; i < XY.length; i++) {
                        if (!XY[i][0]) {
                            console.error("视图对象无效: XY[" + i + "][0]");
                            continue;
                        }
                        anX[i] = ObjectAnimator.ofFloat(XY[i][0], "translationX", 0, XY[i][1]);
                        anY[i] = ObjectAnimator.ofFloat(XY[i][0], "translationY", 0, XY[i][2]);
                        slX[i] = ObjectAnimator.ofFloat(XY[i][0], "scaleX", 1, 0)
                        slY[i] = ObjectAnimator.ofFloat(XY[i][0], "scaleY", 1, 0)
                    }
                } else {
                    for (let i = 0; i < XY.length; i++) {
                        if (!XY[i][0]) {
                            console.error("视图对象无效: XY[" + i + "][0]");
                            continue;
                        }
                        anX[i] = ObjectAnimator.ofFloat(XY[i][0], "translationX", XY1[i][0], XY1[i][1]);
                        anY[i] = ObjectAnimator.ofFloat(XY[i][0], "translationY", 0, XY1[i][2]);
                        slX[i] = ObjectAnimator.ofFloat(XY[i][0], "scaleX", 1, 0)
                        slY[i] = ObjectAnimator.ofFloat(XY[i][0], "scaleY", 1, 0)
                    }
                }
            }
            
            // 检查是否有有效的动画
            if (anX.length === 0) {
                console.error("没有有效的动画对象");
                return;
            }
            
            set = new AnimatorSet();
            set.playTogether(
                anX[0], anX[1], anX[2], anX[3], anX[4],
                anY[0], anY[1], anY[2], anY[3], anY[4],
                slX[0], slX[1], slX[2], slX[3], slX[4],
                slY[0], slY[1], slY[2], slY[3], slY[4]);
            set.setDuration(logo_ms);
            threads.start(function () {
                logo_buys = true
                if (logo_switch) {
                    // console.log("开启状态");
                    events.broadcast.emit("悬浮开关", true);
                    sleep(logo_ms);
                } else {
                    // console.log("关闭状态");
                    sleep(logo_ms + 100);
                    events.broadcast.emit("悬浮开关", false);
                }
                logo_buys = false;
            });
            set.start();
        }
        
        function 对话框动画(X, Y, Z) {//X布尔值 标识显示还是隐藏 Y背景的视图 Z对话框的视图
            var anX = [], anY = [], slX = [], slY = []
            if (X) {
                anX = ObjectAnimator.ofFloat(Z, "translationX", win_1.getX() - (Z.getRight() / 2) + dpB - Z.getLeft(), 0);
                anY = ObjectAnimator.ofFloat(Z, "translationY", win_1.getY() - (Z.getBottom() / 2) + img_dp.h_b - Z.getTop(), 0);
                slX = ObjectAnimator.ofFloat(Z, "scaleX", 0, 1)
                slY = ObjectAnimator.ofFloat(Z, "scaleY", 0, 1)
                animator = ObjectAnimator.ofFloat(Y, "alpha", 0, 0.5)
                animator1 = ObjectAnimator.ofFloat(Z, "alpha", 1, 1)
            } else {
                anX = ObjectAnimator.ofFloat(Z, "translationX", 0, win_1.getX() - (Z.getRight() / 2) + dpB - Z.getLeft());
                anY = ObjectAnimator.ofFloat(Z, "translationY", 0, win_1.getY() - (Z.getBottom() / 2) + img_dp.h_b - Z.getTop());
                slX = ObjectAnimator.ofFloat(Z, "scaleX", 1, 0)
                slY = ObjectAnimator.ofFloat(Z, "scaleY", 1, 0)
                animator = ObjectAnimator.ofFloat(Y, "alpha", 0.5, 0)
                animator1 = ObjectAnimator.ofFloat(Z, "alpha", 1, 0)
            }
            set = new AnimatorSet()
            set.playTogether(
                anX, anY, slX, slY, animator, animator1);
            set.setDuration(DHK_ms);
            set.start();
        }

        //记录按键被按下时的触摸坐标
        var x = 0,
            y = 0;
        //记录按键被按下时的悬浮窗位置
        var windowX, windowY; G_Y = 0
        //记录按键被按下的时间以便判断长按等动作
        var downTime; yd = false;
        win_1.logo.setOnTouchListener(function (view, event) {
            if (logo_buys || !event || typeof event.getAction !== "function") {
                return true;
            }
            // log(event.getAction())
            switch (event.getAction()) {
                case event.ACTION_DOWN:
                    x = event.getRawX();
                    y = event.getRawY();
                    windowX = win_1.getX();
                    windowY = win_1.getY();
                    downTime = new Date().getTime();
                    return true;
                case event.ACTION_MOVE:
                    if (logo_switch) { return true; }
                    if (!yd) {//如果移动的距离大于h值 则判断为移动 yd为真
                        if (Math.abs(event.getRawY() - y) > 30 || Math.abs(event.getRawX() - x) > 30) { win_1.logo.attr("alpha", "1"); yd = true }
                    } else {//移动手指时调整两个悬浮窗位置
                        win_1.setPosition(windowX + (event.getRawX() - x),//悬浮按钮定位
                            windowY + (event.getRawY() - y));
                        win_2.setPosition(0, windowY + (event.getRawY() - y));//弹性 替身定位(隐藏看不到的,松开手指才会出现)
                        // 同时移动子菜单悬浮窗
                        win.setPosition(windowX + (event.getRawX() - x), windowY + (event.getRawY() - y));
                    }
                    return true;
                case event.ACTION_UP:                //手指弹起
                    //触摸时间小于 200毫秒 并且移动距离小于30 则判断为 点击
                    if (logo_buys) { return }//如果在动画正在播放中则退出事件 无操作
                    if (Math.abs(event.getRawY() - y) < 30 && Math.abs(event.getRawX() - x) < 30) {
                        //toastLog("点击弹起")
                        if (logo_switch) {
                            logo_switch = false
                            win_1.logo.attr("alpha", "0.4")
                        } else {
                            // 根据悬浮按钮位置决定展开方向
                            const buttonX = windowX + (event.getRawX() - x);
                            logo_fx = buttonX < device.width / 2; // 如果按钮在屏幕左侧，向右展开；否则向左展开
                            
                            if (logo_fx) {
                                // log("左边")
                                win.setPosition(windowX + (event.getRawX() - x),
                                    windowY + (event.getRawY() - y) - img_dp.h_b);
                                win.id_logo.setVisibility(0)
                                logo_switch = true
                                win_1.logo.attr("alpha", "0.9")
                            } else {
                                win.setPosition(win_1.getX() + (event.getRawX() - x) - logo_right,
                                    win_1.getY() + (event.getRawY() - y) - img_dp.h_b);
                                win.id_logo.setVisibility(0)
                                logo_switch = true
                                win_1.logo.attr("alpha", "0.9")
                            }
                        }
                        动画()
                    } else if (!logo_switch) {
                        //toastLog("移动弹起")
                        G_Y = windowY + (event.getRawY() - y)
                        win_1.logo.attr("alpha", "0.4")

                        if (windowX + (event.getRawX() - x) < device.width / 2) {
                            //toastLog("左边")
                            logo_fx = true
                            animator = ObjectAnimator.ofFloat(win_2.logo, "translationX", windowX + (event.getRawX() - x), 0 - img_dp.w);
                            mTimeInterpolator = new BounceInterpolator();
                            animator.setInterpolator(mTimeInterpolator);
                            animator.setDuration(300);
                            win_2.logo.attr("alpha", "0.4")//动画 替身上场
                            win_1.logo.attr("alpha", "0");//悬浮按钮隐藏
                            win_1.setPosition(0 - img_dp.w, G_Y)//悬浮按钮移动到终点位置等待替身动画结束
                            animator.start();
                        } else {
                            //toastLog("右边")
                            logo_fx = false
                            animator = ObjectAnimator.ofFloat(win_2.logo, "translationX", windowX + (event.getRawX() - x), device.width - img_dp.ww);
                            mTimeInterpolator = new BounceInterpolator();
                            animator.setInterpolator(mTimeInterpolator);
                            animator.setDuration(300);
                            win_2.logo.attr("alpha", "0.4")//动画替身上场
                            win_1.logo.attr("alpha", "0");//悬浮按钮隐藏
                            win_1.setPosition(device.width - img_dp.ww, G_Y)//悬浮按钮移动到终点位置等待替身动画结束
                            animator.start();
                        }
                        threads.start(function () {//动画的结束事件一直没有明白 只能拿线程代替了
                            logo_buys = true
                            sleep(logo_ms + 100)
                            events.broadcast.emit("悬浮显示", 0)

                            logo_buys = false
                        });
                    }
                    yd = false
                    return true;
            }
            return true;
        });
    }
}