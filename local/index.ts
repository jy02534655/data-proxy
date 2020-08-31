import low from 'lowdb'
import LocalStorage from 'lowdb/adapters/LocalStorage'
import { mixin, defaultsDeep, set, debounce } from "lodash";

// 默认配置参数
const defaultProxy = {
    // 本地默认数据库名称
    dbName: 'ux-local-data',
    // 本地存储路径，必填
    path: ''
};
export default {
    /**
     * 初始化,每个数据源对象必须初始化
     *
     * @param {*} store,数据源对象
     */
    init(store: any) {
        const me = this as any,
            proxy = store.proxy;
        // 读取并设置默认配置，默认配置会被新配置覆盖
        defaultsDeep(proxy, defaultProxy);
        // 将当前代理对象的函数挂载到数据源对象，代理对象的函数会覆盖代理对象原有的函数
        mixin(store, me);
        // 初始化数据库对象
        const db = low(new LocalStorage(proxy.dbName));
        // 初始化数据库
        db.defaults({}).write();
        // 数据源对象绑定数据库对象
        store.db = db;
        // console.log('proxy.local.init', me.proxy);
    },
    /**
    * 数据源对象加载数据，页码重置为1
    *
    */
    subLoad() {
        const me = this as any,
            proxy = me.proxy;
        // 先请求数据，如果没有设置请求方法或者获取数据失败则转为读取本地数据
        me.readData(proxy).then(({ data }:any) => {
            me.data = data;
        }).catch(() => {
            const data = me.db.get(me.proxy.path).value();
            if (data) {
                me.data = data;
            }
        });
    },
    /**
     * 保存配置
     *
     */
    saveData() {
        const me = this as any,
            proxy = me.proxy,
            path = me.proxy.path,
            localData = me.data;
        // console.log('saveData', localData)
        // 先保存数据，如果没有设置保存数据方法或者保存数据数据失败则转为读取本地保存数据
        me.readData({
            requestFun: proxy.saveFun,
            params: {
                path: path,
                data: JSON.stringify(localData)
            },
            reader: proxy.reader
        }).catch(() => {
            me.db.set(`${path}`, localData).write();
        });
    },
    /**
     * 保存某个配置，默认1秒内只会执行saveData方法一次,避免高频调用
     *
     * @param {string} name 字段名称
     * @param {*} data 值
     * @param {number} [wait=1000] 防抖动时间，毫秒
     */
    saveDataByDebounce(name: string, data: any, wait: number = 1000) {
        const me = this as any,
            localData = me.data;
        // 将新值缓存
        set(localData, name, data);
        let debounceFun = me.debounceFun;
        // console.log('saveDataByDebounce', localData)
        if (!debounceFun) {
            // 检查是否有防抖函数，没有则创建一个
            debounceFun = me.debounceFun = debounce(function() {
                me.saveData();
            }, wait)
        }
        debounceFun();
    }
}