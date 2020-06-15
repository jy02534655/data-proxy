// 用于移动端请求数据，移动端数据一般为追加模式
export default {
    /**
     * 读取并处理数据
     *
     */
    beforeReadData() {
        const me = this as any, proxy = me.proxy,
            page = proxy.page;
        if (page === 1) {
            // 如果页码为1,先清空数据，保证滚动条在顶部
            me.data = []
        }
        if (page !== 1 && me.data.length >= proxy.total) {
            console.log('无更多数据,数据加载结束')
            // 如果不是加载第一页,那么说明现在是上拉加载更多
            // 如果store的数据大于或者等于数据总数,说明没有更多数据了,无须请求服务端数据
            me.modernAfterReadData();
        } else {
            me.afterReadData().then(({ data }) => {
                me.data.push(...data);
                // 数据加载结束
                me.modernLoadEnd();
            }).catch((res: any) => {
                // 数据加载结束
                me.modernAfterReadData(res)
            })
        }
    },
    // 加载store下一页
    // store:数据源（必填）
    loadNext() {
        const me = this as any,
            proxy = me.proxy,
            page = proxy.page
        // 如果正在加载，终止
        if (page && !proxy.isLoading) {
            proxy.page = page + 1
            me.loadByProxy()
        }
    },
    /**
    * 数据加载结束,需要在数据代理中绑定一系列状态
    * 用于移动端处理 交互业务
    *
    * @param {*} [{ res = {}, isError = false }={}]
    */
    modernAfterReadData({ res = {}, isError = false } : any = {}) {
        const me = this as any;
        if (!isError) {
            // 判断是否需要加载更多数据
            let isFinished = false;
            if (me.data.length >= me.proxy.total) {
                isFinished = true;
            }
            // 是否还有更多数据需要加载
            me.isFinished = isFinished;
            console.log('isFinished', isFinished);
        }
        // 标识请求数据状态
        // 是否加载失败
        me.isError = isError;
        // 是否处于加载状态
        me.isVanLoading = false;
        // 调用总代理数据加载结束函数
        me.loadEnd({ res, isError });
    }
}