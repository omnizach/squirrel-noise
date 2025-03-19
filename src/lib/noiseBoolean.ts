import { NoiseOptions } from './noise'
import { noiseFactory } from './noiseFactory'

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
  noiseFactory((x: number) => x > 1, {
    ...options,
    range: [0, 2],
  })

export const randomBoolean = (
  options?: Omit<NoiseOptions, 'range' | 'dimensions'>
) =>
  noiseFactory((x: number) => x > 1, {
    ...options,
    range: [0, 2],
    generator: true,
  })
