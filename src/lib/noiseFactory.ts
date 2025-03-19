import { noise, NoiseFunction, NoiseOptions } from './noise'

export type NoiseOutputMapper<T> = (x: number) => T

export const noiseFactory = <T>(
  output: NoiseOutputMapper<T>,
  options?: NoiseOptions
): NoiseFunction<T> => {
  const n = noise(options)
  return (...xs: readonly (number | undefined)[]) => output(n(...xs)) // eslint-disable-line functional/functional-parameters
}
