import test from 'ava'

import { squirrel } from '../lib/fluent'

const almost = (actual: number, expected: number, error = 1e-6) => Math.abs(actual - expected) < error

test('noise with no input is valid', t => {
  const n = squirrel().noise()

  t.is(typeof n(0), 'number')
})

test('static seed', t => {
  let seed = NaN
  const s = squirrel()
    .seed(0x57a71c)
    .onSeeding(s => (seed = s))

  t.is(s.noise()(444), -2042371743)
  t.is(s.noise()(444), -2042371743)
  t.is(seed, 0x57a71c)

  const st = squirrel()
    .seed(0x70075)
    .asTuple(p => p.onSeeding(s => (seed = s)).asNumber())
    .noise()

  t.deepEqual(st(444), [630224200])
  t.is(seed, 0x70075)
})

test.serial('generate seed', t => {
  let seed = NaN
  const s = squirrel()
    .seed('generate')
    .onSeeding(s => (seed = s))

  s.noise()

  t.is(seed, 666346043)

  s.noise()

  t.is(seed, 2038759362)
})

test.serial('noise onSeeding', t => {
  let seed = 0
  const cb = (s: number) => (seed = s),
    nb = squirrel().seed('generate').onSeeding(cb),
    n = nb.noise()

  t.true(n(9) < 0xffff_ffff)
  t.deepEqual(seed, 2101584673) // this varies with execution order
})

test.skip('noise declaration seeding', t => {
  const n1 = squirrel().seed('declaration').noise(),
    n2 = squirrel().seed('declaration').noise()

  t.notDeepEqual(n1(3), n2(3))

  for (let i = 0; i < 2; i++) {
    const n = squirrel().seed('declaration').noise()
    t.deepEqual(n(5), 139881755) // this value varies if the line number changes
  }

  let seed1 = NaN,
    seed2 = NaN
  squirrel()
    .asTuple(
      p => p.onSeeding(s => (seed1 = s)),
      p => p.onSeeding(s => (seed2 = s)),
    )
    .noise()

  t.notDeepEqual(seed1, NaN)
  t.notDeepEqual(seed1, seed2)
})

test('noise 1d lerp is smooth between points', t => {
  const nb = squirrel().lerp(1), //.asNumber([0, 10]),
    n = nb.noise()

  t.is(n(), n(0))

  for (let i = 0; i < 10; i++) {
    t.true(n(i) < n(i + 1) ? n(i) < n(i + 0.5) && n(i + 0.5) < n(i + 1) : n(i) > n(i + 0.5) && n(i + 0.5) > n(i + 1))
  }
})

test('noise works for 2d input', t => {
  const nf = squirrel().dimensions(2),
    n = nf.noise()

  t.is(n(), n(0, 0))
  t.is(n(2222), n(2222, 0))

  for (let i = 1; i < 100; i++) {
    for (let j = 1; j < 100; j++) {
      t.not(n(i, j), n(0, j))
      t.not(n(i, j), n(i, 0))
      t.not(n(i, j), n(i - 1, j))
      t.not(n(i, j), n(i, j - 1))
    }
  }
})

test('noise varies in 2d with range', t => {
  const n = squirrel().dimensions(2).asNumber([-1000, -100]).noise()

  for (let i = 0; i < 10; i++) {
    t.not(n(i, 2), n(i + 1, 2))
    t.not(n(2, i), n(2, i + 1))
  }
})

test('noise lerp2d is smooth', t => {
  const nf = squirrel().lerp(2).asNumber([-100, 100]),
    n = nf.noise()

  t.is(n(), n(0, 0))
  t.is(n(0), n(0, 0))

  for (let i = 1; i < 100; i++) {
    for (let j = 1; j < 100; j++) {
      t.true(Math.abs((n(i, j) + n(i + 1, j) + n(i, j + 1) + n(i + 1, j + 1)) / 4 - n(i + 0.5, j + 0.5)) < 0.0001)
    }
  }
})

