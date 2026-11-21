const hooks = require("../enums/hooks");
class Last {
  get instantMove() {
    return this.info.instantMove;
  }
  get skillList() {
    return this.info.skillList;
  }
  get startSkill() {
    return this.info.latest;
  }
  get packets() {
    return this.info.packet;
  }
  get playerLocation() {
    return this.info.cPlayerLocation;
  }
  get block() {
    return this.info.defendSuccess;
  }
  packet = v7 => {
    return this.packets[v7];
  };
  packetForSkill = v9 => {
    return this.info.skill[v9];
  };
  cachePacket = v11 => {
    return v12 => {
      v12._time = Date.now();
      v12._name = v11;
      this.info.packet[v11] = v12;
      this.info.latest = v12;
      this.info.skill[v12.skill.id] = v12;
    };
  };
  sInstantMove = v14 => {
    if (!this.mods.player.isMe(v14.gameId)) return;
    v14._time = Date.now();
    this.info.instantMove = v14;
  };
  cPlayerLocation = v16 => {
    v16._time = Date.now();
    this.info.cPlayerLocation = v16;
  };
  sDefendSuccess = v18 => {
    if (!this.mods.player.isMe(v18.gameId)) return;
    v18._time = Date.now();
    this.info.defendSuccess = v18;
  };
  sSkillList = v20 => {
    this.info.skillList = {
      skills: {},
      passives: {}
    };
    for (const {
      id: v22,
      active: v23
    } of v20.skills) {
      if (!v23) {
        this.info.skillList.passives[Number(v22)] = true;
        continue;
      }
      this.info.skillList.skills[Number(v22)] = true;
      const v24 = this.mods.utils.getSkillInfo(Number(v22)),
        v25 = v24.skill + "-" + v24.sub;
      if (!this.info.skillList.skills[v25]) this.info.skillList.skills[v25] = [];
      this.info.skillList.skills[v25].push(v24.level);
    }
  };
  constructor(v26, v27) {
    this.info = {
      packet: {
        _time: 0
      },
      latest: {
        _time: 0
      },
      skill: {
        _time: 0
      },
      instantMove: {
        _time: 0
      },
      cPlayerLocation: {
        _time: 0
      },
      defendSuccess: {
        _time: 0
      },
      skillList: {
        skills: {},
        passives: {}
      }
    };
    this.mod = v26;
    this.mods = v27;
    v26.hook(...v27.packet.get_all("S_INSTANT_MOVE"), hooks.READ_DESTINATION_ALL_CLASS, this.sInstantMove);
    v26.hook(...v27.packet.get_all("S_SKILL_LIST"), hooks.READ_DESTINATION_ALL_CLASS, this.sSkillList);
    v26.hook(...v27.packet.get_all("S_DEFEND_SUCCESS"), hooks.READ_DESTINATION_ALL_CLASS, this.sDefendSuccess);
    v26.hook(...v27.packet.get_all("C_PLAYER_LOCATION"), hooks.READ_ALL, this.cPlayerLocation);
    v26.hook(...v27.packet.get_all("C_START_SKILL"), hooks.READ_ALL, this.cachePacket("C_START_SKILL"));
    v26.hook(...v27.packet.get_all("C_START_TARGETED_SKILL"), hooks.READ_ALL, this.cachePacket("C_START_TARGETED_SKILL"));
    v26.hook(...v27.packet.get_all("C_START_COMBO_INSTANT_SKILL"), hooks.READ_ALL, this.cachePacket("C_START_COMBO_INSTANT_SKILL"));
    v26.hook(...v27.packet.get_all("C_START_INSTANCE_SKILL"), hooks.READ_ALL, this.cachePacket("C_START_INSTANCE_SKILL"));
    v26.hook(...v27.packet.get_all("C_START_INSTANCE_SKILL_EX"), hooks.READ_ALL, this.cachePacket("C_START_INSTANCE_SKILL_EX"));
    v26.hook(...v27.packet.get_all("C_PRESS_SKILL"), hooks.READ_ALL, this.cachePacket("C_PRESS_SKILL"));
    v26.hook(...v27.packet.get_all("C_NOTIMELINE_SKILL"), hooks.READ_ALL, this.cachePacket("C_NOTIMELINE_SKILL"));
  }
}
module.exports = Last;
