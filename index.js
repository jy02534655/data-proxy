import promiseProxy from './promise/index';
import { clearObject } from './utils';
import {
  cloneDeep,
  isPlainObject,
  mixin,
  defaultsDeep,
  split,
  isFunction,
  drop,
  defaults,
  get,
  set,
  forEach,
  assign,
  unset
} from 'lodash';

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
// 这是一个数据代理
// 俄罗斯套娃模式，支持向上向下扩展
// 数据源对象
// store={};
// 数据源对象挂载代理
// proxy.init(store);
// 数据源对象加载数据
// store.load(); => {data:[]}
export default {
  /**
   * 初始化,每个数据源对象必须初始化
   *
   * @param {*} store,数据源对象
   */
  init(store) {
    // console.log('proxy.init');
    const me = this,
      // 代理配置
      proxy = store.proxy,
      // 读取代理类型，用.分割
      key = split(proxy.type, '.');
    // 读取并设置默认配置，默认配置会被新配置覆盖
    defaultsDeep(proxy, defaultProxy);
    // 将当前代理对象的函数挂载到数据源对象，代理对象的函数会覆盖代理对象原有的函数
    mixin(store, me);
    // console.log('proxy.init', proxy);
    // 设置下一级代理类型
    proxy.type = drop(key).toString();
    // 根据代理类型第一级挂载代理对象
    switch (key[0]) {
      // 经典代理
      default:
        // 初始化代理对象
        promiseProxy.init(store);
        break;
    }
    // 根据配置决定是否自动加载数据
    if (proxy.autoLoad) {
      store.load(proxy.params);
    }
  },

  /**
   * 数据源对象加载数据
   *
   * promise.开头的代理页码会重置为1
   *
   * local代理如果没有配置requestFun会根据dbName与path配置读取本地数据
   *
   * @param {object} params 查询参数
   */
  load(params) {
    const me = this,
      proxy = me.proxy,
      // 获取默认参数
      { defaultParams, sortData, clearEmptyParams } = proxy;
    if (params) {
      // 深度拷贝并处理掉空数据，避免数据变化引起bug
      params = cloneDeep(params);
      if (clearEmptyParams) {
        params = clearObject(params);
      }
    }
    // 如果存在默认参数,则添加默认参数
    if (isPlainObject(defaultParams)) {
      // 默认参数会被新参数覆盖
      params = defaults(params, defaultParams);
    }
    // 存储参数（排除分页参数与排序参数）
    proxy.extraParams = cloneDeep(params);
    // 如果存在排序参数,则添加排序参数
    if (isPlainObject(sortData)) {
      // 默认参数会被新参数覆盖
      params = defaults(params, sortData);
    }
    proxy.params = params;
    // 数据源对象加载数据，调用预留函数，让子代理实现具体逻辑
    me.subLoad();
  },

  /**
   * 数据源对象重载数据(参数不会发生变化)
   *
   * promise.开头的代理页码会重置为1
   *
   * local代理如果没有配置requestFun会根据dbName与path配置读取本地数据
   */
  reLoad() {
    const me = this;
    // me.proxy.isReLoad = true;
    me.load(me.proxy.extraParams);
  },

  /**
   * @description  设置默认参数并加载数据
   * @param {object} params 参数
   * @param {boolean} isReLoad 是否重载
   * @param {boolean} isAppends 是否追加默认参数
   */
  lodaByDefaultParams(params, { isReLoad = false, isAppends = false }) {
    const me = this;
    // 设置默认参数
    me.proxy.defaultParams = isAppends
      ? assign(me.proxy.defaultParams, params)
      : params;
    isReLoad ? me.reLoad() : me.load();
  },

  /**
   * 移除指定参数(包括默认参数)并加载数据
   *
   * @param {*} list 待移除的字符串数组
   * @param {boolean} [isReLoad=true] 是否重载
   */
  removeParamsAndReLoad(list, isReLoad = true) {
    const me = this,
      { defaultParams, extraParams } = me.proxy;
    list.forEach((item) => {
      // 移除默认参数
      unset(defaultParams, item);
      // 移除参数
      unset(extraParams, item);
    });
    isReLoad ? me.reLoad() : me.load();
  },

  /**
   * 排序
   *
   * @param {*} { field 排序字段, order 排序方式}
   */
  sort({ field, order }) {
    const me = this,
      proxy = me.proxy,
      sortParam = {};
    set(sortParam, proxy.sortParam, field);
    set(sortParam, proxy.directionParam, order);
    proxy.sortData = sortParam;
    me.load(me.getParams());
  },

  /**
   * 清除排序
   *
   */
  clearSort() {
    const me = this,
      proxy = me.proxy;
    proxy.sortData = null;
    me.load(me.getParams());
  },

  /**
   * 数据加载结束执行
   *
   * @param {*} { res 请求失败结果数据集, isError = false 是否加载失败}
   */
  loadEnd({ res = {}, isError = false } = {}) {
    // console.log('loadEnd');
    // console.log('res:', res);
    // console.log('isError:', isError);
    const me = this;
    // 标识请求数据完成
    me.isLoading = false;
    // 如果数据加载失败
    if (isError) {
      const failure = me.proxy.failure;
      // 如果有请求失败执行函数，执行它
      if (isFunction(failure)) {
        // 有时候请求失败需要额外的处理逻辑
        failure(me, res);
      }
    }
  },

  /**
   * 获取当前参数（排除分页参数）
   *
   * @returns
   */
  getParams() {
    return this.proxy.extraParams;
  },

  /**
   * 获取所有参数
   *
   * @returns
   */
  getAllparams() {
    return this.proxy.params;
  },

  /**
  *
  *
  * @param {object} {
  *         requestFun 获取数据的函数，必须返回Promise函数对象
  *         params 获取数据的函数所需的参数
  *         disposeItem 扩展 处理单个数据对象的函数
  *         reader 读取数据相关配置
  *     }
  * @returns {Promise} 成功回调 resolve({ data, total }); data数据结果集
  *          失败回调 reject({
                 message: '您的网络不佳,请检查您的网络'
             }) message 提示
  */
  async readData({
    requestFun,
    params,
    disposeItem,
    reader,
    readerTransform
  } = {}) {
    if (!requestFun) {
      console.error('requestFun未配置');
      // 失败回调
      return Promise.reject({
        message: 'requestFun未配置'
      });
    } else {
      // 通过代理函数获取数据
      return requestFun(params)
        .then((res) => {
          // 读取数据相关配置
          const {
            // 其他数据节点名称
            otherProperty,
            // 数据根节点名称
            rootProperty,
            // 用于判断请求是否成功的节点名称
            successProperty,
            // 数据总数节点名称
            totalProperty,
            // 请求失败后失败消息节点名称
            messageProperty
          } = reader;
          // 如果有请求数据成功后处理数据结果函数，执行它
          if (isFunction(readerTransform)) {
            // 有时候后端返回的数据可能并不符合规范，可以用这个扩展函数处理一下
            res = readerTransform(res);
          }
          // 获取请求数据结果状态
          if (get(res, successProperty)) {
            // 获取数据
            const data = get(res, rootProperty) || [],
              // 获取数据总数，如果后端没有返回数据总数，默认为当前请求的数据总数
              total = get(res, totalProperty, data.length);
            // 如果有遍历单条数据的函数，那么遍历处理数据
            if (isFunction(disposeItem)) {
              forEach(data, disposeItem);
            }
            const response = {
              data,
              total
            };
            if (otherProperty) {
              response.other = get(res, otherProperty);
            }
            // 成功回调
            return response;
          } else {
            // 失败回调
            return Promise.reject({
              message: get(res, messageProperty)
            });
          }
        })
        .catch(() => {
          // 失败回调
          return Promise.reject({
            message: '您的网络不佳,请检查您的网络'
          });
        });
    }
  }
};