test('noise works for 3d input', t => {
  const n = squirrel().dimensions(3).noise()

  t.is(n(), n(0, 0, 0))
  t.is(n(3333), n(3333, 0, 0))
  t.is(n(3333, 0), n(3333, 0, 0))

  for (let i = 1; i < 20; i++) {
    for (let j = 1; j < 20; j++) {
      for (let k = 1; k < 20; k++) {
        t.not(n(i, j, k), n(0, j, 0))
        t.not(n(i, j, k), n(i, 0, 0))
        t.not(n(i, j, k), n(0, 0, k))
        t.not(n(i, j, k), n(i - 1, j, k))
        t.not(n(i, j, k), n(i, j - 1, k))
        t.not(n(i, j, k), n(i, j, k - 1))
      }
    }
  }
})

test('noise lerp3d is smooth', t => {
  const n = squirrel().lerp(3).asNumber([-100, 100]).noise()

  t.is(n(), n(0, 0, 0))
  t.is(n(0), n(0, 0, 0))
  t.is(n(0, 0), n(0, 0, 0))

  for (let i = 1; i < 20; i++) {
    for (let j = 1; j < 20; j++) {
      for (let k = 1; k < 20; k++) {
        t.true(
          Math.abs(
            (n(i, j, k) +
              n(i + 1, j, k) +
              n(i, j + 1, k) +
              n(i + 1, j + 1, k) +
              n(i, j, k + 1) +
              n(i + 1, j, k + 1) +
              n(i, j + 1, k + 1) +
              n(i + 1, j + 1, k + 1)) /
              8 -
              n(i + 0.5, j + 0.5, k + 0.5),
          ) < 0.0001,
        )
      }
    }
  }
})

test('noise works with 4d input', t => {
  const n = squirrel().dimensions(4).noise()

  t.is(n(), n(0, 0, 0, 0))
  t.is(n(4444), n(4444, 0, 0, 0))
  t.is(n(4444, 0), n(4444, 0, 0, 0))
  t.is(n(4444, 0, 0), n(4444, 0, 0, 0))

  for (let i = 1; i < 10; i++) {
    for (let j = 1; j < 10; j++) {
      for (let k = 1; k < 10; k++) {
        for (let m = 1; m < 10; m++) {
          t.not(n(i, j, k, m), n(0, j, 0, 0))
          t.not(n(i, j, k, m), n(i, 0, 0, 0))
          t.not(n(i, j, k, m), n(0, 0, k, 0))
          t.not(n(i, j, k, m), n(0, 0, 0, m))
          t.not(n(i, j, k, m), n(i - 1, j, k, m))
          t.not(n(i, j, k, m), n(i, j - 1, k, m))
          t.not(n(i, j, k, m), n(i, j, k - 1, m))
          t.not(n(i, j, k, m), n(i, j, k, m - 1))
        }
      }
    }
  }
})

test('noise works with static seeds', t => {
  const n1 = squirrel().seed(234),
    n2 = squirrel().seed(234)

  t.is(n1.noise()(999), n2.noise()(999))
})

test('noise works with random seeds', t => {
  let s1 = NaN,
    s2 = NaN

  const n1 = squirrel()
      .seed('random')
      .onSeeding(s => (s1 = s)),
    n2 = squirrel()
      .seed('random')
      .onSeeding(s => (s2 = s)),
    f1 = n1.noise(),
    f2 = n2.noise()

  t.not(s1, s2)
  t.true(Number.isFinite(s1) && Number.isFinite(s2))
  t.not(f1(999), f2(999))
})

test('noise input', t => {
  const n = squirrel()

  t.is(n.inputFn(999), 999)

  const np1 = squirrel().input(x => x + 1)

  t.is(np1.inputFn(999), 1000)
})

test('noise map', t => {
  const n = squirrel()
    .asNumber([0, 10])
    .map(x => x + 100)
    .noise()

  for (let i = 0; i < 1000; i++) {
    t.true(100 <= n(i) && n(i) < 110)
  }

  t.is(squirrel().outputFn(999), 999)
})

test('noise discrete range', t => {
  const nb = squirrel().seed(12).asInteger([0, 9]),
    n = nb.noise()

  const y = [...Array(10).keys()].map(() => 0)

  for (let i = 0; i < 10000; i++) {
    y[n(i)]++
  }

  for (let i = 0; i < 10; i++) {
    t.true(900 <= y[i] && y[i] <= 1100)
  }
})

