// ===== CONFIG =====
const API_KEY = "4a24e1c4a5962c36f679155697c5c96d";
const BASE_URL = "https://gnews.io/api/v4/top-headlines?lang=en&country=in&topic=";

// ===== LOAD DEFAULT NEWS =====
window.addEventListener("load", () => {
  fetchNews("technology");
});

// ===== FETCH NEWS FUNCTION =====
async function fetchNews(topic) {
  try {
    const res = await fetch(`${BASE_URL}${topic}&apikey=${API_KEY}`);
    const data = await res.json();
    bindData(data.articles);
  } catch (err) {
    document.getElementById("cardscontainer").innerHTML = `<h2>❌ Error loading news.</h2>`;
    console.error("Fetch error:", err);
  }
}

// ===== BIND NEWS TO HTML =====
function bindData(articles) {
  const container = document.getElementById("cardscontainer");
  const template = document.getElementById("template-news-card");
  container.innerHTML = "";

  if (!articles || articles.length === 0) {
    container.innerHTML = "<h2>No results found 🔍</h2>";
    return;
  }

  articles.forEach(article => {
    if (!article.image || !article.description) return;

    const card = template.content.cloneNode(true);
    fillDataInCard(card, article);
    container.appendChild(card);
  });
}

// ===== FILL INDIVIDUAL CARD =====
function fillDataInCard(card, article) {
  const img = card.querySelector("#news-img");
  const title = card.querySelector("#news-title");
  const desc = card.querySelector("#news-desc");
  const source = card.querySelector("#news-source");

  img.src = article.image;
  title.textContent = article.title.slice(0, 60) + "...";
  desc.textContent = article.description.slice(0, 150) + "...";

  const date = new Date(article.publishedAt).toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
  });
  source.textContent = `${article.source.name} • ${date}`;

  card.firstElementChild.addEventListener("click", () => {
    window.open(article.url, "_blank");
  });
}

// ===== CATEGORY NAVIGATION =====
let curSelectedNav = null;
function onNavItemClick(id) {
  fetchNews(id);
  const item = document.getElementById(id);
  curSelectedNav?.classList.remove("active");
  curSelectedNav = item;
  curSelectedNav.classList.add("active");
}

// ===== THEME TOGGLE =====
const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener("click", () => {
  if (document.body.getAttribute("data-theme") === "dark") {
    document.body.removeAttribute("data-theme");
    themeToggle.textContent = "🌙";
  } else {
    document.body.setAttribute("data-theme", "dark");
    themeToggle.textContent = "☀️";
  }
});

// ===== SEARCH BAR TOGGLE =====
const searchToggle = document.getElementById("search-toggle");
const searchInput = document.getElementById("search-text");

searchToggle.addEventListener("click", () => {
  searchInput.classList.toggle("hidden");
  searchInput.focus();
});

// ===== SEARCH FUNCTION =====
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const query = searchInput.value.trim();
    if (query) {
      fetchSearchNews(query);
      curSelectedNav?.classList.remove("active");
      curSelectedNav = null;
    }
  }
});

async function fetchSearchNews(query) {
  try {
    const res = await fetch(`https://gnews.io/api/v4/search?q=${query}&lang=en&country=in&apikey=${API_KEY}`);
    const data = await res.json();
    bindData(data.articles);
  } catch (err) {
    document.getElementById("cardscontainer").innerHTML = `<h2>Search failed ❌</h2>`;
    console.error("Search error:", err);
  }
}

// ===== CLOSE SEARCH WHEN CLICKING OUTSIDE =====
document.addEventListener("click", (e) => {
  if (!e.target.closest("#search-bar") && !e.target.closest("#search-toggle")) {
    searchInput.classList.add("hidden");
  }
});


    // ===== CHATBOT SCRIPT =====
    const chatbotToggleIcon = document.getElementById("chatbot-toggle-icon");
    const chatbotInline = document.getElementById("chatbot-inline");
    const chatbotSend = document.getElementById("chatbot-send");
    const chatbotInput = document.getElementById("chatbot-input");
    const chatbotMessages = document.getElementById("chatbot-messages");

    chatbotToggleIcon.addEventListener("click", () => {
      if (chatbotInline.classList.contains("hidden")) {
        chatbotInline.classList.remove("hidden");
        setTimeout(() => {
          chatbotInline.classList.add("visible");
          chatbotToggleIcon.classList.add("moved");
        }, 10);
      } else {
        chatbotInline.classList.remove("visible");
        chatbotToggleIcon.classList.remove("moved");
        chatbotInline.addEventListener("transitionend", function handler() {
          chatbotInline.classList.add("hidden");
          chatbotInline.removeEventListener("transitionend", handler);
        }, { once: true });
      }
    });

    chatbotSend.addEventListener("click", sendMessage);
    chatbotInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendMessage();
    });

    async function sendMessage() {
      const userMsg = chatbotInput.value.trim();
      if (!userMsg) return;

      appendMessage("user", userMsg);
      chatbotInput.value = "";

      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": "Bearer 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",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "deepseek/deepseek-r1-0528:free",
            messages: [
              { role: "system", content: "You are a helpful, polite, and professional AI assistant. Always respond in a friendly and respectful tone, providing clear and concise information. Please use Markdown for formatting, including new lines, bullet points (* or -), and bold text (**text**)." },
              { role: "user", content: userMsg }
            ]
          })
        });

        const data = await res.json();
        const botMsg = data.choices?.[0]?.message?.content || "⚠️ No response";
        appendMessage("bot", botMsg);
      } catch (err) {
        appendMessage("bot", "❌ Error connecting to chatbot.");
        console.error(err);
      }
    }

    function appendMessage(sender, text) {
      const div = document.createElement("div");
      div.classList.add("chat-msg", sender);
      chatbotMessages.appendChild(div);
      chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

      if (sender === "bot") {
        typeOutMarkdown(div, text);
      } else {
        div.textContent = text;
      }
    }

    // === NEW FUNCTION: Print bot messages line by line ===
    function typeOutMarkdown(div, text) {
      const lines = text.split(/\r?\n/);
      let index = 0;

      function printNextLine() {
        if (index < lines.length) {
          const lineHtml = marked.parse(lines[index] + "\n");
          div.innerHTML += lineHtml;
          chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
          index++;
          setTimeout(printNextLine, 500); // Delay between lines
        }
      }

      printNextLine();
    }
