import { squirrel5 } from './squirrel5'

export type Dimension = 1 | 2 | 3 | 4

export type Lerp = false | 1 | 2 | 3

export type Seed = number | 'random' | 'generate' | 'declaration'

type OptionalNumberFunc = ((x: number) => number) | undefined | null

type OutputArg = any // eslint-disable-line @typescript-eslint/no-explicit-any

export type NoiseOutput<TOut> = (x: number) => TOut

interface NoiseBuilderOptions<TOut> {
  input?: (...x: number[]) => number
  output: NoiseOutput<TOut>
  dimensions?: Dimension
  lerp?: Lerp
  seed?: Seed
  onSeeding?: (s: number) => void
  range?: [number, number]
  octave?: number
  discrete?: boolean
}

//#region NoiseBuilder Interfaces

interface NoiseBuilderProps<TOut> {
  input(): (...x: number[]) => number
  output(): NoiseOutput<TOut>
  dimensions(): Dimension
  lerp(): Lerp
  seed(): Seed
  onSeeding(): undefined | ((s: number) => void)
  range(): [number, number]
  octave(): number
  discrete(): boolean
  clone(): NoiseBuilder<TOut>
}

interface NoiseBuilderExecution<TOut> {
  noise(): (...x: number[]) => TOut
  generator(length: number): IterableIterator<TOut>
}

type NoiseBuilderFluentFinal<TOut> = NoiseBuilderProps<TOut> & NoiseBuilderExecution<TOut>

type NoiseBuilderFluentResult<TOut> = NoiseBuilderFluent<TOut> &
  NoiseBuilderProps<TOut> &
  NoiseBuilderExecution<TOut> &
  NoiseBuilderOutputs // <TOut>

interface NoiseBuilderFluent<TOut> {
  seed(value: Seed): NoiseBuilderFluentResult<TOut>
  onSeeding(cb: (s: number) => void): NoiseBuilderFluentResult<TOut>
  range(value: [number, number]): NoiseBuilderFluentResult<TOut>
  octave(value: number): NoiseBuilderFluentResult<TOut>
  discrete(value: boolean): NoiseBuilderFluentResult<TOut>
}

interface NoiseBuilderOutputs {
  //, TOut> {
  output<TOutNext>(value: (x: number) => TOutNext): NoiseBuilderFluentFinal<TOutNext>
  //tuple(): NoiseBuilderTuple<TIn, TOut, []>
  asBoolean(): NoiseBuilder<boolean>
  asNumber(fn?: ((x: number) => number) | [number, number]): NoiseBuilder<number>
  asVect2D(range?: [[number, number] | undefined, [number, number] | undefined]): NoiseBuilder<[number, number]>
  asVect3D(
    range?: [[number, number] | undefined, [number, number] | undefined, [number, number] | undefined],
  ): NoiseBuilder<[number, number, number]>
  asCircle(radius?: number, angleRange?: [number, number]): NoiseBuilder<[number, number]>
  asSphere(radius?: number): NoiseBuilder<[number, number, number]>
  asDisc(radius?: [number, number] | number, angleRange?: [number, number]): NoiseBuilder<[number, number]>
  asBall(radius?: number | [number, number]): NoiseBuilder<[number, number, number]>
  asList<T>(items: T[], weights?: number[]): NoiseBuilder<T>
  asGuassian(mean?: number, stdev?: number, clamp?: [number, number]): NoiseBuilder<[number, number]>
  asPoisson(lambda?: number, clamp?: [number, number]): NoiseBuilder<number>
  asDice(ds?: number | number[]): NoiseBuilder<number>
}

type NoiseBuilderInputResult<TOut> = NoiseBuilderFluent<TOut> &
  NoiseBuilderOutputs & // <TOut> &
  NoiseBuilderProps<TOut> &
  NoiseBuilderExecution<TOut>

interface NoiseBuilderInputFluent<TOut> {
  input(fn: (...x: number[]) => number): NoiseBuilderInputResult<TOut>
  dimensions(value: Dimension): NoiseBuilderInputResult<TOut>
  fromIncrement(start: number): NoiseBuilderInputResult<TOut>
}

// TODO: restrict the exported object to this interface
//type NoiseBuilderStart<TIn extends InputArgs, TOut> = NoiseBuilderInputFluent<TIn, TOut> &
//  NoiseBuilderInputResult<TIn, TOut>

