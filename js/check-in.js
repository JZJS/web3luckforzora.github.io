// ✅ 完整版 check-in.js，保留所有按钮功能与签到逻辑 + 清理函数
const checkInBtn = document.getElementById("check-in-btn");
const rewards = [600, 800, 1000, 1200, 1400, 1600, 2000];

// ✅ 日历高亮签到日
function highlightCheckInDay(day) {
  const cells = document.querySelectorAll("#calendar-body td");
  cells.forEach(cell => {
    if (parseInt(cell.textContent) === day) {
      cell.classList.add("checked");
    }
  });
}

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

function getCheckInCount() {
  const weekKey = getWeekStart();
  const data = JSON.parse(localStorage.getItem("checkin_record") || "{}");
  return data[weekKey]?.count || 0;
}

function incrementCheckInCount() {
  const weekKey = getWeekStart();
  const data = JSON.parse(localStorage.getItem("checkin_record") || "{}")
  if (!data[weekKey]) data[weekKey] = { count: 1 };
  else data[weekKey].count++;
  localStorage.setItem("checkin_record", JSON.stringify(data));
}

async function updateStatusAndUI(wallet) {
  try {
    const res = await fetch("https://db.yuxialun123.workers.dev/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet })
    });

    const data = await res.json();
    if (data.status === "ok" && data.data) {
      const d = data.data;
      const el = document.getElementById("points-display");
      if (el) {
        el.innerHTML = `You currently own : 
          ${d.points}
          <img src="images/luck.ico" alt="luck icon" style="width: 14px; height: 14px; vertical-align: middle;">`;
      }

      const checkInCount = getCheckInCount();
      if (d.checked_in_today === 1) {
        checkInBtn.disabled = true;
        checkInBtn.innerHTML = "Already Checked Today";
        highlightCheckInDay(new Date().getDate());
      } else {
        const reward = rewards[checkInCount] || rewards[rewards.length - 1];
        checkInBtn.disabled = false;
        checkInBtn.innerHTML = `Check In +${reward} 
          <img src="images/luck.ico" style="width:14px; vertical-align:middle; margin-right:4px;">`;
      }
    }
  } catch (err) {
    console.error("❌ Failed to fetch /status:", err);
  }
}

async function handleCheckIn(wallet) {
  try {
    const statusRes = await fetch("https://db.yuxialun123.workers.dev/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet })
    });
    const statusData = await statusRes.json();
    if (!statusData || statusData.status !== "ok" || !statusData.data) return;

    const user = statusData.data;
    if (user.checked_in_today === 1) {
      alert("You have already checked in today!");
      return;
    }

    const count = getCheckInCount();
    const reward = rewards[count] || rewards[rewards.length - 1];

    const checkInRes = await fetch("https://db.yuxialun123.workers.dev/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet, count: count + 1 })
    });

    const checkInData = await checkInRes.json();
    if (checkInData.status === "ok") {
      alert(`Check-in successful! You earned +${checkInData.points_added} points.`);
      incrementCheckInCount();
      highlightCheckInDay(new Date().getDate());
    } else if (checkInData.status === "already_checked") {
      alert("You have already checked in today.");
    } else {
      alert("Check-in failed.");
    }

    await updateStatusAndUI(wallet);
  } catch (err) {
    console.error("❌ Check-in failed:", err);
  }
}

function handleFollowX() {
  const wallet = window.currentWallet || localStorage.getItem("wallet");
  if (!wallet) return;

  // ✅ 先打开链接
  window.open("https://x.com/BTCtensai", "_blank");

  // ✅ 再后台打分
  fetch("https://db.yuxialun123.workers.dev/follow-x", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet })
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "ok") {
        alert("Follow successful! +4000 points");
        updateStatusAndUI(wallet);
      } else if (data.status === "already_followed") {
        alert("You already followed.");
      } else {
        alert("Follow failed.");
      }
    });
}

