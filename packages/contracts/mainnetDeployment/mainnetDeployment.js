const { ChainlinkAggregatorV3Interface } = require("./ABIs/ChainlinkAggregatorV3Interface.js")

const { TestHelper: th, TimeValues: timeVals } = require("../utils/testHelpers.js")
const MainnetDeploymentHelper = require("../utils/mainnetDeploymentHelpers.js")
const { dec } = th

async function mainnetDeploy(configParams) {
  const date = new Date()
  console.log(date.toUTCString())
  const deployerWallet = (await ethers.getSigners())[0]
  const mdh = new MainnetDeploymentHelper(configParams, deployerWallet)
  const gasPrice = configParams.GAS_PRICE

  const deploymentState = mdh.loadPreviousDeployment()

  console.log(`deployer address: ${deployerWallet.address}`)
  assert.equal(deployerWallet.address, configParams.liquityAddrs.DEPLOYER)
  
  let deployerETHBalance = await ethers.provider.getBalance(deployerWallet.address)
  console.log(`deployer's ETH balance before deployments: ${ethers.utils.formatEther(deployerETHBalance)}`)

  // Deploy core logic contracts
  const liquityCore = await mdh.deployLiquityCoreMainnet(configParams.externalAddrs.TELLOR_MASTER, deploymentState)
  await mdh.logContractObjects(liquityCore)

  // Deploy LQTY Contracts
  const LQTYContracts = await mdh.deployLQTYContractsMainnet(
    configParams.liquityAddrs.GENERAL_SAFE, // lp rewards address
    configParams.liquityAddrs.LQTY_SAFE, // multisig LQTY endowment address
    deploymentState,
  )

  // Connect all core contracts up
  await mdh.connectCoreContractsMainnet(
    liquityCore,
    LQTYContracts,
    configParams.externalAddrs.CHAINLINK_ETHUSD_PROXY,
    configParams.externalAddrs.CHAINLINK_CNYUSD_PROXY
  )
  await mdh.connectLQTYContractsMainnet(
    LQTYContracts,
    configParams.merkleRoot
  )
  await mdh.connectLQTYContractsToCoreMainnet(LQTYContracts, liquityCore)

  // Deploy a read-only multi-trove getter
  await mdh.deployMultiTroveGetterMainnet(liquityCore, deploymentState)

  const deploymentTime = await LQTYContracts.lockupContractFactory.deploymentTime()

  console.log(`deployment start time: ${deploymentTime}`)
  const fiftheenMonthFromDeployment = (Number(deploymentTime) + timeVals.SECONDS_IN_ONE_MONTH * 15).toString()
  console.log(`time fiftheenMonthFromDeployment: ${fiftheenMonthFromDeployment}`)
  const thirtyMonthFromDeployment = (Number(deploymentTime) + timeVals.SECONDS_IN_ONE_MONTH * 30).toString()
  console.log(`time thirtyMonthFromDeployment: ${thirtyMonthFromDeployment}`)

  const lockupContracts = {}
  
  //LP Rewards Lockup, 20m
  lockupContracts["LP_RESERVE"] = await mdh.deployLockupContract(
    LQTYContracts,
    "LP_RESERVE",
    configParams.liquityAddrs.GENERAL_SAFE,
    deploymentTime.toString(),
    (timeVals.SECONDS_IN_ONE_MONTH * 15).toString(),
    deploymentState
  )

  //Community Reserve Lockup, 10m
  lockupContracts["COMMUNITY_RESERVE"] = await mdh.deployLockupContract(
    LQTYContracts,
    "COMMUNITY_RESERVE",
    configParams.liquityAddrs.COMMUNITY_SAFE,
    deploymentTime.toString(),
    (timeVals.SECONDS_IN_ONE_MONTH * 15).toString(),
    deploymentState
  )

  //Team Reserve Lockup, 15m
  for (const [beneficary, beneficaryAddress] of Object.entries(configParams.beneficiaries)) {
    lockupContracts[beneficary] = await mdh.deployLockupContract(
      LQTYContracts,
      beneficary,
      beneficaryAddress,
      deploymentTime.toString(),
      (timeVals.SECONDS_IN_ONE_MONTH * 30).toString(),
      deploymentState
    )
  }


  // --- TESTS AND CHECKS  ---
  // Check price feed and oracles ---

  console.log("ORACLE CHECKS")

  const chainlinkEthProxy = new ethers.Contract(
    configParams.externalAddrs.CHAINLINK_ETHUSD_PROXY,
    ChainlinkAggregatorV3Interface,
    deployerWallet
  )

  const chainlinkEthPrice = await chainlinkEthProxy.latestAnswer()
  console.log(`Chainlink ETH price: ${ethers.utils.formatUnits(chainlinkEthPrice, 8)}`)

  const chainlinkCnyProxy = new ethers.Contract(
    configParams.externalAddrs.CHAINLINK_CNYUSD_PROXY,
    ChainlinkAggregatorV3Interface,
    deployerWallet
  )

  const chainlinkCnyPrice = await chainlinkCnyProxy.latestAnswer()
  console.log(`Chainlink CNY price: ${ethers.utils.formatUnits(chainlinkCnyPrice, 8)}`)
  
  const chainlinkEthCnyPrice = chainlinkEthPrice.mul(dec(1,8)).div(chainlinkCnyPrice)
  console.log(`Chainlink ETH/CNY price: ${ethers.utils.formatUnits(chainlinkEthCnyPrice, 8)}`)

  const ethQueryId = await liquityCore.priceFeed.ETHUSD_TELLOR_REQ_ID();
  const cnyQueryId = await liquityCore.priceFeed.CNYUSD_TELLOR_REQ_ID();
  console.log("Tellor ETH/USD requestId =", ethQueryId.toString());
  console.log("Tellor CNY/USD requestId =", cnyQueryId.toString());

  const {value: tellorEthPrice} = await liquityCore.tellorCaller.getTellorCurrentValue(ethQueryId);
  console.log(`Tellor ETH price: ${ethers.utils.formatUnits(tellorEthPrice, 18)}`)
  const {value: tellorCnyPrice} = await liquityCore.tellorCaller.getTellorCurrentValue(cnyQueryId);
  console.log(`Tellor CNY price: ${ethers.utils.formatUnits(tellorCnyPrice, 18)}`)
  const tellorEthCnyPrice = tellorEthPrice.mul(dec(1,18)).div(tellorCnyPrice)
  console.log(`Tellor ETH/CNY price: ${ethers.utils.formatUnits(tellorEthCnyPrice, 18)}`)

  // --- Lockup Contracts ---
  console.log("LOCKUP CONTRACT CHECKS")
  // Check lockup contracts exist for each beneficiary with correct unlock time
  {
    const lockupContract = lockupContracts["COMMUNITY_RESERVE"]
    // Check contract has stored correct beneficary
    const onChainBeneficiary = await lockupContract.beneficiary()
    assert.equal(configParams.liquityAddrs.COMMUNITY_SAFE.toLowerCase(), onChainBeneficiary.toLowerCase())
    // Check correct unlock time
    const unlockTime = await lockupContract.end()
    assert.equal(fiftheenMonthFromDeployment, unlockTime.toString())

    console.log(
      `lockupContract addr: ${lockupContract.address},
            beneficiary: "COMMUNITY_RESERVE",
            beneficiary addr: ${configParams.liquityAddrs.COMMUNITY_SAFE},
            on-chain beneficiary addr: ${onChainBeneficiary},
            unlockTime: ${unlockTime}
            `
    )
  }

  {
    const lockupContract = lockupContracts["LP_RESERVE"]
    // Check contract has stored correct beneficary
    const onChainBeneficiary = await lockupContract.beneficiary()
    assert.equal(configParams.liquityAddrs.GENERAL_SAFE.toLowerCase(), onChainBeneficiary.toLowerCase())
    // Check correct unlock time
    const unlockTime = await lockupContract.end()
    assert.equal(fiftheenMonthFromDeployment, unlockTime.toString())

    console.log(
      `lockupContract addr: ${lockupContract.address},
            beneficiary: "COMMUNITY_RESERVE",
            beneficiary addr: ${configParams.liquityAddrs.GENERAL_SAFE},
            on-chain beneficiary addr: ${onChainBeneficiary},
            unlockTime: ${unlockTime}
            `
    )
  }

  //Team Reserve Lockup
  for (const [beneficary, beneficaryAddress] of Object.entries(configParams.beneficiaries)) {
    const lockupContract = lockupContracts[beneficary]
    // Check contract has stored correct beneficary
    const onChainBeneficiary = await lockupContract.beneficiary()
    assert.equal(beneficaryAddress.toLowerCase(), onChainBeneficiary.toLowerCase())
    // Check correct unlock time
    const unlockTime = await lockupContract.end()
    assert.equal(thirtyMonthFromDeployment, unlockTime.toString())

    console.log(
      `lockupContract addr: ${lockupContract.address},
            beneficiary: ${beneficary},
            beneficiary addr: ${beneficaryAddress},
            on-chain beneficiary addr: ${onChainBeneficiary},
            unlockTime: ${unlockTime}
            `
    )
  }

  // // --- Check correct addresses set in LQTYToken
  // console.log("STORED ADDRESSES IN LQTY TOKEN")
  // const storedMultisigAddress = await LQTYContracts.lqtyToken.multisigAddress()
  // assert.equal(configParams.liquityAddrs.LQTY_SAFE.toLowerCase(), storedMultisigAddress.toLowerCase())
  // console.log(`multi-sig address stored in LQTYToken : ${th.squeezeAddr(storedMultisigAddress)}`)
  // console.log(`LQTY Safe address: ${th.squeezeAddr(configParams.liquityAddrs.LQTY_SAFE)}`)

  // // --- LQTY allowances of different addresses ---
  // console.log("INITIAL LQTY BALANCES")
  // // Unipool
  // const unipoolLQTYBal = await LQTYContracts.lqtyToken.balanceOf(unipool.address)
  // // assert.equal(unipoolLQTYBal.toString(), '1333333333333333333333333')
  // th.logBN('Unipool LQTY balance       ', unipoolLQTYBal)

  // // LQTY Safe
  // const lqtySafeBal = await LQTYContracts.lqtyToken.balanceOf(configParams.liquityAddrs.LQTY_SAFE)
  // assert.equal(lqtySafeBal.toString(), '64666666666666666666666667')
  // th.logBN('LQTY Safe balance     ', lqtySafeBal)

  // // Bounties/hackathons (General Safe)
  // const generalSafeBal = await LQTYContracts.lqtyToken.balanceOf(configParams.liquityAddrs.GENERAL_SAFE)
  // assert.equal(generalSafeBal.toString(), '2000000000000000000000000')
  // th.logBN('General Safe balance       ', generalSafeBal)

  // // CommunityIssuance contract
  // const communityIssuanceBal = await LQTYContracts.lqtyToken.balanceOf(LQTYContracts.communityIssuance.address)
  // // assert.equal(communityIssuanceBal.toString(), '32000000000000000000000000')
  // th.logBN('Community Issuance balance', communityIssuanceBal)

  // // --- PriceFeed ---
  // console.log("PRICEFEED CHECKS")
  // // Check Pricefeed's status and last good price
  // const lastGoodPrice = await liquityCore.priceFeed.lastGoodPrice()
  // const priceFeedInitialStatus = await liquityCore.priceFeed.status()
  // th.logBN('PriceFeed first stored price', lastGoodPrice)
  // console.log(`PriceFeed initial status: ${priceFeedInitialStatus}`)

  // // Check PriceFeed's & TellorCaller's stored addresses
  // const priceFeedCLAddress = await liquityCore.priceFeed.priceAggregator()
  // const priceFeedTellorCallerAddress = await liquityCore.priceFeed.tellorCaller()
  // assert.equal(priceFeedCLAddress, configParams.externalAddrs.CHAINLINK_ETHUSD_PROXY)
  // assert.equal(priceFeedTellorCallerAddress, liquityCore.tellorCaller.address)

  // // Check Tellor address
  // const tellorCallerTellorMasterAddress = await liquityCore.tellorCaller.tellor()
  // assert.equal(tellorCallerTellorMasterAddress, configParams.externalAddrs.TELLOR_MASTER)

  // // --- Unipool ---

  // // Check Unipool's LUSD-ETH Uniswap Pair address
  // const unipoolUniswapPairAddr = await unipool.uniToken()
  // console.log(`Unipool's stored LUSD-ETH Uniswap Pair address: ${unipoolUniswapPairAddr}`)

  // console.log("SYSTEM GLOBAL VARS CHECKS")
  // // --- Sorted Troves ---

  // // Check max size
  // const sortedTrovesMaxSize = (await liquityCore.sortedTroves.data())[2]
  // assert.equal(sortedTrovesMaxSize, '115792089237316195423570985008687907853269984665640564039457584007913129639935')

  // // --- TroveManager ---

  // const liqReserve = await liquityCore.troveManager.LUSD_GAS_COMPENSATION()
  // const minNetDebt = await liquityCore.troveManager.MIN_NET_DEBT()

  // th.logBN('system liquidation reserve', liqReserve)
  // th.logBN('system min net debt      ', minNetDebt)

  // // --- Make first LUSD-ETH liquidity provision ---

  // // Open trove if not yet opened
  // const troveStatus = await liquityCore.troveManager.getTroveStatus(deployerWallet.address)
  // if (troveStatus.toString() != '1') {
  //   let _3kLUSDWithdrawal = th.dec(3000, 18) // 3000 LUSD
  //   let _3ETHcoll = th.dec(3, 'ether') // 3 ETH
  //   console.log('Opening trove...')
  //   await mdh.sendAndWaitForTransaction(
  //     liquityCore.borrowerOperations.openTrove(
  //       th._100pct,
  //       _3kLUSDWithdrawal,
  //       th.ZERO_ADDRESS,
  //       th.ZERO_ADDRESS,
  //       { value: _3ETHcoll, gasPrice }
  //     )
  //   )
  // } else {
  //   console.log('Deployer already has an active trove')
  // }

  // // Check deployer now has an open trove
  // console.log(`deployer is in sorted list after making trove: ${await liquityCore.sortedTroves.contains(deployerWallet.address)}`)

  // const deployerTrove = await liquityCore.troveManager.Troves(deployerWallet.address)
  // th.logBN('deployer debt', deployerTrove[0])
  // th.logBN('deployer coll', deployerTrove[1])
  // th.logBN('deployer stake', deployerTrove[2])
  // console.log(`deployer's trove status: ${deployerTrove[3]}`)

  // // Check deployer has LUSD
  // let deployerLUSDBal = await liquityCore.lusdToken.balanceOf(deployerWallet.address)
  // th.logBN("deployer's LUSD balance", deployerLUSDBal)

  // // Check Uniswap pool has LUSD and WETH tokens
  // const LUSDETHPair = await new ethers.Contract(
  //   LUSDWETHPairAddr,
  //   UniswapV2Pair.abi,
  //   deployerWallet
  // )

  // const token0Addr = await LUSDETHPair.token0()
  // const token1Addr = await LUSDETHPair.token1()
  // console.log(`LUSD-ETH Pair token 0: ${th.squeezeAddr(token0Addr)},
  //       LUSDToken contract addr: ${th.squeezeAddr(liquityCore.lusdToken.address)}`)
  // console.log(`LUSD-ETH Pair token 1: ${th.squeezeAddr(token1Addr)},
  //       WETH ERC20 contract addr: ${th.squeezeAddr(configParams.externalAddrs.WETH_ERC20)}`)

  // // Check initial LUSD-ETH pair reserves before provision
  // let reserves = await LUSDETHPair.getReserves()
  // th.logBN("LUSD-ETH Pair's LUSD reserves before provision", reserves[0])
  // th.logBN("LUSD-ETH Pair's ETH reserves before provision", reserves[1])

  // // Get the UniswapV2Router contract
  // const uniswapV2Router02 = new ethers.Contract(
  //   configParams.externalAddrs.UNISWAP_V2_ROUTER02,
  //   UniswapV2Router02.abi,
  //   deployerWallet
  // )

  // // --- Provide liquidity to LUSD-ETH pair if not yet done so ---
  // let deployerLPTokenBal = await LUSDETHPair.balanceOf(deployerWallet.address)
  // if (deployerLPTokenBal.toString() == '0') {
  //   console.log('Providing liquidity to Uniswap...')
  //   // Give router an allowance for LUSD
  //   await liquityCore.lusdToken.increaseAllowance(uniswapV2Router02.address, dec(10000, 18))

  //   // Check Router's spending allowance
  //   const routerLUSDAllowanceFromDeployer = await liquityCore.lusdToken.allowance(deployerWallet.address, uniswapV2Router02.address)
  //   th.logBN("router's spending allowance for deployer's LUSD", routerLUSDAllowanceFromDeployer)

  //   // Get amounts for liquidity provision
  //   const LP_ETH = dec(1, 'ether')

  //   // Convert 8-digit CL price to 18 and multiply by ETH amount
  //   const LUSDAmount = toBigNum(chainlinkPrice)
  //     .mul(toBigNum(dec(1, 10)))
  //     .mul(toBigNum(LP_ETH))
  //     .div(toBigNum(dec(1, 18)))

  //   const minLUSDAmount = LUSDAmount.sub(toBigNum(dec(100, 18)))

  //   latestBlock = await ethers.provider.getBlockNumber()
  //   now = (await ethers.provider.getBlock(latestBlock)).timestamp
  //   let tenMinsFromNow = now + (60 * 60 * 10)

  //   // Provide liquidity to LUSD-ETH pair
  //   await mdh.sendAndWaitForTransaction(
  //     uniswapV2Router02.addLiquidityETH(
  //       liquityCore.lusdToken.address, // address of LUSD token
  //       LUSDAmount, // LUSD provision
  //       minLUSDAmount, // minimum LUSD provision
  //       LP_ETH, // minimum ETH provision
  //       deployerWallet.address, // address to send LP tokens to
  //       tenMinsFromNow, // deadline for this tx
  //       {
  //         value: dec(1, 'ether'),
  //         gasPrice,
  //         gasLimit: 5000000 // For some reason, ethers can't estimate gas for this tx
  //       }
  //     )
  //   )
  // } else {
  //   console.log('Liquidity already provided to Uniswap')
  // }
  // // Check LUSD-ETH reserves after liquidity provision:
  // reserves = await LUSDETHPair.getReserves()
  // th.logBN("LUSD-ETH Pair's LUSD reserves after provision", reserves[0])
  // th.logBN("LUSD-ETH Pair's ETH reserves after provision", reserves[1])



  // // ---  Check LP staking  ---
  // console.log("CHECK LP STAKING EARNS LQTY")

  // // Check deployer's LP tokens
  // deployerLPTokenBal = await LUSDETHPair.balanceOf(deployerWallet.address)
  // th.logBN("deployer's LP token balance", deployerLPTokenBal)

  // // Stake LP tokens in Unipool
  // console.log(`LUSDETHPair addr: ${LUSDETHPair.address}`)
  // console.log(`Pair addr stored in Unipool: ${await unipool.uniToken()}`)

  // earnedLQTY = await unipool.earned(deployerWallet.address)
  // th.logBN("deployer's farmed LQTY before staking LP tokens", earnedLQTY)

  // const deployerUnipoolStake = await unipool.balanceOf(deployerWallet.address)
  // if (deployerUnipoolStake.toString() == '0') {
  //   console.log('Staking to Unipool...')
  //   // Deployer approves Unipool
  //   await mdh.sendAndWaitForTransaction(
  //     LUSDETHPair.approve(unipool.address, deployerLPTokenBal, { gasPrice })
  //   )

  //   await mdh.sendAndWaitForTransaction(unipool.stake(1, { gasPrice }))
  // } else {
  //   console.log('Already staked in Unipool')
  // }

  // console.log("wait 90 seconds before checking earnings... ")
  // await configParams.waitFunction()

  // earnedLQTY = await unipool.earned(deployerWallet.address)
  // th.logBN("deployer's farmed LQTY from Unipool after waiting ~1.5mins", earnedLQTY)

  // let deployerLQTYBal = await LQTYContracts.lqtyToken.balanceOf(deployerWallet.address)
  // th.logBN("deployer LQTY Balance Before SP deposit", deployerLQTYBal)



  // // --- Make SP deposit and earn LQTY ---
  // console.log("CHECK DEPLOYER MAKING DEPOSIT AND EARNING LQTY")

  // let SPDeposit = await liquityCore.stabilityPool.getCompoundedLUSDDeposit(deployerWallet.address)
  // th.logBN("deployer SP deposit before making deposit", SPDeposit)

  // // Provide to SP
  // await mdh.sendAndWaitForTransaction(liquityCore.stabilityPool.provideToSP(dec(15, 18), th.ZERO_ADDRESS, { gasPrice, gasLimit: 400000 }))

  // // Get SP deposit 
  // SPDeposit = await liquityCore.stabilityPool.getCompoundedLUSDDeposit(deployerWallet.address)
  // th.logBN("deployer SP deposit after depositing 15 LUSD", SPDeposit)

  // console.log("wait 90 seconds before withdrawing...")
  // // wait 90 seconds
  // await configParams.waitFunction()

  // // Withdraw from SP
  // // await mdh.sendAndWaitForTransaction(liquityCore.stabilityPool.withdrawFromSP(dec(1000, 18), { gasPrice, gasLimit: 400000 }))

  // // SPDeposit = await liquityCore.stabilityPool.getCompoundedLUSDDeposit(deployerWallet.address)
  // // th.logBN("deployer SP deposit after full withdrawal", SPDeposit)

  // // deployerLQTYBal = await LQTYContracts.lqtyToken.balanceOf(deployerWallet.address)
  // // th.logBN("deployer LQTY Balance after SP deposit withdrawal", deployerLQTYBal)



  // // ---  Attempt withdrawal from LC  ---
  // console.log("CHECK BENEFICIARY ATTEMPTING WITHDRAWAL FROM LC")

  // // connect Acct2 wallet to the LC they are beneficiary of
  // let account2LockupContract = await lockupContracts["ACCOUNT_2"].connect(account2Wallet)

  // // Deployer funds LC with 10 LQTY
  // // await mdh.sendAndWaitForTransaction(LQTYContracts.lqtyToken.transfer(account2LockupContract.address, dec(10, 18), { gasPrice }))

  // // account2 LQTY bal
  // let account2bal = await LQTYContracts.lqtyToken.balanceOf(account2Wallet.address)
  // th.logBN("account2 LQTY bal before withdrawal attempt", account2bal)

  // // Check LC LQTY bal 
  // let account2LockupContractBal = await LQTYContracts.lqtyToken.balanceOf(account2LockupContract.address)
  // th.logBN("account2's LC LQTY bal before withdrawal attempt", account2LockupContractBal)

  // // Acct2 attempts withdrawal from  LC
  // await mdh.sendAndWaitForTransaction(account2LockupContract.withdrawLQTY({ gasPrice, gasLimit: 1000000 }))

  // // Acct LQTY bal
  // account2bal = await LQTYContracts.lqtyToken.balanceOf(account2Wallet.address)
  // th.logBN("account2's LQTY bal after LC withdrawal attempt", account2bal)

  // // Check LC bal 
  // account2LockupContractBal = await LQTYContracts.lqtyToken.balanceOf(account2LockupContract.address)
  // th.logBN("account2's LC LQTY bal LC withdrawal attempt", account2LockupContractBal)

  // // --- Stake LQTY ---
  // console.log("CHECK DEPLOYER STAKING LQTY")

  // // Log deployer LQTY bal and stake before staking
  // deployerLQTYBal = await LQTYContracts.lqtyToken.balanceOf(deployerWallet.address)
  // th.logBN("deployer LQTY bal before staking", deployerLQTYBal)
  // let deployerLQTYStake = await LQTYContracts.lqtyStaking.stakes(deployerWallet.address)
  // th.logBN("deployer stake before staking", deployerLQTYStake)

  // // stake 13 LQTY
  // await mdh.sendAndWaitForTransaction(LQTYContracts.lqtyStaking.stake(dec(13, 18), { gasPrice, gasLimit: 1000000 }))

  // // Log deployer LQTY bal and stake after staking
  // deployerLQTYBal = await LQTYContracts.lqtyToken.balanceOf(deployerWallet.address)
  // th.logBN("deployer LQTY bal after staking", deployerLQTYBal)
  // deployerLQTYStake = await LQTYContracts.lqtyStaking.stakes(deployerWallet.address)
  // th.logBN("deployer stake after staking", deployerLQTYStake)

  // // Log deployer rev share immediately after staking
  // let deployerLUSDRevShare = await LQTYContracts.lqtyStaking.getPendingLUSDGain(deployerWallet.address)
  // th.logBN("deployer pending LUSD revenue share", deployerLUSDRevShare)



  // // --- 2nd Account opens trove ---
  // const trove2Status = await liquityCore.troveManager.getTroveStatus(account2Wallet.address)
  // if (trove2Status.toString() != '1') {
  //   console.log("Acct 2 opens a trove ...")
  //   let _2kLUSDWithdrawal = th.dec(2000, 18) // 2000 LUSD
  //   let _1pt5_ETHcoll = th.dec(15, 17) // 1.5 ETH
  //   const borrowerOpsEthersFactory = await ethers.getContractFactory("BorrowerOperations", account2Wallet)
  //   const borrowerOpsAcct2 = await new ethers.Contract(liquityCore.borrowerOperations.address, borrowerOpsEthersFactory.interface, account2Wallet)

  //   await mdh.sendAndWaitForTransaction(borrowerOpsAcct2.openTrove(th._100pct, _2kLUSDWithdrawal, th.ZERO_ADDRESS, th.ZERO_ADDRESS, { value: _1pt5_ETHcoll, gasPrice, gasLimit: 1000000 }))
  // } else {
  //   console.log('Acct 2 already has an active trove')
  // }

  // const acct2Trove = await liquityCore.troveManager.Troves(account2Wallet.address)
  // th.logBN('acct2 debt', acct2Trove[0])
  // th.logBN('acct2 coll', acct2Trove[1])
  // th.logBN('acct2 stake', acct2Trove[2])
  // console.log(`acct2 trove status: ${acct2Trove[3]}`)

  // // Log deployer's pending LUSD gain - check fees went to staker (deloyer)
  // deployerLUSDRevShare = await LQTYContracts.lqtyStaking.getPendingLUSDGain(deployerWallet.address)
  // th.logBN("deployer pending LUSD revenue share from staking, after acct 2 opened trove", deployerLUSDRevShare)

  // //  --- deployer withdraws staking gains ---
  // console.log("CHECK DEPLOYER WITHDRAWING STAKING GAINS")

  // // check deployer's LUSD balance before withdrawing staking gains
  // deployerLUSDBal = await liquityCore.lusdToken.balanceOf(deployerWallet.address)
  // th.logBN('deployer LUSD bal before withdrawing staking gains', deployerLUSDBal)

  // // Deployer withdraws staking gains
  // await mdh.sendAndWaitForTransaction(LQTYContracts.lqtyStaking.unstake(0, { gasPrice, gasLimit: 1000000 }))

  // // check deployer's LUSD balance after withdrawing staking gains
  // deployerLUSDBal = await liquityCore.lusdToken.balanceOf(deployerWallet.address)
  // th.logBN('deployer LUSD bal after withdrawing staking gains', deployerLUSDBal)


  // // --- System stats  ---

  // Uniswap LUSD-ETH pool size
  // reserves = await LUSDETHPair.getReserves()
  // th.logBN("LUSD-ETH Pair's current LUSD reserves", reserves[0])
  // th.logBN("LUSD-ETH Pair's current ETH reserves", reserves[1])

  // Number of troves
  const numTroves = await liquityCore.troveManager.getTroveOwnersCount()
  console.log(`number of troves: ${numTroves} `)

  // Sorted list size
  const listSize = await liquityCore.sortedTroves.getSize()
  console.log(`Trove list size: ${listSize} `)

  // Total system debt and coll
  const entireSystemDebt = await liquityCore.troveManager.getEntireSystemDebt()
  const entireSystemColl = await liquityCore.troveManager.getEntireSystemColl()
  th.logBN("Entire system debt", entireSystemDebt)
  th.logBN("Entire system coll", entireSystemColl)
  
  // TCR
  const TCR = await liquityCore.troveManager.getTCR(tellorEthCnyPrice)
  console.log(`TCR: ${TCR}`)

  // current borrowing rate
  const baseRate = await liquityCore.troveManager.baseRate()
  const currentBorrowingRate = await liquityCore.troveManager.getBorrowingRateWithDecay()
  th.logBN("Base rate", baseRate)
  th.logBN("Current borrowing rate", currentBorrowingRate)

  // total SP deposits
  const totalSPDeposits = await liquityCore.stabilityPool.getTotalLUSDDeposits()
  th.logBN("Total LUSD SP deposits", totalSPDeposits)

  // total LQTY Staked in LQTYStaking
  const totalLQTYStaked = await LQTYContracts.lqtyStaking.totalLQTYStaked()
  th.logBN("Total LQTY staked", totalLQTYStaked)

  // total LP tokens staked in Unipool
  // const totalLPTokensStaked = await unipool.totalSupply()
  // th.logBN("Total LP (LUSD-ETH) tokens staked in unipool", totalLPTokensStaked)

  // --- State variables ---

  // TroveManager 
  console.log("TroveManager state variables:")
  const totalStakes = await liquityCore.troveManager.totalStakes()
  const totalStakesSnapshot = await liquityCore.troveManager.totalStakesSnapshot()
  const totalCollateralSnapshot = await liquityCore.troveManager.totalCollateralSnapshot()
  th.logBN("Total trove stakes", totalStakes)
  th.logBN("Snapshot of total trove stakes before last liq. ", totalStakesSnapshot)
  th.logBN("Snapshot of total trove collateral before last liq. ", totalCollateralSnapshot)

  const L_ETH = await liquityCore.troveManager.L_ETH()
  const L_LUSDDebt = await liquityCore.troveManager.L_LUSDDebt()
  th.logBN("L_ETH", L_ETH)
  th.logBN("L_LUSDDebt", L_LUSDDebt)

  // StabilityPool
  console.log("StabilityPool state variables:")
  const P = await liquityCore.stabilityPool.P()
  const currentScale = await liquityCore.stabilityPool.currentScale()
  const currentEpoch = await liquityCore.stabilityPool.currentEpoch()
  const S = await liquityCore.stabilityPool.epochToScaleToSum(currentEpoch, currentScale)
  const G = await liquityCore.stabilityPool.epochToScaleToG(currentEpoch, currentScale)
  th.logBN("Product P", P)
  th.logBN("Current epoch", currentEpoch)
  th.logBN("Current scale", currentScale)
  th.logBN("Sum S, at current epoch and scale", S)
  th.logBN("Sum G, at current epoch and scale", G)

  // LQTYStaking
  console.log("LQTYStaking state variables:")
  const F_LUSD = await LQTYContracts.lqtyStaking.F_LUSD()
  const F_ETH = await LQTYContracts.lqtyStaking.F_ETH()
  th.logBN("F_LUSD", F_LUSD)
  th.logBN("F_ETH", F_ETH)


  // CommunityIssuance
  console.log("CommunityIssuance state variables:")
  const totalLQTYIssued = await LQTYContracts.communityIssuance.totalLQTYIssued()
  th.logBN("Total LQTY issued to depositors / front ends", totalLQTYIssued)

  deployerETHBalance = await ethers.provider.getBalance(deployerWallet.address)
  console.log(`deployer's ETH balance after deployments: ${ethers.utils.formatEther(deployerETHBalance)}`)

}

module.exports = {
  mainnetDeploy
}
