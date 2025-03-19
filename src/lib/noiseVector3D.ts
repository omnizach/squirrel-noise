/**
 * A uniform distribution is not straight-forward.
 * See here for an explanation of the algorithm:
 * https://math.stackexchange.com/a/1586015
 */

import { noise, NoiseFunction, NoiseOptions } from './noise'

export const noiseVector3D = (
  options?: Omit<NoiseOptions, 'range' | 'discrete'>
): NoiseFunction<readonly [number, number, number]> => {
  const theta = noise({ ...options, range: [0, Math.PI * 2] }),
    z = noise({ ...options, seed: ~(options?.seed ?? 0), range: [-1, 1] })

  // eslint-disable-next-line functional/functional-parameters
  return (...xs: readonly (number | undefined)[]) => {
    const thetaHat = theta(...xs),
      zHat = z(...xs),
      r = Math.sqrt(1 - zHat ** 2)

    return [r * Math.cos(thetaHat), r * Math.sin(thetaHat), zHat]
  }
}

export const randomVector3D = (
  options?: Omit<NoiseOptions, 'range' | 'discrete' | 'dimensions'>
) => noiseVector3D({ ...options, generator: true })
