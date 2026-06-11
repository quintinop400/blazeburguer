export type QuemSomosContent = {
  hero: {
    badge: string;
    title_part1: string;
    title_highlight: string;
    subtitle: string;
    cta_primary_label: string;
    cta_secondary_label: string;
    image_url: string;
  };
  historia: { eyebrow: string; title: string; paragraphs: string[]; image_url: string };
  dna: { eyebrow: string; title: string; cards: { title: string; desc: string }[] };
  diferenciais: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: { icon: string; title: string; desc: string }[];
  };
  equipe: {
    eyebrow: string;
    title: string;
    members: { name: string; role: string; desc: string; img: string }[];
  };
  stats: { items: { value: number; label: string; suffix: string; decimals: number }[] };
  galeria: { eyebrow: string; title: string; images: string[] };
  depoimentos: {
    eyebrow: string;
    title: string;
    items: { name: string; text: string; rating: number }[];
  };
  localizacao: {
    eyebrow: string;
    title: string;
    description: string;
    address: string;
    hours: string;
    map_url: string;
  };
  social: {
    eyebrow: string;
    title: string;
    description: string;
    cta_label: string;
    image_url: string;
  };
};

export const DEFAULT_QUEM_SOMOS: QuemSomosContent = {
  hero: {
    badge: "Nossa essência",
    title_part1: "Conheça a",
    title_highlight: "BlazeBurger",
    subtitle:
      "Smash burgers feitos com técnica, ingredientes selecionados e uma obsessão saudável por aquele sabor que faz a gente fechar os olhos na primeira mordida.",
    cta_primary_label: "Ver Cardápio",
    cta_secondary_label: "Fale com a gente",
    image_url:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1920&q=80",
  },
  historia: {
    eyebrow: "Nossa história",
    title: "Do food truck pro coração da cidade",
    paragraphs: [
      "A BlazeBurger nasceu em 2017 num pequeno food truck no centro de São Paulo. Eram dois amigos, uma chapa de ferro e uma única certeza: a gente queria fazer o melhor smash burger artesanal da cidade.",
      "Hoje servimos mais de 250 mil pedidos por ano, mas o jeito de fazer continua o mesmo — pão brioche fresquinho, blend exclusivo de carne e a chapa sempre na temperatura certa pra formar aquela crosta caramelizada inesquecível.",
    ],
    image_url:
      "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=1200&q=80",
  },
  dna: {
    eyebrow: "Nosso DNA",
    title: "Missão, Visão e Valores",
    cards: [
      { title: "Missão", desc: "Entregar experiências memoráveis através de hambúrgueres artesanais que celebram sabor, qualidade e cuidado em cada detalhe." },
      { title: "Visão", desc: "Ser referência nacional em smash burgers, conhecida pela consistência, inovação e amor pelo que fazemos." },
      { title: "Valores", desc: "Qualidade sem atalhos, respeito ao cliente, paixão pela cozinha e responsabilidade com nossa comunidade." },
    ],
  },
  diferenciais: {
    eyebrow: "Por que BlazeBurger?",
    title: "Nossos diferenciais",
    subtitle: "Cada detalhe pensado pra você ter a melhor experiência possível.",
    items: [
      { icon: "Leaf", title: "Ingredientes Frescos", desc: "Pão brioche feito na casa e carne 100% bovina selecionada todo dia." },
      { icon: "Truck", title: "Entrega Rápida", desc: "Logística própria pra chegar quentinho em até 40 minutos." },
      { icon: "Sparkles", title: "Atendimento Premium", desc: "Time treinado pra cuidar de cada pedido como se fosse único." },
      { icon: "ChefHat", title: "Receitas Exclusivas", desc: "Combinações criadas pelo nosso chef pra explodir de sabor." },
      { icon: "ShieldCheck", title: "Qualidade Garantida", desc: "Padrão rigoroso de higiene e procedência em cada etapa." },
      { icon: "CreditCard", title: "Pagamento Seguro", desc: "PIX, cartões e pagamento na entrega — tudo protegido." },
    ],
  },
  equipe: {
    eyebrow: "Quem faz acontecer",
    title: "Conheça a equipe",
    members: [
      { name: "Rafael Souza", role: "Chef Executivo", desc: "10 anos forjando smash burgers em SP.", img: "https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&w=600&q=80" },
      { name: "Camila Reis", role: "Head de Operações", desc: "Garante que tudo flua do balcão à sua porta.", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80" },
      { name: "Lucas Almeida", role: "Sous Chef", desc: "Mestre na chapa, perfeccionista nas crostas.", img: "https://images.unsplash.com/photo-1607631568010-a87245c0daf8?auto=format&fit=crop&w=600&q=80" },
      { name: "Bianca Lima", role: "Atendimento", desc: "A voz simpática que te recebe todo dia.", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80" },
    ],
  },
  stats: {
    items: [
      { value: 250000, label: "Pedidos entregues", suffix: "+", decimals: 0 },
      { value: 48000, label: "Clientes satisfeitos", suffix: "+", decimals: 0 },
      { value: 4.9, label: "Avaliação média", suffix: "/5", decimals: 1 },
      { value: 8, label: "Anos de experiência", suffix: "", decimals: 0 },
    ],
  },
  galeria: {
    eyebrow: "Galeria",
    title: "Um spoiler do que te espera",
    images: [
      "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80",
    ],
  },
  depoimentos: {
    eyebrow: "Quem pediu, aprovou",
    title: "O que dizem por aí",
    items: [
      { name: "Marina O.", text: "Melhor smash burger da cidade, sem dúvida. O bacon é cinematográfico.", rating: 5 },
      { name: "Pedro H.", text: "Entrega super rápida, chegou quente e perfeito. Virei cliente fiel.", rating: 5 },
      { name: "Juliana T.", text: "O combo família salvou meu domingo. Todo mundo aprovou!", rating: 5 },
      { name: "André R.", text: "Atendimento impecável e o aplicativo é muito fácil de usar.", rating: 5 },
      { name: "Sofia M.", text: "Os molhos da casa fazem toda a diferença. Recomendo demais!", rating: 5 },
    ],
  },
  localizacao: {
    eyebrow: "Onde estamos",
    title: "Venha nos visitar",
    description: "Nossa cozinha central recebe pedidos pra entrega e retirada. Passe pra um café, conhecer a equipe ou comer um burger fresquinho na hora.",
    address: "Av. Brasil, 1500 — Centro, São Paulo / SP",
    hours: "Seg a Dom — 18h às 23h",
    map_url: "https://www.google.com/maps?q=Avenida%20Brasil%201500%20S%C3%A3o%20Paulo&output=embed",
  },
  social: {
    eyebrow: "Responsabilidade social",
    title: "Comida boa também alimenta causas",
    description:
      "Parte do nosso faturamento vai para projetos sociais que combatem a fome e qualificam jovens cozinheiros da nossa região. A gente acredita que servir bem é também devolver pro mundo o que ele nos dá.",
    cta_label: "Quero apoiar",
    image_url:
      "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80",
  },
};

// Deep-merge user content over defaults so missing/legacy fields stay safe.
export function mergeQuemSomos(input: unknown): QuemSomosContent {
  const src = (input ?? {}) as Partial<QuemSomosContent>;
  const d = DEFAULT_QUEM_SOMOS;
  return {
    hero: { ...d.hero, ...(src.hero ?? {}) },
    historia: { ...d.historia, ...(src.historia ?? {}), paragraphs: src.historia?.paragraphs ?? d.historia.paragraphs },
    dna: { ...d.dna, ...(src.dna ?? {}), cards: src.dna?.cards ?? d.dna.cards },
    diferenciais: { ...d.diferenciais, ...(src.diferenciais ?? {}), items: src.diferenciais?.items ?? d.diferenciais.items },
    equipe: { ...d.equipe, ...(src.equipe ?? {}), members: src.equipe?.members ?? d.equipe.members },
    stats: { items: src.stats?.items ?? d.stats.items },
    galeria: { ...d.galeria, ...(src.galeria ?? {}), images: src.galeria?.images ?? d.galeria.images },
    depoimentos: { ...d.depoimentos, ...(src.depoimentos ?? {}), items: src.depoimentos?.items ?? d.depoimentos.items },
    localizacao: { ...d.localizacao, ...(src.localizacao ?? {}) },
    social: { ...d.social, ...(src.social ?? {}) },
  };
}
