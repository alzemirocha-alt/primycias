// Arquivo criado para corrigir o deploy
export function isTreasurer(me) {
  return me?.oficio === "tesoureiro" || me?.cargo === "tesoureiro";
}
export function isAdmin(me) {
  return me?.oficio === "admin" || me?.cargo === "admin" || me?.cargo === "secretario";
}
export function isCouncilSecretary(me) {
  return me?.oficio === "secretario" || me?.cargo === "secretario";
}
