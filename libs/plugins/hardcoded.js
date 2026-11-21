const classes = require("../enums/classes");
module.exports = function (v1, v2) {
  const v4 = () => {
    switch (v2.player.job) {
      case classes.MYSTIC:
        {
          if (v1.isMenma) {
            const v6 = v2.skills._getInfo(480100);
            v6.fixedSpeed = false;
          }
          break;
        }
      case classes.WARRIOR:
        {
          const v7 = v2.skills._getInfo(200200),
            v8 = v7.targeting[0];
          if (!v7.abnormalityConsume.stage) v7.abnormalityConsume.stage = [];
          v7.abnormalityConsume.stage = v7.abnormalityConsume.stage.filter(v9 => v9.id !== 103120);
          v7.abnormalityConsume.stage.push({
            id: 103120,
            delay: v8,
            fixed: false
          });
          v7.abnormalityApply = v7.abnormalityApply.filter(v10 => v10.id !== 103104);
          v7.abnormalityApply.push({
            id: 103104,
            delay: v8,
            fixed: false
          });
          break;
        }
      case classes.SORCERER:
        {
          if (v1.isMenma) for (const v12 of [61000, 41212, 41211, 41210]) {
            const v13 = v2.skills._getInfo(v12);
            v13.abnormalityRedirect = v13.abnormalityRedirect.slice(1);
          }
          for (const v14 of [360100, 360200, 360300, 360400]) {
            const v15 = v2.skills._getInfo(v14);
            if (!v15?.abnormalityConsume?.stage) continue;
            v15.abnormalityConsume.stage = v15.abnormalityConsume.stage.filter(v16 => v16.id !== 502050);
          }
          const v11 = [502020, 502030, 502040, 502050];
          for (const v17 in v2.skills.info.skillData) {
            const v18 = v2.utils.getSkillInfo(+v17);
            if (v18.skill === 4) {
              const v19 = v2.skills._getInfo(v18.id);
              if (v19.abnormalityConsume?.stage) v19.abnormalityConsume.stage = v19.abnormalityConsume.stage.filter(v20 => !v11.includes(v20.id));
            }
          }
          break;
        }
      case classes.REAPER:
        {
          for (const v21 in v2.skills.info.skillData) {
            const v22 = v2.utils.getSkillInfo(+v21);
            if ([1, 3, 4, 9].includes(v22.skill)) {
              const v23 = v2.skills._getInfo(v22.id);
              v23.holdIfNotMoving = true;
            }
          }
          break;
        }
      case classes.SLAYER:
        {
          for (const v24 of [270100, 270130, 270131, 270140, 270141, 270142]) {
            const v25 = v2.skills._getInfo(v24);
            if (!v25) continue;
            if (!v25?.abnormalityConsume) v25.abnormalityConsume = {};
            if (!v25?.abnormalityConsume?.end) v25.abnormalityConsume.end = [];
            v25.abnormalityConsume.end.push({
              id: 301604,
              delay: 990,
              fixed: true,
              noTimer: true
            });
          }
          {
            const v26 = v2.skills._getInfo(121101);
            v26.chains["27"].push(42);
          }
          break;
        }
      case classes.VALKYRIE:
        {
          for (const v27 in v2.skills.info.skillData) {
            const v28 = v2.utils.getSkillInfo(+v27);
            switch (v28.skill) {
              case 11:
                {
                  if (![0, 30].includes(v28.sub)) break;
                  const v29 = v2.skills._getInfo(v28.id);
                  if (!v29.abnormalityApply) v29.abnormalityApply = [];
                  v29.abnormalityApply.push({
                    id: 10155052,
                    delay: 430,
                    fixed: false,
                    duration: 5000
                  });
                  break;
                }
              case 10:
              case 12:
                {
                  const v30 = v2.skills._getInfo(v28.id);
                  if (!v30.chains) break;
                  if (v30.chains[v28.skill]) delete v30.chains[v28.skill];
                  break;
                }
            }
          }
          break;
        }
      case classes.LANCER:
        {
          for (const v31 in v2.skills.info.skillData) {
            const v32 = v2.utils.getSkillInfo(+v31);
            switch (v32.skill) {
              case 2:
                {
                  const v33 = v2.skills._getInfo(v32.id);
                  if (v33.chains?.["10"]) delete v33.chains["10"];
                  break;
                }
              case 13:
                {
                  const v34 = v2.skills._getInfo(v32.id);
                  if (v34.chains["28"]) delete v34.chains["28"];
                  break;
                }
            }
          }
          break;
        }
      case classes.ARCHER:
        {
          for (const v35 in v2.skills.info.skillData) {
            const v36 = v2.utils.getSkillInfo(+v35);
            switch (v36.skill) {
              case 9:
              case 10:
              case 11:
              case 15:
              case 23:
              case 25:
                {
                  const v37 = v2.skills._getInfo(v36.id);
                  if (!v37.abnormalityConsume) v37.abnormalityConsume = {};
                  if (!v37.abnormalityConsume.end) v37.abnormalityConsume.end = [];
                  for (let v38 = 88614201; v38 <= 88614215; v38++) {
                    v37.abnormalityConsume.end.push({
                      id: v38,
                      delay: 0,
                      fixed: true
                    });
                  }
                  break;
                }
            }
          }
          break;
        }
      case classes.BERSERKER:
        {
          for (const v39 in v2.skills.info.skillData) {
            const v40 = v2.utils.getSkillInfo(+v39);
            switch (v40.skill) {
              case 24:
                {
                  if (v40.sub === 0) {
                    const v41 = v2.skills._getInfo(v40.id);
                    if (v41.chains["15"]) delete v41.chains["15"];
                  }
                  break;
                }
            }
          }
          break;
        }
      case classes.PRIEST:
        {
          for (const v42 in v2.skills.info.skillData) {
            const v43 = v2.utils.getSkillInfo(+v42);
            switch (v43.skill) {
              case 28:
                {
                  const v44 = v2.skills._getInfo(v43.id);
                  if (v1.isMenma && v44?.appliedEffects?.passivity?.[28039]?.effectScale) v44.appliedEffects.passivity[28039].effectScale = 2;
                  break;
                }
            }
          }
          break;
        }
      case classes.NINJA:
        {
          for (const v45 in v2.skills.info.skillData) {
            const v46 = v2.utils.getSkillInfo(+v45);
            switch (v46.skill) {
              case 8:
                {
                  const v47 = v2.skills._getInfo(v46.id);
                  if (!v47.chains["1"]) v47.chains["1"] = [];
                  if (!v47.chains["1"].includes(30)) v47.chains["1"].push(30);
                  if (!v47.chains["1"].includes(70)) v47.chains["1"].push(70);
                  break;
                }
              case 12:
                {
                  const v48 = v2.skills._getInfo(v46.id);
                  if (!v48.chains["8"]) v48.chains["8"] = [];
                  if (!v48.chains["8"].includes(30)) v48.chains["8"].push(30);
                  if (!v48.chains["8"].includes(52)) v48.chains["8"].push(52);
                  if (!v48.chains["9"]) v48.chains["9"] = [];
                  if (!v48.chains["9"].includes(31)) v48.chains["9"].push(31);
                  break;
                }
              case 13:
                {
                  const v49 = v2.skills._getInfo(v46.id);
                  if (!v49.chains["9"]) v49.chains["9"] = [];
                  if (!v49.chains["9"].includes(31)) v49.chains["9"].push(31);
                  break;
                }
              case 22:
                {
                  const v50 = v2.skills._getInfo(v46.id);
                  if (v50.chains["22"]) delete v50.chains["22"];
                  break;
                }
            }
          }
          break;
        }
    }
  };
  v2.skills.on("loaded", v4);
  this.loaded = v4;
  this.destructor = () => {
    v2.skills.off("loaded", v4);
  };
};
