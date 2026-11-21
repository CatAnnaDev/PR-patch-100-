const hooks = require("../enums/hooks");
class Effects {
  _applyEffectToObject = (v1, v2, v3, v4) => {
    let v6 = null;
    if (v2 === "abnormal") v6 = this.getAbnormality;else {
      if (v2 === "passivity") v6 = this.getPassivity;else {
        if (v2 === "skillPolishing") v6 = this.getSkillPolishing;else v6 = this.getTalent;
      }
    }
    for (const [v7, v8] of Object.entries(v3)) {
      if (v2 === "abnormal") v4[v7] = true;
      if (v8.requiresAbnormality) {
        const v9 = v8.requiresAbnormality.map(this.getAbnormality).filter(Boolean);
        if (!v9.length) continue;
      }
      for (const [v10, v11] of Object.entries(v8)) {
        if (v10 === "requiresAbnormality") continue;
        if (v10 === "requireBlock") {
          v1.block = true;
          continue;
        }
        if (!v6(v7)) continue;
        switch (v10) {
          case "abnormSpeed":
            v1.abnormSpeed += v11;
            break;
          case "passiveSpeed":
            v1.passiveSpeed += v11;
            break;
          case "chargeSpeed":
            v1.chargeSpeed += v11;
            break;
          case "distModifier":
            v1.dist *= v11;
            break;
          case "moreLockonTargets":
            v1.lockon += v11;
            break;
          case "stamina":
            v1.stamina += v11;
            break;
          case "reset":
            v1.reset = true;
            break;
          case "attackSpeed":
            v1.attackSpeed *= v11;
            break;
          case "noct":
            v1.noct += v11;
            break;
          case "transform":
            v1.transform = v11;
            break;
          case "effectScale":
            v1.effectScale = v11;
            break;
        }
      }
    }
  };
  getAppliedEffects = v12 => {
    let v14 = {
      abnormSpeed: 1,
      passiveSpeed: 1,
      chargeSpeed: 0,
      lockon: 0,
      block: false,
      stamina: 0,
      attackSpeed: 1,
      reset: false,
      dist: 1,
      noct: 1,
      transform: 0,
      effectScale: 1
    };
    const v15 = this.mods.skills.getAppliedEffects(v12),
      v16 = {};
    for (const [v18, v19] of Object.entries(v15)) {
      this._applyEffectToObject(v14, v18, v19, v16);
    }
    const v17 = this.mods.skills.getCategories(v12);
    for (const v20 in this.info.abnormality) {
      const v21 = this.mods.datacenter.getAbnormalityData(v20);
      if (!v21) continue;
      if (!v21.AbnormalityEffect) continue;
      if (!v21.bySkillCategory) continue;
      if (!v21.bySkillCategory.includes(0) && !this.mods.library.arraysItemInArray(v21.bySkillCategory, v17)) continue;
      if (v21.bySkillCategory.length !== 1) continue;
      if (v16[v20]) continue;
      for (const v22 of v21.AbnormalityEffect) {
        switch (v22.type) {
          case 28:
            v14.dist *= +v22.value;
            break;
          case 29:
            v14.chargeSpeed += +v22.value - 1;
            break;
          case 236:
            v14.chargeSpeed += +v22.value - 1;
            break;
        }
      }
    }
    return v14;
  };
  hasAbnormalityWithTypeValue = (v23, v24) => {
    for (const v26 in this.info.abnormality) {
      const v27 = this.mods.datacenter.getAbnormalityData(v26);
      if (!v27) continue;
      for (const v28 of v27.AbnormalityEffect || []) {
        if (v28.type !== v23) continue;
        if (v24 === +v28.value) return true;
      }
    }
    return false;
  };
  hasAbnormalityWithCategoryTypeValue = (v29, v30, v31 = null, v32 = null) => {
    for (const v34 in this.info.abnormality) {
      const v35 = this.mods.datacenter.getAbnormalityData(v34);
      if (!v35) continue;
      const v36 = v35.bySkillCategory.find(v37 => v29.includes(v37));
      if (!v36) continue;
      for (const v38 of v35.AbnormalityEffect || []) {
        if (v38.type !== v30) continue;
        if (v32 === null && v31 === null) return true;
        if (v32 === +v38.method) return true;
        if (v31 === +v38.value) return true;
      }
    }
    return false;
  };
  getActiveAbnormalities = () => {
    let v40 = [];
    for (const v41 in this.info.abnormality) {
      v40.push(+v41);
    }
    return v40;
  };
  getActiveAbnormalitiesWithEffect = () => {
    let v43 = [];
    for (const v44 in this.info.abnormality) {
      v43.push(this.mods.datacenter.getAbnormalityData(v44));
    }
    return v43;
  };
  getActiveAbnormalitiesSorted = () => {
    let v46 = Object.values(this.info.abnormality).sort((v47, v48) => v48.time - v47.time);
    return v46.map(v49 => v49.id);
  };
  getAbnormality = v50 => {
    return this.info.abnormality[v50];
  };
  getServerAbnormality = v52 => {
    return this.info.serverAbnormality[v52];
  };
  getPassivity = v54 => {
    const v56 = {
      ...this.info.buffs,
      ...this.info.glyphs,
      ...this.info.armorRolls,
      ...this.mods.last.skillList.passives
    };
    return v56[v54];
  };
  getSkillPolishing = v57 => {
    return this.info.skillPolishing[v57];
  };
  getTalent = (v59, v60) => {
    if (typeof v59 === "string" && v59.includes("-")) {
      const v62 = v59.split("-");
      v59 = +v62[0];
      v60 = +v62[1];
    }
    return this.info.talents[v59] === v60;
  };
  isCategoryEnabled = v63 => {
    const v65 = this.info.category[v63];
    if (v65 === undefined) return true;
    return v65;
  };
  abnormalityStart = (v66, v67) => {
    const {
      player: v69
    } = this.mods;
    if (!v69.isMe(v66.target)) return;
    this.info.abnormality[v66.id] = {
      id: v66.id,
      stacks: v66.stacks,
      duration: Number(v66.duration),
      status: this.getStatus(),
      time: Date.now(),
      fake: v67
    };
  };
  abnormalityStartServer = (v70, v71) => {
    const {
      player: v73
    } = this.mods;
    if (!v73.isMe(v70.target)) return;
    this.info.serverAbnormality[v70.id] = {
      id: v70.id,
      stacks: v70.stacks,
      duration: Number(v70.duration),
      status: this.getStatus(),
      time: Date.now(),
      fake: v71
    };
  };
  abnormalityEnd = v74 => {
    const {
      player: v76
    } = this.mods;
    if (!v76.isMe(v74.target)) return;
    delete this.info.abnormality[v74.id];
  };
  abnormalityEndServer = v77 => {
    const {
      player: v79
    } = this.mods;
    if (!v79.isMe(v77.target)) return;
    delete this.info.serverAbnormality[v77.id];
  };
  updateArmorRolls = () => {
    const {
      player: v81
    } = this.mods;
    this.info.armorRolls = {};
    for (const v82 of v81.inven.effects) {
      this.info.armorRolls[v82] = true;
    }
  };
  holdAbnormalityAdd = v83 => {
    this.info.buffs[v83.id] = true;
  };
  clearAllHoldedAbnormality = () => {
    this.info.buffs = {};
  };
  crestInfo = v86 => {
    this.info.glyphs = {};
    for (const v88 of v86.crests) {
      this.info.glyphs[v88.id] = !!v88.enable;
    }
  };
  crestApply = v89 => {
    this.info.glyphs[v89.id] = !!v89.enable;
  };
  skillCategory = v91 => {
    this.info.category[v91.category] = v91.enabled;
  };
  loadEpInfo = v93 => {
    this.info.talents = {};
    for (const v95 of v93.perks) {
      this.info.talents[v95.id] = v95.level;
    }
  };
  playerResetEp = v96 => {
    this.info.talents = {};
  };
  learnEpPerk = v98 => {
    if (!v98.success) return;
    this.loadEpInfo(v98);
  };
  rpSkillPolishingList = v100 => {
    this.info.skillPolishing = {};
    for (const v102 of v100.optionEffects) {
      if (!v102.active) continue;
      this.info.skillPolishing[v102.id] = true;
    }
    for (const v103 of v100.levelEffects) {
      this.info.skillPolishing[v103.id] = true;
    }
  };
  creatureLife = v104 => {
    if (!this.mods.utils.isEnabled()) return;
    if (!this.mods.player.isMe(v104.gameId)) return;
    if (v104.alive) return;
    this.info.abnormality = {};
    this.info.serverAbnormality = {};
  };
  getStatus = () => {
    const v107 = {};
    for (const v108 of this.mods.effects.getActiveAbnormalitiesWithEffect()) {
      for (const v109 of v108?.AbnormalityEffect || []) {
        if (v109.type !== 245) continue;
        v107[v109.method] = true;
      }
    }
    return v107;
  };
  reset = () => {
    this.info = {
      abnormality: {},
      serverAbnormality: {},
      glyphs: {},
      buffs: {},
      talents: {},
      skillPolishing: {},
      category: {},
      armorRolls: {}
    };
  };
  loaded = v111 => {
    this.info = v111;
  };
  destructor = () => {
    return this.info;
  };
  constructor(v114, v115) {
    this.mod = v114;
    this.mods = v115;
    this.reset();
    v114.hook("S_LOGIN", "event", hooks.READ_REAL, this.reset);
    v114.hook("S_ITEMLIST", "event", hooks.READ_DESTINATION_ALL_CLASS, this.updateArmorRolls);
    v114.hook(...v115.packet.get_all("S_ABNORMALITY_BEGIN"), hooks.READ_DESTINATION_ALL_CLASS, this.abnormalityStart);
    v114.hook(...v115.packet.get_all("S_ABNORMALITY_REFRESH"), hooks.READ_DESTINATION_ALL_CLASS, this.abnormalityStart);
    v114.hook(...v115.packet.get_all("S_ABNORMALITY_END"), hooks.READ_DESTINATION_ALL_CLASS, this.abnormalityEnd);
    v114.hook(...v115.packet.get_all("S_ABNORMALITY_BEGIN"), hooks.READ_REAL, this.abnormalityStartServer);
    v114.hook(...v115.packet.get_all("S_ABNORMALITY_REFRESH"), hooks.READ_REAL, this.abnormalityStartServer);
    v114.hook(...v115.packet.get_all("S_ABNORMALITY_END"), hooks.READ_REAL, this.abnormalityEndServer);
    v114.hook(...v115.packet.get_all("S_HOLD_ABNORMALITY_ADD"), hooks.READ_DESTINATION_ALL_CLASS, this.holdAbnormalityAdd);
    v114.hook(...v115.packet.get_all("S_CLEAR_ALL_HOLDED_ABNORMALITY"), hooks.READ_DESTINATION_ALL_CLASS, this.clearAllHoldedAbnormality);
    v114.hook(...v115.packet.get_all("S_CREST_INFO"), hooks.READ_DESTINATION_ALL_CLASS, this.crestInfo);
    v114.hook(...v115.packet.get_all("S_CREST_APPLY"), hooks.READ_DESTINATION_ALL_CLASS, this.crestApply);
    v114.hook(...v115.packet.get_all("S_SKILL_CATEGORY"), hooks.READ_DESTINATION_ALL_CLASS, this.skillCategory);
    v114.hook(...v115.packet.get_all("S_LOAD_EP_INFO"), hooks.READ_DESTINATION_ALL_CLASS, this.loadEpInfo);
    const v117 = v115.packet.get_all("TRUE" === "TRUE" ? "TTB_S_LOAD_EP_PAGE" : "S_LOAD_EP_PAGE");
    if (v117[1]) v114.hook(...v117, hooks.READ_DESTINATION_ALL_CLASS, this.loadEpInfo);
    v114.hook(...v115.packet.get_all("S_PLAYER_RESET_EP"), hooks.READ_DESTINATION_ALL_CLASS, this.playerResetEp);
    v114.hook(...v115.packet.get_all("S_LEARN_EP_PERK"), hooks.READ_DESTINATION_ALL_CLASS, this.learnEpPerk);
    v114.hook(...v115.packet.get_all("S_RP_SKILL_POLISHING_LIST"), hooks.READ_DESTINATION_ALL_CLASS, this.rpSkillPolishingList);
    v114.hook(...v115.packet.get_all("S_CREATURE_LIFE"), hooks.READ_DESTINATION_ALL_CLASS, this.creatureLife);
  }
}
module.exports = Effects;
