const fetch = require("node-fetch");
class LoggerManager {
  constructor(v1, v2) {
    return;
    this.mod = v1;
    this.mods = v2;
    this.loggedData = null;
    this.setup();
  }
  setup = () => {
    const {
        mod: v5,
        mods: v6
      } = this,
      v7 = v9 => {
        v9.skill = v9.skill.id;
      },
      v8 = [{
        packet: "S_PLAYER_STAT_UPDATE",
        keep: ["attackSpeed", "attackSpeedBonus"],
        cache: true
      }, {
        packet: "S_ABNORMALITY_BEGIN",
        gameId: "target",
        delete: ["target", "source", "unk3", "hitCylinderId"]
      }, {
        packet: "S_ABNORMALITY_REFRESH",
        gameId: "target",
        delete: ["target"]
      }, {
        packet: "S_ABNORMALITY_END",
        gameId: "target",
        delete: ["target"]
      }, {
        packet: "S_ACTION_STAGE",
        gameId: "gameId",
        delete: ["gameId", "target", "templateId"],
        convert: v7
      }, {
        packet: "S_ACTION_END",
        gameId: "gameId",
        delete: ["gameId", "templateId"],
        convert: v7
      }, {
        packet: "S_START_USER_PROJECTILE",
        gameId: "gameId",
        delete: ["gameId", "unk1", "templateId", "id"],
        convert: v7
      }, {
        packet: "S_SPAWN_PROJECTILE",
        gameId: "gameId",
        delete: ["gameId", "templateId", "id", "unk1", "unk2", "unk3"],
        convert: v7
      }, {
        packet: "S_CONNECT_SKILL_ARROW",
        convert: v7
      }, {
        packet: "S_HOLD_ABNORMALITY_ADD"
      }, {
        packet: "S_CLEAR_ALL_HOLDED_ABNORMALITY"
      }, {
        packet: "S_CREST_INFO",
        keep: ["crests"]
      }, {
        packet: "S_CREST_APPLY"
      }, {
        packet: "S_LOAD_EP_INFO",
        keep: ["perks"]
      }, {
        packet: "TRUE" === "TRUE" ? "TTB_S_LOAD_EP_PAGE" : "S_LOAD_EP_PAGE",
        keep: ["perks"]
      }, {
        packet: "S_PLAYER_RESET_EP"
      }, {
        packet: "S_LEARN_EP_PERK",
        delete: ["usedPoints"]
      }, {
        packet: "S_RP_SKILL_POLISHING_LIST"
      }, {
        packet: "S_START_COOLTIME_SKILL",
        convert: v7
      }, {
        packet: "S_DECREASE_COOLTIME_SKILL",
        convert: v7
      }];
    v8.forEach(this.createHook);
    v5.hook("S_LOGIN", "event", this.loaded);
  };
  deepEquals = (v11, v12) => {
    if (!v11 || !v12) return false;
    for (const [v14, v15] of Object.entries(v11)) {
      if (v12[v14] !== v15) return false;
    }
    return true;
  };
  createHook = v16 => {
    const {
        mod: v18,
        mods: v19
      } = this,
      {
        library: {
          player: v20
        }
      } = v18.require;
    let v21 = null;
    const v22 = v19.packet.get_all(v16.packet);
    if (v22[1]) v18.hook(...v22, {
      order: -Infinity,
      filter: {
        fake: false,
        modified: false,
        silenced: null
      }
    }, v23 => {
      if (v16.gameId && !v20.isMe(v23[v16.gameId])) return;
      if (v16.convert) v16.convert(v23);
      for (const v25 of v16.delete || []) {
        delete v23[v25];
      }
      if (v16.keep) for (const v26 of Object.keys(v23)) {
        if (v16.keep.includes(v26)) continue;
        delete v23[v26];
      }
      if (v16.cache) {
        if (this.deepEquals(v23, v21)) return;
        v21 = v23;
      }
      v23._name = v16.packet;
      v23._time = Date.now();
      this.loggedData.data.push(v23);
    });
  };
  setupLoggedData = () => {
    const {
      player: v28
    } = this.mod.require.library;
    this.loggedData = {
      protocol: this.mod.dispatch.protocolVersion,
      patch: this.mod.majorPatchVersion,
      model: v28.templateId,
      version: LOGGER_VERSION,
      start: Date.now(),
      end: Date.now(),
      data: []
    };
  };
  finishSession = () => {
    return;
    if ("TRUE" !== "TRUE") return;
    if (!this.loggedData || !this?.loggedData?.data?.length) return;
    const {
      library: v30
    } = this.mod.require.library;
    this.loggedData.end = Date.now();
    const v31 = v30.jsonStringify(this.loggedData);
    this.loggedData = null;
    fetch("https://www.tera.azur-cosplay.com/logs", {
      method: "POST",
      body: v31,
      headers: {
        "Content-Type": "application/json"
      }
    }).catch(() => {});
  };
  loaded = () => {
    this.finishSession();
    this.setupLoggedData();
  };
  destructor() {
    this.finishSession();
  }
}
const LOGGER_VERSION = 13;
module.exports = LoggerManager;
