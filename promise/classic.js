import { PromiseProxy } from './index';

/**
 * 经典代理类
 * 多用于web端获取数据，新数据会覆盖原有数据
 */
export class ClassicProxy extends PromiseProxy {
  /**
   * 读取并处理数据
   */
  promiseReadDataEnd() {
    const me = this;
    me.readDataEnd()
      .then(({ data }) => {
        me.store.data = data;
        me.loadEnd();
        return { data, total: me.proxy.total };
      })
      .catch((res) => {
        me.loadEnd(res);
        return Promise.reject();
      });
  }

  /**
   * 数据源对象改变每页显示条数，页码重置为1
   * @param {number} pageSize 每页显示条数
   */
  loadPageSize(pageSize) {
    this.proxy.pageSize = pageSize;
    this.proxy.page = 1;
    return this.loadByProxy();
  }

  /**
   * 数据源对象改变页码
   * @param {number} page 页码
   */
  loadPage(page) {
    this.proxy.page = page;
    return this.loadByProxy();
  }

  /**
   * 数据源对象改变页码和参数
   *
   * @param {number} page
   *  @param {any} params
   */
  loadPageByParams(page, params) {
    const me = this,
      proxy = me.proxy;
    me.proxy.page = page;
    proxy.params = me.getLoadParams(params);
    return me.loadByProxy();
  }

  /**
   * 刷新数据源对象，用于编辑/删除后调用
   * 编辑后直接重载数据，页码不变
   * 新增后直接重新加载数据，页码重置为1
   * 删除后根据剩余数据总数和页面等灵活设置页码，不变或减1
   * @param {object} {
   *  state = 1, 1编辑/2删除
   *  delCount = 1 删除了几条数据
   * }
   */
  refresh({ state = 1, delCount = 1 } = {}) {
    let page = this.proxy.page;

    if (state == 2 && page > 1) {
      // 如果是删除并且页码大于1
      // 获取删除后当前数据总数
      const count = this.proxy.total - delCount;
      // 获取当前每页数据数
      const pageSize = this.proxy.pageSize;

      // 如果删除后当前页面无数据，页码减1
      if ((page - 1) * pageSize >= count) {
        page--;
        // 页码最小为1
        page = page < 1 ? 1 : page;
      }
    }

    return this.loadPage(page);
  }
}
