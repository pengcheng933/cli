"use strict";

module.exports = core;

const path = require("path");
const fs = require("fs");
const pkg = require("../package.json");
const log = require("@imooc-cli-dev/log");
// const init = require("@imooc-cli-dev/init");
const exec = require("@imooc-cli-dev/exec");
const userHome = require("user-home");
const colors = require("@colors/colors");
const { Command } = require("commander");
const program = new Command();

const constant = require("./constant.js");
let arg;
async function core() {
  await prepare();
  registerCommand();
}

async function prepare() {
  checkRoot();
  checkUserHome();
  checkEnv();
  await checkGlobalUpdate();
}

function checkRoot() {
  log.verbose("cli", process.geteuid);
}
function checkUserHome() {
  if (!userHome || !fs.existsSync(userHome)) {
    log.error("cli", "不存在路径");
  }
}

function checkEnv() {
  const dotEnv = require("dotenv");
  const pathEnv = path.resolve(userHome, ".env");
  if (fs.existsSync(pathEnv)) {
    config = dotEnv.config({
      path: pathEnv,
    });
  } else {
    createDefaultConfig();
  }
}
function createDefaultConfig() {
  const cliConfig = {
    home: userHome,
  };
  if (process.env.CLI_HOME) {
    cliConfig["cliHome"] = path.join(userHome, process.env.CLI_HOME);
  } else {
    cliConfig["cliHome"] = path.join(userHome, constant.DEFAULT_CLI_HOME);
  }
  process.env.CLI_HOME = cliConfig["cliHome"];
}
async function checkGlobalUpdate() {
  const npmName = pkg.name;
  const version = pkg.version;
  const { getNpmSemverVersion } = require("@imooc-cli-dev/get-npm-info");
  const newVersion = await getNpmSemverVersion(version, npmName);
  if (newVersion) {
    log.warn(
      "cli",
      `请手动更新包，当前版本${version}最新版本${newVersion}`.yellow
    );
  }
}

function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage("<command> [options]")
    .version(pkg.version)
    .option("-d,--debug", "是否开启调试模式", false)
    .option("-tp,--targetPath <targetPath>", "是否指定本地调试路径", "");
  program
    .command("init [projectName]")
    .option("-f,--force", "是否强制初始化")

    .action(exec);
  // 开启debug模式
  program.on("option:debug", () => {
    if (program.opts().debug) {
      process.env.LOG_LEVEL = "verbose";
    } else {
      process.env.LOG_LEVEL = "info";
    }
    log.level = process.env.LOG_LEVEL;
    log.verbose("cli", "test");
  });
  // 定义全局targetPath路径
  program.on("option:targetPath", () => {
    process.env.CLI_TARGET_PATH = program.opts().targetPath;
  });
  // 对未知命令监听
  program.on("command:*", (obj) => {
    console.log(colors.red(`位置命令${obj[0]}`));
  });
  program.parse(process.argv);
}
