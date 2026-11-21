const hooks = require("../enums/hooks"),
  classes = require("../enums/classes");
module.exports = function (v1, v2) {
  const _pk = Object.create(null), pk = n => _pk[n] || (_pk[n] = v2.packet.get_all(n));
  let v4 = 0,
    v5 = 0;
  v2.command.add("dash", v6 => {
    if (!v6) return v2.command.message("Set the amount of delay your dashes have (default 25ms)");
    v6 = +v6;
    if (isNaN(v6)) return v2.command.message("Dash delay needs to be a number");
    const v8 = v2.settings.dash;
    v2.settings.dash = v6;
    v2.command.message("Dash delay has been set to " + v2.settings.dash + "ms from " + v8 + "ms");
  });
  v1.hook(...pk("S_ACTION_STAGE"), hooks.READ_DESTINATION_ALL, v9 => {
    if (!v2.player.isMe(v9.gameId)) return;
    if (!v2.utils.isEnabled(v9.skill.id)) return;
    if (["C_START_COMBO_INSTANT_SKILL", "C_START_INSTANCE_SKILL"].includes(v2.last.startSkill._name) && v9.stage === 0) {
      const v12 = v2.last.startSkill;
      if (v12?.targets?.length || v12?.endpoints?.length) v1.setTimeout(() => {
        if (!v2.action.inAction) return;
        v1.send(...pk("S_INSTANCE_ARROW"), {
          ...v2.last.startSkill,
          ...v9,
          actionId: v9.id
        });
      }, 3);
    }
    const v11 = v2.skills.getType(v9.skill.id);
    switch (v11) {
      case "dash":
        {
          if (v9.stage !== 0) return;
          const v14 = v2.last.packet("C_START_TARGETED_SKILL"),
            v15 = v14?.targets?.[0]?.gameId;
          v1.setTimeout(() => {
            if (v2.action.stage.id !== v9.id) return;
            if (!v2.action.inAction) return;
            v4 = Date.now() + v2.utils.getPacketBuffer();
            v1.send(...pk("S_INSTANT_DASH"), {
              gameId: v9.gameId,
              target: v15,
              loc: v14.dest,
              w: v14.w
            });
          }, v2.settings.dash);
          break;
        }
      case "catchBack":
        {
          if (v9.stage !== 0) return;
          if (v2.player.job === classes.REAPER) return;
          if (!v2.utils.canBackstabInArea()) return;
          const v17 = v2.last.packet("C_START_TARGETED_SKILL"),
            v18 = v17?.targets?.[0]?.gameId || 0x0n;
          if (!v2.utils.canBackstabEntity(v18)) return;
          v5 = Date.now() + v2.utils.getPacketBuffer();
          const v19 = {
            [classes.VALKYRIE]: 185
          }[v2.player.job] || 25;
          v1.setTimeout(() => {
            if (v2.action.stage.id !== v9.id) return;
            if (!v2.action.inAction) return;
            const v21 = v2.entity.getLocationForThisEntity(v18),
              v22 = v2.utils.getBossRadius(v18),
              v23 = v2.utils.applyDistance(v21, v21.w + Math.PI, v22);
            v1.send(...pk("S_INSTANT_MOVE"), {
              gameId: v9.gameId,
              loc: v23,
              w: v21.w
            });
          }, v19);
          break;
        }
      case "shortTel":
        {
          if (v9.stage !== 1 || !v2.settings.emulateJaunt) return;
          for (const v27 in v2.entity.players) {
            const v28 = v2.entity.players[v27];
            if (![3, 5, 8].includes(v28.relation)) continue;
            const v29 = v2.player.loc.dist2D(v28.pos);
            if (v29 >= 55) {
              v2.log.debug("JAUNT", "Allowing jaunt through due to dist", v29);
              continue;
            }
            if (v29 <= 5) {
              v2.log.debug("JAUNT", "Not emulating jaunt due to dist", v29);
              return;
            }
            const v30 = (v2.player.loc.angleTo(v28.pos) + Math.PI) % Math.PI,
              v31 = (v9.w + Math.PI) % Math.PI,
              v32 = Math.abs(v30 - v31);
            if (v32 <= 2) {
              v2.log.debug("JAUNT", "Not emulating jaunt due to arc", v32, v30, v31);
              return;
            }
          }
          const v24 = v2.last.packetForSkill(v9.skill.id),
            v25 = v24.loc.dist2D(v24.dest);
          v9.dest = v2.utils.applyDistance(v9.loc, v9.w, 334);
          const v26 = v9.loc.dist2D(v9.dest);
          if (v25 < v26) v9.dest = v24.dest;
          v9.dest.z = v24.dest.z;
          v1.setTimeout(() => {
            if (v2.action.stage.id !== v9.id) return;
            if (!v2.action.inAction) return;
            v5 = Date.now() + v2.utils.getPacketBuffer();
            v1.send(...pk("S_INSTANT_MOVE"), {
              gameId: v9.gameId,
              loc: v9.dest,
              w: v9.w
            });
          }, 25);
          break;
        }
      case "positionswap":
        {
          if (v9.stage !== 0) return;
          break;
        }
    }
  });
  v1.hook(...pk("S_INSTANT_MOVE"), hooks.MODIFY_REAL, v34 => {
    if (!v2.player.isMe(v34.gameId)) return;
    if (Date.now() > v5) return;
    return false;
  });
  v1.hook(...pk("S_INSTANT_DASH"), hooks.MODIFY_REAL, v36 => {
    if (!v2.player.isMe(v36.gameId)) return;
    if (Date.now() > v4) return;
    return false;
  });
  v1.hook(...pk("S_INSTANCE_ARROW"), hooks.MODIFY_REAL, v38 => {
    if (!v2.player.isMe(v38.gameId)) return;
    if (!v2.utils.isEnabled(v38.skill.id)) return;
    return false;
  });
};
