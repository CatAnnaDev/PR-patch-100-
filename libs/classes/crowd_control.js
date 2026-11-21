class CrowdControl {
  canCastSkill = v1 => {
    const v3 = this.mods.effects.getActiveAbnormalitiesWithEffect(),
      v4 = this.mods.skills.getTypeId(v1) === 27;
    for (const v6 of v3) {
      if (this.ignoredCCs.includes(v6?.id)) continue;
      for (const v7 of v6?.AbnormalityEffect || []) {
        switch (v7.type) {
          case 211:
            {
              const {
                status: v8
              } = this.mods.effects.getAbnormality(v6.id);
              if (v8[16]) break;
              return -1211;
            }
          case 232:
            return -1232;
          case 274:
            {
              if (v4) break;
              return -1274;
            }
        }
      }
    }
    if (this.info.feared) return -21;
    const v5 = this.mods.action.inAction && this.mods.datacenter.isKnockDown(this.mods.action.stage.skill.id);
    if (this.mods.action.inSpecialAction) {
      if (this.mods.action.stage.push) return -23;
      if (this.mods.action.stage.animSeq.length && !v5) {
        if (v4) this.mods.log.debug("CC - canCastSkill", this.mods.action.inAction + " - " + this.mods.action.stage.skill.id + " - " + v5 + " - " + this.mods.datacenter.isKnockDown(this.mods.action.stage.skill.id) + " - " + this.mods.action.inSpecialAction + " - " + this.mods.action.serverInAction);
        return -24;
      }
    }
    if (v5 && !v4) return -22;
    return 0;
  };
  fearmoveStage = v9 => {
    if (!this.mods.player.isMe(v9.gameId)) return;
    this.info.feared = true;
  };
  fearmoveEnd = v11 => {
    if (!this.mods.player.isMe(v11.gameId)) return;
    this.info.feared = false;
  };
  loaded = v13 => {
    this.info = {
      ...this.info,
      ...v13
    };
  };
  destructor = () => {
    return this.info;
  };
  constructor(v16, v17) {
    this.mod = v16;
    this.mods = v17;
    this.ignoredCCs = [10152220, 10152221, 905649];
    this.info = {
      feared: false
    };
  }
}
module.exports = CrowdControl;
