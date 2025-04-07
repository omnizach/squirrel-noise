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
const n = noiseNumber({ seed: 123, range: [0,1] })
console.log(n(99)) // 303927878
```

## Random Functions

The random functions act like random number generators by producing varying output with
no input. The sequence they produce is still deterministic. If you recreate the random
function with the same options, it will produce the same sequence.

## Noise Options

### seed

An input number that varies the noise/sequence.

Default: 0

### dimensions

Determines how many input numbers are considered by the resulting noise function. For example:

```
const ns = noiseNumber({ dimensions: 2 })
console.log(ns(1)) // -304090833, 2nd parameter is assumed to be 0
console.log(ns(1, 1)) // -286857965
console.log(ns(1, 1, 1)) // also -286857965 because it ignores the 3rd parameter
```

Default: 1

### range

Changes the output to be in the given range `[min, max)`.
The default range is `[-0x7fffffff, 0x7fffffff]`, or a full 32-bit signed int.

## discrete

Converts the resulting number from a float to an int via `Math.floor`. This is useful if the result is used to index into an array, for example.
Keep in mind that the upper bound of the range is not included as a potential output. For example, to replicate rolling a 6-sided die (a D6),
the options would be: `{ discrete: true, range: [1, 7] }`.

Default: false

## lerp

Linear interpolates between fractional points. Behind the scenes, the noise function uses a lot of bit-twidling. In Javascript, this has the effect of coercing
any float numbers down (or up for negatives). So, for most noise functions, `n(1) = n(1.1) = n(1.99) != n(2.0)`. So, to smooth fractional inputs, enabling `lerp`
will interpolate between the closest whole values; i.e. `n(1.5)` will be half way between `n(1)` and `n(2)`.

Note: the output is not affected by this issue and will be continously with float/fractional values in the output range. If you want integer outputs, use the `discrete` option.

`lerp` interpolates nearby inputs by the `dimensions` number. So, for `dimensions: 2`, `n(1.4, 2.3)` will interpolate between the points `n(1, 2)`, `n(2, 2)`, `n(1, 3)`, and `n(2, 4)`. Analygously, the containing cube of points are considered for the `dimensions: 3` case. Note: 4d interpolation is not implemented.

### octave

Octave allows for other smoothing options by shifting the input by `octave` bits. For example, with `octave = 1`, `n(1) = n(0)`, `n(3) = n(2)`, etc. When combined with the [lerp]
option, this provides linear smoothing at a wider range than just whole numbers.