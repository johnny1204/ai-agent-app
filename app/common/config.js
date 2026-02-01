if (!window.tailwind) {
    window.tailwind = {};
}
window.tailwind.config = {
    theme: {
        extend: {
            fontFamily: {
                sans: ['Outfit', 'Noto Sans JP', 'sans-serif'],
                serif: ['Shippori+Mincho', 'serif'],
            },
            colors: {
                slate: {
                    850: '#152033',
                }
            }
        }
    }
};
