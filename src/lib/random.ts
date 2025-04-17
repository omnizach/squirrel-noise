import { noise, NoiseFunction, NoiseOptions } from './noise'

export type RandomFunction<T> = () => T

/**
 * Takes any NoiseFunction and turns it into a Random
 * @param noiseFunc
 * @returns
 */
export const randomize: <T>(noiseFunc: NoiseFunction<T>) => RandomFunction<T> = <T>(noiseFunc: NoiseFunction<T>) => {
  let x = 0
  return () => noiseFunc(++x)
}

/**
 * Random generator version of the base noise function.
 * @param options
 * @returns
 */
export const random = (options?: Omit<NoiseOptions, 'dimensions' | 'lerp'>) => randomize(noise(options))
