const classes = require("../enums/classes");
class Hardcoded {
  constructor(v1, v2) {
    this.mod = v1;
    this.mods = v2;
  }
  getAnimationLength = (v4, v5, v6) => {
    const v8 = this.mods.utils.getSkillInfo(v4);
    switch (this.mods.player.job) {
      case classes.GUNNER:
        {
          switch (v8.skill) {
            case 21:
              {
                return 1950;
              }
          }
          break;
        }
    }
  };
  getSkillDelayTime = (v9, {
    byGrant: v10,
    press: v11
  }) => {
    const v13 = this.mods.utils.getSkillInfo(v9);
    switch (this.mods.player.job) {
      case classes.GUNNER:
        {
          if (v13.skill === 9) {
            const v14 = this.mods.utils.getSkillInfo(this.mods.action.stage.skill.id);
            if (v14.skill === 5 && [1, 11, 21].includes(v14.sub) && this.mods.player.stamina >= 230) return 30 + 90;
          }
          break;
        }
    }
    return 0;
  };
  isSupported = v15 => {
    const v17 = this.mods.utils.getSkillInfo(v15);
    switch (this.mods.player.job) {
      case classes.BRAWLER:
        {
          switch (v17.skill) {
            case 17:
              return false;
          }
          break;
        }
      case classes.REAPER:
        {
          switch (v17.skill) {
            case 15:
              return false;
          }
          break;
        }
    }
  };
  getRetryCount = v18 => {
    const v20 = this.mods.utils.getSkillInfo(v18);
    switch (this.mods.player.job) {
      case classes.LANCER:
        {
          if (v20.skill === 2) return 0;
          if (v20.skill === 29) return 0;
          break;
        }
      case classes.BERSERKER:
        {
          if (v20.skill === 36) return 0;
          break;
        }
      case classes.WARRIOR:
        {
          switch (v20.skill) {
            case 29:
            case 37:
              {
                if (this.mods.effects.getAbnormality(100201)) return 0;
                break;
              }
            case 40:
              return 20;
          }
          break;
        }
      case classes.NINJA:
        {
          if (v20.skill === 21 && [50, 51].includes(v20.sub)) return 0;
          if (v20.skill === 9 && v20.sub === 31) return 0;
          break;
        }
      case classes.GUNNER:
        {
          if (v20.skill === 5 && [1, 11, 21].includes(v20.sub)) return 9;
          break;
        }
      case classes.REAPER:
        {
          if (v20.skill === 4 && v20.sub === 61) return 0;
          break;
        }
    }
    if (this.mods.skills.getType(v18) === "notimeline") return 0;
    return -1;
  };
  getRetryDelay = v21 => {
    const v23 = this.mods.utils.getSkillInfo(v21);
    switch (this.mods.player.job) {
      case classes.GUNNER:
        {
          if (v23.skill === 5 && [1, 11, 21].includes(v23.sub) && this.mods.player.stamina >= 230) return 5;
          break;
        }
    }
    return 20;
  };
  getAllowThroughFutureRetry = v24 => {
    const v26 = this.mods.utils.getSkillInfo(v24);
    switch (this.mods.player.job) {
      case classes.GUNNER:
        {
          if (v26.skill === 5 && [1, 11, 21].includes(v26.sub) && this.mods.player.stamina >= 230) return true;
          break;
        }
    }
    return false;
  };
  canCast = v27 => {
    return -1;
  };
}
module.exports = Hardcoded;
