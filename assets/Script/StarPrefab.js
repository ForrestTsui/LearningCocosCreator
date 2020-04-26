
cc.Class({
  extends: cc.Component,

  properties: {
    pickRadius: 0,
  },

  init(game) {
    this.enabled = true;
    this.game = game;
    this.node.opacity = 255;
  },

  onLoad() {
    // onLoad是节点初始化时调用，对象池是对象复用，故只在第一颗星星调用。
    // cc.log('Star_onLoad()');
    this.enabled = false;
  },

  getStarPosition() {
    return this.node.position;
  },

  getPlayerDistance() {
    let Player = this.game.player;
    let playerPosition = Player.getCenterPos();
    let starPosition = this.getStarPosition();

    return starPosition.sub(playerPosition).mag();
  },

  onPicked() {
    let Game = this.game;
    Game.gainScore(this.node.position);
    Game.despawnStar(this.node);
  },

  update(dt) {
    if (this.getPlayerDistance() < this.pickRadius) {
      this.onPicked();
      // 此情况就是单纯的将控制权转交给主调函数继续执行
      return;
    }

    let opacityRatio = this.game.getStarRatio();
    let minOpacity = 50;
    this.node.opacity = minOpacity + (255 - minOpacity) * opacityRatio;
  }
});
