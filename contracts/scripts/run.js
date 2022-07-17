const { whitelistContractAddress, metadataURL } = require("../constants/index");

const main = async () => {
  const nftContractFactory = await hre.ethers.getContractFactory("MyNFT");
  const nftContract = await nftContractFactory.deploy(
    metadataURL,
    whitelistContractAddress
  );
  await nftContract.deployed();

  console.log("Contract deployed at: ", nftContract.address);

  let txn = await nftContract.startPresale();
  await txn.wait();

  txn = await nftContract.presaleMint();
  console.log("Minting...");
  await txn.wait();
  console.log("Minted");
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

runMain();
