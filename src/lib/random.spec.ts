import test from 'ava'

import { random } from './random'

test('noise generator produces sequence with no input', t => {
  const ng = random()

  const prev = NaN

  for (let i = 0; i < 10000; i++) {
    t.not(prev, ng(), 'output should vary')
  }
})

test('noise range is valid', t => {
  const ng = random({ range: [0, 10] })

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

test('noise discrete range is indexable and fair', t => {
  const ng = random({ range: [-2, 8], discrete: true })

  const counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

  for (let i = 0; i < 100000; i++) {
    counts[ng() + 2]++
  }

  t.log(counts)

  t.true(counts.reduce((p, c) => (p < c ? p : c), Infinity) > 9500)
  t.true(counts.reduce((p, c) => (p > c ? p : c), -Infinity) < 10500)
})

test('general performance is fast', t => {
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

  const n = random({ range: [0, 1] }) // using some typical options that add time

  for (let i = 0; i < 1e7; i++) {
    n()
  }

  const timeMs = Date.now() - testStart

  t.log('Test ms', timeMs)

  t.true(timeMs < benchMs * 3)
})
