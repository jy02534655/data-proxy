import { set, get, defaults } from "lodash";
// 用于web请求数据，web端数据一般为重置模式
export default {
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
                page,
                paginationParam
            } = proxy
            // 读取参数
            const params = proxy.params || {};
            // 设置分页相关参数
            set(params, proxy.limitParam, pageSize);
            set(params, proxy.pageParam, page);
            // 设置代理参数
            proxy.params = params;
            console.log(proxy.extraParams)
            // console.log(proxy, params)
            // 读取数据
            me.readData(proxy).then((res: any) => {
                me.data = res.data;
                // 获取并更新分页配置，用于分页组件处理数据
                const pagination = defaults({
                    total: res.total,
                    limit: pageSize,
                    curr: page
                }, get(me, paginationParam));
                // 更新分页配置
                set(me, proxy.paginationParam, pagination);
                // 获取数据成功
                me.loadEnd(proxy, {
                    res
                })
            }).catch((res: any) => {
                // 获取数据失败
                me.loadEnd(proxy, {
                    isError: true,
                    res
                })
            })
        }
    },
    /**
     * 数据源对象改变每页显示条数，页码重置为1
     *
     * @param {number} page
     */
    loadPageSize(pageSize: number) {
        const me = this as any;
        me.proxy.pageSize = pageSize;
        me.proxy.page = 1;
        me.loadByProxy();
    },
    /**
     * 数据源对象改变页码
     *
     * @param {number} page
     */
    loadPage(page: number) {
        const me = this as any;
        me.proxy.page = page;
        me.loadByProxy();
    },
    /**
     * 刷新数据源对象，用于编辑/新增/删除后调用
     * 编辑后直接重载数据，页码不变
     * 新增后直接重新加载数据，页码重置为1
     * 删除后根据剩余数据总数和页面等灵活设置页码，不变或减1
     *
     * @param {*} [{ isDel = false 是否删除数据, isAdd = false 是否新增数据}={}]
     */
    refresh({ isDel = false, isAdd = false } = {}) {
        const me = this as any,
            proxy = me.proxy;
        // 获取当前页码
        let page = proxy.page;
        if (isDel) {
            // 如果是删除并且页码大于1
            if (page > 1) {
                // 获取删除后当前数据总数
                const count = me.pagination.total - 1,
                    // 获取当前每页数据数
                    pageSize = proxy.pageSize;
                // 如果删除后当前页面无数据，页码减1
                if ((page - 1) * pageSize >= count) {
                    page--;
                }
            }
        } else if (isAdd) {
            // 新增后直接到第一页
            page = 1;
        }
        me.loadPage(me, page);
    }
}