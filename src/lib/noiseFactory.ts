import { noise, NoiseFunction, NoiseOptions } from './noise'

/**
 * A NoiseFunction always returns a number. This type is used to coerce that number into the desired type.
 */
export type NoiseOutputMapper<T> = (x: number) => T

/**
 * The noiseFactory uses a noise function to produce noise in another domain. This is used extensively
 * to make convenient functions that directly output noise in the form of booleans, list items, etc.
 * @param output A function that takes a noise value and turns it into the desired output. `(x: number) => T`
 * @param options NoiseOptions for controlling how the noise is presented to the output function.
 * @returns A function that accepts input (0-4 numbers) and produces items of type T.
 */
export const noiseFactory = <T>(
  output: NoiseOutputMapper<T>,
  options?: NoiseOptions,
): NoiseFunction<T> => {
  const n = noise(options)
  return (...xs: readonly (number | undefined)[]) => output(n(...xs))
}
