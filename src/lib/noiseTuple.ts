/* eslint @typescript-eslint/no-explicit-any: 0 */
/* eslint @typescript-eslint/no-unused-vars: 0 */
/*
import { NoiseFunction, NoiseFunctionWithProps } from './fluent'

const SEED_XOR = [0, -1, 0xa5a5_5a5a, 0x5a5a_a5a5]

export function noiseTupleBuilder<TIn, T1, T2>(
  ns: [NoiseFunctionWithProps<TIn, T1>, NoiseFunctionWithProps<TIn, T2>],
): NoiseFunction<TIn, [T1, T2]>
export function noiseTupleBuilder<TIn, T1, T2, T3>(
  ns: [NoiseFunctionWithProps<TIn, T1>, NoiseFunctionWithProps<TIn, T2>, NoiseFunctionWithProps<TIn, T3>],
): NoiseFunction<TIn, [T1, T2, T3]>
export function noiseTupleBuilder<TIn, T1, T2, T3, T4>(
  ns: [
    NoiseFunctionWithProps<TIn, T1>,
    NoiseFunctionWithProps<TIn, T2>,
    NoiseFunctionWithProps<TIn, T3>,
    NoiseFunctionWithProps<TIn, T4>,
  ],
): NoiseFunction<TIn, [T1, T2, T3, T4]>
export function noiseTupleBuilder<TIn>(
  ns: NoiseFunctionWithProps<TIn, unknown>[],
): NoiseFunction<TIn, unknown[]> {
  // For cases where the seed is the same across each function, vary it to make it uncorrelate
  // But, for a set seed, this process is deterministic
  ns.forEach((n, i) => {
    n.seed(n.seed() ^ SEED_XOR[i])
  })

  function n(x: TIn) {
    return ns.map(n => n(x))
  }

  n.generator = function* (length = Infinity) {
    const rs = ns.map(n => n.random())
    let i = 1

    while (i < length) {
      yield rs.map(r => r())
      i++
    }
  }

  n.random = (): (() => unknown[]) => {
    const rs = ns.map(n => n.random())
    return () => rs.map(r => r())
  }

  return n
}

export const noiseTuple = noiseTupleBuilder
*/
