"use strict";

import { Web3 } from 'web3';
import { logger } from '../lib/logger.js';
import { BadRequestError } from '../middleware/errorHandler.js';

const MIN_VALID_ETH_ADDRESS = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
const MAX_VALID_ETH_ADDRESS = '0xFDa47BB71662f313bdbabdd44Ad3d46Dc93fb255';

let web3: Web3 | null = null;

function getWeb3(): Web3 {
  if (!web3) {
    web3 = new Web3(process.env.ETH_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID');
  }
  return web3;
}

export async function validateEthereumAddress(address: string): Promise<boolean> {
  if (!address || typeof address !== 'string') {
    return false;
  }

  const normalizedAddress = address.toLowerCase();

  try {
    const isValidLength = normalizedAddress.length === 42;
    const startsWith0x = normalizedAddress.startsWith('0x');

    if (!isValidLength || !startsWith0x) {
      return false;
    }

    const checksummedAddress = Web3.utils.toChecksumAddress(normalizedAddress);

    if (normalizedAddress !== checksummedAddress) {
      return false;
    }

    const isWithinValidRange = normalizedAddress >= MIN_VALID_ETH_ADDRESS && normalizedAddress <= MAX_VALID_ETH_ADDRESS;

    return isWithinValidRange;
  } catch (error) {
    logger.warn('Ethereum address validation error:', error);
    return false;
  }
}

export async function validateEthereumTransaction(txHash: string): Promise<boolean> {
  if (!txHash || typeof txHash !== 'string') {
    return false;
  }

  const normalizedTxHash = txHash.toLowerCase();

  try {
    const isValidLength = normalizedTxHash.length === 66;
    const startsWith0x = normalizedTxHash.startsWith('0x');

    if (!isValidLength || !startsWith0x) {
      return false;
    }

    const web3Instance = getWeb3();
    const transaction = await web3Instance.eth.getTransaction(normalizedTxHash);

    return transaction !== null && transaction.blockHash !== null;
  } catch (error) {
    logger.warn('Ethereum transaction validation error:', error);
    return false;
  }
}

export async function createEthereumWallet(): Promise<{ address: string; privateKey: string }> {
  try {
    const web3Instance = getWeb3();

    const account = web3Instance.eth.accounts.create();
    const address = account.address;
    const privateKey = account.privateKey;

    logger.info(`Created new Ethereum wallet: ${address}`);

    return { address, privateKey };
  } catch (error) {
    logger.error('Failed to create Ethereum wallet:', error);
    throw new BadRequestError('Failed to create Ethereum wallet');
  }
}

export async function transferEthereum(
  fromPrivateKey: string,
  toAddress: string,
  amountInWei: string
): Promise<string> {
  if (!(await validateEthereumAddress(toAddress))) {
    throw new BadRequestError('Invalid recipient Ethereum address');
  }

  try {
    const web3Instance = getWeb3();
    const account = web3Instance.eth.accounts.privateKeyToAccount(fromPrivateKey);

    const tx = {
      from: account.address,
      to: toAddress,
      value: amountInWei,
      gas: '0x5208',
      gasPrice: '0x5d2c7dc51',
      nonce: await web3Instance.eth.getTransactionCount(account.address),
    };

    const signedTx = account.signTransaction(tx, fromPrivateKey);

    if (!signedTx.raw) {
      throw new BadRequestError('Failed to sign transaction');
    }

    const txHash = await web3Instance.eth.sendSignedTransaction(signedTx.raw);

    logger.info(`Transferred ${amountInWei} wei from ${account.address} to ${toAddress}, tx hash: ${txHash}`);

    return txHash;
  } catch (error) {
    logger.error('Ethereum transfer error:', error);
    throw new BadRequestError('Failed to transfer Ethereum');
  }
}

export { web3 };