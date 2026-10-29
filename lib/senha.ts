/** Regras da nova senha (decisão do Otávio, 29/10/2026; especificação v1.7, 16.2). */
export const REGRAS_SENHA = [
  { id: "tamanho", rotulo: "Mínimo de 8 caracteres", ok: (s: string) => s.length >= 8 },
  { id: "maiuscula", rotulo: "Uma letra maiúscula", ok: (s: string) => /\p{Lu}/u.test(s) },
  { id: "minuscula", rotulo: "Uma letra minúscula", ok: (s: string) => /\p{Ll}/u.test(s) },
  { id: "numero", rotulo: "Um número", ok: (s: string) => /\d/.test(s) },
] as const;
export function avaliarSenha(senha: string, confirmacao: string) {
  const regras: { id: string; rotulo: string; ok: boolean }[] = REGRAS_SENHA.map((r) => ({ id: r.id, rotulo: r.rotulo, ok: r.ok(senha) }));
  regras.push({ id: "iguais", rotulo: "As duas senhas são iguais", ok: senha.length > 0 && senha === confirmacao });
  return { regras, valida: regras.every((r) => r.ok) && senha.length <= 128 };
}
