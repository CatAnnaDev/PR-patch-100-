const fs = require("fs"),
  path = require("path");
class Log {
  addToHistory = (...v1) => {
    this._history.push(v1);
    const v3 = 400;
    if (this._history.length > v3) this._history.splice(0, this._history.length - v3);
  };
  debug = (v4, ...v5) => {
    const v7 = Date.now(),
      v8 = new Date(v7),
      v9 = "[PR][" + v8.toLocaleTimeString() + "][" + v7 % 100000 + "][" + v4 + "]";
    this.addToHistory(v9, ...v5);
    if (!this?.mods?.settings?.debug) return;
    console.log(v9, ...v5);
  };
  error = (v10, ...v11) => {
    const v13 = Date.now(),
      v14 = new Date(v13),
      v15 = "[PR][" + v14.toLocaleTimeString() + "][" + v13 % 100000 + "][" + v10 + "]";
    this.addToHistory(v15, ...v11);
    console.log(v15, ...v11);
  };
  save = (...v16) => {
    if (!v16.length) v16 = Date.now();else v16 = v16.join(" ");
    try {
      fs.mkdirSync(path.join(__dirname, "../../logs"));
    } catch (v18) {}
    fs.writeFileSync(path.join(__dirname, "../../logs/" + v16 + ".txt"), this._history.map(v19 => v19.map(v20 => typeof v20 === "object" ? this.mods.library.jsonStringify(v20) : v20).join(" ")).join("\n"));
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
