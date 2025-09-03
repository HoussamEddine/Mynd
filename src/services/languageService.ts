import AsyncStorage from '@react-native-async-storage/async-storage';

// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  de: 'German', 
  fr: 'French',
  es: 'Spanish'
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Language detection and management
export class LanguageService {
  private static instance: LanguageService;
  private currentLanguage: SupportedLanguage = 'en';

  private constructor() {
    this.initializeLanguage();
  }

  public static getInstance(): LanguageService {
    if (!LanguageService.instance) {
      LanguageService.instance = new LanguageService();
    }
    return LanguageService.instance;
  }

  private async initializeLanguage(): Promise<void> {
    try {
      // Try to get saved language preference first
      const savedLanguage = await this.getSavedLanguage();
      if (savedLanguage) {
        this.setLanguage(savedLanguage);
        return;
      }

      // Detect device language
      const deviceLanguage = this.detectDeviceLanguage();
      this.setLanguage(deviceLanguage);
      
      // Save the detected language
      await this.saveLanguage(deviceLanguage);
    } catch (error) {
      console.error('Error initializing language:', error);
      // Fallback to English
      this.setLanguage('en');
    }
  }

  private detectDeviceLanguage(): SupportedLanguage {
    // For now, default to English to avoid native module issues
    // TODO: Implement proper device language detection when native modules are working
    return 'en';
  }

  private async getSavedLanguage(): Promise<SupportedLanguage | null> {
    try {
      const savedLanguage = await AsyncStorage.getItem('user_language');
      if (savedLanguage && savedLanguage in SUPPORTED_LANGUAGES) {
        return savedLanguage as SupportedLanguage;
      }
      return null;
    } catch (error) {
      console.error('Error getting saved language:', error);
      return null;
    }
  }

  private async saveLanguage(language: SupportedLanguage): Promise<void> {
    try {
      await AsyncStorage.setItem('user_language', language);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  }

  public setLanguage(language: SupportedLanguage): void {
    this.currentLanguage = language;
  }

  public async updateLanguage(language: SupportedLanguage): Promise<void> {
    this.setLanguage(language);
    await this.saveLanguage(language);
  }

  public getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  public getSupportedLanguages(): typeof SUPPORTED_LANGUAGES {
    return SUPPORTED_LANGUAGES;
  }

  public t(key: string, params?: Record<string, any>): string {
    // Simple translation function
    const keys = key.split('.');
    let translation: any = translations[this.currentLanguage];
    
    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k];
      } else {
        // Fallback to English
        translation = translations.en;
        for (const fallbackKey of keys) {
          if (translation && typeof translation === 'object' && fallbackKey in translation) {
            translation = translation[fallbackKey];
          } else {
            return key; // Return key if translation not found
          }
        }
        break;
      }
    }
    
    if (typeof translation === 'string') {
      // Simple parameter replacement
      if (params) {
        return Object.entries(params).reduce((str, [key, value]) => {
          return str.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        }, translation);
      }
      return translation;
    }
    
    return key; // Return key if translation not found
  }

  public getDeviceLanguageInfo(): {
    detectedLanguage: SupportedLanguage;
    deviceLocale: string;
    isSupported: boolean;
  } {
    // For now, return English as default to avoid native module issues
    // TODO: Implement proper device language detection when native modules are working
    return {
      detectedLanguage: 'en',
      deviceLocale: 'en',
      isSupported: true
    };
  }
}

