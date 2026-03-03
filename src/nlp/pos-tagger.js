// Statistical POS tagger: lexicon-backed with suffix heuristics and bigram transitions
// Tags use Universal Dependencies tagset: NOUN, VERB, ADJ, ADV, DET, ADP, CONJ, PRON, NUM, PART, PUNCT, AUX, INTJ, PROPN, SCONJ, SYM, X

// Lexicon: word → most likely POS (compiled from English frequency data)
const LEXICON = new Map([
  // Determiners
  ...["the","a","an","this","that","these","those","every","each","some","any","no","all","both","half","either","neither","much","many","few","several","my","your","his","her","its","our","their","whose"].map(w=>[w,"DET"]),
  // Prepositions
  ...["in","on","at","to","for","with","by","from","of","about","over","under","between","through","into","during","after","before","behind","below","above","across","against","along","among","around","beyond","down","inside","near","off","onto","outside","past","since","toward","towards","until","up","upon","within","without","except","per","via"].map(w=>[w,"ADP"]),
  // Conjunctions
  ...["and","or","but","nor","yet","so","for"].map(w=>[w,"CCONJ"]),
  // Subordinating conjunctions
  ...["if","when","while","because","although","though","since","unless","whether","whereas","wherever","whenever","however","as","than","that","until","after","before"].map(w=>[w,"SCONJ"]),
  // Pronouns
  ...["i","you","he","she","it","we","they","me","him","us","them","myself","yourself","himself","herself","itself","ourselves","themselves","who","whom","whose","which","what","whoever","whatever","whichever","somebody","someone","something","anybody","anyone","anything","nobody","everyone","everything","nothing","one","ones"].map(w=>[w,"PRON"]),
  // Auxiliaries
  ...["is","are","was","were","be","been","being","am","have","has","had","having","do","does","did","will","would","shall","should","may","might","can","could","must"].map(w=>[w,"AUX"]),
  // Particles
  ...["not","n't","'s","'re","'ve","'ll","'d","'m","to"].map(w=>[w,"PART"]),
  // Adverbs (common)
  ...["very","also","often","never","always","sometimes","usually","already","still","just","now","then","here","there","where","how","why","when","too","quite","rather","almost","only","even","perhaps","maybe","certainly","probably","apparently","actually","really","simply","merely","indeed","however","therefore","thus","hence","meanwhile","nevertheless","nonetheless","instead","otherwise","furthermore","moreover","likewise","similarly","accordingly","consequently","subsequently","immediately","eventually","finally","recently","currently","previously","simultaneously","gradually","increasingly","particularly","especially","specifically","primarily","mainly","largely","generally","typically","normally","frequently","rarely","seldom","hardly","barely","nearly","approximately","roughly","exactly","precisely","completely","entirely","totally","fully","absolutely","utterly","thoroughly","partly","partially","slightly","somewhat","fairly","reasonably","relatively","considerably","significantly","substantially","dramatically","remarkably","extremely","exceedingly","exceptionally","extraordinarily"].map(w=>[w,"ADV"]),
  // Common nouns
  ...["time","year","people","way","day","man","woman","child","world","life","hand","part","place","case","week","company","system","program","question","work","government","number","night","point","home","water","room","mother","area","money","story","fact","month","lot","right","study","book","eye","job","word","business","issue","side","kind","head","house","service","friend","father","power","hour","game","line","end","member","law","car","city","community","name","president","team","minute","idea","body","information","back","parent","face","others","level","office","door","health","person","art","war","history","party","result","change","morning","reason","research","girl","guy","moment","air","teacher","force","education","language","data","model","process","structure","form","group","state","field","theory","example","sense","type","class","basis","use","report","evidence","analysis","order","view","effect","development","role","experience","society","activity","growth","student","rate","control","value","policy","term","period","market","interest","support","subject","center","age","attention","approach","nature","range","relationship","set","means","source","stage","region","position","series","situation","status","pattern","resource","design","practice","quality","standard","function","feature","production","property","concept","response","condition","knowledge","context","performance","method","principle","factor","material","technology","environment","culture","information","population","energy","opportunity","pressure","operation","strategy","industry","direction","individual","family","purpose","institution"].map(w=>[w,"NOUN"]),
  // Common verbs (base forms)
  ...["say","get","make","go","know","take","see","come","think","look","want","give","use","find","tell","ask","work","seem","feel","try","leave","call","need","become","keep","let","begin","show","hear","play","run","move","live","believe","bring","happen","write","provide","sit","stand","lose","pay","meet","include","continue","set","learn","change","lead","understand","watch","follow","stop","create","speak","read","allow","add","spend","grow","open","walk","win","offer","remember","love","consider","appear","buy","wait","serve","die","send","expect","build","stay","fall","cut","reach","kill","remain","suggest","raise","pass","sell","require","report","decide","pull","develop","hold","produce","turn","form","present","support","claim","establish","maintain","receive","accept","determine","identify","describe","indicate","involve","represent","define","apply","explain","express","assume","obtain","measure","achieve","occur","perform","address","reduce","avoid","prepare","promote","introduce","relate","contribute","demonstrate","reveal","generate","deliver","evaluate","enable","ensure","enhance","implement","emerge","derive","constitute","facilitate","acknowledge","pursue","interpret","illustrate","incorporate","assess","encounter","perceive","sustain","yield","transform","exhibit","convey","undertake","acquire","distinguish","undergo","investigate","formulate","integrate","devise","restrict","designate","supplement","modify","elaborate","accompany","attribute","authorize","characterize","cite","compensate","compile","comprise","conceive","conform","diminish","dominate","enforce","evoke","exert","foster","initiate","invoke","mandate","manipulate","neglect","precede","reinforce","specify","subordinate","summarize","supplement","terminate","verify"].map(w=>[w,"VERB"]),
  // Common adjectives
  ...["good","new","first","last","long","great","little","own","other","old","right","big","high","different","small","large","next","early","young","important","few","public","bad","same","able","possible","political","social","free","human","local","national","economic","real","best","better","sure","full","special","international","current","major","general","particular","strong","financial","environmental","significant","individual","legal","specific","hard","available","likely","natural","similar","traditional","certain","various","single","common","potential","final","main","recent","whole","necessary","additional","critical","physical","basic","positive","serious","medical","cultural","scientific","historical","digital","educational","professional","personal","global","regional","environmental","successful","effective","appropriate","relevant","complex","comprehensive","fundamental","previous","original","typical","apparent","internal","external","essential","primary","secondary","substantial","considerable","significant","sufficient","adequate","consistent","distinct","explicit","implicit","inherent","mere","precise","prominent","respective","sole","subtle","widespread","diverse","extensive","intensive","moderate","profound","severe","simultaneous","subsequent","ultimate","underlying","uniform","verbal","visual","abstract","academic","empirical","formal","theoretical","conventional","dominant","legitimate","peripheral","preliminary","principal","residual","systematic","valid"].map(w=>[w,"ADJ"]),
  // Numbers
  ...["one","two","three","four","five","six","seven","eight","nine","ten","hundred","thousand","million","billion"].map(w=>[w,"NUM"]),
  // Interjections
  ...["oh","ah","wow","hey","well","yes","no","ok","okay","please","thanks","hello","hi"].map(w=>[w,"INTJ"]),
]);

