export interface Transliteration {
  id_signe: string;
  sub_signe: string;
  sub_signe_Borger: string;
  sub_signe_Unicode: string;
  signe: string;
  signe_Borger: string;
  signe_Unicode: string;
  signecorrige: string;
  signecorrige_Borger: string;
  signecorrige_Unicode: string;
  valeurphon: string;
  mot: string;
  ligature: number;
  determinatif: boolean;
  casse: boolean;
  semicasse: boolean;
  efface: boolean;
  ajoute: boolean;
  supprime: boolean;
  corrige: boolean;
  douteux: boolean;
  errone: boolean;
  dansmot: boolean;
  nonsigne: boolean;
  
  enmarge?: boolean;
  bizarre?:boolean
  deligaturede?:string
  ligatureforce?:string[]
  clonesigne?: boolean;
  clonedsigne?: boolean;
  cloneligne?: boolean;
  clonedligne?: boolean;
  attributed?: boolean; // dynamique
}

export interface Ligne {
  enveloppe : boolean;
  emplacement: string;
  colonne: number;
  colonne_prime: string;
  ligne: number;
  ligne_prime: string;
  id_ligne: string,
  transliteration: Transliteration[];

  clone?: boolean
}

export interface Signe {
  signe: string;
  signe_Unicode: string;
  signe_Borger: string;
}
