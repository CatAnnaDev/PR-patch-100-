class Command {
  constructor(v1, v2) {
    this.mods = v2;
    this.command = v1.command;
    this.callbacks = {};
    this.command.add("pr", (v4, ...v5) => {
      if (!v4) v4 = "$default";
      const v7 = this.callbacks[v4];
      if (!v7) {
        this.message("invalid command.", Object.keys(this.callbacks).filter(v8 => v8 !== "$default").join("/"));
        return;
      }
      v7(...v5);
    });
  }
  add = (v9, v10) => {
    if (this.callbacks[v9]) this.mods.log.debug("COMMAND", "Command already registered: " + v9);
    this.callbacks[v9] = v10;
  };
  remove = v12 => {
    delete this.callbacks[v12];
  };
  message = (...v14) => {
    return this.command.message(v14.join(" "));
  };
  exec = (...v16) => {
    return this.command.exec(...v16);
  };
  destructor = () => {
    this.command.remove("pr");
  };
}
module.exports = Command;
module.exports.DisableReloading = true;
