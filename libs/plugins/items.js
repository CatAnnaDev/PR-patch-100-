const HOOKS = require("../enums/hooks");
module.exports = function (v1, v2) {
  const v4 = 300;
  let v5 = null;
  v1.hook(...v2.packet.get_all("S_USER_STATUS"), HOOKS.READ_DESTINATION_REAL, v6 => {
    v1.clearInterval(v5);
    if (v6.status === 2) v5 = v1.setInterval(() => {
      for (const v9 of v2.player.playersInParty.values()) {
        if (v9.status === 1) return;
      }
      for (const v10 of ["skills", "server"]) {
        for (const v11 in v2.cooldown.info[v10]) {
          v2.cooldown.info[v10][v11].cooldown -= v4;
        }
      }
    }, v4);
  });
  this.destructor = () => {
    v1.clearInterval(v5);
  };
};
