import { squirrel5 } from './squirrel5'

//const DIMENSION_PRIMES = [1, 198491317, 6542989, 357239]

const reduceDimension = [
  (x: number = 0, y: number = 0) => x + 198491317 * y,
  (x: number = 0, y: number = 0, z: number = 0) => x + 198491317 * y + 6542989 * z,
  (x: number = 0, y: number = 0, z: number = 0, w: number = 0) => x + 198491317 * y + 6542989 * z + 357239 * w,
]

const lerp1D = (f0: number, f1: number, x: number) => f0 + x * (f1 - f0)

const lerp2D = (f00: number, f01: number, f10: number, f11: number, x: number, y: number) =>
  f00 * (1 - x) * (1 - y) + f01 * (1 - x) * y + f10 * x * (1 - y) + f11 * x * y

const lerp3D = (
  f000: number,
  f001: number,
  f010: number,
  f011: number,
  f100: number,
  f101: number,
  f110: number,
  f111: number,
  x: number,
  y: number,
  z: number,
) =>
  f000 * (1 - x) * (1 - y) * (1 - z) +
  f100 * x * (1 - y) * (1 - z) +
  f010 * (1 - x) * y * (1 - z) +
  f001 * (1 - x) * (1 - y) * z +
  f101 * x * (1 - y) * z +
  f011 * (1 - x) * y * z +
  f110 * x * y * (1 - z) +
  f111 * x * y * z

const scale =
  ([yMin, yMax]: readonly [number, number], [xMin, xMax]: readonly [number, number]) =>
  (inputY: number) =>
    ((inputY - yMin) / (yMax - yMin)) * (xMax - xMin) + xMin

export type NoiseFunction<T> = (...xs: readonly (number | undefined)[]) => T

export type NoiseOptions = {
  dimensions?: 1 | 2 | 3 | 4
  seed?: number | 'random'
  lerp?: boolean
  range?: [number, number]
  discrete?: boolean
  octave?: number
}

export const noise = ({
  dimensions = 1,
  seed = 0,
  lerp = false,
  range,
  discrete = false,
  octave = 0,
}: NoiseOptions = {}): NoiseFunction<number> => {

  if (seed === 'random') {
    return noise({
      dimensions,
      lerp,
      range,
      discrete,
      octave,
      seed: Math.random() * 0x7fff_ffff,
    })
  }

  if (range) {
    const n = noise({ seed, dimensions, lerp, octave }),
      s = scale([-0x7fff_ffff, 0x7fff_ffff], range)

    return discrete
      ? (...xs: readonly (number | undefined)[]) => Math.floor(s(n(...xs)))
      : (...xs: readonly (number | undefined)[]) => s(n(...xs))
  }

  if (lerp) {
    const n = noise({ seed, dimensions, octave })
    if (dimensions === 1) {
      return (x = 0) => lerp1D(n(Math.floor(x)), n(Math.ceil(x)), x % 1)
    } else if (dimensions === 2) {
      return (x = 0, y = 0) =>
        lerp2D(
          n(Math.floor(x), Math.floor(y)),
          n(Math.floor(x), Math.ceil(y)),
          n(Math.ceil(x), Math.floor(y)),
          n(Math.ceil(x), Math.ceil(y)),
          x % 1,
          y % 1,
        )
    } else if (dimensions === 3) {
      return (x = 0, y = 0, z = 0) =>
        lerp3D(
          n(Math.floor(x), Math.floor(y), Math.floor(z)),
          n(Math.floor(x), Math.floor(y), Math.ceil(z)),
          n(Math.floor(x), Math.ceil(y), Math.floor(z)),
          n(Math.floor(x), Math.ceil(y), Math.ceil(z)),
          n(Math.ceil(x), Math.floor(y), Math.floor(z)),
          n(Math.ceil(x), Math.floor(y), Math.ceil(z)),
          n(Math.ceil(x), Math.ceil(y), Math.floor(z)),
          n(Math.ceil(x), Math.ceil(y), Math.ceil(z)),
          x % 1,
          y % 1,
          z % 1,
        )
    } else {
      throw Error('Four dimensional LERP not implemented.')
    }
  }

  if (dimensions !== 1) {
    const n = noise({ seed, octave })
    return (x?: number, y?: number, z?: number, w?: number) => n(reduceDimension[dimensions - 2](x, y, z, w))
  }

  if (octave) {
    const n = noise({ seed })
    return x => n(x! >> octave)
  }

  // base case, just the default options (and seed)
  const sq = squirrel5(seed)
  return x => sq(x)
}
