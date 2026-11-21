const hooks = require("../enums/hooks"),
  EventEmitter = require("events");
class Action extends EventEmitter {
  get inAction() {
    return this.info.inAction;
  }
  get serverInAction() {
    return this.info.serverInAction;
  }
  get inSpecialAction() {
    return this.info.inSpecialAction;
  }
  get speed() {
    return this.info.speed;
  }
  get effects() {
    return this.info.effects;
  }
  get stage() {
    return this.info.lastStage;
  }
  get serverStage() {
    return this.info.serverStage;
  }
  get end() {
    return this.info.lastEnd;
  }
  get serverEnd() {
    return this.info.serverEnd;
  }
  get keptMovingCharge() {
    return this.info.keptMovingCharge;
  }
  actionStage = v11 => {
    return v12 => {
      if (!this.mods.player.isMe(v12.gameId)) return;
      if (v11) {
        if (v12.stage === 0) v12._time = Date.now();else v12._time = this.serverStage._time;
        this.info.serverInAction = true;
        this.info.serverStage = v12;
        return;
      }
      this.info.inAction = true;
      this.info.inSpecialAction = false;
      if (this.mods.skills.getKeepMovingCharge(v12.skill.id)) this.info.keptMovingCharge = this.stage.stage;
      if (v12.stage === 0) {
        v12._time = Date.now();
        v12._stageTime = Date.now();
        this.info.speed = this.mods.skills.getSpeed(v12.skill.id);
        this.info.effects = this.mods.effects.getAppliedEffects(v12.skill.id);
      } else {
        v12._time = this.stage._time;
        v12._stageTime = Date.now();
      }
      this.info.lastStage = v12;
    };
  };
  actionEnd = v14 => {
    return v15 => {
      if (!this.mods.player.isMe(v15.gameId)) return;
      if (v14) {
        this.info.serverInAction = false;
        v15._time = Date.now();
        this.info.serverEnd = v15;
        return;
      }
      this.info.inAction = false;
      this.info.inSpecialAction = false;
      v15._time = Date.now();
      this.info.lastEnd = v15;
    };
  };
  sEachSkillResult = v17 => {
    return v18 => {
      if (!v18.reaction.enable) return;
      if (this.mods.player.isMe(v18.source)) return;
      if (!this.mods.player.isMe(v18.target)) return;
      v18.reaction._time = Date.now();
      if (v17) {
        this.info.serverInAction = true;
        this.info.serverStage = v18.reaction;
        return;
      }
      this.emit("reaction", v18.reaction);
      this.info.inAction = true;
      this.info.inSpecialAction = true;
      this.info.lastStage = v18.reaction;
    };
  };
  constructor(v20, v21) {
    super();
    this.mod = v20;
    this.mods = v21;
    this.info = {
      inAction: false,
      lastStage: null,
      lastEnd: null,
      speed: null,
      effects: null,
      inSpecialAction: false,
      keptMovingCharge: null,
      serverInAction: null,
      serverStage: null,
      serverEnd: null
    };
    v20.hook(...v21.packet.get_all("S_ACTION_STAGE"), hooks.READ_DESTINATION_ALL_CLASS, this.actionStage());
    v20.hook(...v21.packet.get_all("S_ACTION_END"), hooks.READ_DESTINATION_ALL_CLASS, this.actionEnd());
    v20.hook(...v21.packet.get_all("S_EACH_SKILL_RESULT"), hooks.READ_DESTINATION_ALL_CLASS, this.sEachSkillResult());
    v20.hook(...v21.packet.get_all("S_ACTION_STAGE"), hooks.READ_REAL, this.actionStage(true));
    v20.hook(...v21.packet.get_all("S_ACTION_END"), hooks.READ_REAL, this.actionEnd(true));
    v20.hook(...v21.packet.get_all("S_EACH_SKILL_RESULT"), hooks.READ_REAL, this.sEachSkillResult(true));
  }
}
module.exports = Action;
