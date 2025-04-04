import { NoiseOptions } from './noise'
import { noiseNumber } from './noiseNumber'
import { noiseTuple } from './noiseTuple'
import { randomize } from './random'

export interface NoiseVect2DOptions {
  range?: [[number, number], [number, number]]
}

export const noiseVect2D = ({
  range,
  seed,
  ...options
}: Omit<NoiseOptions, 'range'> & NoiseVect2DOptions = {}) => {
  return noiseTuple<number, number>(
    noiseNumber({ range: range?.[0], ...options }),
    noiseNumber({
      range: range?.[1],
      ...options,
      seed: seed === 'random' ? seed : ~(seed ?? 0),
    }),
  )
}

export const randomVect2D = (
  options?: Omit<NoiseOptions, 'range'> & NoiseVect2DOptions,
) => randomize(noiseVect2D(options))
