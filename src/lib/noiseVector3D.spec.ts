import test from 'ava'

import { noiseVector3D, randomVector3D } from './noiseVector3D'

test('noiseVector3D is on unit circle', (t) => {
  const nv = noiseVector3D()

  for (let i = 0; i < 10000; i++) {
    t.true(nv(i)[0] ** 2 + nv(i)[1] ** 2 + nv(i)[2] ** 2 > 0.9999)
    t.true(nv(i)[0] ** 2 + nv(i)[1] ** 2 + nv(i)[2] ** 2 < 1.0001)
  }
})

test('randomVector3D is on unit circle', (t) => {
  const nv = randomVector3D()

  for (let i = 0; i < 10000; i++) {
    const v = nv()
    t.true(v[0] ** 2 + v[1] ** 2 + v[2] ** 2 > 0.9999)
    t.true(v[0] ** 2 + v[1] ** 2 + v[2] ** 2 < 1.0001)
  }
})

test('randomVector3D averages to origin (no bias)', (t) => {
  const nv = randomVector3D()

  const brown: [number, number, number] = [0, 0, 0]

  for (let i = 0; i < 100000; i++) {
    const v = nv()
    brown[0] += v[0]
    brown[1] += v[1]
    brown[2] += v[2]
  }

  t.log(brown)

  // it's not clear what actually counts as statistically sound on this, just guessing on reasonable constraints
  t.true(Math.abs(brown[0]) < 300)
  t.true(Math.abs(brown[1]) < 300)
  t.true(Math.abs(brown[2]) < 300)
})

test('randomVector3D axes are evenly spread', (t) => {
  const nv = randomVector3D()

  const brown: [number, number, number] = [0, 0, 0]

  for (let i = 0; i < 30000; i++) {
    const v = nv()
    brown[0] += Math.abs(v[0])
    brown[1] += Math.abs(v[1])
    brown[2] += Math.abs(v[2])
  }

  t.log(brown)

  // it's not clear what actually counts as statistically sound on this, just guessing on reasonable constraints
  t.true(brown[0] > 14900 && brown[0] < 15100)
  t.true(brown[1] > 14900 && brown[1] < 15100)
  t.true(brown[2] > 14900 && brown[2] < 15100)
})
