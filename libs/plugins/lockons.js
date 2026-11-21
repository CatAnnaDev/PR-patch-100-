const hooks = require("../enums/hooks");
module.exports = function (v1, v2) {
  const _pk = Object.create(null), pk = n => _pk[n] || (_pk[n] = v2.packet.get_all(n));
  let v4 = [],
    v5 = 0;
  v1.hook(...pk("S_CAN_LOCKON_TARGET"), hooks.MODIFY_REAL, v8 => {
    if (!v2.utils.isEnabled(v8.skill.id)) return;
    return false;
  });
  const v6 = v10 => {
      const v12 = v2.skills.getLockonData(v10);
      if (!v12) return 50;
      let v13 = 0;
      for (const v14 of v12 || []) {
        for (const v15 in v14) {
          v13 += v14[v15];
        }
      }
      return v13 + v2.action.effects.lockon;
    },
    v7 = v16 => {
      if (v4.length >= v6(v16.skill.id)) {
        v2.log.debug("LOCKON", "reached max lockon targets");
        return;
      }
      v4.push(v16.target);
      v1.send(...pk("S_CAN_LOCKON_TARGET"), {
        ...v16,
        success: true
      });
    };
  v1.hook(...pk("C_CAN_LOCKON_TARGET"), hooks.MODIFY_ALL, v18 => {
    if (!v2.utils.isEnabled(v18.skill.id)) return;
    if (v2.action.stage._time > v5) {
      v4 = [];
      v5 = v2.action.stage._time;
    }
    if (v4.includes(v18.target)) return;
    const v20 = v18.target.toString(),
      v21 = v2.skills.getLockonData(v18.skill.id);
    if (!v21) {
      if (v2.entity.players[v20]) {
        v2.log.debug("LOCKON", "Sending hardcoded lockon success");
        v7(v18);
        return;
      }
    }
    for (const v22 of v21 || []) {
      for (const v23 in v22) {
        switch (v23) {
          case "enemyOrPvp":
            {
              if ((v2.entity.mobs[v20] || v2.entity.players[v20]) && v2.utils.canLockonEntity(v20)) {
                v7(v18);
                return;
              }
              break;
            }
          case "allyExceptMe":
            {
              if (v2.entity.players[v20]) {
                v7(v18);
                return;
              }
              break;
            }
          case "raidExceptMe":
          case "raid":
            {
              if (v2.player.playersInParty.has(BigInt(v18.target))) {
                v7(v18);
                return;
              }
              break;
            }
          default:
            {
              v2.log.error("LOCKON", "Failed to identify type for " + v23 + " - " + v18.skill.id + " - " + v2.player.templateId);
              break;
            }
        }
      }
    }
    v1.send(...pk("S_CAN_LOCKON_TARGET"), {
      ...v18,
      success: false
    });
  });
};
