//SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract MyNFT is ERC721Enumerable, Ownable {
    //baseTokenURI = baseURI + tokenID
    string _baseTokenURI;
    //price of 1 NFT
    uint256 public _price = 0.01 ether;
    //boolean to know whether contract is paused or not
    //it can be paused in case of emergency
    bool public _paused;
    //max value of NFTs available
    uint256 public maxTokenIds = 20;
    //total number of tokens minted
    uint256 public tokenIds;
    //instance of interface whitelist contract
    IWhitelist whitelist;
    //boolean to know whether pre-sale started
    bool public presaleStarted;
    //time when pre-sale will end
    uint256 public presaleEnded;

    modifier onlyWhenNotPaused() {
        require(!_paused, "Contract is currently paused");
        _;
    }

    constructor(string memory baseURI, address whitelistContract)
        ERC721("CryptoDevs", "CD")
    {
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);
    }

    function startPresale() public onlyOwner {
        presaleStarted = true;
        presaleEnded = block.timestamp + 5 minutes;
    }

    function presaleMint() public payable onlyWhenNotPaused {
        require(
            presaleStarted && block.timestamp <= presaleEnded,
            "Presale ended"
        );
        require(
            whitelist.whitelistAddresses(msg.sender),
            "You're not in the whitelist."
        );
        require(tokenIds < maxTokenIds, "Max limit reached");
        require(msg.value >= _price, "Didnot send enough eth");

        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }

    function mint() public payable onlyWhenNotPaused {
        require(
            presaleStarted && block.timestamp >= presaleEnded,
            "Presale is still running"
        );
        require(tokenIds < maxTokenIds, "Max limit reached");
        require(msg.value >= _price, "Didnot send enough eth");

        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }

    function setPaused(bool value) public onlyOwner {
        _paused = value;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function withdraw() public onlyOwner {
        address _owner = owner();
        (bool call, ) = _owner.call{value: address(this).balance}("");
        require(call, "Failed to withdraw");
    }

    receive() external payable {}

    fallback() external payable {}
}
