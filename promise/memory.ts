import { mixin, orderBy, get, set, slice } from "lodash";
// 多用于web端获取数据，新数据会覆盖原有数据
export default {
    /**
    * 初始化,每个数据源对象必须初始化
    *
    * @param {*} store,数据源对象
    */
    init(store: any) {
        const me = this as any;
        // 将当前代理对象的函数挂载到数据源对象，代理对象的函数会覆盖代理对象原有的函数
        mixin(store, me);
        // 基于classic扩展，所以这里我们可以直接通过定义requestFun来返回数据，这样可以复用一些方法
        store.proxy.requestFun = function () {
            return new Promise((resolve) => {
                const proxy = store.proxy, {
                    pageSize, page, sortData
                } = proxy, start = (page - 1) * pageSize, {
                    // 数据根节点名称
                    rootProperty,
                    // 用于判断请求是否成功的节点名称
                    successProperty,
                    // 数据总数节点名称
                    totalProperty } = proxy.reader;
                // 从数据源中获取数据
                let memoryData = store.memoryData;
                if (page == 1) {
                    // 页码为1时根据排序配置重新排序
                    // 排序字段
                    const field = get(sortData, proxy.sortParam);
                    if (field) {
                        // 排序方式
                        const order = get(sortData, proxy.directionParam);
                        // 重设数据源
                        store.memoryData = memoryData = orderBy(memoryData, field, order);
                    }
                }
                // 返回数据
                const result = {};
                // 结果状态字段
                set(result, successProperty, true);
                // 结果集字段
                set(result, rootProperty, slice(memoryData, start, start + pageSize));
                // 结果总数字段
                set(result, totalProperty, memoryData.length);
                // 返回数据
                resolve(result);
            });
        }
    },
    /**
     * 设置数据
     *
     * @param {*} data 数据
     */
    setData(data: any) {
        const me = this as any;
        me.memoryData = data;
    },
    /**
     * 设置数据并排序
     *
     * @param {*} data 数据
     * @param {*} { field 排序字段, order 排序方式}
     */
    setDataAndSort(data: any, { field, order }: any) {
        const me = this as any;
        me.setData(data);
        me.sort({ field, order });
    }
}