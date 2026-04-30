import { Component, signal, ViewChild, ElementRef, ChangeDetectorRef, Input, HostListener  } from '@angular/core';
import { TabSelect } from '../tab-select/tab-select' ;
import { ImgAnnot } from '../img-annot/img-annot' ;
import { TxtAnnot } from '../txt-annot/txt-annot' ;
import { TransliterationService } from '../transliteration-service/transliteration-service';
import { FormsModule } from '@angular/forms';
import { OnLocal } from '../on-local/on-local';


@Component({
  selector: 'annotTablette',
  imports: [TabSelect,TxtAnnot,ImgAnnot,FormsModule],
  templateUrl: './annot-tablette.html',
  styleUrl: './annot-tablette.less'
})
export class AnnotTablette {
  protected readonly title = signal('annotTablette');
  @Input () id_from_text !: number;
  _isLoggedIn !: boolean;
  selectedId: string = "";
  selectedRef !: string;
  lignestranscription : any
  selectedImage: string = "";
  selectedCreator:{id:string,name:string} = {id: "",name: ""}
  tempCreator:{id:string,name:string} = {id: "",name: ""}
  guideActive:boolean=false;
  showAnnotateurModal:boolean = false; //montrer choix d'annotateur (que si on n'est pas déjà sur Acrhibab)
  creatorIsEditable:boolean=true;
  modeEdition: boolean = false
  disableChangeMode:boolean=false;
  undoStack:any[]=[]
  redoStack:any[]=[]
  screenHeight:number=1000; //Recalculée dans ngOnInit
  resizerHeight = 8
  topHeight = 300;  // hauteur initiale du panneau supérieur
  bottomHeight = 100; // va être recalculé dès ngInit
  private startY = 0;
  private startHeight = 0;

  constructor(
    private cd: ChangeDetectorRef,
    private transliterationService: TransliterationService,
    private LOCALorARCHIBAB: OnLocal,
  ) {}

  @ViewChild('txtAnnot') txtAnnot!: TxtAnnot;
  @ViewChild('imgAnnot') imgAnnot!: ImgAnnot;
  @ViewChild('tabSelect') tabSelect!: TabSelect;
  @ViewChild('inputFile') inputFile!: ElementRef<HTMLInputElement>;
  @ViewChild('topPanel', { static: true }) topPanel!: ElementRef<HTMLDivElement>;

  async ngOnInit() {
    this.transliterationService.loadDictionaries();
    this.recomputeHeights();
    this.selectedCreator=await this.LOCALorARCHIBAB.initialCreator();
    this.creatorIsEditable=this.LOCALorARCHIBAB.creatorIsEditable;
    if (!this.creatorIsEditable || (this.selectedCreator.id !== "" && this.selectedCreator.name !== "")) {
        this.showAnnotateurModal=false
      }
    else {
      this.showAnnotateurModal=true
    }
    this.initKeyboardShortcuts()
  }

// Phase d'initialisation des annotateurs après sélection de la tablette dans tab-select
  onIdSelected(id: string) {
    this.selectedId = id;
    this.undoStack=[]
    this.redoStack=[]
  }
  onImageSelected(image: string) {
    this.selectedImage = image;
    this.undoStack=[]
    this.redoStack=[]
  }
  onRefSelected(ref: string) {
    this.selectedRef = ref;
  }
  transliterTranscription(json:any) {
    // on doit d'abord s'assurer que les dicos st chargés !!!^M
    this.lignestranscription=this.transliterationService.lignesTranscription(json.transcriptions_lignes,json.id)
  }

