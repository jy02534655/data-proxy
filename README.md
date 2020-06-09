# 说明

这是一个数据代理扩展，灵感来至于ExtJs中的Ext.data.Store

git地址:https://github.com/jy02534655/data-proxy

# 安装代理模块
npm install ux-data-proxy

# 使用
请求数据的方法与返回的数据需要遵循以下规则

1. 此帮助类只是一个代理类，具体分页查询函数还是需要axios等扩展来实现，但是因为设计时考虑了扩展性，可以自定义一些扩展来实现请求数据的功能

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

# 可用配置
```js
const defaultProxy = {
    // 代理类型，默认为经典代理
    type: 'promise.classic',
    // 每次加载几条数据，默认为10
    pageSize: 10,
    // 当前页码，默认为1
    page: 1,
    // 分页每页显示条数字段名称，默认为limit，此参数传递到服务端
    limitParam: 'limit',
    // 分页页码字段名称，默认为page，此参数传递到服务端
    pageParam: 'page',
    // 当前分页配置节点名称，默认为page
    paginationParam: 'pagination',
    // 初始化后是否自动加载数据
    autoLoad: false,
    // 扩展，请求失败后执行函数
    failure: null,
    // 扩展，请求数据前处理请求参数函数
    writerTransform: null,
    // 扩展，请求数据成功后处理数据结果函数
    readerTransform: null,
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
    }
};
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
        proxy.init(store);
        // 将当前代理对象的方法挂载到数据源对象，代理对象的方法会覆盖代理对象原有的方法
        // 如果放在 proxy.init(store);之后执行
        // 它本身的方法会覆盖代理对象的方法，放在前面则相反
        mixin(store, this);
    },
    // 扩展，请求失败后执行函数
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
    readerTransform(res: any) {
        console.log('readerTransform')
        return res;
    },
    // 扩展，请求数据前处理请求参数函数
    writerTransform(params: any) {
        console.log('writerTransform')
        return params;
    }
}
```

# TODO
- [x] 经典代理
- [ ] 移动端代理
- [ ] 本地数据代理