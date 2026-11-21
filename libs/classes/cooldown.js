const hooks = require("../enums/hooks"),
  EventEmitter = require("events");
class Cooldown extends EventEmitter {
  isOnCooldown = (v1, v2) => {
    const v4 = Date.now();
    if (this.info.skills[v2]?.usedStacks) {
      const {
          time = 0,
          usedStacks = 0,
          nextStackCooldown = 0
        } = this.info.skills[v2],
        v6 = this.mods.skills.getCooldownData(v2),
        v7 = usedStacks - (time + nextStackCooldown > v4 ? 0 : 1);
      return v6.maxStack === v7;
    }
    const {
        time = 0,
        cooldown = 0
      } = this.info.skills[v1] || {},
      v5 = time + cooldown;
    return v5 > v4;
  };
  isOnCooldownBase = v8 => {
    const v10 = Date.now(),
      {
        time = 0,
        cooldown = 0
      } = this.info.skills[v8] || {},
      v11 = time + cooldown;
    return v11 > v10;
  };
  getData = (v12, v13 = false) => {
    return v13 ? this.info.server[v12] : this.info.skills[v12];
  };
  cooltimeSkill = (v15, v16) => {
    const v18 = {
        time: Date.now(),
        cooldown: v15.cooldown,
        usedStacks: v15.usedStacks,
        nextStackCooldown: v15.nextStackCooldown
      },
      v19 = this.mods.utils.getSkillInfo(v15.skill.id);
    this.info.skills[v15.skill.id] = v18;
    this.info.skills[v19.skill] = v18;
    if (!v16) {
      this.info.server[v15.skill.id] = v18;
      this.info.server[v19.skill] = v18;
    }
  };
  crestMessage = (v20, v21) => {
    if (v20.type !== 6) return;
    this.mods.log.debug("CREST-COOLDOWN", "Removed cd from skill:", v20.skill);
    const v23 = {
        time: Date.now(),
        cooldown: 0,
        usedStacks: 0,
        nextStackCooldown: 0
      },
      v24 = this.mods.utils.getSkillInfo(v20.skill);
    this.info.skills[v20.skill] = v23;
    this.info.skills[v24.skill] = v23;
    if (!v21) {
      this.info.server[v20.skill] = v23;
      this.info.server[v24.skill] = v23;
    }
    this.emit("reset", v24.id, v21);
  };
  constructor(v25, v26) {
    super();
    this.mod = v25;
    this.mods = v26;
    this.info = {
      skills: {},
      server: {}
    };
    v25.hook(...v26.packet.get_all("S_DECREASE_COOLTIME_SKILL"), hooks.READ_DESTINATION_ALL_CLASS, this.cooltimeSkill);
    v25.hook(...v26.packet.get_all("S_START_COOLTIME_SKILL"), hooks.READ_DESTINATION_ALL_CLASS, this.cooltimeSkill);
    v25.hook(...v26.packet.get_all("S_CREST_MESSAGE"), hooks.READ_DESTINATION_ALL_CLASS, this.crestMessage);
  }
}
module.exports = Cooldown;
