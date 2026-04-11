import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { Transliteration,Ligne,Signe } from '../data.model';

@Injectable({
  providedIn: 'root',
})
export class TransliterationService {
valeursPhonetiques: Record<string, any> = {};
  signesSimples: Record<string, any> = {};
  signesComposes: Record<string, any> = {};
  ligatures: Record<string, any> = {};
  antiLigatures: Record<string, any> = {};
  mapSignesSimples: Signe[] = [];

  baliseOuvranteList = "[⸢≤{(⟨«";
  baliseFermanteList = "]⸣≥})⟩»";
  baliseBlocanteList = "«";
  baliseList = this.baliseOuvranteList + this.baliseFermanteList;
  baliseDictO2F: Record<string, string> = {};
  baliseDictF2O: Record<string, string> = {};
  noAkkad=new Set(["vacat","sic","anépigraphe","illisible","érasé","lacune","cassure","effacé","détruit","détruite","blanc","disparu","vide","erasure","vacant","broken","damaged","uninscribed","illegible","traces","uninscribed","érasure"])
  listeDeterminatifs=new Set(['i','munus','f','d','dug','gi','giš','lú','meš','kuš','mul','na4','na₄','zá','túg','ú','uru','urudu','uzu','ki','ku6','ku₆','mušen','sar', 'i7','i₇','íd'])


  constructor(private http: HttpClient) {
    // Initialisation des dictionnaires
    for (let i = 0; i < this.baliseOuvranteList.length; i++) {
      const o = this.baliseOuvranteList[i];
      const f = this.baliseFermanteList[i];
      this.baliseDictO2F[o] = f;
      this.baliseDictF2O[f] = o;
      }
    }

private dictionariesLoaded?: Promise<void>;
async loadDictionaries(): Promise<void> {
  if (!this.dictionariesLoaded) {
    console.debug("chargement des dictionnaires")
    this.dictionariesLoaded = (async () => {
      const [d1, d2, d3, d4] = await Promise.all([
        firstValueFrom(this.http.get<Record<string, any>>('/assets/dictionnaires/valeurs_phonetiques.json')),
        firstValueFrom(this.http.get<Record<string, any>>('/assets/dictionnaires/signes_simples.json')),
        firstValueFrom(this.http.get<Record<string, any>>('/assets/dictionnaires/signes_composes.json')),
        firstValueFrom(this.http.get<Record<string, any>>('/assets/dictionnaires/ligatures.json'))
      ]);
      this.valeursPhonetiques = d1 ?? {};
      this.signesSimples = d2 ?? {};
      this.signesComposes = d3 ?? {};
      this.ligatures = d4 ?? {};
      if (Object.keys(this.antiLigatures).length==0) {
        this.antiLigatures = Object.fromEntries(
          Object.entries(d4).map(([k, v]) => [v, k])
        );
      }
      if (this.mapSignesSimples.length==0) {
        this.mapSignesSimples = [ ...Object.entries(d2),
      ].map(([key, value]) => ({
        signe: value.name,
        signe_Unicode: value.unicode,
        signe_Borger: key,
      }));
      }
    })();
  }
  return this.dictionariesLoaded;
}

  private escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  creeTransliterationVide(mot:string): Transliteration{
    return {
          id_signe: "",
          sub_signe: "",
          sub_signe_Borger: "",
          sub_signe_Unicode: "",
          signe: "",
          signe_Borger: "",
          signe_Unicode: "",
          signecorrige: "",
          signecorrige_Borger: "",
          signecorrige_Unicode: "",
          valeurphon: "",
          mot: mot,
          ligature: 0,
          determinatif: false,
          casse: false,
          semicasse: false,
          efface: false,
          ajoute: false,
          supprime: false,
          corrige: false,
          douteux: false,
          errone: false,
          dansmot: true,
          nonsigne: false
        };
  }

