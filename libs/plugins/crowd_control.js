const hooks = require("../enums/hooks");
module.exports = function (v1, v2) {
  let v4 = null,
    v5 = null,
    v6 = null,
    v7 = null;
  v1.hook(...v2.packet.get_all("S_ACTION_END"), hooks.MODIFY_INTERNAL_REAL, v9 => {
    if (v9.id === v7) {
      v2.log.debug("CC-ACTION-END", "Blocking because it's matching ids");
      return false;
    }
    if (v9.type === 9 && v2.skills.getTypeId(v2?.action?.stage?.skill?.id) === 27) {
      v2.log.debug("CC-ACTION-END", "Blocking because type 9 and we're in retaliate");
      return false;
    }
    if (v9.id === v6) {
      v1.clearTimeout(v5);
      if (v9.type === 5) {
        v2.log.debug("CC-ACTION-END", "Blocking because type 5");
        return false;
      }
    }
  });
  v1.hook(...v2.packet.get_all("S_EACH_SKILL_RESULT"), hooks.MODIFY_ALL, v11 => {
    if (!v11.reaction.enable) return;
    if (v2.player.isMe(v11.source)) return;
    if (!v2.player.isMe(v11.target)) return;
    if (!v2.utils.isEnabled()) return;
    v1.clearTimeout(v5);
    const v13 = v11.reaction.animSeq.reduce((v14, v15) => v14 + v15.duration, 0);
    if (v13 > 0) {
      if (v2.action.inAction && v2.skills.getTypeId(v2.action.stage.skill.id) === 27) {
        v2.log.debug("CC - SESR", "blocking SESR because in retaliate");
        return false;
      }
      const v16 = v11.reaction;
      v6 = v16.id;
      v5 = v1.setTimeout(() => {
        if (!v2.action.inAction) return v2.log.debug("CC - SESR", "not ending cc because we're not in an action");
        v2.log.debug("CC - SESR", "ending cc before server");
        v1.send(...v2.packet.get_all("S_ACTION_END"), Object.assign({
          type: 0
        }, v16, {
          gameId: v2.player.gameId,
          templateId: v2.player.templateId,
          loc: v2.position.loc
        }));
        v7 = v16.id;
      }, v13 - v2.ping.ping);
    }
    if (!v2.action.inAction) return;
    v1.send(...v2.packet.get_all("S_ACTION_END"), Object.assign({
      type: 0
    }, v2.action.stage, {
      loc: v2.position.loc
    }));
  });
  v1.hook(...v2.packet.get_all("S_ACTION_STAGE"), hooks.READ_DESTINATION_ALL, v18 => {
    if (!v2.player.isMe(v18.gameId)) return;
    if (v18.skill.type !== 2) return;
    if (v18.animSeq?.[0]?.duration !== 88888888) return;
    if (v18.animSeq?.[0]?.distance !== -1) return;
    if (!v2.utils.isEnabled()) return;
    v1.clearTimeout(v5);
    const v20 = v2.effects.getActiveAbnormalitiesSorted()[0],
      {
        duration: v21
      } = v2.effects.getAbnormality(v20);
    v6 = v18.id;
    const v22 = v23 => {
      v4 = null;
      v1.send(...v2.packet.get_all("S_ACTION_END"), Object.assign(v18, {
        loc: v2.position.loc
      }));
      v7 = v18.id;
      v2.log.debug("CC - 211", "ending stun/sleep before server:", v23);
    };
    v4 = v22;
    v1.clearTimeout(v5);
    v5 = v1.setTimeout(v4, v21, v20);
  });
  const v8 = v25 => {
    if (!v2.player.isMe(v25.target)) return;
    if (!v2.action.inAction) return;
    if (!v2.utils.isEnabled()) return;
    const v27 = v2.datacenter.getAbnormalityData(v25.id);
    for (const v28 of v27?.AbnormalityEffect || []) {
      switch (v28.type) {
        case 211:
          {
            v1.clearTimeout(v5);
            if (!v4) break;
            v5 = v1.setTimeout(v4, Number(v25.duration), v25.id);
            break;
          }
        case 232:
          {
            v2.log.debug("CC - 232", "ending skill because of fear");
            v1.send(...v2.packet.get_all("S_ACTION_END"), Object.assign({
              type: 16
            }, v2.action.stage, {
              loc: v2.position.loc
            }));
            break;
          }
      }
    }
  };
  v1.hook(...v2.packet.get_all("S_ABNORMALITY_BEGIN"), hooks.READ_DESTINATION_ALL, v8);
  v1.hook(...v2.packet.get_all("S_ABNORMALITY_REFRESH"), hooks.READ_DESTINATION_ALL, v8);
};