type NoiseBuilderFunctor<TOutNext, TParentOut> =
  | NoiseBuilder<TOutNext>
  | ((parent: NoiseBuilder<TParentOut>) => NoiseBuilder<TOutNext>)

// TODO: add interface to Tuple class
/*
interface NoiseBuilderTupleFluent<TIn extends InputArgs, TOuts extends TupleOutput> {
  element<TOutNext>(nb: NoiseBuilder<TIn, TOutNext>): NoiseBuilderTuple<TIn, [...TOuts, TOutNext]>
  output<TOut>(fn: (t: TOuts) => TOut): NoiseBuilderFluentFinal<TIn, TOut>
}
*/

//#endregion

class NoiseBuilder<TOut>
  implements
    NoiseBuilderInputFluent<TOut>,
    NoiseBuilderFluent<TOut>,
    NoiseBuilderOutputs, // <TOut>,
    NoiseBuilderExecution<TOut>,
    NoiseBuilderProps<TOut>
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

  protected static factory<TOut>(options: NoiseBuilderOptions<TOut>) {
    if (!options.lerp) {
      return new NoiseBuilder(options)
    } else {
      return new NoiseBuilderLerp(options)
    }
  }

  static createDefault(): NoiseBuilder<number> {
    return new NoiseBuilder({ input: (x: number) => x, output: x => x })
  }

  //#endregion

  constructor(protected options: NoiseBuilderOptions<TOut>) {}

  // TODO: restrict the return to the appropriate interface
  clone(): NoiseBuilder<TOut> {
    return NoiseBuilder.factory(this.options)
  }

  //#region inputs

  input(): (...x: number[]) => number
  input(fn: (...x: number[]) => number): NoiseBuilderInputResult<TOut>
  input(fn?: (...x: number[]) => number): ((...x: number[]) => number) | NoiseBuilderInputResult<TOut> {
    if (!fn) return this.options.input ?? NoiseBuilder.numberFuncIdentity
    return NoiseBuilder.factory({ ...this.options, input: fn })
  }

  dimensions(): Dimension
  dimensions(value: Dimension): NoiseBuilderInputResult<TOut>
  dimensions(value?: Dimension): Dimension | NoiseBuilderInputResult<TOut> {
    if (value === undefined) return this.options.dimensions ?? 1
    this.options.dimensions = value
    return this.input(NoiseBuilder.dimensionInput(value))
  }

  lerp(): Lerp
  lerp(value: Lerp): NoiseBuilderInputResult<TOut>
  lerp(value?: Lerp): Lerp | NoiseBuilderInputResult<TOut> {
    if (value === undefined) return this.options.lerp ?? false
    return NoiseBuilder.factory({
      ...this.options,
      lerp: value,
      dimensions: value || 1,
      output: this.options.output,
      input: NoiseBuilder.dimensionInput(value || 1),
    })
  }

  fromIncrement(): NoiseBuilderInputResult<TOut> {
    let i = 0
    return this.input(() => i++)
  }

  //#endregion

  //#region outputs

  // TODO: restrict the response to the Final interface, but this will mess with tuple
  output(): NoiseOutput<TOut>
  output<T>(fn: NoiseOutput<T>): NoiseBuilder<T>
  output<T>(fn?: NoiseOutput<T>): NoiseOutput<TOut> | NoiseBuilder<T> {
    if (!fn) return this.options.output
    return NoiseBuilder.factory<T>({ ...this.options, output: fn })
  }

  tuple(): NoiseBuilderTuple<TOut, []> {
    return NoiseBuilderTuple.create(this)
  }

  asBoolean(): NoiseBuilder<boolean> {
    return this.output(x => !(x & 1))
  }

  asNumber(fn: ((x: number) => number) | [number, number] = x => x): NoiseBuilder<number> {
    return typeof fn === 'function' ? this.output(fn) : this.range(fn).output(x => x)
  }

  asVect2D(
    [rx, ry]: [[number, number] | undefined, [number, number] | undefined] = [undefined, undefined],
  ): NoiseBuilder<[number, number]> {
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
  ): NoiseBuilder<[number, number, number]> {
    return this.asNumber()
      .tuple()
      .element(n => n.range(rx ?? this.range()))
      .element(n => n.range(ry ?? this.range()))
      .element(n => n.range(rz ?? this.range()))
      .output()
  }

  asCircle(radius: number = 1, angleRange: [number, number] = [0, 2 * Math.PI]): NoiseBuilder<[number, number]> {
    return this.range(angleRange).output(a => [radius * Math.cos(a), radius * Math.sin(a)])
  }

  asSphere(radius: number = 1): NoiseBuilder<[number, number, number]> {
    return this.asNumber()
      .tuple()
      .element(n => n.range([0, 2 * Math.PI]))
      .element(n => n.range([-1, 1]))
      .output(([θ, r]) => {
        const z = Math.sqrt(1 - r ** 2)
        return [z * Math.cos(θ) * radius, z * Math.sin(θ) * radius, r * radius]
      })
  }

  asDisc(
    radius: [number, number] | number = 1,
    angleRange: [number, number] = [0, 2 * Math.PI],
  ): NoiseBuilder<[number, number]> {
    return this.asNumber()
      .tuple()
      .element(n => n.asCircle(1, angleRange))
      .element(n =>
        n.range(Array.isArray(radius) ? [radius[0] ** 2, radius[1] ** 2] : [0, radius ** 2]).output(Math.sqrt),
      )
      .output(([[x, y], r]) => [x * r, y * r])
  }

  asBall(radius: number | [number, number] = 1): NoiseBuilder<[number, number, number]> {
    return this.asNumber()
      .tuple()
      .element(n => n.asSphere())
      .element(n =>
        n.range(Array.isArray(radius) ? [radius[0] ** 3, radius[1] ** 3] : [0, radius ** 3]).output(Math.cbrt),
      )
      .output(([[x, y, z], r]) => [x * r, y * r, z * r])
  }

  asList<T>(items: T[], weights?: number[]): NoiseBuilder<T> {
    if (!weights?.length) {
      return this.asNumber()
        .range([0, items.length])
        .discrete(true)
        .output(x => items[x])
    }

    const cdf = items.reduce<[number, [number, number][]]>(
        (p, _c, i) => [(weights[i] ?? 1) + p[0], [...p[1], [p[0], (weights[i] ?? 1) + p[0]]]],
        [0, []],
      )[1],
      lookupItem: (x: number, start: number, end: number) => T = (x, start, end) => {
        const guessIndex = (end + start) >>> 1
        return x >= cdf[guessIndex][0] && x < cdf[guessIndex][1]
          ? items[guessIndex]
          : x < cdf[guessIndex][0]
            ? lookupItem(x, start, guessIndex)
            : lookupItem(x, guessIndex + 1, end)
      }

    return this.asNumber()
      .range([0, cdf[cdf.length - 1][1]])
      .output(x => lookupItem(x, 0, items.length - 1))
  }

  /**
   * Normal/Gaussian distribution based the Box-Muller algorithm
   * @param mean
   * @param stdev
   * @param clamp Clamps the output to the given range. Note that if the clamp is too narrow, the actual distribution
   * will be bimodal at the clamp values.
   * @returns
   */
  asGuassian(mean: number = 0, stdev: number = 1, clamp?: [number, number]): NoiseBuilder<[number, number]> {
    const c = clamp ? (x: number) => (x < clamp[0] ? clamp[0] : x > clamp[1] ? clamp[1] : x) : null

    return this.asNumber()
      .tuple()
      .element(n => n.range([0, 2 * Math.PI]))
      .element(n => n.range([0, 1]).output(x => stdev * Math.sqrt(-2 * Math.log(x))))
      .output(
        c
          ? ([a, b]) => [c(b * Math.cos(a) + mean), c(b * Math.sin(a) + mean)] as [number, number]
          : ([a, b]) => [b * Math.cos(a) + mean, b * Math.sin(a) + mean] as [number, number],
      )
  }

  /**
   * Poisson distributed numbers based on the Knuth/Devroye algorithm. [https://en.wikipedia.org/wiki/Poisson_distribution]
   * @param lambda expectation parameter. This implementation only uses Devroye, therefore large values of lambda will perform poorly.
   * Lambda > 30 throws an exception. Default 1.
   */
  asPoisson(lambda: number = 1, clamp?: [number, number]): NoiseBuilder<number> {
    if (lambda < 0 || lambda > 30) {
      throw Error(`Poisson algorithm requires lambda in the range (0, 30). Lambda = ${lambda}`)
    }

    const c = clamp ? (x: number) => (x < clamp[0] ? clamp[0] : x > clamp[1] ? clamp[1] : x) : null,
      inverseTransform = (u: number) => {
        let x = 0,
          p = Math.exp(-lambda),
          s = p
        while (u > s) {
          x += 1
          p *= lambda / x
          s += p
        }
        return x
      }

    return this.asNumber()
      .range([0, 1])
      .output(c ? u => c(inverseTransform(u)) : inverseTransform)
  }

  asDice(ds: number | number[] = 6): NoiseBuilder<number> {
    if (!Array.isArray(ds)) {
      return this.asNumber()
        .range([1, ds + 1])
        .discrete(true)
    }

    const ns = ds.map(d =>
      this.asNumber()
        .seed('generate')
        .range([1, d + 1])
        .discrete(true)
        .noise(),
    )

    return this.asNumber().output(x => ns.map(n => n(x)).reduce((p, c) => p + c, 0))
  }

  //#endregion

  //#region Props

  seed(): Seed
  seed(value: Seed): NoiseBuilder<TOut>
  seed(value?: Seed): Seed | NoiseBuilder<TOut> {
    if (value === undefined) return this.options.seed ?? 'declaration'
    return NoiseBuilder.factory({ ...this.options, seed: value })
  }

  onSeeding(): (s: number) => void
  onSeeding(cb: (s: number) => void): NoiseBuilder<TOut>
  onSeeding(cb?: (s: number) => void): ((s: number) => void) | undefined | NoiseBuilder<TOut> {
    if (!cb) return this.options.onSeeding
    return NoiseBuilder.factory({ ...this.options, onSeeding: cb })
  }

  range(): [number, number]
  range(value: [number, number]): NoiseBuilder<TOut>
  range(value?: [number, number]): [number, number] | NoiseBuilder<TOut> {
    if (!value) return this.options.range ?? [-0x7fff_ffff, 0x7fff_ffff]
    return NoiseBuilder.factory({ ...this.options, range: value })
  }

  octave(): number
  octave(value: number): NoiseBuilder<TOut>
  octave(value?: number): number | NoiseBuilder<TOut> {
    if (!value) return this.options.octave ?? 0
    return NoiseBuilder.factory({ ...this.options, octave: value })
  }

  discrete(): boolean
  discrete(value: boolean): NoiseBuilder<TOut>
  discrete(value?: boolean): boolean | NoiseBuilder<TOut> {
    if (value === undefined) return this.options.discrete ?? false
    return NoiseBuilder.factory({ ...this.options, discrete: value })
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

  noise(): (...x: number[]) => TOut {
    const np = this.noiseFuncInternal()

    return this.options.input
      ? (...x: number[]) => this.options.output(np(this.options.input!(...x)))
      : (x: number) => this.options.output(np(x))
  }

  *generator(stop = Infinity, step = 1): IterableIterator<TOut> {
    const np = this.noiseFuncInternal()
    for (let i = 0; i < stop; i += step) {
      yield this.options.output(np(i))
    }
  }

  //#endregion
}

