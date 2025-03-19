import test from 'ava'

import { noiseBoolean, randomBoolean } from './noiseBoolean'

test('noiseBoolean returns booleans consistently', (t) => {
  const nb = noiseBoolean({ seed: 10 })
  const ps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

  ps.forEach((p) => {
    t.is(nb(p), nb(p))
  })
})

test('randomBoolean returns booleans in sequence', (t) => {
  const rb = randomBoolean(),
    bs = [rb(), rb(), rb(), rb(), rb(), rb(), rb(), rb(), rb(), rb()]

  t.true(bs.some((b) => b))
  t.true(bs.some((b) => !b))
})

test('randomBoolean is fair', (t) => {
  const rb = randomBoolean()

  let trueCount = 0

  for (let i = 0; i < 1000000; i++) {
    if (rb()) {
      trueCount++
    }
  }

  t.log(trueCount)
  t.true(trueCount > 499000 && trueCount < 501000)
})
