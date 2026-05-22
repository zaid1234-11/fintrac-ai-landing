import CryptoJS from 'crypto-js';

export interface Block {
  index: number;
  timestamp: number;
  data: any;
  previousHash: string;
  hash: string;
  nonce: number;
}

export class TransactionBlockchain {
  private chain: Block[];
  private difficulty: number = 2;
  private readonly storageKey = 'fintrack_blockchain';

  constructor() {
    // Load from localStorage or create genesis block
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      this.chain = JSON.parse(stored);
    } else {
      this.chain = [this.createGenesisBlock()];
      this.saveChain();
    }
  }

  private createGenesisBlock(): Block {
    return {
      index: 0,
      timestamp: Date.now(),
      data: { message: 'Genesis Block - FinTrack AI' },
      previousHash: '0',
      hash: this.calculateHash(0, Date.now(), { message: 'Genesis Block' }, '0', 0),
      nonce: 0,
    };
  }

  private calculateHash(
    index: number,
    timestamp: number,
    data: any,
    previousHash: string,
    nonce: number
  ): string {
    return CryptoJS.SHA256(
      index + timestamp + JSON.stringify(data) + previousHash + nonce
    ).toString();
  }

  private mineBlock(block: Block): Block {
    while (block.hash.substring(0, this.difficulty) !== Array(this.difficulty + 1).join('0')) {
      block.nonce++;
      block.hash = this.calculateHash(
        block.index,
        block.timestamp,
        block.data,
        block.previousHash,
        block.nonce
      );
    }
    return block;
  }

  addTransaction(transaction: any): Block {
    const lastBlock = this.chain[this.chain.length - 1];
    const newBlock: Block = {
      index: lastBlock.index + 1,
      timestamp: Date.now(),
      data: transaction,
      previousHash: lastBlock.hash,
      hash: '',
      nonce: 0,
    };

    newBlock.hash = this.calculateHash(
      newBlock.index,
      newBlock.timestamp,
      newBlock.data,
      newBlock.previousHash,
      newBlock.nonce
    );

    const minedBlock = this.mineBlock(newBlock);
    this.chain.push(minedBlock);
    this.saveChain();
    
    return minedBlock;
  }

  isValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Verify current block hash
      const recalculatedHash = this.calculateHash(
        currentBlock.index,
        currentBlock.timestamp,
        currentBlock.data,
        currentBlock.previousHash,
        currentBlock.nonce
      );

      if (currentBlock.hash !== recalculatedHash) {
        return false;
      }

      // Verify chain linkage
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }

  getChain(): Block[] {
    return this.chain;
  }

  getAllTransactions(): any[] {
    return this.chain.slice(1).map(block => block.data);
  }

  private saveChain(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.chain));
  }

  exportChain(): string {
    return JSON.stringify(this.chain, null, 2);
  }
}
