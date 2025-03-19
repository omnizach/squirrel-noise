import { NoiseFunction, NoiseOptions } from './noise'
import { noiseFactory } from './noiseFactory'

export const noiseList = <T>(
  items: readonly T[],
  options?: Omit<NoiseOptions, 'range' | 'discrete'>
): NoiseFunction<T> =>
  noiseFactory((x: number) => items[x], {
    ...options,
    range: [0, items.length],
    discrete: true,
  })

export const randomList = <T>(
  items: readonly T[],
  options?: Omit<NoiseOptions, 'range' | 'discrete' | 'dimensions'>
) => noiseList(items, { ...options, generator: true })
