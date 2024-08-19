'use strict';

module.exports = request;

function request() {
  return [
    {
      name: 'vue2模板测试',
      npmName: 'imooc-cli-dev-template-vue2',
      version: '1.0.0',
      type: 'normal',
      installCommand: 'npm install --registry=https://registry.npmmirror.com',
      startCommand: 'npm run serve',
      tag: ['project']
    },
    {
      name: 'vue2组件库',
      npmName: 'imooc-cli-dev-lego-components',
      version: '1.0.1',
      type: 'normal',
      installCommand: 'npm install --registry=https://registry.npmmirror.com',
      startCommand: 'npm run serve',
      tag: ['component']
    }
  ];
}
