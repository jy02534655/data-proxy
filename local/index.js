import { BaseProxy } from '../core/base';
import low from 'lowdb';
import LocalStorage from 'lowdb/adapters/LocalStorage';
import { set, debounce, defaultsDeep } from 'lodash';

// 默认配置参数
const defaultProxy = {
  // 本地默认数据库名称
  dbName: 'ux-local-data',
  // 本地存储路径，必填
  path: ''
};

/**
 * 本地存储代理类
 * 支持数据本地持久化存储，可以配合服务端存储使用
 */
export class LocalProxy extends BaseProxy {
  constructor(store) {
    defaultsDeep(store.proxy, defaultProxy);
    super(store);
    this.initDatabase();
  }

  /**
   * 初始化本地数据库
   */
  initDatabase() {
    const proxy = this.proxy;
    // 初始化数据库对象
    const db = low(new LocalStorage(proxy.dbName));
    // 初始化数据库
    db.defaults({}).write();
    // 数据源对象绑定数据库对象
    this.store.db = db;
  }

  /**
   * 加载数据
   */
  subLoad() {
    const me = this;
    const proxy = me.proxy;

    // 先尝试从服务器请求数据
    me.readData(proxy)
      .then(({ data }) => {
        me.store.data = data;
      })
      .catch(() => {
        // 如果失败则从本地读取
        const data = me.store.db.get(proxy.path).value();
        if (data) {
          me.store.data = data;
        }
      });
  }

  /**
   * 保存数据到本地
   */
  saveData() {
    const me = this;
    const proxy = me.proxy;
    const path = proxy.path;
    const localData = me.store.data;

    // 先尝试保存到服务器
    me.readData({
      requestFun: proxy.saveFun,
      params: {
        path: path,
        data: JSON.stringify(localData)
      },
      reader: proxy.reader
    }).catch(() => {
      // 如果失败则保存到本地
      me.store.db.set(path, localData).write();
    });
  }

  /**
   * 保存某个配置项，使用防抖动
   * @param {string} name 字段名称
   * @param {*} data 值
   * @param {number} wait 防抖动时间(毫秒)
   */
  saveDataByDebounce(name, data, wait = 1000) {
    const me = this;
    const localData = me.store.data;

    // 更新数据
    set(localData, name, data);

    // 创建或使用已有的防抖函数
    if (!me.debounceFun) {
      me.debounceFun = debounce(() => {
        me.saveData();
      }, wait);
    }

    me.debounceFun();
  }
}
