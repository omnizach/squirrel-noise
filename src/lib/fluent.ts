import { squirrel5 } from './squirrel5'

export type Dimension = 1 | 2 | 3 | 4

export type Lerp = false | 1 | 2 | 3

export type Seed = number | 'random' | 'generate' | 'declaration'

type OptionalNumberFn = ((x: number) => number) | undefined | null

type OutputArg = any // eslint-disable-line @typescript-eslint/no-explicit-any

export type NoiseOutputFn<TOut> = (x: number) => TOut

interface NoiseOptions<TOut> {
  input?: (...x: number[]) => number
  output: NoiseOutputFn<TOut>
  seed?: Seed
  onSeeding?: (s: number) => void
  transform?: (x: number) => number
  lerp?: Lerp
  flavor?: 'base' | 'lerp' | 'tuple' | 'tuple-output'
}

//#region Noise Interfaces

interface NoiseInput<TOut> {
  input(fn: (...x: number[]) => number): NoiseFluentResult<TOut>
  dimensions(value: Dimension): NoiseFluentResult<TOut>
  fromIncrement(start: number): NoiseFluentResult<TOut>
}

interface NoiseFluent<TOut> {
  seed(value: Seed): NoiseFluentResult<TOut>
  onSeeding(cb: (s: number) => void): NoiseFluentResult<TOut>
  transform(fn: (x: number) => number): NoiseFluentResult<TOut>
  tuple(): NoiseTupleFluent<TOut, []>
}

interface NoiseOutput {
  output<TOutNext>(value: (x: number) => TOutNext): NoiseFinal<TOutNext>
  asBoolean(): NoiseFinal<boolean>
  asNumber(range?: [number, number]): NoiseFinal<number>
  asInteger(range?: [number, number]): NoiseFinal<number>
  asVect2D(range?: [[number, number] | undefined, [number, number] | undefined]): NoiseFinal<[number, number]>
  asVect3D(
    range?: [[number, number] | undefined, [number, number] | undefined, [number, number] | undefined],
  ): NoiseFinal<[number, number, number]>
  asCircle(radius?: number, angleRange?: [number, number]): NoiseFinal<[number, number]>
  asSphere(radius?: number): NoiseFinal<[number, number, number]>
  asDisc(radius?: [number, number] | number, angleRange?: [number, number]): NoiseFinal<[number, number]>
  asBall(radius?: number | [number, number]): NoiseFinal<[number, number, number]>
  asList<T>(items: T[], weights?: number[]): NoiseFinal<T>
  asGuassian(mean?: number, stdev?: number, clamp?: [number, number]): NoiseFinal<[number, number]>
  asPoisson(lambda?: number, clamp?: [number, number]): NoiseFinal<number>
  asDice(ds?: number | number[]): NoiseFinal<number>
}

type NoiseTupleOut<T extends ReadonlyArray<NoiseFinal<OutputArg>>> = {
  [K in keyof T]: T[K] extends NoiseFinal<infer V> ? V : never
}

//type NoiseTupleFunctorOut<T extends ReadonlyArray<NoiseFunctor<OutputArg, any>>> = {
//  [K in keyof T]: T[K] extends NoiseFunctor<infer V, any> ? V : never
//}

interface NoiseTupleFluent<TParentOut, TNs extends ReadonlyArray<NoiseFinal<OutputArg>>> {
  element<TOutNext>(nb: NoiseFunctor<TOutNext, TParentOut>): NoiseTupleFluent<TParentOut, [...TNs, Noise<TOutNext>]>
  output(): NoiseFinal<NoiseTupleOut<TNs>>
  output<TOut>(fn: (t: NoiseTupleOut<TNs>) => TOut): NoiseFinal<TOut>
}

interface NoiseProps<TOut> {
  inputFn: (...x: number[]) => number
  outputFn: NoiseOutputFn<TOut>
  clone(): Noise<TOut>
  map(): NoiseFinal<number>
  map<TOutNext>(fn: (x: TOut) => TOutNext): NoiseFinal<TOutNext>
}

interface NoiseExecution<TOut> {
  noise(): (...x: number[]) => TOut
  generator(length?: number, step?: number): IterableIterator<TOut>
}

type NoiseFinal<TOut> = NoiseProps<TOut> & NoiseExecution<TOut>

type NoiseFluentResult<TOut> = NoiseFluent<TOut> & NoiseProps<TOut> & NoiseExecution<TOut> & NoiseOutput

