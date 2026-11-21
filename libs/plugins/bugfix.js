const hooks = require("../enums/hooks");
module.exports = function (v1, v2) {
  let v4 = 0;
  v1.hook(...v2.packet.get_all("S_ACTION_STAGE"), hooks.READ_DESTINATION_ALL, v5 => {
    if (!v2.player.isMe(v5.gameId)) return;
    if (!v2.utils.isEnabled(v5.skill.id)) return;
    if (!["catchBack", "shortTel"].includes(v2.skills.getType(v5.skill.id))) return;
    v4 = Date.now() + v2.utils.getPacketBuffer(100);
  });
  v1.hook(...v2.packet.get_all("S_CANNOT_START_SKILL"), hooks.MODIFY_ALL, (v7, v8) => {
    if (!v2.utils.isEnabled(v7.skill.id)) return;
    if (v4 > Date.now()) return false;
    if (v8) v4 = Date.now() + v2.utils.getPacketBuffer();
  });
  v1.hook(...v2.packet.get_all("S_SYSTEM_MESSAGE"), hooks.MODIFY_ALL, v10 => {
    if (!v2.utils.isEnabled()) return;
    const v12 = v1.parseSystemMessage(v10.message);
    switch (v12.id) {
      case "SMT_SKILL_FAIL_CATEGORY":
        {
          v2.log.debug("S_SYSTEM_MESSAGE", "failed to start skill");
          if (v2.action.inAction) return false;
          if (Date.now() - v2?.action?.end?._time || 0 <= v2.utils.getPacketBuffer()) return false;
          break;
        }
      case "SMT_BATTLE_SKILL_FAIL_LOW_STAMINA":
        {
          const v13 = {
            9: "SMT_BATTLE_SKILL_FAIL_LOW_ARCANE",
            10: "SMT_BATTLE_SKILL_FAIL_LOW_FURY",
            11: "SMT_BATTLE_SKILL_FAIL_LOW_CHAKRA",
            12: "SMT_BATTLE_SKILL_FAIL_LOW_MOON_LIGHT"
          }[v2.player.job];
          if (!v13) break;
          v2.utils.sendSystemMessage(v13);
          return false;
          break;
        }
    }
  });
};
