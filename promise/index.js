import { BaseProxy } from '../core/base';
import { set, isFunction, defaultsDeep, ceil } from 'lodash';

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

export class PromiseProxy extends BaseProxy {
  constructor(store) {
    defaultsDeep(store.proxy, defaultProxy);
    super(store);
  }

  /**
   * @description 请求数据（为子类预留可覆盖方法）
   * @param {*} proxy 代理
   * @return {*}
   */
  promiseReadData(proxy) {
    return this.readData(proxy);
  }

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
        // 最大页码
        proxy.maxPage = ceil(total / proxy.pageSize);
        // 如果当前标识为重载数据，重置标识状态为false，预留扩展
        if (proxy.isReLoad) {
          proxy.isReLoad = false;
        }
        proxy.success && proxy.success(response, proxy, me);
        return response;
      })
      .catch((res) => {
        // 数据加载结束
        return Promise.reject({
          isError: true,
          res
        });
      });
  }

  /**
   * 根据代理配置加载数据
   * 这里不接收params是为了避免调整页码等参数时需要传参
   * @param {boolean} isSubLoad 是否是通过subLoad调用
   */
  loadByProxy(isSubLoad) {
    const me = this;
    const proxy = me.proxy;
    // 标识当前是否是通过subLoad调用
    // memory代理中用来判断是否从内存中读取数据
    proxy.isSubLoad = isSubLoad;
    // 如果正在请求数据，不做任何操作，过滤高频请求
    if (!me.store.isLoading) {
      // 标识正在请求数据
      me.store.isLoading = true;

      const { pageSize, page, writerTransform, clearPageParams, beforLoad } = proxy;
      beforLoad && beforLoad(proxy);

      let { params = {} } = proxy;
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
      return me.promiseReadDataEnd();
    }
    console.error('上个请求还未结束，当前请求已中断！');
    return Promise.reject();
  }

  /**
   * page重置为1并加载数据
   * @method subLoad
   */
  subLoad() {
    const me = this;
    me.proxy.page = 1;
    return me.loadByProxy(true);
  }

  /**
   * 加载下一页数据
   * @method loadNext
   */
  loadNext() {
    const me = this,
      proxy = me.proxy,
      page = proxy.page;
    // 如果正在加载，终止
    if (page && !me.isLoading) {
      proxy.page = page + 1;
      return me.loadByProxy();
    }
    return Promise.reject();
  }
}