function handleJoinDiscord() {
  const wallet = window.currentWallet || localStorage.getItem("wallet");
  if (!wallet) return;

  // ✅ 先打开 Discord 链接
  window.open("https://discord.gg/JG2bta4e", "_blank");

  // ✅ 再后台打分
  fetch("https://db.yuxialun123.workers.dev/join-discord", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet })
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "ok") {
        alert("Joined Discord! +4000 points");
        updateStatusAndUI(wallet);
      } else if (data.status === "already_joined") {
        alert("Already joined Discord.");
      } else {
        alert("Join Discord failed.");
      }
    });
}


function cleanup() {
  if (checkInBtn) {
    checkInBtn.removeEventListener("click", handleCheckIn);
  }

  const followXBtn = document.getElementById("follow-x-btn");
  if (followXBtn) {
    followXBtn.removeEventListener("click", handleFollowX);
  }

  const joinDiscordBtn = document.getElementById("join-discord-btn");
  if (joinDiscordBtn) {
    joinDiscordBtn.removeEventListener("click", handleJoinDiscord);
  }
}

// ✅ 页面加载时初始化状态
(async () => {
  try {
    const wallet = window.currentWallet || localStorage.getItem("wallet");
    const followXBtn = document.getElementById("follow-x-btn");
    const joinDiscordBtn = document.getElementById("join-discord-btn");

    if (wallet) {
      if (checkInBtn) {
        checkInBtn.disabled = true;
        checkInBtn.innerHTML = "Loading...";
      }

      await updateStatusAndUI(wallet);

      if (checkInBtn) {
        checkInBtn.disabled = false;
        checkInBtn.addEventListener("click", () => handleCheckIn(wallet));
      }

      if (followXBtn) {
        followXBtn.addEventListener("click", handleFollowX);
      }

      if (joinDiscordBtn) {
        joinDiscordBtn.addEventListener("click", handleJoinDiscord);
      }

    } else {
      console.warn("Wallet not connected.");

      if (checkInBtn) {
        checkInBtn.addEventListener("click", () => {
          alert("Please connect your wallet first before checking in!");
        });
      }

      if (followXBtn) {
        followXBtn.addEventListener("click", () => {
          alert("Please connect your wallet first before following on X!");
        });
      }

      if (joinDiscordBtn) {
        joinDiscordBtn.addEventListener("click", () => {
          alert("Please connect your wallet first before joining Discord!");
        });
      }
    }

  } catch (error) {
    console.error("Failed to initialize check-in system:", error);
    if (checkInBtn) {
      checkInBtn.disabled = false;
      checkInBtn.innerHTML = "Check In";
    }
  }
})();


window.onWalletConnected = async function(wallet) {
  await updateStatusAndUI(wallet);

  if (checkInBtn) {
    const newBtn = checkInBtn.cloneNode(true);
    checkInBtn.parentNode.replaceChild(newBtn, checkInBtn);
    newBtn.addEventListener("click", () => handleCheckIn(wallet));
  }

  const followXBtn = document.getElementById("follow-x-btn");
  if (followXBtn) {
    const newFollowBtn = followXBtn.cloneNode(true);
    followXBtn.parentNode.replaceChild(newFollowBtn, followXBtn);
    newFollowBtn.addEventListener("click", () => handleFollowX(wallet));
  }

  const joinDiscordBtn = document.getElementById("join-discord-btn");
  if (joinDiscordBtn) {
    const newJoinBtn = joinDiscordBtn.cloneNode(true);
    joinDiscordBtn.parentNode.replaceChild(newJoinBtn, joinDiscordBtn);
    newJoinBtn.addEventListener("click", () => handleJoinDiscord(wallet));
  }
};


function generateCalendar() {
  let tbody = document.getElementById("calendar-body");
  if (!tbody) return;

  let date = new Date();
  date.setDate(1);
  let firstDayIndex = date.getDay();
  let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  let html = "";
  let dayCount = 1;

  for (let i = 0; i < 6; i++) {
    let row = "<tr>";
    for (let j = 0; j < 7; j++) {
      if ((i === 0 && j < firstDayIndex) || dayCount > lastDay) {
        row += "<td></td>";
      } else {
        row += `<td>${dayCount}</td>`;
        dayCount++;
      }
    }
    row += "</tr>";
    html += row;
  }
  tbody.innerHTML = html;
}

generateCalendar();
