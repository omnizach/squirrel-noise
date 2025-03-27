import { NoiseOptions } from './noise'
import { noiseFactory } from './noiseFactory'
import { randomize } from './random'

/**
 * Creates a NoiseFunction that resolves to booleans
 *
 * Example:
 * ```
 * const booleanNoise = noiseBoolean()
 *
 * if (booleanNoise(123)) {
 *    console.log('Got here because the value happened to be true')
 * }
 *
 * ```
 *
 * @returns NoiseFunction<boolean>
 */
export const noiseBoolean = (options?: Omit<NoiseOptions, 'range'>) =>
  noiseFactory<boolean>((x: number) => !(x & 1), options)

export const randomBoolean = (
  options?: Omit<NoiseOptions, 'range' | 'dimensions'>,
) => randomize(noiseBoolean(options))
