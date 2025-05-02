import { squirrel5 } from './squirrel5'

export type Dimension = 1 | 2 | 3 | 4

export type Lerp = false | 1 | 2 | 3

export type Seed = number | 'random' | 'generate' | 'declaration'

type OptionalNumberFunc = ((x: number) => number) | undefined | null

type InputArgs = any[] // eslint-disable-line @typescript-eslint/no-explicit-any

export type NoiseOutput<TOut> = (x: number) => TOut

interface NoiseBuilderOptions<TIn extends InputArgs, TOut> {
  input: (...x: TIn) => number
  output: NoiseOutput<TOut>
  dimensions?: Dimension
  lerp?: Lerp
  seed?: Seed
  onSeeding?: (s: number) => void
  range?: [number, number]
  octave?: number
  discrete?: boolean
}

class NoiseBuilder<TIn extends InputArgs, TOut> {
  protected static numberFuncIdentity = (x: number) => x

  private static numberPipe = (fn1?: OptionalNumberFunc, ...rest: OptionalNumberFunc[]): ((x: number) => number) => {
    if (!rest?.length) {
      return fn1 ?? NoiseBuilder.numberFuncIdentity
    }

    if (!fn1) {
      return NoiseBuilder.numberPipe(...rest)
    }

    const np = NoiseBuilder.numberPipe(...rest)
    return (x: number) => np(fn1(x))
  }

  private static seedGenerator = (() => {
    let i = 0
    const n = squirrel5(0x5eed5)
    return () => n(i++)
  })()

  private generateSeed(): number {
    let result: number = 0
    switch (this.options.seed) {
      case 'declaration':
      case undefined:
        try {
          throw Error('')
        } catch (e) {
          result = [...(e as Error).stack!].reduce((s, c) => (Math.imul(31, s) + c.charCodeAt(0)) | 0, 0)
        }
        break
      case 'generate':
        result = NoiseBuilder.seedGenerator()
        break
      case 'random':
        result = Math.trunc(Math.random() * 0xffff_ffff)
        break
      default:
        result = this.options.seed
    }
    this.options.onSeeding?.(result)
    return result
  }

  constructor(protected options: NoiseBuilderOptions<TIn, TOut>) {}

  input(): (...x: TIn) => number {
    return this.options.input
  }

  output(): NoiseOutput<TOut> {
    return this.options.output
  }

  dimensions(): Dimension {
    return this.options.dimensions ?? 1
  }

  lerp(): Lerp {
    return this.options.lerp ?? false
  }

  seed(): Seed {
    return this.options.seed ?? 'declaration'
  }

  onSeeding(): undefined | ((s: number) => void) {
    return this.options.onSeeding
  }

  range(): [number, number] {
    return this.options.range ?? [-0x7fff_ffff, 0x7fff_ffff]
  }

  octave(): number {
    return this.options.octave ?? 0
  }

  discrete(): boolean {
    return this.options.discrete ?? false
  }

  private get octaveFn() {
    return this.options.octave ? (x: number) => x >>> this.options.octave! : null
  }

  private get rangeFn() {
    return this.options.range
      ? (x: number) =>
          ((x - -0x7fff_ffff) / (0x7fff_ffff - -0x7fff_ffff)) * (this.options.range![1] - this.options.range![0]) +
          this.options.range![0]
      : null
  }

  private get discreteFn() {
    return this.options.discrete ? Math.floor : null
  }

  protected get noiseFuncInternal() {
    return NoiseBuilder.numberPipe(this.octaveFn, squirrel5(this.generateSeed()), this.rangeFn, this.discreteFn)
  }

  func(): (...x: TIn) => TOut {
    const np = this.noiseFuncInternal
    return (...x: TIn) => this.options.output(np(this.options.input(...x)))
  }

  *generator(length = Infinity): IterableIterator<TOut> {
    const np = this.noiseFuncInternal
    for (let i = 0; i < length; i++) {
      yield this.options.output(np(i))
    }
  }
}

class NoiseBuilderFluent<TIn extends InputArgs> extends NoiseBuilder<TIn, number> {
  constructor(options: Omit<NoiseBuilderOptions<TIn, number>, 'output'>) {
    super({ ...options, output: NoiseBuilder.numberFuncIdentity })
  }

  clone(): NoiseBuilderFluent<TIn> {
    return new NoiseBuilderFluent(this.options)
  }

  output(): NoiseOutput<number>
  output<T>(fn: NoiseOutput<T>): NoiseBuilder<TIn, T>
  output<T>(fn?: NoiseOutput<T>): NoiseOutput<number> | NoiseBuilder<TIn, T> {
    if (!fn) return this.options.output
    return new NoiseBuilder<TIn, T>({ ...this.options, output: fn })
  }

  asBoolean(): NoiseBuilder<TIn, boolean> {
    return new NoiseBuilderFluent({ ...this.options }).output((x: number) => !(x & 1))
  }

  seed(): Seed
  seed(value: Seed): this
  seed(value?: Seed): Seed | this {
    if (value === undefined) return this.options.seed ?? 'declaration'
    this.options.seed = value
    return this
  }

