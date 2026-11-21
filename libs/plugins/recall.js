const hooks = require("../enums/hooks");
module.exports = function (v1, v2) {
  const _pk = Object.create(null), pk = n => _pk[n] || (_pk[n] = v2.packet.get_all(n));
  let v4 = [],
    v5 = false,
    v6 = null;
  const v7 = () => {
      v5 = false;
      if (v6) v1.send(...pk(v6._name), v6);
    },
    v8 = () => {
      return v2.player.job === 9 && v2.skills.isSupported(210300);
    },
    v9 = v18 => {
      return v18 - v2.player.templateId * 100 === 8;
    },
    v10 = v20 => {
      if (!v2.player.isMe(v20.gameId)) return;
      if (!v9(v20.skill.id)) return;
      if (!v2.utils.isEnabled()) return;
      v20.skill = 210300;
      v6 = null;
      v5 = true;
      return true;
    },
    v11 = v22 => {
      if (!v2.player.isMe(v22.gameId)) return;
      if (!v9(v22.skill.id)) return;
      if (!v2.utils.isEnabled()) return;
      v22.skill = 210300;
      v7();
      return true;
    },
    v12 = () => {
      if (v5 && v2.utils.isEnabled()) {
        v2.log.debug("RECALL", "blocking packet due to being in recall");
        v1.send(...pk("S_CANNOT_START_SKILL"), {
          skill: v2.last.startSkill.skill.id
        });
        return false;
      }
    },
    v13 = () => {
      if (v12() === false) {
        v6 = v2.last.startSkill;
        return false;
      }
    },
    v14 = v26 => {
      if (!v2.player.isMe(v26.gameId)) return;
      if (v26.alive) return;
      v5 = false;
    },
    v15 = () => {
      v4.push(v1.hook(...pk("S_CREATURE_LIFE"), hooks.READ_DESTINATION_ALL, v14));
      v4.push(v1.hook(...pk("S_ACTION_STAGE"), hooks.MODIFY_INTERNAL_REAL, v10));
      v4.push(v1.hook(...pk("S_ACTION_END"), hooks.MODIFY_INTERNAL_REAL, v11));
      v4.push(v1.hook("C_START_SKILL", "event", hooks.MODIFY_INTERNAL_REAL, v12));
      v4.push(v1.hook("C_START_TARGETED_SKILL", "event", hooks.MODIFY_INTERNAL_REAL, v12));
      v4.push(v1.hook("C_START_COMBO_INSTANT_SKILL", "event", hooks.MODIFY_INTERNAL_REAL, v12));
      v4.push(v1.hook("C_START_INSTANCE_SKILL", "event", hooks.MODIFY_INTERNAL_REAL, v12));
      v4.push(v1.hook("C_START_INSTANCE_SKILL_EX", "event", hooks.MODIFY_INTERNAL_REAL, v13));
      v4.push(v1.hook("C_PRESS_SKILL", "event", hooks.MODIFY_INTERNAL_REAL, v12));
    };
  this.loaded = () => {
    if (v8()) v15();else {
      for (const v30 of v4) v1.unhook(v30);
      v4 = [];
    }
  };
  v1.hook("S_LOGIN", "event", hooks.READ_DESTINATION_ALL, this.loaded);
};