test('noise generator produces sequence with no input', t => {
  const ng = squirrel().sequence().noise()

  const prev = NaN

  for (let i = 0; i < 10000; i++) {
    t.not(prev, ng(), 'output should vary')
  }
})

test('noise range is valid', t => {
  const nb = squirrel().sequence().asNumber([0, 10]),
    ng = nb.noise()

  let min = 10,
    max = 0

  for (let i = 0; i < 10000; i++) {
    const r = ng()
    min = r < min ? r : min
    max = r > max ? r : max
  }

  //t.log(min, max)

  t.true(min < 0.01)
  t.true(max > 9.99)
})

test('noise discrete range is indexable and fair', t => {
  const ng = squirrel().sequence().asInteger([-2, 7]).noise()

  const counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

  for (let i = 0; i < 100000; i++) {
    counts[ng() + 2]++
  }

  //t.log(counts)

  t.true(counts.reduce((p, c) => (p < c ? p : c), Infinity) > 9500)
  t.true(counts.reduce((p, c) => (p > c ? p : c), -Infinity) < 10500)
})

test.serial('general performance is fast', t => {
  // benchmark
  const benchStart = Date.now()

  for (let i = 0; i < 1e7; i++) {
    if ((Math.random() * Math.random()) / (Math.random() + 1) > 1e6) {
      break // this case will never happen, just here to avoid warnings
    }
  }

  const benchMs = Date.now() - benchStart

  t.log('Benchmark ms', benchMs)

  const testStart = Date.now()

  const n = squirrel().sequence().asNumber([0, 1]).noise() // using some typical options that add time

  for (let i = 0; i < 1e7; i++) {
    n()
  }

  const timeMs = Date.now() - testStart

  t.log('Test ms', timeMs)

  t.true(timeMs < benchMs * 3)
})

test('noiseGenerator basic generator loop', t => {
  let count = 0
  for (const x of squirrel().generator()) {
    count++

    t.true(Number.isFinite(x))

    if (count > 100) {
      break
    }
  }
})

test('noiseGenerator materializes with finite length', t => {
  const ns = [...squirrel().asInteger([0, 10]).generator(50)]

  //t.log(ns)
  t.is(ns.length, 50)
})

test('clone', t => {
  const n = squirrel().seed(2),
    n2 = n.clone()

  t.deepEqual(JSON.stringify(n), JSON.stringify(n2))
})

test('asBoolean', t => {
  const s = squirrel().asBoolean().noise()

  const counts = [0, 0]

  for (let i = 0; i < 1000; i++) {
    counts[s(i) ? 0 : 1]++
  }

  t.true(counts[0] > 450 && counts[0] < 550)
  t.true(counts[1] > 450 && counts[1] < 550)
})

test('asNumber', t => {
  const s = squirrel().asNumber([-10, 10]).noise()

  let [min, max] = [Infinity, -Infinity]

  for (let i = 0; i < 1000; i++) {
    min = s(i) < min ? s(i) : min
    max = s(i) > max ? s(i) : max
  }

  t.true(min < -9.5)
  t.true(max > 9.5)

  const s3 = squirrel().asNumber().noise()

  for (let i = 0; i < 1000; i++) {
    min = s3(i) < min ? s3(i) : min
    max = s3(i) > max ? s3(i) : max
  }

  t.true(min < -0xfff_ffff)
  t.true(max > 0xfff_ffff)
})

test('noiseNumber is consistent', t => {
  const nn = squirrel().asVect2D().noise()

  const ps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  t.deepEqual(
    ps.map(x => nn(x)),
    ps.map(x => nn(x)),
  )
})

test('noiseVect2D random seed is *in*consistent at generation time', t => {
  const nn = squirrel().seed('random').asVect2D().noise(),
    n2 = squirrel().seed('random').asVect2D().noise()

  const ps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  t.notDeepEqual(
    ps.map(x => nn(x)),
    ps.map(x => n2(x)),
  )
})

