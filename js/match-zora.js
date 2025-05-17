// MBTI权重
const mbtiWeights = {
    INTP: 1.3,
    INTJ: 1.5,
    ENFP: 1.2,
    INFJ: 1.4,
    ISFP: 1.1,
    ESTJ: 1.0,
    ENTJ: 1.4,
    ENFJ: 1.2,
    INFP: 1.3,
    ISTJ: 1.1,
    ISTP: 1.2,
    ESTP: 1.2,
    ESFP: 1.1,
    ESFJ: 1.0,
    ISFJ: 1.1,
};

// 获取 Zora 价格前100的代币
async function getZoraTokens() {
    console.log("Fetching Zora tokens...");

    try {
        console.log("Sending request...");

        const response = await fetch("https://api-sdk.zora.engineering/explore?listType=MOST_VALUABLE&count=100&after", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        console.log("Response status:", response.status);
        const result = await response.json();
        console.log("response:", result);

        if (result.errors) {
            console.error("GraphQL errors:", JSON.stringify(result.errors, null, 2));
            return [];
        }

        // 转换数据格式以匹配原有代码
        return result.exploreList.edges.map(edge => {
            const node = edge.node;
            return {
                name: node.name,
                symbol: node.symbol,
                marketCap: node.marketCap,
                previewImageSmall: node.mediaContent?.previewImage?.small,
                address: node.address,
            };
        });
    } catch (error) {
        console.error("Error fetching Zora tokens:", error);
        return [];
    }
}

// 字符串hash
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // 保持32位
    }
    return hash;
}

// 显示弹窗
function showMatchCoinModal() {
    const modal = document.getElementById("matchCoinModal");
    if (modal) {
        modal.style.display = "flex";
    }
}

// 关闭弹窗
function closeMatchCoinModal() {
    const modal = document.getElementById("matchCoinModal");
    if (modal) {
        modal.style.display = "none";
    }
}

// 主匹配函数
async function matchCoin() {
    const nicknameInput = document.getElementById("match_coin_nickname");
    const mbtiInput = document.getElementById("match_coin_mbti");

    const nickname = nicknameInput?.value.trim();
    const mbti = mbtiInput?.value.trim();


    if (!nickname || !mbti) {
        alert("Please enter your nickname and select your MBTI type.");
        return;
    }

    /*
    // ⚡️ 获取钱包状态
    const wallet = window.currentWallet || localStorage.getItem('wallet');

    if (wallet) {
        // ✅ 已连接钱包 ⇒ 查 cloudflare
        try {
            const statusResp = await fetch("https://db.yuxialun123.workers.dev/status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallet })
            });
            const statusData = await statusResp.json();

            if (statusData?.data?.matched_today === 1) {
                alert("You have already matched today!");
                return;
            }
        } catch (err) {
            console.error("Failed to check wallet match status:", err);
            alert("Network error while checking match status.");
            return;
        }

    } else {
        // ✅ 未连接钱包 ⇒ 用 localStorage 控制每天一次
        const today = new Date().toISOString().slice(0, 10); // e.g. "2025-05-11"
        const matchedDate = localStorage.getItem("local_matched_date");

        if (matchedDate === today) {
            alert("You have already matched once today. Connect your wallet to unlock full features!");
            return;
        }

        // ✅ 没匹配过，记录今天
        localStorage.setItem("local_matched_date", today);
    }

    // 🛑 到这里检查完毕，确认今天可以匹配，才继续下面逻辑
    */

    // 显示加载中动画
    document.getElementById("match_coin_loader").style.display = "block";
    document.querySelector(".modal-top").style.display = "none";
    document.querySelector(".modal-bottom").style.display = "none";
    showMatchCoinModal();

    try {
        console.log("Starting coin matching process...");
        const tokens = await getZoraTokens();
        console.log("Received tokens:", tokens);

        if (tokens.length === 0) {
            console.error("No tokens available from API");
            alert("No tokens available. Please try again later.");
            closeMatchCoinModal();
            return;
        }

        const weight = mbtiWeights[mbti] || 1.0;
        const hash = hashString(nickname);
        let index = Math.abs(Math.floor((hash % 100) * weight)) % tokens.length;
        console.log("Selected token index:", index);

        const matched = tokens[index];

        if (!matched) {
            console.error("No token matched at index:", index);
            alert("Matching failed. Please try again.");
            closeMatchCoinModal();
            return;
        }

        console.log("Matched token:", matched);
        const tokenName = matched.name || "Unknown";
        const tokenSymbol = matched.symbol || "Unknown";
        const marketCap = matched.marketCap ? `$${matched.marketCap}` : "Unknown";
        const tokenImageURL = matched.previewImageSmall;
        const tokenAddress = matched.address;

        const imgElement = document.getElementById("modal_coin_img");
        if (imgElement) {
            imgElement.src = tokenImageURL;
            imgElement.onerror = function() {
                this.onerror = null;
                this.src = "images/meme.png";
            };
        }

        const zoraLink = `https://zora.co/coin/base:${tokenAddress}`;

        // 更新弹窗内容
        document.getElementById("modal_coin_img").src = tokenImageURL;
        document.getElementById("modal_coin_name").innerText = `${tokenName} (${tokenSymbol})`;
        document.getElementById("buy_link").href = zoraLink;

        document.getElementById("twitter_share").href = `https://twitter.com/intent/tweet?text=I just matched my lucky token ${tokenName} today on Web3Luck! 🚀✨ Maybe buying it or betting with it could bring great fortune! 🔥 Check it out here: https://web3luck.com/`;

        document.getElementById("copy_link").setAttribute("data-link", zoraLink);

        document.getElementById("match_coin_loader").style.display = "none";
        document.querySelector(".modal-top").style.display = "flex";
        document.querySelector(".modal-bottom").style.display = "flex";

        /*
        // ✅ 如果连接了钱包，才调用 Cloudflare 写入接口
        if (wallet) {
            try {
                const registerResp = await fetch("https://db.yuxialun123.workers.dev/match", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        wallet: wallet,
                        name: nickname,
                        mbti: mbti,
                        token: tokenAddress,
                        token_name: tokenName
                    })
                });

                const registerData = await registerResp.json();
                if (registerData.status !== "ok") {
                    alert("Failed to save match info. Please try again later.");
                }
            } catch (err) {
                console.error("Cloudflare /match error:", err);
            }
        }*/

    } catch (error) {
        console.error("Matching error:", error);
        alert("Matching failed. Please try again later.");
        closeMatchCoinModal();
    }
    
}


// 切换分享菜单
function toggleShareMenu() {
    const menu = document.getElementById("shareMenu");
    if (menu.style.display === "block") {
        menu.style.display = "none";
    } else {
        menu.style.display = "block";
    }
}

// 复制购买链接
function copyToClipboard() {
    const link = document.getElementById("copy_link").getAttribute("data-link");
    navigator.clipboard.writeText(link).then(() => {
        alert("Link copied to clipboard!");
    }).catch((err) => {
        console.error('Failed to copy:', err);
    });
}