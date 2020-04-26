const Player = require('Player');

cc.Class({
  extends: cc.Component,

  properties: {
    // 获取地平面实际高度
    ground: cc.Node,
    // 改变按钮节点坐标以显示/隐藏
    btnNode: cc.Node,
    // 控制主角行动
    player: {
      default: null,
      type: Player
    },
    minStarDuration: 0,
    maxStarDuration: 0,
    starPrefab: {
      default: null,
      type: cc.Prefab
    },
    progressBarOfStar: {
      default: null,
      type: cc.ProgressBar
    },
    scoreAudio: {
      default: null,
      type: cc.AudioClip
    },
    scoreFXPrefab: {
      default: null,
      type: cc.Prefab
    },
    nameAndScore: cc.Label,
    instructionGoal: cc.Label,
    controlHint: cc.Label,
    isMobile: {
      default: '',
      multiline: true
    },
    isPC: {
      default: '',
      multiline: true
    },
  },

  onLoad () {
    this.enabled = false;
    this.controlHint.string = cc.sys.isMobile ? this.isMobile : this.isPC;
    this.groundY = this.ground.y + this.ground.height / 2;
    // 保存当前星星，失败时放不到对象池，手动销毁
    this.currentStar = null;
    // 保存当前星星X坐标与下个X坐标作比较，防止前后两颗星星距离过近造成负体验
    this.currentStarX = 0;
    this.starPool = new cc.NodePool('StarPrefab');
    this.starDuration = 0;
    /**
     * 初始化进度值，1.0为倒带，0.0为从空到满
     * progress(进度值)只能是0-1之间的浮点数
     */
    this.progressBarOfStar.progress = 1.0;
    this.scoreFxPool = new cc.NodePool('ScoreFX');
  },

  start() {
    this.score = 0;
    this.starTimer = 0;
  },

  onStartBtnClicked() {
    this.enabled = true;
    this.btnNode.x = 3000;
    this.nameAndScore.string = 'Score: 0';
    // 隐藏(active)是node下面的属性，这里声明Label就要调其下的node
    this.instructionGoal.node.active = false;
    this.controlHint.node.active = false;
    this.player.startMove(cc.v2(0, this.groundY));
    this.score = 0;
    this.spawnNewStar();
  },

  spawnNewStar() {
    let newStar = this.starPool.get();

    if (!newStar) {
      newStar = cc.instantiate(this.starPrefab);
    }

    this.node.addChild(newStar);
    newStar.setPosition(this.randStarPosition());
    // 初始化必须在加入主节点之后，先有节点再初始化它
    newStar.getComponent('StarPrefab').init(this);
    this.setStarLife();
    this.currentStar = newStar;
    this.progressBarOfStar.progress = 1.0;
  },

  /**
   * @param {cc.Prefab} star star节点
   */
  despawnStar(star) {
    this.starPool.put(star);
    this.spawnNewStar();
  },

  /**
   * @returns {cc.Vec2} 随机坐标
   */
  randStarPosition() {
    let randX = 0;
    // 子节点最大、最小坐标绝对值是父节点宽度的一半
    let absMaxX = this.node.width / 2;
    
    // 新X坐标与旧X坐标至少间隔2颗星星的宽度，否则继续随机
    do {
      randX = (Math.random() - 0.5) * 2 * absMaxX;
    } while (Math.abs(randX - this.currentStarX) < 120) 

    // 收集半径是60，不加配数可能星星一半穿帮地面，加太多可能碰不到星星，故加50
    let randY = this.groundY + Math.random() * this.player.getComponent('Player').jumpHeight + 50;
    this.currentStarX = randX;

    return cc.v2(randX, randY);
  },

  setStarLife() {
    this.starTimer = 0;
    this.starDuration = this.minStarDuration + Math.random() * (this.maxStarDuration - this.minStarDuration);
  },

  getStarRatio() {
    return 1 - this.starTimer / this.starDuration;
  },

  gainScore(pos) {
    this.score += 1;
    this.nameAndScore.string = 'Score: ' + this.score;
    cc.audioEngine.playEffect(this.scoreAudio, false);

    let fx = this.spawnScoreFX();
    this.node.addChild(fx);
    fx.setPosition(pos);

    let scoreFX = fx.getComponent('ScoreFX');
    scoreFX.init(this);
    scoreFX.play();
  },

  spawnScoreFX() {
    let fx = this.scoreFxPool.get();

    if (!fx) {
      fx = cc.instantiate(this.scoreFXPrefab);
    }
  
    return fx;
  },

  despawnScoreFX(scoreFx) {
    this.scoreFxPool.put(scoreFx);
  },

  _updateProgressBar() {
    this.progressBarOfStar.progress =  this.getStarRatio();
  },

  update(dt) {
    if (this.starTimer > this.starDuration) {
      this.gameOver();
      return;
    }

    this._updateProgressBar();
    this.starTimer += dt;
  },

  gameOver() {
    this.enabled = false;
    this.btnNode.x = 0;
    this.controlHint.node.active = true;
    this.instructionGoal.node.active = true;
    this.currentStar.destroy();
    this.player.stopMove();
    this.saySomeThing();
  },

  saySomeThing() {
    let score = this.score;
    let string = this.instructionGoal.string;

    if (score <= 10) {
      string = 'Are you kidding me?';
    } else if (score > 10 && score <= 30) {
      string = 'Good job, One more try!';
    } else if (score > 30) {
      string = 'Great job!'
    }

    this.instructionGoal.string = string;
  }
});