  traitementBalises(
    balisesATraiter: string,
    balisesOuvertes: string[],
    signeDict: Transliteration
  ): [string[], Transliteration] {
    for (let balise of balisesATraiter) {
      if (this.baliseOuvranteList.includes(balise)) {
        balisesOuvertes.push(balise);
      } else if (this.baliseFermanteList.includes(balise)) {
        let ouvertureCorrespondante = this.baliseDictF2O[balise];
        let index = balisesOuvertes.lastIndexOf(ouvertureCorrespondante);
        if (index !== -1) {
          balisesOuvertes.splice(index, 1);
        } else {
          console.warn(
            `La balise fermante '${balise}' ('${ouvertureCorrespondante}') n'est pas ouverte : '${balisesOuvertes}'`
          );
        }
      }
    }
    if (Object.keys(signeDict).length === 0) {
      return [balisesOuvertes,signeDict];
    }
    if (balisesOuvertes.includes("[")) signeDict.casse = true;
    if (balisesOuvertes.includes("⸢")) signeDict.semicasse = true;
    if (balisesOuvertes.includes("≤")) signeDict.ajoute = true;
    if (balisesOuvertes.includes("{")) signeDict.efface = true;
    if (balisesOuvertes.includes("(")) signeDict.determinatif = true;
    if (balisesOuvertes.includes("⟨")) signeDict.supprime = true;
    return [balisesOuvertes, signeDict];
  }


  nombreToSigne(nombre: number | string): string[] {
    nombre = Number(nombre);
    const rendu: string[] = [];
    const soixantaine = Math.floor(nombre / 60);
    if (soixantaine > 0) rendu.push(String(soixantaine));
    nombre -= soixantaine * 60;
    const dizaine = Math.floor(nombre / 10) * 10;
    if (dizaine > 0) rendu.push(String(dizaine));
    const unite = nombre - dizaine;
    if (unite > 0) rendu.push(String(unite));
    return rendu;
  }
  rechercheSigne(dico: Record<string, any>, borger: string): [string, string, string[]] {
    if (!borger.includes('?')) {
      const entry = dico[borger];
      return [
        entry.name,
        entry.unicode,
        entry.compose ?? []
      ];
    }
    const names: string[] = [];
    const unicodes: string[] = [];
    for (let sub of borger.split('?')) {
      let [n, u] = this.rechercheSigne(this.signesSimples, sub);
      names.push(n);
      unicodes.push(u);
    }
    return [
      names.join('?'),
      unicodes.join('?'),
      []
    ];
  }
  traitementSigne(
    car: string,
    signeDict: Transliteration,
    idx: string,
    i_soussigne: number = 0
  ): Transliteration[] {
    signeDict = { ...signeDict }; // copie
    let compose: string[] = [];
    const listsigne: any[] = [];

    
    if (car=="/") { // Si le caractère est /
      signeDict['nonsigne']=true;
      signeDict["valeurphon"] = car;
    } else if (/^[\/xXoO]+$/.test(car)) { // Si le caractère est x, X, o, O
      for (let i_soussignet = 0; i_soussignet < car.length; i_soussignet++) {
        let symbolcar = car[i_soussignet];
        let subSigneDict = { ...signeDict };
        subSigneDict["signe"] = subSigneDict["valeurphon"] = symbolcar.toLowerCase();
        subSigneDict["id_signe"] = `${idx}_${i_soussignet}_0`;
        listsigne.push(subSigneDict);
      }
    } else if (// Cas des digrammes spécifiques
      car.length >= 2 &&
      ["PN", "NP", "NG", "GN", "ND", "DN", "NR", "NM"].includes(car.slice(0, 2))
    ) {
      signeDict["signe"] = "x";
      signeDict["valeurphon"] = car;
    } else if (this.valeursPhonetiques[car.toLowerCase().replace("ḫ", "h")]) { // Cas où le signe est dans valeurs_phonetiques
      signeDict["valeurphon"] = car;
      const Borger = this.valeursPhonetiques[car.toLowerCase().replace("ḫ", "h")];
      signeDict["signe_Borger"] = Borger;
      if (!Borger.startsWith("c")) {
        const [signe,unicode,_] = this.rechercheSigne(this.signesSimples, Borger);
        signeDict["signe"] = signe;
        signeDict["signe_Unicode"] = unicode;
      } else {
        const [signe,unicode,compose_t] = this.rechercheSigne(this.signesComposes, Borger);
        signeDict["sub_signe"] = signe;
        signeDict["sub_signe_Unicode"] = unicode;
        compose=compose_t
      }
    } else {// Autres cas : erreurs, nombres, fractions
      signeDict["valeurphon"] = car;
      if (car.endsWith("ₓ")) {
        signeDict["signe"] = "x";
      } else if (car === car.toUpperCase()) {
        signeDict["signe"] = "?sumerogramme?";
      } else if (/^\d+$/.test(car)) {
        signeDict["signe"] = "number";
      } else if (/^[\d\/]+$/.test(car)) {
        signeDict["signe"] = "fraction";
      } else {
        signeDict["signe"] = "?erreur?";
      }
    }
    
    // Correction
    if (signeDict["corrige"]) {
      signeDict["signecorrige"] = signeDict["signe"];
      signeDict["signecorrige_Borger"] = signeDict["signe_Borger"];
      signeDict["signecorrige_Unicode"] = signeDict["signe_Unicode"];
      signeDict["signe"] = "x";
      signeDict["signe_Borger"] = signeDict["signe_Unicode"] = "";
      compose.length = 0;
    }

    // Gestion des sous-composés
    if (compose.length) {
      compose.forEach((subBorger, increment) => {
        let subSigneDict = { ...signeDict };
        subSigneDict["id_signe"] = `${idx}_${increment}_0`;
        subSigneDict["signe_Borger"] = subBorger;
        let [signe,unicode,_] = this.rechercheSigne(this.signesSimples, subBorger);
        subSigneDict["signe"] = signe;
        subSigneDict["signe_Unicode"] = unicode;
        listsigne.push(subSigneDict);
      });
    } else if (!listsigne.length) {
      signeDict["id_signe"] = `${idx}_${i_soussigne}_0`;
      listsigne.push(signeDict);
    }
    if (this.debutmot) {
      listsigne[0].dansmot=false
    this.debutmot=false}
    return listsigne;
  }

