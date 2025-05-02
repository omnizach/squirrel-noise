/*
import { noise, NoiseFunction } from './fluent'
import { NoiseOptions } from './noise'
import { noiseOutput } from './noiseOutput'
import { noiseTuple } from './noiseTuple'

export const noiseNumber = noise

export const noiseBoolean = (options?: NoiseOptions) => noise(options).output(x => !(x & 1))

export const noiseVect2D = ({
  range,
  ...options
}: Omit<NoiseOptions, 'range'> & { range?: [[number, number], [number, number]] } = {}) =>
  noiseTuple<number, number, number>([
    noiseNumber({ range: range?.[0], ...options }),
    noiseNumber({ range: range?.[1], ...options }),
  ])

export const noiseVect3D = ({
  range,
  ...options
}: Omit<NoiseOptions, 'range'> & { range?: [[number, number], [number, number], [number, number]] } = {}) =>
  noiseTuple<number, number, number, number>([
    noiseNumber({ range: range?.[0], ...options }),
    noiseNumber({ range: range?.[1], ...options }),
    noiseNumber({ range: range?.[2], ...options }),
  ])

export const noiseUnitCircle = ({ range = [0, 2 * Math.PI], ...options }: NoiseOptions = {}) =>
  noiseNumber({ range, ...options }).output((θ: number): [number, number] => [Math.cos(θ), Math.sin(θ)])

export const noiseUnitSphere = (options?: NoiseOptions): NoiseFunction<number, [number, number, number]> =>
  noiseOutput(
    noiseTuple<number, number, number>([
      noise({ ...options, range: [0, Math.PI * 2] }),
      noise({ ...options, range: [-1, 1] }),
    ]),
    ([θ, z]) => {
      const r = Math.sqrt(1 - z ** 2)
      return [r * Math.cos(θ), r * Math.sin(θ), z] as [number, number, number]
    },
  )
  */
