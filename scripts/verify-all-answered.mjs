/**
 * Quick sanity check for allPlayersAnswered logic.
 * Run: node scripts/verify-all-answered.mjs
 */

function allPlayersAnswered(room) {
  const playerIds = Object.keys(room.players);
  if (playerIds.length === 0) return false;
  return playerIds.every((id) => room.currentAnswers[id] != null);
}

const base = {
  players: { a: {}, b: {}, c: {} },
  currentAnswers: {},
};

let passed = 0;
function assert(name, cond) {
  if (!cond) throw new Error(`FAIL: ${name}`);
  passed++;
  console.log(`OK: ${name}`);
}

assert("empty answers", !allPlayersAnswered(base));
assert(
  "ghost player without answer blocks advance",
  !allPlayersAnswered({
    players: { a: {}, b: {}, ghost: {} },
    currentAnswers: { a: {}, b: {} },
  })
);
assert(
  "extra answer from kicked player is ignored",
  allPlayersAnswered({
    players: { a: {}, b: {} },
    currentAnswers: { a: {}, b: {}, kicked: {} },
  })
);
assert(
  "all answered",
  allPlayersAnswered({
    players: { a: {}, b: {} },
    currentAnswers: { a: {}, b: {} },
  })
);
assert(
  "one missing",
  !allPlayersAnswered({
    players: { a: {}, b: {} },
    currentAnswers: { a: {} },
  })
);

console.log(`\n${passed} checks passed.`);
