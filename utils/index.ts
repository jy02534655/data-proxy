import {  isEmpty, isNumber, pickBy } from "lodash";
export default {
    /**
     * 判断是否为空对象，空字符串，null
     * {},[],'',null会返回true
     * @param {*} v
     * @returns
     */
    isEmpty(v: any) {
        if (isNumber(v)) {
            // 只要是数字就不算空
            return false;
        }
        return isEmpty(v);
    },
    // 清楚对象中空数据
    clearObject(o: any) {
        const me = this as any;
        return pickBy(o, (item: any) => {
            return !me.isEmpty(item);
        });
    }
}