test('randomNumber range', t => {
  const rn = squirrel()
    .sequence()
    .seed(20)
    .asVect2D([
      [-1000, 1000],
      [-1e6, 1e6],
    ])
    .noise()

  let min = [Infinity, Infinity],
    max = [-Infinity, -Infinity]

  for (let i = 0; i < 100000; i++) {
    const [x, y] = rn()
    min = [x < min[0] ? x : min[0], y < min[1] ? y : min[1]]
    max = [x > max[0] ? x : max[0], y > max[1] ? y : max[1]]
  }

  //t.log(min, max)

  t.true(min[0] < -990, 'min is close to range start')
  t.true(min[1] < -990000, 'min is close to range start')
  t.true(max[0] > 990, 'max is close to range max')
  t.true(max[1] > 990000, 'max is close to range max')
})

test('asVect3D is consistent', t => {
  const nn = squirrel().asVect3D().noise()

  const ps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  t.deepEqual(
    ps.map(x => nn(x)),
    ps.map(x => nn(x)),
  )
})

test('asVect3D random seed is *in*consistent at generation time', t => {
  const nn = squirrel().seed('random').asVect3D().noise(),
    n2 = squirrel().seed('random').asVect3D().noise()

  const ps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  t.notDeepEqual(
    ps.map(x => nn(x)),
    ps.map(x => n2(x)),
  )
})

test('asVect3D range', t => {
  const rn = squirrel()
    .sequence()
    .seed(30)
    .asVect3D([
      [-1000, 1000],
      [-1e6, 1e6],
      [-10, 10],
    ])
    .noise()

  let min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity]

  for (let i = 0; i < 100000; i++) {
    const [x, y, z] = rn()
    min = [x < min[0] ? x : min[0], y < min[1] ? y : min[1], z < min[2] ? z : min[2]]
    max = [x > max[0] ? x : max[0], y > max[1] ? y : max[1], z > max[2] ? z : max[2]]
  }

  //t.log(min, max)

  t.true(min[0] < -990, 'min is close to range start')
  t.true(min[1] < -990000, 'min is close to range start')
  t.true(min[2] < -9, 'min is close to range start')
  t.true(max[0] > 990, 'max is close to range max')
  t.true(max[1] > 990000, 'max is close to range max')
  t.true(max[2] > 9, 'max is close to range max')
})

test('asCircle', t => {
  let [px, py] = [0, 0]

  ;[...squirrel().asCircle().generator(1000)].forEach(([x, y]) => {
    ;[px, py] = [px + x, py + y]
    t.true(almost(x ** 2 + y ** 2, 1))
  })

  t.true(almost(px, 0, 100))
  t.true(almost(py, 0, 100))
  ;[
    ...squirrel()
      .asCircle(2, [0, Math.PI / 2])
      .generator(100),
  ].forEach(([x, y]) => {
    t.true(almost(x ** 2 + y ** 2, 4))
    t.true(x >= 0)
    t.true(y >= 0)
  })
})

test('asSphere is on unit unit sphere', t => {
  const nv = squirrel().asSphere(2).noise()

  for (let i = 0; i < 100; i++) {
    const [x, y, z] = nv(i)
    t.true(x <= 2 && y <= 2 && z <= 2)
    t.true(almost(nv(i)[0] ** 2 + nv(i)[1] ** 2 + nv(i)[2] ** 2, 2 ** 2))
    t.log(x)
  }
})

test('asSphere averages to origin (no bias)', t => {
  const nv = squirrel().sequence().seed(1).asSphere().noise()
  /*const nv = squirrel()
    .fromIncrement()
    //.seed(1)
    .onSeeding(s => t.log('seed:', s))
    .tuple()
    .element(n => n.onSeeding(s => t.log('seed:', s)).asNumber([0, 2 * Math.PI]))
    .element(n => n.onSeeding(s => t.log('seed:', s)).asNumber([-1, 1]))
    .output()
    .map(([θ, r]) => {
      const z = Math.sqrt(1 - r ** 2)
      return [z * Math.cos(θ), z * Math.sin(θ), r * 2]
    })
    .noise()
*/
  const brown: [number, number, number] = [0, 0, 0]

  let [xMin, xMax] = [Infinity, -Infinity]

  for (let i = 0; i < 10000; i++) {
    const [y, x, z] = nv()

    t.true(-1 <= x && x <= 1)

    brown[0] += x
    brown[1] += y
    brown[2] += z

    xMin = x < xMin ? x : xMin
    xMax = x > xMax ? x : xMax

    //t.log(x)
  }

  t.log(brown)
  t.log(xMin, xMax)

  // it's not clear what actually counts as statistically sound on this, just guessing on reasonable constraints
  t.true(Math.abs(brown[0]) < 700)
  t.true(Math.abs(brown[1]) < 700)
  t.true(Math.abs(brown[2]) < 700)
})

