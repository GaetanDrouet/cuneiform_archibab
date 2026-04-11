import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
//import { httpInterceptorProviders } from './_helpers/http.interceptor';

import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AnnotTablette } from './annotable/annot-tablette/annot-tablette';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';

import { definePreset } from '@primeuix/themes';
import { palette } from '@primeuix/themes';

import Aura from '@primeuix/themes/aura';

const jaune_archibab = palette('#FFC107');

const ArchibabPreset = definePreset(Aura, {
    semantic: {
        primary: jaune_archibab
    },
    components: {
        button: {
            root: {
                borderRadius: '0px',
                label: {
                    fontWeight: '400'
                },
            }
        },
        togglebutton: {
            root: {
                borderRadius: '0px',   
                gap: '0px',
            }
        },
    },
});

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter([
            { path: '', redirectTo: 'annot', pathMatch: 'full' },
            {path: 'annot', component: AnnotTablette},
        ]),
        Title, 
        provideHttpClient(withInterceptorsFromDi()),
        provideAnimationsAsync(),
        providePrimeNG({
            inputVariant: 'filled' ,
            theme: {
                preset: ArchibabPreset,
                options: {
                    cssLayer: false,
                    darkModeSelector: '.dark-mode'//'.dark-mode' 'none'
                }
            }
        })
    ]
};