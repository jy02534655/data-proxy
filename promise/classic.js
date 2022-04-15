import { mixin } from 'lodash';
// 默认配置参数
// 多用于web端获取数据，新数据会覆盖原有数据
export default {
  /**
   * 初始化,每个数据源对象必须初始化
   *
   * @param {*} store,数据源对象
   */
  init(store) {
    // 将当前代理对象的函数挂载到数据源对象，代理对象的函数会覆盖代理对象原有的函数
    mixin(store, this);
    // console.log('proxy.promise.classic.init', store.proxy);
  },
  /**
   * 读取并处理数据
   *
   */
  promiseReadDataEnd() {
    const me = this;
    me.readDataEnd()
      .then(({ data }) => {
        me.data = data;
        // 调用总代理数据加载结束函数
        me.loadEnd();
      })
      .catch((res) => {
        // 调用总代理数据加载结束函数
        me.loadEnd(res);
      });
  },
  /**
   * 数据源对象改变每页显示条数，页码重置为1
   *
   * @param {number} page
   */
  loadPageSize(pageSize) {
    const me = this;
    me.proxy.pageSize = pageSize;
    me.proxy.page = 1;
    me.loadByProxy();
  },
  /**
   * 数据源对象改变页码
   *
   * @param {number} page
   */
  loadPage(page) {
    const me = this;
    me.proxy.page = page;
    me.loadByProxy();
  },
  /**
   * 刷新数据源对象，用于修改/新增/删除后调用
   * 修改后直接重载数据，页码不变
   * 新增后直接重新加载数据，页码重置为1
   * 删除后根据剩余数据总数和页面等灵活设置页码，不变或减1
   *
   * @param {*} [{ isDel = false 是否删除数据, isAdd = false 是否新增数据}={}]
   */
  refresh({ isDel = false, isAdd = false } = {}) {
    const me = this,
      proxy = me.proxy;
    // 获取当前页码
    let page = proxy.page;
    if (isDel) {
      // 如果是删除并且页码大于1
      if (page > 1) {
        // 获取删除后当前数据总数
        const count = me.proxy.total - 1,
          // 获取当前每页数据数
          pageSize = proxy.pageSize;
        // 如果删除后当前页面无数据，页码减1
        if ((page - 1) * pageSize >= count) {
          page--;
        }
      }
    } else if (isAdd) {
      // 新增后直接到第一页
      page = 1;
    }
    me.loadPage(page);
  }
};
