// English lemmatizer: irregular forms + rule-based suffix stripping

const IRREGULAR_VERBS = new Map([
  ["am","be"],["is","be"],["are","be"],["was","be"],["were","be"],["been","be"],["being","be"],
  ["have","have"],["has","have"],["had","have"],["having","have"],
  ["do","do"],["does","do"],["did","do"],["done","do"],["doing","do"],
  ["say","say"],["says","say"],["said","say"],["saying","say"],
  ["go","go"],["goes","go"],["went","go"],["gone","go"],["going","go"],
  ["get","get"],["gets","get"],["got","get"],["gotten","get"],["getting","get"],
  ["make","make"],["makes","make"],["made","make"],["making","make"],
  ["know","know"],["knows","know"],["knew","know"],["known","know"],["knowing","know"],
  ["think","think"],["thinks","think"],["thought","think"],["thinking","think"],
  ["take","take"],["takes","take"],["took","take"],["taken","take"],["taking","take"],
  ["see","see"],["sees","see"],["saw","see"],["seen","see"],["seeing","see"],
  ["come","come"],["comes","come"],["came","come"],["coming","come"],
  ["give","give"],["gives","give"],["gave","give"],["given","give"],["giving","give"],
  ["find","find"],["finds","find"],["found","find"],["finding","find"],
  ["tell","tell"],["tells","tell"],["told","tell"],["telling","tell"],
  ["become","become"],["becomes","become"],["became","become"],["becoming","become"],
  ["leave","leave"],["leaves","leave"],["left","leave"],["leaving","leave"],
  ["feel","feel"],["feels","feel"],["felt","feel"],["feeling","feel"],
  ["put","put"],["puts","put"],["putting","put"],
  ["bring","bring"],["brings","bring"],["brought","bring"],["bringing","bring"],
  ["begin","begin"],["begins","begin"],["began","begin"],["begun","begin"],["beginning","begin"],
  ["show","show"],["shows","show"],["showed","show"],["shown","show"],["showing","show"],
  ["hear","hear"],["hears","hear"],["heard","hear"],["hearing","hear"],
  ["run","run"],["runs","run"],["ran","run"],["running","run"],
  ["hold","hold"],["holds","hold"],["held","hold"],["holding","hold"],
  ["stand","stand"],["stands","stand"],["stood","stand"],["standing","stand"],
  ["lose","lose"],["loses","lose"],["lost","lose"],["losing","lose"],
  ["pay","pay"],["pays","pay"],["paid","pay"],["paying","pay"],
  ["meet","meet"],["meets","meet"],["met","meet"],["meeting","meet"],
  ["sit","sit"],["sits","sit"],["sat","sit"],["sitting","sit"],
  ["speak","speak"],["speaks","speak"],["spoke","speak"],["spoken","speak"],["speaking","speak"],
  ["read","read"],["reads","read"],["reading","read"],
  ["grow","grow"],["grows","grow"],["grew","grow"],["grown","grow"],["growing","grow"],
  ["lead","lead"],["leads","lead"],["led","lead"],["leading","lead"],
  ["write","write"],["writes","write"],["wrote","write"],["written","write"],["writing","write"],
  ["fall","fall"],["falls","fall"],["fell","fall"],["fallen","fall"],["falling","fall"],
  ["build","build"],["builds","build"],["built","build"],["building","build"],
  ["send","send"],["sends","send"],["sent","send"],["sending","send"],
  ["buy","buy"],["buys","buy"],["bought","buy"],["buying","buy"],
  ["win","win"],["wins","win"],["won","win"],["winning","win"],
  ["cut","cut"],["cuts","cut"],["cutting","cut"],
  ["sell","sell"],["sells","sell"],["sold","sell"],["selling","sell"],
  ["drive","drive"],["drives","drive"],["drove","drive"],["driven","drive"],["driving","drive"],
  ["eat","eat"],["eats","eat"],["ate","eat"],["eaten","eat"],["eating","eat"],
  ["draw","draw"],["draws","draw"],["drew","draw"],["drawn","draw"],["drawing","draw"],
  ["break","break"],["breaks","break"],["broke","break"],["broken","break"],["breaking","break"],
  ["spend","spend"],["spends","spend"],["spent","spend"],["spending","spend"],
  ["catch","catch"],["catches","catch"],["caught","catch"],["catching","catch"],
  ["fly","fly"],["flies","fly"],["flew","fly"],["flown","fly"],["flying","fly"],
  ["choose","choose"],["chooses","choose"],["chose","choose"],["chosen","choose"],["choosing","choose"],
  ["rise","rise"],["rises","rise"],["rose","rise"],["risen","rise"],["rising","rise"],
  ["teach","teach"],["teaches","teach"],["taught","teach"],["teaching","teach"],
  ["wear","wear"],["wears","wear"],["wore","wear"],["worn","wear"],["wearing","wear"],
  ["sing","sing"],["sings","sing"],["sang","sing"],["sung","sing"],["singing","sing"],
  ["lie","lie"],["lies","lie"],["lay","lie"],["lain","lie"],["lying","lie"],
  ["hang","hang"],["hangs","hang"],["hung","hang"],["hanging","hang"],
  ["sleep","sleep"],["sleeps","sleep"],["slept","sleep"],["sleeping","sleep"],
  ["keep","keep"],["keeps","keep"],["kept","keep"],["keeping","keep"],
  ["set","set"],["sets","set"],["setting","set"],
  ["hit","hit"],["hits","hit"],["hitting","hit"],
  ["bear","bear"],["bears","bear"],["bore","bear"],["born","bear"],["borne","bear"],["bearing","bear"],
  ["fight","fight"],["fights","fight"],["fought","fight"],["fighting","fight"],
  ["throw","throw"],["throws","throw"],["threw","throw"],["thrown","throw"],["throwing","throw"],
  ["drink","drink"],["drinks","drink"],["drank","drink"],["drunk","drink"],["drinking","drink"],
  ["forget","forget"],["forgets","forget"],["forgot","forget"],["forgotten","forget"],["forgetting","forget"],
  ["hide","hide"],["hides","hide"],["hid","hide"],["hidden","hide"],["hiding","hide"],
  ["swim","swim"],["swims","swim"],["swam","swim"],["swum","swim"],["swimming","swim"],
  ["shake","shake"],["shakes","shake"],["shook","shake"],["shaken","shake"],["shaking","shake"],
  ["wake","wake"],["wakes","wake"],["woke","wake"],["woken","wake"],["waking","wake"],
  ["ring","ring"],["rings","ring"],["rang","ring"],["rung","ring"],["ringing","ring"],
  ["bite","bite"],["bites","bite"],["bit","bite"],["bitten","bite"],["biting","bite"],
  ["blow","blow"],["blows","blow"],["blew","blow"],["blown","blow"],["blowing","blow"],
  ["spread","spread"],["spreads","spread"],["spreading","spread"],
  ["shut","shut"],["shuts","shut"],["shutting","shut"],
  ["cost","cost"],["costs","cost"],["costing","cost"],
  ["burst","burst"],["bursts","burst"],["bursting","burst"],
  ["split","split"],["splits","split"],["splitting","split"],
  ["let","let"],["lets","let"],["letting","let"],
  ["hurt","hurt"],["hurts","hurt"],["hurting","hurt"],
  ["quit","quit"],["quits","quit"],["quitting","quit"],
]);

