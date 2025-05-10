# squirrel-noise

A collection of fast noise functions based on Squirrel Eiserloh's implementation.

Noise functions are better than random number generators (although we have those too) because the outputs
are stable, repeatable/deterministic, and multi-dimensional. Think of a noise function as a (nearly) infinite
table of pre-generated random numbers. You can start anywhere you want, jump forward/back, etc. Noise
is much more versitile than random.

All the noise and random functions provided are function-functions. Meaning, you provide all
the options you want, and the library provides a function with all those options "baked" in.
This has some performance advantages, but it also results in much cleaner code. You don't
need to tote around all the options you want, you just have a simple function expecting
some numbers as input to produce noise from.

These functions are designed for quick noise/random usage. They are *not* cryptographically
sound, so it would be ill-advised to use this for password salts/hashes, or any other security
application.

Alternatively, there are more sophisticated options like Perlin or Simplex noise. These functions
have the advantage that they can provide varying levels of smoothness, while this algorithm more closely
matches white noise. The advantage of squirrel-noise is simplicity (zero dependencies, small code, straight-forward API)
and speed (order of millions of calls per second).

## Noise Functions

All noise functions accept input numbers and output various outputs that vary with the noise.
They are deterministic in that they will always output the same value for the same input.

```
const n = squirrel().seed(123).range([0, 1]).noise()
console.log(n(99)) // 303927878
```

## Noise Options

### seed

An input number that varies the noise/sequence. Seeding can be controlled with additional options:

* `random`: every time a `noise` or `generator` function is produced, it reseeds the function with `Math.random()`.
* `generate`: every time a `noise` or `generate` function is produced, it is seeded with a new seed value that is generated from a deterministic number generator.
  This has the effect of being deterministic if the sequence of `noise` calls is the same across multiple runs.
* `declaration`: the seed is derived from the function call, remaining the same for the same code base across multiple runs. However, if `noise` is called in a loop, it will get seeded with the same value.
* Number: seeds with the constant value given.

Default: `'declaration'`

### onSeeding

A callback with the signature `(seedValue: number) => void`. This is called whenever a `noise` or `generator` function is created. This is useful for when the seed value
is set by one of the automatic options. If it is useful to know which seed value is actually used, this callback can be used to get it.

### lerp

Linear interpolates between fractional points. Behind the scenes, the noise function uses a lot of bit-twidling. In Javascript, this has the effect of coercing
any float numbers down (or up for negatives). So, for most noise functions, `n(1) = n(1.1) = n(1.99) != n(2.0)`. So, to smooth fractional inputs, enabling `lerp`
will interpolate between the closest whole values; i.e. `n(1.5)` will be half way between `n(1)` and `n(2)`.

Note: the output is not affected by this issue and will be continously with float/fractional values in the output range. If you want integer outputs, use the `discrete` option.

`lerp` interpolates nearby inputs by the `dimensions` number. So, for `dimensions: 2`, `n(1.4, 2.3)` will interpolate between the points `n(1, 2)`, `n(2, 2)`, `n(1, 3)`, and `n(2, 4)`. Analygously, the containing cube of points are considered for the `dimensions: 3` case. Note: 4d interpolation is not implemented.

## Input/Creation Options

### Input Function

`.input((...xs: number[]) => number)`

### Dimensions

Determines how many input numbers are considered by the resulting noise function. For example:

```
const ns = squirrel().dimensions(2).noise()
console.log(ns(1)) // -304090833, 2nd parameter is assumed to be 0
console.log(ns(1, 1)) // -286857965
console.log(ns(1, 1, 1)) // also -286857965 because it ignores the 3rd parameter
```

Default: 1

### Sequence

This replicates a random generator by just producing random output from no input.

```
const s = squirrel().sequence().noise()
s() // a number
s() // a different number
```

## Output Options

### Map Function

`.map<T>(transformer: (x: TOut) => T)`

Generic output transformer which allows mapping the output to any desired output.

### asBoolean

`.asBoolean()`

Returns noise as booleans.

### asNumber

`.asNumber(range?: [number, number] | (x: number) => number)`

Returns noise as numbers. This is the default output from `squirrel()`. This can be scaled to the given range.

### asInteger

`.asInteger(range?: [number, number])`

Returns noise as whole numbers. Range is inclusive of both end points.

### asVect2D

`.asVect2D(range?: [number, number] | [[number, number], [number, number]])`

Returns `[number, number]` tuples. Accepts range in the form `[number, number]` for controlling both outputs or `[[number, number], [number, number]]` to control them separately.

### asVect3D

`.asVect3D(range?: [number, number] | [[number, number], [number, number], [number, number]])`

Returns `[number, number, number]` tuples. Accepts range in the form `[number, number]` for controlling all outputs or `[[number, number], [number, number], [number, number]]` to control them separately.

### asCircle

`.asCircle(radius?: number, arcRangle?: [number, number])`

Returns `[number, number]` tuples. The values represent a point which lies on the circle or arc. Accepts a radius (default is `1`) and arc range (default is `[0, 2 * Math.PI]`).

### asSphere

`.asSphere(radius?: number)`

Returns `[number, number, number]` where the 3d point is a sphere of the given radius (default `1`).

### asDisc

`.asDisc(radiusRange?: number | [number, number], arcRange?: [number, number])`

Returns `[number, number]` where the 2d points are inside the disc or annulus. If the radius is provided as a range, it represents the inner and outer radii.

### asBall

`.asBall(radiusRange?: number | [number, number])`

Returns `[number, number, number]` where the 3d points are inside the ball. The the radius is provided as a range, it represents the inner and outer radii, essentially
removing the ball of inner radius from the output.

### asList

`.asList<T>(items: T[], weight?: number[])`

### asGuassian

`.asGuassian(mean?: number, stdev?: number)`

### asPoisson

`.asPoisson(lambda?: number)`

### asDice

`.asDice(diceNumbers: number[])`

### asArray

`.asArray<T>(length: number | NoiseFunctor<number, TOut>, nfn: NoiseFunctor<T, TOut>): NoiseFinal<T[]>`

Each call generates an arry from the given noise generator of a length defined by a constant or another noise generator.

### asTuple

Creates a tuple where each element of the tuple is generated by its own noise function. A tuple can have as many items added to it to construct the tuple.
Each arg item accepts any `Noise` (typically starting from the `squirrel()`) or a function of the form `(p: Noise) => Noise` where `p` is
the parent, the `Noise` which `asTuple` was initially called. The given value can be safely customized for each element.

Each element of the tuple is generated with the given `Noise` and is seeded based on the parent's seed value. Note that if the seed is set to a constant number, that same seed value will be passed to each element. This may not be desireable since the output is in effect correlated.

```
const n = squirrel()
          .asTuple(
            p => p.asNumber([0, 1]),
            p => p.asNumber([0, 10])
          )
n(0) // [<number between 0 and 1>, <number between 0 and 10>]
```