import { ClassicProxy } from '../promise/classic';
import { MemoryProxy } from '../promise/memory';
import { ModernProxy } from '../promise/modern';
import { LocalProxy } from '../local';

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
    
    // 使用 Map 存储代理类型映射
    const proxyMap = new Map([
      ['promise.classic', ClassicProxy],
      ['promise.modern', ModernProxy],
      ['promise.memory', MemoryProxy],
      ['local', LocalProxy]
    ]);

    // 获取代理类
    const ProxyClass = proxyMap.get(store.proxy.type) || ClassicProxy;
    return new ProxyClass(store);
  }
}
