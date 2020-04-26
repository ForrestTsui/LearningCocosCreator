
cc.Class({
  extends: cc.Component,

  properties: {
    jumpDuration: 0,
    squashDuration: 0,
    jumpHeight: 0,
    maxMoveSpeed: 0,
    accel: 0,
    jumpAudio: {
      default: null,
      type: cc.AudioClip
    }
  },

  onLoad() {
    // enabled: Boolean, 是否每帧执行该组件的 update 方法
    this.enabled = false;
    // 算上一半身体以完全不穿帮
    this.borderLeft = (-this.node.parent.width / 2) + (this.node.width / 2);
    this.borderRight = (this.node.parent.width / 2) - (this.node.width / 2);
    this.registerInputControl();
  },

  start() {
    // 加速度方向开关
    this.accLeft = false;
    this.accRight = false;
    // 移动即X坐标变动 
    this.xSpeed = 0;
  },

  /**
   * @param {cc.Vec2} pos X为0(原点),y为地平面实际高度的起始坐标，由上层脚本传递
   */
  startMove(pos) {
    this.enabled = true;
    this.node.setPosition(pos);
    this.runJumpAction();
  },

  stopMove() {
    this.enabled = false;
    this.node.stopAllActions();
    // 本游戏没有销毁场景操作，重置速度让重新开始的主角静止，否则重新开始的主角带着旧数值自己动。
    this.xSpeed = 0;
  },

  runJumpAction() {
    let t = cc.tween;
    // 'position' 把 x 算进去，虽然x是0，主角移动(x变化时)会出问题
    let jumpUp = t().by( this.jumpDuration, { y: this.jumpHeight }, { easing: 'cubicOut' });
    let jumpDown = t().by( this.jumpDuration, { y: -this.jumpHeight }, { easing: 'cubicIn' });
    // scale 是整体缩放(x、y一起缓动)，scaleX/scaleY 独立控制
    let squash = t().to( this.squashDuration, { scaleX: 1.1, scaleY: 0.8 }, { easing: 'smooth' });
    let stretch = t().to( this.squashDuration, { scaleX: 0.9, scaleY: 1.2 }, { easing: 'smooth' });
    let squashBack = t().to( this.squashDuration, { scaleX: 1, scaleY: 1 }, { easing: 'smooth' });

    let callAudio = t().call(() => { cc.audioEngine.playEffect(this.jumpAudio, false); });

    return t(this.node).repeatForever(
      t().sequence(squash, stretch, jumpUp, squashBack, jumpDown, callAudio)
    ).start();
  },

  registerInputControl() {
    const KEY_EVENT = cc.SystemEvent.EventType;
    cc.systemEvent.on(KEY_EVENT.KEY_DOWN, this.onKeyDown, this);
    cc.systemEvent.on(KEY_EVENT.KEY_UP, this.onKeyUp, this);

    const TOUCH_EVENT = cc.Node.EventType;
    // Warning: event should register on Canvas node! 遗漏 .parent 会出错
    this.node.parent.on(TOUCH_EVENT.TOUCH_START, this.onTouch, this);
    this.node.parent.on(TOUCH_EVENT.TOUCH_END, this.offTouch, this);
  },

  onKeyDown(event) {
    this._switchKeycode(event.keyCode, true);
  },

  onKeyUp(event) {
    this._switchKeycode(event.keyCode, false);
  },

  /**
   * @param {Enumerator} keyCode 按键的枚举值
   * @param {Boolean} condition 条件是按下还是松开
   */
  _switchKeycode(keyCode, condition) {
    const KEY = cc.macro.KEY;

    switch (keyCode) {
      case KEY.a:
        if (condition === true) {
          this.accLeft = true;
        } else if (condition === false) {
          this.accLeft = false;
        } else {
          cc.log('傻屌没传布尔值!');
        }
        break;
      case KEY.d:
        if (condition === true) {
          this.accRight = true;
        } else if (condition === false) {
          this.accRight = false;
        } else {
          cc.log('傻屌没传布尔值!');
        }
        break;
      default:
        break;
    }
  },

  onTouch(event) {
    let touchLocation = event.getLocation();
    // touchLocation is a cc.Vec2, don't forget '.x'!
    if (touchLocation.x <= cc.winSize.width / 2) {
      this.accLeft = true;
    } else {
      this.accRight = true;
    }
    // es6完成版说这一步是“不要捕捉事件”，还不懂
    return true;
  },

  offTouch(event) {
    [this.accLeft, this.accRight] = [false, false];
  },

  /** 向上层模块传递自身坐标 */
  getCenterPos() {
    // 锚点是(0.5, 0)，故加高度的一半为中心
    return cc.v2(this.node.x, this.node.y + this.node.height / 2);
  },

  update(dt) {
    // 速度刷新模块，根据加速度方向
    if (this.accLeft) {
      this.xSpeed -= this.accel * dt;
    } else if (this.accRight) {
      this.xSpeed += this.accel * dt;
    }

    // 限制极速
    if (Math.abs(this.xSpeed) > this.maxMoveSpeed) {
      this.xSpeed = this.maxMoveSpeed * this.xSpeed / Math.abs(this.xSpeed);
    }

    let nodeX = this.node.x;
    nodeX += this.xSpeed * dt;

    // 屏幕限制模块
    if (nodeX < this.borderLeft) {
      nodeX = this.borderLeft;
      /**
       * 撞墙是强制坐标不动，但速度刷新模块一直在跑
       * 不清零则反向运动时xSpeed会先减去“根据之前加速开关刷新着的数值”
       * 表现是撞墙后反向运动时，主角像“吸”在边界一段时间
       */
      this.xSpeed = 0;
    } else if (nodeX > this.borderRight) {
      nodeX = this.borderRight;
      this.xSpeed = 0;
    }

    this.node.x = nodeX;
  },
});
