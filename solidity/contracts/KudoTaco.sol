// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@thirdweb-dev/contracts/base/ERC20Base.sol";
import "@thirdweb-dev/contracts/extension/PermissionsEnumerable.sol";

contract KudoTaco is ERC20Base, PermissionsEnumerable {
    mapping(address => uint256) private lastMinted;
    mapping(address => uint256) public dailyMintedAmount;

    uint256 private constant DAY = 1 days;
    uint256 private constant DAILY_LIMIT = 5 ether;

    bytes32 public constant KUDO_GIVER_ROLE = keccak256("KUDO_GIVER_ROLE");

    event KudosGiven(address indexed from, address indexed to, uint256 amount);

    constructor(
        address _defaultAdmin,
        string memory _name,
        string memory _symbol
    )
    ERC20Base(
        _defaultAdmin,
        _name,
        _symbol
    )
    {
        _setupRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
        _setupRole(KUDO_GIVER_ROLE, _defaultAdmin);
    }

    /**
     *  @notice          Lets an authorized address mint tokens to a recipient from another if their daily spend is not met.
     *  @dev             The logic in the `_canMint` function determines whether the caller is authorized to mint tokens.
     *
     *  @param _to       The recipient of the tokens.
     *  @param _amount   Quantity of tokens to mint.
     */
    function giveMultipleKudos(address[] memory _to, uint256[] memory _amount) external onlyRole(KUDO_GIVER_ROLE) {
        require(_to.length == _amount.length, "Array lengths do not match.");
        uint len = _to.length;
        for (uint256 i = 0; i < len; i++) {
            giveKudos(_to[i], _amount[i]);
        }
    }

    /**
     *  @notice          Lets an authorized address mint tokens to a recipient from another if their daily spend is not met.
     *  @dev             The logic in the `_canMint` function determines whether the caller is authorized to mint tokens.
     *
     *  @param _to       The recipient of the tokens to mint.
     *  @param _amount   Quantity of tokens to mint.
     */
    function giveKudos(address _to, uint256 _amount) public onlyRole(KUDO_GIVER_ROLE) {
        require(_amount != 0, "Minting zero tokens.");
        require(_amount <= kudosRemainingToday(msg.sender), "Exceeds daily mint limit");
        require(_to != msg.sender, "Cannot mint to self.");

        uint256 today = block.timestamp / DAY;
        if (lastMinted[msg.sender] != today) {
            lastMinted[msg.sender] = today;
            dailyMintedAmount[msg.sender] = 0;
        }

        dailyMintedAmount[msg.sender] += _amount;
        _mint(_to, _amount);
        emit KudosGiven(msg.sender, _to, _amount);
    }

    /**
     *  @notice          Calculate how many kudos a user has left to give today
     *
     *  @param _from     The user for the kudos remaining today.
     */
    function kudosRemainingToday(address _from) public view returns (uint256) {
        uint256 today = block.timestamp / DAY;
        if (lastMinted[_from] != today) {
            return DAILY_LIMIT;
        }
        return DAILY_LIMIT - dailyMintedAmount[_from];
    }
}
