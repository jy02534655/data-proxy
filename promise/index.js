import { mixin, set, isFunction, defaultsDeep } from 'lodash';
// 经典代理（pc端）
import classic from './classic';
// 内存代理
import memory from './memory';
// 现代代理（移动端）
import modern from './modern';
// 默认配置参数
const defaultProxy = {
  // 每次加载几条数据，默认为10
  pageSize: 10,
  // 当前页码，默认为1
  page: 1,
  // 数据总数，禁止更改
  total: 0,
  // 分页每页显示条数字段名称，默认为limit，此参数传递到请求数据函数
  limitParam: 'limit',
  // 分页页码字段名称，默认为page，此参数传递到请求数据函数
  pageParam: 'page'
};
// 通过Promise函数请求数据代理
export default {
  /**
   * 初始化
   *
   * @param {*} store,数据源对象
   */
  init(store) {
    const me = this,
      proxy = store.proxy;
    // 读取并设置默认配置，默认配置会被新配置覆盖
    defaultsDeep(proxy, defaultProxy);
    // 将当前代理对象的函数挂载到数据源对象，代理对象的函数会覆盖代理对象原有的函数
    mixin(store, me);
    // console.log('proxy.promise.init', proxy);
    // 根据代理类型挂载代理对象
    // 默认挂载经典代理
    switch (proxy.type) {
      case 'modern':
        mixin(store, modern);
        break;
      case 'memory':
        // 在classic代理基础上扩展
        classic.init(store);
        memory.init(store);
        break;
      default:
        classic.init(store);
        break;
    }
    // 获取readerTransform配置
    if (!proxy.readerTransform) {
      proxy.readerTransform = store.readerTransform;
    }
    // 获取writerTransform配置
    if (!proxy.writerTransform) {
      proxy.writerTransform = store.writerTransform;
    }
    // 获取failure配置
    if (!proxy.failure) {
      proxy.failure = store.failure;
    }
  },

  /**
   * @description 请求数据（为子类预留可覆盖方法）
   * @param {*} proxy 代理
   * @return {*}
   */
  promiseReadData(proxy) {
    // 这样写能避免作用域问题
    return this.readData(proxy);
  },
  /**
   * @description 请求数据并做通用逻辑处理，提供给子代理使用
   * @return {Promise}
   */
  readDataEnd() {
    const me = this,
      proxy = me.proxy;
    // 请求数据
    return me
      .promiseReadData(proxy)
      .then((response) => {
        const { total } = response;
        proxy.total = total;
        // 如果当前标识为重载数据，重置标识状态为false，预留扩展
        if (proxy.isReLoad) {
          proxy.isReLoad = false;
        }
        proxy.loadSuccess && proxy.loadSuccess(response, proxy, me);
        return response;
      })
      .catch((res) => {
        // 数据加载结束
        return Promise.reject({
          isError: true,
          res
        });
      });
  },
  /**
   * 根据代理配置加载数据
   * 这里不接收params是为了避免调整页码等参数时需要传参
   */
  loadByProxy(isSubLoad = false) {
    const me = this,
      proxy = me.proxy;
    // 标识当前是否是通过subLoad调用
    // memory代理中用来判断是否从内存中读取数据
    proxy.isSubLoad = isSubLoad;
    // 当前代理状态
    // console.log('proxy isLoading', me.isLoading);
    // 如果正在请求数据，不做任何操作，过滤高频请求
    if (!me.isLoading) {
      // 标识正在请求数据
      me.isLoading = true;
      // 读取store配置
      const { pageSize, page, writerTransform, clearPageParams, beforLoad } =
        proxy;
      beforLoad && beforLoad(proxy);
      let { params = {}} = proxy;
      if (!clearPageParams) {
        // 设置分页相关参数
        set(params, proxy.limitParam, pageSize);
        set(params, proxy.pageParam, page);
      }
      // 如果有请求数据前处理请求参数函数，执行它
      if (isFunction(writerTransform)) {
        // 有时候需要在请求前处理参数
        params = writerTransform(params, proxy);
      }
      // 设置代理参数
      proxy.params = params;
      // console.log('extraParams', proxy.extraParams);
      // 读取并处理数据，调用预留函数，让子代理实现具体逻辑
      me.promiseReadDataEnd();
    }
  },
  /**
   * 数据源对象加载数据，页码重置为1
   *
   */
  subLoad() {
    const me = this;
    me.proxy.page = 1;
    me.loadByProxy(true);
  }
};
