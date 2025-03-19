import test from 'ava'

//import { noiseBoolean, randomBoolean } from './noiseBoolean'

test('no-coverage', t => {
  t.pass('no tests')
})

/*
test('noiseBoolean returns booleans consistently', t => {
  const nb = noiseBoolean()
  t.false(nb(0))
  t.true(nb(3))
  t.false(nb(0))
})

test('randomBoolean returns booleans in sequence', t => {
  const rb = randomBoolean()
  t.false(rb())
  t.true(rb())
  t.false(rb())
})

test('randomBoolean is fair', t => {
  const rb = randomBoolean()

  let trueCount = 0

  for (let i = 0; i < 1000000; i++) {
    if (rb()) {
      trueCount++
    }
  }

  t.log(trueCount)
  t.true(trueCount > 499000 && trueCount < 501000)
})
  */