import { NoiseOptions, swizzle } from './noise'
import { noiseNumber } from './noiseNumber'
import { noiseTuple } from './noiseTuple'
import { randomize } from './random'

export interface NoiseVect2DOptions {
  range?: [[number, number], [number, number]]
}

export const noiseVect2D = ({ range, seed, ...options }: Omit<NoiseOptions, 'range'> & NoiseVect2DOptions = {}) => {
  return noiseTuple<number, number>(
    noiseNumber({ range: range?.[0], ...options }),
    noiseNumber({
      range: range?.[1],
      ...options,
      seed: swizzle(seed),
    }),
  )
}

export const randomVect2D = (options?: Omit<NoiseOptions, 'range'> & NoiseVect2DOptions) =>
  randomize(noiseVect2D(options))