// Past tenses and inflected forms
const INFLECTED = new Map([
  ...["said","got","made","went","knew","took","saw","came","thought","looked","wanted","gave","used","found","told","asked","worked","seemed","felt","tried","left","called","needed","became","kept","began","showed","heard","played","ran","moved","lived","believed","brought","happened","wrote","provided","sat","stood","lost","paid","met","included","continued","learned","changed","led","understood","watched","followed","stopped","created","spoke","read","allowed","added","spent","grew","opened","walked","won","offered","remembered","loved","considered","appeared","bought","waited","served","died","sent","expected","built","stayed","fell","reached","killed","remained","suggested","raised","passed","sold","required","reported","decided","pulled","developed","held","produced","turned","formed","presented","supported","claimed","established","maintained","received","accepted","determined","identified","described","indicated","involved","represented","defined","applied","explained","expressed","assumed","obtained","measured","achieved","occurred","performed","addressed","reduced","avoided","prepared","promoted","introduced","related","contributed","demonstrated","revealed","generated","delivered","evaluated","enabled","ensured","enhanced","implemented","emerged","derived","constituted","facilitated","acknowledged","pursued","interpreted","illustrated","incorporated","assessed","encountered","perceived","sustained","yielded","transformed","exhibited","conveyed","undertaken","acquired","distinguished","undergone","investigated","formulated","integrated"].map(w=>[w,"VERB"]),
  ...["says","gets","makes","goes","knows","takes","sees","comes","thinks","looks","wants","gives","uses","finds","tells","asks","works","seems","feels","tries","leaves","calls","needs","becomes","keeps","begins","shows","hears","plays","runs","moves","lives","believes","brings","happens","writes","provides","sits","stands","loses","pays","meets","includes","continues","learns","changes","leads","understands","watches","follows","stops","creates","speaks","reads","allows","adds","spends","grows","opens","walks","wins","offers","remembers","loves","considers","appears","buys","waits","serves","dies","sends","expects","builds","stays","falls","reaches","kills","remains","suggests","raises","passes","sells","requires","reports","decides","pulls","develops","holds","produces","turns","forms","presents","supports","claims","establishes","maintains","receives","accepts","determines","identifies","describes","indicates","involves","represents","defines","applies","explains","expresses","assumes","obtains","measures","achieves","occurs","performs","addresses","reduces","avoids","prepares","promotes","introduces","relates","contributes","demonstrates","reveals","generates","delivers","evaluates","enables","ensures","enhances","implements","emerges","derives","constitutes","facilitates"].map(w=>[w,"VERB"]),
  ...["saying","getting","making","going","knowing","taking","seeing","coming","thinking","looking","wanting","giving","using","finding","telling","asking","working","feeling","trying","leaving","calling","needing","becoming","keeping","beginning","showing","hearing","playing","running","moving","living","believing","bringing","happening","writing","providing","sitting","standing","losing","paying","meeting","including","continuing","learning","changing","leading","understanding","watching","following","stopping","creating","speaking","reading","allowing","adding","spending","growing","opening","walking","winning","offering","remembering","loving","considering","appearing","buying","waiting","serving","dying","sending","expecting","building","staying","falling","reaching","killing","remaining","suggesting","raising","passing","selling","requiring","reporting","deciding","pulling","developing","holding","producing","turning","forming","presenting","supporting","claiming","establishing","maintaining","receiving","accepting","determining","identifying","describing","indicating","involving","representing","defining","applying","explaining","expressing","assuming","obtaining","measuring","achieving","occurring","performing"].map(w=>[w,"VERB"]),
]);

