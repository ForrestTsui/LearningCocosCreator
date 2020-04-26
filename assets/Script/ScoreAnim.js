// ScoreAnim.js

cc.Class({
  extends: cc.Component,

  init(scoreFX) {
    this.scoreFX = scoreFX;
  },

  hide() {
    this.scoreFX.despawn();
  }
});
