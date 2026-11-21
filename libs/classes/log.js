const fs = require("fs"),
  path = require("path");
class Log {
  addToHistory = entry => {
    const h = this._history;
    h.push(entry);
    if (h.length >= 800) this._history = h.slice(h.length - 400);
  };
  formatEntry(entry) {
    return "[PR][" + new Date(entry[0]).toLocaleTimeString() + "][" + entry[0] % 100000 + "][" + entry[1] + "]";
  }
  debug = (v4, ...v5) => {
    const ts = Date.now();
    this.addToHistory([ts, v4, v5]);
    if (!this?.mods?.settings?.debug) return;
    console.log(this.formatEntry([ts, v4, v5]), ...v5);
  };
  error = (v10, ...v11) => {
    const ts = Date.now();
    this.addToHistory([ts, v10, v11]);
    console.log(this.formatEntry([ts, v10, v11]), ...v11);
  };
  save = (...v16) => {
    if (!v16.length) v16 = Date.now();else v16 = v16.join(" ");
    try {
      fs.mkdirSync(path.join(__dirname, "../../logs"));
    } catch (v18) {}
    fs.writeFileSync(path.join(__dirname, "../../logs/" + v16 + ".txt"), this._history.map(entry => {
      const body = entry[2].map(v => typeof v === "object" && v !== null ? this.mods.library.jsonStringify(v) : v).join(" ");
      return this.formatEntry(entry) + " " + body;
    }).join("\n"));
    this.mods.command.message("Saved log to [PR]/logs/" + v16 + ".txt");
  };
  ghostLine(entry) {
    const body = entry[2] && typeof entry[2] === "object" ? this.mods.library.jsonStringify(entry[2]) : entry[2];
    return this.formatEntry([entry[0], "GHOST", [entry[1]]]) + " " + entry[1] + " " + body;
  }
  ghost = (reason, ctx) => {
    const ts = Date.now(),
      entry = [ts, reason, ctx];
    const g = this._ghost;
    g.push(entry);
    if (g.length >= 600) this._ghost = g.slice(g.length - 300);
    this._ghostPending.push(entry);
    this._ghostBurst++;
    if (ts - this._ghostLastMsg >= 3000) {
      this._ghostLastMsg = ts;
      const count = this._ghostBurst;
      this._ghostBurst = 0;
      try {
        this.mods.command.message("[PR] ghost x" + count + ": " + reason + (ctx && ctx.skill != null ? " skill " + ctx.skill : "") + (ctx && ctx.ping != null ? " ping " + ctx.ping : "") + (ctx && ctx.delay != null ? " delay " + ctx.delay : ""));
      } catch (e) {}
    }
  };
  flushGhost = () => {
    if (!this._ghostPending.length) return;
    const pending = this._ghostPending;
    this._ghostPending = [];
    const text = pending.map(e => this.ghostLine(e)).join("\n") + "\n";
    try {
      fs.mkdirSync(path.join(__dirname, "../../logs"));
    } catch (e) {}
    fs.appendFile(path.join(__dirname, "../../logs/ghost_live.txt"), text, () => {});
  };
  ghostlog = () => {
    this.flushGhost();
    this.mods.command.message("Ghost events logged live -> [PR]/logs/ghost_live.txt (" + this._ghost.length + " in memory)");
  };
  toggleDebug = () => {
    this.mods.settings.debug = !this.mods.settings.debug;
    this.mods.command.message("Debugging has been turned", this.mods.settings.debug ? "on" : "off");
  };
  destructor = () => {
    this.flushGhost();
    this.mods.command.remove("save");
    this.mods.command.remove("debug");
    this.mods.command.remove("ghostlog");
  };
  constructor(v23, v24) {
    this.mod = v23;
    this.mods = v24;
    this._history = [];
    this._ghost = [];
    this._ghostPending = [];
    this._ghostLastMsg = 0;
    this._ghostBurst = 0;
    this._ghostFlusher = v23.setInterval(this.flushGhost, 5000);
    v24.command.add("save", this.save);
    v24.command.add("debug", this.toggleDebug);
    v24.command.add("ghostlog", this.ghostlog);
  }
}
module.exports = Log;
