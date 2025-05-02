import { squirrel5 } from './squirrel5'

export type Dimension = 1 | 2 | 3 | 4

export type Lerp = false | 1 | 2 | 3

export type Seed = number | 'random' | 'generate' | 'declaration'

type OptionalNumberFunc = ((x: number) => number) | undefined | null

type InputArgs = any[] // eslint-disable-line @typescript-eslint/no-explicit-any

type TupleOutput = any[] // eslint-disable-line @typescript-eslint/no-explicit-any

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

interface NoiseBuilderProps<TIn extends InputArgs, TOut> {
  input(): (...x: TIn) => number
  output(): NoiseOutput<TOut>
  dimensions(): Dimension
  lerp(): Lerp
  seed(): Seed
  onSeeding(): undefined | ((s: number) => void)
  range(): [number, number]
  octave(): number
  discrete(): boolean
  clone(): NoiseBuilder<TIn, TOut>
}

interface NoiseBuilderExecution<TIn extends InputArgs, TOut> {
  func(): (...x: TIn) => TOut
  generator(length: number): IterableIterator<TOut>
}

type NoiseBuilderFluentFinal<TIn extends InputArgs, TOut> = NoiseBuilderProps<TIn, TOut> &
  NoiseBuilderExecution<TIn, TOut>

type NoiseBuilderFluentResult<TIn extends InputArgs, TOut> = NoiseBuilderFluent<TIn, TOut> &
  NoiseBuilderProps<TIn, TOut> &
  NoiseBuilderExecution<TIn, TOut> &
  NoiseBuilderOutputs<TIn, TOut>

interface NoiseBuilderFluent<TIn extends InputArgs, TOut> {
  seed(value: Seed): NoiseBuilderFluentResult<TIn, TOut>
  onSeeding(cb: (s: number) => void): NoiseBuilderFluentResult<TIn, TOut>
  range(value: [number, number]): NoiseBuilderFluentResult<TIn, TOut>
  octave(value: number): NoiseBuilderFluentResult<TIn, TOut>
  discrete(value: boolean): NoiseBuilderFluentResult<TIn, TOut>
}

interface NoiseBuilderOutputs<TIn extends InputArgs, TOut> {
  output<TOutNext>(value: (x: number) => TOutNext): NoiseBuilderFluentFinal<TIn, TOutNext>
  tuple(): NoiseBuilderTuple<TIn, [], TOut>
  asBoolean(): NoiseBuilder<TIn, boolean>
  asNumber(): NoiseBuilder<TIn, number>
  asVect2D(range?: [[number, number] | undefined, [number, number] | undefined]): NoiseBuilder<TIn, [number, number]>
  asVect3D(
    range?: [[number, number] | undefined, [number, number] | undefined, [number, number] | undefined],
  ): NoiseBuilder<TIn, [number, number, number]>
}

type NoiseBuilderInputResult<TIn extends InputArgs, TOut> = NoiseBuilderFluent<TIn, TOut> &
  NoiseBuilderProps<TIn, TOut> &
  NoiseBuilderExecution<TIn, TOut>

interface NoiseBuilderInputFluent<TIn extends InputArgs, TOut> {
  input(fn: (...x: TIn) => number): NoiseBuilderInputResult<TIn, TOut>
  dimensions(value: Dimension): NoiseBuilderFluent<number[], TOut>
  fromString(): NoiseBuilderFluent<string[], TOut>
  fromIncrement(start: number): NoiseBuilderFluent<never, TOut>
}

// TODO: restrict the exported object to this interface
//type NoiseBuilderStart<TIn extends InputArgs, TOut> = NoiseBuilderInputFluent<TIn, TOut> &
//  NoiseBuilderInputResult<TIn, TOut>

type NoiseBuilderFunctor<TIn extends InputArgs, TOutNext, TParentOut> =
  | NoiseBuilder<TIn, TOutNext>
  | ((parent: NoiseBuilder<TIn, TParentOut>) => NoiseBuilder<TIn, TOutNext>)

// TODO: add interface to Tuple class
/*
interface NoiseBuilderTupleFluent<TIn extends InputArgs, TOuts extends TupleOutput> {
  element<TOutNext>(nb: NoiseBuilder<TIn, TOutNext>): NoiseBuilderTuple<TIn, [...TOuts, TOutNext]>
  output<TOut>(fn: (t: TOuts) => TOut): NoiseBuilderFluentFinal<TIn, TOut>
}
*/

