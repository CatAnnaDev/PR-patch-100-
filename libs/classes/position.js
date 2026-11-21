const hooks = require("../enums/hooks");
class PositionChecker {
  get loc() {
    return this.getCurrentPosition();
  }
  get w() {
    return this.info.w;
  }
  getCurrentPosition = () => {
    return this.info.reaction;
  };
  requestReactionPosTick = v4 => {
    if (v4.tick) this.info.enabled = false;else {
      this.info.enabled = true;
      v4.tick = 50;
      return true;
    }
  };
  updateReactionPos = v6 => {
    this.info.reaction = v6.loc;
    this.info.lastUpdate = v6.loc;
    if (this.info.enabled) return false;
  };
  actionToClient = v8 => {
    if (!this.mods.player.isMe(v8.gameId)) return;
    this.info.w = v8.w;
    this.info.reaction = v8.loc;
  };
  playerLocation = v10 => {
    this.info.reaction = v10.loc;
    if (!this.mods.action.inAction || v10.skill) this.info.w = v10.w;
  };
  instantMove = v12 => {
    if (!this.mods.player.isMe(v12.gameId)) return;
    this.info.reaction = v12.loc;
    if (this.mods.action.inAction && this.mods.auto) this.mods.auto.hit("rubberband");
  };
  loaded = () => {
    this.info.timer = this.mod.setInterval(() => {
      if (!this.info.enabled) return;
      this.mod.send(...this.mods.packet.get_all("S_REQUEST_REACTION_POS_TICK"), {
        tick: 50
      });
    }, 500);
  };
  destructor = () => {
    this.mod.clearInterval(this.info.timer);
  };
  constructor(v17, v18) {
    this.mod = v17;
    this.mods = v18;
    this.info = {
      enabled: true,
      reaction: {},
      w: 0,
      lastUpdate: {},
      timer: null
    };
    v17.hook("S_LOGIN", "event", this.loaded);
    v17.hook(...v18.packet.get_all("C_UPDATE_REACTION_POS"), hooks.MODIFY_REAL, this.updateReactionPos);
    v17.hook(...v18.packet.get_all("S_REQUEST_REACTION_POS_TICK"), hooks.MODIFY_REAL, this.requestReactionPosTick);
    v17.hook(...v18.packet.get_all("C_PLAYER_LOCATION"), hooks.READ_DESTINATION_ALL_CLASS, this.playerLocation);
    v17.hook(...v18.packet.get_all("C_NOTIFY_LOCATION_IN_ACTION"), hooks.READ_DESTINATION_ALL_CLASS, this.playerLocation);
    v17.hook(...v18.packet.get_all("S_INSTANT_MOVE"), hooks.READ_DESTINATION_ALL_CLASS, this.instantMove);
    v17.hook(...v18.packet.get_all("S_ACTION_STAGE"), hooks.READ_DESTINATION_ALL_CLASS, this.actionToClient);
    v17.hook(...v18.packet.get_all("S_ACTION_END"), hooks.READ_DESTINATION_ALL_CLASS, this.actionToClient);
  }
}
module.exports = PositionChecker;