const IRREGULAR_NOUNS = new Map([
  ["men","man"],["women","woman"],["children","child"],["mice","mouse"],["teeth","tooth"],
  ["feet","foot"],["geese","goose"],["oxen","ox"],["people","person"],["dice","die"],
  ["lives","life"],["wives","wife"],["knives","knife"],["halves","half"],["shelves","shelf"],
  ["leaves","leaf"],["thieves","thief"],["wolves","wolf"],["selves","self"],["loaves","loaf"],
  ["criteria","criterion"],["phenomena","phenomenon"],["data","datum"],["analyses","analysis"],
  ["theses","thesis"],["hypotheses","hypothesis"],["crises","crisis"],["bases","basis"],
  ["diagnoses","diagnosis"],["parentheses","parenthesis"],["axes","axis"],["indices","index"],
  ["appendices","appendix"],["matrices","matrix"],["vertices","vertex"],["stimuli","stimulus"],
  ["alumni","alumnus"],["fungi","fungus"],["nuclei","nucleus"],["radii","radius"],["cacti","cactus"],
  ["syllabi","syllabus"],["foci","focus"],["formulae","formula"],["antennae","antenna"],
  ["larvae","larva"],["media","medium"],["strata","stratum"],["curricula","curriculum"],
  ["memoranda","memorandum"],["bacteria","bacterium"],["spectra","spectrum"],
]);

const IRREGULAR_ADJ = new Map([
  ["better","good"],["best","good"],["worse","bad"],["worst","bad"],
  ["more","much"],["most","much"],["less","little"],["least","little"],
  ["further","far"],["furthest","far"],["farther","far"],["farthest","far"],
  ["elder","old"],["eldest","old"],["older","old"],["oldest","old"],
  ["bigger","big"],["biggest","big"],["larger","large"],["largest","large"],
  ["smaller","small"],["smallest","small"],["higher","high"],["highest","high"],
  ["lower","low"],["lowest","low"],["longer","long"],["longest","long"],
  ["shorter","short"],["shortest","short"],["newer","new"],["newest","new"],
]);

