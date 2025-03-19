import { noiseFactory } from './noiseFactory'

const thetaToRect: (theta: number) => [number, number] = (theta: number) => [
  Math.cos(theta),
  Math.sin(theta),
]

export const noiseVector2D = () =>
  noiseFactory(thetaToRect, {
    range: [0, Math.PI * 2],
  })

export const randomVector2D = () =>
  noiseFactory(thetaToRect, {
    range: [0, Math.PI * 2],
    generator: true,
  })
