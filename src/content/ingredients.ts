// Il catalogo degli ingredienti. Prezzi e pesi sono medie indicative (supermercato, 2025)
// usate solo per stimare quanto cibo e quanti euro l'utente evita di buttare.
import type { Aisle, Allergen, Diet, Ingredient, Storage } from '@/domain/types'

type Extra = Partial<Pick<Ingredient, 'aliases' | 'staple' | 'notFor' | 'allergens'>>

const MEAT: Diet[] = ['vegetariano', 'vegano']
const ANIMAL: Diet[] = ['vegano']
const DAIRY: Diet[] = ['vegano', 'senza-lattosio']
const GLUTEN: Diet[] = ['senza-glutine']

function i(
  id: string, name: string, emoji: string, aisle: Aisle, storage: Storage,
  shelfDays: number, avgPrice: number, avgGrams: number, extra: Extra = {},
): Ingredient {
  return { id, name, emoji, aisle, storage, shelfDays, avgPrice, avgGrams, ...extra }
}
const al = (...a: Allergen[]) => a

export const INGREDIENTS: Ingredient[] = [
  // ——— Frutta e verdura ———
  i('pomodori', 'Pomodori', '🍅', 'frutta-verdura', 'frigo', 7, 2.2, 500, { aliases: ['pomodoro', 'pomodorini', 'ciliegini', 'datterini'] }),
  i('zucchine', 'Zucchine', '🥒', 'frutta-verdura', 'frigo', 6, 2.0, 500, { aliases: ['zucchina'] }),
  i('melanzane', 'Melanzane', '🍆', 'frutta-verdura', 'frigo', 6, 2.2, 500, { aliases: ['melanzana'] }),
  i('peperoni', 'Peperoni', '🫑', 'frutta-verdura', 'frigo', 7, 2.8, 500, { aliases: ['peperone'] }),
  i('carote', 'Carote', '🥕', 'frutta-verdura', 'frigo', 20, 1.2, 500, { aliases: ['carota'] }),
  i('cipolla', 'Cipolla', '🧅', 'frutta-verdura', 'dispensa', 30, 1.0, 500, { aliases: ['cipolle', 'cipolla rossa', 'cipolla bianca'] }),
  i('aglio', 'Aglio', '🧄', 'frutta-verdura', 'dispensa', 40, 0.8, 50, { aliases: ['spicchio d\'aglio'] }),
  i('patate', 'Patate', '🥔', 'frutta-verdura', 'dispensa', 30, 1.5, 1000, { aliases: ['patata'] }),
  i('sedano', 'Sedano', '🥬', 'frutta-verdura', 'frigo', 12, 1.2, 400, { allergens: al('sedano') }),
  i('spinaci', 'Spinaci', '🥬', 'frutta-verdura', 'frigo', 4, 2.5, 300, { aliases: ['spinacio', 'spinacini'] }),
  i('insalata', 'Insalata', '🥗', 'frutta-verdura', 'frigo', 5, 1.6, 250, { aliases: ['lattuga', 'rucola', 'misticanza', 'iceberg'] }),
  i('broccoli', 'Broccoli', '🥦', 'frutta-verdura', 'frigo', 6, 2.0, 500, { aliases: ['broccolo', 'cime di rapa'] }),
  i('cavolfiore', 'Cavolfiore', '🥦', 'frutta-verdura', 'frigo', 8, 2.0, 800),
  i('cavolo', 'Cavolo verza', '🥬', 'frutta-verdura', 'frigo', 10, 1.8, 800, { aliases: ['verza', 'cavolo nero', 'cavolo cappuccio'] }),
  i('funghi', 'Funghi', '🍄', 'frutta-verdura', 'frigo', 4, 3.0, 300, { aliases: ['champignon', 'porcini', 'fungo'] }),
  i('zucca', 'Zucca', '🎃', 'frutta-verdura', 'dispensa', 30, 2.0, 1000),
  i('piselli', 'Piselli', '🫛', 'surgelati', 'freezer', 180, 1.8, 450, { aliases: ['pisellini'] }),
  i('fagiolini', 'Fagiolini', '🫛', 'frutta-verdura', 'frigo', 5, 2.5, 400),
  i('asparagi', 'Asparagi', '🌱', 'frutta-verdura', 'frigo', 4, 4.0, 500),
  i('carciofi', 'Carciofi', '🌿', 'frutta-verdura', 'frigo', 6, 3.5, 600, { aliases: ['carciofo'] }),
  i('porri', 'Porri', '🥬', 'frutta-verdura', 'frigo', 12, 2.0, 400, { aliases: ['porro'] }),
  i('cetrioli', 'Cetrioli', '🥒', 'frutta-verdura', 'frigo', 7, 1.5, 400, { aliases: ['cetriolo'] }),
  i('finocchi', 'Finocchi', '🌿', 'frutta-verdura', 'frigo', 10, 1.8, 600, { aliases: ['finocchio'] }),
  i('radicchio', 'Radicchio', '🥬', 'frutta-verdura', 'frigo', 7, 2.2, 300),
  i('mais', 'Mais', '🌽', 'dispensa', 'dispensa', 365, 1.2, 300, { aliases: ['mais in scatola'] }),
  i('limone', 'Limone', '🍋', 'frutta-verdura', 'frigo', 21, 0.5, 150, { aliases: ['limoni', 'scorza di limone'] }),
  i('arance', 'Arance', '🍊', 'frutta-verdura', 'frigo', 14, 2.0, 1000, { aliases: ['arancia'] }),
  i('mele', 'Mele', '🍎', 'frutta-verdura', 'frigo', 21, 2.2, 1000, { aliases: ['mela'] }),
  i('pere', 'Pere', '🍐', 'frutta-verdura', 'frigo', 10, 2.5, 1000, { aliases: ['pera'] }),
  i('banane', 'Banane', '🍌', 'frutta-verdura', 'dispensa', 5, 1.8, 1000, { aliases: ['banana'] }),
  i('fragole', 'Fragole', '🍓', 'frutta-verdura', 'frigo', 3, 3.5, 500, { aliases: ['fragola'] }),
  i('frutti-bosco', 'Frutti di bosco', '🫐', 'surgelati', 'freezer', 180, 3.5, 300, { aliases: ['mirtilli', 'lamponi', 'more'] }),
  i('avocado', 'Avocado', '🥑', 'frutta-verdura', 'dispensa', 4, 1.5, 200),
  i('basilico', 'Basilico', '🌿', 'frutta-verdura', 'frigo', 5, 1.2, 30),
  i('prezzemolo', 'Prezzemolo', '🌿', 'frutta-verdura', 'frigo', 7, 0.8, 30),
  i('rosmarino', 'Rosmarino', '🌿', 'spezie', 'dispensa', 120, 1.0, 20, { staple: true }),
  i('salvia', 'Salvia', '🌿', 'frutta-verdura', 'frigo', 10, 1.0, 20),
  i('menta', 'Menta', '🌿', 'frutta-verdura', 'frigo', 7, 1.0, 20),
  i('zenzero', 'Zenzero', '🫚', 'frutta-verdura', 'frigo', 30, 1.0, 100),
  i('peperoncino', 'Peperoncino', '🌶️', 'spezie', 'dispensa', 365, 1.0, 20, { staple: true }),

  // ——— Carne e pesce ———
  i('petto-pollo', 'Petto di pollo', '🍗', 'carne-pesce', 'frigo', 2, 5.5, 400, { aliases: ['pollo', 'fesa di tacchino', 'tacchino'], notFor: MEAT }),
  i('cosce-pollo', 'Cosce di pollo', '🍗', 'carne-pesce', 'frigo', 2, 4.5, 800, { aliases: ['sovracosce', 'pollo intero'], notFor: MEAT }),
  i('macinato', 'Carne macinata', '🥩', 'carne-pesce', 'frigo', 1, 5.0, 400, { aliases: ['macinato di manzo', 'trita'], notFor: MEAT }),
  i('salsiccia', 'Salsiccia', '🌭', 'carne-pesce', 'frigo', 3, 4.0, 400, { aliases: ['salsicce'], notFor: MEAT }),
  i('manzo', 'Manzo a fette', '🥩', 'carne-pesce', 'frigo', 2, 9.0, 400, { aliases: ['fettine', 'bistecca', 'spezzatino'], notFor: MEAT }),
  i('maiale', 'Lonza di maiale', '🥩', 'carne-pesce', 'frigo', 3, 6.0, 500, { aliases: ['braciole', 'costine'], notFor: MEAT }),
  i('salmone', 'Salmone', '🐟', 'carne-pesce', 'frigo', 2, 8.0, 300, { aliases: ['filetto di salmone', 'salmone affumicato'], notFor: MEAT, allergens: al('pesce') }),
  i('merluzzo', 'Merluzzo', '🐟', 'carne-pesce', 'frigo', 2, 7.0, 400, { aliases: ['nasello', 'filetti di merluzzo', 'platessa'], notFor: MEAT, allergens: al('pesce') }),
  i('tonno', 'Tonno in scatola', '🐟', 'dispensa', 'dispensa', 730, 3.0, 240, { aliases: ['tonno'], notFor: MEAT, allergens: al('pesce') }),
  i('gamberi', 'Gamberi', '🦐', 'surgelati', 'freezer', 180, 7.0, 300, { aliases: ['gamberetti', 'mazzancolle'], notFor: MEAT, allergens: al('crostacei') }),
  i('cozze', 'Cozze', '🦪', 'carne-pesce', 'frigo', 2, 4.0, 1000, { aliases: ['vongole', 'frutti di mare'], notFor: MEAT }),
  i('acciughe', 'Acciughe', '🐟', 'dispensa', 'frigo', 60, 2.5, 50, { aliases: ['alici'], notFor: MEAT, allergens: al('pesce') }),

  // ——— Uova e salumi ———
  i('uova', 'Uova', '🥚', 'uova-salumi', 'frigo', 21, 2.5, 360, { aliases: ['uovo'], notFor: ANIMAL, allergens: al('uova') }),
  i('pancetta', 'Pancetta', '🥓', 'uova-salumi', 'frigo', 10, 2.8, 150, { aliases: ['guanciale', 'pancetta a cubetti', 'speck'], notFor: MEAT }),
  i('prosciutto-cotto', 'Prosciutto cotto', '🍖', 'uova-salumi', 'frigo', 5, 2.8, 150, { aliases: ['cotto'], notFor: MEAT }),
  i('prosciutto-crudo', 'Prosciutto crudo', '🍖', 'uova-salumi', 'frigo', 7, 3.5, 100, { aliases: ['crudo'], notFor: MEAT }),
  i('salame', 'Salame', '🍕', 'uova-salumi', 'frigo', 20, 3.0, 150, { notFor: MEAT }),
  i('wurstel', 'Würstel', '🌭', 'uova-salumi', 'frigo', 14, 2.0, 250, { aliases: ['wurstel'], notFor: MEAT }),

  // ——— Latticini ———
  i('latte', 'Latte', '🥛', 'latticini', 'frigo', 5, 1.4, 1000, { notFor: DAIRY, allergens: al('lattosio') }),
  i('burro', 'Burro', '🧈', 'latticini', 'frigo', 45, 2.5, 250, { notFor: DAIRY, allergens: al('lattosio') }),
  i('panna', 'Panna da cucina', '🥛', 'latticini', 'frigo', 7, 1.5, 200, { aliases: ['panna', 'panna fresca'], notFor: DAIRY, allergens: al('lattosio') }),
  i('yogurt', 'Yogurt', '🥣', 'latticini', 'frigo', 10, 2.0, 500, { aliases: ['yogurt greco'], notFor: DAIRY, allergens: al('lattosio') }),
  i('mozzarella', 'Mozzarella', '🧀', 'latticini', 'frigo', 4, 2.0, 250, { aliases: ['fior di latte', 'bufala'], notFor: DAIRY, allergens: al('lattosio') }),
  i('parmigiano', 'Parmigiano', '🧀', 'latticini', 'frigo', 45, 4.5, 200, { aliases: ['grana', 'grana padano', 'parmigiano reggiano'], notFor: ANIMAL, allergens: al('lattosio') }),
  i('pecorino', 'Pecorino', '🧀', 'latticini', 'frigo', 45, 4.0, 200, { notFor: DAIRY, allergens: al('lattosio') }),
  i('ricotta', 'Ricotta', '🧀', 'latticini', 'frigo', 5, 2.0, 250, { notFor: DAIRY, allergens: al('lattosio') }),
  i('mascarpone', 'Mascarpone', '🧀', 'latticini', 'frigo', 7, 2.5, 250, { notFor: DAIRY, allergens: al('lattosio') }),
  i('stracchino', 'Stracchino', '🧀', 'latticini', 'frigo', 7, 2.2, 200, { aliases: ['crescenza', 'formaggio spalmabile', 'philadelphia'], notFor: DAIRY, allergens: al('lattosio') }),
  i('gorgonzola', 'Gorgonzola', '🧀', 'latticini', 'frigo', 10, 3.0, 200, { notFor: DAIRY, allergens: al('lattosio') }),
  i('scamorza', 'Scamorza', '🧀', 'latticini', 'frigo', 15, 2.5, 250, { aliases: ['provola', 'fontina', 'emmental', 'formaggio a fette', 'sottilette'], notFor: DAIRY, allergens: al('lattosio') }),
  i('feta', 'Feta', '🧀', 'latticini', 'frigo', 10, 2.5, 200, { notFor: DAIRY, allergens: al('lattosio') }),

  // ——— Pane e pasta ———
  i('pasta', 'Pasta', '🍝', 'pane-pasta', 'dispensa', 365, 1.2, 500, { aliases: ['spaghetti', 'penne', 'fusilli', 'rigatoni', 'linguine', 'farfalle', 'mezze maniche'], notFor: GLUTEN, allergens: al('glutine') }),
  i('pasta-fresca', 'Pasta fresca all\'uovo', '🍝', 'pane-pasta', 'frigo', 10, 2.5, 250, { aliases: ['tagliatelle', 'pappardelle', 'tortellini', 'ravioli', 'gnocchi'], notFor: [...GLUTEN, 'vegano'], allergens: al('glutine', 'uova') }),
  i('riso', 'Riso', '🍚', 'pane-pasta', 'dispensa', 365, 1.8, 1000, { aliases: ['riso carnaroli', 'riso arborio', 'riso basmati'] }),
  i('pane', 'Pane', '🍞', 'pane-pasta', 'dispensa', 3, 2.5, 500, { aliases: ['pane raffermo', 'baguette', 'pane in cassetta', 'pancarrè'], notFor: GLUTEN, allergens: al('glutine') }),
  i('pangrattato', 'Pangrattato', '🍞', 'pane-pasta', 'dispensa', 180, 1.0, 250, { notFor: GLUTEN, allergens: al('glutine'), staple: true }),
  i('farina', 'Farina', '🌾', 'dispensa', 'dispensa', 300, 0.8, 1000, { aliases: ['farina 00'], notFor: GLUTEN, allergens: al('glutine'), staple: true }),
  i('piadina', 'Piadine', '🫓', 'pane-pasta', 'dispensa', 20, 1.8, 400, { aliases: ['piadina', 'tortillas', 'wrap'], notFor: GLUTEN, allergens: al('glutine') }),
  i('pasta-sfoglia', 'Pasta sfoglia', '🥐', 'pane-pasta', 'frigo', 14, 1.5, 230, { aliases: ['pasta brisée', 'brisè'], notFor: [...GLUTEN, 'vegano'], allergens: al('glutine', 'lattosio') }),
  i('couscous', 'Couscous', '🍚', 'pane-pasta', 'dispensa', 365, 1.8, 500, { notFor: GLUTEN, allergens: al('glutine') }),
  i('polenta', 'Farina per polenta', '🌽', 'pane-pasta', 'dispensa', 365, 1.5, 500, { aliases: ['polenta istantanea'] }),
  i('biscotti', 'Biscotti secchi', '🍪', 'dispensa', 'dispensa', 180, 2.0, 400, { aliases: ['savoiardi', 'biscotti'], notFor: [...GLUTEN, 'vegano'], allergens: al('glutine', 'uova') }),
  i('avena', 'Fiocchi d\'avena', '🥣', 'dispensa', 'dispensa', 300, 1.8, 500, { aliases: ['avena', 'muesli'] }),

  // ——— Dispensa ———
  i('passata', 'Passata di pomodoro', '🥫', 'dispensa', 'dispensa', 730, 1.0, 700, { aliases: ['polpa di pomodoro', 'pelati', 'sugo pronto'] }),
  i('concentrato', 'Concentrato di pomodoro', '🥫', 'dispensa', 'dispensa', 365, 0.8, 130, { staple: true }),
  i('ceci', 'Ceci', '🫘', 'dispensa', 'dispensa', 730, 1.0, 400, { aliases: ['ceci in scatola'] }),
  i('fagioli', 'Fagioli', '🫘', 'dispensa', 'dispensa', 730, 1.0, 400, { aliases: ['borlotti', 'cannellini', 'fagioli rossi'] }),
  i('lenticchie', 'Lenticchie', '🫘', 'dispensa', 'dispensa', 730, 1.5, 400),
  i('olive', 'Olive', '🫒', 'dispensa', 'frigo', 30, 2.0, 200, { aliases: ['olive nere', 'olive verdi', 'olive taggiasche'] }),
  i('capperi', 'Capperi', '🫒', 'dispensa', 'frigo', 180, 2.0, 100),
  i('pesto', 'Pesto', '🫙', 'dispensa', 'frigo', 7, 2.5, 190, { aliases: ['pesto alla genovese'], notFor: DAIRY, allergens: al('lattosio', 'frutta-secca') }),
  i('noci', 'Noci', '🌰', 'dispensa', 'dispensa', 180, 3.5, 200, { aliases: ['nocciole', 'mandorle', 'pinoli', 'frutta secca'], allergens: al('frutta-secca') }),
  i('cioccolato', 'Cioccolato fondente', '🍫', 'dispensa', 'dispensa', 365, 2.0, 100, { aliases: ['cioccolato', 'gocce di cioccolato'], allergens: al('lattosio') }),
  i('cacao', 'Cacao amaro', '🍫', 'dispensa', 'dispensa', 365, 2.5, 75, { staple: true }),
  i('zucchero', 'Zucchero', '🍬', 'dispensa', 'dispensa', 730, 1.0, 1000, { staple: true }),
  i('miele', 'Miele', '🍯', 'dispensa', 'dispensa', 730, 4.0, 250, { notFor: ANIMAL, staple: true }),
  i('lievito', 'Lievito per dolci', '🧁', 'dispensa', 'dispensa', 365, 0.8, 48, { aliases: ['lievito di birra', 'lievito istantaneo'], staple: true }),
  i('caffe', 'Caffè', '☕', 'bevande', 'dispensa', 180, 4.0, 250, { aliases: ['caffè', 'moka'], staple: true }),
  i('vino-bianco', 'Vino bianco', '🍷', 'bevande', 'dispensa', 30, 4.0, 750, { aliases: ['vino', 'vino rosso'] }),
  i('brodo', 'Brodo', '🍲', 'dispensa', 'dispensa', 365, 1.5, 1000, { aliases: ['dado', 'brodo vegetale', 'brodo di carne'], staple: true }),
  i('tofu', 'Tofu', '🧊', 'latticini', 'frigo', 7, 2.5, 250, { aliases: ['tempeh', 'seitan'], allergens: al('soia') }),
  i('latte-vegetale', 'Bevanda vegetale', '🥛', 'bevande', 'frigo', 7, 1.8, 1000, { aliases: ['latte di soia', 'latte di avena', 'latte di mandorla'] }),

  // ——— Spezie e base (sempre in casa) ———
  i('olio', 'Olio extravergine', '🫒', 'spezie', 'dispensa', 365, 8.0, 1000, { aliases: ['olio d\'oliva', 'evo'], staple: true }),
  i('sale', 'Sale', '🧂', 'spezie', 'dispensa', 3650, 0.5, 1000, { staple: true }),
  i('pepe', 'Pepe', '🧂', 'spezie', 'dispensa', 730, 2.0, 50, { staple: true }),
  i('aceto', 'Aceto', '🍶', 'spezie', 'dispensa', 730, 1.5, 500, { aliases: ['aceto balsamico', 'aceto di mele'], staple: true }),
  i('origano', 'Origano', '🌿', 'spezie', 'dispensa', 365, 1.5, 20, { staple: true }),
  i('noce-moscata', 'Noce moscata', '🌰', 'spezie', 'dispensa', 730, 2.0, 20, { staple: true }),
  i('curry', 'Curry', '🍛', 'spezie', 'dispensa', 365, 2.0, 40, { aliases: ['curcuma', 'paprika', 'cumino'], staple: true }),
  i('zafferano', 'Zafferano', '🟡', 'spezie', 'dispensa', 730, 2.5, 1, { staple: true }),
  i('gelatina', 'Gelatina in fogli', '🍮', 'dispensa', 'dispensa', 730, 1.5, 12, { aliases: ['colla di pesce', 'agar agar'], notFor: ANIMAL }),
  i('cannella', 'Cannella', '🍂', 'spezie', 'dispensa', 730, 2.0, 30, { staple: true }),
  i('acqua', 'Acqua', '💧', 'bevande', 'dispensa', 3650, 0, 0, { staple: true }),
  i('salsa-soia', 'Salsa di soia', '🍶', 'spezie', 'dispensa', 365, 2.5, 150, { allergens: al('soia', 'glutine'), staple: true }),
  i('maionese', 'Maionese', '🫙', 'spezie', 'frigo', 60, 2.0, 250, { aliases: ['senape', 'ketchup'], notFor: ANIMAL, allergens: al('uova') }),
]