export function lemmatize(word, pos) {
  const lc = word.toLowerCase();

  // Check irregulars based on POS
  if (pos === "VERB" || pos === "AUX") {
    const irr = IRREGULAR_VERBS.get(lc);
    if (irr) return irr;
  }
  if (pos === "NOUN") {
    const irr = IRREGULAR_NOUNS.get(lc);
    if (irr) return irr;
  }
  if (pos === "ADJ") {
    const irr = IRREGULAR_ADJ.get(lc);
    if (irr) return irr;
  }

  // Check all irregulars as fallback
  if (IRREGULAR_VERBS.has(lc)) return IRREGULAR_VERBS.get(lc);
  if (IRREGULAR_NOUNS.has(lc)) return IRREGULAR_NOUNS.get(lc);
  if (IRREGULAR_ADJ.has(lc)) return IRREGULAR_ADJ.get(lc);

  // Rule-based stripping
  if (pos === "VERB" || pos === "AUX") {
    if (lc.endsWith("ying")) return lc.slice(0, -4) + "y";
    if (lc.endsWith("ting") && lc.length > 5 && lc[lc.length - 5] === lc[lc.length - 4]) return lc.slice(0, -4);
    if (lc.endsWith("ning") && lc.length > 5 && lc[lc.length - 5] === lc[lc.length - 4]) return lc.slice(0, -4);
    if (lc.endsWith("ding") && lc.length > 5 && lc[lc.length - 5] === lc[lc.length - 4]) return lc.slice(0, -4);
    if (lc.endsWith("ing") && lc.length > 4) return lc.endsWith("eing") ? lc.slice(0, -3) : lc.slice(0, -3).replace(/([^aeiou])$/, "$1e");
    if (lc.endsWith("ied")) return lc.slice(0, -3) + "y";
    if (lc.endsWith("ted") && lc.length > 5 && lc[lc.length - 4] === lc[lc.length - 5]) return lc.slice(0, -3);
    if (lc.endsWith("ned") && lc.length > 5 && lc[lc.length - 4] === lc[lc.length - 5]) return lc.slice(0, -3);
    if (lc.endsWith("ded") && lc.length > 5 && lc[lc.length - 4] === lc[lc.length - 5]) return lc.slice(0, -3);
    if (lc.endsWith("ed") && lc.length > 3) return lc.endsWith("eed") ? lc : lc.slice(0, -2).replace(/([^aeiou])$/, "$1e");
    if (lc.endsWith("ies")) return lc.slice(0, -3) + "y";
    if (lc.endsWith("es") && lc.length > 3) return lc.slice(0, -2);
    if (lc.endsWith("s") && !lc.endsWith("ss") && lc.length > 2) return lc.slice(0, -1);
    return lc;
  }

  if (pos === "NOUN") {
    if (lc.endsWith("ies") && lc.length > 4) return lc.slice(0, -3) + "y";
    if (lc.endsWith("ves") && lc.length > 4) return lc.slice(0, -3) + "f";
    if (lc.endsWith("ses") || lc.endsWith("xes") || lc.endsWith("zes") || lc.endsWith("ches") || lc.endsWith("shes")) return lc.slice(0, -2);
    if (lc.endsWith("s") && !lc.endsWith("ss") && !lc.endsWith("us") && !lc.endsWith("is") && lc.length > 2) return lc.slice(0, -1);
    return lc;
  }

  if (pos === "ADJ") {
    if (lc.endsWith("iest")) return lc.slice(0, -4) + "y";
    if (lc.endsWith("est") && lc.length > 4) return lc.slice(0, -3);
    if (lc.endsWith("ier")) return lc.slice(0, -3) + "y";
    if (lc.endsWith("er") && lc.length > 4) return lc.slice(0, -2);
    return lc;
  }

  if (pos === "ADV") {
    if (lc.endsWith("ily")) return lc.slice(0, -3) + "y";
    if (lc.endsWith("ly") && lc.length > 3) return lc.slice(0, -2);
    return lc;
  }

  return lc;
}

// Batch lemmatize tagged tokens
export function lemmatizeTagged(taggedTokens) {
  return taggedTokens.map(({ word, tag }) => ({
    word,
    tag,
    lemma: lemmatize(word, tag),
  }));
}
