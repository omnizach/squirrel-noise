import { NoiseOptions } from './noise'
import { noiseNumber } from './noiseNumber'
import { noiseTuple } from './noiseTuple'
import { randomize } from './random'

export interface NoiseVect3DOptions {
  range?: [[number, number], [number, number], [number, number]]
}

export const noiseVect3D = ({ range, seed, ...options }: Omit<NoiseOptions, 'range'> & NoiseVect3DOptions = {}) => {
  return noiseTuple<number, number, number>(
    noiseNumber({ range: range?.[0], ...options }),
    noiseNumber({
      range: range?.[1],
      ...options,
      seed: seed === 'random' ? seed : ~(seed ?? 0),
    }),
    noiseNumber({
      range: range?.[2],
      ...options,
      seed: seed === 'random' ? seed : (seed ?? 0) ^ 0xa5a55a5a,
    }),
  )
}

export const randomVect3D = (options?: Omit<NoiseOptions, 'range'> & NoiseVect3DOptions) =>
  randomize(noiseVect3D(options))
