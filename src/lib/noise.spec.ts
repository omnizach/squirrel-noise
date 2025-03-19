import test from 'ava'
import { noise } from './noise'

test('noise generator produces sequence with no input', t => {
  const ng = noise({ generator: true })

  let prev = NaN

  for (let i = 0; i < 10000; i++) {
    t.not(prev, ng(), 'output should vary')
  }
})

test('noise range is valid', t => {
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

test('noise discrete range is indexable and fair', t => {
  const ng = noise({ generator: true, range: [-2, 8], discrete: true })

  let counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

  for (let i = 0; i < 100000; i++) {
    counts[ng()+2]++
  }

  t.log(counts)

  t.true(counts.reduce((p, c) => p < c ? p : c, Infinity) > 9500)
  t.true(counts.reduce((p, c) => p > c ? p : c, -Infinity) < 10500)
})