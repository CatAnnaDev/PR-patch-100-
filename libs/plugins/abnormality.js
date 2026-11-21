const hooks = require("../enums/hooks");
module.exports = function (v1, v2) {
  let v4 = {},
    v5 = {},
    v6 = {},
    v7 = {},
    v8 = {};
  if ("TRUE" !== "TRUE") v2.command.add("abnormality", v12 => {
    console.log(v2.datacenter.getAbnormalityData(v12));
  });
  const v9 = (v14, v15, v16 = null) => {
      if (v7[v15]) v7[v15] = v7[v15].filter(v21 => v21 !== v14);
      const v18 = v2.datacenter.getAbnormalityData(v14);
      if (!v18) {
        v2.log.error("startAbnormality", "didn't find abnormData:", v14);
        return;
      }
      const v19 = v2.effects.getAbnormality(v14),
        v20 = {
          target: v2.player.gameId,
          source: 0x0n,
          id: v14,
          duration: +(v16 || v18.time || 0),
          stacks: v19?.stacks || 1
        };
      v1.send(...v2.packet.get_all("S_ABNORMALITY_" + (v19 ? "REFRESH" : "BEGIN")), v20);
      v4[v14] = Date.now() + v2.utils.getPacketBuffer();
      v1.clearTimeout(v6[v14]);
      if (v20.duration <= 2147483647) v6[v14] = v1.setTimeout(v10, v20.duration, v14);
    },
    v10 = v22 => {
      v1.send(...v2.packet.get_all("S_ABNORMALITY_END"), {
        target: v2.player.gameId,
        id: v22
      });
      v5[v22] = Date.now() + v2.utils.getPacketBuffer();
    };
  v1.hook(...v2.packet.get_all("S_ACTION_STAGE"), hooks.READ_DESTINATION_FAKE, v24 => {
    if (!v2.player.isMe(v24.gameId)) return;
    if (!v2.utils.isEnabled(v24.skill.id)) return;
    if (v24.stage !== 0) return;
    const v26 = (v30, v31) => {
        const v33 = v2.effects.getServerAbnormality(v30),
          v34 = v2.effects.getAbnormality(v30);
        setTimeout(() => {
          const v36 = v2.effects.getServerAbnormality(v30),
            v37 = v2.effects.getAbnormality(v30),
            v38 = !v33 && v36 || v33 && v36 && v36.time > v33.time,
            v39 = v33 && !v36,
            v40 = !v33 && !v36;
          if (!v31 && v38) return;
          if (v31 && v39) return;
          if (v31 && v40) return;
          const v41 = v34 && !v37;
          if (!v31 && v41) return;
          if (!v31) {
            v2.log.debug("revertingAbnormality", "ending " + v30);
            v1.clearTimeout(v6[v30]);
            v6[v30] = undefined;
            v4[v30] = undefined;
            v1.send(...v2.packet.get_all("S_ABNORMALITY_END"), {
              target: v2.player.gameId,
              id: v30
            });
            return;
          }
          if (!v34) {
            v2.log.debug("revertingAbnormality", "Uncertain state reached for " + v30, v34, v37, v33, v36, v31);
            return;
          }
          const v42 = v36 && v36.time > v34.time ? v36 : v34,
            v43 = Math.max(v42.duration - (Date.now() - v42.time), 0);
          if (v43 === 0) {
            v2.log.debug("revertingAbnormality", "no point in reverting " + v30 + " as there is no duration left.");
            return;
          }
          v2.log.debug("revertingAbnormality", "restarting " + v30 + " with the following duration left: " + v43);
          v1.clearTimeout(v6[v30]);
          v6[v30] = undefined;
          v5[v30] = undefined;
          v1.send(...v2.packet.get_all("S_ABNORMALITY_BEGIN"), {
            target: v2.player.gameId,
            source: 0x0n,
            id: v30,
            duration: v43,
            stacks: v42.stacks
          });
        }, v2.utils.getPacketBuffer(100));
      },
      v27 = v2.action.speed;
    v8[v24.skill.id] = [];
    const v28 = v2.skills.getAbnormalitiesToEndOnActionStage(v24.skill.id);
    for (const {
      id: v44,
      delay: v45,
      fixed: v46,
      forced: v47
    } of v28) {
      v1.clearTimeout(v6[v44]);
      if (!v2.effects.getAbnormality(v44)) continue;
      v8[v24.skill.id].push(v44);
      const v48 = v45 / (v46 ? v27.fixed : v27.not_fixed);
      if (v48 <= 2147483647) if (v48 === 0) {
        if (!v47) v26(v44, true);
        v10(v44);
      } else v6[v44] = v1.setTimeout(v49 => {
        if (!v47) v26(v49, true);
        v10(v49);
      }, v48, v44);
    }
    v7[v24.skill.id] = [];
    const v29 = v2.skills.getAbnormalitiesToStartOnActionStage(v24.skill.id);
    for (const {
      id: v50,
      delay: v51,
      fixed: v52,
      duration: v53,
      forced: v54
    } of v29) {
      const v55 = v51 / (v52 ? v27.fixed : v27.not_fixed);
      v7[v24.skill.id].push(v50);
      v1.clearTimeout(v6[v50]);
      if (v55 <= 2147483647) v6[v50] = v1.setTimeout((v56, v57, v58) => {
        if (!v54) v26(v56, false);
        v9(v56, v57, v58);
      }, v55, v50, v24.skill.id, v53);
    }
  });
  v1.hook(...v2.packet.get_all("S_ACTION_END"), hooks.READ_DESTINATION_FAKE, v59 => {
    if (!v2.player.isMe(v59.gameId)) return;
    if (!v2.utils.isEnabled(v59.skill.id)) return;
    for (const v63 of v8[v59.skill.id] || []) {
      v1.clearTimeout(v6[v63]);
    }
    for (const v64 of v7[v59.skill.id] || []) {
      v1.clearTimeout(v6[v64]);
    }
    const v61 = v2.action.speed,
      v62 = v2.skills.getAbnormalitiesToEndOnActionEnd(v59.skill.id);
    for (const {
      id: v65,
      delay: v66,
      fixed: v67,
      noTimer: v68
    } of v62) {
      v1.clearTimeout(v6[v65]);
      if (!v2.effects.getAbnormality(v65)) continue;
      const v69 = v66 / (v67 ? v61.fixed : v61.not_fixed);
      if (v69 > 2147483647) continue;
      if (v68) v1.setTimeout(v10, v69, v65);else v6[v65] = v1.setTimeout(v10, v69, v65);
    }
  });
  const v11 = v70 => v71 => {
    if (!v2.player.isMe(v71.target)) return;
    if (!v2.utils.isEnabled()) return;
    const v73 = v2.effects.getAbnormality(v71.id);
    v71.duration = Number(v71.duration);
    const v74 = v73 && (v73.stacks !== v71.stacks || v71.duration !== v73.duration),
      v75 = Date.now(),
      v76 = v4[v71.id];
    if (!v74 && v76 && v76 > v75) {
      v2.log.debug("abnormalityBeginRefreshHandler", "Blocking");
      return false;
    }
    v1.clearTimeout(v6[v71.id]);
    v71.duration -= v2.ping.ping + v2.ping.jitter;
    if (v71.duration <= 2147483647) v6[v71.id] = v1.setTimeout(v10, v71.duration, v71.id);
    if (v73 && !v70) {
      v1.send(...v2.packet.get_all("S_ABNORMALITY_REFRESH"), v71);
      return false;
    }
    if (v70 && !v73) {
      v1.send(...v2.packet.get_all("S_ABNORMALITY_BEGIN"), v71);
      return false;
    }
    return true;
  };
  v1.hook(...v2.packet.get_all("S_ABNORMALITY_BEGIN"), hooks.MODIFY_REAL, v11());
  v1.hook(...v2.packet.get_all("S_ABNORMALITY_REFRESH"), hooks.MODIFY_REAL, v11(true));
  v1.hook(...v2.packet.get_all("S_ABNORMALITY_END"), hooks.MODIFY_REAL, v77 => {
    if (!v2.player.isMe(v77.target)) return;
    if (!v2.utils.isEnabled()) return;
    const v79 = Date.now();
    let v80 = v5[v77.id];
    if (v80 && v80 > v79) {
      v2.log.debug("abnormEndHandler", "Not ending due to recently ended", v79, v80);
      return false;
    }
    v80 = v4[v77.id];
    if (v80 && v80 > v79) {
      v2.log.debug("abnormEndHandler", "Not ending due to recently emulated", v79, v80);
      return false;
    }
    v1.clearTimeout(v6[v77.id]);
  });
};
