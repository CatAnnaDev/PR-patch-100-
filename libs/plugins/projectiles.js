const hooks = require("../enums/hooks"),
  classes = require("../enums/classes");
module.exports = function (v1, v2) {
  const _pk = Object.create(null), pk = n => _pk[n] || (_pk[n] = v2.packet.get_all(n));
  v1.hook(...pk("C_START_INSTANCE_SKILL"), hooks.MODIFY_INTERNAL_REAL, v7 => {
    if (v2.player.job !== classes.GUNNER) return;
    const v9 = v2.utils.getSkillInfo(v7.skill.id);
    if (v9.skill !== 7 || v9.sub !== 3) return;
    v1.send(...pk("S_CANNOT_START_SKILL"), {
      skill: v7.skill
    });
    return false;
  });
  let v4 = 0x0n;
  const v5 = [];
  let v6 = [];
  v1.hook(...pk("S_ACTION_STAGE"), hooks.READ_DESTINATION_FAKE, v10 => {
    if (v2.player.job !== classes.GUNNER) return;
    if (!v2.player.isMe(v10.gameId)) return;
    if (!v2.utils.isEnabled()) return;
    const v12 = v2.utils.getSkillInfo(v10.skill.id),
      v13 = v12.skill === 43 && [1, 3, 30, 50].includes(v12.sub),
      v14 = v12.skill === 6;
    if (!v13 && !v14) return;
    v1.send(...pk("S_START_USER_PROJECTILE"), {
      gameId: v2.player.gameId,
      templateId: v2.player.templateId,
      id: ++v4,
      skill: v13 ? 430120 : 61120,
      loc: v10.loc,
      dest: v2.last.startSkill.dest,
      speed: 800,
      distance: 475,
      projectileSpeed: 1
    });
    v5.push({
      faked: v4,
      skill: v12,
      real: null
    });
  });
  v1.hook(...pk("C_HIT_USER_PROJECTILE"), hooks.MODIFY_REAL, v15 => {
    const v17 = v5.find(v18 => v18.faked === v15.id);
    if (!v17) return;
    if (v15.end) v5.splice(v5.indexOf(v17), 1);
    if (v17.real) {
      v15.id = v17.real;
      return true;
    }
    v6.push({
      event: v15,
      skill: v17.skill
    });
    return false;
  });
  v1.hook(...pk("S_START_USER_PROJECTILE"), hooks.MODIFY_REAL, v19 => {
    if (v2.player.job !== classes.GUNNER) return;
    if (!v2.player.isMe(v19.gameId)) return;
    if (!v2.utils.isEnabled(v19.skill.id)) return;
    const v21 = v2.utils.getSkillInfo(v19.skill.id);
    if (![6, 43].includes(v21.skill)) return;
    const v22 = v6.filter(v24 => v24.skill.skill === v21.skill);
    if (v22.length) {
      v6 = v6.filter(v25 => v25.skill.skill !== v21.skill);
      for (const {
        event: v26
      } of v22) {
        v1.send(...pk("C_HIT_USER_PROJECTILE"), {
          ...v26,
          id: v19.id
        });
      }
    }
    const v23 = v5.find(v27 => v27.skill.skill === v21.skill);
    if (v23) v23.real = v19.id;
    return false;
  });
};
