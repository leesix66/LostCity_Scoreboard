export function calculateExpedition(numbers = [], wagerCount = 0) {
  const started = numbers.length > 0 || wagerCount > 0;
  if (!started) return 0;

  const cardSum = numbers.reduce((sum, number) => sum + number, 0);
  const multiplier = wagerCount + 1;
  const longExpeditionBonus = numbers.length + wagerCount >= 8 ? 20 : 0;
  return (cardSum - 20) * multiplier + longExpeditionBonus;
}

export function calculatePlayerRound(expeditions) {
  return expeditions.reduce(
    (total, expedition) => total + calculateExpedition(expedition.numbers, expedition.wagers),
    0,
  );
}
