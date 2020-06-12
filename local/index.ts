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

    },
    /**
    * 数据源对象加载数据，页码重置为1
    *
    */
    subLoad() {
        this.loadByProxy();
    },
    loadByProxy() {
        const me = this as any,
            proxy = me.proxy;
        me.readData(proxy).then(({ data }) => {
        }).catch((res: any) => {

        })
    },
    afterReadData() {
        return new Promise((resolve, reject) => {

        });
    }
}