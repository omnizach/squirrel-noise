import { squirrel5 } from './squirrel5'

export type Dimension = 1 | 2 | 3 | 4

export type Lerp = false | 1 | 2 | 3

export type Seed = number | 'random' | 'generate' | 'declaration'

type OptionalNumberFn = ((x: number) => number) | undefined | null

type OutputArg = any // eslint-disable-line @typescript-eslint/no-explicit-any

export type NoiseOutputFn<TOut> = (x: number) => TOut

type Range = [number, number] | undefined

interface NoiseOptions<TOut> {
  input?: (...x: number[]) => number
  output: NoiseOutputFn<TOut>
  seed?: Seed
  onSeeding?: (s: number) => void
  transform?: (x: number) => number
  lerp?: Lerp
  name?: string
}

//#region Noise Interfaces

interface NoiseInput<TOut> {
  input(fn: (...x: number[]) => number): NoiseFluentResult<TOut>
  dimensions(value: Dimension): NoiseFluentResult<TOut>
  sequence(start: number): NoiseFluentResult<TOut>
}

interface NoiseFluent<TOut> {
  seed(value: Seed): NoiseFluentResult<TOut>
  onSeeding(cb: (s: number) => void): NoiseFluentResult<TOut>
  named(value: string): NoiseFluentResult<TOut>
}

interface NoiseOutput<TOut> {
  output<TOutNext>(value: (x: number) => TOutNext): NoiseFinal<TOutNext>
  asBoolean(): NoiseFinal<boolean>
  asNumber(range?: Range): NoiseFinal<number>
  asInteger(range?: Range): NoiseFinal<number>
  asVect2D(range?: [Range, Range]): NoiseFinal<[number, number]>
  asVect3D(range?: [Range, Range, Range]): NoiseFinal<[number, number, number]>
  asCircle(radius?: number, angleRange?: Range): NoiseFinal<[number, number]>
  asSphere(radius?: number): NoiseFinal<[number, number, number]>
  asDisc(radius?: Range | number, angleRange?: Range): NoiseFinal<[number, number]>
  asBall(radius?: number | Range): NoiseFinal<[number, number, number]>
  asList<T>(items: T[], weights?: number[]): NoiseFinal<T>
  asGuassian(mean?: number, stdev?: number, clamp?: Range): NoiseFinal<[number, number]>
  asPoisson(lambda?: number, clamp?: Range): NoiseFinal<number>
  asDice(ds?: number | number[]): NoiseFinal<number>
  asArray<T>(length: number | NoiseFunctor<number, TOut>, nfn: NoiseFunctor<T, TOut>): NoiseFinal<T[]>
  asTuple<TNs extends ReadonlyArray<NoiseFunctor<OutputArg, TOut>>>(
    ...ns: TNs
  ): NoiseFinal<NoiseTupleFunctorOut<TOut, TNs>>
}

type NoiseTupleOut<T extends ReadonlyArray<NoiseFinal<OutputArg>>> = {
  [K in keyof T]: T[K] extends NoiseFinal<infer V> ? V : never
}

type NoiseTupleFunctorOut<TParentOut, T extends ReadonlyArray<NoiseFunctor<OutputArg, TParentOut>>> = {
  [K in keyof T]: T[K] extends NoiseFunctor<infer V, TParentOut> ? V : never
}

type NoiseTupleFunctorResult<TParentOut, T extends ReadonlyArray<NoiseFunctor<OutputArg, TParentOut>>> = {
  [K in keyof T]: T[K] extends NoiseFunctor<infer V, TParentOut> ? NoiseFinal<V> : never
}

interface NoiseProps<TOut> {
  inputFn: (...x: number[]) => number
  outputFn: NoiseOutputFn<TOut>
  clone(): Noise<TOut>
  map(): NoiseFinal<number>
  map<TOutNext>(fn: (x: TOut) => TOutNext): NoiseFinal<TOutNext>
  name?: string
}

interface NoiseExecution<TOut> {
  noise(): (...x: number[]) => TOut
  generator(length?: number, step?: number): IterableIterator<TOut>
}

type NoiseFinal<TOut> = NoiseProps<TOut> & NoiseExecution<TOut>

