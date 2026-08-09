// Returns a human, motivating message based on the RD$ amount donated.
export type TierMessage = { title: string; items: string[] };

const tiers: { min: number; msg: TierMessage }[] = [
  { min: 0, msg: { title: "Cada peso suma", items: ["Tu aporte se une al de otros vecinos para llegar a más jóvenes."] } },
  { min: 150, msg: { title: "Con esto aseguras", items: ["1 Set de lápices y bolígrafos", "1 Cuaderno"] } },
  { min: 300, msg: { title: "Con esto aseguras", items: ["2 Cuadernos", "1 Set de lápices", "1 Borrador y sacapuntas"] } },
  { min: 500, msg: { title: "Con esto aseguras", items: ["1 Mochila ergonómica", "3 Cuadernos"] } },
  { min: 800, msg: { title: "Con esto aseguras", items: ["1 Mochila", "4 Cuadernos", "1 Cartuchera completa"] } },
  { min: 1200, msg: { title: "Con esto aseguras", items: ["1 Mochila", "5 Cuadernos", "Juego de geometría", "Lápices de colores"] } },
  { min: 2000, msg: { title: "Apadrinas un kit completo", items: ["1 Mochila + 8 Cuadernos", "Cartuchera y geometría", "Calculadora básica", "Uniforme parcial"] } },
  { min: 3500, msg: { title: "Patrocinas a 2 jóvenes", items: ["2 Mochilas completas", "Libros y útiles del trimestre", "Acompañamiento por 1 mes"] } },
  { min: 6000, msg: { title: "Padrino de aula", items: ["Útiles para 5 jóvenes", "1 Pizarra acrílica para el centro", "Acompañamiento por 2 meses"] } },
  { min: 12000, msg: { title: "Padrino comunitario", items: ["Útiles para 10 jóvenes de Las Charcas", "Materiales didácticos extras", "Becas parciales del trimestre"] } },
];

export function tierFor(amount: number): TierMessage {
  let chosen = tiers[0].msg;
  for (const t of tiers) if (amount >= t.min) chosen = t.msg;
  return chosen;
}

export const quickAmounts = [300, 500, 1200, 2000, 6000];
