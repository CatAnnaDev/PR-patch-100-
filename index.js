const fs = require("fs"),
  nodePath = require("path");
const PROFILE = {
  on: false,
  stats: Object.create(null)
};
class ModWrapper {
  constructor(mod) {
    this._mod = mod;
    this.command = mod.command;
    this._timers = [];
    this._hooks = [];
    this._timerId = 1;
  }
  get game() {
    return this._mod.game;
  }
  get patch() {
    return this._mod.majorPatchVersion;
  }
  get clientMod() {
    return this._mod.clientMod;
  }
  get require() {
    return this._mod.require;
  }
  get dispatch() {
    return this._mod.dispatch;
  }
  get isMenma() {
    return this._mod.serverList[this._mod.serverId].name.includes("MT");
  }
  queryData = (...args) => {
    return this._mod.queryData(...args);
  };
  hook = (...args) => {
    const last = args.length - 1,
      cb = args[last];
    if (typeof cb === "function" && typeof args[0] === "string") {
      const name = args[0];
      args[last] = function (a, b, c, d) {
        if (!PROFILE.on) return cb(a, b, c, d);
        const t0 = process.hrtime.bigint();
        const r = cb(a, b, c, d);
        const dt = Number(process.hrtime.bigint() - t0);
        const s = PROFILE.stats[name] || (PROFILE.stats[name] = {
          n: 0,
          total: 0,
          max: 0
        });
        s.n++;
        s.total += dt;
        if (dt > s.max) s.max = dt;
        return r;
      };
    }
    const handle = this._mod.hook(...args);
    this._hooks.push(handle);
    return handle;
  };
  hookOnce = (...args) => {
    const callback = args.at(-1),
      handle = this.hook(...args.slice(0, -1), (...args) => {
        this.unhook(handle);
        return callback(...args);
      });
    return handle;
  };
  unhook = handle => {
    this._hooks = this._hooks.filter(h => h !== handle);
    return this._mod.unhook(handle);
  };
  _getTimersInTimeoutRangeSorted = (target, tolerance) => {
    const matches = [];
    for (let timer of this._timers) {
      if (timer.goal - tolerance <= target && target <= timer.goal + tolerance) matches.push(timer);
    }
    matches.sort((a, b) => {
      if (a.goal === b.goal) return a.id - b.id;
      return a.goal - b.goal;
    });
    return matches;
  };
  setTimeout = (callback, delay, ...args) => {
    const stackError = new Error();
    if (delay > 2147483647) {
      console.error("TimeoutOverflowWarning: " + delay);
      console.error(stackError.stack);
      delay = 2147483647;
    }
    const threshold = 15;
    let deadline = Date.now() + delay;
    const tick = () => {
        if (entry.cleared) return;
        const remaining = deadline - Date.now();
        if (remaining > threshold) {
          entry.timer = setTimeout(tick, remaining - threshold);
          return;
        }
        if (remaining > 0) {
          entry.timer = setImmediate(tick);
          return;
        }
        const due = this._getTimersInTimeoutRangeSorted(deadline, threshold);
        if (!due[0]) return;
        if (due[0].id !== entry.id) {
          if (entry.cleared) return;
          entry.timer = setImmediate(tick);
          return;
        }
        this.clearTimeout(entry);
        try {
          callback(...args);
        } catch (err) {
          console.log(stackError.stack);
          console.log("----------------");
          console.log(err);
        }
      },
      entry = {
        cleared: false,
        id: this._timerId++,
        goal: deadline,
        timer: setImmediate(tick),
        _onTimeout: () => callback(...args)
      };
    this._timers.push(entry);
    return entry;
  };
  setInterval = (...args) => {
    const handle = this._mod.setInterval(...args);
    this._timers.push(handle);
    return handle;
  };
  clearTimeout = entry => {
    if (entry === undefined || entry === null || entry.timer === undefined) return;
    this._timers = this._timers.filter(e => e !== entry);
    clearTimeout(entry.timer);
    entry.cleared = true;
  };
  clearInterval = handle => {
    this._timers = this._timers.filter(h => h !== handle);
    clearInterval(handle);
    return this._mod.clearInterval(handle);
  };
  send = (...args) => {
    return this._mod.send(...args);
  };
  parseSystemMessage = (...args) => {
    return this._mod.parseSystemMessage(...args);
  };
  buildSystemMessage = (...args) => {
    return this._mod.buildSystemMessage(...args);
  };
  destructor = () => {
    for (const entry of [...this._timers]) {
      this.clearTimeout(entry);
      this.clearInterval(entry);
      clearTimeout(entry);
    }
    for (const handle of this._hooks) this._mod.unhook(handle);
  };
}
class PingRemover {
  constructor(mod) {
    this.mod = mod;
    this.mods = {
      plugin: {},
      ...mod.require.library
    };
    this.wrappers = {
      plugin: {}
    };
    this.addOpcodes();
    this.loadAllModules();
    this.setupWatcher();
  }
  addOpcodes = () => {};
  setupWatcher = () => {
    let renamedFrom = null,
      lastReload = {};
    this.watcher = fs.watch(nodePath.join(__dirname, "libs"), {
      recursive: true
    }, (event, file) => {
      if (this.start >= Date.now() - 10000) return;
      if (event === "rename") renamedFrom = file;
      if (event !== "change") return;
      if (!file) return;
      file = file.replace(__dirname, "");
      let parts = file.split("\\");
      if (parts.length === 1 && renamedFrom) {
        file = renamedFrom.replace(__dirname, "");
        parts = file.split("\\");
      }
      if (parts.length < 2) return;
      if (parts[0] === "enums") return;
      const isPlugin = parts[0].includes("plugins"),
        name = parts[1].replace(".js", ""),
        reqPath = "./libs/" + parts[0] + "/" + name;
      try {
        delete require.cache[require.resolve(reqPath)];
      } catch (e) {}
      let required = null;
      try {
        required = require(reqPath);
      } catch (e) {
        if (["MODULE_NOT_FOUND", "ENOENT"].includes(e.code)) {
          console.log("The " + (isPlugin ? "plugin" : "class") + " " + name + " has been removed.");
          return;
        } else throw e;
      }
      if (required?.DisableReloading) return;
      const now = Date.now();
      if (now - (lastReload[name] || 0) <= 1500) return;
      lastReload[name] = now;
      const modulePath = ["libs", parts[0], parts[1].replace(".js", "")].join("/");
      let existing = isPlugin && this.mods.plugin[name] || !isPlugin && this.mods[name];
      if (existing) {
        const state = this.unloadModule(modulePath);
        if (state) existing = state;
      }
      this.loadModule(modulePath, existing);
    });
  };
  loadModule = (modulePath, state = false, retry = true) => {
    const parts = modulePath.split("/"),
      isPlugin = parts[1].includes("plugins"),
      name = parts[2],
      wrapper = new ModWrapper(this.mod);
    let ctor = null;
    try {
      ctor = require("./" + modulePath);
    } catch (e) {
      if (["MODULE_NOT_FOUND", "ENOENT"].includes(e.code)) {
        console.log("The " + (isPlugin ? "plugin" : "class") + " " + name + " has been removed.");
        wrapper.destructor();
        return;
      }
      throw e;
    }
    let instance = null;
    try {
      instance = new ctor(wrapper, this.mods);
      console.log("Loaded " + (isPlugin ? "plugin" : "class") + " " + name);
    } catch (e) {
      if (!retry) {
        console.log(e);
        console.log(modulePath);
        console.log(ctor);
        console.log("Failed to load " + (isPlugin ? "plugin" : "class") + " " + name);
      }
      if (retry) setTimeout(this.loadModule, 100, modulePath, state, false);
      wrapper.destructor();
      return;
    }
    if (isPlugin) {
      this.wrappers.plugin[name] = wrapper;
      this.mods.plugin[name] = instance;
      if (state && instance.loaded) instance.loaded(state);
    } else {
      this.wrappers[name] = wrapper;
      this.mods[name] = instance;
      if (state && instance.loaded) instance.loaded(state);
    }
  };
  unloadModule = modulePath => {
    const parts = modulePath.split("/"),
      isPlugin = parts[1].includes("plugins"),
      name = parts[2];
    console.log("Unloading " + (isPlugin ? "plugin" : "class") + " " + name);
    let state = null;
    if (isPlugin && this.mods.plugin[name].destructor) state = this.mods.plugin[name].destructor();
    else if (!isPlugin && this.mods[name].destructor) state = this.mods[name].destructor();
    delete require.cache[require.resolve("./" + modulePath)];
    if (isPlugin) {
      this.wrappers.plugin[name].destructor();
      delete this.wrappers.plugin[name];
      delete this.mods.plugin[name];
    } else {
      this.wrappers[name].destructor();
      delete this.wrappers[name];
      delete this.mods[name];
    }
    return state;
  };
  loadAllModules = () => {
    this.start = Date.now();
    const dirs = ["classes", "plugins", "custom_plugins", "user_plugins"];
    for (const dir of dirs) {
      let files = null;
      try {
        files = fs.readdirSync(nodePath.join(__dirname, "libs/" + dir));
      } catch (e) {
        if (e.code === "ENOENT") continue;
        throw e;
      }
      for (const file of files) {
        this.loadModule("libs/" + dir + "/" + file.replace(".js", ""));
      }
    }
  };
  destructor = () => {
    this.watcher.close();
    for (const name in this.wrappers) {
      if (name === "plugin") continue;
      const wrapper = this.wrappers[name];
      wrapper.destructor();
      const instance = this.mods[name];
      if (!instance.destructor) continue;
      instance.destructor();
    }
    for (const name in this.wrappers.plugin) {
      const wrapper = this.wrappers.plugin[name];
      wrapper.destructor();
      const instance = this.mods.plugin[name];
      if (!instance.destructor) continue;
      instance.destructor();
    }
  };
}
module.exports.profiler = PROFILE;
module.exports.NetworkMod = PingRemover;
module.exports.ClientMod = require("./libs/classes/datacenter");
module.exports.RequireInterface = (_a, _b, mod) => mod;
