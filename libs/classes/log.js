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
  toggleDebug = () => {
    this.mods.settings.debug = !this.mods.settings.debug;
    this.mods.command.message("Debugging has been turned", this.mods.settings.debug ? "on" : "off");
  };
  destructor = () => {
    this.mods.command.remove("save");
    this.mods.command.remove("debug");
  };
  constructor(v23, v24) {
    this.mod = v23;
    this.mods = v24;
    this._history = [];
    v24.command.add("save", this.save);
    v24.command.add("debug", this.toggleDebug);
  }
}
module.exports = Log;
