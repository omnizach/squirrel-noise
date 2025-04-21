import test from 'ava'

import { noiseUnitCircle, randomUnitCircle } from '../lib/noiseUnitCircle'

test('noiseVector2D is on unit circle', t => {
  const nv = noiseUnitCircle()

  for (let i = 0; i < 10000; i++) {
    t.true(nv(i)[0] ** 2 + nv(i)[1] ** 2 > 0.9999)
    t.true(nv(i)[0] ** 2 + nv(i)[1] ** 2 < 1.0001)
  }
})

test('randomVector2D is on unit circle', t => {
  const nv = randomUnitCircle()

  for (let i = 0; i < 10000; i++) {
    const v = nv()
    t.true(v[0] ** 2 + v[1] ** 2 > 0.9999)
    t.true(v[0] ** 2 + v[1] ** 2 < 1.0001)
  }
})

test('randomVector2D averages to origin (no bias)', t => {
  const nv = randomUnitCircle()

  const brown: [number, number] = [0, 0]

  for (let i = 0; i < 100000; i++) {
    const v = nv()
    brown[0] += v[0]
    brown[1] += v[1]
  }

  //t.log(brown)

  t.true(Math.abs(brown[0]) < 500)
  t.true(Math.abs(brown[1]) < 500)
})
