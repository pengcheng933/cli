"use strict";

const path = require("path");
const fs = require("fs");

const formatPath = require("@imooc-cli-dev/format-path");
const {
  getDefaultRegister,
  getNpmLatestVersion,
} = require("@imooc-cli-dev/get-npm-info");
const { findPackagePath } = require("fd-package-json");
const npminstall = require("npminstall");
const fse = require("fs-extra");

class Package {
  constructor(options) {
    // 路径
    this.targetPath = options.targetPath;
    // package 存储路径
    this.storePath = options.storePath;
    // package 名字
    this.packageName = options.packageName;
    // package 版本号
    this.packageVersion = options.packageVersion;
    console.log("package is constructor", options);
  }
  get cacheFilePath() {
    let pathName = `${this.packageName}@${this.packageVersion}`.replace('/','+')
    pathName += `/node_modules/${this.packageName}`
    return path.resolve(
      this.storePath + '/.store',
      pathName
    );
  }
  getSpecificFilePath(version) {
    // `${this.packageName.split("/")[0]}+${
    //   this.packageName.split("/")[1]
    // }@${version}`
    const pathName = `${this.packageName}@${version}`.replace('/','+')
    return path.resolve(
      this.storePath + "/.store",
      pathName
    );
  }
  async prepare() {
    if (this.packageVersion === "latest") {
      this.packageVersion = await getNpmLatestVersion(this.packageName);
    }
  }
  // 是否存在
  async exists() {
    if (this.storePath) {
      // 缓存模式
      await this.prepare();
      return fs.existsSync(this.cacheFilePath);
    } else {
      return fs.existsSync(this.targetPath);
    }
  }
  // 下载
  async install() {
    await this.prepare();
    return npminstall({
      root: this.targetPath,
      storeDir: this.storePath,
      registry: getDefaultRegister(),
      pkgs: [{ name: this.packageName, version: this.packageVersion }],
    });
  }
  // 更新
  async update() {
    await this.prepare();
    // 获取最新版本号
    const latestVersion = await getNpmLatestVersion(this.packageName);
    
    // 查询最新版本号对应的路径是否存在
    const latestFilePath = this.getSpecificFilePath(latestVersion);
    // 路径不存在安装最新版本
    if(!fse.pathExistsSync(latestFilePath)){
      await npminstall({
        root: this.targetPath,
        storeDir: this.storePath,
        registry: getDefaultRegister(),
        pkgs: [{ name: this.packageName, version: this.packageVersion }],
      });
      this.packageVersion = latestVersion;
    }
  }
  // 获取入口文件路径
  async getRootFile() {
    async function _getRootFile(filePath) {
      // 查找 package.json 文件并获取其路径
      const packagePath = await findPackagePath(filePath);
      if (packagePath) {
        const packageFile = require(packagePath);
        if (packageFile && packageFile.main) {
          return formatPath(path.resolve(filePath, packageFile.main));
        }
        return null;
      }
    }
    if (this.storePath) {
      return _getRootFile(path.resolve(this.storePath, this.packageName));
    } else {
      return _getRootFile(this.targetPath);
    }
  }
}

module.exports = Package;
