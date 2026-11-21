const fs = require("fs"),
  path = require("path");
class Settings {
  constructor(v1, v2) {
    this.mod = v1;
    this.mods = v2;
    const v4 = {
      enabled: true,
      block: true,
      jaunt: true,
      debug: false,
      dash: 25,
      delay: 0,
      instant: false,
      spikeCap: 150,
      spikeDecay: 0.6,
      spikeMargin: 4,
      spikeNotify: 40,
      auto: {
        enabled: true,
        maxMs: 50,
        floorMax: 40,
        recoveryPerMs: 0.08,
        floorStep: 8,
        floorRecoveryPerMs: 0.004,
        sustainMs: 1500,
        sustainFrac: 0.7,
        notify: 0,
        autoInstant: true,
        fallbackFrac: 0.8,
        restoreFloor: 2,
        stallGapMs: 250,
        stallFactor: 0.15,
        loopLagMs: 40,
        loopFactor: 0.3,
        jitterPadK: 0.8,
        jitterPadDead: 8,
        jitterPadCap: 20,
        weights: {
          desync: 18,
          rubberband: 0,
          mismatch: 0,
          reject: 0
        }
      }
    };
    try {
      const v5 = JSON.parse(fs.readFileSync(path.join(__dirname, "../../config.json"), "utf-8"));
      this.info = Object.assign({}, v4, v5);
    } catch (v6) {
      this.info = v4;
    }
    this.mods.command.add("$default", this.toggle);
    this.mods.command.add("on", this.on);
    this.mods.command.add("off", this.off);
    this.mods.command.add("block", this.block);
    this.mods.command.add("delay", this.delay);
    this.mods.command.add("jaunt", this.jaunt);
    this.mods.command.add("instant", this.instant);
  }
  instant = () => {
    this.info.instant = !this.info.instant;
    this.mods.command.message("Instant (zero-jitter) mode has been turned", this.info.instant ? "on" : "off");
  };
  toggle = () => {
    this.info.enabled = !this.info.enabled;
    this.mods.command.message("PR has been turned", this.info.enabled ? "on" : "off");
  };
  off = () => {
    this.info.enabled = false;
    this.mods.command.message("PR has been turned off");
  };
  on = () => {
    this.info.enabled = true;
    this.mods.command.message("PR has been turned on");
  };
  block = () => {
    this.info.block = !this.info.block;
    this.mods.command.message("Smooth block has been turned", this.info.block ? "on" : "off");
  };
  delay = v11 => {
    v11 = +v11;
    if (isNaN(v11) || v11 < 0) return this.mods.command.message("The artificial delay needs to be a number >= 0");
    this.info.delay = v11;
    this.mods.command.message("Set artificial delay to", v11);
  };
  jaunt = () => {
    this.info.jaunt = !this.info.jaunt;
    this.mods.command.message("Smooth jaunt has been turned", this.info.jaunt ? "on" : "off");
  };
  get enabled() {
    return this.info.enabled;
  }
  get smoothBlock() {
    return this.info.block;
  }
  get emulateJaunt() {
    return this.info.jaunt;
  }
  get debug() {
    return this.info.debug;
  }
  set debug(v18) {
    this.info.debug = v18;
  }
  get dash() {
    return this.info.dash;
  }
  set dash(v21) {
    this.info.dash = v21;
  }
  destructor() {
    fs.writeFileSync(path.join(__dirname, "../../config.json"), JSON.stringify(this.info, null, "  "));
  }
}
module.exports = Settings;
