import {
  Component,
  Input,
  Output,
  ViewChild,
  ElementRef,
  OnInit,
  NgZone,
  OnChanges,
  SimpleChanges,
  AfterViewInit ,
  EventEmitter,
  input
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
//import * as OpenSeadragon from 'openseadragon'; // Avec Archibab
import OpenSeadragon from 'openseadragon'; // Local
import { createOSDAnnotator } from '@annotorious/openseadragon';

@Component({
  selector: 'app-img-annot',
  templateUrl: './img-annot.html',
  styleUrl: './img-annot.less'
})
export class ImgAnnot implements OnInit, OnChanges, AfterViewInit {

  @ViewChild('openseadragon_viewer', { read: ElementRef }) osd_container!: ElementRef;

  viewer: any;
  anno: any;

  @Input() img_id!: string;
  @Input() tab_id!: string;
  @Input() height!: number;
  @Input() selectedCreator!:{id:string,name:string}
  @Output() annotationCree = new EventEmitter<void>();
  @Output() annotationSupprimee = new EventEmitter<string>();
  @Output() annotationSurvolee = new EventEmitter<string>();
  @Output() annotationSelected = new EventEmitter<string>();


  private storageKey(): string {
    return `annot-tablette_${this.tab_id}_${this.img_id}_img`;
  }

  constructor(private ngZone: NgZone, private http: HttpClient) {}

  ngOnInit() {
    // ngOnInit reste pour charger les images si besoin
  }

  ngAfterViewInit() {
    this.initViewer();
    this.loadImage();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['img_id'] && !changes['img_id'].firstChange) {
      this.loadImage();
    }
  }

  private initViewer() {
    //Desactive clique droit
    this.osd_container.nativeElement.addEventListener(
      'contextmenu',
      (e: MouseEvent) => e.preventDefault()
    );

    this.ngZone.runOutsideAngular(() => {
      this.viewer = OpenSeadragon({
        element: this.osd_container.nativeElement,
        prefixUrl: "//openseadragon.github.io/openseadragon/images/",
        showNavigator: true,
        showRotationControl: true,
        crossOriginPolicy: 'Anonymous',
        drawer: 'canvas',
      });

      this.viewer.keyboardNavEnabled = false;
      //this.viewer.gestureSettingsMouse.dragToPan = false;
      //this.viewer.gestureSettingsTouch.dragToPan = false;
      this.viewer.gestureSettingsMouse.clickToZoom = false;
      this.viewer.gestureSettingsMouse.dblClickToZoom = false;
      this.viewer.gestureSettingsTouch.dblTapToZoom = false;
      this.viewer.container.addEventListener('keydown', (e: KeyboardEvent) => { //Empêcher ctr+z et ctrl+y qui casse le système
        const k = e.key.toLowerCase();
        if (
          (e.ctrlKey && k === 'z') ||
          (e.ctrlKey && k === 'y') 
        ) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      }, true);

      this.anno = createOSDAnnotator(this.viewer);
      this.anno.setStyle({fill: '#FFC107',fillOpacity: 0.15,stroke: '#ff002b',strokeOpacity: 1,strokeWidth: 1});
      this.anno.setDrawingTool('rectangle');
      this.anno.setDrawingEnabled(true);
      this.anno.setUser(this.selectedCreator);

      this.anno.on('mouseEnterAnnotation', (annotation: any, evt: any) => {
        this.showAnnotationValue(this.annotation_label(annotation), annotation.target.selector);
        this.annotationSurvolee.emit(annotation.id);
      });
      this.anno.on('mouseLeaveAnnotation', () => {
        this.annotationSurvolee.emit("");
        this.hideAnnotationValue();
      });
      this.anno.on('selectionChanged', (annotations: any[]) => {
        if (annotations.length>0) {
          this.annotationSelected.emit(annotations[0].id);
        }
      });
      this.anno.on('createAnnotation', (annotation: any) => {
        if (!annotation.id.startsWith(this.tab_id)) {
          this.anno.cancelSelected();
          this.annotationCree.emit(annotation); // Notifie le parent / TxtAnnot
          this.anno.addAnnotation(annotation);
          this.sauvegarderAnnotationUnique(annotation);
          console.debug('Annotation créée:', annotation);
          console.debug('ID :', annotation.id, 'Value :', annotation.value);
        } 
      });
      this.anno.on('updateAnnotation', (annotation: any, previous: any) => {
        console.debug('Annotation modifiée', annotation);
        this.sauvegarderUpdateAnnotation(annotation.id,'target',annotation.target);
      });
    });
  }


  pointAnnotation(annotation:any){
    const item = this.viewer.world.getItemAt(0);
    const imageWidth  = item.getContentSize().x;
    const imageHeight = item.getContentSize().y;
    const mire = imageWidth*this.height/this.osd_container.nativeElement.clientWidth/2; //milieu Y du view centré sur le haut de l'image
    let pointY = 0;
    const bounds = annotation.target?.selector?.geometry?.bounds; //Etablissement de l'Y du dernier rectangle sur le viewer
    if (bounds){
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        const viewportPoint = this.viewer.viewport.imageToViewportCoordinates(centerX, centerY);
        pointY=viewportPoint.y
    }
    return new OpenSeadragon.Point(0.5, pointY);
  }
  pointToAnnotation(id:string){
    const annotations = this.anno.getAnnotations(); // toutes les annotations sur l'image
    const annotation = annotations.find((a:any) => a.id === id);
    if (annotation){
      this.viewer.viewport.panTo(this.pointAnnotation(annotation), false);
    }
  }

  private loadImage() {
    if (this.img_id && this.img_id!=="") {
      const imgUrl = `https://archibab.fr/img/${this.img_id}.jpg`;
      
      this.ngZone.runOutsideAngular(() => {
        if (this.anno) this.anno.clearAnnotations();
        this.viewer.open({ type: 'image', url: imgUrl })
        this.viewer.addOnceHandler('open', () => {
          this.chargerAnnotationsLocal();
          const annotations = this.anno.getAnnotations();
          if (annotations.length > 0) {
            const last = annotations[annotations.length - 1];
            this.viewer.viewport.zoomTo(1, this.pointAnnotation(last), true)
          } else {
            this.viewer.viewport.zoomTo(1, new OpenSeadragon.Point(0.5, 0), true)
          }
        });
      });
    }
    else
      this.viewer.close();;
  }

  // Pour afficher une tooltip au survol (facultatif)
  showAnnotationValue(value: string, selector: any) {
    const tooltip = document.getElementById('annotation-tooltip');
    if (!tooltip || !this.viewer) return;

    // Récupérer les dimensions de l'image
    const imageWidth = this.viewer.world.getItemAt(0).source.dimensions.x;
    const imageHeight = this.viewer.world.getItemAt(0).source.dimensions.y;
    // Convertir les coordonnées du viewport en coordonnées absolues à l'écran
    //const viewportPoint = new OpenSeadragon.Point(viewportRect.x, viewportRect.y);
    const viewportPoint0 = new OpenSeadragon.Point(0, 0);
    //const screenPoint = this.viewer.viewport.viewerElementToViewportCoordinates(viewportPoint);
    const screenPoint0 = this.viewer.viewport.viewerElementToViewportCoordinates(viewportPoint0);
    // Récupérer la position absolue du conteneur de la visionneuse
    const viewerElement = this.osd_container.nativeElement;
    if (!viewerElement) return;

    const viewerRect = viewerElement.getBoundingClientRect();
    const zoom = this.viewer.viewport.getZoom();

    // Calculer la position absolue de la tooltip
    const tooltipX = (selector.geometry.x / imageWidth - screenPoint0.x ) * viewerRect.width* zoom;
    const tooltipY = ((selector.geometry.y + selector.geometry.h) / imageWidth - screenPoint0.y ) * viewerRect.width * zoom;

    tooltip.textContent = value;
    tooltip.style.display = 'block';
    tooltip.style.left = `${tooltipX + 50}px`;
    tooltip.style.top = `${tooltipY + 50}px`;
  }
  
  hideAnnotationValue() {
    const tooltip = document.getElementById('annotation-tooltip');
    if (tooltip) tooltip.style.display = 'none';
  }

  //Calcul de la valeur à afficher pour chaque BB
  private annotation_label(annotation: any):string {
    const value = annotation.value; //annotation.bodies[0].value;
    if (!value) {return ""}
    // 
    // "value": "MA_552_𒈠_ma_qí-bí-ma",
    const regexSign = /^(.+)_(.*)_(.*)_(.+)_(.+)$/
    const signe = value.replace(regexSign, "$1 $3 ($2)");
    const syll_mot = value.replace(regexSign, "$4 ($5)");

    const ann = annotation.target.annotation //annotation.bodies[0].annotation;
    // ID-de-la-tablette_emplacement_colonne_prime-colonne_ligne_prime-ligne_mot-dans-la-ligne_signe-dans-la-ligne_sous-signe-dans-le-signe_doublon
    // "annotation": "000934_F_0_0_02_0_01_02_0_0",
    // 1.ID=934, 2.env=0, 3.empl=F,4.col=0,5.primcol=0,6.l=02,7.priml=0,8.motdsligne=01,9.signedsligne=02,10.soussigne=0,11.doublon= 0 
    const regexAnn = /^([0-9]+)_([0-9]+)_([A-Z]+)_([0-9]+)_([0-9]+)_([0-9]+)_([0-9]+)_([0-9]+)_([0-9]+)_([0-9]+)_([0-9]+)$/;
    const primes = ["", "'", "''", "'''"]
    const enveloppe = ann.replace(regexAnn, "$2");
    const emplacement = ann.replace(regexAnn, "$3");
    const colonne = ann.replace(regexAnn, "$4");
    const colonne_prime = primes[ann.replace(regexAnn, "$5")];
    //console.log("emplacement :", emplacement);
    const ligne = parseInt(ann.replace(regexAnn, "$6"));
    const ligne_prime = primes[parseInt(ann.replace(regexAnn, "$7"))];
    const no_mot = parseInt(ann.replace(regexAnn, "$8"));
    const no_signe = 1 + parseInt(ann.replace(regexAnn, "$9"));

    return signe + "\n" + syll_mot + "\n" + emplacement + " " + (colonne == "0" ? '' : colonne)
    + colonne_prime + " " + ligne + ligne_prime + " : m" + no_mot + " c" + no_signe
  }

  activerModeEdition() {
    if (this.anno) {
      this.anno.cancelSelected();
      this.anno.setDrawingEnabled(true);
      console.debug(`Dessin activé, sélection désactivée`);
    }
  }
  desactiverModeEdition() {
    if (this.anno) {
      this.anno.setDrawingEnabled(false);
      console.debug(`Dessin désactivé, sélection activée`);
    }
  }

  // Sauvegarde locale
  sauvegarderAnnotationsLocal() {
    return // tant que le bug de this.anno.getAnnotations() qui renvoie le local en plus du visible, ce bouton ne fera rien
    if (!this.anno) return;
    // Récupère toutes les annotations
    const toutesAnnotations = this.anno.getAnnotations()
    console.debug(toutesAnnotations)
    const key = this.storageKey();
    localStorage.setItem(key, JSON.stringify(toutesAnnotations));
    console.debug('Annotations sauvegardées localement');
  }
  //Charger la sauvegarde
  chargerAnnotationsLocal() {
    const key = this.storageKey();
    const saved = localStorage.getItem(key);
    if (saved && this.anno) {
      console.debug('Saved content:', saved);
      const annotations = JSON.parse(saved);
      console.debug('Annotations à charger :', annotations);  
      for (const a of annotations) {
        this.anno.addAnnotation(a);
      }
      console.debug('Annotations chargées depuis localStorage');
    }
  }
  // supprimer la sauvegarde
  resetAnnotationsLocal() {
    const key = this.storageKey();
    localStorage.removeItem(key);
    if (this.anno) {
      this.anno.clearAnnotations(); // supprime toutes les annotations affichées
    }
    console.debug('Annotations locales réinitialisées');
  }
  // Sauvegarder juste une annotation
  sauvegarderAnnotationUnique(annotation: any) {
    const key = this.storageKey();
    // Récupération des annotations existantes
    const saved = localStorage.getItem(key);
    const annotations = saved ? JSON.parse(saved) : [];
    // Sécurité : éviter les doublons (id unique)
    const exists = annotations.some((a: any) => a.id === annotation.id);
    if (exists) return;
    annotations.push(annotation);
    localStorage.setItem(key, JSON.stringify(annotations));
    console.debug('Annotation sauvegardée:', annotation.id);
  }
  telechargerAnnotations() {
    const key = this.storageKey();
    const saved = localStorage.getItem(key);
    if (!saved) {
      console.warn('Aucune annotation à télécharger');
      return;
    }
    // 🔹 Parse puis re-stringify avec indentation
    const parsed = JSON.parse(saved);
    const prettyJson = JSON.stringify(parsed, null, 2);
    const blob = new Blob([prettyJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.tab_id.toString().padStart(6, '0')}_${this.img_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    console.debug('Téléchargement des annotations lancé');
  }
  chargerAnnotations(json: any) {
    this.resetAnnotationsLocal()
    localStorage.setItem(this.storageKey(), JSON.stringify(json));
    this.chargerAnnotationsLocal()
  }

  supprimerAnnotation(id: string):any {
    this.anno.removeAnnotation(id);
    const key = this.storageKey();
    const saved = localStorage.getItem(key);
    if (saved) {
      const annotations = JSON.parse(saved);
      const lastAnnotation = annotations.find((a: any) => a.id === id);
      const filtered = annotations.filter((a: any) => a.id !== id);
      localStorage.setItem(key, JSON.stringify(filtered));
      return lastAnnotation
    }
  }
  sauvegarderUpdateAnnotation(id:string,propriete:string,contenu: any) {
    const key = this.storageKey();
    const saved = localStorage.getItem(key);
    const all = saved ? JSON.parse(saved) : [];
    const index = all.findIndex((a: any) => a.id === id);
    if (index !== -1) {
      const annotation=all[index]
      annotation[propriete] = contenu;// 🔁 remplacement
      this.anno.updateAnnotation(annotation)
      if (annotation.target.updatedBy){
          annotation.target.updatedBy=this.selectedCreator
      }
    } else {
      console.error("Il n'y a d'annotation avec cette id");// Si absent : erreur
    }
    localStorage.setItem(key, JSON.stringify(all));
  }
  selectAnnotationId(id: string) {
    if (!this.anno) return;
    this.desactiverModeEdition();
    this.anno.cancelSelected();
    this.anno.setSelected(id);
    console.debug("annotation sélectionnée : ",id)
  }

}
