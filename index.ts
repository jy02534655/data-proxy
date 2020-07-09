import promiseProxy from "./promise/index";
import localProxy from "./local/index";
import util from './utils/index'
import { cloneDeep, isObjectLike, mixin, defaultsDeep, split, isFunction, drop, defaults, get, set, forEach } from "lodash";

// 数据源对象可用配置
// const defaultStore = {
//     // 扩展，请求失败后执行函数
//     failure: null,
//     // 扩展，请求数据前处理请求参数函数
//     writerTransform: null,
//     // 扩展，请求数据成功后处理数据结果函数
//     readerTransform: null
// }
// promise.modern代理数据源可用状态
// const defaultStore = {
//     // 是否加载完数据，所有数据加载完成就会变成true，可以修改
//     isFinished: false,
//     // 是否加载失败，禁止修改
//     isError: false,
//     // 是否处于加载状态，可以修改
//     isVanLoading: false
// }
// 默认配置参数
const defaultProxy = {
    // 代理类型，默认为经典代理
    type: 'promise.classic',
    // 默认参数,默认参数会被相同名称新参数覆盖，此参数传递到请求数据函数
    defaultParams: null,
    // 初始化后是否自动加载数据
    autoLoad: false,
    // 扩展 处理单个数据对象的函数
    disposeItem: null,
    // 读取数据相关配置
    reader: {
        // 数据根节点名称
        rootProperty: "data",
        // 判断请求是否成功的节点名称
        successProperty: "success",
        // 数据总数节点名称
        totalProperty: "total",
        // 请求失败后失败消息节点名称
        messageProperty: 'message'
    },
    // 排序字段名称
    sortParam: 'orderBy',
    // 排序方式字段名称
    directionParam: 'orderSort'
};
// 这是一个数据代理
// 俄罗斯套娃模式，支持向上向下扩展
// 数据源对象
// store={};
// 数据源对象挂载代理
// proxy.init(store);
// 数据源对象加载数据
// store.load(); => {data:[]}
export default {
    /**
     * 初始化,每个数据源对象必须初始化
     *
     * @param {*} store,数据源对象
     */
    init(store: any) {
        console.log('proxy.init');
        const me = this as any,
            // 代理配置
            proxy = store.proxy,
            // 读取代理类型，用.分割
            key = split(proxy.type, '.');
        // 读取并设置默认配置，默认配置会被新配置覆盖
        defaultsDeep(proxy, defaultProxy);
        // 将当前代理对象的函数挂载到数据源对象，代理对象的函数会覆盖代理对象原有的函数
        mixin(store, me);
        console.log('proxy.init', proxy);
        // 设置下一级代理类型
        proxy.type = drop(key).toString();
        // 根据代理类型第一级挂载代理对象
        switch (key[0]) {
            // 本地与远程代理
            case 'local':
                localProxy.init(store);
                break;
            // 经典代理
            default:
                // 初始化代理对象
                promiseProxy.init(store);
                break;
        }
        // 根据配置决定是否自动加载数据
        if (proxy.autoLoad) {
            store.load();
        }
    },
    /**
     * 数据加载结束执行
     *
     * @param {*} { res 请求失败结果数据集, isError = false 是否加载失败}
     */
    loadEnd({ res = {}, isError = false }: any = {}) {
        console.log('loadEnd');
        console.log('res:', res);
        console.log('isError:', isError);
        const me = this as any;
        // 标识请求数据完成
        me.proxy.isLoading = false;
        // 如果数据加载失败
        if (isError) {
            // 如果有请求失败执行函数，执行它
            if (isFunction(me.failure)) {
                // 有时候请求失败需要额外的处理逻辑
                me.failure(res);
            }
        }
    },
    /**
     * 数据源对象加载数据
     * promise.开头的代理页码会重置为1
     * local代理如果没有配置requestFun会根据dbName与path配置读取本地数据
     *
     * @param {*} [params] 查询参数
     */
    load(params?: any) {
        const me = this as any,
            proxy = me.proxy,
            // 获取默认参数
            { defaultParams, sortData } = proxy;
        if (params) {
            // 深度拷贝并处理掉空数据，避免数据变化引起bug
            params = util.clearObject(cloneDeep(params));
        }
        // 如果存在默认参数,则添加默认参数
        if (isObjectLike(defaultParams)) {
            // 默认参数会被新参数覆盖
            params = defaults(params, defaultParams);
        }
        // 存储参数（排除分页参数与排序参数）
        proxy.extraParams = cloneDeep(params);
        // 如果存在排序参数,则添加排序参数
        if (isObjectLike(sortData)) {
            // 默认参数会被新参数覆盖
            params = defaults(params, sortData);
        }
        proxy.params = params;
        // 数据源对象加载数据，调用预留函数，让子代理实现具体逻辑
        me.subLoad();
    },
    /**
     * 数据源对象重载数据，promise.开头的代理页码会重置为1
     * promise.开头的代理页码会重置为1
     * local代理如果没有配置requestFun会根据dbName与path配置读取本地数据
     */
    reLoad() {
        const me = this as any;
        // 标识当前为重载数据，预留扩展
        me.proxy.isReLoad = true;
        me.load(me.proxy.extraParams);
    },
    /**
     * 排序
     *
     * @param {*} { field 排序字段, order 排序方式}
     */
    sort({ field, order }: any) {
        const me = this as any, proxy = me.proxy, sortParam = {};
        set(sortParam, proxy.sortParam, field);
        set(sortParam, proxy.directionParam, order);
        proxy.sortData = sortParam;
        me.load(me.getParams());
    },
    /**
     * 清除排序
     *
     */
    clearSort() {
        const me = this as any, proxy = me.proxy;
        proxy.sortData = null;
        me.load(me.getParams());
    },
    /**
     * 获取当前参数（排除分页参数）
     *
     * @returns
     */
    getParams() {
        return (this as any).proxy.extraParams;
    },
    /**
    *
    *
    * @param {*} {
    *         requestFun 获取数据的函数，必须返回Promise函数对象
    *         params 获取数据的函数所需的参数
    *         disposeItem 扩展 处理单个数据对象的函数
    *         reader 读取数据相关配置
    *     }
    * @returns 成功回调 resolve({ data, total }); data数据结果集
    *          失败回调 reject({
                   message: '您的网络不佳,请检查您的网络'
               }) message 提示
    */
    readData({
        requestFun, params, disposeItem, reader
    }: any = {}) {
        return new Promise((resolve, reject) => {
            if (!requestFun) {
                // 失败回调
                reject({
                    isNoFun: true
                })
            } else {
                // 通过代理函数获取数据
                requestFun(params).then((res: any) => {
                    const me = this as any,
                        // 读取数据相关配置
                        {
                            // 数据根节点名称
                            rootProperty,
                            // 用于判断请求是否成功的节点名称
                            successProperty,
                            // 数据总数节点名称
                            totalProperty,
                            // 请求失败后失败消息节点名称
                            messageProperty } = reader;
                    // 如果有请求数据成功后处理数据结果函数，执行它
                    if (isFunction(me.readerTransform)) {
                        // 有时候后端返回的数据可能并不符合规范，可以用这个扩展函数处理一下
                        res = me.readerTransform(res);
                    }
                    // 获取请求数据结果状态
                    const success = get(res, successProperty);
                    if (success) {
                        // 获取数据
                        const data = get(res, rootProperty),
                            // 获取数据总数，如果后端没有返回数据总数，默认为当前请求的数据总数
                            total = get(res, totalProperty) || data.length;
                        // 如果有遍历单条数据的函数，那么遍历处理数据
                        if (isFunction(disposeItem)) {
                            forEach(data, disposeItem);
                        }
                        // 成功回调
                        resolve({ data, total });
                    } else {
                        // 失败回调
                        reject({
                            message: get(res, messageProperty)
                        });
                    }
                }).catch(() => {
                    // 失败回调
                    reject({
                        message: '您的网络不佳,请检查您的网络'
                    })
                });
            }
        });
    }
}