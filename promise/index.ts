
import { mixin, set, isFunction, defaultsDeep } from "lodash";
import classic from "./classic";
import modern from "./modern";
// 默认配置参数
const defaultProxy = {
    // 每次加载几条数据，默认为10
    pageSize: 10,
    // 当前页码，默认为1
    page: 1,
    // 数据总数，禁止更改
    total: 0,
    // 分页每页显示条数字段名称，默认为limit，此参数传递到请求数据函数
    limitParam: 'limit',
    // 分页页码字段名称，默认为page，此参数传递到请求数据函数
    pageParam: 'page'
};
// 通过Promise函数请求数据代理
export default {
    /**
       * 初始化
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
        console.log('proxy.promise.init', proxy);
        // 根据代理类型挂载代理对象
        // 默认挂载经典代理
        switch (proxy.type) {
            case 'modern':
                mixin(store, modern);
                break;
            default:
                classic.init(store);
                break;
        }
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
       * 这里不接收params是为了避免调整页码等参数时需要传参
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
            } = proxy;
            let { params = {}} = proxy;
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
    },
    /**
    * 数据源对象加载数据，页码重置为1
    *
    */
    subLoad() {
        const me = this as any;
        me.proxy.page = 1;
        me.loadByProxy();
    }
}