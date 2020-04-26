// ScoreFX.js

cc.Class({
  extends: cc.Component,

  properties: {
      anim: {
        default: null,
        type: cc.Animation
      }
  },

  init (game) {
    this.game = game;
    let scoreAnim = this.anim.getComponent('ScoreAnim');
    scoreAnim.init(this);
  },

  despawn() {
    this.game.despawnScoreFX(this.node);
  },

  play() {
    this.anim.play('score_pop');
  }
});