  onSeeding(): (s: number) => void
  onSeeding(cb: (s: number) => void): this
  onSeeding(cb?: (s: number) => void): ((s: number) => void) | undefined | this {
    if (!cb) return this.options.onSeeding
    this.options.onSeeding = cb
    return this
  }

  range(): [number, number]
  range(value: [number, number]): this
  range(value?: [number, number]): [number, number] | this {
    if (!value) return this.options.range ?? [-0x7fff_ffff, 0x7fff_ffff]
    this.options.range = value
    return this
  }

  octave(): number
  octave(value: number): this
  octave(value?: number): number | this {
    if (!value) return this.options.octave ?? 0
    this.options.octave = value
    return this
  }

  discrete(): boolean
  discrete(value: boolean): this
  discrete(value?: boolean): boolean | this {
    if (value === undefined) return this.options.discrete ?? false
    this.options.discrete = value
    return this
  }
}

class NoiseBuilderLerp extends NoiseBuilderFluent<number[]> {
  private static lerp1D = (f0: number, f1: number, x: number) => f0 + x * (f1 - f0)

  private static lerp2D = (f00: number, f01: number, f10: number, f11: number, x: number, y: number) =>
    f00 * (1 - x) * (1 - y) + f01 * (1 - x) * y + f10 * x * (1 - y) + f11 * x * y

  private static lerp3D = (
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

  constructor(lerpDimension: Lerp) {
    super({
      dimensions: lerpDimension || 1,
      lerp: lerpDimension,
      input: NoiseBuilder.numberFuncIdentity,
    })
  }

  func(): (...x: number[]) => number {
    const n = super.func()

    switch (this.options.lerp) {
      case 1:
        return (x = 0) => NoiseBuilderLerp.lerp1D(n(Math.floor(x)), n(Math.ceil(x)), x % 1)
      case 2:
        return (x = 0, y = 0) =>
          NoiseBuilderLerp.lerp2D(
            n(Math.floor(x), Math.floor(y)),
            n(Math.floor(x), Math.ceil(y)),
            n(Math.ceil(x), Math.floor(y)),
            n(Math.ceil(x), Math.ceil(y)),
            x % 1,
            y % 1,
          )
      case 3:
        return (x = 0, y = 0, z = 0) =>
          NoiseBuilderLerp.lerp3D(
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
      case false:
      default:
        return n
    }
  }
}

class NoiseBuilderInput extends NoiseBuilderFluent<number[]> {
  constructor() {
    super({ input: NoiseBuilder.numberFuncIdentity })
  }

  input<TIn extends InputArgs>(): (...x: TIn) => number
  input<TIn extends InputArgs>(fn: (...x: TIn) => number): NoiseBuilderFluent<TIn>
  input<TIn extends InputArgs>(fn?: (...x: TIn) => number): ((...x: TIn) => number) | NoiseBuilderFluent<TIn> {
    if (!fn) return this.options.input
    return new NoiseBuilderFluent<TIn>({ ...this.options, input: fn })
  }

  dimensions(): Dimension
  dimensions(value: Dimension): NoiseBuilderFluent<number[]>
  dimensions(value?: Dimension): Dimension | NoiseBuilderFluent<number[]> {
    if (value === undefined) return this.options.dimensions ?? 1
    this.options.dimensions = value
    switch (value) {
      case 1:
        return this.input((x = 0) => x)
      case 2:
        return this.input((x = 0, y = 0) => x + 198491317 * y)
      case 3:
        return this.input((x = 0, y = 0, z = 0) => x + 198491317 * y + 6542989 * z)
      case 4:
        return this.input((x = 0, y = 0, z = 0, w = 0) => x + 198491317 * y + 6542989 * z + 357239 * w)
    }
  }

  lerp(): Lerp
  lerp(value: Lerp): NoiseBuilderLerp
  lerp(value?: Lerp): Lerp | NoiseBuilderLerp {
    if (value === undefined) return this.options.lerp ?? false
    return new NoiseBuilderLerp(value)
  }

  fromString(): NoiseBuilderFluent<string[]> {
    return this.input((str: string) => [...str].reduce((s, c) => (Math.imul(31, s) + c.charCodeAt(0)) | 0, 0))
  }

  fromIncrement(start = 0): NoiseBuilderFluent<never> {
    return this.input(
      (() => {
        let i = start
        return () => i++
      })(),
    )
  }
}

export const noise = () => new NoiseBuilderInput()

/*
function noiseTuple<TIn extends InputArgs>(): (...x: TIn) => []
function noiseTuple<TIn extends InputArgs, T1>(n1: NoiseBuilder<TIn, T1>): (...x: TIn) => [T1]
function noiseTuple<TIn extends InputArgs, T1, T2>(n1: NoiseBuilder<TIn, T1>, n2: NoiseBuilder<TIn, T2>): (...x: TIn) => [T1, T2]
function noiseTuple<TIn extends InputArgs>(...ns: NoiseBuilder<TIn, unknown>[]) {
  const fns = ns.map(n => n.func())
  return (xs: TIn) => fns.map(f => f(...xs))
}

const t = noiseTuple(
  noise().range([0, 10]),
  noise().range([0, 1]).asBoolean() 
)
*/