class NoiseBuilderLerp<TOut> extends NoiseBuilder<TOut> {
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

  constructor({ lerp, output }: Omit<NoiseBuilderOptions<TOut>, 'input'>) {
    super({
      dimensions: lerp || 1,
      lerp,
      input: NoiseBuilder.dimensionInput(lerp || 1),
      output,
    })
  }

  noise(): (...x: number[]) => TOut {
    const ni = this.noiseFuncInternal(),
      n = this.options.input ? (...x: number[]) => ni(this.options.input!(...x)) : (x: number) => ni(x)

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
        return super.noise()
    }
  }

  // This has no effect on the output compared to the base class.
  // However, if `step` is a fractional value, the output will be
  // smoothed between the whole values, producing noise that has
  // a lower frequency.
  *generator(stop = Infinity, step = 1): IterableIterator<TOut> {
    const ni = this.noiseFuncInternal()

    for (let i = 0; i < stop; i += step) {
      yield this.options.output(NoiseBuilderLerp.lerp1D(ni(Math.floor(i)), ni(Math.ceil(i)), i % 1))
    }
  }
}

type NoiseBuilderTupleOut<T extends ReadonlyArray<NoiseBuilder<OutputArg>>> = {
  [K in keyof T]: T[K] extends NoiseBuilder<infer V> ? V : never
}

