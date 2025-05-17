
// 倒计时
function startBetCountdown() {
  const timerElement = document.getElementById("bet_timer");

  function updateCountdown() {
    const now = new Date();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    if (minutes >= 50) {
      timerElement.innerHTML = "Bet is closed. Please wait for the next hour!";
      timerElement.style.color = "red";
    } else {
      const remainingMinutes = 49 - minutes;
      const remainingSeconds = 59 - seconds;
      timerElement.innerHTML = `Time left to join: ${String(remainingMinutes).padStart(2, '0')}m ${String(remainingSeconds).padStart(2, '0')}s`;
      timerElement.style.color = "#5a2ea6";
    }
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}
document.addEventListener("DOMContentLoaded", startBetCountdown);

// Lucky Token + 积分加载
let currentPoints = 0;
async function loadUserLuckyToken() {
  const wallet = window.currentWallet || localStorage.getItem("wallet");
  if (!wallet) return;

  try {
    const res = await fetch("https://db.yuxialun123.workers.dev/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet }),
    });
    const data = await res.json();
    if (data?.data) {
      currentPoints = data.data.points || 0;
      if (data.data.matched_today === 1) {
        document.getElementById("user_token_name").innerText = data.data.matched_token_name;
        document.getElementById("user_token_address").innerText = data.data.matched_token;
      } else {
        document.getElementById("user_token_name").innerText = "You haven't matched a token today!";
        document.getElementById("user_token_address").innerText = "";
      }
    }
  } catch (err) {
    console.error("❌ Error loading lucky token:", err);
  }
}
window.addEventListener("DOMContentLoaded", loadUserLuckyToken);
setInterval(loadUserLuckyToken, 10 * 60 * 1000);

// JoinBet 弹窗
function showJoinBetModal(title, message, showConfirm, onConfirm = null) {
  const modal = document.getElementById("joinBetModal");
  document.getElementById("joinBetModalTitle").innerText = title;
  document.getElementById("joinBetModalText").innerText = message;

  const buttonContainer = document.getElementById("joinBetModalButtons");
  buttonContainer.innerHTML = "";

  if (showConfirm) {
    const confirmBtn = document.createElement("button");
    confirmBtn.className = "book_btn2";
    confirmBtn.innerText = "Confirm";
    confirmBtn.onclick = () => {
      if (onConfirm) onConfirm();
      closeJoinBetModal();
    };
    buttonContainer.appendChild(confirmBtn);

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "book_btn2";
    cancelBtn.innerText = "Cancel";
    cancelBtn.onclick = closeJoinBetModal;
    buttonContainer.appendChild(cancelBtn);
  } else {
    const okBtn = document.createElement("button");
    okBtn.className = "book_btn2";
    okBtn.innerText = "OK";
    okBtn.onclick = closeJoinBetModal;
    buttonContainer.appendChild(okBtn);
  }

  modal.style.display = "flex";
}

function closeJoinBetModal() {
  document.getElementById("joinBetModal").style.display = "none";
}

// 点击“Join Bet”按钮主逻辑
async function confirmJoinBet() {
  const now = new Date();
  const minute = now.getMinutes();
  const hourKey = `bet_joined_${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}`;

  if (minute >= 50) {
    showJoinBetModal("Not Allowed", "Please join only in the first 50 minutes of each hour.", false);
    return;
  }

  // if (localStorage.getItem(hourKey)) {
  //  showJoinBetModal("Failed", "❌ You have already joined this bet.", false);
  //  return;
  // }

  const tokenName = document.getElementById("user_token_name").innerText;
  const tokenAddress = document.getElementById("user_token_address").innerText;

  if (!tokenName || !tokenAddress || tokenName.includes("haven't matched")) {
    showJoinBetModal("Match Required", "Please match a token first before joining the Bet!", false);
    return;
  }

  if (currentPoints < 500) {
    showJoinBetModal("Insufficient Points", `You need at least 500 points to join the Bet. Current: ${currentPoints}`, false);
    return;
  }

  showJoinBetModal("Confirm Join", `Use 500 points to join Bet with:\n${tokenName}`, true, () => {
    submitBet(tokenName, tokenAddress, hourKey);
  });
}