class NoiseBuilder<TIn extends InputArgs, TOut>
  implements
    NoiseBuilderInputFluent<TIn, TOut>,
    NoiseBuilderFluent<TIn, TOut>,
    NoiseBuilderOutputs<TIn, TOut>,
    NoiseBuilderExecution<TIn, TOut>,
    NoiseBuilderProps<TIn, TOut>
{
  protected static numberFuncIdentity = (x: number) => x

  //#region utils

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

  protected static dimensionInput(d: Dimension) {
    switch (d) {
      case 1:
        return NoiseBuilder.numberFuncIdentity
      case 2:
        return (x = 0, y = 0) => x + 198491317 * y
      case 3:
        return (x = 0, y = 0, z = 0) => x + 198491317 * y + 6542989 * z
      case 4:
        return (x = 0, y = 0, z = 0, w = 0) => x + 198491317 * y + 6542989 * z + 357239 * w
    }
  }

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

  protected static factory<TIn extends InputArgs, TOut>(options: NoiseBuilderOptions<TIn, TOut>) {
    if (!options.lerp) {
      return new NoiseBuilder(options)
    } else {
      return new NoiseBuilderLerp(options)
    }
  }

  //#endregion

  constructor(protected options: NoiseBuilderOptions<TIn, TOut>) {}

  // TODO: restrict the return to the appropriate interface
  clone(): NoiseBuilder<TIn, TOut> {
    return NoiseBuilder.factory(this.options)
  }

  //#region inputs

  input(): (...x: TIn) => number
  input<TInNext extends InputArgs>(fn: (...x: TInNext) => number): NoiseBuilderInputResult<TInNext, TOut>
  input<TInNext extends InputArgs>(
    fn?: (...x: TInNext) => number,
  ): ((...x: TIn) => number) | NoiseBuilderInputResult<TInNext, TOut> {
    if (!fn) return this.options.input
    return NoiseBuilder.factory({ ...this.options, input: fn })
  }

  dimensions(): Dimension
  dimensions(value: Dimension): NoiseBuilderInputResult<number[], TOut>
  dimensions(value?: Dimension): Dimension | NoiseBuilderInputResult<number[], TOut> {
    if (value === undefined) return this.options.dimensions ?? 1
    this.options.dimensions = value
    return this.input(NoiseBuilder.dimensionInput(value))
  }

  lerp(): Lerp
  lerp(value: Lerp): NoiseBuilderInputResult<number[], TOut>
  lerp(value?: Lerp): Lerp | NoiseBuilderInputResult<number[], TOut> {
    if (value === undefined) return this.options.lerp ?? false
    return NoiseBuilder.factory({
      ...this.options,
      lerp: value,
      dimensions: value || 1,
      output: this.options.output,
      input: NoiseBuilder.dimensionInput(value || 1),
    })
  }

  fromString(): NoiseBuilderInputResult<string[], TOut> {
    return this.input((str: string) => [...str].reduce((s, c) => (Math.imul(31, s) + c.charCodeAt(0)) | 0, 0))
  }

  fromIncrement(): NoiseBuilderInputResult<number[], TOut> {
    let i = 0
    return this.input(() => i++)
  }

  //#endregion

  //#region outputs

  // TODO: restrict the response to the Final interface, but this will mess with tuple
  output(): NoiseOutput<TOut>
  output<T>(fn: NoiseOutput<T>): NoiseBuilder<TIn, T>
  output<T>(fn?: NoiseOutput<T>): NoiseOutput<TOut> | NoiseBuilder<TIn, T> {
    if (!fn) return this.options.output
    return NoiseBuilder.factory<TIn, T>({ ...this.options, output: fn })
  }

  tuple(): NoiseBuilderTuple<TIn, [], TOut> {
    return NoiseBuilderTuple.create(this)
  }

  asBoolean(): NoiseBuilder<TIn, boolean> {
    return this.output(x => !(x & 1))
  }

  asNumber(): NoiseBuilder<TIn, number> {
    return this.output(x => x)
  }

  asVect2D(
    [rx, ry]: [[number, number] | undefined, [number, number] | undefined] = [undefined, undefined],
  ): NoiseBuilder<TIn, [number, number]> {
    return this.asNumber()
      .tuple()
      .element(n => n.range(rx ?? this.range()))
      .element(n => n.range(ry ?? this.range()))
      .output()
  }

  asVect3D(
    [rx, ry, rz]: [[number, number] | undefined, [number, number] | undefined, [number, number] | undefined] = [
      undefined,
      undefined,
      undefined,
    ],
  ): NoiseBuilder<TIn, [number, number, number]> {
    return this.output(x => x)
      .tuple()
      .element(n => n.range(rx ?? this.range()))
      .element(n => n.range(ry ?? this.range()))
      .element(n => n.range(rz ?? this.range()))
      .output()
  }

  //#endregion

  //#region Props

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

  //#endregion

  //#region Execution

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

  protected noiseFuncInternal() {
    return NoiseBuilder.numberPipe(this.octaveFn, squirrel5(this.generateSeed()), this.rangeFn, this.discreteFn)
  }

  func(): (...x: TIn) => TOut {
    const np = this.noiseFuncInternal()
    return (...x: TIn) => this.options.output(np(this.options.input(...x)))
  }

  *generator(stop = Infinity, step = 1): IterableIterator<TOut> {
    const np = this.noiseFuncInternal()
    for (let i = 0; i < stop; i += step) {
      yield this.options.output(np(i))
    }
  }

  //#endregion
}