const tuple = <T extends OutputArg[]>(...t: T) => t

function tupleNoise<TNs extends ReadonlyArray<NoiseBuilder<OutputArg>>>(
  ns: TNs,
): (...x: number[]) => NoiseBuilderTupleOut<TNs> {
  const fns = ns.map(n => n.noise())
  return (...x: number[]) => fns.map(f => f(...x)) as any // eslint-disable-line @typescript-eslint/no-explicit-any
}

function tupleOutput<TNs extends ReadonlyArray<NoiseBuilder<OutputArg>>>(
  ns: TNs,
): (x: number) => NoiseBuilderTupleOut<TNs> {
  return ns.map(n => n.output()) as any // eslint-disable-line @typescript-eslint/no-explicit-any
}

class NoiseBuilderTupleProxy<TNs extends ReadonlyArray<NoiseBuilder<OutputArg>>> extends NoiseBuilder<
  NoiseBuilderTupleOut<TNs>
> {
  constructor(
    parent: NoiseBuilder<unknown>,
    private ns: TNs,
  ) {
    super({ input: parent.input(), output: tupleOutput(tuple(...ns)) })
  }

  noise(): (...x: number[]) => NoiseBuilderTupleOut<TNs> {
    return tupleNoise(tuple(...this.ns))
  }

  *generator(stop = Infinity, step = 1): IterableIterator<NoiseBuilderTupleOut<TNs>> {
    const n = this.noise()

    for (let i = 0; i < stop; i += step) {
      yield n(i)
    }
  }
}

