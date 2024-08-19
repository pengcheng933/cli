"use strict";

const path = require("path");
const axios = require("axios");
const semver = require("semver");

function getNpmInfo(npmName, registry) {
  console.log(npmName);
  if (!npmName) {
    return null;
  }
  const registryUrl = registry || getDefaultRegister();
  const url = path.join(registryUrl, npmName);
  console.log(url);
  return axios
    .get(url)
    .then((res) => {
      if (res.status === 200) {
        return res.data;
      } else {
        return null;
      }
    })
    .catch((e) => {
      return null;
    });
}
function getDefaultRegister(isOrigin) {
  return isOrigin
    ? "https://registry.npmjs.org"
    : "https://registry.npmmirror.com";
}
async function getNpmVersionInfo(npmName, registry) {
  const data = await getNpmInfo(npmName, registry);
  return data ? Object.keys(data.versions) : [];
}
async function getNpmSemverVersion(baseVersion, npmName, registry) {
  const versions = await getNpmVersionInfo(npmName, registry);
  const newVersions = versions
    .filter((version) => semver.satisfies(version, `>${baseVersion}`))
    .sort((a, b) => semver.gt(a, b));
  if (newVersions && newVersions.length > 0) {
    return newVersions[0];
  } else {
    return null;
  }
}
async function getNpmLatestVersion(npmName) {
  const versions = await getNpmVersionInfo(npmName, getDefaultRegister());
  if (versions) {
    return versions.sort((a, b) => 
     {
      if(semver.gt(a, b)) return -1
      else return 1
     }
    )[0];
  }
  return null;
}
module.exports = {
  getNpmInfo,
  getNpmVersionInfo,
  getNpmSemverVersion,
  getDefaultRegister,
  getNpmLatestVersion,
};