type NoiseFunctor<TOutNext, TParentOut> = NoiseFinal<TOutNext> | ((parent: Noise<TParentOut>) => NoiseFinal<TOutNext>)

//#endregion

class Noise<TOut> implements NoiseInput<TOut>, NoiseFluent<TOut>, NoiseOutput, NoiseExecution<TOut>, NoiseProps<TOut> {
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

  fromIncrement(): NoiseFluentResult<TOut> {
    let i = 0
    return this.input(() => i++)
  }

  //#endregion

  //#region outputs

  output<T>(fn: NoiseOutputFn<T>): Noise<T> {
    return Noise.factory<T>({ ...this.options, output: fn })
  }

  tuple(): NoiseTupleBuilder<TOut, []> {
    return NoiseTupleBuilder.create(this)
  }

  asBoolean(): Noise<boolean> {
    return this.output(x => !(x & 1))
  }

  asNumber(range?: [number, number]): Noise<number> {
    return range ? this.map().map(Noise.range(range)) : this.map()
  }

  asInteger(range?: [number, number]): Noise<number> {
    return this.asNumber(range ? [range[0], range[1] + 1] : undefined).map(Math.floor)
  }

  asVect2D(
    [rx, ry]: [[number, number] | undefined, [number, number] | undefined] = [undefined, undefined],
  ): NoiseFinal<[number, number]> {
    return this.tuple()
      .element(n => n.asNumber(rx))
      .element(n => n.asNumber(ry))
      .output()
  }

  asVect3D(
    [rx, ry, rz]: [[number, number] | undefined, [number, number] | undefined, [number, number] | undefined] = [
      undefined,
      undefined,
      undefined,
    ],
  ): NoiseFinal<[number, number, number]> {
    return this.tuple()
      .element(n => n.asNumber(rx))
      .element(n => n.asNumber(ry))
      .element(n => n.asNumber(rz))
      .output()
  }

  asCircle(radius: number = 1, angleRange: [number, number] = [0, 2 * Math.PI]): NoiseFinal<[number, number]> {
    return this.asNumber(angleRange).map(a => [radius * Math.cos(a), radius * Math.sin(a)])
  }

  asSphere(radius: number = 1): NoiseFinal<[number, number, number]> {
    return this.tuple()
      .element(n => n.asNumber([0, 2 * Math.PI]))
      .element(n => n.asNumber([-1, 1]))
      .output()
      .map(([θ, r]) => {
        const z = Math.sqrt(1 - r ** 2)
        return [z * Math.cos(θ) * radius, z * Math.sin(θ) * radius, r * radius]
      })
  }

  asDisc(
    radius: [number, number] | number = 1,
    angleRange: [number, number] = [0, 2 * Math.PI],
  ): NoiseFinal<[number, number]> {
    return this.tuple()
      .element(n => n.asCircle(1, angleRange))
      .element(n =>
        n.asNumber(Array.isArray(radius) ? [radius[0] ** 2, radius[1] ** 2] : [0, radius ** 2]).output(Math.sqrt),
      )
      .output(([[x, y], r]) => [x * r, y * r])
  }

