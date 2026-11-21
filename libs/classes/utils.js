class SkillObject {
  constructor(v1) {
    this.id = v1;
  }
  calculateNewId = (v2, v3, v4) => {
    return v2 * 10000 + v3 * 100 + v4;
  };
  set skill(v5) {
    this.id = this.calculateNewId(v5, this.level, this.sub);
  }
  get skill() {
    return Math.floor(this.id / 10000);
  }
  set level(v7) {
    this.id = this.calculateNewId(this.skill, v7, this.sub);
  }
  get level() {
    return Math.floor(this.id / 100) % 100;
  }
  set sub(v9) {
    this.id = this.calculateNewId(this.skill, this.level, v9);
  }
  get sub() {
    return this.id % 100;
  }
}
class Utils {
  canBackstabEntity = v11 => {
    const v13 = this.mods.entity.getEntityData(v11);
    if (!v13) return false;
    if (this.mods.entity.players[v11.toString()]) return true;
    const v14 = this.mods.datacenter.getNpcData(v13.huntingZoneId, v13.templateId);
    return !!(v14 || {}).backstab;
  };
  round = (v15, v16 = 2) => {
    const v18 = Math.pow(10, v16);
    return Math.floor(v15 * v18) / v18;
  };
  isInPvpArea = () => {
    return this.mod.game.me.inBattleground || this.mod.game.me.inCivilUnrest;
  };
  canBackstabInArea = () => {
    if (this.mods.player.zone === 9950) return false;
    if (this.mod.game.me.inBattleground) return false;
    if (this.mod.game.me.inCivilUnrest) return false;
    return true;
  };
  canCastSkill = () => {
    if (this.mod.game.me.mounted) return false;
    return true;
  };
  getBossRadius = v22 => {
    const v24 = this.mods.entity.getEntityData(v22);
    if (!v24) return false;
    if (this.mods.entity.players[v22.toString()]) return 25;
    const v25 = this.mods.datacenter.getNpcData(v24.huntingZoneId, v24.templateId);
    return (v25 || {}).radius || 75;
  };
  isNearBoss = (v26, v27 = 75) => {
    const {
      mobs: v29
    } = this.mods.entity;
    for (let v30 in v29) {
      let v31 = v29[v30];
      if (this.mods.library.positionsIntersect(v31.pos, v26, v27, this.getBossRadius(v30))) return v30;
    }
    return false;
  };
  canLockonEntity = v32 => {
    return true;
    const v34 = this.mods.entity.getEntityData(v32);
    if (!v34) return false;
    const v35 = this.mods.datacenter.getNpcData(v34.huntingZoneId, v34.templateId);
    return !!(v35 || {}).lockon;
  };
  isEnabled = v36 => {
    if (!this.mods.settings.enabled) return false;
    if (this.mods.skills.supportedCount === 0) return false;
    if (v36 === undefined) return true;
    return this.mods.skills.isSupported(v36);
  };
  getSkillInfo = v38 => {
    return new SkillObject(v38);
  };
  sendInstantMove = (v39, v40) => {
    this.mod.send(...this.mods.packet.get_all("S_INSTANT_MOVE"), {
      gameId: this.mods.player.gameId,
      loc: v39 || this.mods.position.loc,
      w: v40 || this.mods.position.w
    });
  };
  getPacketBuffer = (v42 = 0) => {
    return this.mods.ping.ping + this.mods.ping.jitter + 100 + v42;
  };
  sendSystemMessage(v44, v45) {
    this.mod.send(...this.mods.packet.get_all("S_SYSTEM_MESSAGE"), {
      message: this.mod.buildSystemMessage(v44, v45)
    });
  }
  applyDistance = (v47, v48, v49) => {
    const v51 = v47.clone();
    v51.x += Math.cos(v48) * v49;
    v51.y += Math.sin(v48) * v49;
    return v51;
  };
  sleep = v52 => {
    return new Promise(v53 => {
      this.mod.setTimeout(v53, v52);
    });
  };
  mergeTwoObjects = (v55, v56) => {
    const v58 = typeof v55,
      v59 = typeof v56;
    if (v58 !== v59) throw new Error("Cannot add two different types: " + v58 + " " + v59);
    switch (v58) {
      case "bigint":
        return v55 + v56;
      case "number":
        return v55 + v56;
      case "object":
        {
          if (Array.isArray(v55)) return [...v55, ...v56];
          const v60 = {};
          for (const v61 in v55) {
            if (!(v61 in v56)) {
              v60[v61] = v55[v61];
              continue;
            }
            v60[v61] = this.mergeTwoObjects(v55[v61], v56[v61]);
          }
          for (const v62 in v56) {
            if (v62 in v55) continue;
            v60[v62] = v56[v62];
          }
          return v60;
        }
    }
    throw new Error("Unsupported type: " + v58);
  };
  shallowEquals = (v63, v64) => {
    if (!v63 || !v64) return false;
    for (const [v66, v67] of Object.entries(v63)) {
      if (v64[v66] !== v67) return false;
    }
    return true;
  };
  constructor(v68, v69) {
    this.mod = v68;
    this.mods = v69;
  }
}
module.exports = Utils;
