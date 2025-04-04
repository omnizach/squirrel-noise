import test from 'ava'

import { noiseVect3D, randomVect3D } from './noiseVect3D'

test('noiseNumber is consistent', t => {
  const nn = noiseVect3D()

  const ps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  t.deepEqual(
    ps.map(x => nn(x)),
    ps.map(x => nn(x)),
  )
})

test('noiseVect3D random seed is *in*consistent at generation time', t => {
  const nn = noiseVect3D({ seed: 'random' }),
    n2 = noiseVect3D({ seed: 'random' })

  const ps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  t.notDeepEqual(
    ps.map(x => nn(x)),
    ps.map(x => n2(x)),
  )
})

test('noiseNumber default range', t => {
  const rn = randomVect3D({
    range: [
      [-1000, 1000],
      [-1e6, 1e6],
      [-10, 10],
    ],
    seed: 30,
  })

  let min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity]

  for (let i = 0; i < 100000; i++) {
    const [x, y, z] = rn()
    min = [
      x < min[0] ? x : min[0],
      y < min[1] ? y : min[1],
      z < min[2] ? z : min[2],
    ]
    max = [
      x > max[0] ? x : max[0],
      y > max[1] ? y : max[1],
      z > max[2] ? z : max[2],
    ]
  }

  t.log(min, max)

  t.true(min[0] < -990, 'min is close to range start')
  t.true(min[1] < -990000, 'min is close to range start')
  t.true(min[2] < -9, 'min is close to range start')
  t.true(max[0] > 990, 'max is close to range max')
  t.true(max[1] > 990000, 'max is close to range max')
  t.true(max[2] > 9, 'max is close to range max')
})
