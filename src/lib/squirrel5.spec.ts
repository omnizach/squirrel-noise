import test from 'ava'

import { squirrel5 } from './squirrel5'

test('no-seed', (t) => {
  t.is(squirrel5()(0), -247101726)
})

test('seed-zero', (t) => {
  t.is(squirrel5(0)(0), -247101726)
})

test('seeded', (t) => {
  t.is(squirrel5(3)(0), 737589467)
})