class NoiseBuilderTupleProxyWithOutput<
  TNs extends ReadonlyArray<NoiseBuilder<OutputArg>>,
  TOut,
> extends NoiseBuilder<TOut> {
  constructor(
    parent: NoiseBuilder<unknown>,
    private ns: TNs,
    private outputFn: (xs: NoiseBuilderTupleOut<TNs>) => TOut,
  ) {
    const outTuple = tupleOutput(tuple(...ns))
    super({ input: parent.input(), output: (x: number) => outputFn(outTuple(x)) })
  }

  noise(): (...x: number[]) => TOut {
    const n = tupleNoise(tuple(...this.ns))
    return (...x: number[]) => this.outputFn(n(...x))
  }

  *generator(stop = Infinity, step = 1): IterableIterator<TOut> {
    const n = this.noise()

    for (let i = 0; i < stop; i += step) {
      yield n(i)
    }
  }
}

class NoiseBuilderTuple<TParentOut, TNs extends ReadonlyArray<NoiseBuilder<OutputArg>>> {
  static create<TP>(parent: NoiseBuilder<TP>): NoiseBuilderTuple<TP, []> {
    return new NoiseBuilderTuple<TP, []>(parent, [])
  }

  constructor(
    private parent: NoiseBuilder<TParentOut>,
    private ns: TNs,
  ) {}

  element<TOutNext>(
    nb: NoiseBuilderFunctor<TOutNext, TParentOut>,
  ): NoiseBuilderTuple<TParentOut, [...TNs, NoiseBuilder<TOutNext>]> {
    const n = typeof nb === 'function' ? nb(this.parent.clone()) : nb
    return new NoiseBuilderTuple(this.parent, [...this.ns, n])
  }

  output(): NoiseBuilder<NoiseBuilderTupleOut<TNs>>
  output<TOut>(fn: (t: NoiseBuilderTupleOut<TNs>) => TOut): NoiseBuilder<TOut>
  output<TOut>(
    fn?: (t: NoiseBuilderTupleOut<TNs>) => TOut,
  ): NoiseBuilder<NoiseBuilderTupleOut<TNs>> | NoiseBuilder<TOut> {
    return fn
      ? new NoiseBuilderTupleProxyWithOutput(this.parent, this.ns, fn)
      : new NoiseBuilderTupleProxy(this.parent, this.ns)
  }

  noise(): (...x: number[]) => NoiseBuilderTupleOut<TNs> {
    return this.output().noise()
  }

  *generator(stop = Infinity, step = 1): IterableIterator<NoiseBuilderTupleOut<TNs>> {
    yield* this.output().generator(stop, step)
  }
}

// TODO: return this as the appropriate interface, not the raw class
export const squirrel = () => NoiseBuilder.createDefault()
