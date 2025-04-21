import test from 'ava'

import { noiseVect2D, randomVect2D } from '../lib/noiseVect2D'

test('noiseNumber is consistent', t => {
  const nn = noiseVect2D()

  const ps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  t.deepEqual(
    ps.map(x => nn(x)),
    ps.map(x => nn(x)),
  )
})

test('noiseVect2D random seed is *in*consistent at generation time', t => {
  const nn = noiseVect2D({ seed: 'random' }),
    n2 = noiseVect2D({ seed: 'random' })

  const ps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  t.notDeepEqual(
    ps.map(x => nn(x)),
    ps.map(x => n2(x)),
  )
})

test('randomNumber range', t => {
  const rn = randomVect2D({
    range: [
      [-1000, 1000],
      [-1e6, 1e6],
    ],
    seed: 20,
  })

  let min = [Infinity, Infinity],
    max = [-Infinity, -Infinity]

  for (let i = 0; i < 100000; i++) {
    const [x, y] = rn()
    min = [x < min[0] ? x : min[0], y < min[1] ? y : min[1]]
    max = [x > max[0] ? x : max[0], y > max[1] ? y : max[1]]
  }

  //t.log(min, max)

  t.true(min[0] < -990, 'min is close to range start')
  t.true(min[1] < -990000, 'min is close to range start')
  t.true(max[0] > 990, 'max is close to range max')
  t.true(max[1] > 990000, 'max is close to range max')
})
