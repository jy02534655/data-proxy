import { mixin, get, forEach, isFunction } from "lodash";
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
        // 将当前代理对象的方法挂载到数据源对象，代理对象的方法会覆盖代理对象原有的方法
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
     *         requestFun 获取数据的方法，必须返回Promise函数对象
     *         params 获取数据的方法所需的参数
     *         disposeItem 扩展 处理单个数据对象的函数
     *         reader 读取数据相关配置
     *     }
     * @returns
     */
    readData({
        requestFun, params, disposeItem, reader
    }) {
        return new Promise((resolve, reject) => {
            // 通过代理方法获取数据
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
                        // 获取数据总数
                        total = get(res, totalProperty);
                    // 如果有遍历单条数据的方法，那么遍历处理数据
                    if (disposeItem) {
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
    }
}