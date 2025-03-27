import test from 'ava'

import { noiseFactory } from './noiseFactory'

test('noiseFactory produces accurate output', t => {
  const nd = noiseFactory(x => new Date(new Date(2000, 0, 1).getTime() + x), {
    range: [0, 365 * 24 * 60 * 60 * 1000],
  })

  for (let i = 0; i < 100; i++) {
    t.true(nd(i) > new Date(2000, 0, 1))
    t.true(nd(i) < new Date(2001, 0, 1))
  }
})
