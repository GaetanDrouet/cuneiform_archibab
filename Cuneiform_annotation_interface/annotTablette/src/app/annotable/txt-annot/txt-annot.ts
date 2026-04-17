type ModeAffichage = 'signe' | 'unicode' | 'borger' | 'valeurphon';
type ModeAffichage2 = '' | 'signe' | 'unicode' | 'borger' | 'valeurphon';

import { Component, Input, Output,EventEmitter, ChangeDetectorRef, OnChanges, SimpleChanges  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Transliteration,Signe,Ligne } from '../data.model';
import { TransliterationService } from '../transliteration-service/transliteration-service';

@Component({
  selector: 'app-txt-annot',
  imports: [CommonModule,FormsModule],
  templateUrl: './txt-annot.html',
  styleUrl: './txt-annot.less',
})
export class TxtAnnot {
  @Input() height: number = 100;
  @Input() selectedId!: string;
  @Input() receivedLignes!: Ligne[];
  @Input() selectedImg!: string;
  @Input() selectedRef!: string;
  @Output() annotationSupprimee = new EventEmitter<string>();
  @Output() annotationAttributedSelected = new EventEmitter<string>();
  @Output() annotationValueUpdate = new EventEmitter<Transliteration>();
  lignes: Ligne[] = [];
  selectedSigne: Transliteration | null = null;
  survoledSigne: Transliteration | undefined ;
  cursorSigne: Transliteration | null = null;
  modeAffichage: ModeAffichage = 'signe';
  modeAffichage2: ModeAffichage2 = '';
  //signesComposes: Record<string, any> = {};
  suggestionsCorrection: Signe[] = [];
  insertSpecialSignShow:boolean=false
  queryCorrection = '';
  archibab=true;

  private storageKey(): string {
    return `annot-tablette_${this.selectedId}_${this.selectedImg}_txt`;
  }

  constructor(
    private cd: ChangeDetectorRef,
    private router: Router,
    private transliterationService: TransliterationService,
  ) {}

  ngOnInit() {
    this.transliterationService.loadDictionaries()  
    const m1 = localStorage.getItem('annot-tablette_modeAffichage');
    const m2 = localStorage.getItem('annot-tablette_modeAffichage2');
    if (m1 !== null) this.modeAffichage = m1 as ModeAffichage;
    if (m2 !== null) this.modeAffichage2 = m2 as ModeAffichage2;
  }

  idEnFichier(id: string): string {
    // Convertit l'entier en string, complété avec des zéros à gauche pour faire 6 chiffres
    const str = id.padStart(6, '0');
    return `${str}.json`;
  }

  //Sauvegarde
  sauvegarderLocal() {
    if (!this.lignes.length) return;

    localStorage.setItem(
      this.storageKey(),
      JSON.stringify(this.lignes)
    );

    console.debug('Tablette sauvegardée localement');
  }
  //Suppression de sauvegarde
  resetSauvegarde() {
    localStorage.removeItem(this.storageKey());
    this.chargerFichier();
  }
  goTexte() { // aller au texte / sa page Archibab
    this.router.navigate(['texte', this.selectedId]);
  }
  importerSignes(signes:{id:string,value:string}[]) {
    const lignesReclonees:string[]=[]
    this.resetSauvegarde()
    for (let newsigne of signes) {
      let id=newsigne.id
      let idDoublon = Number(id[id.length - 1])
      let idLigne=id.split("_").slice(0, 7).join("_")
      if ([2,3].includes(idDoublon) && !lignesReclonees.includes(idLigne)) {
        let idOriginale=id.slice(0, id.lastIndexOf("_") + 1) + "0"
        this.cloneLigne(this.signeDepuisId(idOriginale)!)
        lignesReclonees.push(idLigne)
      }
      if ([1,3].includes(idDoublon)) {
        let idOriginale=this.incrementLastId(id,-1,-1)
        this.cloneSigne(this.signeDepuisId(idOriginale)!)
      }
      let signe=this.signeDepuisId(id)!
      signe.attributed=true
      let value=newsigne.value.split("_")
      let valphon=value[3]
      if (valphon.includes("(!)")) {
        signe.corrige=true
        valphon=valphon.replace("(!)","")
        if (!signe.signecorrige) {
          signe.signecorrige=signe.signe
          signe.signecorrige_Borger=signe.signe_Borger
          signe.signecorrige_Unicode=signe.signe_Unicode
        }
      }
      if (valphon.includes("}")) {
        signe.efface=true
        valphon=valphon.replace("}","").replace("{","")
      }
      if (valphon.includes("⧚")) {
        signe.bizarre=true
        valphon=valphon.replace("⧚","").replace("⧛","")
      }
      if (valphon.includes("⸣")) {
        signe.semicasse=true
        valphon=valphon.replace("⸣","").replace("⸢","")
      }
      if (valphon.includes("⟩")) {
        signe.enmarge=true
        valphon=valphon.replace("⟩","").replace("⟨","")
      }
      let borger=value[1]
      if (borger!==signe.signe_Borger) {
        signe.signe=value[0]
        signe.signe_Unicode=value[2]
        signe.signe_Borger=borger
      }
    }
    this.initialiserSelection()
    this.sauvegarderLocal()
  }


