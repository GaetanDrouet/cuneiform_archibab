export class OnArchibab {}
/*import { Injectable } from '@angular/core';
import { ApiService } from '../../../api.service';
import { StorageService } from '../../../_services/storage.service'; 
import { jwtDecode } from "jwt-decode";
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class OnArchibab {
  constructor(
    private apiService: ApiService,
    private storageService: StorageService,
    private router: Router,
  ) {}

  findId(id: string): Promise<any | null> {
    return new Promise((resolve) => {
      this.apiService.getTexte(Number(id), true).subscribe({
        next: (texte:any) => {
          resolve(texte || null); // renvoie le texte ou null
        },
        error: (err:any) => {
          console.error('Erreur chargement JSON', err);
          alert("Aucune tablette n'a cette identifiant dans la base de données Archibab.");
          resolve(null); // renvoie null en cas d'erreur
        }
      });
    })
  }

  initialCreator(): Promise<{id:string,name: string}> {
    if (this.storageService.isLoggedIn()) {// on est loggé : extraction username pour signer les annotations (creator)^
      const user: { [key: string]: string } = jwtDecode(this.storageService.getUser().access)
      return Promise.resolve({
        id: `${user['first_name']} ${user['last_name']}`,
        name: user['username']
      });
    }
    else {// loggé : pas accès à l'annotation
      return this.router.navigate(['home']).then(() => {
        window.location.reload();
        return {id: "",name: ""};
      });
    }
  }
  goTexte(id:string) { // aller au texte / sa page Archibab
    this.router.navigate(['texte', id]);
  }

  adjustScreen=70
  creatorIsEditable=false
}*/
