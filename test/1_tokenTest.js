const { ethers } = require("ethers");
const basedSigmaTokenBuild = require("../build/contracts/BasedSigmaToken.json");
const basedSigmaStakingBuild = require("../build/contracts/BasedSigmaStaking.json");
const IUniswapV2Router02Build = require("../build/contracts/IUniswapV2Router02.json");
const IUniswapV2FactoryBuild = require("../build/contracts/IUniswapV2Factory.json");

async function main() {
	const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
	const ownerWallet = new ethers.Wallet(
		"0x6d1d56f82b2b0696a964be35410ce01ed4863f5677f00e1f4154d20b5f705a1e",
		provider
	);

	const user1Wallet = new ethers.Wallet(
		"0x1b0129f2a71f94c9f24692e038b3b10d015c2cbe1da9f2e631e32367d9289541",
		provider
	);
	const UniswapV2Router02 = new ethers.Contract(
		"0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24",
		IUniswapV2Router02Build.abi,
		ownerWallet
	);
	const UniswapV2Factory = new ethers.Contract(
		"0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6",
		IUniswapV2FactoryBuild.abi,
		ownerWallet
	);

	const tokenContractFactory = new ethers.ContractFactory(
		basedSigmaTokenBuild.abi,
		basedSigmaTokenBuild.bytecode,
		ownerWallet
	);

	const basedSigmaTokenContract = await tokenContractFactory.deploy();
	await basedSigmaTokenContract.deploymentTransaction().wait();
	const basedSigmaTokenAddress = await basedSigmaTokenContract.getAddress();
	console.log("basedSigmaTokenAddress: ", basedSigmaTokenAddress);
	const WETHAddress = await UniswapV2Router02.WETH();
	// 5000000 addind 5 million token and 2 ETH to liquidity

	await (
		await basedSigmaTokenContract.approve(
			await UniswapV2Router02.getAddress(),
			ethers.parseEther("5000000")
		)
	).wait();

	const addLiquidityTxRes = await (
		await UniswapV2Router02.addLiquidityETH(
			basedSigmaTokenAddress,
			ethers.parseEther("5000000"),
			0,
			0,
			ownerWallet.address,
			new Date().getTime() + 10000,
			{ value: ethers.parseEther("2") }
		)
	).wait();
	console.log("addLiquidity tx status:", addLiquidityTxRes.status);

	await (await basedSigmaTokenContract.openTrading()).wait();

	console.log(
		"//////////////////////////////// BUY TEST /////////////////////////////"
	);
	console.log(
		"user balance before swap: ",
		await basedSigmaTokenContract.balanceOf(user1Wallet.address)
	);
	console.log(
		"token balance before swap: ",
		await basedSigmaTokenContract.balanceOf(basedSigmaTokenAddress)
	);

	await (
		await UniswapV2Router02.connect(
			user1Wallet
		).swapExactETHForTokensSupportingFeeOnTransferTokens(
			0,
			[WETHAddress, basedSigmaTokenAddress],
			user1Wallet.address,
			new Date().getTime() + 10000,
			{ value: ethers.parseEther("0.5") }
		)
	).wait();

	console.log(
		"user balance after swap: ",
		await basedSigmaTokenContract.balanceOf(user1Wallet.address)
	);
	console.log(
		"token balance after swap: ",
		await basedSigmaTokenContract.balanceOf(basedSigmaTokenAddress)
	);
	console.log(
		"//////////////////////////////// STAKING DEPLOYMENT /////////////////////////////"
	);

	const stakingContractFactory = new ethers.ContractFactory(
		basedSigmaStakingBuild.abi,
		basedSigmaStakingBuild.bytecode,
		ownerWallet
	);

	const basedSigmaStakingContract = await stakingContractFactory.deploy(
		basedSigmaTokenAddress
	);
	await basedSigmaStakingContract.deploymentTransaction().wait();
	const basedSigmaStakingAddress =
		await basedSigmaStakingContract.getAddress();

	console.log("staking contract address", basedSigmaStakingAddress);
	console.log("updating staking contract");

	await (
		await basedSigmaTokenContract.updateStakingContracts(
			[basedSigmaStakingAddress],
			[100]
		)
	).wait();

	await (
		await basedSigmaTokenContract.transfer(
			basedSigmaStakingAddress,
			ethers.parseEther("1000")
		)
	).wait();

	// console.log(
	// 	"//////////////////////////////// DISTRIBUTION TEST /////////////////////////////"
	// );
	// console.log(
	// 	"owner eth balance before distribution",
	// 	await provider.getBalance(ownerWallet.address)
	// );
	// console.log(
	// 	"staking token balance before distribution",
	// 	await basedSigmaTokenContract.balanceOf(basedSigmaStakingAddress)
	// );

	// await (await basedSigmaTokenContract.distributeTax()).wait();

	// console.log(
	// 	"owner eth balance after distribution",
	// 	await provider.getBalance(ownerWallet.address)
	// );
	// console.log(
	// 	"staking token balance after distribution",
	// 	await basedSigmaTokenContract.balanceOf(basedSigmaStakingAddress)
	// );

	// console.log(
	// 	"//////////////////////////////// SELL TEST /////////////////////////////"
	// );
	// console.log(
	// 	await basedSigmaTokenContract.balanceOf(basedSigmaTokenAddress)
	// );
	// console.log(await basedSigmaTokenContract.taxDistributionThreshold());

	// console.log(
	// 	"user balance before swap: ",
	// 	await basedSigmaTokenContract.balanceOf(user1Wallet.address)
	// );
	// console.log(
	// 	"token balance before swap: ",
	// 	await basedSigmaTokenContract.balanceOf(basedSigmaTokenAddress)
	// );

	// await (
	// 	await basedSigmaTokenContract
	// 		.connect(user1Wallet)
	// 		.approve(
	// 			await UniswapV2Router02.getAddress(),
	// 			await basedSigmaTokenContract.balanceOf(user1Wallet.address)
	// 		)
	// ).wait();

	// await (
	// 	await UniswapV2Router02.connect(
	// 		user1Wallet
	// 	).swapExactTokensForETHSupportingFeeOnTransferTokens(
	// 		await basedSigmaTokenContract.balanceOf(user1Wallet.address),
	// 		0,
	// 		[basedSigmaTokenAddress, WETHAddress],
	// 		user1Wallet.address,
	// 		new Date().getTime() + 10000
	// 	)
	// ).wait();

	// console.log(
	// 	"user balance after swap: ",
	// 	await basedSigmaTokenContract.balanceOf(user1Wallet.address)
	// );
	// console.log(
	// 	"token balance after swap: ",
	// 	await basedSigmaTokenContract.balanceOf(basedSigmaTokenAddress)
	// );
	// console.log(
	// 	await basedSigmaTokenContract.balanceOf(basedSigmaTokenAddress)
	// );
	// console.log(await basedSigmaTokenContract.taxDistributionThreshold());

	console.log(
		"//////////////////////////////// STAKING TOKEN TEST /////////////////////////////"
	);

	console.log(
		await basedSigmaTokenContract.balanceOf(basedSigmaTokenAddress)
	);
	console.log(await basedSigmaTokenContract.taxDistributionThreshold());

	await (
		await basedSigmaTokenContract
			.connect(user1Wallet)
			.approve(
				basedSigmaStakingAddress,
				await basedSigmaTokenContract.balanceOf(user1Wallet.address)
			)
	).wait();

	await (
		await basedSigmaStakingContract
			.connect(user1Wallet)
			.stakeTokens(
				await basedSigmaTokenContract.balanceOf(user1Wallet.address)
			)
	).wait();

	console.log(
		"user staking value after stake: ",
		await basedSigmaStakingContract.getStakedValue(user1Wallet.address)
	);
	console.log(
		"user balance after stake: ",
		await basedSigmaTokenContract.balanceOf(user1Wallet.address)
	);

	await (await basedSigmaTokenContract.distributeTax()).wait();

	console.log(
		"user staking value after distribution: ",
		await basedSigmaStakingContract.getStakedValue(user1Wallet.address)
	);

	await (
		await basedSigmaStakingContract.connect(user1Wallet).unstakeAll()
	).wait();
	console.log(
		"user balance after unstake: ",
		await basedSigmaTokenContract.balanceOf(user1Wallet.address)
	);
}

main();
