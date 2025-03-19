import test from 'ava'
import { noiseList, randomList } from './noiseList'

test('noiseList is fair', t => {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('')
  const nl = noiseList(letters)

  const counts: any = {}

  for (let i = 0; i < 26000; i++) {
    counts[nl(i)] = (counts[nl(i)] ?? 0) + 1
  }

  t.log(counts)

  t.is(Object.keys(counts).length, 26)
  Object.keys(counts).forEach(letter => t.true(counts[letter] > 900 && counts[letter] < 1100))
})

test('randomList is fair', t => {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('')
  const nl = randomList(letters)

  const counts: any = {}

  for (let i = 0; i < 26000; i++) {
    const letter = nl()
    counts[letter] = (counts[letter] ?? 0) + 1
  }

  t.log(counts)

  t.is(Object.keys(counts).length, 26)
  Object.keys(counts).forEach(letter => t.true(counts[letter] > 900 && counts[letter] < 1100))
})