// Bigram transition probabilities (simplified, from Brown corpus statistics)
// Format: prevTag → { nextTag: probability }
const TRANSITIONS = {
  "DET":   { "NOUN": 0.45, "ADJ": 0.35, "ADV": 0.05, "NUM": 0.08, "PROPN": 0.05, "VERB": 0.02 },
  "ADJ":   { "NOUN": 0.55, "ADJ": 0.12, "CONJ": 0.05, "PUNCT": 0.08, "ADP": 0.05, "VERB": 0.05, "ADV": 0.03, "DET": 0.02, "PROPN": 0.05 },
  "NOUN":  { "VERB": 0.20, "ADP": 0.20, "PUNCT": 0.15, "CCONJ": 0.08, "NOUN": 0.10, "DET": 0.05, "ADV": 0.05, "AUX": 0.07, "SCONJ": 0.03, "PRON": 0.03, "PART": 0.04 },
  "VERB":  { "DET": 0.15, "ADP": 0.12, "NOUN": 0.12, "ADV": 0.10, "ADJ": 0.08, "PRON": 0.08, "PART": 0.08, "VERB": 0.05, "SCONJ": 0.05, "PUNCT": 0.07, "AUX": 0.03, "NUM": 0.03, "PROPN": 0.04 },
  "ADP":   { "DET": 0.35, "NOUN": 0.20, "ADJ": 0.08, "PRON": 0.08, "PROPN": 0.10, "NUM": 0.05, "VERB": 0.04, "ADP": 0.02, "ADV": 0.05, "SCONJ": 0.03 },
  "ADV":   { "VERB": 0.20, "ADJ": 0.20, "ADV": 0.10, "ADP": 0.08, "PUNCT": 0.10, "DET": 0.05, "NOUN": 0.05, "AUX": 0.08, "SCONJ": 0.04, "PRON": 0.05, "PART": 0.05 },
  "PRON":  { "VERB": 0.30, "AUX": 0.20, "ADV": 0.10, "NOUN": 0.05, "ADP": 0.05, "PUNCT": 0.08, "CCONJ": 0.05, "PRON": 0.03, "DET": 0.04, "SCONJ": 0.05, "PART": 0.05 },
  "AUX":   { "VERB": 0.35, "ADV": 0.15, "ADJ": 0.10, "PART": 0.10, "DET": 0.08, "NOUN": 0.05, "PRON": 0.05, "ADP": 0.04, "AUX": 0.03, "PUNCT": 0.05 },
  "CCONJ": { "DET": 0.15, "NOUN": 0.15, "VERB": 0.12, "ADJ": 0.12, "PRON": 0.10, "ADV": 0.08, "ADP": 0.05, "AUX": 0.05, "PROPN": 0.08, "NUM": 0.05, "SCONJ": 0.05 },
  "SCONJ": { "DET": 0.15, "PRON": 0.15, "NOUN": 0.12, "ADJ": 0.08, "VERB": 0.10, "ADV": 0.08, "ADP": 0.05, "AUX": 0.08, "PROPN": 0.08, "NUM": 0.05, "SCONJ": 0.06 },
  "NUM":   { "NOUN": 0.40, "PUNCT": 0.15, "ADP": 0.10, "NUM": 0.08, "ADJ": 0.08, "VERB": 0.05, "CCONJ": 0.05, "DET": 0.04, "ADV": 0.05 },
  "PUNCT": { "DET": 0.15, "NOUN": 0.12, "PRON": 0.10, "VERB": 0.08, "ADV": 0.08, "ADJ": 0.08, "ADP": 0.06, "CCONJ": 0.06, "SCONJ": 0.06, "AUX": 0.05, "PROPN": 0.06, "PUNCT": 0.05, "NUM": 0.05 },
  "PART":  { "VERB": 0.50, "ADJ": 0.10, "ADV": 0.10, "NOUN": 0.08, "DET": 0.05, "ADP": 0.05, "PRON": 0.05, "AUX": 0.04, "PUNCT": 0.03 },
  "PROPN": { "VERB": 0.15, "ADP": 0.15, "PUNCT": 0.15, "CCONJ": 0.10, "NOUN": 0.10, "PROPN": 0.10, "DET": 0.05, "AUX": 0.08, "ADV": 0.05, "SCONJ": 0.04, "PRON": 0.03 },
  "INTJ":  { "PUNCT": 0.40, "PRON": 0.15, "DET": 0.10, "NOUN": 0.10, "VERB": 0.10, "ADV": 0.05, "ADJ": 0.05, "ADP": 0.05 },
  "SYM":   { "NOUN": 0.30, "NUM": 0.25, "PUNCT": 0.15, "VERB": 0.10, "ADJ": 0.10, "ADP": 0.10 },
  "X":     { "NOUN": 0.25, "VERB": 0.15, "PUNCT": 0.15, "ADP": 0.10, "DET": 0.10, "ADJ": 0.08, "ADV": 0.07, "PRON": 0.05, "CCONJ": 0.05 },
};

