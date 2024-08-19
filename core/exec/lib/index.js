"use strict";

const path = require("path");
const Package = require("@imooc-cli-dev/package");
const log = require("@imooc-cli-dev/log");
const cp = require("child_process");

const SETTINGS = {
  // init: "@imooc-cli-dev/init",
  init: "@imooc-cli/init",
};
const CACHE_DIR = "dependencies/";

async function exec() {
  let targetPath = process.env.CLI_TARGET_PATH;
  const storePath = process.env.CLI_HOME;
  let storeDir = "";
  log.verbose("cli", targetPath);
  log.verbose("cli", storePath);
  const commandObj = arguments[arguments.length - 1];
  const packageName = SETTINGS[commandObj.name()];
  const packageVersion = "latest";
  let pkg;
  if (!targetPath) {
    targetPath = path.resolve(storePath, CACHE_DIR);
    storeDir = path.resolve(targetPath, "node_modules");
    pkg = new Package({
      targetPath,
      storePath: storeDir,
      packageName,
      packageVersion,
    });
    if (await pkg.exists()) {
      await pkg.update();
    } else {
      await pkg.install();
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
    });
  }

  const rootFilePath = await pkg.getRootFile();

  if (rootFilePath) {
    // 将参数转为数组传进去
    // require(rootFilePath).call(null,Array.from(arguments));
    // 在node子进程中执行
    const args = Array.from(arguments);
    const cmd = args[args.length - 1];
    const o = Object.create(null);
    Object.keys(cmd).forEach((key) => {
      if (cmd.hasOwnProperty(key) && !key.startsWith("_") && key !== "parent") {
        o[key] = cmd[key];
      }
    });
    args[args.length - 1] = o;

    const code = `require('${rootFilePath}').call(null,${JSON.stringify(args)})`;
    const child = cp.spawn("node", ["-e", code], {
      cwd: process.cwd(),
      stdio: "inherit",
    });
    child.on("error", (err) => {
      process.exit(1);
    });
    child.on("exit", (err) => {
      process.exit(err);
    });
  }
}

module.exports = exec;
