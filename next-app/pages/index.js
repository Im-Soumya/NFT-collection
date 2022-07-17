import Head from "next/head";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import React, { useState, useEffect, useRef } from "react";
import { NFTContractAddress, NFTContractABI } from "../constants";

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [tokensMinted, setTokenIdsMinted] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);

  const web3ModalRef = useRef();

  const presaleMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new ethers.Contract(
        NFTContractAddress,
        NFTContractABI.abi,
        signer
      );

      const txn = await nftContract.presaleMint({
        value: ethers.utils.parseEther("0.01"),
      });
      setLoading(true);
      console.log("Minting...");

      await txn.wait();
      setLoading(false);
      console.log("Minted a NFT!");
      alert("Minted a NFT");
    } catch (e) {
      console.log(e);
    }
  };

  const publicMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new ethers.Contract(
        NFTContractAddress,
        NFTContractABI.abi,
        signer
      );

      const txn = await nftContract.mint({
        value: ethers.utils.parseEther("0.01"),
      });
      setLoading(true);
      console.log("Minting...");

      await txn.wait();
      setLoading(false);
      console.log("Minted a NFT!");
      alert("Minted a NFT");
    } catch (e) {
      console.log(e);
    }
  };

  const startPresale = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new ethers.Contract(
        NFTContractAddress,
        NFTContractABI.abi,
        signer
      );

      const txn = await nftContract.startPresale();
      setLoading(true);

      await txn.wait();
      setLoading(false);

      await checkIfPresaleStarted();
    } catch (e) {
      console.log(e);
    }
  };

  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new ethers.Contract(
        NFTContractAddress,
        NFTContractABI.abi,
        provider
      );

      const _presaleStarted = await nftContract.presaleStarted();
      if (!_presaleStarted) {
        await getOwner();
      }

      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (e) {
      console.log(e);
    }
  };

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new ethers.Contract(
        NFTContractAddress,
        NFTContractABI.abi,
        provider
      );

      const _presaleEnded = await nftContract.presaleEnded();
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));

      if (hasEnded) {
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }

      return hasEnded;
    } catch (e) {
      console.log(e);
    }
  };

  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new ethers.Contract(
        NFTContractAddress,
        NFTContractABI.abi,
        provider
      );

      const _owner = await nftContract.getOwner();

      const signer = await getProviderOrSigner(true);
      const address = signer.getAddress();

      if (_owner.toLowerCase() === address.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const getTokenIdsMinted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new ethers.Contract(
        NFTContractAddress,
        NFTContractABI.abi,
        provider
      );

      const _tokenIds = await nftContract.tokenIds();
      setTokenIdsMinted(_tokenIds.toNumber());
    } catch (e) {
      console.log(e);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new ethers.providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to Rinkeby");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  };

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      connectWallet();

      const _presaleStarted = checkIfPresaleStarted();
      if (_presaleStarted) {
        checkIfPresaleEnded();
      }
      getTokenIdsMinted();

      const presaleInterval = setInterval(async () => {
        const _presaleStarted = await checkIfPresaleStarted();
        if (_presaleStarted) {
          const _presaleEnded = await checkIfPresaleEnded();
          if (_presaleEnded) {
            clearInterval(presaleInterval);
          }
        }
      }, 5 * 1000);

      setInterval(async () => {
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  }, [walletConnected]);

  const renderButton = () => {
    if (!walletConnected) {
      return (
        <div className="flex justify-center items-center">
          <button
            className="py-3 px-20 text-lg font-semibold rounded-md bg-indigo-500"
            onClick={connectWallet}
          >
            Connect Wallet
          </button>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex justify-center items-center">
          <button className="py-3 px-20 text-lg font-semibold rounded-md bg-indigo-500">
            Loading...
          </button>
        </div>
      );
    }

    if (isOwner && !presaleStarted) {
      return (
        <div className="flex justify-center items-center">
          <button
            className="py-3 px-20 text-lg font-semibold rounded-md bg-indigo-500"
            onClick={startPresale}
          >
            Start presale
          </button>
        </div>
      );
    }

    if (!presaleStarted) {
      return (
        <div className="flex justify-center items-center">
          <p className="text-xl text-white">Presale not yet started</p>
        </div>
      );
    }

    if (presaleStarted && !presaleEnded) {
      return (
        <div className="flex justify-center items-center">
          <div>
            Presale has started! If you are in whitelist then mint a NFT! 🥳
          </div>
          <button
            className="py-3 px-20 text-lg font-semibold rounded-md bg-indigo-500"
            onClick={presaleMint}
          >
            Presale Mint 🚀
          </button>
        </div>
      );
    }

    if (presaleStarted && presaleEnded) {
      return (
        <div className="flex justify-center item-center">
          <button
            className="py-3 px-20 text-lg font-semibold rounded-md bg-indigo-500"
            onClick={publicMint}
          >
            Public Mint 🚀
          </button>
        </div>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="h-screen bg-zinc-800 text-white ">
        <div className="h-full flex-col justify-center items-center">
          <h1 className="text-5xl font-semibold text-center pt-44">
            Welcome to Crypto Devs!
          </h1>
          <div className="text-center pt-10 pb-8 text-xl">
            Its an NFT collection for developers in Crypto.
          </div>
          <div className="text-center text-xl pb-10">
            {tokensMinted}/20 have been minted
          </div>
          {renderButton()}
        </div>
      </div>

      <footer className="bg-zinc-700 py-3 text-white text-center">
        Made with <span className="text-red-600">&#10084;</span> by Crypto Devs
      </footer>
    </div>
  );
}
