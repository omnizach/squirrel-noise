import test from 'ava'

import { noise } from '../lib/fluent'

test('noise with no input is valid', t => {
  const n = noise().func()

  t.is(typeof n(0), 'number')
})

test('noise 1d lerp is smooth between points', t => {
  const nb = noise().lerp(1).range([0, 10]),
    n = nb.func()

  t.deepEqual(nb.lerp(), 1)
  t.deepEqual(noise().lerp(), false)
  t.deepEqual(noise().lerp(false).lerp(), false)

  t.is(n(), n(0))

  for (let i = 0; i < 10; i++) {
    t.true(n(i) < n(i + 1) ? n(i) < n(i + 0.5) && n(i + 0.5) < n(i + 1) : n(i) > n(i + 0.5) && n(i + 0.5) > n(i + 1))
  }
})

test('noise works for 2d input', t => {
  const nf = noise().dimensions(2),
    n = nf.func()

  t.is(nf.dimensions(), 2)
  t.is(n(), n(0, 0))
  t.is(n(2222), n(2222, 0))
  t.deepEqual(noise().dimensions(), 1)

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
  const n = noise().dimensions(2).range([-1000, -100]).func()

  for (let i = 0; i < 10; i++) {
    t.not(n(i, 2), n(i + 1, 2))
    t.not(n(2, i), n(2, i + 1))
  }
})

test('noise lerp2d is smooth', t => {
  const nf = noise().lerp(2).range([-100, 100]),
    n = nf.func()

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
  const n = noise().dimensions(3).func()

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
  const n = noise().lerp(3).range([-100, 100]).func()

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
  const n = noise().dimensions(4).func()

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
  const n1 = noise().seed(234),
    n2 = noise().seed(234)

  t.is(n1.seed(), n2.seed())
  t.is(n1.func()(999), n2.func()(999))
})

test('noise works with random seeds', t => {
  let s1 = NaN,
    s2 = NaN

  const n1 = noise()
      .seed('random')
      .onSeeding(s => (s1 = s)),
    n2 = noise()
      .seed('random')
      .onSeeding(s => (s2 = s)),
    f1 = n1.func(),
    f2 = n2.func()

  t.not(s1, s2)
  t.true(Number.isFinite(s1) && Number.isFinite(s2))
  t.not(f1(999), f2(999))
})

test('noise octaves are consistent for close values', t => {
  const nb = noise().octave(1),
    n = nb.func()

  t.deepEqual(nb.octave(), 1)
  t.deepEqual(noise().octave(), 0)

  for (let i = 0; i < 100; i++) {
    t.is(n(i * 2), n(i * 2 + 1))
  }
})

test('noise onSeeding', t => {
  let seed = 0
  const cb = (s: number) => (seed = s),
    nb = noise().seed('generate').onSeeding(cb),
    n = nb.func()

  t.true(n(9) < 0xffff_ffff)
  t.deepEqual(seed, 666346043)

  t.is(nb.onSeeding(), cb)
})

test.skip('noise declaration seeding', t => {
  const n1 = noise().seed('declaration').func(),
    n2 = noise().seed('declaration').func()

  t.notDeepEqual(n1(3), n2(3))

  for (let i = 0; i < 2; i++) {
    const n = noise().seed('declaration').func()
    t.deepEqual(n(5), 811316781)
  }

  t.is(noise().seed(), 'declaration')
})

test('noise input', t => {
  const n = noise()

  t.is(n.input()(999), 999)

  const np1 = noise().input(x => x + 1)

  t.is(np1.input()(999), 1000)
})

test('noise output', t => {
  const n = noise()
    .range([0, 10])
    .output(x => x + 100)
    .func()

  for (let i = 0; i < 1000; i++) {
    t.true(100 <= n(i) && n(i) < 110)
  }

  t.is(noise().output()(999), 999)
})

test('noise discrete range', t => {
  const nb = noise().range([0, 10]).discrete(true),
    n = nb.func()

  t.deepEqual(nb.discrete(), true)
  t.deepEqual(noise().discrete(), false)
  t.deepEqual(noise().discrete(false).discrete(), false)

  const y = [...Array(10).keys()].map(() => 0)

  for (let i = 0; i < 10000; i++) {
    y[n(i)]++
  }

  for (let i = 0; i < 10; i++) {
    t.true(900 <= y[i] && y[i] <= 1100)
  }
})

test('noise generator produces sequence with no input', t => {
  const ng = noise().fromIncrement().func()

  const prev = NaN

  for (let i = 0; i < 10000; i++) {
    t.not(prev, ng(), 'output should vary')
  }
})

test('noise range is valid', t => {
  const nb = noise().fromIncrement().range([0, 10]),
    ng = nb.func()

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
  t.deepEqual(noise().range(), [-0x7fff_ffff, 0x7fff_ffff])
})

test('noise discrete range is indexable and fair', t => {
  const ng = noise().fromIncrement().range([-2, 8]).discrete(true).func()

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

  const n = noise().fromIncrement().range([0, 1]).func() // using some typical options that add time

  for (let i = 0; i < 1e7; i++) {
    n()
  }

  const timeMs = Date.now() - testStart

  t.log('Test ms', timeMs)

  t.true(timeMs < benchMs * 3)
})

test('noiseGenerator basic generator loop', t => {
  let count = 0
  for (const x of noise().generator()) {
    count++

    t.true(Number.isFinite(x))

    if (count > 100) {
      break
    }
  }
})

test('noiseGenerator materializes with finite length', t => {
  const ns = [...noise().range([0, 10]).discrete(true).generator(50)]

  //t.log(ns)
  t.is(ns.length, 50)
})

test('clone', t => {
  const n = noise().lerp(2),
    n2 = n.clone()

  t.deepEqual(n.lerp(), n2.lerp())
})

test('fromString', t => {
  const n = noise().fromString().func()

  t.deepEqual(n('test string'), n('test string'))
  t.notDeepEqual(n('test string'), n('not test string'))
})
