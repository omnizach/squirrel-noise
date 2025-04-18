import { NoiseFunction, NoiseOptions } from './noise'
import { noiseFactory } from './noiseFactory'
import { noiseNumber } from './noiseNumber'

const clampRange = (range: [number, number]) => (x: number) => (x < range[0] ? range[0] : x > range[1] ? range[1] : x)

export interface NoiseNormalOptions extends Omit<NoiseOptions, 'range'> {
  algorithm?: 'box-muller'
  mean?: number
  stddev?: number
  clamp?: [number, number]
}

export const noiseNormalPair = ({ mean, stddev, clamp, ...options }: NoiseNormalOptions = {}): NoiseFunction<
  [number, number]
> => {
  const μ = mean ?? 0,
    σ = stddev ?? 0,
    θ = noiseNumber({ ...options, range: [0, Math.PI * 2] }),
    r = noiseFactory(x => σ * Math.sqrt(-2 * Math.log(x)), {
      seed: Number.isFinite(options.seed) ? ~options.seed! : options.seed,
    }),
    c = clampRange(clamp ?? [0, 0])

  return clamp
    ? (...xs: (number | undefined)[]) => {
        const a = θ(...xs),
          b = r(...xs)
        return [c(b * Math.cos(a) + μ), c(b * Math.sin(a) + μ)]
      }
    : (...xs: (number | undefined)[]) => {
        const a = θ(...xs),
          b = r(...xs)
        return [b * Math.cos(a) + μ, b * Math.sin(a) + μ]
      }
}

export const noiseNormal = (options?: NoiseNormalOptions): NoiseFunction<number> => {
  const n = noiseNormalPair(options)
  return (...xs: (number | undefined)[]) => n(...xs)[0]
}
