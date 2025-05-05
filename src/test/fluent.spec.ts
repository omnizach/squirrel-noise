import test from 'ava'

import { squirrel } from '../lib/fluent'

test('noise with no input is valid', t => {
  const n = squirrel().noise()

  t.is(typeof n(0), 'number')
})

test('noise 1d lerp is smooth between points', t => {
  const nb = squirrel().lerp(1).range([0, 10]),
    n = nb.noise()

  t.deepEqual(nb.lerp(), 1)
  t.deepEqual(squirrel().lerp(), false)
  t.deepEqual(squirrel().lerp(false).lerp(), false)

  t.is(n(), n(0))

  for (let i = 0; i < 10; i++) {
    t.true(n(i) < n(i + 1) ? n(i) < n(i + 0.5) && n(i + 0.5) < n(i + 1) : n(i) > n(i + 0.5) && n(i + 0.5) > n(i + 1))
  }
})

test('noise works for 2d input', t => {
  const nf = squirrel().dimensions(2),
    n = nf.noise()

  t.is(nf.dimensions(), 2)
  t.is(n(), n(0, 0))
  t.is(n(2222), n(2222, 0))
  t.deepEqual(squirrel().dimensions(), 1)

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
  const n = squirrel().dimensions(2).range([-1000, -100]).noise()

  for (let i = 0; i < 10; i++) {
    t.not(n(i, 2), n(i + 1, 2))
    t.not(n(2, i), n(2, i + 1))
  }
})

test('noise lerp2d is smooth', t => {
  const nf = squirrel().lerp(2).range([-100, 100]),
    n = nf.noise()

  t.is(nf.lerp(), 2)
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
  const n = squirrel().lerp(3).range([-100, 100]).noise()

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

  t.is(n1.seed(), n2.seed())
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

test('noise octaves are consistent for close values', t => {
  const nb = squirrel().octave(1),
    n = nb.noise()

  t.deepEqual(nb.octave(), 1)
  t.deepEqual(squirrel().octave(), 0)

  for (let i = 0; i < 100; i++) {
    t.is(n(i * 2), n(i * 2 + 1))
  }
})

test('noise onSeeding', t => {
  let seed = 0
  const cb = (s: number) => (seed = s),
    nb = squirrel().seed('generate').onSeeding(cb),
    n = nb.noise()

  t.true(n(9) < 0xffff_ffff)
  t.deepEqual(seed, 666346043)

  t.is(nb.onSeeding(), cb)
})

test.skip('noise declaration seeding', t => {
  const n1 = squirrel().seed('declaration').noise(),
    n2 = squirrel().seed('declaration').noise()

  t.notDeepEqual(n1(3), n2(3))

  for (let i = 0; i < 2; i++) {
    const n = squirrel().seed('declaration').noise()
    t.deepEqual(n(5), 811316781)
  }

  t.is(squirrel().seed(), 'declaration')
})

test('noise input', t => {
  const n = squirrel()

  t.is(n.input()(999), 999)

  const np1 = squirrel().input(x => x + 1)

  t.is(np1.input()(999), 1000)
})

test('noise output', t => {
  const n = squirrel()
    .range([0, 10])
    .output(x => x + 100)
    .noise()

  for (let i = 0; i < 1000; i++) {
    t.true(100 <= n(i) && n(i) < 110)
  }

  t.is(squirrel().output()(999), 999)
})

test('noise discrete range', t => {
  const nb = squirrel().range([0, 10]).discrete(true),
    n = nb.noise()

  t.deepEqual(nb.discrete(), true)
  t.deepEqual(squirrel().discrete(), false)
  t.deepEqual(squirrel().discrete(false).discrete(), false)

  const y = [...Array(10).keys()].map(() => 0)

  for (let i = 0; i < 10000; i++) {
    y[n(i)]++
  }

  for (let i = 0; i < 10; i++) {
    t.true(900 <= y[i] && y[i] <= 1100)
  }
})

test('noise generator produces sequence with no input', t => {
  const ng = squirrel().fromIncrement().noise()

  const prev = NaN

  for (let i = 0; i < 10000; i++) {
    t.not(prev, ng(), 'output should vary')
  }
})

test('noise range is valid', t => {
  const nb = squirrel().fromIncrement().range([0, 10]),
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

  t.deepEqual(nb.range(), [0, 10])
  t.deepEqual(squirrel().range(), [-0x7fff_ffff, 0x7fff_ffff])
})

test('noise discrete range is indexable and fair', t => {
  const ng = squirrel().fromIncrement().range([-2, 8]).discrete(true).noise()

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

  const n = squirrel().fromIncrement().range([0, 1]).noise() // using some typical options that add time

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
  const ns = [...squirrel().range([0, 10]).discrete(true).generator(50)]

  //t.log(ns)
  t.is(ns.length, 50)
})

test('clone', t => {
  const n = squirrel().lerp(2),
    n2 = n.clone()

  t.deepEqual(n.lerp(), n2.lerp())
})

test('fromString', t => {
  const n = squirrel().fromString().noise()

  t.deepEqual(n('test string'), n('test string'))
  t.notDeepEqual(n('test string'), n('not test string'))
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

  const s2 = squirrel()
    .asNumber(x => x & 0xf)
    .noise()
  ;[min, max] = [20, -10]

  for (let i = 0; i < 1000; i++) {
    min = s2(i) < min ? s2(i) : min
    max = s2(i) > max ? s2(i) : max
  }

  t.true(min < 0.5)
  t.true(max > 14.5)

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
    .fromIncrement()
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
    .fromIncrement()
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
