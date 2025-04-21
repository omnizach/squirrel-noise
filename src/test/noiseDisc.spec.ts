import test from 'ava'

import { noiseDisc, randomDisc } from '../lib/noiseDisc'

test('noiseDisc with defaults', t => {
  const n = noiseDisc()

  let min = 1000,
    max = -1

  for (let i = 0; i < 10000; i++) {
    const v = n(i)

    min = v[0] < min ? v[0] : min
    max = v[0] > max ? v[0] : max
    min = v[1] < min ? v[1] : min
    max = v[1] > max ? v[1] : max
  }

  //t.log(min, max)
  t.true(min <= 0.01)
  t.true(max >= 0.99)
})

test('noiseDisc vectors in range,', t => {
  const n = noiseDisc({ range: [1, 2] })

  let min = 1000,
    max = -1

  for (let i = 0; i < 10000; i++) {
    const v = n(i),
      d = Math.sqrt(v[0] ** 2 + v[1] ** 2)

    min = d < min ? d : min
    max = d > max ? d : max

    t.true(d <= 2)
    t.true(d >= 1)
  }

  //t.log(min, max)
  t.true(min <= 1.01)
  t.true(max >= 1.99)
})

test('noiseDisc uniform', t => {
  const rn = randomDisc({ seed: 123 }),
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
