import test from 'ava'

import { noise } from './noise'

test('noise generator produces sequence with no input', (t) => {
  const ng = noise({ generator: true })

  const prev = NaN

  for (let i = 0; i < 10000; i++) {
    t.not(prev, ng(), 'output should vary')
  }
})

test('noise range is valid', (t) => {
  const ng = noise({ generator: true, range: [0, 10] })

  let min = 10,
    max = 0

  for (let i = 0; i < 10000; i++) {
    const r = ng()
    min = r < min ? r : min
    max = r > max ? r : max
  }

  t.log(min, max)

  t.true(min < 0.01)
  t.true(max > 9.99)
})

test('noise discrete range is indexable and fair', (t) => {
  const ng = noise({ generator: true, range: [-2, 8], discrete: true })

  const counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

  for (let i = 0; i < 100000; i++) {
    counts[ng() + 2]++
  }

  t.log(counts)

  t.true(counts.reduce((p, c) => (p < c ? p : c), Infinity) > 9500)
  t.true(counts.reduce((p, c) => (p > c ? p : c), -Infinity) < 10500)
})

test('noise 1d lerp is smooth between points', (t) => {
  const n = noise({ range: [0, 10], lerp: true })

  for (let i = 0; i < 10; i++) {
    t.true(
      n(i) < n(i + 1)
        ? n(i) < n(i + 0.5) && n(i + 0.5) < n(i + 1)
        : n(i) > n(i + 0.5) && n(i + 0.5) > n(i + 1),
    )
  }
})

test('general performance is fast', (t) => {
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

  const n = noise({ generator: true, range: [0, 1] }) // using some typical options that add time

  for (let i = 0; i < 1e7; i++) {
    n()
  }

  const timeMs = Date.now() - testStart

  t.log('Test ms', timeMs)

  t.true(timeMs < benchMs * 3)
})

test('noise works for 2d input', (t) => {
  const n = noise({ dimensions: 2 })

  for (let i = 1; i < 100; i++) {
    for (let j = 1; j < 100; j++) {
      t.not(n(i, j), n(0, j))
      t.not(n(i, j), n(i, 0))
      t.not(n(i, j), n(i - 1, j))
      t.not(n(i, j), n(i, j - 1))
    }
  }
})

test('noise varies in 2d with range', (t) => {
  const n = noise({ dimensions: 2, range: [-1000, -100] })

  for (let i = 0; i < 10; i++) {
    t.not(n(i, 2), n(i + 1, 2))
    t.not(n(2, i), n(2, i + 1))
  }
})

test('noise lerp2d is smooth', (t) => {
  const n = noise({ dimensions: 2, range: [-100, 100], lerp: true })

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

test('noise works for 3d input', (t) => {
  const n = noise({ dimensions: 3 })

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
