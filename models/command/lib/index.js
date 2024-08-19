"use strict";
const semver = require("semver");
const LOWEST_NODE_VERSION = "10.0.0";
class Command {
  constructor(argv) {
    if (!argv) {
      throw new Error("参数不能为空");
    }
    this._argv = argv;
    let runner = new Promise((resolve) => {
      let chain = Promise.resolve();
      chain = chain.then(() => {
        this.checkNodeVersion();
      });
      chain = chain.then(() => {
        this.initArgs();
      });
      chain = chain.then(() => {
        this.init();
      });
      chain = chain.then(() => {
        this.exec();
      });
    });
  }
  initArgs() {
    this._cmd = this._argv[this._argv.length - 1];
    this._argv = this._argv.slice(0, this._argv.length - 1);
    console.log(this._cmd, this._argv);
  }
  checkNodeVersion() {
    const currentVersion = process.version;
    if (!semver.gte(currentVersion, LOWEST_NODE_VERSION)) {
      throw new Error(`需要node版本大于${LOWEST_NODE_VERSION}`);
    }
  }
  init(){}
  exec(){}
}

module.exports = Command;
