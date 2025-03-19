import test from 'ava'

import { noiseNumber, randomNumber } from './noiseNumber'

test('noiseNumber is consistent', t => {
  const nn = noiseNumber()

  const ps = [0,1,2,3,4,5,6,7,8,9,10]

  t.deepEqual(ps.map(x => nn(x)), ps.map(x => nn(x)))
})


test('noiseNumber default range', t => {
  const rn = randomNumber()

  let min = Infinity,
    max = -Infinity

  for (let i = 0; i < 100000; i++) {
    const r = rn()
    min = r < min ? r : min
    max = r > max ? r : max
  }

  t.log(min, max)

  t.true(min < -0x77ffffff, 'min is close to zero')
  t.true(max > 0x77ffffff, 'max is close to 0x7fffffff')
})