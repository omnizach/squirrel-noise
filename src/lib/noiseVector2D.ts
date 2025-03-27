import { NoiseOptions } from './noise'
import { noiseFactory } from './noiseFactory'
import { randomize } from './random'

const thetaToRect = (θ: number) => [Math.cos(θ), Math.sin(θ)]

/**
 *
 * @param options: NoiseOptions. `range` is the range of angles in radians. default [0, 2*PI]
 * @returns a Vector2D ([number, number]) in rectanglar coordinate space uniformly around the unit circle or the arc-range specified.
 */
export const noiseVector2D = ({ range = [0, Math.PI] }: NoiseOptions = {}) =>
  noiseFactory(thetaToRect, {
    range,
  })

export const randomVector2D = ({
  range,
}: Omit<NoiseOptions, 'dimensions'> = {}) =>
  randomize(
    noiseFactory(thetaToRect, {
      range,
    }),
  )