  //chercher le premier signe valide
  getPremierSigneValide(): Transliteration | null {
    const signes = this.lignes.flatMap(l => l.transliteration);
    return signes.find(s => !s.casse && !s.attributed && !s.ajoute) || null;
  } 
  private initialiserSelection() {
    const premier = this.getPremierSigneValide();
    if (premier) {
      this.selectSigne(premier);
      this.cd.detectChanges();
    }
  }
  chargerFichier() {
    const key = this.storageKey();
    const saved = localStorage.getItem(key);

    if (saved && this.selectedImg!=="") {
      // 🔁 Chargement depuis le localStorage
      this.lignes = JSON.parse(saved);
      if (this.lignes.length && this.lignes[0].transliteration[0].dansmot) {
        this.lignes=this.correctionCoupureMot(this.lignes)
        this.sauvegarderLocal()
      }
      this.initialiserSelection();
      console.debug('Tablette chargée depuis localStorage');
    } else if (this.receivedLignes!==undefined) {
        this.lignes=structuredClone(this.receivedLignes)
        this.initialiserSelection();
        console.debug('Tablette chargée depuis Archibab');
    }
    if (this.lignes.length) {
      this.selectSigne(this.getPremierSigneValide()!)
    }
    return;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedImg'] || changes['selectedId']) {
      this.chargerFichier();
    }
  }

  correctionCoupureMot(lignes:Ligne[]):Ligne[] { //Fonction pour corriger les précédentes sauvegarde
    let transf=true
    for(let i = 0; i < lignes.length; i++) {
      transf=true
      for (let j = 0; j < lignes[i].transliteration.length; j++) {
        if (lignes[i].transliteration[j].dansmot==false && transf) {
        } else if (transf) {
          lignes[i].transliteration[j].dansmot=false
          transf=false
        } else if (lignes[i].transliteration[j].dansmot==false) {
          lignes[i].transliteration[j].dansmot=true
          transf=true
        }
      }
    }
    return lignes
  }

  signeDepuisId(id: string) {
    return this.lignes
      .flatMap(ligne => ligne.transliteration)
      .find(translit => translit.id_signe === id);
  }
  selectSigne(signe: Transliteration|null,emission:boolean=true) {
    if (!signe) {
      this.selectedSigne=this.lignes[0].transliteration[0]
      this.annotationAttributedSelected.emit("no more")
      return
    }
    if (emission) {
      if (signe.attributed) {
        this.annotationAttributedSelected.emit(signe.id_signe)
      }else{
        this.annotationAttributedSelected.emit("")
      }
    }
    if (!signe.attributed) {
      this.cursorSigne = signe
      this.selectedSigne = signe
    } else if (!this.cursorSigne || this.cursorSigne.attributed) {
      let newsigne = this.getPremierSigneValide()
      this.cursorSigne = this.selectedSigne = newsigne
      if (!this.selectedSigne) {
        this.selectedSigne = signe
        this.annotationAttributedSelected.emit("no more")
      }
    } else {
      this.selectedSigne = signe
    };
  }
  pointToSigne(id:string) {
    const btn = document.getElementById(id);
    if (btn) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  toggleCursor() {
  if (!this.selectedSigne || this.selectedSigne.attributed) return;
  this.cursorSigne = this.selectedSigne;
  }
  incrementLastId(id_signe: string,emplacement:number,increment:number): string {
    const parts = id_signe.split('_');
    const last = parts[emplacement>=0 ? emplacement : parts.length+emplacement];
    const incremented = (parseInt(last, 10) + increment).toString();
    parts[emplacement>=0 ? emplacement : parts.length+emplacement] = incremented;
    return parts.join('_');
  }
  cloneSigne(ancienSigne:Transliteration) {
  if (!ancienSigne) return; // rien à cloner
  // Crée un clone basé sur selectedSigne
  const nouveauSigne: Transliteration = {
    ...ancienSigne,              // copie toutes les propriétés
    id_signe: this.incrementLastId(ancienSigne.id_signe,-1,1),  // nouveau id unique
    clonesigne: true,  // marque ce signe comme clone
    attributed: false, // il apparaît non-attribué
    dansmot: true,     // il n'ouvre pas de nouveau mot
  };
  // Indiquer le signe sélectionné comme cloné pour empêcher de le refaire
  ancienSigne.clonedsigne=true
  // Cherche la ligne où se trouve selectedSigne
  const ligne = this.lignes.find(l => l.transliteration.includes(ancienSigne!))!;
  const signes = ligne.transliteration
  const i = signes.indexOf(ancienSigne);
// Paramètres pour règles sur le positionnement du clone : 
  const avant = signes[i - 1] ?? null;
  const apres = signes[i + 1] ?? null;
  const isClone = (s: Transliteration | null) => s?.clonesigne === true;
  const isCloned = (s: Transliteration | null) => s?.clonedsigne === true
  let j = i + 1;
// Suite de règles sur le positionnement du clone : 
  // 🔹 Cloné après -> déplacer le placement du clone
  console.log(isCloned(apres))
  if (isCloned(apres)) {
    while (j < signes.length && isCloned(signes[j])) j++;
  }
    // 🔹 Clones avant -> Déplacer les clones avant, et modifier le placement du clone en fonction
  if (isClone(avant)) {
      // 1️⃣ récupérer les clones immédiatement avant
      let start = i - 1;
      while (start >= 0 && isClone(signes[start])) start--;
      start++;
      const clonesAvant = signes.splice(start, i - start);
      // 2️⃣ réinsérer les clones avant
      signes.splice(j - clonesAvant.length, 0, ...clonesAvant);
  }
  //Rajouter le clone
  console.log(j, 0, nouveauSigne)
  signes.splice(j, 0, nouveauSigne);
  // Selectionner le clone
  this.selectSigne(nouveauSigne)
  this.sauvegarderLocal()
  }
  supprimerSigneClone() {
    if (!this.selectedSigne || !this.selectedSigne.clonesigne) return;
    if (this.selectedSigne.attributed) {
      this.annotationSupprimee.emit(this.selectedSigne.id_signe); // annoncer au parent qu'on le supprime
    }
    // Trouver la ligne où se trouve le clone
    const ligne = this.lignes.find(l => l.transliteration.includes(this.selectedSigne!))!;
    // Annuler le statut cloné du signe à l'origine
    const signes= ligne.transliteration
    const originalId = this.incrementLastId(this.selectedSigne.id_signe,-1,-1)
    const originalSigne=signes.find(s => s.id_signe === originalId)!; //! car il y en forcément un
    originalSigne.clonedsigne=false
    // Supprimer le clone de la ligne
    const i = signes.indexOf(this.selectedSigne);
    signes.splice(i, 1);
    // S'il y avait des clonés avant le clone, les déplacer
    const isClone = (s: Transliteration | null) => s?.clonesigne === true;
    const avant = signes[i - 1] ?? null;
    if (isClone(avant)) {
        // 1️⃣ récupérer les clones immédiatement avant
        let start = i - 1;
        while (start >= 0 && isClone(signes[start])) start--;
        start++;
        const clonesAvant = signes.splice(start, i - start);
        // 2️⃣ réinsérer les clones avant le signe origine du clone
        let iOriginalSigne = signes.indexOf(originalSigne)
        signes.splice(iOriginalSigne, 0, ...clonesAvant);
    }
    // Retourner au signe précédent (à l'origine du doublon)
    this.selectSigne(originalSigne);
    this.sauvegarderLocal()
  }
  cloneLigne(ancienSigne:Transliteration) {
    if (!ancienSigne) return; // on sait sur quelle ligne on est via le signe sélectionné
    // Trouver la ligne contenant le signe sélectionné
    const ligneOriginale = this.lignes.find(l => l.transliteration.includes(ancienSigne!))!;
    // Cloner tous les transliterations de la ligne avec de nouveaux id_signe
    const clonedTransliterations: Transliteration[] = ligneOriginale.transliteration.map(t => ({
      ...t,
      id_signe: this.incrementLastId(t.id_signe,-1,2), // nouvel ID
      cloneligne: true,
      attributed: false
    }));
    // Marquer les signes de la ligne originale
    ligneOriginale.transliteration.forEach(t => t.clonedligne = true)
    // Créer la nouvelle ligne clonée
    const nouvelleLigne: Ligne = {
      ...ligneOriginale,
      clone : true, // ou ajuster selon ta logique de numérotation
      transliteration: clonedTransliterations
    };
    // Insérer la ligne clonée juste après l'originale
    const indexLigne = this.lignes.indexOf(ligneOriginale);
    this.lignes.splice(indexLigne + 1, 0, nouvelleLigne);
    // Sélectionner le premier signe de la ligne clonée
    //this.selectSigne(clonedTransliterations[0]);
    // Sauvegarder
    this.sauvegarderLocal();
    console.debug(`Ligne clonée : ${ligneOriginale.ligne} → ${nouvelleLigne.ligne}`);
  }

  supprimerLigneClone() {
    if (!this.selectedSigne) return; // savoir sur quelle ligne on est
    // Trouver la ligne contenant le signe sélectionné
    const ligne = this.lignes.find(l => l.transliteration.includes(this.selectedSigne!))!;
    // Vérifier que la ligne est bien un clone (tous les signes clonés)
    for (const signe_supprime of ligne.transliteration) {
      if (signe_supprime.attributed) {
        this.annotationSupprimee.emit(signe_supprime.id_signe);
      }
    }
    const estClone = ligne.transliteration.every(t => t.cloneligne);
    if (!estClone) {
      console.warn('Cette ligne n’est pas un clone et ne peut pas être supprimée avec cette fonction.');
      return;
    }
    // Sélectionner un signe proche pour ne pas perdre le focus
    this.selectSigne(this.ligneprecedente(this.selectedSigne))
    // Supprimer la ligne
    const indexLigne = this.lignes.indexOf(ligne);
    this.lignes.splice(indexLigne, 1);
    // Annule le statut de cloné des précédents signes
    if (indexLigne > 0) {
      const ligneOriginale = this.lignes[indexLigne - 1];
      ligneOriginale.transliteration.forEach(t => t.clonedligne = false);
    }
    // Sauvegarder les changements
    this.sauvegarderLocal();
    console.debug(`Ligne clonée supprimée : ${ligne.ligne}`);
  }
  signeprecedent(signe:Transliteration):Transliteration {
    const ligne = this.lignes.find(l => l.transliteration.includes(signe!))!;
    const i = ligne.transliteration.indexOf(signe);
    if (i > 0) {
      return ligne.transliteration[i - 1];
    }
    return this.ligneprecedente(signe); 
  }
  signesuivant(signe:Transliteration):Transliteration {
    const ligne = this.lignes.find(l => l.transliteration.includes(signe!))!;
    const i = ligne.transliteration.indexOf(signe);
    if (i < ligne.transliteration.length-1) {
      return ligne.transliteration[i + 1];
    } 
    return this.lignesuivante(signe); 
  }
  lignesuivante(signe:Transliteration):Transliteration {
    const ligne = this.lignes.find(l => l.transliteration.includes(signe!))!;
    const i = this.lignes.indexOf(ligne);
    if (i < this.lignes.length-1) {
      return this.lignes[i+1].transliteration[0];
    } 
    return ligne.transliteration[ligne.transliteration.length-1]
  }
  ligneprecedente(signe:Transliteration):Transliteration {
    const ligne = this.lignes.find(l => l.transliteration.includes(signe!))!
    const i = this.lignes.indexOf(ligne);
    if (i > 0) {
      const lignerenvoye=this.lignes[i-1]
      return lignerenvoye.transliteration[lignerenvoye.transliteration.length-1];
    } 
    return ligne.transliteration[0]
  }

  attribuerLibrement(id:string):boolean {
    const signeAttribue=this.signeDepuisId(id)
    if (!signeAttribue || signeAttribue.attributed) {
      return false
    } else {
      signeAttribue.attributed=true
      if (this.cursorSigne==signeAttribue) {
        this.cursorSigne=this.getPremierSigneValide()
        this.sauvegarderLocal
        this.cd.detectChanges()
      }
      return true
    }
  }
  attribuerEtAvancer() {
    if (!this.cursorSigne) return; // rien à faire si aucun curseur
    // 1️⃣ Marquer le signe actuel comme attributed
    this.cursorSigne.attributed = true;
    this.sauvegarderLocal();
    // 2️⃣ Chercher le signe suivant valide
    let oldselection=this.cursorSigne
    let newselection=this.signesuivant(oldselection)
    while (newselection!=oldselection && (newselection.casse || newselection.attributed || newselection.ajoute)) {
      oldselection=newselection
      newselection=this.signesuivant(oldselection)
    }
    this.selectSigne(newselection,false)
  }
  desattribuer(id:string, librement:boolean=false) {
    let signe=this.signeDepuisId(id)
    if (!signe || !signe.attributed) {
      return false
    } else {
      signe.attributed=false
      console.debug(`Signe ${id} marqué comme non attribué`);
      if (!librement) {
        this.selectSigne(signe)
      }
      this.sauvegarderLocal()
      return true
    }
  }

  get signesChoices(): {signe: string;signe_Unicode: string;signe_Borger: string;}[] | null {
    if (!this.selectedSigne?.signe_Unicode) return null;
    // Si unicode contient "?", on le split pour afficher le choix
    if (this.selectedSigne.signe_Borger.includes("?")) {
      const choicesBorger= this.selectedSigne.signe_Borger.split("?");
      const resultat:{signe: string;signe_Unicode: string;signe_Borger: string;}[]=[]
      for (let choiceBorger of choicesBorger) {
        let choice=this.transliterationService.signesSimples[choiceBorger]
        resultat.push({signe:choice.name, signe_Unicode:choice.unicode, signe_Borger:choiceBorger});
      }
      return resultat;
    }
    return null; // pas de choix
  }
  choisirSigne(choice: Signe) {
    if (this.selectedSigne) {
      this.selectedSigne.signecorrige = this.selectedSigne.signe
      this.selectedSigne.signe = choice.signe;
      this.selectedSigne.signe_Unicode = choice.signe_Unicode;
      this.selectedSigne.signe_Borger = choice.signe_Borger;
      this.updateValue(this.selectedSigne)
    }
  }

  rechercherSignesCorrection() {
    const q = this.queryCorrection.trim().toLowerCase();
    if (!q) {
      this.suggestionsCorrection = [];
      this.insertSpecialSignShow=false
      return;
    }
    let mode:string
    if (/[\u12000-\u1254F]/.test(this.queryCorrection)) mode='unicode';
    if (/^[0123456789]+$/.test(this.queryCorrection)) mode='borger';
    else mode='latin';
    let filteredSuggestions = this.transliterationService.mapSignesSimples
      .filter(s => {
        switch (mode) {
          case 'unicode':
            return s.signe_Unicode.startsWith(q);
          case 'borger':
            return s.signe_Borger.startsWith(q);
          default:
            return s.signe.startsWith(q.toUpperCase());
        }
      })
    // tri par longueur croissante
    filteredSuggestions.sort((a, b) => {
      const aVal = mode === 'borger' ? a.signe_Borger :
                  mode === 'unicode' ? a.signe_Unicode :
                  a.signe;
      const bVal = mode === 'borger' ? b.signe_Borger :
                  mode === 'unicode' ? b.signe_Unicode :
                  b.signe;
      return aVal.length - bVal.length; // plus court en premier
    });
    // prendre les 8 premiers
    this.suggestionsCorrection = filteredSuggestions.slice(0, 8);
    this.insertSpecialSignShow=true
  }
  selectionnerSigneCorrection(ref: Signe) {
    if (!this.selectedSigne) return;

    if (this.selectedSigne.signecorrige){
      if (this.selectedSigne.signecorrige == ref.signe) {
        this.selectedSigne.corrige = false
        this.selectedSigne.signecorrige = "";
        this.selectedSigne.signecorrige_Unicode = "";
        this.selectedSigne.signecorrige_Borger = "";
      }else{}
    } else {
      this.selectedSigne.corrige=true
      this.selectedSigne.signecorrige = this.selectedSigne.signe;
      this.selectedSigne.signecorrige_Unicode = this.selectedSigne.signe_Unicode;
      this.selectedSigne.signecorrige_Borger = this.selectedSigne.signe_Borger;
    }
      this.selectedSigne.signe = ref.signe;
      this.selectedSigne.signe_Unicode = ref.signe_Unicode;
      this.selectedSigne.signe_Borger = ref.signe_Borger;

    this.queryCorrection = "";
    this.suggestionsCorrection = [];

    this.updateValue(this.selectedSigne);
    this.insertSpecialSignShow=false
  }

  specialSigns: string[] = ['Š','Ṣ','Ṭ','Á','À','É','È','Í','Ì','Ú','Ù','₁','₂','₃','₄','₅','₆','₇','₈','₉','₀'];
  insertSpecialSign(char: string, input: HTMLInputElement) {
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const current = input.value;
    // Insère le caractère à la position du curseur
    input.value = current.slice(0, start) + char + current.slice(end);
    // Met à jour le ngModel
    this.queryCorrection = input.value;
    // Repositionne le curseur juste après le caractère ajouté
    input.setSelectionRange(start + char.length, start + char.length);
    // Focus pour pouvoir continuer à taper
    input.focus();
    this.rechercherSignesCorrection()
  }
  ligature(signe:Transliteration) {
    if (signe.deligaturede) {
      this.religature(signe)
    } else {
      this.ligatureforcee(signe)
    }
  }
  ligatureforcee(signe:Transliteration) {
    let preced=this.signeprecedent(signe)
    const newpreced=this.transliterationService.fusionSignes(preced,signe)
    if (signe.sub_signe=="" || signe.id_signe.split('_')[9]=="0") {
      newpreced.valeurphon=`${preced.valeurphon}.${signe.valeurphon}`
    } else {
      newpreced.valeurphon=preced.valeurphon
    }
    newpreced.signe=`${preced.signe}-${signe.signe}`
    newpreced.signe_Borger=`${preced.signe_Borger}₊${signe.signe_Borger}`
    newpreced.signe_Unicode=`${preced.signe_Unicode}${signe.signe_Unicode}`;
    (newpreced.ligatureforce ??= []).push(signe.id_signe);
    newpreced.attributed=preced.attributed
    const ligne = this.lignes.find(l => l.transliteration.includes(signe!))!;
    const signes = ligne.transliteration
    const i = signes.indexOf(preced);
    signes[i]=newpreced
    signes.splice(i+1, 1)
  }
  religature(signe:Transliteration) {
    const ligne = this.lignes.find(l => l.transliteration.includes(signe!))!;
    const signes = ligne.transliteration;
    let signesALier=signes.filter(s => s.deligaturede === signe.deligaturede);
    const signes_blocage = signesALier.filter(s => s.attributed && s.id_signe!=signe.deligaturede)
    if (signes_blocage.length) {return}
    const trueSigne=signesALier[0]
    signesALier.splice(0,1)
    signesALier.forEach(signe_a_supprime => {
      const j = signes.indexOf(signe_a_supprime);
      signes.splice(j,1)
    });
    const j = signes.indexOf(trueSigne);
    trueSigne.deligaturede=undefined
    signes[j]=trueSigne
    this.resetSigne(signes[j])
    this.updateValue(trueSigne)
  }
  deligaturer_siforce(signe:Transliteration) {
    const ligne = this.lignes.find(l => l.transliteration.includes(signe!))!;
    const signes = ligne.transliteration
    const j = signes.indexOf(signe);
    const signes_a_retablir=signe.ligatureforce!
    signe.ligatureforce=undefined
    for (let i = 1; i <= signes_a_retablir.length; i++) {
      let signe_retabli={ ...signe};
      signe_retabli.id_signe=signes_a_retablir[i-1];
      signe_retabli.attributed=false
      this.resetSigne(signe_retabli,false);
      signes.splice(j + i, 0, signe_retabli);
    }
    this.resetSigne(signe,false)
    this.updateValue(signe)
  }
  deligaturer(signe:Transliteration) {
    if (signe.ligatureforce?.length) {
      this.deligaturer_siforce(signe)
    } else {
      const ligne = this.lignes.find(l => l.transliteration.includes(signe!))!;
      const signes = ligne.transliteration
      const j = signes.indexOf(signe);
      const valeursphons=this.transliterationService.antiLigatures[signe.valeurphon].split(".")
      const nb_signes_ligatureconnue=signe.ligature
      const nb_signes_ligatureinconnue=valeursphons.length-1-signe.ligature
      signe.ligature=0
      signe.deligaturede=signe.id_signe
      for (let i = 1; i <= nb_signes_ligatureinconnue; i++) {
        let nouveauSigne=this.transliterationService.traitementSigne(valeursphons[i],{ ...signe},"x",0)[0]
        nouveauSigne.dansmot=true
        nouveauSigne.attributed=false
        nouveauSigne.id_signe=this.incrementLastId(signe.deligaturede,-2,i)
        signes.splice(j + i, 0, nouveauSigne);
      }
      for (let ii = 1; ii <= nb_signes_ligatureconnue; ii++) {
        let i = ii+nb_signes_ligatureinconnue
        let nouveauSigne=this.transliterationService.traitementSigne(valeursphons[i],{ ...signe},"x",0)[0]
        nouveauSigne.dansmot=true
        nouveauSigne.attributed=false
        nouveauSigne.id_signe=this.incrementLastId(signe.deligaturede,-3,ii)
        signes.splice(j + i, 0, nouveauSigne);
      }
      let nouveauSigne=this.transliterationService.traitementSigne(valeursphons[0],{ ...signe},"x",0)[0]
      signe.signe=nouveauSigne.signe
      signe.signe_Borger=nouveauSigne.signe_Borger
      signe.signe_Unicode=nouveauSigne.signe_Unicode
      signe.valeurphon=valeursphons[0]
      this.updateValue(signe)
    }
  }

  resetSigne (signe:Transliteration|null, save:boolean=true) {
    if (!signe) return;
    const idtrue=signe.id_signe;
    let ideff=idtrue
    let idindex:string
    let deligature=signe.deligaturede
    if (signe.ligatureforce?.length) {this.deligaturer_siforce(signe)}
    if (deligature) {ideff=deligature}
    if (signe.clonesigne||signe.cloneligne) {
      idindex=signe.id_signe.slice(0, signe.id_signe.lastIndexOf("_") + 1) + "0"
      if (signe.clonesigne) {signe.dansmot=true}
    }else{
      idindex=ideff
    }
    let original  = this.receivedLignes
      .flatMap(ligne => ligne.transliteration)
      .find(translit => translit.id_signe === idindex);
    if (!original) return;
    if (deligature) {
      const ligne = this.lignes.find(l => l.transliteration.includes(signe!));
      const signes = ligne!.transliteration
      const i = signes.indexOf(signe)-signes.indexOf(this.signeDepuisId(deligature)!);
      original=this.transliterationService.traitementSigne(this.transliterationService.antiLigatures[original.valeurphon].split(".")[i],{ ...original},"x",0)[0]
      }
    signe.signe=original.signe;
    signe.signe_Borger=original.signe_Borger;
    signe.signe_Unicode=original.signe_Unicode;
    signe.valeurphon=original.valeurphon;
    signe.signecorrige=original.signecorrige;
    signe.signecorrige_Borger=original.signecorrige_Borger;
    signe.signecorrige_Unicode=original.signecorrige_Unicode;
    signe.sub_signe=original.sub_signe;
    signe.sub_signe_Borger=original.sub_signe_Borger;
    signe.sub_signe_Unicode=original.sub_signe_Unicode;
    signe.ligature=original.ligature;
    signe.casse=original.casse;
    signe.semicasse=original.semicasse;
    signe.efface=original.efface;
    signe.corrige=original.corrige;
    signe.enmarge=false
    signe.bizarre=false
    signe.ligatureforce=undefined
    signe.id_signe=idtrue;
    if (save) {
      this.updateValue(signe)
    }
  }

  updateValue(signe:Transliteration) {
    this.sauvegarderLocal(); 
    this.annotationValueUpdate.emit(signe);
  }

  baliseDebutSigne(s: Transliteration): string {
    let valeur = "";
    if (s.determinatif) {
      valeur = `(${valeur}`;}
    if (s.efface) {
      valeur = `{${valeur}`;}
    if (s.bizarre) {
      valeur = `⧛${valeur}`;}
    if (s.ajoute) {
      valeur = `≤${valeur}`;}
    if (s.supprime) {
      valeur = `≤≤${valeur}`;}
    if (s.semicasse) {
      valeur = `⸢${valeur}`;
    } else if (s.casse) {
      valeur = `[${valeur}`;}
    if (s.enmarge) {
      valeur = `⟨${valeur}`;}
    return valeur;
  }
  baliseFinSigne(s: Transliteration): string {
  let valeur = "";
  if (s.errone) {
    valeur = `${valeur}(sic)`;}
  if (s.corrige) {
    valeur = `${valeur}(!)`;}
  if (s.douteux) {
    valeur = `${valeur}(?)`;}
  if (s.determinatif) {
    valeur = `${valeur})`;}
  if (s.efface) {
    valeur = `${valeur}}`;}
  if (s.bizarre) {
    valeur = `${valeur}⧚`;}
  if (s.ajoute) {
    valeur = `${valeur}≥`;}
  if (s.supprime) {
    valeur = `${valeur}≥≥`;}
  if (s.semicasse) {
    valeur = `${valeur}⸣`;
  } else if (s.casse) {
    valeur = `${valeur}]`;}
  if (s.enmarge) {
    valeur = `${valeur}⟩`;
  }
  return valeur;
  }
  affichageSigne(s: Transliteration, sAffiche: string): string {
    return `${this.baliseDebutSigne(s)}${sAffiche}${this.baliseFinSigne(s)}`;
  }
  lienSigne(s: Transliteration): string {;
    if (this.modeAffichage2!== ''){
        return s.dansmot ? '--' : '\u00A0\u00A0\u00A0\u00A0';
    } else if (this.modeAffichage==='unicode'){
        return s.dansmot ? '' : '\u00A0\u00A0\u00A0';
    } else if (this.modeAffichage==='borger'){
        return s.dansmot ? '-' : '\u00A0\u00A0';
    } else if (this.modeAffichage==='valeurphon'){
        return s.dansmot ? '-' : '\u00A0\u00A0';
    } else {
        return s.dansmot ? '-' : '\u00A0\u00A0';}
  }

  formatSigne(s: Transliteration,modeAffichage:string): string {
    switch (modeAffichage) {
      case '':
        return '';
      case 'unicode':
        return s.signe_Unicode || '—';
      case 'borger':
        return s.signe_Borger || '—';
      case 'valeurphon':
        if (s.sub_signe=="" || s.id_signe.split('_')[9]=="0") {return s.valeurphon || '—';}
        else {return "⤶"}
      case 'signe':
      default:
        return s.signe || '—';;
    }
  }
  onModeChange() {
    localStorage.setItem(
      `annot-tablette_modeAffichage`,
      this.modeAffichage
    );
  }
  onMode2Change() {
    localStorage.setItem(
      `annot-tablette_modeAffichage2`,
      this.modeAffichage2
    );
  }
}