const ALL_TAGS = ["NOUN","VERB","ADJ","ADV","DET","ADP","CCONJ","SCONJ","PRON","AUX","PART","NUM","PUNCT","PROPN","INTJ","SYM","X"];

// Suffix heuristics for unknown words
function guessPOSbySuffix(word) {
  const lc = word.toLowerCase();
  if (/^\d+([.,]\d+)?$/.test(word)) return "NUM";
  if (/^[^a-zA-Z0-9\s]$/.test(word)) return "PUNCT";
  if (/^[A-Z][a-z]/.test(word) && word.length > 1) return "PROPN"; // Capitalized mid-sentence
  // Verb suffixes
  if (lc.endsWith("ing") && lc.length > 4) return "VERB";
  if (lc.endsWith("ated") || lc.endsWith("ized") || lc.endsWith("ised")) return "VERB";
  if (lc.endsWith("ed") && lc.length > 3) return "VERB";
  // Adjective suffixes
  if (lc.endsWith("ous") || lc.endsWith("ious") || lc.endsWith("eous")) return "ADJ";
  if (lc.endsWith("ful") || lc.endsWith("less") || lc.endsWith("ible") || lc.endsWith("able")) return "ADJ";
  if (lc.endsWith("ive") || lc.endsWith("ical") || lc.endsWith("istic")) return "ADJ";
  if (lc.endsWith("ent") || lc.endsWith("ant")) return "ADJ";
  // Noun suffixes
  if (lc.endsWith("tion") || lc.endsWith("sion") || lc.endsWith("ment")) return "NOUN";
  if (lc.endsWith("ness") || lc.endsWith("ity") || lc.endsWith("ism") || lc.endsWith("ist")) return "NOUN";
  if (lc.endsWith("ance") || lc.endsWith("ence") || lc.endsWith("ure")) return "NOUN";
  if (lc.endsWith("ology") || lc.endsWith("ography") || lc.endsWith("ics")) return "NOUN";
  if (lc.endsWith("er") && lc.length > 3) return "NOUN"; // agent nouns
  // Adverb
  if (lc.endsWith("ly") && lc.length > 3) return "ADV";
  // Default
  return "NOUN";
}

