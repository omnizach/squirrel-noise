import { NoiseOptions } from './noise'
import { noiseNumber } from './noiseNumber'

export interface NoiseGeneratorOptions {
  length?: number
}

export function* noiseGenerator({
  length = Infinity,
  ...options
}: Omit<NoiseOptions, 'dimensions'> & NoiseGeneratorOptions = {}): Generator<number> {
  const n = noiseNumber(options)

  let i = 0

  while (i < length) {
    yield n(i++)
  }
}
