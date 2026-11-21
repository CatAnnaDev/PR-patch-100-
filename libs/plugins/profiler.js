module.exports = function (mod, lib) {
  let P = null;
  try {
    P = require("../../index.js").profiler;
  } catch (e) {
    P = null;
  }
  if (!lib.command || !P) return;
  const toggle = () => {
    P.on = !P.on;
    if (P.on) P.stats = Object.create(null);
    lib.command.message("Hook profiler " + (P.on ? "ON, collecting per-packet timings" : "OFF"));
  };
  const reset = () => {
    P.stats = Object.create(null);
    lib.command.message("Profiler stats cleared.");
  };
  const report = () => {
    const keys = Object.keys(P.stats);
    if (!keys.length) {
      lib.command.message("No samples yet. Type profile to start, play, then profilestat.");
      return;
    }
    const rows = keys.map(k => {
      const s = P.stats[k];
      return {
        k,
        n: s.n,
        avg: s.total / s.n,
        max: s.max,
        tot: s.total
      };
    }).sort((x, y) => y.tot - x.tot);
    lib.command.message("packet | calls | avg ns | max ns | total us" + (P.on ? "" : " (profiler OFF)"));
    for (const r of rows.slice(0, 20)) {
      lib.command.message(r.k + " | " + r.n + " | " + Math.round(r.avg) + " | " + r.max + " | " + Math.round(r.tot / 1000));
    }
  };
  lib.command.add("profile", toggle);
  lib.command.add("profilereset", reset);
  lib.command.add("profilestat", report);
};
