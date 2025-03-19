import { squirrel5 } from './squirrel5'

//const DIMENSION_PRIMES = [1, 198491317, 6542989, 357239]

const reduceDimension = [
  () => 0, // degenerate case
  () => 0, // unused case
  (x?: number, y?: number) => (x ?? 0) + 198491317 * (y ?? 0),
  (x?: number, y?: number, z?: number) =>
    (x ?? 0) + 198491317 * (y ?? 0) + 6542989 * (z ?? 0),
  (x?: number, y?: number, z?: number, w?: number) =>
    (x ?? 0) + 198491317 * (y ?? 0) + 6542989 * (z ?? 0) + 357239 * (w ?? 0),
]

const lerp1D = (f0: number, f1: number, x: number) => f0 + x * (f1 - f0)

const lerp2D = (
  f00: number,
  f01: number,
  f10: number,
  f11: number,
  x: number,
  y: number
) =>
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
  z: number
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
  (
    [yMin, yMax]: readonly [number, number],
    [xMin, xMax]: readonly [number, number]
  ) =>
  (inputY: number) =>
    ((inputY - yMin) / (yMax - yMin)) * (xMax - xMin) + xMin

const incrementor = () => {
  let x = 0 // eslint-disable-line functional/no-let
  return () => ++x
}

export type NoiseFunction<T> = (...xs: readonly (number | undefined)[]) => T

export type NoiseOptions = {
  readonly dimensions?: 1 | 2 | 3 | 4
  readonly seed?: number
  readonly generator?: boolean
  readonly lerp?: boolean
  readonly range?: readonly [number, number]
  readonly discrete?: boolean
}

export const noise = ({
  dimensions = 1,
  seed = 0,
  generator = false,
  lerp = false,
  range,
  discrete = false,
}: NoiseOptions = {}): NoiseFunction<number> => {
  // the generator option is not compatible with dimensions (it's essentially 0-dimensional)
  // Also, lerp has no effect on the output, so both options are not passed through intentionally.
  if (generator) {
    const n = noise({ seed, range, discrete }),
      c = incrementor()
    return () => n(c())
  }

  if (range) {
    const n = noise({ seed, dimensions, lerp }),
      s = scale([-0x7fffffff, 0x7fffffff], range)

    return discrete 
      ? (x = 0) => Math.floor(s(n(x)))
      : (x = 0) => s(n(x))
  }

  if (lerp) {
    const n = noise({ seed, dimensions })
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
          y % 1
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
          z % 1
        )
    } else {
      throw Error('Four dimensional LERP not implemented.') // eslint-disable-line functional/no-throw-statement
    }
  }

  if (dimensions !== 1) {
    const n = noise({ seed })
    return (x?: number, y?: number, z?: number, w?: number) =>
      n(reduceDimension[dimensions](x, y, z, w))
  }

  // base case, just the default options (and seed)
  const sq = squirrel5(seed)
  return (x = 0) => sq(x)
}
