const PriceFeed = artifacts.require("./PriceFeedTester.sol");
const PriceFeedTestnet = artifacts.require("./PriceFeedTestnet.sol");
const MockChainlink = artifacts.require("./MockAggregator.sol");
const MockTellor = artifacts.require("./MockTellor.sol");
const TellorCaller = artifacts.require("./TellorCaller.sol");

const testHelpers = require("../utils/testHelpers.js");
const th = testHelpers.TestHelper;

const { dec, assertRevert, toBN } = th;

const abiCoder = new ethers.utils.AbiCoder();
const getQuery = (type, asset, currecy) => {
  const queryDataArgs = abiCoder.encode(
    ["string", "string"],
    [asset.toLowerCase(), currecy.toLowerCase()]
  );
  const queryData = abiCoder.encode(["string", "bytes"], [type, queryDataArgs]);
  const queryId = ethers.utils.keccak256(queryData);
  return { queryId, queryData };
};

const ETHUSD_TELLOR_REQ_ID = getQuery("SpotPrice", "ETH", "USD").queryId;
const CNYUSD_TELLOR_REQ_ID = getQuery("SpotPrice", "CNY", "USD").queryId;
const ethPrice = dec(3000, 18);
const cnyPrice = dec(100, 18);
const ETH_FREEZE_TIMEOUT = 60 * 60 * 4; // 4 hours
const CNY_FREEZE_TIMEOUT = 60 * 60 * 36; // 36 hours

