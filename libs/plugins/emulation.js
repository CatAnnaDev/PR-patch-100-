const hooks = require("../enums/hooks"),
  classes = require("../enums/classes"),
  fs = require("fs"),
  nodePath = require("path");
module.exports = function (v1, v2) {
  let pingBase = null,
    spikeHold = 0,
    spikeLastTs = Date.now(),
    spiking = false,
    spikePeak = 0,
    spikeStart = 0,
    jitSum = 0,
    jitSqSum = 0;
  const jitWin = [],
    JIT_N = 30;
  const startTs = Date.now(),
    rollWin = [],
    ROLL_MS = 300000;
  let chainEma = 0;
  const SPIKE_CAP = () => v2.settings.info.spikeCap ?? 150,
    SPIKE_DECAY_PER_MS = () => v2.settings.info.spikeDecay ?? 0.6,
    SPIKE_MARGIN = () => v2.settings.info.spikeMargin ?? 4;
  const samplePing = () => {
    const p = v2.ping.ping || 0;
    if (!p) return;
    if (pingBase === null) pingBase = p;
    const a = p < pingBase ? 0.1 : 0.01;
    pingBase += (p - pingBase) * a;
    const excess = Math.max(0, p - pingBase - SPIKE_MARGIN());
    const now = Date.now(),
      dt = now - spikeLastTs;
    spikeLastTs = now;
    spikeHold = Math.max(0, spikeHold - dt * SPIKE_DECAY_PER_MS());
    if (excess > spikeHold) spikeHold = excess;
    const j = v2.ping.jitter || 0;
    jitWin.push(j);
    jitSum += j;
    jitSqSum += j * j;
    if (jitWin.length > JIT_N) {
      const old = jitWin.shift();
      jitSum -= old;
      jitSqSum -= old * old;
    }
    const notify = v2.settings.info.spikeNotify ?? 40;
    if (notify > 0) {
      if (!spiking && excess >= notify) {
        spiking = true;
        spikePeak = excess;
        spikeStart = now;
        v2.command.message("Lag spike: ping " + Math.round(p) + " ms (+" + Math.round(excess) + " vs calm " + Math.round(pingBase) + ")");
      } else if (spiking) {
        if (excess > spikePeak) spikePeak = excess;
        if (excess < notify * 0.4) {
          v2.command.message("Connection stabilized (peak +" + Math.round(spikePeak) + " ms, " + (now - spikeStart) + " ms)");
          spiking = false;
        }
      }
    }
  };
  const sampler = v1.setInterval(samplePing, 100);
  const jitterPad = () => {
    const n = jitWin.length;
    if (n < 5) return 0;
    const mean = jitSum / n;
    const variance = Math.max(0, jitSqSum / n - mean * mean);
    const sd = Math.sqrt(variance);
    const a = v2.settings.info.auto || {};
    return Math.min(a.jitterPadCap ?? 20, Math.max(0, (sd - (a.jitterPadDead ?? 8)) * (a.jitterPadK ?? 0.8)));
  };
  const jit = () => {
    const safety = v2.auto ? v2.auto.safetyMs() : 0;
    if (!v2.settings.info.instant) return v2.ping.jitter + safety;
    samplePing();
    const pad = v2.settings.info.auto?.enabled ? jitterPad() : 0;
    return Math.min(SPIKE_CAP(), Math.round(spikeHold + pad)) + safety;
  };
  let v4 = null,
    v5 = null,
    v6 = {
      arrived: 0,
      estimate: 0,
      counter: 0
    },
    v7 = false,
    v8 = null,
    v9 = null,
    v10 = 0,
    v11 = 0,
    v12 = false,
    v13 = null,
    v14 = null;
  const v15 = 2;
  let v16 = [];
  v2.command.add("tracker", () => {
    let v25 = 0,
      v26 = 0,
      v27 = 0,
      v28 = 0;
    for (const v33 of v16) {
      v25 += v33.delay;
      v26 += v33.jitter;
      if (v33.excessTime !== undefined) {
        v28++;
        v27 += Math.max(0, v33.excessTime);
      }
    }
    const v29 = v16.length,
      v30 = v2.utils.round(v26 / v29),
      v31 = v2.utils.round(v25 / v29),
      v32 = v2.utils.round(v27 / v28);
    v2.command.message("\nAfter " + v29 + " skills.\nAverage jitter: " + v30 + "\nAverage delay: " + v31 + "\nAverage chain delay: " + v32 + "\nInstant: " + (v2.settings.info.instant ? "on" : "off") + " | ping now: " + Math.round(v2.ping.ping) + " | calm baseline: " + Math.round(pingBase ?? 0) + " | spike buffer: " + Math.round(spikeHold));
  });
  const effectiveBuffer = () => {
    const safety = v2.auto ? v2.auto.safetyMs() : 0;
    const base = v2.settings.info.instant ? Math.min(SPIKE_CAP(), Math.round(spikeHold + jitterPad())) : Math.round(v2.ping.jitter);
    return base + safety + (v2.settings.info.delay || 0);
  };
  const rollSampler = v1.setInterval(() => {
    const now = Date.now();
    rollWin.push({
      ts: now,
      ping: v2.ping.ping || 0,
      jitter: v2.ping.jitter || 0,
      eff: effectiveBuffer()
    });
    while (rollWin.length && now - rollWin[0].ts > ROLL_MS) rollWin.shift();
  }, 1000);
  const fmtUptime = ms => {
    const s = Math.floor(ms / 1000);
    return Math.floor(s / 60) + "m " + s % 60 + "s";
  };
  v2.command.add("stats", () => {
    const safety = v2.auto ? v2.auto.safetyMs() : 0;
    const counts = v2.auto ? v2.auto.counts : {};
    const n = rollWin.length;
    let line = "";
    if (n) {
      let pMin = Infinity,
        pMax = 0,
        pSum = 0,
        jMin = Infinity,
        jMax = 0,
        jSum = 0,
        zero = 0;
      for (const s of rollWin) {
        if (s.ping < pMin) pMin = s.ping;
        if (s.ping > pMax) pMax = s.ping;
        pSum += s.ping;
        if (s.jitter < jMin) jMin = s.jitter;
        if (s.jitter > jMax) jMax = s.jitter;
        jSum += s.jitter;
        if (s.eff === 0) zero++;
      }
      const mins = Math.round(n / 60);
      line = "\nOver " + (mins >= 1 ? mins + " min" : n + " s") + ": ping " + Math.round(pMin) + "/" + Math.round(pSum / n) + "/" + Math.round(pMax) + " (min/avg/max) | jitter " + Math.round(jMin) + "/" + Math.round(jSum / n) + "/" + Math.round(jMax) + "\nPure zero-ping: " + Math.round(100 * zero / n) + "% of the time";
    }
    v2.command.message("\nPing: " + Math.round(v2.ping.ping) + " ms | calm: " + Math.round(pingBase ?? 0) + " | jitter: " + Math.round(v2.ping.jitter) + "\nSpike buffer: " + Math.round(spikeHold) + " | Jitter pad: " + Math.round(jitterPad()) + " | Auto buffer: " + safety + " ms\nInstant: " + (v2.settings.info.instant ? "on" : "off") + " | manual delay: " + (v2.settings.info.delay || 0) + " ms\nAdded latency ~ " + effectiveBuffer() + " ms" + line + "\nAdaptive retry: " + (v2.settings.info.adaptiveRetry ? "on" : "off") + " | adaptive chain: " + (v2.settings.info.adaptiveChain ? "on" : "off") + "\nUptime: " + fmtUptime(Date.now() - startTs) + " | fallbacks: " + (counts.fallbacks || 0) + "\nDesync: " + (counts.desync || 0) + " | stall: " + (counts.stall || 0) + " | loop: " + (counts.loop || 0) + " | rubber-band: " + (counts.rubberband || 0));
  });
  let telemetryTimer = null;
  const telemetryFile = nodePath.join(__dirname, "../../telemetry.csv");
  v2.command.add("telemetry", () => {
    if (telemetryTimer) {
      v1.clearInterval(telemetryTimer);
      telemetryTimer = null;
      v2.command.message("Telemetry off");
      return;
    }
    try {
      if (!fs.existsSync(telemetryFile)) fs.writeFileSync(telemetryFile, "ts,ping,jitter,baseline,spike,autoBuffer,effective,instant,desync\n");
    } catch (e) {}
    telemetryTimer = v1.setInterval(() => {
      const safety = v2.auto ? v2.auto.safetyMs() : 0;
      const row = [Date.now(), Math.round(v2.ping.ping), Math.round(v2.ping.jitter), Math.round(pingBase ?? 0), Math.round(spikeHold), safety, effectiveBuffer(), v2.settings.info.instant ? 1 : 0, v2.auto?.counts?.desync || 0].join(",") + "\n";
      try {
        fs.appendFileSync(telemetryFile, row);
      } catch (e) {}
    }, 1000);
    v2.command.message("Telemetry on -> telemetry.csv (1 line/s)");
  });
  v1.hook(...v2.packet.get_all("S_ACTION_STAGE"), hooks.READ_REAL, v34 => {
    if (!v2.player.isMe(v34.gameId)) return;
    if (v4 !== v34.skill.id) {
      v2.log.debug("EMULATION-VALIDATION", "NOT CORRECT IDS");
      if (v2.auto) v2.auto.hit("mismatch");
    }
  });
  v1.hook(...v2.packet.get_all("S_ACTION_END"), hooks.READ_REAL, v36 => {
    if (!v2.player.isMe(v36.gameId)) return;
    if (!v36.type) return;
    if (v5 !== v36.type) {
      v2.log.debug("EMULATION-VALIDATION", "NOT CORRECT TYPE");
      if (v2.auto) v2.auto.hit("mismatch");
    }
  });
  const v17 = (v38, v39) => {
      const v41 = {
        name: v38,
        ...v39
      };
      if (v41.w) delete v41.w;
      if (v41.loc) delete v41.loc;
      if (v41.dest) delete v41.dest;
      return v2.library.jsonStringify(v41);
    },
    v18 = (v42, v43, v44) => {
      v1.clearTimeout(v8);
      if (v43) {
        if (!v2?.action?.stage) return;
        if (v2.action.stage.id !== v2.skills.counter) return;
        if (!v2.action.inAction) return;
        const v47 = v2.skills.getStageCount(v42),
          v48 = v47 - 1 <= v2.action.stage.stage,
          v49 = v2.skills.getType(v42);
        if (v48) {
          if (v49 === "movingCharge") return;
          const v50 = v49 === "dash" ? 39 : 0;
          v5 = v50;
          v2.skills.sendActionEnd(v2.action.stage.skill.id, v50, v9, !!v9);
          return;
        }
      }
      v2.skills.sendActionStage({
        skillId: v42,
        continuation: v43,
        stage: v44
      });
      v9 = null;
      if (!v2?.action?.stage) return;
      const v46 = v2.skills.getAnimationLength(v42, v2.action.stage.stage, v2.action.speed);
      v2.log.debug("EMULATION", "Length for skill: " + v42 + "(" + v2.action.stage.stage + ") is " + v46);
      if (v46 !== -1) {
        v1.clearTimeout(v8);
        v8 = v1.setTimeout(v18, v46, v42, true);
      }
    };
  let v19 = false;
  const v20 = async (v51, v52, v53, v54) => {
      if (v14) {
        v7 = true;
        v1.send(...v14);
        v7 = false;
        v14 = null;
      }
      const v56 = v52.continue,
        v57 = v52.press,
        v58 = v52.unkn3,
        v59 = v2.skills.getNewSkillData(v52.skill.id, {
          byGrant: v56,
          press: v57
        });
      if (v19) v59.skillId++;
      v19 = false;
      if (v59.type !== v53.type || v59.skillId !== v53.skillId || v59.failed !== v53.failed) {
        v2.log.debug("EMULATION", "newSkillData changed value:", v59);
        if (v59.failed !== v53.failed && (v59.time || 0) < 0) {
          v2.log.debug("EMULATION", "Cancelling skill execution due to time being in the future");
          v1.send(...v2.packet.get_all("S_CANNOT_START_SKILL"), {
            skill: v52.skill
          });
          v7 = true;
          v1.send(...v2.packet.get_all(v51), v52);
          v7 = false;
          return;
        }
        let v76 = jit() + v2.settings.info.delay;
        v76 += v2.skills.getSkillDelayTime(v59.skillId, {
          byGrant: v56,
          press: v57
        });
        if (v59.time) v76 -= v59.time;
        if (!v2.action.inAction) v76 -= Date.now() - v2?.action?.end?._time || 0;
        v76 = Math.floor(v76 + v15);
        if (v76 > 0) await v2.utils.sleep(v76);
      }
      const v60 = v2.skills.canCast(v59, {
        byGrant: v56,
        press: v57,
        originalSkillId: v52.skill.id
      });
      if (v60 !== v54) v2.log.debug("EMULATION", "cast changed value: " + v60);
      if (![-11, -3737, -17, -999].includes(v60)) {
        v7 = true;
        v1.send(...v2.packet.get_all(v51), v52);
        v7 = false;
      }
      if (v2.skills.getRawAnimationLength(v59.skillId) === 0) {
        v2.log.debug("EMULATION", "Not sending animation for " + v59.skillId);
        return;
      }
      if (v60 < -4) {
        v1.send(...v2.packet.get_all("S_CANNOT_START_SKILL"), {
          skill: v52.skill
        });
        return;
      }
      if (v60 === -4) return;
      const {
          skillId: v61,
          cancel: v62,
          charge: v63,
          type: v64,
          chain: v65
        } = v59,
        v66 = v2.skills.getType(v61) === "movingCharge" && v2.effects.hasAbnormalityWithCategoryTypeValue(v2.skills.getCategories(v61), 327),
        v67 = v66 ? v2.skills.getStageCount(v61) - 1 : 0;
      if (v62) {
        v2.skills.sendActionEnd(v2.action.stage.skill.id, v64);
        return;
      }
      if (v2.skills.sendConnectSkillArrow(v61, v56)) {
        v10 = Date.now() + v2.utils.getPacketBuffer();
        if (v2.action.inAction && v64) v2.skills.sendActionEnd(v2.action.stage.skill.id, v64);
        return;
      }
      if ((v63 || v66) && !v56) {
        v1.setTimeout(() => {
          if (v58) v19 = true;
          v11 = Date.now() + v2.utils.getPacketBuffer();
          v1.send(...v2.packet.get_all("S_GRANT_SKILL"), {
            skill: v66 ? v2.skills.getChargeSkillId(v61, v67) : v61
          });
          v14 = [...v2.packet.get_all(v51), v52];
          if (v66) v12 = true;
        }, v66 ? 25 : 0);
        if (!v66) return;
      }
      const v68 = v2.skills.getType(v2?.action?.stage?.skill?.id);
      if (v2.action.inAction && v64 && v68 !== "movingCharge") v2.skills.sendActionEnd(v2.action.stage.skill.id, v66 ? 6 : v64);
      const v69 = v2.skills.getActionStageDelay(v61);
      v1.clearTimeout(v8);
      if (v69) v8 = v1.setTimeout(v18, v69, v61, false, v67);else v18(v61, false, v67);
      let v70 = v2.skills.getRetryCount(v61);
      if (v2.settings.info.adaptiveRetry) {
        const retryLoad = Math.round(spikeHold) + (v2.auto ? v2.auto.safetyMs() : 0);
        v70 += Math.min(v2.settings.info.retryMaxExtra ?? 3, Math.floor(retryLoad / (v2.settings.info.retryLoadScale ?? 15)));
      }
      const v71 = v2.hardcoded.getRetryDelay(v61),
        v72 = v2.hardcoded.getAllowThroughFutureRetry(v61),
        v73 = v2?.action?.serverStage?.id,
        v74 = v2?.action?.stage?.id,
        v75 = Date.now();
      for (let v78 = 0; v78 < v70; v78++) {
        await v2.utils.sleep(v71);
        if (v2?.action?.serverStage?.id !== v73) {
          const v81 = v2.action.serverStage._time - v75;
          if (v81 >= v2.ping.ping) {
            v2.log.debug("RETRY", "cancelled retry because server changed skill");
            break;
          }
        }
        if (v2?.action?.stage?.id !== v74) {
          v2.log.debug("RETRY", "cancelled retry because my skill changed");
          break;
        }
        const v79 = v2.skills.getNewSkillData(v52.skill.id, {
            byGrant: v56,
            press: v57
          }),
          v80 = v2.skills.canCast(v79, {
            byGrant: v56,
            press: v57,
            originalSkillId: v52.skill.id
          });
        if (!v72 && v80 >= -2 && !(v79.future && v79.time <= -25)) {
          v2.log.debug("RETRY", "cast allowed through " + v80, v79);
          break;
        } else v2.log.debug("RETRY", "retry not allowed through " + v80, v79);
        v7 = true;
        v1.send(...v2.packet.get_all(v51), v52);
        v7 = false;
      }
    },
    v21 = (v82, v83) => {
      if (v7) return;
      if (!v2.utils.isEnabled(v83.skill.id)) return;
      if (!v2.utils.canCastSkill()) return;
      const v85 = {
          byGrant: v83.continue,
          press: v83.press,
          originalSkillId: v83.skill.id
        },
        v86 = v2.skills.getNewSkillData(v83.skill.id, v85),
        v87 = v2.skills.canCast(v86, v85);
      v4 = v86.skillId;
      v5 = v86.type === undefined ? v5 : v86.type;
      let v88 = jit() + v2.settings.info.delay;
      v88 += v2.skills.getSkillDelayTime(v86.skillId, v85);
      if (!v12 && v86.time) v88 -= v86.time;
      v12 = false;
      if (!v2.action.inAction) v88 -= Date.now() - v2?.action?.end?._time || 0;
      v88 = Math.floor(v88 + v15);
      if (v88 < 0) v88 = 0;
      if (v88 > 100 && v86.failed) {
        v2.log.debug("SKILL_UPDATE", "Delay is too large and it failed. Block: " + v88);
        if (v2.auto) v2.auto.hit("reject");
        v1.send(...v2.packet.get_all("S_CANNOT_START_SKILL"), {
          skill: v83.skill
        });
        return false;
      }
      if (v6.counter && v13 === v17(v82, v83)) {
        v2.log.debug("SKILL_UPDATE", "Due to same packet as last, blocking");
        v1.send(...v2.packet.get_all("S_CANNOT_START_SKILL"), {
          skill: v83.skill
        });
        return false;
      }
      const v89 = Date.now();
      if (v6.estimate >= v89) {
        const v90 = v89 + v88,
          v91 = v6.estimate + (v89 - v6.arrived);
        v88 = Math.max(v90, v91) - v89;
      }
      if (v2.settings.info.adaptiveChain) {
        if (!v6.counter) chainEma = 0;
        const alpha = v2.settings.info.chainSmooth ?? 0.3;
        if (v6.counter && chainEma > 0) v88 = Math.round(v88 * (1 - alpha) + chainEma * alpha);
        chainEma = chainEma > 0 ? Math.round(chainEma * (1 - alpha) + v88 * alpha) : v88;
      }
      v2.log.debug("SKILL_UPDATE", v83.skill.id + " ->", v86, "== " + v87 + " delay:" + v88 + "ping:" + v2.ping.ping + "jitter:" + v2.ping.jitter);
      v6.arrived = v89;
      v6.estimate = v89 + v88;
      v16.push({
        delay: v88,
        jitter: v2.ping.jitter,
        excessTime: v86.time
      });
      if (v16.length > 2000) v16.splice(0, 1);
      if (!v88 && !v6.counter) {
        v20(v82, v83, v86, v87);
        return false;
      }
      ++v6.counter;
      v1.setTimeout(() => {
        --v6.counter;
        v20(v82, v83, v86, v87);
      }, v88);
      v13 = v17(v82, v83);
      return false;
    },
    v22 = (v93, v94, v95) => {
      v1.hook(...v2.packet.get_all(v93), v94, (...v97) => {
        return v95(v93, ...v97);
      });
    };
  v22("C_START_SKILL", hooks.MODIFY_ALL, v21);
  v22("C_START_TARGETED_SKILL", hooks.MODIFY_ALL, v21);
  v22("C_START_COMBO_INSTANT_SKILL", hooks.MODIFY_ALL, v21);
  v22("C_START_INSTANCE_SKILL", hooks.MODIFY_ALL, v21);
  v22("C_START_INSTANCE_SKILL_EX", hooks.MODIFY_ALL, v21);
  v22("C_PRESS_SKILL", hooks.MODIFY_ALL, v21);
  v22("C_NOTIMELINE_SKILL", hooks.MODIFY_ALL, v21);
  v1.hook(...v2.packet.get_all("C_CANCEL_SKILL"), hooks.MODIFY_REAL, v98 => {
    if (!v2.utils.isEnabled(v98.skill.id)) return;
    const v100 = v2?.action?.stage?.skill?.id;
    if (!v100) return;
    const v101 = v2.skills.canCancelSkillWithType(v100, v98.type);
    if (!v101) return;
    const v102 = classes.ARCHER === v2.player.job && v2.utils.getSkillInfo(v100).skill === 7;
    v2.skills.sendActionEnd(v100, v102 ? 25 : v98.type);
    v5 = v98.type;
    v1.setTimeout(() => {
      v1.send(...v2.packet.get_all("C_CANCEL_SKILL"), v98);
    }, jit());
    return false;
  });
  v1.hook(...v2.packet.get_all("S_ACTION_STAGE"), hooks.MODIFY_REAL, v104 => {
    if (!v2.player.isMe(v104.gameId)) return;
    if (!v2.utils.isEnabled()) return;
    if (!v2.utils.isEnabled(v104.skill.id)) {
      if (!v2.action.inAction) return;
      v2.skills.sendActionEnd(v2.action.stage.skill.id, 60, v104.loc);
      return;
    }
    if (v104.stage === 0 && v2?.action?.serverEnd?.type === 4 && !v2.skills.isChain(v2.action.serverEnd.skill.id, v104.skill.id) && (v2?.action?.end?.type !== 4 || v2?.action?.stage?.skill?.id !== v104.skill.id) && v2.action.serverEnd.skill.id !== v104.skill.id) {
      v2.log.debug("EMULATION", "Missing chain " + v2.action.serverEnd.skill.id + " -> " + v104.skill.id + " - " + v2.player.templateId);
      if (v104.skill.id !== v2.action.stage.skill.id) {
        v2.skills.sendActionEnd(v2.action.stage.skill.id, 4, v104.loc);
        v18(v104.skill.id, false);
      }
    }
    return false;
  });
  v1.hook(...v2.packet.get_all("S_USER_STATUS"), hooks.READ_REAL, v106 => {
    if (!v2.player.inCombat && v106.status === 1) v16 = [];
  });
  v1.hook(...v2.packet.get_all("S_ACTION_END"), hooks.MODIFY_REAL, v108 => {
    if (!v2.player.isMe(v108.gameId)) return;
    if (!v2.action.inAction) return;
    if (!v2.utils.isEnabled(v108.skill.id)) return;
    if (![0, 1, 2, 3, 4, 5, 6, 10, 11, 34, 36, 51].includes(v108.type) && (v108.type !== v2?.action?.end?.type || Date.now() - v2.action.end._time > v2.utils.getPacketBuffer()) && !(v108.type === 39 && v2.action.inAction && v108.skill.id !== v2.action.stage.skill.id)) {
      const v113 = v2.action.stage.skill.id;
      v2.log.debug("EMULATION", "accepting server's ACTION END", v108.skill.id, v108.type, v113);
      v2.skills.sendActionEnd(v113, v108.type, v108.loc, v108.type !== 28);
    }
    "D610F50D9635FF375ABC3D8624A0772D2872DABA8D34302177C69A9F3E4B1AAEDE96E24A6AB159CF495AE1973C9E16B6252F09006D31E6C8AFD3DFF1FC3F5D00";
    const v110 = v2?.action?.end?._time || 0,
      v111 = Date.now() - v110 <= v2.utils.getPacketBuffer(),
      v112 = v2.skills.getType(v108.skill.id);
    if (v111 && !v2.action.inAction && v112 !== "movingSkill") {
      const v114 = v108.loc.dist2D(v2.action.end.loc);
      if (v114 > 100) v2.utils.sendInstantMove(v108.loc, v108.w);
    }
    return false;
  });
  v1.hook(...v2.packet.get_all("S_CONNECT_SKILL_ARROW"), hooks.MODIFY_REAL, v115 => {
    if (v10 > Date.now()) return false;
  });
  v1.hook(...v2.packet.get_all("S_GRANT_SKILL"), hooks.MODIFY_REAL, v117 => {
    if (v11 > Date.now()) return false;
  });
  v1.hook(...v2.packet.get_all("S_INSTANT_MOVE"), hooks.READ_REAL, v119 => {
    if (!v2.player.isMe(v119.gameId)) return;
    const v121 = v2.last.instantMove._time || 0,
      v122 = Date.now() - v121 <= v2.utils.getPacketBuffer(250);
    if (v122) {
      const v123 = v119.loc.dist2D(v2.last.instantMove.loc);
      if (v123 < 35) return;
    }
    v9 = v119.loc;
  });
  v1.hook(...v2.packet.get_all("S_CREATURE_LIFE"), hooks.READ_DESTINATION_ALL, v124 => {
    if (!v2.player.isMe(v124.gameId)) return;
    if (v124.alive) return;
    if (!v2.utils.isEnabled()) return;
    if (!v2.action.inAction) return;
    v2.skills.sendActionEnd(v2.action.stage.skill.id, 699, v124.loc);
  });
  v1.hook(...v2.packet.get_all("S_DEFEND_SUCCESS"), hooks.READ_DESTINATION_REAL, v126 => {
    if (!v2.player.isMe(v126.gameId)) return;
    const v128 = v2.utils.getSkillInfo(v2.last.startSkill.skill.id);
    if (v2.action.inAction && v2.utils.getSkillInfo(v2.action.stage.skill.id).skill === v128.skill) return;
    const v129 = v2.skills._getInfo(v128.id);
    if (!v129?.onlyAfterDefenceSuccess) return;
    const v130 = v2.last.startSkill._time + v2.ping.ping / 2,
      v131 = Date.now() - v2.ping.ping / 2;
    if (v130 <= v131) return;
    v20(v2.last.startSkill._name, v2.last.startSkill, {}, null);
  });
  const v23 = v132 => {
    if (!v132.push && v132.animSeq.length && v2.action.inAction) v2.skills.sendActionEnd(v2.action.stage.skill.id, 9, v132.loc, true);
  };
  v2.action.on("reaction", v23);
  this.destructor = () => {
    v1.clearInterval(sampler);
    v2.action.off("reaction", v23);
  };
};
