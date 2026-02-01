document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('latest-note-container');
    if (!container) return;

    const rssUrl = 'https://note.com/katagaki_none/rss';
    // Use AllOrigins as a CORS proxy to get the raw XML
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`;

    // Show Skeleton Loader / Loading State
    container.innerHTML = `
        <section class="mb-24 animate-pulse">
            <h2 class="text-2xl font-bold mb-10 pl-4 border-l-4 border-slate-700 text-slate-700">
                最新note記事
            </h2>
            <div class="relative block">
                <div class="relative bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
                    <div class="flex-grow w-full">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="h-6 w-16 bg-slate-800 rounded-full"></div>
                            <div class="h-4 w-24 bg-slate-800 rounded"></div>
                        </div>
                        <div class="h-8 w-3/4 bg-slate-800 rounded mb-4"></div>
                        <div class="space-y-2 mb-4">
                            <div class="h-4 w-full bg-slate-800 rounded"></div>
                            <div class="h-4 w-5/6 bg-slate-800 rounded"></div>
                        </div>
                        <div class="h-5 w-24 bg-slate-800 rounded"></div>
                    </div>
                    <div class="w-full md:w-48 h-32 flex-shrink-0 rounded-lg bg-slate-800 border border-slate-700"></div>
                </div>
            </div>
        </section>
    `;

    try {
        const response = await fetch(proxyUrl);
        const data = await response.json();

        if (data.contents) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data.contents, "text/xml");
            const items = xmlDoc.querySelectorAll("item");

            if (items.length > 0) {
                const item = items[0];
                const title = item.querySelector("title").textContent;
                const link = item.querySelector("link").textContent;
                const pubDateRaw = item.querySelector("pubDate").textContent;
                const description = item.querySelector("description").textContent; // This is CDATA, but textContent gets it

                // Try to get thumbnail from media:thumbnail
                // Note: getElementsByTagName is safer for namespaced tags in some browsers than querySelector with namespaces
                let thumbnailUrl = 'assets/note_icon.png';
                const mediaThumbnail = item.getElementsByTagName("media:thumbnail")[0] || item.getElementsByTagNameNS("http://search.yahoo.com/mrss/", "thumbnail")[0];

                if (mediaThumbnail) {
                    thumbnailUrl = mediaThumbnail.textContent || mediaThumbnail.getAttribute("url");
                }

                // Date formatting
                const pubDate = new Date(pubDateRaw).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                const html = `
                    <section class="mb-24">
                        <h2 class="text-2xl font-bold mb-10 pl-4 border-l-4 border-emerald-500 text-slate-100">
                            最新note記事
                        </h2>
                        <a href="${link}" target="_blank" rel="noopener noreferrer" class="group relative block">
                            <div class="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-500"></div>
                            <div class="relative bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 hover:bg-slate-850 transition-all duration-300 flex flex-col md:flex-row gap-6 items-center">
                                <div class="flex-grow">
                                    <div class="flex items-center gap-3 mb-3">
                                        <span class="px-3 py-1 text-xs font-bold tracking-widest text-emerald-400 bg-emerald-950/30 rounded-full border border-emerald-900">
                                            note
                                        </span>
                                        <span class="text-slate-400 text-sm">${pubDate}</span>
                                    </div>
                                    <h3 class="text-2xl font-bold text-slate-100 mb-3 group-hover:text-emerald-300 transition-colors line-clamp-2">
                                        ${title}
                                    </h3>
                                    <div class="text-slate-400 leading-relaxed text-sm line-clamp-2 mb-4">
                                        ${stripHtml(description)}
                                    </div>
                                    <div class="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                                        続きを読む
                                        <svg class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                                        </svg>
                                    </div>
                                </div>
                                <div class="w-full md:w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                                    <img src="${thumbnailUrl}" alt="Article Thumbnail" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    onerror="this.src='assets/note_icon.png'; this.style.padding='20px'; this.style.objectFit='contain';">
                                </div>
                            </div>
                        </a>
                    </section>
                `;

                container.innerHTML = html;
            } else {
                // If it was a valid RSS but no items found, hide the loader container
                container.innerHTML = '';
            }
        }
    } catch (error) {
        console.error('Failed to fetch Note RSS:', error);
        container.innerHTML = ''; // Hide on error
    }
});

function stripHtml(html) {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}
