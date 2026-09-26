import {
  Activity, AirVent, Anchor, Apple, Baby, Backpack, BadgeEuro, Banknote, Bath, Bed, Beef, Beer, Bell, Bike, Bone,
  BookOpen, Box, Brain, Briefcase, Brush, Building2, Bus, Cake, Calculator, CalendarDays, Camera,
  Car, CarFront, CarTaxiFront, Carrot, Cat, Church, CircleDollarSign, CircleParking, Clapperboard, Clock, Cloud,
  Code, Coffee, Coins, Compass, Construction, Cookie, Cpu, CreditCard, Croissant, CupSoda, Dog, Drama, Drill,
  Droplet, Droplets, Dumbbell, Egg, Euro, Eye, Fan, FileText, Film, Fish, Flame, Flower2, Footprints, Fuel,
  Gamepad2, Gavel, Gem, Gift, Glasses, Globe, GraduationCap, HandCoins, Handshake, HardDrive, Headphones, Heart,
  HeartPulse, Heater, Home, Hospital, Hotel, Hourglass, IceCream, Key, Lamp, Landmark, Laptop, Leaf, Library,
  Lightbulb, Luggage, Mail, MapPin, Medal, Microwave, Milk, Monitor, Motorbike, Mountain, Music, Newspaper, Package,
  Palette, PartyPopper, PawPrint, Pencil, Percent, PiggyBank, Pill, Pizza, Plane, PlugZap, Podcast, Printer, Radio,
  Receipt, Recycle, Refrigerator, Repeat, Route, Ruler, Sandwich, Scale, School, Scissors, Shield, ShieldCheck,
  Shirt, ShoppingBag, ShoppingBasket, ShoppingCart, ShowerHead, Smartphone, Smile, Sofa, Sparkles, SprayCan, Sprout,
  Stamp, Stethoscope, Store, Sun, Syringe, Tag, Tent, Thermometer, Ticket, TrainFront, TramFront, Trash2, TreePalm,
  TrendingUp, Trophy, Truck, Tv, Umbrella, User, Users, Utensils, Volleyball, Wallet, WashingMachine, Watch, Wifi,
  Wine, Wrench, Zap,
  type LucideIcon,
} from 'lucide-react';

export interface CategoryIcon {
  /** Nombre que se guarda en la BBDD */
  id: string;
  icon: LucideIcon;
  label: string;
  /** Palabras (sin tildes, en minúscula) para el buscador y la asignación automática */
  keywords: string[];
}

export interface CategoryIconGroup {
  grupo: string;
  iconos: CategoryIcon[];
}

const i = (id: string, icon: LucideIcon, label: string, keywords: string) => ({ id, icon, label, keywords: keywords.split(' ') });

