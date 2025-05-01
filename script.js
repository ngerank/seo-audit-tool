async function runAudit() {
    const url = document.getElementById('urlInput').value.trim();
    const keyword = document.getElementById('keywordInput').value.trim().toLowerCase();
    const result = document.getElementById('result');
    if (!url) {
        alert('Please enter a URL.');
        return;
    }

    result.style.display = 'none';
    result.innerHTML = 'Auditing...';

    try {
        const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(url);
        const response = await fetch(proxyUrl);
        const data = await response.json();
        const htmlText = data.contents;

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        let score = 0;
        let total = 12;

        const title = doc.querySelector('title');
        const metaDesc = doc.querySelector('meta[name="description"]');
        const h1 = doc.querySelector('h1');
        const canonical = doc.querySelector('link[rel="canonical"]');
        const og = doc.querySelector('meta[property="og:title"]');
        const internalLinks = [...doc.querySelectorAll('a')].filter(a => a.getAttribute('href') && a.getAttribute('href').startsWith('/'));
        const images = doc.querySelectorAll('img');
        const bodyText = doc.body.innerText || "";
        const wordCount = bodyText.split(/\s+/).length;
        const bodyLower = bodyText.toLowerCase();
        const keywordCount = keyword ? (bodyLower.match(new RegExp(keyword, "g")) || []).length : 0;
        const keywordDensity = keyword ? ((keywordCount / wordCount) * 100).toFixed(2) : "N/A";

        function checkPass(condition, text) {
            if (condition) {
                score++;
                return `<p class="pass">✅ ${text}</p>`;
            } else {
                return `<p class="fail">❌ ${text}</p>`;
            }
        }

        let output = "";
        output += checkPass(title && title.textContent.length >= 50 && title.textContent.length <= 60, "Title length OK (50–60 chars)");
        output += checkPass(metaDesc, "Meta description exists");
        output += checkPass(h1, "H1 tag exists");
        output += `<p>Word Count: ${wordCount} words</p>`;
        output += checkPass(canonical, "Canonical link exists");
        output += checkPass(og, "Open Graph tags exist");
        output += checkPass(internalLinks.length > 0, "Internal link exists");
        output += checkPass(images.length > 0, "Image(s) exist");

        if (keyword) {
            output += checkPass(title && title.textContent.toLowerCase().includes(keyword), "Focus keyword in Title");
            output += checkPass(metaDesc && metaDesc.content.toLowerCase().includes(keyword), "Focus keyword in Meta Description");
            output += checkPass(h1 && h1.textContent.toLowerCase().includes(keyword), "Focus keyword in H1");
            output += `<p>Focus Keyword Density: ${keywordDensity}%</p>`;
        }

        const seoScore = Math.round((score / total) * 100);
        output += `<h2>SEO Score: ${seoScore}%</h2>`;

        result.innerHTML = output;
        result.style.display = 'block';
    } catch (error) {
        result.style.display = 'block';
        result.innerHTML = '<strong>Error:</strong> ' + error.message;
    }
}