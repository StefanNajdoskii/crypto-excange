// Глобален објект за прикажливо име: { id: "Прикажливо Име (Симбол)" }
let cryptoList = {};
// Глобален објект за кориснички дефинирани цени: { id: { usd: Number, eur: Number } }
let customPrices = {};
// За да запомниме кој се уредува
let editingId = null;

// Иницијација на апликацијата
function initApp() {
  // Вчитај го cryptoList од Local Storage (ако постои)
  const savedList = JSON.parse(localStorage.getItem("cryptoList"));
  if (savedList) {
    cryptoList = savedList;
  } else {
    // Ако не постои, иницијализирај со основни криптовалути
    cryptoList = {
      bitcoin: "Bitcoin (BTC)",
      ethereum: "Ethereum (ETH)",
      cardano: "Cardano (ADA)",
      solana: "Solana (SOL)",
      ripple: "Ripple (XRP)",
      litecoin: "Litecoin (LTC)",
      polkadot: "Polkadot (DOT)",
      dogecoin: "Dogecoin (DOGE)"
      
    };
    localStorage.setItem("cryptoList", JSON.stringify(cryptoList));
  }

  // Вчитај ги customPrices од Local Storage (ако постојат)
  const savedCustom = JSON.parse(localStorage.getItem("customPrices"));
  if (savedCustom) {
    customPrices = savedCustom;
  } else {
    customPrices = {};
    localStorage.setItem("customPrices", JSON.stringify(customPrices));
  }

  checkUser();
  renderAllSelects();
}

// Чување cryptoList во Local Storage
function saveCryptoList() {
  localStorage.setItem("cryptoList", JSON.stringify(cryptoList));
}

// Чување customPrices во Local Storage
function saveCustomPrices() {
  localStorage.setItem("customPrices", JSON.stringify(customPrices));
}

// Прикажување на соодветната секција
function showSection(sectionId) {
  const sections = ["menuvacnica", "cenovnik", "search", "lokacija", "zaNas"];
  sections.forEach(id => {
    document.getElementById(id).style.display = id === sectionId ? "block" : "none";
  });

  if (sectionId === "cenovnik") {
    fetchCryptoPrices();
  }
  if (sectionId === "search") {
    // При вчитување на Search, прикажи празна листа
    renderSearchResults([]);
  }
}

// Проверка дали корисник е логиран
function checkUser() {
  const savedUser = localStorage.getItem("username");
  if (savedUser) {
    document.getElementById("usernameDisplay").innerText = `Dobredojde, ${savedUser}!`;
  }
}

// Логирање корисник
function loginUser() {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (username && password) {
    localStorage.setItem("username", username);
    document.getElementById("usernameDisplay").innerText = `Dobredojde, ${username}!`;
    document.getElementById("authModal").style.display = "none";
  } else {
    alert("Ve molime vnesete korisnicko ime i lozinka.");
  }
}

// Одјавување корисник
function logoutUser() {
  localStorage.removeItem("username");
  document.getElementById("usernameDisplay").innerText = "Menuvacnica na Kriptovaluti";
  localStorage.removeItem("transactions");
  renderTransactionHistory();
}

// -------------------------------------------------------------------------------------------------------
// ФУНКЦИИ ЗА КРИПТОВАЛУТИ (ДОДАВАЊЕ/БРИШЕЊЕ/РЕНДЕР)
// -------------------------------------------------------------------------------------------------------

// Рендерирај ги опциите за <select id="fromCurrency">
function renderAllSelects() {
  const fromSel = document.getElementById("fromCurrency");
  fromSel.innerHTML = "";
  for (const [id, displayName] of Object.entries(cryptoList)) {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = displayName;
    fromSel.appendChild(opt);
  }
}

