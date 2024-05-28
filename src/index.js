import contractABI from "./abi.json";

// 2️⃣ Set your smart contract address 👇
const contractAddress = "0xa9E14bC80dF1738e6efB5d8874F093095a48e9Ea";

let web3 = new Web3(window.ethereum);




// 3️⃣ connect to the contract using web3
// HINT: https://web3js.readthedocs.io/en/v1.2.11/web3-eth-contract.html#new-contract
// let contract = YOUR CODE
const contract = new web3.eth.Contract(contractABI,contractAddress)


async function connectWallet() {
  if (window.ethereum) {
    // 1️⃣ Request Wallet Connection from Metamask
    // ANSWER can be found here: https://docs.metamask.io/wallet/get-started/set-up-dev-environment/
    // const accounts = YOUR CODE

    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      .then((err) => {
        if (err.code == '4001') {
        console.log("Please connect to metamask")
        } else {
          console.log(err)

          setConnected(err[0])
      }
      })
 
  } else {
    console.error("No web3 provider detected");
    document.getElementById("connectMessage").innerText =
      "No web3 provider detected. Please install MetaMask.";
  }
}

async function createTweet(content) {
  const accounts = await web3.eth.getAccounts();
  try {
    // 4️⃣ call the contract createTweet method in order to crete the actual TWEET
    // HINT: https://web3js.readthedocs.io/en/v1.2.11/web3-eth-contract.html#methods-mymethod-send
    // use the "await" feature to wait for the function to finish execution
    // what is await? https://javascript.info/async-await

    await contract.methods.createTweet(content).send({from: accounts[0]})
    // 7️⃣ Uncomment the displayTweets function! PRETTY EASY 🔥
    // GOAL: reload tweets after creating a new tweet
    displayTweets(accounts[0]);


  } catch (error) {
    console.error("User rejected request:", error);
  }
}

async function displayTweets(userAddress) {
  const tweetsContainer = document.getElementById("tweetsContainer");
  let tempTweets = [];
  tweetsContainer.innerHTML = "";
  // 5️⃣ call the function getAllTweets from smart contract to get all the tweets
  // HINT: https://web3js.readthedocs.io/en/v1.2.11/web3-eth-contract.html#methods-mymethod-call
  // tempTweets = await YOUR CODE\

  tempTweets = Array.from(await contract.methods.getAllTweets(userAddress).call())

  // we do this so we can sort the tweets  by timestamp
  const tweets = [...tempTweets];
  tweets.sort((a, b) => b.timestamp - a.timestamp);
  for (let i = 0; i < tweets.length; i++) {
    const tweetElement = document.createElement("div");
    tweetElement.className = "tweet";

    const userIcon = document.createElement("img");
    userIcon.className = "user-icon";
    userIcon.src = `https://avatars.dicebear.com/api/human/${tweets[i].author}.svg`;
    userIcon.alt = "User Icon";

    tweetElement.appendChild(userIcon);

    const tweetInner = document.createElement("div");
    tweetInner.className = "tweet-inner";

    tweetInner.innerHTML += `
        <div class="author">${shortAddress(tweets[i].author)}</div>
        <div class="content">${tweets[i].content}</div>
    `;

    const likeButton = document.createElement("button");
    likeButton.className = "like-button";
    likeButton.innerHTML = `
        <i class="far fa-heart"></i>
        <span class="likes-count">${tweets[i].likes}</span>
    `;
    likeButton.setAttribute("data-id", tweets[i].id);
    likeButton.setAttribute("data-author", tweets[i].author);

    addLikeButtonListener(
      likeButton,
      userAddress,
      tweets[i].id,
      tweets[i].author
    );
    tweetInner.appendChild(likeButton);
    tweetElement.appendChild(tweetInner);

    tweetsContainer.appendChild(tweetElement);
  }
}

function addLikeButtonListener(likeButton, address, id, author) {
  likeButton.addEventListener("click", async (e) => {
    e.preventDefault();

    e.currentTarget.innerHTML = '<div class="spinner"></div>';
    e.currentTarget.disabled = true;
    try {
      await likeTweet(author, id);
      displayTweets(address);
    } catch (error) {
      console.error("Error liking tweet:", error);
    }
  });
}

function shortAddress(address, startLength = 6, endLength = 4) {
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

async function likeTweet(author, id) {
  const accounts = await web3.eth.getAccounts()
  try {
    // 8️⃣ call the likeTweet function from smart contract
    // INPUT: author and id
    // GOAL: Save the like in the smart contract
    // HINT: don't forget to use await 😉 👇
    await contract.methods.likeTweet(author, id).send({from: accounts[0]})
  } catch (error) {
    console.error("User rejected request:", error);
  }
}

function setConnected(address) {
  document.getElementById("userAddress").innerText =
    "Connected: " + shortAddress(address);
  document.getElementById("connectMessage").style.display = "none";
  document.getElementById("tweetForm").style.display = "block";

  // 6️⃣ Call the displayTweets function with address as input
  // This is the function in the javascript code, not smart contract 😉
  // GOAL: display all tweets after connecting to metamask
  displayTweets(address)
}

document
  .getElementById("connectWalletBtn")
  .addEventListener("click", connectWallet);

document.getElementById("tweetForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const content = document.getElementById("tweetContent").value;
  const tweetSubmitButton = document.getElementById("tweetSubmitBtn");
  tweetSubmitButton.innerHTML = '<div class="spinner"></div>';
  tweetSubmitButton.disabled = true;
  try {
    await createTweet(content);
  } catch (error) {
    console.error("Error sending tweet:", error);
  } finally {
    // Restore the original button text
    tweetSubmitButton.innerHTML = "Tweet";
    tweetSubmitButton.disabled = false;
  }
});