class NoiseBuilderLerp<TOut> extends NoiseBuilder<number[], TOut> {
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

  constructor({ lerp, output }: Omit<NoiseBuilderOptions<number[], TOut>, 'input'>) {
    super({
      dimensions: lerp || 1,
      lerp,
      input: NoiseBuilder.dimensionInput(lerp || 1),
      output,
    })
  }

  func(): (...x: number[]) => TOut {
    const ni = this.noiseFuncInternal()
    const n = (...x: number[]) => ni(this.options.input(...x))

    switch (this.options.lerp) {
      case 1:
        return (x = 0) => this.options.output(NoiseBuilderLerp.lerp1D(n(Math.floor(x)), n(Math.ceil(x)), x % 1))
      case 2:
        return (x = 0, y = 0) =>
          this.options.output(
            NoiseBuilderLerp.lerp2D(
              n(Math.floor(x), Math.floor(y)),
              n(Math.floor(x), Math.ceil(y)),
              n(Math.ceil(x), Math.floor(y)),
              n(Math.ceil(x), Math.ceil(y)),
              x % 1,
              y % 1,
            ),
          )
      case 3:
        return (x = 0, y = 0, z = 0) =>
          this.options.output(
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
            ),
          )
      case false:
      default:
        return super.func()
    }
  }
}

class NoiseBuilderTuple<TIn extends InputArgs, TOuts extends TupleOutput, TParentOut> {
  static create<T extends InputArgs, TP>(parent: NoiseBuilder<T, TP>): NoiseBuilderTuple<T, [], TP> {
    return new NoiseBuilderTuple<T, [], TP>(
      parent,
      new NoiseBuilder<T, []>({ input: parent.input(), output: () => [] }),
    )
  }

  private constructor(
    private parent: NoiseBuilder<TIn, TParentOut>,
    private child: NoiseBuilder<TIn, TOuts>,
  ) {}

  element<TOutNext>(
    nb: NoiseBuilderFunctor<TIn, TOutNext, TParentOut>,
  ): NoiseBuilderTuple<TIn, [...TOuts, TOutNext], TParentOut> {
    const n = typeof nb === 'function' ? nb(this.parent.clone()) : nb,
      f = n.output(),
      c = this.child.output()

    return new NoiseBuilderTuple(
      this.parent,
      n.output((x: number) => [...c(x), f(x)]),
    )
  }

  output(): NoiseBuilder<TIn, TOuts>
  output<TOut>(fn: (t: TOuts) => TOut): NoiseBuilder<TIn, TOut>
  output<TOut>(fn?: (t: TOuts) => TOut): NoiseBuilder<TIn, TOuts> | NoiseBuilder<TIn, TOut> {
    if (!fn) {
      return this.child
    }

    const tupleOut = this.child.output()
    return this.child.output((x: number) => fn(tupleOut(x)))
  }

  func(): (...x: TIn) => TOuts {
    return this.child.func()
  }

  *generator(stop = Infinity, step = 1): IterableIterator<TOuts> {
    yield* this.child.generator(stop, step)
  }
}

// TODO: return this as the appropriate interface, not the raw class
export const noise = () => new NoiseBuilder({ input: (x: number) => x, output: (x: number) => x }) //as NoiseBuilderStart<number[], number>

/* working example of tuple in action
const nt = noise()
  .tuple()
  .element(n => n.range([2, 3]))
  .element(n => n.output(x => !(x & 1)))
  .element(n => n.output(x => x.toString()))
  //.output(([a, b, c]) => b)
  .func()
//*/
