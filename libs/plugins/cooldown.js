const hooks = require("../enums/hooks"),
  classes = require("../enums/classes");
module.exports = function (v1, v2) {
  let v4 = null;
  const v5 = v8 => {
    if (!v2.utils.isEnabled(v8.skill.id)) return;
    const v10 = Math.max(0, v2.ping.ping - v2.ping.jitter - 5);
    v8.cooldown -= v10;
    v8.nextStackCooldown -= v10;
    if (v8.cooldown < 0) v8.cooldown = 0;
    if (v8.nextStackCooldown < 0) v8.nextStackCooldown = 0;
    return true;
  };
  v1.hook(...v2.packet.get_all("S_DECREASE_COOLTIME_SKILL"), hooks.MODIFY_REAL, v5);
  v1.hook(...v2.packet.get_all("S_START_COOLTIME_SKILL"), hooks.MODIFY_REAL, v5);
  v1.hook(...v2.packet.get_all("S_CREST_MESSAGE"), hooks.READ_ALL, v11 => {
    if (v11.type !== 6) return;
    if (!v2.utils.isEnabled()) return;
    if (v2.cooldown.isOnCooldown(v11.skill)) v1.send(...v2.packet.get_all("S_DECREASE_COOLTIME_SKILL"), {
      skill: v11.skill,
      cooldown: 0
    });
  });
  const v6 = v13 => {
      const v15 = v2.skills.getSkillsToApplyCooldownToFrom(v13);
      if (!v15) return [v13];
      const v16 = [];
      for (const v17 of v15) {
        const [v18, v19] = v17.split("-");
        for (const v20 of v2.last.skillList.skills[v17] || []) {
          const v21 = v2.utils.getSkillInfo(0);
          v16.push(v21.calculateNewId(+v18, v20, +v19));
        }
      }
      if (!v16.includes(v13)) v16.push(v13);
      return v16;
    },
    v7 = v22 => {
      if (v2.player.job !== classes.SLAYER) return false;
      const v24 = v2.utils.getSkillInfo(v22);
      if (v24.skill !== 8) return false;
      if (!v2.effects.getAbnormality(300805)) return false;
      return true;
    };
  v1.hook(...v2.packet.get_all("S_ACTION_STAGE"), hooks.READ_DESTINATION_FAKE, v25 => {
    if (!v2.player.isMe(v25.gameId)) return;
    if (v25.stage) return;
    if (!v2.utils.isEnabled()) return;
    v1.clearTimeout(v4);
    if (!v2.utils.isEnabled(v25.skill.id)) return;
    if (v7(v25.skill.id)) return;
    const v27 = v2.skills.getCooldownData(v25.skill.id);
    if (!v27?.cooltime) return;
    const v28 = Date.now() - v2.ping.ping - v2.skills.getActionStageDelay(v25.skill.id),
      v29 = v27.delay / v2.action.speed.real,
      v30 = v2.utils.getSkillInfo(v25.skill.id);
    v4 = v1.setTimeout(() => {
      if (v2.cooldown.getData(v30.skill, true)?.time > v28) return;
      if (!v2.action.inAction) return;
      if (v2.action.stage.id !== v25.id) return;
      if (v2.skills.getType(v30.id) === "movingDefence") return;
      const v32 = v6(v30.id);
      for (const v35 of v32) {
        v1.send(...v2.packet.get_all("S_START_COOLTIME_SKILL"), {
          skill: v35,
          cooldown: v27.cooltime
        });
      }
      const v33 = v36 => {
        let v38 = false;
        for (const v39 of v32) {
          if (v39 === v36) v38 = true;
        }
        if (!v38) return;
        v34._onTimeout();
        v1.clearTimeout(v34);
      };
      v2.cooldown.on("reset", v33);
      const v34 = v1.setTimeout(() => {
        v2.cooldown.off("reset", v33);
        const v41 = v2.cooldown.getData(v30.skill, true);
        if (v41?.cooldown !== 0 && v41?.time > v28) return;
        for (const v42 of v32) {
          v1.send(...v2.packet.get_all("S_DECREASE_COOLTIME_SKILL"), {
            skill: v42,
            cooldown: 0
          });
        }
      }, v2.utils.getPacketBuffer());
    }, v29);
  });
};
