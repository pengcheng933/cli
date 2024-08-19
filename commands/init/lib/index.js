"use strict";

const fs = require("fs");
const path = require("path");
const Command = require("@imooc-cli-dev/command");
const Package = require("@imooc-cli-dev/package");
const {
  execAsync,
  customizeProjectInformation,
} = require("@imooc-cli-dev/utils");
const { confirm, select, input } = require("@inquirer/prompts");
const semver = require("semver");
const fse = require("fs-extra");
const userHome = require("user-home");
const dashify = require("dashify");
const { glob } = require("glob");
const ejs = require("ejs");
const { getProjectInfo } = require("./getProjectTemplate");

const PROJECT = "project";
const COMPONENT = "component";
const TEMPLATE_TYPE_NORMAL = "normal";
const TEMPLATE_TYPE_CUSTOM = "custom";
class InitCommand extends Command {
  async init() {
    this._projectName = this._argv[0] || "";
    this.force = !!this._cmd.force;
  }
  async exec() {
    try {
      await this.prepare();
      await this.downLoadTemplate();
      await this.installTemplate();
    } catch (error) {}
  }
  async prepare() {
    // 获取模板路径信息
    const data = getProjectInfo();
    console.log(data);
    this.template = data;

    // 获取当前路径
    const localPath = process.cwd();
    // 判断是否为空
    const ret = this.isDirEmpty(localPath);
    if (!ret) {
      // 询问是否清空
      const data = await confirm({
        message: "当前目录不为空，是否确认清空当前目录?",
      });
      if (data) {
        fse.emptyDirSync(localPath);
      } else if (!this.force) {
        // 不强制安装不清空目录退出
        return false;
      }
    } else {
      fse.emptyDirSync(localPath);
    }
    return await this.getProjectInfo();
  }
  isDirEmpty(localPath) {
    let fileList = fs.readdirSync(localPath);
    fileList = fileList.filter(
      (item) => !item.startsWith(".") && ["node_modules"].indexOf(item) < 0
    );
    console.log(fileList, ">>>");

    return !fileList || fileList.length === 0;
  }
  async getProjectInfo() {
    this.projectInfo = Object.create(null);
    // 选择创建的类型
    const type = await select({
      message: "要创建的项目类型",
      choices: [
        {
          name: "项目",
          value: PROJECT,
        },
        {
          name: "组件",
          value: COMPONENT,
        },
      ],
    });
    // 隔离
    this.template = this.template.filter((template) =>
      template.tag.includes(type)
    );
    console.log(this.template);

    if (type === PROJECT) {
      const name = await input({
        message: "Enter your name",
        required: true,
        validate: (item) => {
          // 校验规则
          // 首位字符为英文
          // 尾位字符为数字和英文
          // 字符允许为'- _'
          return /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(
            item
          );
        },
      });
      this.projectInfo.name = name;
      const version = await input({
        message: "Enter your version",
        required: true,
        default: "0.0.0",
        validate: (item) => {
          return !!semver.valid(item);
        },
      });
      this.projectInfo.version = version;
    } else {
      this.projectInfo.name = this._projectName;
      const version = await input({
        message: "Enter your version",
        required: true,
        default: "0.0.0",
        validate: (item) => {
          return !!semver.valid(item);
        },
      });
      this.projectInfo.version = version;
      const componentDescript = await input({
        message: "输入组件描述信息",
        required: true,
        validate: (item) => {
          // 校验规则
          return !!item;
        },
      });
      this.projectInfo.componentDescript = componentDescript;
    }
    const template = await select({
      message: "选择项目模板",
      choices: this.createTemplateChoices(),
    });
    this.projectInfo.template = template;
  }
  createTemplateChoices() {
    return this.template.map((item) => ({
      name: item.name,
      value: item.npmName,
    }));
  }
  async downLoadTemplate() {
    const { template } = this.projectInfo;
    this.templateInfo = this.template.find((item) => item.npmName === template);
    const targetPath = path.resolve(userHome, ".imooc-cli", "template");
    const storePath = path.resolve(
      userHome,
      ".imooc-cli",
      "template",
      "node_modules"
    );
    this.templateNpm = new Package({
      targetPath,
      storePath,
      packageName: this.templateInfo.npmName,
      packageVersion: this.templateInfo.version,
    });

    if (!this.templateNpm.exists()) {
      await this.templateNpm.install();
    } else {
      await this.templateNpm.update();
    }
  }
  async installTemplate() {
    if (this.templateInfo) {
      if (this.templateInfo.type === TEMPLATE_TYPE_CUSTOM) {
        // 自定义模板下载
      } else {
        // 普通模板下载
        this.projectInfo.className = dashify(this.projectInfo.name);
        await this.installNormalTemplate();
      }
    }
  }
  async installNormalTemplate() {
    // 拷贝模板代码到当前目录
    const cacheFilePath = path.resolve(
      this.templateNpm.cacheFilePath,
      "template"
    );
    const targetPath = process.cwd();
    fse.ensureDirSync(cacheFilePath);
    fse.ensureDirSync(targetPath);
    fse.copySync(cacheFilePath, targetPath);
    console.log(path.resolve(targetPath, "package.json"));
    try {
      await customizeProjectInformation(targetPath, this.projectInfo);
    } catch (error) {
      console.log(error);
    }

    // 执行下载命令
    const { installCommand, startCommand } = this.templateInfo;
    const installCwd = installCommand.split(" ");
    const cwd = installCwd[0];
    const args = installCwd.slice(1);
    const installRet = await execAsync(cwd, args, {
      stdio: "inherit",
      cwd: targetPath,
    });
    const startCwd = startCommand.split(" ");
    const cwd2 = startCwd[0];
    const args2 = startCwd.slice(1);
    const startRet = await execAsync(cwd2, args2, {
      stdio: "inherit",
      cwd: targetPath,
    });
    if (installRet !== 0 || startRet !== 0) {
      throw "安装或者启动失败";
    }
  }
}
function init(argv) {
  console.log(process.env.CLI_TARGET_PATH);
  const initCommand = new InitCommand(argv);
}
module.exports = init;