  debutmot:boolean=false
transcriptionVersTransliterationJSON(
    trscr: string,
    iLigne: string = "",
  ): Transliteration[] {
    // Nettoyage
    trscr = trscr.replace(/’/g, "'"); // uniformisation
    trscr = trscr.replace(/À/g, "À");
    trscr = trscr.replace(/Í/g, "Í");
    trscr = trscr.replace(/\(na\)₄/g, "(na₄)");
    trscr = trscr.replace(/NA≤₄≥/g, "NA₄");
    trscr = trscr.replace(/⸢U⸣₄/g, "⸢U₄⸣");
    trscr = trscr.replace(/ṭe-₄/g, "ṭe₄");
    trscr = trscr.replace(/\(ku\)₆/g, "(ku₆)");
    trscr = trscr.replace(
      /⸢É \(d\)⸣na-na-a.ŠÈ⸣ \[I.NI.IN\]\.⸢KU₄.RE.E\[N/g,
      "⸢É (d)na-na-a.ŠÈ⸣ [I.NI.IN].⸢KU₄.RE.E⸣[N]"
    );
    trscr = trscr.replace(/i\(₇\)/g, "(i₇)");
    trscr = trscr.replace(/⸢Š⸣/g, "[Š]");
    trscr = trscr.replace(/≥DUG≤/g, "≤≤DUG≥≥");
    trscr = trscr.replace(/≤≤/g, "⟨");
    trscr = trscr.replace(/≥≥/g, "⟩");
    // Ajoute un tiret après les indices pas suivi d'autre indice
    trscr = trscr.replace(/([₀₁₂₃₄₅₆₇₈₉ₓ])([^₀₁₂₃₄₅₆₇₈₉ₓ ])/g, "$1-$2");
    // Remplacer certains séparateurs par un espace
    trscr = trscr.replace(/[\xa0…\\✓●]/g, " ");
    // Libérer les symboles !, ?, sic des parenthèses
    trscr = trscr.replace(/\(\s*!\s*\)/g, "!-");
    trscr = trscr.replace(/\(\s*\?\s*\)/g, "?-");
    trscr = trscr.replace(/\(\s*sic\s*\)/gi, "σ-");
    // Supprimer certains symboles
    trscr = trscr.replace(/[°*]/g, "");
    // Espacer les barres de retour ligne
    trscr = trscr.replace(/\/(?!\d)/g, " / ");
    trscr = trscr.replace(/(?<!\d)\//g, " / ");
    // Transformer certaines parenthèses en guillemets
    trscr = trscr.replace(/\(([^) ]* [^)]*)\)/g, "«$1»");
    trscr = trscr.replace(/\(([^)«]*)»([^»]*)\)/g, "($1)$2»");
    // Ajouter balises manquantes
    for (let [baliseOuvrante, baliseFermante] of Object.entries(this.baliseDictO2F)) {
      let difference = (trscr.match(new RegExp(this.escapeRegExp(baliseFermante), "g")) || []).length -
                      (trscr.match(new RegExp(this.escapeRegExp(baliseOuvrante), "g")) || []).length;
      for (let i = 0; i < Math.max(0, difference); i++) {
        trscr = baliseOuvrante + trscr;
      }
      difference *= -1;
      for (let i = 0; i < Math.max(0, difference); i++) {
        trscr += baliseFermante;
      }
    }
    // Supprimer toutes les notes
    trscr = trscr.replace(/«[^«»]*»/g, "");
    trscr = trscr.replace(/«[^«»]*»/g, ""); // deuxième passe pour s'assurer

