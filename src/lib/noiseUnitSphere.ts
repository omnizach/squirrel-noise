/**
 * A uniform distribution is not straight-forward.
 * See here for an explanation of the algorithm:
 * https://math.stackexchange.com/a/1586015
 */

import { noise, NoiseFunction, NoiseOptions } from './noise'
import { noiseTuple } from './noiseTuple'
import { randomize } from './random'

export const noiseUnitSphere = (
  options?: Omit<NoiseOptions, 'range' | 'discrete'>,
): NoiseFunction<readonly [number, number, number]> => {
  const cylinder = noiseTuple(
    noise({ ...options, range: [0, Math.PI * 2] }),
    noise({ ...options, seed: ~(options?.seed || 0), range: [-1, 1] }),
  )

  return (...xs: readonly (number | undefined)[]) => {
    const [θ, z] = cylinder(...xs),
      r = Math.sqrt(1 - z ** 2)

    return [r * Math.cos(θ), r * Math.sin(θ), z]
  }
}

export const randomUnitSphere = (options?: Omit<NoiseOptions, 'range' | 'discrete' | 'dimensions'>) =>
  randomize(noiseUnitSphere(options))
