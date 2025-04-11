/* eslint @typescript-eslint/no-explicit-any: 0 */
/* eslint @typescript-eslint/no-unused-vars: 0 */

import { noise, NoiseBuilderOptions, NoiseFunctionWithProps } from './fluent'

export interface NoiseListOptions<TIn, TOut> extends Omit<NoiseBuilderOptions<TIn, TOut>, 'output'> {
  items?: TOut[]
  weights?: number[]
}

export interface NoiseListFunction<TIn, TOut> extends Omit<NoiseFunctionWithProps<TIn, TOut>, 'output'> {
  items<T>(): TOut[]
  items<T>(value: T[]): NoiseListFunction<TIn, T>
  weights(): number[]
  weights(value: number[]): NoiseListFunction<TIn, TOut>
}

const noiseListBuilder = <TIn, TOut>({
  items = [],
  weights,
  ...options
}: NoiseListOptions<TIn, TOut>): NoiseListFunction<TIn, TOut> => {
  const cdf: [number, number][] = !weights?.length
      ? []
      : (items?.reduce<[number, [number, number][]]>(
          (p, _c, i) => [(weights[i] ?? 1) + p[0], p[1].concat([[p[0], (weights[i] ?? 1) + p[0]]])],
          [0, []],
        )[1] ?? []),
    lookupItem: (x: number, start: number, end: number) => TOut = (x, start, end) => {
      const guessIndex = (end + start) >>> 1
      return x >= cdf[guessIndex][0] && x < cdf[guessIndex][1]
        ? items[guessIndex]
        : x < cdf[guessIndex][0]
          ? lookupItem(x, start, guessIndex)
          : lookupItem(x, guessIndex + 1, end)
    }

  const n = (!weights?.length
    ? noise(options)
        .range([0, items?.length ?? 1])
        .discrete(true)
        .output(x => items?.[x])
    : noise(options)
        .range([0, cdf[cdf.length - 1][1]])
        .output(x => lookupItem(x, 0, items.length - 1))) as unknown as NoiseListFunction<TIn, TOut>

  function itemsAccessor<T>(): TOut[]
  function itemsAccessor<T>(value: T[]): NoiseListFunction<TIn, T>
  function itemsAccessor<T>(value?: T[]): TOut[] | NoiseListFunction<TIn, T> {
    if (value === undefined) return items ?? []
    return noiseListBuilder<TIn, T>({ ...options, weights, items: value })
  }

  n.items = itemsAccessor

  function weightsAccessor(): number[]
  function weightsAccessor(value: number[]): NoiseListFunction<TIn, TOut>
  function weightsAccessor(value?: number[]): number[] | NoiseListFunction<TIn, TOut> {
    if (value === undefined) return weights ?? []
    return noiseListBuilder({ ...options, items, weights: value })
  }

  n.weights = weightsAccessor

  return n
}

export const noiseList = <T>(items: T[]) => noiseListBuilder({ items, input: (x: number) => x })
