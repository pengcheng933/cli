const request = require("@imooc-cli-dev/request");
const getProjectInfo = () => {
  return request();
};
module.exports = {
  getProjectInfo,
};
