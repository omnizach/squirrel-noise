/* eslint @typescript-eslint/no-explicit-any: 0 */
/* eslint @typescript-eslint/no-unused-vars: 0 */

import { NoiseFunction } from './fluent'

const noiseOutputBuilder = <TIn, TMid, TOut>(
  nfn: NoiseFunction<TIn, TMid>,
  output: (value: TMid) => TOut,
): NoiseFunction<TIn, TOut> => {
  function n(x: TIn): TOut {
    return output(nfn(x))
  }

  n.generator = function* (length = Infinity) {
    const r = nfn.random()
    let i = 1

    while (i < length) {
      yield output(r())
      i++
    }
  }

  n.random = (): (() => TOut) => {
    const r = n.random()
    return () => r()
  }

  return n
}

export const noiseOutput = noiseOutputBuilder
