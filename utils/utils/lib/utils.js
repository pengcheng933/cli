"use strict";

const ejs = require("ejs");

const exec = (command, args, options) => {
  const win32 = process.platform === "win32";
  const cmd = win32 ? "cmd" : command;
  const cmdArgs = win32 ? ["/c"].concat(command, args) : args;
  return require("child_process").spawn(cmd, cmdArgs, options || {});
};
const execAsync = (command, args, options) => {
  return new Promise((resolve, reject) => {
    const p = exec(command, args, options);
    p.on("error", (e) => reject(e));
    p.on("exit", (e) => resolve(e));
  });
};
const customizeProjectInformation = (targetPath, projectInfo) => {
  return new Promise((resolve, reject) => {
    ejs.renderFile(
      path.resolve(targetPath, "package.json"),
      {
        className: projectInfo.className,
        version: projectInfo.version,
        description: projectInfo.componentDescript,
      },
      {},
      function (err, str) {
        if (err) {
          reject(err);
        } else {
          fs.writeFileSync(path.resolve(targetPath, "package.json"), str);
          resolve();
        }
      }
    );
  });
};
module.exports = {
  exec,
  execAsync,
  customizeProjectInformation,
};