test('asSphere axes are evenly spread', t => {
  const nv = squirrel().sequence().asSphere().noise()

  const brown: [number, number, number] = [0, 0, 0]

  for (let i = 0; i < 30000; i++) {
    const v = nv()
    brown[0] += Math.abs(v[0])
    brown[1] += Math.abs(v[1])
    brown[2] += Math.abs(v[2])
  }

  //t.log(brown)

  // it's not clear what actually counts as statistically sound on this, just guessing on reasonable constraints
  t.true(brown[0] > 14500 && brown[0] < 15500)
  t.true(brown[1] > 14500 && brown[1] < 15500)
  t.true(brown[2] > 14500 && brown[2] < 15500)
})

test('asDisc', t => {
  ;[...squirrel().asDisc().generator(1000)].forEach(([x, y]) => {
    t.true(x ** 2 + y ** 2 <= 1)
  })
  ;[
    ...squirrel()
      .asDisc([2, 3], [0, Math.PI / 2])
      .generator(100),
  ].forEach(([x, y]) => {
    t.true(x ** 2 + y ** 2 >= 4 && x ** 2 + y ** 2 < 9)
    t.true(x >= 0)
    t.true(y >= 0)
  })
})

test('asDisc uniform', t => {
  const rn = squirrel().sequence().seed(123).asDisc().noise(),
    ds = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

  for (let i = 0; i < 100000; i++) {
    const r = rn(),
      d = Math.sqrt(r[0] ** 2 + r[1] ** 2),
      b = Math.floor(d ** 2 * 10)

    ds[b]++
  }

  //t.log(ds)

  ds.forEach(d => {
    t.true(d > 9000)
    t.true(d < 11000)
  })
})

test('asBall vectors in range,', t => {
  const n = squirrel().asBall().noise()

  let min = 1000,
    max = -1

  for (let i = 0; i < 1000000; i++) {
    const v = n(i),
      d = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2)

    min = d < min ? d : min
    max = d > max ? d : max

    t.true(d <= 1)
  }

  //t.log(min, max)
  t.true(min <= 0.02)
  t.true(max >= 0.99)
})

test('asBall uniform', t => {
  const rn = squirrel().sequence().seed(123).asBall(10).noise(),
    ds = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

  for (let i = 0; i < 100000; i++) {
    const [x, y, z] = rn(),
      d = Math.sqrt(x ** 2 + y ** 2 + z ** 2),
      b = Math.floor(d ** 3 / 100)

    ds[b]++
  }

  //t.log(ds)

  ds.forEach(d => {
    t.true(d > 9000)
    t.true(d < 11000)
  })
})

test('asBall uniform inner radius', t => {
  const rn = squirrel().sequence().seed(123).asBall([10, 20]).noise(),
    ds = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

  for (let i = 0; i < 100000; i++) {
    const [x, y, z] = rn(),
      d = Math.sqrt(x ** 2 + y ** 2 + z ** 2),
      b = Math.floor(((d ** 3 - 10 ** 3) / (20 ** 3 - 10 ** 3)) * 10)

    ds[b]++
  }

  //t.log(ds)

  ds.forEach(d => {
    t.true(d > 9000)
    t.true(d < 11000)
  })
})

test('asList is fair', t => {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('')
  const nl = squirrel().sequence().asList(letters).noise()

  const counts: any = {} // eslint-disable-line @typescript-eslint/no-explicit-any

  for (let i = 0; i < 26000; i++) {
    const letter = nl()
    counts[letter] = (counts[letter] ?? 0) + 1
  }

  //t.log(counts)

  t.is(Object.keys(counts).length, 26)
  Object.keys(counts).forEach(letter => t.true(counts[letter] > 900 && counts[letter] < 1110))
})

