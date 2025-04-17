import { noise, NoiseOptions } from './noise'
import { randomize } from './random'

export const noiseNumber = noise

export const randomNumber = (options?: NoiseOptions) => randomize(noiseNumber(options))