  asBall(radius: number | [number, number] = 1): NoiseFinal<[number, number, number]> {
    return this.tuple()
      .element(n => n.asSphere())
      .element(n =>
        n.asNumber(Array.isArray(radius) ? [radius[0] ** 3, radius[1] ** 3] : [0, radius ** 3]).output(Math.cbrt),
      )
      .output(([[x, y, z], r]) => [x * r, y * r, z * r])
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
  asGuassian(mean: number = 0, stdev: number = 1, clamp?: [number, number]): NoiseFinal<[number, number]> {
    const c = clamp ? (x: number) => (x < clamp[0] ? clamp[0] : x > clamp[1] ? clamp[1] : x) : null

    return this.tuple()
      .element(n => n.asNumber([0, 2 * Math.PI]))
      .element(n => n.asNumber([0, 1]).output(x => stdev * Math.sqrt(-2 * Math.log(x))))
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
  asPoisson(lambda: number = 1, clamp?: [number, number]): NoiseFinal<number> {
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

    const ns = ds.map(d => this.asInteger([1, d]).seed('generate').noise())

    return this.asNumber().map(x => ns.map(n => n(x)).reduce((p, c) => p + c, 0))
  }

  asArray<T>(length: number | NoiseFunctor<number, TOut>, nfn: NoiseFunctor<T, TOut>): NoiseFinal<T[]> {
    const nb = typeof nfn === 'function' ? nfn(this.clone()) : nfn,
      n = nb.noise(),
      lfn =
        typeof length === 'function'
          ? length(this.clone()).noise()
          : length instanceof Noise
            ? length
                .clone()
                .input((x: number) => x)
                .noise()
            : () => length

    return nb.map().map(x => [...Array(Math.floor(lfn(x))).keys()].map((_x, i) => n(x + i * 999_999_937)))
  }

  //asTuple<TNs extends ReadonlyArray<NoiseFunctor<OutputArg, TOut>>>(...nfns: TNs): NoiseFinal<NoiseTupleFunctorOut<TNs>> {
  //  return new NoiseTuple<NoiseTupleFunctorOut<TNs>>(this, nfns)
  //}

  //#endregion

  //#region Props

  get inputFn() {
    return this.options.input ?? Noise.numberFuncIdentity
  }

  get outputFn() {
    return this.options.output
  }

  seed(value: Seed): Noise<TOut> {
    return Noise.factory({ ...this.options, seed: value })
  }

  onSeeding(cb: (s: number) => void): Noise<TOut> {
    return Noise.factory({ ...this.options, onSeeding: cb })
  }

  transform(fn: (x: number) => number): Noise<TOut> {
    if (!this.options.transform) {
      return Noise.factory({ ...this.options, transform: fn })
    }

    const pfn = this.options.transform
    return Noise.factory({ ...this.options, transform: (x: number) => fn(pfn(x)) })
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

//#region Tuple

const tuple = <T extends OutputArg[]>(...t: T) => t

function tupleNoise<TNs extends ReadonlyArray<NoiseFinal<OutputArg>>>(ns: TNs): (...x: number[]) => NoiseTupleOut<TNs> {
  const fns = ns.map(n => n.noise())
  return (...x: number[]) => fns.map(f => f(...x)) as any // eslint-disable-line @typescript-eslint/no-explicit-any
}

function tupleOutput<TNs extends ReadonlyArray<NoiseFinal<OutputArg>>>(ns: TNs): (x: number) => NoiseTupleOut<TNs> {
  const outs = ns.map(n => n.outputFn)
  return (x: number) => outs.map(o => o(x)) as any // eslint-disable-line @typescript-eslint/no-explicit-any
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
    parent: Noise<unknown>,
    private ns: TNs,
    private out: (xs: NoiseTupleOut<TNs>) => TOut,
  ) {
    const outTuple = tupleOutput(tuple(...ns))
    super({ input: parent.inputFn, output: (x: number) => out(outTuple(x)) })
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

class NoiseTupleBuilder<TParentOut, TNs extends ReadonlyArray<NoiseFinal<OutputArg>>>
  implements NoiseTupleFluent<TParentOut, TNs>, NoiseExecution<NoiseTupleOut<TNs>>
{
  static create<TP>(parent: Noise<TP>): NoiseTupleBuilder<TP, []> {
    return new NoiseTupleBuilder<TP, []>(parent, [])
  }

  constructor(
    private parent: Noise<TParentOut>,
    private ns: TNs,
  ) {}

  element<TOutNext>(
    nb: NoiseFunctor<TOutNext, TParentOut>,
  ): NoiseTupleBuilder<TParentOut, [...TNs, NoiseFinal<TOutNext>]> {
    const n = typeof nb === 'function' ? nb(this.parent.clone()) : nb
    return new NoiseTupleBuilder(this.parent, [...this.ns, n])
  }

  output(): NoiseFinal<NoiseTupleOut<TNs>>
  output<TOut>(fn: (t: NoiseTupleOut<TNs>) => TOut): NoiseFinal<TOut>
  output<TOut>(fn?: (t: NoiseTupleOut<TNs>) => TOut): NoiseFinal<NoiseTupleOut<TNs>> | NoiseFinal<TOut> {
    return fn ? new NoiseTupleWithOutput(this.parent, this.ns, fn) : new NoiseTuple(this.parent, this.ns)
  }

  noise(): (...x: number[]) => NoiseTupleOut<TNs> {
    return this.output().noise()
  }

  *generator(stop = Infinity, step = 1): IterableIterator<NoiseTupleOut<TNs>> {
    yield* this.output().generator(stop, step)
  }
}

//#endregion

export const squirrel = () => Noise.createDefault()
