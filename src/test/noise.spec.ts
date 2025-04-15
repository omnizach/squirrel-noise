import test from 'ava'

import { noise } from '../lib/noise'

test('noise with no input is valid', t => {
  const n = noise()

  t.is(typeof n(), 'number')
})

test('noise 1d lerp is smooth between points', t => {
  const n = noise({ range: [0, 10], lerp: true })

  t.is(n(), n(0))

  for (let i = 0; i < 10; i++) {
    t.true(
      n(i) < n(i + 1)
        ? n(i) < n(i + 0.5) && n(i + 0.5) < n(i + 1)
        : n(i) > n(i + 0.5) && n(i + 0.5) > n(i + 1),
    )
  }
})

test('noise works for 2d input', t => {
  const n = noise({ dimensions: 2 })

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
  const n = noise({ dimensions: 2, range: [-1000, -100] })

  for (let i = 0; i < 10; i++) {
    t.not(n(i, 2), n(i + 1, 2))
    t.not(n(2, i), n(2, i + 1))
  }
})

test('noise lerp2d is smooth', t => {
  const n = noise({ dimensions: 2, range: [-100, 100], lerp: true })

  t.is(n(), n(0, 0))
  t.is(n(0), n(0, 0))

  for (let i = 1; i < 100; i++) {
    for (let j = 1; j < 100; j++) {
      t.true(
        Math.abs(
          (n(i, j) + n(i + 1, j) + n(i, j + 1) + n(i + 1, j + 1)) / 4 -
            n(i + 0.5, j + 0.5),
        ) < 0.0001,
      )
    }
  }
})

test('noise works for 3d input', t => {
  const n = noise({ dimensions: 3 })

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
  const n = noise({ dimensions: 3, range: [-100, 100], lerp: true })

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
  const n = noise({ dimensions: 4 })

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

test("noise lerp4d isn't implemented", t => {
  t.throws(() => noise({ lerp: true, dimensions: 4 }))
})

test('noise works with random seeds', t => {
  const n1 = noise({ seed: 'random' }),
    n2 = noise({ seed: 'random' })

  t.not(n1(999), n2(999))
})

test('noise octaves are consistent for close values', t => {
  const n = noise({ octave: 1 })

  for (let i = 0; i < 100; i++) {
    t.is(n(i * 2), n(i * 2 + 1))
  }
})