    const signesList: Transliteration[] = [];
    let balisesOuvertesLigne: string[] = [];
    let iMot = 0;
    let iSigne = 0;
    // Pour chaque "mot" dans la ligne
    for (let mot of trscr.split(/\s+/)) {
      if (mot.trim() === "") {
        // Passer les mots vides (résultat de double espace ou autre)
        continue;
      }
      // Calculer balises internes et fermer balises à la fin
      let balisesMot: string[] = Array.from(mot).filter(char => this.baliseList.includes(char));
      // Restituer les balises ouvertes au début du mot
      mot = balisesOuvertesLigne.join("") + mot;
      // Ajouter les balises ouvrantes du mot
      balisesOuvertesLigne.push(...balisesMot.filter(bal => this.baliseOuvranteList.includes(bal)));
      // Fermer les balises fermantes du mot
      let balisesFermeesMot = balisesMot.filter(bal => this.baliseFermanteList.includes(bal));
      for (let baliseFermee of balisesFermeesMot) {
        let index = balisesOuvertesLigne.indexOf(this.baliseDictF2O[baliseFermee]);
        if (index !== -1) {
          balisesOuvertesLigne.splice(index, 1);
        }
      }
      // Ajouter balises à fermer à la fin du mot
      let balisesAFermer = balisesOuvertesLigne
        .map(bal => this.baliseDictO2F[bal])
        .filter(bal => !balisesFermeesMot.includes(bal));
      mot += balisesAFermer.join("");
      // Adaptation du mot pour préparation à séparation en signes
      let motMod = mot.replace(/[.,+\-:]/g, " ");
      motMod = motMod.replace(/(?<! )([⸢≤{\(⟨«])/g, " $1").trim(); // espace avant balise ouvrante
      motMod = motMod.replace(/([⸣≥}\)⟩»])(?! )/g, "$1 ").trim(); // espace après balise fermante
      // Rétablissement de certains éléments du mot
      mot = mot.replace(/!/g, "(!)").replace(/\?/g, "(?)").replace(/σ/g, "(sic)");
      // Vérification si le mot contient des lettres ou signes particuliers
      if (/[šḫṭṣśʾáàéèíìúùa-z0-9]/i.test(mot)) {
        iMot += 1;
      }

      let balisesOuvertesMot: string[] = [];
      const listelement: string[] = motMod.split(/\s+/);
      this.debutmot=true
      for (let element of listelement) {
        if (!element) continue;
        let signeDict=this.creeTransliterationVide(mot);

        // Analyse des groupes dans le mot
        let elementAnalyse: string[] = element
          .toLowerCase()
          .replace(/[šḫṭṣśʾáàéèíìúùa-z0-9\/:'öüäïßâêîô×½⅓⅔¼⅙⅚;=ₓ₀₁₂₃₄₅₆₇₈₉]+/g, " v ")
          .replace(/[σ!\?]/g, "")
          .trim()
          .split(/\s+/);
        let balisesDebutSigne = "";
        let balisesFinSigne = "";
        if (elementAnalyse.length === 1) {
          if (elementAnalyse[0] !== "v") {
            // le groupe n'est pas composé de lettres → balise
            balisesDebutSigne = element;
            let caractereEtranger = Array.from(element).filter(b => !this.baliseList.includes(b));
            if (caractereEtranger.length) {
              console.warn(`Présence incomprise de '${caractereEtranger.join("")}' au sein de '${element}' du mot ${mot}`);
            }
          }
        } else {
          // Plusieurs groupes
          let elementAnalyseStr = elementAnalyse.slice(1, -1).join(" ");

          if (elementAnalyseStr.includes("[") && elementAnalyseStr.includes("]")) {
            let countOuvr = (elementAnalyseStr.match(/\[/g) || []).length;
            let countFerm = (elementAnalyseStr.match(/\]/g) || []).length;

            if (countOuvr + countFerm > 2) {
              let indexFerm = elementAnalyseStr.indexOf("]");
              if (elementAnalyseStr.slice(indexFerm).includes("[")) {
                elementAnalyseStr = "⸢" + elementAnalyseStr.replace(/\[/g, "").replace(/\]/g, "") + "⸣";
                if (countOuvr > countFerm) {
                  elementAnalyseStr += "[";
                } else if (countOuvr < countFerm) {
                  elementAnalyseStr = "]" + elementAnalyseStr;
                }
              } else {
                elementAnalyseStr = "[" + elementAnalyseStr.replace(/\[/g, "").replace(/\]/g, "") + "]";
              }
            } else if (elementAnalyse[0].includes("[") && elementAnalyse[elementAnalyse.length - 1].includes("]")) {
              // Si "[dssd]"
              // rien à faire
            } else if (elementAnalyse[0].includes("]") && elementAnalyse[elementAnalyse.length - 1].includes("[")) {
              // Si "]sdfr["
              // rien à faire
            } else {
              let indexCrochet = elementAnalyseStr.indexOf("[");
              if (indexCrochet !== -1 && elementAnalyseStr[indexCrochet] === "[") {
                elementAnalyseStr =
                  elementAnalyseStr.slice(0, indexCrochet) +
                  elementAnalyseStr.slice(indexCrochet).replace("[", "⸢").replace("]", "⸣");
              } else {
                elementAnalyseStr = "]⸢" + elementAnalyseStr.replace("]", "").replace("[", "") + "⸣[";
              }
            }
            elementAnalyse = elementAnalyseStr.split(/\s+/);
          }
          balisesDebutSigne = elementAnalyse[0] !== "v" ? elementAnalyse[0] : "";
          balisesFinSigne = elementAnalyse[elementAnalyse.length - 1] !== "v" ? elementAnalyse[elementAnalyse.length - 1] : "";

          // traiter tous les symboles du milieu
          for (let groupe of elementAnalyse.slice(1, -1)) {
            if (!groupe || groupe === "v") continue;
            for (let balise of groupe) {
              if (balise === "[") {
                balisesFinSigne = "⸣[" + balisesFinSigne;
                balisesDebutSigne += "⸢";
              } else if (balise === "]") {
                balisesDebutSigne += "]⸢";
                balisesFinSigne = "⸣" + balisesFinSigne;
              } else if (this.baliseOuvranteList.includes(balise)) {
                balisesDebutSigne += balise;
              } else if (this.baliseFermanteList.includes(balise)) {
                balisesFinSigne = balise + balisesFinSigne;
              } else {
                console.warn(
                  `Présence incomprise de '${balise}' (${balise.charCodeAt(0)}) au sein de '${element}' du mot ${mot}`
                );
              }
            }
          }
        }
        // retirer toutes les balises pour obtenir le "car" à traiter
        let car = element
          .split("")
          .filter((c) => !this.baliseList.includes(c))
          .join("");

        // Traitement des balises du signe
        [balisesOuvertesMot, signeDict] = this.traitementBalises(
          balisesDebutSigne,
          balisesOuvertesMot,
          signeDict
        );

        if (car !== "" && car !== "0") {
          // gestion des indicateurs spéciaux
          if (car.includes("!")) {
            signeDict.corrige = true;
            car = car.replace("!", "");
          }
          if (car.includes("?")) {
            signeDict.douteux = true;
            car = car.replace("?", "");
          }
          if (car.includes("σ")) {
            signeDict.errone = true;
            car = car.replace("σ", "");
          }
          if (car === "" || car === "0") {
            // si le car devient vide après suppression, ajouter les booléens au précédent signe
            if (signesList.length > 0) {
              signesList[signesList.length - 1].corrige ||= signeDict.corrige;
              signesList[signesList.length - 1].douteux ||= signeDict.douteux;
              signesList[signesList.length - 1].errone ||= signeDict.errone;
            } else {
              console.warn(`Des (!),(?),(sic) en début de ligne`);
            }
          } else if (signeDict.determinatif) {
            if (this.noAkkad.has(car.toLowerCase())) {
              // note, ne rien faire
            } else if (this.listeDeterminatifs.has(car.toLowerCase())) {
              car = car.toLowerCase();
              let listsigne;
              if (car === "i") {
                listsigne = this.traitementSigne(
                  "diš",
                  signeDict,
                  `${iLigne}_${iMot}_${iSigne}`
                );
                listsigne[0].valeurphon = "I";
              } else {
                listsigne = this.traitementSigne(
                  car,
                  signeDict,
                  `${iLigne}_${iMot}_${iSigne}`
                );
              }
              iSigne++;
              signesList.push(...listsigne);
            } else if (car.toUpperCase() === car) {
              // Majuscule, corriger le signe précédent
              let signeCorrige = this.traitementSigne(car, signeDict, "placeholder")[0];
              if (signesList.length === 0) {
                console.warn(
                  `Problème, pas de valeur avant ${signeCorrige.signe} pour remplacer.`
                );
              } else {
                if (!signesList[signesList.length - 1].corrige) {
                  signesList[signesList.length - 1].corrige = true;
                  signesList[signesList.length - 1].signecorrige = signesList[signesList.length - 1].signe;
                  signesList[signesList.length - 1].signecorrige_Borger = signesList[signesList.length - 1].signe_Borger;
                  signesList[signesList.length - 1].signecorrige_Unicode = signesList[signesList.length - 1].signe_Unicode;
                }
                signesList[signesList.length - 1].signe = signeCorrige.signe;
                signesList[signesList.length - 1].signe_Borger = signeCorrige.signe_Borger;
                signesList[signesList.length - 1].signe_Unicode = signeCorrige.signe_Unicode;
              }
            } else {
              // déterminatif inconnu
              let listsigne = this.traitementSigne(
                car,
                signeDict,
                `${iLigne}_${iMot}_${iSigne}`
              );
              iSigne++;
              signesList.push(...listsigne);
            }
          } else {
            if (/^\d+$/.test(car)) {
              // car est un nombre
              const cars = this.nombreToSigne(car);
              cars.forEach((c, i_soussigne) => {
                let subSigneDict = this.traitementSigne(
                  c,
                  signeDict,
                  `${iLigne}_${iMot}_${iSigne}`,
                  i_soussigne
                )[0];
                subSigneDict.signecorrige=c
                signesList.push(subSigneDict);
              });
              iSigne++;
            } else {
              let listsigne = this.traitementSigne(
                car,
                signeDict,
                `${iLigne}_${iMot}_${iSigne}`
              );
              iSigne++;
              signesList.push(...listsigne);
            }
          }
        }

        // Vérification des ligatures
        if (signesList.length >= 2) {
          let lastSigne = signesList[signesList.length - 1];
          let anteLastSigne = signesList[signesList.length - 2];
          let combisigne = `${anteLastSigne.valeurphon}.${lastSigne.valeurphon}`
          let composeTrouve = this.ligatures[combisigne]
          if (composeTrouve && lastSigne.dansmot) {
            let newSigneDict=this.fusionSignes(anteLastSigne,lastSigne)
            newSigneDict.ligature = 1;
            newSigneDict = this.traitementSigne(combisigne.toLowerCase(), newSigneDict, "placeholder")[0];
            newSigneDict.id_signe = anteLastSigne.id_signe;
            newSigneDict.valeurphon = composeTrouve;
            signesList[signesList.length - 2] = newSigneDict;
            signesList.pop(); 
          }
        }
        // Fermer les balises à la fin du mot
        let _signeDict = {} as Transliteration
        [balisesOuvertesMot, _signeDict] = this.traitementBalises(balisesFinSigne, balisesOuvertesMot, {} as Transliteration);

        }
    }
  return signesList;
  }
  fusionSignes(signeDict1:Transliteration, signeDict2:Transliteration):Transliteration {
    const newSigneDict=this.creeTransliterationVide(signeDict1.mot)
    newSigneDict.semicasse = signeDict1.semicasse || signeDict2.semicasse;
    newSigneDict.efface = signeDict1.efface || signeDict2.efface;
    newSigneDict.ajoute = signeDict1.ajoute || signeDict2.ajoute;
    newSigneDict.supprime = signeDict1.supprime || signeDict2.supprime;
    newSigneDict.corrige = signeDict1.corrige || signeDict2.corrige;
    newSigneDict.douteux = signeDict1.douteux || signeDict2.douteux;
    newSigneDict.errone = signeDict1.errone || signeDict2.errone;
    newSigneDict.enmarge = signeDict1.enmarge || signeDict2.enmarge;
    newSigneDict.bizarre = signeDict1.bizarre || signeDict2.bizarre;
    newSigneDict.clonedsigne = signeDict1.clonedsigne;
    newSigneDict.clonesigne = signeDict1.clonesigne;
    newSigneDict.clonedligne = signeDict1.clonedligne;
    newSigneDict.cloneligne = signeDict1.cloneligne;
    if (Number(signeDict1.casse) + Number(signeDict2.casse) === 1) newSigneDict.semicasse = true;
    else if (Number(signeDict1.casse) + Number(signeDict2.casse) === 2) newSigneDict.casse = true;
    newSigneDict.id_signe = signeDict1.id_signe;
    newSigneDict.dansmot = signeDict1.dansmot;
    return newSigneDict
  }

  lignesTranscription (lignesOriginales:any,idxTablette:string):Ligne[] {
    const resultat: Ligne[] = [];
    for(let ligneOriginale of lignesOriginales) {
      let id_ligne=`${idxTablette}_${Number(ligneOriginale.enveloppe)}_${ligneOriginale.emplacement}_${ligneOriginale.colonne}_${ligneOriginale.colonne_prime.length}_${ligneOriginale.ligne}_${ligneOriginale.ligne_prime.length}`
      let newLigne:Ligne ={
        enveloppe : ligneOriginale.enveloppe,
        emplacement: ligneOriginale.emplacement,
        colonne: ligneOriginale.colonne,
        colonne_prime: ligneOriginale.colonne_prime,
        ligne: ligneOriginale.ligne,
        ligne_prime: ligneOriginale.ligne_prime,
        id_ligne: id_ligne,
        transliteration: this.transcriptionVersTransliterationJSON(ligneOriginale.transcription,id_ligne),
      }
      resultat.push(newLigne);
    }
    return resultat
  }
  
}

