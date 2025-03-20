/**
 * Code adapted from Squirrel Eiserloh's GDC talk: https://youtu.be/LWFzPP8ZbdU?t=2799
 */

const BIT_NOISE1 = 0xb5297a4d
const BIT_NOISE2 = 0x68e31da4
const BIT_NOISE3 = 0x1b56c4e9

export const squirrel3 = (position: number, seed = 0) => {
  let mangled = position
  mangled *= BIT_NOISE1
  mangled += seed
  mangled ^= mangled >> 8
  mangled += BIT_NOISE2
  mangled ^= mangled << 8
  mangled *= BIT_NOISE3
  mangled ^= mangled >> 8

  return mangled
}
