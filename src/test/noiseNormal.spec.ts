import test from 'ava'
import { noiseNormal } from '../lib/noiseNormal'

test('noiseNormal default mean and variance', t => {
  const n = noiseNormal(),
    mean = [...Array(100000).keys()].map((_, i) => n(i)).reduce((p, c) => p + c, 0) / 100000,
    stddev = Math.sqrt([...Array(100000).keys()].map((_, i) => (n(i) - mean) ** 2).reduce((p, c) => p + c, 0) / 100000)

  t.true(Math.abs(mean) < 0.01)
  t.true(Math.abs(stddev - 1) < 0.01)
})

test('noiseNormal clamp', t => {
  const n = noiseNormal({ clamp: [-1, 1] })

  const [min, max] = [...Array(100000).keys()]
    .map(i => n(i))
    .reduce(([a, b], c) => [c < a ? c : a, c > b ? c : b], [0, 0])

  t.true(min >= -1)
  t.true(max <= 1)
})

test('noiseNormal mean and stddev', t => {
  const n = noiseNormal({ mean: 10, stddev: 10 }),
    mean = [...Array(100000).keys()].map((_, i) => n(i)).reduce((p, c) => p + c, 0) / 100000,
    stddev = Math.sqrt([...Array(100000).keys()].map((_, i) => (n(i) - mean) ** 2).reduce((p, c) => p + c, 0) / 100000)

  //t.log(mean, stddev)
  t.true(Math.abs(mean - 10) < 0.1)
  t.true(Math.abs(stddev - 10) < 0.1)
})
