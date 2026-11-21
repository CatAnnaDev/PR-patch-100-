const hooks = require("../enums/hooks"),
  classes = require("../enums/classes"),
  SKILL_CONFIG = require("../../skills.json"),
  crypto = require("crypto"),
  EventEmitter = require("events");
class Skills extends EventEmitter {
  getAbnormalitiesToStartOnActionStage = v1 => {
    return this._getInfo(v1)?.abnormalityApply || [];
  };
  getAbnormalitiesToEndOnActionStage = v3 => {
    return this._getInfo(v3)?.abnormalityConsume?.stage || [];
  };
  getAbnormalitiesToEndOnActionEnd = v5 => {
    return this._getInfo(v5)?.abnormalityConsume?.end || [];
  };
  getSkillsToApplyCooldownToFrom = v7 => {
    return this._getInfo(v7)?.applyCooldown;
  };
  get counter() {
    return this.info.skillIdCounter;
  }
  get supportedCount() {
    return this.info.skillSupportedCount;
  }
  getAnimationLength = (v10, v11, v12) => {
    const v14 = this.mods.hardcoded.getAnimationLength(v10, v11, v12);
    if (v14) return v14;
    const v15 = this._getInfo(v10);
    if (!v15) return -1;
    if (v15.type === "dash") {
      const v16 = Math.abs(this.mods.last.startSkill.loc.dist2D(this.mods.last.startSkill.dest)) + 25,
        v17 = v16 * 1000 / v15.animLength;
      return v17 / v12.real;
    }
    if (v15.type === "movingCharge") {
      const v18 = v15.animLength[v11][0];
      return v18 / v12.real;
    }
    if (v15.shouldNotUseLength) {
      if (v15?.animLength?.length && v11 + 1 !== v15.animLength.length) return v15.animLength[v11] / v12.real;
      return -1;
    }
    if (!Array.isArray(v15.animLength)) return v15.animLength / v12.real;
    return v15.animLength[v11] / v12.real;
  };
  getRawAnimationLength = (v19, v20 = {
    real: 1
  }, v21 = 0) => {
    return this.getAnimationLength(v19, v21, v20);
  };
  getAnimationlengthForAllStages = (v22, v23 = {
    real: 1
  }, v24 = null) => {
    let v26 = 0;
    const v27 = v24 !== null ? v24 : this.getStageCount(v22);
    for (let v28 = 0; v28 < v27; v28++) {
      v26 += this.getAnimationLength(v22, v28, v23);
    }
    return v26;
  };
  getStageCount = v29 => {
    return this._getInfo(v29)?.animLength?.length || 0;
  };
  getCooldownData = v31 => {
    return this._getInfo(v31)?.cooldown;
  };
  getRetryCount = v33 => {
    const v35 = this.mods.hardcoded.getRetryCount(v33);
    if (v35 !== -1) return v35;
    return 4;
  };
  canCast = (v36, {
    byGrant: v37,
    press: v38,
    originalSkillId: v39
  }) => {
    const {
        skillId: v41,
        noAction: v42,
        charge: v43,
        type: v44,
        failed: v45
      } = v36,
      v46 = this._getInfo(v41),
      v47 = this.mods.hardcoded.canCast(v41);
    if (v47 !== -1) return v47;
    const v48 = !v42 && v46.keepMovingCharge && this.getType(this.mods.action.stage.skill.id) === "movingCharge";
    if (!v48) for (const v51 of v46.categories) {
      if (this.mods.effects.isCategoryEnabled(v51)) continue;
      this.mods.log.debug("CAN_CAST", v51);
      return -11;
    }
    if (this.mods.cooldown.isOnCooldown(v41, v39)) return -12;
    if (!v46.noNeedWeapon && !this.mods.player.inven.weapon) return -13;
    const v49 = this.mods.crowd_control.canCastSkill(v41);
    if (v49 !== 0) return v49;
    if (v44 !== 5 && v46.typeId === 27) return -27;
    if (v46.onlyAfterDefenceSuccess && ((this?.mods?.action?.stage?._time || 0) > (this?.mods?.last?.block?._time || 0) || !this.mods.action.inAction)) return -17;
    const v50 = this.mods.effects.getAppliedEffects(v41);
    if (v46?.resourceUsage?.st + v50.stamina > this.mods.player.stamina) return -14;
    if (this.mods.player.job === 4 && v41 === 360120) return -16;
    if (!v43 && v38 === false && (v42 || v41 !== this.mods.action.stage.skill.id) && this._getInfo(this?.mods?.action?.stage?.skill?.id)?.typeId !== 7) return -15;
    if (v46.keepMovingCharge && this._getInfo(this?.mods?.action?.stage?.skill?.id)?.typeId !== 25) return -18;
    if (v46.type === "nocasting") return -4;
    if (v42) return -1;
    if (v43) return -2;
    if (v46.type === "notimeline") return -3;
    if (v45) return -5;
    if (this.mods.action.stage.skill.id && this.getType(this.mods.action.stage.skill.id) === "notimeline") return -6;
    if (this.mods.action.inSpecialAction && ![27].includes(v46.typeId)) return -7;
    return v44;
  };
  canCancelSkillWithType = (v52, v53) => {
    if (!this.mods.action.inAction) return null;
    const v55 = this._getInfo(v52),
      {
        front = -1
      } = v55?.cancels || {},
      v56 = (Date.now() - this.mods.action.stage._time) * this.mods.action.speed.real;
    switch (v53) {
      case 1:
        return v55?.typeId === 30;
      case 2:
        return front !== -1 && front > v56 && this.mods.action.stage.stage === 0;
    }
  };
  _getWiggleRoom = () => {
    return global.TeraProxy ? 80 + this.mods.ping.jitter : this.mods.ping.jitter;
  };
  _calculateTime = (v58, v59, v60, v61 = null, v62 = null, v63 = true) => {
    const v65 = v63 ? this._getWiggleRoom() : 0,
      v66 = [v58];
    v62 = v61 ? v62 : this.mods.action.stage.stage + 1;
    v61 = v61 ? v61 : this.mods.action.stage.skill.id;
    const v67 = this.getAnimationlengthForAllStages(v61, {
      real: 1
    }, v62);
    v66.push(v67);
    const v68 = this._getInfo(v61);
    v66.push(...(v68?.targeting || []));
    const v69 = v59 - v65,
      v70 = v66.map(v75 => Math.abs(v75 - v69)),
      v71 = [...v70].sort((v76, v77) => v76 - v77),
      v72 = v66[v70.indexOf(v71[0])],
      v73 = Math.floor((v59 - v72 - v65) / v60) - 1,
      v74 = v72 === v58;
    if (v74 ? v73 <= v65 * -1 : v73 <= -8) {
      for (const v78 of v71) {
        const v79 = v66[v70.indexOf(v78)],
          v80 = Math.floor((v59 - v79 - v65) / v60) - 1;
        if (v80 >= 0) return v80;
      }
      return 0;
    }
    return v73;
  };
  getNewSkillData = (v81, {
    byGrant: v82,
    press: v83
  }) => {
    const v85 = v81;
    if (!v82 && this.mods.player.job === classes.NINJA && [90100, 90130].includes(v81) && this.mods.effects.getPassivity(32065)) v81 = 90131;
    const v86 = this.mods.effects.getAppliedEffects(v81);
    if (v86.transform) v81 = v86.transform;
    let v87 = this._getInfo(v81);
    if (!v87) {
      this.mods.log.error("CRITICAL", "Failed to find skill info " + v85 + " " + v81 + " " + this.mods.player.templateId + " 0");
      return {
        failed: true,
        skillId: v81,
        notFound: true
      };
    }
    let v88 = false,
      v89;
    do {
      v89 = true;
      for (const {
        id: v103,
        skill: v104
      } of v87?.abnormalityRedirect || []) {
        const v105 = this.mods.effects.getAbnormality(v103);
        if (!v105) continue;
        const v106 = this._getInfo(v104);
        if (!v106) continue;
        v89 = false;
        if (Math.abs(v81 - v104) > 10000) return this.getNewSkillData(v104, {
          byGrant: v82,
          press: v83
        });
        v88 = v105;
        v81 = v104;
        v87 = v106;
        break;
      }
    } while (!v89);
    if ([classes.NINJA, classes.BERSERKER].includes(this.mods.player.job) && v88 && v87.typeId === 28) {
      this.mods.log.debug("NEW-SKILL-DATA", "Removing abnormality chain (28): " + v81);
      v88 = false;
    }
    if (v87.connectNextSkill && this.mods.effects.hasAbnormalityWithTypeValue(334, v87.baseId)) {
      v81 = v87.connectNextSkill;
      v87 = this._getInfo(v81);
    }
    if (this.mods.effects.hasAbnormalityWithCategoryTypeValue(v87.categories, 239, null, 3)) {
      const v107 = this.mods.utils.getSkillInfo(v81);
      v107.sub = 30;
      v81 = v107.id;
      v87 = this._getInfo(v81);
    }
    if (v82 && this.info.connectSkillArrow[v85]) {
      const v108 = this.info.connectSkillArrow[v85],
        v109 = this.mods.action.inAction && this.mods.action.stage?.skill?.id === v108.skillId,
        v110 = v108.time > Date.now() && !v109;
      if (v110) return {
        skillId: v108.skillId,
        byGrant: true,
        time: this.mods.ping.jitter - 1,
        noAction: true
      };
    }
    if (!this.mods.action.inAction) {
      let v111 = false;
      if (v87.keptMovingCharge && v87.type === "movingCharge") {
        v81 = v87.animLength[this.mods.action.keptMovingCharge][1];
        v111 = true;
      }
      return {
        skillId: v81,
        charge: v111,
        noAction: true
      };
    }
    if (v87.type === "notimeline") return {
      skillId: v81,
      time: this.mods.ping.jitter,
      type: 9
    };
    const v90 = this.mods.action.stage.skill.id,
      v91 = this.mods.utils.getSkillInfo(v90),
      v92 = this._getInfo(v90) || {};
    if (v87.keepMovingCharge && v92.type === "movingCharge") return {
      skillId: v81,
      keepCharge: true,
      time: this.mods.ping.jitter - 1,
      type: 0
    };
    if ((v82 || v90 === v81) && v92.type === "movingCharge" && v83 === false) {
      let v112 = this.mods.ping.jitter;
      const v113 = Date.now() - this.mods.action.stage._stageTime - v112,
        v114 = Math.abs(v92.animLength[this.mods.action.stage.stage][0] - (v113 + v112) * this.mods.action.speed.real);
      if (v113 <= 30) {
        v112 = Math.abs(Math.min(v113, 15)) * -1;
        this.mods.log.debug("CHARGE", "special charge 1; delaying by:", v112);
      } else if (v114 <= 30) {
        v112 = Math.abs(v114) * -1 - 25;
        this.mods.log.debug("CHARGE", "special charge 2; delaying by:", v112);
      }
      return {
        skillId: v92.animLength[this.mods.action.stage.stage][1],
        time: v112,
        charge: true
      };
    }
    if (v87.onlyAfterDefenceSuccess && this.mods.last.block._time > this.mods.action.stage._time) return this.mods.action.serverStage._time >= this.mods.last.block._time ? (this.mods.log.debug("getNewSkillData", "Not allowing the skill through due to race condition"), {
      skillId: v81,
      failed: true,
      type: -999
    }) : {
      skillId: v81,
      chain: true,
      time: this.mods.last.block._time - this.mods.action.stage._time - 1,
      type: v92.typeId === 46 ? 6 : 3
    };
    const {
        rearStartTime = -1,
        pendingStartTime = -1,
        front = -1
      } = v92.cancels || {},
      v93 = this._getWiggleRoom(),
      v94 = this?.mods?.action?.speed?.real || 1,
      v95 = (Date.now() - this.mods.action.stage._time) * v94 + v93,
      v96 = this.isInPendingTime(v95, v92.cancels);
    if (v92.typeId === 25 && this.canFrontCancel(v95, v92.cancels)) return {
      skillId: v81,
      front: true,
      time: this._calculateTime(front, v95, v94),
      type: 2
    };
    if (v90 === v81 && v83 === false && v87.typeId === 41) return {
      skillId: v81,
      cancel: true,
      time: this.mods.ping.jitter - 1,
      type: 51
    };
    if ([6, 9, 22, 24, 29, 38, 41, 42].includes(v87.typeId) && v87.pendingType === 1 && v96 && !v88) return {
      skillId: v81,
      immediate: true,
      time: this._calculateTime(pendingStartTime, v95, v94),
      type: 6,
      code: 1
    };
    if (v92.typeId === 31 && v87.pendingType === 1) return {
      skillId: v81,
      immediate: true,
      time: this._calculateTime(pendingStartTime, v95, v94),
      type: 6,
      code: 3
    };
    const v97 = this.mods.utils.getSkillInfo(v81),
      v98 = v96 && v92?.chains?.[v97.skill] !== undefined,
      v99 = v97.skill === v91.skill && v87.pendingType === 3 && v92.pendingType === 3 && v92?.chains?.[v97.skill] !== undefined;
    if (v98 || v88 || v99) {
      let v115 = {
          chain: v98,
          time: this._calculateTime(pendingStartTime, v95, v94),
          type: 4
        },
        v116 = false;
      if (v87.type === "movingCharge") {
        v115.charge = true;
        v97.id = v87.overChargeConnectSkill || v97.id;
      } else {
        if (v98 || v99) {
          if (v87.type === "connect") {
            v116 = true;
            for (const v117 of v92.chains[v97.skill]) {
              const v118 = v97.skill + "-" + v117;
              if (v87?.connectSkills?.[v118] !== undefined) {
                v97.sub = v117;
                v97.level = v87.connectSkills[v118];
                v116 = false;
                break;
              }
            }
          } else {
            v116 = true;
            for (const v119 of v92.chains[v97.skill]) {
              if (v119 === v97.sub) {
                v116 = false;
                break;
              }
              const v120 = v97.skill + "-" + v119;
              if (v87?.connectSkills?.[v120] !== undefined) {
                v97.sub = v119;
                v97.level = v87.connectSkills[v120];
                v116 = false;
                break;
              }
            }
          }
        }
      }
      if (v98 ? v88 && v116 : v88) {
        v116 = false;
        const v121 = Date.now();
        v115.time = Math.floor(v121 - v88.time);
        if (v97.id === this.mods.action.stage.skill.id) {
          const v122 = !(v92?.abnormalityRedirectToMe || []).includes(v88.id);
          if (!v122) if (v121 - this.mods.action.stage._time >= 500) v115.time = Math.min(v115.time, v121 - this.mods.action.stage._time - 501);else if (v96) {
            v97.id = v85;
            v115.time = this._calculateTime(pendingStartTime, v95, v94);
            v115.type = 6;
            v115.code = 666;
            delete v115.chain;
          } else v116 = true;
        }
      }
      v115.skillId = v97.id;
      if (!v116) return v115;
    }
    if (v90 === v81 && [3, 46].includes(v92.typeId) && !v83) return {
      skillId: v81,
      cancel: true,
      time: this.mods.ping.jitter - 1,
      type: v92.typeId === 46 ? 51 : 10
    };
    if (v90 === v81 && v87.type === "drain") return {
      skillId: v87.nextSkill,
      chain: true,
      time: this.mods.ping.jitter - 1,
      type: 11
    };
    if (v91.skill === this.mods.utils.getSkillInfo(v81).skill && !!v92.lockon) return {
      skillId: v81,
      chain: true,
      time: this.mods.ping.jitter - 1,
      type: 36
    };
    if (v87.pendingType === 3 && !(v92.typeId === 9 && v92.pendingType === 0) && v91.skill !== v97.skill) return {
      skillId: v81,
      super: true,
      time: this.mods.ping.jitter - 1,
      type: 6
    };
    if (v87.typeId === 25 && v83 && v87.pendingType === 1 && v96) return {
      skillId: v81,
      immediate: true,
      time: this._calculateTime(pendingStartTime, v95, v94),
      type: 6,
      code: 2
    };
    if (v87.typeId === 31 && v87.pendingType === 1 && v96) return {
      skillId: v81,
      immediate: true,
      time: this._calculateTime(pendingStartTime, v95, v94),
      type: 6,
      code: 4
    };
    const v100 = this.canRearCancel(v95, v92.cancels);
    if (v92.typeId === 30 && v92.pendingType === 0 && v100) return {
      skillId: v81,
      immediate: true,
      time: this._calculateTime(pendingStartTime, v95, v94),
      type: 6,
      code: 5
    };
    if (v92.typeId === 30 && v87.pendingType === 1 && v96) return {
      skillId: v81,
      immediate: true,
      time: this._calculateTime(pendingStartTime, v95, v94),
      type: 6,
      code: 6
    };
    const v101 = v92.typeId === 29 && v87.typeId !== 29 && (v92.dashRedirect === v81 || v92.dashRedirectFail === v81);
    if (v87.pendingType === 2 && ![9, 28].includes(v87.typeId) && (v92.typeId > 36 || ![3, 9, 21, 35, 41, 53].includes(v92.typeId) || v92.typeId === 9 && 3 !== v87.typeId) && (v100 || v101) && !(v92.pendingType === 0 && v87.typeId === 1)) {
      let v123 = this._calculateTime(rearStartTime, v95, v94);
      if (v101) v123 = -1;
      return {
        skillId: v81,
        rear: true,
        code: 1,
        time: v123,
        type: 6
      };
    }
    if (v87.pendingType === 2 && [3, 9].includes(v87.typeId) && v100 && v92.typeId !== v87.typeId && !(this.mods.player.job === classes.LANCER && v91.skill === 26 && v97.skill === 2)) return {
      skillId: v81,
      rear: true,
      code: 2,
      time: this._calculateTime(rearStartTime, v95, v94),
      type: 6
    };
    if (v87.canCastDuringBlock && [3, 41, 46].includes(v92.typeId) && v100 && [0, 1, 10].includes(this.mods.player.job)) return {
      skillId: v81,
      block: true,
      time: this._calculateTime(rearStartTime, v95, v94),
      type: 6
    };
    if (v101) return {
      skillId: v81,
      dash: true,
      time: -1,
      type: 6
    };
    if (v92.lockon && v92.typeId === 30 && v97.skill !== v91.skill) return {
      skillId: v81,
      lockon: true,
      time: this.mods.ping.jitter - 1,
      type: 6
    };
    if (v87.typeId === 27 && (this.mods.datacenter.isKnockDown(v90) || this.mods.action.stage.air || this.mods.action.stage.airChain)) return {
      skillId: v81,
      kd: true,
      time: this.mods.ping.jitter - 1,
      type: 5
    };
    const v102 = this.getAnimationlengthForAllStages(v90);
    if (!v92.shouldNotUseLength && v92.typeId !== 29 && v95 >= v102 && this.isSupported(v90)) {
      const v124 = this._calculateTime(v102, v95, v94);
      if (v124 >= 0) this.mods.log.debug("FUTURE", "Future is bigger than 0. " + v124);else return {
        skillId: v81,
        noAction: true,
        future: true,
        time: v124 - 5
      };
    }
    return {
      skillId: v81,
      failed: true
    };
  };
  getSpeed = v125 => {
    const v127 = this._getInfo(v125),
      v128 = this.mods.effects.getAppliedEffects(v125);
    let v129 = 1,
      v130 = this.mods.player.aspd;
    const v131 = this.mods.utils.getSkillInfo(v125),
      v132 = this.mod.patch <= 93 && this.mods.player.job === classes.GUNNER && v131.skill === 5 && ![0, 10, 20].includes(v131.sub);
    let v133 = v127?.fixedSpeed || v132 || false ? 1 : this.mods.player.aspd,
      v134 = v133,
      v135 = v133;
    if (["shootingmovingskill", "movingSkill", "movingDefence"].includes(v127?.type)) v133 = this.mods.player.aspd;
    const v136 = v127?.type === "movingCharge";
    if (!v136) v134 *= v128.abnormSpeed * v128.passiveSpeed;
    v133 *= v128.abnormSpeed * v128.passiveSpeed;
    v135 *= v128.abnormSpeed * v128.passiveSpeed;
    v129 *= v128.abnormSpeed * v128.passiveSpeed;
    v130 *= v128.abnormSpeed * v128.passiveSpeed;
    v133 *= v128.noct;
    v134 *= v128.noct;
    v135 *= v128.noct;
    v129 *= v128.noct;
    v130 *= v128.noct;
    if (v136) {
      v133 += v128.chargeSpeed;
      v135 += v128.chargeSpeed;
      v129 += v128.chargeSpeed;
      v130 += v128.chargeSpeed;
      v135 *= v127.timeRate;
    }
    if (v127?.lockon) v134 = 1;
    return {
      real: v133,
      stage: v134,
      projectile: v135,
      fixed: v129,
      not_fixed: v130
    };
  };
  isSupported = v137 => {
    const v139 = this.mods.hardcoded.isSupported(v137);
    if (v139 !== undefined) return v139;
    const v140 = this.mods.utils.getSkillInfo(v137);
    if (this?.info?.loadedSkillConfig?.[v140.skill]?.[v140.sub] === false) return false;
    return !!this._getInfo(v137);
  };
  getAppliedEffects = v141 => {
    return this._getInfo(v141)?.appliedEffects || {};
  };
  getKeepMovingCharge = v143 => {
    return this._getInfo(v143)?.keepMovingCharge;
  };
  getKeptMovingCharge = v144 => {
    return this._getInfo(v144)?.keptMovingCharge;
  };
  getCategories = v146 => {
    return this._getInfo(v146)?.categories || [];
  };
  getType = v148 => {
    return this._getInfo(v148)?.type;
  };
  getTypeId = v150 => {
    return this._getInfo(v150)?.typeId;
  };
  getArrowChain = v152 => {
    return this._getInfo(v152)?.arrowChain;
  };
  getChargeSkillId = (v154, v155) => {
    return this._getInfo(v154)?.animLength?.[v155]?.[1];
  };
  getLockonData = v157 => {
    return this._getInfo(v157)?.lockon;
  };
  getSkillDelayTime = (v159, {
    byGrant: v160,
    press: v161
  }) => {
    const v163 = this.mods.hardcoded.getSkillDelayTime(v159, {
      byGrant: v160,
      press: v161
    });
    if (v163) return v163;
    const v164 = this._getInfo(v159);
    if (v164.typeId === 29) return 30;
    if (v161 && v164.typeId === 25) return 30;
    if (v164.typeId === 30 && !!v164.lockon) return 30;
    if (this.mods.player.job === classes.LANCER && [3, 46].includes(v164.typeId) && v161) return 5;
    return 0;
  };
  getActionDest = ({
    skillId: v165,
    stage: v166,
    effects: v167,
    loc: v168,
    w: v169
  }) => {
    const v171 = this._getInfo(v165),
      v172 = this.mods.last.packet("C_START_INSTANCE_SKILL");
    if (v171.useDest[v166] === 1) return v168;
    if (v172?.skill?.id === v165 && v172.endpoints.length && v171.useDest[v166] === 2) return v172.endpoints[0];
    const v173 = v171?.distance?.[v166] || 0;
    if (v173 === 0 || v171.useDest[v166] === 0) return {
      x: 0,
      y: 0,
      z: 0
    };
    const v174 = v171?.directionModifier?.[v166] || 0;
    return this.mods.utils.applyDistance(v168, v169 + v174, v173 * v167.dist);
  };
  getActionAnimSeq = (v175, v176, v177) => {
    const v179 = this._getInfo(v175);
    if (this.mods.player.job === classes.ARCHER && (this.mod.patch >= 114 ? [340101, 340102] : [340100]).includes(v175)) v177.dist = 0;
    const v180 = v179?.holdIfNotMoving && !this.mods.last.packet("C_START_SKILL")?.moving;
    if (v177.dist === 1 && !v180) return [];
    const v181 = (v179?.animSeq?.[v176] || []).map(v240 => ({
      ...v240
    }));
    for (const v182 of v181) {
      v182.distance *= v177.dist * (v180 ? 0 : 1);
    }
    return v181;
  };
  sendActionStage = ({
    skillId: v183,
    continuation: v184,
    stage: v185
  }) => {
    const {
      player: v187
    } = this.mods;
    let v188, v189, v190;
    if (v184) {
      v185 = this.mods.action.stage.stage + 1;
      v188 = this.mods.action.speed;
      v189 = this.mods.action.stage.id;
      v190 = this.mods.action.effects;
    } else {
      v185 = v185 || 0;
      v188 = this.getSpeed(v183);
      this.mods.log.debug("SPEED", "R:" + v188.real + " S:" + v188.stage + " P:" + v188.projectile + " F:" + v188.fixed + " NF:" + v188.not_fixed);
      v189 = ++this.info.skillIdCounter;
      v190 = this.mods.effects.getAppliedEffects(v183);
    }
    let v191 = v190.effectScale;
    if (this.mods.player.job === 7 && [25, 27, 33, 34].includes(this.mods.utils.getSkillInfo(v183).skill)) for (let v194 = 16084501; v194 <= 16084560; v194++) {
      if (!this.mods.effects.getSkillPolishing(v194)) continue;
      v191 += v194 % 16084500 / 100;
    }
    const v192 = v185 ? this.mods.position.w : this.mods.last.startSkill.w,
      v193 = v185 ? this.mods.position.loc : this.mods.last.startSkill.loc || this.mods.position.loc;
    this.mod.send(...this.mods.packet.get_all("S_ACTION_STAGE"), {
      gameId: v187.gameId,
      loc: v193,
      w: v192,
      templateId: v187.templateId,
      skill: v183,
      stage: v185,
      speed: v188.stage,
      projectileSpeed: v188.projectile,
      id: v189,
      effectScale: v191,
      moving: false,
      dest: this.getActionDest({
        skillId: v183,
        stage: v185,
        effects: v190,
        loc: v193,
        w: v192
      }),
      target: 0x0n,
      animSeq: this.getActionAnimSeq(v183, v185, v190)
    });
  };
  sendActionEnd = (v195, v196, v197, v198) => {
    const {
        player: v200
      } = this.mods,
      v201 = {
        gameId: v200.gameId,
        loc: v197 || this.mods.position.loc,
        w: this.mods.position.w,
        templateId: v200.templateId,
        skill: v195,
        type: v196,
        id: this.mods.action.stage.id
      };
    this.mod.send(...this.mods.packet.get_all("S_ACTION_END"), {
      ...v201,
      loc: this.mods.position.loc
    });
    if (v198) this.mod.send(...this.mods.packet.get_all("S_INSTANT_MOVE"), v201);
  };
  sendConnectSkillArrow = (v202, v203) => {
    if (v203) return false;
    const v205 = this.getArrowChain(v202);
    if (v205 === null || v205 === undefined) return false;
    if (!this.mods.action.inAction) {
      this.mods.log.debug("SKILL ARROW", "didn't send due to not being in a skill");
      return false;
    }
    const v206 = this.mods.utils.getSkillInfo(v202);
    v206.sub = v205;
    this.info.connectSkillArrow[v206.id] = {
      skillId: v202,
      time: Date.now() + 200
    };
    this.mod.send(...this.mods.packet.get_all("S_CONNECT_SKILL_ARROW"), {
      templateId: this.mods.player.templateId,
      unk1: 0,
      skill: v206.id,
      unk2: 1
    });
    return true;
  };
  isInPendingTime = (v207, v208 = {}) => {
    const {
      pendingStartTime = -1,
      pendingEndTime = -1
    } = v208;
    if (pendingStartTime === -1) return false;
    if (v207 < pendingStartTime) return false;
    if (pendingEndTime !== -1 && v207 > pendingEndTime) return false;
    return true;
  };
  canFrontCancel = (v209, v210 = {}) => {
    const {
      front = -1
    } = v210;
    if (front === -1) return false;
    if (v209 < front) return false;
    return true;
  };
  canRearCancel = (v211, v212 = {}) => {
    const {
      rearStartTime = -1,
      rearEndTime = -1
    } = v212;
    if (rearStartTime === -1) return false;
    if (v211 < rearStartTime) return false;
    if (rearEndTime !== -1 && v211 > rearEndTime) return false;
    return true;
  };
  isChain = (v213, v214) => {
    const v216 = this.mods.utils.getSkillInfo(v214),
      v217 = this._getInfo(v213);
    return v217?.chains?.[v216.skill] !== undefined;
  };
  getDirectionModifier = (v218, v219) => {
    return this._getInfo(v218)?.directionModifier?.[v219] || 0;
  };
  getActionStageDelay = v221 => {
    if (this.mods.player.job === classes.SLAYER && [170100, 170200, 170300].includes(v221)) return 30;
    return 0;
  };
  _getInfo = v223 => {
    return this.info.skillData[v223];
  };
  loaded = v225 => {
    if (v225) {
      this.info.skillIdCounter = v225.counter || 0;
      for (const v231 in v225.events) {
        if (Array.isArray(v225.events[v231])) for (const v232 of v225.events[v231]) {
          this.on(v231, v232);
        } else this.on(v231, v225.events[v231]);
      }
    }
    const {
      class: v227,
      gender: v228,
      race: v229
    } = this.mods.datacenter.getUserData(this.mods.player.templateId);
    let v230 = null;
    try {
      v230 = this.mods.library.readFile(__dirname, "../../skills/" + v228 + "/" + v229 + "/" + v227 + ".json");
    } catch (v233) {
      this.mods.log.debug("LOADING", "No support for the class: " + this.mods.player.templateId);
      this.info.skillData = {};
      this.info.skillSupportedCount = 0;
      this.info.loadedSkillConfig = {};
      return;
    }
    try {
      this.info.skillData = JSON.parse(v230);
      this.info.skillSupportedCount = Object.keys(this.info.skillData).length;
      this.info.loadedSkillConfig = SKILL_CONFIG[v227.toLowerCase()];
      if (!global.PR) global.PR = {};
      global.PR[this.mods.player.templateId] = true;
      this.emit("loaded");
    } catch (v234) {
      try {
        v230 = v230.slice(2);
        const v235 = "MTIsNDgsMTE1LDQzLDYsOTUsMTMwLDExMywyMTQsMTk1LDQ2LDEzOSwyMTMsMTAxLDIzLDEyOA==",
          v236 = "MTAzLDUsMTUzLDE5MywyMDEsMTQ0LDE4NiwxMjEsMjQ3LDIxOSw1NCw4MCwyMTUsODgsMTQsNw==",
          v237 = Buffer.from(v235, "base64").toString().split(",").map(Number),
          v238 = Buffer.from(v236, "base64").toString().split(",").map(Number);
        let v239 = crypto.createDecipheriv("aes-128-cbc", Buffer.from(v237), Buffer.from(v238));
        v239.setAutoPadding(0);
        let v240 = v239.update(v230, "utf8", "utf-8");
        while (v240.indexOf("\0") !== -1) v240 = v240.replace("\0", "");
        this.info.skillData = JSON.parse(v240);
        this.info.skillSupportedCount = Object.keys(this.info.skillData).length;
        this.info.loadedSkillConfig = SKILL_CONFIG[v227.toLowerCase()];
        if (!global.PR) global.PR = {};
        global.PR[this.mods.player.templateId] = true;
        this.emit("loaded");
      } catch (v241) {
        this.mods.log.error("LOADING", "failed loading config", v241);
        this.info.skillData = {};
        this.info.skillSupportedCount = 0;
        this.info.loadedSkillConfig = {};
      }
    }
  };
  destructor = () => {
    if (global.PR) delete global.PR;
    return {
      counter: this.info.skillIdCounter,
      events: this._events
    };
  };
  constructor(v243, v244) {
    super();
    this.mod = v243;
    this.mods = v244;
    this.info = {
      skillData: {},
      skillIdCounter: 0,
      connectSkillArrow: {},
      skillSupportedCount: 0,
      loadedSkillConfig: {}
    };
    v243.hook("S_LOGIN", "event", hooks.READ_REAL, this.loaded);
  }
}
module.exports = Skills;
