const map = {};

export function setFiendBucks(userId, amount) {
  if (!map[userId]) {
    map[userId] = 0;
  }
  map[userId] = amount;
  return map[userId];
}

export function getFiendBucks(userId) {
  if (!map[userId]) {
    map[userId] = 0;
  }
  return map[userId];
}
