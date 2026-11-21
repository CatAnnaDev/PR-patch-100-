const fs = require("fs"),
  nodePath = require("path");
const PING_HISTORY_MAX = 30;
module.exports = function (mod, lib) {
  const dataFile = nodePath.join(__dirname, "../../boss_data.json");
  let data = {};
  try {
    data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  } catch (e) {
    data = {};
  }
  const cfg = () => lib.settings.info.boss || {};
  const normalize = () => {
    const trust = cfg().trustSamples ?? 3;
    for (const zoneId in data) {
      const templates = data[zoneId];
      for (const templateId in templates) {
        const skills = templates[templateId];
        for (const skillId in skills) {
          if (typeof skills[skillId] === "number") skills[skillId] = {
            d: skills[skillId],
            n: trust
          };
        }
      }
    }
  };
  normalize();
  let zone = null,
    writing = false,
    dirty = false;
  const current = {};
  const pingHistory = [];
  const pingMin = () => {
    const n = pingHistory.length;
    if (!n) return lib.ping.ping || 0;
    let m = pingHistory[0];
    for (let i = 1; i < n; i++) if (pingHistory[i] < m) m = pingHistory[i];
    return m;
  };
  const sampler = mod.setInterval(() => {
    const p = lib.ping.ping || 0;
    if (!p) return;
    pingHistory.push(p);
    if (pingHistory.length > PING_HISTORY_MAX) pingHistory.shift();
  }, 1000);
  const entryOf = (zoneId, templateId, skillId) => {
    const z = data[zoneId];
    if (!z) return undefined;
    const t = z[templateId];
    if (!t) return undefined;
    return t[skillId];
  };
  const learn = (zoneId, templateId, skillId, time) => {
    const c = cfg();
    const z = data[zoneId] || (data[zoneId] = {});
    const t = z[templateId] || (z[templateId] = {});
    const entry = t[skillId];
    if (!entry) {
      t[skillId] = {
        d: Math.round(time),
        n: 1
      };
      dirty = true;
      return;
    }
    const deviation = Math.abs(time - entry.d) / Math.max(entry.d, 1);
    if (entry.n >= (c.trustSamples ?? 3) && deviation > (c.outlierFrac ?? 0.35)) return;
    const alpha = Math.max(c.minAlpha ?? 0.15, 1 / (entry.n + 1));
    entry.d = Math.round(entry.d * (1 - alpha) + time * alpha);
    entry.n++;
    dirty = true;
  };
  const flush = () => {
    if (!dirty || writing) return;
    writing = true;
    dirty = false;
    fs.writeFile(dataFile, JSON.stringify(data), () => {
      writing = false;
    });
  };
  const flusher = mod.setInterval(flush, 15000);
  const hook = (name, options, callback) => {
    try {
      if (options) mod.hook(...lib.packet.get_all(name), options, callback);else mod.hook(...lib.packet.get_all(name), callback);
    } catch (e) {}
  };
  hook("S_LOAD_TOPO", null, event => {
    if (zone !== null && zone !== event.zone) flush();
    zone = event.zone;
    for (const id in current) delete current[id];
  });
  hook("S_CREATURE_ROTATE", null, event => {
    if (!cfg().enabled) return;
    event.time = Math.max(event.time - pingMin(), 0);
    return true;
  });
  hook("S_ACTION_STAGE", {
    order: 2000
  }, event => {
    if (!cfg().enabled || !event.skill || !event.skill.npc) return;
    const zoneId = event.skill.huntingZoneId,
      templateId = event.templateId,
      skillId = event.skill.id;
    if (current[event.id] && event.stage > current[event.id].stage) {
      current[event.id] = {
        time: current[event.id].time,
        speed: event.speed,
        stage: event.stage
      };
    } else {
      current[event.id] = {
        time: Date.now(),
        speed: event.speed,
        stage: event.stage
      };
    }
    const entry = entryOf(zoneId, templateId, skillId);
    const c = cfg();
    if (entry && entry.n >= (c.trustSamples ?? 3) && pingHistory.length > 0) {
      const floor = 1000 / Math.max(1, c.minCombatFPS ?? 60);
      event.speed = event.speed * (entry.d * (c.speedMultiplier ?? 1)) / Math.max(entry.d - pingMin() * event.speed, floor);
      return true;
    }
  });
  hook("S_ACTION_END", null, event => {
    if (!cfg().enabled || !event.skill || !event.skill.npc) return;
    const rec = current[event.id];
    if (!rec) return;
    const time = (Date.now() - rec.time) / rec.speed;
    delete current[event.id];
    if (event.type === 0) learn(event.skill.huntingZoneId, event.templateId, event.skill.id, time);
  });
  this.destructor = () => {
    try {
      if (dirty) fs.writeFileSync(dataFile, JSON.stringify(data));
    } catch (e) {}
  };
};