type NoiseFluentResult<TOut> = NoiseFluent<TOut> & NoiseProps<TOut> & NoiseExecution<TOut> & NoiseOutput<TOut>

type NoiseFunctor<TOutNext, TParentOut> = NoiseFinal<TOutNext> | ((parent: Noise<TParentOut>) => NoiseFinal<TOutNext>)

//#endregion

class Noise<TOut>
  implements NoiseInput<TOut>, NoiseFluent<TOut>, NoiseOutput<TOut>, NoiseExecution<TOut>, NoiseProps<TOut>
{
  protected static numberFuncIdentity = (x: number) => x

  //#region utils

  protected static numberPipe = (fn1?: OptionalNumberFn, ...rest: OptionalNumberFn[]): ((x: number) => number) => {
    if (!rest?.length) {
      return fn1 ?? Noise.numberFuncIdentity
    }

    if (!fn1) {
      return Noise.numberPipe(...rest)
    }

    const np = Noise.numberPipe(...rest)
    return (x: number) => np(fn1(x))
  }

  protected static seedGenerator = (() => {
    let i = 0
    const n = squirrel5(0x5eed5)
    return () => n(i++)
  })()

  protected static dimensionInput(d: Dimension) {
    switch (d) {
      case 1:
        return Noise.numberFuncIdentity
      case 2:
        return (x = 0, y = 0) => x + 198491317 * y
      case 3:
        return (x = 0, y = 0, z = 0) => x + 198491317 * y + 6542989 * z
      case 4:
        return (x = 0, y = 0, z = 0, w = 0) => x + 198491317 * y + 6542989 * z + 357239 * w
    }
  }

  protected static range([yMin, yMax]: [number, number]) {
    return (x: number) => ((x - -0x7fff_ffff) / (0x8000_0000 - -0x7fff_ffff)) * (yMax - yMin) + yMin
  }

  protected generateSeed(): number {
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
        result = Noise.seedGenerator()
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

  protected static factory<TOut>(options: NoiseOptions<TOut>) {
    if (!options.lerp) {
      return new Noise(options)
    } else {
      return new NoiseBuilderLerp(options)
    }
  }

  static createDefault(): Noise<number> {
    return new Noise({ input: (x: number) => x, output: x => x })
  }

  //#endregion

  constructor(protected options: NoiseOptions<TOut>) {}

  clone(): Noise<TOut> {
    return Noise.factory(this.options)
  }

  //#region inputs

  input(fn: (...x: number[]) => number): NoiseFluentResult<TOut> {
    return Noise.factory({ ...this.options, input: fn })
  }

  dimensions(value: Dimension): NoiseFluentResult<TOut> {
    return this.input(Noise.dimensionInput(value))
  }

  lerp(value: Lerp): NoiseFluentResult<TOut> {
    return Noise.factory({
      ...this.options,
      lerp: value,
      output: this.options.output,
    })
  }

  sequence(start: number = 0): NoiseFluentResult<TOut> {
    let i = start
    return this.input(() => i++)
  }

  //#endregion

  //#region outputs

  output<T>(fn: NoiseOutputFn<T>): Noise<T> {
    return Noise.factory<T>({ ...this.options, output: fn })
  }

  asBoolean(): Noise<boolean> {
    return this.output(x => !(x & 1))
  }

  asNumber(range?: Range): Noise<number> {
    return range ? this.map().map(Noise.range(range)) : this.map()
  }

  asInteger(range?: Range): Noise<number> {
    return this.asNumber(range ? [range[0], range[1] + 1] : undefined).map(Math.floor)
  }

  asVect2D([rx, ry]: [Range, Range] = [undefined, undefined]): NoiseFinal<[number, number]> {
    return this.asTuple(
      n => n.asNumber(rx),
      n => n.asNumber(ry),
    )
  }

  asVect3D(
    [rx, ry, rz]: [Range, Range, Range] = [undefined, undefined, undefined],
  ): NoiseFinal<[number, number, number]> {
    return this.asTuple(
      n => n.asNumber(rx),
      n => n.asNumber(ry),
      n => n.asNumber(rz),
    )
  }

  asCircle(radius: number = 1, angleRange: Range = [0, 2 * Math.PI]): NoiseFinal<[number, number]> {
    return this.asNumber(angleRange).map(a => [radius * Math.cos(a), radius * Math.sin(a)])
  }

  asSphere(radius: number = 1): NoiseFinal<[number, number, number]> {
    return this.asTuple(
      n => n.asNumber([0, 2 * Math.PI]),
      n => n.asNumber([-1, 1]),
    ).map(([θ, r]) => {
      const z = Math.sqrt(1 - r ** 2)
      return [z * Math.cos(θ) * radius, z * Math.sin(θ) * radius, r * radius]
    })
  }

  asDisc(radius: Range | number = 1, angleRange: Range = [0, 2 * Math.PI]): NoiseFinal<[number, number]> {
    return this.asTuple(
      this.asCircle(1, angleRange),
      this.asNumber(Array.isArray(radius) ? [radius[0] ** 2, radius[1] ** 2] : [0, radius ** 2]).map(Math.sqrt),
    ).map(([[x, y], r]) => [x * r, y * r])
  }

  asBall(radius: number | Range = 1): NoiseFinal<[number, number, number]> {
    return this.asTuple(
      n => n.asSphere(),
      n => n.asNumber(Array.isArray(radius) ? [radius[0] ** 3, radius[1] ** 3] : [0, radius ** 3]).map(Math.cbrt),
    ).map(([[x, y, z], r]) => [x * r, y * r, z * r])
  }

  asList<T>(items: T[], weights?: number[]): NoiseFinal<T> {
    if (!weights?.length) {
      return this.asInteger([0, items.length - 1]).map(x => items[x])
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

    return this.asNumber([0, cdf[cdf.length - 1][1]]).map(x => lookupItem(x, 0, items.length - 1))
  }

  /**
   * Normal/Gaussian distribution based the Box-Muller algorithm
   * @param mean
   * @param stdev
   * @param clamp Clamps the output to the given range. Note that if the clamp is too narrow, the actual distribution
   * will be bimodal at the clamp values.
   * @returns
   */
  asGuassian(mean: number = 0, stdev: number = 1, clamp?: Range): NoiseFinal<[number, number]> {
    const c = clamp ? (x: number) => (x < clamp[0] ? clamp[0] : x > clamp[1] ? clamp[1] : x) : null

    return this.asTuple(
      n => n.asNumber([0, 2 * Math.PI]),
      n => n.asNumber([0, 1]).map(x => stdev * Math.sqrt(-2 * Math.log(x))),
    ).map(
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
  asPoisson(lambda: number = 1, clamp?: Range): NoiseFinal<number> {
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

    return this.asNumber([0, 1]).map(c ? u => c(inverseTransform(u)) : inverseTransform)
  }

  asDice(ds: number | number[] = 6): NoiseFinal<number> {
    if (!Array.isArray(ds)) {
      return this.asInteger([1, ds])
    }

    const ss = this.clone().sequence().seed(this.generateSeed()).asNumber().noise(),
      ns = ds.map(d => this.asInteger([1, d]).seed(ss()).noise())

    return this.asNumber().map(x => ns.map(n => n(x)).reduce((p, c) => p + c, 0))
  }

  asArray<T>(length: number | NoiseFunctor<number, TOut>, nfn: NoiseFunctor<T, TOut>): NoiseFinal<T[]> {
    /*
    const nb = typeof nfn === 'function' ? nfn(this.clone()) : nfn,
      n = nb.noise(),
      lfn =
        typeof length === 'function'
          ? length(this.clone()).noise()
          : length instanceof Noise
            ? length.clone().input(Noise.numberFuncIdentity).noise()
            : () => length

    return nb.map().map(x => [...Array(Math.floor(lfn(x))).keys()].map((_x, i) => n(x + i * 999_999_937)))
    */

    return new NoiseArray(this, length, nfn)
  }

  asTuple<TNs extends ReadonlyArray<NoiseFunctor<OutputArg, TOut>>>(
    ...ns: TNs
  ): Noise<NoiseTupleFunctorOut<TOut, TNs>> {
    return new NoiseTuple(this, tupleFunctor(this, ns)) as any // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  /*
  asObject<TNs extends ReadonlyArray<NoiseFunctor<OutputArg, TOut>>>(
    ...ns: TNs
  ): Noise<Object> {

  }
  */

  //#endregion

  //#region Props

  get inputFn() {
    return this.options.input ?? Noise.numberFuncIdentity
  }

  get outputFn() {
    return this.options.output
  }

  get name() {
    return this.options.name
  }

  seed(value: Seed): Noise<TOut> {
    return Noise.factory({ ...this.options, seed: value })
  }

  onSeeding(cb: (s: number) => void): Noise<TOut> {
    return Noise.factory({ ...this.options, onSeeding: cb })
  }

  named(value: string): Noise<TOut> {
    return Noise.factory({ ...this.options, name: value })
  }

  map(): Noise<number>
  map<TOutNext>(fn: (x: TOut) => TOutNext): Noise<TOutNext>
  map<TOutNext>(fn?: (x: TOut) => TOutNext): Noise<number> | Noise<TOutNext> {
    if (!fn) {
      return Noise.factory({ ...this.options, output: Noise.numberFuncIdentity })
    }

    const outFn = this.outputFn,
      newOut = (x: number) => fn(outFn(x))

    return Noise.factory({ ...this.options, output: newOut })
  }

  //#endregion

  //#region Execution

  noise(): (...x: number[]) => TOut {
    const n = Noise.numberPipe(squirrel5(this.generateSeed()), this.options.transform),
      iFn = this.options.input,
      oFn = this.options.output

    return iFn ? (...x: number[]) => oFn(n(iFn(...x))) : (x: number) => oFn(n(x))
  }

  *generator(stop = Infinity, step = 1): IterableIterator<TOut> {
    const n = Noise.numberPipe(squirrel5(this.generateSeed()), this.options.transform),
      oFn = this.options.output

    for (let i = 0; i < stop; i += step) {
      yield oFn(n(i))
    }
  }

  //#endregion
}

class NoiseBuilderLerp<TOut> extends Noise<TOut> {
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

  constructor(options: Omit<NoiseOptions<TOut>, 'input'>) {
    super({
      ...options,
      input: Noise.dimensionInput(options.lerp || 1),
    })
  }

  noise(): (...x: number[]) => TOut {
    const ni = Noise.numberPipe(squirrel5(this.generateSeed()), this.options.transform),
      iFn = this.options.input,
      n = iFn ? (...x: number[]) => ni(iFn(...x)) : (x: number) => ni(x)

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
      case undefined:
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
    const ni = Noise.numberPipe(squirrel5(this.generateSeed()), this.options.transform),
      oFn = this.options.output

    for (let i = 0; i < stop; i += step) {
      yield oFn(NoiseBuilderLerp.lerp1D(ni(Math.floor(i)), ni(Math.ceil(i)), i % 1))
    }
  }
}

class NoiseArray<TOut, TParentOut> extends Noise<TOut[]> {
  constructor(
    private parent: Noise<TParentOut>,
    private length: number | NoiseFunctor<number, TParentOut>,
    private noiseFn: NoiseFunctor<TOut, TParentOut>,
  ) {
    super({ output: () => [] }) // degenerate implementation, not used
  }

  private get lengthFn() {
    return typeof this.length === 'function'
      ? this.length(this.parent.clone()).noise()
      : this.length instanceof Noise
        ? this.length.clone().input(Noise.numberFuncIdentity).noise()
        : () => this.length
  }

  private *lengthGen(): IterableIterator<number> {
    if (typeof this.length === 'function') {
      yield* this.length(this.parent.clone()).generator()
      return
    }

    if (this.length instanceof Noise) {
      yield* this.length.generator()
      return
    }

    while (true) {
      yield this.length as number
    }
  }

  noise(): (...x: number[]) => TOut[] {
    const n = (typeof this.noiseFn === 'function' ? this.noiseFn(this.parent.clone()) : this.noiseFn).noise(),
      lfn = this.lengthFn

    return (x0: number, ...x: number[]) =>
      [...Array(lfn(x0, ...x)).keys()].map((_x, i) => n(x0 + i * 999_999_937, ...x))
  }

  *generator(stop = Infinity, step = 1): IterableIterator<TOut[]> {
    const g = (typeof this.noiseFn === 'function' ? this.noiseFn(this.parent.clone()) : this.noiseFn).generator(),
      lg = this.lengthGen()

    for (let i = 0; i < stop; i += step) {
      yield [...Array(lg.next().value).keys()].map(() => g.next().value)
    }
  }
}

//#region Tuple

const tuple = <T extends OutputArg[]>(...t: T) => t

function nameFunction<T>(name: string, body: () => T) {
  return {
    [name]() {
      return body.apply(this)
    },
  }[name]
}

function tupleNoise<TNs extends ReadonlyArray<NoiseFinal<OutputArg>>>(ns: TNs): (...x: number[]) => NoiseTupleOut<TNs> {
  const fns = ns.map((n, i) => nameFunction(`f${i}`, () => n.noise())())
  return (...x: number[]) => fns.map(f => f(...x)) as any // eslint-disable-line @typescript-eslint/no-explicit-any
}

function tupleOutput<TNs extends ReadonlyArray<NoiseFinal<OutputArg>>>(ns: TNs): (x: number) => NoiseTupleOut<TNs> {
  const outs = ns.map(n => n.outputFn)
  return (x: number) => outs.map(o => o(x)) as any // eslint-disable-line @typescript-eslint/no-explicit-any
}

function tupleFunctor<TParentOut, TNs extends ReadonlyArray<NoiseFunctor<OutputArg, TParentOut>>>(
  parent: NoiseFinal<TParentOut>,
  ns: TNs,
): NoiseTupleFunctorResult<TParentOut, TNs> {
  return ns.map(n => (typeof n === 'function' ? n(parent.clone()) : n)) as any // eslint-disable-line @typescript-eslint/no-explicit-any
}

class NoiseTuple<TNs extends ReadonlyArray<NoiseFinal<OutputArg>>> extends Noise<NoiseTupleOut<TNs>> {
  constructor(
    private parent: Noise<unknown>,
    private ns: TNs,
  ) {
    super({ input: parent.inputFn, output: tupleOutput(tuple(...ns)) })
  }

  map(): Noise<number>
  map<TOutNext>(fn: (x: NoiseTupleOut<TNs>) => TOutNext): Noise<TOutNext>
  map<TOutNext>(fn?: (x: NoiseTupleOut<TNs>) => TOutNext): Noise<number> | Noise<TOutNext> {
    if (!fn) {
      return Noise.factory({ ...this.options, output: Noise.numberFuncIdentity })
    }

    return new NoiseTupleWithOutput<TNs, TOutNext>(this.parent, this.ns, fn)
  }

  noise(): (...x: number[]) => NoiseTupleOut<TNs> {
    return tupleNoise(tuple(...this.ns))
  }

  *generator(stop = Infinity, step = 1): IterableIterator<NoiseTupleOut<TNs>> {
    const n = this.noise()

    for (let i = 0; i < stop; i += step) {
      yield n(i)
    }
  }
}

class NoiseTupleWithOutput<TNs extends ReadonlyArray<NoiseFinal<OutputArg>>, TOut> extends Noise<TOut> {
  constructor(
    private parent: Noise<unknown>,
    private ns: TNs,
    private out: (xs: NoiseTupleOut<TNs>) => TOut,
  ) {
    const outTuple = tupleOutput(tuple(...ns))
    super({ input: parent.inputFn, output: (x: number) => out(outTuple(x)) })
  }

  map(): Noise<number>
  map<TOutNext>(fn: (x: TOut) => TOutNext): Noise<TOutNext>
  map<TOutNext>(fn?: (x: TOut) => TOutNext): Noise<number> | Noise<TOutNext> {
    if (!fn) {
      return Noise.factory({ ...this.options, output: Noise.numberFuncIdentity })
    }

    const outFn = this.out,
      newOut = (x: NoiseTupleOut<TNs>) => fn(outFn(x))

    return new NoiseTupleWithOutput<TNs, TOutNext>(this.parent, this.ns, newOut)
  }

  noise(): (...x: number[]) => TOut {
    const n = tupleNoise(tuple(...this.ns))
    return (...x: number[]) => this.out(n(...x))
  }

  *generator(stop = Infinity, step = 1): IterableIterator<TOut> {
    const n = this.noise()

    for (let i = 0; i < stop; i += step) {
      yield n(i)
    }
  }
}

//#endregion

export const squirrel = () => Noise.createDefault()