// Get possible tags for a word with emission probabilities
function getEmissionProbs(word, position, sentenceLength) {
  const lc = word.toLowerCase();
  const probs = {};

  // Check lexicon first
  const lexTag = LEXICON.get(lc) || INFLECTED.get(lc);
  if (lexTag) {
    // Strong prior from lexicon
    probs[lexTag] = 0.85;
    // Small probability for other common tags
    for (const t of ALL_TAGS) {
      if (!probs[t]) probs[t] = 0.01;
    }
    return probs;
  }

  // Use suffix heuristics
  const guessTag = guessPOSbySuffix(word);
  probs[guessTag] = 0.6;

  // Spread remaining probability
  for (const t of ALL_TAGS) {
    if (!probs[t]) probs[t] = 0.4 / (ALL_TAGS.length - 1);
  }

  // Positional adjustments
  if (position === 0 && /^[A-Z]/.test(word)) {
    // Sentence-initial capitalized: could be regular word, not just PROPN
    probs["PROPN"] = Math.max(probs["PROPN"], 0.15);
  }

  return probs;
}

// Viterbi algorithm for POS tagging
export function tagSentence(tokens) {
  if (tokens.length === 0) return [];
  if (tokens.length === 1) {
    const lc = tokens[0].toLowerCase();
    const tag = LEXICON.get(lc) || INFLECTED.get(lc) || guessPOSbySuffix(tokens[0]);
    return [{ word: tokens[0], tag }];
  }

  const N = tokens.length;
  const T = ALL_TAGS.length;

  // Viterbi tables
  const viterbi = Array.from({ length: N }, () => new Float64Array(T));
  const backpointer = Array.from({ length: N }, () => new Int32Array(T));

  // Initialization
  const startEmission = getEmissionProbs(tokens[0], 0, N);
  for (let t = 0; t < T; t++) {
    viterbi[0][t] = Math.log((startEmission[ALL_TAGS[t]] || 0.001)) + Math.log(1 / T); // uniform start prior
  }

  // Forward pass
  for (let i = 1; i < N; i++) {
    const emission = getEmissionProbs(tokens[i], i, N);
    for (let t = 0; t < T; t++) {
      let maxProb = -Infinity;
      let maxPrev = 0;
      for (let p = 0; p < T; p++) {
        const trans = TRANSITIONS[ALL_TAGS[p]];
        const transProb = trans ? (trans[ALL_TAGS[t]] || 0.001) : 0.001;
        const prob = viterbi[i - 1][p] + Math.log(transProb);
        if (prob > maxProb) {
          maxProb = prob;
          maxPrev = p;
        }
      }
      viterbi[i][t] = maxProb + Math.log(emission[ALL_TAGS[t]] || 0.001);
      backpointer[i][t] = maxPrev;
    }
  }

  // Backtrace
  let bestLast = 0;
  let bestProb = -Infinity;
  for (let t = 0; t < T; t++) {
    if (viterbi[N - 1][t] > bestProb) {
      bestProb = viterbi[N - 1][t];
      bestLast = t;
    }
  }

  const tags = new Array(N);
  tags[N - 1] = bestLast;
  for (let i = N - 2; i >= 0; i--) {
    tags[i] = backpointer[i + 1][tags[i + 1]];
  }

  return tokens.map((word, i) => ({
    word,
    tag: ALL_TAGS[tags[i]],
  }));
}

// Tag an entire corpus (returns array of tagged sentences)
export function tagCorpus(sentences) {
  return sentences.map((sent) => {
    const tokens = sent.text
      ? sent.text.split(/\s+/).filter(Boolean)
      : (typeof sent === "string" ? sent.split(/\s+/).filter(Boolean) : []);
    return tagSentence(tokens);
  });
}

// POS frequency distribution
export function posDistribution(taggedSentences) {
  const counts = {};
  let total = 0;
  for (const sent of taggedSentences) {
    for (const { tag } of sent) {
      counts[tag] = (counts[tag] || 0) + 1;
      total++;
    }
  }
  const distribution = {};
  for (const [tag, count] of Object.entries(counts)) {
    distribution[tag] = { count, ratio: count / total };
  }
  return { distribution, total };
}

export { ALL_TAGS, LEXICON };
