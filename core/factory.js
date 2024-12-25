import { ClassicProxy } from '../promise/classic';
import { MemoryProxy } from '../promise/memory';
import { ModernProxy } from '../promise/modern';
import { LocalProxy } from '../local';
import { split } from 'lodash';

/**
 * 代理工厂类
 * 负责根据配置创建对应的代理实例
 */
export class ProxyFactory {
  /**
   * 创建代理实例
   * @param {object} store 数据源对象
   * @returns {BaseProxy} 代理实例
   */
  static create(store) {
    // 读取代理类型，用.分割
    const [base, type] = split(store.proxy.type, '.');
    // 根据代理类型第一级创建代理实例
    switch (base) {
      case 'promise':
        switch (type) {
          case 'classic':
            return new ClassicProxy(store);
          case 'modern':
            return new ModernProxy(store);
          case 'memory':
            return new MemoryProxy(store);
          default:
            return new ClassicProxy(store);
        }
      case 'local':
        return new LocalProxy(store);
      default:
        return new ClassicProxy(store);
    }
  }
}
