import { packSchema, type Pack } from "./schema-pack";

export type ResultadoValidacao = { ok: true; pack: Pack } | { ok: false; erros: string[] };

export function validarPack(conteudo: string): ResultadoValidacao {
  let json: unknown;
  try {
    json = JSON.parse(conteudo);
  } catch {
    return { ok: false, erros: ["O arquivo não é um JSON válido."] };
  }

  const resultado = packSchema.safeParse(json);
  if (resultado.success) {
    return { ok: true, pack: resultado.data };
  }

  const erros = resultado.error.issues.map((problema) => {
    const caminho = problema.path.join(".");
    return caminho ? `${caminho}: ${problema.message}` : problema.message;
  });
  return { ok: false, erros };
}
