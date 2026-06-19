const PRESENTATION = {
    "Mumbai Neon Nights": {
        category: "CLUB NIGHT",
        tag: "SOLD OUT LAST TIME",
        price: 1500,
        accent: "#8B5CF6",
        theme: "purple",
    },

    "Bollywood After Dark": {
        category: "ROOFTOP",
        tag: "FEATURED",
        price: 2000,
        accent: "#F59E0B",
        theme: "gold",
    },

    "Rooftop Rhythm": {
        category: "LIVE MUSIC",
        tag: "NEW",
        price: 999,
        accent: "#EC4899",
        theme: "pink",
    },
};

const FALLBACK_PRESENTATION = {
    category: "NIGHTLIFE",
    tag: "FEATURED",
    price: 1500,
    accent: "#8B5CF6",
    theme: "purple",
};

export function getEventPresentation(event) {
    return (
        PRESENTATION[event?.name] ||
        FALLBACK_PRESENTATION
    );
}