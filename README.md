# 说明

这是一个数据代理扩展，灵感来至于ExtJs中的Ext.data.Store

git地址:[https://github.com/jy02534655/data-proxy](https://github.com/jy02534655/data-proxy)

# 更新日志

## [1.1.5] - 2021-06-10

### 变更

* promise.开头代理`clearEmpty` 配置改为 `clearPageParams`

### 新增

* promise.开头代理新增新增 `clearPageParams` 配置

## [1.1.4] - 2021-06-08

### 变更

* `lodaByDefaultParams` 方法新增参数
* 变更 `lodash` 依赖版本

### 新增

* 新增 `reader.otherProperty` 配置
* promise.开头代理新增 `clearEmpty` 配置
* 新增 `appendsDefaultParamsAndLoad`方法
* 新增 `removeParamsAndReLoad`方法
* 新增 `getAllparams`方法

### 优化

* 优化帮助类 `isEmpty` 方法

# 安装代理模块
npm install ux-data-proxy

# 使用
请求数据的方法与返回的数据需要遵循以下规则

1. 此帮助类只是一个代理类，具体分页、查询、排序功能函数还是需要axios等扩展来实现，但是因为设计时考虑了扩展性，可以自定义一些扩展来实现请求数据的功能

1. 返回数据必须是标准json格式数据，并且有以下字段，对应字段名称可以在reader配置中灵活配置，如果返回数据不标准可以用readerTransform函数处理成表格格式

    1. success -> 用于判断请求是否成功
    1. data -> 最终数据结果集
    1. total -> 满足当前条件的数据总数，用于分页
    1. message -> 用于请求失败消息提示

假如后端返回数据格式如下，使用axios请求数据并不做任何处理
```js
{
    "code": 1,
    "msg": "查询成功",
    "data": {
        "records": [{
            "id": 119,
            "name": "的鹅鹅鹅饿鹅",
            "telephone": "18888888888"
        }, {
            "id": 118,
            "name": "未命名",
            "telephone": "18899999999"
        }],
        "total": 62
    }
}
```
代理中reader配置如下即可
```js
    reader: {
        // 数据根节点
        rootProperty: "data.data.records",
        successProperty: "data.code",
        totalProperty: "data.data.total",
        messageProperty: 'data.data.msg'
    }
```

## promise.classic代理实现分页查询等
vue代码如下（ts写法）
```js
<template>
    <div>
        <div>
            <!-- 省略查询html代码 -->
        </div>
        <el-table
            :data="tableList.data"
        >
            <!-- 省略代码 -->
        </el-table>
        <el-pagination
            @size-change="onSizeChange"
            @current-change="onCurrentChange"
            :current-page="tableList.pagination.curr"
            :page-sizes="[5, 10, 20 ,30]"
            :page-size="tableList.pagination.limit"
            :total="tableList.pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
        ></el-pagination>
    </div>
</template>
<script lang='ts'>
import { Component, Vue } from "vue-property-decorator";
import { Action } from "vuex-class";
import proxy from "ux-data-proxy";
@Component({
    name: "GridDemo"
})
export default class GridDemo extends Vue {
    // 定义在vuex中的请求数据方法，只要返回的是Promise类型即可
    @Action("list") gridList: any;
    // 预留配置-列表配置
    // 列表代理对象
    tableList: any = {
        // 列表数据源
        data: [],
        // 代理配置
        proxy: {
            // 请求数据方法
            requestFun: this.gridList,
            // 分页每页显示条数字段名称，默认为limit，此参数传递到服务端
            limitParam: "pageSize",
            // 分页页码字段名称，默认为page，此参数传递到服务端
            pageParam: "current",
            // 初始化后自动加载数据
            autoLoad: true,
            // 读取数据相关配置
            reader: {
                // 数据根节点
                rootProperty: "data.data.records",
                successProperty: "data.code",
                totalProperty: "data.data.total",
                messageProperty: "data.data.msg"
            }
        }
    };

    created() {
        // 初始化数据代理对象
        proxy.init(this.tableList);
    }

    // 每页显示数量变化
    onSizeChange(pageSize: number) {
        this.proxySizeChange(pageSize);
    }

    // 页码发生变化
    onCurrentChange(page: number) {
        this.proxyCurrentChange(page);
    }

    //根据条件查询
    proxyQuery(params: any, tabName = "tableList") {
        // console.log("onSizeChange", pageSize);
        this[tabName].load(params);
    }

    //每页显示数量变化
    proxySizeChange(pageSize: number, tabName = "tableList") {
        // console.log("onSizeChange", pageSize);
        this[tabName].loadPageSize(pageSize);
    }

    // 页码发生变化
    proxyCurrentChange(page: number, tabName = "tableList") {
        // console.log("onCurrentChange", page);
        this[tabName].loadPage(page);
    }
}
</script>
```
## promise.classic+local代理 实现分页，表列头可配置并保存配置到本地
vue代码如下（ts写法）
```js
<template>
    <div>
        <div>
            <!-- 省略查询html代码 -->
        </div>
        <!-- https://xuliangzhan_admin.gitee.io/vxe-table/#/table/start/install  查看vxe-grid使用方法-->
        <vxe-grid
            id="CustomerGrid"
            height="100%"
            border
            show-overflow
            column-key
            align="center"
            class="grid"
            ref="xTable"
            :toolbar="tableList.toolbar"
            :data="tableList.data"
            :columns="tableList.column"
            :seq-config="{seqMethod: seqMethod}"
            :custom-config="{checkMethod:checkMethod}"
            :highlight-hover-row="true"
            @custom="onCustomChange"
        ></vxe-grid>
        <el-pagination
            @size-change="onSizeChange"
            @current-change="onCurrentChange"
            :current-page="tableList.pagination.curr"
            :page-sizes="[5, 10, 20 ,30]"
            :page-size="tableList.pagination.limit"
            :total="tableList.pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
        ></el-pagination>
    </div>
</template>
<script lang='ts'>
import { Component, Vue, Watch } from "vue-property-decorator";
import { Action } from "vuex-class";
import proxy from "ux-data-proxy";
import Sortable from "sortablejs";
import { flatMap, find, sortBy, compact, isEmpty } from "lodash";
@Component({
    name: "GridDemo"
})
export default class GridDemo extends Vue {
    // 定义在vuex中的请求数据方法，只要返回的是Promise类型即可
    @Action("list") gridList: any;
    // 预留配置-列表配置
    // 列表代理对象
    tableList: any = {
        //支持冬天配置列
        toolbar: {
            custom: true
        },
        // 省略字段配置
        column: [],
        // 列表数据源
        data: [],
        // 代理配置
        proxy: {
            // 请求数据方法
            requestFun: this.gridList,
            // 分页每页显示条数字段名称，默认为limit，此参数传递到服务端
            limitParam: "pageSize",
            // 分页页码字段名称，默认为page，此参数传递到服务端
            pageParam: "current",
            // 初始化后自动加载数据
            autoLoad: true,
            // 读取数据相关配置
            reader: {
                // 数据根节点
                rootProperty: "data.data.records",
                successProperty: "data.code",
                totalProperty: "data.data.total",
                messageProperty: "data.data.msg"
            }
        }
    };

    // 每页显示数量变化
    onSizeChange(pageSize: number) {
        this.proxySizeChange(pageSize);
    }

    // 页码发生变化
    onCurrentChange(page: number) {
        this.proxyCurrentChange(page);
    }

    //根据条件查询
    proxyQuery(params: any, tabName = "tableList") {
        // console.log("onSizeChange", pageSize);
        this[tabName].load(params);
    }

    //每页显示数量变化
    proxySizeChange(pageSize: number, tabName = "tableList") {
        // console.log("onSizeChange", pageSize);
        this[tabName].loadPageSize(pageSize);
    }

    // 页码发生变化
    proxyCurrentChange(page: number, tabName = "tableList") {
        // console.log("onCurrentChange", page);
        this[tabName].loadPage(page);
    }

    //以下是表列头可配置并保存配置到本地
    localData: any = {
        data: {},
        proxy: {
            autoLoad: true,
            type: "local"
        }
    };
    // 监听本地配置
    @Watch("localData.data")
    updateLocalData(data: any) {
        const me = this as any;
        // 等待视图绘制完毕
        me.$nextTick(() => {
            // 读取本地配置，根据配置控制表格排序与列隐藏
            const { sortable, hiddenField } = data;
            me.sortableByTitle(sortable);
            me.hiddenByField(hiddenField);
        });
    }
    /**
     * 列表根据title配置顺序排序
     *
     * @param {*} data  如:['序号','姓名']
     * @param {*} tabName 默认xTable
     * @memberof mixinColumn
     */
    sortableByTitle(data: any, tabName: string = "xTable") {
        const me = this as any,
            xTable = me.$refs[tabName];
        if (!isEmpty(data) && xTable) {
            // 获取当前表格列配置
            let { fullColumn } = xTable.getTableColumn();
            // 遍历排序数组
            data.forEach((item: any, index: any) => {
                // 根据标题找到对应的列
                const column = find(fullColumn, { title: item });
                if (column) {
                    // 设置列的排序值
                    column.sortableIndex = index;
                }
            });
            // 根据排序值重新排序
            fullColumn = sortBy(fullColumn, "sortableIndex");
            // 重载列配置实现重新排序
            xTable.loadColumn(fullColumn);
        }
    }
    /**
     * 列表根据field配置隐藏指定列
     *
     * @param {*} data 如：['name','age']
     * @param {string} [tabName="xTable"]
     * @memberof mixinColumn
     */
    hiddenByField(data: any, tabName: string = "xTable") {
        const me = this as any,
            xTable = me.$refs[tabName];
        if (!isEmpty(data) && xTable) {
            // 获取当前表格列配置
            data.forEach((item: any) => {
                // 根据field配置找到对应列并隐藏
                const column = xTable.getColumnByField(item);
                if (column) {
                    xTable.hideColumn(column);
                }
            });
        }
    }
    /**
     * 自定义列配置发生变化时
     *
     * @param {*} [{
     *         localName = 'localData',
     *         tabName = "xTable" }={}]
     * @memberof mixinColumn
     */
    customChange({ localName = "localData", tabName = "xTable" }: any = {}) {
        const me = this as any,
            xTable = me.$refs[tabName],
            // 遍历列配置
            data = flatMap(xTable.getTableColumn().fullColumn, function(
                item: any
            ) {
                // 获取隐藏列的field
                return !item.visible ? item.property : "";
            });
        me[localName].saveDataByDebounce("hiddenField", compact(data));
    }

    /**
     * 自定义列是否允许列选中的方法
     *
     * @param {*} { column }
     * @returns
     * @memberof mixinColumn
     */
    checkMethod({ column }: any) {
        // 只有配置了field属性才运行
        return !!column.property;
    }

    /**
     * 自定义列配置发生变化时
     *
     * @memberof mixinColumn
     */
    onCustomChange() {
        this.customChange();
    }

    /**
     * 初始化列头拖拽功能
     *
     * @param {*} [{
     *         localName = 'localData',
     *         tabName = "xTable" }={}]
     * @memberof mixinColumn
     */
    columnDrop({ localName = "localData", tabName = "xTable" }: any = {}) {
        const me = this as any;
        const xTable = me.$refs[tabName];
        Sortable.create(
            // 监听列表头
            xTable.$el.querySelector(
                ".body--wrapper>.vxe-table--header .vxe-header--row"
            ),
            {
                handle: ".vxe-header--column:not(.col--fixed)",
                onEnd: ({ newIndex, oldIndex }) => {
                    const { fullColumn, tableColumn } = xTable.getTableColumn();
                    // 获取列的旧序号
                    const oldColumnIndex = xTable.getColumnIndex(
                        tableColumn[oldIndex]
                    );
                    // 获取列的新序号
                    const newColumnIndex = xTable.getColumnIndex(
                        tableColumn[newIndex]
                    );
                    // 移动到目标列
                    const currRow = fullColumn.splice(oldColumnIndex, 1)[0];
                    fullColumn.splice(newColumnIndex, 0, currRow);
                    xTable.loadColumn(fullColumn);
                    // 根据列的title配置获取排序
                    const data = flatMap(fullColumn, function(item: any) {
                        return item.title;
                    });
                    // 存储配置数据
                    me[localName].saveDataByDebounce("sortable", compact(data));
                }
            }
        );
    }

    // 显示自定义列配置项
    onShowCustom() {
        const me = this as any,
            xToolbar = me.$refs.xToolbar;
        xToolbar.customOpenEvent();
    }
    /**
     * 初始化本地配置
     *
     * @memberof mixinColumn
     */
    created() {
        const me = this as any,
            // 当前视图配置数据
            localData = me.localData;
        // 根据路由设置当前视图存储路径
        localData.proxy.path = me.$route.name;
        // 初始化存储代理
        proxy.init(localData);
        // 初始化数据代理对象
        proxy.init(me.tableList);
        // 等待视图绘制完成
        me.$nextTick(() => {
            // 初始化列头拖拽功能
            me.columnDrop();
            // 手动将表格和工具栏进行关联
            me.$refs.xTable.connect(me.$refs.xToolbar);
        });
    }
}
</script>
```

# 可用代理

## promise.classic
多用于web端获取列表数据，新数据会覆盖原有数据

## promise.modern
多用于移动端获取列表数据，新数据会追加到原有数据之后

## local
如果提供了读取数据函数，数据通过函数获取，如果没有则读取缓存数据，新数据会覆盖原有数据
如果提供了保存数据函数，数据通过保存数据保存，如果没有则缓存数据，新数据会覆盖原有数据

## promise.memory
通过setData设置数据后，可以分页展示数据，并支持单字段排序
用法同promise.classic,除load/lodaByDefaultParams/getParams方法其他方法皆可使用


# 可用配置
```js
// promise.开头代理预留方法
const defaultStore = {
    // 扩展，请求失败后执行函数(res)
    // res 请求失败结果数据集
    failure: null,
    // 扩展，请求数据前处理请求参数函数(params, proxy)
    // params 请求参数
    // proxy 代理对象
    writerTransform: null,
    // 扩展，请求数据成功后处理数据结果函数(res)
    // res 未处理的结果数据集
    readerTransform: null
}
// promise.modern代理数据源对象可用状态
const defaultStore = {
    // 是否加载完数据，所有数据加载完成就会变成true，可以修改
    isFinished: false,
    // 是否加载失败，禁止修改
    isError: false,
    // 是否处于加载状态，可以修改
    isVanLoading: false
}

// 代理可用配置
const defaultProxy = {
    // 代理类型，默认为经典代理
    type: 'promise.classic',
    // 默认参数,默认参数会被相同名称新参数覆盖，此参数传递到请求数据函数
    defaultParams: null,
    // 初始化后是否自动加载数据
    autoLoad: false,
    // 扩展 处理单个数据对象的函数(item,index)
    // item 单条数据
    // index 序号
    disposeItem: null,
    // 读取数据相关配置
    reader: {
        // 其他数据节点名称
        otherProperty: "",
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
// promise.开头代理可用配置
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
    pageParam: 'page',
    // 扩展，请求数据成功后回调函数(data,proxy)
    // data 结果输数据集
    // proxy 代理对象
    loadSuccess: null,
    // 扩展，请求失败后执行函数(res)
    // res 请求失败结果数据集
    // 此扩展会覆盖defaultStore中的配置
    failure: null,
    // 扩展，请求数据前处理请求参数函数(params, proxy)
    // params 请求参数
    // proxy 代理对象
    // 此扩展会覆盖defaultStore中的配置
    writerTransform: null,
    // 扩展，请求数据成功后处理数据结果函数(res)
    // res 未处理的结果数据集
    // 此扩展会覆盖defaultStore中的配置
    readerTransform: null,
    // 发送请求时是否清除空数据
    clearEmptyParams: true,
    // 发送请求时是否不发送分页参数
    clearPageParams:false
};
// promise.classic代理可用配置
const defaultProxy = {
    // 当前分页配置节点名称，默认为pagination
    paginationParam: 'pagination'
};
// local代理可用配置
const defaultProxy = {
    // 请求数据方法
    requestFun: null,
    // 保存数据方法
    saveFun: null,
    // 本地默认数据库名称
    dbName: 'ux-local-data',
    // 本地存储路径，必填
    path: ''
};
// promise.memory代理可用配置
// autoLoad 不可用
// defaultParams 不可用
// requestFun 不可用
// 其他同promise.classic
const defaultProxy = {
};
```

# 可用函数

## 通用函数
```js
    /**
     * 初始化,每个数据源对象必须初始化
     *
     * @param {*} store,数据源对象
     */
    init(store: any) {
    },
    /**
     * 数据源对象加载数据
     * promise.开头的代理页码会重置为1
     * local代理如果没有配置requestFun会根据dbName与path配置读取本地数据
     *
     * @param {*} [params 参数]
     */
    load(params?: any) {
    },
    /**
     * 设置默认参数并加载数据
     *
     * @param {*} params 默认参数
     * @param {boolean} [isReLoad=false] 是否重载
     */
    lodaByDefaultParams(params: any, isReLoad: boolean = false) {
    
    },
    /**
     * 追加默认参数并加载数据
     *
     * @param {*} params 参数
     * @param {boolean} [isReLoad=false] 是否重载
     */
    appendsDefaultParamsAndLoad(params: any, isReLoad: boolean = false) {
    },
    /**
     * 移除指定参数(包括默认参数)并加载数据
     *
     * @param {*} list 待移除的字符串数组
     * @param {boolean} [isReLoad=true] 是否重载
     */
    removeParamsAndReLoad(list:any, isReLoad: boolean = true) {
    },
    /**
     * 数据源对象重载数据
     * promise.开头的代理页码会重置为1
     * local代理如果没有配置requestFun会根据dbName与path配置读取本地数据
     *
     */
    reLoad() {
    },
    /**
     * 排序
     *
     * @param {*} { field 排序字段, order 排序方式}
     */
    sort({ field, order }: any) {
    },
    /**
     * 清除排序
     *
     */
    clearSort() {
    },
    /**
     * 获取当前参数（排除分页参数）
     *
     * @returns
     */
    getParams() {
    },
    /**
     * 获取所有参数
     *
     * @returns
     */
    getAllparams() {
    }
```

## promise.classic 代理
```js
    /**
     * 数据源对象改变每页显示条数，页码重置为1
     *
     * @param {number} page
     */
    loadPageSize(pageSize: number) {
    },
    /**
     * 数据源对象改变页码
     *
     * @param {number} page
     */
    loadPage(page: number) {
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
    }
```

## promise.modern 代理
```js
    /**
     * 加载下一页数据
     *
     */
    loadNext() {
    }
```


## local 代理
```js
    /**
     * 保存配置（data的值）
     *
     */
    saveData() {
    },
    /**
     * 保存某个配置（data.name的值），默认1秒内只会执行saveData方法一次,避免高频调用
     *
     * @param {string} name 字段名称
     * @param {*} data 值
     * @param {number} [wait=1000] 防抖动时间，毫秒
     */
    saveDataByDebounce(name: string, data: any, wait: number = 1000) {
    }
```

## promise.memory 代理
```js
    /**
     * 设置数据
     *
     * @param {*} data 数据
     */
    setData(pageSize: number) {
    },
    /**
     * 设置数据并排序
     *
     * @param {*} data 数据
     * @param {*} { field 排序字段, order 排序方式}
     */
    setDataAndSort(page: number) {
    }
```

# 二次扩展
```js
import proxy from "ux-data-proxy";
import { defaultsDeep, mixin } from "lodash";
import { Message } from 'element-ui';
// 默认配置1
const currentProxy = {
    limitParam: 'pageSize',
    pageParam: "current",
    // 显示错误消息
    isErrorMessage: true,
    // 初始化后自动加载数据
    autoLoad: true,
    // 读取数据相关配置
    reader: {
        // 数据根节点
        rootProperty: "data.data.records",
        successProperty: "data.code",
        totalProperty: "data.data.total",
        messageProperty: 'data.data.msg'
    }
};
// 默认配置2
const defaultProxy = {
    limitParam: 'pageSize',
    pageParam: 'currentPage',
    autoLoad: true,
    disposeItem: function(item: any) {
        console.log(item);
        // 这里处理单条数据如：item.a = 123;
    },
    // 读取数据相关配置
    reader: {
        // 数据根节点
        rootProperty: "data.records",
        successProperty: "code",
        totalProperty: "data.total",
        messageProperty: 'data.msg'
    }
};
// 扩展数据请求代理
export default {
    /**
    * 初始化
     *
     * @param {*} store,数据源对象
     */
    init(store: any) {
        // 根据配置类型读取不同的默认配置
        switch (store.proxy.configType) {
            case 'current':
                store.proxy = defaultsDeep(store.proxy, currentProxy);
                break;
            default:
                store.proxy = defaultsDeep(store.proxy, defaultProxy);
                break;
        }
        console.log('newStore.init');
        // 它本身的方法会被代理对象的方法覆盖，放在后面则相反
        mixin(store, this);
        // 将当前代理对象的方法挂载到数据源对象，代理对象的方法会覆盖代理对象原有的方法
        proxy.init(store);
        // 如果放在 proxy.init(store);之后执行
        // 如果设置了初始化自动加载，首次请求writerTransform不会触发
    },
    // 扩展，请求失败后执行函数
    // 如果在代理中有相同扩展方法，会被覆盖
    failure(res: any) {
        const me = this as any;
        if (me.proxy.isErrorMessage) {
            // 显示错误提示
            Message({
                // duration:0,
                message: res.message,
                type: "error",
                customClass: "zZindex"
            });
        }
    },
    // 扩展，请求数据成功后处理数据结果函数
    // 如果在代理中有相同扩展方法，会被覆盖
    readerTransform(res: any) {
        console.log('readerTransform')
        return res;
    },
    // 扩展，请求数据前处理请求参数函数
    // 如果在代理中有相同扩展方法，会被覆盖
    writerTransform(params: any) {
        console.log('writerTransform')
        return params;
    }
}
```

# TODO
- [x] 经典代理
- [x] 移动端代理
- [x] 本地数据代理
- [x] 内存代理
    - [x] 指定数据后支持分页、单字段排序
    - [ ] 数据搜索过滤
    - [ ] 支持直接读取远程数据