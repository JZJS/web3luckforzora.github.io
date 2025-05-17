function showComingSoon() {
  document.getElementById("comingSoonModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("comingSoonModal").style.display = "none";
}

function showMatchCoinModal() {
  console.log("Showing matchCoinModal...");
  document.getElementById("matchCoinModal").style.display = "flex";
}

function closeMatchCoinModal() {
  document.getElementById("matchCoinModal").style.display = "none";
}

// 显示断开钱包确认弹窗
function showDisconnectConfirmModal() {
  document.getElementById("disconnectConfirmModal").style.display = "flex";
}

// 关闭断开钱包确认弹窗
function closeDisconnectConfirmModal() {
  document.getElementById("disconnectConfirmModal").style.display = "none";
}

// 确认断开钱包连接
function confirmDisconnect() {
  closeDisconnectConfirmModal();
  // 触发断开连接事件
  const disconnectEvent = new CustomEvent('confirmDisconnect');
  document.dispatchEvent(disconnectEvent);
}

function showJoinBetModal(title, message, showConfirm = false) {
  document.getElementById("joinBetModalTitle").innerText = title;
  document.getElementById("joinBetModalText").innerText = message;

  // 控制按钮显示
  document.querySelector("#joinBetModal .modal-bottom").style.display = showConfirm ? "flex" : "none";

  document.getElementById("joinBetModal").style.display = "flex";
}

function closeJoinBetModal() {
  document.getElementById("joinBetModal").style.display = "none";
}
