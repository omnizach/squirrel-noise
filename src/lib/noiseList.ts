import { NoiseFunction, NoiseOptions } from './noise'
import { noiseFactory } from './noiseFactory'
import { randomize } from './random'

export interface NoiseListOptions {
  weights?: number[]
}

export const noiseList = <T>(
  items: readonly T[],
  {
    weights,
    ...options
  }: Omit<NoiseOptions, 'range' | 'discrete'> & NoiseListOptions = {},
): NoiseFunction<T> => {
  if (weights?.length) {
    const cdf = items.reduce<[number, [number, number][]]>(
        (p, _c, i) => [
          (weights[i] ?? 1) + p[0],
          p[1].concat([[p[0], (weights[i] ?? 1) + p[0]]]),
        ],
        [0, []],
      )[1],
      lookupItem: (x: number, start: number, end: number) => T = (
        x,
        start,
        end,
      ) => {
        const guessIndex = (end + start) >>> 1
        return x >= cdf[guessIndex][0] && x < cdf[guessIndex][1]
          ? items[guessIndex]
          : x < cdf[guessIndex][0]
            ? lookupItem(x, start, guessIndex)
            : lookupItem(x, guessIndex + 1, end)
      }

    return noiseFactory((x: number) => lookupItem(x, 0, items.length - 1), {
      ...options,
      range: [0, cdf[cdf.length - 1][1]],
    })
  }

  return noiseFactory((x: number) => items[x], {
    ...options,
    range: [0, items.length],
    discrete: true,
  })
}

export const randomList = <T>(
  items: readonly T[],
  options?: Omit<NoiseOptions, 'range' | 'discrete' | 'dimensions'> &
    NoiseListOptions,
) => randomize(noiseList(items, options))
