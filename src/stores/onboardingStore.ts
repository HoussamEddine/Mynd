import { create } from 'zustand';

// --- Types ---
type OnboardingPhase = 'welcome' | 'input' | 'affirmation_intro' | 'affirmation_cards';

interface OnboardingState {
    // State Variables
    phase: OnboardingPhase;
    beliefInput: string;
    isInputFocused: boolean;
    affirmations: string[];
    isOnboardingComplete: boolean;
    hasShownInputInSession: boolean; // Track if the input box has been shown in this session
    // Actions
    setPhase: (phase: OnboardingPhase) => void;
    setBeliefInput: (input: string) => void;
    setInputFocused: (isFocused: boolean) => void;
    generateAffirmations: (belief: string) => void;
    setOnboardingComplete: (isComplete: boolean) => void;
    setHasShownInputInSession: (hasShown: boolean) => void; // Action to update the session state
    resetStore: () => void;
}

// --- Store Definition ---
export const useOnboardingStore = create<OnboardingState>((set, get) => ({
    // Initial State
    phase: 'welcome',
    beliefInput: '',
    isInputFocused: false,
    affirmations: [],
    isOnboardingComplete: false,
    hasShownInputInSession: false, // Initialize as false to show input box on first launch

    // Basic Actions
    setPhase: (phase) => set({ phase }),
    setBeliefInput: (input) => set({ beliefInput: input }),
    setInputFocused: (isFocused) => set({ isInputFocused: isFocused }),
    setOnboardingComplete: (isComplete) => set({ isOnboardingComplete: isComplete }),
    setHasShownInputInSession: (hasShown) => set({ hasShownInputInSession: hasShown }),

    // Affirmation Generation (Placeholder Logic)
    generateAffirmations: (belief) => {
        // Replace with actual affirmation generation logic (AI call, template, etc.)
        const generated = [
            `I release the belief that ${belief.toLowerCase()}. I am capable and worthy.`,
            `Even though I sometimes feel ${belief.toLowerCase().replace(/^i'?m\s*/, '')}, I am strong and resilient.`,
            `My potential is limitless, regardless of past feelings of ${belief.toLowerCase().replace(/^i'?m\s*/, '')}.`,
            "I choose to believe in my strengths and abilities.",
            "I am growing and learning every day."
        ].slice(0, 5); // Limit to 5 for example
        set({ affirmations: generated });
    },

    // Reset Store Action
    resetStore: () => set({
        phase: 'welcome',
        beliefInput: '',
        isInputFocused: false,
        affirmations: [],
        // Don't reset the session state on regular store reset
    })
})); 