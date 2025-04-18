import { NoiseOptions } from './noise'
import { noiseFactory } from './noiseFactory'
import { noiseNumber } from './noiseNumber'

export interface NoiseNormalOptions extends Omit<NoiseOptions, 'range'> {
  algorithm?: 'box-muller'
  mean?: number
  stddev?: number
}

export const noiseNormal = ({ mean, stddev, ...options }: NoiseNormalOptions = {}) => {
  const μ = mean ?? 0,
    σ = stddev ?? 0,
    θ = noiseNumber({ ...options, range: [0, Math.PI * 2] }),
    r = noiseFactory(x => σ * Math.sqrt(-2 * Math.log(x)), {
      seed: Number.isFinite(options.seed) ? ~options.seed! : options.seed,
    })

  return (...xs: (number | undefined)[]) => r(...xs) * Math.cos(θ(...xs)) + μ
}
