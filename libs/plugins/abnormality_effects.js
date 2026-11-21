const classes = require("../enums/classes"),
  hooks = require("../enums/hooks");
module.exports = function (v1, v2) {
  const _pk = Object.create(null), pk = n => _pk[n] || (_pk[n] = v2.packet.get_all(n));
  let v4 = [];
  const v5 = v11 => (v12, v13) => {
      let v15 = null;
      switch (v13.method) {
        case 2:
          v15 = +v13.value;
          break;
        case 3:
          v15 = Math.round((+v13.value - 1) * v2.player.attackSpeed);
          break;
      }
      if (v15 === null || isNaN(v15)) return;
      let v16 = null;
      const v17 = {
        value: v15 * (v11 ? 1 : -1),
        abnormality: v12.id,
        callback: (v18 = true) => {
          v1.clearTimeout(v16);
          v4.splice(v4.indexOf(v17), 1);
          if (v18) v1.send(...pk("S_PLAYER_STAT_UPDATE"), {
            ...v2.player.previous_sPlayerStatUpdate,
            attackSpeedBonus: v2.player.attackSpeedBonus - v17.value
          });
        }
      };
      v4.push(v17);
      v16 = v1.setTimeout(v17.callback, v2.ping.ping);
      v1.send(...pk("S_PLAYER_STAT_UPDATE"), {
        ...v2.player.previous_sPlayerStatUpdate,
        attackSpeedBonus: v2.player.attackSpeedBonus + v17.value
      });
    },
    v6 = v20 => v21 => {
      if (!v2.player.isMe(v21.target)) return;
      for (const v23 of v4) {
        if (v23.abnormality === v21.id) v23.callback(false);
      }
    };
  v1.hook(...pk("S_ABNORMALITY_BEGIN"), hooks.READ_REAL, v6(false));
  v1.hook(...pk("S_ABNORMALITY_END"), hooks.READ_REAL, v6(true));
  const v7 = v24 => v25 => {
      for (const v27 of v25.bySkillCategory) {
        if (!v27) continue;
        v1.send(...pk("S_SKILL_CATEGORY"), {
          category: v27,
          enabled: v24
        });
      }
    },
    v8 = {
      24: v5(true),
      209: {
        3: v7(true)
      },
      210: {
        0: v7(false)
      }
    },
    v9 = {
      24: v5(false),
      210: {
        0: v7(true)
      }
    },
    v10 = v28 => v29 => {
      if (!v2.player.isMe(v29.target)) return;
      if (!v2.utils.isEnabled()) return;
      const v31 = v2.datacenter.getAbnormalityData(v29.id);
      if (!v31) return;
      let v32 = undefined;
      for (const v33 of v31?.AbnormalityEffect || []) {
        if (v2.player.job !== classes.WARRIOR && v33.type === 210) continue;
        const v34 = v28[v33.type];
        if (!v34) continue;
        if (typeof v34 !== "object") {
          const v37 = v34(v31, v33);
          if (v37 !== undefined) v32 = v37;
          continue;
        }
        const v35 = v34[v33.method];
        if (!v35) continue;
        const v36 = v35(v31, v33);
        if (v36 !== undefined) v32 = v36;
      }
      return v32;
    };
  v1.hook(...pk("S_ABNORMALITY_BEGIN"), hooks.READ_DESTINATION_FAKE, v10(v8));
  v1.hook(...pk("S_ABNORMALITY_END"), hooks.READ_DESTINATION_FAKE, v10(v9));
  v1.hook(...pk("S_PLAYER_STAT_UPDATE"), {
    order: -1050
  }, v38 => {
    if (v4.length) v2.log.debug("STAT-UPDATE", "<-R attackSpeed:" + v38.attackSpeed + " attackSpeedBonus:" + v38.attackSpeedBonus);
    for (const {
      value: v40
    } of v4) {
      v38.attackSpeedBonus += v40;
    }
    return v4.length ? true : undefined;
  });
};