// Translation strings
const translations = {
  en: {
    // Onboarding
    welcome: {
      title: "Let's Personalize Your Experience",
      description: "A few simple questions help us tailor every affirmation, insight, and habit to you.",
      timeEstimate: "It only takes 2 minutes — and it's worth it.",
      startButton: "Start My Questionnaire"
    },
    questions: {
      name: {
        title: "What's your first name?",
        subtitle: "We'll use your name to make your affirmations feel more personal and meaningful",
        placeholder: "First name"
      },
      age: {
        title: "How old are you?",
        subtitle: "Your age helps us create age-appropriate affirmations and content that resonates with your life stage"
      },
      gender: {
        title: "How do you identify?",
        subtitle: "This helps us craft affirmations that feel authentic and relevant to your identity"
      },
      language: {
        title: "What's your preferred language?",
        subtitle: "We'll deliver your affirmations and content in the language you're most comfortable with"
      },
      motivation: {
        title: "What motivated you to try this app?",
        subtitle: "Understanding your motivation helps us create the most effective affirmations for your journey"
      },
      primaryGoal: {
        title: "What is your primary goal?",
        subtitle: "This will be our focus as we create affirmations that support your main objective"
      }
    },
    options: {
      gender: ["Woman", "Man"],
      motivation: [
        "I want to change negative self-beliefs",
        "I want to feel more confident",
        "I'm going through a hard time",
        "I want to be more mindful daily",
        "I'm curious about affirmations and voice"
      ],
      primaryGoal: [
        "Reprogram my mindset",
        "Create better habits",
        "Process emotions and thoughts",
        "Build self-worth",
        "Reduce stress or anxiety"
      ]
    },
    // Common
    common: {
      continue: "Continue",
      back: "Back",
      skip: "Skip",
      next: "Next",
      finish: "Finish",
      loading: "Loading...",
      error: "An error occurred",
      retry: "Retry"
    }
  },
  de: {
    // Onboarding
    welcome: {
      title: "Lass uns deine Erfahrung personalisieren",
      description: "Ein paar einfache Fragen helfen uns dabei, jede Affirmation, jeden Einblick und jede Gewohnheit auf dich abzustimmen.",
      timeEstimate: "Es dauert nur 2 Minuten — und es lohnt sich.",
      startButton: "Meinen Fragebogen starten"
    },
    questions: {
      name: {
        title: "Wie ist dein Vorname?",
        subtitle: "Wir verwenden deinen Namen, um deine Affirmationen persönlicher und bedeutungsvoller zu gestalten",
        placeholder: "Vorname"
      },
      age: {
        title: "Wie alt bist du?",
        subtitle: "Dein Alter hilft uns dabei, altersgerechte Affirmationen und Inhalte zu erstellen, die zu deiner Lebensphase passen"
      },
      gender: {
        title: "Wie identifizierst du dich?",
        subtitle: "Das hilft uns dabei, Affirmationen zu erstellen, die authentisch und relevant für deine Identität sind"
      },
      language: {
        title: "Was ist deine bevorzugte Sprache?",
        subtitle: "Wir liefern deine Affirmationen und Inhalte in der Sprache, in der du dich am wohlsten fühlst"
      },
      motivation: {
        title: "Was hat dich motiviert, diese App zu probieren?",
        subtitle: "Das Verständnis deiner Motivation hilft uns dabei, die effektivsten Affirmationen für deine Reise zu erstellen"
      },
      primaryGoal: {
        title: "Was ist dein Hauptziel?",
        subtitle: "Das wird unser Fokus sein, während wir Affirmationen erstellen, die dein Hauptziel unterstützen"
      }
    },
    options: {
      gender: ["Frau", "Mann"],
      motivation: [
        "Ich möchte negative Selbstüberzeugungen ändern",
        "Ich möchte selbstbewusster werden",
        "Ich durchlebe eine schwierige Zeit",
        "Ich möchte täglich achtsamer sein",
        "Ich bin neugierig auf Affirmationen und Stimme"
      ],
      primaryGoal: [
        "Meine Denkweise umprogrammieren",
        "Bessere Gewohnheiten schaffen",
        "Emotionen und Gedanken verarbeiten",
        "Selbstwert aufbauen",
        "Stress oder Angst reduzieren"
      ]
    },
    // Common
    common: {
      continue: "Weiter",
      back: "Zurück",
      skip: "Überspringen",
      next: "Weiter",
      finish: "Beenden",
      loading: "Lädt...",
      error: "Ein Fehler ist aufgetreten",
      retry: "Wiederholen"
    }
  },
  fr: {
    // Onboarding
    welcome: {
      title: "Personnalisons votre expérience",
      description: "Quelques questions simples nous aident à adapter chaque affirmation, chaque aperçu et chaque habitude à vous.",
      timeEstimate: "Cela ne prend que 2 minutes — et ça en vaut la peine.",
      startButton: "Commencer mon questionnaire"
    },
    questions: {
      name: {
        title: "Quel est votre prénom ?",
        subtitle: "Nous utiliserons votre nom pour rendre vos affirmations plus personnelles et significatives",
        placeholder: "Prénom"
      },
      age: {
        title: "Quel âge avez-vous ?",
        subtitle: "Votre âge nous aide à créer des affirmations et du contenu adaptés à votre âge qui résonnent avec votre étape de vie"
      },
      gender: {
        title: "Comment vous identifiez-vous ?",
        subtitle: "Cela nous aide à créer des affirmations qui semblent authentiques et pertinentes pour votre identité"
      },
      language: {
        title: "Quelle est votre langue préférée ?",
        subtitle: "Nous livrerons vos affirmations et votre contenu dans la langue où vous vous sentez le plus à l'aise"
      },
      motivation: {
        title: "Qu'est-ce qui vous a motivé à essayer cette application ?",
        subtitle: "Comprendre votre motivation nous aide à créer les affirmations les plus efficaces pour votre parcours"
      },
      primaryGoal: {
        title: "Quel est votre objectif principal ?",
        subtitle: "Ce sera notre objectif lors de la création d'affirmations qui soutiennent votre objectif principal"
      }
    },
    options: {
      gender: ["Femme", "Homme"],
      motivation: [
        "Je veux changer mes croyances négatives sur moi-même",
        "Je veux me sentir plus confiant",
        "Je traverse une période difficile",
        "Je veux être plus conscient au quotidien",
        "Je suis curieux des affirmations et de la voix"
      ],
      primaryGoal: [
        "Reprogrammer mon état d'esprit",
        "Créer de meilleures habitudes",
        "Traiter les émotions et les pensées",
        "Construire l'estime de soi",
        "Réduire le stress ou l'anxiété"
      ]
    },
    // Common
    common: {
      continue: "Continuer",
      back: "Retour",
      skip: "Passer",
      next: "Suivant",
      finish: "Terminer",
      loading: "Chargement...",
      error: "Une erreur s'est produite",
      retry: "Réessayer"
    }
  },
  es: {
    // Onboarding
    welcome: {
      title: "Personalicemos tu experiencia",
      description: "Algunas preguntas simples nos ayudan a adaptar cada afirmación, cada insight y cada hábito a ti.",
      timeEstimate: "Solo toma 2 minutos — y vale la pena.",
      startButton: "Comenzar mi cuestionario"
    },
    questions: {
      name: {
        title: "¿Cuál es tu nombre?",
        subtitle: "Usaremos tu nombre para hacer que tus afirmaciones se sientan más personales y significativas",
        placeholder: "Nombre"
      },
      age: {
        title: "¿Cuántos años tienes?",
        subtitle: "Tu edad nos ayuda a crear afirmaciones y contenido apropiados para tu edad que resuenen con tu etapa de vida"
      },
      gender: {
        title: "¿Cómo te identificas?",
        subtitle: "Esto nos ayuda a crear afirmaciones que se sientan auténticas y relevantes para tu identidad"
      },
      language: {
        title: "¿Cuál es tu idioma preferido?",
        subtitle: "Entregaremos tus afirmaciones y contenido en el idioma en el que te sientas más cómodo"
      },
      motivation: {
        title: "¿Qué te motivó a probar esta aplicación?",
        subtitle: "Entender tu motivación nos ayuda a crear las afirmaciones más efectivas para tu viaje"
      },
      primaryGoal: {
        title: "¿Cuál es tu objetivo principal?",
        subtitle: "Este será nuestro enfoque mientras creamos afirmaciones que apoyen tu objetivo principal"
      }
    },
    options: {
      gender: ["Mujer", "Hombre"],
      motivation: [
        "Quiero cambiar creencias negativas sobre mí mismo",
        "Quiero sentirme más seguro",
        "Estoy pasando por un momento difícil",
        "Quiero ser más consciente diariamente",
        "Tengo curiosidad por las afirmaciones y la voz"
      ],
      primaryGoal: [
        "Reprogramar mi mentalidad",
        "Crear mejores hábitos",
        "Procesar emociones y pensamientos",
        "Construir autoestima",
        "Reducir estrés o ansiedad"
      ]
    },
    // Common
    common: {
      continue: "Continuar",
      back: "Atrás",
      skip: "Saltar",
      next: "Siguiente",
      finish: "Terminar",
      loading: "Cargando...",
      error: "Ocurrió un error",
      retry: "Reintentar"
    }
  }
};

export default LanguageService; 