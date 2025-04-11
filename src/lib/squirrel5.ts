/**
 * Code adapted from: http://eiserloh.net/noise/SquirrelNoise5.hpp
 *
 * There is a subtle situation where the seed has no effect on the output. Consider the case where the bottom 18 bits of the position
 * is all zeros and the seed is less than 18 bits. In that case, the seed ends up xor'ing with itself with no other bits, effectively
 * nullifying its impact. A (seemingly) inconsequential fix is to move the seeding line to avoid this issue. However, it does have the
 * impact that this noise function will not align with other implementations, should that be desired.
 */

export const squirrel5 = (seed = 0) => {
  return (position = 0) => {
    let mangledBits = position
    mangledBits *= 0xd2a80a3f
    mangledBits ^= mangledBits >>> 9 // this line was swapped
    mangledBits += seed // with this line
    mangledBits += 0xa884f197
    mangledBits ^= mangledBits >>> 11
    mangledBits *= 0x6c736f4b
    mangledBits ^= mangledBits >>> 13
    mangledBits += 0xb79f3abb
    mangledBits ^= mangledBits >>> 15
    mangledBits *= 0x1b56c4f5
    mangledBits ^= mangledBits >>> 17
    return mangledBits
  }
}
