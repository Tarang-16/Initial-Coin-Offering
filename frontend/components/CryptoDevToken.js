import { providers, Contract, BigNumber, utils } from "ethers";
import React, { useState, useRef, useEffect } from "react";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css";
import {
  abi,
  nftabi,
  contractAddresses,
  nftcontractAddresses,
} from "../constants";

export default function CryptoDevToken() {
  const zero = BigNumber.from(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokensMinted, setTokensMinted] = useState(zero); // number of tokens that have been minted till now.
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero); // tracks the number of token to be claimed
  const [tokenAmount, setTokenAmount] = useState(zero); // amount of tokens user want to mint
  const [isOwner, setIsOwner] = useState(false);
  const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] =
    useState(zero); // balanceOfCryptoDevTokens keeps track of number of Crypto Dev tokens owned by an address

  const web3ModalRef = useRef();

  async function getSigner() {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Change the network to Goerli");
      //   throw new Error("Change network to Goerli");
    }

    const signer = web3Provider.getSigner();
    return signer;
  }

  async function connectWallet() {
    try {
      await getSigner();
      setWalletConnected(true);
    } catch (err) {
      console.log(err);
    }
  }

  async function getTokensToBeClaimed() {
    try {
      const signer = await getSigner();

      const nftContract = new Contract(
        nftcontractAddresses[5][0],
        nftabi,
        signer
      );
      const tokenContract = new Contract(contractAddresses[5][0], abi, signer);

      const address = await signer.getAddress();
      const balance = await nftContract.balanceOf(address);
      if (balance === zero) {
        setTokensToBeClaimed(zero);
      } else {
        var amount = 0;
        for (var i = 0; i < balance; i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId);

          if (!claimed) {
            amount++;
          }
        }
        setTokensToBeClaimed(BigNumber.from(amount));
      }
    } catch (err) {
      console.log(err);
      setTokensToBeClaimed(zero);
    }
  }

  async function getBalanceOfCryptoDevTokens() {
    try {
      const signer = await getSigner();

      const tokenContract = new Contract(contractAddresses[5][0], abi, signer);

      const address = await signer.getAddress();
      const balance = await tokenContract.balanceOf(address);

      setBalanceOfCryptoDevTokens(balance);
    } catch (err) {
      console.log(err);
      setBalanceOfCryptoDevTokens(zero);
    }
  }

  async function mintCryptoDevToken(amount) {
    try {
      const signer = await getSigner();

      const tokenContract = new Contract(contractAddresses[5][0], abi, signer);

      const value = 0.001 * amount;

      setTokenAmount(amount);
      const tx = await tokenContract.mint(amount, {
        value: utils.parseEther(value.toString()),
      });
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("Sucessfully minted Crypto Dev Tokens");
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (err) {
      console.log(err);
    }
  }

  async function claimCryptoDevTokens() {
    const signer = await getSigner();

    const tokenContract = new Contract(contractAddresses[5][0], abi, signer);
    const tx = await tokenContract.claim();
    setLoading(true);
    await tx.wait();
    setLoading(false);
    window.alert("Sucessfully claimed Crypto Dev Tokens");
    await getBalanceOfCryptoDevTokens();
    await getTotalTokensMinted();
    await getTokensToBeClaimed();
  }

  async function getTotalTokensMinted() {
    try {
      const signer = await getSigner();

      const tokenContract = new Contract(contractAddresses[5][0], abi, signer);
      const _tokensMinted = await tokenContract.totalSupply();
      setTokensMinted(_tokensMinted);
    } catch (err) {
      console.log(err);
    }
  }

  async function getOwner() {
    try {
      const signer = await getSigner();

      const tokenContract = new Contract(contractAddresses[5][0], abi, signer);
      const _owner = await tokenContract.owner();
      const address = await signer.getAddress();

      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function withdrawCoins() {
    try {
      const signer = await getSigner();

      const tokenContract = new Contract(contractAddresses[5][0], abi, signer);
      const tx = await tokenContract.withdraw();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await getOwner();
    } catch (err) {
      console.log(err);
      window.alert(err.reason);
    }
  }

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      connectWallet();
      getBalanceOfCryptoDevTokens();
      getOwner();
      getTokensToBeClaimed();
      getTotalTokensMinted();
    }
  }, [walletConnected]);

  const renderButton = () => {
    // If we are currently waiting for something, return a loading button
    if (loading) {
      return (
        <div>
          <button className={styles.button}>Loading...</button>
        </div>
      );
    }
    // If tokens to be claimed are greater than 0, Return a claim button
    if (tokensToBeClaimed > 0) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} Tokens can be claimed!
          </div>
          <button className={styles.button} onClick={claimCryptoDevTokens}>
            Claim Tokens
          </button>
        </div>
      );
    }
    // If user doesn't have any tokens to claim, show the mint button
    return (
      <div style={{ display: "flex-col" }}>
        <div>
          <input
            type="number"
            placeholder="Amount of Tokens"
            // BigNumber.from converts the `e.target.value` to a BigNumber
            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
            className={styles.input}
          />
        </div>

        <button
          className={styles.button}
          disabled={!(tokenAmount > 0)}
          onClick={() => mintCryptoDevToken(tokenAmount)}
        >
          Mint Tokens
        </button>
      </div>
    );
  };

  return (
    <div>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs ICO!</h1>
          <div className={styles.description}>
            You can claim or mint Crypto Dev tokens here
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                You have minted {utils.formatEther(balanceOfCryptoDevTokens)}{" "}
                Crypto Dev Tokens
              </div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                Overall {utils.formatEther(tokensMinted)}/10000 have been
                minted!!!
              </div>
              {renderButton()}
              {/* Display additional withdraw button if connected wallet is owner */}
              {isOwner ? (
                <div>
                  {loading ? (
                    <button className={styles.button}>Loading...</button>
                  ) : (
                    <button className={styles.button} onClick={withdrawCoins}>
                      Withdraw Coins
                    </button>
                  )}
                </div>
              ) : (
                ""
              )}
            </div>
          ) : (
            <button onClick={connectWallet} className={styles.button}>
              Connect your wallet
            </button>
          )}
        </div>
        <div>
          <img className={styles.image} src="./0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Tarang Tyagi
      </footer>
    </div>
  );
}
