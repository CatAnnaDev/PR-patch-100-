const hooks = require("../enums/hooks");
module.exports = function (mod, lib) {
  const heartbeat = ["S_EACH_SKILL_RESULT", "S_CREATURE_CHANGE_HP", "S_ACTION_STAGE", "S_ACTION_END", "S_USER_LOCATION", "S_NPC_LOCATION", "S_CREATURE_LIFE"];
  let lastPacket = Date.now(),
    lastActive = 0,
    recentCount = 0,
    stalled = false,
    stallStart = 0;
  const cfg = () => lib.settings.info.auto || {};
  const onServerPacket = () => {
    const now = Date.now();
    if (now - lastPacket < 1000) recentCount++;else recentCount = 1;
    lastPacket = now;
    if (recentCount >= 2) lastActive = now;
    if (stalled) {
      stalled = false;
      const duration = now - stallStart;
      const maxMs = cfg().maxMs ?? 50;
      if (lib.auto) {
        lib.auto.counts.stall = (lib.auto.counts.stall || 0) + 1;
        lib.auto.pump(Math.min(maxMs, duration * (cfg().stallFactor ?? 0.15)));
      }
    }
  };
  for (const name of heartbeat) {
    try {
      mod.hook(...lib.packet.get_all(name), hooks.READ_REAL, onServerPacket);
    } catch (e) {}
  }
  mod.setInterval(() => {
    const now = Date.now();
    if (now - lastActive > 1500) return;
    if (!stalled && now - lastPacket > (cfg().stallGapMs ?? 250)) {
      stalled = true;
      stallStart = lastPacket;
    }
  }, 50);
  const expected = 50;
  let lastTick = Date.now();
  mod.setInterval(() => {
    const now = Date.now();
    const drift = now - lastTick - expected;
    lastTick = now;
    const threshold = cfg().loopLagMs ?? 40;
    if (drift > threshold && lib.auto) {
      lib.auto.counts.loop = (lib.auto.counts.loop || 0) + 1;
      lib.auto.pump(Math.min(cfg().maxMs ?? 50, (drift - threshold) * (cfg().loopFactor ?? 0.3)));
    }
  }, expected);
};
