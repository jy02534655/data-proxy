import { set, get, defaults } from "lodash";
// 用于web请求数据，web端数据一般为重置模式
export default {
    /**
     * 读取并处理数据
     *
     */
    beforeReadData() {
        const me = this as any;
        me.afterReadData().then(({ data, total }) => {
            me.data = data;
            const proxy = me.proxy, {
                pageSize,
                page,
                paginationParam
            } = proxy;
            // 获取并更新分页配置，用于分页组件处理数据
            const pagination = defaults({
                total: total,
                limit: pageSize,
                curr: page
            }, get(me, paginationParam));
            // 更新分页配置
            set(me, proxy.paginationParam, pagination);
            // 调用总代理数据加载结束函数
            me.loadEnd();
        }).catch((res: any) => {
            // 调用总代理数据加载结束函数
            me.loadEnd(res)
        })
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