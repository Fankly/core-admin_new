import mitt from 'mitt'

/**
 * 事件总线
 */
export default mitt<Record<string, any>>()