contract("PriceFeed", async accounts => {
  const [owner, alice] = accounts;
  let priceFeedTestnet;
  let priceFeed;
  let zeroAddressPriceFeed;
  let mockChainlinkEth;
  let mockChainlinkCny;

  const setAddresses = async () => {
    await priceFeed.setAddresses(
      mockChainlinkEth.address,
      mockChainlinkCny.address,
      tellorCaller.address,
      { from: owner }
    );
  };

  const setChainlinkPrice = async price => {
    await mockChainlinkEth.setPrevPrice(price);
    await mockChainlinkEth.setPrice(price);
    await mockChainlinkCny.setPrevPrice(price);
    await mockChainlinkCny.setPrice(price);
  };

  beforeEach(async () => {
    priceFeedTestnet = await PriceFeedTestnet.new();
    PriceFeedTestnet.setAsDeployed(priceFeedTestnet);

    priceFeed = await PriceFeed.new();
    PriceFeed.setAsDeployed(priceFeed);

    zeroAddressPriceFeed = await PriceFeed.new();
    PriceFeed.setAsDeployed(zeroAddressPriceFeed);

    mockChainlinkEth = await MockChainlink.new();
    mockChainlinkCny = await MockChainlink.new();
    MockChainlink.setAsDeployed(mockChainlinkEth);

    mockTellor = await MockTellor.new();
    MockTellor.setAsDeployed(mockTellor);

    tellorCaller = await TellorCaller.new(mockTellor.address);
    TellorCaller.setAsDeployed(tellorCaller);

    // Set Chainlink latest and prev round Id's to non-zero
    await mockChainlinkEth.setLatestRoundId(3);
    await mockChainlinkEth.setPrevRoundId(2);

    await mockChainlinkCny.setLatestRoundId(4);
    await mockChainlinkCny.setPrevRoundId(3);

    //Set current and prev prices in both oracles
    await mockChainlinkEth.setPrice(ethPrice);
    await mockChainlinkEth.setPrevPrice(ethPrice);

    await mockChainlinkCny.setPrice(cnyPrice);
    await mockChainlinkCny.setPrevPrice(cnyPrice);

    await mockTellor.setEthPrice(ethPrice);
    await mockTellor.setCnyPrice(cnyPrice);

    // Set mock price updateTimes in both oracles to very recent
    const now = await th.getLatestBlockTimestamp(web3);
    await mockChainlinkEth.setUpdateTime(now);
    await mockChainlinkCny.setUpdateTime(now);
    await mockTellor.setUpdateTime(now);
  });

  describe("PriceFeed internal testing contract", async accounts => {
    it("fetchPrice before setPrice should return the default price", async () => {
      const price = await priceFeedTestnet.getPrice();
      assert.equal(price, dec(200, 18));
    });
    it("should be able to fetchPrice after setPrice, output of former matching input of latter", async () => {
      await priceFeedTestnet.setPrice(dec(100, 18));
      const price = await priceFeedTestnet.getPrice();
      assert.equal(price, dec(100, 18));
    });
  });

  describe("Mainnet PriceFeed setup", async accounts => {
    it("fetchPrice should fail on contract with no chainlink address set", async () => {
      try {
        const price = await zeroAddressPriceFeed.fetchPrice();
        assert.isFalse(price.receipt.status);
      } catch (err) {
        assert.include(err.message, "function call to a non-contract account");
      }
    });

    it("fetchPrice should fail on contract with no tellor address set", async () => {
      try {
        const price = await zeroAddressPriceFeed.fetchPrice();
        assert.isFalse(price.receipt.status);
      } catch (err) {
        assert.include(err.message, "function call to a non-contract account");
      }
    });

    it("setAddresses should fail whe called by nonOwner", async () => {
      await assertRevert(
        priceFeed.setAddresses(
          mockChainlinkEth.address,
          mockChainlinkCny.address,
          mockTellor.address,
          { from: alice }
        ),
        "Ownable: caller is not the owner"
      );
    });

    it("setAddresses should fail after address has already been set", async () => {
      // Owner can successfully set any address
      const txOwner = await priceFeed.setAddresses(
        mockChainlinkEth.address,
        mockChainlinkCny.address,
        mockTellor.address,
        {
          from: owner
        }
      );
      assert.isTrue(txOwner.receipt.status);

      await assertRevert(
        priceFeed.setAddresses(
          mockChainlinkEth.address,
          mockChainlinkCny.address,
          mockTellor.address,
          { from: owner }
        ),
        "Ownable: caller is not the owner"
      );

      await assertRevert(
        priceFeed.setAddresses(
          mockChainlinkEth.address,
          mockChainlinkCny.address,
          mockTellor.address,
          { from: alice }
        ),
        "Ownable: caller is not the owner"
      );
    });
  });

  it("C1 Chainlink working: fetchPrice should return the correct price, taking into account the number of decimal digits on the aggregator", async () => {
    await setAddresses();

    // Oracle ETH price is 10.00000000
    await mockChainlinkEth.setDecimals(8);
    await mockChainlinkEth.setPrevPrice(dec(1, 9));
    await mockChainlinkEth.setPrice(dec(1, 9));

    // Oracle CNY price is 1.00000000
    await mockChainlinkCny.setDecimals(8);
    await mockChainlinkCny.setPrevPrice(dec(1, 8));
    await mockChainlinkCny.setPrice(dec(1, 8));

    await priceFeed.fetchPrice();
    let price = await priceFeed.lastGoodPrice();
    // Check PriceFeed gives 10, with 18 digit precision
    assert.equal(price, dec(10, 18));

    // Oracle ETH price is 1e9
    await mockChainlinkEth.setDecimals(0);
    await mockChainlinkEth.setPrevPrice(dec(1, 9));
    await mockChainlinkEth.setPrice(dec(1, 9));

    // Oracle CNY price is 1e9
    await mockChainlinkCny.setDecimals(0);
    await mockChainlinkCny.setPrevPrice(dec(1, 9));
    await mockChainlinkCny.setPrice(dec(1, 9));

    await priceFeed.fetchPrice();
    price = await priceFeed.lastGoodPrice();
    //Check PriceFeed gives 1, with 18 digit precision
    assert.isTrue(price.eq(toBN(dec(1, 18))));

    // Oracle ETH price is 0.0001
    await mockChainlinkEth.setDecimals(18);
    await mockChainlinkEth.setPrevPrice(dec(1, 14));
    await mockChainlinkEth.setPrice(dec(1, 14));

    // Oracle CNY price is 0.0001
    await mockChainlinkCny.setDecimals(18);
    await mockChainlinkCny.setPrevPrice(dec(1, 14));
    await mockChainlinkCny.setPrice(dec(1, 14));

    await priceFeed.fetchPrice();
    price = await priceFeed.lastGoodPrice();
    // Check PriceFeed gives 1 with 18 digit precision
    assert.isTrue(price.eq(toBN(dec(1, 18))));

    // Oracle ETH price is 3517.60000000
    await mockChainlinkEth.setDecimals(8);
    await mockChainlinkEth.setPrevPrice(dec(35176, 7));
    await mockChainlinkEth.setPrice(dec(35176, 7));

    // Oracle CNY price is 0.15713900
    await mockChainlinkCny.setDecimals(8);
    await mockChainlinkCny.setPrevPrice(dec(157139, 2));
    await mockChainlinkCny.setPrice(dec(157139, 2));

    await priceFeed.fetchPrice();
    price = await priceFeed.lastGoodPrice();
    // Check PriceFeed gives 22385.27672951 with 18 digit precision
    assert.equal(price, "22385276729510000000000");
  });

  // --- Chainlink breaks ---
  it("C1 Chainlink breaks, Tellor working: fetchPrice should return the correct Tellor price, taking into account Tellor's 18-digit granularity", async () => {
    await setAddresses();
    // --- Chainlink fails, system switches to Tellor ---
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    // Chainlink breaks with negative price
    await mockChainlinkEth.setPrevPrice(dec(1, 8));
    await mockChainlinkEth.setPrice("-5000");
    await mockChainlinkEth.setUpdateTime(0);

    await mockTellor.setPrice(dec(123, 6));

    const priceFetchTx = await priceFeed.fetchPrice();
    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "1"); // status 1: using Tellor, Chainlink untrusted

    let price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(1, 18));

    // Tellor price is 0.0001 at 6-digit precision
    await mockTellor.setPrice(100);

    await priceFeed.fetchPrice();
    price = await priceFeed.lastGoodPrice();
    // Check Liquity PriceFeed gives 1 with 18 digit precision
    assert.equal(price, dec(1, 18));

    // Tellor ETH price is 3517.600000 at 6-digit precision
    await mockTellor.setEthPrice(dec(35176, 5));
    // Tellor CNY price is 0.157139 at 6-digit precision
    await mockTellor.setCnyPrice(157139);

    await priceFeed.fetchPrice();
    price = await priceFeed.lastGoodPrice();
    // Check Liquity PriceFeed gives 22385.276729519724575057 with 18 digit precision
    assert.equal(price, "22385276729519724575057");
  });

  it("C1 chainlinkWorking: Chainlink broken by zero latest roundId, Tellor working: switch to usingChainlinkTellorUntrusted", async () => {
    await setAddresses();
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockChainlinkEth.setPrevPrice(dec(999, 8));
    await mockChainlinkEth.setPrice(dec(999, 8));
    await mockChainlinkEth.setLatestRoundId(0);

    await priceFeed.setLastGoodPrice(dec(999, 18));

    await mockTellor.setPrice(dec(123, 6));

    const priceFetchTx = await priceFeed.fetchPrice();
    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "1"); // status 1: using Tellor, Chainlink untrusted
  });

  it("C1 chainlinkWorking: Chainlink broken by zero latest roundId, Tellor working: use Tellor price", async () => {
    await setAddresses();
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockChainlinkEth.setPrevPrice(dec(999, 8));
    await mockChainlinkEth.setPrice(dec(999, 8));
    await mockChainlinkEth.setLatestRoundId(0);

    await priceFeed.setLastGoodPrice(dec(999, 18));

    await mockTellor.setPrice(dec(123, 6));

    const priceFetchTx = await priceFeed.fetchPrice();
    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "1"); // status 1: using Tellor, Chainlink untrusted
  });

  it("C1 chainlinkWorking: Chainlink broken by zero timestamp, Tellor working, switch to usingChainlinkTellorUntrusted", async () => {
    await setAddresses();
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockChainlinkEth.setPrevPrice(dec(999, 8));
    await mockChainlinkEth.setPrice(dec(999, 8));
    await mockChainlinkEth.setUpdateTime(0);

    await priceFeed.setLastGoodPrice(dec(999, 18));

    await mockTellor.setPrice(dec(123, 6));

    const priceFetchTx = await priceFeed.fetchPrice();
    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "1"); // status 1: using Tellor, Chainlink untrusted
  });

  it("C1 chainlinkWorking: Chainlink broken by zero timestamp, Tellor working, return Tellor price", async () => {
    await setAddresses();
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockChainlinkEth.setPrevPrice(dec(999, 8));
    await mockChainlinkEth.setPrice(dec(999, 8));
    await mockChainlinkEth.setUpdateTime(0);

    await priceFeed.setLastGoodPrice(dec(999, 18));

    await mockTellor.setPrice(dec(123, 6));

    const priceFetchTx = await priceFeed.fetchPrice();

    let price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(1, 18));
  });

  it("C1 chainlinkWorking: Chainlink broken by future timestamp, Tellor working, switch to usingChainlinkTellorUntrusted", async () => {
    await setAddresses();
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    const now = await th.getLatestBlockTimestamp(web3);
    const future = toBN(now).add(toBN("1000"));

    await mockChainlinkEth.setPrevPrice(dec(999, 8));
    await mockChainlinkEth.setPrice(dec(999, 8));
    await mockChainlinkEth.setUpdateTime(future);

    await priceFeed.setLastGoodPrice(dec(999, 18));

    await mockTellor.setPrice(dec(123, 6));

    const priceFetchTx = await priceFeed.fetchPrice();
    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "1"); // status 1: using Tellor, Chainlink untrusted
  });

  it("C1 chainlinkWorking: Chainlink broken by future timestamp, Tellor working, return Tellor price", async () => {
    await setAddresses();
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    const now = await th.getLatestBlockTimestamp(web3);
    const future = toBN(now).add(toBN("1000"));

    await mockChainlinkEth.setPrevPrice(dec(999, 8));
    await mockChainlinkEth.setPrice(dec(999, 8));
    await mockChainlinkEth.setUpdateTime(future);

    await priceFeed.setLastGoodPrice(dec(999, 18));

    await mockTellor.setPrice(dec(123, 6));

    const priceFetchTx = await priceFeed.fetchPrice();

    let price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(1, 18));
  });

  it("C1 chainlinkWorking: Chainlink broken by negative price, Tellor working,  switch to usingChainlinkTellorUntrusted", async () => {
    await setAddresses();
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockChainlinkEth.setPrevPrice(dec(999, 8));
    await mockChainlinkEth.setPrice("-5000");

    await priceFeed.setLastGoodPrice(dec(999, 18));

    await mockTellor.setPrice(dec(123, 6));

    const priceFetchTx = await priceFeed.fetchPrice();
    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "1"); // status 1: using Tellor, Chainlink untrusted
  });

  it("C1 chainlinkWorking: Chainlink broken by negative price, Tellor working, return Tellor price", async () => {
    await setAddresses();
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockChainlinkEth.setPrevPrice(dec(999, 8));
    await mockChainlinkEth.setPrice("-5000");

    await priceFeed.setLastGoodPrice(dec(999, 18));

    await mockTellor.setPrice(dec(123, 6));

    const priceFetchTx = await priceFeed.fetchPrice();

    let price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(1, 18));
  });

  it("C1 chainlinkWorking: Chainlink broken - decimals call reverted, Tellor working, switch to usingChainlinkTellorUntrusted", async () => {
    await setAddresses();
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockChainlinkEth.setPrevPrice(dec(999, 8));
    await mockChainlinkEth.setPrice(dec(999, 8));
    await mockChainlinkEth.setDecimalsRevert();

    await priceFeed.setLastGoodPrice(dec(999, 18));

    await mockTellor.setPrice(dec(123, 6));

    const priceFetchTx = await priceFeed.fetchPrice();
    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "1"); // status 1: using Tellor, Chainlink untrusted
  });

  it("C1 chainlinkWorking: Chainlink broken - decimals call reverted, Tellor working, return Tellor price", async () => {
    await setAddresses();
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockChainlinkEth.setPrevPrice(dec(999, 8));
    await mockChainlinkEth.setPrice(dec(999, 8));
    await mockChainlinkEth.setDecimalsRevert();

    await priceFeed.setLastGoodPrice(dec(999, 18));

    await mockTellor.setPrice(dec(123, 6));

    const priceFetchTx = await priceFeed.fetchPrice();

    let price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(1, 18));
  });

  it("C1 chainlinkWorking: Chainlink broken - latest round call reverted, Tellor working, switch to usingChainlinkTellorUntrusted", async () => {
    await setAddresses();
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockChainlinkEth.setPrevPrice(dec(999, 8));
    await mockChainlinkEth.setPrice(dec(999, 8));
    await mockChainlinkEth.setLatestRevert();

    await priceFeed.setLastGoodPrice(dec(999, 18));

    await mockTellor.setPrice(dec(123, 6));

    const priceFetchTx = await priceFeed.fetchPrice();
    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "1"); // status 1: using Tellor, Chainlink untrusted
  });

  it("C1 chainlinkWorking: latest round call reverted, Tellor working, return the Tellor price", async () => {
    await setAddresses();
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockChainlinkEth.setPrevPrice(dec(999, 8));
    await mockChainlinkEth.setPrice(dec(999, 8));
    await mockChainlinkEth.setLatestRevert();

    await priceFeed.setLastGoodPrice(dec(999, 18));

    await mockTellor.setPrice(dec(123, 6));

    const priceFetchTx = await priceFeed.fetchPrice();

    let price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(1, 18));
  });

  it("C1 chainlinkWorking: previous round call reverted, Tellor working, switch to usingChainlinkTellorUntrusted", async () => {
    await setAddresses();
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockChainlinkEth.setPrevPrice(dec(999, 8));
    await mockChainlinkEth.setPrice(dec(999, 8));
    await priceFeed.setLastGoodPrice(dec(999, 18));

    await mockTellor.setPrice(dec(123, 6));
    await mockChainlinkEth.setPrevRevert();

    const priceFetchTx = await priceFeed.fetchPrice();
    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "1"); // status 1: using Tellor, Chainlink untrusted
  });

  it("C1 chainlinkWorking: previous round call reverted, Tellor working, return Tellor Price", async () => {
    await setAddresses();
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockChainlinkEth.setPrevPrice(dec(999, 8));
    await mockChainlinkEth.setPrice(dec(999, 8));
    await priceFeed.setLastGoodPrice(dec(999, 18));

    await mockTellor.setPrice(dec(123, 6));
    await mockChainlinkEth.setPrevRevert();

    const priceFetchTx = await priceFeed.fetchPrice();

    let price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(1, 18));
  });

  // --- Chainlink timeout ---

  it("C1 chainlinkWorking: Chainlink frozen, Tellor working: switch to usingTellorChainlinkFrozen", async () => {
    await setAddresses();
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await priceFeed.setLastGoodPrice(dec(100, 18));

    await setChainlinkPrice(dec(100, 18));

    await th.fastForwardTime(129600, web3.currentProvider);
    const now = await th.getLatestBlockTimestamp(web3);

    // Tellor price is recent
    await mockTellor.setUpdateTime(now);
    await mockTellor.setPrice(dec(123, 6));

    await priceFeed.fetchPrice();
    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "3"); // status 3: using Tellor, Chainlink frozen
  });

  it("C1 chainlinkWorking: Chainlink frozen, Tellor working: return Tellor price", async () => {
    await setAddresses();
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await priceFeed.setLastGoodPrice(dec(100, 18));

    await setChainlinkPrice(dec(100, 18));

    await th.fastForwardTime(129600, web3.currentProvider);
    const now = await th.getLatestBlockTimestamp(web3);
    // Tellor price is recent
    await mockTellor.setUpdateTime(now);
    await mockTellor.setPrice(dec(123, 6));

    await priceFeed.fetchPrice();

    let price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(1, 18));
  });

  it("C1 chainlinkWorking: Chainlink frozen, Tellor frozen: switch to usingTellorChainlinkFrozen", async () => {
    await setAddresses();
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await priceFeed.setLastGoodPrice(dec(100, 18));

    await setChainlinkPrice(dec(100, 18));

    await mockTellor.setPrice(dec(123, 6));

    let now = await th.getLatestBlockTimestamp(web3);

    await th.fastForwardTime(ETH_FREEZE_TIMEOUT + 1, web3.currentProvider);

    // check Tellor price timestamp is out of date by > 36 hours
    now = await th.getLatestBlockTimestamp(web3);
    const { _timestampRetrieved: ethTime } = await mockTellor.getDataBefore(ETHUSD_TELLOR_REQ_ID, 0);
    const { _timestampRetrieved: cnyTime } = await mockTellor.getDataBefore(CNYUSD_TELLOR_REQ_ID, 0);
    assert.isTrue(ethTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));
    assert.isTrue(cnyTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));

    await priceFeed.fetchPrice();
    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "3"); // status 3: using Tellor, Chainlink frozen
  });

  it("C1 chainlinkWorking: Chainlink frozen, Tellor frozen: return last good price", async () => {
    await setAddresses();
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await priceFeed.setLastGoodPrice(dec(999, 18));
    await setChainlinkPrice(dec(100, 18));

    await mockTellor.setPrice(dec(123, 6));

    await th.fastForwardTime(ETH_FREEZE_TIMEOUT + 1, web3.currentProvider);

    // check Tellor price timestamp is out of date by > 36 hours
    const now = await th.getLatestBlockTimestamp(web3);
    const { _timestampRetrieved: ethTime } = await mockTellor.getDataBefore(ETHUSD_TELLOR_REQ_ID, 0);
    const { _timestampRetrieved: cnyTime } = await mockTellor.getDataBefore(CNYUSD_TELLOR_REQ_ID, 0);
    assert.isTrue(ethTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));
    assert.isTrue(cnyTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));

    await priceFeed.fetchPrice();
    let price = await priceFeed.lastGoodPrice();
    // Expect lastGoodPrice has not updated
    assert.equal(price, dec(999, 18));
  });

  it("C1 chainlinkWorking: Chainlink times out, Tellor broken by 0 price: switch to usingChainlinkTellorUntrusted", async () => {
    await setAddresses();
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await priceFeed.setLastGoodPrice(dec(999, 18));
    await setChainlinkPrice(dec(100, 18));

    await th.fastForwardTime(ETH_FREEZE_TIMEOUT + 1, web3.currentProvider);

    // Tellor breaks by 0 price
    await mockTellor.setPrice(0);

    await priceFeed.fetchPrice();
    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "4"); // status 4: using Chainlink, Tellor untrusted
  });

  it("C1 chainlinkWorking: Chainlink times out, Tellor broken by 0 price: return last good price", async () => {
    await setAddresses();
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await priceFeed.setLastGoodPrice(dec(999, 18));
    await setChainlinkPrice(dec(100, 18));

    await th.fastForwardTime(ETH_FREEZE_TIMEOUT + 1, web3.currentProvider);

    await mockTellor.setPrice(0);

    await priceFeed.fetchPrice();
    let price = await priceFeed.lastGoodPrice();

    // Expect lastGoodPrice has not updated
    assert.equal(price, dec(999, 18));
  });

  it("C1 chainlinkWorking: Chainlink is out of date by <4hrs: remain chainlinkWorking", async () => {
    await setAddresses();
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await setChainlinkPrice(dec(100, 18));

    await th.fastForwardTime(ETH_FREEZE_TIMEOUT - 60, web3.currentProvider);

    await priceFeed.fetchPrice();
    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "0"); // status 0: Chainlink working
  });

  it("C1 chainlinkWorking: Chainlink is out of date by <4hrs: return Chainklink price", async () => {
    await setAddresses();
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await setChainlinkPrice(dec(100, 18));

    await th.fastForwardTime(ETH_FREEZE_TIMEOUT - 60, web3.currentProvider);

    await priceFeed.fetchPrice();
    const price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(1, 18));
  });

  // --- Chainlink price deviation ---

  it("C1 chainlinkWorking: Chainlink price drop of >50%, switch to usingChainlinkTellorUntrusted", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(2, 18));

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockTellor.setPrice(dec(100, 6));

    await mockChainlinkEth.setPrevPrice(dec(200, 8)); // price = 2
    await mockChainlinkCny.setPrevPrice(dec(100, 8));

    await mockChainlinkEth.setPrice(dec(90, 8)); // price drops to 0.90000000: a drop of > 50% from previous
    await mockChainlinkCny.setPrice(dec(100, 8));

    await priceFeed.fetchPrice();
    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "1"); // status 1: using Tellor, Chainlink untrusted
  });

  it("C1 chainlinkWorking: Chainlink price drop of >50%, return the Tellor price", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(2, 18));

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockTellor.setPrice(dec(100, 6));

    await mockChainlinkEth.setPrevPrice(dec(200, 8)); // price = 2
    await mockChainlinkCny.setPrevPrice(dec(100, 8));

    await mockChainlinkEth.setPrice(dec(90, 8)); // price drops to 0.90000000: a drop of > 50% from previous
    await mockChainlinkCny.setPrice(dec(100, 8));

    await priceFeed.fetchPrice();
    let price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(1, 18));
  });

  it("C1 chainlinkWorking: Chainlink price drop of 50%, remain chainlinkWorking", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(2, 18));

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockTellor.setPrice(dec(100, 6));

    await mockChainlinkEth.setPrevPrice(dec(2, 8)); // price = 2
    await mockChainlinkCny.setPrevPrice(dec(1, 8));

    await mockChainlinkEth.setPrice(dec(1, 8)); // price drops to 1
    await mockChainlinkCny.setPrice(dec(1, 8));

    await priceFeed.fetchPrice();
    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "0"); // status 0: Chainlink working
  });

  it("C1 chainlinkWorking: Chainlink price drop of 50%, return the Chainlink price", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(2, 18));

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockTellor.setPrice(dec(100, 6));

    await mockChainlinkEth.setPrevPrice(dec(2, 8)); // price = 2
    await mockChainlinkCny.setPrevPrice(dec(1, 8));

    await mockChainlinkEth.setPrice(dec(1, 8)); // price drops to 1
    await mockChainlinkCny.setPrice(dec(1, 8));

    await priceFeed.fetchPrice();

    let price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(1, 18));
  });

  it("C1 chainlinkWorking: Chainlink price drop of <50%, remain chainlinkWorking", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(2, 18));

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockTellor.setPrice(dec(100, 6));

    await mockChainlinkEth.setPrevPrice(dec(2, 8)); // price = 2
    await mockChainlinkCny.setPrevPrice(dec(1, 8));

    await mockChainlinkEth.setPrice(dec(100000001)); // price drops to 1.00000001:  a drop of < 50% from previous
    await mockChainlinkCny.setPrice(dec(1, 8));

    await priceFeed.fetchPrice();

    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "0"); // status 0: Chainlink working
  });

  it("C1 chainlinkWorking: Chainlink price drop of <50%, return Chainlink price", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(2, 18));

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockTellor.setPrice(dec(100, 6));

    await mockChainlinkEth.setPrevPrice(dec(2, 8)); // price = 2
    await mockChainlinkCny.setPrevPrice(dec(1, 8));

    await mockChainlinkEth.setPrice(dec(100000001)); // price drops to 1.00000001:  a drop of < 50% from previous
    await mockChainlinkCny.setPrice(dec(1, 8));

    await priceFeed.fetchPrice();

    let price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(100000001, 10));
  });

  // Price increase
  it("C1 chainlinkWorking: Chainlink price increase of >100%, switch to usingChainlinkTellorUntrusted", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(2, 18));

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockTellor.setPrice(dec(100, 6));

    await mockChainlinkEth.setPrevPrice(dec(2, 8)); // price = 2
    await mockChainlinkCny.setPrevPrice(dec(1, 8));

    await mockChainlinkEth.setPrice(dec(400000001)); // price increases to 4.000000001: an increase of > 100% from previous
    await mockChainlinkCny.setPrice(dec(1, 8));

    await priceFeed.fetchPrice();

    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "1"); // status 1: using Tellor, Chainlink untrusted
  });

  it("C1 chainlinkWorking: Chainlink price increase of >100%, return Tellor price", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(2, 18));

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockTellor.setPrice(dec(100, 6));

    await mockChainlinkEth.setPrevPrice(dec(2, 8)); // price = 2
    await mockChainlinkCny.setPrevPrice(dec(1, 8));

    await mockChainlinkEth.setPrice(dec(400000001)); // price increases to 4.000000001: an increase of > 100% from previous
    await mockChainlinkCny.setPrice(dec(1, 8));

    await priceFeed.fetchPrice();

    let price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(1, 18));
  });

  it("C1 chainlinkWorking: Chainlink price increase of 100%, remain chainlinkWorking", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(2, 18));

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockTellor.setPrice(dec(100, 6));

    await mockChainlinkEth.setPrevPrice(dec(2, 8)); // price = 2
    await mockChainlinkCny.setPrevPrice(dec(1, 8));

    await mockChainlinkEth.setPrice(dec(4, 8)); // price increases to 4: an increase of 100% from previous
    await mockChainlinkCny.setPrice(dec(1, 8));

    await priceFeed.fetchPrice();

    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "0"); // status 0: Chainlink working
  });

  it("C1 chainlinkWorking: Chainlink price increase of 100%, return Chainlink price", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(2, 18));

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockTellor.setPrice(dec(100, 6));

    await mockChainlinkEth.setPrevPrice(dec(2, 8)); // price = 2
    await mockChainlinkCny.setPrevPrice(dec(1, 8));

    await mockChainlinkEth.setPrice(dec(4, 8)); // price increases to 4: an increase of 100% from previous
    await mockChainlinkCny.setPrice(dec(1, 8));

    await priceFeed.fetchPrice();

    let price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(4, 18));
  });

  it("C1 chainlinkWorking: Chainlink price increase of <100%, remain chainlinkWorking", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(2, 18));

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockTellor.setPrice(dec(100, 6));

    await mockChainlinkEth.setPrevPrice(dec(2, 8)); // price = 2
    await mockChainlinkCny.setPrevPrice(dec(1, 8));

    await mockChainlinkEth.setPrice(dec(399999999)); // price increases to 3.99999999: an increase of < 100% from previous
    await mockChainlinkCny.setPrice(dec(1, 8));

    await priceFeed.fetchPrice();

    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "0"); // status 0: Chainlink working
  });

  it("C1 chainlinkWorking: Chainlink price increase of <100%,  return Chainlink price", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(2, 18));

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockTellor.setPrice(dec(100, 6));

    await mockChainlinkEth.setPrevPrice(dec(2, 8)); // price = 2
    await mockChainlinkCny.setPrevPrice(dec(1, 8));

    await mockChainlinkEth.setPrice(dec(399999999)); // price increases to 3.99999999: an increase of < 100% from previous
    await mockChainlinkCny.setPrice(dec(1, 8));

    await priceFeed.fetchPrice();

    let price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(399999999, 10));
  });

  it("C1 chainlinkWorking: Chainlink price drop of >50% and Tellor price matches: remain chainlinkWorking", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(2, 18));

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockChainlinkEth.setPrevPrice(dec(2, 8)); // price = 2
    await mockChainlinkCny.setPrevPrice(dec(1, 8));

    await mockChainlinkEth.setPrice(dec(99999999)); // price drops to 0.99999999: a drop of > 50% from previous
    await mockChainlinkCny.setPrice(dec(1, 8));

    await mockTellor.setEthPrice(dec(999999));
    await mockTellor.setCnyPrice(dec(1, 6));

    await priceFeed.fetchPrice();

    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "0"); // status 0: Chainlink working
  });

  it("C1 chainlinkWorking: Chainlink price drop of >50% and Tellor price matches: return Chainlink price", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(2, 18));

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockChainlinkEth.setPrevPrice(dec(2, 8)); // price = 2
    await mockChainlinkCny.setPrevPrice(dec(1, 8));

    await mockChainlinkEth.setPrice(dec(99999999)); // price drops to 0.99999999: a drop of > 50% from previous
    await mockChainlinkCny.setPrice(dec(1, 8));

    await mockTellor.setEthPrice(dec(999999));
    await mockTellor.setCnyPrice(dec(1, 6));

    await priceFeed.fetchPrice();

    let price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(99999999, 10));
  });

  it("C1 chainlinkWorking: Chainlink price drop of >50% and Tellor price within 5% of Chainlink: remain chainlinkWorking", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(2, 18));

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockChainlinkEth.setPrevPrice(dec(1000, 8)); // price = 1000
    await mockChainlinkCny.setPrevPrice(dec(1, 8));

    await mockChainlinkEth.setPrice(dec(100, 8)); // price drops to 100: a drop of > 50% from previous
    await mockChainlinkCny.setPrice(dec(1, 8));

    await mockTellor.setEthPrice(dec(104999999)); // Tellor price drops to 104.99: price difference with new Chainlink price is now just under 5%
    await mockTellor.setCnyPrice(dec(1, 6));

    await priceFeed.fetchPrice();

    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "0"); // status 0: Chainlink working
  });

  it("C1 chainlinkWorking: Chainlink price drop of >50% and Tellor price within 5% of Chainlink: return Chainlink price", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(2, 18));

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockChainlinkEth.setPrevPrice(dec(1000, 8)); // price = 1000
    await mockChainlinkCny.setPrevPrice(dec(1, 8));

    await mockChainlinkEth.setPrice(dec(100, 8)); // price drops to 100: a drop of > 50% from previous
    await mockChainlinkCny.setPrice(dec(1, 8));

    await mockTellor.setEthPrice(dec(104999999)); // Tellor price drops to 104.99: price difference with new Chainlink price is now just under 5%
    await mockTellor.setCnyPrice(dec(1, 6));

    await priceFeed.fetchPrice();

    let price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(100, 18));
  });

  it("C1 chainlinkWorking: Chainlink price drop of >50% and Tellor live but not within 5% of Chainlink: switch to usingChainlinkTellorUntrusted", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(2, 18));

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockChainlinkEth.setPrevPrice(dec(1000, 8)); // price = 1000
    await mockChainlinkCny.setPrevPrice(dec(1, 8));

    await mockChainlinkEth.setPrice(dec(100, 8)); // price drops to 100: a drop of > 50% from previous
    await mockChainlinkCny.setPrice(dec(1, 8));

    await mockTellor.setEthPrice(dec(105000001)); // Tellor price drops to 105.000001: price difference with new Chainlink price is now > 5%
    await mockTellor.setCnyPrice(dec(1, 6));

    await priceFeed.fetchPrice();

    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "1"); // status 1: using Tellor, Chainlink untrusted
  });

  it("C1 chainlinkWorking: Chainlink price drop of >50% and Tellor live but not within 5% of Chainlink: return Tellor price", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(2, 18));

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockChainlinkEth.setPrevPrice(dec(1000, 8)); // price = 1000
    await mockChainlinkCny.setPrevPrice(dec(1, 8));

    await mockChainlinkEth.setPrice(dec(100, 8)); // price drops to 100: a drop of > 50% from previous
    await mockChainlinkCny.setPrice(dec(1, 8));

    await mockTellor.setEthPrice(dec(105000001)); // Tellor price drops to 105.000001: price difference with new Chainlink price is now > 5%
    await mockTellor.setCnyPrice(dec(1, 6));

    await priceFeed.fetchPrice();
    let price = await priceFeed.lastGoodPrice();

    assert.equal(price, dec(105000001, 12)); // return Tellor price
  });

  it("C1 chainlinkWorking: Chainlink price drop of >50% and Tellor frozen: switch to usingChainlinkTellorUntrusted", async () => {
    await setAddresses();
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockChainlinkEth.setPrevPrice(dec(1000, 8)); // price = 1000
    await mockChainlinkCny.setPrevPrice(dec(1, 8));

    await mockChainlinkEth.setPrice(dec(100, 8)); // price drops to 100: a drop of > 50% from previous
    await mockChainlinkCny.setPrice(dec(1, 8));

    await mockTellor.setEthPrice(dec(100, 6));
    await mockTellor.setCnyPrice(dec(1, 6));

    // 36 hours pass with no Tellor updates
    await th.fastForwardTime(ETH_FREEZE_TIMEOUT + 1, web3.currentProvider);

    const now = await th.getLatestBlockTimestamp(web3);
    const { _timestampRetrieved: ethTime } = await mockTellor.getDataBefore(ETHUSD_TELLOR_REQ_ID, 0);
    const { _timestampRetrieved: cnyTime } = await mockTellor.getDataBefore(CNYUSD_TELLOR_REQ_ID, 0);
    assert.isTrue(ethTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));
    assert.isTrue(cnyTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));

    await mockChainlinkEth.setUpdateTime(now);
    await mockChainlinkCny.setUpdateTime(now);

    await priceFeed.fetchPrice();

    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "1"); // status 1: using Tellor, Chainlink untrusted
  });

  it("C1 chainlinkWorking: Chainlink price drop of >50% and Tellor frozen: return last good price", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(1200, 18)); // establish a "last good price" from the previous price fetch

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockChainlinkEth.setPrevPrice(dec(1000, 8)); // price = 1000
    await mockChainlinkCny.setPrevPrice(dec(1, 8));

    await mockChainlinkEth.setPrice(dec(100, 8)); // price drops to 100: a drop of > 50% from previous
    await mockChainlinkCny.setPrice(dec(1, 8));

    await mockTellor.setEthPrice(dec(100, 6));
    await mockTellor.setCnyPrice(dec(1, 6));

    // 36 hours pass with no Tellor updates
    await th.fastForwardTime(ETH_FREEZE_TIMEOUT + 1, web3.currentProvider);

    const now = await th.getLatestBlockTimestamp(web3);
    const { _timestampRetrieved: ethTime } = await mockTellor.getDataBefore(ETHUSD_TELLOR_REQ_ID, 0);
    const { _timestampRetrieved: cnyTime } = await mockTellor.getDataBefore(CNYUSD_TELLOR_REQ_ID, 0);
    assert.isTrue(ethTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));
    assert.isTrue(cnyTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));

    await mockChainlinkEth.setUpdateTime(now);
    await mockChainlinkCny.setUpdateTime(now);

    await priceFeed.fetchPrice();

    let price = await priceFeed.lastGoodPrice();

    // Check that the returned price is the last good price
    assert.equal(price, dec(1200, 18));
  });

  // --- Chainlink fails and Tellor is broken ---

  it("C1 chainlinkWorking: Chainlink price drop of >50% and Tellor is broken by 0 price: switch to bothOracleSuspect", async () => {
    await setAddresses();
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockChainlinkEth.setPrevPrice(dec(2, 8)); // price = 2
    await mockChainlinkCny.setPrevPrice(dec(1, 8));

    await mockChainlinkEth.setPrice(dec(99999999)); // price drops to 0.99999999: a drop of > 50% from previous
    await mockChainlinkCny.setPrice(dec(1, 8));

    // Make mock Tellor return 0 price
    await mockTellor.setPrice(0);

    await priceFeed.fetchPrice();

    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "2"); // status 2: both oracles untrusted
  });

  it("C1 chainlinkWorking: Chainlink price drop of >50% and Tellor is broken by 0 price: return last good price", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(1200, 18)); // establish a "last good price" from the previous price fetch

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockChainlinkEth.setPrevPrice(dec(2, 8)); // price = 2
    await mockChainlinkCny.setPrevPrice(dec(1, 8));

    await mockChainlinkEth.setPrice(dec(99999999)); // price drops to 0.99999999: a drop of > 50% from previous
    await mockChainlinkCny.setPrice(dec(1, 8));

    // Make mock Tellor return 0 price
    await mockTellor.setPrice(0);

    await priceFeed.fetchPrice();

    let price = await priceFeed.lastGoodPrice();
    // Check that the returned price is in fact the previous price
    assert.equal(price, dec(1200, 18));
  });

  it("C1 chainlinkWorking: Chainlink price drop of >50% and Tellor is broken by 0 timestamp: switch to bothOracleSuspect", async () => {
    await setAddresses();
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockChainlinkEth.setPrevPrice(dec(2, 8)); // price = 2
    await mockChainlinkCny.setPrevPrice(dec(1, 8));

    await mockChainlinkEth.setPrice(dec(99999999)); // price drops to 0.99999999: a drop of > 50% from previous
    await mockChainlinkCny.setPrice(dec(1, 8));

    // Make mock Tellor return 0 timestamp
    await mockTellor.setUpdateTime(0);

    await priceFeed.fetchPrice();

    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "2"); // status 2: both oracles untrusted
  });

  it("C1 chainlinkWorking: Chainlink price drop of >50% and Tellor is broken by 0 timestamp: return last good price", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(1200, 18)); // establish a "last good price" from the previous price fetch

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockChainlinkEth.setPrevPrice(dec(2, 8)); // price = 2
    await mockChainlinkCny.setPrevPrice(dec(1, 8));

    await mockChainlinkEth.setPrice(dec(99999999)); // price drops to 0.99999999: a drop of > 50% from previous
    await mockChainlinkCny.setPrice(dec(1, 8));

    // Make mock Tellor return 0 timestamp
    await mockTellor.setUpdateTime(0);

    await priceFeed.fetchPrice();

    let price = await priceFeed.lastGoodPrice();
    // Check that the returned price is in fact the previous price
    assert.equal(price, dec(1200, 18));
  });

  it("C1 chainlinkWorking: Chainlink price drop of >50% and Tellor is broken by future timestamp: Pricefeed switches to bothOracleSuspect", async () => {
    await setAddresses();
    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockChainlinkEth.setPrevPrice(dec(2, 8)); // price = 2
    await mockChainlinkCny.setPrevPrice(dec(1, 8));

    await mockChainlinkEth.setPrice(dec(99999999)); // price drops to 0.99999999: a drop of > 50% from previous
    await mockChainlinkCny.setPrice(dec(1, 8));

    // Make mock Tellor return a future timestamp
    const now = await th.getLatestBlockTimestamp(web3);
    const future = toBN(now).add(toBN("10000"));
    await mockTellor.setUpdateTime(future);

    await priceFeed.fetchPrice();

    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "2"); // status 2: both oracles untrusted
  });

  it("C1 chainlinkWorking: Chainlink price drop of >50% and Tellor is broken by future timestamp: return last good price", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(1200, 18)); // establish a "last good price" from the previous price fetch

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await mockChainlinkEth.setPrevPrice(dec(2, 8)); // price = 2
    await mockChainlinkCny.setPrevPrice(dec(1, 8));

    await mockChainlinkEth.setPrice(dec(99999999)); // price drops to 0.99999999: a drop of > 50% from previous
    await mockChainlinkCny.setPrice(dec(1, 8));

    // Make mock Tellor return a future timestamp
    const now = await th.getLatestBlockTimestamp(web3);
    const future = toBN(now).add(toBN("10000"));
    await mockTellor.setUpdateTime(future);

    await priceFeed.fetchPrice();

    let price = await priceFeed.lastGoodPrice();
    // Check that the returned price is in fact the previous price
    assert.equal(price, dec(1200, 18));
  });

  // -- Chainlink is working
  it("C1 chainlinkWorking: Chainlink is working and Tellor is working - remain on chainlinkWorking", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(1200, 18));

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await setChainlinkPrice(dec(100, 8));

    await mockTellor.setPrice(dec(100, 18));

    const priceFetchTx = await priceFeed.fetchPrice();

    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "0"); // status 0: Chainlink working
  });

  it("C1 chainlinkWorking: Chainlink is working and Tellor is working - return Chainlink price", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(1200, 18));

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await setChainlinkPrice(dec(100, 8));

    await mockTellor.setPrice(dec(100, 18));

    const priceFetchTx = await priceFeed.fetchPrice();
    let price = await priceFeed.lastGoodPrice();

    // Check that the returned price is current Chainlink price
    assert.equal(price, dec(1, 18));
  });

  it("C1 chainlinkWorking: Chainlink is working and Tellor freezes - remain on chainlinkWorking", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(1200, 18));

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await setChainlinkPrice(dec(100, 8));

    await mockTellor.setPrice(dec(100, 18));

    // 36 hours pass with no Tellor updates
    await th.fastForwardTime(ETH_FREEZE_TIMEOUT + 1, web3.currentProvider);

    const now = await th.getLatestBlockTimestamp(web3);
    const { _timestampRetrieved: ethTime } = await mockTellor.getDataBefore(ETHUSD_TELLOR_REQ_ID, 0);
    const { _timestampRetrieved: cnyTime } = await mockTellor.getDataBefore(CNYUSD_TELLOR_REQ_ID, 0);
    assert.isTrue(ethTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));
    assert.isTrue(cnyTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));

    await mockChainlinkEth.setUpdateTime(now); // Chainlink's price is current
    await mockChainlinkCny.setUpdateTime(now); // Chainlink's price is current

    const priceFetchTx = await priceFeed.fetchPrice();

    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "0"); // status 0: Chainlink working
  });

  it("C1 chainlinkWorking: Chainlink is working and Tellor freezes - return Chainlink price", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(1200, 18));

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await setChainlinkPrice(dec(100, 8));

    await mockTellor.setPrice(dec(100, 18));

    // 36 hours pass with no Tellor updates
    await th.fastForwardTime(ETH_FREEZE_TIMEOUT + 1, web3.currentProvider);

    const now = await th.getLatestBlockTimestamp(web3);
    const { _timestampRetrieved: ethTime } = await mockTellor.getDataBefore(ETHUSD_TELLOR_REQ_ID, 0);
    const { _timestampRetrieved: cnyTime } = await mockTellor.getDataBefore(CNYUSD_TELLOR_REQ_ID, 0);
    assert.isTrue(ethTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));
    assert.isTrue(cnyTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));

    await mockChainlinkEth.setUpdateTime(now); // Chainlink's price is current
    await mockChainlinkCny.setUpdateTime(now); // Chainlink's price is current

    const priceFetchTx = await priceFeed.fetchPrice();
    let price = await priceFeed.lastGoodPrice();

    // Check that the returned price is current Chainlink price
    assert.equal(price, dec(1, 18));
  });

  it("C1 chainlinkWorking: Chainlink is working and Tellor breaks: switch to usingChainlinkTellorUntrusted", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(1200, 18)); // establish a "last good price" from the previous price fetch

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await setChainlinkPrice(dec(100, 8));

    await mockTellor.setPrice(0);

    const priceFetchTx = await priceFeed.fetchPrice();

    const statusAfter = await priceFeed.status();
    assert.equal(statusAfter, "4"); // status 4: Using Tellor, Chainlink untrusted
  });

  it("C1 chainlinkWorking: Chainlink is working and Tellor breaks: return Chainlink price", async () => {
    await setAddresses();
    priceFeed.setLastGoodPrice(dec(1200, 18)); // establish a "last good price" from the previous price fetch

    const statusBefore = await priceFeed.status();
    assert.equal(statusBefore, "0"); // status 0: Chainlink working

    await setChainlinkPrice(dec(100, 8));

    await mockTellor.setPrice(0);

    const priceFetchTx = await priceFeed.fetchPrice();
    let price = await priceFeed.lastGoodPrice();

    // Check that the returned price is current Chainlink price
    assert.equal(price, dec(1, 18));
  });

  // --- Case 2: Using Tellor ---

  // Using Tellor, Tellor breaks
  it("C2 usingTellorChainlinkUntrusted: Tellor breaks by zero price: switch to bothOraclesSuspect", async () => {
    await setAddresses();
    priceFeed.setStatus(1); // status 1: using Tellor, Chainlink untrusted

    await setChainlinkPrice(dec(999, 8));

    await priceFeed.setLastGoodPrice(dec(123, 18));

    const now = await th.getLatestBlockTimestamp(web3);
    await mockTellor.setUpdateTime(now);
    await mockTellor.setPrice(0);

    await priceFeed.fetchPrice();

    const status = await priceFeed.status();
    assert.equal(status, 2); // status 2: both oracles untrusted
  });

  it("C2 usingTellorChainlinkUntrusted: Tellor breaks by zero price: return last good price", async () => {
    await setAddresses();
    priceFeed.setStatus(1); // status 1: using Tellor, Chainlink untrusted

    await setChainlinkPrice(dec(999, 8));

    await priceFeed.setLastGoodPrice(dec(123, 18));

    const now = await th.getLatestBlockTimestamp(web3);
    await mockTellor.setUpdateTime(now);
    await mockTellor.setPrice(0);

    await priceFeed.fetchPrice();
    const price = await priceFeed.lastGoodPrice();

    assert.equal(price, dec(123, 18));
  });

  // Using Tellor, Tellor breaks
  it("C2 usingTellorChainlinkUntrusted: Tellor breaks by call reverted: switch to bothOraclesSuspect", async () => {
    await setAddresses();
    priceFeed.setStatus(1); // status 1: using Tellor, Chainlink untrusted

    await priceFeed.setLastGoodPrice(dec(123, 18));

    await setChainlinkPrice(dec(999, 8));
    await mockTellor.setPrice(dec(999, 6));

    await mockTellor.setRevertRequest();

    await priceFeed.fetchPrice();

    const status = await priceFeed.status();
    assert.equal(status, 2); // status 2: both oracles untrusted
  });

  it("C2 usingTellorChainlinkUntrusted: Tellor breaks by call reverted: return last good price", async () => {
    await setAddresses();
    priceFeed.setStatus(1); // status 1: using Tellor, Chainlink untrusted

    await priceFeed.setLastGoodPrice(dec(123, 18));

    await setChainlinkPrice(dec(999, 8));
    await mockTellor.setPrice(dec(999, 6));

    await mockTellor.setRevertRequest();

    await priceFeed.fetchPrice();
    const price = await priceFeed.lastGoodPrice();

    assert.equal(price, dec(123, 18));
  });

  // Using Tellor, Tellor breaks
  it("C2 usingTellorChainlinkUntrusted: Tellor breaks by zero timestamp: switch to bothOraclesSuspect", async () => {
    await setAddresses();
    priceFeed.setStatus(1); // status 1: using Tellor, Chainlink untrusted

    await priceFeed.setLastGoodPrice(dec(123, 18));

    await setChainlinkPrice(dec(999, 8));
    await mockTellor.setPrice(dec(999, 6));

    await mockTellor.setUpdateTime(0);

    await priceFeed.fetchPrice();

    const status = await priceFeed.status();
    assert.equal(status, 2); // status 2: both oracles untrusted
  });

  it("C2 usingTellorChainlinkUntrusted: Tellor breaks by zero timestamp: return last good price", async () => {
    await setAddresses();
    priceFeed.setStatus(1); // status 1: using Tellor, Chainlink untrusted

    await priceFeed.setLastGoodPrice(dec(123, 18));

    await setChainlinkPrice(dec(999, 8));
    await mockTellor.setPrice(dec(999, 6));

    await mockTellor.setUpdateTime(0);

    await priceFeed.fetchPrice();
    const price = await priceFeed.lastGoodPrice();

    assert.equal(price, dec(123, 18));
  });

  // Using Tellor, Tellor freezes
  it("C2 usingTellorChainlinkUntrusted: Tellor freezes - remain usingChainlinkTellorUntrusted", async () => {
    await setAddresses();
    priceFeed.setStatus(1); // status 1: using Tellor, Chainlink untrusted

    await setChainlinkPrice(dec(999, 8));

    await priceFeed.setLastGoodPrice(dec(246, 18));

    await mockTellor.setPrice(dec(123, 6));

    // 36 hours pass with no Tellor updates
    await th.fastForwardTime(ETH_FREEZE_TIMEOUT + 1, web3.currentProvider);

    const now = await th.getLatestBlockTimestamp(web3);
    const { _timestampRetrieved: ethTime } = await mockTellor.getDataBefore(ETHUSD_TELLOR_REQ_ID, 0);
    const { _timestampRetrieved: cnyTime } = await mockTellor.getDataBefore(CNYUSD_TELLOR_REQ_ID, 0);
    assert.isTrue(ethTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));
    assert.isTrue(cnyTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));

    await mockChainlinkEth.setUpdateTime(now);
    await mockChainlinkCny.setUpdateTime(now);

    await priceFeed.fetchPrice();

    const status = await priceFeed.status();
    assert.equal(status, 1); // status 1: using Tellor, Chainlink untrusted
  });

  it("C2 usingTellorChainlinkUntrusted: Tellor freezes - return last good price", async () => {
    await setAddresses();
    priceFeed.setStatus(1); // status 1: using Tellor, Chainlink untrusted

    await setChainlinkPrice(dec(999, 8));

    await priceFeed.setLastGoodPrice(dec(246, 18));

    await mockTellor.setPrice(dec(123, 6));

    // 36 hours pass with no Tellor updates
    await th.fastForwardTime(ETH_FREEZE_TIMEOUT + 1, web3.currentProvider);

    const now = await th.getLatestBlockTimestamp(web3);
    const { _timestampRetrieved: ethTime } = await mockTellor.getDataBefore(ETHUSD_TELLOR_REQ_ID, 0);
    const { _timestampRetrieved: cnyTime } = await mockTellor.getDataBefore(CNYUSD_TELLOR_REQ_ID, 0);
    assert.isTrue(ethTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));
    assert.isTrue(cnyTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));

    await mockChainlinkEth.setUpdateTime(now);

    await priceFeed.fetchPrice();
    const price = await priceFeed.lastGoodPrice();

    assert.equal(price, dec(246, 18));
  });

  // Using Tellor, both Chainlink & Tellor go live

  it("C2 usingTellorChainlinkUntrusted: both Tellor and Chainlink are live and <= 5% price difference - switch to chainlinkWorking", async () => {
    await setAddresses();
    priceFeed.setStatus(1); // status 1: using Tellor, Chainlink untrusted

    await mockTellor.setPrice(dec(100, 6)); // price = 1
    await mockChainlinkEth.setPrice(dec(105, 8)); // price = 1.05: 5% difference from Tellor
    await mockChainlinkCny.setPrice(dec(100, 8));

    await priceFeed.fetchPrice();

    const status = await priceFeed.status();
    assert.equal(status, 0); // status 0: Chainlink working
  });

  it("C2 usingTellorChainlinkUntrusted: both Tellor and Chainlink are live and <= 5% price difference - return Chainlink price", async () => {
    await setAddresses();
    priceFeed.setStatus(1); // status 1: using Tellor, Chainlink untrusted

    await mockTellor.setPrice(dec(100, 6)); // price = 1
    await mockChainlinkEth.setPrice(dec(105, 8)); // price = 1.05: 5% difference from Tellor
    await mockChainlinkCny.setPrice(dec(100, 8));

    await priceFeed.fetchPrice();

    const price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(105, 16));
  });

  it("C2 usingTellorChainlinkUntrusted: both Tellor and Chainlink are live and > 5% price difference - remain usingChainlinkTellorUntrusted", async () => {
    await setAddresses();
    priceFeed.setStatus(1); // status 1: using Tellor, Chainlink untrusted

    await mockTellor.setPrice(dec(100, 6)); // price = 1
    await mockChainlinkEth.setPrice(dec(106, 8)); // price = 1.06: > 5% difference from Tellor
    await mockChainlinkCny.setPrice(dec(100, 8));

    await priceFeed.fetchPrice();

    const status = await priceFeed.status();
    assert.equal(status, 1); // status 1: using Tellor, Chainlink untrusted
  });

  it("C2 usingTellorChainlinkUntrusted: both Tellor and Chainlink are live and > 5% price difference - return Tellor price", async () => {
    await setAddresses();
    priceFeed.setStatus(1); // status 1: using Tellor, Chainlink untrusted

    await mockTellor.setPrice(dec(100, 6)); // price = 1
    await mockChainlinkEth.setPrice(dec(106, 8)); // price = 1.06: > 5% difference from Tellor
    await mockChainlinkCny.setPrice(dec(100, 8));

    await priceFeed.fetchPrice();

    const price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(1, 18));
  });

  // --- Case 3: Both Oracles suspect

  it("C3 bothOraclesUntrusted: both Tellor and Chainlink are live and > 5% price difference remain bothOraclesSuspect", async () => {
    await setAddresses();
    priceFeed.setStatus(2); // status 2: both oracles untrusted

    await priceFeed.setLastGoodPrice(dec(50, 18));

    await mockTellor.setPrice(dec(100, 6)); // price = 1
    await mockChainlinkEth.setPrice(dec(106, 8)); // price = 1.06: > 5% difference from Tellor
    await mockChainlinkCny.setPrice(dec(100, 8));

    const status = await priceFeed.status();
    assert.equal(status, 2); // status 2: both oracles untrusted
  });

  it("C3 bothOraclesUntrusted: both Tellor and Chainlink are live and > 5% price difference, return last good price", async () => {
    await setAddresses();
    priceFeed.setStatus(2); // status 2: both oracles untrusted

    await priceFeed.setLastGoodPrice(dec(50, 18));

    await mockTellor.setPrice(dec(100, 6)); // price = 1
    await mockChainlinkEth.setPrice(dec(106, 8)); // price = 1.06: > 5% difference from Tellor
    await mockChainlinkCny.setPrice(dec(100, 8));

    await priceFeed.fetchPrice();
    const price = await priceFeed.lastGoodPrice();

    assert.equal(price, dec(50, 18));
  });

  it("C3 bothOraclesUntrusted: both Tellor and Chainlink are live and <= 5% price difference, switch to chainlinkWorking", async () => {
    await setAddresses();
    priceFeed.setStatus(2); // status 2: both oracles untrusted

    await mockTellor.setPrice(dec(100, 6)); // price = 1
    await mockChainlinkEth.setPrice(dec(105, 8)); // price = 1.05: 5% difference from Tellor
    await mockChainlinkCny.setPrice(dec(100, 8));

    await priceFeed.fetchPrice();

    const status = await priceFeed.status();
    assert.equal(status, 0); // status 0: Chainlink working
  });

  it("C3 bothOraclesUntrusted: both Tellor and Chainlink are live and <= 5% price difference, return Chainlink price", async () => {
    await setAddresses();
    priceFeed.setStatus(2); // status 2: both oracles untrusted

    await mockTellor.setPrice(dec(100, 6)); // price = 1
    await mockChainlinkEth.setPrice(dec(105, 8)); // price = 1.05: 5% difference from Tellor
    await mockChainlinkCny.setPrice(dec(100, 8));

    await priceFeed.fetchPrice();

    const price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(105, 16));
  });

  // --- Case 4 ---
  it("C4 usingTellorChainlinkFrozen: when both Chainlink and Tellor break, switch to bothOraclesSuspect", async () => {
    await setAddresses();
    priceFeed.setStatus(3); // status 3: using Tellor, Chainlink frozen

    await setChainlinkPrice(dec(999, 8));

    // Both Chainlink and Tellor break with 0 price
    await mockChainlinkEth.setPrice(0);
    await mockChainlinkCny.setPrice(0);
    await mockTellor.setPrice(0);

    await priceFeed.fetchPrice();

    const status = await priceFeed.status();
    assert.equal(status, 2); // status 2: both oracles untrusted
  });

  it("C4 usingTellorChainlinkFrozen: when both Chainlink and Tellor break, return last good price", async () => {
    await setAddresses();
    priceFeed.setStatus(2); // status 2: using tellor, chainlink frozen

    await priceFeed.setLastGoodPrice(dec(50, 18));

    await mockChainlinkEth.setPrevPrice(dec(999, 8));
    await mockChainlinkCny.setPrevPrice(dec(999, 8));

    // Both Chainlink and Tellor break with 0 price
    await mockChainlinkEth.setPrice(dec(0));
    await mockChainlinkCny.setPrice(dec(0));
    await mockTellor.setPrice(dec(0));

    await priceFeed.fetchPrice();

    const price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(50, 18));
  });

  it("C4 usingTellorChainlinkFrozen: when Chainlink breaks and Tellor freezes, switch to usingChainlinkTellorUntrusted", async () => {
    await setAddresses();
    priceFeed.setStatus(3); // status 3: using Tellor, Chainlink frozen

    await priceFeed.setLastGoodPrice(dec(50, 18));

    await mockChainlinkEth.setPrevPrice(dec(999, 8));
    await mockChainlinkCny.setPrevPrice(dec(999, 8));

    // Chainlink breaks
    await mockChainlinkEth.setPrice(dec(0));
    await mockChainlinkCny.setPrice(dec(0));

    await mockTellor.setPrice(dec(123, 6));

    await th.fastForwardTime(ETH_FREEZE_TIMEOUT + 1, web3.currentProvider);

    const now = await th.getLatestBlockTimestamp(web3);
    const { _timestampRetrieved: ethTime } = await mockTellor.getDataBefore(ETHUSD_TELLOR_REQ_ID, 0);
    const { _timestampRetrieved: cnyTime } = await mockTellor.getDataBefore(CNYUSD_TELLOR_REQ_ID, 0);
    assert.isTrue(ethTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));
    assert.isTrue(cnyTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));

    await priceFeed.fetchPrice();

    const status = await priceFeed.status();
    assert.equal(status, 1); // status 1: using Tellor, Chainlink untrusted
  });

  it("C4 usingTellorChainlinkFrozen: when Chainlink breaks and Tellor freezes, return last good price", async () => {
    await setAddresses();
    priceFeed.setStatus(3); // status 3: using Tellor, Chainlink frozen

    await priceFeed.setLastGoodPrice(dec(50, 18));

    await mockChainlinkEth.setPrevPrice(dec(999, 8));
    await mockChainlinkCny.setPrevPrice(dec(999, 8));

    // Chainlink breaks
    await mockChainlinkEth.setPrice(dec(0));
    await mockChainlinkCny.setPrice(dec(0));

    await mockTellor.setPrice(dec(123, 6));

    await th.fastForwardTime(ETH_FREEZE_TIMEOUT + 1, web3.currentProvider);

    const now = await th.getLatestBlockTimestamp(web3);
    const { _timestampRetrieved: ethTime } = await mockTellor.getDataBefore(ETHUSD_TELLOR_REQ_ID, 0);
    const { _timestampRetrieved: cnyTime } = await mockTellor.getDataBefore(CNYUSD_TELLOR_REQ_ID, 0);
    assert.isTrue(ethTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));
    assert.isTrue(cnyTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));

    await priceFeed.fetchPrice();

    const price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(50, 18));
  });

  it("C4 usingTellorChainlinkFrozen: when Chainlink breaks and Tellor live, switch to usingChainlinkTellorUntrusted", async () => {
    await setAddresses();
    priceFeed.setStatus(3); // status 3: using Tellor, Chainlink frozen

    await priceFeed.setLastGoodPrice(dec(50, 18));

    await mockChainlinkEth.setPrevPrice(dec(999, 8));
    await mockChainlinkCny.setPrevPrice(dec(999, 8));

    // Chainlink breaks
    await mockChainlinkEth.setPrice(dec(0));
    await mockChainlinkCny.setPrice(dec(0));

    await mockTellor.setPrice(dec(123, 6));

    await th.fastForwardTime(ETH_FREEZE_TIMEOUT + 1, web3.currentProvider); // Fast forward 4 hours

    await priceFeed.fetchPrice();

    const status = await priceFeed.status();
    assert.equal(status, 1); // status 1: using Tellor, Chainlink untrusted
  });

  it("C4 usingTellorChainlinkFrozen: when Chainlink breaks and Tellor live, return Tellor price", async () => {
    await setAddresses();
    priceFeed.setStatus(3); // status 3: using Tellor, Chainlink frozen

    await priceFeed.setLastGoodPrice(dec(50, 18));

    await mockChainlinkEth.setPrevPrice(dec(999, 8));
    await mockChainlinkCny.setPrevPrice(dec(999, 8));

    // Chainlink breaks
    await mockChainlinkEth.setPrice(dec(0));
    await mockChainlinkCny.setPrice(dec(0));

    await mockTellor.setPrice(dec(123, 6));

    await priceFeed.fetchPrice();

    const price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(1, 18));
  });

  it("C4 usingTellorChainlinkFrozen: when Chainlink is live and Tellor is live with <5% price difference, switch back to chainlinkWorking", async () => {
    await setAddresses();
    priceFeed.setStatus(3); // status 3: using Tellor, Chainlink frozen

    await priceFeed.setLastGoodPrice(dec(50, 18));

    await setChainlinkPrice(dec(100, 8));

    await mockTellor.setEthPrice(dec(105, 6));
    await mockTellor.setCnyPrice(dec(100, 6));

    await priceFeed.fetchPrice();

    const status = await priceFeed.status();
    assert.equal(status, 0); // status 0: Chainlink working
  });

  it("C4 usingTellorChainlinkFrozen: when Chainlink is live and Tellor is live with <5% price difference, return Chainlink current price", async () => {
    await setAddresses();
    priceFeed.setStatus(3); // status 3: using Tellor, Chainlink frozen

    await priceFeed.setLastGoodPrice(dec(50, 18));

    await setChainlinkPrice(dec(100, 8));

    await mockTellor.setEthPrice(dec(105, 6));
    await mockTellor.setCnyPrice(dec(100, 6));

    await priceFeed.fetchPrice();

    const price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(1, 18)); // Chainlink price
  });

  it("C4 usingTellorChainlinkFrozen: when Chainlink is live and Tellor is live with >5% price difference, switch back to usingChainlinkTellorUntrusted", async () => {
    await setAddresses();
    priceFeed.setStatus(3); // status 3: using Tellor, Chainlink frozen

    await priceFeed.setLastGoodPrice(dec(50, 18));

    await setChainlinkPrice(dec(100, 8));

    await mockTellor.setEthPrice(dec(110, 6));
    await mockTellor.setCnyPrice(dec(100, 6));

    await priceFeed.fetchPrice();

    const status = await priceFeed.status();
    assert.equal(status, 1); // status 1: Using Tellor, Chainlink untrusted
  });

  it("C4 usingTellorChainlinkFrozen: when Chainlink is live and Tellor is live with >5% price difference, return Chainlink current price", async () => {
    await setAddresses();
    priceFeed.setStatus(3); // status 3: using Tellor, Chainlink frozen

    await priceFeed.setLastGoodPrice(dec(50, 18));

    await setChainlinkPrice(dec(100, 8));

    await mockTellor.setEthPrice(dec(110, 6));
    await mockTellor.setCnyPrice(dec(100, 6));

    await priceFeed.fetchPrice();

    const price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(110, 16)); // Tellor price
  });

  it("C4 usingTellorChainlinkFrozen: when Chainlink is live and Tellor is live with similar price, switch back to chainlinkWorking", async () => {
    await setAddresses();
    priceFeed.setStatus(3); // status 3: using Tellor, Chainlink frozen

    await priceFeed.setLastGoodPrice(dec(50, 18));

    await setChainlinkPrice(dec(100, 8));

    await mockTellor.setEthPrice(dec(101, 6));
    await mockTellor.setCnyPrice(dec(100, 6));

    await priceFeed.fetchPrice();

    const status = await priceFeed.status();
    assert.equal(status, 0); // status 0: Chainlink working
  });

  it("C4 usingTellorChainlinkFrozen: when Chainlink is live and Tellor is live with similar price, return Chainlink current price", async () => {
    await setAddresses();
    priceFeed.setStatus(3); // status 3: using Tellor, Chainlink frozen

    await priceFeed.setLastGoodPrice(dec(50, 18));

    await setChainlinkPrice(dec(100, 8));

    await mockTellor.setEthPrice(dec(101, 6));
    await mockTellor.setCnyPrice(dec(100, 6));

    await priceFeed.fetchPrice();

    const price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(1, 18)); // Chainlink price
  });

  it("C4 usingTellorChainlinkFrozen: when Chainlink is live and Tellor breaks, switch to usingChainlinkTellorUntrusted", async () => {
    await setAddresses();
    priceFeed.setStatus(3); // status 3: using Tellor, Chainlink frozen

    await priceFeed.setLastGoodPrice(dec(50, 18));

    await setChainlinkPrice(dec(100, 8));

    await mockTellor.setPrice(0);

    await priceFeed.fetchPrice();

    const status = await priceFeed.status();
    assert.equal(status, 4); // status 4: Using Chainlink, Tellor untrusted
  });

  it("C4 usingTellorChainlinkFrozen: when Chainlink is live and Tellor breaks, return Chainlink current price", async () => {
    await setAddresses();
    priceFeed.setStatus(3); // status 3: using Tellor, Chainlink frozen

    await priceFeed.setLastGoodPrice(dec(50, 18));

    await setChainlinkPrice(dec(100, 8));

    await mockTellor.setPrice(0);

    await priceFeed.fetchPrice();

    const price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(1, 18));
  });

  it("C4 usingTellorChainlinkFrozen: when Chainlink still frozen and Tellor breaks, switch to usingChainlinkTellorUntrusted", async () => {
    await setAddresses();
    priceFeed.setStatus(3); // status 3: using Tellor, Chainlink frozen

    await priceFeed.setLastGoodPrice(dec(50, 18));

    await setChainlinkPrice(dec(100, 8));

    await th.fastForwardTime(ETH_FREEZE_TIMEOUT + 1, web3.currentProvider); // Fast forward 4 hours

    // check Chainlink price timestamp is out of date by > 4 hours
    const now = await th.getLatestBlockTimestamp(web3);
    const chainlinkUpdateTime = (await mockChainlinkEth.latestRoundData())[3];
    assert.isTrue(chainlinkUpdateTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));

    // set tellor broken
    await mockTellor.setPrice(0);

    await priceFeed.fetchPrice();

    const status = await priceFeed.status();
    assert.equal(status, 4); // status 4: using Chainlink, Tellor untrusted
  });

  it("C4 usingTellorChainlinkFrozen: when Chainlink still frozen and Tellor broken, return last good price", async () => {
    await setAddresses();
    priceFeed.setStatus(3); // status 3: using Tellor, Chainlink frozen

    await priceFeed.setLastGoodPrice(dec(50, 18));

    await setChainlinkPrice(dec(100, 8));

    await th.fastForwardTime(ETH_FREEZE_TIMEOUT + 1, web3.currentProvider); // Fast forward 4 hours

    // check Chainlink price timestamp is out of date by > 4 hours
    const now = await th.getLatestBlockTimestamp(web3);
    const chainlinkUpdateTime = (await mockChainlinkEth.latestRoundData())[3];
    assert.isTrue(chainlinkUpdateTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));

    // set tellor broken
    await mockTellor.setPrice(0);

    await priceFeed.fetchPrice();

    const price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(50, 18));
  });

  it("C4 usingTellorChainlinkFrozen: when Chainlink still frozen and Tellor live, remain usingTellorChainlinkFrozen", async () => {
    await setAddresses();
    priceFeed.setStatus(3); // status 3: using Tellor, Chainlink frozen

    await priceFeed.setLastGoodPrice(dec(50, 18));

    await setChainlinkPrice(dec(100, 8));

    await mockTellor.setPrice(dec(123, 6));

    await th.fastForwardTime(ETH_FREEZE_TIMEOUT + 1, web3.currentProvider); // Fast forward 4 hours

    // check Chainlink price timestamp is out of date by > 4 hours
    const now = await th.getLatestBlockTimestamp(web3);
    const chainlinkUpdateTime = (await mockChainlinkEth.latestRoundData())[3];
    assert.isTrue(chainlinkUpdateTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));

    // set Tellor to current time
    await mockTellor.setUpdateTime(now);

    await priceFeed.fetchPrice();

    const status = await priceFeed.status();
    assert.equal(status, 3); // status 3: using Tellor, Chainlink frozen
  });

  it("C4 usingTellorChainlinkFrozen: when Chainlink still frozen and Tellor live, return Tellor price", async () => {
    await setAddresses();
    priceFeed.setStatus(3); // status 3: using Tellor, Chainlink frozen

    await priceFeed.setLastGoodPrice(dec(50, 18));

    await setChainlinkPrice(dec(100, 8));

    await mockTellor.setPrice(dec(123, 6));

    await th.fastForwardTime(ETH_FREEZE_TIMEOUT + 1, web3.currentProvider); // Fast forward 4 hours

    // check Chainlink price timestamp is out of date by > 4 hours
    const now = await th.getLatestBlockTimestamp(web3);
    const chainlinkUpdateTime = (await mockChainlinkEth.latestRoundData())[3];
    assert.isTrue(chainlinkUpdateTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));

    // set Tellor to current time
    await mockTellor.setUpdateTime(now);

    await priceFeed.fetchPrice();

    const price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(1, 18));
  });

  it("C4 usingTellorChainlinkFrozen: when Chainlink still frozen and Tellor freezes, remain usingTellorChainlinkFrozen", async () => {
    await setAddresses();
    priceFeed.setStatus(3); // status 3: using Tellor, Chainlink frozen

    await priceFeed.setLastGoodPrice(dec(50, 18));

    await setChainlinkPrice(dec(100, 8));

    await mockTellor.setPrice(dec(123, 6));

    await th.fastForwardTime(ETH_FREEZE_TIMEOUT + 1, web3.currentProvider); // Fast forward 4 hours

    // check Chainlink price timestamp is out of date by > 4 hours
    const now = await th.getLatestBlockTimestamp(web3);
    const chainlinkUpdateTime = (await mockChainlinkEth.latestRoundData())[3];
    assert.isTrue(chainlinkUpdateTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));

    // check Tellor price timestamp is out of date by > 4 hours
    const { _timestampRetrieved: ethTime } = await mockTellor.getDataBefore(ETHUSD_TELLOR_REQ_ID, 0);
    const { _timestampRetrieved: cnyTime } = await mockTellor.getDataBefore(CNYUSD_TELLOR_REQ_ID, 0);
    assert.isTrue(ethTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));
    assert.isTrue(cnyTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));

    await priceFeed.fetchPrice();

    const status = await priceFeed.status();
    assert.equal(status, 3); // status 3: using Tellor, Chainlink frozen
  });

  it("C4 usingTellorChainlinkFrozen: when Chainlink still frozen and Tellor freezes, return last good price", async () => {
    await setAddresses();
    priceFeed.setStatus(3); // status 3: using Tellor, Chainlink frozen

    await priceFeed.setLastGoodPrice(dec(50, 18));

    await setChainlinkPrice(dec(100, 8));

    await mockTellor.setPrice(dec(123, 6));

    await th.fastForwardTime(ETH_FREEZE_TIMEOUT + 1, web3.currentProvider); // Fast forward 4 hours

    // check Chainlink price timestamp is out of date by > 4 hours
    const now = await th.getLatestBlockTimestamp(web3);
    const chainlinkUpdateTime = (await mockChainlinkEth.latestRoundData())[3];
    assert.isTrue(chainlinkUpdateTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));

    // check Tellor price timestamp is out of date by > 4 hours
    const { _timestampRetrieved: ethTime } = await mockTellor.getDataBefore(ETHUSD_TELLOR_REQ_ID, 0);
    const { _timestampRetrieved: cnyTime } = await mockTellor.getDataBefore(CNYUSD_TELLOR_REQ_ID, 0);
    assert.isTrue(ethTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));
    assert.isTrue(cnyTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));

    await priceFeed.fetchPrice();

    const price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(50, 18));
  });

  // --- Case 5 ---
  it("C5 usingChainlinkTellorUntrusted: when Chainlink is live and Tellor price >5% - no status change", async () => {
    await setAddresses();
    priceFeed.setStatus(4); // status 4: using chainlink, Tellor untrusted

    await priceFeed.setLastGoodPrice(dec(246, 18));

    await setChainlinkPrice(dec(100, 8));

    await mockTellor.setEthPrice(dec(123, 6)); // Greater than 5% difference with chainlink
    await mockTellor.setCnyPrice(dec(100, 6)); // Greater than 5% difference with chainlink

    await priceFeed.fetchPrice();

    const status = await priceFeed.status();
    assert.equal(status, 4); // status 4: using Chainlink, Tellor untrusted
  });

  it("C5 usingChainlinkTellorUntrusted: when Chainlink is live and Tellor price >5% - return Chainlink price", async () => {
    await setAddresses();
    priceFeed.setStatus(4); // status 4: using chainlink, Tellor untrusted

    await priceFeed.setLastGoodPrice(dec(246, 18));

    await setChainlinkPrice(dec(100, 8));

    await mockTellor.setEthPrice(dec(123, 6)); // Greater than 5% difference with chainlink
    await mockTellor.setCnyPrice(dec(100, 6)); // Greater than 5% difference with chainlink

    await priceFeed.fetchPrice();

    const price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(1, 18));
  });

  it("C5 usingChainlinkTellorUntrusted: when Chainlink is live and Tellor price within <5%, switch to chainlinkWorking", async () => {
    await setAddresses();
    priceFeed.setStatus(4); // status 4:  using chainlink, Tellor untrusted

    await priceFeed.setLastGoodPrice(dec(246, 18));

    await setChainlinkPrice(dec(100, 8));

    await mockTellor.setEthPrice(dec(101, 6)); // within 5% of Chainlink
    await mockTellor.setCnyPrice(dec(100, 6)); // within 5% of Chainlink

    await priceFeed.fetchPrice();

    const status = await priceFeed.status();
    assert.equal(status, 0); // status 0: Chainlink working
  });

  it("C5 usingChainlinkTellorUntrusted: when Chainlink is live, Tellor price not within 5%, return Chainlink price", async () => {
    await setAddresses();
    priceFeed.setStatus(4); // status 4:  using chainlink, Tellor untrusted

    await priceFeed.setLastGoodPrice(dec(246, 18));

    await setChainlinkPrice(dec(100, 8));

    await mockTellor.setEthPrice(dec(101, 6)); // within 5% of Chainlink
    await mockTellor.setCnyPrice(dec(100, 6)); // within 5% of Chainlink

    await priceFeed.fetchPrice();

    const price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(1, 18));
  });

  // ---------

  it("C5 usingChainlinkTellorUntrusted: when Chainlink is live, <50% price deviation from previous, Tellor price not within 5%, remain on usingChainlinkTellorUntrusted", async () => {
    await setAddresses();
    priceFeed.setStatus(4); // status 4:  using chainlink, Tellor untrusted

    await priceFeed.setLastGoodPrice(dec(246, 18));

    await setChainlinkPrice(dec(100, 8));
    await mockTellor.setEthPrice(dec(110, 6)); // Tellor not close to current Chainlink
    await mockTellor.setCnyPrice(dec(100, 6)); // Tellor not close to current Chainlink

    await priceFeed.fetchPrice();

    const status = await priceFeed.status();
    assert.equal(status, 4); // status 4: using Chainlink, Tellor untrusted
  });

  it("C5 usingChainlinkTellorUntrusted: when Chainlink is live, <50% price deviation from previous, Tellor price not within 5%, return Chainlink price", async () => {
    await setAddresses();
    priceFeed.setStatus(4); // status 4:  using chainlink, Tellor untrusted

    await priceFeed.setLastGoodPrice(dec(246, 18));

    await setChainlinkPrice(dec(100, 8));
    await mockTellor.setEthPrice(dec(110, 6)); // Tellor not close to current Chainlink
    await mockTellor.setCnyPrice(dec(100, 6)); // Tellor not close to current Chainlink

    await priceFeed.fetchPrice();

    const price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(1, 18));
  });

  it("C5 usingChainlinkTellorUntrusted: when Chainlink is live, >50% price deviation from previous, Tellor price not within 5%, remain on usingChainlinkTellorUntrusted", async () => {
    await setAddresses();
    priceFeed.setStatus(4); // status 4:  using chainlink, Tellor untrusted

    await priceFeed.setLastGoodPrice(dec(246, 18));

    await mockChainlinkEth.setPrevPrice(dec(300, 8)); // price = 3
    await mockChainlinkCny.setPrevPrice(dec(100, 8));

    await mockChainlinkEth.setPrice(dec(100, 8)); // price = 1 > 50% price drop from previous Chainlink price
    await mockChainlinkCny.setPrice(dec(100, 8));

    await mockTellor.setEthPrice(dec(110, 6)); // Tellor not close to current Chainlink
    await mockTellor.setCnyPrice(dec(100, 6));

    await priceFeed.fetchPrice();

    const status = await priceFeed.status();
    assert.equal(status, 2); // status 2: both Oracles untrusted
  });

  it("C5 usingChainlinkTellorUntrusted: when Chainlink is live, >50% price deviation from previous,  Tellor price not within 5%, return Chainlink price", async () => {
    await setAddresses();
    priceFeed.setStatus(4); // status 4:  using chainlink, Tellor untrusted

    await priceFeed.setLastGoodPrice(dec(246, 18));

    await mockChainlinkEth.setPrevPrice(dec(300, 8)); // price = 3
    await mockChainlinkCny.setPrevPrice(dec(100, 8));
    await mockChainlinkEth.setPrice(dec(100, 8)); // price 1 > 50% price drop from previous Chainlink price
    await mockChainlinkCny.setPrice(dec(100, 8));

    await mockTellor.setEthPrice(dec(110, 6)); // price 1.1, Tellor not close to current Chainlink
    await mockTellor.setCnyPrice(dec(100, 6));

    await priceFeed.fetchPrice();

    const price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(246, 18)); // last good price
  });

  // -------

  it("C5 usingChainlinkTellorUntrusted: when Chainlink is live, <50% price deviation from previous, and Tellor is frozen, remain on usingChainlinkTellorUntrusted", async () => {
    await setAddresses();
    priceFeed.setStatus(4); // status 4:  using chainlink, Tellor untrusted

    await priceFeed.setLastGoodPrice(dec(246, 18));

    await setChainlinkPrice(dec(100, 8));

    await mockTellor.setPrice(dec(123, 6));

    await th.fastForwardTime(ETH_FREEZE_TIMEOUT + 1, web3.currentProvider); // fast forward 4 hours

    // check Tellor price timestamp is out of date by > 4 hours
    const now = await th.getLatestBlockTimestamp(web3);
    const { _timestampRetrieved: ethTime } = await mockTellor.getDataBefore(ETHUSD_TELLOR_REQ_ID, 0);
    const { _timestampRetrieved: cnyTime } = await mockTellor.getDataBefore(CNYUSD_TELLOR_REQ_ID, 0);
    assert.isTrue(ethTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));
    assert.isTrue(cnyTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));

    await mockChainlinkEth.setPrice(dec(100, 8));
    await mockChainlinkCny.setPrice(dec(100, 8));
    await mockChainlinkEth.setUpdateTime(now); // Chainlink is current
    await mockChainlinkCny.setUpdateTime(now); // Chainlink is current

    await priceFeed.fetchPrice();

    const status = await priceFeed.status();
    assert.equal(status, 4); // status 4: using Chainlink, Tellor untrusted
  });

  it("C5 usingChainlinkTellorUntrusted: when Chainlink is live, <50% price deviation from previous, Tellor is frozen, return Chainlink price", async () => {
    await setAddresses();
    priceFeed.setStatus(4); // status 4:  using chainlink, Tellor untrusted

    await priceFeed.setLastGoodPrice(dec(246, 18));

    await setChainlinkPrice(dec(100, 8));

    await mockTellor.setPrice(dec(123, 6));

    await th.fastForwardTime(ETH_FREEZE_TIMEOUT + 1, web3.currentProvider); // fast forward 4 hours

    // check Tellor price timestamp is out of date by > 4 hours
    const now = await th.getLatestBlockTimestamp(web3);
    const { _timestampRetrieved: ethTime } = await mockTellor.getDataBefore(ETHUSD_TELLOR_REQ_ID, 0);
    const { _timestampRetrieved: cnyTime } = await mockTellor.getDataBefore(CNYUSD_TELLOR_REQ_ID, 0);
    assert.isTrue(ethTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));
    assert.isTrue(cnyTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));

    await mockChainlinkEth.setPrice(dec(100, 8));
    await mockChainlinkCny.setPrice(dec(100, 8));
    await mockChainlinkEth.setUpdateTime(now); // Chainlink is current
    await mockChainlinkCny.setUpdateTime(now); // Chainlink is current

    await priceFeed.fetchPrice();

    const price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(1, 18));
  });

  it("C5 usingChainlinkTellorUntrusted: when Chainlink is live, >50% price deviation from previous, Tellor is frozen, remain on usingChainlinkTellorUntrusted", async () => {
    await setAddresses();
    priceFeed.setStatus(4); // status 4:  using chainlink, Tellor untrusted

    await priceFeed.setLastGoodPrice(dec(246, 18));

    await setChainlinkPrice(dec(200, 8)); // price = 1

    await mockTellor.setPrice(dec(123, 6));

    await th.fastForwardTime(ETH_FREEZE_TIMEOUT + 1, web3.currentProvider); // fast forward 4 hours

    // check Tellor price timestamp is out of date by > 4 hours
    const now = await th.getLatestBlockTimestamp(web3);
    const { _timestampRetrieved: ethTime } = await mockTellor.getDataBefore(ETHUSD_TELLOR_REQ_ID, 0);
    const { _timestampRetrieved: cnyTime } = await mockTellor.getDataBefore(CNYUSD_TELLOR_REQ_ID, 0);
    assert.isTrue(ethTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));
    assert.isTrue(cnyTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));

    await mockChainlinkEth.setPrice(dec(300, 8)); // price = 3 > 50% price drop from previous Chainlink price
    await mockChainlinkCny.setPrice(dec(100, 8));
    await mockChainlinkEth.setUpdateTime(now); // Chainlink is current
    await mockChainlinkCny.setUpdateTime(now);

    await priceFeed.fetchPrice();

    const status = await priceFeed.status();
    assert.equal(status, 2); // status 2: both Oracles untrusted
  });

  it("C5 usingChainlinkTellorUntrusted: when Chainlink is live, >50% price deviation from previous, Tellor is frozen, return Chainlink price", async () => {
    await setAddresses();
    priceFeed.setStatus(4); // status 4:  using chainlink, Tellor untrusted

    await priceFeed.setLastGoodPrice(dec(246, 18));

    await setChainlinkPrice(dec(200, 8)); // price = 1

    await mockTellor.setPrice(dec(123, 6));

    await th.fastForwardTime(ETH_FREEZE_TIMEOUT + 1, web3.currentProvider); // fast forward 4 hours

    // check Tellor price timestamp is out of date by > 4 hours
    const now = await th.getLatestBlockTimestamp(web3);
    const { _timestampRetrieved: ethTime } = await mockTellor.getDataBefore(ETHUSD_TELLOR_REQ_ID, 0);
    const { _timestampRetrieved: cnyTime } = await mockTellor.getDataBefore(CNYUSD_TELLOR_REQ_ID, 0);
    assert.isTrue(ethTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));
    assert.isTrue(cnyTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));

    await mockChainlinkEth.setPrice(dec(300, 8)); // price = 3 > 50% price drop from previous Chainlink price
    await mockChainlinkCny.setPrice(dec(100, 8));
    await mockChainlinkEth.setUpdateTime(now); // Chainlink is current
    await mockChainlinkCny.setUpdateTime(now);

    await priceFeed.fetchPrice();

    const price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(246, 18)); // last good price
  });

  it("C5 usingChainlinkTellorUntrusted: when Chainlink frozen, remain on usingChainlinkTellorUntrusted", async () => {
    await setAddresses();
    priceFeed.setStatus(4); // status 4: using chainlink, Tellor untrusted

    await priceFeed.setLastGoodPrice(dec(246, 18));

    await setChainlinkPrice(dec(100, 8)); // price = 1

    await mockTellor.setPrice(dec(123, 6));

    await th.fastForwardTime(ETH_FREEZE_TIMEOUT + 1, web3.currentProvider); // Fast forward 4 hours

    // check Chainlink price timestamp is out of date by > 4 hours
    const now = await th.getLatestBlockTimestamp(web3);
    const chainlinkUpdateTime = (await mockChainlinkEth.latestRoundData())[3];
    assert.isTrue(chainlinkUpdateTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));

    await priceFeed.fetchPrice();

    const status = await priceFeed.status();
    assert.equal(status, 4); // status 4: using Chainlink, Tellor untrusted
  });

  it("C5 usingChainlinkTellorUntrusted: when Chainlink frozen, return last good price", async () => {
    await setAddresses();
    priceFeed.setStatus(4); // status 4: using Chainlink, Tellor untrusted

    await priceFeed.setLastGoodPrice(dec(246, 18));

    await setChainlinkPrice(dec(100, 8)); // price = 1

    await mockTellor.setPrice(dec(123, 6));

    await th.fastForwardTime(ETH_FREEZE_TIMEOUT + 1, web3.currentProvider); // Fast forward 4 hours

    // check Chainlink price timestamp is out of date by > 4 hours
    const now = await th.getLatestBlockTimestamp(web3);
    const chainlinkUpdateTime = (await mockChainlinkEth.latestRoundData())[3];
    assert.isTrue(chainlinkUpdateTime.lt(toBN(now).sub(toBN(ETH_FREEZE_TIMEOUT))));

    await priceFeed.fetchPrice();

    const price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(246, 18));
  });

  it("C5 usingChainlinkTellorUntrusted: when Chainlink breaks too, switch to bothOraclesSuspect", async () => {
    await setAddresses();
    priceFeed.setStatus(4); // status 4: using chainlink, Tellor untrusted

    await priceFeed.setLastGoodPrice(dec(246, 18));

    await setChainlinkPrice(dec(100, 8)); // price = 1
    await mockChainlinkEth.setUpdateTime(0); // Chainlink breaks by 0 timestamp

    await mockTellor.setPrice(dec(123, 6));

    await priceFeed.fetchPrice();

    const status = await priceFeed.status();
    assert.equal(status, 2); // status 2: both oracles untrusted
  });

  it("C5 usingChainlinkTellorUntrusted: Chainlink breaks too, return last good price", async () => {
    await setAddresses();
    priceFeed.setStatus(4); // status 4: using chainlink, Tellor untrusted

    await priceFeed.setLastGoodPrice(dec(246, 18));

    await setChainlinkPrice(dec(100, 8)); // price = 1
    await mockChainlinkEth.setUpdateTime(0); // Chainlink breaks by 0 timestamp

    await mockTellor.setPrice(dec(123, 6));

    await priceFeed.fetchPrice();

    const price = await priceFeed.lastGoodPrice();
    assert.equal(price, dec(246, 18));
  });
});
