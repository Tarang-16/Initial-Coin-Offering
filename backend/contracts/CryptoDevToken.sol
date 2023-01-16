// SPDX-License Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ICryptoDevs.sol";

contract CryptoDevToken is ERC20, Ownable {
    uint256 public constant tokenPrice = 0.001 ether;
    uint256 public constant maxTotalSupply = 10000 * 10 ** 18;
    uint256 public constant tokensPerNFT = 10 * 10 ** 18;
    ICryptoDevs CryptoDevsNft;

    mapping(uint256 => bool) public tokenIdsClaimed;

    constructor(address _cryptoDevsContract) ERC20("Crypto Dev Token", "CD") {
        CryptoDevsNft = ICryptoDevs(_cryptoDevsContract);
    }

    function mint(uint256 amount) public payable {
        uint256 _requiredPrice = amount * tokenPrice;
        uint256 amountInDecimals = amount * 10 ** 18;

        require(msg.value >= _requiredPrice, "ETH sent is not enough");
        require(
            (totalSupply() + amountInDecimals) <= maxTotalSupply,
            "Supply limit exceeded"
        );

        _mint(msg.sender, amountInDecimals);
    }

    function claim() public {
        uint256 balance = CryptoDevsNft.balanceOf(msg.sender); // this balance shows the number of nfts the user has.
        require(balance > 0, "You don't own any Crypto Dev Nft");

        uint256 amount = 0; // amount keeps track of number of unclaimed tokenIds

        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = CryptoDevsNft.tokenOfOwnerByIndex(msg.sender, i);

            if (!tokenIdsClaimed[tokenId]) {
                amount += 1;
                tokenIdsClaimed[tokenId] = true;
            }
        }

        require(balance > 0, "You have already claimed all the tokens");
        _mint(msg.sender, amount * tokensPerNFT);
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "Nothing to withdraw, contract balance empty");

        address _owner = owner();
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }

    // Function to receive Ether. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}
}