  // lorsque l'on crée, supprime une BB
  annotationCree(annotation:any) {
    if (!this.txtAnnot.cursorSigne) return;
    if (this.txtAnnot.cursorSigne.attributed) {
      this.imgAnnot.anno.removeAnnotation(annotation.id);
      annotation.id="erreur_a_supprimer"
      return
    };
    // On récupère l'ID et la value du signe sélectionné dans TxtAnnot
    const id = this.txtAnnot.cursorSigne.id_signe;
    const value = `${this.txtAnnot.cursorSigne.signe}_${this.txtAnnot.cursorSigne.signe_Borger}_${this.txtAnnot.cursorSigne.signe_Unicode}_${this.txtAnnot.affichageSigne(this.txtAnnot.cursorSigne,this.txtAnnot.cursorSigne.valeurphon)}_${this.txtAnnot.cursorSigne.mot}`;
    annotation.id = id;
    annotation.target.annotation = id;
    annotation.value = value;
    annotation.target.creator = this.selectedCreator;
    this.txtAnnot.attribuerEtAvancer();
    this.undoStack.push(id)
    this.redoStack=[]
  }
  annotationSupprimee(id: string) {
    this.txtAnnot.desattribuer(id)
    const annotSupprimee=this.imgAnnot.supprimerAnnotation(id)
    this.undoStack.push(annotSupprimee)
    this.redoStack=[]
  }
  annotationRecree(annotation: any, source:string) {
    const pasDejaCree = this.txtAnnot.attribuerLibrement(annotation.id)
    if (pasDejaCree) {
      if (source=="undo") {
        this.redoStack.push(annotation.id)
      } else if (source=="redo") {
        this.undoStack.push(annotation.id)
      }
      this.imgAnnot.anno.addAnnotation(annotation)
      this.imgAnnot.sauvegarderAnnotationUnique(annotation);
    }
  }
  annotationResupprimee(id: string, source:string="") {
    const pasDejaSupprimee=this.txtAnnot.desattribuer(id,true)
    if (pasDejaSupprimee) {
      const annotSupprimee=this.imgAnnot.supprimerAnnotation(id)
      if (source=="undo") {
        this.redoStack.push(annotSupprimee)
      } else if (source=="redo") {
        this.undoStack.push(annotSupprimee)
      }
    }
  }
  undo () {
    const lastActivity= this.undoStack.pop()
    if (typeof lastActivity === 'string') {
      this.annotationResupprimee(lastActivity,"undo")
    } else if (typeof lastActivity === 'object') {
      this.annotationRecree(lastActivity,"undo")
    }
  }
  redo () {
    const lastActivity= this.redoStack.pop()
    if (typeof lastActivity === 'string') {
      this.annotationResupprimee(lastActivity,"redo")
    } else if (typeof lastActivity === 'object') {
      this.annotationRecree(lastActivity,"redo")
    }
  }

  //Lorsque l'on modifie un signe dans le texte, ou qu'on le survole
  annotationValueUpdate(signe:any) {
    if (signe.attributed) {
      const id = signe.id_signe;
      const value = `${signe.signe}_${signe.signe_Borger}_${signe.signe_Unicode}_${this.txtAnnot.affichageSigne(signe,signe.valeurphon)}_${signe.mot}`;
      this.imgAnnot.sauvegarderUpdateAnnotation(id,"value",value)
    }
  }
  annotationSurvolee(id: string) {
    if (id!==""){
      this.txtAnnot.survoledSigne=this.txtAnnot.signeDepuisId(id)
    } else {
      this.txtAnnot.survoledSigne=undefined
    }
  }

  // Lorsque l'on sélectionne une BB dans l'image ou un signe dans le texte
  annotationImgSelect(id:string) {
    if (id=="") {
      this.modeEdition=true
      this.imgAnnot.activerModeEdition()
      this.disableChangeMode=false
    } else if (id=="no more") {
      this.modeEdition=false
      this.imgAnnot.desactiverModeEdition()
      this.disableChangeMode=true
    } else {
      this.imgAnnot.selectAnnotationId(id)
      this.imgAnnot.pointToAnnotation(id)
    }
  }
  annotationTxtSelect(id:string) {
    if (id!="" && id.startsWith(this.selectedId)) {
      this.txtAnnot.selectSigne(this.txtAnnot.signeDepuisId(id)!,false)
      this.txtAnnot.pointToSigne(id)
    }
  }

