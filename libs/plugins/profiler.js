const fs = require("fs"),
  nodePath = require("path");
module.exports = function (mod, lib) {
  let P = null;
  try {
    P = require("../../index.js").profiler;
  } catch (e) {
    P = null;
  }
  if (!lib.command || !P) return;
  const reportFile = nodePath.join(__dirname, "../../profiler_report.txt");
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
    const header = "packet | calls | avg_ns | max_ns | total_us";
    const lines = rows.map(r => r.k.padEnd(32) + " | " + String(r.n).padStart(7) + " | " + String(Math.round(r.avg)).padStart(8) + " | " + String(r.max).padStart(9) + " | " + String(Math.round(r.tot / 1000)).padStart(9));
    const text = header + "\n" + lines.join("\n") + "\n";
    try {
      fs.writeFileSync(reportFile, text);
    } catch (e) {}
    console.log("\n[ping-remover profiler] " + rows.length + " packets" + (P.on ? "" : " (profiler OFF)") + "\n" + header + "\n" + lines.join("\n"));
    lib.command.message("Report written. Top by total cost:");
    lib.command.message(header);
    for (const r of rows.slice(0, 8)) {
      lib.command.message(r.k + " | " + r.n + " | " + Math.round(r.avg) + " | " + r.max + " | " + Math.round(r.tot / 1000));
    }
    lib.command.message("Full table: mods/ping-remover-legacy-main/profiler_report.txt");
  };
  lib.command.add("profile", toggle);
  lib.command.add("profilereset", reset);
  lib.command.add("profilestat", report);
};
