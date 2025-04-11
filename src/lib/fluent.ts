/* eslint @typescript-eslint/no-explicit-any: 0 */
/* eslint @typescript-eslint/no-unused-vars: 0 */

import { noise as noiseBase, NoiseOptions } from './noise'

export interface NoiseFunction<TIn, TOut> {
  (x: TIn): TOut
  generator(): IterableIterator<TOut>
  random(): () => TOut
}

export interface NoiseFunctionWithProps<TIn, TOut> extends NoiseFunction<TIn, TOut> {
  input<T>(): (x: T) => number
  input<T>(fn: (x: T) => number): NoiseFunction<T, TOut>
  output<T>(): (x: number) => TOut
  output<T>(fn: (x: number) => T): NoiseFunction<TIn, T>

  options(): NoiseOptions
  options(value: NoiseOptions): this
  seed(): number
  seed(s: number | 'random'): this
  octave(): number
  octave(value: number): this
  range(): [number, number]
  range(value: [number, number]): this
  discrete(): boolean
  discrete(value: boolean): this
  lerp(): boolean
  lerp(value: boolean): this
}

export interface NoiseBuilderOptions<TIn, TOut> extends NoiseOptions {
  input: (x: TIn) => number
  output: (x: number) => TOut
}

const noiseBuilder = <TIn, TOut>({
  input,
  output,
  ...options
}: NoiseBuilderOptions<TIn, TOut>): NoiseFunctionWithProps<TIn, TOut> => {
  options.seed = options.seed === 'random' ? (Math.random() * 0x7fff_ffff) | 0 : options.seed

  let n = noiseBase(options)

  const updateNoise = () => {
    n = noiseBase(options)
  }

  function noise(x: TIn) {
    return output(n(input(x)))
  }

  function inputAccessor<T>(): (x: TIn) => number
  function inputAccessor<T>(fn: (x: TIn) => number): NoiseFunctionWithProps<T, TOut>
  function inputAccessor<T>(dimensions: 1): NoiseFunctionWithProps<number, TOut>
  function inputAccessor<T>(dimensions: 2): NoiseFunctionWithProps<[number, number], TOut>
  function inputAccessor<T>(dimensions: 3): NoiseFunctionWithProps<[number, number, number], TOut>
  function inputAccessor<T>(dimensions: 4): NoiseFunctionWithProps<[number, number, number, number], TOut>
  function inputAccessor<T>(
    fn?: ((x: T) => number) | 1 | 2 | 3 | 4,
  ):
    | ((x: TIn) => number)
    | NoiseFunctionWithProps<T, TOut>
    | NoiseFunctionWithProps<number, TOut>
    | NoiseFunctionWithProps<[number, number], TOut>
    | NoiseFunctionWithProps<[number, number, number], TOut>
    | NoiseFunctionWithProps<[number, number, number, number], TOut> {
    
    if (fn === undefined) return input
    
    switch (fn) {
      case 1:
        return noiseBuilder<number, TOut>({ ...options, output, input: (x = 0) => x })
      case 2:
        return noiseBuilder<[number, number], TOut>({
          ...options,
          output,
          input: ([x = 0, y = 0]) => x + 198491317 * y,
        })
      case 3:
        return noiseBuilder<[number, number, number], TOut>({
          ...options,
          output,
          input: ([x = 0, y = 0, z = 0]) => x + 198491317 * y + 6542989 * z,
        })
      case 4:
        return noiseBuilder<[number, number, number, number], TOut>({
          ...options,
          output,
          input: ([x = 0, y = 0, z = 0, w = 0]) => x + 198491317 * y + 6542989 * z + 357239 * w,
        })
      default:
        return noiseBuilder({ ...options, output, input: fn as ((x: T) => number) })
    }
  }

  noise.input = inputAccessor

  function outputAccessor<T>(): (x: number) => TOut
  function outputAccessor<T>(fn: (x: number) => T): NoiseFunctionWithProps<TIn, T>
  function outputAccessor<T>(fn?: (x: number) => T): ((x: number) => TOut) | NoiseFunctionWithProps<TIn, T> {
    if (fn === undefined) return output
    return noiseBuilder({ ...options, input, output: fn })
  }

  noise.output = outputAccessor

  function optionsAccessor(): NoiseOptions
  function optionsAccessor(value: NoiseOptions): NoiseFunctionWithProps<TIn, TOut>
  function optionsAccessor(value?: NoiseOptions): NoiseOptions | NoiseFunctionWithProps<TIn, TOut> {
    if (value === undefined) return options
    options = value
    updateNoise()
    return noise as NoiseFunctionWithProps<TIn, TOut>
  }

  noise.options = optionsAccessor

  function seedAccessor(): number
  function seedAccessor(s: number): NoiseFunctionWithProps<TIn, TOut>
  function seedAccessor(s?: number): number | NoiseFunctionWithProps<TIn, TOut> {
    if (s === undefined) return options.seed as number
    options.seed = s
    updateNoise()
    return noise as NoiseFunctionWithProps<TIn, TOut>
  }

  noise.seed = seedAccessor

  function octaveAccessor(): number
  function octaveAccessor(value: number): NoiseFunctionWithProps<TIn, TOut>
  function octaveAccessor(value?: number): number | NoiseFunctionWithProps<TIn, TOut> {
    if (value === undefined) return options.octave ?? 0
    options.octave = value
    updateNoise()
    return noise as NoiseFunctionWithProps<TIn, TOut>
  }

  noise.octave = octaveAccessor

  function rangeAccessor(): [number, number]
  function rangeAccessor(value: [number, number]): NoiseFunctionWithProps<TIn, TOut>
  function rangeAccessor(value?: [number, number]): [number, number] | NoiseFunctionWithProps<TIn, TOut> {
    if (value === undefined) return options.range ?? [-0x7fff_ffff, 0x7fff_ffff]
    options.range = value
    updateNoise()
    return noise as NoiseFunctionWithProps<TIn, TOut>
  }

  noise.range = rangeAccessor

  function discreteAccessor(): boolean
  function discreteAccessor(value: boolean): NoiseFunctionWithProps<TIn, TOut>
  function discreteAccessor(value?: boolean): boolean | NoiseFunctionWithProps<TIn, TOut> {
    if (value === undefined) return options.discrete ?? false
    options.discrete = value
    updateNoise()
    return noise as NoiseFunctionWithProps<TIn, TOut>
  }

  noise.discrete = discreteAccessor

  function lerpAccessor(): boolean
  function lerpAccessor(value: boolean): NoiseFunctionWithProps<TIn, TOut>
  function lerpAccessor(value?: boolean): boolean | NoiseFunctionWithProps<TIn, TOut> {
    if (value === undefined) return options.lerp ?? false
    options.lerp = value
    updateNoise()
    return noise as NoiseFunctionWithProps<TIn, TOut>
  }

  noise.lerp = lerpAccessor

  noise.generator = function* (length: number = Infinity) {
    let i = 1

    while (i < length) {
      yield output(n(i++))
    }
  }

  noise.random = (): (() => TOut) => {
    const g = noise.generator()
    return () => g.next().value as TOut
  }

  return noise
}

export const noise = (options: NoiseOptions = {}) =>
  noiseBuilder({
    ...options,
    input: (x: number) => x,
    output: (x: number) => x,
  })
