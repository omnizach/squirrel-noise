import test from 'ava'

import { noiseBall, randomBall } from '../lib/noiseBall'

test('noiseBall vectors in range,', t => {
  const n = noiseBall()

  let min = 1000,
    max = -1

  for (let i = 0; i < 1000000; i++) {
    const v = n(i),
      d = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2)

    min = d < min ? d : min
    max = d > max ? d : max

    t.true(d <= 1)
  }

  t.log(min, max)
  t.true(min <= 0.02)
  t.true(max >= 0.99)
})

test('noiseBall uniform', t => {
  const rn = randomBall({ seed: 123 }),
    ds = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

  for (let i = 0; i < 100000; i++) {
    const r = rn(),
      d = Math.sqrt(r[0] ** 2 + r[1] ** 2 + r[2] ** 2),
      b = Math.floor(d ** 3 * 10)

    ds[b]++
  }

  t.log(ds)

  ds.forEach(d => {
    t.true(d > 9000)
    t.true(d < 11000)
  })
})
