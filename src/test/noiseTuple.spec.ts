import test from 'ava'
import { noiseTuple } from '../lib/noiseTuple'
import { noiseNumber } from '../lib/noiseNumber'
import { noiseList } from '../lib/noiseList'

test('single tuple', t => {
  const src = noiseNumber(),
    tst = noiseTuple(src)

  t.is(src(2345), tst(2345)[0])
})

test('double tuple', t => {
  const src1 = noiseNumber(),
    src2 = noiseNumber({ seed: 9999 }),
    tst = noiseTuple(src1, src2)

  t.is(src1(4567), tst(4567)[0])
  t.is(src2(5678), tst(5678)[1])
})

test('mixed tuple type works with typescript', t => {
  const src1 = noiseNumber(),
    src2 = noiseList('0123456789abcdef'.split('')),
    tst = noiseTuple(src1, src2)

  t.is(typeof tst(123)[0], 'number')
  t.is(typeof tst(123)[1], 'string')
  t.is(src1(4567), tst(4567)[0])
  t.is(src2(5678), tst(5678)[1])
})