// Додај нова криптовалута (со цена)
function addCrypto() {
  const newId = document.getElementById("newCryptoId").value.trim().toLowerCase();
  const newName = document.getElementById("newCryptoName").value.trim();
  const newUsd = parseFloat(document.getElementById("newCryptoUsdPrice").value);
  const newEur = parseFloat(document.getElementById("newCryptoEurPrice").value);

  if (!newId || !newName) {
    alert("Пополни ги полинјата за ID и Име на криптовалутата.");
    return;
  }
  if (cryptoList[newId]) {
    alert("ID веќе постои во листата.");
    return;
  }
  if (isNaN(newUsd) || isNaN(newEur) || newUsd <= 0 || newEur <= 0) {
    alert("Внеси валидна цена (поголема од 0) во USD и EUR.");
    return;
  }

  // Додај го новиот запис во cryptoList и customPrices
  cryptoList[newId] = newName;
  customPrices[newId] = {
    usd: newUsd,
    eur: newEur
  };

  saveCryptoList();
  saveCustomPrices();

  // Исчисти ги полињата
  document.getElementById("newCryptoId").value = "";
  document.getElementById("newCryptoName").value = "";
  document.getElementById("newCryptoUsdPrice").value = "";
  document.getElementById("newCryptoEurPrice").value = "";

  // Освежи селектите и табелата
  renderAllSelects();
  fetchCryptoPrices();
}

// Избриши криптовалута од списокот
function removeCrypto(id) {
  if (confirm(`Дали сте сигурни дека сакате да ја избришете криптовалутата "${cryptoList[id]}"?`)) {
    delete cryptoList[id];
    // Ако е кориснички дефинирана, бриши ја и цената
    if (customPrices[id]) {
      delete customPrices[id];
      saveCustomPrices();
    }
    saveCryptoList();
    renderAllSelects();
    fetchCryptoPrices();
  }
}

// Вчитај и прикажи ги цените на сите криптовалути
async function fetchCryptoPrices() {
  const allIds = Object.keys(cryptoList);
  const customIds = Object.keys(customPrices);
  // Криптовалути чии цени ќе ги земеме од CoinGecko
  const dynamicIds = allIds.filter(id => !customIds.includes(id));

  let apiData = {};
  if (dynamicIds.length > 0) {
    const idsParam = dynamicIds.join(",");
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd,eur`;
    try {
      const response = await fetch(url);
      apiData = await response.json();
    } catch (error) {
      console.error("Error fetching cryptocurrency prices:", error);
    }
  }

  const cryptoPrices = document.getElementById("crypto-prices");
  cryptoPrices.innerHTML = ""; // Испразни ја табелата

  for (const id of allIds) {
    const displayName = cryptoList[id];
    let priceUsd, priceEur;

    if (customIds.includes(id)) {
      // Ако е кориснички дефинирана, користи ја внесената цена
      priceUsd = customPrices[id].usd.toFixed(2);
      priceEur = customPrices[id].eur.toFixed(2);
    } else {
      // Ако е динамична, земи ја од CoinGecko (или "N/A" ако нема податок)
      priceUsd = apiData[id]?.usd != null ? apiData[id].usd.toFixed(2) : "N/A";
      priceEur = apiData[id]?.eur != null ? apiData[id].eur.toFixed(2) : "N/A";
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="clickable" onclick="showDetail('${id}')">${displayName}</td>
      <td>${priceUsd} USD / ${priceEur} EUR</td>
      <td><button onclick="buyCrypto('${id}')">Kupi</button></td>
      <td><button onclick="sellCrypto('${id}')">Prodaj</button></td>
      <td>
        <button onclick="showEdit('${id}')">Uredi</button>
        <button onclick="removeCrypto('${id}')">Izbrishi</button>
      </td>
    `;
    cryptoPrices.appendChild(row);
  }
}

// -------------------------------------------------------------------------------------------------------
// ФУНКЦИИ ЗА ДЕТАЛЕН ПРЕГЛЕД (Detail)
// -------------------------------------------------------------------------------------------------------

