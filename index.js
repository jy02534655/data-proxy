import { ProxyFactory } from './core/factory';
import { defaultsDeep, uniq } from 'lodash';

// 默认配置参数
const defaultProxy = {
  // 代理类型，默认为经典代理
  type: 'promise.classic',
  // 默认参数,默认参数会被相同名称新参数覆盖，此参数传递到请求数据函数
  defaultParams: null,
  // 初始化后是否自动加载数据
  autoLoad: false,
  // 扩展 处理单个数据对象的函数
  disposeItem: null,
  // 读取数据相关配置
  reader: {
    // 其他数据节点名称
    otherProperty: '',
    // 数据根节点名称
    rootProperty: 'data',
    // 判断请求是否成功的节点名称
    successProperty: 'success',
    // 数据总数节点名称
    totalProperty: 'total',
    // 请求失败后失败消息节点名称
    messageProperty: 'message'
  },
  // 排序字段名称
  sortParam: 'orderBy',
  // 排序方式字段名称
  directionParam: 'orderSort',
  // 发送请求时是否清除空数据
  clearEmptyParams: true
};

export default {
  init(store) {
    // 设置默认配置
    defaultsDeep(store.proxy, defaultProxy);

    // 创建对应的代理实例
    const proxy = ProxyFactory.create(store);

    // 获取所有方法（包括原型链上的方法）
    const allMethods = [];

    // 遍历原型链获取所有方法
    let currentProto = Object.getPrototypeOf(proxy);
    while (currentProto && currentProto !== Object.prototype) {
      const protoMethods = Object.getOwnPropertyNames(currentProto).filter((method) => typeof currentProto[method] === 'function' && method !== 'constructor' && !method.startsWith('_'));
      allMethods.push(...protoMethods);
      currentProto = Object.getPrototypeOf(currentProto);
    }

    // 获取实例自身的方法
    const ownMethods = Object.getOwnPropertyNames(proxy).filter((method) => typeof proxy[method] === 'function' && !method.startsWith('_'));
    allMethods.push(...ownMethods);

    // 去重
    const uniqueMethods = uniq(allMethods);
    // 将所有方法混入到 store
    uniqueMethods.forEach((method) => {
      store[method] = proxy[method].bind(proxy);
    });

    // 自动加载
    if (store.proxy.autoLoad) {
      store.load(store.proxy.params);
    }
  }
};
