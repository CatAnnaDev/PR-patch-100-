const hooks = require("../enums/hooks"),
  classes = require("../enums/classes");
module.exports = function (mod, lib) {
  let v4 = -1.5;
  const v5 = ["defence", "movingDefence", "pressHit"];
  lib.command.add("desync", v9 => {
    v9 = +v9;
    if (isNaN(v9)) return lib.command.message("Need to provide a valid value.");
    lib.command.message("Value set to " + v9);
    v4 = v9 * -1;
  });
  const v6 = v11 => {
      if (!lib.utils.isEnabled(lib?.action?.serverStage?.skill?.id)) return;
      if (lib.skills.getTypeId(lib?.action?.stage?.skill?.id) === 42) return;
      if (!lib.action.serverInAction) return false;
      if (Date.now() - lib.action.serverStage._time > 2500) return false;
      if (!lib.action.serverStage.animSeq.length) return false;
      const v13 = lib.action.stage.loc.dist2D(v11),
        v14 = v7(),
        v15 = lib.action.serverStage.loc.dist2D(v14);
      if (v13 > v15) return true;
    },
    v7 = () => {
      const v17 = lib.action.serverStage;
      let v18 = v17.loc;
      if (!v17.animSeq.length) return v18.clone();
      const v19 = v17.w + lib.skills.getDirectionModifier(v17.skill.id, v17.stage);
      for (const v20 of v17.animSeq) {
        v18 = lib.utils.applyDistance(v18, v19, v20.distance);
      }
      return v18;
    },
    v8 = v21 => {
      if (!lib.utils.isEnabled(v21.skill.id)) return;
      if (!v6(v21.loc)) return;
      if (lib.auto) lib.auto.hit("desync");
      v21.loc = v7();
      return true;
    };
  mod.hook(...lib.packet.get_all("C_START_SKILL"), hooks.MODIFY_INTERNAL_REAL, v8);
  mod.hook(...lib.packet.get_all("C_START_TARGETED_SKILL"), hooks.MODIFY_INTERNAL_REAL, v8);
  mod.hook(...lib.packet.get_all("C_START_COMBO_INSTANT_SKILL"), hooks.MODIFY_INTERNAL_REAL, v8);
  mod.hook(...lib.packet.get_all("C_START_INSTANCE_SKILL"), hooks.MODIFY_INTERNAL_REAL, v8);
  mod.hook(...lib.packet.get_all("C_START_INSTANCE_SKILL_EX"), hooks.MODIFY_INTERNAL_REAL, v8);
  mod.hook(...lib.packet.get_all("C_PRESS_SKILL"), hooks.MODIFY_INTERNAL_REAL, v8);
  mod.hook(...lib.packet.get_all("C_PLAYER_LOCATION"), hooks.MODIFY_REAL, v23 => {
    if (!lib.utils.isEnabled()) return;
    if (v6(v23.loc)) return false;
  });
  mod.hook(...lib.packet.get_all("S_ACTION_END"), hooks.MODIFY_INTERNAL_FAKE, v25 => {
    if (!lib.utils.isEnabled(v25.skill.id) || !lib.player.isMe(v25.gameId)) return;
    if (!v6(v25.loc)) return;
    if ([21, 22].includes(lib.skills.getTypeId(v25.skill.id))) return;
    lib.log.debug("AD", "sending S_INSTANT_MOVE");
    v25.loc = v7();
    mod.send(...lib.packet.get_all("S_INSTANT_MOVE"), v25);
    return true;
  });
  mod.hook(...lib.packet.get_all("C_NOTIFY_LOCATION_IN_ACTION"), hooks.MODIFY_REAL, v27 => {
    if (!lib.utils.isEnabled(v27.skill.id)) return;
    if (v6(v27.loc)) return false;
    if (lib.player.job === classes.SLAYER && lib.utils.getSkillInfo(v27.skill.id).skill === 17) return;
    v27.loc = lib.utils.applyDistance(v27.loc, v27.w, v4);
    return true;
  });
};