  //Lorsque l'on modifie les tailles relatives des annotateurs
  recomputeHeights() {
    this.bottomHeight =
      window.innerHeight-this.LOCALorARCHIBAB.adjustScreen - this.topHeight - this.resizerHeight;
  }
  startResize(event: MouseEvent) {
    event.preventDefault();
    document.body.style.userSelect = 'none';

    const startY = event.clientY;
    const startHeight = this.topHeight;

    const mouseMove = (e: MouseEvent) => {
      const dy = e.clientY - startY;
      const newHeight = Math.max(50, startHeight + dy);

      // 🚀 DOM direct → instantané
      this.topPanel.nativeElement.style.height = `${newHeight}px`;
    };

    const mouseUp = (e: MouseEvent) => {
      document.body.style.userSelect = '';

      const dy = e.clientY - startY;
      this.topHeight = Math.max(50, startHeight + dy);
      this.recomputeHeights();
      this.cd.detectChanges(); 

      window.removeEventListener('mousemove', mouseMove);
      window.removeEventListener('mouseup', mouseUp);
    };

    window.addEventListener('mousemove', mouseMove);
    window.addEventListener('mouseup', mouseUp);
  }
  @HostListener('window:resize')
  onResize() {
    this.recomputeHeights();
  }

  //Le message de sauvegarde (obsolète)
  messageSauvegarde = false;
  buttonsauvegarde() {
    this.txtAnnot.sauvegarderLocal()
    //this.imgAnnot.sauvegarderAnnotationsLocal()
    this.messageSauvegarde = true;
    setTimeout(() => {
      this.messageSauvegarde = false;
      this.cd.detectChanges();
    }, 2000);// disparaît après 2 secondes
  }

  // Utilitaire
  hasAnnotations(): boolean {
    if (!this.imgAnnot) return false;
    if (!this.imgAnnot.anno) return false;
    const annotations = this.imgAnnot.anno.getAnnotations();
    return annotations && annotations.length > 0;
  }

