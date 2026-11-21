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
  ghost = (reason, ctx) => {
    const g = this._ghost;
    g.push([Date.now(), reason, ctx]);
    if (g.length >= 600) this._ghost = g.slice(g.length - 300);
  };
  ghostlog = () => {
    const name = Date.now();
    try {
      fs.mkdirSync(path.join(__dirname, "../../logs"));
    } catch (e) {}
    const text = this._ghost.map(entry => {
      const body = entry[2] && typeof entry[2] === "object" ? this.mods.library.jsonStringify(entry[2]) : entry[2];
      return this.formatEntry([entry[0], "GHOST", [entry[1]]]) + " " + entry[1] + " " + body;
    }).join("\n");
    fs.writeFileSync(path.join(__dirname, "../../logs/ghost_" + name + ".txt"), text);
    this.mods.command.message("Ghost events: " + this._ghost.length + " -> [PR]/logs/ghost_" + name + ".txt");
  };
  toggleDebug = () => {
    this.mods.settings.debug = !this.mods.settings.debug;
    this.mods.command.message("Debugging has been turned", this.mods.settings.debug ? "on" : "off");
  };
  destructor = () => {
    this.mods.command.remove("save");
    this.mods.command.remove("debug");
    this.mods.command.remove("ghostlog");
  };
  constructor(v23, v24) {
    this.mod = v23;
    this.mods = v24;
    this._history = [];
    this._ghost = [];
    v24.command.add("save", this.save);
    v24.command.add("debug", this.toggleDebug);
    v24.command.add("ghostlog", this.ghostlog);
  }
}
module.exports = Log;
