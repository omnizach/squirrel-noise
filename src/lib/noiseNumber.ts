import { noise, NoiseOptions } from './noise'

export const noiseNumber = noise

export const randomNumber = (options?: Omit<NoiseOptions, 'dimensions'>) =>
  noise({ ...options, generator: true })
