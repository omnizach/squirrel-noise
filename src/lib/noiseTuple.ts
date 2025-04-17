import { NoiseFunction } from './noise'

export function noiseTuple<T1>(n1: NoiseFunction<T1>): NoiseFunction<[T1]>
export function noiseTuple<T1, T2>(n1: NoiseFunction<T1>, n2: NoiseFunction<T2>): NoiseFunction<[T1, T2]>
export function noiseTuple<T1, T2, T3>(
  n1: NoiseFunction<T1>,
  n2: NoiseFunction<T2>,
  n3: NoiseFunction<T3>,
): NoiseFunction<[T1, T2, T3]>
export function noiseTuple<T1, T2, T3, T4>(
  n1: NoiseFunction<T1>,
  n2: NoiseFunction<T2>,
  n3: NoiseFunction<T3>,
  n4: NoiseFunction<T4>,
): NoiseFunction<[T1, T2, T3, T4]>
export function noiseTuple<T1, T2, T3, T4, T5>(
  n1: NoiseFunction<T1>,
  n2: NoiseFunction<T2>,
  n3: NoiseFunction<T3>,
  n4: NoiseFunction<T4>,
  n5: NoiseFunction<T5>,
): NoiseFunction<[T1, T2, T3, T4, T5]>
export function noiseTuple(...ns: NoiseFunction<unknown>[]) {
  return (...xs: (number | undefined)[]) => ns.map(n => n(...xs))
}