function showDetail(id) {
  const displayName = cryptoList[id];
  let usd, eur;

  if (customPrices[id]) {
    usd = customPrices[id].usd.toFixed(2);
    eur = customPrices[id].eur.toFixed(2);
    renderDetailModal(id, displayName, usd, eur);
  } else {
    // За динамичките, земи ги од CoinGecko
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd,eur`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        usd = data[id]?.usd != null ? data[id].usd.toFixed(2) : "N/A";
        eur = data[id]?.eur != null ? data[id].eur.toFixed(2) : "N/A";
        renderDetailModal(id, displayName, usd, eur);
      })
      .catch(err => {
        console.error("Грешка при добивање детали:", err);
      });
  }
}

function renderDetailModal(id, name, usd, eur) {
  document.getElementById("detail-id").innerText = id;
  document.getElementById("detail-name").innerText = name;
  document.getElementById("detail-usd").innerText = `${usd}`;
  document.getElementById("detail-eur").innerText = `${eur}`;
  document.getElementById("detailModal").style.display = "flex";
}

function closeDetailModal() {
  document.getElementById("detailModal").style.display = "none";
}

// -------------------------------------------------------------------------------------------------------
// ФУНКЦИИ ЗА УРЕДУВАЊЕ (Edit)
// -------------------------------------------------------------------------------------------------------

function showEdit(id) {
  editingId = id;
  // Пополни полињата со тековното име и цена
  document.getElementById("editCryptoName").value = cryptoList[id];
  if (customPrices[id]) {
    document.getElementById("editCryptoUsd").value = customPrices[id].usd;
    document.getElementById("editCryptoEur").value = customPrices[id].eur;
  } else {
    // За динамичките, земи ја последната позната цена
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd,eur`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        document.getElementById("editCryptoUsd").value = data[id]?.usd || "";
        document.getElementById("editCryptoEur").value = data[id]?.eur || "";
      })
      .catch(err => console.error(err));
  }
  document.getElementById("editModal").style.display = "flex";
}

function saveEdit() {
  const newName = document.getElementById("editCryptoName").value.trim();
  const newUsd = parseFloat(document.getElementById("editCryptoUsd").value);
  const newEur = parseFloat(document.getElementById("editCryptoEur").value);

  if (!editingId) return;
  if (!newName || isNaN(newUsd) || isNaN(newEur) || newUsd <= 0 || newEur <= 0) {
    alert("Внеси валидни податоци за име и цена.");
    return;
  }

  // Ажурирај го името и цената
  cryptoList[editingId] = newName;
  customPrices[editingId] = { usd: newUsd, eur: newEur };

  saveCryptoList();
  saveCustomPrices();

  closeEditModal();
  renderAllSelects();
  fetchCryptoPrices();
}

function closeEditModal() {
  editingId = null;
  document.getElementById("editModal").style.display = "none";
}

// -------------------------------------------------------------------------------------------------------
// ФУНКЦИИ ЗА ПРЕБАРУВАЊЕ (Search)
// -------------------------------------------------------------------------------------------------------

