import { NoiseFunction, NoiseOptions, swizzle } from './noise'
import { noiseNumber } from './noiseNumber'
import { noiseUnitSphere } from './noiseUnitSphere'
import { randomize } from './random'

/**
 * Samples noise within the volume of a sphere. Similar to disc sampling, with the key difference that the bias toward
 * the edge of the ball is n^3 instead of n^2.
 * @param options: range is a number for the radius of the sphere. Default is 1, unit sphere.
 * @returns
 */
export const noiseBall = ({
  range = 1,
  ...options
}: Omit<NoiseOptions, 'range'> & { range?: number } = {}): NoiseFunction<[number, number, number]> => {
  const unitSphere = noiseUnitSphere(),
    radius3 = noiseNumber({
      range: [0, range ** 3],
      seed: swizzle(options.seed),
    })

  return (...xs: (number | undefined)[]) => {
    const [x, y, z] = unitSphere(...xs),
      r = Math.cbrt(radius3(...xs))

    return [x * r, y * r, z * r]
  }
}

export const randomBall = (options: Omit<NoiseOptions, 'range'> & { range?: number }) => randomize(noiseBall(options))
