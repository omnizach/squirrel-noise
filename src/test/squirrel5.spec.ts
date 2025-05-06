import test from 'ava'

import { squirrel5 } from '../lib/squirrel5'

test('squirrel5 default seed and position', t => {
  const n1 = squirrel5(),
    n2 = squirrel5(0)

  t.is(n1(0), n2(0))
  t.is(n1(), n1(0))
  t.is(n1(999), n2(999))
})