function searchCrypto() {
  const query = document.getElementById("searchInput").value.trim().toLowerCase();
  if (!query) {
    renderSearchResults([]);
    return;
  }

  // Филтрирај по прикажливо име или ID
  const results = Object.keys(cryptoList).filter(id => {
    const name = cryptoList[id].toLowerCase();
    return id.includes(query) || name.includes(query);
  });

  // Креирај податоци за прикажување (име и цена)
  const displayData = results.map(id => {
    let priceUsd = customPrices[id]?.usd?.toFixed(2) || null;
    let priceEur = customPrices[id]?.eur?.toFixed(2) || null;
    if (priceUsd === null || priceEur === null) {
      // Ако нема custom, земи од CoinGecko во моментот
      return fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd,eur`)
        .then(res => res.json())
        .then(data => ({
          id,
          name: cryptoList[id],
          usd: data[id]?.usd?.toFixed(2) || "N/A",
          eur: data[id]?.eur?.toFixed(2) || "N/A"
        }))
        .catch(() => ({ id, name: cryptoList[id], usd: "N/A", eur: "N/A" }));
    } else {
      return Promise.resolve({ id, name: cryptoList[id], usd: priceUsd, eur: priceEur });
    }
  });

  // Очекуваме сите Promises да се завршат
  Promise.all(displayData).then(dataArray => {
    renderSearchResults(dataArray);
  });
}

function renderSearchResults(dataArray) {
  const tbody = document.getElementById("search-results");
  tbody.innerHTML = "";
  dataArray.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.usd} USD / ${item.eur} EUR</td>
      <td><button onclick="showDetail('${item.id}')">Detal</button></td>
    `;
    tbody.appendChild(row);
  });
}

// -------------------------------------------------------------------------------------------------------
// ФУНКЦИИ ЗА КУПУВАЊЕ / ПРОДАВАЊЕ / ИСТОРИЈА
// -------------------------------------------------------------------------------------------------------

function buyCrypto(coin) {
  let amount = prompt(`Колку ${coin.toUpperCase()} сакате да купите?`);
  if (amount && !isNaN(amount) && amount > 0) {
    alert(`Успешно купивте ${amount} ${coin.toUpperCase()}.`);
    saveTransaction("Kupovina", coin, amount);
  } else {
    alert("Внесете валиден износ!");
  }
}

function sellCrypto(coin) {
  let amount = prompt(`Колку ${coin.toUpperCase()} сакате да продадете?`);
  if (amount && !isNaN(amount) && amount > 0) {
    alert(`Успешно продадовте ${amount} ${coin.toUpperCase()}.`);
    saveTransaction("Prodaja", coin, amount);
  } else {
    alert("Внесете валиден износ!");
  }
}

function saveTransaction(type, coin, amount) {
  let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
  let newTransaction = {
    type: type,
    coin: coin.toUpperCase(),
    amount: amount,
    time: new Date().toLocaleString()
  };

  transactions.push(newTransaction);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  renderTransactionHistory();
}

function renderTransactionHistory() {
  let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
  let tableBody = document.getElementById("transaction-history");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  transactions.forEach(transaction => {
    tableBody.innerHTML += `
      <tr>
        <td>${transaction.type}</td>
        <td>${transaction.coin}</td>
        <td>${transaction.amount}</td>
        <td>${transaction.time}</td>
      </tr>
    `;
  });
}

renderTransactionHistory();

// -------------------------------------------------------------------------------------------------------
// ФУНКЦИИ ЗА КОНВЕРЗИЈА
// -------------------------------------------------------------------------------------------------------

async function convertCurrency() {
  let amount = document.getElementById("amount").value;
  let from = document.getElementById("fromCurrency").value;
  let to = document.getElementById("toCurrency").value;

  if (!amount) {
    alert("Внесете износ за конверзија.");
    return;
  }

  // Ако e custom, земи го од customPrices
  if (customPrices[from]) {
    let rate = to === "usd" ? customPrices[from].usd : customPrices[from].eur;
    let convertedAmount = amount * rate;
    document.getElementById("result").innerText =
      `${amount} ${from.toUpperCase()} = ${convertedAmount.toFixed(2)} ${to.toUpperCase()}`;
    return;
  }

  // За динамичките, земи го од CoinGecko
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${from}&vs_currencies=${to}`;
  try {
    let response = await fetch(url);
    let data = await response.json();

    if (!data[from] || !data[from][to]) {
      throw new Error(`Нема податоци за ${from} во валута ${to.toUpperCase()}`);
    }

    let rate = data[from][to];
    let convertedAmount = amount * rate;
    document.getElementById("result").innerText =
      `${amount} ${from.toUpperCase()} = ${convertedAmount.toFixed(2)} ${to.toUpperCase()}`;
  } catch (error) {
    console.error("Дојде до грешка при добивање на податоци:", error);
    alert(`Дојде до грешка: ${error.message}`);
  }
}
