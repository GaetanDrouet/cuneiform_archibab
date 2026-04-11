// file: id-selector.component.ts
import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule,Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { OnLocal } from '../on-local/on-local';

@Component({
  selector: 'app-tabselect',
  imports: [CommonModule,FormsModule],
  templateUrl: './tab-select.html',
  styleUrl: './tab-select.less',
})

export class TabSelect {
  selectedIdValue: string =""; 
  selectedImageValue!: string; 
  @Output() selectedId = new EventEmitter<string>();
  @Output() selectedIdJson = new EventEmitter<any>();
  @Output() selectedImage = new EventEmitter<string>();
  @Output() selectedRef = new EventEmitter<string>();
  texte : any;
  searchId: string = '';
  images: string[] = [];            
  sauvegardes: { id: string; img: string }[] = [];     
  showSauvegardes=false

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private LOCALorARCHIBAB: OnLocal,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(// lecture des id texte et images directement par l'URL
      params => {
        console.debug(params);
        if (params['txt']) {
          this.selectId(params['txt']);
          const img = params['img']
          if (img && this.images.includes(img)) {
            this.selectImage(params['img']);
          }
        }
      }
    );
  }
  async selectId(id: string) {
    this.texte = await this.LOCALorARCHIBAB.findId(id);
    if (this.texte !== null) {
      console.debug('Tablette sélectionnée :', id);      
      this.location.replaceState(
        '/annot',
        `txt=${id}`
      );
      this.searchId = id;
      this.selectedIdValue = id; 
      this.images = this.texte.publications
        .map((pub: any) => pub.pages)
        .filter((page: string) => page.endsWith('.jpg'))
        .map((page: string) => {
          const parts = page.split('/');
          const filename = parts[parts.length - 1];
          return filename.replace(/\.jpg$/, '');
        })

      this.selectedRef.emit(this.texte.ref);

      console.debug(this.images)
      if (this.images.length) {
        let transcriptions_lignes = this.texte.transcriptions_lignes
        if (transcriptions_lignes.length) {
          this.selectedIdJson.emit(this.texte);
          this.selectedId.emit(id);

          if (this.images.length == 1)
            this.selectImage(this.images[0]);
          else if (!this.images.includes(this.selectedImageValue))
            this.selectImage("");
        } else {
          console.error("Pas de transcription")
          alert("Aucune transcription n'est associée à la tablette sélectionnée.")
          }
      } else {
        console.error("Pas d'image pour la tablette")
        alert("Aucune image n'est associée à la tablette sélectionnée.")
      }
    } else {this.searchId=this.selectedIdValue}
  }
  selectImage(image: string) {
    this.selectedImageValue = image;
    this.selectedImage.emit(image);
    if(image) {
      this.location.replaceState(
        '/annot',
        `txt=${this.selectedIdValue}&img=${image}`
      );
    } else {
      this.location.replaceState(
        '/annot',
        `txt=${this.selectedIdValue}`
      );
    }
  }
  getSauvegardesFormateesObj() {
    const map = new Map<string, { id: string; img: string }>();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const parts = key.split('_');
      if (parts.length < 3) continue;
      const value = `${parts[1]} : ${parts[2]}`;
      map.set(value, { id: parts[1], img: parts[2] });
    }
    return Array.from(map.values());
  }
  ouvertureChargement() {
    if (this.showSauvegardes) {
      this.showSauvegardes=false
    } else {
      this.sauvegardes = this.getSauvegardesFormateesObj()
      this.showSauvegardes=true
    }
  }
  async chargerSauvegarde(s: { id: string; img: string }) {
    await this.selectId(s.id);
    this.selectImage(s.img);
    this.showSauvegardes=false
  }

}
