class Datacenter {
  getDisabledCategoriesInZone = v1 => {
    const v3 = this.info.continentChannelType[v1];
    return this.info.skillConfigInfo[v3];
  };
  isKnockDown = v4 => {
    const {
      player: v6
    } = this.mods;
    return this.info.knockdownInfo[v6.job].includes(v4);
  };
  getCcInfo = v7 => {
    return this.info.ccInfo[v7];
  };
  getAbnormalityData = v9 => {
    return this.info.abnormality[v9];
  };
  getPassivityData = v11 => {
    return this.info.passivity[v11];
  };
  getNpcData = (v13, v14) => {
    return this.info.npcData[v13][v14];
  };
  getUserData = v16 => {
    return this.info.userData[v16];
  };
  async __query(v18, ...v19) {
    v19 = [...v19];
    try {
      return await this.mod.queryData(v18, v19, v19.length != 0);
    } catch (v21) {
      console.log("FATAL ERROR in Library. Failed to execute query:", v18);
      throw new Error(v21);
    }
  }
  async __queryM(v22) {
    let v24 = [];
    for (const [v25, ...v26] of v22) {
      v24.push(await this.mod.queryData(v25, v26, true));
    }
    return v24.reduce((v27, v28) => {
      v27.push(...v28);
      return v27;
    }, []);
  }
  async __queryF(v30, v31 = true, v32 = true, v33 = true, v34 = null) {
    let v36;
    try {
      v36 = await this.mod.queryData(v30, [], v32, v33, v34);
    } catch (v38) {
      console.log("FATAL ERROR in Library. Failed to execute query:", v30);
      throw new Error(v38);
    }
    let v37 = {
      attributes: {},
      children: []
    };
    if (v31) for (const v39 of Array.isArray(v36) ? v36 : [v36]) {
      v37.attributes = {
        ...v37.attributes,
        ...v39.attributes
      };
      v37.children.push(...v39.children);
    } else v37 = v36;
    return v37;
  }
  _getUserData = async () => {
    const v41 = await this.__queryF("/UserData/");
    for (const {
      attributes: v42
    } of v41.children) {
      if (v42.race === "popori" && v42.gender === "female") v42.race = "elin";
      v42.name = v42.class;
      v42.class = {
        warrior: "Warrior",
        lancer: "Lancer",
        slayer: "Slayer",
        berserker: "Berserker",
        sorcerer: "Sorcerer",
        archer: "Archer",
        priest: "Priest",
        elementalist: "Mystic",
        soulless: "Reaper",
        engineer: "Gunner",
        fighter: "Brawler",
        assassin: "Ninja",
        glaiver: "Valkyrie"
      }[v42.class];
      this.info.userData[v42.id] = v42;
    }
  };
  _getSkillConfig = async () => {
    const v44 = await this.__queryF("/WorldData/SkillConfig/");
    for (const v45 of v44.children) {
      const v46 = v45.name;
      if (!v46.startsWith("DisableIn")) continue;
      const v47 = v46.replace("DisableIn", "").toLowerCase(),
        v48 = await this.__query("/ContinentData/Continent@channelType=?/", v47);
      for (const {
        attributes: v49
      } of v48) {
        this.info.continentChannelType[v49.id] = v47;
      }
      if (!this.info.skillConfigInfo[v47]) this.info.skillConfigInfo[v47] = [];
      this.info.skillConfigInfo[v47].push(v45.attributes.id);
    }
  };
  _getAbnormalityData = async () => {
    const v51 = await this.__queryM([["/Abnormality/Abnormal@id>=?", 100000], ["/Abnormality/Abnormal@id<?", 100000]]);
    for (const {
      attributes: v52,
      children: v53
    } of v51) {
      let v54 = v52;
      for (const {
        name: v56,
        attributes: v57
      } of v53) {
        if (!v54[v56]) v54[v56] = [];
        v54[v56].push(v57);
      }
      const v55 = (v54.bySkillCategory || "").split(",");
      v54.bySkillCategory = [];
      for (const v58 of v55) {
        if (v58 !== "") v54.bySkillCategory.push(+v58);
      }
      this.info.abnormality[v54.id] = v54;
    }
  };
  _getAbnormalityEffects = () => {
    const v60 = [10152220, 10152221, 905649],
      v61 = {
        211: "stunned"
      };
    for (const v62 in Object.values(this.info.abnormality)) {
      for (const v63 of v62.AbnormalityEffect || []) {
        switch (v63.type) {
          case 211:
            {
              if (v60.includes(v62.id)) break;
              this.info.ccInfo[v62.id] = {
                dur: +v62.time,
                categories: v62.bySkillCategory,
                type: v61[v63.type]
              };
              break;
            }
        }
      }
    }
  };
  _getPassivityData = async () => {
    const v65 = await this.__queryM([["/Passivity/Passive@id>=?", 100000], ["/Passivity/Passive@id<?", 100000]]);
    for (const {
      attributes: v66,
      children: v67
    } of v65) {
      let v68 = v66;
      for (const {
        name: v70,
        attributes: v71
      } of v67) {
        if (!v68[v70]) v68[v70] = [];
        v68[v70].push(v71);
      }
      const v69 = (v68.conditionCategory || "").split(",");
      v68.conditionCategory = [];
      for (const v72 of v69) {
        if (v72 !== "") v68.conditionCategory.push(+v72);
      }
      this.info.passivity[v68.id] = v68;
    }
  };
  _getNpcData = async () => {
    const v74 = await this.__queryM([["/NpcData@huntingZoneId>=?", 780], ["/NpcData@huntingZoneId<?", 780]]);
    for (const {
      attributes: {
        huntingZoneId: v76
      },
      children: v75
    } of v74) {
      for (const {
        attributes: v77
      } of v75) {
        const v78 = !v77.cannotPassThrough,
          v79 = !!!(v77.isObjectNpc || v77.villager || v77.isServant),
          v80 = v77.resourceSize || 100,
          v81 = v77.scale || 1,
          v82 = v77.size,
          v83 = v82 == "medium" ? 0.25 : v82 == "small" ? 0.125 : 1,
          v84 = Math.max(75, v80 / v81 * v83);
        if (!this.info.npcData[v76]) this.info.npcData[v76] = {};
        this.info.npcData[v76][v77.id] = {
          backstab: v78,
          lockon: v79,
          radius: v84
        };
      }
    }
  };
  _getKnockdownData = async () => {
    const v86 = new Set();
    for (const v89 of Object.values(this.info.userData)) {
      v86.add(v89.name.toLowerCase());
    }
    const v87 = "/SkillHotKeyData/HotKey@class=?",
      v88 = await this.__queryM([...v86].map(v90 => [v87, v90]));
    for (const {
      attributes: v91,
      children: v92
    } of v88) {
      const v93 = v91.class.toLowerCase(),
        v94 = v92.filter(v95 => v95.name == "Reaction").map(v96 => +v96.attributes.id);
      for (const [v97, v98] of Object.entries(this.info.userData)) {
        if (v93 !== v98.name.toLowerCase()) continue;
        this.info.knockdownInfo[(+v97 - 10101) % 100] = v94;
      }
    }
  };
  __loadData = async () => {
    await this._getUserData().then(this._getSkillConfig).then(this._getAbnormalityData).then(this._getAbnormalityEffects).then(this._getNpcData).then(this._getKnockdownData);
    if ("TRUE" !== "TRUE") await this._getPassivityData();
  };
  constructor(v100, v101) {
    const v103 = !v101;
    this.mod = v100;
    this.mods = v101;
    this.info = {
      userData: {},
      continentChannelType: {},
      skillConfigInfo: {},
      abnormality: {},
      passivity: {},
      ccInfo: {},
      npcData: {},
      knockdownInfo: {},
      loaded: false
    };
    if (v103) v100.clientInterface.once("ready", () => {
      this.__loadData().then(() => {
        console.log("ping-remover has loaded data");
        this.info.loaded = true;
      }).catch(v106 => {
        console.log(v106);
        this.info.loaded = true;
      });
    });else if (v101.utils) this.__loadData().then(() => console.log("ping-remover has loaded data")).catch(console.log);else (async () => {
      while (!v100.clientMod.info.loaded) await new Promise(v109 => setTimeout(v109, 50));
      this.info = v100.clientMod.info;
    })();
  }
}
module.exports = Datacenter;