// 确认扣除积分 + 显示结果
async function submitBet(name, address, hourKey) {
  const wallet = window.currentWallet || localStorage.getItem("wallet");
  try {
    const res = await fetch("https://db.yuxialun123.workers.dev/deduct-points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet: wallet,
        amount: 500 // 正确字段为 amount，不能是负数
      })
    });

    const result = await res.json();
    if (!result || result.status !== "ok") {
      throw new Error("❌ Failed to deduct points");
    }
    await updateStatusAndUI(wallet);

    // 标记用户已参加
    localStorage.setItem(hourKey, "joined");

    // 添加到UI列表中
    // ✅ 获取小时涨跌幅
    // ✅ 记录参与bet时的price_start，并插入数据库
    async function fetchPriceStartFromBitquery(address) {
      const bitquery = `{
        Solana {
          DEXTrades(
            limitBy: { by: Trade_Buy_Currency_MintAddress, count: 1 }
            limit: { count: 1 }
            orderBy: { descending: Trade_Buy_Price }
            where: {
              Trade: {
                Dex: { ProtocolName: { is: \"pump\" } },
                Buy: {
                  Currency: { MintAddress: { is: \"${address}\" } },
                  PriceInUSD: { gt: 0.000000001 }
                },
                Sell: { AmountInUSD: { gt: \"100\" } }
              },
              Transaction: { Result: { Success: true } }
            }
          ) {
            Trade {
              Buy {
                PriceInUSD
              }
            }
          }
        }
      }`;

      try {
        const res = await fetch("https://streaming.bitquery.io/eap", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer ory_at_w4ksZ0eLAzBvJCPUR2bjIwFysVq0K5dZxqKu1Dyv_yY.Y0774pG6CVbdtxEmhjEeI5WBtcMyNGDNqY_1S01oB9E"
          },
          body: JSON.stringify({ query: bitquery })
        });
        const json = await res.json();
        return json?.data?.Solana?.DEXTrades?.[0]?.Trade?.Buy?.PriceInUSD || null;
      } catch (err) {
        console.error("❌ Failed to fetch price from Bitquery:", err);
        return null;
      }
    }

    const priceStart = await fetchPriceStartFromBitquery(address);

    if (!priceStart) {
      showJoinBetModal("Price Error", "❌ Failed to get token price, please try again later.", false);
      return;
    }

    // ⚠️ 插入数据库（补上 bet_hour 和 joined_at）
    const now = new Date();
    const bet_hour = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}`;
    const joined_at = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString();

    const insertRes = await fetch("https://db.yuxialun123.workers.dev/joinbet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet,
        token_name: name,
        token_address: address,
        price_start: priceStart,
        bet_hour,
        joined_at
      })
    });

    const insertJson = await insertRes.json();

    // ❌ 若已参与，直接中断，不渲染、不查价格
    if (insertJson?.status === "already_joined") {
      showJoinBetModal("Failed", "❌ You have already joined this bet.", false);
      return;
    }

    // ✅ 获取小时涨跌幅（只有成功写入后才查）
    const resPrice = await fetch("https://db.yuxialun123.workers.dev/token-price-change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet, token_address: address })
    });

    let pctChange = "--";
    try {
      const priceData = await resPrice.json();
      if (priceData?.status === "ok") {
        const change = priceData.price_change_1h;
        pctChange = (change >= 0 ? "+" : "") + (change * 100).toFixed(2) + "%";
      }
    } catch (e) {
      console.error("📉 Failed to fetch price change:", e);
    }

    // ✅ 添加到UI列表中（仅成功写入的情况下）
    const row = document.createElement("li");
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.padding = "4px 0";
    row.innerHTML = `
      <div style="display: flex; padding: 8px 0; border-bottom: 1px solid #eee;">
        <div style="flex: 2; text-align: center;">${name}</div>
        <div style="flex: 3; text-align: center;">${address.slice(0, 6)}...${address.slice(-4)}</div>
        <div style="flex: 1; text-align: center;">${pctChange}</div>
      </div>
    `;
    const list = document.querySelector("#bet_token_list ul");
    if (list) list.appendChild(row);



    // 成功弹窗
    closeJoinBetModal();
    setTimeout(() => {
      showJoinBetModal("Success", "✅ You’ve successfully joined this hour’s Bet!", false);
    }, 100);

    await loadUserLuckyToken(); // 刷新积分显示
  } catch (err) {
    console.error("❌ Bet Failed:", err);
    showJoinBetModal("Failed", "❌ Failed to join Bet. Please try again later.", false);
  }
}

async function loadJoinedBets() {
  const wallet = window.currentWallet || localStorage.getItem("wallet");
  if (!wallet) return;

  const now = new Date();
  const bet_hour = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}`;

  try {
    const res = await fetch("https://db.yuxialun123.workers.dev/get-user-bets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet, bet_hour })
    });

    const data = await res.json();
    if (data?.status !== "ok" || !Array.isArray(data.bets)) return;

    const sorted = data.bets.sort((a, b) => (b.price_change_1h || 0) - (a.price_change_1h || 0));
    const list = document.querySelector("#bet_token_list ul");
    list.innerHTML = ""; // 清空旧内容

    for (const bet of sorted) {
      const change = bet.price_change_1h;
      const pctChange = (change >= 0 ? "+" : "") + (change * 100).toFixed(2) + "%";

      const row = document.createElement("li");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.padding = "4px 0";
      row.innerHTML = `
        <div style="display: flex; padding: 8px 0; border-bottom: 1px solid #eee;">
          <div style="flex: 2; text-align: center;">${bet.token_name}</div>
          <div style="flex: 3; text-align: center;">${bet.token_address.slice(0, 6)}...${bet.token_address.slice(-4)}</div>
          <div style="flex: 1; text-align: center;">${pctChange}</div>
        </div>
      `;
      list.appendChild(row);
    }
  } catch (err) {
    console.error("❌ Failed to load joined bets:", err);
  }
}


document.addEventListener("DOMContentLoaded", () => {
  startBetCountdown();
  loadUserLuckyToken();
  loadJoinedBets(); // ✅ 加载 bet 数据
});