export const CATEGORY_ICON_GROUPS: CategoryIconGroup[] = [
  { grupo: 'Vivienda', iconos: [
    i('Home', Home, 'Casa', 'casa hogar vivienda alquiler hipoteca piso'),
    i('Building2', Building2, 'Edificio', 'edificio comunidad vecinos finca'),
    i('Key', Key, 'Llave', 'llave alquiler fianza inmobiliaria'),
    i('Sofa', Sofa, 'Muebles', 'muebles sofa decoracion mobiliario'),
    i('Lamp', Lamp, 'Lámpara', 'lampara iluminacion decoracion'),
    i('Bed', Bed, 'Dormitorio', 'cama dormitorio colchon textil'),
    i('Wrench', Wrench, 'Reparaciones', 'reparacion arreglo averia mantenimiento fontanero'),
    i('Drill', Drill, 'Bricolaje', 'bricolaje herramientas ferreteria'),
    i('Construction', Construction, 'Obras', 'obras reforma construccion'),
    i('SprayCan', SprayCan, 'Limpieza', 'limpieza hogar productos droguería drogueria'),
    i('WashingMachine', WashingMachine, 'Electrodomésticos', 'electrodomesticos lavadora'),
    i('Refrigerator', Refrigerator, 'Nevera', 'nevera frigorifico electrodomestico'),
    i('Microwave', Microwave, 'Cocina', 'microondas cocina menaje'),
  ]},
  { grupo: 'Suministros', iconos: [
    i('Zap', Zap, 'Luz', 'luz electricidad energia endesa iberdrola naturgy'),
    i('PlugZap', PlugZap, 'Electricidad', 'enchufe electricidad cargador'),
    i('Lightbulb', Lightbulb, 'Bombilla', 'bombilla luz consumo'),
    i('Droplet', Droplet, 'Agua', 'agua canal suministro'),
    i('Droplets', Droplets, 'Agua (consumo)', 'agua riego consumo'),
    i('Flame', Flame, 'Gas', 'gas butano calefaccion'),
    i('Heater', Heater, 'Calefacción', 'calefaccion radiador'),
    i('Thermometer', Thermometer, 'Climatización', 'climatizacion temperatura'),
    i('AirVent', AirVent, 'Aire acondicionado', 'aire acondicionado'),
    i('Fan', Fan, 'Ventilación', 'ventilador ventilacion'),
    i('Wifi', Wifi, 'Internet', 'internet wifi fibra router'),
    i('Smartphone', Smartphone, 'Móvil', 'movil telefono linea tarifa'),
    i('Tv', Tv, 'Televisión', 'television tv plataformas'),
    i('Recycle', Recycle, 'Basuras', 'basura tasa residuos reciclaje'),
    i('Trash2', Trash2, 'Residuos', 'residuos basuras'),
  ]},
  { grupo: 'Alimentación', iconos: [
    i('ShoppingCart', ShoppingCart, 'Supermercado', 'supermercado compra mercadona carrefour lidl comida'),
    i('ShoppingBasket', ShoppingBasket, 'Cesta', 'cesta compra mercado'),
    i('Apple', Apple, 'Fruta', 'fruta fruteria alimentacion'),
    i('Carrot', Carrot, 'Verdura', 'verdura verduleria'),
    i('Beef', Beef, 'Carnicería', 'carne carniceria'),
    i('Fish', Fish, 'Pescadería', 'pescado pescaderia'),
    i('Egg', Egg, 'Huevos', 'huevos desayuno'),
    i('Milk', Milk, 'Lácteos', 'leche lacteos'),
    i('Croissant', Croissant, 'Panadería', 'pan panaderia bolleria'),
  ]},
  { grupo: 'Restaurantes y ocio', iconos: [
    i('Utensils', Utensils, 'Restaurante', 'restaurante comer fuera cena comida'),
    i('Pizza', Pizza, 'Comida rápida', 'pizza comida rapida delivery glovo'),
    i('Sandwich', Sandwich, 'Almuerzo', 'almuerzo bocadillo menu'),
    i('Coffee', Coffee, 'Cafetería', 'cafe cafeteria desayuno'),
    i('CupSoda', CupSoda, 'Refrescos', 'refresco bebida'),
    i('Wine', Wine, 'Vino', 'vino bodega'),
    i('Beer', Beer, 'Bares', 'bar cerveza copas'),
    i('IceCream', IceCream, 'Heladería', 'helado heladeria'),
    i('Cookie', Cookie, 'Caprichos', 'dulces caprichos snacks'),
    i('Film', Film, 'Cine', 'cine peliculas'),
    i('Clapperboard', Clapperboard, 'Streaming', 'streaming netflix hbo series'),
    i('Music', Music, 'Música', 'musica spotify conciertos'),
    i('Headphones', Headphones, 'Audio', 'audio podcast auriculares'),
    i('Gamepad2', Gamepad2, 'Videojuegos', 'videojuegos juegos consola playstation'),
    i('Ticket', Ticket, 'Ocio', 'ocio entradas eventos espectaculos'),
    i('Drama', Drama, 'Teatro', 'teatro cultura'),
    i('PartyPopper', PartyPopper, 'Fiestas', 'fiesta celebracion'),
    i('Palette', Palette, 'Aficiones', 'aficiones arte hobbies'),
    i('Camera', Camera, 'Fotografía', 'fotografia camara'),
  ]},
  { grupo: 'Transporte', iconos: [
    i('Car', Car, 'Coche', 'coche vehiculo automovil'),
    i('CarFront', CarFront, 'Mantenimiento coche', 'taller itv mantenimiento revision'),
    i('Fuel', Fuel, 'Gasolina', 'gasolina combustible diesel repostar'),
    i('CircleParking', CircleParking, 'Parking', 'parking aparcamiento garaje'),
    i('Route', Route, 'Peajes', 'peaje autopista'),
    i('Bus', Bus, 'Autobús', 'autobus bus transporte publico'),
    i('TrainFront', TrainFront, 'Tren', 'tren renfe cercanias metro'),
    i('TramFront', TramFront, 'Tranvía', 'tranvia metro abono'),
    i('CarTaxiFront', CarTaxiFront, 'Taxi', 'taxi uber cabify vtc'),
    i('Motorbike', Motorbike, 'Moto', 'moto motocicleta'),
    i('Bike', Bike, 'Bicicleta', 'bicicleta bici patinete'),
    i('Plane', Plane, 'Vuelos', 'avion vuelos aeropuerto'),
    i('Anchor', Anchor, 'Barco', 'barco ferry'),
  ]},
  { grupo: 'Salud', iconos: [
    i('HeartPulse', HeartPulse, 'Salud', 'salud medico'),
    i('Stethoscope', Stethoscope, 'Médico', 'medico consulta doctor'),
    i('Pill', Pill, 'Farmacia', 'farmacia medicamentos'),
    i('Syringe', Syringe, 'Vacunas', 'vacunas analisis'),
    i('Hospital', Hospital, 'Hospital', 'hospital urgencias clinica'),
    i('Smile', Smile, 'Dentista', 'dentista dental'),
    i('Eye', Eye, 'Óptica', 'optica gafas oculista'),
    i('Brain', Brain, 'Psicología', 'psicologo terapia'),
    i('Activity', Activity, 'Fisioterapia', 'fisio fisioterapia rehabilitacion'),
  ]},
  { grupo: 'Deporte y cuidado personal', iconos: [
    i('Dumbbell', Dumbbell, 'Gimnasio', 'gimnasio gym deporte'),
    i('Volleyball', Volleyball, 'Deportes', 'deporte padel futbol club'),
    i('Footprints', Footprints, 'Running', 'correr running'),
    i('Trophy', Trophy, 'Competiciones', 'competicion torneo'),
    i('Medal', Medal, 'Carreras', 'carrera medalla inscripcion'),
    i('Scissors', Scissors, 'Peluquería', 'peluqueria barberia'),
    i('Sparkles', Sparkles, 'Belleza', 'belleza estetica cosmetica'),
    i('Brush', Brush, 'Higiene', 'higiene cuidado personal'),
    i('ShowerHead', ShowerHead, 'Aseo', 'aseo ducha'),
    i('Bath', Bath, 'Spa', 'spa balneario'),
  ]},
  { grupo: 'Compras', iconos: [
    i('ShoppingBag', ShoppingBag, 'Compras', 'compras tiendas'),
    i('Store', Store, 'Tienda', 'tienda comercio'),
    i('Package', Package, 'Pedidos online', 'amazon pedidos online paqueteria'),
    i('Shirt', Shirt, 'Ropa', 'ropa moda vestir'),
    i('Footprints', Footprints, 'Calzado', 'zapatos calzado'),
    i('Watch', Watch, 'Complementos', 'reloj complementos accesorios'),
    i('Glasses', Glasses, 'Gafas', 'gafas'),
    i('Gem', Gem, 'Joyería', 'joyeria joyas'),
    i('Gift', Gift, 'Regalos', 'regalos cumpleanos navidad'),
    i('Cake', Cake, 'Cumpleaños', 'cumpleanos tarta'),
    i('Flower2', Flower2, 'Floristería', 'flores floristeria'),
  ]},
  { grupo: 'Familia y mascotas', iconos: [
    i('Baby', Baby, 'Bebé', 'bebe panales guarderia hijos'),
    i('Users', Users, 'Familia', 'familia hijos'),
    i('User', User, 'Personal', 'personal propio'),
    i('Backpack', Backpack, 'Colegio', 'colegio material escolar mochila'),
    i('Dog', Dog, 'Perro', 'perro mascota'),
    i('Cat', Cat, 'Gato', 'gato mascota'),
    i('PawPrint', PawPrint, 'Mascotas', 'mascotas veterinario pienso'),
    i('Bone', Bone, 'Veterinario', 'veterinario'),
  ]},
  { grupo: 'Educación y trabajo', iconos: [
    i('GraduationCap', GraduationCap, 'Educación', 'educacion estudios universidad master matricula'),
    i('School', School, 'Academia', 'academia clases colegio'),
    i('BookOpen', BookOpen, 'Libros', 'libros lectura'),
    i('Library', Library, 'Formación', 'formacion cursos biblioteca'),
    i('Pencil', Pencil, 'Papelería', 'papeleria material'),
    i('Ruler', Ruler, 'Material', 'material escolar'),
    i('Briefcase', Briefcase, 'Trabajo', 'trabajo oficina negocio'),
    i('Laptop', Laptop, 'Ordenador', 'ordenador portatil'),
    i('Monitor', Monitor, 'Tecnología', 'tecnologia electronica'),
    i('Cpu', Cpu, 'Informática', 'informatica hardware'),
    i('HardDrive', HardDrive, 'Almacenamiento', 'almacenamiento disco'),
    i('Cloud', Cloud, 'Servicios en la nube', 'nube icloud google drive dropbox'),
    i('Code', Code, 'Software', 'software aplicaciones licencias'),
    i('Printer', Printer, 'Impresión', 'impresora tinta'),
  ]},
  { grupo: 'Viajes', iconos: [
    i('Luggage', Luggage, 'Viajes', 'viajes vacaciones maleta'),
    i('Hotel', Hotel, 'Hotel', 'hotel alojamiento airbnb'),
    i('Tent', Tent, 'Camping', 'camping acampada'),
    i('Mountain', Mountain, 'Montaña', 'montana escapada'),
    i('TreePalm', TreePalm, 'Playa', 'playa verano'),
    i('Globe', Globe, 'Internacional', 'extranjero internacional'),
    i('Compass', Compass, 'Excursiones', 'excursiones actividades'),
    i('MapPin', MapPin, 'Destino', 'destino lugar'),
    i('Umbrella', Umbrella, 'Seguro de viaje', 'seguro viaje'),
  ]},
  { grupo: 'Finanzas', iconos: [
    i('Landmark', Landmark, 'Banco', 'banco comisiones entidad'),
    i('CreditCard', CreditCard, 'Tarjeta', 'tarjeta credito debito'),
    i('Wallet', Wallet, 'Cartera', 'cartera efectivo'),
    i('Banknote', Banknote, 'Efectivo', 'efectivo billetes cajero'),
    i('Coins', Coins, 'Monedas', 'monedas cambio'),
    i('PiggyBank', PiggyBank, 'Ahorro', 'ahorro hucha'),
    i('TrendingUp', TrendingUp, 'Inversiones', 'inversion bolsa fondos acciones'),
    i('HandCoins', HandCoins, 'Préstamo', 'prestamo credito deuda cuota'),
    i('Percent', Percent, 'Intereses', 'intereses comision'),
    i('Receipt', Receipt, 'Recibos', 'recibos facturas'),
    i('FileText', FileText, 'Documentos', 'documentos tramites gestoria'),
    i('Calculator', Calculator, 'Impuestos', 'impuestos hacienda irpf ibi tributos'),
    i('Stamp', Stamp, 'Tasas', 'tasas administracion'),
    i('Scale', Scale, 'Abogado', 'abogado legal'),
    i('Gavel', Gavel, 'Multas', 'multas sanciones'),
    i('Shield', Shield, 'Seguros', 'seguro poliza'),
    i('ShieldCheck', ShieldCheck, 'Seguro de salud', 'seguro salud sanitas adeslas'),
    i('Handshake', Handshake, 'Donaciones', 'donaciones ong'),
    i('Church', Church, 'Donativos', 'donativo iglesia'),
    i('CircleDollarSign', CircleDollarSign, 'Ingresos', 'ingresos nomina sueldo'),
    i('Euro', Euro, 'Euro', 'euro dinero'),
    i('BadgeEuro', BadgeEuro, 'Pagos', 'pagos bizum transferencia'),
  ]},
  { grupo: 'Otros', iconos: [
    i('Repeat', Repeat, 'Recurrentes', 'recurrentes suscripciones cuotas'),
    i('CalendarDays', CalendarDays, 'Eventos', 'eventos agenda'),
    i('Clock', Clock, 'Pendiente', 'pendiente'),
    i('Hourglass', Hourglass, 'Temporal', 'temporal'),
    i('Bell', Bell, 'Avisos', 'avisos alertas'),
    i('Mail', Mail, 'Correos', 'correos envios'),
    i('Newspaper', Newspaper, 'Prensa', 'prensa periodico revista'),
    i('Radio', Radio, 'Radio', 'radio'),
    i('Podcast', Podcast, 'Podcasts', 'podcast'),
    i('Truck', Truck, 'Mudanza', 'mudanza transporte'),
    i('Box', Box, 'Almacén', 'trastero almacen'),
    i('Leaf', Leaf, 'Jardín', 'jardin plantas'),
    i('Sprout', Sprout, 'Huerto', 'huerto'),
    i('Sun', Sun, 'Verano', 'verano'),
    i('Heart', Heart, 'Pareja', 'pareja amor'),
    i('Tag', Tag, 'General', 'general otros varios'),
  ]},
];

