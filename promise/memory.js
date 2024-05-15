import { mixin, orderBy, get, slice, defaultsDeep, filter, isPlainObject, remove, findIndex } from 'lodash';
import { clearObject } from '../utils';
// 默认配置参数
const defaultProxy = {
  // 清除分页参数
  clearPageParams: true
};

/**
 * 数组交换位置
 *
 * @export
 * @param {*} arr 数组
 * @param {*} oldIndex 旧位置
 * @param {*} newIndex 新位置
 */
export function swapArray(arr, oldIndex, newIndex) {
  const page = arr[oldIndex];
  arr.splice(oldIndex, 1);
  arr.splice(newIndex, 0, page);
}

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
    store.memoryData = [];
    store.pgingData = [];
  },
  /**
   * 将数据保存到内存代理中，然后分页处理
   *
   * @param {object} data - 数据
   */
  loadData(data) {
    const me = this;
    // 将拉取到的数据保存到内存中
    me.memoryData = data;
    me.pgingData = data;
    me.loadByProxy();
  },
  /**
   * 将数据追加到内存代理中
   *
   * @param {*} data -数据
   * @param {boolean} isReLoad - 是否是重新加载
   */
  pushData(data, isReLoad) {
    const me = this;
    me.memoryData.push(data);
    me.pgingData.push(data);
    if (isReLoad) {
      me.loadData(me.memoryData);
    }
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
        me.pgingData = data;
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
    let pgingData = me.pgingData;
    if (page == 1) {
      // 页码为1时根据排序配置重新排序
      // 排序字段
      const field = get(sortData, proxy.sortParam);
      if (field) {
        // 排序方式
        const order = get(sortData, proxy.directionParam);
        // 重设数据源
        me.pgingData = pgingData = orderBy(pgingData, field, order);
      }
    }
    // 内存数据起始序号
    const start = (page - 1) * pageSize;
    // 获取当前页码数据
    const data = slice(pgingData, start, start + pageSize);
    // 返回数据
    return {
      data,
      total: pgingData.length
    };
  },
  /**
   * predicate（断言函数）,如果predicat是纯对象，那么返回过滤空条件后的对象。
   *
   * @param {Object} predicat - predicat 断言函数
   * @return {Object} 处理结果
   */
  getPredicate(predicat) {
    if (isPlainObject(predicat)) {
      // 过滤空条件
      predicat = clearObject(predicat);
    }
    return predicat;
  },
  /**
   * 通过 predicate（断言函数） 从内存数据中过滤数据
   *
   * @export
   * @param {Array|Function|Object|String} predicat 断言函数
   */
  filter(predicat) {
    predicat = this.getPredicate(predicat);
    // 过滤数据
    const data = filter(this.memoryData, predicat);
    // 将过滤后的数据保存到分页数据中
    this.pgingData = data;
    // 加载到第一页
    this.loadPage(1);
  },
  /**
   * 通过 predicate（断言函数） 从内存数据中删除数据
   *
   * @export
   * @param {Array|Function|Object|String} predicat 断言函数
   */
  remove(predicat) {
    predicat = this.getPredicate(predicat);
    // 移除数据
    const data = remove(this.memoryData, predicat);
    remove(this.pgingData, predicat);
    this.refresh({ state: 2, delCount: data.length });
  },
  /**
   * 从内存数据中删除指定 id 数据
   *
   * @param {Array} ids - 要删除的 id 数组。
   * @param {string} [key='id'] - 用于查找每个对象中 id 的键。
   */
  removeByIds(ids = [], key = 'id') {
    this.remove((item) => {
      const id = get(item, key);
      const is = ids.includes(id);
      if (is) {
        remove(ids, (item) => item == id);
      }
      return is;
    });
  },
  /**
   * 清空所有数据
   */
  removeAll() {
    this.loadData([]);
  },
  /**
   * 根据相对序号获取实际序号
   *
   * @export
   * @param {Number} index 相对序号
   */
  getRealIndex(index) {
    const { page, pageSize } = this.proxy;
    const pgingIndex = (page - 1) * pageSize + index;
    const memoryIdex = findIndex(this.memoryData, this.pgingData[pgingIndex]);
    return { memoryIdex, pgingIndex };
  },
  /**
   * 更改序号
   *
   * @param {number} newIndex - 元素的新位置索引(当前分页)
   * @param {number} oldIndex - 元素当前的位置索引(当前分页)
   * @return {void}
   */
  changeSort(newIndex, oldIndex) {
    const { memoryData, pgingData } = this;
    // 获取真实索引
    const { memoryIdex: newMemoryIdex, pgingIndex: newPgingIndex } = this.getRealIndex(newIndex);
    const { memoryIdex, pgingIndex } = this.getRealIndex(oldIndex);
    // 交换位置
    swapArray(memoryData, memoryIdex, newMemoryIdex);
    swapArray(pgingData, pgingIndex, newPgingIndex);
  },

  /**
   * 通过索引移除数据
   *
   * @param {number} index - 要移除的项目的索引(当前分页)
   * @return {void}
   */
  removeItemByIndex(index) {
    const { memoryIdex, pgingIndex } = this.getRealIndex(index);
    // 删除数据
    this.memoryData.splice(memoryIdex, 1);
    this.pgingData.splice(pgingIndex, 1);
    // 刷新数据
    this.refresh({ state: 2 });
  },
  /**
   * 获取所有数据
   */
  getAllData() {
    return this.memoryData;
  }
};
