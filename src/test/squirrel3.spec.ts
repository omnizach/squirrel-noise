import test from 'ava'

import { squirrel3 } from '../lib/squirrel3'

test('no-seed', t => {
  t.is(squirrel3(0), 436901382)
})

test('seed-zero', t => {
  t.is(squirrel3(0, 0), 436901382)
})

test('seeded', t => {
  t.is(squirrel3(0, 3), 1025206206)
})
