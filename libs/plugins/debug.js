const hooks = require("../enums/hooks");
module.exports = function (v1, v2) {
  const v4 = [{
      name: "S_ACTION_STAGE",
      fields: ["skill", "stage", "speed", "projectileSpeed", "effectScale", "w", "loc", "dest", "animSeq"],
      gameId: "gameId",
      fieldSelector: {
        skill: "id"
      },
      fieldRename: {
        projectileSpeed: "ps",
        effectScale: "es"
      }
    }, {
      name: "S_ACTION_END",
      fields: ["skill", "type", "loc"],
      gameId: "gameId",
      fieldSelector: {
        skill: "id"
      }
    }, {
      name: "S_START_COOLTIME_SKILL",
      fields: ["skill", "cooldown", "usedStacks", "nextStackCooldown"],
      fieldSelector: {
        skill: "id"
      }
    }, {
      name: "S_DECREASE_COOLTIME_SKILL",
      fields: ["skill", "cooldown", "usedStacks", "nextStackCooldown"],
      fieldSelector: {
        skill: "id"
      }
    }, {
      name: "S_ABNORMALITY_BEGIN",
      fields: ["id", "stacks", "duration"],
      gameId: "target"
    }, {
      name: "S_ABNORMALITY_REFRESH",
      fields: ["id", "stacks", "duration"],
      gameId: "target"
    }, {
      name: "S_ABNORMALITY_END",
      fields: ["id"],
      gameId: "target"
    }, {
      name: "C_START_COMBO_INSTANT_SKILL",
      fields: ["skill", "w", "loc", "targets", "endpoints"],
      fieldSelector: {
        skill: "id"
      }
    }, {
      name: "C_START_INSTANCE_SKILL",
      fields: ["skill", "continue", "w", "loc", "targets", "endpoints", "unkn1", "unkn2"],
      fieldSelector: {
        skill: "id"
      }
    }, {
      name: "C_START_INSTANCE_SKILL_EX",
      fields: ["skill", "projectile", "unk", "w", "loc", "dest"],
      fieldSelector: {
        skill: "id"
      }
    }, {
      name: "C_START_SKILL",
      fields: ["skill", "continue", "moving", "unk", "unk2", "w", "loc", "dest"],
      fieldSelector: {
        skill: "id"
      },
      fieldRename: {
        unk2: "isPerfectCombo",
        unk: "destPosOnAir",
        continue: "byGrant"
      }
    }, {
      name: "C_START_TARGETED_SKILL",
      fields: ["skill", "w", "loc", "dest", "targets"],
      fieldSelector: {
        skill: "id"
      }
    }, {
      name: "C_PRESS_SKILL",
      fields: ["skill", "press", "w", "loc", "unkn1", "unkn2", "unkn3"],
      fieldSelector: {
        skill: "id"
      }
    }, {
      name: "C_NOTIMELINE_SKILL",
      fields: ["skill"],
      fieldSelector: {
        skill: "id"
      }
    }, {
      name: "C_CANCEL_SKILL",
      fields: ["skill", "type"],
      fieldSelector: {
        skill: "id"
      }
    }, {
      name: "S_SKILL_CATEGORY",
      fields: ["category", "enabled"]
    }, {
      name: "S_GRANT_SKILL",
      fields: ["skill"],
      fieldSelector: {
        skill: "id"
      }
    }, {
      name: "S_INSTANT_DASH",
      fields: ["target", "unk", "w", "loc"],
      gameId: "gameId"
    }, {
      name: "S_CONNECT_SKILL_ARROW",
      fields: ["skill", "unk1", "unk2"],
      fieldSelector: {
        skill: "id"
      }
    }, {
      name: "S_CANNOT_START_SKILL",
      fields: ["skill"],
      fieldSelector: {
        skill: "id"
      }
    }, {
      name: "C_PLAYER_LOCATION",
      fields: ["type", "w", "loc"]
    }, {
      name: "C_NOTIFY_LOCATION_IN_ACTION",
      fields: ["skill", "stage", "w", "loc"],
      fieldSelector: {
        skill: "id"
      }
    }, {
      name: "S_INSTANT_MOVE",
      fields: ["w", "loc"],
      gameId: "gameId"
    }, {
      name: "S_INSTANCE_ARROW",
      fields: ["skill", "actionId", "targets", "endpoints"],
      gameId: "gameId",
      fieldSelector: {
        skill: "id"
      }
    }, {
      name: "S_EACH_SKILL_RESULT",
      fields: ["push", "air", "airChain", "skill", "stage", "w", "loc", "animSeq"],
      gameId: "target",
      overrideEvent: "reaction",
      requiresValue: {
        enable: true
      },
      fieldSelector: {
        skill: "id"
      }
    }, {
      name: "S_PLAYER_STAT_UPDATE",
      fields: ["attackSpeed", "attackSpeedBonus", "fireEdge", "iceEdge", "lightningEdge"],
      cache: true
    }, {
      name: "S_DEFEND_SUCCESS",
      fields: ["skill", "perfect", "unk4"],
      fieldSelector: {
        skill: "id"
      },
      gameId: "gameId"
    }, {
      name: "C_CAN_LOCKON_TARGET",
      fields: ["skill", "unk", "target"],
      fieldSelector: {
        skill: "id"
      }
    }, {
      name: "S_CAN_LOCKON_TARGET",
      fields: ["skill", "success", "unk", "target"],
      fieldSelector: {
        skill: "id"
      }
    }, {
      name: "S_CREATURE_LIFE",
      fields: ["alive", "inShuttle", "loc"],
      gameId: "gameId"
    }, {
      name: "C_HIT_USER_PROJECTILE",
      fields: ["id", "end", "loc"]
    }, {
      name: "S_START_USER_PROJECTILE",
      fields: ["skill", "id", "loc", "dest", "curve", "distance", "speed", "projectileSpeed"],
      gameId: "gameId",
      fieldSelector: {
        skill: "id"
      }
    }],
    v5 = v7 => {
      if (v7.x !== undefined && v7.y !== undefined && v7.z !== undefined) {
        v7.x = Math.round(v7.x);
        v7.y = Math.round(v7.y);
        v7.z = Math.round(v7.z);
        return v7.x + ":" + v7.y + ":" + v7.z;
      }
      for (let v9 in v7) {
        const v10 = v7[v9];
        switch (typeof v10) {
          case "number":
            v7[v9] = +v10.toFixed(3);
            break;
          case "object":
            {
              const v11 = v5(v10);
              if (typeof v11 === "string") v7[v9] = v11;else v7[v9] = v2.library.jsonStringify(v11);
              break;
            }
          case "boolean":
            v7[v9] = +v10;
            break;
          case "bigint":
            break;
          case "string":
            break;
          case "undefined":
            return null;
          default:
            {
              throw new Error("Unsupported type " + v10);
              break;
            }
        }
      }
      return v7;
    },
    v6 = ({
      name: v12,
      fields: v13,
      gameId = null,
      overrideEvent = null,
      fieldSelector = {},
      fieldRename = {},
      requiresValue = {},
      cache: v14
    }) => {
      let v16 = null;
      v1.hook(...v2.packet.get_all(v12), hooks.READ_ALL, (v17, v18) => {
        if (gameId && !v2.player.isMe(v17[gameId])) return;
        if (overrideEvent) v17 = v17[overrideEvent];
        for (const v23 in requiresValue) {
          if (requiresValue[v23] !== v17[v23]) return;
        }
        let v20 = [];
        for (const v24 of v13) {
          let v25 = v17[v24];
          if (fieldSelector[v24]) v25 = v25[fieldSelector[v24]];
          v20.push(v25);
        }
        v5(v20);
        const v21 = v18 ? "F" : "R",
          v22 = v12[0] === "C" ? v21 + "->" : "<-" + v21;
        v20 = v22 + " " + v20.map((v26, v27) => (fieldRename[v13[v27]] || v13[v27]) + ":" + v26).join(" ");
        if (v14 && v16 === v20) return;
        v16 = v20;
        v2.log.debug(v12, v20);
      });
    };
  v4.map(v6);
};
