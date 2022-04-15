import {
  isEmpty as lodashIsEmpty,
  isNumber,
  pickBy,
  isBoolean,
  isDate
} from 'lodash';

/**
 * 判断是否为空对象，空字符串，null
 * {},[],'',null会返回true
 * @export
 * @param {any} v
 * @return {*}  {boolean}
 */
export function isEmpty(v) {
  if (isNumber(v) || isBoolean(v) || isDate(v)) {
    // 只要是数字和布尔类型时间就不算空
    return false;
  }
  return lodashIsEmpty(v);
}

export function clearObject(o) {
  return pickBy(o, (item) => !isEmpty(item));
}

export default {};