export const INGREDIENT_BY_ID: Record<string, Ingredient> = Object.fromEntries(INGREDIENTS.map((x) => [x.id, x]))

export const AISLE_LABELS: Record<Aisle, { label: string; emoji: string }> = {
  'frutta-verdura': { label: 'Frutta e verdura', emoji: '🥦' },
  'carne-pesce': { label: 'Carne e pesce', emoji: '🥩' },
  latticini: { label: 'Latticini', emoji: '🧀' },
  'uova-salumi': { label: 'Uova e salumi', emoji: '🥚' },
  'pane-pasta': { label: 'Pane, pasta e riso', emoji: '🍝' },
  dispensa: { label: 'Dispensa', emoji: '🥫' },
  surgelati: { label: 'Surgelati', emoji: '🧊' },
  spezie: { label: 'Spezie e condimenti', emoji: '🧂' },
  bevande: { label: 'Bevande', emoji: '🥛' },
}

/** Ingredienti consigliati per iniziare (onboarding): i più comuni nei frigo italiani. */
export const STARTER_IDS = [
  'uova', 'latte', 'burro', 'parmigiano', 'mozzarella', 'pomodori', 'zucchine', 'carote', 'cipolla',
  'aglio', 'patate', 'insalata', 'petto-pollo', 'prosciutto-cotto', 'pancetta', 'pasta', 'riso',
  'passata', 'tonno', 'yogurt', 'limone', 'pane', 'ceci', 'spinaci', 'funghi',
]
