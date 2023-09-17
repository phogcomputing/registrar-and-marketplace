const { expect } = require("chai");
const { ethers } = require("hardhat");

provider1_costs = ethers.BigNumber.from(0);

async function getCosts() {
    // Get latest transaction hash
    const latestBlock = await ethers.provider.getBlock("latest");
    const latestTXHash = latestBlock.transactions.at(-1);
    // Get latest transaction receipt object
    const latestTXReceipt = await ethers.provider.getTransactionReceipt(
      latestTXHash
    );
    // Determine latest transaction gas costs
    const latestTXGasUsage = latestTXReceipt.gasUsed;
    const latestTXGasPrice = latestTXReceipt.effectiveGasPrice;
    const latestTXGasCosts = latestTXGasUsage.mul(latestTXGasPrice);

    //console.log("gas used ",latestTXGasCosts);
    return ethers.BigNumber.from(latestTXGasCosts)
}

describe("RentalContract", function () {
  let RentalContract;
  let rentalContract;
  let owner;
  let renter1;
  let renter2;

  const docker_uri = "oci://repo1/helloworld";

  beforeEach(async () => {
    [owner, provider1, renter1, renter2] = await ethers.getSigners();
    RentalContract = await ethers.getContractFactory("RentalContract");
    rentalContract = await RentalContract.deploy();
    await rentalContract.deployed();
  });
   
  it("Should mint an NFT and rent it", async function () {
    const uri = "cid/test.png";
    const price = ethers.utils.parseEther("0.1");
    const durationInSeconds = 86400; // 1 hour

    const newcount = await rentalContract.getCount();
    //console.log("Test #1: Token count: ",newcount);
    // Mint an NFT forRent and check the balance
    await rentalContract.connect(provider1).forRent(uri, price, durationInSeconds);
    provider1_costs = provider1_costs.add(await getCosts());
    let tokenId = 1;
    let listing1 = await rentalContract.connect(provider1).getTokensByURI(uri);
    provider1_costs = provider1_costs.add(await getCosts());
    //console.log("Listing:",listing1);
    expect(listing1.length).to.equal(1);


    // Renter1 rents the NFT
    await rentalContract.connect(renter1).rent(tokenId, { value: price, gasPrice: 250000000000 });
    //getCosts();
    balance = await rentalContract.connect(renter1).balanceOf(renter1.address);
    expect(balance).to.equal(1);

    // Check if NFT is rented and collectible
    const nftOwner = await rentalContract.connect(renter1).ownerOf(tokenId);
    expect(nftOwner).to.equal(renter1.address);

    // Renter2 tries to rent the same NFT (should fail)
    await expect(rentalContract.rent(tokenId, { value: price, gasPrice: 250000000000 })).to.be.revertedWith(
      "Already rented"
    );
    //getCosts();
    //console.log("Test #1: Token count: ", await rentalContract.getCount());
  });

  it("Should attempt to mint duplicate NFT and fail", async function () {
    const price = ethers.utils.parseEther("0.1");
    const durationInSeconds = 86400; // 1 hour
    //console.log("Test #2: Token count: ", await rentalContract.getCount());

    await rentalContract.connect(provider1).forRent(docker_uri, price, durationInSeconds);
    provider1_costs = provider1_costs.add(await getCosts());
    let listing2 = await rentalContract.getTokensByURI(docker_uri);
    //console.log("Listing:",listing2);
    expect(listing2.length).to.equal(1);

    // Mint the same URI twice from single address -- should fail
    await expect(rentalContract.connect(provider1).forRent(docker_uri, price, durationInSeconds)).to.be.revertedWith(
      "You have already minted an NFT with this URI"
    );
    provider1_costs = provider1_costs.add(await getCosts());
    //console.log("Test #2: Token count: ", await rentalContract.getCount());
  });
  
  it("Should collect rent from rented NFTs", async function () {
    provider1_costs = ethers.BigNumber.from(0);
    const uri = "cid/collect.png";
    const price = ethers.utils.parseEther("0.1");
    const durationInSeconds = 86400; // 1 hour

    const initialBalance = await provider1.getBalance();
    //console.log("Starting balance: ", await provider1.getBalance());
    //console.log("Test #3: Token count: ", await rentalContract.getCount());

    // Call forRent and mint an NFT
    const receipt = await rentalContract.connect(provider1).forRent(uri, price, durationInSeconds);
    //console.log("Balance after minting: ", await provider1.getBalance());
    provider1_costs = provider1_costs.add(await getCosts());

    const count = await rentalContract.getCount();
    //console.log("Token count: ",count);

    expect(count).to.equal(1);
    let tokenId = 1;

    // Rent the NFT
    await rentalContract.connect(renter2).rent(tokenId, { value: price, gasPrice: 250000000000 });

    // Advance time by 2 hours
    //await network.provider.send("evm_increaseTime", [7200]); // 2 hours
    await network.provider.send("evm_increaseTime", [86400]); // 2 hours

    // Renter1 collects rent
    await rentalContract.connect(provider1).collectRent(tokenId, { gasPrice: 250000000000 });
    //console.log("Balance after collecting rent: ", await provider1.getBalance());
    await getCosts();
    provider1_costs = provider1_costs.add(await getCosts());
    const finalBalance = await provider1.getBalance();
    //console.log("Balance after calling getBalance: ", await provider1.getBalance());

    //console.log("initialBalance: ",initialBalance);
    //console.log("finalBalance: ",finalBalance);
    //console.log("price: ",price);
    //console.log("Total provider1 costs ",provider1_costs)

    // Check if rent was collected
    const expectedBalance = (initialBalance.add(price) - provider1_costs);
    //console.log("Expected balance ",expectedBalance);
    //console.log("expected minus finalBalance ",(Number(expectedBalance) - Number(finalBalance)));
    expect(Number(finalBalance)).to.equal(Number(expectedBalance));
  });
});

