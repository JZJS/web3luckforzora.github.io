let isLoggedIn = false;

function shortenAddress(address) {
  return address.slice(0, 4) + "..." + address.slice(-4);
}

async function connectPhantomWallet() {
  const provider = window.solana;
  if (!provider?.isPhantom) {
    alert("Phantom wallet not found.");
    return;
  }

  try {
    const resp = await provider.connect({ onlyIfTrusted: false });
    const address = resp.publicKey.toString();

    try {
      console.log("Attempting to register wallet:", address);

      const response = await fetch("https://db.yuxialun123.workers.dev/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ wallet: address })
      });

      console.log("Response status:", response.status);

      let responseData;
      try {
        responseData = await response.json();
        console.log("Response data:", responseData);
      } catch (jsonError) {
        console.error("Failed to parse response as JSON:", jsonError);
        const textResponse = await response.text();
        console.log("Raw response:", textResponse);
        throw new Error(`Invalid response format: ${textResponse}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${responseData?.message || 'Unknown error'}`);
      }

      // ✅ 注册成功后才更新状态
      updateButton(shortenAddress(address));
      isLoggedIn = true;
      window.currentWallet = address;                          // ✅ 添加
      localStorage.setItem('wallet', address);                 // ✅ 可选持久化
      localStorage.setItem('walletConnected', 'true');


      // ✅ 显示当前积分
      updatePointsDisplay(address);

      // ✅ 添加：激活签到按钮
      if (typeof window.onWalletConnected === "function") {
        window.onWalletConnected(address);
      }

    } catch (workerError) {
      console.error("Failed to register wallet. Error details:", {
        error: workerError,
        message: workerError.message,
        stack: workerError.stack
      });
      await provider.disconnect();
      alert("Failed to register wallet. Please check console for details.");
      return;
    }

  } catch (err) {
    console.error("Connection failed:", err);
    updateButton("Connect Wallet");
  }
}


async function disconnectPhantomWallet() {
  const provider = window.solana;
  if (provider?.isConnected) {
    try {
      await provider.disconnect();
      updateButton("Connect Wallet");
      isLoggedIn = false;
      
      // 清除钱包相关状态
      window.currentWallet = null;
      localStorage.removeItem("wallet");
      localStorage.removeItem("walletConnected");
      
      // 清除积分显示
      const el = document.getElementById("points-display");
      if (el) {
        el.innerHTML = `You currently own : 0 <img src="images/luck.ico" alt="luck icon" style="width: 14px; height: 14px; vertical-align: middle;">`;
      }
      
      // 重置签到按钮
      const checkInBtn = document.getElementById("check-in-btn");
      if (checkInBtn) {
        checkInBtn.disabled = true;
        checkInBtn.innerHTML = "Check In";
      }
    } catch (err) {
      console.error("Disconnection failed:", err);
    }
  }
}

function updateButton(text) {
  const btn = document.getElementById("connect-wallet-btn");
  if (btn) {
    btn.textContent = text;
  }
}

async function updatePointsDisplay(wallet) {
  try {
    const res = await fetch("https://db.yuxialun123.workers.dev/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet })
    });

    const data = await res.json();
    if (data.status === "ok" && data.data) {
      const points = data.data.points;
      const el = document.getElementById("points-display");
      if (el) {
        el.innerHTML = `You currently own : 
          ${points}
          <img src="images/luck.ico" alt="luck icon" style="width: 14px; height: 14px; vertical-align: middle;">`;
      }
    }
  } catch (err) {
    console.error("❌ Failed to fetch points:", err);
  }
}


document.addEventListener("DOMContentLoaded", async () => {
  const btn = document.getElementById("connect-wallet-btn");
  if (!btn) return;

  updateButton("Connect Wallet");

  const provider = window.solana;

  // 自动尝试恢复连接（无弹窗）
  if (localStorage.getItem("walletConnected") === "true" && provider?.isPhantom) {
    try {
      const resp = await provider.connect({ onlyIfTrusted: true });
      const address = resp.publicKey.toString();

      // 自动注册 + 恢复显示
      await fetch("https://db.yuxialun123.workers.dev/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ wallet: address })
      });

      window.currentWallet = address;
      isLoggedIn = true;
      updateButton(shortenAddress(address));
      updatePointsDisplay(address);
    } catch (e) {
      console.warn("⚠️ Auto-connect failed or not trusted yet");
    }
  }

  // 注册连接/断开监听
  if (provider?.isPhantom) {
    provider.on("connect", () => {
      const address = provider.publicKey?.toString();
      if (address) {
        updateButton(shortenAddress(address));
        isLoggedIn = true;
      }
    });

    provider.on("disconnect", () => {
      disconnectPhantomWallet();
    });
  }

  // 按钮点击事件
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!provider?.isPhantom) {
      alert("Phantom wallet not found.");
      return;
    }

    if (isLoggedIn) {
      showDisconnectConfirmModal();
    } else {
      await connectPhantomWallet();
    }
  });

  // 断开确认事件
  document.addEventListener("confirmDisconnect", async () => {
    await disconnectPhantomWallet();
  });
});

