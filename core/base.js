import { cloneDeep, isPlainObject, isFunction, defaults, get, set, forEach, assign, unset } from 'lodash';
import { clearObject, isEmpty } from '../utils';

/**
 * 基础代理类
 * 实现了通用的数据加载、参数处理等功能
 */
export class BaseProxy {
  /**
   * 构造函数
   * @param {object} store 数据源对象
   */
  constructor(store) {
    this.store = store;
    this.proxy = store.proxy;
  }

  /**
   * 获取加载参数
   * @param {object} params 查询参数
   * @returns {object} 处理后的参数
   */
  getLoadParams(params) {
    const proxy = this.proxy;
    // 参数相关配置
    const { defaultParams, sortData, clearEmptyParams } = proxy;

    if (params) {
      // 深度拷贝并处理掉空数据，避免数据变化引起bug
      // 如果是点击事件抛出的参数，cloneDeep处理后会变为{}
      params = cloneDeep(params);
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

    // 清除空参数
    if (params && clearEmptyParams) {
      params = clearObject(params);
    }

    return params;
  }

  /**
   * 数据源对象加载数据
   * promise.开头的代理页码会重置为1
   * local代理如果没有配置requestFun会根据dbName与path配置读取本地数据
   * @param {object} params 查询参数
   */
  load(params) {
    this.proxy.params = this.getLoadParams(params);
    return this.subLoad();
  }

  /**
   * 数据源对象重载数据(参数不会发生变化)
   * local代理如果没有配置requestFun会根据dbName与path配置读取本地数据
   */
  reLoad() {
    return this.load(this.proxy.extraParams);
  }

  /**
   * @description  设置默认参数并加载数据
   * @param {object} params 参数
   * @param {boolean} isReLoad 是否重载
   * @param {boolean} isAppends 是否追加默认参数
   */
  lodaByDefaultParams(params, { isReLoad = false, isAppends = false } = {}) {
    // 设置默认参数
    this.proxy.defaultParams = isAppends ? assign(this.proxy.defaultParams, params) : params;
    return isReLoad ? this.reLoad() : this.load();
  }

  /**
   * 移除指定参数(包括默认参数)并加载数据
   * @param {*} list 待移除的字符串数组
   * @param {boolean} [isReLoad=true] 是否重载
   */
  removeParamsAndReLoad(list, isReLoad = true) {
    const { defaultParams, extraParams } = this.proxy;
    list.forEach((item) => {
      // 移除默认参数
      unset(defaultParams, item);
      // 移除参数
      unset(extraParams, item);
    });
    return isReLoad ? this.reLoad() : this.load();
  }

  /**
   * 排序函数，用于设置排序参数并重新加载数据
   * @param {Object} options 排序配置选项
   * @param {string} options.field 排序字段名
   * @param {string} options.order 排序方式(如: asc, desc)
   * @param {Object} options.params 自定义排序参数
   */
  sort({ field, order, params } = {}) {
    const proxy = this.proxy;
    const sortParam = {};

    // 如果传入了自定义参数，则直接使用自定义参数
    if (!isEmpty(params)) {
      proxy.sortData = params;
    } else {
      // 否则根据传入的字段和排序方式构建排序参数
      if (!isEmpty(field)) {
        set(sortParam, proxy.sortParam, field);
      }
      if (!isEmpty(order)) {
        set(sortParam, proxy.directionParam, order);
      }
      proxy.sortData = sortParam;
    }
    // 更新代理对象的排序数据并重新加载
    this.load(this.getParams());
  }

  /**
   * 清除排序
   */
  clearSort() {
    this.proxy.sortData = null;
    return this.load(this.getParams());
  }

  /**
   * 数据加载结束执行
   * @param {*} { res 请求失败结果数据集, isError = false 是否加载失败}
   */
  loadEnd({ res = {}, isError = false } = {}) {
    // 标识请求数据完成
    this.store.isLoading = false;

    // 如果数据加载失败
    if (isError) {
      const failure = this.proxy.failure;
      // 如果有请求失败执行函数，执行它
      if (isFunction(failure)) {
        // 有时候请求失败需要额外的处理逻辑
        failure(this.store, res);
      }
    }

    this.store.end && this.store.end(this.store);
  }

  /**
   * @description  设置当前参数（排除分页、排序参数）
   * @param {object} params 参数
   */
  setParams(params) {
    this.proxy.params = this.getLoadParams(params);
  }

  /**
   * 获取当前参数（排除分页、排序参数）
   * @returns {object} 当前参数
   */
  getParams() {
    return this.proxy.extraParams;
  }

  /**
   * 获取所有参数
   * @returns {object} 所有参数
   */
  getAllparams() {
    return this.proxy.params;
  }

  /**
   * 读取数据
   * @param {object} {
   *     requestFun 获取数据的函数，必须返回Promise函数对象
   *     params 获取数据的函数所需的参数
   *     disposeItem 扩展 处理单个数据对象的函数
   *     reader 读取数据相关配置
   * }
   * @returns {Promise} 成功回调 resolve({ data, total }); data数据结果集
   *          失败回调 reject({
   *             message: '您的网络不佳,请检查您的网络'
   *         }) message 提示
   */
  async readData({ requestFun, params, disposeItem, reader, readerTransform } = {}) {
    if (!requestFun) {
      console.error('requestFun未配置');
      return Promise.reject({
        message: 'requestFun未配置'
      });
    }

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
          const data = get(res, rootProperty) || [];
          // 获取数据总数，如果后端没有返回数据总数，默认为当前请求的数据总数
          const total = get(res, totalProperty, data.length);

          // 如果有遍历单条数据的函数，那么遍历处理数据
          if (isFunction(disposeItem)) {
            forEach(data, disposeItem);
          }

          const response = { data, total };

          if (otherProperty) {
            response.other = get(res, otherProperty);
          }

          return response;
        }

        return Promise.reject({
          message: get(res, messageProperty)
        });
      })
      .catch(() => {
        return Promise.reject({
          message: '您的网络不佳,请检查您的网络'
        });
      });
  }
}