    // Lorsque l'on exporte ou importe ou réinitialise des annotations
  exporterAnnotations() {
    if (!this.imgAnnot) return;
    this.imgAnnot.telechargerAnnotations();
  }
  importerAnnotations(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        if (!Array.isArray(json)) {
          console.error('Le fichier JSON ne contient pas une liste d’annotations');
          return;
        }
        this.imgAnnot.chargerAnnotations(json)
        this.txtAnnot.importerSignes(json.map((item: any) => ({id:item.id,value:item.value})))
      } catch (e) {
        console.error('Erreur lors de la lecture du fichier JSON', e);
      }
    };
    reader.readAsText(file);
    this.undoStack=[]
    this.redoStack=[]
  }
  confirmerResetAnnotations() {
    // Demande de confirmation
    const confirmation = window.confirm(
      'Êtes-vous sûr de vouloir supprimer vos annotation ?'
    );
    if (!confirmation) return;
    // Déclenche le reset
    this.txtAnnot.resetSauvegarde();
    this.imgAnnot.resetAnnotationsLocal();
    this.undoStack=[]
    this.redoStack=[]
  }
  confirmerImportAnnotations() {
    if (this.hasAnnotations()){
      // Demande de confirmation
      const confirmation = window.confirm(
        'Êtes-vous sûr de vouloir importer un fichier d’annotations ? Cela remplacera les annotations existantes.'
      );
      if (!confirmation) return;
    }
    // Déclenche le file picker
    this.inputFile.nativeElement.click();
    this.undoStack=[]
    this.redoStack=[]
  }

  //Pour changer le pseudo de l'annotateur
  openAnnotateurModal() {
    this.tempCreator = this.selectedCreator;
    this.showAnnotateurModal = true;
  }
  closeAnnotateurModal() {
    this.showAnnotateurModal = false;
  }
  validerAnnotateur() {
    if (!this.tempCreator.name.trim() || !this.tempCreator.id.trim()) {
      alert("Nom et ID sont obligatoires.");
      return;
    }
    this.selectedCreator = {
        id: this.tempCreator.id,
        name: this.tempCreator.name
      };
    localStorage.setItem('annot-tablette_selectedCreator', JSON.stringify(this.selectedCreator));
    this.showAnnotateurModal = false;
  }

  // Raccourcis
  private initKeyboardShortcuts() {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') { // ignorer si l'utilisateur est dans un input, textarea ou select
        return;
      }
      if (e.key.toLowerCase() === 'm') {
        this.basculerModeEdition()
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (!this.imgAnnot.anno) return;
        const selectedAnnotation = this.imgAnnot.anno.getSelected();
        if (!selectedAnnotation) return;
        const sel = Array.isArray(selectedAnnotation) ? selectedAnnotation[0] : selectedAnnotation;
        const id = sel.annotation?.id || sel.id;
        this.annotationSupprimee(id);
      }
      if (e.key === 'ArrowRight') {
        if (this.txtAnnot.selectedSigne) {
          let selec=this.txtAnnot.signesuivant(this.txtAnnot.selectedSigne)
          this.txtAnnot.selectSigne(selec)
          this.txtAnnot.pointToSigne(selec.id_signe)
        }
      }
      if (e.key === 'ArrowLeft') {
        if (this.txtAnnot && this.txtAnnot.selectedSigne) {
          let selec=this.txtAnnot.signeprecedent(this.txtAnnot.selectedSigne)
          this.txtAnnot.selectSigne(selec)
          this.txtAnnot.pointToSigne(selec.id_signe)
        }
      }
      if (e.key === 'ArrowDown') {
        if (this.txtAnnot.selectedSigne) {
          let selec=this.txtAnnot.lignesuivante(this.txtAnnot.selectedSigne)
          this.txtAnnot.selectSigne(selec)
          this.txtAnnot.pointToSigne(selec.id_signe)
        }
      }
      if (e.key === 'ArrowUp') {
        if (this.txtAnnot.selectedSigne) {
          let selec=this.txtAnnot.ligneprecedente(this.txtAnnot.selectedSigne)
          this.txtAnnot.selectSigne(selec)
          this.txtAnnot.pointToSigne(selec.id_signe)
        }
      }
      if (e.key.toLowerCase() === 's') {
        if (this.txtAnnot.selectedSigne) {
          this.txtAnnot.selectedSigne.semicasse = !this.txtAnnot.selectedSigne.semicasse; 
          this.txtAnnot.updateValue(this.txtAnnot.selectedSigne)
        }
      }
      if (e.key.toLowerCase() === 'b') {
        if (this.txtAnnot.selectedSigne) {
          this.txtAnnot.selectedSigne.enmarge = !this.txtAnnot.selectedSigne.enmarge; 
          this.txtAnnot.updateValue(this.txtAnnot.selectedSigne)
        }
      }
      if (e.key.toLowerCase() === 'e') {
        if (this.txtAnnot.selectedSigne) {
          this.txtAnnot.selectedSigne.efface = !this.txtAnnot.selectedSigne.efface; 
          this.txtAnnot.updateValue(this.txtAnnot.selectedSigne)
        }
      }
      if (e.key.toLowerCase() === 'g') {
        if (this.txtAnnot.selectedSigne) {
          this.txtAnnot.selectedSigne.bizarre = !this.txtAnnot.selectedSigne.bizarre; 
          this.txtAnnot.updateValue(this.txtAnnot.selectedSigne)
        }
      }
      if (e.key.toLowerCase() === 'd') {
        if (this.txtAnnot.selectedSigne && !this.txtAnnot.selectedSigne.clonedsigne && !this.txtAnnot.selectedSigne.ligatureforce) {
          if (this.txtAnnot.selectedSigne.clonesigne) {this.txtAnnot.supprimerSigneClone()}
          else {this.txtAnnot.cloneSigne(this.txtAnnot.selectedSigne)}
        }
      }
      if (e.key.toLowerCase() === 'l') {
        if (this.txtAnnot.selectedSigne && !this.txtAnnot.selectedSigne.clonedligne) {
          if (this.txtAnnot.selectedSigne.cloneligne) {this.txtAnnot.supprimerLigneClone()}
          else {this.txtAnnot.cloneLigne(this.txtAnnot.selectedSigne)}
        }
      }
     if (e.key.toLowerCase() === 'z') {
      this.undo()
     }
     if (e.key.toLowerCase() === 'y') {
      this.redo()
     }
    })
  }
  
  basculerModeEdition() {
    if (this.modeEdition) {
      this.modeEdition=false
      this.imgAnnot.desactiverModeEdition()
    } else if (!this.disableChangeMode) {
      this.modeEdition=true
      this.imgAnnot.activerModeEdition()
      const ss = this.txtAnnot.cursorSigne
      if (ss) {
        this.annotationTxtSelect(ss.id_signe)
      }
    }
  }
}