test('asList weights returns correct output', t => {
  const n = squirrel().seed(3).asList(['a', 'b', 'c'], [1, 1, 2]).noise()

  t.is(n(0), 'c')
})

test('asList weights uniform weights outputs uniformly', t => {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('')
  const nl = squirrel()
    .seed(26)
    .asList(
      letters,
      letters.map(() => 2),
    )
    .noise()

  const counts: any = {} // eslint-disable-line @typescript-eslint/no-explicit-any

  for (let i = 0; i < 26000; i++) {
    const letter = nl(i)
    counts[letter] = (counts[letter] ?? 0) + 1
  }

  //t.log(counts)

  t.is(Object.keys(counts).length, 26)
  Object.keys(counts).forEach(letter => t.true(counts[letter] > 900 && counts[letter] < 1100))
})

test('asList extreme weight bias', t => {
  const letters = 'abcdefghij'.split('')
  const nl = squirrel()
    .seed(26)
    .asList(
      letters,
      letters.map(x => (x === 'g' ? 991 : 1)),
    )
    .noise()

  const counts: any = {} // eslint-disable-line @typescript-eslint/no-explicit-any

  for (let i = 0; i < 100000; i++) {
    const letter = nl(i)
    counts[letter] = (counts[letter] ?? 0) + 1
  }

  //t.log(counts)

  t.is(Object.keys(counts).length, 10)
  t.true(counts['g'] > 98000)
})

test('asList weights default to 1', t => {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('')
  const nl = squirrel().seed(40).asList(letters, [991]).noise()

  const counts: any = {} // eslint-disable-line @typescript-eslint/no-explicit-any

  for (let i = 0; i < 26000; i++) {
    const letter = nl(i)
    counts[letter] = (counts[letter] ?? 0) + 1
  }

  //t.log(counts)

  t.is(Object.keys(counts).length, 26)
  t.true(counts['a'] > 25000)
})

test('asList weights ignored if empty', t => {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('')
  const nl = squirrel().sequence().asList(letters, []).noise()

  const counts: any = {} // eslint-disable-line @typescript-eslint/no-explicit-any

  for (let i = 0; i < 26000; i++) {
    const letter = nl()
    counts[letter] = (counts[letter] ?? 0) + 1
  }

  //t.log(counts)

  t.is(Object.keys(counts).length, 26)
  Object.keys(counts).forEach(letter => t.true(counts[letter] > 850 && counts[letter] < 1150))
})

test('asGaussian defaults', t => {
  const n = squirrel().sequence().asGuassian().noise()

  const counts = [0, 0, 0]

  for (let i = 0; i < 10000; i++) {
    const [x, y] = n()
    if (x < -1) {
      counts[0]++
    }
    if (y < -1) {
      counts[0]++
    }
    if (-1 <= x && x <= 1) {
      counts[1]++
    }
    if (-1 <= y && y <= 1) {
      counts[1]++
    }
    if (x > 1) {
      counts[2]++
    }
    if (y > 1) {
      counts[2]++
    }
  }

  //t.log(counts)
  t.true(counts[0] + counts[1] + counts[2] === 20000)
  t.true(6700 * 2 <= counts[1] && counts[1] <= 7100 * 2)
})

test('asGaussian mean and stdev', t => {
  const n = squirrel().sequence().asGuassian(10, 2).noise()

  const counts = [0, 0, 0]

  for (let i = 0; i < 10000; i++) {
    const [x, y] = n()
    if (x < 8) {
      counts[0]++
    }
    if (y < 8) {
      counts[0]++
    }
    if (8 <= x && x <= 12) {
      counts[1]++
    }
    if (8 <= y && y <= 12) {
      counts[1]++
    }
    if (x > 12) {
      counts[2]++
    }
    if (y > 12) {
      counts[2]++
    }
  }

  //t.log(counts)
  t.true(counts[0] + counts[1] + counts[2] === 20000)
  t.true(6500 * 2 <= counts[1] && counts[1] <= 7100 * 2)
})

test('asPoisson defaults', t => {
  const n = squirrel().asPoisson().noise()

  const counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

  let sum = 0

  for (let i = 0; i < 10000; i++) {
    counts[Math.floor(n(i))]++
    sum += n(i)
  }

  //t.log(counts, sum) // the distribution looks correct, not sure how to verify this though.
  t.true(almost(sum, 10000, 300))
})

