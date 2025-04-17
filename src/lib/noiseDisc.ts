import { NoiseFunction, NoiseOptions } from './noise'
import { noiseNumber } from './noiseNumber'
import { noiseUnitCircle } from './noiseUnitCircle'
import { randomize } from './random'

/**
 * Samples noise within a disc (or annulus). Adapted from poisson disc sampling: https://observablehq.com/@marwanhilmi/poisson-disc.
 * @param options: range is [inner radius, outer radius] for the disc. Default is [0, 1] (unit disc, no inner radius)
 * @returns
 */
export const noiseDisc = ({ range = [0, 1], ...options }: NoiseOptions = {}): NoiseFunction<[number, number]> => {
  const unitCircle = noiseUnitCircle(),
    radius2 = noiseNumber({
      range: [range[0] ** 2, range[1] ** 2],
      seed: ~(options?.seed || 0),
    })

  return (...xs: (number | undefined)[]) => {
    const [x, y] = unitCircle(...xs),
      r = Math.sqrt(radius2(...xs))

    return [x * r, y * r]
  }
}

export const randomDisc = (options?: NoiseOptions) => randomize(noiseDisc(options))
