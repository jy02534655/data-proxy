import { mixin, orderBy, get, slice, defaultsDeep } from 'lodash';
// 默认配置参数
const defaultProxy = {
  // 清除分页参数
  clearPageParams: true
};

export default {
  /**
   * 初始化,每个数据源对象必须初始化
   *
   * @param {*} store,数据源对象
   */
  init(store) {
    // 设置默认配置
    defaultsDeep(store.proxy, defaultProxy);
    // 将当前代理对象的函数挂载到数据源对象，代理对象的函数会覆盖代理对象原有的函数
    mixin(store, this);
  },
  /**
   * @description 读取数据
   * @param {*} proxy 代理配置
   * @return {*}
   */
  promiseReadData(proxy) {
    const me = this;
    // 判断是否是通过subLoad调用
    if (proxy.isSubLoad) {
      // 是的话就拉取数据
      return me.readData(proxy).then(({ data }) => {
        // 将拉取到的数据保存到内存中
        me.memoryData = data;
        // 从内存中获取分页数据
        return me.memoryPagination();
      });
    } else {
      // 返回内存分页后的数据
      return Promise.resolve(me.memoryPagination());
    }
  },
  /**
   * @description 从内存中获取分页数据
   * @return {array<object>} 分页后数据
   */
  memoryPagination() {
    const me = this,
      // 代理配置
      proxy = me.proxy;
    // 分页排序相关配置
    const { pageSize, page, sortData } = proxy;
    // 从数据源中获取数据
    let memoryData = me.memoryData;
    if (page == 1) {
      // 页码为1时根据排序配置重新排序
      // 排序字段
      const field = get(sortData, proxy.sortParam);
      if (field) {
        // 排序方式
        const order = get(sortData, proxy.directionParam);
        // 重设数据源
        me.memoryData = memoryData = orderBy(memoryData, field, order);
      }
    }
    // 内存数据起始序号
    const start = (page - 1) * pageSize;
    // 获取当前页码数据
    const data = slice(memoryData, start, start + pageSize);
    // 返回数据
    return {
      data,
      total: memoryData.length
    };
  }
};