import test from 'ava'
import { noiseGenerator } from '../lib/noiseGenerator'

test('noiseGenerator basic generator loop', t => {
  let count = 0
  for (const x of noiseGenerator()) {
    count++

    t.true(Number.isFinite(x))

    if (count > 100) {
      break
    }
  }
})

test('noiseGenerator materializes with finite length', t => {
  const ns = [...noiseGenerator({ length: 50, range: [0, 10], discrete: true })]

  t.log(ns)
  t.is(ns.length, 50)
})
