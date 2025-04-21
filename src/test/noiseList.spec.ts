import test from 'ava'

import { noiseList, randomList } from '../lib/noiseList'

test('noiseList is fair', t => {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('')
  const nl = noiseList(letters)

  const counts: any = {} // eslint-disable-line @typescript-eslint/no-explicit-any

  for (let i = 0; i < 26000; i++) {
    counts[nl(i)] = (counts[nl(i)] ?? 0) + 1
  }

  //t.log(counts)

  t.is(Object.keys(counts).length, 26)
  Object.keys(counts).forEach(letter => t.true(counts[letter] > 900 && counts[letter] < 1100))
})

test('randomList is fair', t => {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('')
  const nl = randomList(letters)

  const counts: any = {} // eslint-disable-line @typescript-eslint/no-explicit-any

  for (let i = 0; i < 26000; i++) {
    const letter = nl()
    counts[letter] = (counts[letter] ?? 0) + 1
  }

  //t.log(counts)

  t.is(Object.keys(counts).length, 26)
  Object.keys(counts).forEach(letter => t.true(counts[letter] > 900 && counts[letter] < 1100))
})

test('weights returns correct output', t => {
  const n = noiseList(['a', 'b', 'c'], { weights: [1, 1, 2], seed: 3 })

  t.is(n(0), 'c')
})

test('weights uniform weights outputs uniformly', t => {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('')
  const nl = noiseList(letters, { weights: letters.map(() => 2), seed: 26 })

  const counts: any = {} // eslint-disable-line @typescript-eslint/no-explicit-any

  for (let i = 0; i < 26000; i++) {
    const letter = nl(i)
    counts[letter] = (counts[letter] ?? 0) + 1
  }

  //t.log(counts)

  t.is(Object.keys(counts).length, 26)
  Object.keys(counts).forEach(letter => t.true(counts[letter] > 900 && counts[letter] < 1100))
})

test('extreme weight bias', t => {
  const letters = 'abcdefghij'.split('')
  const nl = noiseList(letters, {
    weights: letters.map(x => (x === 'g' ? 991 : 1)),
    seed: 26,
  })

  const counts: any = {} // eslint-disable-line @typescript-eslint/no-explicit-any

  for (let i = 0; i < 100000; i++) {
    const letter = nl(i)
    counts[letter] = (counts[letter] ?? 0) + 1
  }

  //t.log(counts)

  t.is(Object.keys(counts).length, 10)
  t.true(counts['g'] > 98000)
})

test('weights default to 1', t => {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('')
  const nl = noiseList(letters, { weights: [991], seed: 40 })

  const counts: any = {} // eslint-disable-line @typescript-eslint/no-explicit-any

  for (let i = 0; i < 26000; i++) {
    const letter = nl(i)
    counts[letter] = (counts[letter] ?? 0) + 1
  }

  //t.log(counts)

  t.is(Object.keys(counts).length, 26)
  t.true(counts['a'] > 25000)
})

test('weights ignored if empty', t => {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('')
  const nl = randomList(letters, { weights: [] })

  const counts: any = {} // eslint-disable-line @typescript-eslint/no-explicit-any

  for (let i = 0; i < 26000; i++) {
    const letter = nl()
    counts[letter] = (counts[letter] ?? 0) + 1
  }

  //t.log(counts)

  t.is(Object.keys(counts).length, 26)
  Object.keys(counts).forEach(letter => t.true(counts[letter] > 900 && counts[letter] < 1100))
})
