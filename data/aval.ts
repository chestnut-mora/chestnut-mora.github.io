export const avalStates = [
  { id: 'sealed', number: '01', label: '收到包裹', note: 'SEALED' },
  { id: 'peel', number: '02', label: '輕輕揭開封口', note: 'PEEL' },
  { id: 'open', number: '03', label: '打開盒子', note: 'OPEN' },
  { id: 'card-reveal', number: '04', label: '看見一張小小心意', note: 'CARD REVEAL' },
  { id: 'pouch-reveal', number: '05', label: '玻璃罐造型霧面袋升起', note: 'POUCH REVEAL' },
  { id: 'bracelet-reveal', number: '06', label: '萌栗慢慢現身', note: 'BRACELET REVEAL' },
  { id: 'final', number: '07', label: '遇見你的萌栗', note: 'FINAL HERO · AVAL IDLE' },
] as const;

export type AvalStateId = (typeof avalStates)[number]['id'];