const deduped = new Map<string, CategoryIcon>();
for (const g of CATEGORY_ICON_GROUPS) for (const ic of g.iconos) if (!deduped.has(ic.id)) deduped.set(ic.id, ic);
export const CATEGORY_ICONS = deduped;
export const DEFAULT_CATEGORY_ICON = 'Tag';
export const BANK_ICON = Landmark;

const normaliza = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

export function getCategoryIcon(id: string | null | undefined): LucideIcon {
  return (id && CATEGORY_ICONS.get(id)?.icon) || Tag;
}

/** Icono sugerido para una categoría a partir de su nombre */
export function sugerirIcono(nombre: string): string {
  const palabras = normaliza(nombre).split(/[^a-z0-9ñ]+/).filter(p => p.length > 2);
  let mejor: { id: string; score: number } | null = null;
  for (const ic of CATEGORY_ICONS.values()) {
    let score = 0;
    for (const p of palabras) {
      if (ic.keywords.includes(p)) score += 3;
      else if (ic.keywords.some(k => k.startsWith(p) || p.startsWith(k))) score += 1;
    }
    if (normaliza(ic.label) === normaliza(nombre)) score += 5;
    if (score > 0 && (!mejor || score > mejor.score)) mejor = { id: ic.id, score };
  }
  return mejor?.id ?? DEFAULT_CATEGORY_ICON;
}

/** Grupos filtrados por texto de búsqueda */
export function buscarIconos(q: string): CategoryIconGroup[] {
  const t = normaliza(q);
  if (!t) return CATEGORY_ICON_GROUPS;
  return CATEGORY_ICON_GROUPS
    .map(g => ({ grupo: g.grupo, iconos: g.iconos.filter(ic => normaliza(ic.label).includes(t) || ic.keywords.some(k => k.includes(t))) }))
    .filter(g => g.iconos.length);
}
