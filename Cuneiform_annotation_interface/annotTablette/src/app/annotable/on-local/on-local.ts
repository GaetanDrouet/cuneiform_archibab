import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OnLocal {
  constructor(
    private http: HttpClient
  ) {}
  
  async findId(id: string): Promise<any | null> {
    const url = `assets/json/${id}.json`;
    try {
      const json = await firstValueFrom(this.http.get<any>(url));
      // Vérifie que le JSON n'est pas vide
      if (json && Object.keys(json).length > 0) {
        return json;
      } else {
        return null;
      }
    } catch (err) {
      console.warn(`Impossible de charger le fichier ${id}.json`, err);
      return null;
    }
  }

  initialCreator(): Promise<{id:string,name:string}> {
    const saved = localStorage.getItem('annot-tablette_selectedCreator');
    if (saved) {
      return Promise.resolve(JSON.parse(saved))
    }else {
      return Promise.resolve({id: "",name: ""});
    }
  }

  adjustScreen=2
  creatorIsEditable=true
}
