import { PromiseProxy } from './index';

/**
 * 现代代理类
 * 用于移动端请求数据，移动端数据一般为追加模式
 */
export class ModernProxy extends PromiseProxy {
  /**
   * 读取并处理数据
   */
  promiseReadDataEnd() {
    const me = this;
    const proxy = me.proxy;
    const page = proxy.page;

    // 重置加载完成状态
    me.store.isFinished = false;

    if (page === 1) {
      // 如果页码为1,先清空数据，保证滚动条在顶部
      me.store.data = [];
    }

    if (page !== 1 && me.store.data.length >= proxy.total) {
      // 如果不是加载第一页,那么说明现在是上拉加载更多
      // 如果store的数据大于或者等于数据总数,说明没有更多数据了,无须请求服务端数据
      me.modernLoadEnd();
    } else {
      me.readDataEnd()
        .then(({ data }) => {
          // 在移动端是追加数据
          me.store.data.push(...data);
          // 数据加载结束
          me.modernLoadEnd();
        })
        .catch((res) => {
          // 数据加载结束
          me.modernLoadEnd(res);
        });
    }
  }

  /**
   * 数据加载结束,需要在数据代理中绑定一系列状态
   * 用于移动端处理 交互业务
   * @param {object} { res = {}, isError = false } 加载结果
   */
  modernLoadEnd({ res = {}, isError = false } = {}) {
    const me = this;

    if (!isError) {
      // 判断是否需要加载更多数据
      let isFinished = false;
      if (me.proxy.total >= 0 && me.store.data.length >= me.proxy.total) {
        isFinished = true;
      }
      // 是否还有更多数据需要加载
      me.store.isFinished = isFinished;
    }

    // 标识请求数据状态
    // 是否加载失败
    me.store.isError = isError;
    // 调用总代理数据加载结束函数
    me.loadEnd({ res, isError });
  }
}
