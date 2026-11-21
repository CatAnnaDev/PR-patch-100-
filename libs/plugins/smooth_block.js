const hooks = require("../enums/hooks");
module.exports = function (v1, v2) {
  v1.hook(...v2.packet.get_all("S_EACH_SKILL_RESULT"), hooks.MODIFY_ALL, v4 => {
    if (!v2.settings.smoothBlock) return;
    if (!v2.player.isMe(v4.target)) return;
    if (!v4.superArmorId) return;
    if (!v2.utils.isEnabled()) return;
    v4.superArmorId = 0;
    return true;
  });
};