test('asPoisson lambda', t => {
  const n = squirrel().asPoisson(2).noise()

  const counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

  let sum = 0

  for (let i = 0; i < 10000; i++) {
    counts[Math.floor(n(i))]++
    sum += n(i)
  }

  //t.log(counts, sum) // the distribution looks correct, not sure how to verify this though.
  t.true(almost(sum, 20000, 500))
})

test('asPoisson invalid options', t => {
  t.throws(() => squirrel().asPoisson(-1))
  t.throws(() => squirrel().asPoisson(50))
})

test('asDice defaults', t => {
  const n = squirrel().asDice().noise()

  const counts = [0, 0, 0, 0, 0, 0, 0]

  for (let i = 0; i < 6000; i++) {
    counts[n(i)]++
    t.true(1 <= n(i) && n(i) <= 6)
  }

  //t.log(counts)
  t.is(counts[0], 0)
  counts.filter((_x, i) => i !== 0).forEach(c => t.true(almost(c, 1000, 100)))
})

test('asDice yahtzee', t => {
  const n = squirrel().seed(4).asDice([6, 6, 6, 6, 6]).noise()

  const counts = [...Array(31).keys()].map(() => 0)

  for (let i = 0; i < 100000; i++) {
    counts[n(i)]++
    t.true(5 <= n(i) && n(i) <= 30)
  }

  //t.log(
  //  counts,
  //  counts.filter((_x, i) => i >= 5 && i <= 17),
  //  counts.filter((_x, i) => i >= 17),
  //)

  counts
    .filter((_x, i) => i >= 5 && i <= 17)
    .reduce((p, c) => {
      t.true(c > p)
      return c
    }, 0)

  counts
    .filter((_x, i) => i >= 17)
    .reduce((p, c) => {
      t.true(c < p)
      return c
    }, 1e6)
})

test('asArray basic', t => {
  const n = squirrel()
    .asArray(10, n => n.asInteger([0, 100]))
    .noise()

  t.is(n(3).length, 10)
  t.deepEqual(n(3), n(3))
})

test('asArray variable length', t => {
  const n = squirrel()
    .asArray(
      p => p.asInteger([2, 5]),
      p => p.asBoolean(),
    )
    .noise()

  const ls = [0, 0, 0, 0]

  for (let i = 0; i < 4000; i++) {
    const b = n(i)
    t.true(b.length >= 2 && b.length <= 5)
    ls[b.length - 2]++
  }

  ls.map(len => t.true(800 <= len && len <= 1200))
})

test('tuple double map', t => {
  const s = squirrel()
    .asTuple(
      n => n.asNumber([0, 10]),
      n => n.asNumber([100, 190]),
    )
    .map(([x, y]) => x + y)
    .map(x => x - 100)
    .noise()

  for (let i = 0; i < 1000; i++) {
    t.true(0 <= s(i) && s(i) <= 100)
  }
})

test('tuple lerp is smooth', t => {
  const n = squirrel()
    .lerp(1)
    .asTuple(
      p => p.asNumber([-10, 10]),
      p => p.asNumber([-1, 1]),
    )
    .noise()

  for (let i = 0; i < 10; i++) {
    const [x0, y0] = n(i),
      [x, y] = n(i + 0.5),
      [x1, y1] = n(i + 1)
    t.true(x0 < x1 ? x0 < x && x < x1 : x0 > x && x > x1)
    t.true(y0 < y1 ? y0 < y && y < y1 : y0 > y && y > y1)
  }
})

test('tuple lerp asArray is smooth', t => {
  const n = squirrel()
    .lerp(1)
    .asArray(5, p => p.asNumber([0, 10]))
    .noise()

  for (let i = 0; i < 10; i++) {
    const a0 = n(i),
      a = n(i + 0.5),
      a1 = n(i + 1)

    //t.log(a0, a, a1)

    for (let j = 0; j < 5; j++) {
      t.true(a0[j] < a1[j] ? a0[j] < a[j] && a[j] < a1[j] : a0[j] > a[j] && a[j] > a1[j])
    }
  }
})
