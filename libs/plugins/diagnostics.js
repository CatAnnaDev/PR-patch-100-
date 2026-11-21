module.exports = function (mod, lib) {
  const keyPackets = ["S_ACTION_STAGE", "S_ACTION_END", "C_START_SKILL", "C_PLAYER_LOCATION", "S_INSTANT_MOVE", "S_EACH_SKILL_RESULT", "S_START_COOLTIME_SKILL", "S_ABNORMALITY_BEGIN"];
  lib.command.add("selftest", () => {
    const pingValue = lib.ping?.ping;
    const pingOk = !!lib.require?.ping && Number.isFinite(pingValue);
    let resolved = 0;
    const missing = [];
    for (const name of keyPackets) {
      try {
        lib.packet.get_all(name);
        resolved++;
      } catch (e) {
        missing.push(name);
      }
    }
    const autoOk = !!lib.auto && typeof lib.auto.safetyMs === "function";
    const healthOk = !!lib.plugin?.health;
    const target = 50,
      samples = 10;
    let done = 0,
      sum = 0,
      max = 0;
    lib.command.message("Self-test en cours (mesure timer ~" + (target * samples / 1000).toFixed(1) + "s)...");
    for (let i = 0; i < samples; i++) {
      const expected = Date.now() + target;
      mod.setTimeout(() => {
        const drift = Date.now() - expected;
        sum += drift;
        if (drift > max) max = drift;
        done++;
        if (done === samples) {
          const grade = max <= 16 ? "excellent" : max <= 40 ? "correct" : "degrade";
          lib.command.message("\nSelf-test:\nModule ping: " + (pingOk ? "OK (" + Math.round(pingValue) + " ms)" : "ABSENT") + "\nPaquets cles: " + resolved + "/" + keyPackets.length + (missing.length ? " (manquants: " + missing.join(", ") + ")" : "") + "\nGouverneur auto: " + (autoOk ? "OK" : "absent") + " | Health: " + (healthOk ? "OK" : "absent") + "\nPrecision timer: derive moy " + (sum / samples).toFixed(1) + " ms, max " + max + " ms (" + grade + ")");
        }
      }, target);
    }
  });
};
