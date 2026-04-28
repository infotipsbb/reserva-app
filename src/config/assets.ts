export const assets = {
  hero: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1600&q=80",
  canchaFutbol: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800&q=80",
  gimnasio: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
};

// Imágenes para las tarjetas de canchas (fallback si no hay image_url en BD)
export const courtImages: Record<string, string> = {
  "Cancha de Fútbol": "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=600&q=80",
  "Cancha de Tenis 1": "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80",
  "Cancha de Tenis 2": "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80",
  "Gimnasio Polideportivo": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80",
};

// Descripciones fallback por nombre de cancha
export const courtDescriptions: Record<string, string> = {
  "Cancha de Fútbol": "Cancha reglamentaria de fútbol con pasto natural.",
  "Cancha de Tenis 1": "Cancha de tenis con superficie de polvo de ladrillo.",
  "Cancha de Tenis 2": "Cancha de tenis con superficie de polvo de ladrillo.",
  "Gimnasio Polideportivo": "Espacio multiuso ideal para baby fútbol, básquetbol o voleibol.",
};

// Precios iniciales (solo para seed/reference, la app usa la BD)
export const prices = [
  { court: "Cancha de Fútbol", priceNonMember: 35000, priceMember: 25000, image: courtImages["Cancha de Fútbol"], description: courtDescriptions["Cancha de Fútbol"] },
  { court: "Cancha de Tenis 1", priceNonMember: 15000, priceMember: 10000, image: courtImages["Cancha de Tenis 1"], description: courtDescriptions["Cancha de Tenis 1"] },
  { court: "Cancha de Tenis 2", priceNonMember: 15000, priceMember: 10000, image: courtImages["Cancha de Tenis 2"], description: courtDescriptions["Cancha de Tenis 2"] },
  { court: "Gimnasio Polideportivo", priceNonMember: 25000, priceMember: 18000, image: courtImages["Gimnasio Polideportivo"], description: courtDescriptions["Gimnasio Polideportivo"] },
];
