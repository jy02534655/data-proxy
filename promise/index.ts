
import { mixin, set, get, forEach, isFunction } from "lodash";
import classic from "./classic";
import modern from "./modern";
// 通过Promise函数请求数据代理
export default {
    /**
       * 初始化
       *
       * @param {*} store,数据源对象
       */
    init(store: any) {
        console.log('proxy.promise.init');
        // 将当前代理对象的函数挂载到数据源对象，代理对象的函数会覆盖代理对象原有的函数
        mixin(store, this);
        // 根据代理类型挂载代理对象
        // 默认挂载经典代理
        switch (store.proxy.type) {
            case 'modern':
                mixin(store, modern);
                break;
            default:
                mixin(store, classic);
                break;
        }
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
    }) {
        return new Promise((resolve, reject) => {
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
        });
    },
    /**
     * 读取数据并做通用逻辑处理，由子代理实现具体细节
     *
     * @returns
     */
    afterReadData() {
        return new Promise((resolve, reject) => {
            const me = this as any,
                proxy = me.proxy;
            me.readData(proxy).then(({ data, total }) => {
                proxy.total = total;
                // 如果当前标识为重载数据，重置标识状态为false，预留扩展
                if (proxy.isReLoad) {
                    proxy.isReLoad = false;
                }
                resolve({ data, total });
            }).catch((res: any) => {
                // 数据加载结束
                reject({
                    isError: true,
                    res
                })
            })
        });
    },
    /**
       * 根据代理配置加载数据
       *
       */
    loadByProxy() {
        const me = this as any,
            proxy = me.proxy;
        // 当前代理状态
        console.log('proxy isLoading', proxy.isLoading);
        // 如果正在请求数据，不做任何操作，过滤高频请求
        if (!proxy.isLoading) {
            // 标识正在请求数据
            proxy.isLoading = true;
            // 读取store配置
            const {
                pageSize,
                page
            } = proxy
            // 读取参数
            let params = proxy.params || {};
            // 设置分页相关参数
            set(params, proxy.limitParam, pageSize);
            set(params, proxy.pageParam, page);
            // 如果有请求数据前处理请求参数函数，执行它
            if (isFunction(me.writerTransform)) {
                // 有时候需要在请求前处理参数
                params = me.writerTransform(params, proxy);
            }
            // 设置代理参数
            proxy.params = params;
            console.log('extraParams', proxy.extraParams);
            // 读取并处理数据，调用预留函数，让子代理实现具体逻辑
            me.beforeReadData();
        }
    }
}