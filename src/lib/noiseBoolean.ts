import { noiseFactory } from './noiseFactory'

export const noiseBoolean = () => noiseFactory((x: number) => x > 1, {
  range: [0, 2],
})

export const randomBoolean = () => noiseFactory((x: number) => x > 1, {
  range: [0, 2],
  generator: true,
})
