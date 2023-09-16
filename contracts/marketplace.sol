// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract RentalContract is ERC721, ERC721URIStorage, Ownable {
    using SafeMath for uint256;

    uint256 public tokenIdCounter = 0;

    // Mapping from token ID to rental price (in wei)
    mapping(uint256 => uint256) public rentalPrices;

    // Mapping from URI to token ID
    mapping(string => uint256) public uriToTokenId;

    // Mapping from token ID to rental start time
    mapping(uint256 => uint256) public rentalStartTimes;

    // Mapping from token ID to rental duration
    mapping(uint256 => uint256) public rentalDurations;

    constructor() ERC721("RentalNFT", "RNFT") {}

    // Rent a property using a previously minted NFT
    function rent(uint256 tokenId) external payable {
        uint256 rentalPrice = rentalPrices[tokenId];
        require(rentalPrice > 0, "Token ID is not available for rent");
        require(msg.value >= rentalPrice, "Insufficient funds to rent this property");

        // Check if the NFT is owned by the contract
        require(ownerOf(tokenId) == address(this), "This property is not available for rent");

        // Transfer the NFT to the renter (contract retains ownership)
        _transfer(address(this), msg.sender, tokenId);

        // Record the rental start time
        rentalStartTimes[tokenId] = block.timestamp;

        // Transfer any excess funds back to the renter
        if (msg.value > rentalPrice) {
            payable(msg.sender).transfer(msg.value - rentalPrice);
        }
    }


    // Rent multiple properties using a list of token IDs and a target price
    function rentMultiple(uint256[] calldata tokenIds, uint256 targetPrice) external payable {
        uint256 totalRentalPrice = 0;

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            uint256 rentalPrice = rentalPrices[tokenId];

            // Check if the rental price matches the target price
            if (rentalPrice == targetPrice) {
                require(msg.value >= targetPrice, "Insufficient funds to rent this property");
                require(ownerOf(tokenId) == address(this), "This property is not available for rent");

                // Record the rental start time
                rentalStartTimes[tokenId] = block.timestamp;

                totalRentalPrice = totalRentalPrice.add(targetPrice);
            }
        }

        // Require that the total amount sent is greater than or equal to the total rental price
        require(msg.value >= totalRentalPrice, "Incorrect funds sent for renting these properties");

        // Return any excess funds back to the sender
        if (msg.value > totalRentalPrice) {
            payable(msg.sender).transfer(msg.value - totalRentalPrice);
        }
    }

    // Mint a new NFT and set its rental price
    function forRent(string memory uri, uint256 price, uint256 durationInSeconds) external onlyOwner {
        require(durationInSeconds > 0, "Duration must be greater than zero");

        tokenIdCounter++;
        uint256 tokenId = tokenIdCounter;

        _mint(address(this), tokenId);
        _setTokenURI(tokenId, uri);
        rentalPrices[tokenId] = price;
        uriToTokenId[uri] = tokenId;
        rentalDurations[tokenId] = durationInSeconds; // Store the rental duration

        // Set the rental start time to 0 (initial state)
        rentalStartTimes[tokenId] = 0;
    }

    // Collect accumulated rental earnings for the original invoker
    function collectRent(uint256 tokenId) external {
        uint256 rentalEarned = calculateRent(tokenId);
        require(rentalEarned > 0, "No rental earnings available for collection");

        // Reset the rental start time
        rentalStartTimes[tokenId] = 0;

        // Transfer the rental earnings to the original invoker
        payable(ownerOf(tokenId)).transfer(rentalEarned);
    }

    // Calculate the rental earnings for a specific token based on its rental conditions
    function calculateRent(uint256 tokenId) internal view returns (uint256) {
        uint256 rentalPrice = rentalPrices[tokenId];
        uint256 startTime = rentalStartTimes[tokenId];
        uint256 duration = rentalDurations[tokenId]; // Get the rental duration
    
        // Check if the NFT is owned by the contract, rental duration has started, and elapsed time does not exceed duration
        if (ownerOf(tokenId) == address(this) && startTime > 0) {
            uint256 endTime = startTime + duration;
            if (block.timestamp <= endTime) {
                // Calculate the portion of rent that can be collected
                uint256 elapsedTime = block.timestamp - startTime;
                uint256 maxRent = rentalPrice.mul(elapsedTime).div(duration);
            
                // Ensure maxRent doesn't exceed the original price
                if (maxRent > rentalPrice) {
                    return rentalPrice;
                }
            
                return maxRent;
            }
        }
    
        return 0;
    }

    // The following functions are overrides required by Solidity.

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

}

